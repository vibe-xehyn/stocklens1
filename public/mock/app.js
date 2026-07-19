// ── StockLens Mock Investment Masterclass Engine (Toss White Style) ──

// ── Default Stock Definitions ──
const MOCK_STOCK_DEFS = [
  // 국내 KOSPI / KOSDAQ
  { id: '005930', ticker: '005930', name: '삼성전자', market: 'kr', exchange: 'KOSPI', price: 78500, changePct: 1.25, divYield: 2.45, category: '국내주식', valScore: 88, growthScore: 82 },
  { id: '000660', ticker: '000660', name: 'SK하이닉스', market: 'kr', exchange: 'KOSPI', price: 183000, changePct: -12.10, divYield: 1.20, category: '국내주식', valScore: 92, growthScore: 95 },
  { id: '373220', ticker: '373220', name: 'LG에너지솔루션', market: 'kr', exchange: 'KOSPI', price: 382000, changePct: 0.52, divYield: 0.00, category: '국내주식', valScore: 75, growthScore: 85 },
  { id: '005380', ticker: '005380', name: '현대차', market: 'kr', exchange: 'KOSPI', price: 253500, changePct: -9.30, divYield: 4.80, category: '국내주식', valScore: 85, growthScore: 78 },
  { id: '035420', ticker: '035420', name: 'NAVER', market: 'kr', exchange: 'KOSPI', price: 172000, changePct: -0.86, divYield: 0.95, category: '국내주식', valScore: 80, growthScore: 75 },
  { id: '035720', ticker: '035720', name: '카카오', market: 'kr', exchange: 'KOSPI', price: 42100, changePct: -1.41, divYield: 0.70, category: '국내주식', valScore: 70, growthScore: 72 },
  { id: '068270', ticker: '068270', name: '셀트리온', market: 'kr', exchange: 'KOSPI', price: 194000, changePct: 1.84, divYield: 0.45, category: '국내주식', valScore: 84, growthScore: 86 },
  { id: '000270', ticker: '000270', name: '기아', market: 'kr', exchange: 'KOSPI', price: 118500, changePct: 2.60, divYield: 5.10, category: '국내주식', valScore: 86, growthScore: 80 },
  { id: '105560', ticker: '105560', name: 'KB금융', market: 'kr', exchange: 'KOSPI', price: 79200, changePct: 4.21, divYield: 4.10, category: '국내주식', valScore: 89, growthScore: 76 },
  { id: '005490', ticker: '005490', name: 'POSCO홀딩스', market: 'kr', exchange: 'KOSPI', price: 365000, changePct: -0.54, divYield: 2.80, category: '국내주식', valScore: 78, growthScore: 70 },
  { id: '012450', ticker: '012450', name: '한화에어로스페이스', market: 'kr', exchange: 'KOSPI', price: 298000, changePct: 5.80, divYield: 0.80, category: '국내주식', valScore: 94, growthScore: 98 },
  { id: '006400', ticker: '006400', name: '삼성SDI', market: 'kr', exchange: 'KOSPI', price: 345000, changePct: -3.20, divYield: 1.10, category: '국내주식', valScore: 76, growthScore: 74 },

  // 해외 US Tech & Leaders
  { id: 'NVDA', ticker: 'NVDA', name: '엔비디아 (NVIDIA)', market: 'us', exchange: 'NASDAQ', price: 128.50, changePct: 3.85, divYield: 0.12, category: '해외주식', valScore: 98, growthScore: 99 },
  { id: 'AAPL', ticker: 'AAPL', name: '애플 (Apple)', market: 'us', exchange: 'NASDAQ', price: 224.30, changePct: 0.75, divYield: 0.45, category: '해외주식', valScore: 92, growthScore: 88 },
  { id: 'MSFT', ticker: 'MSFT', name: '마이크로소프트 (MSFT)', market: 'us', exchange: 'NASDAQ', price: 448.90, changePct: -0.42, divYield: 0.68, category: '해외주식', valScore: 95, growthScore: 92 },
  { id: 'GOOGL', ticker: 'GOOGL', name: '알파벳 A (Google)', market: 'us', exchange: 'NASDAQ', price: 178.20, changePct: -1.10, divYield: 0.45, category: '해외주식', valScore: 90, growthScore: 89 },
  { id: 'AMZN', ticker: 'AMZN', name: '아마존 (Amazon)', market: 'us', exchange: 'NASDAQ', price: 186.40, changePct: 1.50, divYield: 0.00, category: '해외주식', valScore: 88, growthScore: 91 },
  { id: 'META', ticker: 'META', name: '메타 (Meta)', market: 'us', exchange: 'NASDAQ', price: 495.20, changePct: 2.15, divYield: 0.40, category: '해외주식', valScore: 91, growthScore: 93 },
  { id: 'TSLA', ticker: 'TSLA', name: '테슬라 (Tesla)', market: 'us', exchange: 'NASDAQ', price: 248.80, changePct: 5.60, divYield: 0.00, category: '해외주식', valScore: 82, growthScore: 95 },
  { id: 'PLTR', ticker: 'PLTR', name: '팔란티어 (Palantir)', market: 'us', exchange: 'NYSE', price: 28.40, changePct: 4.30, divYield: 0.00, category: '해외주식', valScore: 93, growthScore: 97 },
  { id: 'AVGO', ticker: 'AVGO', name: '브로드컴 (Broadcom)', market: 'us', exchange: 'NASDAQ', price: 172.60, changePct: -1.80, divYield: 1.25, category: '해외주식', valScore: 89, growthScore: 90 },
  { id: 'JPM', ticker: 'JPM', name: 'JP모건 체이스', market: 'us', exchange: 'NYSE', price: 206.50, changePct: 1.10, divYield: 2.25, category: '해외주식', valScore: 87, growthScore: 80 },

  // 채권 & ETF
  { id: 'SPY', ticker: 'SPY', name: 'S&P 500 ETF (SPY)', market: 'us', exchange: 'NYSE', price: 556.80, changePct: 0.45, divYield: 1.22, category: 'ETF', valScore: 90, growthScore: 85 },
  { id: 'QQQ', ticker: 'QQQ', name: '나스닥 100 ETF (QQQ)', market: 'us', exchange: 'NASDAQ', price: 492.10, changePct: 0.88, divYield: 0.58, category: 'ETF', valScore: 94, growthScore: 92 },
  { id: 'TLT', ticker: 'TLT', name: '미국 20년+ 국채 ETF (TLT)', market: 'us', exchange: 'NASDAQ', price: 94.50, changePct: -0.30, divYield: 3.85, category: '채권', valScore: 80, growthScore: 70 },
  { id: 'TIGER200', ticker: '102110', name: 'TIGER 200 (KOSPI 200)', market: 'kr', exchange: 'KOSPI', price: 36200, changePct: 0.84, divYield: 1.90, category: 'ETF', valScore: 82, growthScore: 78 },
];

// ── App State ──
let MockState = {
  accounts: {}, // { realtime: {...}, virtual: {...} }
  activeAccountId: null, // 'realtime' or 'virtual'
  liveRate: 1380.50,
  watchlist: new Set(['005930', 'NVDA', 'AAPL', 'TSLA']),
  quotes: {}, // ticker -> quote
  currentTab: 'base', // 'base', 'watchlist', 'discovery', 'feed', 'exchange'
  holdingFilter: 'all', // 'all', 'kr', 'us'
  currencyView: 'krw', // 'krw', 'usd'
  sortOrder: 'val_desc',
  discoveryCategory: 'all', // 'all', 'us', 'kr', 'bond', 'etf'
  discoveryRankType: 'volume', // 'val', 'volume', 'up', 'down', 'popular'
  activeDetailStock: null,
  orderType: 'buy', // 'buy', 'sell'
  orderPriceMode: 'market', // 'market', 'limit'
  setupModeType: 'realtime',
  setupCapitalAmount: 10000000,
  isSetupForSecondAccount: false,
  tvChartObj: null,
  scenarioTimer: null,
};

// ── App Startup ──
document.addEventListener('DOMContentLoaded', async () => {
  initQuotes();
  await loadServerOrLocalStorage();
  setupEventListeners();
  startLiveRateFetcher();
  startVirtualScenarioEngine();
  renderApp();
});

function initQuotes() {
  MOCK_STOCK_DEFS.forEach(s => {
    MockState.quotes[s.id] = { ...s };
  });
}

// ── Persistence Layer (Server + LocalStorage) ──
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

  const saved = localStorage.getItem('stocklens_mock_master_state_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      MockState.accounts = parsed.accounts || {};
      MockState.activeAccountId = parsed.activeAccountId || null;
      if (parsed.watchlist) MockState.watchlist = new Set(parsed.watchlist);
    } catch (e) {}
  }
}

async function saveState() {
  const payload = {
    accounts: MockState.accounts,
    activeAccountId: MockState.activeAccountId,
    watchlist: Array.from(MockState.watchlist),
  };

  localStorage.setItem('stocklens_mock_master_state_v2', JSON.stringify(payload));

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

// ── Account Creation Logic ──
function createAccount(modeType, initialCapitalKRW) {
  const isReal = modeType === 'realtime';
  const newAccount = {
    id: modeType, // 'realtime' or 'virtual'
    name: isReal ? '실시간 실전 계좌' : '가상상황 쾌속 계좌',
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
  showToast(`${newAccount.name}가 ₩${(initialCapitalKRW / 10000).toLocaleString()}만원으로 개설되었습니다!`);
}

// ── Rate & Virtual Scenario Engine ──
async function startLiveRateFetcher() {
  async function updateRate() {
    try {
      const res = await fetch('/api/macro');
      if (res.ok) {
        const data = await res.json();
        if (data.usdkrw && data.usdkrw.value) {
          MockState.liveRate = parseFloat(data.usdkrw.value);
          const el = document.getElementById('headerLiveRate');
          if (el) el.textContent = `1$ = ₩${MockState.liveRate.toLocaleString(undefined, { minimumFractionDigits: 1 })}`;
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
        const delta = (Math.random() - 0.49) * 0.04;
        const newPrice = Math.max(1, q.price * (1 + delta));
        q.changePct = ((newPrice - s.price) / s.price) * 100;
        q.price = newPrice;
      }
    });

    if (acc) checkPendingLimitOrders(acc);

    if (acc && acc.type === 'virtual' && Math.random() < 0.15) {
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
  acc.pendingOrders.forEach(o => {
    const q = MockState.quotes[o.ticker];
    if (!q) { remaining.push(o); return; }

    let matched = false;
    if (o.type === 'buy' && q.price <= o.price) matched = true;
    if (o.type === 'sell' && q.price >= o.price) matched = true;

    if (matched) {
      executeOrderMatch(acc, o, q.price);
    } else {
      remaining.push(o);
    }
  });

  acc.pendingOrders = remaining;
  saveState();
}

function executeOrderMatch(acc, order, fillPrice) {
  const isUsd = order.market === 'us';
  if (order.type === 'buy') {
    if (!acc.holdings[order.ticker]) {
      acc.holdings[order.ticker] = { ticker: order.ticker, name: order.name, market: order.market, qty: 0, avgPrice: 0, totalCost: 0 };
    }
    const h = acc.holdings[order.ticker];
    const newCost = isUsd ? (fillPrice * order.qty * MockState.liveRate) : (fillPrice * order.qty);
    h.qty += order.qty;
    h.totalCost += newCost;
    h.avgPrice = (h.totalCost / (h.qty * (isUsd ? MockState.liveRate : 1)));

    acc.executedOrders.unshift({
      id: 'ord_' + Date.now(),
      time: Date.now(),
      ticker: order.ticker,
      name: order.name,
      type: 'buy',
      price: fillPrice,
      qty: order.qty,
      market: order.market,
      totalKRW: newCost,
    });
  } else {
    const h = acc.holdings[order.ticker];
    if (h) {
      const revenueKRW = isUsd ? (fillPrice * order.qty * MockState.liveRate) : (fillPrice * order.qty);
      if (isUsd) acc.usdCash += (fillPrice * order.qty);
      else acc.krwCash += revenueKRW;

      const pnlKRW = isUsd ? (fillPrice - h.avgPrice) * order.qty * MockState.liveRate : (fillPrice - h.avgPrice) * order.qty;
      const returnPct = ((fillPrice - h.avgPrice) / h.avgPrice) * 100;

      acc.realizedPnl.unshift({
        id: 'pnl_' + Date.now(),
        time: Date.now(),
        ticker: order.ticker,
        name: order.name,
        pnlKRW,
        returnPct,
        qty: order.qty,
        market: order.market,
      });

      h.qty -= order.qty;
      if (h.qty <= 0) delete acc.holdings[order.ticker];

      acc.executedOrders.unshift({
        id: 'ord_' + Date.now(),
        time: Date.now(),
        ticker: order.ticker,
        name: order.name,
        type: 'sell',
        price: fillPrice,
        qty: order.qty,
        market: order.market,
        totalKRW: revenueKRW,
      });
    }
  }
  showToast(`[지정가 체결] ${order.name} ${order.type === 'buy' ? '매수' : '매도'} 완료!`);
}

function triggerFastDividend(acc) {
  const holdingKeys = Object.keys(acc.holdings);
  if (!holdingKeys.length) return;

  const randomKey = holdingKeys[Math.floor(Math.random() * holdingKeys.length)];
  const h = acc.holdings[randomKey];
  if (!h || h.qty <= 0) return;

  const q = MockState.quotes[h.ticker];
  const isUsd = h.market === 'us';
  const divPerShare = isUsd ? (q.price * 0.005) : (q.price * 0.008);
  const totalDiv = Math.round(divPerShare * h.qty * 100) / 100;

  if (isUsd) acc.usdCash = (acc.usdCash || 0) + totalDiv;
  else acc.krwCash = (acc.krwCash || 0) + totalDiv;

  acc.dividendHistory.unshift({
    id: 'div_' + Date.now(),
    time: Date.now(),
    ticker: h.ticker,
    name: h.name,
    amount: totalDiv,
    isUsd,
  });

  saveState();
  showToast(`[배당금 입금] ${h.name} +${isUsd ? '$' + totalDiv.toFixed(2) : '₩' + Math.floor(totalDiv).toLocaleString()} 배당 입금!`);
}

// ── Auto Currency Exchange Trading Engine ──
function executeBuyOrder(ticker, qty, targetPrice, isMarket) {
  const acc = getActiveAccount();
  if (!acc) return;

  const q = MockState.quotes[ticker];
  if (!q) return;

  const executionPrice = isMarket ? q.price : targetPrice;
  const isUsd = q.market === 'us';

  if (!isMarket) {
    // Limit Order: Push to Pending Orders
    const costInKRW = isUsd ? (executionPrice * qty * MockState.liveRate) : (executionPrice * qty);
    if (isUsd) {
      if ((acc.usdCash * MockState.liveRate + acc.krwCash) < costInKRW) {
        showToast('지정가 주문을 위한 예수금이 부족합니다.');
        return;
      }
    } else {
      if (acc.krwCash < costInKRW) {
        showToast('원화 예수금이 부족합니다.');
        return;
      }
    }

    acc.pendingOrders.unshift({
      id: 'ord_' + Date.now(),
      time: Date.now(),
      ticker: q.ticker,
      name: q.name,
      type: 'buy',
      price: executionPrice,
      qty,
      market: q.market,
    });
    saveState();
    showToast(`${q.name} ${qty}주 지정가 매수 주문이 제출되었습니다.`);
    closeModal('stockDetailModal');
    renderApp();
    return;
  }

  // Market Order Execution
  if (isUsd) {
    const costUSD = executionPrice * qty;
    let usdAvail = acc.usdCash || 0;

    if (usdAvail >= costUSD) {
      acc.usdCash -= costUSD;
    } else {
      // Auto Currency Exchange (자동 환전)
      const missingUSD = costUSD - usdAvail;
      const requiredKRW = missingUSD * MockState.liveRate;

      if ((acc.krwCash || 0) < requiredKRW) {
        showToast('예수금이 부족합니다. (원화 + 달러 합산 부족)');
        return;
      }

      acc.krwCash -= requiredKRW;
      acc.usdCash = 0;
      showToast(`USD 부족으로 ₩${Math.round(requiredKRW).toLocaleString()}원이 $${missingUSD.toFixed(2)}로 자동 환전되어 매수되었습니다.`);
    }
  } else {
    const costKRW = executionPrice * qty;
    if ((acc.krwCash || 0) < costKRW) {
      showToast('원화 예수금이 부족합니다.');
      return;
    }
    acc.krwCash -= costKRW;
  }

  if (!acc.holdings[ticker]) {
    acc.holdings[ticker] = { ticker: q.ticker, name: q.name, market: q.market, qty: 0, avgPrice: 0, totalCost: 0 };
  }

  const h = acc.holdings[ticker];
  const newCostKRW = isUsd ? (executionPrice * qty * MockState.liveRate) : (executionPrice * qty);

  h.qty += qty;
  h.totalCost += newCostKRW;
  h.avgPrice = (h.totalCost / (h.qty * (isUsd ? MockState.liveRate : 1)));

  acc.executedOrders.unshift({
    id: 'ord_' + Date.now(),
    time: Date.now(),
    ticker: q.ticker,
    name: q.name,
    type: 'buy',
    price: executionPrice,
    qty,
    market: q.market,
    totalKRW: newCostKRW,
  });

  saveState();
  showToast(`${q.name} ${qty}주 매수 완료!`);
  closeModal('stockDetailModal');
  renderApp();
}

function executeSellOrder(ticker, qty, targetPrice, isMarket) {
  const acc = getActiveAccount();
  if (!acc) return;

  const h = acc.holdings[ticker];
  if (!h || h.qty < qty) {
    showToast('보유 수량이 부족합니다.');
    return;
  }

  const q = MockState.quotes[ticker];
  const executionPrice = isMarket ? q.price : targetPrice;
  const isUsd = q.market === 'us';

  if (!isMarket) {
    acc.pendingOrders.unshift({
      id: 'ord_' + Date.now(),
      time: Date.now(),
      ticker: q.ticker,
      name: q.name,
      type: 'sell',
      price: executionPrice,
      qty,
      market: q.market,
    });
    saveState();
    showToast(`${q.name} ${qty}주 지정가 매도 주문이 제출되었습니다.`);
    closeModal('stockDetailModal');
    renderApp();
    return;
  }

  const revenueUSD = isUsd ? executionPrice * qty : 0;
  const revenueKRW = isUsd ? (executionPrice * qty * MockState.liveRate) : (executionPrice * qty);

  if (isUsd) acc.usdCash = (acc.usdCash || 0) + revenueUSD;
  else acc.krwCash = (acc.krwCash || 0) + revenueKRW;

  const pnlKRW = isUsd ? (executionPrice - h.avgPrice) * qty * MockState.liveRate : (executionPrice - h.avgPrice) * qty;
  const returnPct = ((executionPrice - h.avgPrice) / h.avgPrice) * 100;

  acc.realizedPnl.unshift({
    id: 'pnl_' + Date.now(),
    time: Date.now(),
    ticker: q.ticker,
    name: q.name,
    pnlKRW,
    returnPct,
    qty,
    market: q.market,
  });

  h.qty -= qty;
  h.totalCost -= (isUsd ? h.avgPrice * qty * MockState.liveRate : h.avgPrice * qty);
  if (h.qty <= 0) delete acc.holdings[ticker];

  acc.executedOrders.unshift({
    id: 'ord_' + Date.now(),
    time: Date.now(),
    ticker: q.ticker,
    name: q.name,
    type: 'sell',
    price: executionPrice,
    qty,
    market: q.market,
    totalKRW: revenueKRW,
  });

  saveState();
  showToast(`${q.name} ${qty}주 매도 완료 (실현손익: ${pnlKRW >= 0 ? '+' : ''}₩${Math.round(pnlKRW).toLocaleString()})`);
  closeModal('stockDetailModal');
  renderApp();
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
    showToast(`₩${amount.toLocaleString()}원 → $${acquiredUSD.toFixed(2)} 달러 환전 완료!`);
  } else {
    if ((acc.usdCash || 0) < amount) {
      showToast('환전할 달러 잔고가 부족합니다.');
      return;
    }
    const acquiredKRW = amount * MockState.liveRate;
    acc.usdCash -= amount;
    acc.krwCash += acquiredKRW;
    showToast(`$${amount.toFixed(2)} 달러 → ₩${Math.round(acquiredKRW).toLocaleString()}원 환전 완료!`);
  }

  saveState();
  closeModal('exchangeModal');
  renderApp();
}

// ── Main Page Renderer ──
function renderApp() {
  const acc = getActiveAccount();
  const root = document.getElementById('appMainRoot');
  if (!root) return;

  // 1. If 0 accounts, render FULL PAGE Account Creation Page directly!
  if (!acc && Object.keys(MockState.accounts).length === 0) {
    renderAccountCreationPage(root, 'realtime', false);
    return;
  }

  // 2. Render Main Platform Layout
  renderAccountDropdown();
  renderHeroSummary();

  const mainTabContent = document.getElementById('mainTabContent');
  if (!mainTabContent) return;

  if (MockState.currentTab === 'base') renderBaseDashboard(mainTabContent);
  else if (MockState.currentTab === 'watchlist') renderWatchlistPage(mainTabContent);
  else if (MockState.currentTab === 'discovery') renderDiscoveryPage(mainTabContent);
  else if (MockState.currentTab === 'feed') renderFeedPage(mainTabContent);
  else if (MockState.currentTab === 'exchange') renderExchangePage(mainTabContent);
}

// ── Full Page Account Setup Screen ──
function renderAccountCreationPage(container, defaultMode, isSecond) {
  const modeToShow = defaultMode || 'realtime';
  MockState.setupModeType = modeToShow;

  let html = `
    <div class="full-page-setup">
      <div class="setup-header">
        <div style="font-size:24px; font-weight:900; color:var(--text);">StockLens 모의투자 계좌 개설</div>
        <div style="font-size:14px; color:var(--muted); margin-top:4px;">
          ${isSecond ? '두 번째 계좌 개설을 위해 방식을 확인하고 초기 예수금을 설정하세요.' : '모의투자를 시작하기 위해 첫 번째 계좌 방식을 선택하고 예수금을 설정합니다.'}
        </div>
      </div>

      <!-- Step 1: Mode Selection -->
      <div style="margin-bottom:24px;">
        <div style="font-size:14px; font-weight:800; color:var(--muted); margin-bottom:12px;">STEP 1. 투자 방식 선택</div>
        
        <div class="setup-mode-grid">
  `;

  if (!isSecond || !MockState.accounts['realtime']) {
    html += `
      <div id="setup_opt_realtime" class="setup-mode-card ${MockState.setupModeType === 'realtime' ? 'selected' : ''}" onclick="selectSetupMode('realtime')">
        <div class="setup-mode-title">📈 실시간 실전형 계좌 (Real-Time Mode)</div>
        <div class="setup-mode-desc">
          실제 KOSPI/NASDAQ 개장 시간에 맞춰 실시간 주가, 호가, 거래량 데이터로 거래합니다. 실제 시장 수익률과 똑같은 환경의 장기 투자 시뮬레이션입니다.
        </div>
      </div>
    `;
  }

  if (!isSecond || !MockState.accounts['virtual']) {
    html += `
      <div id="setup_opt_virtual" class="setup-mode-card ${MockState.setupModeType === 'virtual' ? 'selected' : ''}" onclick="selectSetupMode('virtual')">
        <div class="setup-mode-title">⚡ 가상상황 쾌속형 계좌 (Virtual Scenario Mode)</div>
        <div class="setup-mode-desc">
          30분 동안 신속하고 다이나믹하게 모의투자를 즐길 수 있습니다! 주가 변동성이 높고, 초고속 배당금 입금과 가상 호가가 적용되는 게임형 쾌속 모드입니다.
        </div>
      </div>
    `;
  }

  html += `
        </div>
      </div>

      <!-- Step 2: Capital Selection -->
      <div style="margin-bottom:28px;">
        <div style="font-size:14px; font-weight:800; color:var(--muted); margin-bottom:12px;">STEP 2. 초기 모의 예수금 지불 지원</div>
        <div style="font-size:13px; color:var(--text2); margin-bottom:12px;">원하는 초기 모의 예수금 규모를 선택해주세요.</div>

        <div class="capital-btn-grid">
          <div class="capital-btn ${MockState.setupCapitalAmount === 1000000 ? 'selected' : ''}" onclick="selectSetupCapital(1000000, this)">
            <div>₩100만원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">소액 스타트 펀드</div>
          </div>
          <div class="capital-btn ${MockState.setupCapitalAmount === 10000000 ? 'selected' : ''}" onclick="selectSetupCapital(10000000, this)">
            <div>₩1,000만원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">표준 연습 펀드 (추천)</div>
          </div>
          <div class="capital-btn ${MockState.setupCapitalAmount === 100000000 ? 'selected' : ''}" onclick="selectSetupCapital(100000000, this)">
            <div>₩1억원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">다각화 포트폴리오</div>
          </div>
          <div class="capital-btn ${MockState.setupCapitalAmount === 1000000000 ? 'selected' : ''}" onclick="selectSetupCapital(1000000000, this)">
            <div>₩10억원</div>
            <div style="font-size:11px; font-weight:500; opacity:0.8; margin-top:2px;">초대형 퀀트 펀드</div>
          </div>
        </div>
      </div>

      <button class="primary-action-btn" onclick="finishFullPageAccountCreation()">🎉 계좌 개설 완료 및 모의투자 시작하기</button>
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

// ── Dropdown & Summary Headers ──
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
            <div style="font-size:11px; color:var(--muted);">₩${Math.floor(a.krwCash).toLocaleString()}원 보유</div>
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

  if (totalInvEl) totalInvEl.textContent = `₩${Math.floor(totalStockKRW).toLocaleString()}원 (총 자산: ₩${Math.floor(grandTotalKRW).toLocaleString()}원)`;
  if (pnlEl) {
    const upClass = totalPnlKRW > 0 ? 'up' : (totalPnlKRW < 0 ? 'down' : 'flat');
    const sign = totalPnlKRW > 0 ? '+' : '';
    pnlEl.className = `hero-pnl-row ${upClass}`;
    pnlEl.innerHTML = `평가손익: ${sign}₩${Math.round(totalPnlKRW).toLocaleString()}원 (${sign}${totalReturnPct.toFixed(2)}%)`;
  }

  if (krwValEl) krwValEl.textContent = `₩${Math.floor(krwCash).toLocaleString()}원`;
  if (usdValEl) usdValEl.textContent = `$${(acc.usdCash || 0).toFixed(2)}`;
}

// ── Base Dashboard View (`기본 화면 / 기초 화면`) ──
function renderBaseDashboard(container) {
  const acc = getActiveAccount();
  if (!acc) return;

  const holdingItems = Object.values(acc.holdings).filter(h => {
    if (MockState.holdingFilter === 'kr') return h.market === 'kr';
    if (MockState.holdingFilter === 'us') return h.market === 'us';
    return true;
  });

  // Sorting
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

  let html = `
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
            <button class="pill-btn ${MockState.currencyView === 'krw' ? 'active' : ''}" onclick="setCurrencyView('krw')">원화(₩)</button>
            <button class="pill-btn ${MockState.currencyView === 'usd' ? 'active' : ''}" onclick="setCurrencyView('usd')">달러($)</button>
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
        <div style="font-size:32px; margin-bottom:8px;">📈</div>
        <div style="font-size:16px; font-weight:800; color:var(--text); margin-bottom:4px;">보유 중인 주식이 없습니다</div>
        <div style="font-size:13px; color:var(--muted);">[발견 / 종목 탐색] 탭에서 마음에 드는 종목을 선택해 첫 매수를 시작해보세요!</div>
      </div>
    `;
  } else {
    html += `<div style="margin-bottom:32px;">`;
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
          displayPriceStr = `₩${Math.round(curPrice * MockState.liveRate).toLocaleString()}`;
          displayAvgStr = `₩${Math.round(h.avgPrice * MockState.liveRate).toLocaleString()}`;
          displayValStr = `₩${Math.round(curPrice * h.qty * MockState.liveRate).toLocaleString()}`;
        }
      } else {
        displayPriceStr = `₩${Math.round(curPrice).toLocaleString()}`;
        displayAvgStr = `₩${Math.round(h.avgPrice).toLocaleString()}`;
        displayValStr = `₩${Math.round(curPrice * h.qty).toLocaleString()}`;
      }

      const upClass = pnlPct > 0 ? 'up' : (pnlPct < 0 ? 'down' : 'flat');
      const sign = pnlPct > 0 ? '+' : '';

      html += `
        <div class="stock-row-card" onclick="openStockDetailModal('${h.ticker}')">
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
    html += `</div>`;
  }

  // Section 2: Orders History (주문 내역)
  html += `
    <div class="card" style="margin-bottom:24px;">
      <div style="font-size:16px; font-weight:900; margin-bottom:12px; color:var(--text);">주문 내역 (대기중 & 최근 체결)</div>
  `;
  if (acc.pendingOrders && acc.pendingOrders.length) {
    acc.pendingOrders.forEach(o => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border);">
          <div>
            <span style="font-weight:800; font-size:14px;">${o.name}</span>
            <span class="badge-mock" style="margin-left:6px;">${o.type === 'buy' ? '매수대기' : '매도대기'}</span>
            <div style="font-size:12px; color:var(--muted);">${o.qty}주 @ ${o.market === 'us' ? '$' + o.price.toFixed(2) : '₩' + o.price.toLocaleString() + '원'}</div>
          </div>
          <button onclick="cancelPendingOrder('${o.id}')" style="padding:4px 10px; background:var(--surface3); border:none; border-radius:6px; font-size:12px; font-weight:700; color:var(--up-color); cursor:pointer;">취소</button>
        </div>
      `;
    });
  } else {
    html += `<div style="font-size:13px; color:var(--muted); padding:8px 0;">대기 중인 지정가 주문이 없습니다.</div>`;
  }
  html += `</div>`;

  // Section 3: Sales Profit (판매 수익 / 실현 손익)
  let totalRealizedKRW = 0;
  acc.realizedPnl.forEach(p => totalRealizedKRW += p.pnlKRW);
  html += `
    <div class="card" style="margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-size:16px; font-weight:900; color:var(--text);">판매 수익 (누적 실현손익)</div>
        <div style="font-size:16px; font-weight:900; color:${totalRealizedKRW >= 0 ? 'var(--up-color)' : 'var(--down-color)'};">
          ${totalRealizedKRW >= 0 ? '+' : ''}₩${Math.round(totalRealizedKRW).toLocaleString()}원
        </div>
      </div>
  `;
  if (acc.realizedPnl.length) {
    acc.realizedPnl.slice(0, 5).forEach(p => {
      const upClass = p.pnlKRW >= 0 ? 'up' : 'down';
      const sign = p.pnlKRW >= 0 ? '+' : '';
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border);">
          <div>
            <div style="font-weight:700; font-size:13px;">${p.name} (${p.qty}주 매도)</div>
            <div style="font-size:11px; color:var(--muted);">${new Date(p.time).toLocaleString('ko-KR')}</div>
          </div>
          <div style="text-align:right;">
            <div class="${upClass}" style="font-weight:800; font-size:14px;">${sign}₩${Math.round(p.pnlKRW).toLocaleString()}원</div>
            <div class="${upClass}" style="font-size:11px; font-weight:700;">${sign}${p.returnPct.toFixed(2)}%</div>
          </div>
        </div>
      `;
    });
  } else {
    html += `<div style="font-size:13px; color:var(--muted); padding:8px 0;">아직 매도 확정된 판매 수익이 없습니다.</div>`;
  }
  html += `</div>`;

  // Section 4: Dividend History (배당금 내역)
  html += `
    <div class="card">
      <div style="font-size:16px; font-weight:900; margin-bottom:12px; color:var(--text);">입금된 배당금 내역</div>
  `;
  if (acc.dividendHistory && acc.dividendHistory.length) {
    acc.dividendHistory.slice(0, 5).forEach(d => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border);">
          <div>
            <div style="font-weight:700; font-size:13px;">${d.name} <span class="badge-mock" style="background:var(--up-bg); color:var(--up-color);">배당입금</span></div>
            <div style="font-size:11px; color:var(--muted);">${new Date(d.time).toLocaleString('ko-KR')}</div>
          </div>
          <div class="up" style="font-weight:900; font-size:14px;">
            +${d.isUsd ? '$' + d.amount.toFixed(2) : '₩' + Math.floor(d.amount).toLocaleString() + '원'}
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
  let html = `<div style="font-size:18px; font-weight:900; margin-bottom:16px;">★ 관심 종목 목록 (${favIds.length}개)</div>`;

  if (!favIds.length) {
    html += `<div class="card empty-state-box">등록된 관심 종목이 없습니다. 종목 탐색에서 ♡ 버튼을 눌러 관심종목을 등록해보세요!</div>`;
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
              <div class="stock-price-main">${q.market === 'us' ? '$' + q.price.toFixed(2) : '₩' + Math.round(q.price).toLocaleString() + '원'}</div>
              <div class="stock-change-sub ${upClass}">${sign}${q.changePct.toFixed(2)}%</div>
            </div>
            <button onclick="event.stopPropagation(); toggleWatchlist('${q.id}')" style="background:none; border:none; font-size:20px; color:var(--up-color); cursor:pointer;">♥</button>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// ── Discovery Feed Page (`발견 / 종목 탐색` - Reference Image Match) ──
function renderDiscoveryPage(container) {
  const categoryFilter = MockState.discoveryCategory;
  const filteredDefs = MOCK_STOCK_DEFS.filter(s => {
    if (categoryFilter === 'us') return s.market === 'us';
    if (categoryFilter === 'kr') return s.market === 'kr';
    if (categoryFilter === 'bond') return s.category === '채권';
    if (categoryFilter === 'etf') return s.category === 'ETF';
    return true;
  });

  // Rank sorting
  filteredDefs.sort((a, b) => {
    const qA = MockState.quotes[a.id] || a;
    const qB = MockState.quotes[b.id] || b;
    if (MockState.discoveryRankType === 'up') return qB.changePct - qA.changePct;
    if (MockState.discoveryRankType === 'down') return qA.changePct - qB.changePct;
    if (MockState.discoveryRankType === 'val') return (qB.price * (b.market === 'us' ? MockState.liveRate : 1)) - (qA.price * (a.market === 'us' ? MockState.liveRate : 1));
    return b.valScore - a.valScore;
  });

  let html = `
    <!-- Indices Banner -->
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

    <!-- Category Badges -->
    <div class="category-badges-row">
      <div class="cat-badge ${categoryFilter === 'us' ? 'active' : ''}" onclick="setDiscoveryCategory('us')">🇺🇸 해외주식</div>
      <div class="cat-badge ${categoryFilter === 'kr' ? 'active' : ''}" onclick="setDiscoveryCategory('kr')">🇰🇷 국내주식</div>
      <div class="cat-badge ${categoryFilter === 'bond' ? 'active' : ''}" onclick="setDiscoveryCategory('bond')">📜 채권</div>
      <div class="cat-badge ${categoryFilter === 'etf' ? 'active' : ''}" onclick="setDiscoveryCategory('etf')">📊 ETF</div>
    </div>

    <!-- News Ticker -->
    <div class="news-ticker-card">
      <div class="news-ticker-text">
        <span class="tag-news">실시간 이슈</span>
        <span>4 알파벳 실적 시험대 · 2분기 경제성장률(GDP) 발표(속보치) 임박</span>
      </div>
      <span style="font-size:12px; color:var(--accent); font-weight:700; cursor:pointer;">전체보기 ></span>
    </div>

    <!-- Live Leaderboard Tabs -->
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div style="font-size:18px; font-weight:900; color:var(--text);">실시간 차트</div>

      <div class="filter-pills">
        <button class="pill-btn ${MockState.discoveryRankType === 'val' ? 'active' : ''}" onclick="setDiscoveryRankType('val')">거래대금</button>
        <button class="pill-btn ${MockState.discoveryRankType === 'volume' ? 'active' : ''}" onclick="setDiscoveryRankType('volume')">거래량</button>
        <button class="pill-btn ${MockState.discoveryRankType === 'up' ? 'active' : ''}" onclick="setDiscoveryRankType('up')">급상승</button>
        <button class="pill-btn ${MockState.discoveryRankType === 'down' ? 'active' : ''}" onclick="setDiscoveryRankType('down')">급하락</button>
        <button class="pill-btn ${MockState.discoveryRankType === 'popular' ? 'active' : ''}" onclick="setDiscoveryRankType('popular')">인기</button>
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
          <div style="font-size:16px; font-weight:900; color:var(--muted); width:24px;">${idx + 1}</div>
          <div class="stock-icon-avatar">${s.name.substring(0, 1)}</div>
          <div>
            <div class="stock-name-title">${s.name}</div>
            <div class="stock-sub-desc">${s.category} · ${s.id}</div>
          </div>
        </div>
        <div class="stock-val-right" style="display:flex; align-items:center; gap:16px;">
          <div>
            <div class="stock-price-main">${s.market === 'us' ? '$' + q.price.toFixed(2) : '₩' + Math.round(q.price).toLocaleString() + '원'}</div>
            <div class="stock-change-sub ${upClass}">${sign}${q.changePct.toFixed(2)}%</div>
          </div>
          <button onclick="event.stopPropagation(); toggleWatchlist('${s.id}')" style="background:none; border:none; font-size:20px; cursor:pointer; color:${isFav ? 'var(--up-color)' : 'var(--border2)'}">
            ${isFav ? '♥' : '♡'}
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function setDiscoveryCategory(cat) { MockState.discoveryCategory = MockState.discoveryCategory === cat ? 'all' : cat; renderApp(); }
function setDiscoveryRankType(type) { MockState.discoveryRankType = type; renderApp(); }

// ── Feed / Community Page (`피드`) ──
function renderFeedPage(container) {
  container.innerHTML = `
    <div class="card" style="max-width:640px; margin:0 auto;">
      <div style="font-size:20px; font-weight:900; margin-bottom:16px;">실시간 주식 토론 피드</div>
      
      <div class="stock-row-card" style="cursor:default; margin-bottom:12px;">
        <div class="stock-info-left">
          <div class="stock-icon-avatar" style="background:var(--accent-light); color:var(--accent);">SK</div>
          <div>
            <div class="stock-name-title">SK하이닉스 실시간 피드</div>
            <div class="stock-sub-desc">"HBM3E 공급 확대로 하반기 영업이익 최고치 예상"</div>
          </div>
        </div>
        <div style="font-size:12px; color:var(--muted);">방금 전</div>
      </div>

      <div class="stock-row-card" style="cursor:default; margin-bottom:12px;">
        <div class="stock-info-left">
          <div class="stock-icon-avatar" style="background:var(--up-bg); color:var(--up-color);">NV</div>
          <div>
            <div class="stock-name-title">엔비디아 (NVDA) 피드</div>
            <div class="stock-sub-desc">"블랙웰 차세대 칩 수요 폭발적인 증가 지속!"</div>
          </div>
        </div>
        <div style="font-size:12px; color:var(--muted);">2분 전</div>
      </div>

      <div class="stock-row-card" style="cursor:default;">
        <div class="stock-info-left">
          <div class="stock-icon-avatar" style="background:var(--yellow-bg); color:var(--yellow);">TS</div>
          <div>
            <div class="stock-name-title">테슬라 (TSLA) 피드</div>
            <div class="stock-sub-desc">"로보택시 공개 일정 카운트다운 시작"</div>
          </div>
        </div>
        <div style="font-size:12px; color:var(--muted);">5분 전</div>
      </div>
    </div>
  `;
}

// ── Exchange Page (`환전소`) ──
function renderExchangePage(container) {
  const acc = getActiveAccount();
  if (!acc) return;

  container.innerHTML = `
    <div class="card" style="max-width:540px; margin:0 auto;">
      <div style="font-size:20px; font-weight:900; margin-bottom:16px;">실시간 환전 센터</div>
      <div style="font-size:13px; color:var(--muted); margin-bottom:20px;">
        현재 미 달러 적용 환율: <strong style="color:var(--text);">1 USD = ₩${MockState.liveRate.toLocaleString()}원</strong>
      </div>

      <div style="background:var(--surface2); border-radius:var(--radius-md); padding:16px; margin-bottom:20px;">
        <div style="font-size:12px; color:var(--muted); margin-bottom:6px;">현재 계좌 예수금 보유 현황</div>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px;">
          <span>원화(KRW): ₩${Math.floor(acc.krwCash).toLocaleString()}원</span>
          <span>달러(USD): $${(acc.usdCash || 0).toFixed(2)}</span>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:13px; font-weight:700; color:var(--text2); display:block; margin-bottom:6px;">환전 방향 선택</label>
        <select id="tabExDir" class="select-control" style="width:100%; padding:10px;">
          <option value="KRW">원화(₩) → 달러($) 구매</option>
          <option value="USD">달러($) → 원화(₩) 환전</option>
        </select>
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px; font-weight:700; color:var(--text2); display:block; margin-bottom:6px;">환전 신청 금액</label>
        <input type="number" id="tabExAmt" class="select-control" style="width:100%; padding:10px; font-size:16px;" placeholder="금액 입력">
      </div>

      <button class="primary-action-btn" onclick="submitTabExchange()">즉시 환전 실행</button>
    </div>
  `;
}

function submitTabExchange() {
  const dir = document.getElementById('tabExDir').value;
  const amt = parseFloat(document.getElementById('tabExAmt').value);
  if (!amt || amt <= 0) { showToast('올바른 금액을 입력하세요.'); return; }
  executeManualExchange(dir, amt);
}

// ── Stock Detail Modal with Analysis & Order Book Depth ──
function openStockDetailModal(ticker) {
  const q = MockState.quotes[ticker] || MOCK_STOCK_DEFS.find(s => s.id === ticker);
  if (!q) return;

  MockState.activeDetailStock = q;
  const modal = document.getElementById('stockDetailModal');
  if (!modal) return;

  document.getElementById('modalStockTitle').textContent = `${q.name} (${q.id})`;
  document.getElementById('modalStockPrice').textContent = q.market === 'us' ? `$${q.price.toFixed(2)}` : `₩${Math.round(q.price).toLocaleString()}원`;

  const changeEl = document.getElementById('modalStockChange');
  const upClass = q.changePct > 0 ? 'up' : (q.changePct < 0 ? 'down' : 'flat');
  const sign = q.changePct > 0 ? '+' : '';
  changeEl.className = `stock-change-sub ${upClass}`;
  changeEl.textContent = `${sign}${q.changePct.toFixed(2)}%`;

  const favBtn = document.getElementById('modalFavBtn');
  if (favBtn) {
    const isFav = MockState.watchlist.has(q.id);
    favBtn.textContent = isFav ? '♥ 관심 등록됨' : '♡ 관심종목 추가';
  }

  // Stock Analysis Factors (Valuation, Growth, Whale accumulation)
  const factorEl = document.getElementById('modalAnalysisFactors');
  if (factorEl) {
    factorEl.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:16px;">
        <div style="background:var(--surface2); padding:10px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:11px; color:var(--muted);">밸류에이션 점수</div>
          <div style="font-size:16px; font-weight:900; color:var(--accent);">${q.valScore || 85}점</div>
        </div>
        <div style="background:var(--surface2); padding:10px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:11px; color:var(--muted);">성장성 평가</div>
          <div style="font-size:16px; font-weight:900; color:var(--up-color);">${q.growthScore || 90}점</div>
        </div>
        <div style="background:var(--surface2); padding:10px; border-radius:var(--radius-sm); text-align:center;">
          <div style="font-size:11px; color:var(--muted);">배당 수익률</div>
          <div style="font-size:16px; font-weight:900; color:var(--green);">${q.divYield || 0.0}%</div>
        </div>
      </div>
    `;
  }

  renderOrderBookDepth(q);
  initTradingViewChart(q);

  modal.classList.add('active');
}

function toggleModalWatchlist() {
  const stock = MockState.activeDetailStock;
  if (!stock) return;
  toggleWatchlist(stock.id);
  const favBtn = document.getElementById('modalFavBtn');
  if (favBtn) {
    const isFav = MockState.watchlist.has(stock.id);
    favBtn.textContent = isFav ? '♥ 관심 등록됨' : '♡ 관심종목 추가';
  }
}

function renderOrderBookDepth(q) {
  const container = document.getElementById('modalOrderBookContainer');
  if (!container) return;

  const currentPrice = q.price;
  const isUsd = q.market === 'us';
  const step = isUsd ? 0.5 : (currentPrice > 100000 ? 500 : 100);

  let html = '<div class="order-book-container">';

  for (let i = 5; i >= 1; i--) {
    const p = currentPrice + (i * step);
    const vol = Math.floor(Math.random() * 3000) + 200;
    const depthPct = Math.min(100, (vol / 3500) * 100);
    html += `
      <div class="order-book-row ask" onclick="fillOrderPrice(${p})">
        <span>${isUsd ? '$' + p.toFixed(2) : '₩' + Math.round(p).toLocaleString()}</span>
        <span>${vol.toLocaleString()}주</span>
        <div class="order-book-depth-bar" style="width:${depthPct}%;"></div>
      </div>
    `;
  }

  html += `
    <div class="order-book-row current-price">
      <span>${isUsd ? '$' + currentPrice.toFixed(2) : '₩' + Math.round(currentPrice).toLocaleString()} (현재가)</span>
      <span>체결중</span>
    </div>
  `;

  for (let i = 1; i <= 5; i++) {
    const p = Math.max(1, currentPrice - (i * step));
    const vol = Math.floor(Math.random() * 3000) + 200;
    const depthPct = Math.min(100, (vol / 3500) * 100);
    html += `
      <div class="order-book-row bid" onclick="fillOrderPrice(${p})">
        <span>${isUsd ? '$' + p.toFixed(2) : '₩' + Math.round(p).toLocaleString()}</span>
        <span>${vol.toLocaleString()}주</span>
        <div class="order-book-depth-bar" style="width:${depthPct}%;"></div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function fillOrderPrice(p) {
  const input = document.getElementById('orderPriceInput');
  if (input) input.value = p;
}

function initTradingViewChart(q) {
  const cont = document.getElementById('tvChartContainer');
  if (!cont || typeof LightweightCharts === 'undefined') return;

  if (MockState.tvChartObj) {
    try { MockState.tvChartObj.remove(); } catch (e) {}
    MockState.tvChartObj = null;
  }
  cont.innerHTML = '';

  const isUp = q.changePct >= 0;
  const upColor = '#F04452', downColor = '#3182F6';

  const chart = LightweightCharts.createChart(cont, {
    height: 260,
    layout: { background: { color: 'transparent' }, textColor: '#86868B', fontSize: 11 },
    grid: { vertLines: { visible: false }, horzLines: { visible: false } },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false, timeVisible: true },
  });

  const series = chart.addAreaSeries({
    topColor: isUp ? 'rgba(240, 68, 82, 0.25)' : 'rgba(49, 130, 246, 0.25)',
    bottomColor: 'rgba(255, 255, 255, 0.0)',
    lineColor: isUp ? upColor : downColor,
    lineWidth: 2,
  });

  const now = Math.floor(Date.now() / 1000);
  const dataPoints = [];
  let baseP = q.price * 0.95;
  for (let i = 30; i >= 0; i--) {
    baseP += (Math.random() - 0.48) * (q.price * 0.015);
    dataPoints.push({ time: now - (i * 86400), value: Math.max(1, baseP) });
  }
  dataPoints[dataPoints.length - 1].value = q.price;

  series.setData(dataPoints);
  MockState.tvChartObj = chart;
}

function submitOrderFromModal() {
  const stock = MockState.activeDetailStock;
  if (!stock) return;

  const qty = parseInt(document.getElementById('orderQtyInput').value) || 0;
  if (qty <= 0) { showToast('매수/매도 수량을 입력하세요.'); return; }

  const isMarket = MockState.orderPriceMode === 'market';
  const priceInput = parseFloat(document.getElementById('orderPriceInput').value);
  const targetPrice = isMarket ? stock.price : (priceInput || stock.price);

  if (MockState.orderType === 'buy') {
    executeBuyOrder(stock.id, qty, targetPrice, isMarket);
  } else {
    executeSellOrder(stock.id, qty, targetPrice, isMarket);
  }
}

// ── Event Handlers ──
function setupEventListeners() {
  document.querySelectorAll('.bnav-tab-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.bnav-tab-item').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      MockState.currentTab = target.getAttribute('data-tab');
      renderApp();
    });
  });
}

function switchNavTab(tabName) {
  MockState.currentTab = tabName;
  document.querySelectorAll('.bnav-tab-item').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
  });
  renderApp();
}

function toggleWatchlist(ticker) {
  if (MockState.watchlist.has(ticker)) {
    MockState.watchlist.delete(ticker);
    showToast('관심종목에서 제거되었습니다.');
  } else {
    MockState.watchlist.add(ticker);
    showToast('관심종목에 추가되었습니다! ♥');
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
