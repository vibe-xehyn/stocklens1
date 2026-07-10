// Rebuilt Mock Trading App Logic
const INIT_CAPITAL = 10000000;
let liveQuotes = {};
let activeStock = null;
let orderType = 'buy';
let currentTab = 'holdings';
let currentMode = 'virtual';
let orderAmountString = '0';

function getStore(key, def) {
  try {
    const val = localStorage.getItem(`mock_${key}`);
    return val ? JSON.parse(val) : def;
  } catch(e) { return def; }
}
function setStore(key, val) {
  localStorage.setItem(`mock_${key}`, JSON.stringify(val));
}

let mockCapital = getStore('capital', INIT_CAPITAL);
let mockHoldings = getStore('holdings', {});
let mockHistory = getStore('history', []);
currentMode = getStore('mode', 'virtual');

document.addEventListener('DOMContentLoaded', () => {
  switchMode(currentMode);
  switchTab('holdings');
  fetchMarketData();
  setInterval(fetchMarketData, 5000);
});

// --- UI Logic ---
function switchMode(mode) {
  currentMode = mode;
  setStore('mode', mode);
  document.getElementById('btnModeVirtual').classList.toggle('active', mode === 'virtual');
  document.getElementById('btnModeRealtime').classList.toggle('active', mode === 'realtime');
  
  const container = document.querySelector('.mode-toggle-container');
  if (container) container.dataset.mode = mode;
  showToast(mode === 'virtual' ? '단기 연습모드로 변경되었습니다.' : '실전 롱텀모드로 변경되었습니다.');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  
  event?.currentTarget?.classList.add('active');
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
  document.querySelector('.toss-tabs').dataset.tab = tab;
  
  if(tab === 'holdings') renderHoldings();
  if(tab === 'shopping') renderShopping();
  if(tab === 'history') renderHistory();
}

// --- Data Fetching ---
async function fetchMarketData() {
  try {
    const res = await fetch('/api/stock/top');
    const data = await res.json();
    data.forEach(q => liveQuotes[q.id] = q);
    
    updatePortfolioTotal();
    if(currentTab === 'holdings') renderHoldings();
    if(currentTab === 'shopping') renderShopping();
    
    // Update bottom sheet if open
    if(activeStock) updateSheetPrice();
  } catch (e) { console.error('Fetch error', e); }
}

// --- Rendering ---
function renderHoldings() {
  const list = document.getElementById('holdingsList');
  const keys = Object.keys(mockHoldings);
  if(keys.length === 0) {
    list.innerHTML = `<div class="empty-state">보유중인 주식이 없습니다.</div>`;
    return;
  }
  
  let html = '';
  for(let id of keys) {
    const holding = mockHoldings[id];
    if(holding.qty <= 0) continue;
    
    const quote = liveQuotes[id] || { price: holding.avgPrice, changePct: 0 };
    const currentVal = holding.qty * quote.price;
    const returnPct = ((quote.price - holding.avgPrice) / holding.avgPrice * 100).toFixed(2);
    const returnAmt = currentVal - (holding.qty * holding.avgPrice);
    const colorClass = returnPct > 0 ? 'color-red' : (returnPct < 0 ? 'color-blue' : '');
    
    html += `
      <div class="list-item" onclick="openOrderSheet('${id}')">
        <div class="item-left">
          <div class="item-icon">${id.substring(0,1)}</div>
          <div>
            <div class="item-title">${holding.name}</div>
            <div class="item-desc">${holding.qty}주 (평단가 ${holding.avgPrice.toLocaleString()}원)</div>
          </div>
        </div>
        <div class="item-right">
          <div class="item-price">${currentVal.toLocaleString()}원</div>
          <div class="item-change ${colorClass}">${returnPct > 0 ? '+' : ''}${returnPct}% (${returnAmt.toLocaleString()}원)</div>
        </div>
      </div>
    `;
  }
  list.innerHTML = html || `<div class="empty-state">보유중인 주식이 없습니다.</div>`;
}

function renderShopping() {
  const list = document.getElementById('searchList');
  let html = '<div class="section-title" style="font-weight:700; margin-bottom:12px;">인기 종목</div>';
  
  const stocks = Object.values(liveQuotes);
  stocks.forEach(q => {
    const colorClass = q.changePct > 0 ? 'color-red' : (q.changePct < 0 ? 'color-blue' : '');
    html += `
      <div class="list-item" onclick="openOrderSheet('${q.id}')">
        <div class="item-left">
          <div class="item-icon">${q.name.substring(0,1)}</div>
          <div>
            <div class="item-title">${q.name}</div>
            <div class="item-desc">${q.id}</div>
          </div>
        </div>
        <div class="item-right">
          <div class="item-price">${q.price.toLocaleString()}원</div>
          <div class="item-change ${colorClass}">${q.changePct > 0 ? '+' : ''}${q.changePct.toFixed(2)}%</div>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if(mockHistory.length === 0) {
    list.innerHTML = `<div class="empty-state">거래 내역이 없습니다.</div>`;
    return;
  }
  
  let html = '';
  // Reverse to show newest first
  [...mockHistory].reverse().forEach(h => {
    const colorClass = h.type === 'buy' ? 'color-red' : 'color-blue';
    const typeStr = h.type === 'buy' ? '구매' : '판매';
    const dateStr = new Date(h.time).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    
    html += `
      <div class="list-item" style="cursor:default;">
        <div class="item-left">
          <div>
            <div class="item-title">${h.name} <span class="${colorClass}">${typeStr}</span></div>
            <div class="item-desc">${dateStr}</div>
          </div>
        </div>
        <div class="item-right">
          <div class="item-price">${(h.price * h.qty).toLocaleString()}원</div>
          <div class="item-change">${h.qty}주 @ ${h.price.toLocaleString()}원</div>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

function updatePortfolioTotal() {
  let stockVal = 0;
  let totalCost = 0;
  
  for(let id in mockHoldings) {
    const h = mockHoldings[id];
    if(h.qty <= 0) continue;
    const q = liveQuotes[id] || { price: h.avgPrice };
    stockVal += h.qty * q.price;
    totalCost += h.qty * h.avgPrice;
  }
  
  const totalAsset = mockCapital + stockVal;
  const returnAmt = totalAsset - INIT_CAPITAL;
  const returnPct = ((returnAmt / INIT_CAPITAL) * 100).toFixed(2);
  
  // Total Asset (내 투자)
  document.getElementById('portfolioTotal').innerText = `${Math.floor(totalAsset).toLocaleString()}원`;
  
  // Return text like: "+217,339원 (14.1%)"
  const retEl = document.getElementById('portfolioReturn');
  const sign = returnAmt > 0 ? '+' : '';
  retEl.innerText = `${sign}${Math.floor(returnAmt).toLocaleString()}원 (${sign}${returnPct}%)`;
  retEl.className = `portfolio-return ${returnAmt > 0 ? 'color-red' : (returnAmt < 0 ? 'color-blue' : '')}`;
  
  // Balance Cards
  document.getElementById('portfolioCashKrw').innerText = `${Math.floor(mockCapital).toLocaleString()}원`;
  document.getElementById('portfolioCashUsd').innerText = `$${(mockCapital / 1350).toFixed(2)}`;
  
  // Account Name Update
  const accNameEl = document.getElementById('currentAccountName');
  if (accNameEl) accNameEl.innerText = mockMode === 'virtual' ? '단기 연습계좌' : '실전 롱텀계좌';
}

// --- Bottom Sheet Logic ---
function openOrderSheet(id) {
  // Redirect to the main app's full-size trading screen in mock mode
  location.href = `/?stock=${encodeURIComponent(id)}&mode=mock`;
}

function closeOrderSheet(e) {
  if(e && e.target !== document.getElementById('orderSheetOverlay')) return;
  document.getElementById('orderSheetOverlay').classList.remove('open');
  activeStock = null;
}

function updateSheetPrice() {
  if(!activeStock) return;
  const q = liveQuotes[activeStock.id] || activeStock;
  document.getElementById('orderStockPrice').innerText = `${q.price.toLocaleString()}원`;
  const chgEl = document.getElementById('orderStockChange');
  chgEl.innerText = `${q.changePct > 0 ? '+' : ''}${q.changePct.toFixed(2)}%`;
  chgEl.className = `sheet-change ${q.changePct > 0 ? 'color-red' : (q.changePct < 0 ? 'color-blue' : '')}`;
}

function switchOrderType(type) {
  orderType = type;
  document.getElementById('btnOrderBuy').classList.toggle('active', type === 'buy');
  document.getElementById('btnOrderSell').classList.toggle('active', type === 'sell');
  
  const btn = document.getElementById('btnExecuteOrder');
  btn.innerText = type === 'buy' ? '구매하기' : '판매하기';
  btn.className = `toss-btn primary ${type === 'buy' ? 'bg-red' : 'bg-blue'}`;
  if(type==='sell') btn.style.background = 'var(--blue)';
  else btn.style.background = 'var(--red)';
}

function formatOrderInput(el) {
  let val = el.value.replace(/[^0-9]/g, '');
  if(!val) {
    orderAmountString = '0';
    el.value = '';
    document.getElementById('estimatedQty').innerText = `예상 수량: 0주`;
    return;
  }
  orderAmountString = val;
  el.value = parseInt(val).toLocaleString();
  
  if(activeStock) {
    const qty = Math.floor(parseInt(val) / activeStock.price);
    document.getElementById('estimatedQty').innerText = `예상 수량: ${qty}주`;
  }
}

function addOrderAmount(amt) {
  let current = parseInt(orderAmountString) || 0;
  if(amt === 'max') {
    if(orderType === 'buy') {
      current = Math.floor(mockCapital);
    } else {
      const h = mockHoldings[activeStock.id];
      current = h ? Math.floor(h.qty * activeStock.price) : 0;
    }
  } else {
    current += amt;
  }
  
  const input = document.getElementById('orderAmountInput');
  input.value = current.toString();
  formatOrderInput(input);
}

function executeOrder() {
  if(!activeStock) return;
  const amt = parseInt(orderAmountString) || 0;
  if(amt <= 0) {
    showToast('금액을 입력해주세요.');
    return;
  }
  
  const price = activeStock.price;
  const qty = Math.floor(amt / price);
  if(qty <= 0) {
    showToast('해당 금액으로는 1주도 살 수 없습니다.');
    return;
  }
  
  if(orderType === 'buy') {
    const cost = qty * price;
    if(cost > mockCapital) {
      showToast('예수금이 부족합니다.');
      return;
    }
    
    mockCapital -= cost;
    if(!mockHoldings[activeStock.id]) {
      mockHoldings[activeStock.id] = { name: activeStock.name, qty: 0, avgPrice: 0 };
    }
    const h = mockHoldings[activeStock.id];
    const totalCost = (h.qty * h.avgPrice) + cost;
    h.qty += qty;
    h.avgPrice = totalCost / h.qty;
    
    mockHistory.push({ time: Date.now(), id: activeStock.id, name: activeStock.name, type: 'buy', price, qty });
    showToast(`${activeStock.name} ${qty}주 구매 완료!`);
    
  } else {
    const h = mockHoldings[activeStock.id];
    if(!h || h.qty < qty) {
      showToast('보유 주식이 부족합니다.');
      return;
    }
    
    const revenue = qty * price;
    mockCapital += revenue;
    h.qty -= qty;
    if(h.qty === 0) delete mockHoldings[activeStock.id];
    
    mockHistory.push({ time: Date.now(), id: activeStock.id, name: activeStock.name, type: 'sell', price, qty });
    showToast(`${activeStock.name} ${qty}주 판매 완료!`);
  }
  
  setStore('capital', mockCapital);
  setStore('holdings', mockHoldings);
  setStore('history', mockHistory);
  
  closeOrderSheet();
  updatePortfolioTotal();
  if(currentTab === 'holdings') renderHoldings();
  if(currentTab === 'history') renderHistory();
}

// --- Settings ---
function toggleSettingsDrawer() {
  document.getElementById('settingsSheetOverlay').classList.add('open');
}
function closeSettingsSheet(e) {
  if(e && e.target !== document.getElementById('settingsSheetOverlay')) return;
  document.getElementById('settingsSheetOverlay').classList.remove('open');
}
function resetMockData() {
  mockCapital = INIT_CAPITAL;
  setStore('capital', mockCapital);
  updatePortfolioTotal();
  showToast('투자금이 1천만원으로 재설정되었습니다.');
  closeSettingsSheet();
}
function clearAllData() {
  mockCapital = INIT_CAPITAL;
  mockHoldings = {};
  mockHistory = [];
  setStore('capital', mockCapital);
  setStore('holdings', mockHoldings);
  setStore('history', mockHistory);
  updatePortfolioTotal();
  if(currentTab === 'holdings') renderHoldings();
  if(currentTab === 'history') renderHistory();
  showToast('모든 데이터가 초기화되었습니다.');
  closeSettingsSheet();
}

// --- Utilities ---
let toastTimeout;
function showToast(msg) {
  const t = document.getElementById('toastMsg');
  t.innerText = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2500);
}
