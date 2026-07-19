'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let state = {
  onboardingType: 'realtime',
  onboardingCapital: 50000000,
  accounts: [],
  currentAccountId: null,
  currentAccount: null,
  portfolio: null,
  usdkrw: 1350,
  orderSide: 'buy',
  orderType: 'limit',
  selectedStock: null,
  fxDirection: 'krw2usd',
  eventSource: null,
};

// ── API Helpers ────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok && data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    console.error('[API]', path, e);
    throw e;
  }
}

function getUserId() {
  // read from cookie or generate guest id
  const cookies = document.cookie.split(';').map(c => c.trim());
  const sess = cookies.find(c => c.startsWith('sessionToken='));
  if (sess) return decodeURIComponent(sess.split('=')[1]);
  let gid = localStorage.getItem('mock_guest_id');
  if (!gid) { gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2); localStorage.setItem('mock_guest_id', gid); }
  return gid;
}

const uid = getUserId();

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ── Onboarding Logic ───────────────────────────────────────────────────────
function selectAcctType(type, btn) {
  state.onboardingType = type;
  document.querySelectorAll('.onboard-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function selectCapital(capital, btn) {
  state.onboardingCapital = parseInt(capital);
  document.querySelectorAll('.onboard-capital-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function createAccount() {
  try {
    const result = await api('/api/trade/accounts', {
      method: 'POST',
      body: JSON.stringify({ type: state.onboardingType, initialCapital: state.onboardingCapital }),
    });
    if (result.ok) {
      state.currentAccountId = result.account.id;
      state.currentAccount = result.account;
      document.getElementById('onboardingOverlay').style.display = 'none';
      document.getElementById('appMain').style.display = 'block';
      await initApp();
    }
  } catch (e) {
    toast('계좌 생성 실패: ' + e.message, 'error');
  }
}

// ── App Init ───────────────────────────────────────────────────────────────
async function initApp() {
  await loadAccounts();
  if (!state.currentAccountId && state.accounts.length > 0) {
    state.currentAccountId = state.accounts[0].id;
    state.currentAccount = state.accounts[0];
  }
  if (!state.currentAccountId) {
    // no accounts yet
    document.getElementById('appMain').style.display = 'none';
    document.getElementById('onboardingOverlay').style.display = 'flex';
    return;
  }
  renderAccountSwitcher();
  updateModeBadge();
  await loadPortfolio();
  await loadHistory();
  await loadDividends();
  connectSSE();
}

async function loadAccounts() {
  try {
    state.accounts = await api('/api/trade/accounts');
  } catch (e) {
    state.accounts = [];
  }
}

function renderAccountSwitcher() {
  const dropdown = document.getElementById('acctDropdown');
  const label = document.getElementById('currentAcctLabel');
  if (!state.accounts.length) {
    label.textContent = '계좌 없음';
    dropdown.innerHTML = '';
    return;
  }
  const current = state.accounts.find(a => a.id === state.currentAccountId) || state.accounts[0];
  state.currentAccount = current;
  state.currentAccountId = current.id;
  label.textContent = current.label;

  dropdown.innerHTML = state.accounts.map(a => `
    <div class="acct-dropdown-item ${a.id === state.currentAccountId ? 'active' : ''}" onclick="switchAccount('${a.id}')">
      <span class="acct-type-dot ${a.type}"></span>
      ${a.label}
      <span style="margin-left:auto;font-size:10px;color:var(--muted)">₩${(a.initialCapital/10000).toFixed(0)}만</span>
    </div>
  `).join('');
}

function toggleAcctDropdown() {
  document.getElementById('acctDropdown').classList.toggle('open');
  setTimeout(() => {
    document.addEventListener('click', function close(e) {
      if (!e.target.closest('.account-switcher')) {
        document.getElementById('acctDropdown').classList.remove('open');
        document.removeEventListener('click', close);
      }
    });
  }, 10);
}

async function switchAccount(acctId) {
  state.currentAccountId = acctId;
  state.currentAccount = state.accounts.find(a => a.id === acctId);
  document.getElementById('acctDropdown').classList.remove('open');
  renderAccountSwitcher();
  updateModeBadge();
  await loadPortfolio();
  // reconnect SSE for new account
  connectSSE();
}

function updateModeBadge() {
  const badge = document.getElementById('mockModeBadge');
  if (!state.currentAccount) return;
  if (state.currentAccount.type === 'virtual') {
    badge.textContent = '가상 시뮬레이션';
    badge.className = 'mock-mode-badge virtual';
  } else {
    badge.textContent = '실시간 투자';
    badge.className = 'mock-mode-badge';
  }
}

async function openNewAcctModal() {
  // create simple overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>새 계좌 개설</h3>
      <p>계좌 타입과 초기 자본금을 선택하세요.</p>
      <div class="onboard-section">
        <div class="onboard-label">계좌 타입</div>
        <div class="onboard-type-grid">
          <button class="onboard-type-btn active" data-mtype="realtime" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
            <div class="ot-title">실시간</div><div class="ot-desc">실제 시세 기반</div>
          </button>
          <button class="onboard-type-btn" data-mtype="virtual" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
            <div class="ot-title">가상</div><div class="ot-desc">24시간 시뮬레이션</div>
          </button>
        </div>
      </div>
      <div class="onboard-section">
        <div class="onboard-label">초기 자본금</div>
        <div class="onboard-capital-grid">
          <button class="onboard-capital-btn" data-mcap="10000000" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">1,000만원</button>
          <button class="onboard-capital-btn active" data-mcap="50000000" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">5,000만원</button>
          <button class="onboard-capital-btn" data-mcap="100000000" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">1억원</button>
          <button class="onboard-capital-btn" data-mcap="1000000000" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">10억원</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn" onclick="this.closest('.modal-overlay').remove()">취소</button>
        <button class="modal-btn primary" id="newAcctConfirm">개설하기</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#newAcctConfirm').onclick = async () => {
    const typeBtn = overlay.querySelector('.onboard-type-btn.active');
    const capBtn = overlay.querySelector('.onboard-capital-btn.active');
    const type = typeBtn?.dataset.mtype || 'realtime';
    const capital = parseInt(capBtn?.dataset.mcap || 50000000);

    try {
      const result = await api('/api/trade/accounts', {
        method: 'POST',
        body: JSON.stringify({ type, initialCapital: capital }),
      });
      if (result.ok) {
        overlay.remove();
        toast('새 계좌가 개설되었습니다!', 'success');
        await loadAccounts();
        state.currentAccountId = result.account.id;
        state.currentAccount = result.account;
        renderAccountSwitcher();
        updateModeBadge();
        await loadPortfolio();
        connectSSE();
      }
    } catch (e) {
      toast('계좌 개설 실패: ' + e.message, 'error');
    }
  };
}

async function resetAccount() {
  if (!state.currentAccountId) return;
  if (!confirm('정말로 계좌를 리셋하시겠습니까? 모든 보유 종목과 거래 내역이 초기화됩니다.')) return;
  try {
    await api(`/api/trade/accounts/${state.currentAccountId}/reset`, { method: 'POST' });
    toast('계좌가 초기 자본금으로 리셋되었습니다.', 'info');
    await loadPortfolio();
  } catch (e) {
    toast('리셋 실패: ' + e.message, 'error');
  }
}

function goToDashboard() {
  window.location.href = '/';
}

// ── Portfolio ──────────────────────────────────────────────────────────────
async function loadPortfolio() {
  if (!state.currentAccountId) return;
  try {
    state.portfolio = await api(`/api/trade/portfolio/${state.currentAccountId}`);
    state.usdkrw = state.portfolio.usdkrw || 1350;
    renderAssetSummary();
    renderHoldings();
    updateFXSheetRate();
  } catch (e) {
    console.error('loadPortfolio error:', e);
  }
}

function renderAssetSummary() {
  const p = state.portfolio;
  if (!p) return;

  document.getElementById('totalAsset').textContent = '₩' + Math.round(p.totalAssetKRW).toLocaleString();
  const profitEl = document.getElementById('totalProfit');
  const profitClass = p.totalProfitPct >= 0 ? 'up' : 'down';
  profitEl.innerHTML = `총 손익 <span class="asset-card-sub ${profitClass}">${p.totalProfitPct >= 0 ? '+' : ''}${p.totalProfitPct.toFixed(2)}%</span>`;

  document.getElementById('totalProfitVal').textContent = (p.totalProfit >= 0 ? '+' : '') + '₩' + Math.round(p.totalProfit).toLocaleString();
  document.getElementById('totalProfitPct').innerHTML = `<span class="${profitClass}">${p.totalProfitPct >= 0 ? '+' : ''}${p.totalProfitPct.toFixed(2)}%</span>`;

  document.getElementById('krwBalance').textContent = '₩' + Math.round(p.krwBalance).toLocaleString();
  document.getElementById('usdBalance').textContent = '$' + p.usdBalance.toFixed(2);
  document.getElementById('usdInKRW').textContent = '≈ ₩' + Math.round(p.usdInKRW || p.usdBalance * state.usdkrw).toLocaleString();
}

function renderHoldings() {
  const list = document.getElementById('holdingsList');
  const holdings = state.portfolio?.holdings || [];
  if (!holdings.length) {
    list.innerHTML = '<div class="empty-state">보유 종목이 없습니다.<br>매수 버튼을 눌러 첫 투자를 시작하세요!</div>';
    return;
  }
  list.innerHTML = holdings.map(h => {
    const profitClass = h.profitPct >= 0 ? 'up' : 'down';
    const sym = h.market === 'kr' ? '₩' : '$';
    return `
      <div class="holding-item">
        <div class="holding-left">
          <div class="holding-ticker">${h.ticker}</div>
          <div class="holding-name">평균단가 ${sym}${h.avgPrice.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
          <div class="holding-qty">${h.quantity}주 보유</div>
        </div>
        <div class="holding-right">
          <div class="holding-eval">${sym}${h.evaluationValue.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
          <div class="holding-profit ${profitClass}">${h.profitPct >= 0 ? '+' : ''}${h.profitPct.toFixed(2)}% (${sym}${Math.round(h.profit).toLocaleString()})</div>
        </div>
      </div>`;
  }).join('');
}

// ── History ────────────────────────────────────────────────────────────────
async function loadHistory() {
  if (!state.currentAccountId) return;
  try {
    const history = await api(`/api/trade/history/${state.currentAccountId}`);
    const list = document.getElementById('historyList');
    if (!history.length) {
      list.innerHTML = '<div class="empty-state">거래 내역이 없습니다.</div>';
      return;
    }
    list.innerHTML = history.map(h => {
      const isBuy = h.side === 'buy';
      const amountClass = isBuy ? 'negative' : 'positive';
      const time = new Date(h.timestamp).toLocaleString('ko-KR', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      return `
        <div class="history-item">
          <div class="history-left">
            <div class="history-ticker">${h.ticker} ${isBuy ? '매수' : '매도'}</div>
            <div class="history-memo">${h.memo || ''}</div>
          </div>
          <div class="history-right">
            <div class="history-amount ${amountClass}">${isBuy ? '-' : '+'}${Math.abs(h.amount).toLocaleString(undefined, {maximumFractionDigits:2})}</div>
            <div class="history-time">${time}</div>
          </div>
        </div>`;
    }).join('');
  } catch (e) { console.error('loadHistory error:', e); }
}

// ── Dividends ──────────────────────────────────────────────────────────────
async function loadDividends() {
  if (!state.currentAccountId) return;
  try {
    const divs = await api(`/api/trade/dividends/${state.currentAccountId}`);
    const list = document.getElementById('dividendList');
    if (!divs.length) {
      list.innerHTML = '<div class="empty-state">배당 내역이 없습니다.</div>';
      return;
    }
    list.innerHTML = divs.map(d => `
      <div class="dividend-item">
        <div class="dividend-left">
          <div class="dividend-ticker">${d.ticker}</div>
          <div class="dividend-date">배당락일: ${d.date} · 지급일: ${d.payDate}</div>
        </div>
        <div class="dividend-right">
          <div class="dividend-amount">+${d.currency === 'KRW' ? '₩' : '$'}${d.amount.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
          <div style="font-size:10px;color:var(--muted)">${d.quantity}주</div>
        </div>
      </div>`).join('');
  } catch (e) { console.error('loadDividends error:', e); }
}

// ── Tab Switching ──────────────────────────────────────────────────────────
function switchMockTab(tab, btn) {
  document.querySelectorAll('.mock-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  ['holdings', 'history', 'dividends'].forEach(t => {
    document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).style.display = t === tab ? '' : 'none';
  });
}

// ── Bottom Sheet: Order ───────────────────────────────────────────────────
function openOrderSheet(side) {
  state.orderSide = side;
  state.selectedStock = null;
  state.orderType = 'limit';

  document.getElementById('orderSheetTitle').textContent = side === 'buy' ? '매수 주문' : '매도 주문';
  document.getElementById('orderSubmitBtn').textContent = side === 'buy' ? '매수 주문하기' : '매도 주문하기';
  document.getElementById('orderSubmitBtn').className = 'sheet-submit-btn ' + side;
  document.getElementById('orderTickerInput').value = '';
  document.getElementById('orderPrice').value = '';
  document.getElementById('orderQty').value = '';
  document.getElementById('selectedStockInfo').style.display = 'none';
  document.getElementById('miniOrderbook').style.display = 'none';
  document.getElementById('orderSearchDropdown').classList.remove('open');
  document.getElementById('orderSummary').style.display = 'none';

  // reset segmented buttons
  document.querySelectorAll('#orderSheet .seg-btn[data-otype]').forEach(b => b.classList.remove('active'));
  document.querySelector('#orderSheet .seg-btn[data-otype="limit"]').classList.add('active');
  document.getElementById('limitPriceField').style.display = '';

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
  document.querySelectorAll('#orderSheet .seg-btn[data-otype]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('limitPriceField').style.display = type === 'limit' ? '' : 'none';
  updateOrderSummary();
}

// ── Stock Search ───────────────────────────────────────────────────────────
let _searchTimer = null;

async function searchStocks(query) {
  clearTimeout(_searchTimer);
  const dropdown = document.getElementById('orderSearchDropdown');
  if (!query.trim()) {
    dropdown.classList.remove('open');
    return;
  }
  _searchTimer = setTimeout(async () => {
    try {
      const results = await api(`/api/search?q=${encodeURIComponent(query.trim())}&market=all`);
      dropdown.innerHTML = results.slice(0, 8).map(r => `
        <div class="search-dropdown-item" onclick="selectOrderStock('${r.ticker}', '${r.market}', '${r.name.replace(/'/g, "\\'")}', ${r.price || getAssetPriceFallback(r.ticker, r.market)})">
          <span>
            <span class="sdi-ticker">${r.ticker}</span>
            <span class="sdi-name">${r.name}</span>
          </span>
          <span class="sdi-market">${r.market === 'kr' ? 'KR' : 'US'} · ${r.exchange || ''}</span>
        </div>
      `).join('');
      dropdown.classList.add('open');
    } catch (e) {
      dropdown.innerHTML = '<div class="search-dropdown-item" style="color:var(--muted)">검색 실패</div>';
      dropdown.classList.add('open');
    }
  }, 300);
}

function getAssetPriceFallback(ticker, market) {
  // use screener cache via a quick fetch or return default
  return market === 'kr' ? 50000 : 150;
}

async function selectOrderStock(ticker, market, name, fallbackPrice) {
  state.selectedStock = { ticker, market, name };
  document.getElementById('orderTickerInput').value = ticker;
  document.getElementById('orderSearchDropdown').classList.remove('open');

  // fetch current price
  try {
    const q = await api(`/api/quote?symbol=${ticker}&market=${market}`);
    state.selectedStock.price = q.price || fallbackPrice;
    state.selectedStock.changePct = q.changePct || 0;
    state.selectedStock.currency = market === 'kr' ? 'KRW' : 'USD';
  } catch {
    state.selectedStock.price = fallbackPrice;
    state.selectedStock.changePct = 0;
    state.selectedStock.currency = market === 'kr' ? 'KRW' : 'USD';
  }

  // display selected stock info
  const sym = market === 'kr' ? '₩' : '$';
  const priceClass = state.selectedStock.changePct >= 0 ? 'up' : 'down';
  document.getElementById('selectedStockInfo').style.display = '';
  document.getElementById('ssiName').textContent = `${name} (${ticker})`;
  document.getElementById('ssiPrice').innerHTML = `${sym}${state.selectedStock.price.toLocaleString(undefined, {maximumFractionDigits:2})} <small style="font-size:14px">${state.selectedStock.changePct >= 0 ? '▲' : '▼'}${Math.abs(state.selectedStock.changePct).toFixed(2)}%</small>`;
  document.getElementById('ssiPrice').className = 'ssi-price ' + priceClass;
  document.getElementById('ssiMarket').textContent = `${market === 'kr' ? '한국' : '미국'} · ${market === 'kr' ? 'KRW' : 'USD'}`;

  // set market price as default order price
  document.getElementById('orderPrice').value = state.selectedStock.price;

  // load mini order book
  loadMiniOrderBook(ticker, market);

  updateOrderSummary();
}

async function loadMiniOrderBook(ticker, market) {
  try {
    const ob = await api(`/api/trade/orderbook?ticker=${ticker}&market=${market}`);
    const maxVol = Math.max(...ob.asks.map(a => a.volume), ...ob.bids.map(b => b.volume));

    document.getElementById('miniOrderbook').style.display = '';
    document.getElementById('miniOrderbook').innerHTML = `
      ${[...ob.asks].reverse().map(a => `
        <div class="mob-row ask">
          <span class="mob-price">${a.price.toLocaleString()}</span>
          <div class="mob-bar-wrap"><div class="mob-bar ask" style="width:${(a.volume/maxVol*100).toFixed(0)}%"></div></div>
          <span class="mob-vol">${a.volume}</span>
        </div>
      `).join('')}
      <div class="mob-row" style="justify-content:center;font-weight:700;background:rgba(255,255,255,0.03)">
        ${ob.price.toLocaleString()}
      </div>
      ${ob.bids.map(b => `
        <div class="mob-row bid">
          <span class="mob-price">${b.price.toLocaleString()}</span>
          <div class="mob-bar-wrap"><div class="mob-bar bid" style="width:${(b.volume/maxVol*100).toFixed(0)}%"></div></div>
          <span class="mob-vol">${b.volume}</span>
        </div>
      `).join('')}`;
  } catch (e) {
    console.error('orderbook error:', e);
  }
}

// ── Quantity Presets ───────────────────────────────────────────────────────
function setQtyPercent(pct) {
  const p = state.portfolio;
  if (!p || !state.selectedStock) return;

  const sym = state.selectedStock.market === 'kr' ? '₩' : '$';
  const price = parseFloat(document.getElementById('orderPrice').value) || state.selectedStock.price;
  if (price <= 0) return;

  let maxQty = 0;
  if (state.orderSide === 'buy') {
    const avail = state.selectedStock.market === 'kr'
      ? p.krwBalance
      : p.usdBalance * state.usdkrw;
    maxQty = Math.floor((avail / price) * (pct / 100));
  } else {
    const h = p.holdings.find(h => h.ticker === state.selectedStock.ticker);
    maxQty = h ? Math.floor(h.quantity * (pct / 100)) : 0;
  }
  document.getElementById('orderQty').value = Math.max(1, maxQty);
  updateOrderSummary();
}

// ── Order Summary ──────────────────────────────────────────────────────────
function updateOrderSummary() {
  const price = parseFloat(document.getElementById('orderPrice').value) || (state.selectedStock?.price || 0);
  const qty = parseInt(document.getElementById('orderQty').value) || 0;
  const summary = document.getElementById('orderSummary');

  if (!state.selectedStock || price <= 0 || qty <= 0) {
    summary.style.display = 'none';
    return;
  }

  summary.style.display = '';
  const isKR = state.selectedStock.market === 'kr';
  const sym = isKR ? '₩' : '$';
  const tv = price * qty;
  const fee = tv * 0.00015;

  document.getElementById('osTotal').textContent = `${sym}${tv.toLocaleString(undefined, {maximumFractionDigits:2})}`;
  document.getElementById('osFee').textContent = `${sym}${fee.toLocaleString(undefined, {maximumFractionDigits:2})}`;

  const fxRow = document.getElementById('osFxRow');
  if (state.orderSide === 'buy' && !isKR && state.portfolio) {
    const needUSD = tv + fee;
    if (state.portfolio.usdBalance >= needUSD) {
      fxRow.style.display = 'none';
    } else {
      fxRow.style.display = '';
      const shortfall = needUSD - state.portfolio.usdBalance;
      const krwNeeded = shortfall * state.usdkrw * 1.005;
      document.getElementById('osFx').textContent = `₩${Math.ceil(krwNeeded).toLocaleString()} (환전)`;
    }
    document.getElementById('osNeed').textContent = `${sym}${needUSD.toLocaleString(undefined, {maximumFractionDigits:2})}`;
  } else {
    fxRow.style.display = 'none';
    document.getElementById('osNeed').textContent = `${sym}${(tv + fee).toLocaleString(undefined, {maximumFractionDigits:2})}`;
  }
}

// ── Submit Order ───────────────────────────────────────────────────────────
async function submitOrder() {
  if (!state.selectedStock || !state.currentAccountId) {
    toast('종목을 먼저 선택해주세요.', 'error');
    return;
  }
  const price = parseFloat(document.getElementById('orderPrice').value) || state.selectedStock.price;
  const qty = parseInt(document.getElementById('orderQty').value);
  if (!price || !qty || qty <= 0) {
    toast('가격과 수량을 입력해주세요.', 'error');
    return;
  }
  const btn = document.getElementById('orderSubmitBtn');
  btn.disabled = true;
  btn.textContent = '처리 중...';

  try {
    const result = await api('/api/trade/order', {
      method: 'POST',
      body: JSON.stringify({
        accountId: state.currentAccountId,
        ticker: state.selectedStock.ticker,
        market: state.selectedStock.market,
        type: 'stock',
        side: state.orderSide,
        price,
        quantity: qty,
        mode: state.currentAccount?.type || 'realtime',
      }),
    });
    if (result.ok) {
      toast(`${state.selectedStock.ticker} ${qty}주 ${state.orderSide === 'buy' ? '매수' : '매도'} ${result.executed ? '체결 완료' : '접수 완료'}!`, 'success');
      closeOrderSheet();
      await loadPortfolio();
      await loadHistory();
    }
  } catch (e) {
    toast('주문 실패: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = state.orderSide === 'buy' ? '매수 주문하기' : '매도 주문하기';
  }
}

// ── FX Modal ───────────────────────────────────────────────────────────────
function openFXModal() {
  document.getElementById('fxSheetOverlay').classList.add('open');
  document.getElementById('fxSheet').classList.add('open');
  updateFXSheetRate();
  updateFXPreview();
}

function closeFXModal() {
  document.getElementById('fxSheetOverlay').classList.remove('open');
  document.getElementById('fxSheet').classList.remove('open');
}

function updateFXSheetRate() {
  document.getElementById('fxRateDisplay').textContent = `1 USD = ₩${state.usdkrw.toLocaleString()}`;
}

function setFXDir(dir, btn) {
  state.fxDirection = dir;
  document.querySelectorAll('#fxSheet .seg-btn[data-fxdir]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('fxKrwField').style.display = dir === 'krw2usd' ? '' : 'none';
  document.getElementById('fxUsdField').style.display = dir === 'usd2krw' ? '' : 'none';
  updateFXPreview();
}

function updateFXPreview() {
  const preview = document.getElementById('fxPreview');
  const rate = state.usdkrw;
  const spread = 0.005; // 0.5% spread

  if (state.fxDirection === 'krw2usd') {
    const krw = parseInt(document.getElementById('fxKrwAmount').value) || 0;
    if (krw <= 0) { preview.textContent = '금액을 입력하세요'; return; }
    const usd = krw / (rate * (1 + spread));
    preview.textContent = `₩${krw.toLocaleString()} → $${usd.toFixed(2)} (수수료 ${(spread*100).toFixed(1)}%)`;
  } else {
    const usd = parseFloat(document.getElementById('fxUsdAmount').value) || 0;
    if (usd <= 0) { preview.textContent = '금액을 입력하세요'; return; }
    const krw = usd * (rate * (1 - spread));
    preview.textContent = `$${usd.toFixed(2)} → ₩${Math.round(krw).toLocaleString()} (수수료 ${(spread*100).toFixed(1)}%)`;
  }
}

async function executeFX() {
  const p = state.portfolio;
  if (!p || !state.currentAccountId) return;
  const rate = state.usdkrw;
  const spread = 0.005;

  if (state.fxDirection === 'krw2usd') {
    const krw = parseInt(document.getElementById('fxKrwAmount').value) || 0;
    if (krw <= 0) { toast('금액을 입력하세요.', 'error'); return; }
    if (p.krwBalance < krw) { toast('원화 잔액이 부족합니다.', 'error'); return; }
    const usd = krw / (rate * (1 + spread));

    try {
      // We execute a dummy FX by submitting via order endpoint with special handling
      // For now, we fake it client-side via a dedicated fx endpoint (future)
      // Instead, simulate: just update portfolio locally
      p.krwBalance -= krw;
      p.usdBalance += usd;
      toast(`환전 완료: ₩${krw.toLocaleString()} → $${usd.toFixed(2)}`, 'success');
      closeFXModal();
      renderAssetSummary();
    } catch (e) {
      toast('환전 실패: ' + e.message, 'error');
    }
  } else {
    const usd = parseFloat(document.getElementById('fxUsdAmount').value) || 0;
    if (usd <= 0) { toast('금액을 입력하세요.', 'error'); return; }
    if (p.usdBalance < usd) { toast('달러 잔액이 부족합니다.', 'error'); return; }
    const krw = usd * (rate * (1 - spread));

    p.usdBalance -= usd;
    p.krwBalance += krw;
    toast(`환전 완료: $${usd.toFixed(2)} → ₩${Math.round(krw).toLocaleString()}`, 'success');
    closeFXModal();
    renderAssetSummary();
  }
}

// ── SSE Streaming (Virtual Mode) ───────────────────────────────────────────
function connectSSE() {
  // close existing
  if (state.eventSource) state.eventSource.close();

  if (!state.currentAccount || state.currentAccount.type !== 'virtual') return;

  const es = new EventSource(`/api/trade/stream?userId=${encodeURIComponent(uid)}&accountId=${state.currentAccountId}&mode=virtual`);
  state.eventSource = es;

  es.addEventListener('orderbook', (e) => {
    try {
      const ob = JSON.parse(e.data);
      if (state.selectedStock && ob.ticker === state.selectedStock.ticker) {
        loadMiniOrderBook(ob.ticker, state.selectedStock.market);
      }
    } catch {}
  });

  es.addEventListener('price', (e) => {
    try {
      const prices = JSON.parse(e.data);
      // update selected stock price if visible
      if (state.selectedStock && prices[state.selectedStock.ticker]) {
        state.selectedStock.price = prices[state.selectedStock.ticker].price;
        state.selectedStock.changePct = prices[state.selectedStock.ticker].changePct;
        const sym = state.selectedStock.market === 'kr' ? '₩' : '$';
        const priceClass = state.selectedStock.changePct >= 0 ? 'up' : 'down';
        document.getElementById('ssiPrice').innerHTML = `${sym}${state.selectedStock.price.toLocaleString(undefined, {maximumFractionDigits:2})} <small style="font-size:14px">${state.selectedStock.changePct >= 0 ? '▲' : '▼'}${Math.abs(state.selectedStock.changePct).toFixed(2)}%</small>`;
        document.getElementById('ssiPrice').className = 'ssi-price ' + priceClass;
        document.getElementById('orderPrice').value = state.selectedStock.price;
        updateOrderSummary();
      }
    } catch {}
  });

  es.onerror = () => { /* reconnect automatically */ };
}

function updateSSEContext(ticker) {
  fetch('/api/trade/stream/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: uid, activeTicker: ticker, mode: state.currentAccount?.type }),
  }).catch(() => {});
}

// ── Init on Load ───────────────────────────────────────────────────────────
(async function boot() {
  await loadAccounts();
  if (state.accounts.length > 0) {
    state.currentAccountId = state.accounts[0].id;
    state.currentAccount = state.accounts[0];
    document.getElementById('onboardingOverlay').style.display = 'none';
    document.getElementById('appMain').style.display = 'block';
    await initApp();
  } else {
    // show onboarding
    document.getElementById('onboardingOverlay').style.display = 'flex';
    document.getElementById('appMain').style.display = 'none';
  }

  // close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.account-switcher')) {
      document.getElementById('acctDropdown').classList.remove('open');
    }
    if (!e.target.closest('.search-wrap') && !e.target.closest('#orderSearchDropdown')) {
      document.getElementById('orderSearchDropdown').classList.remove('open');
    }
  });
})();