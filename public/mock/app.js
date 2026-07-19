// ── StockLens Mock Investment Masterclass Engine (Toss White Style) ──

// ── Default Stock Definitions ──
const MOCK_STOCK_DEFS = [
  // 국내 KOSPI / KOSDAQ
  { id: '005930', ticker: '005930', name: '삼성전자', market: 'kr', price: 78500, changePct: 1.25, divYield: 2.45, category: '국내주식' },
  { id: '000660', ticker: '000660', name: 'SK하이닉스', market: 'kr', price: 183000, changePct: -2.14, divYield: 1.20, category: '국내주식' },
  { id: '373220', ticker: '373220', name: 'LG에너지솔루션', market: 'kr', price: 382000, changePct: 0.52, divYield: 0.00, category: '국내주식' },
  { id: '005380', ticker: '005380', name: '현대차', market: 'kr', price: 253500, changePct: 3.47, divYield: 4.80, category: '국내주식' },
  { id: '035420', ticker: '035420', name: 'NAVER', market: 'kr', price: 172000, changePct: -0.86, divYield: 0.95, category: '국내주식' },
  { id: '035720', ticker: '035720', name: '카카오', market: 'kr', price: 42100, changePct: -1.41, divYield: 0.70, category: '국내주식' },
  { id: '068270', ticker: '068270', name: '셀트리온', market: 'kr', price: 194000, changePct: 1.84, divYield: 0.45, category: '국내주식' },
  { id: '000270', ticker: '000270', name: '기아', market: 'kr', price: 118500, changePct: 2.60, divYield: 5.10, category: '국내주식' },
  { id: '105560', ticker: '105560', name: 'KB금융', market: 'kr', price: 79200, changePct: 4.21, divYield: 4.10, category: '국내주식' },
  { id: '005490', ticker: '005490', name: 'POSCO홀딩스', market: 'kr', price: 365000, changePct: -0.54, divYield: 2.80, category: '국내주식' },

  // 해외 US Tech & Leaders
  { id: 'NVDA', ticker: 'NVDA', name: '엔비디아 (NVIDIA)', market: 'us', price: 128.50, changePct: 3.85, divYield: 0.12, category: '해외주식' },
  { id: 'AAPL', ticker: 'AAPL', name: '애플 (Apple)', market: 'us', price: 224.30, changePct: 0.75, divYield: 0.45, category: '해외주식' },
  { id: 'MSFT', ticker: 'MSFT', name: '마이크로소프트 (MSFT)', market: 'us', price: 448.90, changePct: -0.42, divYield: 0.68, category: '해외주식' },
  { id: 'GOOGL', ticker: 'GOOGL', name: '알파벳 A (Google)', market: 'us', price: 178.20, changePct: -1.10, divYield: 0.45, category: '해외주식' },
  { id: 'AMZN', ticker: 'AMZN', name: '아마존 (Amazon)', market: 'us', price: 186.40, changePct: 1.50, divYield: 0.00, category: '해외주식' },
  { id: 'META', ticker: 'META', name: '메타 (Meta)', market: 'us', price: 495.20, changePct: 2.15, divYield: 0.40, category: '해외주식' },
  { id: 'TSLA', ticker: 'TSLA', name: '테슬라 (Tesla)', market: 'us', price: 248.80, changePct: 5.60, divYield: 0.00, category: '해외주식' },
  { id: 'PLTR', ticker: 'PLTR', name: '팔란티어 (Palantir)', market: 'us', price: 28.40, changePct: 4.30, divYield: 0.00, category: '해외주식' },
  { id: 'AVGO', ticker: 'AVGO', name: '브로드컴 (Broadcom)', market: 'us', price: 172.60, changePct: -1.80, divYield: 1.25, category: '해외주식' },
  { id: 'JPM', ticker: 'JPM', name: 'JP모건 체이스', market: 'us', price: 206.50, changePct: 1.10, divYield: 2.25, category: '해외주식' },

  // 채권 & ETF
  { id: 'SPY', ticker: 'SPY', name: 'S&P 500 ETF (SPY)', market: 'us', price: 556.80, changePct: 0.45, divYield: 1.22, category: 'ETF' },
  { id: 'QQQ', ticker: 'QQQ', name: '나스닥 100 ETF (QQQ)', market: 'us', price: 492.10, changePct: 0.88, divYield: 0.58, category: 'ETF' },
  { id: 'TLT', ticker: 'TLT', name: '미국 20년+ 국채 ETF (TLT)', market: 'us', price: 94.50, changePct: -0.30, divYield: 3.85, category: '채권' },
  { id: 'TIGER200', ticker: '102110', name: 'TIGER 200 (KOSPI 200)', market: 'kr', price: 36200, changePct: 0.84, divYield: 1.90, category: 'ETF' },
];

// ── App State Store ──
let MockState = {
  accounts: {}, // { realtime: {...}, virtual: {...} }
  activeAccountId: null, // 'realtime' or 'virtual'
  liveRate: 1380.50,
  watchlist: new Set(['005930', 'NVDA', 'AAPL', 'TSLA']),
  quotes: {}, // ticker -> quote
  currentTab: 'summary', // 'summary', 'discovery', 'orders', 'pnl', 'dividends', 'exchange'
  holdingFilter: 'all', // 'all', 'kr', 'us'
  currencyView: 'krw', // 'krw', 'usd'
  sortOrder: 'val_desc',
  activeDetailStock: null,
  orderType: 'buy', // 'buy', 'sell'
  orderPriceMode: 'market', // 'market', 'limit'
  selectedOnboardingMode: null,
  selectedOnboardingCapital: 10000000,
  tvChartObj: null,
  tvSeriesObj: null,
  scenarioTimer: null,
};

// ── Initializer ──
document.addEventListener('DOMContentLoaded', async () => {
  initQuotes();
  await loadServerOrLocalStorage();
  setupUIEventListeners();
  startLiveRateFetcher();
  startVirtualScenarioEngine();
  renderApp();
});

function initQuotes() {
  MOCK_STOCK_DEFS.forEach(s => {
    MockState.quotes[s.id] = { ...s };
  });
}

// ── Persistence Engine (Server + LocalStorage Sync) ──
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
  } catch (e) {
    console.log('[Mock App] Server sync fallback to LocalStorage');
  }

  // LocalStorage Fallback
  const saved = localStorage.getItem('stocklens_mock_master_state');
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

  localStorage.setItem('stocklens_mock_master_state', JSON.stringify(payload));

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

// ── Account Creation & Onboarding Flow ──
function createNewAccount(modeType, initialCapitalKRW) {
  const isReal = modeType === 'realtime';
  const accountObj = {
    id: modeType, // 'realtime' or 'virtual'
    name: isReal ? '실시간 실전 계좌' : '가상상황 쾌속 계좌',
    type: modeType,
    krwCash: initialCapitalKRW,
    usdCash: 0,
    holdings: {}, // ticker -> { name, ticker, market, qty, avgPrice, totalCost }
    pendingOrders: [], // { id, time, ticker, name, type, price, qty, market }
    executedOrders: [], // { id, time, ticker, name, type, price, qty, totalKRW, market }
    realizedPnl: [], // { id, time, ticker, name, pnlKRW, returnPct }
    dividendHistory: [], // { id, time, ticker, name, amount, isUsd }
    createdAt: Date.now(),
  };

  MockState.accounts[modeType] = accountObj;
  MockState.activeAccountId = modeType;
  saveState();
  showToast(`${accountObj.name}가 ₩${(initialCapitalKRW / 10000).toLocaleString()}만원으로 개설되었습니다!`);
}

// ── Real-time Exchange Rate Fetcher ──
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

// ── Virtual Scenario Engine (Mode 2 Dynamic Ticks) ──
function startVirtualScenarioEngine() {
  if (MockState.scenarioTimer) clearInterval(MockState.scenarioTimer);
  MockState.scenarioTimer = setInterval(() => {
    const acc = getActiveAccount();

    // Fluctuate prices for Virtual Mode or active simulation
    MOCK_STOCK_DEFS.forEach(s => {
      const q = MockState.quotes[s.id];
      if (!q) return;

      if (acc && acc.type === 'virtual') {
        // High volatility tick (+/- 0.5% ~ 3.5%)
        const delta = (Math.random() - 0.49) * 0.04;
        const newPrice = Math.max(1, q.price * (1 + delta));
        q.changePct = ((newPrice - s.price) / s.price) * 100;
        q.price = newPrice;
      }
    });

    // Check Limit Orders
    if (acc) checkPendingLimitOrders(acc);

    // Fast Simulated Dividend drop for Virtual Mode
    if (acc && acc.type === 'virtual' && Math.random() < 0.15) {
      triggerFastVirtualDividend(acc);
    }

    if (MockState.currentTab === 'summary' || MockState.currentTab === 'discovery') {
      renderSummaryHoldings();
      renderDiscoveryFeed();
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
      showToast(`[지정가 체결] ${o.name} ${o.type === 'buy' ? '매수' : '매도'} 체결완료!`);
    } else {
      remaining.push(o);
    }
  });

  acc.pendingOrders = remaining;
  saveState();
}

function triggerFastVirtualDividend(acc) {
  const holdingKeys = Object.keys(acc.holdings);
  if (!holdingKeys.length) return;

  const randomKey = holdingKeys[Math.floor(Math.random() * holdingKeys.length)];
  const h = acc.holdings[randomKey];
  if (!h || h.qty <= 0) return;

  const q = MockState.quotes[h.ticker];
  const isUsd = h.market === 'us';
  const divPerShare = isUsd ? (q.price * 0.005) : (q.price * 0.008);
  const totalDiv = Math.round(divPerShare * h.qty * 100) / 100;

  if (isUsd) {
    acc.usdCash = (acc.usdCash || 0) + totalDiv;
  } else {
    acc.krwCash = (acc.krwCash || 0) + totalDiv;
  }

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

// ── Auto Currency Exchange & Trading Engine ──
function executeBuyOrder(ticker, qty, targetPrice, isMarket) {
  const acc = getActiveAccount();
  if (!acc) { showOnboardingModal(); return; }

  const q = MockState.quotes[ticker];
  if (!q) return;

  const executionPrice = isMarket ? q.price : targetPrice;
  const isUsd = q.market === 'us';

  if (isUsd) {
    const costInUSD = executionPrice * qty;
    let usdAvailable = acc.usdCash || 0;

    if (usdAvailable >= costInUSD) {
      // Deduct USD cash
      acc.usdCash -= costInUSD;
    } else {
      // Auto Currency Exchange (자동 환전)
      const missingUSD = costInUSD - usdAvailable;
      const requiredKRW = missingUSD * MockState.liveRate;

      if ((acc.krwCash || 0) < requiredKRW) {
        showToast('예수금이 부족합니다. (원화 + 달러 총 합산 부족)');
        return;
      }

      // Execute Auto Exchange
      acc.krwCash -= requiredKRW;
      acc.usdCash = 0; // all USD used
      showToast(`USD 부족으로 ₩${Math.round(requiredKRW).toLocaleString()}원이 $${missingUSD.toFixed(2)}로 자동 환전되어 매수되었습니다.`);
    }
  } else {
    const costInKRW = executionPrice * qty;
    if ((acc.krwCash || 0) < costInKRW) {
      showToast('원화 예수금이 부족합니다.');
      return;
    }
    acc.krwCash -= costInKRW;
  }

  // Add/Update Holding
  if (!acc.holdings[ticker]) {
    acc.holdings[ticker] = {
      ticker: q.ticker,
      name: q.name,
      market: q.market,
      qty: 0,
      avgPrice: 0,
      totalCost: 0,
    };
  }

  const h = acc.holdings[ticker];
  const oldQty = h.qty;
  const oldCost = h.totalCost;
  const newCost = isUsd ? (executionPrice * qty * MockState.liveRate) : (executionPrice * qty);

  h.qty += qty;
  h.totalCost += newCost;
  h.avgPrice = (oldCost + (executionPrice * qty)) / h.qty;

  // Log Executed Trade
  acc.executedOrders.unshift({
    id: 'ord_' + Date.now(),
    time: Date.now(),
    ticker: q.ticker,
    name: q.name,
    type: 'buy',
    price: executionPrice,
    qty,
    market: q.market,
    totalKRW: newCost,
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

  const revenueUSD = isUsd ? executionPrice * qty : 0;
  const revenueKRW = isUsd ? (executionPrice * qty * MockState.liveRate) : (executionPrice * qty);

  if (isUsd) {
    acc.usdCash = (acc.usdCash || 0) + revenueUSD;
  } else {
    acc.krwCash = (acc.krwCash || 0) + revenueKRW;
  }

  // Calculate Realized PnL
  const costBasisUSD = h.avgPrice * qty;
  const pnlUSD = executionPrice * qty - costBasisUSD;
  const pnlKRW = isUsd ? pnlUSD * MockState.liveRate : (executionPrice - h.avgPrice) * qty;
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
  if (h.qty <= 0) {
    delete acc.holdings[ticker];
  }

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
  showToast(`${q.name} ${qty}주 매도 완료 (수익금: ${pnlKRW >= 0 ? '+' : ''}₩${Math.round(pnlKRW).toLocaleString()})`);
  closeModal('stockDetailModal');
  renderApp();
}

// ── Currency Exchange Calculator Modal Logic ──
function executeManualExchange(fromCurrency, amount) {
  const acc = getActiveAccount();
  if (!acc || amount <= 0) return;

  if (fromCurrency === 'KRW') {
    if ((acc.krwCash || 0) < amount) {
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
    acc.krwCash = (acc.krwCash || 0) + acquiredKRW;
    showToast(`$${amount.toFixed(2)} 달러 → ₩${Math.round(acquiredKRW).toLocaleString()}원 환전 완료!`);
  }

  saveState();
  closeModal('exchangeModal');
  renderApp();
}

// ── UI Rendering Main Controller ──
function renderApp() {
  const acc = getActiveAccount();

  // If no account created, show Onboarding
  if (!acc) {
    showOnboardingModal();
    return;
  } else {
    closeModal('onboardingModal');
  }

  renderAccountDropdown();
  renderHeroSummary();

  // Render Sub Tabs
  if (MockState.currentTab === 'summary') renderSummaryHoldings();
  else if (MockState.currentTab === 'discovery') renderDiscoveryFeed();
  else if (MockState.currentTab === 'orders') renderOrdersHistory();
  else if (MockState.currentTab === 'pnl') renderRealizedPnl();
  else if (MockState.currentTab === 'dividends') renderDividendHistory();
  else if (MockState.currentTab === 'exchange') renderExchangeTab();
}

function renderAccountDropdown() {
  const acc = getActiveAccount();
  const titleEl = document.getElementById('activeAccountTitle');
  const badgeEl = document.getElementById('activeAccountBadge');
  const listEl = document.getElementById('accountDropdownList');

  if (titleEl) titleEl.textContent = acc.name;
  if (badgeEl) {
    badgeEl.textContent = acc.type === 'realtime' ? '실시간 실전형' : '가상상황 쾌속형';
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
      const remainingType = keys.includes('realtime') ? 'virtual' : 'realtime';
      const remainingLabel = remainingType === 'realtime' ? '실시간 실전 계좌' : '가상상황 쾌속 계좌';
      html += `
        <button class="dropdown-add-btn" onclick="openSecondAccountSetup('${remainingType}')">
          + ${remainingLabel} 추가 개설하기
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
  showToast(`계좌가 [${MockState.accounts[accId].name}]로 전환되었습니다.`);
  renderApp();
}

function toggleAccountDropdown(forceState) {
  const menu = document.getElementById('accountDropdownMenu');
  if (!menu) return;
  if (typeof forceState === 'boolean') {
    menu.classList.toggle('active', forceState);
  } else {
    menu.classList.toggle('active');
  }
}

function renderHeroSummary() {
  const acc = getActiveAccount();
  if (!acc) return;

  // Calculate Total Assets & Holdings Valuation
  let totalStockKRW = 0;
  let totalCostKRW = 0;

  Object.values(acc.holdings).forEach(h => {
    const q = MockState.quotes[h.ticker];
    const curPrice = q ? q.price : h.avgPrice;
    const isUsd = h.market === 'us';

    const curValKRW = isUsd ? (curPrice * h.qty * MockState.liveRate) : (curPrice * h.qty);
    const costValKRW = isUsd ? (h.avgPrice * h.qty * MockState.liveRate) : (h.avgPrice * h.qty);

    totalStockKRW += curValKRW;
    totalCostKRW += costValKRW;
  });

  const krwCash = acc.krwCash || 0;
  const usdCashKRW = (acc.usdCash || 0) * MockState.liveRate;
  const grandTotalKRW = krwCash + usdCashKRW + totalStockKRW;
  const totalPnlKRW = totalStockKRW - totalCostKRW;
  const totalReturnPct = totalCostKRW > 0 ? (totalPnlKRW / totalCostKRW) * 100 : 0;

  const totalEl = document.getElementById('totalAssetAmount');
  const pnlEl = document.getElementById('totalPnlRow');
  const krwValEl = document.getElementById('krwCashVal');
  const usdValEl = document.getElementById('usdCashVal');

  if (totalEl) totalEl.textContent = `₩${Math.floor(grandTotalKRW).toLocaleString()}원`;
  if (pnlEl) {
    const upClass = totalPnlKRW > 0 ? 'up' : (totalPnlKRW < 0 ? 'down' : 'flat');
    const sign = totalPnlKRW > 0 ? '+' : '';
    pnlEl.className = `hero-pnl-row ${upClass}`;
    pnlEl.innerHTML = `총 평가손익: ${sign}₩${Math.round(totalPnlKRW).toLocaleString()}원 (${sign}${totalReturnPct.toFixed(2)}%)`;
  }

  if (krwValEl) krwValEl.textContent = `₩${Math.floor(krwCash).toLocaleString()}원`;
  if (usdValEl) usdValEl.textContent = `$${(acc.usdCash || 0).toFixed(2)}`;
}

// ── Summary & Holdings View ──
function renderSummaryHoldings() {
  const acc = getActiveAccount();
  const container = document.getElementById('mainTabContent');
  if (!container || !acc) return;

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
    <div class="controls-bar">
      <div class="filter-pills">
        <button class="pill-btn ${MockState.holdingFilter === 'all' ? 'active' : ''}" onclick="setHoldingFilter('all')">전체</button>
        <button class="pill-btn ${MockState.holdingFilter === 'kr' ? 'active' : ''}" onclick="setHoldingFilter('kr')">국내주식</button>
        <button class="pill-btn ${MockState.holdingFilter === 'us' ? 'active' : ''}" onclick="setHoldingFilter('us')">해외주식</button>
      </div>

      <div style="display:flex; align-items:center; gap:10px;">
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
  `;

  if (!holdingItems.length) {
    html += `
      <div class="card empty-state-box">
        <div style="font-size:32px; margin-bottom:8px;">📈</div>
        <div style="font-size:16px; font-weight:800; color:var(--text); margin-bottom:4px;">보유 중인 주식이 없습니다</div>
        <div style="font-size:13px; color:var(--muted);">[발견 / 종목 탐색] 탭에서 마음에 드는 종목을 매수해보세요!</div>
      </div>
    `;
  } else {
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
  }

  container.innerHTML = html;
}

function setHoldingFilter(filter) { MockState.holdingFilter = filter; renderSummaryHoldings(); }
function setCurrencyView(curr) { MockState.currencyView = curr; renderSummaryHoldings(); }
function setSortOrder(order) { MockState.sortOrder = order; renderSummaryHoldings(); }

// ── Discovery Market Feed (Reference Screen Match) ──
function renderDiscoveryFeed() {
  const container = document.getElementById('mainTabContent');
  if (!container) return;

  const topGainers = [...MOCK_STOCK_DEFS].sort((a, b) => (MockState.quotes[b.id]?.changePct || 0) - (MockState.quotes[a.id]?.changePct || 0));

  let html = `
    <!-- Indices Cards -->
    <div class="indices-banner-grid">
      <div class="index-card">
        <div class="index-name">S&P 500 선물</div>
        <div class="index-val">5,584.20</div>
        <div class="index-change up" style="font-size:12px; font-weight:700;">+0.65%</div>
      </div>
      <div class="index-card">
        <div class="index-name">나스닥 선물</div>
        <div class="index-val">19,840.50</div>
        <div class="index-change up" style="font-size:12px; font-weight:700;">+1.12%</div>
      </div>
      <div class="index-card">
        <div class="index-name">KOSPI 지수</div>
        <div class="index-val">2,845.30</div>
        <div class="index-change down" style="font-size:12px; font-weight:700;">-0.34%</div>
      </div>
      <div class="index-card">
        <div class="index-name">KOSDAQ 지수</div>
        <div class="index-val">842.10</div>
        <div class="index-change up" style="font-size:12px; font-weight:700;">+0.48%</div>
      </div>
    </div>

    <!-- Category Badges -->
    <div class="category-badges-row">
      <div class="cat-badge active">🇺🇸 해외주식</div>
      <div class="cat-badge">🇰🇷 국내주식</div>
      <div class="cat-badge">📜 채권</div>
      <div class="cat-badge">📊 ETF</div>
    </div>

    <!-- Real-time Event News Ticker -->
    <div class="news-ticker-card">
      <div class="news-ticker-text">
        <span class="tag-news">실시간 이슈</span>
        <span>미국 2분기 GDP 발표 속보치 발표 임박 · AI 반도체 종목 강세</span>
      </div>
      <span style="font-size:12px; color:var(--accent); font-weight:700; cursor:pointer;">자세히 ></span>
    </div>

    <div style="font-size:18px; font-weight:900; margin-bottom:14px; color:var(--text);">실시간 인기 종목 차트</div>
  `;

  topGainers.forEach((s, idx) => {
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

// ── Orders & Trades History View ──
function renderOrdersHistory() {
  const acc = getActiveAccount();
  const container = document.getElementById('mainTabContent');
  if (!container || !acc) return;

  let html = `<div style="font-size:18px; font-weight:900; margin-bottom:14px;">대기 중인 지정가 주문</div>`;

  if (!acc.pendingOrders || !acc.pendingOrders.length) {
    html += `<div class="card empty-state-box" style="margin-bottom:24px;">대기 중인 주문이 없습니다.</div>`;
  } else {
    acc.pendingOrders.forEach(o => {
      html += `
        <div class="stock-row-card">
          <div>
            <div class="stock-name-title">${o.name} <span class="badge-mock">${o.type === 'buy' ? '매수대기' : '매도대기'}</span></div>
            <div class="stock-sub-desc">주문가: ${o.market === 'us' ? '$' + o.price.toFixed(2) : '₩' + o.price.toLocaleString() + '원'} · ${o.qty}주</div>
          </div>
          <button onclick="cancelPendingOrder('${o.id}')" style="padding:6px 12px; background:var(--surface3); border:none; border-radius:6px; font-weight:700; color:var(--up-color); cursor:pointer;">주문취소</button>
        </div>
      `;
    });
  }

  html += `<div style="font-size:18px; font-weight:900; margin-bottom:14px;">체결 완료 내역</div>`;
  if (!acc.executedOrders || !acc.executedOrders.length) {
    html += `<div class="card empty-state-box">체결된 거래 내역이 없습니다.</div>`;
  } else {
    acc.executedOrders.forEach(e => {
      const dateStr = new Date(e.time).toLocaleString('ko-KR');
      const isBuy = e.type === 'buy';
      html += `
        <div class="stock-row-card">
          <div>
            <div class="stock-name-title">${e.name} <span style="font-size:12px; color:${isBuy ? 'var(--up-color)' : 'var(--down-color)'}; font-weight:800;">${isBuy ? '매수완료' : '매도완료'}</span></div>
            <div class="stock-sub-desc">${dateStr} · ${e.qty}주 @ ${e.market === 'us' ? '$' + e.price.toFixed(2) : '₩' + e.price.toLocaleString() + '원'}</div>
          </div>
          <div class="stock-val-right">
            <div class="stock-price-main">₩${Math.round(e.totalKRW).toLocaleString()}원</div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

function cancelPendingOrder(orderId) {
  const acc = getActiveAccount();
  if (!acc) return;
  acc.pendingOrders = acc.pendingOrders.filter(o => o.id !== orderId);
  saveState();
  showToast('주문이 취소되었습니다.');
  renderOrdersHistory();
}

// ── Realized PnL View ──
function renderRealizedPnl() {
  const acc = getActiveAccount();
  const container = document.getElementById('mainTabContent');
  if (!container || !acc) return;

  let totalProfitKRW = 0;
  acc.realizedPnl.forEach(p => totalProfitKRW += p.pnlKRW);

  let html = `
    <div class="card" style="margin-bottom:20px; background:var(--surface2);">
      <div style="font-size:13px; font-weight:700; color:var(--muted);">총 누적 실현손익</div>
      <div style="font-size:26px; font-weight:900; color:${totalProfitKRW >= 0 ? 'var(--up-color)' : 'var(--down-color)'}; margin-top:4px;">
        ${totalProfitKRW >= 0 ? '+' : ''}₩${Math.round(totalProfitKRW).toLocaleString()}원
      </div>
    </div>
    <div style="font-size:18px; font-weight:900; margin-bottom:14px;">매도 실현 손익 내역</div>
  `;

  if (!acc.realizedPnl.length) {
    html += `<div class="card empty-state-box">아직 주식을 매도하여 확정된 수익 내역이 없습니다.</div>`;
  } else {
    acc.realizedPnl.forEach(p => {
      const dateStr = new Date(p.time).toLocaleString('ko-KR');
      const upClass = p.pnlKRW >= 0 ? 'up' : 'down';
      const sign = p.pnlKRW >= 0 ? '+' : '';
      html += `
        <div class="stock-row-card">
          <div>
            <div class="stock-name-title">${p.name} <span class="stock-sub-desc">${p.qty}주 매도</span></div>
            <div class="stock-sub-desc">${dateStr}</div>
          </div>
          <div class="stock-val-right">
            <div class="stock-price-main ${upClass}">${sign}₩${Math.round(p.pnlKRW).toLocaleString()}원</div>
            <div class="stock-change-sub ${upClass}">${sign}${p.returnPct.toFixed(2)}%</div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// ── Dividend History View ──
function renderDividendHistory() {
  const acc = getActiveAccount();
  const container = document.getElementById('mainTabContent');
  if (!container || !acc) return;

  let html = `<div style="font-size:18px; font-weight:900; margin-bottom:14px;">배당금 수령 내역</div>`;

  if (!acc.dividendHistory || !acc.dividendHistory.length) {
    html += `<div class="card empty-state-box">아직 지급된 배당금이 없습니다. 주식을 보유하여 배당금을 수령해보세요!</div>`;
  } else {
    acc.dividendHistory.forEach(d => {
      const dateStr = new Date(d.time).toLocaleString('ko-KR');
      html += `
        <div class="stock-row-card">
          <div>
            <div class="stock-name-title">${d.name} <span class="badge-mock" style="background:var(--up-bg); color:var(--up-color);">배당금 입금</span></div>
            <div class="stock-sub-desc">${dateStr}</div>
          </div>
          <div class="stock-val-right">
            <div class="stock-price-main up">+${d.isUsd ? '$' + d.amount.toFixed(2) : '₩' + Math.floor(d.amount).toLocaleString() + '원'}</div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// ── Manual Exchange Tab View ──
function renderExchangeTab() {
  const acc = getActiveAccount();
  const container = document.getElementById('mainTabContent');
  if (!container || !acc) return;

  container.innerHTML = `
    <div class="card" style="max-width:540px; margin:0 auto;">
      <div style="font-size:20px; font-weight:900; margin-bottom:16px;">실시간 환전소</div>
      <div style="font-size:13px; color:var(--muted); margin-bottom:20px;">
        현재 적용 환율: <strong style="color:var(--text);">1 USD = ₩${MockState.liveRate.toLocaleString()}원</strong>
      </div>

      <div style="background:var(--surface2); border-radius:var(--radius-md); padding:16px; margin-bottom:16px;">
        <div style="font-size:12px; color:var(--muted); margin-bottom:4px;">보유 잔고</div>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px;">
          <span>원화: ₩${Math.floor(acc.krwCash).toLocaleString()}원</span>
          <span>달러: $${(acc.usdCash || 0).toFixed(2)}</span>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:13px; font-weight:700; color:var(--text2); display:block; margin-bottom:6px;">환전 방향</label>
        <select id="tabExDir" class="select-control" style="width:100%; padding:10px;">
          <option value="KRW">원화(₩) → 달러($) 구매</option>
          <option value="USD">달러($) → 원화(₩) 환전</option>
        </select>
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:13px; font-weight:700; color:var(--text2); display:block; margin-bottom:6px;">환전 신청 금액</label>
        <input type="number" id="tabExAmt" class="select-control" style="width:100%; padding:10px; font-size:16px;" placeholder="금액 입력">
      </div>

      <button class="primary-action-btn" onclick="submitTabExchange()">환전 신청하기</button>
    </div>
  `;
}

function submitTabExchange() {
  const dir = document.getElementById('tabExDir').value;
  const amt = parseFloat(document.getElementById('tabExAmt').value);
  if (!amt || amt <= 0) { showToast('올바른 금액을 입력하세요.'); return; }
  executeManualExchange(dir, amt);
}

// ── Stock Detail Modal & Trading Sheet ──
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

  renderOrderBookDepth(q);
  initTradingViewChart(q);

  modal.classList.add('active');
}

function renderOrderBookDepth(q) {
  const container = document.getElementById('modalOrderBookContainer');
  if (!container) return;

  const currentPrice = q.price;
  const isUsd = q.market === 'us';
  const step = isUsd ? 0.5 : (currentPrice > 100000 ? 500 : 100);

  let html = '<div class="order-book-container">';

  // 5 Asks (매도호가)
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

  // Current Price
  html += `
    <div class="order-book-row current-price">
      <span>${isUsd ? '$' + currentPrice.toFixed(2) : '₩' + Math.round(currentPrice).toLocaleString()} (현재가)</span>
      <span>체결중</span>
    </div>
  `;

  // 5 Bids (매수호가)
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

  // Dummy Line Data Points
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

// ── Event Handlers & Helper UI Functions ──
function setupUIEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab-item').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-tab-item').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      MockState.currentTab = e.target.getAttribute('data-tab');
      renderApp();
    });
  });
}

function switchTab(tabName) {
  MockState.currentTab = tabName;
  document.querySelectorAll('.nav-tab-item').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
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

function showOnboardingModal(forceMode) {
  const modal = document.getElementById('onboardingModal');
  if (!modal) return;

  if (forceMode) {
    MockState.selectedOnboardingMode = forceMode;
    document.getElementById('onboardingStep1').style.display = 'none';
    document.getElementById('onboardingStep2').style.display = 'block';
  } else {
    MockState.selectedOnboardingMode = 'realtime';
    document.getElementById('onboardingStep1').style.display = 'block';
    document.getElementById('onboardingStep2').style.display = 'none';
  }

  modal.classList.add('active');
}

function selectOnboardingMode(modeType) {
  MockState.selectedOnboardingMode = modeType;
  document.querySelectorAll('.onboarding-option-card').forEach(c => c.classList.remove('selected'));
  const target = document.getElementById(`opt_${modeType}`);
  if (target) target.classList.add('selected');
}

function nextOnboardingStep() {
  if (!MockState.selectedOnboardingMode) return;
  document.getElementById('onboardingStep1').style.display = 'none';
  document.getElementById('onboardingStep2').style.display = 'block';
}

function selectOnboardingCapital(amount, btnEl) {
  MockState.selectedOnboardingCapital = amount;
  document.querySelectorAll('.capital-btn').forEach(b => b.classList.remove('selected'));
  if (btnEl) btnEl.classList.add('selected');
}

function finishAccountCreation() {
  if (!MockState.selectedOnboardingMode || !MockState.selectedOnboardingCapital) return;
  createNewAccount(MockState.selectedOnboardingMode, MockState.selectedOnboardingCapital);
  closeModal('onboardingModal');
  renderApp();
}

function openSecondAccountSetup(modeType) {
  toggleAccountDropdown(false);
  showOnboardingModal(modeType);
}

function openExchangeModal() {
  const modal = document.getElementById('exchangeModal');
  if (modal) modal.classList.add('active');
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

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
