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
let myPortfolioChart = null;
let mockPortfolioData = null;
let mockHistoryData = null;

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
let selectedOrderPrice = null; // 호가창 선택 가격 잠금
let whaleInterval = null; // 고래 추적 인터벌

// 배당률 매핑 (고배당 정렬용)
const DIVIDEND_RATES = {
  // 한국 주식
  'samsung': 2.15, 'sk-hynix': 0.85, 'lg-energy': 0.35, 'samsung-bio': 0.0,
  'hyundai': 4.60, 'kia': 5.10, 'posco': 3.20, 'naver': 0.95, 'kakao': 0.35, 'celltrion': 0.20,
  'kb-finance': 5.80, 'shinhan': 5.40, 'hana': 6.10, 'lg-elec': 1.80, 'samsung-sdcl': 1.10,
  'hanwha-aero': 0.70, 'samsung-sds': 2.30, 'krafton': 0.0, 'kakaobank': 1.20, 'ktng': 6.80,
  'kepco': 0.0, 'sk-inn': 0.0, 'ecopro-bm': 0.10, 'posco-future': 0.15, 'doosan-enbl': 0.0,
  // 미국 주식
  'nvidia': 0.12, 'apple': 0.52, 'microsoft': 0.71, 'alphabet': 0.45, 'amazon': 0.0, 'meta': 0.48, 'tesla': 0.0, 'netflix': 0.0,
  'amd': 0.0, 'broadcom': 1.35, 'qualcomm': 1.95, 'tsm': 1.25, 'intel': 1.65,
  'jpmorgan': 2.45, 'berkshire': 0.0, 'visa': 0.75, 'mastercard': 0.58,
  'eli-lilly': 0.58, 'unitedhealth': 1.45, 'palantir': 0.0, 'salesforce': 0.38, 'oracle': 0.92, 'exxon': 3.15, 'walmart': 1.35
};

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
  initTheme();
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
      closeCashModal();
      closeTargetModal();
    }
  });

  // 검색 인풋 핸들러
  const searchInput = document.getElementById('tossSearch');
  searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value.trim());
  });

  searchInput.addEventListener('focus', () => {
    if (!searchInput.value.trim()) {
      showSearchLanding();
    }
  });

  // 인풋 포커스 아웃 시 서서히 닫히게 (결과 클릭 가능하도록 딜레이 제공)
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      document.getElementById('searchResults').classList.remove('show');
    }, 250);
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

async function refreshMockData() {
  if (currentUser) {
    try {
      const pRes = await fetch('/api/trade/portfolio');
      if (pRes.ok) mockPortfolioData = await pRes.json();
      
      const hRes = await fetch('/api/trade/history');
      if (hRes.ok) mockHistoryData = await hRes.json();
    } catch (e) {
      console.error('[API SYNC] Error fetching mock data:', e);
    }
  }
}

// UI 갱신 총괄
async function updateUI() {
  await refreshMockData();
  renderAssets();
  renderShoppingStocks();
  renderHistory();
  updateTargetReturnUI();
  
  // 헤더 프로필 영역 실시간 동기화
  const cash = currentUser && mockPortfolioData ? mockPortfolioData.cash : getStorageItem('mock_cash', 0);
  document.getElementById('profileCash').textContent = `₩${Math.round(cash).toLocaleString()}`;
}

// 1. 내 자산 렌더링
function renderAssets() {
  let capital = getStorageItem('mock_capital', 10000000);
  let cash = getStorageItem('mock_cash', 10000000);
  let portfolio = [];

  if (currentUser && mockPortfolioData) {
    cash = mockPortfolioData.cash;
    capital = mockPortfolioData.investedPrincipal || capital;
    portfolio = mockPortfolioData.holdings.map(h => ({
      id: h.assetId.split('_')[0],
      ticker: h.ticker,
      market: h.market,
      type: h.type,
      avgPrice: h.avgPrice,
      qty: h.quantity,
      name: h.name || STOCK_DEFS.find(s => s.ticker === h.ticker)?.name || h.ticker
    }));
  } else {
    portfolio = getStorageItem('mock_portfolio', []);
  }
  
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

  // 카테고리 필터 정렬 적용 (Toss Securities style)
  if (activeShoppingCategory === 'gainers') {
    targets.sort((a, b) => {
      const qA = liveQuotes[a.id] || { changePct: 0 };
      const qB = liveQuotes[b.id] || { changePct: 0 };
      return qB.changePct - qA.changePct;
    });
  } else if (activeShoppingCategory === 'losers') {
    targets.sort((a, b) => {
      const qA = liveQuotes[a.id] || { changePct: 0 };
      const qB = liveQuotes[b.id] || { changePct: 0 };
      return qA.changePct - qB.changePct;
    });
  } else if (activeShoppingCategory === 'dividend') {
    targets.sort((a, b) => {
      const divA = DIVIDEND_RATES[a.id] || 0;
      const divB = DIVIDEND_RATES[b.id] || 0;
      return divB - divA;
    });
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

    let rightColContent = '';
    if (activeShoppingCategory === 'dividend') {
      const divYield = DIVIDEND_RATES[stock.id] || 0;
      rightColContent = `<span style="font-size:11px; font-weight:700; color:var(--green); background:rgba(0,210,122,0.06); padding:2px 6px; border-radius:4px; display:inline-block; margin-top:2px;">연 ${divYield.toFixed(2)}%</span>`;
    } else {
      rightColContent = `<span class="${colorClass}">${sign}${change.toFixed(2)}%</span>`;
    }

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
        <div class="change-col txt-right">
          ${rightColContent}
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

  let history = [];
  if (currentUser && mockHistoryData) {
    history = mockHistoryData.map(h => ({
      name: STOCK_DEFS.find(s => s.ticker === h.ticker)?.name || h.ticker,
      ticker: h.ticker,
      market: h.market,
      type: h.side,
      price: h.price,
      qty: h.quantity,
      total: h.price * h.quantity,
      totalKrw: Math.abs(h.amount),
      date: new Date(h.timestamp).toLocaleString()
    }));
  } else {
    history = getStorageItem('mock_history', []);
  }
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
    
    const badgeClass = item.type === 'buy' ? 'buy' : (item.type === 'sell' ? 'sell' : 'cancel');
    const badgeText = item.type === 'buy' ? '사기' : (item.type === 'sell' ? '팔기' : '취소');
    
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
    showSearchLanding();
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
  
  // 가격 및 라벨 갱신 (시장가 vs 지정가 판단)
  updateOrderDrawerPrice();

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
  selectedOrderPrice = null; // 호가 지정가 리셋
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



// 퀵 퍼센테이지 주문 적용 (최대 대비 비율)
function applyQuickPct(pct) {
  const quote = liveQuotes[activeDef.id] || { price: 0 };
  const price = selectedOrderPrice !== null ? selectedOrderPrice : (quote.price || activeDef.price || 0);
  if (price === 0) return;

  const isUs = activeDef.market === 'us';
  const priceKrw = isUs ? price * usdKrwRate : price;
  const cash = getStorageItem('mock_cash', 0);
  
  if (activeOrderMethod === 'qty') {
    let targetQty = 0;
    if (activeOrderMode === 'buy') {
      const maxAffordable = Math.floor(cash / priceKrw);
      targetQty = Math.floor(maxAffordable * pct);
    } else {
      const portfolio = getStorageItem('mock_portfolio', []);
      const holding = portfolio.find(p => p.id === activeDef.id);
      const holdingQty = holding ? holding.qty : 0;
      targetQty = isUs ? parseFloat((holdingQty * pct).toFixed(4)) : Math.floor(holdingQty * pct);
    }
    
    if (pct > 0 && targetQty === 0) {
      if (activeOrderMode === 'buy' && cash >= priceKrw) targetQty = 1;
      else if (activeOrderMode === 'sell') {
        const portfolio = getStorageItem('mock_portfolio', []);
        const holding = portfolio.find(p => p.id === activeDef.id);
        if (holding && holding.qty > 0) targetQty = isUs ? parseFloat(holding.qty.toFixed(4)) : 1;
      }
    }
    
    orderQtyString = targetQty.toString();
    document.getElementById('orderQty').value = targetQty.toLocaleString();
  } else {
    let targetAmount = 0;
    if (activeOrderMode === 'buy') {
      targetAmount = Math.floor(cash * pct);
    } else {
      const portfolio = getStorageItem('mock_portfolio', []);
      const holding = portfolio.find(p => p.id === activeDef.id);
      const holdingQty = holding ? holding.qty : 0;
      targetAmount = Math.floor(holdingQty * priceKrw * pct);
    }
    
    orderAmountString = targetAmount.toString();
    document.getElementById('orderQty').value = targetAmount.toLocaleString();
  }

  calculateTotalCost();
}

// 거래 체결
function executeOrder() {
  const quote = liveQuotes[activeDef.id] || { price: 0 };
  const price = selectedOrderPrice !== null ? selectedOrderPrice : (quote.price || activeDef.price || 0);
  if (price === 0) {
    alert("현재 가격을 불러올 수 없어 거래를 완료할 수 없습니다.");
    return;
  }

  const isUs = activeDef.market === 'us';
  const priceKrw = isUs ? price * usdKrwRate : price;
  
  let qty = 0;
  let totalCostKrw = 0;
  
  if (activeOrderMethod === 'qty') {
    qty = parseInt(orderQtyString) || 0;
    if (qty <= 0) {
      alert("수량을 1주 이상 입력해주세요.");
      return;
    }
    totalCostKrw = priceKrw * qty;
  } else {
    totalCostKrw = parseInt(orderAmountString) || 0;
    if (totalCostKrw <= 0) {
      alert("금액을 입력해주세요.");
      return;
    }
    const estQty = totalCostKrw / priceKrw;
    qty = isUs ? parseFloat(estQty.toFixed(4)) : Math.floor(estQty);
    
    if (qty <= 0) {
      alert(isUs ? "금액이 너무 적어 소수점 최소 수량(0.0001주)을 살 수 없습니다." : "금액이 주가보다 적어 1주를 살 수 없습니다.");
      return;
    }
  }

  const totalCostUsd = isUs ? totalCostKrw / usdKrwRate : totalCostKrw;
  
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

    const displayQty = isUs ? qty.toFixed(4) : qty;
    showToast(`${activeDef.name} ${parseFloat(displayQty).toLocaleString()}주를 샀습니다.`);

  } else {
    // 2. 매도 (팔기)
    const index = portfolio.findIndex(p => p.id === activeDef.id);
    if (index === -1 || portfolio[index].qty < qty - 0.00001) {
      alert("보유 수량이 부족하여 매도할 수 없습니다.");
      return;
    }

    // 예수금 가산
    cash += totalCostKrw;

    // 포트폴리오 차감
    portfolio[index].qty = parseFloat((portfolio[index].qty - qty).toFixed(4));
    
    // 수량 0이면 완전히 제거 (소수점 감안해서 0.0001 미만이면 제거)
    if (portfolio[index].qty < 0.0001) {
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

    const displayQty = isUs ? qty.toFixed(4) : qty;
    showToast(`${activeDef.name} ${parseFloat(displayQty).toLocaleString()}주를 팔았습니다.`);
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

// ── Toss-style Chart.js Portfolio Donut Chart Rendering ──
function renderPortfolioPie(cash, totalStockEval, portfolio) {
  const totalAssets = cash + totalStockEval;
  if (totalAssets <= 0) return;

  const canvas = document.getElementById('portfolioPieChart');
  const legend = document.getElementById('portfolioLegend');
  if (!canvas || !legend) return;

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

  // Render stock ratio percent
  const stockRatio = (totalStockEval / totalAssets) * 100;
  document.getElementById('portfolioPieRatio').textContent = `${stockRatio.toFixed(0)}%`;
  document.getElementById('portfolioPieVal').textContent = `(₩${Math.round(totalStockEval).toLocaleString()})`;

  // Destroy previous Chart instance if it exists
  if (myPortfolioChart) {
    myPortfolioChart.destroy();
  }

  // Build Chart.js Doughnut
  const ctx = canvas.getContext('2d');
  myPortfolioChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: items.map(item => item.name),
      datasets: [{
        data: items.map(item => item.value),
        backgroundColor: items.map(item => item.color),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              const pct = ((val / totalAssets) * 100).toFixed(1);
              return `${context.label}: ₩${Math.round(val).toLocaleString()} (${pct}%)`;
            }
          }
        }
      },
      cutout: '75%'
    }
  });

  // Draw legend list
  legend.innerHTML = items.map(item => {
    return `
      <div class="legend-item" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
        <div class="legend-left" style="display: flex; align-items: center; gap: 8px;">
          <span class="legend-dot" style="background-color: ${item.color}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
          <span>${item.name}</span>
        </div>
        <div class="legend-right" style="color: var(--text-muted); font-size: 12.5px;">
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
  
  // 실시간 고래 거래 시뮬레이션 동작 트리거 (Toss style)
  startWhaleTradesSimulation(stock);

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

  // 고래 추적 중단
  stopWhaleTradesSimulation();

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
          drawAveragePriceLine(stock);
          drawPreviousCloseLine(stock); // 전일종가 기준 점선 그리기
          setupChartCrosshairTracker(stock); // 십자선 마우스 이동 트래커 바인딩
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
    drawAveragePriceLine(stock);
    drawPreviousCloseLine(stock); // 전일종가 기준 점선 그리기
    setupChartCrosshairTracker(stock); // 십자선 마우스 이동 트래커 바인딩
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
      const askChg = change + (i * tickSize / price * 100);
      const vol = Math.floor(500 + Math.random() * maxQty);
      asks.push({ price: askPrice, change: askChg, vol: vol });
    }

    // Bids (5 buys - below)
    for (let i = 1; i <= 5; i++) {
      const bidPrice = price - (i * tickSize);
      const bidChg = change - (i * tickSize / price * 100);
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
        <div class="ob-row ask" onclick="fillOrderPrice(${ask.price})" style="cursor:pointer;">
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
        <div class="ob-row bid" onclick="fillOrderPrice(${bid.price})" style="cursor:pointer;">
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
  selectedOrderPrice = null; // 대시보드 사기/팔기 버튼은 시장가 기본
  openOrderDrawer(activeDetailDef.id);
  setOrderMode(mode);
}

// ── 테마 토글 및 초기화 ──
function initTheme() {
  const savedTheme = localStorage.getItem('mock_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mock_theme', theme);
  
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    if (theme === 'dark') {
      btn.innerHTML = `<svg class="theme-icon" style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    } else {
      btn.innerHTML = `<svg class="theme-icon" style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const target = current === 'dark' ? 'light' : 'dark';
  setTheme(target);
}

// ── 예수금 입출금 모달 제어 ──
let cashModalMode = 'deposit'; // 'deposit' | 'withdraw'
let cashModalAmountStr = '';

function openCashModal(mode) {
  cashModalMode = mode;
  cashModalAmountStr = '';
  document.getElementById('cashAmountInput').value = '0';
  
  const title = document.getElementById('cashModalTitle');
  const desc = document.getElementById('cashModalDesc');
  const actionBtn = document.getElementById('cashModalActionBtn');
  
  if (mode === 'deposit') {
    title.textContent = '예수금 입금';
    desc.textContent = '모의 투자 계좌에 예수금을 입금합니다.';
    actionBtn.textContent = '입금하기';
    actionBtn.className = 'btn btn-primary';
  } else {
    title.textContent = '예수금 출금';
    desc.textContent = '모의 투자 계좌에서 예수금을 출금합니다.';
    actionBtn.textContent = '출금하기';
    actionBtn.className = 'btn btn-secondary';
  }
  
  document.getElementById('cashModal').classList.add('open');
}

function closeCashModal() {
  document.getElementById('cashModal').classList.remove('open');
}

function pressCashKey(key) {
  const input = document.getElementById('cashAmountInput');
  if (key === 'backspace') {
    cashModalAmountStr = cashModalAmountStr.slice(0, -1);
  } else {
    if (cashModalAmountStr.length >= 11) return;
    cashModalAmountStr += key;
  }
  const val = parseInt(cashModalAmountStr) || 0;
  input.value = val.toLocaleString();
}

function addQuickCash(amount) {
  const currentVal = parseInt(cashModalAmountStr) || 0;
  const newVal = currentVal + amount;
  if (newVal > 10000000000) return;
  cashModalAmountStr = newVal.toString();
  document.getElementById('cashAmountInput').value = newVal.toLocaleString();
}

function clearCashInput() {
  cashModalAmountStr = '';
  document.getElementById('cashAmountInput').value = '0';
}

function executeCashTransaction() {
  const amount = parseInt(cashModalAmountStr) || 0;
  if (amount <= 0) {
    alert('금액을 입력해주세요.');
    return;
  }
  
  let cash = getStorageItem('mock_cash', 0);
  let capital = getStorageItem('mock_capital', 0);
  let history = getStorageItem('mock_history', []);
  
  if (cashModalMode === 'deposit') {
    cash += amount;
    capital += amount;
    setStorageItem('mock_cash', cash);
    setStorageItem('mock_capital', capital);
    
    history.push({
      type: 'buy',
      name: '예수금 입금',
      ticker: 'DEPOSIT',
      market: 'kr',
      qty: 1,
      price: amount,
      total: amount,
      totalKrw: amount,
      date: getFormattedDate()
    });
    
    showToast(`₩${amount.toLocaleString()}이 입금되었습니다.`);
  } else {
    if (cash < amount) {
      alert('보유 예수금이 부족합니다.');
      return;
    }
    cash -= amount;
    capital = Math.max(0, capital - amount);
    setStorageItem('mock_cash', cash);
    setStorageItem('mock_capital', capital);
    
    history.push({
      type: 'sell',
      name: '예수금 출금',
      ticker: 'WITHDRAW',
      market: 'kr',
      qty: 1,
      price: amount,
      total: amount,
      totalKrw: amount,
      date: getFormattedDate()
    });
    
    showToast(`₩${amount.toLocaleString()}이 출금되었습니다.`);
  }
  
  setStorageItem('mock_history', history);
  closeCashModal();
  updateUI();
}

// ── 목표 자산 설정 모달 제어 ──
let targetModalAmountStr = '';

function openTargetModal() {
  targetModalAmountStr = '';
  const currentGoal = getStorageItem('mock_target_goal', 200000000);
  document.getElementById('targetAmountInput').value = currentGoal.toLocaleString();
  targetModalAmountStr = currentGoal.toString();
  document.getElementById('targetModal').classList.add('open');
}

function closeTargetModal() {
  document.getElementById('targetModal').classList.remove('open');
}

function pressTargetKey(key) {
  const input = document.getElementById('targetAmountInput');
  if (key === 'backspace') {
    targetModalAmountStr = targetModalAmountStr.slice(0, -1);
  } else {
    if (targetModalAmountStr.length >= 12) return;
    targetModalAmountStr += key;
  }
  const val = parseInt(targetModalAmountStr) || 0;
  input.value = val.toLocaleString();
}

function addTargetCash(amount) {
  const currentVal = parseInt(targetModalAmountStr) || 0;
  const newVal = currentVal + amount;
  if (newVal > 100000000000) return;
  targetModalAmountStr = newVal.toString();
  document.getElementById('targetAmountInput').value = newVal.toLocaleString();
}

function clearTargetInput() {
  targetModalAmountStr = '';
  document.getElementById('targetAmountInput').value = '0';
}

function confirmTargetGoal() {
  const val = parseInt(targetModalAmountStr) || 0;
  if (val <= 0) {
    alert('목표 자산을 입력해주세요.');
    return;
  }
  setStorageItem('mock_target_goal', val);
  closeTargetModal();
  updateUI();
  showToast(`목표 자산이 ₩${val.toLocaleString()}으로 변경되었습니다.`);
}

function updateTargetReturnUI() {
  const goal = getStorageItem('mock_target_goal', 200000000);
  const goalLabel = document.getElementById('targetGoalLabel');
  if (goalLabel) goalLabel.textContent = `목표 ₩${Math.round(goal).toLocaleString()}`;
  
  const cash = getStorageItem('mock_cash', 0);
  const portfolio = getStorageItem('mock_portfolio', []);
  let totalStockEval = 0;
  portfolio.forEach(holding => {
    const quote = liveQuotes[holding.id] || { price: holding.avgPrice };
    const price = quote.price;
    const isUs = holding.market === 'us';
    const evalPriceKrw = isUs ? price * usdKrwRate : price;
    totalStockEval += evalPriceKrw * holding.qty;
  });
  
  const totalAssets = cash + totalStockEval;
  const progressPct = Math.min(100, Math.max(0, (totalAssets / goal) * 100));
  
  const bar = document.getElementById('targetProgressBar');
  if (bar) bar.style.width = `${progressPct.toFixed(1)}%`;
  
  const pctText = document.getElementById('targetProgressPct');
  if (pctText) pctText.textContent = `${progressPct.toFixed(1)}% 달성`;
  
  const reportBox = document.getElementById('portfolioAnalysisReport');
  if (reportBox) {
    const capital = getStorageItem('mock_capital', 0);
    const netProfit = totalAssets - capital;
    const netReturnPct = capital > 0 ? (netProfit / capital) * 100 : 0;
    
    let reportText = '';
    if (portfolio.length === 0) {
      reportText = `💡 <strong>첫 주식을 사보세요!</strong> 현재 보유 주식이 없습니다. 예수금을 입금하거나 주식 쇼핑 탭에서 인기 주식을 골라보세요.`;
    } else {
      let bestHolding = null;
      let bestReturn = -Infinity;
      portfolio.forEach(holding => {
        const quote = liveQuotes[holding.id] || { price: holding.avgPrice };
        const returnPct = ((quote.price - holding.avgPrice) / holding.avgPrice) * 100;
        if (returnPct > bestReturn) {
          bestReturn = returnPct;
          bestHolding = holding;
        }
      });
      
      if (netProfit > 0) {
        reportText = `🔥 <strong>순조로운 투자 중!</strong> 누적 수익 <strong>+₩${Math.round(netProfit).toLocaleString()} (${netReturnPct.toFixed(2)}%)</strong>를 기록하고 있습니다. 특히 <strong>${bestHolding.name}</strong> 종목이 <strong>+${bestReturn.toFixed(1)}%</strong>의 최고 수익률을 내며 자산 성장을 리드하고 있네요!`;
      } else if (netProfit < 0) {
        reportText = `📉 <strong>인내심이 필요한 시기!</strong> 현재 누적 손실률은 <strong>${netReturnPct.toFixed(2)}%</strong>입니다. 손실이 큰 종목은 분할 매수로 단가를 낮추는 방안을 검토하거나, AI 투자 신호가 '강력매수'인 우량 자산 비중을 늘려 방어력을 높여보세요.`;
      } else {
        reportText = `😐 <strong>투자의 첫 걸음!</strong> 현재 원금 상태를 유지하고 있습니다. 투자 자산 비중이 늘어남에 따라 실시간 주가 상승률에 의해 자산이 더욱 변동하게 될 것입니다.`;
      }
    }
    reportBox.innerHTML = reportText;
  }
}

// ── 주문 방식 변경 및 키패드 입력 ──
let orderQtyString = '';
let orderAmountString = '';
let activeOrderMethod = 'qty'; // 'qty' | 'amount'

function switchOrderMethod(method) {
  activeOrderMethod = method;
  document.getElementById('method-qty').classList.toggle('active', method === 'qty');
  document.getElementById('method-amount').classList.toggle('active', method === 'amount');
  
  const label = document.getElementById('inputLabel');
  const unit = document.getElementById('inputUnit');
  
  if (method === 'qty') {
    label.textContent = '주문 수량';
    unit.textContent = '주';
    orderQtyString = '';
    document.getElementById('orderQty').value = '0';
  } else {
    label.textContent = '주문 금액';
    unit.textContent = '원';
    orderAmountString = '';
    document.getElementById('orderQty').value = '0';
  }
  
  calculateTotalCost();
}

function pressKey(key) {
  const input = document.getElementById('orderQty');
  if (activeOrderMethod === 'qty') {
    if (key === 'backspace') {
      orderQtyString = orderQtyString.slice(0, -1);
    } else {
      if (orderQtyString.length >= 7) return;
      orderQtyString += key;
    }
    const val = parseInt(orderQtyString) || 0;
    input.value = val.toLocaleString();
  } else {
    if (key === 'backspace') {
      orderAmountString = orderAmountString.slice(0, -1);
    } else {
      if (orderAmountString.length >= 11) return;
      orderAmountString += key;
    }
    const val = parseInt(orderAmountString) || 0;
    input.value = val.toLocaleString();
  }
  
  calculateTotalCost();
}

function calculateTotalCost() {
  if (!activeDef) return;
  const quote = liveQuotes[activeDef.id] || { price: 0 };
  const price = selectedOrderPrice !== null ? selectedOrderPrice : (quote.price || activeDef.price || 0);
  const isUs = activeDef.market === 'us';
  const priceKrw = isUs ? price * usdKrwRate : price;
  
  const costLabel = document.getElementById('drawerTotalCostLabel');
  const costVal = document.getElementById('drawerTotalCost');
  
  if (activeOrderMethod === 'qty') {
    const qty = parseInt(orderQtyString) || 0;
    const totalCostKrw = priceKrw * qty;
    costLabel.textContent = '예상 총 금액';
    costVal.textContent = `₩${Math.round(totalCostKrw).toLocaleString()}`;
  } else {
    const amount = parseInt(orderAmountString) || 0;
    const estQty = priceKrw > 0 ? (amount / priceKrw) : 0;
    const finalQty = isUs ? estQty.toFixed(4) : Math.floor(estQty);
    
    costLabel.textContent = `예상 주문 수량: ${parseFloat(finalQty).toLocaleString()}주`;
    costVal.textContent = `₩${amount.toLocaleString()}`;
  }
}

// ── 최근 검색어 및 실시간 인기 주식 ──
const POPULAR_STOCKS = [
  { id: 'nvidia', name: 'NVIDIA', ticker: 'NVDA', rank: 1, up: true },
  { id: 'tesla', name: 'Tesla', ticker: 'TSLA', rank: 2, up: true },
  { id: 'samsung', name: '삼성전자', ticker: '005930', rank: 3, up: false },
  { id: 'apple', name: 'Apple', ticker: 'AAPL', rank: 4, up: true },
  { id: 'sk-hynix', name: 'SK하이닉스', ticker: '000660', rank: 5, up: false }
];

function showSearchLanding() {
  const dropdown = document.getElementById('searchResults');
  const recent = getStorageItem('recent_searches', []);
  
  let html = '';
  
  html += `<div class="search-section" style="padding:14px 16px; border-bottom:1px solid var(--border);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <span style="font-size:12px; font-weight:700; color:var(--text-muted);">최근 검색어</span>
      ${recent.length > 0 ? `<button onclick="clearRecentSearches(event)" style="font-size:11px; color:var(--text-muted); background:none; border:none; cursor:pointer;">모두 지우기</button>` : ''}
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:8px;">
      ${recent.length > 0 ? recent.map((item, idx) => {
        return `<span class="recent-keyword" onclick="selectSearchKeyword('${item}', event)" style="font-size:12px; font-weight:600; padding:6px 12px; background:var(--surface2); border-radius:16px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; color:var(--text);">
          ${item}
          <span onclick="deleteRecentSearch(${idx}, event)" style="font-weight:800; opacity:0.6; cursor:pointer; padding:0 2px;">&times;</span>
        </span>`;
      }).join('') : `<span style="font-size:12px; color:var(--text-muted);">최근 검색한 주식이 없습니다.</span>`}
    </div>
  </div>`;
  
  html += `<div class="search-section" style="padding:14px 16px;">
    <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:12px;">실시간 인기 주식</div>
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${POPULAR_STOCKS.map(s => {
        const quote = liveQuotes[s.id] || { price: 0, changePct: 0 };
        const change = quote.changePct;
        const colorClass = change > 0 ? 'up' : (change < 0 ? 'down' : 'flat');
        const sign = change > 0 ? '+' : '';
        const badgeColor = s.rank <= 3 ? 'var(--accent)' : 'var(--text-muted)';
        
        return `<div class="popular-item" onclick="openStockDetail('${s.id}')" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; padding:4px 0;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:13px; font-weight:800; color:${badgeColor}; width:16px; text-align:center;">${s.rank}</span>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="font-size:13.5px; font-weight:700; color:var(--text);">${s.name}</span>
              <span style="font-size:10px; color:var(--text-muted);">${s.ticker}</span>
            </div>
          </div>
          <div style="text-align:right;">
            <span style="font-size:11px; font-weight:700;" class="${colorClass}">${sign}${change.toFixed(2)}%</span>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
  
  dropdown.innerHTML = html;
  dropdown.classList.add('show');
}

function saveSearchKeyword(keyword) {
  let recent = getStorageItem('recent_searches', []);
  recent = recent.filter(item => item !== keyword);
  recent.unshift(keyword);
  if (recent.length > 8) recent = recent.slice(0, 8);
  setStorageItem('recent_searches', recent);
}

function deleteRecentSearch(idx, event) {
  event.stopPropagation();
  let recent = getStorageItem('recent_searches', []);
  recent.splice(idx, 1);
  setStorageItem('recent_searches', recent);
  showSearchLanding();
}

function clearRecentSearches(event) {
  event.stopPropagation();
  setStorageItem('recent_searches', []);
  showSearchLanding();
}

function selectSearchKeyword(keyword, event) {
  event.stopPropagation();
  document.getElementById('tossSearch').value = keyword;
  handleSearch(keyword);
}

// ── 카테고리 필터 정렬 ──
let activeShoppingCategory = 'popular';

function switchCategory(category) {
  activeShoppingCategory = category;
  
  const selector = document.querySelector('.category-selector');
  if (selector) {
    const btns = selector.querySelectorAll('.mkt-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('onclick').includes(category));
    });
  }
  
  renderShoppingStocks();
}

// ── 도넛 차트 Hover 상호작용 ──
function highlightSlice(idx, name, pct, val) {
  const slices = document.querySelectorAll('.pie-slice');
  slices.forEach((s, i) => {
    if (i === idx) {
      s.setAttribute('stroke-width', '13');
    } else {
      s.setAttribute('stroke-width', '8');
    }
  });
  
  document.getElementById('portfolioPieRatio').textContent = `${parseFloat(pct).toFixed(1)}%`;
  document.getElementById('portfolioPieRatio').style.fontSize = '13.5px';
  document.getElementById('portfolioPieRatio').style.color = slices[idx].getAttribute('stroke');
  document.querySelector('.pie-center .center-label').textContent = name;
  document.getElementById('portfolioPieVal').textContent = `₩${Math.round(parseFloat(val)).toLocaleString()}`;
}

function resetSliceHighlight() {
  const slices = document.querySelectorAll('.pie-slice');
  slices.forEach(s => {
    s.setAttribute('stroke-width', '10');
  });
  
  const cash = getStorageItem('mock_cash', 0);
  const portfolio = getStorageItem('mock_portfolio', []);
  let totalStockEval = 0;
  portfolio.forEach(holding => {
    const quote = liveQuotes[holding.id] || { price: holding.avgPrice };
    const isUs = holding.market === 'us';
    const evalPriceKrw = isUs ? quote.price * usdKrwRate : quote.price;
    totalStockEval += evalPriceKrw * holding.qty;
  });
  
  const totalAssets = cash + totalStockEval;
  const stockRatio = totalAssets > 0 ? (totalStockEval / totalAssets) * 100 : 0;
  
  document.getElementById('portfolioPieRatio').textContent = `${stockRatio.toFixed(0)}%`;
  document.getElementById('portfolioPieRatio').style.fontSize = '15px';
  document.getElementById('portfolioPieRatio').style.color = 'var(--text)';
  document.querySelector('.pie-center .center-label').textContent = '주식 비중';
  document.getElementById('portfolioPieVal').textContent = `(₩${Math.round(totalStockEval).toLocaleString()})`;
}

// ── 평단가 라인 그리기 ──
function drawAveragePriceLine(stock) {
  if (!currentDetailSeries) return;
  const portfolio = getStorageItem('mock_portfolio', []);
  const holding = portfolio.find(p => p.id === stock.id);
  if (holding && holding.qty > 0) {
    currentDetailSeries.createPriceLine({
      price: holding.avgPrice,
      color: '#E03947',
      lineWidth: 1.5,
      lineStyle: 1, // Dashed
      axisLabelVisible: true,
      title: '내 평단가'
    });
  }
}

// ── 호가창 클릭 피드백 ──
function fillOrderPrice(price) {
  if (!activeDetailDef) return;
  selectedOrderPrice = price; // 호가 지정가 선택 잠금
  openOrderDrawer(activeDetailDef.id);
  
  // 수량 주문 모드라면 1주 입력, 금액 주문 모드라면 가격만큼 1주치 입력
  if (activeOrderMethod === 'qty') {
    orderQtyString = '1';
    document.getElementById('orderQty').value = '1';
  } else {
    const isUs = activeDetailDef.market === 'us';
    const priceKrw = isUs ? Math.round(price * usdKrwRate) : price;
    orderAmountString = Math.round(priceKrw).toString();
    document.getElementById('orderQty').value = Math.round(priceKrw).toLocaleString();
  }
  calculateTotalCost();
}

// ── 호가 지정가 UI 갱신 도우미 ──
function updateOrderDrawerPrice() {
  if (!activeDef) return;
  const quote = liveQuotes[activeDef.id] || { price: 0, changePct: 0 };
  const priceSymbol = activeDef.market === 'us' ? '$' : '₩';
  const labelEl = document.querySelector('.price-label');
  const priceEl = document.getElementById('drawerCurrentPrice');
  const changeEl = document.getElementById('drawerCurrentChange');
  const rateHintEl = document.getElementById('drawerExchangeRateHint');

  if (selectedOrderPrice !== null) {
    labelEl.innerHTML = `지정가 주문 <span class="limit-badge">지정가</span><span class="clear-limit-btn" onclick="clearSelectedOrderPrice(event)">시장가로 변경</span>`;
    priceEl.textContent = `${priceSymbol}${selectedOrderPrice.toLocaleString(undefined, {maximumFractionDigits: activeDef.market === 'us' ? 2 : 0})}`;
    
    const change = quote.changePct || 0;
    const prevClose = quote.price / (1 + change/100);
    const limitChg = prevClose > 0 ? ((selectedOrderPrice - prevClose) / prevClose) * 100 : 0;
    const colorClass = limitChg > 0 ? 'up' : (limitChg < 0 ? 'down' : 'flat');
    const sign = limitChg > 0 ? '+' : '';
    changeEl.className = `current-change ${colorClass}`;
    changeEl.textContent = `${sign}${limitChg.toFixed(2)}%`;

    if (activeDef.market === 'us') {
      rateHintEl.textContent = `적용 환율: $1 = ₩${Math.round(usdKrwRate).toLocaleString()} (원화 환산 ₩${Math.round(selectedOrderPrice * usdKrwRate).toLocaleString()})`;
    } else {
      rateHintEl.textContent = '';
    }
  } else {
    labelEl.textContent = '현재가';
    priceEl.textContent = `${priceSymbol}${quote.price.toLocaleString(undefined, {maximumFractionDigits: activeDef.market === 'us' ? 2 : 0})}`;
    
    const change = quote.changePct || 0;
    const colorClass = change > 0 ? 'up' : (change < 0 ? 'down' : 'flat');
    const sign = change > 0 ? '+' : '';
    changeEl.className = `current-change ${colorClass}`;
    changeEl.textContent = `${sign}${change.toFixed(2)}%`;

    if (activeDef.market === 'us') {
      rateHintEl.textContent = `적용 환율: $1 = ₩${Math.round(usdKrwRate).toLocaleString()} (원화 환산 ₩${Math.round(quote.price * usdKrwRate).toLocaleString()})`;
    } else {
      rateHintEl.textContent = '';
    }
  }
}

// ── 지정가 해제 ──
function clearSelectedOrderPrice(event) {
  if (event) event.stopPropagation();
  selectedOrderPrice = null;
  updateOrderDrawerPrice();
  calculateTotalCost();
}

// ── 전일 종가 기준 점선 그리기 ──
function drawPreviousCloseLine(stock) {
  if (!currentDetailSeries || detailChartRange !== '1d') return;
  const quote = liveQuotes[stock.id] || { price: 0, changePct: 0 };
  const price = quote.price || stock.price || 0;
  const change = quote.changePct || 0;
  const prevClose = price / (1 + change/100);

  if (prevClose > 0) {
    currentDetailSeries.createPriceLine({
      price: prevClose,
      color: 'rgba(142, 148, 160, 0.45)', // 투명도 있는 중립 회색 점선
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: '전일 종가'
    });
  }
}

// ── 십자선 마우스 이동 트래커 바인딩 (Toss style) ──
function setupChartCrosshairTracker(stock) {
  if (!currentDetailChart || !currentDetailSeries) return;
  
  currentDetailChart.subscribeCrosshairMove(param => {
    const priceEl = document.getElementById('detailCurrentPrice');
    const changeEl = document.getElementById('detailCurrentChange');
    const subEl = document.getElementById('detailExchangeRateHint');

    const quote = liveQuotes[stock.id] || { price: 0, changePct: 0 };
    const curPrice = quote.price || stock.price || 0;
    const curChange = quote.changePct || 0;
    const isUs = stock.market === 'us';
    const priceSymbol = isUs ? '$' : '₩';
    const prevClose = curPrice / (1 + curChange/100);

    if (!param.time || param.point === undefined || !param.seriesData.get(currentDetailSeries)) {
      // 마우스가 떠났을 때 원본 시세로 복구
      priceEl.textContent = `${priceSymbol}${curPrice.toLocaleString(undefined, {maximumFractionDigits: isUs ? 2 : 0})}`;
      const colorClass = curChange > 0 ? 'up' : (curChange < 0 ? 'down' : 'flat');
      const sign = curChange > 0 ? '+' : '';
      changeEl.className = `current-change ${colorClass}`;
      changeEl.textContent = `${sign}${curChange.toFixed(2)}%`;
      if (isUs) {
        subEl.textContent = `적용 환율: $1 = ₩${Math.round(usdKrwRate).toLocaleString()} (원화 환산 ₩${Math.round(curPrice * usdKrwRate).toLocaleString()})`;
      } else {
        subEl.textContent = '';
      }
      return;
    }

    const data = param.seriesData.get(currentDetailSeries);
    if (data) {
      const val = data.value !== undefined ? data.value : data.close;
      const chg = prevClose > 0 ? ((val - prevClose) / prevClose) * 100 : 0;
      const colorClass = chg > 0 ? 'up' : (chg < 0 ? 'down' : 'flat');
      const sign = chg > 0 ? '+' : '';

      priceEl.textContent = `${priceSymbol}${val.toLocaleString(undefined, {maximumFractionDigits: isUs ? 2 : 0})}`;
      changeEl.className = `current-change ${colorClass}`;
      changeEl.textContent = `${sign}${chg.toFixed(2)}%`;

      let timeString = '';
      const timeVal = param.time;
      if (typeof timeVal === 'number') {
        const date = new Date(timeVal * 1000);
        const pad = (n) => n.toString().padStart(2, '0');
        if (detailChartRange === '1d') {
          timeString = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        } else {
          timeString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        }
      } else if (typeof timeVal === 'object') {
        timeString = `${timeVal.year}-${String(timeVal.month).padStart(2, '0')}-${String(timeVal.day).padStart(2, '0')}`;
      } else {
        timeString = String(timeVal);
      }

      if (isUs) {
        subEl.innerHTML = `<span style="color:var(--accent); font-weight:700;">[조회 시점: ${timeString}]</span> · 원화 환산 ₩${Math.round(val * usdKrwRate).toLocaleString()}`;
      } else {
        subEl.innerHTML = `<span style="color:var(--accent); font-weight:700;">[조회 시점: ${timeString}]</span>`;
      }
    }
  });
}

// ── 실시간 고래 거래 (Whale Alerts) 시뮬레이터 ──
let whaleAlerts = [];

function startWhaleTradesSimulation(stock) {
  stopWhaleTradesSimulation();
  
  const container = document.getElementById('whaleAlertStream');
  if (!container) return;
  container.innerHTML = '';
  whaleAlerts = [];
  
  // 오늘의 매집 지수 랜덤 생성
  const buyAccumulation = 55 + Math.floor(Math.random() * 40); // 55% ~ 95%
  document.getElementById('detailWhaleIndex').textContent = `매집 지수: ${buyAccumulation}%`;
  
  const isUs = stock.market === 'us';
  const quote = liveQuotes[stock.id] || { price: stock.market === 'kr' ? 70000 : 150 };
  const basePrice = quote.price;

  // 3개 초기 고래 알림 준비
  for (let i = 0; i < 3; i++) {
    whaleAlerts.push(generateFakeWhaleTrade(stock, basePrice, isUs));
  }
  renderWhaleAlerts();

  // 6초 간격으로 신규 알림 추가하고 스크롤
  whaleInterval = setInterval(() => {
    const nextAlert = generateFakeWhaleTrade(stock, basePrice, isUs);
    whaleAlerts.push(nextAlert);
    if (whaleAlerts.length > 3) {
      whaleAlerts.shift(); // 3개 유지
    }
    renderWhaleAlerts(true);
  }, 6000);
}

function generateFakeWhaleTrade(stock, basePrice, isUs) {
  const pad = (n) => n.toString().padStart(2, '0');
  const now = new Date();
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  const isBuy = Math.random() > 0.45; // 55% buy chance
  const typeText = isBuy ? '매수체결' : '매도체결';
  const typeClass = isBuy ? 'up' : 'down';
  
  let shares = 0;
  let valKrw = 0;
  if (stock.market === 'kr') {
    shares = (10 + Math.floor(Math.random() * 90)) * 500; // 5k to 50k shares
    valKrw = shares * basePrice;
  } else {
    shares = (1 + Math.floor(Math.random() * 19)) * 500; // 500 to 10k shares
    valKrw = shares * basePrice * usdKrwRate;
  }
  
  const valText = valKrw >= 100000000
    ? `₩${(valKrw / 100000000).toFixed(1)}억`
    : `₩${Math.round(valKrw / 10000).toLocaleString()}만`;

  return {
    time: timeStr,
    shares: shares.toLocaleString(),
    valText: valText,
    typeText: typeText,
    typeClass: typeClass
  };
}

function renderWhaleAlerts(animate = false) {
  const container = document.getElementById('whaleAlertStream');
  if (!container) return;
  
  const rowsHtml = whaleAlerts.map((alert, idx) => {
    const animClass = (animate && idx === whaleAlerts.length - 1) ? 'whale-row' : 'whale-row';
    return `
      <div class="${animClass}">
        <span style="color:var(--text-muted); font-size:10.5px;">${alert.time}</span>
        <span style="color:var(--text); flex:1; margin-left:10px;">${alert.shares}주 (${alert.valText})</span>
        <span class="${alert.typeClass}">${alert.typeText} 🐳</span>
      </div>
    `;
  }).join('');

  container.innerHTML = rowsHtml;
}

function stopWhaleTradesSimulation() {
  if (whaleInterval) {
    clearInterval(whaleInterval);
    whaleInterval = null;
  }
}
