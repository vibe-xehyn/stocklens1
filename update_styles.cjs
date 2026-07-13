const fs = require('fs');
let code = fs.readFileSync('public/mock/app.js', 'utf8');

// Replace renderHoldings list-item
code = code.replace(
  /<div class="list-item" onclick="openOrderSheet\('\${d.id}'\)">[\s\S]*?<\/div>\n    `;/,
  `<div onclick="openOrderSheet('${d.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;cursor:pointer;transition:background 0.15s;border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
        <div style="min-width:0;flex:1;margin-right:12px">
          <div style="font-weight:700;font-size:16px;color:var(--text);margin-bottom:2px">\${d.holding.name}</div>
          <div style="font-size:13px;color:var(--muted)">\${d.holding.qty}주 @ \${sym}\${(d.holding.avgPrice * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}\${unit}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-weight:700;font-size:16px;color:\${colorClass ? 'var(--' + (d.returnPct > 0 ? 'red' : 'blue') + ')' : 'var(--text)'}">\${topText}</div>
          <div style="font-size:13px;color:\${colorClass ? 'var(--' + (d.returnPct > 0 ? 'red' : 'blue') + ')' : 'var(--muted)'};font-weight:600">\${btmText}</div>
        </div>
      </div>
    \`;`
);

// Replace renderShopping list-item
code = code.replace(
  /<div class="list-item" onclick="openOrderSheet\('\${q.id}'\)">[\s\S]*?<\/div>\n    `;/,
  `<div onclick="openOrderSheet('\${q.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;cursor:pointer;transition:background 0.15s;border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
        <div style="min-width:0;flex:1;margin-right:12px">
          <div style="font-weight:700;font-size:16px;color:var(--text);margin-bottom:2px">\${q.name}</div>
          <div style="font-size:13px;color:var(--muted)">\${q.id}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-weight:700;font-size:16px;color:var(--text)">\${sym}\${(q.price * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}\${unit}</div>
          <div style="font-size:13px;color:\${colorClass ? 'var(--' + (q.changePct > 0 ? 'red' : 'blue') + ')' : 'var(--muted)'};font-weight:600">\${q.changePct > 0 ? '+' : ''}\${q.changePct.toFixed(2)}%</div>
        </div>
      </div>
    \`;`
);

// Replace renderSearchResults list-item
code = code.replace(
  /<div class="list-item" onclick="openOrderSheet\('\${q.id}'\)">[\s\S]*?<\/div>\n    `;/,
  `<div onclick="openOrderSheet('\${q.id}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;cursor:pointer;transition:background 0.15s;border-bottom:1px solid var(--border)" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
        <div style="min-width:0;flex:1;margin-right:12px">
          <div style="font-weight:700;font-size:16px;color:var(--text);margin-bottom:2px">\${q.name}</div>
          <div style="font-size:13px;color:var(--muted)">\${q.id}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-weight:700;font-size:16px;color:var(--text)">\${sym}\${(lq.price * rate).toLocaleString(undefined, {maximumFractionDigits: isUsd?2:0})}\${unit}</div>
          <div style="font-size:13px;color:\${colorClass ? 'var(--' + (lq.changePct > 0 ? 'red' : 'blue') + ')' : 'var(--muted)'};font-weight:600">\${lq.changePct > 0 ? '+' : ''}\${lq.changePct.toFixed(2)}%</div>
        </div>
      </div>
    \`;`
);

fs.writeFileSync('public/mock/app.js', code);
