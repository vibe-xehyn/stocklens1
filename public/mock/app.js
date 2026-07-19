'use strict';

// =========================================================================
// State
// =========================================================================
let S = {
  accounts: [], currentAcctType: 'realtime', currentAccountId: null, currentAccount: null,
  portfolio: null, usdkrw: 1350,
  detailStock: null, detailRange: '1d', detailChart: null, detailSeries: null,
  orderSide: 'buy', orderType: 'limit',
  fxDirection: 'krw2usd',
  profitChart: null, pieChart: null, assetRange: '1m',
  pollTimer: null, sse: null,
  onboardType: 'realtime', onboardCapital: 50000000,
  currentTab: 'stocks',
};

const uid = (() => {
  let c = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('sessionToken='));
  if (c) return decodeURIComponent(c.split('=')[1]);
  let g = localStorage.getItem('mock_guest_id');
  if (!g) { g = 'g_' + Date.now() + Math.random().toString(36).slice(2); localStorage.setItem('mock_guest_id', g); }
  return g;
})();

// =========================================================================
// API
// =========================================================================
async function api(path, opts = {}) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const d = await r.json();
  if (!r.ok && d.error) throw new Error(d.error);
  return d;
}

// =========================================================================
// Toast
// =========================================================================
function toast(msg) {
  const c = document.getElementById('toastContainer');
  const e = document.createElement('div'); e.className = 'toast'; e.textContent = msg;
  c.appendChild(e);
  setTimeout(() => { e.style.opacity = '0'; e.style.transition = 'opacity 0.3s'; setTimeout(() => e.remove(), 300); }, 2200);
}

// =========================================================================
// Boot
// =========================================================================
(async function boot() {
  await loadAccounts();
  if (!S.accounts.length) { showOnboarding(); return; }
  autoSelect(); showApp(); selectTab(S.currentTab); loadPortfolio(); startPolling(); loadIndices(); loadHotStocks();
})();

async function loadAccounts() { try { S.accounts = await api('/api/trade/accounts'); } catch { S.accounts = []; } }
function autoSelect() {
  let ofType = S.accounts.filter(a => a.type === S.currentAcctType);
  if (ofType.length) { S.currentAccountId = ofType[0].id; S.currentAccount = ofType[0]; }
  else if (S.accounts.length) { S.currentAccountId = S.accounts[0].id; S.currentAccount = S.accounts[0]; S.currentAcctType = S.accounts[0].type; }
}
function goToDashboard() { window.location.href = '/'; }

// =========================================================================
// Onboarding
// =========================================================================
function showOnboarding() {
  document.getElementById('onboardOverlay').style.display = 'flex';
  document.getElementById('appMain').style.display = 'none';
}
function selectOnboardType(type, btn) {
  S.onboardType = type;
  document.querySelectorAll('.onboard-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function selectOnboardCapital(cap, btn) {
  S.onboardCapital = parseInt(cap);
  document.querySelectorAll('.onboard-capital-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
async function createOnboardAccount() {
  try {
    const r = await api('/api/trade/accounts', { method: 'POST', body: JSON.stringify({ type: S.onboardType, initialCapital: S.onboardCapital }) });
    if (r.ok) { S.currentAcctType = S.onboardType; await loadAccounts(); S.currentAccountId = r.account.id; S.currentAccount = r.account; showApp(); selectTab('stocks'); loadPortfolio(); startPolling(); loadIndices(); loadHotStocks(); }
  } catch (e) { toast(e.message); }
}
function showApp() {
  document.getElementById('onboardOverlay').style.display = 'none';
  document.getElementById('appMain').style.display = 'block';
}

// =========================================================================
// Tab Navigation
// =========================================================================
function selectTab(tab) {
  S.currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
  document.querySelectorAll('.btab').forEach(b => b.classList.remove('active'));
  document.querySelector(`.btab[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'stockDetail') {
    document.querySelector('.bottom-tab-bar').style.display = 'none';
  } else {
    document.querySelector('.bottom-tab-bar').style.display = '';
    if (tab === 'assets') { loadPortfolio(); }
    if (tab === 'history') { loadHistoryTab(); }
  }
}
function switchTab(tab) { selectTab(tab); }

// =========================================================================
// Account Sheet
// =========================================================================
function openAccountSheet() {
  document.getElementById('accountOverlay').classList.add('open');
  document.getElementById('accountSheet').classList.add('open');
  renderAccountSheet();
}
function closeAccountSheet() {
  document.getElementById('accountOverlay').classList.remove('open');
  document.getElementById('accountSheet').classList.remove('open');
}
function renderAccountSheet() {
  document.querySelectorAll('.atype-tab').forEach(b => b.classList.toggle('active', b.dataset.type === S.currentAcctType));
  const list = document.getElementById('accountListSheet');
  const ofType = S.accounts.filter(a => a.type === S.currentAcctType);
  list.innerHTML = ofType.map(a => `<div class="acct-item ${a.id === S.currentAccountId ? 'active' : ''}" onclick="switchAccount('${a.id}')"><span class="acct-item-name">${a.label || '계좌 ' + a.id.slice(-4)}</span><span class="acct-item-cap">${(a.initialCapital/10000).toFixed(0)}만원</span></div>`).join('');
}
async function switchAccount(id) {
  S.currentAccountId = id; S.currentAccount = S.accounts.find(a => a.id === id);
  closeAccountSheet(); renderAccountSheet(); loadPortfolio(); startPolling();
}
async function switchAccountType(type) {
  S.currentAcctType = type;
  document.querySelectorAll('.atype-tab').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  const ofType = S.accounts.filter(a => a.type === type);
  if (ofType.length) { S.currentAccountId = ofType[0].id; S.currentAccount = ofType[0]; }
  renderAccountSheet(); loadPortfolio(); startPolling();
}

// =========================================================================
// New Account
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
    await loadAccounts();
    S.currentAcctType = type; S.currentAccountId = r.account.id; S.currentAccount = r.account;
    closeNewAccountModal(); closeAccountSheet(); loadPortfolio(); startPolling();
    toast('계좌 개설 완료');
  } catch (e) { toast(e.message); }
}

// =========================================================================
// Portfolio Loading
// =========================================================================
async function loadPortfolio() {
  if (!S.currentAccountId) return;
  try { S.portfolio = await api('/api/trade/portfolio/' + S.currentAccountId); S.usdkrw = S.portfolio.usdkrw || 1350; } catch { S.portfolio = null; }
  if (S.currentTab === 'assets') renderAssets();
  if (S.currentTab === 'history') loadHistoryTab();
}
function startPolling() {
  if (S.pollTimer) clearInterval(S.pollTimer);
  S.pollTimer = setInterval(async () => {
    if (!S.currentAccountId) return;
    try { S.portfolio = await api('/api/trade/portfolio/' + S.currentAccountId); S.usdkrw = S.portfolio.usdkrw || 1350; } catch {}
    if (S.currentTab === 'assets') renderAssets();
  }, 5000);
}

// =========================================================================
// Assets Tab
// =========================================================================
function renderAssets() {
  const p = S.portfolio; if (!p) return;
  // Total
  document.getElementById('totalAsset').textContent = Math.round(p.totalAssetKRW).toLocaleString() + '원';
  const cls = p.totalProfitPct >= 0 ? 'up' : 'down';
  document.getElementById('totalChange').innerHTML = `<span class="ta-change ${cls}">${p.totalProfitPct >= 0 ? '+' : ''}${p.totalProfitPct.toFixed(2)}%</span>`;
  document.getElementById('totalSub').textContent = (p.totalProfit >= 0 ? '+' : '') + Math.round(p.totalProfit).toLocaleString() + '원';
  // Balance
  document.getElementById('krwBalance').textContent = Math.round(p.krwBalance).toLocaleString() + '원';
  document.getElementById('usdBalance').textContent = '$' + (p.usdBalance || 0).toFixed(2);
  document.getElementById('usdInKRW').textContent = Math.round((p.usdBalance || 0) * S.usdkrw).toLocaleString() + '원';
  // Chart
  renderProfitChart();
  // Allocation
  renderAllocation();
  // Holdings
  renderHoldings();
  // Dividends
  loadDividends();
}

function switchAssetRange(range, btn) {
  S.assetRange = range;
  document.querySelectorAll('.r-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProfitChart();
}
function renderProfitChart() {
  const p = S.portfolio; const canvas = document.getElementById('profitChart');
  if (!canvas || !p) return;
  if (S.profitChart) S.profitChart.destroy();
  const total = p.totalAssetKRW, init = p.account?.initialCapital || total - p.totalProfit;
  const pts = genData(init, total, S.assetRange);
  S.profitChart = new Chart(canvas.getContext('2d'), {
    type: 'line', data: { labels: pts.labels, datasets: [{ data: pts.data, borderColor: total >= init ? '#F04452' : '#3182F6', backgroundColor: total >= init ? 'rgba(240,68,82,0.03)' : 'rgba(49,130,246,0.03)', fill: true, tension: 0.3, borderWidth: 1.5, pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
  });
}
function genData(init, total, range) {
  const c = { '1w': 7, '1m': 30, '3m': 90, 'all': 365 }[range] || 30;
  const l = [], d = []; const diff = total - init;
  for (let i = 0; i <= c; i++) { l.push(i); d.push(Math.max(0, init + diff * (i / c) + (i === c ? 0 : (Math.random() - 0.45) * Math.abs(diff) * 0.06))); }
  return { labels: l, data: d };
}
function renderAllocation() {
  const p = S.portfolio;
  const krw = p.krwBalance, usd = (p.usdBalance || 0) * S.usdkrw, stock = p.totalHoldingsValueKRW || 0;
  const t = krw + usd + stock; if (t === 0) return;
  if (S.pieChart) S.pieChart.destroy();
  S.pieChart = new Chart(document.getElementById('allocationPie').getContext('2d'), {
    type: 'doughnut', data: { labels: ['원화', '달러', '주식'], datasets: [{ data: [krw, usd, stock], backgroundColor: ['#3182F6', '#F04452', '#191F28'], borderWidth: 0 }] },
    options: { responsive: true, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
  });
  document.getElementById('allocationLegend').innerHTML = `
    <div class="al-row"><span class="al-dot" style="background:#3182F6"></span><span class="al-label">원화</span><span class="al-val">${(krw/t*100).toFixed(1)}%</span></div>
    <div class="al-row"><span class="al-dot" style="background:#F04452"></span><span class="al-label">달러</span><span class="al-val">${(usd/t*100).toFixed(1)}%</span></div>
    <div class="al-row"><span class="al-dot" style="background:#191F28"></span><span class="al-label">주식</span><span class="al-val">${(stock/t*100).toFixed(1)}%</span></div>`;
}
function renderHoldings() {
  const list = document.getElementById('holdingsList');
  const holdings = S.portfolio?.holdings || [];
  document.getElementById('holdingsCount').textContent = holdings.length + '개';
  if (!holdings.length) { list.innerHTML = '<div class="empty">보유 종목이 없습니다.</div>'; return; }
  const totalEval = S.portfolio.totalHoldingsValueKRW || 1;
  list.innerHTML = holdings.map(h => {
    const cls = h.profitPct >= 0 ? 'up' : 'down'; const sym = h.market === 'kr' ? '' : '$';
    const evalKRW = h.market === 'kr' ? h.evaluationValue : (h.evaluationValue * S.usdkrw);
    return `<div class="holding-item"><div class="hi-left"><div class="hi-ticker">${h.ticker}</div><div class="hi-meta">${h.quantity}주 · 평균 ${sym}${h.avgPrice.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div><div class="hi-right"><div class="hi-eval">${sym}${h.evaluationValue.toLocaleString(undefined,{maximumFractionDigits:2})}</div><div class="hi-profit ${cls}">${h.profitPct>=0?'+':''}${h.profitPct.toFixed(2)}%</div></div></div>`;
  }).join('');
}
async function loadDividends() {
  const el = document.getElementById('dividendList');
  try {
    const divs = await api('/api/trade/dividends/' + S.currentAccountId);
    if (!divs.length) { el.innerHTML = '<div class="empty">배당 내역이 없습니다.</div>'; return; }
    el.innerHTML = divs.map(d => `<div class="div-item"><div class="div-dot">D</div><div class="div-info"><div class="div-ticker">${d.ticker}</div><div class="div-date">배당락: ${d.date}</div></div><div class="div-right"><div class="div-amt">+${d.currency==='KRW'?'':'$'}${d.amount.toLocaleString(undefined,{maximumFractionDigits:2})}</div><div>${d.quantity}주</div></div></div>`).join('');
  } catch { el.innerHTML = '<div class="empty">불러올 수 없습니다</div>'; }
}

// =========================================================================
// History Tab
// =========================================================================
async function loadHistoryTab() {
  const el = document.getElementById('historyList');
  try {
    const h = await api('/api/trade/history/' + S.currentAccountId);
    if (!h.length) { el.innerHTML = '<div class="empty">거래 내역이 없습니다.</div>'; return; }
    el.innerHTML = h.slice(0, 30).map(x => {
      const b = x.side === 'buy', t = new Date(x.timestamp).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      return `<div class="history-item"><div class="hist-dot ${b?'buy':'sell'}">${b?'B':'S'}</div><div class="hist-info"><div class="hist-ticker">${x.ticker} ${b?'매수':'매도'}</div><div class="hist-detail">${x.quantity}주 ${x.price.toLocaleString()}원</div></div><div class="hist-right"><div class="hist-amt">${b?'-':'+'}${Math.abs(x.amount).toLocaleString()}원</div><div class="hist-time">${t}</div></div></div>`;
    }).join('');
  } catch { el.innerHTML = '<div class="empty">불러올 수 없습니다</div>'; }
}

// =========================================================================
// Stocks Tab - Search & Lists
// =========================================================================
let _searchT = null;
async function onStockSearch(q) {
  clearTimeout(_searchT);
  const res = document.getElementById('stockSearchResults');
  if (!q.trim()) { res.classList.remove('open'); return; }
  _searchT = setTimeout(async () => {
    try {
      const r = await api('/api/search?q=' + encodeURIComponent(q.trim()) + '&market=all');
      res.innerHTML = r.slice(0, 12).map(s => `<div class="ssr-item" onclick="openStockDetail('${s.ticker}','${s.market}','${s.name.replace(/'/g,"\\'")}')"><div><div class="ssr-ticker">${s.ticker}</div><div class="ssr-name">${s.name}</div></div><div class="ssr-market">${s.market==='kr'?'한국':'미국'} / ${s.exchange||''}</div></div>`).join('');
      res.classList.add('open');
    } catch {}
  }, 200);
}
async function loadIndices() {
  try {
    const d = await api('/api/indices');
    const strip = document.getElementById('indicesStrip');
    strip.innerHTML = d.filter(m => m && m.name).slice(0, 8).map(m => {
      const cls = m.change >= 0 ? 'up' : 'down';
      return `<div class="index-chip"><div class="idx-name">${m.name}</div><div class="idx-value">${m.value.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div class="idx-change ${cls}">${m.change>=0?'+':''}${m.change.toFixed(2)}%</div></div>`;
    }).join('');
  } catch {}
}
async function loadHotStocks() {
  try {
    const r = await api('/api/search?q=&market=all');
    document.getElementById('hotStockList').innerHTML = r.slice(0, 20).map(s => {
      const cls = (s.changePct || 0) >= 0 ? 'up' : 'down'; const sym = s.market === 'kr' ? '' : '$';
      return `<div class="hot-item" onclick="openStockDetail('${s.ticker}','${s.market}','${s.name.replace(/'/g,"\\'")}')"><div class="hot-left"><div class="hot-ticker">${s.ticker}</div><div class="hot-name">${s.name}</div></div><div class="hot-right"><div class="hot-price">${sym}${(s.price||0).toLocaleString()}</div><div class="hot-chg ${cls}">${(s.changePct||0)>=0?'+':''}${(s.changePct||0).toFixed(2)}%</div></div></div>`;
    }).join('');
  } catch {}
}

// =========================================================================
// Stock Detail Page
// =========================================================================
async function openStockDetail(ticker, market, name) {
  S.detailStock = { ticker, market, name };
  document.getElementById('stockSearchResults').classList.remove('open');
  document.getElementById('stockSearchInput').value = '';
  selectTab('stockDetail');
  document.getElementById('detailName').textContent = name;
  document.getElementById('detailTicker').textContent = ticker;
  // fetch quote
  try {
    const q = await api('/api/quote?symbol=' + ticker + '&market=' + market);
    S.detailStock.price = q.price || 50000;
    S.detailStock.changePct = q.changePct || 0;
    S.detailStock.currency = market === 'kr' ? 'KRW' : 'USD';
  } catch { S.detailStock.price = market === 'kr' ? 50000 : 150; S.detailStock.changePct = 0; }
  const sym = market === 'kr' ? '' : '$';
  const cls = S.detailStock.changePct >= 0 ? 'up' : 'down';
  document.getElementById('detailPrice').textContent = sym + S.detailStock.price.toLocaleString(undefined, {maximumFractionDigits:2});
  document.getElementById('detailPrice').className = 'detail-price ' + cls;
  document.getElementById('detailChange').textContent = (S.detailStock.changePct >= 0 ? '+' : '') + S.detailStock.changePct.toFixed(2) + '%';
  document.getElementById('detailChange').className = 'detail-change ' + cls;
  // reset chart tabs
  S.detailRange = '1d';
  document.querySelectorAll('.d-range-tab').forEach(b => b.classList.remove('active'));
  document.querySelector('.d-range-tab[data-range="1d"]').classList.add('active');
  loadDetailChart();
  loadDetailOrderBook();
}
function closeStockDetail() { selectTab('stocks'); }
async function switchDetailRange(range, btn) {
  S.detailRange = range;
  document.querySelectorAll('.d-range-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadDetailChart();
}
async function loadDetailChart() {
  const wrap = document.getElementById('detailChartWrap');
  if (S.detailChart) { S.detailChart.remove(); S.detailChart = null; S.detailSeries = null; }
  wrap.innerHTML = '';
  try {
    const chart = await api('/api/chart?symbol=' + S.detailStock.ticker + '&range=' + S.detailRange + '&market=' + S.detailStock.market);
    const up = S.detailStock.changePct >= 0;
    S.detailChart = LightweightCharts.createChart(wrap, {
      width: wrap.clientWidth, height: 240,
      layout: { background: { color: 'transparent' }, textColor: '#8B95A1', fontSize: 10 },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: false },
      crosshair: { mode: 0 },
      handleScroll: { vertTouchDrag: false },
    });
    S.detailSeries = S.detailChart.addAreaSeries({
      lineColor: up ? '#F04452' : '#3182F6', topColor: up ? 'rgba(240,68,82,0.1)' : 'rgba(49,130,246,0.1)',
      bottomColor: 'rgba(0,0,0,0)', lineWidth: 2, priceLineVisible: false,
    });
    const data = (chart.ohlcv || []).filter(d => d.close != null).map(d => ({ time: d.time, value: d.close }));
    if (data.length) S.detailSeries.setData(data);
  } catch {}
}
async function loadDetailOrderBook() {
  const el = document.getElementById('detailOrderBook');
  try {
    const ob = await api('/api/trade/orderbook?ticker=' + S.detailStock.ticker + '&market=' + S.detailStock.market);
    const maxV = Math.max(...ob.asks.map(a => a.volume), ...ob.bids.map(b => b.volume), 1);
    el.innerHTML = `
      ${[...ob.asks].reverse().map(a => `<div class="dob-row ask"><span class="dob-price">${a.price.toLocaleString()}</span><div class="dob-bar-wrap"><div class="dob-bar ask" style="width:${(a.volume/maxV*100)}%"></div></div><span class="dob-vol">${a.volume}</span></div>`).join('')}
      <div class="dob-center">${ob.price.toLocaleString()}</div>
      ${ob.bids.map(b => `<div class="dob-row bid"><span class="dob-price">${b.price.toLocaleString()}</span><div class="dob-bar-wrap"><div class="dob-bar bid" style="width:${(b.volume/maxV*100)}%"></div></div><span class="dob-vol">${b.volume}</span></div>`).join('')}`;
  } catch {}
}

// =========================================================================
// Order Sheet
// =========================================================================
function openOrderSheet(side) {
  if (!S.detailStock) return;
  S.orderSide = side; S.orderType = 'limit';
  document.getElementById('orderSheetTitle').textContent = side === 'buy' ? '매수' : '매도';
  const btn = document.getElementById('orderSubmitBtn'); btn.textContent = (side === 'buy' ? '매수' : '매도') + '하기';
  btn.className = 'sheet-submit-btn ' + side;
  document.getElementById('limitPriceField').style.display = '';
  document.getElementById('orderPrice').value = S.detailStock.price;
  document.getElementById('orderQty').value = '';
  document.getElementById('orderSummary').style.display = 'none';
  document.querySelectorAll('#orderSheet .seg-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#orderSheet .seg-btn[data-otype="limit"]').classList.add('active');
  // mini price
  const sym = S.detailStock.market === 'kr' ? '' : '$';
  const cls = S.detailStock.changePct >= 0 ? 'up' : 'down';
  document.getElementById('miniPrice').textContent = S.detailStock.ticker + ' ' + sym + S.detailStock.price.toLocaleString(undefined, {maximumFractionDigits:2}) + ' (' + (S.detailStock.changePct >= 0 ? '+' : '') + S.detailStock.changePct.toFixed(2) + '%)';
  document.getElementById('miniPrice').className = 'detail-price-mini ' + cls;
  document.getElementById('orderOverlay').classList.add('open');
  document.getElementById('orderSheet').classList.add('open');
}
function closeOrderSheet() { document.getElementById('orderOverlay').classList.remove('open'); document.getElementById('orderSheet').classList.remove('open'); }
function setOrderType(type, btn) {
  S.orderType = type;
  document.querySelectorAll('#orderSheet .seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('limitPriceField').style.display = type === 'limit' ? '' : 'none';
  updateOrderSummary();
}
function setQtyPercent(pct) {
  const p = S.portfolio; if (!p || !S.detailStock) return;
  const price = parseFloat((document.getElementById('orderPrice').value || '').replace(/,/g, '')) || S.detailStock.price;
  if (price <= 0) return;
  let max = 0;
  if (S.orderSide === 'buy') { max = Math.floor((S.detailStock.market === 'kr' ? p.krwBalance : (p.usdBalance || 0) * S.usdkrw) / price * (pct / 100)); }
  else { const h = p.holdings.find(h => h.ticker === S.detailStock.ticker); max = h ? Math.floor(h.quantity * (pct / 100)) : 0; }
  document.getElementById('orderQty').value = Math.max(1, max);
  updateOrderSummary();
}
function updateOrderSummary() {
  const price = parseFloat((document.getElementById('orderPrice').value || '').replace(/,/g, '')) || (S.detailStock?.price || 0);
  const qty = parseInt((document.getElementById('orderQty').value || '').replace(/,/g, '')) || 0;
  const s = document.getElementById('orderSummary');
  if (!S.detailStock || price <= 0 || qty <= 0) { s.style.display = 'none'; return; }
  s.style.display = '';
  const isKR = S.detailStock.market === 'kr'; const sym = isKR ? '' : '$'; const tv = price * qty; const fee = tv * 0.00015;
  document.getElementById('osTotal').textContent = sym + tv.toLocaleString() + (isKR ? '원' : '');
  document.getElementById('osFee').textContent = sym + fee.toFixed(2) + (isKR ? '원' : '');
  const fx = document.getElementById('osFxRow');
  if (S.orderSide === 'buy' && !isKR && S.portfolio) {
    const need = tv + fee;
    if ((S.portfolio.usdBalance || 0) >= need) { fx.style.display = 'none'; }
    else { fx.style.display = ''; document.getElementById('osFx').textContent = Math.ceil((need - (S.portfolio.usdBalance || 0)) * S.usdkrw * 1.005).toLocaleString() + '원'; }
    document.getElementById('osNeed').textContent = '$' + need.toFixed(2);
  } else { fx.style.display = 'none'; document.getElementById('osNeed').textContent = sym + (tv + fee).toLocaleString() + (isKR ? '원' : ''); }
}
async function submitOrder() {
  if (!S.detailStock) { toast('종목이 선택되지 않았습니다.'); return; }
  const price = parseFloat((document.getElementById('orderPrice').value || '').replace(/,/g, '')) || S.detailStock.price;
  const qty = parseInt((document.getElementById('orderQty').value || '').replace(/,/g, ''));
  if (!price || !qty || qty <= 0) { toast('가격과 수량을 입력해주세요.'); return; }
  const btn = document.getElementById('orderSubmitBtn'); btn.disabled = true; btn.textContent = '처리 중...';
  try {
    const r = await api('/api/trade/order', { method: 'POST', body: JSON.stringify({ accountId: S.currentAccountId, ticker: S.detailStock.ticker, market: S.detailStock.market, type: 'stock', side: S.orderSide, price, quantity: qty, mode: S.currentAccount?.type || 'realtime' }) });
    if (r.ok) { toast(S.detailStock.ticker + ' ' + qty + '주 ' + (S.orderSide === 'buy' ? '매수' : '매도') + ' ' + (r.executed ? '체결 완료' : '접수 완료')); closeOrderSheet(); loadPortfolio(); }
  } catch (e) { toast(e.message); }
  btn.disabled = false; btn.textContent = (S.orderSide === 'buy' ? '매수' : '매도') + '하기';
}

// =========================================================================
// FX Sheet
// =========================================================================
function openFXSheet() {
  document.getElementById('fxOverlay').classList.add('open');
  document.getElementById('fxSheet').classList.add('open');
  document.getElementById('fxRateDisplay').textContent = '1 USD = ' + S.usdkrw.toLocaleString() + '원';
  document.getElementById('fxKrwAmount').value = ''; document.getElementById('fxUsdAmount').value = '';
  updateFXPreview();
}
function closeFXSheet() { document.getElementById('fxOverlay').classList.remove('open'); document.getElementById('fxSheet').classList.remove('open'); }
function setFXDir(dir, btn) {
  S.fxDirection = dir;
  document.querySelectorAll('#fxSheet .seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('fxKrwField').style.display = dir === 'krw2usd' ? '' : 'none';
  document.getElementById('fxUsdField').style.display = dir === 'usd2krw' ? '' : 'none';
  updateFXPreview();
}
function updateFXPreview() {
  const rate = S.usdkrw; const spread = 0.005; const el = document.getElementById('fxPreview');
  if (S.fxDirection === 'krw2usd') {
    const krw = parseInt((document.getElementById('fxKrwAmount').value || '').replace(/,/g, '')) || 0;
    el.textContent = krw <= 0 ? '금액을 입력하세요' : krw.toLocaleString() + '원 --> $' + (krw / (rate * (1 + spread))).toFixed(2) + ' (수수료 0.5%)';
  } else {
    const usd = parseFloat((document.getElementById('fxUsdAmount').value || '').replace(/,/g, '')) || 0;
    el.textContent = usd <= 0 ? '금액을 입력하세요' : '$' + usd.toFixed(2) + ' --> ' + Math.round(usd * rate * (1 - spread)).toLocaleString() + '원 (수수료 0.5%)';
  }
}
function executeFX() {
  const p = S.portfolio; if (!p) return;
  const rate = S.usdkrw; const spread = 0.005;
  if (S.fxDirection === 'krw2usd') {
    const krw = parseInt((document.getElementById('fxKrwAmount').value || '').replace(/,/g, '')) || 0;
    if (krw <= 0 || p.krwBalance < krw) { toast('원화 잔액 부족'); return; }
    p.krwBalance -= krw; p.usdBalance = (p.usdBalance || 0) + krw / (rate * (1 + spread));
    toast(krw.toLocaleString() + '원 환전 완료');
  } else {
    const usd = parseFloat((document.getElementById('fxUsdAmount').value || '').replace(/,/g, '')) || 0;
    if (usd <= 0 || (p.usdBalance || 0) < usd) { toast('달러 잔액 부족'); return; }
    p.usdBalance -= usd; p.krwBalance += usd * rate * (1 - spread);
    toast('$' + usd.toFixed(2) + ' 환전 완료');
  }
  closeFXSheet(); renderAssets();
}

// Close search on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.search-section')) document.getElementById('stockSearchResults').classList.remove('open');
});