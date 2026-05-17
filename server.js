import express from 'express';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import OpenAI from 'openai';

// Load .env file if present
try {
  const env = readFileSync(new URL('.env', import.meta.url), 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch {}

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const getGrok = () => new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

app.use(express.static(join(__dirname, 'public')));
app.use((_, res, next) => { res.header('Access-Control-Allow-Origin', '*'); next(); });

// ── Cache ─────────────────────────────────────────────────────────────────────
const _c = new Map();
const getC = k => { const e=_c.get(k); if(!e||Date.now()>e.exp){_c.delete(k);return null;} return e.d; };
const setC = (k,d,ms) => { _c.set(k,{d,exp:Date.now()+ms}); return d; };
const cached = async (k,ms,fn) => getC(k) ?? setC(k, await fn(), ms);

// ── Node fetch (NAVER, Stooq) ─────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
async function fetchJSON(url, h={}) {
  const r = await fetch(url, { headers:{'User-Agent':UA,Accept:'application/json',...h}, signal:AbortSignal.timeout(9000) });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function fetchText(url) {
  const r = await fetch(url, { headers:{'User-Agent':UA}, signal:AbortSignal.timeout(9000) });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

// ── yfinance Python helper (병렬 풀, 최대 4개 동시) ────────────────────────────
let _yfActive = 0;
const _yfQueue = [];
const YF_CONCURRENCY = 4;
const YF_GAP = 300; // ms between starts

function yfRun(script) {
  return new Promise((resolve, reject) => {
    _yfQueue.push({ script, resolve, reject });
    _yfDrain();
  });
}

function _yfDrain() {
  while (_yfActive < YF_CONCURRENCY && _yfQueue.length > 0) {
    const { script, resolve, reject } = _yfQueue.shift();
    _yfActive++;
    _pyExec(script)
      .then(resolve, reject)
      .finally(() => {
        _yfActive--;
        setTimeout(_yfDrain, YF_GAP);
      });
  }
}

function _pyExec(script, timeout=30000) {
  return new Promise((res,rej)=>{
    execFile('python3',['-c',script],{maxBuffer:10e6,timeout},(err,out,serr)=>{
      if(err) return rej(new Error(serr.split('\n').filter(Boolean).pop()||err.message));
      try{res(JSON.parse(out));}catch{rej(new Error('yfinance: invalid JSON: '+out.slice(0,80)));}
    });
  });
}

function _pyExecLong(script) { return _pyExec(script, 120000); }

// ─────────────────────────────────────────────────────────────────────────────
// Stooq — US quotes (sidebar + indices, reliable/fast)
// ─────────────────────────────────────────────────────────────────────────────
const stooqSym = s => {
  if(s.startsWith('^')) return s.toLowerCase().replace('^gspc','^spx').replace('^ixic','^ndq').replace('^dji','^dji');
  return s.toLowerCase()+'.us';
};

async function stooqQuote(symbol) {
  const sym = stooqSym(symbol);
  const csv = await fetchText(`https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2ohlcvp&h&e=csv`);
  const cols = csv.trim().split('\n')[1]?.split(',');
  if(!cols||cols.length<7) throw new Error('No stooq data');
  const [,date,open,high,low,close,vol,prev] = cols;
  const c = parseFloat(close), p = parseFloat(prev||open);
  return { price:c, change:+(c-p).toFixed(4), changePct:+((c-p)/p*100).toFixed(4), open:parseFloat(open), high:parseFloat(high), low:parseFloat(low), volume:parseInt(vol), date };
}

async function stooqIndex(symbol, name) {
  try { const q=await stooqQuote(symbol); return {name,value:q.price,change:q.changePct}; }
  catch { return {name,value:0,change:0}; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 한국 주식 — NAVER Finance
// ─────────────────────────────────────────────────────────────────────────────
async function krQuote(ticker) {
  const nv={Referer:'https://m.stock.naver.com/'}, pv={Referer:'https://finance.naver.com/'};
  const [basic, rtRes] = await Promise.all([
    fetchJSON(`https://m.stock.naver.com/api/stock/${ticker}/basic`,nv),
    fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/stock/${ticker}`,pv).catch(()=>({datas:[]})),
  ]);
  const rt=rtRes.datas?.[0]??{}, info=basic.stockTradingInfo??{};

  // yfinance로 펀더멘탈 보완 (.KS 접미사)
  const yfPy = `
import yfinance as yf, json
t = yf.Ticker('${ticker}.KS')
info = t.info
fi = t.fast_info
print(json.dumps({
  'per': info.get('trailingPE'),
  'forwardPer': info.get('forwardPE'),
  'pbr': info.get('priceToBook'),
  'roe': (info.get('returnOnEquity') or 0)*100 or None,
  'eps': info.get('trailingEps'),
  'div': info.get('dividendYield') or 0,
  'operatingMargin': (info.get('operatingMargins') or 0)*100 or None,
  'profitMargin': (info.get('profitMargins') or 0)*100 or None,
  'grossMargin': (info.get('grossMargins') or 0)*100 or None,
  'debtToEquity': info.get('debtToEquity'),
  'currentRatio': info.get('currentRatio'),
  'revenueGrowth': (info.get('revenueGrowth') or 0)*100 or None,
  'earningsGrowth': (info.get('earningsGrowth') or 0)*100 or None,
  'revenue': info.get('totalRevenue'),
  'freeCashflow': info.get('freeCashflow'),
  'ebitda': info.get('ebitda'),
  'pegRatio': info.get('pegRatio'),
  'high52': fi.year_high,
  'low52': fi.year_low,
  'marketCap': fi.market_cap,
  '_pbr_calc': None,
  '_bps_calc': None,
}))
`;
  // PBR/BPS 별도 계산 (balance sheet 필요)
  const yfBsPy = `
import yfinance as yf, json
t = yf.Ticker('${ticker}.KS')
fi = t.fast_info
pbr = None
bps = None
try:
    bs = t.balance_sheet
    if not bs.empty and 'Stockholders Equity' in bs.index:
        eq = float(bs.loc['Stockholders Equity'].iloc[0])
        shares = fi.shares
        if shares and shares > 0:
            bps = round(eq / shares, 0)
            price = fi.last_price
            if price and bps > 0:
                pbr = round(price / bps, 2)
except: pass
print(json.dumps({'pbr': pbr, 'bps': bps}))
`;

  let yf = {}, yfbs = {};
  try { yf = await cached(`yfkr:${ticker}`, 3600_000, () => yfRun(yfPy)); } catch {}
  try { yfbs = await cached(`yfkrbs:${ticker}`, 3600_000, () => yfRun(yfBsPy)); } catch {}

  return {
    name:basic.stockName, exchange:basic.stockExchangeType?.nameKor??'KOSPI', currency:'KRW',
    price:   pKr(rt.closePrice??basic.closePrice),
    change:  pKr(rt.compareToPreviousClosePrice??basic.compareToPreviousClosePrice),
    changePct:parseFloat(rt.fluctuationsRatioRaw??rt.fluctuationsRatio??basic.fluctuationsRatio??'0'),
    open:pKr(rt.openPrice??basic.openPrice), high:pKr(rt.highPrice??basic.highPrice),
    low: pKr(rt.lowPrice ??basic.lowPrice),  volume:pKr(rt.accumulatedTradingVolumeRaw??rt.accumulatedTradingVolume),
    high52: yf.high52 || pKr(info.high52WeeksPrice??'0'),
    low52:  yf.low52  || pKr(info.low52WeeksPrice??'0'),
    marketCap: yf.marketCap || pKr(info.marketValue??'0'),
    per: yf.per ?? pN(info.per),
    forwardPer: yf.forwardPer ?? null,
    pbr: yfbs.pbr ?? null,
    roe: yf.roe ?? pN(info.roe),
    eps: yf.eps ?? pN(info.eps),
    bps: yfbs.bps ?? null,
    div: yf.div ?? pN(info.dividendYield),
    operatingMargin: yf.operatingMargin ?? null,
    profitMargin: yf.profitMargin ?? null,
    grossMargin: yf.grossMargin ?? null,
    debtToEquity: yf.debtToEquity ?? null,
    currentRatio: yf.currentRatio ?? null,
    revenueGrowth: yf.revenueGrowth ?? null,
    earningsGrowth: yf.earningsGrowth ?? null,
    revenue: yf.revenue ?? null,
    freeCashflow: yf.freeCashflow ?? null,
    ebitda: yf.ebitda ?? null,
    pegRatio: yf.pegRatio ?? null,
  };
}

async function krFinancials(ticker) {
  try {
    const d=await fetchJSON(`https://m.stock.naver.com/api/stock/${ticker}/finance/summary`,{Referer:'https://m.stock.naver.com/'});
    const cols=d.chartIncomeStatement?.annual?.columns??[];
    const rev=(cols[1]?.slice(1)??[]).map(Number), op=(cols[2]?.slice(1)??[]).map(Number);
    const i=rev.length-1;
    const revenue=rev[i]?rev[i]*1e8:null, opInc=op[i]?op[i]*1e8:null;

    // 분기 EPS 4개 합산 → trailing PER 계산
    let trailingEps=null, trailingPer=null;
    try {
      const epsCols=d.chartEps?.columns??[];
      if(epsCols.length>1){
        const epsList=epsCols[1].slice(1).map(Number).filter(v=>!isNaN(v)&&v!==0);
        const trailing=epsList.slice(-4);
        if(trailing.length===4){ trailingEps=trailing.reduce((a,b)=>a+b,0); }
      }
    } catch {}

    return { revenue, operatingIncome:opInc,
      operatingMargin:(revenue&&opInc)?opInc/revenue*100:null,
      revenueGrowth:(i>0&&rev[i-1])?(rev[i]-rev[i-1])/Math.abs(rev[i-1])*100:null,
      _trailingEps: trailingEps,  // 가격과 합산해 PER 계산용
    };
  } catch { return {}; }
}

async function krChart(ticker, range) {
  const periodMap = {'1wk':'5d','1mo':'1mo','3mo':'3mo','6mo':'6mo','1y':'1y'};
  const py = `
import yfinance as yf, json
t = yf.Ticker('${ticker}.KS')
h = t.history(period='${periodMap[range]||'1mo'}')
rows = []
for dt, row in h.iterrows():
    rows.append({'date': dt.strftime('%Y-%m-%d'), 'close': round(float(row['Close']), 0)})
print(json.dumps(rows))
`;
  return yfRun(py);
}

async function krIndex(code, name) {
  try {
    const d=await fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/index/${code}`,{Referer:'https://finance.naver.com/'});
    const r=d.datas?.[0]??{};
    return {name,value:parseFloat(r.closePriceRaw??'0'),change:parseFloat(r.fluctuationsRatioRaw??'0')};
  } catch { return {name,value:0,change:0}; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 미국 주식 — Stooq (fast quote) + Yahoo Finance via Python (detail/chart)
// ─────────────────────────────────────────────────────────────────────────────
async function usQuote(ticker) {
  const py = `
import yfinance as yf, json
t = yf.Ticker('${ticker}')
fi = t.fast_info
info = t.info
print(json.dumps({
  'name': info.get('longName') or info.get('shortName','${ticker}'),
  'exchange': info.get('exchange',''),
  'currency': info.get('currency','USD'),
  'price': fi.last_price,
  'high52': fi.year_high,
  'low52': fi.year_low,
  'marketCap': fi.market_cap,
  'per': info.get('trailingPE'),
  'forwardPer': info.get('forwardPE'),
  'pbr': info.get('priceToBook'),
  'roe': (info.get('returnOnEquity') or 0)*100 or None,
  'eps': info.get('trailingEps'),
  'bps': info.get('bookValue'),
  'div': info.get('dividendYield') or 0,
  'operatingMargin': (info.get('operatingMargins') or 0)*100 or None,
  'profitMargin': (info.get('profitMargins') or 0)*100 or None,
  'grossMargin': (info.get('grossMargins') or 0)*100 or None,
  'debtToEquity': info.get('debtToEquity'),
  'currentRatio': info.get('currentRatio'),
  'quickRatio': info.get('quickRatio'),
  'revenueGrowth': (info.get('revenueGrowth') or 0)*100 or None,
  'earningsGrowth': (info.get('earningsGrowth') or 0)*100 or None,
  'revenue': info.get('totalRevenue'),
  'freeCashflow': info.get('freeCashflow'),
  'ebitda': info.get('ebitda'),
  'pegRatio': info.get('pegRatio'),
  'shortRatio': info.get('shortRatio'),
  'recommendation': info.get('recommendationKey'),
  'targetPrice': info.get('targetMeanPrice'),
  'numberOfAnalysts': info.get('numberOfAnalystOpinions'),
}))
`;
  const meta = await yfRun(py);
  // Enrich with live Stooq price (more real-time)
  try {
    const sq = await stooqQuote(ticker);
    return { ...meta, price: sq.price, change: sq.change, changePct: sq.changePct,
             open: sq.open, high: sq.high, low: sq.low, volume: sq.volume };
  } catch {
    const prev = meta.price;
    return { ...meta, change: 0, changePct: 0 };
  }
}

async function usQuickQuote(ticker) {
  // stooq 먼저 시도, 실패 시 yfinance fast_info로 fallback
  try { return await stooqQuote(ticker); } catch {}
  try {
    return await yfRun(`
import yfinance as yf, json
t = yf.Ticker('${ticker}')
h = t.history(period='2d')
if len(h) >= 1:
    price = float(h['Close'].iloc[-1])
    prev  = float(h['Close'].iloc[-2]) if len(h) >= 2 else price
    chg   = price - prev
    chgPct = (chg / prev * 100) if prev else 0
    print(json.dumps({'price': round(price,2), 'change': round(chg,2), 'changePct': round(chgPct,4),
                      'open': float(h['Open'].iloc[-1]), 'high': float(h['High'].iloc[-1]),
                      'low': float(h['Low'].iloc[-1]), 'volume': int(h['Volume'].iloc[-1])}))
else:
    fi = t.fast_info
    p = fi.last_price or 0
    print(json.dumps({'price': round(p,2), 'change': 0, 'changePct': 0}))
`);
  } catch { return null; }
}

async function usChart(ticker, range) {
  const periodMap = {'1wk':'5d','1mo':'1mo','3mo':'3mo','6mo':'6mo','1y':'1y'};
  const py = `
import yfinance as yf, json
t = yf.Ticker('${ticker}')
h = t.history(period='${periodMap[range]||'1mo'}')
rows = []
for dt, row in h.iterrows():
    rows.append({'date': dt.strftime('%Y-%m-%d'), 'close': round(float(row['Close']), 2)})
print(json.dumps(rows))
`;
  return yfRun(py);
}

// News via yfinance
async function usNews(ticker) {
  const py = `
import yfinance as yf, json, time
t = yf.Ticker('${ticker}')
news = t.news or []
now = time.time()
result = []
for n in news[:6]:
    ts = n.get('content',{}).get('pubDate') or n.get('providerPublishTime', now)
    if isinstance(ts, str):
        from datetime import datetime
        try: ts = datetime.fromisoformat(ts.replace('Z','+00:00')).timestamp()
        except: ts = now
    diff = now - float(ts)
    if diff < 3600: t_str = f'{int(diff/60)}분 전'
    elif diff < 86400: t_str = f'{int(diff/3600)}시간 전'
    else: t_str = f'{int(diff/86400)}일 전'
    result.append({
      'title': n.get('content',{}).get('title') or n.get('title',''),
      'source': n.get('content',{}).get('provider',{}).get('displayName') or n.get('publisher',''),
      'time': t_str,
      'url': n.get('content',{}).get('canonicalUrl',{}).get('url') or n.get('link','#')
    })
print(json.dumps(result))
`;
  return yfRun(py);
}

// ─────────────────────────────────────────────────────────────────────────────
// 뉴스
// ─────────────────────────────────────────────────────────────────────────────
async function getNews(symbol, isKr) {
  if(isKr) {
    try {
      const rss=await fetchJSON(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(symbol)}&output=rss`)}`);
      if(rss.status==='ok') return rss.items.slice(0,6).map(n=>({title:n.title.replace(/<[^>]+>/g,''),source:n.author||'네이버뉴스',time:timeAgo(new Date(n.pubDate)),url:n.link}));
    } catch {}
    return [];
  }
  try { return await usNews(symbol); }
  catch { return []; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// 거래 시간 체크
function isTradingHours() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=일, 6=토
  if (day === 0 || day === 6) return false;
  // KST = UTC+9 → KR 09:00~15:30
  const kstH = (now.getUTCHours() + 9) % 24, kstM = now.getUTCMinutes();
  const krOpen  = kstH * 60 + kstM >= 9 * 60;
  const krClose = kstH * 60 + kstM <= 15 * 60 + 30;
  // ET = UTC-4(EDT) → US 09:30~16:00 (EDT 기준)
  const etH = ((now.getUTCHours() - 4) + 24) % 24, etM = now.getUTCMinutes();
  const usOpen  = etH * 60 + etM >= 9 * 60 + 30;
  const usClose = etH * 60 + etM <= 16 * 60;
  return (krOpen && krClose) || (usOpen && usClose);
}

// 배치 사이드바 — 여러 종목 한 번에 (US: yfinance download, KR: NAVER polling)
app.get('/api/sidebar-batch', async (req, res) => {
  const { symbols, market } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });
  const list = symbols.split(',').filter(Boolean);
  if (!list.length) return res.json({});

  const ttl = isTradingHours() ? 5_000 : 60_000;
  const cacheKey = `sbb:${market}:${list.join(',')}`;
  const hit = getC(cacheKey);
  if (hit) return res.json(hit);

  try {
    let result = {};
    if (market === 'kr') {
      // KR: 개별 NAVER polling 병렬
      const tasks = list.map(async sym => {
        const ck = `sb:${sym}`;
        const cached = getC(ck);
        if (cached) { result[sym] = cached; return; }
        try {
          const d = await fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/stock/${sym}`,{Referer:'https://finance.naver.com/'});
          const rt = d.datas?.[0] ?? {};
          const data = { price: pKr(rt.closePrice), changePct: parseFloat(rt.fluctuationsRatioRaw ?? '0') };
          setC(ck, data, ttl);
          result[sym] = data;
        } catch {}
      });
      await Promise.all(tasks);
    } else {
      // US: Stooq CSV API (Yahoo Finance 차단 우회)
      const uncached = list.filter(s => !getC(`sb:${s}`));
      list.forEach(s => { const c = getC(`sb:${s}`); if (c) result[s] = c; });

      if (uncached.length) {
        await Promise.allSettled(uncached.map(async sym => {
          try {
            const url = `https://stooq.com/q/l/?s=${sym.toLowerCase()}.us&f=sd2t2ohlcvn&h&e=csv`;
            const text = await (await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })).text();
            const lines = text.trim().split('\n');
            if (lines.length < 2) return;
            const cols = lines[1].split(',');
            // Date,Time,Open,High,Low,Close,Volume,Name
            const price = parseFloat(cols[5]);
            const open = parseFloat(cols[2]);
            if (!price || isNaN(price)) return;
            const chg = open ? (price - open) / open * 100 : 0;
            const data = { price: Math.round(price * 100) / 100, changePct: Math.round(chg * 10000) / 10000 };
            setC(`sb:${sym}`, data, ttl);
            result[sym] = data;
          } catch {}
        }));
      }
    }
    setC(cacheKey, result, ttl);
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Sidebar prices — 단일 종목
app.get('/api/sidebar', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    const ttl = isTradingHours() ? 3_000 : 60_000;
    const cacheKey = `sb:${symbol}`;
    // null 결과는 캐시하지 않음
    let data = getC(cacheKey);
    if (!data) {
      if (market === 'kr') {
        const d=await fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/stock/${symbol}`,{Referer:'https://finance.naver.com/'});
        const rt=d.datas?.[0]??{};
        data = { price:pKr(rt.closePrice), changePct:parseFloat(rt.fluctuationsRatioRaw??'0') };
      } else {
        data = await usQuickQuote(symbol);
      }
      if (data) setC(cacheKey, data, ttl);
    }
    res.json(data ?? {});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 종목 검색
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const { q, market = 'all' } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);
  const results = [];

  if (market === 'kr' || market === 'all') {
    try {
      const d = await fetchJSON(
        `https://ac.stock.naver.com/ac?q=${encodeURIComponent(q)}&target=stock,etf`,
        { Referer: 'https://finance.naver.com/' }
      );
      const items = Array.isArray(d.items) ? d.items : [];
      for (const item of items.slice(0, 10)) {
        // 새 형식: { code, name, typeCode, category, nationCode }
        const ticker = item.code || item[0];
        const name   = item.name || item[1];
        const exchange = item.typeCode || item[3] || 'KOSPI';
        const type   = item.category || 'stock';
        const nation = item.nationCode || 'KOR';
        if (!ticker) continue;
        // 미국 주식/ETF는 us로, 나머지(한국 등)는 kr로 처리
        const itemMarket = nation === 'USA' ? 'us' : 'kr';
        results.push({ ticker, name, market: itemMarket, exchange, type });
      }
    } catch {}
  }

  if (market === 'us' || market === 'all') {
    try {
      const py = `
import yfinance as yf, json
t = yf.Search('${q.replace(/'/g,"\\'")}', max_results=10, news_count=0)
results = []
for qt in (t.quotes or []):
    qt_type = qt.get('quoteType','')
    if qt_type not in ('EQUITY','ETF'): continue
    if qt.get('exchange','') in ('PNK',): continue
    results.append({
        'ticker': qt.get('symbol',''),
        'name': qt.get('longname') or qt.get('shortname') or qt.get('symbol',''),
        'market': 'us',
        'exchange': qt.get('exchDisp') or qt.get('exchange',''),
        'type': qt_type,
    })
print(json.dumps(results[:10]))
`;
      const usResults = await yfRun(py);
      results.push(...usResults);
    } catch(e) { console.error('US search error:', e.message); }
  }

  res.json(results);
});

// 지수 차트
app.get('/api/index-chart', async (req, res) => {
  const { symbol, range = '1mo' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    const data = await cached(`ic:${symbol}:${range}`, 300_000, async () => {
      const krSymMap = { KOSPI: '^KS11', KOSDAQ: '^KQ11' };
      if (krSymMap[symbol]) {
        const periodMap = {'1wk':'5d','1mo':'1mo','3mo':'3mo','6mo':'6mo','1y':'1y'};
        const py = `
import yfinance as yf, json
t = yf.Ticker('${krSymMap[symbol]}')
h = t.history(period='${periodMap[range]||'1mo'}')
rows = [{'date': dt.strftime('%Y-%m-%d'), 'close': round(float(row['Close']),2)} for dt,row in h.iterrows()]
print(json.dumps(rows))
`;
        const rows = await yfRun(py);
        return {
          labels: rows.map(r => new Date(r.date).toLocaleDateString('ko',{month:'short',day:'numeric'})),
          data: rows.map(r => r.close),
        };
      }
      // US — yfinance
      const yfsym = { 'S&P 500':'^GSPC','NASDAQ':'^IXIC','DOW':'^DJI' }[symbol] || symbol;
      const periodMap = {'1wk':'5d','1mo':'1mo','3mo':'3mo','6mo':'6mo','1y':'1y'};
      const py = `
import yfinance as yf, json
t = yf.Ticker('${yfsym}')
h = t.history(period='${periodMap[range]||'1mo'}')
rows = [{'date': dt.strftime('%Y-%m-%d'), 'close': round(float(row['Close']),2)} for dt,row in h.iterrows()]
print(json.dumps(rows))
`;
      const rows = await yfRun(py);
      return {
        labels: rows.map(r => new Date(r.date).toLocaleDateString('ko',{month:'short',day:'numeric'})),
        data: rows.map(r => r.close),
      };
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 거래 시간 상태 API
app.get('/api/trading-status', (_, res) => {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return res.json({ kr: false, us: false });
  const kstMin = ((now.getUTCHours() + 9) % 24) * 60 + now.getUTCMinutes();
  const etMin  = (((now.getUTCHours() - 4) + 24) % 24) * 60 + now.getUTCMinutes();
  res.json({
    kr: kstMin >= 540 && kstMin <= 930,
    us: etMin  >= 570 && etMin  <= 960,
  });
});

// Full quote — detail view
app.get('/api/quote', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    const data = await cached(`q:${symbol}`, 60_000, async () => {
      if (market === 'kr') {
        const [q,fin]=await Promise.all([krQuote(symbol),krFinancials(symbol)]);
        const merged = {...q,...fin};
        // trailing PER 계산: EPS(원) → 현재가로 나눔
        if (!merged.per && fin._trailingEps && merged.price) {
          merged.per = parseFloat((merged.price / fin._trailingEps).toFixed(1));
          merged.eps = fin._trailingEps;
        }
        delete merged._trailingEps;
        return merged;
      }
      return usQuote(symbol);
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/chart', async (req, res) => {
  const { symbol, range='1mo', market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    const data = await cached(`c:${symbol}:${range}`, 300_000, async () => {
      const raw = market==='kr' ? await krChart(symbol,range) : await usChart(symbol,range);
      const longRange = ['6mo','1y'].includes(range);
      const fmtOpts = longRange
        ? { year:'2-digit', month:'short', day:'numeric' }
        : { month:'short', day:'numeric' };
      return {
        labels: raw.map(d=>new Date(d.date).toLocaleDateString('ko', fmtOpts)),
        data:   raw.map(d=>d.close),
      };
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

async function yfIndex(sym, name) {
  // Stooq 심볼 매핑
  const stooqMap = { '^GSPC': '%5espx', '^IXIC': '%5endq', '^DJI': '%5edji' };
  const stooqSym = stooqMap[sym] || sym.toLowerCase().replace('^','%5e');
  try {
    const url = `https://stooq.com/q/l/?s=${stooqSym}&f=sd2t2ohlcv&h&e=csv`;
    const text = await (await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })).text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { name, value: 0, change: 0 };
    const cols = lines[1].split(',');
    const price = parseFloat(cols[5]); // Close
    const open = parseFloat(cols[2]);  // Open
    const chg = open ? (price - open) / open * 100 : 0;
    return { name, value: Math.round(price * 100) / 100, change: Math.round(chg * 100) / 100 };
  } catch { return { name, value: 0, change: 0 }; }
}

app.get('/api/indices', async (_, res) => {
  try {
    const data = await cached('indices', 60_000, () => Promise.all([
      krIndex('KOSPI',  'KOSPI'),
      krIndex('KOSDAQ', 'KOSDAQ'),
      yfIndex('^GSPC', 'S&P 500'),
      yfIndex('^IXIC', 'NASDAQ'),
      yfIndex('^DJI',  'DOW'),
    ]));
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 환율 API
app.get('/api/rates', async (_, res) => {
  try {
    const data = await cached('rates', 300_000, async () => {
      // Stooq으로 환율 조회
      const pairs = [['usdkrw','usdkrw'],['usdjpy','usdjpy'],['eurusd','eurusd'],['dxy','dxy']];
      const rates = {};
      await Promise.allSettled(pairs.map(async ([stooqSym, key]) => {
        try {
          const url = `https://stooq.com/q/l/?s=${stooqSym}&f=sd2t2ohlcv&h&e=csv`;
          const text = await (await fetch(url, { headers:{'User-Agent':UA}, signal:AbortSignal.timeout(8000) })).text();
          const lines = text.trim().split('\n');
          if (lines.length < 2) return;
          const cols = lines[1].split(',');
          const price = parseFloat(cols[5]);
          const open = parseFloat(cols[2]);
          if (!price || isNaN(price)) return;
          const chg = open ? (price - open) / open * 100 : 0;
          rates[key] = { value: Math.round(price * 100) / 100, change: Math.round(chg * 100) / 100 };
        } catch {}
      }));
      return rates;
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/news', async (req, res) => {
  const { symbol, market } = req.query;
  try {
    const data = await cached(`n:${symbol}`, 600_000, () => getNews(symbol, market==='kr'));
    res.json(data);
  } catch { res.json([]); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 수급/주주 분석 (기관, 내부자, 옵션)
// ─────────────────────────────────────────────────────────────────────────────
async function getFlowData(ticker, isKr) {
  const yfticker = isKr ? ticker + '.KS' : ticker;
  const py = `
import yfinance as yf, json, pandas as pd

t = yf.Ticker('${yfticker}')
result = {}

# 주요 주주 비율 (내부자%, 기관%)
try:
    mh = t.major_holders
    if mh is not None and not mh.empty:
        v = mh['Value'].to_dict() if hasattr(mh, 'columns') and 'Value' in mh.columns else mh.iloc[:,0].to_dict()
        result['insiderPct'] = round(float(v.get('insidersPercentHeld', v.get(0, 0)) or 0)*100, 2)
        result['institutionPct'] = round(float(v.get('institutionsPercentHeld', v.get(1, 0)) or 0)*100, 2)
        result['institutionsCount'] = int(v.get('institutionsCount', v.get(3, 0)) or 0)
except Exception as e:
    result['_mh_err'] = str(e)

# 주요 기관투자자 Top 5
try:
    ih = t.institutional_holders
    if ih is not None and not ih.empty:
        holders = []
        for _, r in ih.head(5).iterrows():
            try:
                holders.append({
                    'name': str(r.get('Holder', r.get('Name', ''))),
                    'pct': round(float(r.get('pctHeld', r.get('% Out', 0)) or 0)*100, 2),
                    'shares': int(r.get('Shares', r.get('Shares', 0)) or 0),
                    'chg': round(float(r.get('pctChange', 0) or 0)*100, 2)
                })
            except: pass
        result['topHolders'] = holders
except Exception as e:
    result['_ih_err'] = str(e)

# 내부자 거래 (최근 10건)
try:
    ins = t.insider_transactions
    if ins is not None and not ins.empty:
        txs = []
        for _, r in ins.head(8).iterrows():
            try:
                shares = r.get('Shares', 0)
                if shares and str(shares) not in ('nan', 'None', '<NA>') and int(shares) != 0:
                    txs.append({
                        'name': str(r.get('Insider', r.get('Name', ''))),
                        'title': str(r.get('Position', r.get('Title', r.get('Relation', '')))),
                        'type': str(r.get('Transaction', r.get('Text', ''))),
                        'shares': int(shares),
                        'date': str(r.get('Date', r.get('Start Date', '')))[:10]
                    })
            except: pass
        result['insiderTx'] = txs[:6]
except Exception as e:
    result['_ins_err'] = str(e)

${!isKr ? `
# 옵션 현황 (US 전용)
try:
    opts = t.options
    if opts:
        chain = t.option_chain(opts[0])
        calls = chain.calls
        puts = chain.puts
        call_oi = int(calls['openInterest'].sum())
        put_oi = int(puts['openInterest'].sum())
        # 최대 OI 행사가
        max_call_strike = None
        max_put_strike = None
        max_call_oi = None
        max_put_oi = None
        if len(calls) > 0 and 'openInterest' in calls.columns and 'strike' in calls.columns:
            idx = calls['openInterest'].idxmax()
            max_call_strike = float(calls.loc[idx, 'strike'])
            max_call_oi = int(calls.loc[idx, 'openInterest'])
        if len(puts) > 0 and 'openInterest' in puts.columns and 'strike' in puts.columns:
            idx = puts['openInterest'].idxmax()
            max_put_strike = float(puts.loc[idx, 'strike'])
            max_put_oi = int(puts.loc[idx, 'openInterest'])
        result['options'] = {
            'expiry': opts[0],
            'callOI': call_oi,
            'putOI': put_oi,
            'putCallRatio': round(put_oi / max(call_oi, 1), 2),
            'impliedVol': round(float(calls['impliedVolatility'].mean())*100, 1) if len(calls) > 0 else None,
            'maxCallStrike': max_call_strike,
            'maxCallOI': max_call_oi,
            'maxPutStrike': max_put_strike,
            'maxPutOI': max_put_oi,
            'nearestExpiries': list(opts[:3])
        }
except Exception as e:
    result['_opts_err'] = str(e)

# 공매도 정보 (US)
try:
    info = t.info
    result['shortPct'] = round(float(info.get('shortPercentOfFloat', 0) or 0)*100, 2)
    result['shortRatio'] = info.get('shortRatio')
    result['heldByInsiders'] = round(float(info.get('heldPercentInsiders', 0) or 0)*100, 2)
    result['heldByInstitutions'] = round(float(info.get('heldPercentInstitutions', 0) or 0)*100, 2)
except: pass
` : ''}

print(json.dumps(result, ensure_ascii=False, default=str))
`;
  return yfRun(py);
}

app.get('/api/flow', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    const data = await cached(`flow:${symbol}`, 1800_000, () => getFlowData(symbol, market === 'kr'));
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 기술적 지표 계산 (Python/yfinance, 6개월 데이터)
// ─────────────────────────────────────────────────────────────────────────────
async function calcTechnicalsYF(yfticker) {
  const py = `
import yfinance as yf, json
import numpy as np

def rsi(close, n=14):
    d = close.diff()
    gain = d.clip(lower=0).ewm(com=n-1, adjust=False).mean()
    loss = (-d.clip(upper=0)).ewm(com=n-1, adjust=False).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))

def bollinger(close, n=20, k=2):
    ma = close.rolling(n).mean()
    std = close.rolling(n).std()
    return ma+k*std, ma, ma-k*std

def stochastic(high, low, close, kp=14, dp=3):
    lk = low.rolling(kp).min()
    hk = high.rolling(kp).max()
    raw = 100 * (close - lk) / (hk - lk)
    K = raw.rolling(dp).mean()
    D = K.rolling(dp).mean()
    return K, D

def dmi_adx(high, low, close, n=14):
    tr = np.maximum(high - low, np.maximum(abs(high - close.shift()), abs(low - close.shift())))
    pdm = high.diff().clip(lower=0)
    mdm = (-low.diff()).clip(lower=0)
    pdm[pdm < mdm] = 0
    mdm[mdm < pdm] = 0
    atr = tr.ewm(com=n-1, adjust=False).mean()
    pdi = 100 * pdm.ewm(com=n-1, adjust=False).mean() / atr
    mdi = 100 * mdm.ewm(com=n-1, adjust=False).mean() / atr
    dx = 100 * abs(pdi - mdi) / (pdi + mdi)
    return dx.ewm(com=n-1, adjust=False).mean(), pdi, mdi

t = yf.Ticker('${yfticker}')
h = t.history(period='6mo')
if len(h) < 30:
    print(json.dumps({'error': 'not enough data'}))
else:
    c, hi, lo = h['Close'], h['High'], h['Low']
    rsi_s = rsi(c)
    upper, mid, lower = bollinger(c)
    K, D = stochastic(hi, lo, c)
    adx_s, pdi_s, mdi_s = dmi_adx(hi, lo, c)
    ema12 = c.ewm(span=12, adjust=False).mean()
    ema26 = c.ewm(span=26, adjust=False).mean()
    macd_s = ema12 - ema26
    sig_s = macd_s.ewm(span=9, adjust=False).mean()
    last = float(c.iloc[-1])
    bb_l, bb_u = float(lower.iloc[-1]), float(upper.iloc[-1])
    print(json.dumps({
        'rsi': round(float(rsi_s.iloc[-1]), 1),
        'bb_upper': round(bb_u, 4), 'bb_mid': round(float(mid.iloc[-1]), 4), 'bb_lower': round(bb_l, 4),
        'bb_pct': round((last - bb_l) / (bb_u - bb_l) * 100, 1) if bb_u != bb_l else 50,
        'stoch_k': round(float(K.iloc[-1]), 1), 'stoch_d': round(float(D.iloc[-1]), 1),
        'adx': round(float(adx_s.iloc[-1]), 1), 'pdi': round(float(pdi_s.iloc[-1]), 1), 'mdi': round(float(mdi_s.iloc[-1]), 1),
        'macd': round(float(macd_s.iloc[-1]), 4), 'macd_signal': round(float(sig_s.iloc[-1]), 4),
        'ma20': round(float(mid.iloc[-1]), 4), 'ma50': round(float(c.rolling(50).mean().iloc[-1]), 4),
        'price': round(last, 4),
    }))
`;
  return yfRun(py);
}

// ─────────────────────────────────────────────────────────────────────────────
// AI 분석
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/analysis', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not set' });

  try {
    const data = await cached(`ai:${symbol}`, 600_000, async () => {
      const yfticker = market === 'kr' ? symbol + '.KS' : symbol;
      const isKr = market === 'kr';

      // Fetch technicals, quote, news, flow, macro concurrently
      const [techR, quoteR, newsR, flowR, macroR] = await Promise.allSettled([
        calcTechnicalsYF(yfticker),
        (async () => {
          const cached_q = getC(`q:${symbol}`);
          if (cached_q) return cached_q;
          if (isKr) { const [q,fin]=await Promise.all([krQuote(symbol),krFinancials(symbol)]); return {...q,...fin}; }
          return usQuote(symbol);
        })(),
        getNews(symbol, isKr),
        getFlowData(symbol, isKr),
        yfRun(`
import yfinance as yf, json
result = {}
# 환율
for sym, key in [('USDKRW=X','usdkrw'),('DX-Y.NYB','dxy'),('USDJPY=X','usdjpy')]:
    try:
        h = yf.Ticker(sym).history(period='2d')
        if len(h) >= 1:
            p = float(h['Close'].iloc[-1])
            prev = float(h['Close'].iloc[-2]) if len(h)>=2 else p
            result[key] = {'value': round(p,2), 'chg': round((p-prev)/prev*100,2)}
    except: pass
# 미국 금리 (10Y treasury, fed funds)
for sym, key in [('^TNX','us10y'),('^IRX','us3m')]:
    try:
        h = yf.Ticker(sym).history(period='2d')
        if len(h) >= 1:
            p = float(h['Close'].iloc[-1])
            prev = float(h['Close'].iloc[-2]) if len(h)>=2 else p
            result[key] = {'value': round(p,2), 'chg': round(p-prev,3)}
    except: pass
# VIX (공포지수)
try:
    h = yf.Ticker('^VIX').history(period='2d')
    if len(h) >= 1:
        p = float(h['Close'].iloc[-1])
        prev = float(h['Close'].iloc[-2]) if len(h)>=2 else p
        result['vix'] = {'value': round(p,2), 'chg': round(p-prev,2)}
except: pass
# 원자재
for sym, key in [('GC=F','gold'),('CL=F','oil'),('SI=F','silver')]:
    try:
        h = yf.Ticker(sym).history(period='2d')
        if len(h) >= 1:
            p = float(h['Close'].iloc[-1])
            prev = float(h['Close'].iloc[-2]) if len(h)>=2 else p
            result[key] = {'value': round(p,2), 'chg': round((p-prev)/prev*100,2)}
    except: pass
print(json.dumps(result))
`),
      ]);

      const t = techR.status === 'fulfilled' ? techR.value : {};
      const q = quoteR.status === 'fulfilled' ? quoteR.value : {};
      const news = newsR.status === 'fulfilled' ? newsR.value : [];
      const flow = flowR.status === 'fulfilled' ? flowR.value : {};
      const macro = macroR.status === 'fulfilled' ? macroR.value : {};

      const sym = isKr ? '₩' : '$';
      const newsText = news.slice(0, 5).map((n,i) => `${i+1}. [${n.source}] ${n.title} (${n.time})`).join('\n');

      const n = v => v != null ? v : 'N/A';
      const pct = v => v != null ? v.toFixed(1)+'%' : 'N/A';
      const x = v => v != null ? v.toFixed(2)+'x' : 'N/A';

      const prompt = `당신은 한국어만 사용하는 주식 투자 전문 분석가입니다. 반드시 순수한 한국어로만 응답하세요. 한자·영어·중국어·일본어·베트남어·러시아어 등 다른 언어나 문자를 절대 혼용하지 마세요.

아래의 모든 지표를 빠짐없이 종합 분석하여 ${q.name || symbol} (${symbol}) 종목에 대한 투자 의견을 제시하세요.

## 시세
- 현재가: ${sym}${q.price?.toLocaleString() ?? 'N/A'} / 등락: ${q.changePct?.toFixed(2) ?? 'N/A'}% (${q.change >= 0 ? '+' : ''}${q.change?.toFixed(2) ?? ''})
- 시가: ${sym}${q.open?.toLocaleString() ?? '-'} / 고가: ${sym}${q.high?.toLocaleString() ?? '-'} / 저가: ${sym}${q.low?.toLocaleString() ?? '-'}
- 52주 고가: ${sym}${q.high52?.toLocaleString() ?? '-'} / 52주 저가: ${sym}${q.low52?.toLocaleString() ?? '-'}
- 거래량: ${q.volume?.toLocaleString() ?? '-'} / 시가총액: ${q.marketCap?.toLocaleString() ?? '-'}

## 기술적 지표 (6개월 데이터 기반)
- RSI(14): ${n(t.rsi)} → ${t.rsi > 70 ? '과매수 구간' : t.rsi < 30 ? '과매도 구간' : '중립 구간'}
- 볼린저밴드(20,2): 상단 ${n(t.bb_upper)} / 중간(MA20) ${n(t.bb_mid)} / 하단 ${n(t.bb_lower)} → 현재 위치 ${n(t.bb_pct)}%
- 스토캐스틱(14,3): K=${n(t.stoch_k)} D=${n(t.stoch_d)} → ${t.stoch_k > 80 ? '과매수' : t.stoch_k < 20 ? '과매도' : '중립'}
- DMI/ADX(14): ADX=${n(t.adx)} / +DI=${n(t.pdi)} / -DI=${n(t.mdi)} → ${t.adx > 25 ? (t.pdi > t.mdi ? '강한 상승 추세' : '강한 하락 추세') : '약한 추세/횡보'}
- MACD(12,26,9): MACD=${n(t.macd)} / Signal=${n(t.macd_signal)} → ${t.macd > t.macd_signal ? '골든크로스(매수 신호)' : '데드크로스(매도 신호)'}
- 이동평균: MA20=${n(t.ma20)} / MA50=${n(t.ma50)} → 현재가가 MA20 ${q.price > t.ma20 ? '위(강세)' : '아래(약세)'} / MA50 ${q.price > t.ma50 ? '위(강세)' : '아래(약세)'}

## 가치 지표
- PER(trailing): ${n(q.per)}x / PER(forward): ${n(q.forwardPer)}x / PEG: ${n(q.pegRatio)}
- PBR: ${n(q.pbr)}x / ROE: ${pct(q.roe)} / EPS: ${q.eps ?? 'N/A'} / BPS: ${q.bps ?? 'N/A'}
- 배당수익률: ${q.div > 0 ? q.div.toFixed(2)+'%' : '무배당'}

## 수익성 지표
- 영업이익률: ${pct(q.operatingMargin)} / 순이익률: ${pct(q.profitMargin)} / 매출총이익률: ${pct(q.grossMargin)}
- 매출 성장률: ${pct(q.revenueGrowth)} / 이익 성장률: ${pct(q.earningsGrowth)}
- EBITDA: ${q.ebitda?.toLocaleString() ?? 'N/A'} / 잉여현금흐름: ${q.freeCashflow?.toLocaleString() ?? 'N/A'}

## 안전성 지표
- 부채비율(D/E): ${n(q.debtToEquity)} / 유동비율: ${n(q.currentRatio)}x / 당좌비율: ${n(q.quickRatio)}x
${q.shortRatio ? `- 공매도 비율: ${q.shortRatio.toFixed(1)}일치` : ''}
${q.recommendation ? `- 애널리스트 컨센서스: ${q.recommendation} / 목표가: ${sym}${q.targetPrice ?? '-'} / 분석가 수: ${q.numberOfAnalysts ?? '-'}명` : ''}

## 거시경제 지표 (매크로)
- USD/KRW 환율: ${macro.usdkrw ? `${macro.usdkrw.value}원 (${macro.usdkrw.chg > 0 ? '+' : ''}${macro.usdkrw.chg}%)` : 'N/A'}
- 달러인덱스(DXY): ${macro.dxy ? `${macro.dxy.value} (${macro.dxy.chg > 0 ? '+' : ''}${macro.dxy.chg}%)` : 'N/A'}
- 미국 10년물 금리: ${macro.us10y ? `${macro.us10y.value}% (전일대비 ${macro.us10y.chg > 0 ? '+' : ''}${macro.us10y.chg}%p)` : 'N/A'}
- 미국 3개월 금리: ${macro.us3m ? `${macro.us3m.value}%` : 'N/A'}
- VIX 공포지수: ${macro.vix ? `${macro.vix.value} (전일대비 ${macro.vix.chg > 0 ? '+' : ''}${macro.vix.chg})` : 'N/A'}
- 금 현물: ${macro.gold ? `$${macro.gold.value} (${macro.gold.chg > 0 ? '+' : ''}${macro.gold.chg}%)` : 'N/A'}
- WTI 원유: ${macro.oil ? `$${macro.oil.value} (${macro.oil.chg > 0 ? '+' : ''}${macro.oil.chg}%)` : 'N/A'}

## 수급 및 주주 현황
- 내부자 지분율: ${flow.insiderPct != null ? flow.insiderPct+'%' : 'N/A'} / 기관 지분율: ${flow.institutionPct != null ? flow.institutionPct+'%' : 'N/A'} / 기관 수: ${flow.institutionsCount ?? 'N/A'}개
${flow.topHolders?.length ? `- 주요 기관투자자: ${flow.topHolders.slice(0,3).map(h=>`${h.name}(${h.pct}%, 증감${h.chg>0?'+':''}${h.chg}%)`).join(', ')}` : ''}
${flow.insiderTx?.length ? `- 최근 내부자 거래: ${flow.insiderTx.slice(0,3).map(tx=>`${tx.name}(${tx.title}) ${tx.type} ${tx.shares?.toLocaleString()}주 (${tx.date})`).join(' | ')}` : ''}
${flow.options ? `- 옵션: 콜OI ${flow.options.callOI?.toLocaleString()} / 풋OI ${flow.options.putOI?.toLocaleString()} / 풋콜비율 ${flow.options.putCallRatio} / 내재변동성 ${flow.options.impliedVol}%\n- 최대 콜 행사가: $${flow.options.maxCallStrike} (OI ${flow.options.maxCallOI?.toLocaleString()}) / 최대 풋 행사가: $${flow.options.maxPutStrike} (OI ${flow.options.maxPutOI?.toLocaleString()})` : ''}
${flow.shortPct != null ? `- 공매도: 유동주식 대비 ${flow.shortPct}% / 공매도 비율일수 ${flow.shortRatio ?? 'N/A'}일` : ''}

## 최근 뉴스 (등락 원인 분석에 활용)
${newsText || '관련 뉴스 없음'}

## 응답 형식
위 모든 데이터를 종합하여 아래 JSON으로만 응답하세요 (다른 텍스트 없이, 반드시 순수 한국어만):
{
  "signal": "매수" | "중립" | "매도",
  "confidence": 숫자(0-100),
  "price_move": "오늘 등락 원인 분석 - 뉴스·수급·기술적 요인 기반으로 구체적으로 설명",
  "summary": "3문장 핵심 투자 의견 요약",
  "technical": "RSI·MACD·볼린저밴드·스토캐스틱·DMI·이동평균 분석 종합",
  "fundamental": "PER·PBR·ROE·성장률·수익성·안전성 지표 종합 평가",
  "flow": "기관/내부자 지분율·주요 보유기관 동향·내부자 매매·공매도·옵션 수급 분석",
  "sentiment": "뉴스 내용 분석 및 시장 심리 판단",
  "risk": "구체적인 리스크 요인 및 주의사항"
}`;

      const msg = await getGrok().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: '당신은 한국어 전문 주식 분석가입니다. 반드시 순수한 한국어로만 답변하세요. 한자, 중국어, 일본어, 영어, 베트남어 등 다른 언어나 문자를 절대 사용하지 마세요. 모든 단어를 한글로 표기하세요.' },
          { role: 'user', content: prompt }
        ],
      });

      const raw = msg.choices[0].message.content;
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('AI response parsing failed');
      const parsed = JSON.parse(m[0]);
      // 비한국어 문자 제거 (한글, 영문, 숫자, 기본 특수문자만 허용)
      const sanitize = v => typeof v === 'string'
        ? v.replace(/[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F a-zA-Z0-9%.,·()\-+~:/?!\n""''【】]/g, '')
           .replace(/\s+/g, ' ').trim()
        : v;
      return Object.fromEntries(Object.entries(parsed).map(([k,v]) => [k, sanitize(v)]));
    });

    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
const RDAYS = {'1wk':7,'1mo':30,'3mo':90,'6mo':180,'1y':365};
const pKr = s => parseFloat(String(s??'0').replace(/,/g,''))||0;
const pN  = s => { if(!s||s==='N/A') return null; const n=parseFloat(String(s).replace(/,/g,'')); return isNaN(n)?null:n; };
const fmtDate = d => d.toISOString().slice(0,10).replace(/-/g,'');
const daysAgo = n => { const d=new Date(); d.setDate(d.getDate()-n); return d; };
const timeAgo = date => {
  const s=(Date.now()-date)/1000;
  return s<3600?`${Math.floor(s/60)}분 전`:s<86400?`${Math.floor(s/3600)}시간 전`:`${Math.floor(s/86400)}일 전`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 분기 실적 + 어닝 서프라이즈 + 애널리스트 추정
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/earnings', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    const data = await cached(`earn:${symbol}`, 3600_000, async () => {
      const yfticker = market === 'kr' ? symbol + '.KS' : symbol;
      const py = `
import yfinance as yf, json
import pandas as pd

t = yf.Ticker('${yfticker}')
result = {}

# 분기 실적 이력 (EPS 실제 vs 추정)
try:
    eh = t.earnings_history
    if eh is not None and not eh.empty:
        rows = []
        for idx, r in eh.iterrows():
            rows.append({
                'date': str(idx)[:10] if hasattr(idx,'strftime') else str(r.get('quarter','')),
                'epsActual': round(float(r.get('epsActual') or 0), 2),
                'epsEstimate': round(float(r.get('epsEstimate') or 0), 2),
                'surprise': round(float(r.get('surprisePercent') or 0)*100, 1),
            })
        result['earningsHistory'] = rows[-8:]
except Exception as e: result['_eh_err'] = str(e)

# 분기 손익계산서 (매출/영업이익/순이익)
try:
    qi = t.quarterly_income_stmt
    if qi is not None and not qi.empty:
        quarters = []
        for col in qi.columns[:6]:
            try:
                rev = float(qi.loc['Total Revenue', col]) if 'Total Revenue' in qi.index else None
                oi  = float(qi.loc['Operating Income', col]) if 'Operating Income' in qi.index else None
                ni  = float(qi.loc['Net Income', col]) if 'Net Income' in qi.index else None
                quarters.append({'date': str(col)[:10], 'revenue': rev, 'operatingIncome': oi, 'netIncome': ni})
            except: pass
        result['quarterlyFinancials'] = quarters
except Exception as e: result['_qi_err'] = str(e)

# 애널리스트 추정 (다음 분기/연도 EPS & 매출)
try:
    cal = t.calendar
    if cal:
        result['nextEarningsDate'] = str(cal.get('Earnings Date', [None])[0] if isinstance(cal.get('Earnings Date'), list) else cal.get('Earnings Date'))[:10]
        result['epsEstimateNext'] = cal.get('Earnings Average')
        result['epsEstimateHigh'] = cal.get('Earnings High')
        result['epsEstimateLow'] = cal.get('Earnings Low')
        result['revenueEstimateNext'] = cal.get('Revenue Average')
        result['dividendDate'] = str(cal.get('Dividend Date', ''))[:10] if cal.get('Dividend Date') else None
        result['exDividendDate'] = str(cal.get('Ex-Dividend Date', ''))[:10] if cal.get('Ex-Dividend Date') else None
except Exception as e: result['_cal_err'] = str(e)

# 애널리스트 목표주가
try:
    apt = t.analyst_price_targets
    if apt:
        result['targetHigh'] = apt.get('high')
        result['targetLow'] = apt.get('low')
        result['targetMean'] = apt.get('mean')
        result['targetMedian'] = apt.get('median')
        result['currentPrice'] = apt.get('current')
except: pass

# 애널리스트 추천 분포
try:
    rs = t.recommendations_summary
    if rs is not None and not rs.empty:
        r0 = rs.iloc[0]
        result['recStrongBuy'] = int(r0.get('strongBuy', 0))
        result['recBuy'] = int(r0.get('buy', 0))
        result['recHold'] = int(r0.get('hold', 0))
        result['recSell'] = int(r0.get('sell', 0))
        result['recStrongSell'] = int(r0.get('strongSell', 0))
except: pass

# 수익성 추정 (연간)
try:
    ee = t.earnings_estimate
    if ee is not None and not ee.empty:
        row = ee.iloc[0]
        result['fwdEpsAvg'] = round(float(row.get('avg',0) or 0), 2)
        result['fwdEpsGrowth'] = round(float(row.get('growth',0) or 0)*100, 1)
except: pass

print(json.dumps(result, ensure_ascii=False, default=str))
`;
      return yfRun(py);
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 동종업계 비교 (Peers)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/peers', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    const data = await cached(`peers:${symbol}`, 3600_000, async () => {
      const yfticker = market === 'kr' ? symbol + '.KS' : symbol;
      const py = `
import yfinance as yf, json

t = yf.Ticker('${yfticker}')
info = t.info
sector = info.get('sector','')
industry = info.get('industry','')

# 동종 업계 경쟁사 (yfinance recommendations로 유사 종목 찾기)
peer_map = {
    'Semiconductors': ['NVDA','AMD','INTC','AVGO','QCOM','TSM','MU','AMAT','KLAC','LRCX'],
    'Software': ['MSFT','ORCL','CRM','ADBE','SAP','NOW','WDAY','INTU'],
    'Internet': ['GOOGL','META','AMZN','NFLX','SNAP','PINS'],
    'Consumer Electronics': ['AAPL','SONY','005930.KS','000660.KS','066570.KS'],
    'E-commerce': ['AMZN','BABA','JD','EBAY','SHOP','WMT'],
    'Finance': ['JPM','BAC','WFC','GS','MS','C','BRK-B'],
    'Pharma': ['LLY','JNJ','PFE','ABBV','MRK','BMY','GILD'],
    'Automotive': ['TSLA','TM','F','GM','005380.KS','000270.KS'],
    'Energy': ['XOM','CVX','COP','BP','SHEL'],
    'default': []
}

peers_list = peer_map.get(industry, peer_map.get(sector, []))
# 현재 종목 제외
main = '${yfticker}'.replace('.KS','')
peers_list = [p for p in peers_list if p.replace('.KS','') != main][:6]

if not peers_list:
    # yfinance similar_companies
    try:
        sc = getattr(t, 'similar_companies', None) or []
        peers_list = list(sc)[:6]
    except: pass

result = []
for peer in peers_list:
    try:
        pt = yf.Ticker(peer)
        pi = pt.info
        pfi = pt.fast_info
        h = pt.history(period='2d')
        price = float(h['Close'].iloc[-1]) if len(h) > 0 else (pfi.last_price or 0)
        prev  = float(h['Close'].iloc[-2]) if len(h) > 1 else price
        chg   = (price-prev)/prev*100 if prev else 0
        result.append({
            'ticker': peer,
            'name': pi.get('shortName') or pi.get('longName') or peer,
            'price': round(price, 2),
            'changePct': round(chg, 2),
            'per': pi.get('trailingPE'),
            'forwardPer': pi.get('forwardPE'),
            'pbr': pi.get('priceToBook'),
            'roe': round((pi.get('returnOnEquity') or 0)*100, 1) or None,
            'marketCap': pfi.market_cap,
            'revenueGrowth': round((pi.get('revenueGrowth') or 0)*100, 1) or None,
            'profitMargin': round((pi.get('profitMargins') or 0)*100, 1) or None,
            'div': round((pi.get('dividendYield') or 0)*100, 2) or None,
        })
    except: pass

print(json.dumps({'sector': sector, 'industry': industry, 'peers': result}, ensure_ascii=False, default=str))
`;
      return yfRun(py);
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 스크리너 — NAVER 전체 종목 + S&P 500 풀 리스트
// ─────────────────────────────────────────────────────────────────────────────
// 사이드바용 기존 소규모 목록 (UI에서 직접 참조)
const ALL_KR = ['005930','000660','373220','207940','005380','000270','005490','035420','035720','068270','105560','055550','086790','066570','006400','012450','018260','259960','323410','033780','015760','096770','247540','003670','034020'];
const ALL_US = ['NVDA','AAPL','MSFT','GOOGL','AMZN','META','TSLA','NFLX','AMD','AVGO','QCOM','TSM','INTC','JPM','BRK-B','V','MA','LLY','UNH','PLTR','CRM','ORCL','XOM','WMT'];

// S&P 500 + NASDAQ 대형주 전체
const SP500 = [
  'NVDA','AAPL','MSFT','GOOGL','GOOG','AMZN','META','TSLA','BRK-B','AVGO',
  'LLY','JPM','V','UNH','XOM','MA','COST','HD','PG','NFLX',
  'WMT','JNJ','AMD','ORCL','BAC','CRM','MRK','ABBV','CVX','KO',
  'PEP','TMO','ACN','CSCO','LIN','MCD','ABT','TXN','ADBE','NKE',
  'PM','NEE','RTX','QCOM','IBM','GE','AMGN','HON','CAT','PLTR',
  'TSM','NOW','ISRG','GS','MS','BLK','AXP','SPGI','C','T',
  'VZ','TMUS','DIS','CMCSA','BA','LMT','NOC','GD','DE','MMM',
  'ETN','EMR','DHR','SYK','MDT','ELV','HCA','BMY','BSX','ZTS',
  'REGN','VRTX','MRNA','BX','KKR','SCHW','USB','PNC','TFC','COF',
  'WFC','PYPL','UBER','ABNB','SQ','SHOP','SNAP','COIN','MSTR','INTC',
  'MU','AMAT','LRCX','KLAC','MRVL','MCHP','ADI','ON','NXPI','SWKS',
  'COP','SLB','HAL','MPC','PSX','VLO','EOG','DVN','OXY',
  'SO','DUK','AEP','EXC','SRE','D','PCG','ED','XEL','ES',
  'PLD','AMT','CCI','EQIX','SPG','O','VICI','WELL','EXR','AVB',
  'F','GM','RIVN','NIO','XPEV','LI','HOG','LCID','WKHS',
  'AMZN','NFLX','SPOT','RBLX','EA','TTWO','ROKU','PINS','SNAP','LYFT',
  'DASH','HOOD','NU','AFRM','UPST','SOFI',
  'MMC','ICE','CME','AON','MET','PRU','AFL','ALL','AIG','PGR',
  'TRV','HIG','CB','CINF','WRB','MKL','ERIE',
  'JNJ','PFE','ABBV','MRK','BMY','AMGN','GILD','BIIB','REGN','VRTX',
  'MRNA','BNTX','NVAX','SRPT','ALNY','INCY','EXEL','HALO',
  'UNH','CVS','CI','HUM','CNC','MOH','HCA','THC','UHS',
  'WMT','COST','TGT','EBAY','ETSY','W','CHWY',
  'MCD','SBUX','YUM','DPZ','CMG','DRI','TXRH',
].filter((v,i,a)=>a.indexOf(v)===i); // dedupe

// KOSPI/KOSDAQ 주요 종목 리스트 (시총 상위)
const KR_UNIVERSE = [
  // KOSPI 시총 상위 200
  '005930','000660','373220','207940','005380','000270','005490','035420','035720','068270',
  '105560','055550','086790','066570','006400','012450','018260','259960','323410','033780',
  '015760','096770','247540','003670','034020','051910','009540','032830','030200','017670',
  '011200','000810','028260','316140','024110','086280','010950','011070','003550','004020',
  '009830','010140','001040','097950','090430','002790','000100','042660','000720','271560',
  '000150','004170','009150','016360','018880','020560','021240','023530','025270','026960',
  '028050','029780','030000','032640','033630','034730','035000','036570','039490','041510',
  '042670','044380','047810','048260','051600','055490','055770','058430','059090','060000',
  '060980','067160','068400','071050','071840','072870','073240','078930','079550','081660',
  '083570','085310','086900','087010','088980','090350','091810','092200','095570','097600',
  '099190','100840','102280','103140','104480','105630','111770','112040','115390','117930',
  '120110','128940','130660','138040','139130','141080','000080','000120','000240','000370',
  '000480','000490','000590','000640','000680','000760','000830','001120','001230','001740',
  '002380','002410','002450','002820','003240','003490','003560','003600','003800','004000',
  '004310','004370','004490','004830','005250','005300','005850','005945','006260','006370',
  '006490','006560','006650','006800','007070','007310','007340','008770','009200','009240',
  '009410','009770','009780','010060','010120','010130','010620','010950','011150','011790',
  '012030','012330','012750','013000','013360','014160','014680','014830','015230','015540',
  '016090','017040','017390','017960','018270','018880','019170','019680','021240','022100',
  '023590','024720','026960','027740','028300','030610','033270','035510','037270','047050',
  // KOSDAQ 주요 종목 200
  '035760','068760','086520','196170','214150','263750','357780','404990','450080','140610',
  '036030','091990','095660','145720','166090','214370','225570','240810','248070','277810',
  '298380','311060','336260','347860','352820','357550','376300','383310','402340','403870',
  '413640','419080','432320','435150','443060','450760','451800','460860','462290','464310',
  '066970','078020','095720','112240','137400','145995','214450','225330','241560','263720',
  '033310','041960','048410','052690','054040','056190','058500','060310','064760','065510',
  '066830','067570','068270','070080','072950','073480','073640','075130','078340','083790',
  '084730','085660','086900','087220','088790','089030','089890','091120','091580','091990',
  '094280','095190','095660','096300','097800','098460','099430','100250','102120','103230',
  '108320','108860','109070','110020','110790','111780','112710','115160','119860','120121',
  '122870','123420','126700','127160','128600','131030','131370','131790','138690','145020',
  '145210','147760','151910','154040','155900','161390','161890','166090','166480','171090',
  '172580','175330','178320','180640','182360','183490','187220','189300','192400','194370',
  '196300','199800','204210','214450','217270','219130','222080','225570','226340','228760',
  '232140','234920','236340','237690','238490','240810','241560','243070','247540','249420',
  '251270','251440','253450','256840','259850','263720','263750','264850','265520','267270',
];

// NAVER 배치 API로 KR 종목 가격 수집
async function fetchNaverMarket() {
  const results = {};
  // NAVER sise_market_sum 페이지 1 (세션 없이도 50개 가능)
  try {
    const r = await fetch('https://finance.naver.com/sise/field_submit.naver?menu=market_sum&returnUrl=http%3A%2F%2Ffinance.naver.com%2Fsise%2Fsise_market_sum.naver%3Fsosok%3D0&fieldIds=per&fieldIds=pbr&fieldIds=dvr&sosok=0&pageNo=1', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.naver.com/' }
    });
    const html = await r.text();
    const rowBlockRe = /href="\/item\/main\.naver\?code=([0-9]{6})"[^>]*class="tltle">([^<]+)<\/a>([\s\S]*?)(?=href="\/item\/main\.naver\?code=|<\/tbody>)/g;
    let m;
    while ((m = rowBlockRe.exec(html)) !== null) {
      const code = m[1], name = m[2].trim(), block = m[3];
      const priceM = block.match(/class="number">\s*([\d,]+)\s*</);
      const pctM = block.match(/nv01">\s*([\-\d.]+)%/);
      const numAll = [...block.matchAll(/class="number">\s*([\d.,\-]+)\s*</g)].map(x => parseFloat(x[1].replace(/,/g,''))||null);
      const price = priceM ? parseFloat(priceM[1].replace(/,/g,'')) : 0;
      const changePct = pctM ? parseFloat(pctM[1]) : 0;
      const per = numAll[numAll.length - 3] || null;
      const pbr = numAll[numAll.length - 2] || null;
      const div = numAll[numAll.length - 1] || null;
      if (price > 0) results[code] = { market: 'kr', name, price, changePct, per, pbr, div };
    }
  } catch {}

  // 나머지 KR 종목: yfinance .KS 배치 다운로드
  const remaining = KR_UNIVERSE.filter(c => !results[c]);
  if (remaining.length > 0) {
    try {
      const krPy = `
import yfinance as yf, json, contextlib, io as _io
tickers_ks = [t+'.KS' for t in ${JSON.stringify(remaining)}]
orig = ${JSON.stringify(remaining)}
result = {}
chunk_size = 50
for i in range(0, len(tickers_ks), chunk_size):
    chunk_ks = tickers_ks[i:i+chunk_size]
    chunk_or = orig[i:i+chunk_size]
    try:
        with contextlib.redirect_stderr(_io.StringIO()):
            df = yf.download(chunk_ks, period='2d', auto_adjust=True, progress=False, group_by='ticker')
        for ks, code in zip(chunk_ks, chunk_or):
            try:
                cols = df[ks] if len(chunk_ks)>1 else df
                cl = cols['Close'].dropna()
                p = float(cl.iloc[-1])
                prev = float(cl.iloc[-2]) if len(cl)>=2 else p
                if p > 0:
                    try: name = yf.Ticker(ks).fast_info.display_name or code
                    except: name = code
                    result[code] = {'market':'kr','price':round(p,0),'changePct':round((p-prev)/prev*100,2) if prev else 0,'name':name}
            except: pass
    except: pass
print(json.dumps(result))
`;
      const krExtra = await _pyExecLong(krPy);
      Object.assign(results, krExtra);
    } catch {}
  }
  return results;
}

app.get('/api/screener-data', async (_, res) => {
  try {
    const data = await cached('screener', 1800_000, async () => {
      // KR: NAVER + 배치 polling으로 KR_UNIVERSE 전체 가격 수집
      const krResults = await fetchNaverMarket();

      // US: S&P500 전체 yfinance 배치 (가격만 빠르게, 지표는 기존 60종목만)
      const usTickers = SP500.slice(0, 200); // 200개 제한 (속도)
      const usPy = `
import yfinance as yf, json, warnings, os
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'
tickers = ${JSON.stringify(usTickers)}
result = {}
try:
    # 청크별 다운로드 (일부 티커 실패 격리)
    chunk_size = 30
    for i in range(0, len(tickers), chunk_size):
        chunk = tickers[i:i+chunk_size]
        try:
            import contextlib, io as _io
            with contextlib.redirect_stderr(_io.StringIO()):
                df = yf.download(chunk, period='2d', auto_adjust=True, progress=False, group_by='ticker')
            for sym in chunk:
                try:
                    cols = df[sym] if len(chunk)>1 else df
                    cl = cols['Close'].dropna()
                    p = float(cl.iloc[-1])
                    prev = float(cl.iloc[-2]) if len(cl) >= 2 else p
                    if p > 0:
                        result[sym] = {'market':'us','price':round(p,2),'changePct':round((p-prev)/prev*100,2) if prev else 0}
                except: pass
        except Exception:
            for sym in chunk:
                try:
                    fi = yf.Ticker(sym).fast_info
                    p = fi.last_price; prev = fi.previous_close or p
                    if p and p > 0:
                        result[sym] = {'market':'us','price':round(p,2),'changePct':round((p-prev)/prev*100,2) if prev else 0}
                except: pass
    # 지표: 상위 60개만 (속도)
    top60 = ${JSON.stringify(usTickers.slice(0,60))}
    ts = yf.Tickers(' '.join(top60))
    for sym in top60:
        try:
            t = ts.tickers[sym]
            info = t.info
            fi = t.fast_info
            r = result.get(sym, {'market':'us'})
            r.update({
                'marketCap': fi.market_cap,
                'per': info.get('trailingPE'),
                'pbr': info.get('priceToBook'),
                'roe': round((info.get('returnOnEquity') or 0)*100,1) or None,
                'div': round((info.get('dividendYield') or 0)*100,2) or None,
                'revenueGrowth': round((info.get('revenueGrowth') or 0)*100,1) or None,
                'profitMargin': round((info.get('profitMargins') or 0)*100,1) or None,
                'name': info.get('shortName') or sym,
                'sector': info.get('sector',''),
            })
            result[sym] = r
        except: pass
except Exception: pass
print(json.dumps(result))
`;
      const usResults = await _pyExecLong(usPy);

      return { ...krResults, ...usResults };
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 매크로 대시보드 (지수 + 환율 + 금리 + 원자재 통합)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/macro', async (_, res) => {
  try {
    const data = await cached('macro', 300_000, async () => {
      const py = `
import yfinance as yf, json

result = {}
items = [
    ('^VIX','vix'), ('^TNX','us10y'), ('^IRX','us3m'), ('^FVX','us5y'),
    ('USDKRW=X','usdkrw'), ('DX-Y.NYB','dxy'), ('EURUSD=X','eurusd'), ('USDJPY=X','usdjpy'),
    ('GC=F','gold'), ('CL=F','oil'), ('SI=F','silver'), ('BTC-USD','btc'),
    ('^GSPC','sp500'), ('^IXIC','nasdaq'), ('^DJI','dow'),
]
for sym, key in items:
    try:
        h = yf.Ticker(sym).history(period='2d')
        if len(h) >= 1:
            p = float(h['Close'].iloc[-1])
            prev = float(h['Close'].iloc[-2]) if len(h) >= 2 else p
            chg = (p-prev)/prev*100 if key not in ('us10y','us3m','us5y','vix') else p-prev
            result[key] = {'value': round(p,2), 'change': round(chg,2)}
    except: pass
print(json.dumps(result))
`;
      return yfRun(py);
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// AI 매수 신호 — 전체 종목 일괄 분석
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/buy-signals', async (req, res) => {
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'GROQ_API_KEY not set' });
  if (req.query.force) _c.delete('buy-signals');
  try {
    const data = await cached('buy-signals', 1800_000, async () => {
      // 1. 스크리너 데이터 가져오기 (캐시 우선, 없으면 직접 fetch)
      let screener = getC('screener');
      if (!screener || Object.keys(screener).length < 10) {
        const r = await fetch(`http://localhost:${PORT}/api/screener-data`);
        screener = await r.json();
      }

      // 2. 전체 종목에서 데이터 있는 것만 추출 + 정량 점수로 상위 150개 선별
      const scored = Object.entries(screener)
        .filter(([, s]) => s.price && s.price > 0)
        .map(([ticker, s]) => {
          // 정량 점수: 저PER, 고ROE, 저PBR, 배당, 상승모멘텀
          let score = 0;
          if (s.per && s.per > 0 && s.per < 20) score += (20 - s.per);
          if (s.roe && s.roe > 0) score += Math.min(s.roe, 30);
          if (s.pbr && s.pbr > 0 && s.pbr < 3) score += (3 - s.pbr) * 5;
          if (s.div && s.div > 0) score += Math.min(s.div * 3, 15);
          if (s.changePct > 0) score += Math.min(s.changePct, 5);
          if (s.revenueGrowth > 10) score += Math.min(s.revenueGrowth * 0.3, 10);
          return { ticker, score, ...s };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 150);

      // 3. 종목 요약 텍스트 생성 (상위 150개만 AI에 전달)
      const lines = scored.map(s => {
        const parts = [
          `${s.ticker}(${s.market?.toUpperCase()})`,
          s.name ? `"${s.name}"` : '',
          s.price ? `가격:${s.price}` : '',
          s.changePct != null ? `등락:${s.changePct}%` : '',
          s.per != null ? `PER:${s.per}` : '',
          s.pbr != null ? `PBR:${s.pbr}` : '',
          s.roe != null ? `ROE:${s.roe}%` : '',
          s.div != null ? `배당:${s.div}%` : '',
          s.revenueGrowth != null ? `매출성장:${s.revenueGrowth}%` : '',
          s.profitMargin != null ? `순이익률:${s.profitMargin}%` : '',
        ].filter(Boolean).join(' ');
        return parts;
      }).join('\n');

      // 4. Groq AI에 일괄 분석 요청
      const groq = getGrok();
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        messages: [
          { role: 'system', content: `당신은 전문 주식 애널리스트입니다. 제공된 종목 데이터를 분석해 현재 시점에서 매수를 고려할 만한 종목을 선별하세요.
응답은 반드시 아래 JSON 형식만 출력하세요:
{"buys":[{"ticker":"종목코드","name":"종목명","reason":"한 문장 이유","confidence":75},...]}
- confidence는 50~95 범위의 정수
- 매수 추천 종목은 최대 15개
- 명확한 근거가 있는 종목만 포함` },
          { role: 'user', content: `다음 종목들의 투자 지표를 분석해 매수 신호 종목을 선별해주세요:\n\n${lines}` }
        ]
      });

      const text = completion.choices[0].message.content;
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('AI 응답 파싱 실패');
      const parsed = JSON.parse(match[0]);

      // 5. 각 종목에 screener 데이터 병합
      const buys = (parsed.buys || []).map(b => {
        const s = screener[b.ticker] || {};
        return { ...b, ...s, id: b.ticker, ticker: b.ticker, reason: b.reason, confidence: b.confidence };
      });

      // 가격 데이터가 없으면 캐시하지 않음 (screener 미준비 상태)
      const hasPrice = buys.some(b => b.price && b.price > 0);
      if (!hasPrice) throw new Error('screener 데이터 미준비 — 재시도 필요');

      return { buys, updatedAt: Date.now() };
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\n  ✓ StockLens  →  http://localhost:${PORT}\n`);
  // 서버 시작 후 주요 종목 캐시 워밍업 (백그라운드)
  warmupCache();
});

async function warmupCache() {
  // 1. 지수 + 환율 먼저 (빠름)
  setTimeout(async () => {
    try { await Promise.all([
      cached('indices', 60_000, () => Promise.all([
        krIndex('KOSPI','KOSPI'), krIndex('KOSDAQ','KOSDAQ'),
        yfIndex('^GSPC','S&P 500'), yfIndex('^IXIC','NASDAQ'), yfIndex('^DJI','DOW'),
      ])),
      cached('macro', 300_000, () => yfRun(`
import yfinance as yf, json
result = {}
items = [('^VIX','vix'),('^TNX','us10y'),('^IRX','us3m'),('^FVX','us5y'),
         ('USDKRW=X','usdkrw'),('DX-Y.NYB','dxy'),('EURUSD=X','eurusd'),('USDJPY=X','usdjpy'),
         ('GC=F','gold'),('CL=F','oil'),('SI=F','silver'),('BTC-USD','btc'),
         ('^GSPC','sp500'),('^IXIC','nasdaq'),('^DJI','dow')]
for sym, key in items:
    try:
        h = yf.Ticker(sym).history(period='2d')
        if len(h) >= 1:
            p = float(h['Close'].iloc[-1])
            prev = float(h['Close'].iloc[-2]) if len(h) >= 2 else p
            chg = (p-prev)/prev*100 if key not in ('us10y','us3m','us5y','vix') else p-prev
            result[key] = {'value': round(p,2), 'change': round(chg,2)}
    except: pass
print(json.dumps(result))
`)),
    ]); } catch {}
  }, 1000);

  // 2. US 주요 종목 사이드바 일괄 (yfinance download)
  setTimeout(async () => {
    const usTop = ['NVDA','AAPL','MSFT','GOOGL','AMZN','META','TSLA','NFLX','AMD','AVGO','QCOM','TSM','INTC','JPM','BRK-B','V','MA','LLY','UNH','PLTR','CRM','ORCL','XOM','WMT'];
    try {
      const tickers = usTop.join(' ');
      const data = await yfRun(`
import yfinance as yf, json
df = yf.download('${tickers}', period='2d', auto_adjust=True, progress=False, group_by='ticker')
out = {}
tickers = '${tickers}'.split()
for sym in tickers:
    try:
        cols = df[sym]
        price = float(cols['Close'].iloc[-1])
        prev  = float(cols['Close'].iloc[-2]) if len(cols) >= 2 else price
        chg   = (price-prev)/prev*100 if prev else 0
        out[sym] = {'price': round(price,2), 'changePct': round(chg,4)}
    except: pass
print(json.dumps(out))
`);
      const ttl = 60_000;
      Object.entries(data).forEach(([sym, d]) => { if (d?.price) setC(`sb:${sym}`, d, ttl); });
      console.log(`  ✓ US 사이드바 워밍업 완료 (${Object.keys(data).length}개)`);
    } catch(e) { console.log('  ⚠ US 워밍업 실패:', e.message); }
  }, 3000);

  // 3. KR 주요 종목 사이드바 병렬
  setTimeout(async () => {
    const krTop = ['005930','000660','005380','000270','035420','035720','068270','105560','066570','012450'];
    await Promise.allSettled(krTop.map(async ticker => {
      try {
        const d = await fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/stock/${ticker}`,{Referer:'https://finance.naver.com/'});
        const rt = d.datas?.[0] ?? {};
        const data = { price: pKr(rt.closePrice), changePct: parseFloat(rt.fluctuationsRatioRaw ?? '0') };
        if (data.price) setC(`sb:${ticker}`, data, 60_000);
      } catch {}
    }));
    console.log(`  ✓ KR 사이드바 워밍업 완료`);
  }, 5000);

  // 4. 스크리너 데이터 백그라운드 워밍업 (느리지만 캐시해두면 AI 매수 신호 빠름)
  setTimeout(async () => {
    try {
      await cached('screener', 1800_000, async () => {
        const r = await fetch(`http://localhost:${PORT}/api/screener-data`);
        return r.json();
      });
      console.log('  ✓ 스크리너 워밍업 완료');
    } catch(e) { console.log('  ⚠ 스크리너 워밍업 실패:', e.message); }
  }, 8000);
}
