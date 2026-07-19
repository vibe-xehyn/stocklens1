import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

// ensure data directory
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const ACCOUNTS_FILE = join(DATA_DIR, 'mock_accounts.json');
const PORTFOLIOS_FILE = join(DATA_DIR, 'mock_portfolios.json');
const ORDERS_FILE = join(DATA_DIR, 'mock_orders.json');
const HISTORY_FILE = join(DATA_DIR, 'mock_history.json');
const DIVIDENDS_FILE = join(DATA_DIR, 'mock_dividends.json');
const SCREENER_CACHE = join(__dirname, '.screener-cache.json');

// ── File Queue (race-condition safe on low-memory) ────────────────────────
const queues = new Map();
function enqueue(fp, op) {
  if (!queues.has(fp)) queues.set(fp, Promise.resolve());
  const p = queues.get(fp).then(() => op()).catch(e => { console.error(`[QUEUE] ${fp}:`, e); throw e; });
  queues.set(fp, p.catch(() => {}));
  return p;
}

async function readJSON(fp, def = {}) {
  return enqueue(fp, async () => {
    if (!existsSync(fp)) { writeFileSync(fp, JSON.stringify(def, null, 2)); return def; }
    try { return JSON.parse(readFileSync(fp, 'utf-8')); } catch { return def; }
  });
}

async function writeJSON(fp, data) {
  return enqueue(fp, async () => { writeFileSync(fp, JSON.stringify(data, null, 2)); });
}

// ── Auth ─────────────────────────────────────────────────────────────────
function getCookie(req, name) {
  const h = req.headers.cookie;
  if (!h) return null;
  const c = h.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return c ? decodeURIComponent(c.split('=')[1]) : null;
}

function requireAuth(req, res, next) {
  let token = getCookie(req, 'sessionToken') || req.headers['x-session-token'];
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1];
  }
  if (token) {
    try {
      const sf = join(DATA_DIR, 'sessions.json');
      if (existsSync(sf)) {
        const sessions = JSON.parse(readFileSync(sf, 'utf-8'));
        const sess = sessions[token];
        if (sess) { req.user = sess; return next(); }
      }
    } catch (e) { console.error('[AUTH] parse error:', e); }
  }
  return next(); // soft-auth: allow guest
}

// ── Price Helpers ────────────────────────────────────────────────────────
function getAssetPrice(ticker, market) {
  try {
    if (existsSync(SCREENER_CACHE)) {
      const c = JSON.parse(readFileSync(SCREENER_CACHE, 'utf-8'));
      if (c?.data?.[ticker]?.price) return c.data[ticker].price;
      // fuzzy match by ticker key
      for (const k of Object.keys(c.data || {})) {
        if (k.toUpperCase() === ticker.toUpperCase() && c.data[k]?.price) return c.data[k].price;
      }
    }
  } catch {}
  return market === 'kr' ? 50000 : 150;
}

function getUSDKRW() {
  try {
    if (existsSync(SCREENER_CACHE)) {
      const c = JSON.parse(readFileSync(SCREENER_CACHE, 'utf-8'));
      if (c?.rates?.usdkrw?.value) return c.rates.usdkrw.value;
    }
  } catch {}
  return 1350;
}

// ── Order Book Generator ─────────────────────────────────────────────────
function generateOrderBook(ticker, market, refPrice) {
  const price = refPrice || getAssetPrice(ticker, market);
  if (price <= 0) return null;
  const spreadPct = market === 'kr' ? 0.0003 : 0.001;
  const spread = Math.max(price * spreadPct, market === 'kr' ? 10 : 0.01);
  const asks = [], bids = [];
  for (let i = 1; i <= 5; i++) {
    asks.push({ price: parseFloat((price + spread * i).toFixed(2)), volume: Math.floor(Math.random() * 2000) + 200 });
    bids.push({ price: parseFloat((price - spread * i).toFixed(2)), volume: Math.floor(Math.random() * 2000) + 200 });
  }
  return { ticker, type: 'stock', price, asks: asks.reverse(), bids };
}

// ── SSE Clients ──────────────────────────────────────────────────────────
const sseClients = new Map(); // userId -> { res, accountId, mode, activeTicker }

// ── HFT Tick Engine (500ms) ─────────────────────────────────────────────
setInterval(async () => {
  if (sseClients.size === 0) return;
  let cache = null;
  try { if (existsSync(SCREENER_CACHE)) cache = JSON.parse(readFileSync(SCREENER_CACHE, 'utf-8')); } catch {}
  if (!cache?.data) return;

  let dirty = false;
  sseClients.forEach((client, uid) => {
    if (client.mode !== 'virtual' || !client.activeTicker) return;
    const td = cache.data[client.activeTicker];
    if (!td?.price) return;

    const old = td.price;
    const mom = (Math.random() - 0.48) * 0.015;
    const tickSize = old > 100000 ? 500 : (old > 10000 ? 50 : 5);
    let diff = Math.round((old * mom) / tickSize) * tickSize;
    if (diff === 0) diff = Math.random() > 0.5 ? tickSize : -tickSize;
    const np = Math.max(tickSize, old + diff);
    if (np !== old) {
      if (!td._basePrice) td._basePrice = old / (1 + (td.changePct || 0) / 100);
      td.price = np;
      td.changePct = ((np - td._basePrice) / td._basePrice) * 100;
      td.lastUpdated = Date.now();
      dirty = true;
    }
    // push order book
    const ob = generateOrderBook(client.activeTicker, 'kr', np);
    if (ob) client.res.write(`event: orderbook\ndata: ${JSON.stringify(ob)}\n\n`);
  });

  if (dirty) {
    writeFileSync(SCREENER_CACHE, JSON.stringify(cache, null, 2));
    sseClients.forEach((c) => {
      if (c.mode === 'virtual') c.res.write(`event: price\ndata: ${JSON.stringify(cache.data)}\n\n`);
    });
  }
}, 500);

// ── Dividend Scheduler (every hour) ─────────────────────────────────────
const DIVIDEND_CALENDAR = {
  '005930': { exDate: '2026-03-28', payDate: '2026-04-20', amount: 361 },
  'NVDA':   { exDate: '2026-03-12', payDate: '2026-03-28', amount: 0.01 },
  'AAPL':   { exDate: '2026-02-14', payDate: '2026-02-28', amount: 0.25 },
  'MSFT':   { exDate: '2026-02-20', payDate: '2026-03-13', amount: 0.83 },
  '000660': { exDate: '2026-06-27', payDate: '2026-07-15', amount: 300 },
};

async function processDividends() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const accounts = await readJSON(ACCOUNTS_FILE, {});
  const portfolios = await readJSON(PORTFOLIOS_FILE, {});
  const divRecords = await readJSON(DIVIDENDS_FILE, {});

  for (const [uid, acctList] of Object.entries(accounts)) {
    for (const acct of Object.values(acctList)) {
      const port = portfolios[acct.id];
      if (!port?.holdings?.length) continue;
      const key = `${uid}_${acct.id}`;
      if (!divRecords[key]) divRecords[key] = [];

      for (const h of port.holdings) {
        const cal = DIVIDEND_CALENDAR[h.ticker];
        if (!cal || cal.exDate !== today) continue;
        // check already processed
        const already = divRecords[key].find(r => r.ticker === h.ticker && r.date === today);
        if (already) continue;

        const amount = cal.amount * h.quantity;
        const currency = h.market === 'kr' ? 'KRW' : 'USD';
        if (currency === 'KRW') port.krwBalance += amount;
        else port.usdBalance += amount;

        divRecords[key].push({
          ticker: h.ticker, date: today, payDate: cal.payDate,
          amount, currency, quantity: h.quantity,
        });
      }
      portfolios[acct.id] = port;
    }
  }

  await writeJSON(PORTFOLIOS_FILE, portfolios);
  await writeJSON(DIVIDENDS_FILE, divRecords);
}
setInterval(processDividends, 3600_000);
processDividends(); // initial run

// ── Timezone ─────────────────────────────────────────────────────────────
function tzInfo(tz) {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
  const parts = fmt.formatToParts(d);
  const map = {}; parts.forEach(p => { map[p.type] = p.value; });
  return { weekday: map.weekday, hour: parseInt(map.hour), min: parseInt(map.minute) };
}

function isMarketOpen(market) {
  try {
    if (market === 'kr') {
      const t = tzInfo('Asia/Seoul');
      if (t.weekday === 'Sat' || t.weekday === 'Sun') return false;
      const m = t.hour * 60 + t.min;
      return m >= 540 && m <= 930; // 09:00-15:30
    }
    if (market === 'us') {
      const t = tzInfo('America/New_York');
      if (t.weekday === 'Sat' || t.weekday === 'Sun') return false;
      const m = t.hour * 60 + t.min;
      return m >= 570 && m <= 960; // 09:30-16:00
    }
  } catch {}
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ACCOUNT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Create account
router.post('/accounts', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  const { type, initialCapital } = req.body; // type: 'realtime'|'virtual', initialCapital: number (KRW)

  if (!type || !initialCapital) return res.status(400).json({ error: 'type과 initialCapital이 필요합니다.' });
  if (!['realtime', 'virtual'].includes(type)) return res.status(400).json({ error: 'type은 realtime 또는 virtual이어야 합니다.' });
  const cap = parseInt(initialCapital);
  if (isNaN(cap) || cap < 1000000) return res.status(400).json({ error: '초기자본금은 최소 100만원 이상이어야 합니다.' });

  try {
    const accounts = await readJSON(ACCOUNTS_FILE, {});
    if (!accounts[userId]) accounts[userId] = {};

    const acctId = `mock_${crypto.randomBytes(6).toString('hex')}`;
    const account = {
      id: acctId,
      userId,
      type,
      initialCapital: cap,
      createdAt: new Date().toISOString(),
      label: `${type === 'realtime' ? '실시간' : '가상'} 계좌 #${Object.keys(accounts[userId]).length + 1}`,
    };
    accounts[userId][acctId] = account;
    await writeJSON(ACCOUNTS_FILE, accounts);

    // init portfolio
    const portfolios = await readJSON(PORTFOLIOS_FILE, {});
    portfolios[acctId] = {
      krwBalance: cap,
      usdBalance: 0,
      investedPrincipal: 0,
      holdings: [],
    };
    await writeJSON(PORTFOLIOS_FILE, portfolios);

    res.json({ ok: true, account });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List accounts
router.get('/accounts', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  try {
    const accounts = await readJSON(ACCOUNTS_FILE, {});
    const mine = Object.values(accounts[userId] || {});
    res.json(mine);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset account
router.post('/accounts/:id/reset', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  const { id } = req.params;
  try {
    const accounts = await readJSON(ACCOUNTS_FILE, {});
    const acct = (accounts[userId] || {})[id];
    if (!acct) return res.status(404).json({ error: '계좌를 찾을 수 없습니다.' });

    const portfolios = await readJSON(PORTFOLIOS_FILE, {});
    portfolios[id] = { krwBalance: acct.initialCapital, usdBalance: 0, investedPrincipal: 0, holdings: [] };
    await writeJSON(PORTFOLIOS_FILE, portfolios);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete account
router.delete('/accounts/:id', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  const { id } = req.params;
  try {
    const accounts = await readJSON(ACCOUNTS_FILE, {});
    if (!accounts[userId]?.[id]) return res.status(404).json({ error: '계좌를 찾을 수 없습니다.' });
    delete accounts[userId][id];
    await writeJSON(ACCOUNTS_FILE, accounts);

    // cleanup portfolio
    const portfolios = await readJSON(PORTFOLIOS_FILE, {});
    delete portfolios[id];
    await writeJSON(PORTFOLIOS_FILE, portfolios);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  PORTFOLIO ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

router.get('/portfolio/:accountId', requireAuth, async (req, res) => {
  const { accountId } = req.params;
  try {
    const accounts = await readJSON(ACCOUNTS_FILE, {});
    // find account
    let acct = null;
    for (const [uid, alist] of Object.entries(accounts)) {
      if (alist[accountId]) { acct = alist[accountId]; break; }
    }
    if (!acct) return res.status(404).json({ error: '계좌 없음' });

    const portfolios = await readJSON(PORTFOLIOS_FILE, {});
    const port = portfolios[accountId] || { krwBalance: acct.initialCapital, usdBalance: 0, investedPrincipal: 0, holdings: [] };

    const usdkrw = getUSDKRW();
    let totalHoldingsValueKRW = 0;
    const holdingsWithPrice = port.holdings.map(h => {
      const cp = getAssetPrice(h.ticker, h.market);
      const evalVal = h.quantity * cp;
      const cost = h.quantity * h.avgPrice;
      const profit = evalVal - cost;
      const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
      const inKRW = h.market === 'kr' ? evalVal : evalVal * usdkrw;
      totalHoldingsValueKRW += inKRW;
      return { ...h, currentPrice: cp, evaluationValue: evalVal, profit, profitPct, evalKRW: inKRW };
    });

    const usdInKRW = port.usdBalance * usdkrw;
    const totalAssetKRW = port.krwBalance + usdInKRW + totalHoldingsValueKRW;
    const totalProfit = totalAssetKRW - acct.initialCapital;
    const totalProfitPct = acct.initialCapital > 0 ? (totalProfit / acct.initialCapital) * 100 : 0;

    res.json({
      account: acct,
      krwBalance: port.krwBalance,
      usdBalance: port.usdBalance,
      usdkrw,
      usdInKRW,
      investedPrincipal: port.investedPrincipal,
      totalHoldingsValueKRW,
      totalAssetKRW,
      totalProfit,
      totalProfitPct,
      holdings: holdingsWithPrice,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ORDER ENDPOINT (with auto-FX)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/order', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  const { accountId, ticker, market, side, price, quantity, mode } = req.body;

  if (!accountId || !ticker || !market || !side || !price || !quantity) {
    return res.status(400).json({ error: '필수 주문 파라미터 누락' });
  }
  const qty = parseInt(quantity);
  const prc = parseFloat(price);
  if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc <= 0) {
    return res.status(400).json({ error: '올바른 수량/가격 입력' });
  }
  if (!['buy', 'sell'].includes(side)) {
    return res.status(400).json({ error: 'side는 buy 또는 sell' });
  }

  try {
    const accounts = await readJSON(ACCOUNTS_FILE, {});
    let acct = null;
    for (const [, alist] of Object.entries(accounts)) {
      if (alist[accountId]) { acct = alist[accountId]; break; }
    }
    if (!acct) return res.status(404).json({ error: '계좌 없음' });

    const portfolios = await readJSON(PORTFOLIOS_FILE, {});
    const port = portfolios[accountId];
    if (!port) return res.status(404).json({ error: '포트폴리오 없음' });

    const isKR = market === 'kr';
    const usdkrw = getUSDKRW();
    const tv = prc * qty;
    const commission = tv * 0.00015;

    const orders = await readJSON(ORDERS_FILE, {});

    if (side === 'buy') {
      // determine required funds
      if (isKR) {
        const need = tv + commission;
        if (port.krwBalance < need) return res.status(400).json({ error: `원화 잔액 부족 (필요: ₩${Math.ceil(need).toLocaleString()}, 보유: ₩${Math.ceil(port.krwBalance).toLocaleString()})` });
        port.krwBalance -= need;
        port.investedPrincipal += tv;
      } else {
        // US stock — need USD
        const needUSD = tv + commission;
        if (port.usdBalance >= needUSD) {
          port.usdBalance -= needUSD;
        } else {
          // auto-FX: convert KRW → USD
          const shortfallUSD = needUSD - port.usdBalance;
          const krwNeeded = shortfallUSD * usdkrw * 1.005; // 0.5% spread
          if (port.krwBalance >= krwNeeded) {
            port.krwBalance -= krwNeeded;
            port.usdBalance = 0;
          } else {
            return res.status(400).json({ error: `환전 포함 잔액 부족` });
          }
        }
        port.investedPrincipal += tv;
      }
    } else {
      // sell: check holding
      const assetId = `${ticker}_${market}`;
      const h = port.holdings.find(x => x.assetId === assetId);
      if (!h || h.quantity < qty) return res.status(400).json({ error: '보유 수량 부족' });
      h.quantity -= qty;
      if (h.quantity === 0) port.holdings = port.holdings.filter(x => x.assetId !== assetId);
      const proceeds = tv - commission;
      if (isKR) port.krwBalance += proceeds;
      else port.usdBalance += proceeds;
      port.investedPrincipal = Math.max(0, port.investedPrincipal - tv);
    }

    // immediate fill (virtual always; realtime only if market open)
    const executeNow = (acct.type === 'virtual') || (acct.type === 'realtime' && isMarketOpen(market));
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const order = {
      orderId, userId, accountId, ticker, market, side, price: prc, quantity: qty,
      filledQty: executeNow ? qty : 0,
      status: executeNow ? 'filled' : 'pending',
      mode: acct.type,
      createdAt: new Date().toISOString(),
    };
    orders[orderId] = order;

    if (executeNow) {
      if (side === 'buy') {
        const assetId = `${ticker}_${market}`;
        let h = port.holdings.find(x => x.assetId === assetId);
        if (!h) {
          h = { assetId, ticker, market, type: 'stock', avgPrice: prc, quantity: 0 };
          port.holdings.push(h);
        }
        h.quantity += qty;
        h.avgPrice = ((h.quantity - qty) * h.avgPrice + qty * prc) / h.quantity;
      }
    }

    await writeJSON(PORTFOLIOS_FILE, portfolios);
    await writeJSON(ORDERS_FILE, orders);

    // write history
    const history = await readJSON(HISTORY_FILE, {});
    const hKey = `${userId}_${accountId}`;
    if (!history[hKey]) history[hKey] = [];
    history[hKey].push({
      id: `hist_${Date.now()}`,
      type: 'trade', ticker, side, price: prc, quantity: qty,
      amount: side === 'buy' ? -(tv + commission) : (tv - commission),
      fee: commission,
      timestamp: new Date().toISOString(),
      memo: `${ticker} ${qty}주 ${side === 'buy' ? '매수' : '매도'} ${executeNow ? '체결' : '접수'}`,
    });
    await writeJSON(HISTORY_FILE, history);

    res.json({ ok: true, order, executed: executeNow });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cancel order
router.post('/cancel', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId 필요' });

  try {
    const orders = await readJSON(ORDERS_FILE, {});
    const order = orders[orderId];
    if (!order || order.userId !== userId) return res.status(404).json({ error: '주문 없음' });
    if (order.status !== 'pending') return res.status(400).json({ error: '대기 주문만 취소 가능' });

    const portfolios = await readJSON(PORTFOLIOS_FILE, {});
    const port = portfolios[order.accountId];
    if (!port) return res.status(404).json({ error: '포트폴리오 없음' });

    const tv = order.price * order.quantity;
    const fee = tv * 0.00015;

    if (order.side === 'buy') {
      if (order.market === 'kr') port.krwBalance += (tv + fee);
      else port.usdBalance += (tv + fee);
    } else {
      const assetId = `${order.ticker}_${order.market}`;
      let h = port.holdings.find(x => x.assetId === assetId);
      if (h) h.quantity += order.quantity;
      else port.holdings.push({ assetId, ticker: order.ticker, market: order.market, type: 'stock', avgPrice: order.price, quantity: order.quantity });
    }

    order.status = 'cancelled';
    await writeJSON(ORDERS_FILE, orders);
    await writeJSON(PORTFOLIOS_FILE, portfolios);

    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  HISTORY / DIVIDENDS
// ═══════════════════════════════════════════════════════════════════════════

router.get('/history/:accountId', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  const { accountId } = req.params;
  const key = `${userId}_${accountId}`;
  try {
    const history = await readJSON(HISTORY_FILE, {});
    const items = history[key] || [];
    res.json(items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/dividends/:accountId', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.user?.email || 'guest';
  const { accountId } = req.params;
  const key = `${userId}_${accountId}`;
  try {
    const divs = await readJSON(DIVIDENDS_FILE, {});
    res.json((divs[key] || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ORDER BOOK
// ═══════════════════════════════════════════════════════════════════════════

router.get('/orderbook', (req, res) => {
  const { ticker, market } = req.query;
  if (!ticker || !market) return res.status(400).json({ error: 'ticker, market 필요' });
  const ob = generateOrderBook(ticker, market, getAssetPrice(ticker, market));
  if (!ob) return res.status(404).json({ error: '가격 조회 실패' });
  res.json(ob);
});

// ═══════════════════════════════════════════════════════════════════════════
//  SSE STREAM
// ═══════════════════════════════════════════════════════════════════════════

router.get('/stream', (req, res) => {
  const userId = req.query.userId || 'guest';
  const accountId = req.query.accountId;
  const mode = req.query.mode || 'virtual';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  sseClients.set(userId, { res, accountId, mode, activeTicker: null });

  req.on('close', () => { sseClients.delete(userId); });
});

router.post('/stream/context', express.json(), (req, res) => {
  const { userId, activeTicker, mode } = req.body;
  const client = sseClients.get(userId);
  if (client) {
    if (activeTicker) client.activeTicker = activeTicker;
    if (mode) client.mode = mode;
  }
  res.json({ ok: true });
});

export default router;