import sys
import re

with open("public/index.html", "r", encoding="utf-8") as f:
    code = f.read()

pattern = r"function renderMacroDashboard\(m\) \{[\s\S]*?return `<div class=\"card\"[^>]*>[\s\S]*?<\/div>`;\n\}"

replacement = """function renderMacroDashboard(m) {
  if (!m || !Object.keys(m).length) {
    return `<div style="background:#F9F9F9; border-radius:16px; padding:24px; margin-bottom:24px;">
      <div style="font-size:18px; font-weight:800; color:#111; margin-bottom:16px;">글로벌 매크로 대시보드</div>
      <div style="padding:20px;text-align:center;color:var(--muted);font-size:14px">데이터를 불러오는 중입니다...</div>
    </div>`;
  }
  const item = (label, key, isRate=false, prefix='', suffix='') => {
    const d = m[key]; if (!d) return '';
    const up = d.change >= 0;
    const chgColor = isRate ? (up?'#0284C7':'#F43F5E') : (up?'#F43F5E':'#0284C7');
    return `<div style="background:#ffffff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.02)">
      <div style="font-size:12px;color:#888;font-weight:700;margin-bottom:8px">${label}</div>
      <div style="font-weight:800;font-size:20px;color:#111">${prefix}${d.value.toLocaleString(undefined,{maximumFractionDigits:2})}${suffix}</div>
      <div style="font-size:14px;color:${chgColor};margin-top:6px;font-weight:600">${up?'▲':'▼'}${Math.abs(d.change).toFixed(2)}${isRate?'%p':'%'}</div>
    </div>`;
  };
  const vix = m.vix;
  const vixLevel = vix ? (vix.value < 15 ? {label:'극도 탐욕',color:'#F43F5E'} : vix.value < 20 ? {label:'탐욕',color:'#FF9F0A'} : vix.value < 30 ? {label:'중립',color:'#FF9F0A'} : vix.value < 40 ? {label:'공포',color:'#0284C7'} : {label:'극도 공포',color:'#0284C7'}) : null;

  return `<div style="background:#F9F9F9; border-radius:16px; padding:24px; margin-bottom:24px;">
    <div style="font-size:18px; font-weight:800; color:#111; margin-bottom:16px;">글로벌 매크로 대시보드</div>
    ${vixLevel && vix ? `<div style="display:flex;align-items:center;background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.02)">
      <div style="min-width:140px;border-right:1px solid #eee;padding-right:20px;margin-right:20px">
        <div style="font-size:12px;color:#888;font-weight:700">VIX 공포/탐욕 지수</div>
        <div style="font-size:28px;font-weight:800;color:${vixLevel.color};margin-top:4px">${vix.value.toFixed(2)}</div>
      </div>
      <div style="flex:1;">
        <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:10px">
          <div style="font-size:18px;font-weight:800;color:${vixLevel.color}">${vixLevel.label}</div>
          <div style="font-size:12px;color:#999">전일대비 ${vix.change>0?'+':''}${vix.change.toFixed(2)}</div>
        </div>
        <div style="background:#eee;border-radius:6px;height:8px;width:100%">
          <div style="width:${Math.min(100,vix.value/50*100)}%;background:${vixLevel.color};height:100%;border-radius:6px"></div>
        </div>
      </div>
    </div>` : ''}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
      ${item('S&P 500','sp500')}
      ${item('NASDAQ','nasdaq')}
      ${item('DOW','dow')}
      ${item('금','gold',false,'$')}
      ${item('WTI 원유','oil',false,'$')}
    </div>
  </div>`;
}"""

match = re.search(pattern, code)
if match:
    new_code = code[:match.start()] + replacement + code[match.end():]
    with open("public/index.html", "w", encoding="utf-8") as f:
        f.write(new_code)
    print("Replaced!")
else:
    print("Pattern not found!")
