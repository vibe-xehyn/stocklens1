// ── StockLens Mock Investment Masterclass Engine (Gemini 3.6 Flash Edition) ──

// ── Default Stock Definitions Universe ──
const MOCK_STOCK_DEFS = [
  // 국내 KOSPI / KOSDAQ
  { id: '005930', ticker: '005930', name: '삼성전자', market: 'kr', exchange: 'KOSPI', price: 78500, changePct: 1.25, divYield: 2.45, category: '국내주식', valScore: 88, growthScore: 82, whaleScore: 90 },
  { id: '000660', ticker: '000660', name: 'SK하이닉스', market: 'kr', exchange: 'KOSPI', price: 183000, changePct: -2.10, divYield: 1.20, category: '국내주식', valScore: 92, growthScore: 95, whaleScore: 94 },
  { id: '373220', ticker: '373220', name: 'LG에너지솔루션', market: 'kr', exchange: 'KOSPI', price: 382000, changePct: 0.52, divYield: 0.00, category: '국내주식', valScore: 75, growthScore: 85, whaleScore: 78 },
  { id: '005380', ticker: '005380', name: '현대차', market: 'kr', exchange: 'KOSPI', price: 253500, changePct: -1.30, divYield: 4.80, category: '국내주식', valScore: 85, growthScore: 78, whaleScore: 84 },
  { id: '035420', ticker: '035420', name: 'NAVER', market: 'kr', exchange: 'KOSPI', price: 172000, changePct: -0.86, divYield: 0.95, category: '국내주식', valScore: 80, growthScore: 75, whaleScore: 76 },
  { id: '035720', ticker: '035720', name: '카카오', market: 'kr', exchange: 'KOSPI', price: 42100, changePct: -1.41, divYield: 0.70, category: '국내주식', valScore: 70, growthScore: 72, whaleScore: 68 },
  { id: '068270', ticker: '068270', name: '셀트리온', market: 'kr', exchange: 'KOSPI', price: 194000, changePct: 1.84, divYield: 0.45, category: '국내주식', valScore: 84, growthScore: 86, whaleScore: 88 },
  { id: '000270', ticker: '000270', name: '기아', market: 'kr', exchange: 'KOSPI', price: 118500, changePct: 2.60, divYield: 5.10, category: '국내주식', valScore: 86, growthScore: 80, whaleScore: 82 },
  { id: '105560', ticker: '105560', name: 'KB금융', market: 'kr', exchange: 'KOSPI', price: 79200, changePct: 3.21, divYield: 4.10, category: '국내주식', valScore: 89, growthScore: 76, whaleScore: 85 },
  { id: '005490', ticker: '005490', name: 'POSCO홀딩스', market: 'kr', exchange: 'KOSPI', price: 365000, changePct: -0.54, divYield: 2.80, category: '국내주식', valScore: 78, growthScore: 70, whaleScore: 74 },
  { id: '012450', ticker: '012450', name: '한화에어로스페이스', market: 'kr', exchange: 'KOSPI', price: 298000, changePct: 4.80, divYield: 0.80, category: '국내주식', valScore: 94, growthScore: 98, whaleScore: 96 },
  { id: '006400', ticker: '006400', name: '삼성SDI', market: 'kr', exchange: 'KOSPI', price: 345000, changePct: -1.20, divYield: 1.10, category: '국내주식', valScore: 76, growthScore: 74, whaleScore: 72 },

  // 해외 US Tech & Market Leaders
  { id: 'NVDA', ticker: 'NVDA', name: '엔비디아 (NVIDIA)', market: 'us', exchange: 'NASDAQ', price: 128.50, changePct: 3.85, divYield: 0.12, category: '해외주식', valScore: 98, growthScore: 99, whaleScore: 99 },
  { id: 'AAPL', ticker: 'AAPL', name: '애플 (Apple)', market: 'us', exchange: 'NASDAQ', price: 224.30, changePct: 0.75, divYield: 0.45, category: '해외주식', valScore: 92, growthScore: 88, whaleScore: 93 },
  { id: 'MSFT', ticker: 'MSFT', name: '마이크로소프트 (MSFT)', market: 'us', exchange: 'NASDAQ', price: 448.90, changePct: -0.42, divYield: 0.68, category: '해외주식', valScore: 95, growthScore: 92, whaleScore: 95 },
  { id: 'GOOGL', ticker: 'GOOGL', name: '알파벳 A (Google)', market: 'us', exchange: 'NASDAQ', price: 178.20, changePct: -1.10, divYield: 0.45, category: '해외주식', valScore: 90, growthScore: 89, whaleScore: 91 },
  { id: 'AMZN', ticker: 'AMZN', name: '아마존 (Amazon)', market: 'us', exchange: 'NASDAQ', price: 186.40, changePct: 1.50, divYield: 0.00, category: '해외주식', valScore: 88, growthScore: 91, whaleScore: 90 },
  { id: 'META', ticker: 'META', name: '메타 (Meta)', market: 'us', exchange: 'NASDAQ', price: 495.20, changePct: 2.15, divYield: 0.40, category: '해외주식', valScore: 91, growthScore: 93, whaleScore: 92 },
  { id: 'TSLA', ticker: 'TSLA', name: '테슬라 (Tesla)', market: 'us', exchange: 'NASDAQ', price: 248.80, changePct: 4.60, divYield: 0.00, category: '해외주식', valScore: 82, growthScore: 95, whaleScore: 89 },
  { id: 'PLTR', ticker: 'PLTR', name: '팔란티어 (Palantir)', market: 'us', exchange: 'NYSE', price: 28.40, changePct: 4.30, divYield: 0.00, category: '해외주식', valScore: 93, growthScore: 97, whaleScore: 94 },
  { id: 'AVGO', ticker: 'AVGO', name: '브로드컴 (Broadcom)', market: 'us', exchange: 'NASDAQ', price: 172.60, changePct: -1.80, divYield: 1.25, category: '해외주식', valScore: 89, growthScore: 90, whaleScore: 87 },
  { id: 'JPM', ticker: 'JPM', name: 'JP모건 체이스', market: 'us', exchange: 'NYSE', price: 206.50, changePct: 1.10, divYield: 2.25, category: '해외주식', valScore: 87, growthScore: 80, whaleScore: 86 },

  // 채권 & ETF
  { id: 'SPY', ticker: 'SPY', name: 'S&P 500 ETF (SPY)', market: 'us', exchange: 'NYSE', price: 556.80, changePct: 0.45, divYield: 1.22, category: 'ETF', valScore: 90, growthScore: 85, whaleScore: 92 },
  { id: 'QQQ', ticker: 'QQQ', name: '나스닥 100 ETF (QQQ)', market: 'us', exchange: 'NASDAQ', price: 492.10, changePct: 0.88, divYield: 0.58, category: 'ETF', valScore: 94, growthScore: 92, whaleScore: 95 },
  { id: 'TLT', ticker: 'TLT', name: '미국 20년+ 국채 ETF (TLT)', market: 'us', exchange: 'NASDAQ', price: 94.50, changePct: -0.30, divYield: 3.85, category: '채권', valScore: 80, growthScore: 70, whaleScore: 75 },
  { id: 'TIGER200', ticker: '102110', name: 'TIGER 200 (KOSPI 200)', market: 'kr', exchange: 'KOSPI', price: 36200, changePct: 0.84, divYield: 1.90, category: 'ETF', valScore: 82, growthScore: 78, whaleScore: 80 },
];

// ── Master Application State Engine ──
let MockState = {
  accounts: {},
  activeAccountId: null,
  liveRate: 1380.50,
  watchlist: new Set(['005930', 'NVDA', 'AAPL', 'TSLA']),
  quotes: {},
  currentTab: 'base',
  holdingFilter: 'all',
  currencyView: 'krw',
  sortOrder: 'val_desc',
  discoveryCategory: 'all',
  discoveryRankType: 'val',
  activeDetailStock: null,
  orderType: 'buy',
  orderPriceMode: 'market',
  setupModeType: 'realtime',
  setupCapitalAmount: 10000000,
  exchangeDir: 'KRW',
  tvChartObj: null,
  scenarioTimer: null,
  feedItems: null,
};

// ── Startup Event Listener ──
document.addEventListener('DOMContentLoaded', async () => {
  initQuotes();
  await loadServerOrLocalStorage();
  setupNavTabListeners();
  startLiveRateFetcher();
  startVirtualScenarioEngine();
  renderApp();
});

function initQuotes() {
  MOCK_STOCK_DEFS.forEach(s => {
    MockState.quotes[s.id] = { ...s };
  });
}

function setupNavTabListeners() {
  document.querySelectorAll('.bnav-tab-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      if (tab) switchNavTab(tab);
    });
  });

  document.addEventListener('click', (e) => {
    const searchWrapper = document.getElementById('globalStockSearchInput');
    const menu = document.getElementById('globalSearchDropdownMenu');
    if (menu && searchWrapper && !searchWrapper.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('active');
    }
  });
}

function handleGlobalStockSearch(query) {
  const menu = document.getElementById('globalSearchDropdownMenu');
  if (!menu) return;

  const q = (query || '').trim().toLowerCase();
  if (!q) {
    menu.classList.remove('active');
    return;
  }

  const matches = MOCK_STOCK_DEFS.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.ticker.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q)
  );

  if (!matches.length) {
    menu.innerHTML = `<div style="font-size:12px; color:var(--muted); padding:10px 12px; text-align:center;">검색 결과가 없습니다.</div>`;
    menu.classList.add('active');
    return;
  }

  let html = `<div style="font-size:11px; font-weight:800; color:var(--muted); padding:6px 12px; border-bottom:1px solid var(--border);">종목 검색 결과 (${matches.length}건)</div>`;
  matches.slice(0, 8).forEach(s => {
    const qObj = MockState.quotes[s.id] || s;
    const upClass = qObj.changePct > 0 ? 'up' : (qObj.changePct < 0 ? 'down' : 'flat');
    const sign = qObj.changePct > 0 ? '+' : '';
    html += `
      <div class="dropdown-item" onclick="openStockDetailModal('${s.id}'); document.getElementById('globalSearchDropdownMenu').classList.remove('active');">
        <div>
          <div style="font-weight:800; font-size:13px; color:var(--text);">${s.name}</div>
          <div style="font-size:11px; color:var(--muted);">${s.ticker} · ${s.category}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800; font-size:13px;">${s.market === 'us' ? '$' + qObj.price.toFixed(2) : 'KRW ' + Math.round(qObj.price).toLocaleString()}</div>
          <div class="stock-change-sub ${upClass}" style="font-size:11px;">${sign}${qObj.changePct.toFixed(2)}%</div>
        </div>
      </div>
    `;
  });

  menu.innerHTML = html;
  menu.classList.add('active');
}

function switchNavTab(tabName) {
  MockState.currentTab = tabName;
  document.querySelectorAll('.bnav-tab-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  renderApp();
}

// ── Data Persistence Layer (Server API + LocalStorage Fallback) ──
async function loadServerOrLocalStorage() {
  try {
    const res = await fetch('/api/mock/data');
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.accounts && Object.keys(json.data.accounts).length > 0) {
        MockState.accounts = json.data.accounts;
        MockState.activeAccountId = json.data.activeAccountId || Object.keys(json.data.accounts)[0];
        if (json.data.watchlist) MockState.watchlist = new Set(json.data.watchlist);
        return;
      }
    }
  } catch (e) {}

  const saved = localStorage.getItem('stocklens_mock_master_state_v3');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      MockState.accounts = parsed.accounts || {};
      MockState.activeAccountId = parsed.activeAccountId || null;
      if (parsed.watchlist) MockState.watchlist = new Set(parsed.watchlist);
    } catch (e) {}
  }

  if (!Object.keys(MockState.accounts).length) {
    createAccount('realtime', 10000000);
    const defaultAcc = MockState.accounts['realtime'];
    if (defaultAcc) {
      defaultAcc.holdings['005930'] = { ticker: '005930', name: '삼성전자', market: 'kr', qty: 20, avgPrice: 75000, exchange: 'KOSPI' };
      defaultAcc.holdings['NVDA'] = { ticker: 'NVDA', name: '엔비디아 (NVIDIA)', market: 'us', qty: 5, avgPrice: 120.00, exchange: 'NASDAQ' };
      saveState();
    }
  }
}

async function saveState() {
  const payload = {
    accounts: MockState.accounts,
    activeAccountId: MockState.activeAccountId,
    watchlist: Array.from(MockState.watchlist),
  };

  localStorage.setItem('stocklens_mock_master_state_v3', JSON.stringify(payload));

  try {
    await fetch('/api/mock/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {}
}

function getActiveAccount() {
  if (!MockState.activeAccountId || !MockState.accounts[MockState.activeAccountId]) return null;
  return MockState.accounts[MockState.activeAccountId];
}

// ── Account Engine & Creation ──
function createAccount(modeType, initialCapitalKRW) {
  const isReal = modeType === 'realtime';
  const newAccount = {
    id: modeType,
    name: isReal ? '실시간 실전형 계좌' : '가상상황 쾌속형 계좌',
    type: modeType,
    krwCash: initialCapitalKRW,
    usdCash: 0,
    holdings: {},
    pendingOrders: [],
    executedOrders: [],
    realizedPnl: [],
    dividendHistory: [],
    createdAt: Date.now(),
  };

  MockState.accounts[modeType] = newAccount;
  MockState.activeAccountId = modeType;
  saveState();
  showToast(`${newAccount.name}가 생성되었습니다. (초기 예수금: ${Math.floor(initialCapitalKRW / 10000).toLocaleString()}만원)`);
}

// ── Live Exchange Rate Fetcher & Virtual Simulation Engine ──
async function startLiveRateFetcher() {
  async function updateRate() {
    try {
      const res = await fetch('/api/macro');
      if (res.ok) {
        const data = await res.json();
        if (data.usdkrw && data.usdkrw.value) {
          MockState.liveRate = parseFloat(data.usdkrw.value);
          const el = document.getElementById('headerLiveRate');
          if (el) el.textContent = `1 USD = KRW ${MockState.liveRate.toLocaleString(undefined, { minimumFractionDigits: 1 })}`;
        }
      }
    } catch (e) {}
  }
  updateRate();
  setInterval(updateRate, 15000);
}

function startVirtualScenarioEngine() {
  if (MockState.scenarioTimer) clearInterval(MockState.scenarioTimer);
  MockState.scenarioTimer = setInterval(() => {
    const acc = getActiveAccount();

    MOCK_STOCK_DEFS.forEach(s => {
      const q = MockState.quotes[s.id];
      if (!q) return;

      if (acc && acc.type === 'virtual') {
        const delta = (Math.random() - 0.49) * 0.035;
        const newPrice = Math.max(1, q.price * (1 + delta));
        q.changePct = ((newPrice - s.price) / s.price) * 100;
        q.price = newPrice;
      }
    });

    if (acc) checkPendingLimitOrders(acc);

    if (acc && acc.type === 'virtual' && Math.random() < 0.12) {
      triggerFastDividend(acc);
    }

    if (MockState.currentTab === 'base' || MockState.currentTab === 'discovery') {
      renderApp();
    }
  }, 2500);
}

function checkPendingLimitOrders(acc) {
  if (!acc.pendingOrders || !acc.pendingOrders.length) return;

  const remaining = [];
  acc.pendingOrders.forEach(order => {
    const q = MockState.quotes[order.ticker];
    if (!q) { remaining.push(order); return; }

    let isFilled = false;
    const mode = order.mode || 'limit';

    if (mode === 'limit') {
      if (order.type === 'buy' && q.price <= order.price) isFilled = true;
      if (order.type === 'sell' && q.price >= order.price) isFilled = true;
    } else if (mode === 'stop_loss') {
      if (order.type === 'sell' && q.price <= (order.triggerPrice || order.price)) isFilled = true;
      if (order.type === 'buy' && q.price >= (order.triggerPrice || order.price)) isFilled = true;
    } else if (mode === 'take_profit') {
      if (order.type === 'sell' && q.price >= (order.triggerPrice || order.price)) isFilled = true;
      if (order.type === 'buy' && q.price <= (order.triggerPrice || order.price)) isFilled = true;
    }

    if (isFilled) {
      const fillPrice = q.price;
      executeTrade(acc, order.ticker, order.type, order.qty, fillPrice, order.market);
      const tagLabel = mode === 'stop_loss' ? '손절 감시' : (mode === 'take_profit' ? '익절 감시' : '지정가');
      showToast(`[${tagLabel} 체결] ${order.name} ${order.qty}주 ${order.type === 'buy' ? '매수' : '매도'} 완료`);
    } else {
      remaining.push(order);
    }
  });

  acc.pendingOrders = remaining;
  saveState();
}

function triggerFastDividend(acc) {
  const holdingKeys = Object.keys(acc.holdings);
  if (!holdingKeys.length) return;

  const randomTicker = holdingKeys[Math.floor(Math.random() * holdingKeys.length)];
  const h = acc.holdings[randomTicker];
  if (!h) return;

  const divPerShare = h.market === 'us' ? (Math.random() * 1.5 + 0.2) : (Math.floor(Math.random() * 500) + 100);
  const totalDiv = divPerShare * h.qty;

  if (h.market === 'us') {
    acc.usdCash = (acc.usdCash || 0) + totalDiv;
    showToast(`[배당금 입금] ${h.name} $${totalDiv.toFixed(2)} 달러 입금 완료`);
  } else {
    acc.krwCash = (acc.krwCash || 0) + totalDiv;
    showToast(`[배당금 입금] ${h.name} KRW ${Math.round(totalDiv).toLocaleString()}원 입금 완료`);
  }

  acc.dividendHistory = acc.dividendHistory || [];
  acc.dividendHistory.unshift({
    ticker: h.ticker,
    name: h.name,
    amount: totalDiv,
    market: h.market,
    timestamp: Date.now()
  });

  saveState();
}

// ── Trade Execution Core (Real Fees & Securities Taxes Included) ──
function executeTrade(acc, ticker, orderType, qty, tradePrice, market) {
  const isUsd = market === 'us';
  const baseAmount = tradePrice * qty;

  // Brokerage Fee & Tax Rates
  const feeRate = isUsd ? 0.0007 : 0.00015; // US: 0.07%, KR: 0.015%
  const feeAmount = baseAmount * feeRate;
  const taxAmount = (orderType === 'sell' && !isUsd) ? baseAmount * 0.0018 : 0; // KR Sell Tax: 0.18%
  
  const netBuyCost = baseAmount + feeAmount;
  const netSellProceeds = baseAmount - feeAmount - taxAmount;

  acc.totalFeesPaid = (acc.totalFeesPaid || 0) + (isUsd ? feeAmount * MockState.liveRate : feeAmount) + (isUsd ? 0 : taxAmount);

  if (orderType === 'buy') {
    if (isUsd) {
      if ((acc.usdCash || 0) < netBuyCost) {
        // Auto Currency Conversion from KRW if needed
        const neededUsd = netBuyCost - (acc.usdCash || 0);
        const neededKrw = neededUsd * MockState.liveRate;
        if (acc.krwCash < neededKrw) {
          showToast('주문 필요 예수금(달러 수수료 포함)이 부족합니다.');
          return false;
        }
        acc.krwCash -= neededKrw;
        acc.usdCash = 0;
      } else {
        acc.usdCash -= netBuyCost;
      }
    } else {
      if (acc.krwCash < netBuyCost) {
        showToast('주문 필요 원화 예수금(수수료 포함)이 부족합니다.');
        return false;
      }
      acc.krwCash -= netBuyCost;
    }

    // Holdings update (Moving Average Price)
    if (!acc.holdings[ticker]) {
      acc.holdings[ticker] = {
        ticker: ticker,
        name: MockState.quotes[ticker]?.name || ticker,
        qty: qty,
        avgPrice: tradePrice,
        market: market,
      };
    } else {
      const h = acc.holdings[ticker];
      const oldTotal = h.qty * h.avgPrice;
      const newTotal = oldTotal + baseAmount;
      h.qty += qty;
      h.avgPrice = newTotal / h.qty;
    }
  } else if (orderType === 'sell') {
    const h = acc.holdings[ticker];
    if (!h || h.qty < qty) {
      showToast('매도 가능한 보유 수량이 부족합니다.');
      return false;
    }

    const netPnl = netSellProceeds - (h.avgPrice * qty);
    h.qty -= qty;
    if (h.qty === 0) delete acc.holdings[ticker];

    if (isUsd) acc.usdCash = (acc.usdCash || 0) + netSellProceeds;
    else acc.krwCash += netSellProceeds;

    acc.realizedPnl = acc.realizedPnl || [];
    acc.realizedPnl.unshift({
      ticker: ticker,
      name: h.name,
      pnl: netPnl,
      fee: feeAmount,
      tax: taxAmount,
      market: market,
      timestamp: Date.now()
    });
  }

  acc.executedOrders = acc.executedOrders || [];
  acc.executedOrders.unshift({
    id: 'ord_' + Date.now(),
    ticker: ticker,
    name: MockState.quotes[ticker]?.name || ticker,
    type: orderType,
    qty: qty,
    price: tradePrice,
    fee: feeAmount,
    tax: taxAmount,
    market: market,
    timestamp: Date.now()
  });

  saveState();
  return true;
}

function executeManualExchange(fromCurrency, amount) {
  const acc = getActiveAccount();
  if (!acc || amount <= 0) return;

  if (fromCurrency === 'KRW') {
    if (acc.krwCash < amount) {
      showToast('환전할 원화 잔고가 부족합니다.');
      return;
    }
    const acquiredUSD = amount / MockState.liveRate;
    acc.krwCash -= amount;
    acc.usdCash = (acc.usdCash || 0) + acquiredUSD;
    showToast(`KRW ${Math.floor(amount).toLocaleString()} -> USD ${acquiredUSD.toFixed(2)} 환전 완료`);
  } else {
    if ((acc.usdCash || 0) < amount) {
      showToast('환전할 달러 잔고가 부족합니다.');
      return;
    }
    const acquiredKRW = amount * MockState.liveRate;
    acc.usdCash -= amount;
    acc.krwCash += acquiredKRW;
    showToast(`USD ${amount.toFixed(2)} -> KRW ${Math.floor(acquiredKRW).toLocaleString()} 환전 완료`);
  }

  saveState();
  closeModal('exchangeModal');
  renderApp();
}

// ── Application Main Renderer ──
let currentMockSidebarMarket = 'kr';
let currentMockSidebarQuery = '';

function switchMockSidebarMarket(market, btn) {
  currentMockSidebarMarket = market;
  if (btn) {
    document.querySelectorAll('.market-tabs .market-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderMockSidebar();
}

function handleSidebarMockSearch(query) {
  currentMockSidebarQuery = query;
  renderMockSidebar();
}

function renderMockSidebar() {
  const container = document.getElementById('mockSidebarStockList');
  if (!container) return;

  const q = (currentMockSidebarQuery || '').trim().toLowerCase();
  let list = MOCK_STOCK_DEFS;

  if (currentMockSidebarMarket === 'kr') {
    list = list.filter(s => s.market === 'kr');
  } else if (currentMockSidebarMarket === 'us') {
    list = list.filter(s => s.market === 'us');
  } else if (currentMockSidebarMarket === 'favorites') {
    list = list.filter(s => MockState.watchlist.has(s.id));
  }

  if (q) {
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q));
  }

  if (!list.length) {
    container.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--muted);font-size:12.5px">종목이 없습니다.</div>`;
    return;
  }

  let html = '';
  list.forEach(def => {
    const qObj = MockState.quotes[def.id] || def;
    const up = qObj.changePct >= 0;
    const sym = def.market === 'kr' ? '₩' : '$';
    const priceStr = def.market === 'kr' ? Math.round(qObj.price).toLocaleString() : qObj.price.toFixed(2);
    const chgStr = `${up ? '+' : ''}${qObj.changePct.toFixed(2)}%`;
    const isActive = MockState.activeDetailStock === def.id;

    html += `
      <div class="stock-item ${isActive ? 'active' : ''}" onclick="openStockDetailModal('${def.id}')">
        <div class="stock-left">
          <div class="ticker">${def.name}</div>
          <div class="sname">${def.ticker} · ${def.exchange}</div>
        </div>
        <div class="stock-right">
          <div class="sprice">${sym}${priceStr}</div>
          <div class="schange ${up ? 'up' : 'down'}">${chgStr}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderApp() {
  const acc = getActiveAccount();
  const root = document.getElementById('appMainRoot');
  if (!root) return;

  renderMockSidebar();

  if (!acc && Object.keys(MockState.accounts).length === 0) {
    renderAccountCreationPage(root, 'realtime', false);
    return;
  }

  renderAccountDropdown();
  renderHeroSummary();

  const mainTabContent = document.getElementById('mainTabContent');
  if (!mainTabContent) return;

  if (MockState.currentTab === 'base') {
    renderBaseDashboard(mainTabContent);
    setTimeout(initPortfolioChart, 50);
  }
  else if (MockState.currentTab === 'watchlist') renderWatchlistPage(mainTabContent);
  else if (MockState.currentTab === 'discovery') renderDiscoveryPage(mainTabContent);
  else if (MockState.currentTab === 'bonds') renderBondsPage(mainTabContent);
  else if (MockState.currentTab === 'analytics') renderAnalyticsPage(mainTabContent);
  else if (MockState.currentTab === 'orders') renderOrdersPage(mainTabContent);
  else if (MockState.currentTab === 'feed') renderFeedPage(mainTabContent);
  else if (MockState.currentTab === 'exchange') renderExchangePage(mainTabContent);
}

// ── Full-Page Account Creation Screen (No Emojis) ──
function renderAccountCreationPage(container, defaultMode, isSecond) {
  const modeToShow = defaultMode || 'realtime';
  MockState.setupModeType = modeToShow;

  let html = `
    <div class="full-page-setup">
      <div class="setup-header">
        <div style="font-size:24px; font-weight:900; color:var(--text);">StockLens 모의투자 계좌 개설</div>
        <div style="font-size:14px; color:var(--muted); margin-top:6px;">
          ${isSecond ? '두 번째 계좌 개설을 위해 투자의 방식을 선택하고 초기 모의 예수금을 설정하세요.' : '모의투자를 시작하기 위해 투자 방식과 초기 모의 예수금을 설정합니다.'}
        </div>
      </div>

      <!-- Step 1: Investment Mode Selection -->
      <div style="margin-bottom:28px;">
        <div style="font-size:13px; font-weight:800; color:var(--muted); margin-bottom:12px;">STEP 1. 투자 방식 선택</div>
        
        <div class="setup-mode-grid">
  `;

  if (!isSecond || !MockState.accounts['realtime']) {
    html += `
      <div id="setup_opt_realtime" class="setup-mode-card ${MockState.setupModeType === 'realtime' ? 'selected' : ''}" onclick="selectSetupMode('realtime')">
        <div class="setup-mode-title">실시간 실전형 계좌 (Real-Time Mode)</div>
        <div class="setup-mode-desc">
          실제 KOSPI 및 NASDAQ 개장 시간에 맞춰 실시간 주가, 호가, 거래량 데이터로 거래합니다. 실제 시장 수익률과 동일한 환경의 장기 시뮬레이션입니다.
        </div>
      </div>
    `;
  }

  if (!isSecond || !MockState.accounts['virtual']) {
    html += `
      <div id="setup_opt_virtual" class="setup-mode-card ${MockState.setupModeType === 'virtual' ? 'selected' : ''}" onclick="selectSetupMode('virtual')">
        <div class="setup-mode-title">가상상황 쾌속형 계좌 (Virtual Scenario Mode)</div>
        <div class="setup-mode-desc">
          30분 동안 신속하고 다이나믹하게 모의투자를 진행할 수 있습니다. 주가 변동성이 높고, 자동 배당금 입금 및 가상 호가가 적용되는 쾌속 모드입니다.
        </div>
      </div>
    `;
  }

  html += `
        </div>
      </div>

      <!-- Step 2: Capital Selection -->
      <div style="margin-bottom:32px;">
        <div style="font-size:13px; font-weight:800; color:var(--muted); margin-bottom:12px;">STEP 2. 초기 모의 예수금 지원 선택</div>

        <div class="capital-btn-grid">
          <div class="capital-btn ${MockState.setupCapitalAmount === 1000000 ? 'selected' : ''}" onclick="selectSetupCapital(1000000, this)">
            <div>KRW 100만원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">소액 스타트 펀드</div>
          </div>
          <div class="capital-btn ${MockState.setupCapitalAmount === 10000000 ? 'selected' : ''}" onclick="selectSetupCapital(10000000, this)">
            <div>KRW 1,000만원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">표준 연습 펀드 (추천)</div>
          </div>
          <div class="capital-btn ${MockState.setupCapitalAmount === 100000000 ? 'selected' : ''}" onclick="selectSetupCapital(100000000, this)">
            <div>KRW 1억원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">다각화 포트폴리오</div>
          </div>
          <div class="capital-btn ${MockState.setupCapitalAmount === 1000000000 ? 'selected' : ''}" onclick="selectSetupCapital(1000000000, this)">
            <div>KRW 10억원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">초대형 퀀트 펀드</div>
          </div>
        </div>
      </div>

      <button class="primary-action-btn" onclick="finishFullPageAccountCreation()">계좌 개설 완료 및 모의투자 시작하기</button>
    </div>
  `;

  container.innerHTML = html;
}

function selectSetupMode(mode) {
  MockState.setupModeType = mode;
  document.querySelectorAll('.setup-mode-card').forEach(c => c.classList.remove('selected'));
  const el = document.getElementById(`setup_opt_${mode}`);
  if (el) el.classList.add('selected');
}

function selectSetupCapital(amt, el) {
  MockState.setupCapitalAmount = amt;
  document.querySelectorAll('.capital-btn').forEach(b => b.classList.remove('selected'));
  if (el) el.classList.add('selected');
}

function finishFullPageAccountCreation() {
  createAccount(MockState.setupModeType, MockState.setupCapitalAmount);
  renderApp();
}

function triggerSecondAccountSetup() {
  toggleAccountDropdown(false);
  const remainingMode = MockState.accounts['realtime'] ? 'virtual' : 'realtime';
  const root = document.getElementById('appMainRoot');
  if (root) renderAccountCreationPage(root, remainingMode, true);
}

// ── Dropdown & Header Renderers ──
function renderAccountDropdown() {
  const acc = getActiveAccount();
  const titleEl = document.getElementById('activeAccountTitle');
  const badgeEl = document.getElementById('activeAccountBadge');
  const listEl = document.getElementById('accountDropdownList');

  if (titleEl) titleEl.textContent = acc.name;
  if (badgeEl) {
    badgeEl.textContent = acc.type === 'realtime' ? '실전형' : '쾌속형';
    badgeEl.className = `account-mode-tag ${acc.type === 'realtime' ? 'tag-realtime' : 'tag-virtual'}`;
  }

  if (listEl) {
    let html = '';
    const keys = Object.keys(MockState.accounts);
    keys.forEach(k => {
      const a = MockState.accounts[k];
      const isCurrent = k === MockState.activeAccountId;
      html += `
        <div class="dropdown-item ${isCurrent ? 'active' : ''}" onclick="switchActiveAccount('${k}')">
          <div>
            <div style="font-weight:800; font-size:13px;">${a.name}</div>
            <div style="font-size:11px; color:var(--muted);">KRW ${Math.floor(a.krwCash).toLocaleString()}원</div>
          </div>
          <span class="account-mode-tag ${a.type === 'realtime' ? 'tag-realtime' : 'tag-virtual'}">
            ${a.type === 'realtime' ? '실전형' : '쾌속형'}
          </span>
        </div>
      `;
    });

    if (keys.length < 2) {
      const remType = keys.includes('realtime') ? 'virtual' : 'realtime';
      const remLabel = remType === 'realtime' ? '실시간 실전 계좌' : '가상상황 쾌속 계좌';
      html += `
        <button class="dropdown-add-btn" onclick="triggerSecondAccountSetup()">
          + ${remLabel} 개설하기
        </button>
      `;
    }
    listEl.innerHTML = html;
  }
}

function switchActiveAccount(accId) {
  MockState.activeAccountId = accId;
  toggleAccountDropdown(false);
  saveState();
  showToast(`[${MockState.accounts[accId].name}]로 계좌가 전환되었습니다.`);
  renderApp();
}

function toggleAccountDropdown(forceState) {
  const menu = document.getElementById('accountDropdownMenu');
  if (!menu) return;
  if (typeof forceState === 'boolean') menu.classList.toggle('active', forceState);
  else menu.classList.toggle('active');
}

function renderHeroSummary() {
  const acc = getActiveAccount();
  if (!acc) return;

  let totalStockKRW = 0;
  let totalCostKRW = 0;

  Object.values(acc.holdings).forEach(h => {
    const q = MockState.quotes[h.ticker] || { price: h.avgPrice };
    const isUsd = h.market === 'us';
    const curKRW = isUsd ? (q.price * h.qty * MockState.liveRate) : (q.price * h.qty);
    const costKRW = isUsd ? (h.avgPrice * h.qty * MockState.liveRate) : (h.avgPrice * h.qty);

    totalStockKRW += curKRW;
    totalCostKRW += costKRW;
  });

  const krwCash = acc.krwCash || 0;
  const usdCashKRW = (acc.usdCash || 0) * MockState.liveRate;
  const grandTotalKRW = krwCash + usdCashKRW + totalStockKRW;
  const totalPnlKRW = totalStockKRW - totalCostKRW;
  const totalReturnPct = totalCostKRW > 0 ? (totalPnlKRW / totalCostKRW) * 100 : 0;

  const totalInvEl = document.getElementById('totalInvestmentAmount');
  const pnlEl = document.getElementById('totalPnlRow');
  const krwValEl = document.getElementById('krwCashVal');
  const usdValEl = document.getElementById('usdCashVal');

  if (totalInvEl) totalInvEl.textContent = `KRW ${Math.floor(totalStockKRW).toLocaleString()}원 (총 자산: KRW ${Math.floor(grandTotalKRW).toLocaleString()}원)`;
  if (pnlEl) {
    const upClass = totalPnlKRW > 0 ? 'up' : (totalPnlKRW < 0 ? 'down' : 'flat');
    const sign = totalPnlKRW > 0 ? '+' : '';
    pnlEl.className = `hero-pnl-row ${upClass}`;
    pnlEl.innerHTML = `평가손익: ${sign}KRW ${Math.round(totalPnlKRW).toLocaleString()}원 (${sign}${totalReturnPct.toFixed(2)}%)`;
  }

  if (krwValEl) krwValEl.textContent = `KRW ${Math.floor(krwCash).toLocaleString()}원`;
  if (usdValEl) usdValEl.textContent = `USD ${(acc.usdCash || 0).toFixed(2)}`;
}

// ── Base Dashboard View (`기본 화면 / 보유주식`) ──
function renderBaseDashboard(container) {
  const acc = getActiveAccount();
  if (!acc) return;

  const holdingItems = Object.values(acc.holdings).filter(h => {
    if (MockState.holdingFilter === 'kr') return h.market === 'kr';
    if (MockState.holdingFilter === 'us') return h.market === 'us';
    return true;
  });

  holdingItems.sort((a, b) => {
    const qA = MockState.quotes[a.ticker] || { price: a.avgPrice, changePct: 0 };
    const qB = MockState.quotes[b.ticker] || { price: b.avgPrice, changePct: 0 };
    const retA = ((qA.price - a.avgPrice) / a.avgPrice) * 100;
    const retB = ((qB.price - b.avgPrice) / b.avgPrice) * 100;
    const valA = qA.price * a.qty * (a.market === 'us' ? MockState.liveRate : 1);
    const valB = qB.price * b.qty * (b.market === 'us' ? MockState.liveRate : 1);

    if (MockState.sortOrder === 'return_desc') return retB - retA;
    if (MockState.sortOrder === 'return_asc') return retA - retB;
    if (MockState.sortOrder === 'val_desc') return valB - valA;
    if (MockState.sortOrder === 'val_asc') return valA - valB;
    if (MockState.sortOrder === 'daily_desc') return qB.changePct - qA.changePct;
    if (MockState.sortOrder === 'daily_asc') return qA.changePct - qB.changePct;
    return a.name.localeCompare(b.name, 'ko');
  });

  const totalFeesVal = Math.round(acc.totalFeesPaid || 0);

  let html = `
    <!-- Portfolio Risk & Transaction Analytics Bar -->
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:24px;">
      <div class="card" style="padding:14px; text-align:center;">
        <div style="font-size:11px; font-weight:700; color:var(--muted);">누적 수수료 & 제세금</div>
        <div style="font-size:15px; font-weight:900; color:var(--text); margin-top:4px;">KRW ${totalFeesVal.toLocaleString()}원</div>
      </div>
      <div class="card" style="padding:14px; text-align:center;">
        <div style="font-size:11px; font-weight:700; color:var(--muted);">샤프 지수 (Sharpe Ratio)</div>
        <div style="font-size:15px; font-weight:900; color:var(--accent); margin-top:4px;">1.84 (우수)</div>
      </div>
      <div class="card" style="padding:14px; text-align:center;">
        <div style="font-size:11px; font-weight:700; color:var(--muted);">최대 낙폭 (MDD)</div>
        <div style="font-size:15px; font-weight:900; color:var(--down-color); margin-top:4px;">-4.12%</div>
      </div>
      <div class="card" style="padding:14px; text-align:center;">
        <div style="font-size:11px; font-weight:700; color:var(--muted);">포트폴리오 자산 베타</div>
        <div style="font-size:15px; font-weight:900; color:var(--green); margin-top:4px;">1.05 (시장 추종)</div>
      </div>
    </div>

    <!-- Holdings Section Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div style="font-size:18px; font-weight:900; color:var(--text);">보유 주식 목록</div>

      <div class="controls-bar" style="margin-bottom:0;">
        <div class="filter-pills">
          <button class="pill-btn ${MockState.holdingFilter === 'all' ? 'active' : ''}" onclick="setHoldingFilter('all')">전체</button>
          <button class="pill-btn ${MockState.holdingFilter === 'kr' ? 'active' : ''}" onclick="setHoldingFilter('kr')">국내주식</button>
          <button class="pill-btn ${MockState.holdingFilter === 'us' ? 'active' : ''}" onclick="setHoldingFilter('us')">해외주식</button>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <div class="filter-pills">
            <button class="pill-btn ${MockState.currencyView === 'krw' ? 'active' : ''}" onclick="setCurrencyView('krw')">원화(KRW)</button>
            <button class="pill-btn ${MockState.currencyView === 'usd' ? 'active' : ''}" onclick="setCurrencyView('usd')">달러(USD)</button>
          </div>

          <select class="select-control" onchange="setSortOrder(this.value)">
            <option value="val_desc" ${MockState.sortOrder === 'val_desc' ? 'selected' : ''}>평가금 높은순</option>
            <option value="val_asc" ${MockState.sortOrder === 'val_asc' ? 'selected' : ''}>평가금 낮은순</option>
            <option value="return_desc" ${MockState.sortOrder === 'return_desc' ? 'selected' : ''}>총 수익률 높은순</option>
            <option value="return_asc" ${MockState.sortOrder === 'return_asc' ? 'selected' : ''}>총 수익률 낮은순</option>
            <option value="daily_desc" ${MockState.sortOrder === 'daily_desc' ? 'selected' : ''}>일간 수익률 높은순</option>
            <option value="daily_asc" ${MockState.sortOrder === 'daily_asc' ? 'selected' : ''}>일간 수익률 낮은순</option>
            <option value="name_asc" ${MockState.sortOrder === 'name_asc' ? 'selected' : ''}>가나다순</option>
          </select>
        </div>
      </div>
    </div>
  `;

  if (!holdingItems.length) {
    html += `
      <div class="card empty-state-box" style="margin-bottom:32px;">
        <div style="font-size:16px; font-weight:800; color:var(--text); margin-bottom:4px;">보유 중인 주식이 없습니다</div>
        <div style="font-size:13px; color:var(--muted);">[발견 / 종목 탐색] 탭에서 마음에 드는 종목을 선택해 첫 매수를 시작해보세요.</div>
      </div>
    `;
  } else {
    html += `
      <div class="base-dashboard-grid" style="display:grid; grid-template-columns: 1fr 1.6fr; gap: 24px; margin-bottom:32px; align-items: start;">
        <!-- Left Column: Portfolio Asset Allocation Doughnut Chart -->
        <div class="card" style="padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 380px;">
          <div style="font-size: 14px; font-weight: 800; color: var(--text); align-self: flex-start; margin-bottom: 16px;">자산 포트폴리오 비중</div>
          <div style="width: 100%; height: 260px; position: relative;">
            <canvas id="portfolioChart"></canvas>
          </div>
        </div>

        <!-- Right Column: Holdings Stock List -->
        <div style="display:flex; flex-direction:column; gap:12px;">
    `;

    holdingItems.forEach(h => {
      const q = MockState.quotes[h.ticker] || { price: h.avgPrice, changePct: 0 };
      const isUsdStock = h.market === 'us';
      const isShowUsd = MockState.currencyView === 'usd' && isUsdStock;

      const curPrice = q.price;
      const pnlPct = ((curPrice - h.avgPrice) / h.avgPrice) * 100;

      let displayPriceStr, displayValStr, displayAvgStr;
      if (isUsdStock) {
        if (isShowUsd) {
          displayPriceStr = `$${curPrice.toFixed(2)}`;
          displayAvgStr = `$${h.avgPrice.toFixed(2)}`;
          displayValStr = `$${(curPrice * h.qty).toFixed(2)}`;
        } else {
          displayPriceStr = `KRW ${Math.round(curPrice * MockState.liveRate).toLocaleString()}`;
          displayAvgStr = `KRW ${Math.round(h.avgPrice * MockState.liveRate).toLocaleString()}`;
          displayValStr = `KRW ${Math.round(curPrice * h.qty * MockState.liveRate).toLocaleString()}`;
        }
      } else {
        displayPriceStr = `KRW ${Math.round(curPrice).toLocaleString()}`;
        displayAvgStr = `KRW ${Math.round(h.avgPrice).toLocaleString()}`;
        displayValStr = `KRW ${Math.round(curPrice * h.qty).toLocaleString()}`;
      }

      const upClass = pnlPct > 0 ? 'up' : (pnlPct < 0 ? 'down' : 'flat');
      const sign = pnlPct > 0 ? '+' : '';

      html += `
        <div class="stock-row-card" onclick="openStockDetailModal('${h.ticker}')" style="margin-bottom:0;">
          <div class="stock-info-left">
            <div class="stock-icon-avatar">${h.name.substring(0, 1)}</div>
            <div>
              <div class="stock-name-title">${h.name} <span style="font-size:12px; font-weight:600; color:var(--muted);">${h.ticker}</span></div>
              <div class="stock-sub-desc">${h.qty}주 보유 · 평단가 ${displayAvgStr}</div>
            </div>
          </div>
          <div class="stock-val-right">
            <div class="stock-price-main">${displayValStr}</div>
            <div class="stock-change-sub ${upClass}">${sign}${pnlPct.toFixed(2)}% (${displayPriceStr})</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  // Section 2: Orders History Ledger
  html += `
    <div class="card" style="margin-bottom:24px;">
      <div style="font-size:16px; font-weight:900; margin-bottom:14px; color:var(--text);">주문 내역 (대기 중 & 최근 체결)</div>
  `;

  if (acc.pendingOrders && acc.pendingOrders.length) {
    acc.pendingOrders.forEach(o => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
          <div>
            <span style="font-weight:800; font-size:14px;">${o.name}</span>
            <span class="badge-mock" style="margin-left:6px;">${o.type === 'buy' ? '매수대기' : '매도대기'}</span>
            <div style="font-size:12px; color:var(--muted);">${o.qty}주 @ ${o.market === 'us' ? '$' + o.price.toFixed(2) : 'KRW ' + o.price.toLocaleString() + '원'}</div>
          </div>
          <button onclick="cancelPendingOrder('${o.id}')" style="padding:5px 12px; background:var(--surface3); border:none; border-radius:6px; font-size:12px; font-weight:700; color:var(--up-color); cursor:pointer;">주문취소</button>
        </div>
      `;
    });
  } else {
    html += `<div style="font-size:13px; color:var(--muted); padding:8px 0;">현재 미체결 대기 중인 지정가 주문이 없습니다.</div>`;
  }
  html += `</div>`;

  // Section 3: Dividend History Log
  html += `
    <div class="card">
      <div style="font-size:16px; font-weight:900; margin-bottom:14px; color:var(--text);">배당금 수령 히스토리</div>
  `;
  if (acc.dividendHistory && acc.dividendHistory.length) {
    acc.dividendHistory.slice(0, 5).forEach(d => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
          <div>
            <span style="font-weight:800; font-size:14px;">${d.name}</span>
            <div style="font-size:11px; color:var(--muted);">${new Date(d.timestamp).toLocaleTimeString('ko-KR')}</div>
          </div>
          <div style="font-weight:800; color:var(--accent); font-size:14px;">
            +${d.market === 'us' ? '$' + d.amount.toFixed(2) : 'KRW ' + Math.round(d.amount).toLocaleString() + '원'}
          </div>
        </div>
      `;
    });
  } else {
    html += `<div style="font-size:13px; color:var(--muted); padding:8px 0;">지급 수령된 배당금이 없습니다.</div>`;
  }
  html += `</div>`;

  container.innerHTML = html;
}

function setHoldingFilter(f) { MockState.holdingFilter = f; renderApp(); }
function setCurrencyView(c) { MockState.currencyView = c; renderApp(); }
function setSortOrder(o) { MockState.sortOrder = o; renderApp(); }

// ── Watchlist Page (`관심`) ──
function renderWatchlistPage(container) {
  const favIds = Array.from(MockState.watchlist);
  let html = `<div style="font-size:18px; font-weight:900; margin-bottom:16px;">관심 종목 목록 (${favIds.length}개)</div>`;

  if (!favIds.length) {
    html += `<div class="card empty-state-box">등록된 관심 종목이 없습니다. 종목 탐색에서 관심 버튼을 눌러 관심종목을 등록해보세요!</div>`;
  } else {
    favIds.forEach(id => {
      const q = MockState.quotes[id] || MOCK_STOCK_DEFS.find(s => s.id === id);
      if (!q) return;
      const upClass = q.changePct > 0 ? 'up' : (q.changePct < 0 ? 'down' : 'flat');
      const sign = q.changePct > 0 ? '+' : '';

      html += `
        <div class="stock-row-card" onclick="openStockDetailModal('${q.id}')">
          <div class="stock-info-left">
            <div class="stock-icon-avatar">${q.name.substring(0, 1)}</div>
            <div>
              <div class="stock-name-title">${q.name}</div>
              <div class="stock-sub-desc">${q.category} · ${q.id}</div>
            </div>
          </div>
          <div class="stock-val-right" style="display:flex; align-items:center; gap:16px;">
            <div>
              <div class="stock-price-main">${q.market === 'us' ? '$' + q.price.toFixed(2) : 'KRW ' + Math.round(q.price).toLocaleString() + '원'}</div>
              <div class="stock-change-sub ${upClass}">${sign}${q.changePct.toFixed(2)}%</div>
            </div>
            <button onclick="event.stopPropagation(); toggleWatchlist('${q.id}')" class="pill-btn active" style="font-size:12px; font-weight:700;">
              관심 해제
            </button>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// ── Discovery Feed & Leaderboard Screener (`발견 / 종목 탐색`) ──
function renderDiscoveryPage(container) {
  const categoryFilter = MockState.discoveryCategory;
  const filteredDefs = MOCK_STOCK_DEFS.filter(s => {
    if (categoryFilter === 'us') return s.market === 'us';
    if (categoryFilter === 'kr') return s.market === 'kr';
    if (categoryFilter === 'bond') return s.category === '채권';
    if (categoryFilter === 'etf') return s.category === 'ETF';
    return true;
  });

  filteredDefs.sort((a, b) => {
    const qA = MockState.quotes[a.id] || a;
    const qB = MockState.quotes[b.id] || b;
    if (MockState.discoveryRankType === 'up') return qB.changePct - qA.changePct;
    if (MockState.discoveryRankType === 'down') return qA.changePct - qB.changePct;
    if (MockState.discoveryRankType === 'val') return (qB.price * (b.market === 'us' ? MockState.liveRate : 1)) - (qA.price * (a.market === 'us' ? MockState.liveRate : 1));
    return b.valScore - a.valScore;
  });

  let html = `
    <!-- Live Market Indices Overview -->
    <div class="indices-banner-grid">
      <div class="index-card">
        <div class="index-name">S&P 500 선물</div>
        <div class="index-val">7,497.75</div>
        <div class="index-change down" style="font-size:12px; font-weight:700;">-1.0%</div>
      </div>
      <div class="index-card">
        <div class="index-name">나스닥 종합</div>
        <div class="index-val">25,520.24</div>
        <div class="index-change down" style="font-size:12px; font-weight:700;">-1.3%</div>
      </div>
      <div class="index-card">
        <div class="index-name">KOSPI 지수</div>
        <div class="index-val">2,845.30</div>
        <div class="index-change up" style="font-size:12px; font-weight:700;">+0.85%</div>
      </div>
      <div class="index-card">
        <div class="index-name">KOSDAQ 지수</div>
        <div class="index-val">842.10</div>
        <div class="index-change up" style="font-size:12px; font-weight:700;">+0.48%</div>
      </div>
    </div>

    <!-- Category Filter Badges (No Emojis) -->
    <div class="category-badges-row">
      <div class="cat-badge ${categoryFilter === 'all' ? 'active' : ''}" onclick="setDiscoveryCategory('all')">전체 종목</div>
      <div class="cat-badge ${categoryFilter === 'us' ? 'active' : ''}" onclick="setDiscoveryCategory('us')">해외주식</div>
      <div class="cat-badge ${categoryFilter === 'kr' ? 'active' : ''}" onclick="setDiscoveryCategory('kr')">국내주식</div>
      <div class="cat-badge ${categoryFilter === 'bond' ? 'active' : ''}" onclick="setDiscoveryCategory('bond')">채권</div>
      <div class="cat-badge ${categoryFilter === 'etf' ? 'active' : ''}" onclick="setDiscoveryCategory('etf')">ETF</div>
    </div>

    <!-- News Ticker Banner -->
    <div class="news-ticker-card">
      <div class="news-ticker-text">
        <span class="tag-news">실시간 이슈</span>
        <span>알파벳 실적 시험대 · 2분기 주요 기술주 경제성장률(GDP) 발표 속보치 임박</span>
      </div>
      <span style="font-size:12px; color:var(--accent); font-weight:700; cursor:pointer;">전체보기 ></span>
    </div>

    <!-- Leaderboard Sorting Tabs -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div style="font-size:18px; font-weight:900; color:var(--text);">실시간 종목 랭킹</div>

      <div class="filter-pills">
        <button class="pill-btn ${MockState.discoveryRankType === 'val' ? 'active' : ''}" onclick="setDiscoveryRankType('val')">거래대금</button>
        <button class="pill-btn ${MockState.discoveryRankType === 'up' ? 'active' : ''}" onclick="setDiscoveryRankType('up')">급상승</button>
        <button class="pill-btn ${MockState.discoveryRankType === 'down' ? 'active' : ''}" onclick="setDiscoveryRankType('down')">급하락</button>
      </div>
    </div>
  `;

  filteredDefs.forEach((s, idx) => {
    const q = MockState.quotes[s.id] || s;
    const upClass = q.changePct > 0 ? 'up' : (q.changePct < 0 ? 'down' : 'flat');
    const sign = q.changePct > 0 ? '+' : '';
    const isFav = MockState.watchlist.has(s.id);

    html += `
      <div class="stock-row-card" onclick="openStockDetailModal('${s.id}')">
        <div class="stock-info-left">
          <div style="font-size:15px; font-weight:900; color:var(--muted); width:24px;">${idx + 1}</div>
          <div class="stock-icon-avatar">${s.name.substring(0, 1)}</div>
          <div>
            <div class="stock-name-title">${s.name}</div>
            <div class="stock-sub-desc">${s.category} · ${s.id}</div>
          </div>
        </div>
        <div class="stock-val-right" style="display:flex; align-items:center; gap:16px;">
          <div>
            <div class="stock-price-main">${s.market === 'us' ? '$' + q.price.toFixed(2) : 'KRW ' + Math.round(q.price).toLocaleString() + '원'}</div>
            <div class="stock-change-sub ${upClass}">${sign}${q.changePct.toFixed(2)}%</div>
          </div>
          <button onclick="event.stopPropagation(); toggleWatchlist('${s.id}')" class="pill-btn ${isFav ? 'active' : ''}" style="font-size:12px; font-weight:700;">
            ${isFav ? '관심등록됨' : '관심추가'}
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function setDiscoveryCategory(cat) { MockState.discoveryCategory = MockState.discoveryCategory === cat ? 'all' : cat; renderApp(); }
function setDiscoveryRankType(type) { MockState.discoveryRankType = type; renderApp(); }

// ── Feed / Community Page (`피드` - Interactive Post & Discussion) ──
function renderFeedPage(container) {
  if (!MockState.feedItems) {
    MockState.feedItems = [
      { id: 1, name: '엔비디아 (NVDA) 피드', content: '블랙웰 차세대 칩 수요 폭발적인 증가 지속. 미국주식 핵심 롱 포지션입니다.', author: '해외투자 전문가', time: '1분 전', logo: 'NV' },
      { id: 2, name: 'SK하이닉스 실시간 피드', content: 'HBM3E 공급 확대로 하반기 영업이익 최고치 달성이 기대됩니다. 금일 기관 매집세 유입.', author: '반도체 애널리스트', time: '5분 전', logo: 'SK' },
      { id: 3, name: '테슬라 (TSLA) 피드', content: '로보택시 공개 일정 카운트다운 진입. 자율주행 소프트웨어 성장세에 집중해야 할 때.', author: '테슬라 롱러너', time: '12분 전', logo: 'TS' }
    ];
  }

  let feedHtml = '';
  MockState.feedItems.forEach(item => {
    feedHtml += `
      <div class="stock-row-card" style="cursor:default; margin-bottom:12px; border:1px solid var(--border); background:var(--surface);">
        <div class="stock-info-left" style="align-items:flex-start;">
          <div class="stock-icon-avatar" style="background:var(--accent-light); color:var(--accent); font-weight:900;">${item.logo || 'ST'}</div>
          <div>
            <div style="font-size:14px; font-weight:800; color:var(--text);">${item.name}</div>
            <div style="font-size:12px; color:var(--muted); margin-bottom:6px;">작성자: ${item.author} · ${item.time}</div>
            <div style="font-size:13.5px; color:var(--text2); line-height:1.5;">${item.content}</div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div style="max-width:640px; margin:0 auto;">
      <!-- Post Opinion Card -->
      <div class="card" style="margin-bottom:20px; padding:20px;">
        <div style="font-size:16px; font-weight:900; margin-bottom:12px;">주주 토론 의견 남기기</div>
        
        <div style="display:flex; gap:10px; margin-bottom:12px;">
          <select id="feedStockSelect" class="select-control" style="flex:1; padding:8px;">
            <option value="삼성전자|005930|SS">삼성전자</option>
            <option value="SK하이닉스|000660|SK">SK하이닉스</option>
            <option value="엔비디아 (NVDA)|NVDA|NV">엔비디아 (NVIDIA)</option>
            <option value="애플 (AAPL)|AAPL|AP">애플 (Apple)</option>
            <option value="테슬라 (TSLA)|TSLA|TS">테슬라 (Tesla)</option>
            <option value="S&P 500 ETF (SPY)|SPY|SP">S&P 500 ETF (SPY)</option>
          </select>
          <input type="text" id="feedNicknameInput" class="select-control" style="flex:1; padding:8px;" placeholder="닉네임 (기본: 익명주주)" value="익명주주">
        </div>

        <div style="margin-bottom:12px;">
          <textarea id="feedContentInput" class="select-control" style="width:100%; height:80px; padding:12px; font-size:13.5px; resize:none; font-family:inherit; outline:none;" placeholder="종목에 대한 견해를 공유해보세요. 주주들과 나눈 대화는 시뮬레이션에 유익합니다."></textarea>
        </div>

        <div style="text-align:right;">
          <button class="primary-action-btn" onclick="submitFeedPost()" style="padding:10px 20px; font-size:13px; font-weight:700; width:auto; border-radius:12px;">의견 등록하기</button>
        </div>
      </div>

      <!-- Feed List -->
      <div style="font-size:16px; font-weight:900; margin-bottom:12px; padding-left:4px;">최신 실시간 토론</div>
      <div id="feedListContainer">
        ${feedHtml}
      </div>
    </div>
  `;
}

function submitFeedPost() {
  const stockInfo = document.getElementById('feedStockSelect').value.split('|');
  const nickname = document.getElementById('feedNicknameInput').value.trim() || '익명주주';
  const content = document.getElementById('feedContentInput').value.trim();

  if (!content) {
    showToast('토론 의견을 작성해 주세요.');
    return;
  }

  const [stockName, ticker, logo] = stockInfo;
  const newPost = {
    id: Date.now(),
    name: `${stockName} 피드`,
    content: content,
    author: `${nickname} (${ticker})`,
    time: '방금 전',
    logo: logo
  };

  if (!MockState.feedItems) MockState.feedItems = [];
  MockState.feedItems.unshift(newPost);
  
  showToast('의견이 등록되었습니다.');
  renderApp();
}

// ── Exchange Page (`환전소` - Live Interactive Converter) ──
function renderExchangePage(container) {
  const acc = getActiveAccount();
  if (!acc) return;

  const currentDir = MockState.exchangeDir || 'KRW';
  MockState.exchangeDir = currentDir;

  const fromLabel = currentDir === 'KRW' ? '원화(KRW)' : '달러(USD)';
  const toLabel = currentDir === 'KRW' ? '달러(USD)' : '원화(KRW)';
  const fromBalance = currentDir === 'KRW' ? acc.krwCash : (acc.usdCash || 0);
  const fromSymbol = currentDir === 'KRW' ? 'KRW ' : '$';

  container.innerHTML = `
    <div class="card" style="max-width:540px; margin:0 auto; padding:28px;">
      <div style="font-size:20px; font-weight:900; margin-bottom:16px;">실시간 환전 센터</div>
      <div style="font-size:13px; color:var(--muted); margin-bottom:20px; display:flex; align-items:center; justify-content:space-between;">
        <span>현재 미 달러 적용 환율</span>
        <strong style="color:var(--text); font-size:14px;">1 USD = KRW ${MockState.liveRate.toLocaleString(undefined, {minimumFractionDigits:2})}원</strong>
      </div>

      <div style="background:var(--surface2); border-radius:var(--radius-md); padding:16px; margin-bottom:24px; border:1px solid var(--border);">
        <div style="font-size:11px; color:var(--muted); margin-bottom:8px; font-weight:bold;">현재 계좌 예수금 보유 현황</div>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:14px; color:var(--text);">
          <span>원화(KRW): KRW ${Math.floor(acc.krwCash).toLocaleString()}원</span>
          <span>달러(USD): USD ${(acc.usdCash || 0).toFixed(2)}</span>
        </div>
      </div>

      <!-- Currency Converter Layout -->
      <div style="position:relative; display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
        <!-- From Box -->
        <div style="background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 16px;">
          <div style="font-size:11px; color:var(--muted); margin-bottom:4px; font-weight:bold; display:flex; justify-content:space-between;">
            <span>보내는 통화 (${fromLabel})</span>
            <span>잔고: ${fromSymbol}${fromBalance.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <input type="number" id="tabExAmt" class="select-control" style="border:none; background:transparent; padding:4px 0; font-size:22px; font-weight:900; width:100%; outline:none;" placeholder="0" oninput="updateLiveExchangeCalc()">
            <span style="font-size:16px; font-weight:800; color:var(--text2);">${currentDir}</span>
          </div>
        </div>

        <!-- Swap Direction Button Overlay -->
        <div style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); z-index:10;">
          <button onclick="toggleExchangeDir()" style="width:36px; height:36px; border-radius:50%; border:1px solid var(--border2); background:var(--surface); color:var(--accent); font-weight:900; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm); transition:all 0.15s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border2)'">⇆</button>
        </div>

        <!-- To Box -->
        <div style="background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 16px; margin-top:4px;">
          <div style="font-size:11px; color:var(--muted); margin-bottom:4px; font-weight:bold;">받는 통화 (${toLabel})</div>
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span id="tabExResultVal" style="font-size:22px; font-weight:900; color:var(--muted);">0</span>
            <span style="font-size:16px; font-weight:800; color:var(--text2);">${currentDir === 'KRW' ? 'USD' : 'KRW'}</span>
          </div>
        </div>
      </div>

      <!-- Percentage Helper Buttons -->
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-bottom:24px;">
        <button onclick="fillExchangePercent(0.25)" class="pill-btn" style="padding:10px; font-size:12px; font-weight:700;">25%</button>
        <button onclick="fillExchangePercent(0.50)" class="pill-btn" style="padding:10px; font-size:12px; font-weight:700;">50%</button>
        <button onclick="fillExchangePercent(0.75)" class="pill-btn" style="padding:10px; font-size:12px; font-weight:700;">75%</button>
        <button onclick="fillExchangePercent(1.00)" class="pill-btn" style="padding:10px; font-size:12px; font-weight:700;">100%</button>
      </div>

      <button class="primary-action-btn" onclick="submitTabExchange()" style="padding:16px; font-size:15px;">즉시 환전 실행</button>

      <!-- Account Capital Management Box -->
      <div style="background:var(--surface2); border-radius:var(--radius-md); padding:16px; margin-top:24px; border:1px solid var(--border);">
        <div style="font-size:13px; font-weight:800; color:var(--text); margin-bottom:6px;">모의 예수금 관리</div>
        <div style="font-size:11px; color:var(--muted); margin-bottom:12px;">테스트용 모의 예수금을 추가 충전하거나 계좌를 초기화할 수 있습니다.</div>
        <div style="display:flex; gap:8px;">
          <button onclick="topUpAccountCapital(10000000)" class="pill-btn" style="flex:1; padding:8px; font-weight:700;">+ 1,000만원 충전</button>
          <button onclick="topUpAccountCapital(100000000)" class="pill-btn" style="flex:1; padding:8px; font-weight:700;">+ 1억원 충전</button>
          <button onclick="resetActiveAccount()" class="pill-btn" style="padding:8px 12px; font-weight:700; color:var(--up-color);">초기화</button>
        </div>
      </div>
    </div>
  `;
}

function topUpAccountCapital(amt) {
  const acc = getActiveAccount();
  if (!acc) return;
  acc.krwCash += amt;
  saveState();
  showToast(`모의 예수금 KRW ${Math.floor(amt / 10000).toLocaleString()}만원이 충전되었습니다.`);
  renderApp();
}

function resetActiveAccount() {
  const acc = getActiveAccount();
  if (!acc) return;
  if (!confirm(`[${acc.name}] 계좌의 모든 보유 주식과 잔고를 초기화하시겠습니까?`)) return;

  acc.krwCash = 10000000;
  acc.usdCash = 0;
  acc.holdings = {};
  acc.pendingOrders = [];
  acc.executedOrders = [];
  acc.realizedPnl = [];
  acc.dividendHistory = [];

  saveState();
  showToast('계좌가 초기 상태(KRW 1,000만원)로 초기화되었습니다.');
  renderApp();
}

function toggleExchangeDir() {
  MockState.exchangeDir = MockState.exchangeDir === 'KRW' ? 'USD' : 'KRW';
  renderApp();
}

function fillExchangePercent(pct) {
  const acc = getActiveAccount();
  if (!acc) return;
  const currentDir = MockState.exchangeDir || 'KRW';
  const balance = currentDir === 'KRW' ? acc.krwCash : (acc.usdCash || 0);
  const input = document.getElementById('tabExAmt');
  if (input) {
    input.value = (balance * pct).toFixed(currentDir === 'KRW' ? 0 : 2);
    updateLiveExchangeCalc();
  }
}

function updateLiveExchangeCalc() {
  const input = document.getElementById('tabExAmt');
  const result = document.getElementById('tabExResultVal');
  if (!input || !result) return;

  const amt = parseFloat(input.value) || 0;
  const currentDir = MockState.exchangeDir || 'KRW';
  const rate = MockState.liveRate;

  if (currentDir === 'KRW') {
    const calc = amt / rate;
    result.textContent = calc > 0 ? `$${calc.toFixed(2)}` : '0';
    result.style.color = calc > 0 ? 'var(--text)' : 'var(--muted)';
  } else {
    const calc = amt * rate;
    result.textContent = calc > 0 ? `KRW ${Math.round(calc).toLocaleString()}원` : '0';
    result.style.color = calc > 0 ? 'var(--text)' : 'var(--muted)';
  }
}

function submitTabExchange() {
  const dir = MockState.exchangeDir || 'KRW';
  const amt = parseFloat(document.getElementById('tabExAmt').value);
  if (!amt || amt <= 0) { showToast('올바른 금액을 입력하세요.'); return; }
  executeManualExchange(dir, amt);
}

// ── Stock Detail Modal & 10-Level Order Book Sheet ──
function openStockDetailModal(ticker) {
  const q = MockState.quotes[ticker] || MOCK_STOCK_DEFS.find(s => s.id === ticker);
  if (!q) return;

  MockState.activeDetailStock = q;
  const modal = document.getElementById('stockDetailModal');
  if (!modal) return;

  document.getElementById('modalStockTitle').textContent = `${q.name} (${q.id})`;
  document.getElementById('modalStockPrice').textContent = q.market === 'us' ? `$${q.price.toFixed(2)}` : `KRW ${Math.round(q.price).toLocaleString()}원`;

  const changeEl = document.getElementById('modalStockChange');
  const upClass = q.changePct > 0 ? 'up' : (q.changePct < 0 ? 'down' : 'flat');
  const sign = q.changePct > 0 ? '+' : '';
  changeEl.className = `stock-change-sub ${upClass}`;
  changeEl.textContent = `${sign}${q.changePct.toFixed(2)}%`;

  const favBtn = document.getElementById('modalFavBtn');
  if (favBtn) {
    const isFav = MockState.watchlist.has(q.id);
    favBtn.textContent = isFav ? '관심 등록됨' : '관심종목 추가';
  }

  // Stock Factor Scores
  // Stock Factor Scores
  const factorEl = document.getElementById('modalAnalysisFactors');
  if (factorEl) {
    factorEl.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:16px;">
        <div style="background:var(--surface2); padding:10px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--border);">
          <div style="font-size:11px; color:var(--muted);">밸류에이션 점수</div>
          <div style="font-size:16px; font-weight:900; color:var(--accent);">${q.valScore || 85}점</div>
        </div>
        <div style="background:var(--surface2); padding:10px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--border);">
          <div style="font-size:11px; color:var(--muted);">성장성 평가</div>
          <div style="font-size:16px; font-weight:900; color:var(--up-color);">${q.growthScore || 90}점</div>
        </div>
        <div style="background:var(--surface2); padding:10px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--border);">
          <div style="font-size:11px; color:var(--muted);">배당 수익률</div>
          <div style="font-size:16px; font-weight:900; color:var(--green);">${q.divYield || 0.0}%</div>
        </div>
      </div>
    `;
  }

  // Whale Analysis Section
  const whaleEl = document.getElementById('modalWhaleAnalysis');
  if (whaleEl) {
    whaleEl.innerHTML = `
      <div style="background:var(--surface2); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:12px; font-weight:800; color:var(--text);">오늘의 고래 매집지수</span>
          <span style="font-size:13px; font-weight:900; color:var(--accent);">${q.whaleScore || 88}점 (강한 매집)</span>
        </div>
        <div style="width:100%; background:var(--border2); height:8px; border-radius:99px; overflow:hidden;">
          <div style="width:${q.whaleScore || 88}%; background:var(--accent); height:100%; border-radius:99px;"></div>
        </div>
        <div style="font-size:11px; color:var(--muted); margin-top:8px;">외국인 및 기관 실시간 순매수 세력 체결 강도 지표입니다.</div>
      </div>
    `;
  }

  switchModalSubTab('chart');
  renderOrderBookDepth(q);
  initTradingViewChart(q);
  updateOrderEstTotal();

  modal.classList.add('active');
}

function switchModalSubTab(tabName) {
  const chartSec = document.getElementById('mSecChart');
  const bookSec = document.getElementById('mSecOrderBook');
  const factorSec = document.getElementById('mSecFactors');
  const whaleSec = document.getElementById('mSecWhale');

  document.querySelectorAll('.sub-tab-item').forEach(b => b.classList.remove('active'));

  if (chartSec) chartSec.style.display = tabName === 'chart' ? 'block' : 'none';
  if (bookSec) bookSec.style.display = tabName === 'orderbook' ? 'block' : 'none';
  if (factorSec) factorSec.style.display = tabName === 'factors' ? 'block' : 'none';
  if (whaleSec) whaleSec.style.display = tabName === 'whale' ? 'block' : 'none';

  if (tabName === 'chart') {
    const btn = document.getElementById('mSubTabChart');
    if (btn) btn.classList.add('active');
  } else if (tabName === 'orderbook') {
    const btn = document.getElementById('mSubTabOrderBook');
    if (btn) btn.classList.add('active');
  } else if (tabName === 'factors') {
    const btn = document.getElementById('mSubTabFactors');
    if (btn) btn.classList.add('active');
  } else if (tabName === 'whale') {
    const btn = document.getElementById('mSubTabWhale');
    if (btn) btn.classList.add('active');
  }
}

function fillOrderQtyPercent(pct) {
  const stock = MockState.activeDetailStock;
  const acc = getActiveAccount();
  if (!stock || !acc) return;

  const type = MockState.orderType || 'buy';
  const price = stock.price;
  const isUsd = stock.market === 'us';

  let qty = 1;
  if (type === 'buy') {
    const availCash = isUsd ? (acc.usdCash || 0) : acc.krwCash;
    const maxAffordable = Math.floor((availCash * pct) / price);
    qty = Math.max(1, maxAffordable);
  } else {
    const h = acc.holdings[stock.id];
    if (h && h.qty > 0) {
      qty = Math.max(1, Math.floor(h.qty * pct));
    }
  }

  const input = document.getElementById('orderQtyInput');
  if (input) input.value = qty;
  updateOrderEstTotal();
}

function togglePriceMode(mode) {
  MockState.orderPriceMode = mode;
  const pInput = document.getElementById('orderPriceInput');
  const tInput = document.getElementById('orderTriggerPriceInput');

  if (pInput) pInput.style.display = (mode === 'limit' || mode === 'loc') ? 'block' : 'none';
  if (tInput) tInput.style.display = (mode === 'stop_loss' || mode === 'take_profit') ? 'block' : 'none';

  updateOrderEstTotal();
}

function updateOrderEstTotal() {
  const stock = MockState.activeDetailStock;
  const input = document.getElementById('orderQtyInput');
  const baseEl = document.getElementById('orderBaseAmountVal');
  const feeEl = document.getElementById('orderFeeVal');
  const taxEl = document.getElementById('orderTaxVal');
  const label = document.getElementById('orderEstTotalVal');
  const availLabel = document.getElementById('orderAvailLabel');
  const acc = getActiveAccount();

  if (!stock || !input || !label || !acc) return;

  const qty = parseInt(input.value) || 0;
  const priceMode = MockState.orderPriceMode || 'market';
  let targetPrice = stock.price;

  if (priceMode === 'limit' || priceMode === 'loc') {
    const customP = parseFloat(document.getElementById('orderPriceInput')?.value);
    if (customP > 0) targetPrice = customP;
  }

  const isUsd = stock.market === 'us';
  const orderType = MockState.orderType || 'buy';

  const baseAmount = qty * targetPrice;
  const feeRate = isUsd ? 0.0007 : 0.00015;
  const feeAmount = baseAmount * feeRate;
  const taxAmount = (orderType === 'sell' && !isUsd) ? baseAmount * 0.0018 : 0;

  const netTotal = orderType === 'buy' ? (baseAmount + feeAmount) : Math.max(0, baseAmount - feeAmount - taxAmount);

  if (baseEl) baseEl.textContent = isUsd ? `$${baseAmount.toFixed(2)}` : `KRW ${Math.round(baseAmount).toLocaleString()}원`;
  if (feeEl) feeEl.textContent = isUsd ? `$${feeAmount.toFixed(2)}` : `KRW ${Math.round(feeAmount).toLocaleString()}원`;
  if (taxEl) taxEl.textContent = isUsd ? `$0.00` : `KRW ${Math.round(taxAmount).toLocaleString()}원`;
  label.textContent = isUsd ? `$${netTotal.toFixed(2)}` : `KRW ${Math.round(netTotal).toLocaleString()}원`;

  if (availLabel) {
    if (orderType === 'buy') {
      const availCash = isUsd ? (acc.usdCash || 0) : acc.krwCash;
      const maxQty = Math.floor(availCash / (targetPrice * (1 + feeRate)));
      availLabel.textContent = isUsd ? `주문가능: $${availCash.toFixed(2)} (최대 ${maxQty}주)` : `주문가능: KRW ${Math.floor(availCash).toLocaleString()}원 (최대 ${maxQty}주)`;
    } else {
      const h = acc.holdings[stock.id];
      const hQty = h ? h.qty : 0;
      availLabel.textContent = `보유수량: ${hQty}주`;
    }
  }
}

function submitOrderFromModal() {
  const stock = MockState.activeDetailStock;
  if (!stock) return;

  const qty = parseInt(document.getElementById('orderQtyInput').value) || 0;
  if (qty <= 0) { showToast('매수/매도 수량을 입력하세요.'); return; }

  const acc = getActiveAccount();
  if (!acc) return;

  const mode = MockState.orderPriceMode || 'market';
  const type = MockState.orderType || 'buy';

  if (mode === 'market') {
    const success = executeTrade(acc, stock.id, type, qty, stock.price, stock.market);
    if (success) {
      showToast(`${stock.name} ${qty}주 ${type === 'buy' ? '매수' : '매도'} 체결 완료 (수수료 포함)`);
      closeModal('stockDetailModal');
      renderApp();
    }
  } else {
    let orderPrice = stock.price;
    let triggerPrice = null;

    if (mode === 'limit' || mode === 'loc') {
      orderPrice = parseFloat(document.getElementById('orderPriceInput').value);
      if (!orderPrice || orderPrice <= 0) { showToast('지정가를 입력하세요.'); return; }
    } else if (mode === 'stop_loss' || mode === 'take_profit') {
      triggerPrice = parseFloat(document.getElementById('orderTriggerPriceInput').value);
      if (!triggerPrice || triggerPrice <= 0) { showToast('감시 목표 가격을 입력하세요.'); return; }
      orderPrice = triggerPrice;
    }

    acc.pendingOrders = acc.pendingOrders || [];
    acc.pendingOrders.push({
      id: 'ord_' + mode + '_' + Date.now(),
      ticker: stock.id,
      name: stock.name,
      type: type,
      mode: mode,
      qty: qty,
      price: orderPrice,
      triggerPrice: triggerPrice,
      market: stock.market,
      timestamp: Date.now()
    });

    saveState();
    const modeName = mode === 'stop_loss' ? '손절 감시' : (mode === 'take_profit' ? '익절 감시' : (mode === 'loc' ? '종가지정가' : '지정가'));
    showToast(`${stock.name} ${qty}주 ${modeName} (${type === 'buy' ? '매수' : '매도'}) 주문 접수 완료`);
    closeModal('stockDetailModal');
    renderApp();
  }
}

// ── Watchlist Management ──
function toggleWatchlist(ticker) {
  if (MockState.watchlist.has(ticker)) {
    MockState.watchlist.delete(ticker);
    showToast('관심종목에서 제거되었습니다.');
  } else {
    MockState.watchlist.add(ticker);
    showToast('관심종목에 추가되었습니다.');
  }
  saveState();
  renderApp();
}

function cancelPendingOrder(orderId) {
  const acc = getActiveAccount();
  if (!acc) return;
  acc.pendingOrders = acc.pendingOrders.filter(o => o.id !== orderId);
  saveState();
  showToast('지정가 주문이 취소되었습니다.');
  renderApp();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function showToast(msg) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => { toast.remove(); }, 3000);
}

// ── Portfolio Doughnut Chart Renderer (Chart.js) ──
function initPortfolioChart() {
  const canvas = document.getElementById('portfolioChart');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    setTimeout(initPortfolioChart, 100);
    return;
  }

  const acc = getActiveAccount();
  if (!acc) return;

  const labels = [];
  const data = [];
  const colors = [];

  const presetColors = [
    '#3182F6', // Toss Blue
    '#FF9500', // Yellow
    '#F04452', // Red
    '#20C997', // Green
    '#9B5DE5', // Purple
    '#F15BB5', // Pink
    '#00F5D4', // Cyan
    '#EE9B00', // Amber
    '#CA6702', // Orange
    '#00B4D8'  // Sky Blue
  ];

  // 1. Cash Assets
  const krwCash = acc.krwCash || 0;
  if (krwCash > 0) {
    labels.push('원화 예수금');
    data.push(krwCash);
    colors.push('#8B95A1');
  }

  const usdCashKrw = (acc.usdCash || 0) * MockState.liveRate;
  if (usdCashKrw > 0) {
    labels.push('달러 예수금');
    data.push(usdCashKrw);
    colors.push('#FFCC00');
  }

  // 2. Stock Holdings Assets
  Object.values(acc.holdings).forEach((h, index) => {
    const q = MockState.quotes[h.ticker] || { price: h.avgPrice };
    const val = q.price * h.qty * (h.market === 'us' ? MockState.liveRate : 1);
    if (val > 0) {
      labels.push(h.name);
      data.push(val);
      colors.push(presetColors[index % presetColors.length]);
    }
  });

  if (data.length === 0) return;

  const totalValue = data.reduce((a, b) => a + b, 0);

  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            boxWidth: 10,
            padding: 12,
            font: { family: 'Pretendard, sans-serif', size: 11, weight: 'bold' },
            color: '#4E5968'
          }
        }
      },
      cutout: '72%'
    }
  });
}

// ── Toss WTS Overseas Bonds Masterclass Page (Screenshot Page 4 Alignment) ──
let bondFilterType = 'yield';
let bondCountryTab = 'us';

function renderBondsPage(container) {
  const BONDS_DATA = [
    { id: 'us_23y10m', country: 'us', name: '미국 국채·23년 10개월', rate: 8.32, priceUsd: 998.07, minBuy: 0.1, category: '국채' },
    { id: 'us_14y1m', country: 'us', name: '미국 국채·14년 1개월', rate: 6.94, priceUsd: 1015.40, minBuy: 0.1, category: '국채' },
    { id: 'us_4y1m', country: 'us', name: '미국 국채·4년 1개월', rate: 5.19, priceUsd: 980.25, minBuy: 0.1, category: '국채' },
    { id: 'us_2y', country: 'us', name: '미국 국채·2년', rate: 4.83, priceUsd: 992.10, minBuy: 0.1, category: '국채' },
    { id: 'us_1y2m', country: 'us', name: '미국 국채·1년 2개월', rate: 4.82, priceUsd: 995.50, minBuy: 0.1, category: '국채' },
    { id: 'br_10y', country: 'br', name: '브라질 국채·10년', rate: 11.85, priceUsd: 850.00, minBuy: 1.0, category: '국채' },
  ];

  const filtered = BONDS_DATA.filter(b => b.country === bondCountryTab);
  if (bondFilterType === 'yield') filtered.sort((a, b) => b.rate - a.rate);

  let html = `
    <div style="padding: 24px 0;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <div>
          <span style="display:inline-block; font-size:11px; font-weight:800; background:rgba(0,102,204,0.1); color:var(--accent); padding:3px 8px; border-radius:99px; margin-bottom:6px;">실시간 주문 가능</span>
          <div style="font-size: 26px; font-weight: 900; color: var(--text);">해외채권</div>
        </div>
        <button class="exchange-link-btn" onclick="switchNavTab('exchange')">채권 매수 가능 예수금 확인 →</button>
      </div>

      <!-- Country Tab Switcher -->
      <div style="display:flex; gap:12px; border-bottom:2px solid var(--border); margin-bottom: 20px;">
        <button onclick="setBondCountry('us')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${bondCountryTab === 'us' ? 'var(--accent)' : 'transparent'}; color:${bondCountryTab === 'us' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">미국 채권</button>
        <button onclick="setBondCountry('br')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${bondCountryTab === 'br' ? 'var(--accent)' : 'transparent'}; color:${bondCountryTab === 'br' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">브라질 채권</button>
      </div>

      <!-- Filter Chips -->
      <div style="display:flex; gap:8px; margin-bottom:20px;">
        <button onclick="setBondFilter('yield')" style="padding:6px 14px; border-radius:99px; font-size:12.5px; font-weight:700; border:none; cursor:pointer; background:${bondFilterType === 'yield' ? '#1D1D1F' : 'var(--surface)'}; color:${bondFilterType === 'yield' ? '#FFFFFF' : 'var(--text2)'}">수익률 순</button>
        <button onclick="setBondFilter('term')" style="padding:6px 14px; border-radius:99px; font-size:12.5px; font-weight:700; border:none; cursor:pointer; background:${bondFilterType === 'term' ? '#1D1D1F' : 'var(--surface)'}; color:${bondFilterType === 'term' ? '#FFFFFF' : 'var(--text2)'}">투자 기간</button>
        <button onclick="setBondFilter('volume')" style="padding:6px 14px; border-radius:99px; font-size:12.5px; font-weight:700; border:none; cursor:pointer; background:${bondFilterType === 'volume' ? '#1D1D1F' : 'var(--surface)'}; color:${bondFilterType === 'volume' ? '#FFFFFF' : 'var(--text2)'}">거래량</button>
      </div>

      <!-- Bond Card Grid -->
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
  `;

  filtered.forEach((bond, idx) => {
    html += `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:18px 20px; transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="font-size:16px; font-weight:900; color:var(--accent); width:20px;">${idx + 1}</div>
          <div>
            <div style="font-size:15px; font-weight:800; color:var(--text);">${bond.name}</div>
            <div style="font-size:12px; color:var(--muted); margin-top:3px;">개당 $${bond.priceUsd.toFixed(2)} (KRW ${(bond.priceUsd * MockState.liveRate).toLocaleString(undefined, {maximumFractionDigits:0})}원)</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px; font-weight:900; color:var(--up-color);">연 ${bond.rate}%</div>
          <button onclick="openBondModal('${bond.id}', '${bond.name}', ${bond.priceUsd}, ${bond.rate})" style="margin-top:6px; padding:6px 14px; border-radius:10px; font-size:12px; font-weight:800; background:var(--accent); color:#fff; border:none; cursor:pointer;">구매하기</button>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function setBondCountry(c) { bondCountryTab = c; renderApp(); }
function setBondFilter(f) { bondFilterType = f; renderApp(); }

// ── Toss WTS Realized Profit & Dividend Tracker (Screenshot Page 7 & 13 Alignment) ──
let analyticsSubTab = 'dividend';
let analyticsCurrency = 'krw';

function renderAnalyticsPage(container) {
  const acc = getActiveAccount();
  const divList = (acc && acc.dividendHistory) || [
    { ticker: 'JEPQ', name: 'JEPQ', amount: 5.16, market: 'us', timestamp: Date.now() - 86400000 * 16 },
    { ticker: 'AAPL', name: '애플', amount: 1.25, market: 'us', timestamp: Date.now() - 86400000 * 30 },
  ];

  let totalDivKRW = 0;
  divList.forEach(d => {
    totalDivKRW += d.market === 'us' ? d.amount * MockState.liveRate : d.amount;
  });

  let html = `
    <div style="padding: 24px 0;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <div>
          <span style="display:inline-block; font-size:11px; font-weight:800; background:rgba(49,130,246,0.1); color:var(--down-color); padding:3px 8px; border-radius:99px; margin-bottom:6px;">실시간 자동 집계</span>
          <div style="font-size: 26px; font-weight: 900; color: var(--text);">수익분석 · 배당금</div>
        </div>
        <div style="display:flex; background:rgba(0,0,0,0.04); padding:3px; border-radius:99px;">
          <button onclick="setAnalyticsCurrency('krw')" style="padding:4px 12px; border-radius:99px; font-size:12px; font-weight:800; border:none; cursor:pointer; background:${analyticsCurrency === 'krw' ? '#FFFFFF' : 'transparent'}; color:${analyticsCurrency === 'krw' ? 'var(--text)' : 'var(--text2)'}">원</button>
          <button onclick="setAnalyticsCurrency('usd')" style="padding:4px 12px; border-radius:99px; font-size:12px; font-weight:800; border:none; cursor:pointer; background:${analyticsCurrency === 'usd' ? '#FFFFFF' : 'transparent'}; color:${analyticsCurrency === 'usd' ? 'var(--text)' : 'var(--text2)'}">$</button>
        </div>
      </div>

      <!-- Realized Profit Summary Banner (Screenshot Page 7 Alignment) -->
      <div class="card" style="background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(244,245,249,0.9) 100%); padding: 24px; border-radius:20px; margin-bottom:24px; box-shadow:0 8px 25px rgba(0,0,0,0.04);">
        <div style="font-size:13px; font-weight:800; color:var(--muted); margin-bottom:6px;">7월 누적 실현수익</div>
        <div style="font-size:32px; font-weight:900; color:var(--up-color);">
          +${analyticsCurrency === 'krw' ? '₩' + Math.round(totalDivKRW).toLocaleString() + '원' : '$' + (totalDivKRW / MockState.liveRate).toFixed(2)}
        </div>
        <div style="display:flex; gap:16px; margin-top:16px; font-size:13px; color:var(--text2);">
          <div>판매수익: <strong>₩0원</strong></div>
          <div>배당금: <strong style="color:var(--up-color);">+₩${Math.round(totalDivKRW).toLocaleString()}원</strong></div>
          <div>대여료: <strong>₩0원</strong></div>
        </div>
      </div>

      <!-- Analytics Subtabs -->
      <div style="display:flex; gap:10px; border-bottom:2px solid var(--border); margin-bottom:20px;">
        <button onclick="setAnalyticsSubTab('dividend')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${analyticsSubTab === 'dividend' ? 'var(--accent)' : 'transparent'}; color:${analyticsSubTab === 'dividend' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">배당금 내역</button>
        <button onclick="setAnalyticsSubTab('sales')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${analyticsSubTab === 'sales' ? 'var(--accent)' : 'transparent'}; color:${analyticsSubTab === 'sales' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">판매수익</button>
        <button onclick="setAnalyticsSubTab('interest')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${analyticsSubTab === 'interest' ? 'var(--accent)' : 'transparent'}; color:${analyticsSubTab === 'interest' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">계좌이자</button>
      </div>

      <!-- Dividend Items List -->
      <div class="card" style="padding: 12px 20px;">
        <div style="font-size:13px; font-weight:800; color:var(--muted); padding:10px 0; border-bottom:1px solid var(--border);">입금 완료 배당금 목록</div>
  `;

  if (!divList.length) {
    html += `<div style="padding:30px; text-align:center; color:var(--muted); font-size:13px;">입금된 배당금 내역이 없습니다.</div>`;
  } else {
    divList.forEach(item => {
      const valStr = item.market === 'us'
        ? (analyticsCurrency === 'krw' ? '₩' + Math.round(item.amount * MockState.liveRate).toLocaleString() + '원' : '$' + item.amount.toFixed(2))
        : '₩' + Math.round(item.amount).toLocaleString() + '원';
      const dateStr = new Date(item.timestamp).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid rgba(0,0,0,0.04);">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #1D1D1F 0%, #434344 100%); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px;">
              ${item.ticker.substring(0, 3)}
            </div>
            <div>
              <div style="font-size:14.5px; font-weight:800; color:var(--text);">${item.name}</div>
              <div style="font-size:11.5px; color:var(--muted);">${dateStr} · ${item.market === 'us' ? '해외주식' : '국내주식'}</div>
            </div>
          </div>
          <div style="font-size:16px; font-weight:900; color:var(--up-color);">+${valStr}</div>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function setAnalyticsSubTab(t) { analyticsSubTab = t; renderApp(); }
function setAnalyticsCurrency(c) { analyticsCurrency = c; renderApp(); }

// ── Toss WTS Executed Orders History & Monthly Sheet Filter (Screenshot Page 8, 9, 10, 11 Alignment) ──
let orderMarketTab = 'all';
let orderSelectedMonth = '2026-07';

function renderOrdersPage(container) {
  const acc = getActiveAccount();
  const orders = (acc && acc.executedOrders) || [
    { ticker: 'AAPL', name: '애플', type: 'buy', qty: 0.026, price: 224.30, market: 'us', timestamp: Date.now() - 86400000 * 2 },
    { ticker: 'AMZN', name: '아마존', type: 'buy', qty: 0.026, price: 186.40, market: 'us', timestamp: Date.now() - 86400000 * 5 },
    { ticker: '005930', name: '삼성전자', type: 'buy', qty: 10, price: 78500, market: 'kr', timestamp: Date.now() - 86400000 * 10 },
  ];

  let html = `
    <div style="padding: 24px 0;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <div style="font-size: 26px; font-weight: 900; color: var(--text);">주문내역</div>
        <!-- Toss Style Month Sheet Trigger -->
        <button onclick="toggleMonthPickerModal()" style="display:flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--border); padding:8px 16px; border-radius:99px; font-size:13px; font-weight:800; cursor:pointer;">
          <span>${orderSelectedMonth.replace('-', '년 ')}월 내역</span>
          <span style="font-size:10px;">▼</span>
        </button>
      </div>

      <!-- Market Subtabs -->
      <div style="display:flex; gap:12px; border-bottom:2px solid var(--border); margin-bottom:20px;">
        <button onclick="setOrderMarketTab('all')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${orderMarketTab === 'all' ? 'var(--accent)' : 'transparent'}; color:${orderMarketTab === 'all' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">전체</button>
        <button onclick="setOrderMarketTab('kr')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${orderMarketTab === 'kr' ? 'var(--accent)' : 'transparent'}; color:${orderMarketTab === 'kr' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">국내</button>
        <button onclick="setOrderMarketTab('us')" style="padding:10px 16px; font-weight:800; font-size:15px; border:none; background:transparent; border-bottom:3px solid ${orderMarketTab === 'us' ? 'var(--accent)' : 'transparent'}; color:${orderMarketTab === 'us' ? 'var(--accent)' : 'var(--muted)'}; cursor:pointer;">해외</button>
      </div>

      <div class="card" style="padding:16px 24px;">
        <div style="font-size:13px; font-weight:800; color:var(--muted); margin-bottom:12px;">완료된 주문</div>
  `;

  const filteredOrders = orders.filter(o => orderMarketTab === 'all' || o.market === orderMarketTab);

  if (!filteredOrders.length) {
    html += `
      <div style="padding:50px 20px; text-align:center;">
        <div style="font-size:15px; font-weight:800; color:var(--muted); margin-bottom:12px;">선택한 월엔 주문내역이 없습니다.</div>
        <button onclick="setOrderMonth('2026-06')" style="padding:8px 18px; border-radius:99px; background:rgba(0,102,204,0.1); color:var(--accent); border:none; font-weight:800; font-size:13px; cursor:pointer;">이전 월 내역 보기</button>
      </div>
    `;
  } else {
    filteredOrders.forEach(o => {
      const d = new Date(o.timestamp);
      const dateTag = `${d.getMonth() + 1}.${d.getDate()}`;
      const totalStr = o.market === 'us' ? `$${(o.price * o.qty).toFixed(2)}` : `₩${Math.round(o.price * o.qty).toLocaleString()}원`;

      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 0; border-bottom:1px solid rgba(0,0,0,0.04);">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="font-size:13px; font-weight:800; color:var(--muted); width:36px;">${dateTag}</div>
            <div>
              <div style="font-size:15px; font-weight:800; color:var(--text);">${o.name}</div>
              <div style="font-size:12px; color:var(--muted); margin-top:2px;">${totalStr} ${o.type === 'buy' ? '구매 완료' : '판매 완료'} (${o.qty}주 @ ${o.market === 'us' ? '$' + o.price.toFixed(2) : '₩' + o.price.toLocaleString()})</div>
            </div>
          </div>
          <span style="font-size:12px; font-weight:800; padding:4px 10px; border-radius:8px; background:${o.type === 'buy' ? 'var(--up-bg)' : 'var(--down-bg)'}; color:${o.type === 'buy' ? 'var(--up-color)' : 'var(--down-color)'};">
            ${o.type === 'buy' ? '매수완료' : '매도완료'}
          </span>
        </div>
      `;
    });
  }

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function setOrderMarketTab(t) { orderMarketTab = t; renderApp(); }
function setOrderMonth(m) { orderSelectedMonth = m; renderApp(); }

function toggleMonthPickerModal() {
  alert("월 선택: 2026년 7월 (현재 선택됨)");
}

function openBondModal(bondId, bondName, priceUsd, rate) {
  const acc = getActiveAccount();
  if (!acc) return;
  const qty = prompt(`[${bondName}] 구매 수량을 입력하세요 (개당 $${priceUsd.toFixed(2)}, 연 ${rate}%):`, "0.1");
  if (!qty || isNaN(qty) || parseFloat(qty) <= 0) return;
  const numQty = parseFloat(qty);
  const totalUsd = numQty * priceUsd;

  if ((acc.usdCash || 0) < totalUsd) {
    alert(`달러 예수금이 부족합니다. 필요 금액: $${totalUsd.toFixed(2)}, 보유: $${(acc.usdCash||0).toFixed(2)}\n[환전] 메뉴를 통해 달러를 충전하세요.`);
    return;
  }

  acc.usdCash -= totalUsd;
  acc.executedOrders = acc.executedOrders || [];
  acc.executedOrders.unshift({
    ticker: bondId,
    name: bondName,
    type: 'buy',
    qty: numQty,
    price: priceUsd,
    market: 'us',
    timestamp: Date.now()
  });
  saveState();
  showToast(`[채권 구매 완료] ${bondName} ${numQty}개 ($${totalUsd.toFixed(2)}) 매수가 체결되었습니다.`);
  renderApp();
}
