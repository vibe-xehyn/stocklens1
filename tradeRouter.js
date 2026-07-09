import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTFOLIOS_FILE = join(__dirname, 'data', 'portfolios.json');
const ORDERS_FILE = join(__dirname, 'data', 'orders.json');
const HISTORY_FILE = join(__dirname, 'data', 'history.json');
const SCREENER_CACHE_FILE = join(__dirname, '.screener-cache.json');

// File locking/queueing system to prevent race conditions on 1GB RAM budget
const fileQueues = new Map();

function enqueue(filePath, operation) {
  if (!fileQueues.has(filePath)) {
    fileQueues.set(filePath, Promise.resolve());
  }
  const promise = fileQueues.get(filePath).then(async () => {
    try {
      return await operation();
    } catch (e) {
      console.error(`[LOCK ENGINE] Error in file queue operations for ${filePath}:`, e);
      throw e;
    }
  });
  fileQueues.set(filePath, promise.catch(() => {}));
  return promise;
}

async function readJSONSafe(filePath, defaultValue = {}) {
  return enqueue(filePath, async () => {
    try {
      if (!existsSync(filePath)) {
        writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
        return defaultValue;
      }
      const data = readFileSync(filePath, 'utf-8');
      return JSON.parse(data || JSON.stringify(defaultValue));
    } catch (e) {
      console.error(`[LOCK ENGINE] Error reading JSON from ${filePath}:`, e);
      return defaultValue;
    }
  });
}

async function writeJSONSafe(filePath, data) {
  return enqueue(filePath, async () => {
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error(`[LOCK ENGINE] Error writing JSON to ${filePath}:`, e);
      throw e;
    }
  });
}

// Helper: Get asset price from cache or simple fallback
function getAssetPrice(ticker, market, type) {
  if (type === 'stock') {
    try {
      if (existsSync(SCREENER_CACHE_FILE)) {
        const c = JSON.parse(readFileSync(SCREENER_CACHE_FILE, 'utf-8'));
        if (c && c.data && c.data[ticker]) {
          return c.data[ticker].price || 0;
        }
      }
    } catch (e) {
      console.error('[PRICING ENGINE] Screener cache parse error:', e);
    }
    return market === 'kr' ? 70000 : 150; // default fallbacks
  } else if (type === 'bond') {
    return 1000.0; // standard bond par value
  } else if (type === 'option') {
    return 5.0; // default premium
  }
  return 0;
}

// Helper: timezone local time checker
function getLocalTime(timezone) {
  const date = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short'
  });
  
  const weekday = dayFormatter.format(date);
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  
  return {
    weekday,
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10)
  };
}

function isMarketOpen(market) {
  try {
    if (market === 'kr') {
      const time = getLocalTime('Asia/Seoul');
      if (time.weekday === 'Sat' || time.weekday === 'Sun') return false;
      const minutes = time.hour * 60 + time.minute;
      return minutes >= 9 * 60 && minutes <= 15 * 60 + 30; // 09:00 - 15:30
    } else if (market === 'us') {
      const time = getLocalTime('America/New_York');
      if (time.weekday === 'Sat' || time.weekday === 'Sun') return false;
      const minutes = time.hour * 60 + time.minute;
      return minutes >= 9 * 60 + 30 && minutes <= 16 * 60; // 09:30 - 16:00
    }
  } catch (e) {
    console.error('[MARKET STATE ENGINE] Error in isMarketOpen evaluation:', e);
  }
  return false;
}

// ── ENDPOINTS ────────────────────────────────────────────────────────────────

// 1. Get Portfolio
router.get('/portfolio', async (req, res) => {
  const userId = req.user.id;
  try {
    const portfolios = await readJSONSafe(PORTFOLIOS_FILE, {});
    if (!portfolios[userId]) {
      portfolios[userId] = {
        cash: 10000000,
        investedPrincipal: 0,
        holdings: []
      };
      await writeJSONSafe(PORTFOLIOS_FILE, portfolios);
    }
    
    const userPort = portfolios[userId];
    let totalHoldingsValue = 0;
    let totalHoldingsCost = 0;
    
    const holdingsWithPrice = userPort.holdings.map(h => {
      const currentPrice = getAssetPrice(h.ticker, h.market, h.type);
      const evaluationValue = h.quantity * currentPrice;
      const cost = h.quantity * h.avgPrice;
      const profit = evaluationValue - cost;
      const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
      
      totalHoldingsValue += evaluationValue;
      totalHoldingsCost += cost;
      
      return {
        ...h,
        currentPrice,
        evaluationValue,
        profit,
        profitPct
      };
    });
    
    const totalAssetValuation = userPort.cash + totalHoldingsValue;
    const totalEvaluationProfit = totalHoldingsValue - totalHoldingsCost;
    const totalEvaluationProfitPct = totalHoldingsCost > 0 ? (totalEvaluationProfit / totalHoldingsCost) * 100 : 0;
    
    res.json({
      cash: userPort.cash,
      investedPrincipal: userPort.investedPrincipal || totalHoldingsCost,
      totalAssetValuation,
      totalHoldingsValue,
      totalHoldingsCost,
      totalEvaluationProfit,
      totalEvaluationProfitPct,
      holdings: holdingsWithPrice
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Submit Order
router.post('/order', async (req, res) => {
  const userId = req.user.id;
  const { ticker, market, type, side, price, quantity, mode, optionDetails, bondDetails } = req.body;
  
  if (!ticker || !market || !type || !side || !price || !quantity || !mode) {
    return res.status(400).json({ error: '필수 주문 매개변수가 누락되었습니다.' });
  }
  
  const parsedPrice = parseFloat(price);
  const parsedQty = parseInt(quantity, 10);
  
  if (isNaN(parsedPrice) || parsedPrice <= 0 || isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ error: '올바른 수량 및 가격을 입력해 주세요.' });
  }
  
  if (side !== 'buy' && side !== 'sell') {
    return res.status(400).json({ error: '주문 방향은 buy 또는 sell이어야 합니다.' });
  }
  
  const commissionRate = 0.00015; // 0.015%
  const transactionValue = parsedPrice * parsedQty;
  const fee = transactionValue * commissionRate;
  
  try {
    const portfolios = await readJSONSafe(PORTFOLIOS_FILE, {});
    const orders = await readJSONSafe(ORDERS_FILE, {});
    
    if (!portfolios[userId]) {
      portfolios[userId] = { cash: 10000000, investedPrincipal: 0, holdings: [] };
    }
    const userPort = portfolios[userId];
    
    // Validate bounds / execute cash reserve or stock deduct
    if (side === 'buy') {
      const requiredCash = transactionValue + fee;
      if (userPort.cash < requiredCash) {
        return res.status(400).json({ error: `잔액이 부족합니다. (필요: ${requiredCash.toLocaleString()}원, 잔고: ${userPort.cash.toLocaleString()}원)` });
      }
      // Reserve cash immediately
      userPort.cash -= requiredCash;
    } else {
      const assetId = `${ticker}_${market}`;
      const holding = userPort.holdings.find(h => h.assetId === assetId);
      if (!holding || holding.quantity < parsedQty) {
        return res.status(400).json({ error: '보유 수량이 부족하여 매도할 수 없습니다.' });
      }
      // Deduct asset quantity immediately
      holding.quantity -= parsedQty;
      if (holding.quantity === 0) {
        userPort.holdings = userPort.holdings.filter(h => h.assetId !== assetId);
      }
    }
    
    // Evaluate if execution can occur immediately
    const isOpen = isMarketOpen(market);
    const executeImmediately = (mode === 'virtual') || (mode === 'realtime' && isOpen);
    
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newOrder = {
      orderId,
      userId,
      ticker,
      market,
      type,
      side,
      price: parsedPrice,
      quantity: parsedQty,
      filledQuantity: executeImmediately ? parsedQty : 0,
      status: executeImmediately ? 'filled' : 'pending',
      mode,
      createdAt: new Date().toISOString(),
      optionDetails: optionDetails || null,
      bondDetails: bondDetails || null
    };
    
    if (executeImmediately) {
      if (side === 'buy') {
        const assetId = `${ticker}_${market}`;
        let holding = userPort.holdings.find(h => h.assetId === assetId);
        if (!holding) {
          holding = {
            assetId,
            ticker,
            market,
            type,
            avgPrice: parsedPrice,
            quantity: parsedQty,
            optionDetails: optionDetails || null,
            bondDetails: bondDetails || null
          };
          userPort.holdings.push(holding);
        } else {
          const totalQty = holding.quantity + parsedQty;
          holding.avgPrice = ((holding.quantity * holding.avgPrice) + (parsedQty * parsedPrice)) / totalQty;
          holding.quantity = totalQty;
        }
        userPort.investedPrincipal = (userPort.investedPrincipal || 0) + transactionValue;
      } else {
        // Sell fill: credit cash
        userPort.cash += (transactionValue - fee);
        userPort.investedPrincipal = Math.max(0, (userPort.investedPrincipal || 0) - transactionValue);
      }
      
      // Log transaction history
      const history = await readJSONSafe(HISTORY_FILE, {});
      if (!history[userId]) history[userId] = [];
      history[userId].push({
        historyId: `hist_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        type: 'trade',
        ticker,
        side,
        price: parsedPrice,
        quantity: parsedQty,
        amount: side === 'buy' ? -(transactionValue + fee) : (transactionValue - fee),
        fee,
        timestamp: new Date().toISOString(),
        memo: `${ticker} ${parsedQty}주 ${side === 'buy' ? '매수' : '매도'} 체결 완료`
      });
      await writeJSONSafe(HISTORY_FILE, history);
    }
    
    orders[orderId] = newOrder;
    await writeJSONSafe(ORDERS_FILE, orders);
    await writeJSONSafe(PORTFOLIOS_FILE, portfolios);
    
    res.json({ ok: true, order: newOrder });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Cancel Order
router.post('/cancel', async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'orderId가 필요합니다.' });
  }
  
  try {
    const orders = await readJSONSafe(ORDERS_FILE, {});
    const order = orders[orderId];
    
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: '해당 주문을 찾을 수 없습니다.' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '대기 중인 주문만 취소할 수 있습니다.' });
    }
    
    const portfolios = await readJSONSafe(PORTFOLIOS_FILE, {});
    const userPort = portfolios[userId];
    
    // Revert/refund reserves
    const commissionRate = 0.00015;
    const transactionValue = order.price * order.quantity;
    const fee = transactionValue * commissionRate;
    
    if (order.side === 'buy') {
      userPort.cash += (transactionValue + fee);
    } else {
      const assetId = `${order.ticker}_${order.market}`;
      let holding = userPort.holdings.find(h => h.assetId === assetId);
      if (!holding) {
        holding = {
          assetId,
          ticker: order.ticker,
          market: order.market,
          type: order.type,
          avgPrice: order.price,
          quantity: order.quantity,
          optionDetails: order.optionDetails,
          bondDetails: order.bondDetails
        };
        userPort.holdings.push(holding);
      } else {
        holding.quantity += order.quantity;
      }
    }
    
    order.status = 'cancelled';
    
    // Log cancellation in history
    const history = await readJSONSafe(HISTORY_FILE, {});
    if (!history[userId]) history[userId] = [];
    history[userId].push({
      historyId: `hist_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      type: 'cancel',
      ticker: order.ticker,
      side: order.side,
      price: order.price,
      quantity: order.quantity,
      amount: 0,
      fee: 0,
      timestamp: new Date().toISOString(),
      memo: `${order.ticker} ${order.quantity}주 ${order.side === 'buy' ? '매수' : '매도'} 주문 취소`
    });
    
    await writeJSONSafe(ORDERS_FILE, orders);
    await writeJSONSafe(PORTFOLIOS_FILE, portfolios);
    await writeJSONSafe(HISTORY_FILE, history);
    
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Get Transaction History
router.get('/history', async (req, res) => {
  const userId = req.user.id;
  try {
    const history = await readJSONSafe(HISTORY_FILE, {});
    res.json(history[userId] || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
