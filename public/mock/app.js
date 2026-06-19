// Toss Securities Mock Investment Logic

const STOCK_DEFS = [
  // ── 한국 KOSPI 대형주 ──────────────────────────────────────────────────────
  { id:'samsung',      market:'kr', exchange:'KOSPI',  ticker:'005930', displayTicker:'005930', name:'삼성전자' },
  { id:'sk-hynix',     market:'kr', exchange:'KOSPI',  ticker:'000660', displayTicker:'000660', name:'SK하이닉스' },
  { id:'lg-energy',    market:'kr', exchange:'KOSPI',  ticker:'373220', displayTicker:'373220', name:'LG에너지솔루션' },
  { id:'samsung-bio',  market:'kr', exchange:'KOSPI',  ticker:'207940', displayTicker:'207940', name:'삼성바이오로직스' },
  { id:'hyundai',      market:'kr', exchange:'KOSPI',  ticker:'005380', displayTicker:'005380', name:'현대차' },
  { id:'kia',          market:'kr', exchange:'KOSPI',  ticker:'000270', displayTicker:'000270', name:'기아' },
  { id:'posco',        market:'kr', exchange:'KOSPI',  ticker:'005490', displayTicker:'005490', name:'POSCO홀딩스' },
  { id:'naver',        market:'kr', exchange:'KOSPI',  ticker:'035420', displayTicker:'035420', name:'NAVER' },
  { id:'kakao',        market:'kr', exchange:'KOSPI',  ticker:'035720', displayTicker:'035720', name:'카카오' },
  { id:'celltrion',    market:'kr', exchange:'KOSPI',  ticker:'068270', displayTicker:'068270', name:'셀트리온' },
  { id:'kb-finance',   market:'kr', exchange:'KOSPI',  ticker:'105560', displayTicker:'105560', name:'KB금융' },
  { id:'shinhan',      market:'kr', exchange:'KOSPI',  ticker:'055550', displayTicker:'055550', name:'신한지주' },
  { id:'hana',         market:'kr', exchange:'KOSPI',  ticker:'086790', displayTicker:'086790', name:'하나금융지주' },
  { id:'lg-elec',      market:'kr', exchange:'KOSPI',  ticker:'066570', displayTicker:'066570', name:'LG전자' },
  { id:'samsung-sdcl', market:'kr', exchange:'KOSPI',  ticker:'006400', displayTicker:'006400', name:'삼성SDI' },
  { id:'hanwha-aero',  market:'kr', exchange:'KOSPI',  ticker:'012450', displayTicker:'012450', name:'한화에어로스페이스' },
  { id:'samsung-sds',  market:'kr', exchange:'KOSPI',  ticker:'018260', displayTicker:'018260', name:'삼성에스디에스' },
  { id:'krafton',      market:'kr', exchange:'KOSPI',  ticker:'259960', displayTicker:'259960', name:'크래프톤' },
  { id:'kakaobank',    market:'kr', exchange:'KOSPI',  ticker:'323410', displayTicker:'323410', name:'카카오뱅크' },
  { id:'ktng',         market:'kr', exchange:'KOSPI',  ticker:'033780', displayTicker:'033780', name:'KT&G' },
  { id:'kepco',        market:'kr', exchange:'KOSPI',  ticker:'015760', displayTicker:'015760', name:'한국전력' },
  { id:'sk-inn',       market:'kr', exchange:'KOSPI',  ticker:'096770', displayTicker:'096770', name:'SK이노베이션' },
  { id:'ecopro-bm',    market:'kr', exchange:'KOSDAQ', ticker:'247540', displayTicker:'247540', name:'에코프로비엠' },
  { id:'posco-future', market:'kr', exchange:'KOSPI',  ticker:'003670', displayTicker:'003670', name:'포스코퓨처엠' },
  { id:'doosan-enbl',  market:'kr', exchange:'KOSPI',  ticker:'034020', displayTicker:'034020', name:'두산에너빌리티' },
  // ── 미국 빅테크 ────────────────────────────────────────────────────────────
  { id:'nvidia',       market:'us', exchange:'NASDAQ', ticker:'NVDA',  displayTicker:'NVDA',  name:'NVIDIA' },
  { id:'apple',        market:'us', exchange:'NASDAQ', ticker:'AAPL',  displayTicker:'AAPL',  name:'Apple' },
  { id:'microsoft',    market:'us', exchange:'NASDAQ', ticker:'MSFT',  displayTicker:'MSFT',  name:'Microsoft' },
  { id:'alphabet',     market:'us', exchange:'NASDAQ', ticker:'GOOGL', displayTicker:'GOOGL', name:'Alphabet' },
  { id:'amazon',       market:'us', exchange:'NASDAQ', ticker:'AMZN',  displayTicker:'AMZN',  name:'Amazon' },
  { id:'meta',         market:'us', exchange:'NASDAQ', ticker:'META',  displayTicker:'META',  name:'Meta' },
  { id:'tesla',        market:'us', exchange:'NASDAQ', ticker:'TSLA',  displayTicker:'TSLA',  name:'Tesla' },
  { id:'netflix',      market:'us', exchange:'NASDAQ', ticker:'NFLX',  displayTicker:'NFLX',  name:'Netflix' },
  // ── 미국 반도체 ────────────────────────────────────────────────────────────
  { id:'amd',          market:'us', exchange:'NASDAQ', ticker:'AMD',   displayTicker:'AMD',   name:'AMD' },
  { id:'broadcom',     market:'us', exchange:'NASDAQ', ticker:'AVGO',  displayTicker:'AVGO',  name:'Broadcom' },
  { id:'qualcomm',     market:'us', exchange:'NASDAQ', ticker:'QCOM',  displayTicker:'QCOM',  name:'Qualcomm' },
  { id:'tsm',          market:'us', exchange:'NYSE',   ticker:'TSM',   displayTicker:'TSM',   name:'TSMC' },
  { id:'intel',        market:'us', exchange:'NASDAQ', ticker:'INTC',  displayTicker:'INTC',  name:'Intel' },
  // ── 미국 금융 ──────────────────────────────────────────────────────────────
  { id:'jpmorgan',     market:'us', exchange:'NYSE',   ticker:'JPM',   displayTicker:'JPM',   name:'JPMorgan' },
  { id:'berkshire',    market:'us', exchange:'NYSE',   ticker:'BRK-B', displayTicker:'BRK-B', name:'Berkshire' },
  { id:'visa',         market:'us', exchange:'NYSE',   ticker:'V',     displayTicker:'V',     name:'Visa' },
  { id:'mastercard',   market:'us', exchange:'NYSE',   ticker:'MA',    displayTicker:'MA',    name:'Mastercard' },
  // ── 미국 헬스케어/기타 ─────────────────────────────────────────────────────
  { id:'eli-lilly',    market:'us', exchange:'NYSE',   ticker:'LLY',   displayTicker:'LLY',   name:'Eli Lilly' },
  { id:'unitedhealth', market:'us', exchange:'NYSE',   ticker:'UNH',   displayTicker:'UNH',   name:'UnitedHealth' },
  { id:'palantir',     market:'us', exchange:'NYSE',   ticker:'PLTR',  displayTicker:'PLTR',  name:'Palantir' },
  { id:'salesforce',   market:'us', exchange:'NYSE',   ticker:'CRM',   displayTicker:'CRM',   name:'Salesforce' },
  { id:'oracle',       market:'us', exchange:'NYSE',   ticker:'ORCL',  displayTicker:'ORCL',  name:'Oracle' },
  { id:'exxon',        market:'us', exchange:'NYSE',   ticker:'XOM',   displayTicker:'XOM',   name:'Exxon Mobil' },
  { id:'walmart',      market:'us', exchange:'NYSE',   ticker:'WMT',   displayTicker:'WMT',   name:'Walmart' },
];

// 글로벌 상태 변수
let currentUser = null;
let activeTab = 'assets';
let activeShoppingMarket = 'kr';
let liveQuotes = {}; // id -> { price, changePct }
let usdKrwRate = 1350; // 기본 환율 fallback

// 상세 화면 및 차트/호가 시뮬레이션 상태
let activeDetailDef = null;
let currentDetailChart = null;
let currentDetailSeries = null;
let detailChartRange = '1d';
let orderBookInterval = null;
const LEGEND_COLORS = ['#3182F6', '#FF4D5D', '#00D27A', '#FF9500', '#8E94A0', '#9B51E0', '#2D9CDB', '#27AE60'];

// 주문(Drawer) 전용 상태
let activeDef = null;
let activeOrderMode = 'buy'; // 'buy' | 'sell'

// 유저별 스코핑 키 도우미
function getStorageKey(baseKey) {
  if (currentUser && currentUser.id) {
    return `${baseKey}_user_${currentUser.id}`;
  }
  return `${baseKey}_guest`;
}

function getStorageItem(key, defaultVal) {
  const data = localStorage.getItem(getStorageKey(key));
  if (data !== null) {
    try { return JSON.parse(data); } catch (e) { return defaultVal; }
  }
  return defaultVal;
}

function setStorageItem(key, val) {
  localStorage.setItem(getStorageKey(key), JSON.stringify(val));
}

// 초기화 확인 및 로딩
document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  setupEventListeners();
  startLivePriceUpdates();
  
  if (getStorageItem('mock_capital', 0) === 0) {
    openCapitalModal(false);
  } else {
    updateUI();
  }
});

// 세션 조회
async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.loggedIn) {
        currentUser = data.user;
        document.getElementById('profileName').textContent = currentUser.username;
        document.getElementById('avatarLetter').textContent = currentUser.username.substring(0, 1).toUpperCase();
      }
    }
  } catch (e) {
    console.warn("Session check failed, running as guest:", e);
  }
}

// 이벤트 리스너 세팅
function setupEventListeners() {
  // ESC로 모달, 드로어, 상세 화면 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCapitalModal();
      closeOrderDrawer();
      closeStockDetail();
    }
  });

  // 검색 인풋 핸들러
  const searchInput = document.getElementById('tossSearch');
  searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value.trim());
  });

  // 인풋 포커스 아웃 시 서서히 닫히게 (결과 클릭 가능하도록 딜레이 제공)
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      document.getElementById('searchResults').classList.remove('show');
    }, 200);
  });
}

// 예수금 팝업 열기
function openCapitalModal(allowClose = true) {
  const modal = document.getElementById('capitalModal');
  modal.classList.add('open');
  
  // 강제 설정 모드 (최초 접속)인 경우 모달 외부 클릭이나 닫기 비활성
  if (!allowClose) {
    modal.onclick = null;
  } else {
    modal.onclick = (e) => {
      if (e.target === modal) closeCapitalModal();
    };
  }
}

function closeCapitalModal() {
  document.getElementById('capitalModal').classList.remove('open');
}

// 투자금 선택 UI 선택 효과
let selectedCapitalAmount = 100000000; // 1억 기본값
function initAccount(amount) {
  selectedCapitalAmount = amount;
  
  // 버튼 클래스 토글
  const btns = document.querySelectorAll('.capital-opt-btn');
  btns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.includes(amount >= 100000000 ? (amount === 1000000000 ? '10억' : '1억') : (amount === 10000000 ? '1,000만' : '100만'))) {
      btn.classList.add('active');
    }
  });
}

// 계좌 생성 확정
function confirmCapitalSelection() {
  setStorageItem('mock_capital', selectedCapitalAmount);
  setStorageItem('mock_cash', selectedCapitalAmount);
  setStorageItem('mock_portfolio', []);
  setStorageItem('mock_history', []);
  
  closeCapitalModal();
  updateUI();
  showToast(`₩${selectedCapitalAmount.toLocaleString()} 모의 투자 계좌가 개설되었습니다.`);
}

// 탭 전환
function switchTab(tabId) {
  activeTab = tabId;
  
  // 탭 버튼 효과
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabId));
  });

  // 탭 컨텐츠 노출
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(c => {
    c.classList.toggle('active', c.id === `tab-${tabId}`);
  });

  updateUI();
}

// 주식 쇼핑 마켓 전환
function filterMarket(mkt) {
  activeShoppingMarket = mkt;
  document.getElementById('mkt-kr').classList.toggle('active', mkt === 'kr');
  document.getElementById('mkt-us').classList.toggle('active', mkt === 'us');
  renderShoppingStocks();
}

// 실시간 시세 연동 루프
function startLivePriceUpdates() {
  const updatePrices = async () => {
    try {
      // 1. 환율 정보 로드
      const ratesRes = await fetch('/api/rates');
      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        if (ratesData.usdkrw) {
          usdKrwRate = ratesData.usdkrw.value;
        }
      }

      // 2. 한국/미국 주식 구분해서 배치 조회
      const krSymbols = STOCK_DEFS.filter(s => s.market === 'kr').map(s => s.ticker).join(',');
      const usSymbols = STOCK_DEFS.filter(s => s.market === 'us').map(s => s.ticker).join(',');
      
      const [krRes, usRes] = await Promise.all([
        fetch(`/api/sidebar-batch?symbols=${krSymbols}&market=kr`),
        fetch(`/api/sidebar-batch?symbols=${usSymbols}&market=us`)
      ]);

      if (krRes.ok) {
        const krData = await krRes.json();
        Object.keys(krData).forEach(ticker => {
          const item = STOCK_DEFS.find(s => s.ticker === ticker && s.market === 'kr');
          if (item) {
            liveQuotes[item.id] = {
              price: krData[ticker].price,
              changePct: krData[ticker].changePct || 0
            };
          }
        });
      }

      if (usRes.ok) {
        const usData = await usRes.json();
        Object.keys(usData).forEach(ticker => {
          const item = STOCK_DEFS.find(s => s.ticker === ticker && s.market === 'us');
          if (item) {
            liveQuotes[item.id] = {
              price: usData[ticker].price,
              changePct: usData[ticker].changePct || 0
            };
          }
        });
      }

      // 3. UI 갱신
      updateUI();
      if (activeDetailDef) {
        updateStockDetailPrices();
      }

    } catch (e) {
      console.warn("Error fetching live quotes, using simulated/cached prices:", e);
      // 만약 백엔드 요청이 타임아웃 등으로 실패할 경우 가짜 가격 채우기 (데모 작동 보장)
      STOCK_DEFS.forEach(s => {
        if (!liveQuotes[s.id]) {
          liveQuotes[s.id] = {
            price: s.market === 'kr' ? 70000 + (Math.floor(Math.random() * 2000) - 1000) : 150 + (Math.random() * 6 - 3),
            changePct: (Math.random() * 4 - 2)
          };
        }
      });
      updateUI();
      if (activeDetailDef) {
        updateStockDetailPrices();
      }
    }
  };

  updatePrices();
  setInterval(updatePrices, 15000); // 15초 주기 갱신
}

// UI 갱신 총괄
function updateUI() {
  renderAssets();
  renderShoppingStocks();
  renderHistory();
  
  // 헤더 프로필 영역 실시간 동기화
  const cash = getStorageItem('mock_cash', 0);
  document.getElementById('profileCash').textContent = `₩${Math.round(cash).toLocaleString()}`;
}

// 1. 내 자산 렌더링
function renderAssets() {
  const capital = getStorageItem('mock_capital', 0);
  const cash = getStorageItem('mock_cash', 0);
  const portfolio = getStorageItem('mock_portfolio', []);
  
  let totalStockEval = 0; // 주식 평가금 합산 (원화)

  const holdingsListEl = document.getElementById('holdingsList');
  const chartCard = document.getElementById('portfolioChartCard');
  
  if (portfolio.length === 0) {
    if (chartCard) chartCard.style.display = 'none';
    holdingsListEl.innerHTML = `
      <div class="empty-state">
        <span class="icon">📈</span>
        <p>보유 주식이 없습니다. 주식 쇼핑 탭에서 첫 주식을 사보세요!</p>
        <button class="btn btn-primary" onclick="switchTab('shopping')" style="margin-top: 12px; padding: 10px 20px;">주식 사러 가기</button>
      </div>
    `;
    
    document.getElementById('totalAssetVal').textContent = `₩${Math.round(cash).toLocaleString()}`;
    document.getElementById('assetCash').textContent = `₩${Math.round(cash).toLocaleString()}`;
    document.getElementById('assetStocks').textContent = `₩0`;
    
    const retEl = document.getElementById('totalAssetReturn');
    retEl.className = 'summary-return flat';
    retEl.innerHTML = `<span class="pct">0.00%</span><span class="amt">(₩0)</span>`;
    return;
  }

  // 보유 주식 카드 렌더링
  const rows = portfolio.map(holding => {
    const quote = liveQuotes[holding.id] || { price: holding.avgPrice, changePct: 0 };
    const curPrice = quote.price;
    
    // 원화 환산
    const isUs = holding.market === 'us';
    const evalPriceKrw = isUs ? curPrice * usdKrwRate : curPrice;
    const avgPriceKrw = isUs ? holding.avgPrice * usdKrwRate : holding.avgPrice;
    
    const evalValKrw = evalPriceKrw * holding.qty;
    totalStockEval += evalValKrw;
    
    const profitKrw = (evalPriceKrw - avgPriceKrw) * holding.qty;
    const returnPct = avgPriceKrw > 0 ? ((evalPriceKrw - avgPriceKrw) / avgPriceKrw) * 100 : 0;
    
    const colorClass = returnPct > 0 ? 'up' : (returnPct < 0 ? 'down' : 'flat');
    const sign = returnPct > 0 ? '+' : '';

    const priceSymbol = isUs ? '$' : '₩';
    
    return `
      <div class="holding-item" onclick="openStockDetail('${holding.id}')">
        <div class="holding-left">
          <div class="holding-name">
            ${holding.name}
            <span style="font-size:10px; color:var(--text-muted); font-weight:400;">${holding.ticker}</span>
          </div>
          <div class="holding-qty">${holding.qty}주 · 평단 ${priceSymbol}${holding.avgPrice.toLocaleString(undefined, {maximumFractionDigits: isUs ? 2 : 0})}</div>
        </div>
        <div class="holding-right">
          <div class="holding-eval">₩${Math.round(evalValKrw).toLocaleString()}</div>
          <div class="holding-return ${colorClass}">
            ${sign}${returnPct.toFixed(2)}% (${sign}₩${Math.round(profitKrw).toLocaleString()})
          </div>
        </div>
      </div>
    `;
  }).join('');

  holdingsListEl.innerHTML = rows;

  // 총 평가 금액 및 수익 계산
  const totalAssets = cash + totalStockEval;
  const netProfit = totalAssets - capital;
  const netReturnPct = capital > 0 ? (netProfit / capital) * 100 : 0;

  document.getElementById('totalAssetVal').textContent = `₩${Math.round(totalAssets).toLocaleString()}`;
  document.getElementById('assetCash').textContent = `₩${Math.round(cash).toLocaleString()}`;
  document.getElementById('assetStocks').textContent = `₩${Math.round(totalStockEval).toLocaleString()}`;

  const retEl = document.getElementById('totalAssetReturn');
  const returnColorClass = netReturnPct > 0 ? 'up' : (netReturnPct < 0 ? 'down' : 'flat');
  const returnSign = netReturnPct > 0 ? '+' : '';
  
  retEl.className = `summary-return ${returnColorClass}`;
  retEl.innerHTML = `
    <span class="pct">${returnSign}${netReturnPct.toFixed(2)}%</span>
    <span class="amt">(${returnSign}₩${Math.round(netProfit).toLocaleString()})</span>
  `;

  // 포트폴리오 도넛 차트 드로잉
  if (chartCard) {
    chartCard.style.display = 'block';
    renderPortfolioPie(cash, totalStockEval, portfolio);
  }
}

// 2. 주식 쇼핑 목록 렌더링
function renderShoppingStocks() {
  if (activeTab !== 'shopping') return;

  const listEl = document.getElementById('shoppingStockList');
  const targets = STOCK_DEFS.filter(s => s.market === activeShoppingMarket);
  
  if (Object.keys(liveQuotes).length === 0) {
    listEl.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>실시간 시세를 불러오는 중입니다...</span>
      </div>
    `;
    return;
  }

  const rows = targets.map((stock, index) => {
    const quote = liveQuotes[stock.id] || { price: 0, changePct: 0 };
    const priceSymbol = stock.market === 'us' ? '$' : '₩';
    
    // 원화 환산 힌트 표시 (미국 주식용)
    const krwHint = stock.market === 'us' && quote.price > 0
      ? `<span style="font-size:10px; color:var(--text-muted); font-weight:400; display:block;">(₩${Math.round(quote.price * usdKrwRate).toLocaleString()})</span>`
      : '';
      
    const change = quote.changePct;
    const colorClass = change > 0 ? 'up' : (change < 0 ? 'down' : 'flat');
    const sign = change > 0 ? '+' : '';

    return `
      <div class="stock-row-item" onclick="openStockDetail('${stock.id}')">
        <div class="info-col">
          <span class="rank-num">${index + 1}</span>
          <div class="name-meta">
            <span class="name">${stock.name}</span>
            <span class="ticker">${stock.displayTicker}</span>
          </div>
        </div>
        <div class="price-col txt-right">
          ${priceSymbol}${quote.price.toLocaleString(undefined, {maximumFractionDigits: stock.market === 'us' ? 2 : 0})}
          ${krwHint}
        </div>
        <div class="change-col txt-right ${colorClass}">
          ${sign}${change.toFixed(2)}%
        </div>
        <div class="action-col">
          <button class="trade-mini-btn">거래</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.innerHTML = rows;
}

// 3. 거래 내역 렌더링
function renderHistory() {
  if (activeTab !== 'history') return;

  const history = getStorageItem('mock_history', []);
  const listEl = document.getElementById('historyList');

  if (history.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="icon">📝</span>
        <p>아직 거래 내역이 없습니다.</p>
      </div>
    `;
    return;
  }

  // 최신 거래 내역 우선 정렬
  const rows = [...history].reverse().map(item => {
    const isUs = item.market === 'us';
    const priceSymbol = isUs ? '$' : '₩';
    
    const badgeClass = item.type === 'buy' ? 'buy' : 'sell';
    const badgeText = item.type === 'buy' ? '사기' : '팔기';
    
    // 원화 환산 힌트 표시 (미국 주식용)
    const totalKrwStr = isUs 
      ? `<span style="font-size:10px; color:var(--text-muted); font-weight:400; display:block;">(₩${Math.round(item.totalKrw).toLocaleString()})</span>`
      : '';

    return `
      <div class="history-item">
        <div class="history-item-left">
          <div class="history-item-title">
            <span class="history-item-badge ${badgeClass}">${badgeText}</span>
            <strong>${item.name}</strong>
            <span style="font-size:10px; color:var(--text-muted);">${item.ticker}</span>
          </div>
          <div class="history-item-date">${item.date}</div>
        </div>
        <div class="history-item-right">
          <div class="history-item-total">
            ${isUs ? '' : '₩'}${Math.round(item.total).toLocaleString()}${isUs ? ' USD' : ''}
            ${totalKrwStr}
          </div>
          <div class="history-item-qtyprice">
            ${item.qty}주 · ${priceSymbol}${item.price.toLocaleString(undefined, {maximumFractionDigits: isUs ? 2 : 0})}
          </div>
        </div>
      </div>
    `;
  }).join('');

  listEl.innerHTML = rows;
}

// 검색 핸들링
function handleSearch(query) {
  const dropdown = document.getElementById('searchResults');
  
  if (!query) {
    dropdown.classList.remove('show');
    return;
  }

  const matched = STOCK_DEFS.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.ticker.toLowerCase().includes(query.toLowerCase())
  );

  if (matched.length === 0) {
    dropdown.innerHTML = `<div class="search-no-results">"${query}"에 대한 검색 결과가 없습니다.</div>`;
    dropdown.classList.add('show');
    return;
  }

  const items = matched.map(stock => {
    const quote = liveQuotes[stock.id] || { price: 0, changePct: 0 };
    const priceSymbol = stock.market === 'us' ? '$' : '₩';
    
    const change = quote.changePct;
    const colorClass = change > 0 ? 'up' : (change < 0 ? 'down' : 'flat');
    const sign = change > 0 ? '+' : '';

    return `
      <div class="search-item" onclick="openStockDetail('${stock.id}')">
        <div class="stock-info">
          <div class="stock-name">
            ${stock.name}
            <span class="stock-market-badge">${stock.market.toUpperCase()}</span>
          </div>
          <div class="stock-ticker">${stock.displayTicker}</div>
        </div>
        <div>
          <div class="stock-price">${priceSymbol}${quote.price.toLocaleString(undefined, {maximumFractionDigits: stock.market === 'us' ? 2 : 0})}</div>
          <div class="stock-change ${colorClass}">${sign}${change.toFixed(2)}%</div>
        </div>
      </div>
    `;
  }).join('');

  dropdown.innerHTML = items;
  dropdown.classList.add('show');
}

// 주문 드로어 열기
function openOrderDrawer(stockId) {
  const stock = STOCK_DEFS.find(s => s.id === stockId);
  if (!stock) return;

  activeDef = stock;
  
  // 정보 갱신
  document.getElementById('drawerStockName').textContent = stock.name;
  document.getElementById('drawerStockTicker').textContent = stock.displayTicker;
  
  const quote = liveQuotes[stock.id] || { price: 0, changePct: 0 };
  const priceSymbol = stock.market === 'us' ? '$' : '₩';
  document.getElementById('drawerCurrentPrice').textContent = `${priceSymbol}${quote.price.toLocaleString(undefined, {maximumFractionDigits: stock.market === 'us' ? 2 : 0})}`;
  
  const change = quote.changePct;
  const colorClass = change > 0 ? 'up' : (change < 0 ? 'down' : 'flat');
  const sign = change > 0 ? '+' : '';
  document.getElementById('drawerCurrentChange').className = `current-change ${colorClass}`;
  document.getElementById('drawerCurrentChange').textContent = `${sign}${change.toFixed(2)}%`;

  // 환율 힌트 제공
  const rateHintEl = document.getElementById('drawerExchangeRateHint');
  if (stock.market === 'us') {
    rateHintEl.textContent = `적용 환율: $1 = ₩${Math.round(usdKrwRate).toLocaleString()} (원화 환산 ₩${Math.round(quote.price * usdKrwRate).toLocaleString()})`;
  } else {
    rateHintEl.textContent = '';
  }

  // 인풋 초기화
  document.getElementById('orderQty').value = '';
  document.getElementById('drawerTotalCost').textContent = '₩0';

  // 디폴트로 사기 모드 켜기
  setOrderMode('buy');

  // 오픈
  document.getElementById('tossDrawerOverlay').classList.add('open');
}

function closeOrderDrawer() {
  document.getElementById('tossDrawerOverlay').classList.remove('open');
  activeDef = null;
}

// 사기/팔기 모드 변경
function setOrderMode(mode) {
  activeOrderMode = mode;
  document.getElementById('order-buy').classList.toggle('active', mode === 'buy');
  document.getElementById('order-sell').classList.toggle('active', mode === 'sell');
  
  // 버튼 액션 문구 갱신
  const actionBtn = document.getElementById('drawerActionBtn');
  actionBtn.className = `btn btn-${mode}`;
  actionBtn.textContent = mode === 'buy' ? '사기' : '팔기';

  // 가용금액 / 보유수량 라벨 변경
  const labelEl = document.getElementById('drawerAvailableLabel');
  const valEl = document.getElementById('drawerAvailableVal');
  
  const cash = getStorageItem('mock_cash', 0);
  const portfolio = getStorageItem('mock_portfolio', []);
  const holding = portfolio.find(p => p.id === activeDef.id);

  if (mode === 'buy') {
    labelEl.textContent = '주문 가능 금액';
    valEl.textContent = `₩${Math.round(cash).toLocaleString()}`;
  } else {
    labelEl.textContent = '보유 주식 수량';
    valEl.textContent = holding ? `${holding.qty}주` : '0주';
  }

  calculateTotalCost();
}

// 실시간 총 비용 연동
function calculateTotalCost() {
  const qtyInput = document.getElementById('orderQty');
  const qty = parseInt(qtyInput.value) || 0;
  
  const quote = liveQuotes[activeDef.id] || { price: 0 };
  const price = quote.price;

  // 원화 환산
  const isUs = activeDef.market === 'us';
  const priceKrw = isUs ? price * usdKrwRate : price;
  const totalCostKrw = priceKrw * qty;

  document.getElementById('drawerTotalCost').textContent = `₩${Math.round(totalCostKrw).toLocaleString()}`;
}

// 퀵 퍼센테이지 주문 적용 (최대 대비 비율)
function applyQuickPct(pct) {
  const quote = liveQuotes[activeDef.id] || { price: 0 };
  const price = quote.price;
  if (price === 0) return;

  const isUs = activeDef.market === 'us';
  const priceKrw = isUs ? price * usdKrwRate : price;
  
  let targetQty = 0;

  if (activeOrderMode === 'buy') {
    const cash = getStorageItem('mock_cash', 0);
    const maxAffordable = Math.floor(cash / priceKrw);
    targetQty = Math.floor(maxAffordable * pct);
  } else {
    const portfolio = getStorageItem('mock_portfolio', []);
    const holding = portfolio.find(p => p.id === activeDef.id);
    const holdingQty = holding ? holding.qty : 0;
    targetQty = Math.floor(holdingQty * pct);
  }

  // 최소 1주 보장
  if (pct > 0 && targetQty === 0) {
    if (activeOrderMode === 'buy') {
      const cash = getStorageItem('mock_cash', 0);
      if (cash >= priceKrw) targetQty = 1;
    } else {
      const portfolio = getStorageItem('mock_portfolio', []);
      const holding = portfolio.find(p => p.id === activeDef.id);
      if (holding && holding.qty > 0) targetQty = 1;
    }
  }

  document.getElementById('orderQty').value = targetQty;
  calculateTotalCost();
}

// 거래 체결
function executeOrder() {
  const qtyInput = document.getElementById('orderQty');
  const qty = parseInt(qtyInput.value) || 0;
  
  if (qty <= 0) {
    alert("수량을 1주 이상 입력해주세요.");
    qtyInput.focus();
    return;
  }

  const quote = liveQuotes[activeDef.id] || { price: 0 };
  const price = quote.price;
  if (price === 0) {
    alert("현재 가격을 불러올 수 없어 거래를 완료할 수 없습니다.");
    return;
  }

  const isUs = activeDef.market === 'us';
  const priceKrw = isUs ? price * usdKrwRate : price;
  const totalCostKrw = priceKrw * qty;
  const totalCostUsd = price * qty;
  
  let cash = getStorageItem('mock_cash', 0);
  let portfolio = getStorageItem('mock_portfolio', []);
  let history = getStorageItem('mock_history', []);

  // 1. 매수 (사기)
  if (activeOrderMode === 'buy') {
    if (cash < totalCostKrw) {
      alert("보유 예수금이 부족하여 매수할 수 없습니다.");
      return;
    }

    // 예수금 차감
    cash -= totalCostKrw;
    
    // 포트폴리오 업데이트
    const index = portfolio.findIndex(p => p.id === activeDef.id);
    if (index !== -1) {
      const existing = portfolio[index];
      // 가중평균 단가 계산 (USD 또는 KRW 본래 통화 기준)
      const newTotalQty = existing.qty + qty;
      const newAvgPrice = ((existing.avgPrice * existing.qty) + (price * qty)) / newTotalQty;
      
      portfolio[index].qty = newTotalQty;
      portfolio[index].avgPrice = newAvgPrice;
    } else {
      portfolio.push({
        id: activeDef.id,
        ticker: activeDef.ticker,
        name: activeDef.name,
        market: activeDef.market,
        qty: qty,
        avgPrice: price // (USD/KRW 본래 통화 기준)
      });
    }

    // 거래 내역 로깅
    history.push({
      type: 'buy',
      id: activeDef.id,
      name: activeDef.name,
      ticker: activeDef.displayTicker,
      market: activeDef.market,
      qty: qty,
      price: price,
      total: isUs ? totalCostUsd : totalCostKrw,
      totalKrw: totalCostKrw,
      date: getFormattedDate()
    });

    showToast(`${activeDef.name} ${qty}주를 샀습니다.`);

  } else {
    // 2. 매도 (팔기)
    const index = portfolio.findIndex(p => p.id === activeDef.id);
    if (index === -1 || portfolio[index].qty < qty) {
      alert("보유 수량이 부족하여 매도할 수 없습니다.");
      return;
    }

    // 예수금 가산
    cash += totalCostKrw;

    // 포트폴리오 차감
    portfolio[index].qty -= qty;
    
    // 수량 0이면 완전히 제거
    if (portfolio[index].qty === 0) {
      portfolio.splice(index, 1);
    }

    // 거래 내역 로깅
    history.push({
      type: 'sell',
      id: activeDef.id,
      name: activeDef.name,
      ticker: activeDef.displayTicker,
      market: activeDef.market,
      qty: qty,
      price: price,
      total: isUs ? totalCostUsd : totalCostKrw,
      totalKrw: totalCostKrw,
      date: getFormattedDate()
    });

    showToast(`${activeDef.name} ${qty}주를 팔았습니다.`);
  }

  // 로컬 영구 저장
  setStorageItem('mock_cash', cash);
  setStorageItem('mock_portfolio', portfolio);
  setStorageItem('mock_history', history);

  // 닫고 갱신
  closeOrderDrawer();
  updateUI();
}

// 날짜 포맷 도우미 (YYYY-MM-DD HH:MM)
function getFormattedDate() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 토스트 안내창 팝업
function showToast(msg) {
  const toast = document.getElementById('tossToast');
  document.getElementById('toastMessage').textContent = msg;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ── Toss-style SVG Portfolio Donut Chart Rendering ──
function renderPortfolioPie(cash, totalStockEval, portfolio) {
  const totalAssets = cash + totalStockEval;
  if (totalAssets <= 0) return;

  const svg = document.getElementById('portfolioPie');
  const legend = document.getElementById('portfolioLegend');
  if (!svg || !legend) return;

  const items = [];
  
  // 1. Cash portion
  if (cash > 0) {
    items.push({
      name: '보유 예수금',
      value: cash,
      pct: cash / totalAssets,
      color: '#8E94A0'
    });
  }

  // 2. Stock holdings
  portfolio.forEach((stock, idx) => {
    const quote = liveQuotes[stock.id] || {};
    const curPrice = quote.price || stock.avgPrice || 0;
    const isUs = stock.market === 'us';
    const curPriceKrw = isUs ? curPrice * usdKrwRate : curPrice;
    const evalKrw = curPriceKrw * stock.qty || 0;
    
    if (evalKrw > 0) {
      items.push({
        name: stock.name,
        value: evalKrw,
        pct: evalKrw / totalAssets,
        color: LEGEND_COLORS[idx % LEGEND_COLORS.length]
      });
    }
  });

  // Sort by asset valuation descending
  items.sort((a, b) => b.value - a.value);

  // SVG Circle stroke dash math
  let accumPercent = 0;
  let paths = '';
  const R = 38;
  const CX = 50, CY = 50;
  const circumference = 2 * Math.PI * R; // ~238.76

  items.forEach(item => {
    const strokeDash = `${item.pct * circumference} ${circumference}`;
    const strokeOffset = -accumPercent * circumference;
    accumPercent += item.pct;

    paths += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="transparent" stroke="${item.color}" stroke-width="10" stroke-dasharray="${strokeDash}" stroke-dashoffset="${strokeOffset}"></circle>`;
  });

  svg.innerHTML = paths;

  // Render stock ratio percent
  const stockRatio = (totalStockEval / totalAssets) * 100;
  document.getElementById('portfolioPieRatio').textContent = `${stockRatio.toFixed(0)}%`;

  // Draw legend list
  legend.innerHTML = items.map(item => {
    return `
      <div class="legend-item">
        <div class="legend-left">
          <span class="legend-dot" style="background-color: ${item.color}"></span>
          <span>${item.name}</span>
        </div>
        <div class="legend-right">
          <span>${(item.pct * 100).toFixed(1)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── Toss-style Stock Detail Screen Routing & Managers ──
function openStockDetail(stockId) {
  const stock = STOCK_DEFS.find(s => s.id === stockId);
  if (!stock) return;

  activeDetailDef = stock;
  
  // Set detailed titles
  document.getElementById('detailStockName').textContent = stock.name;
  document.getElementById('detailStockTicker').textContent = stock.displayTicker;

  // Immediately draw price metrics
  updateStockDetailPrices();

  // Run dynamic order book fluctuation loop
  startOrderBookSimulation(stock);

  // Initialize TradingView area chart (with delay to ensure container sizing is ready)
  detailChartRange = '1d';
  const rangeBtns = document.querySelectorAll('.range-btn');
  rangeBtns.forEach(btn => btn.classList.toggle('active', btn.textContent === '1일'));
  
  setTimeout(() => {
    if (activeDetailDef === stock) {
      initDetailChart(stock);
    }
  }, 150);

  // Open layer overlay
  document.getElementById('stockDetailScreen').classList.add('open');
}

function closeStockDetail() {
  document.getElementById('stockDetailScreen').classList.remove('open');
  activeDetailDef = null;

  // Tear down simulation updates
  if (orderBookInterval) {
    clearInterval(orderBookInterval);
    orderBookInterval = null;
  }

  // Destroy lightweight-chart instance
  if (currentDetailChart) {
    currentDetailChart.remove();
    currentDetailChart = null;
    currentDetailSeries = null;
  }
}

function updateStockDetailPrices() {
  if (!activeDetailDef) return;

  const rawQuote = liveQuotes[activeDetailDef.id] || {};
  const price = rawQuote.price || activeDetailDef.price || 0;
  const change = rawQuote.changePct || 0;
  
  const isUs = activeDetailDef.market === 'us';
  const priceSymbol = isUs ? '$' : '₩';

  // Format Current Price
  const priceEl = document.getElementById('detailCurrentPrice');
  priceEl.textContent = `${priceSymbol}${price.toLocaleString(undefined, {maximumFractionDigits: isUs ? 2 : 0})}`;

  // Format Change Rate
  const changeEl = document.getElementById('detailCurrentChange');
  const colorClass = change > 0 ? 'up' : (change < 0 ? 'down' : 'flat');
  const sign = change > 0 ? '+' : '';
  changeEl.className = `current-change ${colorClass}`;
  changeEl.textContent = `${sign}${change.toFixed(2)}%`;

  // Exchange rate helper details
  const rateHintEl = document.getElementById('detailExchangeRateHint');
  if (isUs) {
    rateHintEl.textContent = `적용 환율: $1 = ₩${Math.round(usdKrwRate).toLocaleString()} (원화 환산 ₩${Math.round(price * usdKrwRate).toLocaleString()})`;
  } else {
    rateHintEl.textContent = '';
  }

  // Append realtime tick to lightweight charts
  if (currentDetailSeries && detailChartRange === '1d' && price > 0) {
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      currentDetailSeries.update({
        time: nowSec,
        value: price
      });
    } catch(e) {}
  }
}

// ── TradingView Lightweight Charts Plotter ──
async function initDetailChart(stock) {
  const chartContainer = document.getElementById('detailChart');
  if (!chartContainer) return;

  // LightweightCharts 로드 예외 처리
  if (typeof LightweightCharts === 'undefined') {
    console.warn("LightweightCharts library is not loaded yet.");
    chartContainer.innerHTML = `<div style="color:var(--text-muted); font-size:12.5px; display:flex; align-items:center; justify-content:center; height:100%;">차트 라이브러리를 불러오는 중...</div>`;
    return;
  }

  // Clean old widgets
  if (currentDetailChart) {
    currentDetailChart.remove();
    currentDetailChart = null;
    currentDetailSeries = null;
  }

  // Create lightweight-chart with sleek glass design config
  currentDetailChart = LightweightCharts.createChart(chartContainer, {
    layout: {
      background: { type: 'solid', color: 'transparent' },
      textColor: '#86868B',
      fontSize: 10,
      fontFamily: 'Noto Sans KR, -apple-system, sans-serif'
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false }
    },
    rightPriceScale: {
      visible: true,
      borderVisible: false
    },
    timeScale: {
      borderVisible: false,
      timeVisible: true,
      secondsVisible: false
    },
    crosshair: {
      horzLine: { visible: false },
      vertLine: {
        color: 'rgba(0, 102, 204, 0.12)',
        width: 1,
        style: 0
      }
    },
    handleScale: false,
    handleScroll: false
  });

  // Areaseries with faded fill gradients matching Toss style
  const isUp = (liveQuotes[stock.id]?.changePct || 0) >= 0;
  const mainColor = isUp ? '#F04452' : '#3182F6';
  const fillColor = isUp ? 'rgba(240, 68, 82, 0.04)' : 'rgba(49, 130, 246, 0.04)';

  currentDetailSeries = currentDetailChart.addAreaSeries({
    topColor: fillColor,
    bottomColor: 'rgba(255, 255, 255, 0)',
    lineColor: mainColor,
    lineWidth: 2.5,
    crosshairMarkerVisible: true
  });

  try {
    let intervalParam = '';
    if (detailChartRange === '1d') intervalParam = '&interval=5m';
    else if (detailChartRange === '1w') intervalParam = '&interval=30m';
    
    const res = await fetch(`/api/chart?symbol=${stock.ticker}&range=${detailChartRange}${intervalParam}&market=${stock.market}`);
    if (res.ok) {
      const chartData = await res.json();
      if (chartData && chartData.length > 0) {
        const formatted = chartData.map(pt => {
          let timeVal = pt.time;
          if (typeof timeVal === 'string') {
            timeVal = Math.floor(new Date(timeVal).getTime() / 1000);
          }
          return {
            time: timeVal,
            value: pt.close || pt.value
          };
        }).filter(pt => !isNaN(pt.time) && !isNaN(pt.value));

        formatted.sort((a, b) => a.time - b.time);

        if (formatted.length > 0) {
          currentDetailSeries.setData(formatted);
          currentDetailChart.timeScale().fitContent();
          
          updateDetailMetrics(chartData, stock);
          return;
        }
      }
    }
    throw new Error("API chart failed");

  } catch (e) {
    console.warn("Chart API fail, fallback to mock random walk:", e);
    // Safe fallback generator to guarantee charts work under all network conditions
    const formatted = [];
    const quote = liveQuotes[stock.id] || { price: stock.market === 'kr' ? 70000 : 150 };
    let curVal = quote.price;
    const pointsCount = detailChartRange === '1d' ? 78 : (detailChartRange === '1w' ? 100 : 150);
    const timeStep = detailChartRange === '1d' ? 300 : (detailChartRange === '1w' ? 3600 : 86400);
    let nowSec = Math.floor(Date.now() / 1000) - (pointsCount * timeStep);

    for (let i = 0; i < pointsCount; i++) {
      curVal = curVal * (1 + (Math.random() * 0.008 - 0.0039));
      formatted.push({
        time: nowSec + (i * timeStep),
        value: curVal
      });
    }

    currentDetailSeries.setData(formatted);
    currentDetailChart.timeScale().fitContent();

    updateDetailMetrics([], stock);
  }
}

function changeDetailChartRange(range, btnElement) {
  detailChartRange = range;
  
  const btns = document.querySelectorAll('.range-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  if (activeDetailDef) {
    initDetailChart(activeDetailDef);
  }
}

function updateDetailMetrics(apiData, stock) {
  const quote = liveQuotes[stock.id] || { price: 0 };
  const open = quote.price * (1 - (quote.changePct || 0)/100);
  
  const isUs = stock.market === 'us';
  const prefix = isUs ? '$' : '₩';

  let h = quote.price * 1.02;
  let l = quote.price * 0.98;
  let vol = Math.floor(100000 + Math.random() * 9000000);

  if (apiData && apiData.length > 0) {
    const closes = apiData.map(d => d.close || d.value);
    h = Math.max(...closes);
    l = Math.min(...closes);
  }

  document.getElementById('metricOpen').textContent = `${prefix}${Math.round(open).toLocaleString()}`;
  document.getElementById('metricHigh').textContent = `${prefix}${Math.round(h).toLocaleString()}`;
  document.getElementById('metricLow').textContent = `${prefix}${Math.round(l).toLocaleString()}`;
  document.getElementById('metricVolume').textContent = vol.toLocaleString();
  document.getElementById('metric52High').textContent = `${prefix}${Math.round(quote.price * 1.35).toLocaleString()}`;
  document.getElementById('metric52Low').textContent = `${prefix}${Math.round(quote.price * 0.72).toLocaleString()}`;
}

// ── Toss-style Simulated Live Order Book (호가창) ──
function startOrderBookSimulation(stock) {
  if (orderBookInterval) {
    clearInterval(orderBookInterval);
  }

  const renderOB = () => {
    const rawQuote = liveQuotes[stock.id] || {};
    const price = rawQuote.price || (stock.market === 'kr' ? 70000 : 150);
    const change = rawQuote.changePct || 0;
    
    const isUs = stock.market === 'us';
    const priceSymbol = isUs ? '$' : '₩';
    
    let tickSize = 1;
    if (stock.market === 'kr') {
      if (price >= 500000) tickSize = 1000;
      else if (price >= 100000) tickSize = 500;
      else if (price >= 50000) tickSize = 100;
      else if (price >= 10000) tickSize = 50;
      else tickSize = 10;
    } else {
      tickSize = 0.05;
    }

    const bids = [];
    const asks = [];
    const maxQty = 40000;

    // Asks (5 sells - above)
    for (let i = 5; i >= 1; i--) {
      const askPrice = price + (i * tickSize);
      const askChg = quote.changePct + (i * tickSize / price * 100);
      const vol = Math.floor(500 + Math.random() * maxQty);
      asks.push({ price: askPrice, change: askChg, vol: vol });
    }

    // Bids (5 buys - below)
    for (let i = 1; i <= 5; i++) {
      const bidPrice = price - (i * tickSize);
      const bidChg = quote.changePct - (i * tickSize / price * 100);
      const vol = Math.floor(500 + Math.random() * maxQty);
      bids.push({ price: bidPrice, change: bidChg, vol: vol });
    }

    const allVols = [...asks, ...bids].map(x => x.vol);
    const peakVol = Math.max(...allVols);

    const obContainer = document.getElementById('detailOrderBook');
    if (!obContainer) return;

    let html = '';

    // Asks list
    asks.forEach(ask => {
      const barWidth = (ask.vol / peakVol) * 100;
      html += `
        <div class="ob-row ask">
          <div class="ob-price">${priceSymbol}${ask.price.toLocaleString(undefined, {maximumFractionDigits: isUs ? 2 : 0})}</div>
          <div class="ob-change">${ask.change > 0 ? '+' : ''}${ask.change.toFixed(2)}%</div>
          <div class="ob-volume-container">
            <div class="ob-vol-bar" style="width: ${barWidth}%"></div>
            <span class="ob-vol-num">${ask.vol.toLocaleString()}</span>
          </div>
        </div>
      `;
    });

    // Spread midpoint
    html += `
      <div class="ob-row spread-separator">
        <span>현재가 ₩${Math.round(isUs ? price * usdKrwRate : price).toLocaleString()}</span>
      </div>
    `;

    // Bids list
    bids.forEach(bid => {
      const barWidth = (bid.vol / peakVol) * 100;
      html += `
        <div class="ob-row bid">
          <div class="ob-price">${priceSymbol}${bid.price.toLocaleString(undefined, {maximumFractionDigits: isUs ? 2 : 0})}</div>
          <div class="ob-change">${bid.change > 0 ? '+' : ''}${bid.change.toFixed(2)}%</div>
          <div class="ob-volume-container">
            <div class="ob-vol-bar" style="width: ${barWidth}%"></div>
            <span class="ob-vol-num">${bid.vol.toLocaleString()}</span>
          </div>
        </div>
      `;
    });

    obContainer.innerHTML = html;
  };

  renderOB();
  orderBookInterval = setInterval(renderOB, 2000);
}

// ── Sticky Actions bar listeners ──
function openOrderDrawerFromDetail(mode) {
  if (!activeDetailDef) return;
  openOrderDrawer(activeDetailDef.id);
  setOrderMode(mode);
}
