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
let mockDividends = getStore('dividends', []);
let mockPendingOrders = getStore('pending', []);
currentMode = getStore('mode', 'virtual');

// --- Filter States ---
let sortOrder = 'return_desc'; // 'return_desc', 'return_asc', 'val_desc'
let displayMode = 'current'; // 'current', 'val'
let displayCurrency = 'krw'; // 'krw', 'usd'
let currentSubTab = 'orders'; // 'orders', 'dividends'

document.addEventListener('DOMContentLoaded', () => {
  switchMode(currentMode);
  switchTab('holdings');
  updatePortfolioTotal(); // Calculate immediately using cached prices / mockCapital
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

function switchSubTab(subTab) {
  currentSubTab = subTab;
  document.getElementById('subTabOrders').classList.toggle('active', subTab === 'orders');
  document.getElementById('subTabDividends').classList.toggle('active', subTab === 'dividends');
  renderHistory();
}

function toggleSortOrder() {
  if (sortOrder === 'return_desc') sortOrder = 'return_asc';
  else if (sortOrder === 'return_asc') sortOrder = 'val_desc';
  else sortOrder = 'return_desc';
  
  const text = sortOrder === 'return_desc' ? '수익률 높은 순' : (sortOrder === 'return_asc' ? '수익률 낮은 순' : '평가금 많은 순');
  document.getElementById('btnSortOrder').innerHTML = `${text} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><polyline points="6 9 12 15 18 9"/></svg>`;
  renderHoldings();
}

function toggleDisplayMode() {
  displayMode = displayMode === 'current' ? 'val' : 'current';
  document.getElementById('dispModeCurrent').classList.toggle('active', displayMode === 'current');
  document.getElementById('dispModeVal').classList.toggle('active', displayMode === 'val');
  renderHoldings();
}

function toggleCurrency() {
  displayCurrency = displayCurrency === 'krw' ? 'usd' : 'krw';
  document.getElementById('currKrw').classList.toggle('active', displayCurrency === 'krw');
  document.getElementById('currUsd').classList.toggle('active', displayCurrency === 'usd');
  updatePortfolioTotal();
  renderHoldings();
  renderShopping();
  if (currentTab === 'history') renderHistory();
}

// --- Data Fetching ---
async function fetchMarketData() {
  try {
    const res = await fetch('/api/stock/top');
    const data = await res.json();
    data.forEach(q => liveQuotes[q.id] = q);
    
    // --- Matching Engine for Pending Orders ---
    let pendingChanged = false;
    mockPendingOrders = mockPendingOrders.filter(order => {
      const q = liveQuotes[order.id];
      if (!q) return true; // keep if no quote
      
      let executed = false;
      if (order.type === 'buy' && q.price <= order.price) {
        executed = true;
        // execute buy
        if (!mockHoldings[order.id]) {
          mockHoldings[order.id] = { name: order.name, qty: 0, avgPrice: 0 };
        }
        const h = mockHoldings[order.id];
        const cost = order.qty * order.price;
        const totalCost = (h.qty * h.avgPrice) + cost;
        h.qty += order.qty;
        h.avgPrice = totalCost / h.qty;
      } 
      else if (order.type === 'sell' && q.price >= order.price) {
        executed = true;
        // execute sell (stocks already reserved, just add cash)
        mockCapital += (order.qty * order.price);
      }
      
      if (executed) {
        pendingChanged = true;
        mockHistory.push({ time: Date.now(), id: order.id, name: order.name, type: order.type, price: order.price, qty: order.qty });
        showToast(`[체결완료] ${order.name} ${order.qty}주 지정가 ${order.type === 'buy' ? '구매' : '판매'}!`);
        return false; // remove from pending
      }
      return true; // keep in pending
    });
    
    if (pendingChanged) {
      setStore('capital', mockCapital);
      setStore('holdings', mockHoldings);
      setStore('history', mockHistory);
      setStore('pending', mockPendingOrders);
    }
    
    updatePortfolioTotal();
    if(currentTab === 'holdings') renderHoldings();
    if(currentTab === 'shopping') renderShopping();
    if(currentTab === 'history' && pendingChanged) renderHistory();
    
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
  
  // Prepare data for sorting
  let holdingsData = keys.map(id => {
    const holding = mockHoldings[id];
    const quote = liveQuotes[id] || { price: holding.avgPrice, changePct: 0 };
    const currentVal = holding.qty * quote.price;
    const returnPct = ((quote.price - holding.avgPrice) / holding.avgPrice * 100);
    const returnAmt = currentVal - (holding.qty * holding.avgPrice);
    return { id, holding, quote, currentVal, returnPct, returnAmt };
  }).filter(d => d.holding.qty > 0);
  
  // Sort
  if (sortOrder === 'return_desc') holdingsData.sort((a,b) => b.returnPct - a.returnPct);
  else if (sortOrder === 'return_asc') holdingsData.sort((a,b) => a.returnPct - b.returnPct);
  else if (sortOrder === 'val_desc') holdingsData.sort((a,b) => b.currentVal - a.currentVal);
  
  let html = '';
  holdingsData.forEach(d => {
    const colorClass = d.returnPct > 0 ? 'color-red' : (d.returnPct < 0 ? 'color-blue' : '');
    
    // Formatting based on displayCurrency
    const isUsd = displayCurrency === 'usd';
    const rate = isUsd ? 1/1350 : 1;
    const sym = isUsd ? '$' : '';
    const unit = isUsd ? '' : '원';
    
    // Right side top/bottom display logic
    let topText, btmText;
    if (displayMode === 'current') {
      topText = `${sym}${(d.quote.price * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}${unit}`;
      btmText = `${d.returnPct > 0 ? '+' : ''}${d.returnPct.toFixed(2)}%`;
    } else {
      topText = `${sym}${(d.currentVal * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}${unit}`;
      btmText = `${d.returnPct > 0 ? '+' : ''}${d.returnPct.toFixed(2)}% (${sym}${(d.returnAmt * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}${unit})`;
    }
    
    html += `
      <div class="list-item" onclick="openOrderSheet('${d.id}')">
        <div class="item-left">
          <div class="item-icon">${d.id.substring(0,1)}</div>
          <div>
            <div class="item-title">${d.holding.name}</div>
            <div class="item-desc">${d.holding.qty}주 (평단가 ${sym}${(d.holding.avgPrice * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}${unit})</div>
          </div>
        </div>
        <div class="item-right">
          <div class="item-price">${topText}</div>
          <div class="item-change ${colorClass}">${btmText}</div>
        </div>
      </div>
    `;
  });
  list.innerHTML = html || `<div class="empty-state">보유중인 주식이 없습니다.</div>`;
}

function renderShopping() {
  const list = document.getElementById('searchList');
  let html = '<div class="section-title" style="font-weight:700; margin-bottom:12px;">인기 종목</div>';
  
  const isUsd = displayCurrency === 'usd';
  const rate = isUsd ? 1/1350 : 1;
  const sym = isUsd ? '$' : '';
  const unit = isUsd ? '' : '원';

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
          <div class="item-price">${sym}${(q.price * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}${unit}</div>
          <div class="item-change ${colorClass}">${q.changePct > 0 ? '+' : ''}${q.changePct.toFixed(2)}%</div>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

function renderHistory() {
  const list = document.getElementById('historyList');
  
  if (currentSubTab === 'dividends') {
    if(mockDividends.length === 0) {
      list.innerHTML = `<div class="empty-state">배당금 내역이 없습니다.</div>`;
      return;
    }
    let html = '<div style="font-size:15px; font-weight:700; color:var(--text); margin-bottom:16px; padding:0 20px;">입금된 배당금</div>';
    [...mockDividends].reverse().forEach(d => {
      const dateObj = new Date(d.time);
      const dateStr = `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
      html += `
        <div style="display:flex; padding:12px 20px; align-items:flex-start;">
          <div style="width:50px; font-size:15px; font-weight:600; color:var(--text); margin-top:2px;">${dateStr}</div>
          <div style="flex:1;">
            <div style="font-size:16px; font-weight:700; color:var(--text); margin-bottom:4px;">${d.name}</div>
            <div style="font-size:14px; font-weight:500; color:var(--up-color);">+${d.amount.toLocaleString()}원 배당 입금</div>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
    return;
  }

  // Orders Tab
  let html = '';
  
  if (mockPendingOrders.length > 0) {
    html += '<div style="font-size:15px; font-weight:700; color:var(--text); margin-bottom:16px; padding:0 20px;">대기중인 주문</div>';
    [...mockPendingOrders].reverse().forEach(p => {
      const typeStr = p.type === 'buy' ? '구매 대기' : '판매 대기';
      const dateObj = new Date(p.time);
      const dateStr = `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
      const priceStr = p.price > 50000 ? `${p.price.toLocaleString()}원` : `$${(p.price/1350).toFixed(2)}`;
      
      html += `
        <div style="display:flex; padding:12px 20px; align-items:flex-start; opacity: 0.7;">
          <div style="width:50px; font-size:15px; font-weight:600; color:var(--text); margin-top:2px;">${dateStr}</div>
          <div style="flex:1;">
            <div style="font-size:16px; font-weight:700; color:var(--text); margin-bottom:4px;">${p.name} <span style="font-size:12px; font-weight:500; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; margin-left:4px;">대기중</span></div>
            <div style="font-size:14px; font-weight:500; color:var(--muted);">${priceStr} ${typeStr}</div>
          </div>
          <button onclick="cancelPendingOrder(${p.time})" style="padding:6px 12px; background:var(--surface2); color:var(--red); border:none; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;">취소</button>
        </div>
      `;
    });
    html += '<div style="height:1px; background:var(--border); margin:16px 20px;"></div>';
  }

  if(mockHistory.length === 0 && mockPendingOrders.length === 0) {
    list.innerHTML = `<div class="empty-state">거래 내역이 없습니다.</div>`;
    return;
  }
  
  if (mockHistory.length > 0) {
    html += '<div style="font-size:15px; font-weight:700; color:var(--text); margin-bottom:16px; padding:0 20px;">완료된 주문</div>';
    [...mockHistory].reverse().forEach(h => {
      const typeStr = h.type === 'buy' ? '구매' : '판매';
      const dateObj = new Date(h.time);
      const dateStr = `${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
      const priceStr = h.price > 50000 ? `${h.price.toLocaleString()}원` : `$${(h.price/1350).toFixed(2)}`;
      
      html += `
        <div style="display:flex; padding:12px 20px; align-items:flex-start;">
          <div style="width:50px; font-size:15px; font-weight:600; color:var(--text); margin-top:2px;">${dateStr}</div>
          <div style="flex:1;">
            <div style="font-size:16px; font-weight:700; color:var(--text); margin-bottom:4px;">${h.name}</div>
            <div style="font-size:14px; font-weight:500; color:var(--muted);">${priceStr} ${typeStr} 완료</div>
          </div>
        </div>
      `;
    });
  }
  list.innerHTML = html;
}

function cancelPendingOrder(time) {
  const orderIdx = mockPendingOrders.findIndex(p => p.time === time);
  if (orderIdx === -1) return;
  const order = mockPendingOrders[orderIdx];
  
  // Refund reserved cash or stocks
  if (order.type === 'buy') {
    mockCapital += (order.qty * order.price);
    setStore('capital', mockCapital);
  } else {
    if (!mockHoldings[order.id]) mockHoldings[order.id] = { name: order.name, qty: 0, avgPrice: 0 };
    mockHoldings[order.id].qty += order.qty;
    setStore('holdings', mockHoldings);
  }
  
  mockPendingOrders.splice(orderIdx, 1);
  setStore('pending', mockPendingOrders);
  updatePortfolioTotal();
  renderHistory();
  showToast('대기 주문이 취소되었습니다.');
}

function simulateDividend() {
  const keys = Object.keys(mockHoldings);
  if (keys.length === 0) return alert('보유중인 주식이 없습니다.');
  
  let totalDiv = 0;
  keys.forEach(id => {
    const h = mockHoldings[id];
    if(h.qty <= 0) return;
    const q = liveQuotes[id] || { price: h.avgPrice };
    const stockVal = h.qty * q.price;
    const divAmt = Math.floor(stockVal * (Math.random() * 0.05 + 0.01)); // 1% ~ 6% dividend
    totalDiv += divAmt;
    mockDividends.push({ time: Date.now(), id, name: h.name, amount: divAmt });
  });
  
  mockCapital += totalDiv;
  setStore('capital', mockCapital);
  setStore('dividends', mockDividends);
  updatePortfolioTotal();
  
  closeSettingsSheet();
  alert(`총 ${totalDiv.toLocaleString()}원의 배당금이 예수금으로 지급되었습니다!`);
  
  if (currentTab === 'history') {
    switchSubTab('dividends');
  }
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
  
  const isUsd = displayCurrency === 'usd';
  const rate = isUsd ? 1/1350 : 1;
  const sym = isUsd ? '$' : '';
  const unit = isUsd ? '' : '원';
  
  // Total Asset (내 투자)
  document.getElementById('portfolioTotal').innerText = `${sym}${Math.floor(totalAsset * rate).toLocaleString()}${unit}`;
  
  // Return text like: "+217,339원 (14.1%)"
  const retEl = document.getElementById('portfolioReturn');
  const sign = returnAmt > 0 ? '+' : '';
  retEl.innerText = `${sign}${sym}${Math.floor(returnAmt * rate).toLocaleString()}${unit} (${sign}${returnPct}%)`;
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
