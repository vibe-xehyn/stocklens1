"// ESC í¤ë¡ ëª¨ë¬ ë«ê¸°
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePortfolioModal();
    closeAlertModal();
    closeMobileSearch();
    closeAuthModal();
  }
  if (e.key === 'Enter') {
    if (document.getElementById('portfolioModal').classList.contains('open')) confirmPortfolioAdd();
    if (document.getElementById('alertModal').classList.contains('open')) confirmAlertAdd();
    if (document.getElementById('authModal').classList.contains('open')) handleAuthSubmit();
  }
});

function closeMobileSearch() {
  document.getElementById('mobileSearchDrawer').classList.remove('open');
  toggleBodyScroll(false);
  document.getElementById('mobileSearchInput').value = '';
  document.getElementById('mobileSearchResults').innerHTML = '';
  document.getElementById('bnavSearch').classList.remove('active');
  document.getElementById('bnavHome').classList.add('active');
  _mobileTab = 'home';
}

// ââ User Authentication & Data Syncing ââââââââââââââââââââââââââââââââââââââ
let currentUser = null;
let trendlines = [];
let authMode = 'login'; // 'login' | 'register'

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.loggedIn) {
      currentUser = data.user;
      await loadUserData();
    } else {
      currentUser = null;
      loadLocalData();
    }
  } catch (e) {
    currentUser = null;
    loadLocalData();
  }
  renderAuthHeader();
}

function loadLocalData() {
  watchlist = new Set(JSON.parse(localStorage.getItem('watchlist') || '[]'));
  portfolio = JSON.parse(localStorage.getItem('portfolio') || '[]');
  priceAlerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
  trendlines = JSON.parse(localStorage.getItem('trendlines') || '[]');
}

async function loadUserData() {
  try {
    const res = await fetch('/api/user/data');
    if (res.ok) {
      const 
<truncated 6410 bytes>