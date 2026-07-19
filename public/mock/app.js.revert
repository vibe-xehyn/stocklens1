'use strict';

let S = {
  accounts:[], acctType:'realtime', acctId:null, acct:null, portfolio:null, usdkrw:1350,
  detailStock:null, detailRange:'1d', detailChart:null, detailSeries:null,
  tradeSide:'buy', tradeType:'limit',
  fxDir:'krw2usd', rankMarket:'kr', historyFilter:'all',
  chartInst:null, analyticsChart:null, range:'1m',
  poll:null, sse:null, view:'home'
};

const uid = (()=>{
  let c=document.cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith('sessionToken='));
  if(c) return decodeURIComponent(c.split('=')[1]);
  let g=localStorage.getItem('mock_guest_id');
  if(!g){g='g_'+Date.now()+Math.random().toString(36).slice(2);localStorage.setItem('mock_guest_id',g);}
  return g;
})();

async function api(p,o={}){
  const r=await fetch(p,{headers:{'Content-Type':'application/json'},...o});
  const d=await r.json();
  if(!r.ok&&d.error) throw new Error(d.error);
  return d;
}

function toast(m){
  const c=document.getElementById('toastContainer');
  const e=document.createElement('div');e.className='toast';e.textContent=m;c.appendChild(e);
  setTimeout(()=>{e.style.opacity='0';e.style.transition='opacity 0.3s';setTimeout(()=>e.remove(),300);},2000);
}

function goToDashboard(){window.location.href='/';}

// Boot
(async function boot(){
  await loadAccts();
  if(!S.accounts.length){
    await api('/api/trade/accounts',{method:'POST',body:JSON.stringify({type:'realtime',initialCapital:50000000})});
    await api('/api/trade/accounts',{method:'POST',body:JSON.stringify({type:'virtual',initialCapital:50000000})});
    await loadAccts();
  }
  autoSel();showApp();switchView('home','snav');loadAll();startPoll();loadIndices();loadRanks();
})();

async function loadAccts(){try{S.accounts=await api('/api/trade/accounts');}catch{S.accounts=[];}}
function autoSel(){
  let o=S.accounts.filter(a=>a.type===S.acctType);
  if(o.length){S.acctId=o[0].id;S.acct=o[0];}else if(S.accounts.length){S.acctId=S.accounts[0].id;S.acct=S.accounts[0];S.acctType=S.accounts[0].type;}
}
function showApp(){document.getElementById('appMain').style.display='flex';}

// View switching
function switchView(v,src){
  S.view=v;
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  document.getElementById('view'+v.charAt(0).toUpperCase()+v.slice(1)).classList.add('active');
  if(src==='snav'){
    document.querySelectorAll('.snav-item').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.snav-item[data-view="${v}"]`).classList.add('active');
  }
  if(v==='home') loadAll();
  if(v==='discover'){loadIndices();loadRanks();}
  if(v==='history') loadHistoryView();
  if(v==='analytics') loadAnalytics();
  if(v!=='detail'){document.getElementById('rightPanelEmpty').style.display='';document.getElementById('rightPanelActive').style.display='none';}
}

// Account
async function loadAll(){
  if(!S.acctId)return;
  try{S.portfolio=await api('/api/trade/portfolio/'+S.acctId);S.usdkrw=S.portfolio.usdkrw||1350;}catch{S.portfolio=null;}
  renderHome();renderSidebar();
}
function startPoll(){
  if(S.poll)clearInterval(S.poll);
  S.poll=setInterval(async()=>{if(!S.acctId)return;try{S.portfolio=await api('/api/trade/portfolio/'+S.acctId);S.usdkrw=S.portfolio.usdkrw||1350;}catch{}renderHome();renderSidebar();},5000);
}

function renderSidebar(){
  const p=S.portfolio;if(!p)return;
  document.getElementById('sKrw').textContent=Math.round(p.krwBalance).toLocaleString()+'원';
  document.getElementById('sUsd').textContent='$'+(p.usdBalance||0).toFixed(2);
}

// Home view
function renderHome(){
  const p=S.portfolio;if(!p)return;
  document.getElementById('totalAsset').textContent=Math.round(p.totalAssetKRW).toLocaleString()+'원';
  const cls=p.totalProfitPct>=0?'up':'down';
  document.getElementById('totalProfit').innerHTML=`<span class="ta-profit ${cls}">${p.totalProfit>=0?'+':''}${Math.round(p.totalProfit).toLocaleString()}원</span>`;
  document.getElementById('totalRate').innerHTML=`<span class="ta-rate ${cls}">${p.totalProfitPct>=0?'+':''}${p.totalProfitPct.toFixed(2)}%</span>`;
  // daily (simulate)
  const daily=-4566, dailyPct=-0.2, dCls=daily>=0?'up':'down';
  document.getElementById('dailyChange').innerHTML=`<span class="ta-daily ${dCls}">오늘 ${daily>=0?'+':''}${daily.toLocaleString()}원 (${dailyPct}%)</span>`;
  renderHomeChart();
  renderHoldings();
}

function switchHomeRange(r,btn){
  S.range=r;
  document.querySelectorAll('#viewHome .r-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderHomeChart();
}
function renderHomeChart(){
  const p=S.portfolio;const cvs=document.getElementById('homeProfitChart');
  if(!cvs||!p)return;
  if(S.chartInst)S.chartInst.destroy();
  const tot=p.totalAssetKRW,init=p.acct?.initialCapital||tot-p.totalProfit;
  const pts=genData(init,tot,S.range);
  S.chartInst=new Chart(cvs.getContext('2d'),{
    type:'line',data:{labels:pts.labels,datasets:[{data:pts.data,borderColor:tot>=init?'#F04452':'#1570EF',backgroundColor:tot>=init?'rgba(240,68,82,0.03)':'rgba(21,112,239,0.03)',fill:true,tension:0.3,borderWidth:1.5,pointRadius:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}}
  });
}
function genData(init,tot,r){
  const c={'1m':30,'3m':90,'1y':365,'all':730}[r]||30;
  const l=[],d=[];const df=tot-init;
  for(let i=0;i<=c;i++){l.push(i);d.push(Math.max(0,init+df*(i/c)+(i===c?0:(Math.random()-0.45)*Math.abs(df)*0.06)));}
  return{labels:l,data:d};
}

function renderHoldings(){
  const list=document.getElementById('holdingsList');
  const h=S.portfolio?.holdings||[];
  if(!h.length){list.innerHTML='<div class="empty">보유 종목이 없습니다.</div>';return;}
  list.innerHTML=h.map(x=>{
    const cls=x.profitPct>=0?'up':'down';const sym=x.market==='kr'?'':(x.currency==='USD'?'$':'$');
    return`<div class="holding-card" onclick="openDetail('${x.ticker}','${x.market}','${(x.name||x.ticker).replace(/'/g,"\\'")}')">
      <div class="hc-left"><div class="hc-symbol ${x.market}">${x.ticker.slice(0,2)}</div><div class="hc-info"><div class="hc-ticker">${x.ticker}</div><div class="hc-qty">${x.quantity}주</div></div></div>
      <div class="hc-right"><div class="hc-eval">${sym}${x.evaluationValue.toLocaleString(undefined,{maximumFractionDigits:2})}</div><div class="hc-profit ${cls}">${x.profitPct>=0?'+':''}${x.profitPct.toFixed(2)}%</div></div>
    </div>`;
  }).join('');
}

// Discover
async function loadIndices(){
  try{
    const d=await api('/api/indices');
    document.getElementById('indicesGrid').innerHTML=d.filter(m=>m&&m.name).slice(0,6).map(m=>{
      const cls=m.change>=0?'up':'down';
      return`<div class="index-card"><div class="ic-name">${m.name}</div><div class="ic-value">${m.value.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div class="ic-change ${cls}">${m.change>=0?'+':''}${m.change.toFixed(2)}%</div></div>`;
    }).join('');
  }catch{}
}
function switchRankMarket(mkt,btn){
  S.rankMarket=mkt;
  document.querySelectorAll('.seg-sm').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadRanks();
}
async function loadRanks(){
  try{
    const r=await api('/api/search?q=&market='+S.rankMarket);
    const el=document.getElementById('rankTable');
    el.innerHTML=r.slice(0,10).map((s,i)=>{
      const cls=(s.changePct||0)>=0?'up':'down';
      return`<div class="rank-row" onclick="openDetail('${s.ticker}','${s.market}','${(s.name||s.ticker).replace(/'/g,"\\'")}')">
        <span class="rank-num">${i+1}</span><span class="rank-ticker">${s.ticker}</span><span class="rank-name">${s.name||''}</span>
        <span class="rank-price">${s.price?.toLocaleString()||'-'}</span><span class="rank-chg ${cls}">${(s.changePct||0)>=0?'+':''}${(s.changePct||0).toFixed(2)}%</span>
      </div>`;
    }).join('');
  }catch{}
}

// Detail
async function openDetail(ticker,market,name){
  S.detailStock={ticker,market,name};
  switchView('detail','snav');
  document.getElementById('detailName').textContent=name;
  document.getElementById('detailTicker').textContent=ticker;
  try{const q=await api('/api/quote?symbol='+ticker+'&market='+market);S.detailStock.price=q.price||50000;S.detailStock.changePct=q.changePct||0;}catch{S.detailStock.price=market==='kr'?50000:150;S.detailStock.changePct=0;}
  const sym=market==='kr'?'':(S.detailStock.currency==='USD'?'$':'$');
  const cls=S.detailStock.changePct>=0?'up':'down';
  document.getElementById('detailPrice').textContent=sym+S.detailStock.price.toLocaleString(undefined,{maximumFractionDigits:2});
  document.getElementById('detailPrice').className='detail-price '+cls;
  document.getElementById('detailChange').textContent=(S.detailStock.changePct>=0?'+':'')+S.detailStock.changePct.toFixed(2)+'%';
  document.getElementById('detailChange').className='detail-change '+cls;
  S.detailRange='1d';
  document.querySelectorAll('#viewDetail .r-tab').forEach(b=>b.classList.remove('active'));
  document.querySelector('#viewDetail .r-tab[data-range="1d"]').classList.add('active');
  loadDetailChart();
  loadOrderbook();
  // Show right panel
  document.getElementById('rightPanelEmpty').style.display='none';
  document.getElementById('rightPanelActive').style.display='';
  document.getElementById('tpPrice').value=S.detailStock.price;
  updateTradeSummary();
}
function switchDetailSub(sub,btn){
  document.querySelectorAll('.dsub').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('detailChartArea').style.display=sub==='chart'?'':'none';
  document.getElementById('detailOrderbookArea').style.display=sub==='orderbook'?'':'none';
}
function switchDetailRange(r,btn){
  S.detailRange=r;
  document.querySelectorAll('#viewDetail .r-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadDetailChart();
}
async function loadDetailChart(){
  const w=document.getElementById('detailChartWrap');
  if(S.detailChart){S.detailChart.remove();S.detailChart=null;S.detailSeries=null;}
  w.innerHTML='';
  try{
    const c=await api('/api/chart?symbol='+S.detailStock.ticker+'&range='+S.detailRange+'&market='+S.detailStock.market);
    const up=S.detailStock.changePct>=0;
    S.detailChart=LightweightCharts.createChart(w,{width:w.clientWidth,height:280,layout:{background:{color:'transparent'},textColor:'#8B95A1',fontSize:10},grid:{vertLines:{visible:false},horzLines:{visible:false}},rightPriceScale:{borderVisible:false},timeScale:{borderVisible:false,timeVisible:false},crosshair:{mode:0},handleScroll:{vertTouchDrag:false}});
    S.detailSeries=S.detailChart.addAreaSeries({lineColor:up?'#F04452':'#1570EF',topColor:up?'rgba(240,68,82,0.1)':'rgba(21,112,239,0.1)',bottomColor:'rgba(0,0,0,0)',lineWidth:2,priceLineVisible:false});
    const d=(c.ohlcv||[]).filter(x=>x.close!=null).map(x=>({time:x.time,value:x.close}));
    if(d.length)S.detailSeries.setData(d);
  }catch{}
}

// Orderbook in right panel
async function loadOrderbook(){
  const el=document.getElementById('orderbookPanel');
  try{
    const ob=await api('/api/trade/orderbook?ticker='+S.detailStock.ticker+'&market='+S.detailStock.market);
    const maxV=Math.max(...ob.asks.map(a=>a.volume),...ob.bids.map(b=>b.volume),1);
    el.innerHTML=`
      ${[...ob.asks].reverse().map(a=>`<div class="ob-row ask" onclick="document.getElementById('tpPrice').value=${a.price};updateTradeSummary()"><span class="ob-price">${a.price.toLocaleString()}</span><div class="ob-bar-wrap"><div class="ob-bar ask" style="width:${(a.volume/maxV*100)}%"></div></div><span class="ob-vol">${a.volume}</span></div>`).join('')}
      <div class="ob-center">${ob.price.toLocaleString()}</div>
      ${ob.bids.map(b=>`<div class="ob-row bid" onclick="document.getElementById('tpPrice').value=${b.price};updateTradeSummary()"><span class="ob-price">${b.price.toLocaleString()}</span><div class="ob-bar-wrap"><div class="ob-bar bid" style="width:${(b.volume/maxV*100)}%"></div></div><span class="ob-vol">${b.volume}</span></div>`).join('')}
      <div class="ob-strength">체결강도 ${((ob.asks[0]?.volume||1)/(ob.bids[0]?.volume||1)*100).toFixed(1)}%</div>`;
  }catch{}
}

// Trading
function setTradeSide(side,btn){
  S.tradeSide=side;
  document.querySelectorAll('.tp-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active','buy','sell');
  btn.className='tp-tab active '+side;
  document.getElementById('tpSubmitBtn').textContent=side==='buy'?'구매하기':'판매하기';
  document.getElementById('tpSubmitBtn').className='tp-submit-btn '+side;
  updateTradeSummary();
}
function setTradeType(type,btn){
  S.tradeType=type;
  document.querySelectorAll('.tp-seg').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tpPriceField').style.display=type==='limit'?'':'none';
  updateTradeSummary();
}
function setTradeQtyPct(pct){
  const p=S.portfolio;if(!p||!S.detailStock)return;
  const price=parseFloat((document.getElementById('tpPrice').value||'').replace(/,/g,''))||S.detailStock.price;
  if(price<=0)return;
  let max=0;
  if(S.tradeSide==='buy'){max=Math.floor((S.detailStock.market==='kr'?p.krwBalance:(p.usdBalance||0)*S.usdkrw)/price*(pct/100));}
  else{const h=p.holdings.find(h=>h.ticker===S.detailStock.ticker);max=h?Math.floor(h.quantity*(pct/100)):0;}
  document.getElementById('tpQty').value=Math.max(1,max);
  updateTradeSummary();
}
function updateTradeSummary(){
  const price=parseFloat((document.getElementById('tpPrice').value||'').replace(/,/g,''))||(S.detailStock?.price||0);
  const qty=parseInt((document.getElementById('tpQty').value||'').replace(/,/g,''))||0;
  const p=S.portfolio;
  if(!S.detailStock||price<=0||qty<=0||!p){
    document.getElementById('tradeSummary').style.display='none';return;
  }
  document.getElementById('tradeSummary').style.display='';
  const tv=price*qty;const isKR=S.detailStock.market==='kr';const sym=isKR?'':(S.detailStock.currency==='USD'?'$':'$');
  document.getElementById('tpAvail').textContent=sym+(isKR?Math.round(p.krwBalance).toLocaleString():((p.usdBalance||0)).toFixed(2))+(isKR?'원':'');
  document.getElementById('tpTotal').textContent=sym+tv.toLocaleString()+(isKR?'원':'');
}
async function executeTrade(){
  if(!S.detailStock){toast('종목을 선택해주세요.');return;}
  const price=parseFloat((document.getElementById('tpPrice').value||'').replace(/,/g,''))||S.detailStock.price;
  const qty=parseInt((document.getElementById('tpQty').value||'').replace(/,/g,''));
  if(!price||!qty||qty<=0){toast('가격과 수량을 입력해주세요.');return;}
  const btn=document.getElementById('tpSubmitBtn');btn.disabled=true;btn.textContent='처리 중...';
  try{
    const r=await api('/api/trade/order',{method:'POST',body:JSON.stringify({accountId:S.acctId,ticker:S.detailStock.ticker,market:S.detailStock.market,type:'stock',side:S.tradeSide,price,quantity:qty,mode:S.acct?.type||'realtime'})});
    if(r.ok){toast(S.detailStock.ticker+' '+qty+'주 '+(S.tradeSide==='buy'?'매수':'매도')+' '+(r.executed?'체결 완료':'접수 완료'));loadAll();}
  }catch(e){toast(e.message);}
  btn.disabled=false;btn.textContent=S.tradeSide==='buy'?'구매하기':'판매하기';
}

// History
async function loadHistoryView(){
  const el=document.getElementById('historyList');
  try{
    const h=await api('/api/trade/history/'+S.acctId);
    if(!h.length){el.innerHTML='<div class="empty">거래 내역이 없습니다.</div>';return;}
    let filtered=h;if(S.historyFilter!=='all')filtered=h.filter(x=>x.market===S.historyFilter||(S.historyFilter==='kr'&&x.ticker.match(/^\d/)));
    if(!filtered.length){el.innerHTML='<div class="empty">해당 필터의 내역이 없습니다.</div>';return;}
    el.innerHTML=filtered.slice(0,20).map(x=>{
      const b=x.side==='buy',t=new Date(x.timestamp).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
      return`<div class="hist-item"><div class="hist-dot ${b?'buy':'sell'}">${b?'B':'S'}</div><div class="hist-info"><div class="hist-ticker">${x.ticker} ${b?'매수':'매도'}</div><div class="hist-detail">${x.quantity}주 ${x.price.toLocaleString()}원</div></div><div class="hist-end"><div class="hist-amt">${b?'-':'+'}${Math.abs(x.amount).toLocaleString()}원</div><div class="hist-time">${t}</div></div></div>`;
    }).join('');
  }catch{el.innerHTML='<div class="empty">불러올 수 없습니다</div>';}
}
function switchHistoryFilter(f,btn){
  S.historyFilter=f;
  document.querySelectorAll('.seg-sm').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadHistoryView();
}

// Analytics
async function loadAnalytics(){
  try{
    const h=await api('/api/trade/history/'+S.acctId);
    const divs=await api('/api/trade/dividends/'+S.acctId);
    const sellProfit=0;const divTotal=divs.reduce((s,d)=>s+(d.currency==='KRW'?d.amount:d.amount*S.usdkrw),0);
    const total=Math.round(sellProfit+divTotal);
    document.getElementById('analyticsMonth').textContent='실현수익: +'+total.toLocaleString()+'원';
    document.getElementById('analyticsDetail').innerHTML=`
      <div class="ad-row"><span class="ad-label">판매수익</span><span class="ad-value">${sellProfit.toLocaleString()}원</span></div>
      <div class="ad-row"><span class="ad-label">배당금</span><span class="ad-value positive">+${Math.round(divTotal).toLocaleString()}원</span></div>
      <div class="ad-row"><span class="ad-label">채권 이자</span><span class="ad-value">0원</span></div>`;
    // chart
    const cvs=document.getElementById('analyticsChart');
    if(S.analyticsChart)S.analyticsChart.destroy();
    if(cvs&&h.length){const pts=genData(0,total,'1m');S.analyticsChart=new Chart(cvs.getContext('2d'),{type:'line',data:{labels:pts.labels,datasets:[{data:pts.data,borderColor:'#1570EF',backgroundColor:'rgba(21,112,239,0.03)',fill:true,tension:0.3,borderWidth:1.5,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}});}
  }catch{}
}
function switchAnalyticsRange(r,btn){
  document.querySelectorAll('#viewAnalytics .r-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  loadAnalytics();
}

// Sidebar search
let _st=null;
async function onSidebarSearch(q){
  clearTimeout(_st);
  const res=document.getElementById('sidebarSearchResults');
  if(!q.trim()){res.classList.remove('open');return;}
  _st=setTimeout(async()=>{
    try{
      const r=await api('/api/search?q='+encodeURIComponent(q.trim())+'&market=all');
      res.innerHTML=r.slice(0,8).map(s=>`<div class="ssr-item" onclick="openDetail('${s.ticker}','${s.market}','${s.name.replace(/'/g,"\\'")}')">${s.ticker} - ${s.name}</div>`).join('');
      res.classList.add('open');
    }catch{}
  },200);
}
document.addEventListener('click',e=>{if(!e.target.closest('.sidebar-search'))document.getElementById('sidebarSearchResults').classList.remove('open');});

// Account sheets
function openAccountSheet(){
  document.getElementById('acctOverlay').classList.add('open');
  document.getElementById('acctSheet').classList.add('open');
  renderAcctSheet();
}
function closeAccountSheet(){document.getElementById('acctOverlay').classList.remove('open');document.getElementById('acctSheet').classList.remove('open');}
function renderAcctSheet(){
  document.querySelectorAll('.atype-btn').forEach(b=>b.classList.toggle('active',b.dataset.type===S.acctType));
  const list=document.getElementById('acctSheetList');
  const ofType=S.accounts.filter(a=>a.type===S.acctType);
  list.innerHTML=ofType.map(a=>`<div class="acct-item2 ${a.id===S.acctId?'active':''}" onclick="switchAcct('${a.id}')"><span class="acct-item2-name">${a.label||'계좌'+a.id.slice(-4)}</span><span class="acct-item2-cap">${(a.initialCapital/10000).toFixed(0)}만원</span></div>`).join('');
}
async function switchAcct(id){S.acctId=id;S.acct=S.accounts.find(a=>a.id===id);closeAccountSheet();loadAll();startPoll();}
async function switchAcctType(type,btn){
  S.acctType=type;document.querySelectorAll('.atype-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  const o=S.accounts.filter(a=>a.type===type);if(o.length){S.acctId=o[0].id;S.acct=o[0];}
  renderAcctSheet();loadAll();startPoll();
}
function openNewAcctSheet(){document.getElementById('newAcctOverlay').classList.add('open');document.getElementById('newAcctSheet').classList.add('open');}
function closeNewAcctSheet(){document.getElementById('newAcctOverlay').classList.remove('open');document.getElementById('newAcctSheet').classList.remove('open');}
async function createNewAccount(){
  const tBtn=document.querySelector('#newAcctSheet .atype-btn.active');
  const cBtn=document.querySelector('#newAcctSheet .cap-btn.active');
  const type=tBtn?.dataset.mtype||'realtime';
  const cap=parseInt(cBtn?.dataset.cap||50000000);
  try{const r=await api('/api/trade/accounts',{method:'POST',body:JSON.stringify({type,initialCapital:cap})});await loadAccts();S.acctType=type;S.acctId=r.account.id;S.acct=r.account;closeNewAcctSheet();closeAccountSheet();loadAll();startPoll();toast('계좌 개설 완료');}catch(e){toast(e.message);}
}

// FX
function openFXSheet(){document.getElementById('fxOverlay').classList.add('open');document.getElementById('fxSheet').classList.add('open');document.getElementById('fxRateDisp').textContent=S.usdkrw.toLocaleString();document.getElementById('fxAmount').value='';updateFXPreview();}
function closeFXSheet(){document.getElementById('fxOverlay').classList.remove('open');document.getElementById('fxSheet').classList.remove('open');}
function setFXDir(dir,btn){S.fxDir=dir;document.querySelectorAll('#fxSheet .atype-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.getElementById('fxLabel').textContent=dir==='krw2usd'?'원화 금액':'달러 금액';updateFXPreview();}
function updateFXPreview(){
  const r=S.usdkrw;const s=0.005;const el=document.getElementById('fxPreview');
  if(S.fxDir==='krw2usd'){const krw=parseInt((document.getElementById('fxAmount').value||'').replace(/,/g,''))||0;el.textContent=krw<=0?'금액을 입력하세요':krw.toLocaleString()+'원 -> $'+(krw/(r*(1+s))).toFixed(2);}
  else{const usd=parseFloat((document.getElementById('fxAmount').value||'').replace(/,/g,''))||0;el.textContent=usd<=0?'금액을 입력하세요':'$'+usd.toFixed(2)+' -> '+Math.round(usd*r*(1-s)).toLocaleString()+'원';}
}
function executeFX(){
  const p=S.portfolio;if(!p)return;const r=S.usdkrw;const s=0.005;
  if(S.fxDir==='krw2usd'){const krw=parseInt((document.getElementById('fxAmount').value||'').replace(/,/g,''))||0;if(krw<=0||p.krwBalance<krw){toast('잔액 부족');return;}p.krwBalance-=krw;p.usdBalance=(p.usdBalance||0)+krw/(r*(1+s));toast(krw.toLocaleString()+'원 환전 완료');}
  else{const usd=parseFloat((document.getElementById('fxAmount').value||'').replace(/,/g,''))||0;if(usd<=0||(p.usdBalance||0)<usd){toast('잔액 부족');return;}p.usdBalance-=usd;p.krwBalance+=usd*r*(1-s);toast('$'+usd.toFixed(2)+' 환전 완료');}
  closeFXSheet();renderHome();renderSidebar();
}