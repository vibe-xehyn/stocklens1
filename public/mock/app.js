'use strict';

// =========================================================================
// State
// =========================================================================
let state = {
  accounts: [],
  currentAcctType: 'realtime',
  currentAccountId: null,
  currentAccount: null,
  portfolio: null,
  usdkrw: 1350,
  orderSide: 'buy',
  orderType: 'limit',
  selectedStock: null,
  fxDirection: 'krw2usd',
  eventSource: null,
  profitChart: null,
  pieChart: null,
  currentRange: '1m',
  onboardType: 'realtime',
  onboardCapital: 50000000,
  pollTimer: null,
};

const uid = (() => {
  const c = document.cookie.split(';').map(c => c.trim());
  const s = c.find(x => x.startsWith('sessionToken='));
  if (s) return decodeURIComponent(s.split('=')[1]);
  let g = localStorage.getItem('mock_guest_id');
  if (!g) { g = 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2); localStorage.setItem('mock_guest_id', g); }
  return g;
})();

// =========================================================================
// API
// =========================================================================
async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const d = await res.json();
  if (!res.ok && d.error) throw new Error(d.error);
  return d;
}

// =========================================================================
// Toast
// =========================================================================
function toast(msg) {
  const c = document.getElementById('toastContainer');
  const e = document.createElement('div'); e.className = 'toast'; e.textContent = msg;
  c.appendChild(e);
  setTimeout(() => { e.style.opacity = '0'; e.style.transition = 'opacity 0.3s'; setTimeout(() => e.remove(), 300); }, 2500);
}

// =========================================================================
// Boot
// =========================================================================
(async function boot() {
  await loadAccounts();
  if (!state.accounts.length) {
    showOnboarding();
  } else {
    autoSelectAccount();
    showApp();
    loadEverything();
    startPolling();
  }
})();

async function loadAccounts() {
  try { state.accounts = await api('/api/trade/accounts'); } catch { state.accounts = []; }
}

function autoSelectAccount() {
  const ofType = state.accounts.filter(a => a.type === state.currentAcctType);
  if (ofType.length) {
    state.currentAccountId = ofType[0].id;
    state.currentAccount = ofType[0];
  } else if (state.accounts.length) {
    state.currentAccountId = state.accounts[0].id;
    state.currentAccount = state.accounts[0];
    state.currentAcctType = state.accounts[0].type;
  }
}

function showOnboarding() {
  document.getElementById('onboardingOverlay').style.display = 'flex';
  document.getElementById('appMain').style.display = 'none';
}

function showApp() {
  document.getElementById('onboardingOverlay').style.display = 'none';
  document.getElementById('appMain').style.display = 'block';
  updateAcctTabUI();
  renderAccountChips();
}

function goToDashboard() { window.location.href = '/'; }

// =========================================================================
// Onboarding
// =========================================================================
function selectOnboardType(type, btn) {
  state.onboardType = type;
  document.querySelectorAll('.onboard-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function selectOnboardCapital(capital, btn) {
  state.onboardCapital = parseInt(capital);
  document.querySelectorAll('.onboard-capital-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
async function createOnboardAccount() {
  try {
    const r = await api('/api/trade/accounts', { method: 'POST', body: JSON.stringify({ type: state.onboardType, initialCapital: state.onboardCapital }) });
    if (r.ok) {
      state.currentAcctType = state.onboardType;
      await loadAccounts();
      state.currentAccountId = r.account.id;
      state.currentAccount = r.account;
      showApp();
      loadEverything();
      startPolling();
    }
  } catch (e) { toast('계좌 생성 실패: ' + e.message); }
}

// =========================================================================
// Account Tabs & Chips
// =========================================================================
function updateAcctTabUI() {
  document.querySelectorAll('.acct-tab').forEach(b => b.classList.toggle('active', b.dataset.type === state.currentAcctType));
}
function switchAccountType(type) {
  state.currentAcctType = type;
  updateAcctTabUI();
  const ofType = state.accounts.filter(a => a.type === type);
  if (ofType.length) {
    state.currentAccountId = ofType[0].id;
    state.currentAccount = ofType[0];
  }
  renderAccountChips();
  loadEverything();
  startPolling();
}
function renderAccountChips() {
  const bar = document.getElementById('accountListBar');
  const ofType = state.accounts.filter(a => a.type === state.currentAcctType);
  if (ofType.length <= 1) { bar.innerHTML = ''; return; }
  bar.innerHTML = ofType.map(a => `<button class="acct-chip ${a.id === state.currentAccountId ? 'active' : ''}" onclick="switchToAccount('${a.id}')">${a.label || ('계좌 ' + a.id.slice(-4))}</button>`).join('');
}
async function switchToAccount(id) {
  state.currentAccountId = id;
  state.currentAccount = state.accounts.find(a => a.id === id);
  renderAccountChips();
  loadEverything();
}

// =========================================================================
// New Account Modal
// =========================================================================
function openNewAccountModal() {
  document.getElementById('newAcctOverlay').classList.add('open');
  document.getElementById('newAcctSheet').classList.add('open');
}
function closeNewAccountModal() {
  document.getElementById('newAcctOverlay').classList.remove('open');
  document.getElementById('newAcctSheet').classList.remove('open');
}
async function submitNewAccount() {
  const typeBtn = document.querySelector('#newAcctSheet .onboard-type-btn.active');
  const capBtn = document.querySelector('#newAcctSheet .onboard-capital-btn.active');
  const type = typeBtn?.dataset.mtype || 'realtime';
  const capital = parseInt(capBtn?.dataset.mcap || 50000000);
  try {
    const r = await api('/api/trade/accounts', { method: 'POST', body: JSON.stringify({ type, initialCapital: capital }) });
    if (r.ok) {
      await loadAccounts();
      state.currentAcctType = type;
      state.currentAccountId = r.account.id;
      state.currentAccount = r.account;
      updateAcctTabUI();
      renderAccountChips();
      loadEverything();
      startPolling();
      closeNewAccountModal();
      toast('새 계좌가 개설되었습니다.');
    }
  } catch (e) { toast('계좌 생성 실패: ' + e.message); }
}

// =========================================================================
// Load Everything
// =========================================================================
async function loadEverything() {
  if (!state.currentAccountId) return;
  try {
    state.portfolio = await api(`/api/trade/portfolio/${state.currentAccountId}`);
    state.usdkrw = state.portfolio.usdkrw || 1350;
  } catch { state.portfolio = null; }
  renderTotalAsset();
  renderProfitChart();
  renderAllocation();
  renderBalance();
  renderHoldings();
  loadDividends();
  loadHistory();
  connectSSE();
}

// =========================================================================
// Polling (real-time data refresh)
// =========================================================================
function startPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    if (!state.currentAccountId) return;
    try {
      state.portfolio = await api(`/api/trade/portfolio/${state.currentAccountId}`);
      state.usdkrw = state.portfolio.usdkrw || 1350;
    } catch {}
    renderTotalAsset();
    renderBalance();
    renderHoldings();
    renderAllocation();
  }, state.currentAccount?.type === 'virtual' ? 3000 : 5000);
}

// =========================================================================
// Total Asset
// =========================================================================
function renderTotalAsset() {
  const p = state.portfolio; if (!p) return;
  document.getElementById('totalAsset').textContent = Math.round(p.totalAssetKRW).toLocaleString() + '원';
  const cls = p.totalProfitPct >= 0 ? 'up' : 'down';
  document.getElementById('totalChange').innerHTML = `<span class="total-asset-change ${cls}">${p.totalProfitPct >= 0 ? '+' : ''}${p.totalProfitPct.toFixed(2)}%</span>`;
  document.getElementById('totalSub').textContent = (p.totalProfit >= 0 ? '+' : '') + Math.round(p.totalProfit).toLocaleString() + '원';
}

// =========================================================================
// Profit Chart
// =========================================================================
function switchRange(range, btn) {
  state.currentRange = range;
  document.querySelectorAll('.range-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProfitChart();
}
function renderProfitChart() {
  const p = state.portfolio;
  const canvas = document.getElementById('profitChart');
  if (!canvas || !p) return;
  if (state.profitChart) state.profitChart.destroy();
  const total = p.totalAssetKRW;
  const init = p.account?.initialCapital || total - p.totalProfit;
  const pts = genData(init, total, state.currentRange);
  const up = total >= init;
  state.profitChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels: pts.labels, datasets: [{ data: pts.data, borderColor: up ? '#F04452' : '#3182F6', backgroundColor: up ? 'rgba(240,68,82,0.04)' : 'rgba(49,130,246,0.04)', fill: true, tension: 0.3, borderWidth: 2, pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { display: false } }, y: { grid: { display: false }, ticks: { display: false } } } }
  });
  canvas.parentElement.style.height = '200px';
}
function genData(init, total, range) {
  const c = { '1w': 7, '1m': 30, '3m': 90, 'all': 365 }[range] || 30;
  const l = [], d = []; const diff = total - init;
  for (let i = 0; i <= c; i++) {
    const n = (Math.random() - 0.45) * (Math.abs(diff) * 0.08);
    l.push(i); d.push(Math.max(0, init + (diff * (i / c)) + (i === c ? 0 : n)));
  }
  return { labels: l, data: d };
}

// =========================================================================
// Allocation Pie
// =========================================================================
function renderAllocation() {
  const p = state.portfolio; if (!p) return;
  const krw = p.krwBalance, usd = (p.usdBalance || 0) * state.usdkrw, stock = p.totalHoldingsValueKRW || 0;
  const t = krw + usd + stock; if (t === 0) return;
  if (state.pieChart) state.pieChart.destroy();
  state.pieChart = new Chart(document.getElementById('allocationPie').getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['원화', '달러', '주식'], datasets: [{ data: [krw, usd, stock], backgroundColor: ['#3182F6', '#F04452', '#191F28'], borderWidth: 0 }] },
    options: { responsive: true, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
  });
  document.getElementById('allocationLegend').innerHTML = `
    <div class="legend-row"><span class="legend-dot" style="background:#3182F6"></span><span class="legend-label">원화</span><span class="legend-value">${Math.round(krw).toLocaleString()}원</span><span class="legend-pct">${(krw/t*100).toFixed(1)}%</span></div>
    <div class="legend-row"><span class="legend-dot" style="background:#F04452"></span><span class="legend-label">달러</span><span class="legend-value">${Math.round(usd).toLocaleString()}원</span><span class="legend-pct">${(usd/t*100).toFixed(1)}%</span></div>
    <div class="legend-row"><span class="legend-dot" style="background:#191F28"></span><span class="legend-label">주식</span><span class="legend-value">${Math.round(stock).toLocaleString()}원</span><span class="legend-pct">${(stock/t*100).toFixed(1)}%</span></div>`;
}

// =========================================================================
// Balance
// =========================================================================
function renderBalance() {
  const p = state.portfolio; if (!p) return;
  document.getElementById('krwBalance').textContent = Math.round(p.krwBalance).toLocaleString() + '원';
  document.getElementById('usdBalance').textContent = '$' + (p.usdBalance || 0).toFixed(2);
  document.getElementById('usdInKRW').textContent = Math.round((p.usdBalance || 0) * state.usdkrw).toLocaleString() + '원';
}

// =========================================================================
// Holdings
// =========================================================================
function renderHoldings() {
  const list = document.getElementById('holdingsList');
  const holdings = state.portfolio?.holdings || [];
  document.getElementById('holdingsCount').textContent = holdings.length + '개';
  if (!holdings.length) { list.innerHTML = '<div class="empty-state">보유 종목이 없습니다.<br>하단 매수 버튼을 눌러 첫 투자를 시작하세요.</div>'; return; }
  const totalEval = state.portfolio.totalHoldingsValueKRW || 1;
  list.innerHTML = holdings.map(h => {
    const cls = h.profitPct >= 0 ? 'up' : 'down';
    const sym = h.market === 'kr' ? '' : '$';
    const evalKRW = h.market === 'kr' ? h.evaluationValue : (h.evaluationValue * state.usdkrw);
    const weight = (evalKRW / totalEval * 100).toFixed(1);
    return `<div class="holding-card">
      <div class="holding-top"><div><div class="holding-name">${h.ticker}</div><div class="holding-ticker">${h.market === 'kr' ? '한국' : '미국'} | ${h.quantity}주</div></div>
      <div class="holding-eval"><div class="holding-eval-price">${sym}${h.evaluationValue.toLocaleString(undefined, {maximumFractionDigits:2})}</div><div class="holding-eval-profit ${cls}">${h.profitPct >= 0 ? '+' : ''}${h.profitPct.toFixed(2)}%</div></div></div>
      <div class="holding-meta"><span class="holding-qty-info">평균 ${sym}${h.avgPrice.toLocaleString(undefined, {maximumFractionDigits:2})}</span><div class="holding-weight-bar"><div class="holding-weight-fill" style="width:${weight}%"></div></div><span class="holding-qty-info">${weight}%</span></div>
    </div>`;
  }).join('');
}

// =========================================================================
// Dividends
// =========================================================================
async function loadDividends() {
  const el = document.getElementById('dividendList');
  try {
    const divs = await api(`/api/trade/dividends/${state.currentAccountId}`);
    if (!divs.length) { el.innerHTML = '<div class="empty-state">배당 내역이 없습니다.</div>'; return; }
    el.innerHTML = divs.map(d => `<div class="div-item"><div class="div-dot">D</div><div class="div-info"><div class="div-ticker">${d.ticker}</div><div class="div-date">배당락: ${d.date}</div></div><div class="div-end"><div class="div-amount">+${d.currency === 'KRW' ? '' : '$'}${d.amount.toLocaleString(undefined, {maximumFractionDigits:2})}</div><div class="div-qty">${d.quantity}주</div></div></div>`).join('');
  } catch { el.innerHTML = '<div class="empty-state">배당 내역을 불러올 수 없습니다.</div>'; }
}

// =========================================================================
// History
// =========================================================================
async function loadHistory() {
  const el = document.getElementById('historyList');
  try {
    const history = await api(`/api/trade/history/${state.currentAccountId}`);
    if (!history.length) { el.innerHTML = '<div class="empty-state">거래 내역이 없습니다.</div>'; return; }
    el.innerHTML = history.slice(0, 15).map(h => {
      const isBuy = h.side === 'buy'; const sideTag = isBuy ? 'buy' : 'sell';
      const time = new Date(h.timestamp).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      return `<div class="history-item"><div class="history-dot-icon ${sideTag}">${isBuy ? 'B' : 'S'}</div><div class="history-info"><div class="history-ticker-row"><span class="history-ticker">${h.ticker}</span><span class="history-side-tag ${sideTag}">${isBuy ? '매수' : '매도'}</span></div><div class="history-detail">${h.quantity}주 ${h.price.toLocaleString()}원</div></div><div class="history-end"><div class="history-amount">${isBuy ? '-' : '+'}${Math.abs(h.amount).toLocaleString()}원</div><div class="history-time">${time}</div></div></div>`;
    }).join('');
  } catch { el.innerHTML = '<div class="empty-state">거래 내역을 불러올 수 없습니다.</div>'; }
}

// =========================================================================
// Order Sheet
// =========================================================================
function openOrderSheet(side) {
  state.orderSide = side; state.selectedStock = null; state.orderType = 'limit';
  const title = side === 'buy' ? '매수' : '매도';
  document.getElementById('orderSheetTitle').textContent = title;
  document.getElementById('orderSubmitBtn').textContent = title + '하기';
  document.getElementById('orderSubmitBtn').className = 'sheet-submit-btn ' + side;
  document.getElementById('orderTickerInput').value = '';
  document.getElementById('orderPrice').value = '';
  document.getElementById('orderQty').value = '';
  document.getElementById('selectedStockInfo').style.display = 'none';
  document.getElementById('orderBook').style.display = 'none';
  document.getElementById('orderSearchDropdown').classList.remove('open');
  document.getElementById('orderSummary').style.display = 'none';
  document.getElementById('limitPriceField').style.display = '';
  document.querySelectorAll('#orderSheet .seg-btn').forEach(b => b.classList.remove('active'));
  const l = document.querySelector('#orderSheet .seg-btn[data-otype="limit"]');
  if (l) l.classList.add('active');
  document.getElementById('orderSheetOverlay').classList.add('open');
  document.getElementById('orderSheet').classList.add('open');
  setTimeout(() => document.getElementById('orderTickerInput').focus(), 400);
}
function closeOrderSheet() {
  document.getElementById('orderSheetOverlay').classList.remove('open');
  document.getElementById('orderSheet').classList.remove('open');
}
function setOrderType(type, btn) {
  state.orderType = type;
  document.querySelectorAll('#orderSheet .seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('limitPriceField').style.display = type === 'limit' ? '' : 'none';
  updateOrderSummary();
}

// =========================================================================
// Stock Search
// =========================================================================
let _st = null;
async function searchStocks(q) {
  clearTimeout(_st);
  const dd = document.getElementById('orderSearchDropdown');
  if (!q.trim()) { dd.classList.remove('open'); return; }
  _st = setTimeout(async () => {
    try {
      const r = await api(`/api/search?q=${encodeURIComponent(q.trim())}&market=all`);
      dd.innerHTML = r.slice(0, 10).map(s => `<div class="search-dropdown-item" onclick="selectOrderStock('${s.ticker}','${s.market}','${s.name.replace(/'/g,"\\'")}',${s.price||50000})"><span><span class="sdi-ticker">${s.ticker}</span> <span class="sdi-name">${s.name}</span></span><span class="sdi-market">${s.market==='kr'?'한국':'미국'} / ${s.exchange||''}</span></div>`).join('');
      dd.classList.add('open');
    } catch { dd.innerHTML = '<div class="search-dropdown-item">검색 실패</div>'; dd.classList.add('open'); }
  }, 250);
}

async function selectOrderStock(ticker, market, name, fp) {
  state.selectedStock = { ticker, market, name };
  document.getElementById('orderTickerInput').value = ticker;
  document.getElementById('orderSearchDropdown').classList.remove('open');
  try {
    const q = await api(`/api/quote?symbol=${ticker}&market=${market}`);
    state.selectedStock.price = q.price || fp;
    state.selectedStock.changePct = q.changePct || 0;
    state.selectedStock.currency = market === 'kr' ? 'KRW' : 'USD';
  } catch {
    state.selectedStock.price = fp; state.selectedStock.changePct = 0; state.selectedStock.currency = market === 'kr' ? 'KRW' : 'USD';
  }
  const sym = market === 'kr' ? '' : '$';
  const cls = state.selectedStock.changePct >= 0 ? 'up' : 'down';
  document.getElementById('selectedStockInfo').style.display = '';
  document.getElementById('ssiName').textContent = ticker;
  document.getElementById('ssiMarket').textContent = market === 'kr' ? '한국' : '미국';
  document.getElementById('ssiPrice').textContent = sym + state.selectedStock.price.toLocaleString(undefined, {maximumFractionDigits:2});
  document.getElementById('ssiPrice').className = 'ssi-price ' + cls;
  document.getElementById('ssiChange').textContent = (state.selectedStock.changePct >= 0 ? '+' : '') + state.selectedStock.changePct.toFixed(2) + '%';
  document.getElementById('ssiChange').className = 'ssi-change ' + cls;
  document.getElementById('orderPrice').value = state.selectedStock.price;
  loadOrderBook(ticker, market);
  updateOrderSummary();
}

async function loadOrderBook(ticker, market) {
  try {
    const ob = await api(`/api/trade/orderbook?ticker=${ticker}&market=${market}`);
    const maxV = Math.max(...ob.asks.map(a => a.volume), ...ob.bids.map(b => b.volume));
    document.getElementById('orderBook').style.display = '';
    document.getElementById('orderBook').innerHTML = `
      ${[...ob.asks].reverse().map(a => `<div class="ob-row ask" onclick="setPriceClick(${a.price})"><span class="ob-price">${a.price.toLocaleString()}</span><div class="ob-bar-wrap"><div class="ob-bar ask" style="width:${(a.volume/maxV*100)}%"></div></div><span class="ob-vol">${a.volume}</span></div>`).join('')}
      <div class="ob-center">${ob.price.toLocaleString()}</div>
      ${ob.bids.map(b => `<div class="ob-row bid" onclick="setPriceClick(${b.price})"><span class="ob-price">${b.price.toLocaleString()}</span><div class="ob-bar-wrap"><div class="ob-bar bid" style="width:${(b.volume/maxV*100)}%"></div></div><span class="ob-vol">${b.volume}</span></div>`).join('')}`;
  } catch {}
}

function setPriceClick(price) { document.getElementById('orderPrice').value = price; updateOrderSummary(); }

// =========================================================================
// Quantity Presets
// =========================================================================
function setQtyPercent(pct) {
  const p = state.portfolio; if (!p || !state.selectedStock) return;
  const price = parseFloat(document.getElementById('orderPrice').value.replace(/,/g,'')) || state.selectedStock.price;
  if (price <= 0) return;
  let max = 0;
  if (state.orderSide === 'buy') {
    const avail = state.selectedStock.market === 'kr' ? p.krwBalance : (p.usdBalance || 0) * state.usdkrw;
    max = Math.floor(avail / price * (pct / 100));
  } else {
    const h = p.holdings.find(h => h.ticker === state.selectedStock.ticker);
    max = h ? Math.floor(h.quantity * (pct / 100)) : 0;
  }
  document.getElementById('orderQty').value = Math.max(1, max);
  updateOrderSummary();
}

// =========================================================================
// Order Summary
// =========================================================================
function updateOrderSummary() {
  const price = parseFloat((document.getElementById('orderPrice').value || '').replace(/,/g,'')) || (state.selectedStock?.price || 0);
  const qty = parseInt((document.getElementById('orderQty').value || '').replace(/,/g,'')) || 0;
  const s = document.getElementById('orderSummary');
  if (!state.selectedStock || price <= 0 || qty <= 0) { s.style.display = 'none'; return; }
  s.style.display = '';
  const isKR = state.selectedStock.market === 'kr';
  const sym = isKR ? '' : '$';
  const tv = price * qty;
  const fee = tv * 0.00015;
  document.getElementById('osTotal').textContent = sym + tv.toLocaleString() + (isKR ? '원' : '');
  document.getElementById('osFee').textContent = sym + fee.toFixed(2) + (isKR ? '원' : '');
  const fx = document.getElementById('osFxRow');
  if (state.orderSide === 'buy' && !isKR && state.portfolio) {
    const needUSD = tv + fee;
    if ((state.portfolio.usdBalance || 0) >= needUSD) { fx.style.display = 'none'; }
    else { fx.style.display = ''; document.getElementById('osFx').textContent = Math.ceil((needUSD - (state.portfolio.usdBalance || 0)) * state.usdkrw * 1.005).toLocaleString() + '원'; }
    document.getElementById('osNeed').textContent = '$' + needUSD.toFixed(2);
  } else { fx.style.display = 'none'; document.getElementById('osNeed').textContent = sym + (tv + fee).toLocaleString() + (isKR ? '원' : ''); }
}

// =========================================================================
// Submit Order
// =========================================================================
async function submitOrder() {
  if (!state.selectedStock) { toast('종목을 선택해주세요.'); return; }
  const price = parseFloat((document.getElementById('orderPrice').value || '').replace(/,/g,'')) || state.selectedStock.price;
  const qty = parseInt((document.getElementById('orderQty').value || '').replace(/,/g,''));
  if (!price || !qty || qty <= 0) { toast('가격과 수량을 입력해주세요.'); return; }
  const btn = document.getElementById('orderSubmitBtn');
  btn.disabled = true; btn.textContent = '처리 중...';
  try {
    const r = await api('/api/trade/order', { method: 'POST', body: JSON.stringify({ accountId: state.currentAccountId, ticker: state.selectedStock.ticker, market: state.selectedStock.market, type: 'stock', side: state.orderSide, price, quantity: qty, mode: state.currentAccount?.type || 'realtime' }) });
    if (r.ok) {
      toast(`${state.selectedStock.ticker} ${qty}주 ${state.orderSide === 'buy' ? '매수' : '매도'} ${r.executed ? '체결 완료' : '접수 완료'}`);
      closeOrderSheet(); loadEverything();
    }
  } catch (e) { toast('주문 실패: ' + e.message); }
  btn.disabled = false; btn.textContent = (state.orderSide === 'buy' ? '매수' : '매도') + '하기';
}

// =========================================================================
// FX Sheet
// =========================================================================
function openFXSheet() {
  document.getElementById('fxSheetOverlay').classList.add('open');
  document.getElementById('fxSheet').classList.add('open');
  document.getElementById('fxRateDisplay').textContent = '1 USD = ' + state.usdkrw.toLocaleString() + '원';
  document.getElementById('fxKrwAmount').value = ''; document.getElementById('fxUsdAmount').value = ''; updateFXPreview();
}
function closeFXSheet() {
  document.getElementById('fxSheetOverlay').classList.remove('open');
  document.getElementById('fxSheet').classList.remove('open');
}
function setFXDir(dir, btn) {
  state.fxDirection = dir;
  document.querySelectorAll('#fxSheet .seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('fxKrwField').style.display = dir === 'krw2usd' ? '' : 'none';
  document.getElementById('fxUsdField').style.display = dir === 'usd2krw' ? '' : 'none';
  updateFXPreview();
}
function updateFXPreview() {
  const rate = state.usdkrw; const spread = 0.005;
  const el = document.getElementById('fxPreview');
  if (state.fxDirection === 'krw2usd') {
    const krw = parseInt((document.getElementById('fxKrwAmount').value || '').replace(/,/g,'')) || 0;
    if (krw <= 0) { el.textContent = '금액을 입력하세요'; return; }
    el.textContent = krw.toLocaleString() + '원 --> $' + (krw / (rate * (1 + spread))).toFixed(2) + ' (수수료 0.5%)';
  } else {
    const usd = parseFloat((document.getElementById('fxUsdAmount').value || '').replace(/,/g,'')) || 0;
    if (usd <= 0) { el.textContent = '금액을 입력하세요'; return; }
    el.textContent = '$' + usd.toFixed(2) + ' --> ' + Math.round(usd * rate * (1 - spread)).toLocaleString() + '원 (수수료 0.5%)';
  }
}
function executeFX() {
  const p = state.portfolio; if (!p) return;
  const rate = state.usdkrw; const spread = 0.005;
  if (state.fxDirection === 'krw2usd') {
    const krw = parseInt((document.getElementById('fxKrwAmount').value || '').replace(/,/g,'')) || 0;
    if (krw <= 0 || p.krwBalance < krw) { toast('원화 잔액이 부족합니다.'); return; }
    p.krwBalance -= krw; p.usdBalance = (p.usdBalance || 0) + krw / (rate * (1 + spread));
    toast(krw.toLocaleString() + '원 환전 완료');
  } else {
    const usd = parseFloat((document.getElementById('fxUsdAmount').value || '').replace(/,/g,'')) || 0;
    if (usd <= 0 || (p.usdBalance || 0) < usd) { toast('달러 잔액이 부족합니다.'); return; }
    p.usdBalance -= usd; p.krwBalance += usd * rate * (1 - spread);
    toast('$' + usd.toFixed(2) + ' 환전 완료');
  }
  closeFXSheet(); renderTotalAsset(); renderAllocation(); renderBalance();
}

// =========================================================================
// SSE (Virtual Mode)
// =========================================================================
function connectSSE() {
  if (state.eventSource) state.eventSource.close();
  if (!state.currentAccount || state.currentAccount.type !== 'virtual') return;
  const es = new EventSource(`/api/trade/stream?userId=${uid}&accountId=${state.currentAccountId}&mode=virtual`);
  state.eventSource = es;
  es.addEventListener('price', () => { loadEverything(); });
  es.onerror = () => {};
}

// Close dropdowns on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap') && !e.target.closest('#orderSearchDropdown')) document.getElementById('orderSearchDropdown').classList.remove('open');
});