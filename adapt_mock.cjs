const fs = require('fs');
let code = fs.readFileSync('public/mock/index.html', 'utf8');

// Title and Banner
code = code.replace(/<title>StockLens - 주식 투자 대시보드<\/title>/, '<title>StockLens - 모의투자 (Premium)<\/title>');
code = code.replace(/<span class="logo">Stock<span>Lens<\/span><\/span>/, '<span class="logo">Stock<span>Lens</span> <span style="color:var(--text);font-weight:700;">모의투자</span></span>');
code = code.replace(/<div id="mockBannerContainer" style="margin-top: 24px;">/, '<div id="mockBannerContainer" style="display:none;">');

// Add Mock Capital Display to Portfolio Card
code = code.replace(
  /<div style="font-size:11px;color:var\(--muted\)">총 손익 \(원화 환산\)<\/div>/,
  `<div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:11px;color:var(--muted)">총 손익 (원화 환산)</div>
        <div style="font-size:11px;color:var(--accent);font-weight:700;">예수금: ₩<span id="mockCapitalDisplay">0</span></div>
      </div>`
);

// Inject logic at the end of the file before </body>
const injectedLogic = `
<script>
// --- MOCK INVESTMENT ENGINE OVERRIDES ---
window.addEventListener('DOMContentLoaded', () => {
  // Sync portfolio from mockHoldings
  function syncFromMockHoldings() {
    let mockHoldings = JSON.parse(localStorage.getItem('stocklens_mock_holdings') || '{}');
    portfolio = Object.keys(mockHoldings).map(id => {
      let m = mockHoldings[id];
      return {
        id: id,
        ticker: id.toUpperCase(),
        name: m.name,
        market: /^[0-9]+$/.test(id) ? 'kr' : 'us',
        qty: m.qty,
        buyPrice: m.avgPrice
      };
    }).filter(p => p.qty > 0);
  }
  syncFromMockHoldings();

  // Sync capital
  function updateCapitalDisplay() {
    let cap = parseFloat(localStorage.getItem('stocklens_mock_capital') || '10000000');
    let el = document.getElementById('mockCapitalDisplay');
    if (el) el.textContent = Math.floor(cap).toLocaleString();
  }
  
  // Override savePortfolio
  window.savePortfolio = function() {
    let mockHoldings = {};
    portfolio.forEach(p => {
      if (p.qty > 0) mockHoldings[p.id] = { name: p.name, qty: p.qty, avgPrice: p.buyPrice };
    });
    localStorage.setItem('stocklens_mock_holdings', JSON.stringify(mockHoldings));
    
    // Original sync to UI
    if(window.updateGlobalPortfolio) updateGlobalPortfolio();
    if(window.renderHome) renderHome({skipFetch:true});
    updateCapitalDisplay();
  };

  // Override buyStock
  window.buyStock = function() {
    const price = parseFloat(document.getElementById('portfolioPrice').value);
    const qty = parseFloat(document.getElementById('portfolioQty').value);
    if (!price || !qty) { alert('단가와 수량을 입력하세요.'); return; }
    
    let capital = parseFloat(localStorage.getItem('stocklens_mock_capital') || '10000000');
    const isUs = _portfolioDef.market === 'us';
    const usdkrw = ratesCache?.usdkrw?.value || 1350;
    const cost = isUs ? price * qty * usdkrw : price * qty;
    
    if (capital < cost) { alert('예수금이 부족합니다! (현재: ' + Math.floor(capital).toLocaleString() + '원)'); return; }
    capital -= cost;
    localStorage.setItem('stocklens_mock_capital', capital.toString());

    const idx = portfolio.findIndex(p => p.id === _portfolioDef.id);
    if (idx !== -1) {
      const oldQty = portfolio[idx].qty;
      const oldPrice = portfolio[idx].buyPrice;
      portfolio[idx].qty = oldQty + qty;
      portfolio[idx].buyPrice = ((oldQty * oldPrice) + (qty * price)) / portfolio[idx].qty;
    } else {
      portfolio.push({ id: _portfolioDef.id, ticker: _portfolioDef.ticker, name: _portfolioDef.name, market: _portfolioDef.market, qty, buyPrice: price });
    }
    
    // Save history
    let mockHistory = JSON.parse(localStorage.getItem('stocklens_mock_history') || '[]');
    mockHistory.push({ time: Date.now(), id: _portfolioDef.id, name: _portfolioDef.name, type: 'buy', price, qty });
    localStorage.setItem('stocklens_mock_history', JSON.stringify(mockHistory));

    savePortfolio();
    document.getElementById('portfolioModal').classList.remove('open');
  };

  // Override sellStock
  window.sellStock = function() {
    const price = parseFloat(document.getElementById('portfolioPrice').value);
    const qty = parseFloat(document.getElementById('portfolioQty').value);
    if (!price || !qty) { alert('단가와 수량을 입력하세요.'); return; }
    
    const idx = portfolio.findIndex(p => p.id === _portfolioDef.id);
    if (idx === -1 || portfolio[idx].qty < qty) { alert('보유 수량이 부족합니다.'); return; }
    
    let capital = parseFloat(localStorage.getItem('stocklens_mock_capital') || '10000000');
    const isUs = _portfolioDef.market === 'us';
    const usdkrw = ratesCache?.usdkrw?.value || 1350;
    const revenue = isUs ? price * qty * usdkrw : price * qty;
    capital += revenue;
    localStorage.setItem('stocklens_mock_capital', capital.toString());

    portfolio[idx].qty -= qty;
    if (portfolio[idx].qty <= 0) portfolio.splice(idx, 1);
    
    // Save history
    let mockHistory = JSON.parse(localStorage.getItem('stocklens_mock_history') || '[]');
    mockHistory.push({ time: Date.now(), id: _portfolioDef.id, name: _portfolioDef.name, type: 'sell', price, qty });
    localStorage.setItem('stocklens_mock_history', JSON.stringify(mockHistory));

    savePortfolio();
    document.getElementById('portfolioModal').classList.remove('open');
  };
  
  // Intercept renderHome to always show mock capital
  const origRenderHome = window.renderHome;
  window.renderHome = async function(opts) {
    if(origRenderHome) await origRenderHome(opts);
    updateCapitalDisplay();
  };
  
  // Hide real portfolio fetch
  window.loadPortfolio = async function() { syncFromMockHoldings(); updateCapitalDisplay(); };
  
});
</script>
`;

code = code.replace(/<\/body>/, injectedLogic + '\n</body>');
fs.writeFileSync('public/mock/index.html', code);
