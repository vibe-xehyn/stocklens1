import express from 'express';
import compression from 'compression';
import { execFile, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

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
// ── 결정론적 상승/하락 원인 생성 (친절하고 전문적인 분석 텍스트) ──────────────
function buildDeterministicPriceMove(symbol, isKr, q, news, reasons, t, flow, macro) {
  if (q.changePct == null) return '';
  const isUp = (q.changePct ?? 0) >= 0;
  const direction = isUp ? '상승' : '하락';
  const signStr = isUp ? '+' : '';
  const pctStr = `${signStr}${q.changePct.toFixed(2)}%`;
  
  // 1. 시장 개요 및 등락 추이
  let summary = `금일 ${symbol} 주가는 전일 대비 ${pctStr} ${direction} 마감하였습니다. `;
  
  // 2. 뉴스 및 모멘텀 요인 (최대 3개 뉴스 반영)
  let newsPart = '';
  if (news && news.length > 0) {
    const newsTitles = news.slice(0, 3).map(n => `"${n.title.replace(/[▲▼▽▲◇◆□■\-\[\]]/g, '').replace(/\s+/g, ' ').trim()}"`).join(', ');
    newsPart = `시장의 거래 분위기를 이끈 언론 보도로는 ${newsTitles} 등이 보도되며 투자자들의 심리적 모멘텀 및 수급 쏠림 현상을 강하게 견인하였습니다. `;
  } else {
    newsPart = `최근 공시나 특이할 만한 보도 뉴스가 전무한 상황이나, 지수 편입 및 차트 지표 중심의 수급 흐름이 주도적인 역할을 하였습니다. `;
  }
  
  // 3. 기술적/펀더멘탈 분석 (지표값 구체적 언급)
  let techFundPart = '';
  const techDetails = [];
  if (t && t.rsi != null) techDetails.push(`RSI(14) ${t.rsi.toFixed(1)}`);
  if (t && t.macd != null) techDetails.push(`MACD 모멘텀`);
  if (q && q.per != null) techDetails.push(`PER ${q.per.toFixed(1)}배`);
  if (q && q.pbr != null) techDetails.push(`PBR ${q.pbr.toFixed(1)}배`);
  if (q && q.roe != null) techDetails.push(`ROE ${(q.roe * 100).toFixed(1)}%`);
  
  const activeReasons = reasons && reasons.length > 0 
    ? reasons.slice(0, 3).map(r => r.replace(/[✅⚠️▲▼◆◇■□\-]/g, '').trim()).join(' / ')
    : '';
  
  if (techDetails.length > 0 || activeReasons) {
    techFundPart = `가치 분석 및 기술적 측면에서는 ${techDetails.join(', ')} 등의 주요 지표 수준과 함께 "${activeReasons}" 시그널이 차트상 주요 저항선을 돌파하거나 지지선 역할을 지탱하는 핵심 변수로 식별되었습니다. `;
  }
  
  // 4. 수급 및 매크로 영향 (VIX, 환율, 금리, 공매도 등 반영)
  let flowMacroPart = '';
  const macroDetails = [];
  if (macro && macro.vix) macroDetails.push(`VIX 변동성 지수 ${macro.vix.value}`);
  if (macro && macro.us10y) macroDetails.push(`미국 10년물 국채금리 ${macro.us10y.value}%`);
  if (macro && macro.usdkrw && isKr) macroDetails.push(`원달러 환율 ${macro.usdkrw.value}원`);
  if (flow && flow.institutionPct != null) macroDetails.push(`기관 지분율 ${flow.institutionPct}%`);
  if (flow && flow.shortPct != null) macroDetails.push(`공매도 비율 ${flow.shortPct}%`);
  
  if (macroDetails.length > 0) {
    flowMacroPart = `여기에 더해 시장의 거시 경제적 매크로 요인인 ${macroDetails.join(', ')} 등의 변동 추이가 종합 반영되면서 최종적인 등락폭을 형성하게 된 것으로 정밀 분석됩니다.`;
  } else {
    flowMacroPart = `전체 거시 경제(Macro) 환경 및 세력 기관들의 거래 동향은 큰 변동 없이 안정된 흐름 하에 오늘의 시세를 확정지었습니다.`;
  }
  
  return `${summary}${newsPart}${techFundPart}${flowMacroPart}`;
}

// ── 결정론적 분석 텍스트 생성 (LLM 없이 실제 지표값으로 직접 생성) ──────────────
function buildDeterministicAnalysis(symbol, isKr, t, q, news, flow, macro, sig) {
  const { signal, confidence, score, breakdown: bk, reasons } = sig;
  const currSym = isKr ? '₩' : '$';
  const isUp = (q.changePct ?? 0) >= 0;
  const f1 = v => v != null ? v.toFixed(1) : null;
  const f2 = v => v != null ? v.toFixed(2) : null;
  const fp = v => v != null ? `${(v * 100).toFixed(1)}%` : null;
  const sign = v => v >= 0 ? `+${v}` : `${v}`;

  // ── reasons 분류 ──
  const TECH_KW = ['RSI','MACD','BB','볼린저','스토캐스틱','ADX','MA','OBV','CMF','ROC','MFI','이치모쿠','거래량','캔들','정배열','역배열','신고가','신저가','Williams','추세','과매수','과매도'];
  const VALUE_KW = ['그레이엄','PEG','PER','PBR','Fed모델','과평가','저평가','이익 20%','안전마진'];
  const QUALITY_KW = ['ROE','FCF','영업이익률','버핏','부채','자본'];
  const FLOW_KW = ['공매도','기관','수급','내부자','풋콜','거래대금'];
  const classify = r => {
    if (FLOW_KW.some(k => r.includes(k))) return 'flow';
    if (QUALITY_KW.some(k => r.includes(k))) return 'quality';
    if (VALUE_KW.some(k => r.includes(k))) return 'value';
    if (TECH_KW.some(k => r.includes(k))) return 'tech';
    return 'other';
  };
  const rByType = { tech: [], value: [], quality: [], flow: [], other: [] };
  for (const r of reasons) rByType[classify(r)].push(r);

  // ── summary ──
  // 핵심 signals: 각 카테고리에서 1개씩, 최대 5개
  const topReasons = [
    ...rByType.tech.slice(0, 2),
    ...rByType.value.slice(0, 1),
    ...rByType.quality.slice(0, 1),
    ...rByType.flow.slice(0, 1),
    ...rByType.other.slice(0, 1),
  ].slice(0, 5);
  const signalLabel = { '강력매수': '강력 매수', '매수': '매수', '약매수': '약 매수', '중립': '중립', '약매도': '약 매도', '매도': '매도', '강력매도': '강력 매도' }[signal] ?? signal;
  const summary = `종합 점수 ${score}점으로 ${signalLabel} 의견입니다. ` +
    (topReasons.length ? topReasons.join(', ') + '. ' : '') +
    `팩터별 점수: 기술 ${sign(bk.technical)} / 가치 ${sign(bk.value)} / 품질 ${sign(bk.quality)} / 성장 ${sign(bk.growth)}점.`;

  // ── technical ──
  // 먼저 reasons에서 추출한 풍부한 문자열 사용, 보완 수치 추가
  const techFromReasons = rByType.tech;
  const techExtra = [];
  // reasons에 없는 지표는 수치로 보완
  if (!techFromReasons.some(r => r.includes('RSI')) && t.rsi != null)
    techExtra.push(`RSI(14) ${f1(t.rsi)}${t.rsi > 70 ? ' 과매수' : t.rsi < 30 ? ' 과매도' : ' 중립'}`);
  if (!techFromReasons.some(r => r.includes('MACD')) && t.macd != null && t.macd_signal != null)
    techExtra.push(t.macd > t.macd_signal ? 'MACD 골든크로스' : 'MACD 데드크로스');
  if (!techFromReasons.some(r => r.includes('ADX')) && t.adx != null)
    techExtra.push(`ADX ${f1(t.adx)} — ${t.adx > 25 ? (t.pdi > t.mdi ? '강한 상승 추세' : '강한 하락 추세') : '횡보'}`);
  if (!techFromReasons.some(r => r.includes('볼린저') || r.includes('BB')) && t.bb_pct != null)
    techExtra.push(`볼린저밴드 ${t.bb_pct.toFixed(0)}% 위치${t.bb_pct > 80 ? '(상단)' : t.bb_pct < 20 ? '(하단)' : ''}`);
  if (!techFromReasons.some(r => r.includes('OBV')) && t.obv_trend != null)
    techExtra.push(t.obv_trend > 0 ? 'OBV 상승(매집)' : 'OBV 하락(분산)');
  const allTechParts = [...techFromReasons, ...techExtra];
  const technical = (allTechParts.length ? allTechParts.join('. ') + '. ' : '') +
    `기술적 점수 ${sign(bk.technical)}점.`;

  // ── fundamental ──
  const fundFromReasons = [...rByType.value, ...rByType.quality];
  const fundExtra = [];
  // 수치 데이터로 보완
  const numFund = [];
  if (q.per != null) numFund.push(`PER ${f1(q.per)}배`);
  if (q.forwardPer != null) numFund.push(`예상PER ${f1(q.forwardPer)}배`);
  if (q.pbr != null) numFund.push(`PBR ${f2(q.pbr)}배`);
  if (q.roe != null) numFund.push(`ROE ${fp(q.roe)}`);
  if (q.operatingMargin != null) numFund.push(`영업이익률 ${fp(q.operatingMargin)}`);
  if (q.earningsGrowth != null) numFund.push(`이익성장률 ${fp(q.earningsGrowth)}`);
  if (q.revenueGrowth != null) numFund.push(`매출성장률 ${fp(q.revenueGrowth)}`);
  if (q.debtToEquity != null) numFund.push(`부채비율 ${q.debtToEquity.toFixed(0)}%`);
  if (q.freeCashflow != null) numFund.push(`FCF ${q.freeCashflow > 0 ? '양수(건전)' : '음수(주의)'}`);
  if (q.recommendation) numFund.push(`애널리스트 ${q.recommendation}${q.targetPrice ? ` / 목표가 ${currSym}${q.targetPrice.toLocaleString()}` : ''}`);
  const allFundParts = fundFromReasons.length
    ? [...fundFromReasons, ...(numFund.length ? [`[수치] ${numFund.join(', ')}`] : [])]
    : numFund;
  const fundamental = (allFundParts.length ? allFundParts.join('. ') + '. ' : '') +
    `가치 ${sign(bk.value)} / 품질 ${sign(bk.quality)} / 성장 ${sign(bk.growth)}점.`;

  // ── flow ──
  const flowFromReasons = rByType.flow;
  const flowExtra = [];
  if (flow.institutionPct != null) flowExtra.push(`기관 지분율 ${flow.institutionPct}%`);
  if (flow.insiderPct != null) flowExtra.push(`내부자 지분율 ${flow.insiderPct}%`);
  if (flow.shortPct != null) flowExtra.push(`공매도 ${flow.shortPct}%`);
  if (flow.topHolders?.length) flowExtra.push(`주요 기관: ${flow.topHolders.slice(0, 2).map(h => `${h.name}(${h.pct}%)`).join(', ')}`);
  if (flow.insiderTx?.length) {
    const tx = flow.insiderTx[0];
    flowExtra.push(`내부자 ${tx.type}: ${tx.name} ${tx.shares?.toLocaleString()}주 (${tx.date})`);
  }
  if (flow.options) flowExtra.push(`풋콜비율 ${flow.options.putCallRatio} / 내재변동성 ${flow.options.impliedVol}%`);
  const allFlowParts = [...flowFromReasons, ...flowExtra];
  const flowStr = (allFlowParts.length ? allFlowParts.join('. ') + '. ' : '') +
    `수급 점수 ${sign(bk.flow)}점.`;

  // ── sentiment ──
  const sentParts = [];
  if (news.length > 0) {
    const headlines = news.slice(0, 3).map(n => n.title.slice(0, 55));
    sentParts.push(`최근 뉴스: ${headlines.join(' / ')}`);
  }
  if (macro.vix) sentParts.push(`VIX ${macro.vix.value}${macro.vix.value > 25 ? '(공포 구간)' : macro.vix.value < 15 ? '(안정 구간)' : '(보통)'}`);
  if (macro.usdkrw && isKr) sentParts.push(`환율 ${macro.usdkrw.value}원(${macro.usdkrw.chg > 0 ? '+' : ''}${macro.usdkrw.chg}%)`);
  if (macro.us10y) sentParts.push(`미국 10년물 ${macro.us10y.value}%`);
  const sentiment = (sentParts.length ? sentParts.join('. ') + '. ' : '') +
    `심리 점수 ${sign(bk.sentiment)}점.`;

  // ── risk ──
  const riskItems = [];
  if (t.rsi != null && t.rsi > 75) riskItems.push('RSI 극과매수 — 단기 조정 가능성');
  else if (t.rsi != null && t.rsi < 25) riskItems.push('RSI 극과매도 — 추가 하락 주의');
  if (bk.value < -15) riskItems.push('고평가 밸류에이션 리스크');
  if (q.debtToEquity != null && q.debtToEquity > 200) riskItems.push(`부채비율 ${q.debtToEquity.toFixed(0)}% — 재무 리스크`);
  if (macro.vix?.value > 25) riskItems.push(`VIX ${macro.vix.value} — 시장 변동성 확대`);
  if (macro.us10y?.value > 4.5) riskItems.push(`미국 10년물 ${macro.us10y.value}% — 고금리 환경`);
  if (flow.shortPct != null && flow.shortPct > 10) riskItems.push(`공매도 비율 ${flow.shortPct}% — 하방 압력 주의`);
  // reasons 중 매도 신호에서 리스크 추출
  const bearReasons = reasons.filter(r => r.includes('과평가') || r.includes('데드크로스') || r.includes('역배열') || r.includes('하락') || r.includes('고PBR'));
  for (const r of bearReasons.slice(0, 2)) {
    if (!riskItems.some(ri => ri.includes(r.slice(0, 8)))) riskItems.push(r);
  }
  if (!riskItems.length) riskItems.push('시장 변동성 및 거시경제 리스크를 고려하시기 바랍니다');
  const risk = riskItems.join('. ') + '.';

  // ── price_move ──
  const price_move = buildDeterministicPriceMove(symbol, isKr, q, news, reasons, t, flow, macro);

  return { signal, confidence, score, breakdown: bk, reasons, summary, technical, fundamental, flow: flowStr, sentiment, risk, price_move };
}

app.use(compression({ level: 6 })); // gzip 압축
app.use(express.static(join(__dirname, 'public'), {
  maxAge: '1d',          // JS/CSS/이미지 24시간 브라우저 캐시
  etag: true,
  lastModified: true,
  setHeaders(res, path) {
    // HTML은 캐시 안 함 (항상 최신)
    if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));
app.use((_, res, next) => { res.header('Access-Control-Allow-Origin', '*'); next(); });

// ── Cache ─────────────────────────────────────────────────────────────────────
const _c = new Map();
const getC = k => { const e=_c.get(k); if(!e||Date.now()>e.exp){_c.delete(k);return null;} return e.d; };
const setC = (k,d,ms) => { _c.set(k,{d,exp:Date.now()+ms}); return d; };
const cached = async (k,ms,fn) => getC(k) ?? setC(k, await fn(), ms);
// stale-while-revalidate: 캐시 있으면 즉시 응답 + 백그라운드 갱신, 없으면 await
const _swrInflight = new Set();
async function serveSWR(res, key, ttl, fn) {
  const stale = getC(key);
  if (stale != null) {
    res.json(stale);
    if (!_swrInflight.has(key)) {
      _swrInflight.add(key);
      setImmediate(async () => {
        try { setC(key, await fn(), ttl); } catch {}
        finally { _swrInflight.delete(key); }
      });
    }
    return;
  }
  try {
    const fresh = await fn();
    setC(key, fresh, ttl);
    res.json(fresh);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
// 만료 키 주기적 정리 (10분마다)
setInterval(() => { const now = Date.now(); for (const [k,e] of _c) if (now > e.exp) _c.delete(k); }, 600_000);

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

// ── NAVER Finance API (Railway에서 안정적으로 작동) ─────────────────────────
const NAVER_REF = { Referer: 'https://m.stock.naver.com/' };
const _nNum = s => parseFloat(String(s ?? '').replace(/,/g, '')) || 0;
const _nDate = d => d.slice(0,4) + '-' + d.slice(4,6) + '-' + d.slice(6,8);
const _usSuffixCache = new Map(); // ticker -> suffix that worked (.O or '')

function _dayRange(range) {
  const days = { '1wk':14, '1mo':45, '3mo':100, '6mo':200, '1y':380 }[range] || 45;
  const fmt = d => d.toISOString().slice(0,10).replace(/-/g,'') + '0000';
  return { start: fmt(new Date(Date.now() - days*86400_000)), end: fmt(new Date()) };
}

async function _naverWorldQuote(symbolWithSfx) {
  const d = await fetchJSON(`https://polling.finance.naver.com/api/realtime/worldstock/stock/${encodeURIComponent(symbolWithSfx)}`, NAVER_REF);
  const r = d.datas?.[0];
  if (!r) return null;
  const price = _nNum(r.closePriceRaw ?? r.closePrice);
  const change = _nNum(r.compareToPreviousClosePriceRaw ?? r.compareToPreviousClosePrice);
  return {
    price, change,
    changePct: parseFloat(r.fluctuationsRatioRaw ?? r.fluctuationsRatio ?? '0'),
    open: _nNum(r.openPriceRaw ?? r.openPrice),
    high: _nNum(r.highPriceRaw ?? r.highPrice),
    low:  _nNum(r.lowPriceRaw  ?? r.lowPrice),
    volume: _nNum(r.accumulatedTradingVolumeRaw ?? r.accumulatedTradingVolume),
    marketCap: _nNum(r.marketValueFullRaw ?? r.marketValueFull),
    name: r.stockName || symbolWithSfx.split('.')[0],
    currency: r.currencyType?.code || 'USD',
    exchange: r.stockExchangeType?.nameEng || 'US',
  };
}

async function naverUsQuote(ticker) {
  const tried = _usSuffixCache.get(ticker);
  const order = tried !== undefined ? [tried] : ['.O', ''];
  for (const sfx of order) {
    try {
      const q = await _naverWorldQuote(ticker + sfx);
      if (q && q.price) { _usSuffixCache.set(ticker, sfx); return q; }
    } catch {}
  }
  // fallback to opposite suffix on first call if cached lookup failed
  if (tried !== undefined) {
    for (const sfx of ['.O', ''].filter(s => s !== tried)) {
      try {
        const q = await _naverWorldQuote(ticker + sfx);
        if (q && q.price) { _usSuffixCache.set(ticker, sfx); return q; }
      } catch {}
    }
  }
  throw new Error('NAVER: no data for ' + ticker);
}

// NAVER 미국주식 펀더멘탈 (yfinance 실패 시 폴백)
async function naverUsFundamentals(ticker) {
  const tried = _usSuffixCache.get(ticker);
  const order = tried !== undefined ? [tried] : ['.O', ''];
  const tryFetch = async sfx => {
    const d = await fetchJSON(`https://api.stock.naver.com/stock/${encodeURIComponent(ticker + sfx)}/integration`, NAVER_REF);
    if (!d || (!d.stockEndType && !d.dealTrendInfos && !d.totalInfos)) return null;
    return d;
  };
  let d = null;
  for (const sfx of order) {
    try { const r = await tryFetch(sfx); if (r) { _usSuffixCache.set(ticker, sfx); d = r; break; } } catch {}
  }
  if (!d) return {};

  // totalInfos는 [{key, value, code}] 배열 형태
  const ti = {};
  for (const row of (d.totalInfos || [])) {
    if (row?.code) ti[row.code] = _nNum(row.value);
  }
  // dealTrendInfos: 외국인/기관 동향 등
  return {
    name: d.stockName || d.symbolCode || ticker,
    per:        ti.PER       || ti.per       || null,
    pbr:        ti.PBR       || ti.pbr       || null,
    eps:        ti.EPS       || ti.eps       || null,
    bps:        ti.BPS       || ti.bps       || null,
    roe:        ti.ROE       || ti.roe       || null,
    div:        ti.DIV_YIELD || ti.divYield  || ti.dividendYield || null,
    marketCap:  ti.MARKET_VALUE || ti.marketValue || ti.MARKET_CAP || null,
    high52:     ti.HIGH_PRICE_52_WEEK || ti.high52 || ti.YEAR_HIGH || null,
    low52:      ti.LOW_PRICE_52_WEEK  || ti.low52  || ti.YEAR_LOW  || null,
  };
}

async function naverUsChart(ticker, range = '1mo') {
  const { start, end } = _dayRange(range);
  const tried = _usSuffixCache.get(ticker);
  const order = tried !== undefined ? [tried] : ['.O', ''];
  const tryFetch = async sfx => {
    const rows = await fetchJSON(
      `https://api.stock.naver.com/chart/foreign/item/${encodeURIComponent(ticker + sfx)}/day?startDateTime=${start}&endDateTime=${end}`,
      NAVER_REF
    );
    return Array.isArray(rows) && rows.length ? rows : null;
  };
  for (const sfx of order) {
    try { const rows = await tryFetch(sfx); if (rows) { _usSuffixCache.set(ticker, sfx); return rows.map(r => ({ date:_nDate(String(r.localDate)), close:r.closePrice, open:r.openPrice, high:r.highPrice, low:r.lowPrice, volume:r.accumulatedTradingVolume })); } } catch {}
  }
  if (tried !== undefined) {
    for (const sfx of ['.O',''].filter(s=>s!==tried)) {
      try { const rows = await tryFetch(sfx); if (rows) { _usSuffixCache.set(ticker, sfx); return rows.map(r => ({ date:_nDate(String(r.localDate)), close:r.closePrice, open:r.openPrice, high:r.highPrice, low:r.lowPrice, volume:r.accumulatedTradingVolume })); } } catch {}
    }
  }
  throw new Error('NAVER: no chart for ' + ticker);
}

async function naverUsIndex(reutersCode, name) {
  try {
    const d = await fetchJSON(`https://polling.finance.naver.com/api/realtime/worldstock/index/${encodeURIComponent(reutersCode)}`, NAVER_REF);
    const r = d.datas?.[0]; if (!r) throw new Error('empty');
    return { name, value: _nNum(r.closePriceRaw ?? r.closePrice), change: parseFloat(r.fluctuationsRatioRaw ?? r.fluctuationsRatio ?? '0') };
  } catch { return { name, value: 0, change: 0 }; }
}

async function naverUsIndexFull(reutersCode) {
  const d = await fetchJSON(`https://polling.finance.naver.com/api/realtime/worldstock/index/${encodeURIComponent(reutersCode)}`, NAVER_REF);
  const r = d.datas?.[0]; if (!r) throw new Error('empty');
  return { price: _nNum(r.closePriceRaw ?? r.closePrice), changePct: parseFloat(r.fluctuationsRatioRaw ?? r.fluctuationsRatio ?? '0'), change: _nNum(r.compareToPreviousClosePriceRaw ?? r.compareToPreviousClosePrice) };
}

async function naverUsIndexChart(reutersCode, range = '1mo') {
  const { start, end } = _dayRange(range);
  const rows = await fetchJSON(
    `https://api.stock.naver.com/chart/foreign/index/${encodeURIComponent(reutersCode)}/day?startDateTime=${start}&endDateTime=${end}`,
    NAVER_REF
  );
  if (!Array.isArray(rows) || !rows.length) throw new Error('NAVER index: no data');
  return rows.map(r => ({ date: _nDate(String(r.localDate)), close: r.closePrice }));
}

async function naverKrIndexChart(code, range = '1mo') {
  const { start, end } = _dayRange(range);
  const rows = await fetchJSON(
    `https://api.stock.naver.com/chart/domestic/index/${encodeURIComponent(code)}/day?startDateTime=${start}&endDateTime=${end}`,
    NAVER_REF
  );
  if (!Array.isArray(rows) || !rows.length) throw new Error('NAVER kr-index: no data');
  return rows.map(r => ({ date: _nDate(String(r.localDate)), close: r.closePrice }));
}

async function naverKrItemChart(ticker, range = '1mo') {
  const { start, end } = _dayRange(range);
  const rows = await fetchJSON(
    `https://api.stock.naver.com/chart/domestic/item/${encodeURIComponent(ticker)}/day?startDateTime=${start}&endDateTime=${end}`,
    NAVER_REF
  );
  if (!Array.isArray(rows) || !rows.length) throw new Error('NAVER kr-item: no data');
  return rows.map(r => ({ date: _nDate(String(r.localDate)), close: Math.round(r.closePrice) }));
}

async function naverFutures(code) {
  try {
    const d = await fetchJSON(`https://polling.finance.naver.com/api/realtime/worldstock/futures/${encodeURIComponent(code)}`, NAVER_REF);
    const r = d.datas?.[0]; if (!r) return null;
    return { price: _nNum(r.closePriceRaw ?? r.closePrice), changePct: parseFloat(r.fluctuationsRatioRaw ?? r.fluctuationsRatio ?? '0'), change: _nNum(r.compareToPreviousClosePriceRaw ?? r.compareToPreviousClosePrice) };
  } catch { return null; }
}

// ── Yahoo Finance v8 chart API (best-effort fallback, Railway에서 자주 차단됨) ─
async function yahooChart(symbol, range = '1mo', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept':'application/json' }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Yahoo ${r.status}`);
  const j = await r.json();
  const result = j?.chart?.result?.[0];
  if (!result) throw new Error('Yahoo: no result');
  const meta = result.meta || {};
  const ts = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const opens  = result.indicators?.quote?.[0]?.open  || [];
  const highs  = result.indicators?.quote?.[0]?.high  || [];
  const lows   = result.indicators?.quote?.[0]?.low   || [];
  const vols   = result.indicators?.quote?.[0]?.volume|| [];
  const rows = ts.map((t,i) => ({
    date: new Date(t*1000).toISOString().slice(0,10),
    close: closes[i], open: opens[i], high: highs[i], low: lows[i], volume: vols[i]
  })).filter(r => r.close != null);
  return { meta, rows };
}

async function yahooQuote(symbol) {
  const { meta, rows } = await yahooChart(symbol, '5d', '1d');
  const last = rows[rows.length - 1];
  const prev = rows.length >= 2 ? rows[rows.length - 2] : last;
  const price = meta.regularMarketPrice ?? last?.close;
  const prevClose = meta.chartPreviousClose ?? prev?.close ?? price;
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;
  return {
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 10000) / 10000,
    open: last?.open, high: last?.high, low: last?.low, volume: last?.volume,
    high52: meta.fiftyTwoWeekHigh, low52: meta.fiftyTwoWeekLow,
    name: meta.longName || meta.shortName || symbol,
    currency: meta.currency || 'USD',
    exchange: meta.fullExchangeName || meta.exchangeName || '',
  };
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

// JSON 문자열 정화 (NaN/Infinity/nan/NaT/undefined → null)
function _cleanJson(out) {
  let clean = out
    .replace(/(-?\bInfinity\b)/g,'null')
    .replace(/\bNaN\b/g,'null')
    .replace(/\bnan\b/g,'null')
    .replace(/\bNaT\b/g,'null')
    .replace(/"NaT"/g,'null')
    .replace(/\bundefined\b/g,'null');
  try { return JSON.parse(clean); } catch {}
  try {
    const m = clean.match(/[\{\[][\s\S]*[\}\]]/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  throw new Error('yfinance: invalid JSON: '+out.slice(0,200).replace(/\n/g,' '));
}

// ── 영구 Python 워커 풀 (yfinance import 1회로 단축, 병렬성 확보) ──────────
const PY_WORKER_END = '\n__END__\n';
const PY_POOL_SIZE = 3;
let _pyRid = 0;
class PyWorker {
  constructor(id) {
    this.id = id;
    this.proc = null;
    this.buf = '';
    this.ready = false;
    this.pending = new Map(); // rid → {resolve, reject, timer}
    this.readyPromise = new Promise(r => { this._readyResolve = r; });
    this.spawn();
  }
  spawn() {
    this.proc = spawn('python3', ['-u', join(__dirname, 'yf_worker.py')], { stdio: ['pipe','pipe','pipe'] });
    this.proc.stdout.on('data', chunk => {
      this.buf += chunk.toString('utf8');
      let idx;
      while ((idx = this.buf.indexOf(PY_WORKER_END)) !== -1) {
        const msg = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + PY_WORKER_END.length);
        let obj; try { obj = JSON.parse(msg); } catch { continue; }
        if (obj.id === '__ready__') {
          this.ready = true; this._readyResolve();
          console.log(`  ✓ Python 워커 #${this.id} 준비 완료`);
          continue;
        }
        const p = this.pending.get(obj.id);
        if (!p) continue;
        this.pending.delete(obj.id);
        clearTimeout(p.timer);
        if (obj.ok) { try { p.resolve(_cleanJson(obj.out)); } catch (e) { p.reject(e); } }
        else p.reject(new Error(obj.error || 'worker error'));
      }
    });
    this.proc.stderr.on('data', d => process.stderr.write(`[pyw#${this.id}] ` + d));
    this.proc.on('exit', code => {
      console.error(`  ⚠ Python 워커 #${this.id} 종료 (code=${code}). 5초 후 재시작.`);
      this.proc = null; this.ready = false; this.buf = '';
      for (const [, p] of this.pending) { clearTimeout(p.timer); p.reject(new Error('worker died')); }
      this.pending.clear();
      this.readyPromise = new Promise(r => { this._readyResolve = r; });
      setTimeout(() => this.spawn(), 5000);
    });
  }
  load() { return this.pending.size; }
  async exec(script, timeout) {
    if (!this.ready) await this.readyPromise;
    const id = String(++_pyRid);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`python worker timeout (${timeout}ms)`)); }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.proc.stdin.write(JSON.stringify({ id, script }) + '\n');
    });
  }
}
const _pyPool = Array.from({ length: PY_POOL_SIZE }, (_, i) => new PyWorker(i + 1));

async function _pyExec(script, timeout = 30000) {
  // 가장 한가한 워커 선택 (pending 수 기준)
  const w = _pyPool.reduce((a, b) => (a.load() <= b.load() ? a : b));
  return w.exec(script, timeout);
}

function _pyExecLong(script) { return _pyExec(script, 300000); } // 5분 (US 스크리너 등 대용량)

// ─────────────────────────────────────────────────────────────────────────────
// Stooq — US quotes (sidebar + indices, reliable/fast)
// ─────────────────────────────────────────────────────────────────────────────
const stooqSym = s => {
  const l = s.toLowerCase();
  if(l.startsWith('^')) return l.replace('^gspc','^spx').replace('^ixic','^ndq');
  // 원자재/환율/암호화폐/선물: .us 붙이지 않음
  if(/\.(f|us|fx)$/.test(l) || /^(usd|eur|gbp|jpy|btc|eth|xau|xag|cl|gc|si|dxy|usdkrw|usdjpy|eurusd|btcusd|xauusd|siusd)/.test(l)) return l;
  return l + '.us';
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
    fetchJSON(`https://m.stock.naver.com/api/stock/${ticker}/basic`,nv).catch(()=>({})),
    fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/stock/${ticker}`,pv).catch(()=>({datas:[]})),
  ]);
  let rt=rtRes.datas?.[0]??{}, info=basic.stockTradingInfo??{};
  // NAVER 양쪽 모두 실패 시 → yfinance fallback (out-of-universe 종목 보호)
  if (!rt.closePrice && !basic.closePrice) {
    try {
      const yfQuote = await yfRun(`
import yfinance as yf, json
t = yf.Ticker('${ticker}.KS')
h = t.history(period='2d')
fi = t.fast_info
if len(h) >= 1:
    price = float(h['Close'].iloc[-1])
    prev  = float(h['Close'].iloc[-2]) if len(h) >= 2 else price
    chg   = price - prev
    pct   = (chg / prev * 100) if prev else 0
    print(json.dumps({'price': price, 'change': chg, 'changePct': pct,
                      'open': float(h['Open'].iloc[-1]), 'high': float(h['High'].iloc[-1]),
                      'low': float(h['Low'].iloc[-1]), 'volume': int(h['Volume'].iloc[-1]),
                      'name': (t.info.get('longName') or '${ticker}'),
                      'high52': fi.year_high, 'low52': fi.year_low, 'marketCap': fi.market_cap}))
else:
    print(json.dumps({}))
`);
      if (yfQuote.price) {
        rt = { closePrice: String(yfQuote.price), compareToPreviousClosePrice: String(yfQuote.change),
               fluctuationsRatioRaw: String(yfQuote.changePct), openPrice: String(yfQuote.open),
               highPrice: String(yfQuote.high), lowPrice: String(yfQuote.low),
               accumulatedTradingVolumeRaw: String(yfQuote.volume), stockName: yfQuote.name };
        info.high52WeeksPrice = String(yfQuote.high52 || 0);
        info.low52WeeksPrice = String(yfQuote.low52 || 0);
        info.marketValue = String(yfQuote.marketCap || 0);
        basic.stockName = yfQuote.name;
      } else throw new Error('NAVER 및 yfinance 모두 실패');
    } catch (e) { throw new Error('주가 데이터 없음: ' + e.message); }
  }

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
  // 24시간 캐시 — 펀더멘탈은 자주 안 바뀌고, yfinance 실패 시 어제 데이터 유지
  try { yf = await cached(`yfkr:${ticker}`, 86400_000, () => yfRun(yfPy)); } catch {}
  try { yfbs = await cached(`yfkrbs:${ticker}`, 86400_000, () => yfRun(yfBsPy)); } catch {}

  return {
    name:basic.stockName??rt.stockName??ticker, exchange:basic.stockExchangeType?.nameKor??'KOSPI', currency:'KRW',
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
  // NAVER 차트 (yfinance Python 우회 — Railway에서 안정)
  try { return await naverKrItemChart(ticker, range); }
  catch {
    // Fallback: yfinance
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
  // 1차: NAVER (Railway에서 안정)
  let base = null;
  try { base = await naverUsQuote(ticker); } catch {}
  // 2차: Yahoo v8 (로컬에서는 잘 됨)
  if (!base) { try { base = await yahooQuote(ticker); } catch {} }
  // 3차: Stooq
  if (!base) {
    try {
      const sq = await stooqQuote(ticker);
      base = { name: ticker, exchange: 'US', currency: 'USD',
               price: sq.price, change: sq.change, changePct: sq.changePct,
               open: sq.open, high: sq.high, low: sq.low, volume: sq.volume };
    } catch {}
  }
  if (!base) throw new Error('데이터를 가져올 수 없습니다');

  // 펀더멘탈: yfinance 24시간 캐시 + NAVER integration 폴백
  // 같은 종목의 펀더멘탈은 하루 한 번만 yfinance 호출 → 실패해도 어제 데이터 사용
  let fund = {};
  try {
    fund = await cached(`yfusFund:${ticker}`, 86400_000, async () => {
      const py = `
import yfinance as yf, json
t = yf.Ticker('${ticker}')
info = t.info
print(json.dumps({
  'marketCap': info.get('marketCap'),
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
  'high52': info.get('fiftyTwoWeekHigh'),
  'low52': info.get('fiftyTwoWeekLow'),
}))
`;
      return yfRun(py);
    });
  } catch {}

  // yfinance가 비었거나 핵심 필드 누락 시 보완
  const needsFallback = !fund || (fund.per == null && fund.pbr == null && fund.eps == null);
  if (needsFallback) {
    // 1순위: 스크리너 캐시 (이미 fetch됨, 네트워크 0회)
    const sc = getC('screener') || {};
    const scData = sc[ticker];
    if (scData && (scData.per != null || scData.pbr != null)) {
      fund = {
        ...scData,
        ...Object.fromEntries(Object.entries(fund || {}).filter(([,v]) => v != null && v !== 0)),
      };
    } else {
      // 2순위: NAVER integration 크롤링
      try {
        const nv = await cached(`nvFund:${ticker}`, 86400_000, () => naverUsFundamentals(ticker));
        fund = {
          ...nv,
          ...Object.fromEntries(Object.entries(fund || {}).filter(([,v]) => v != null && v !== 0)),
        };
      } catch {}
    }
  }

  // 52주 가격은 base(NAVER 실시간)에 없을 수 있어서 fund에서 끌어옴
  return { ...base, ...fund, high52: base.high52 ?? fund.high52, low52: base.low52 ?? fund.low52 };
}

async function usQuickQuote(ticker) {
  // NAVER 우선, 실패시 stooq, 마지막으로 yfinance fast_info
  try { const q = await naverUsQuote(ticker); return { price: q.price, change: q.change, changePct: q.changePct, open: q.open, high: q.high, low: q.low, volume: q.volume }; } catch {}
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
  // 1차: NAVER chart, 2차: Yahoo v8 fallback
  try {
    const rows = await naverUsChart(ticker, range);
    return rows.map(r => ({ date: r.date, close: Math.round(r.close * 100) / 100 }));
  } catch {
    const yRange = {'1wk':'5d','1mo':'1mo','3mo':'3mo','6mo':'6mo','1y':'1y'}[range] || '1mo';
    const { rows } = await yahooChart(ticker, yRange, '1d');
    return rows.map(r => ({ date: r.date, close: Math.round(r.close * 100) / 100 }));
  }
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
  // 1차: yfinance, 2차: Google News RSS (rss2json)
  try {
    const items = await cached(`news:${symbol}:yf`, 1800_000, () => usNews(symbol));
    if (items && items.length) return items;
  } catch {}
  try {
    const rss = await cached(`news:${symbol}:gn`, 1800_000, () =>
      fetchJSON(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${encodeURIComponent(symbol+' stock')}&hl=en-US&gl=US&ceid=US:en`)}`)
    );
    if (rss?.status === 'ok' && rss.items?.length) {
      return rss.items.slice(0, 6).map(n => ({
        title: n.title.replace(/<[^>]+>/g,''),
        source: n.author || (n.title.match(/ - ([^-]+)$/)?.[1]?.trim()) || 'Google News',
        time: timeAgo(new Date(n.pubDate)),
        url: n.link,
      }));
    }
  } catch {}
  return [];
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

  const ttl = isTradingHours() ? 10_000 : 300_000; // 장중 10초, 장마감 5분
  const cacheKey = `sbb:${market}:${list.join(',')}`;
  const hit = getC(cacheKey);
  if (hit) { res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl/1000)}`); return res.json(hit); }

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
          const data = { price: pKr(rt.closePrice), changePct: parseFloat(rt.fluctuationsRatioRaw ?? '0'), name: rt.stockName, market: 'kr' };
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
          let q = null;
          try { q = await naverUsQuote(sym); } catch {}
          if (!q) { try { q = await yahooQuote(sym); } catch {} }
          if (!q) { try { q = await stooqQuote(sym); } catch {} }
          if (q) {
            const data = { price: q.price, changePct: q.changePct, name: q.name, market: 'us' };
            setC(`sb:${sym}`, data, ttl);
            result[sym] = data;
          }
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
      // NAVER index chart (Railway에서 안정)
      const usMap  = { 'S&P 500': '.INX', NASDAQ: '.IXIC', DOW: '.DJI' };
      const krSet  = new Set(['KOSPI','KOSDAQ']);
      let rows = [];
      try {
        if (krSet.has(symbol))       rows = await naverKrIndexChart(symbol, range);
        else if (usMap[symbol])      rows = await naverUsIndexChart(usMap[symbol], range);
      } catch {}
      // Fallback: Yahoo v8
      if (!rows.length) {
        const yMap = { KOSPI: '^KS11', KOSDAQ: '^KQ11', 'S&P 500': '^GSPC', NASDAQ: '^IXIC', DOW: '^DJI' };
        const yfsym = yMap[symbol] || symbol;
        const yRange = {'1wk':'5d','1mo':'1mo','3mo':'3mo','6mo':'6mo','1y':'1y'}[range] || '1mo';
        const r = await yahooChart(yfsym, yRange, '1d');
        rows = r.rows.map(x => ({ date: x.date, close: x.close }));
      }
      const longRange = ['6mo','1y'].includes(range);
      const fmtOpts = longRange ? {year:'2-digit',month:'short',day:'numeric'} : {month:'short',day:'numeric'};
      return {
        labels: rows.map(r => new Date(r.date).toLocaleDateString('ko', fmtOpts)),
        data: rows.map(r => Math.round(r.close * 100) / 100),
      };
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 거래 시간 상태 API
// US DST: 2번째 일요일(3월 2am) ~ 1번째 일요일(11월 2am)
function nthSunday(year, month, n) { // month: 0=Jan
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return (first === 0 ? 1 : 8 - first) + (n - 1) * 7;
}
function usETOffset(date) {
  const y = date.getUTCFullYear();
  const dstStart = Date.UTC(y, 2, nthSunday(y, 2, 2), 7);  // 3월 2번째 일요일 2am EST(+5)
  const dstEnd   = Date.UTC(y, 10, nthSunday(y, 10, 1), 6); // 11월 1번째 일요일 2am EDT(+4)
  return (date >= dstStart && date < dstEnd) ? -4 : -5;
}

app.get('/api/trading-status', (_, res) => {
  const now = new Date();

  // KST (UTC+9) 기준 요일·분 계산
  const kstMs = now.getTime() + 9 * 3600_000;
  const kstDate = new Date(kstMs);
  const kstDay = kstDate.getUTCDay(); // 0=일, 6=토
  const kstMin = kstDate.getUTCHours() * 60 + kstDate.getUTCMinutes();
  // 한국 장: 평일 09:00~15:30 KST
  const kr = kstDay >= 1 && kstDay <= 5 && kstMin >= 540 && kstMin < 930;

  // ET (DST 반영) 기준 요일·분 계산
  const etOffset = usETOffset(now);
  const etMs = now.getTime() + etOffset * 3600_000;
  const etDate = new Date(etMs);
  const etDay = etDate.getUTCDay();
  const etMin = etDate.getUTCHours() * 60 + etDate.getUTCMinutes();
  // 미국 장: 평일 09:30~16:00 ET
  const us = etDay >= 1 && etDay <= 5 && etMin >= 570 && etMin < 960;

  res.json({ kr, us });
});

// 초기 로딩 통합 엔드포인트 (trading-status + indices + rates 한 번에)
const RATES_CACHE_FILE = join(__dirname, '.rates-cache.json');
const INIT_CACHE_FILE  = join(__dirname, '.init-cache.json');
(function loadInitCaches() {
  try {
    if (existsSync(RATES_CACHE_FILE)) {
      const c = JSON.parse(readFileSync(RATES_CACHE_FILE, 'utf-8'));
      if (c.data && Date.now() - c.savedAt < 3600_000) setC('rates', c.data, 300_000);
    }
  } catch {}
  try {
    if (existsSync(INIT_CACHE_FILE)) {
      const c = JSON.parse(readFileSync(INIT_CACHE_FILE, 'utf-8'));
      if (c.data && Date.now() - c.savedAt < 3600_000) {
        setC('initPayload', c.data, 60_000);
        console.log('  \u2713 init \ucf90\uc2dc \ub85c\ub4dc (\ub514\uc2a4\ud06c)');
      }
    }
  } catch {}
})();

function getTradingStatus() {
  const now = new Date();
  const kstDate = new Date(now.getTime() + 9 * 3600_000);
  const kstDay = kstDate.getUTCDay(), kstMin = kstDate.getUTCHours()*60+kstDate.getUTCMinutes();
  const kr = kstDay>=1&&kstDay<=5&&kstMin>=540&&kstMin<930;
  const etDate = new Date(now.getTime() + usETOffset(now)*3600_000);
  const etDay = etDate.getUTCDay(), etMin = etDate.getUTCHours()*60+etDate.getUTCMinutes();
  const us = etDay>=1&&etDay<=5&&etMin>=570&&etMin<960;
  return { kr, us };
}

async function fetchInitData() {
  const pairs = [['usdkrw','usdkrw'],['usdjpy','usdjpy'],['eurusd','eurusd'],['dx.f','dxy']];
  const [indices, rates] = await Promise.all([
    cached('indices', 60_000, () => Promise.all([
      krIndex('KOSPI','KOSPI'), krIndex('KOSDAQ','KOSDAQ'),
      yfIndex('^GSPC','S&P 500'), yfIndex('^IXIC','NASDAQ'), yfIndex('^DJI','DOW'),
    ])).catch(() => []),
    cached('rates', 300_000, async () => {
      const r = {};
      await Promise.allSettled(pairs.map(async ([sym,key]) => {
        try { const q=await stooqQuote(sym); r[key]={value:q.price,change:q.changePct}; } catch {}
      }));
      return r;
    }).catch(() => ({})),
  ]);
  return { indices, rates };
}

app.get('/api/init', async (_, res) => {
  const trading = getTradingStatus();
  const ttl = (trading.kr||trading.us) ? 15_000 : 120_000;
  const stale = getC('initPayload');
  if (stale) {
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl/1000)}, stale-while-revalidate=30`);
    res.json({ ...stale, trading });
    setImmediate(async () => {
      try {
        _c.delete('initPayload'); _c.delete('indices'); _c.delete('rates');
        const d = await fetchInitData();
        setC('initPayload', d, 60_000);
        writeFileSync(INIT_CACHE_FILE,  JSON.stringify({savedAt:Date.now(),data:d}), 'utf-8');
        writeFileSync(RATES_CACHE_FILE, JSON.stringify({savedAt:Date.now(),data:d.rates}), 'utf-8');
        writeFileSync(INDICES_CACHE_FILE, JSON.stringify({savedAt:Date.now(),data:d.indices}), 'utf-8');
      } catch {}
    });
    return;
  }
  const d = await fetchInitData();
  setC('initPayload', d, 60_000);
  try { writeFileSync(INIT_CACHE_FILE,  JSON.stringify({savedAt:Date.now(),data:d}), 'utf-8'); } catch {}
  try { writeFileSync(RATES_CACHE_FILE, JSON.stringify({savedAt:Date.now(),data:d.rates}), 'utf-8'); } catch {}
  try { writeFileSync(INDICES_CACHE_FILE, JSON.stringify({savedAt:Date.now(),data:d.indices}), 'utf-8'); } catch {}
  res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl/1000)}, stale-while-revalidate=30`);
  res.json({ trading, ...d });
});

// Full quote — detail view
async function fetchQuoteData(symbol, market) {
  if (market === 'kr') {
    const [q,fin]=await Promise.all([krQuote(symbol),krFinancials(symbol)]);
    const merged = {...q,...fin};
    if (!merged.per && fin._trailingEps && merged.price) {
      merged.per = parseFloat((merged.price / fin._trailingEps).toFixed(1));
      merged.eps = fin._trailingEps;
    }
    delete merged._trailingEps;
    return merged;
  }
  return usQuote(symbol);
}

app.get('/api/quote', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  await serveSWR(res, `q:${symbol}`, 60_000, () => fetchQuoteData(symbol, market));
});

async function fetchChartData(symbol, range, market) {
  const raw = market==='kr' ? await krChart(symbol,range) : await usChart(symbol,range);
  const longRange = ['6mo','1y'].includes(range);
  const fmtOpts = longRange
    ? { year:'2-digit', month:'short', day:'numeric' }
    : { month:'short', day:'numeric' };
  return {
    labels: raw.map(d=>new Date(d.date).toLocaleDateString('ko', fmtOpts)),
    data:   raw.map(d=>d.close),
  };
}

app.get('/api/chart', async (req, res) => {
  const { symbol, range='1mo', market } = req.query;
  if (!symbol || symbol === 'UNDEFINED' || symbol === 'undefined' || symbol === 'null') return res.status(400).json({ error: 'symbol required' });
  await serveSWR(res, `c:${symbol}:${range}`, 300_000, () => fetchChartData(symbol, range, market));
});

// US 지수 → NAVER reutersCode 매핑
const US_INDEX_NAVER = { '^GSPC': '.INX', '^IXIC': '.IXIC', '^DJI': '.DJI', '^VIX': '.VIX' };

async function yfIndex(sym, name) {
  // 1차: NAVER (Railway에서 안정)
  const naverCode = US_INDEX_NAVER[sym];
  if (naverCode) {
    try { const q = await naverUsIndexFull(naverCode); return { name, value: q.price, change: q.changePct }; } catch {}
  }
  // 2차: Yahoo v8
  try { const q = await yahooQuote(sym); return { name, value: q.price, change: q.changePct }; } catch {}
  // 3차: Stooq
  try { const q = await stooqQuote(sym); return { name, value: q.price, change: q.changePct }; } catch {}
  return { name, value: 0, change: 0 };
}

const INDICES_CACHE_FILE = join(__dirname, '.indices-cache.json');
(function loadIndicesCache() {
  try {
    if (existsSync(INDICES_CACHE_FILE)) {
      const c = JSON.parse(readFileSync(INDICES_CACHE_FILE, 'utf-8'));
      if (c.data && Date.now() - c.savedAt < 3600_000) {
        setC('indices', c.data, 30_000);
        console.log('  ✓ 지수 캐시 로드 (디스크)');
      }
    }
  } catch {}
})();

app.get('/api/indices', async (_, res) => {
  const stale = getC('indices');
  if (stale) {
    res.json(stale);
    // 백그라운드 갱신
    setImmediate(async () => {
      try {
        _c.delete('indices');
        const ttl = isTradingHours() ? 30_000 : 120_000;
        const d = await cached('indices', ttl, () => Promise.all([
          krIndex('KOSPI','KOSPI'), krIndex('KOSDAQ','KOSDAQ'),
          yfIndex('^GSPC','S&P 500'), yfIndex('^IXIC','NASDAQ'), yfIndex('^DJI','DOW'),
        ]));
        writeFileSync(INDICES_CACHE_FILE, JSON.stringify({ savedAt: Date.now(), data: d }), 'utf-8');
      } catch {}
    });
    return;
  }
  try {
    const ttl = isTradingHours() ? 30_000 : 120_000;
    const data = await cached('indices', ttl, () => Promise.all([
      krIndex('KOSPI',  'KOSPI'), krIndex('KOSDAQ', 'KOSDAQ'),
      yfIndex('^GSPC', 'S&P 500'), yfIndex('^IXIC', 'NASDAQ'), yfIndex('^DJI',  'DOW'),
    ]));
    try { writeFileSync(INDICES_CACHE_FILE, JSON.stringify({ savedAt: Date.now(), data }), 'utf-8'); } catch {}
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl/1000)}, stale-while-revalidate=10`);
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 환율 API
app.get('/api/rates', async (_, res) => {
  try {
    const data = await cached('rates', 300_000, async () => {
      // Stooq primary (Yahoo 차단됨)
      const pairs = [['usdkrw','usdkrw'],['usdjpy','usdjpy'],['eurusd','eurusd'],['dx.f','dxy']];
      const rates = {};
      await Promise.allSettled(pairs.map(async ([sym, key]) => {
        try {
          const q = await stooqQuote(sym);
          rates[key] = { value: q.price, change: Math.round(q.changePct * 100) / 100 };
        } catch {
          try {
            const yMap = { usdkrw:'KRW=X', usdjpy:'JPY=X', eurusd:'EURUSD=X', dxy:'DX-Y.NYB' };
            const q = await yahooQuote(yMap[key]);
            rates[key] = { value: q.price, change: Math.round(q.changePct * 100) / 100 };
          } catch {}
        }
      }));
      return rates;
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/news', async (req, res) => {
  const { symbol, market } = req.query;
  return serveSWR(res, `n:${symbol}`, 600_000, () => getNews(symbol, market==='kr'));
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
  return _pyExecLong(py);
}

app.get('/api/flow', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  return serveSWR(res, `flow:${symbol}`, 1800_000, async () => {
    try { return await getFlowData(symbol, market === 'kr'); }
    catch (e) { console.error('flow 실패:', symbol, e.message?.slice(0, 120)); return {}; }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 결정론적 시그널 계산 (룰 기반 + 검증된 투자 전략 종합)
// 5대 전략: Piotroski F-Score, Magic Formula(Greenblatt), Multi-Factor,
//          Jegadeesh-Titman Momentum, CAN SLIM(O'Neil)
// 기술/가치/품질/성장/모멘텀/수급/심리/매크로를 가중 합산 → 점수로 시그널 결정
// AI는 해석/설명만 담당, 매수/중립/매도 결정은 이 함수가 한다
// ─────────────────────────────────────────────────────────────────────────────
function computeSignal(t = {}, q = {}, flow = {}, macro = {}) {
  // ══════════════════════════════════════════════════════════════════════
  // 투자 대가 통합 모델 v2
  // 버핏(FCF·ROE·해자) + 그린블라트(ROC+EY 매직포뮬러) + 린치(PEG)
  // + 오닐 CAN SLIM + 피오트로스키 F-Score + 제가디쉬-티트만 모멘텀
  // ══════════════════════════════════════════════════════════════════════
  const breakdown = { technical: 0, value: 0, quality: 0, growth: 0, momentum: 0, flow: 0, sentiment: 0, macro: 0 };
  const reasons = [];

  // ═══ 1. 기술적 지표 (최대 ±60점) ═══════════════════════════════════
  // RSI: 강한 추세(ADX>25) 중 과매수는 추세 지속 가능 → 패널티 감쇠
  const strongTrend = typeof t.adx === 'number' && t.adx > 25;
  if (typeof t.rsi === 'number') {
    if (t.rsi < 20)      { breakdown.technical += 20; reasons.push(`RSI ${t.rsi} 극과매도`); }
    else if (t.rsi < 30) { breakdown.technical += 13; reasons.push(`RSI ${t.rsi} 과매도`); }
    else if (t.rsi < 40) breakdown.technical += 5;
    else if (t.rsi > 80) { breakdown.technical -= (strongTrend ? 8 : 20); reasons.push(`RSI ${t.rsi} 극과매수`); }
    else if (t.rsi > 70) { breakdown.technical -= (strongTrend ? 4 : 13); reasons.push(`RSI ${t.rsi} 과매수`); }
    else if (t.rsi > 60) breakdown.technical -= (strongTrend ? 0 : 4);
  }

  // MACD 골든/데드크로스
  if (typeof t.macd === 'number' && typeof t.macd_signal === 'number') {
    if (t.macd > t.macd_signal) { breakdown.technical += 12; reasons.push('MACD 골든크로스'); }
    else                        { breakdown.technical -= 12; reasons.push('MACD 데드크로스'); }
  }

  // 볼린저밴드 %B
  if (typeof t.bb_pct === 'number') {
    if (t.bb_pct < 5)       { breakdown.technical += 12; reasons.push('BB 하단 이탈'); }
    else if (t.bb_pct < 20) breakdown.technical += 6;
    else if (t.bb_pct < 30) breakdown.technical += 2;
    else if (t.bb_pct > 95) { breakdown.technical -= 12; reasons.push('BB 상단 이탈'); }
    else if (t.bb_pct > 80) breakdown.technical -= 6;
    else if (t.bb_pct > 70) breakdown.technical -= 2;
  }

  // 스토캐스틱
  if (typeof t.stoch_k === 'number' && typeof t.stoch_d === 'number') {
    if (t.stoch_k < 20 && t.stoch_k > t.stoch_d)      { breakdown.technical += 8; reasons.push('스토캐스틱 반등'); }
    else if (t.stoch_k < 20)                           breakdown.technical += 4;
    else if (t.stoch_k > 80 && t.stoch_k < t.stoch_d) { breakdown.technical -= 8; reasons.push('스토캐스틱 하락전환'); }
    else if (t.stoch_k > 80)                           breakdown.technical -= 4;
  }

  // DMI/ADX: ADX 30+ = 더 강한 추세
  if (typeof t.adx === 'number' && typeof t.pdi === 'number' && typeof t.mdi === 'number') {
    const tStr = t.adx > 30 ? 15 : t.adx > 25 ? 12 : t.adx > 20 ? 6 : 0;
    if (tStr > 0) {
      if (t.pdi > t.mdi) { breakdown.technical += tStr; reasons.push(`상승추세(ADX ${t.adx.toFixed(0)})`); }
      else               { breakdown.technical -= tStr; reasons.push(`하락추세(ADX ${t.adx.toFixed(0)})`); }
    }
  }

  // 이동평균 정배열/역배열 (MA5/10/20/50/200 완전 정배열)
  if (q.price && t.ma20 && t.ma50) {
    const p = q.price;
    if (t.ma5 && t.ma10 && t.ma200 && p > t.ma5 && t.ma5 > t.ma10 && t.ma10 > t.ma20 && t.ma20 > t.ma50 && t.ma50 > t.ma200) {
      breakdown.technical += 18; reasons.push('완전 정배열(MA5>10>20>50>200)');
    } else if (t.ma5 && t.ma10 && p > t.ma5 && t.ma5 > t.ma10 && t.ma10 > t.ma20 && t.ma20 > t.ma50) {
      breakdown.technical += 13; reasons.push('정배열(MA5>10>20>50)');
    } else if (p > t.ma20 && t.ma20 > t.ma50) {
      breakdown.technical += 8; reasons.push('정배열(가격>MA20>MA50)');
    } else if (t.ma5 && t.ma10 && t.ma200 && p < t.ma5 && t.ma5 < t.ma10 && t.ma10 < t.ma20 && t.ma20 < t.ma50 && t.ma50 < t.ma200) {
      breakdown.technical -= 18; reasons.push('완전 역배열(MA5<10<20<50<200)');
    } else if (p < t.ma20 && t.ma20 < t.ma50) {
      breakdown.technical -= 8; reasons.push('역배열(가격<MA20<MA50)');
    } else if (p > t.ma20) {
      breakdown.technical += 3;
    } else {
      breakdown.technical -= 3;
    }
    // MA200 장기 추세 추가 보너스
    if (t.ma200) {
      if (p > t.ma200 * 1.05)      breakdown.technical += 5;  // MA200 5% 위 = 강한 장기 상승
      else if (p < t.ma200 * 0.95) breakdown.technical -= 5;  // MA200 5% 아래 = 장기 하락
    }
  }

  // Williams %R
  if (typeof t.will_r === 'number') {
    if (t.will_r < -80)      { breakdown.technical += 7; reasons.push(`Williams%R ${t.will_r.toFixed(0)} 과매도`); }
    else if (t.will_r < -60) breakdown.technical += 3;
    else if (t.will_r > -20) { breakdown.technical -= 7; reasons.push(`Williams%R ${t.will_r.toFixed(0)} 과매수`); }
    else if (t.will_r > -40) breakdown.technical -= 3;
  }

  // OBV 추세 (가격과 거래량 방향 일치 여부)
  if (typeof t.obv_trend === 'number') {
    if (t.obv_trend > 0) { breakdown.technical += 5; reasons.push('OBV 상승(매집 신호)'); }
    else                 { breakdown.technical -= 5; reasons.push('OBV 하락(분산 신호)'); }
  }

  // 거래량 급증 분석
  if (typeof t.vol_ratio === 'number') {
    const isUp = q.changePct != null ? q.changePct > 0 : true;
    if (t.vol_ratio > 2.5 && isUp)       { breakdown.technical += 10; reasons.push(`거래량 ${t.vol_ratio.toFixed(1)}배 급증+상승`); }
    else if (t.vol_ratio > 2.5 && !isUp) { breakdown.technical -= 10; reasons.push(`거래량 ${t.vol_ratio.toFixed(1)}배 급증+하락`); }
    else if (t.vol_ratio > 1.5 && isUp)  breakdown.technical += 5;
    else if (t.vol_ratio > 1.5 && !isUp) breakdown.technical -= 5;
    else if (t.vol_ratio < 0.4)          breakdown.technical -= 3; // 거래량 급감 = 관심 이탈
  }

  // 캔들 패턴
  if (Array.isArray(t.candles) && t.candles.length > 0) {
    const cp = t.candles;
    if (cp.includes('morning_star'))      { breakdown.technical += 12; reasons.push('샛별형(강한 반등 신호)'); }
    if (cp.includes('bullish_engulfing')) { breakdown.technical += 10; reasons.push('상승장악형'); }
    if (cp.includes('hammer'))            { breakdown.technical += 7;  reasons.push('망치형(반등 신호)'); }
    if (cp.includes('inverted_hammer'))   breakdown.technical += 4;
    if (cp.includes('evening_star'))      { breakdown.technical -= 12; reasons.push('저녁별형(강한 하락 신호)'); }
    if (cp.includes('bearish_engulfing')) { breakdown.technical -= 10; reasons.push('하락장악형'); }
    if (cp.includes('doji'))              { breakdown.technical -= 2;  reasons.push('도지(추세 전환 가능)'); }
  }

  // MFI (Money Flow Index) — 거래량 가중 RSI: RSI와 다른 방향이면 발산 경고
  if (typeof t.mfi === 'number') {
    if (t.mfi < 20)      { breakdown.technical += 8;  reasons.push(`MFI ${t.mfi.toFixed(0)} 과매도(거래량확인)`); }
    else if (t.mfi < 30) breakdown.technical += 4;
    else if (t.mfi > 80) { breakdown.technical -= 8;  reasons.push(`MFI ${t.mfi.toFixed(0)} 과매수(거래량확인)`); }
    else if (t.mfi > 70) breakdown.technical -= 4;
    // RSI와 MFI 발산: 가격과 거래량 방향 불일치 = 추세 반전 경고
    if (typeof t.rsi === 'number') {
      if (t.rsi > 65 && t.mfi < 45) { breakdown.technical -= 6; reasons.push('RSI↑MFI↓ 발산(추세약화경고)'); }
      if (t.rsi < 35 && t.mfi > 55) { breakdown.technical += 6; reasons.push('RSI↓MFI↑ 발산(반등가능성)'); }
    }
  }

  // CMF (Chaikin Money Flow) — 매집/분산
  if (typeof t.cmf === 'number') {
    if (t.cmf > 0.2)       { breakdown.technical += 7;  reasons.push(`CMF ${t.cmf.toFixed(2)} 강한 매집`); }
    else if (t.cmf > 0.05) breakdown.technical += 3;
    else if (t.cmf < -0.2) { breakdown.technical -= 7;  reasons.push(`CMF ${t.cmf.toFixed(2)} 강한 분산`); }
    else if (t.cmf < -0.05) breakdown.technical -= 3;
  }

  // ROC (Rate of Change) — 단기/중기 모멘텀
  if (typeof t.roc20 === 'number') {
    if (t.roc20 > 20)       { breakdown.technical += 8;  reasons.push(`ROC(20) +${t.roc20.toFixed(0)}% 강한모멘텀`); }
    else if (t.roc20 > 10)  breakdown.technical += 4;
    else if (t.roc20 > 5)   breakdown.technical += 2;
    else if (t.roc20 < -20) { breakdown.technical -= 8;  reasons.push(`ROC(20) ${t.roc20.toFixed(0)}% 급락`); }
    else if (t.roc20 < -10) breakdown.technical -= 4;
    else if (t.roc20 < -5)  breakdown.technical -= 2;
  }

  // 이치모쿠 구름대
  if (typeof t.ich_signal === 'number') {
    if (t.ich_signal === 1)       { breakdown.technical += 10; reasons.push('이치모쿠 구름 위(강세)'); }
    else if (t.ich_signal === -1) { breakdown.technical -= 10; reasons.push('이치모쿠 구름 아래(약세)'); }
    // 구름 안 = 불확실 → 다른 신호에 의존
  }

  // 52주 고/저점 돌파
  if (typeof t.price_vs_52h === 'number') {
    if (t.price_vs_52h >= 0.98)      { breakdown.technical += 12; reasons.push('52주 신고가 근접/돌파'); }
    else if (t.price_vs_52h >= 0.90) breakdown.technical += 5;
    else if (t.price_vs_52h <= 1.02 && t.price_vs_52l != null && t.price_vs_52l <= 1.05)
      { breakdown.technical -= 12; reasons.push('52주 신저가 근접'); }
  }

  // ═══ 2. 가치 지표 - 그린블라트 매직포뮬러 + 린치 PEG + 그레이엄 (최대 ±60점) ═
  // [그레이엄 넘버] 적정가 = sqrt(22.5 × EPS × BPS). 현재가가 밑이면 저평가
  if (q.eps > 0 && q.bps > 0) {
    const graham = Math.sqrt(22.5 * q.eps * q.bps);
    const margin = (graham - q.price) / graham; // 안전마진
    if (margin > 0.5)       { breakdown.value += 20; reasons.push(`그레이엄 안전마진 ${(margin*100).toFixed(0)}% 극저평가`); }
    else if (margin > 0.3)  { breakdown.value += 14; reasons.push(`그레이엄 안전마진 ${(margin*100).toFixed(0)}%`); }
    else if (margin > 0.1)  { breakdown.value += 7;  reasons.push(`그레이엄 넘버 하회(저평가)`); }
    else if (margin < -0.5) { breakdown.value -= 12; reasons.push(`그레이엄 넘버 ${(Math.abs(margin)*100).toFixed(0)}% 초과(과평가)`); }
    else if (margin < -0.2) breakdown.value -= 6;
  }

  // [Fed 모델] 이익수익률(EY) vs 10년 국채금리: EY > 국채금리면 주식이 싸다
  if (typeof q.per === 'number' && q.per > 0 && macro.us10y?.value > 0) {
    const ey = 100 / q.per;
    const bondYield = macro.us10y.value;
    const spread = ey - bondYield; // 양수 = 주식이 채권보다 유리
    if (spread > 5)       { breakdown.value += 12; reasons.push(`Fed모델 EY-국채 스프레드 +${spread.toFixed(1)}%p 저평가`); }
    else if (spread > 2)  { breakdown.value += 7;  reasons.push(`Fed모델 스프레드 +${spread.toFixed(1)}%p`); }
    else if (spread > 0)  breakdown.value += 3;
    else if (spread < -3) { breakdown.value -= 10; reasons.push(`Fed모델 스프레드 ${spread.toFixed(1)}%p 주식 고평가`); }
    else if (spread < -1) breakdown.value -= 4;
  }

  // [린치 핵심] PEG: 성장 대비 가격. PEG<1=저평가, <0.5=극저평가
  if (typeof q.pegRatio === 'number' && q.pegRatio > 0) {
    if (q.pegRatio < 0.5)       { breakdown.value += 22; reasons.push(`PEG ${q.pegRatio.toFixed(2)} 극저평가(린치)`); }
    else if (q.pegRatio < 0.75) { breakdown.value += 16; reasons.push(`PEG ${q.pegRatio.toFixed(2)} 저평가`); }
    else if (q.pegRatio < 1.0)  { breakdown.value += 10; reasons.push(`PEG ${q.pegRatio.toFixed(2)} 양호`); }
    else if (q.pegRatio < 1.5)  breakdown.value += 4;
    else if (q.pegRatio > 3.0)  { breakdown.value -= 12; reasons.push(`PEG ${q.pegRatio.toFixed(1)} 고평가`); }
    else if (q.pegRatio > 2.0)  breakdown.value -= 6;
    else if (q.pegRatio > 1.5)  breakdown.value -= 2;
  }

  // [그린블라트] 이익수익률(1/PER): 높을수록 저평가
  if (typeof q.per === 'number' && q.per > 0) {
    const ey = 100 / q.per;
    if (ey > 15)      { breakdown.value += 14; reasons.push(`저PER ${q.per.toFixed(1)}배`); }
    else if (ey > 10) breakdown.value += 10;
    else if (ey > 7)  breakdown.value += 5;
    else if (ey > 5)  breakdown.value += 2;
    else if (q.per > 50) { breakdown.value -= 10; reasons.push(`고PER ${q.per.toFixed(0)}배`); }
    else if (q.per > 35) breakdown.value -= 5;
    else if (q.per > 25) breakdown.value -= 2;
  }

  // PBR: 자산 대비 가격
  if (typeof q.pbr === 'number' && q.pbr > 0) {
    if (q.pbr < 1)        { breakdown.value += 8; reasons.push(`저PBR ${q.pbr.toFixed(2)}배`); }
    else if (q.pbr < 1.5) breakdown.value += 4;
    else if (q.pbr < 2.5) breakdown.value += 1;
    else if (q.pbr > 10)  { breakdown.value -= 8; reasons.push(`고PBR ${q.pbr.toFixed(1)}배`); }
    else if (q.pbr > 6)   breakdown.value -= 4;
  }

  // Forward PER vs Trailing PER: 이익 성장 기대치
  if (typeof q.forwardPer === 'number' && typeof q.per === 'number' && q.forwardPer > 0 && q.per > 0) {
    const imp = (q.per - q.forwardPer) / q.per;
    if (imp > 0.2)        { breakdown.value += 6; reasons.push('이익 20%+ 성장 전망'); }
    else if (imp > 0.1)   breakdown.value += 3;
    else if (imp < -0.15) { breakdown.value -= 5; reasons.push('이익 감소 전망'); }
  }

  // ═══ 3. 품질 지표 - 버핏 해자 + 피오트로스키 (최대 ±45점) ══════════
  // [버핏 핵심] ROE: 15% 이상 지속이 해자의 증거
  if (typeof q.roe === 'number') {
    if (q.roe > 30)      { breakdown.quality += 14; reasons.push(`고ROE ${q.roe.toFixed(1)}%`); }
    else if (q.roe > 20) { breakdown.quality += 10; reasons.push(`ROE ${q.roe.toFixed(1)}%`); }
    else if (q.roe > 15) breakdown.quality += 6;
    else if (q.roe > 8)  breakdown.quality += 2;
    else if (q.roe < 0)  { breakdown.quality -= 14; reasons.push('ROE 음수(적자)'); }
    else if (q.roe < 5)  breakdown.quality -= 4;
  }

  // [버핏 최우선] FCF: 이익은 조작 가능, FCF는 어렵다
  if (typeof q.freeCashflow === 'number') {
    if (q.freeCashflow > 0) {
      breakdown.quality += 10; reasons.push('양수 FCF(버핏 기준)');
      if (q.marketCap && q.freeCashflow / q.marketCap > 0.05) {
        breakdown.quality += 5; reasons.push('FCF수익률 5%+ 우수');
      }
    } else {
      breakdown.quality -= 10; reasons.push('음수 FCF(현금소각)');
    }
  }

  // [피오트로스키] 영업이익률
  if (typeof q.operatingMargin === 'number') {
    if (q.operatingMargin > 25)      { breakdown.quality += 7; reasons.push(`영업이익률 ${q.operatingMargin.toFixed(0)}%`); }
    else if (q.operatingMargin > 15) breakdown.quality += 4;
    else if (q.operatingMargin > 8)  breakdown.quality += 2;
    else if (q.operatingMargin < 0)  { breakdown.quality -= 10; reasons.push('영업적자'); }
    else if (q.operatingMargin < 3)  breakdown.quality -= 3;
  }

  // [피오트로스키] 총이익률: 높은 마진 = 경제적 해자
  if (typeof q.grossMargin === 'number') {
    if (q.grossMargin > 50)      { breakdown.quality += 5; reasons.push(`총이익률 ${q.grossMargin.toFixed(0)}% 해자`); }
    else if (q.grossMargin > 35) breakdown.quality += 3;
    else if (q.grossMargin > 20) breakdown.quality += 1;
    else if (q.grossMargin < 10) { breakdown.quality -= 4; reasons.push('낮은 총이익률'); }
  }

  // [피오트로스키] 부채비율
  if (typeof q.debtToEquity === 'number') {
    if (q.debtToEquity < 30)        { breakdown.quality += 6; reasons.push('무부채 수준'); }
    else if (q.debtToEquity < 60)   breakdown.quality += 3;
    else if (q.debtToEquity < 100)  breakdown.quality += 1;
    else if (q.debtToEquity > 300)  { breakdown.quality -= 10; reasons.push(`과다부채 D/E ${q.debtToEquity.toFixed(0)}%`); }
    else if (q.debtToEquity > 200)  breakdown.quality -= 6;
    else if (q.debtToEquity > 150)  breakdown.quality -= 3;
  }

  // [피오트로스키] 유동비율
  if (typeof q.currentRatio === 'number') {
    if (q.currentRatio > 2.5)      breakdown.quality += 4;
    else if (q.currentRatio > 1.5) breakdown.quality += 2;
    else if (q.currentRatio < 0.8) { breakdown.quality -= 7; reasons.push('유동성 위기'); }
    else if (q.currentRatio < 1.0) breakdown.quality -= 3;
  }

  // ═══ 4. 성장 지표 - CAN SLIM (오닐) (최대 ±35점) ═══════════════════
  // [CAN SLIM C+A] 이익성장률 25%+ = 오닐의 최소 기준
  if (typeof q.earningsGrowth === 'number') {
    if (q.earningsGrowth > 100)      { breakdown.growth += 18; reasons.push(`이익 폭발성장 ${q.earningsGrowth.toFixed(0)}%`); }
    else if (q.earningsGrowth > 50)  { breakdown.growth += 13; reasons.push(`고이익성장 ${q.earningsGrowth.toFixed(0)}%`); }
    else if (q.earningsGrowth > 25)  { breakdown.growth += 9;  reasons.push(`이익성장 ${q.earningsGrowth.toFixed(0)}%(CAN SLIM)`); }
    else if (q.earningsGrowth > 10)  breakdown.growth += 4;
    else if (q.earningsGrowth > 0)   breakdown.growth += 1;
    else if (q.earningsGrowth < -30) { breakdown.growth -= 14; reasons.push('이익 급감'); }
    else if (q.earningsGrowth < -10) breakdown.growth -= 7;
    else                             breakdown.growth -= 2;
  }

  // 매출성장률
  if (typeof q.revenueGrowth === 'number') {
    if (q.revenueGrowth > 30)       { breakdown.growth += 9; reasons.push(`매출 ${q.revenueGrowth.toFixed(0)}% 고성장`); }
    else if (q.revenueGrowth > 15)  breakdown.growth += 5;
    else if (q.revenueGrowth > 5)   breakdown.growth += 2;
    else if (q.revenueGrowth < -15) { breakdown.growth -= 8; reasons.push('매출 급감'); }
    else if (q.revenueGrowth < -5)  breakdown.growth -= 3;
    else if (q.revenueGrowth < 0)   breakdown.growth -= 1;
  }

  // [CAN SLIM N] 52주 신고가 부근 = 강한 매수 신호
  if (q.price && q.high52 && q.low52 && q.high52 > q.low52) {
    const pct = (q.price - q.low52) / (q.high52 - q.low52);
    if (pct > 0.95)      { breakdown.growth += 8; reasons.push('52주 신고가 돌파(CAN SLIM N)'); }
    else if (pct > 0.85) { breakdown.growth += 5; reasons.push('52주 고점 근접'); }
    else if (pct > 0.70) breakdown.growth += 2;
    else if (pct < 0.10) { breakdown.growth -= 5; reasons.push('52주 신저가 근접'); }
    else if (pct < 0.25) breakdown.growth -= 2;
  }

  // ═══ 5. 모멘텀 - 제가디쉬-티트만 12-1 팩터 (최대 ±25점) ═══════════
  // 52주 범위 위치 = 12개월 모멘텀 프록시 (30년 검증된 알파 팩터)
  if (q.price && q.high52 && q.low52 && q.high52 > q.low52) {
    const range = (q.price - q.low52) / (q.high52 - q.low52);
    if (range > 0.85)      { breakdown.momentum += 12; reasons.push('12개월 모멘텀 강세'); }
    else if (range > 0.65) breakdown.momentum += 6;
    else if (range > 0.45) breakdown.momentum += 1;
    else if (range < 0.15) { breakdown.momentum -= 12; reasons.push('12개월 모멘텀 약세'); }
    else if (range < 0.35) breakdown.momentum -= 6;
  }

  // 단기 모멘텀: MA20 vs MA50
  if (t.ma20 && t.ma50) {
    const ratio = (t.ma20 - t.ma50) / t.ma50;
    if (ratio > 0.08)       { breakdown.momentum += 10; reasons.push('MA 단기 강세'); }
    else if (ratio > 0.03)  breakdown.momentum += 5;
    else if (ratio > 0.01)  breakdown.momentum += 2;
    else if (ratio < -0.08) { breakdown.momentum -= 10; reasons.push('MA 단기 약세'); }
    else if (ratio < -0.03) breakdown.momentum -= 5;
    else if (ratio < -0.01) breakdown.momentum -= 2;
  }

  // 모멘텀 과열 보정: 강한 모멘텀 + 극과매수 = 추격 위험
  if (breakdown.momentum > 10 && typeof t.rsi === 'number' && t.rsi > 80) {
    breakdown.momentum -= 5;
  }

  // ═══ 6. 수급 - CAN SLIM I + 공매도 + 내부자매매 + 숏스퀴즈 (최대 ±35점) ═
  if (typeof flow.institutionPct === 'number') {
    if (flow.institutionPct > 85)      { breakdown.flow += 7; reasons.push('기관 집중 보유'); }
    else if (flow.institutionPct > 70) breakdown.flow += 4;
    else if (flow.institutionPct > 50) breakdown.flow += 2;
    else if (flow.institutionPct < 15) breakdown.flow -= 4;
  }

  if (typeof flow.insiderPct === 'number') {
    if (flow.insiderPct > 20)      { breakdown.flow += 5; reasons.push('내부자 고지분'); }
    else if (flow.insiderPct > 10) { breakdown.flow += 3; reasons.push('내부자 지분 높음'); }
    else if (flow.insiderPct > 3)  breakdown.flow += 1;
  }

  if (typeof flow.shortPct === 'number') {
    if (flow.shortPct > 30)      { breakdown.flow -= 6; reasons.push(`공매도 극단 ${flow.shortPct.toFixed(0)}%`); }
    else if (flow.shortPct > 20) { breakdown.flow -= 9; reasons.push(`공매도 과다 ${flow.shortPct.toFixed(0)}%`); }
    else if (flow.shortPct > 12) breakdown.flow -= 5;
    else if (flow.shortPct > 6)  breakdown.flow -= 2;
    else if (flow.shortPct < 2)  breakdown.flow += 3;
  }

  if (flow.options && typeof flow.options.putCallRatio === 'number') {
    const pc = flow.options.putCallRatio;
    if (pc > 1.5)      { breakdown.flow += 3; reasons.push('풋콜 극비관→역발상'); }
    else if (pc > 1.2) breakdown.flow -= 3;
    else if (pc < 0.5) { breakdown.flow -= 3; reasons.push('풋콜 극낙관→과열'); }
    else if (pc < 0.7) breakdown.flow += 2;
  }

  // [내부자 매매 방향] 내부자 순매수 = 가장 강력한 매수 신호 중 하나
  if (Array.isArray(flow.insiderTx) && flow.insiderTx.length > 0) {
    const recent = flow.insiderTx.slice(0, 5); // 최근 5건
    const buys  = recent.filter(tx => tx.type === 'Buy'  || tx.type === 'Purchase').length;
    const sells = recent.filter(tx => tx.type === 'Sell' || tx.type === 'Sale').length;
    if (buys > 0 && sells === 0)  { breakdown.flow += 10; reasons.push(`내부자 순매수 ${buys}건(강한 신호)`); }
    else if (buys > sells)        { breakdown.flow += 5;  reasons.push(`내부자 매수 우세(${buys}vs${sells})`); }
    else if (sells > buys * 2)    { breakdown.flow -= 7;  reasons.push(`내부자 대량매도 ${sells}건`); }
    else if (sells > buys)        breakdown.flow -= 3;
  }

  // [숏 스퀴즈 감지] 공매도 많은데 모멘텀 상승 = 숏커버 폭발 가능
  if (typeof flow.shortPct === 'number' && flow.shortPct > 15 && breakdown.momentum > 5) {
    breakdown.flow += 8; reasons.push(`숏스퀴즈 가능(공매도 ${flow.shortPct.toFixed(0)}%+상승모멘텀)`);
  }
  // 공매도 많은데 하락 중 = 추가 하락 압력
  if (typeof flow.shortPct === 'number' && flow.shortPct > 20 && breakdown.momentum < -5) {
    breakdown.flow -= 5; reasons.push('고공매도+하락모멘텀=추가하락위험');
  }

  // ═══ 7. 심리/애널리스트 (최대 ±20점) ═══════════════════════════════
  if (typeof q.recommendation === 'string') {
    const rec = q.recommendation.toLowerCase();
    if (rec === 'strong_buy')                         { breakdown.sentiment += 10; reasons.push('애널리스트 강력매수'); }
    else if (rec === 'buy')                           { breakdown.sentiment += 6;  reasons.push('애널리스트 매수'); }
    else if (rec === 'underperform')                  { breakdown.sentiment -= 6;  reasons.push('애널리스트 비중축소'); }
    else if (rec === 'sell' || rec === 'strong_sell') { breakdown.sentiment -= 10; reasons.push('애널리스트 매도'); }
  }

  if (q.price && typeof q.targetPrice === 'number' && q.targetPrice > 0) {
    const upside = (q.targetPrice - q.price) / q.price * 100;
    if (upside > 40)       { breakdown.sentiment += 10; reasons.push(`목표가 상승여력 ${upside.toFixed(0)}%`); }
    else if (upside > 20)  { breakdown.sentiment += 6;  reasons.push(`목표가 +${upside.toFixed(0)}%`); }
    else if (upside > 10)  breakdown.sentiment += 3;
    else if (upside < -20) { breakdown.sentiment -= 10; reasons.push(`목표가 하회 ${Math.abs(upside).toFixed(0)}%`); }
    else if (upside < -10) breakdown.sentiment -= 5;
    else if (upside < 0)   breakdown.sentiment -= 2;
  }

  // 배당 성장 투자 (Dividend Growth Investing)
  if (typeof q.div === 'number' && q.div > 0) {
    if (q.div > 5 && q.revenueGrowth > 5)       { breakdown.sentiment += 8; reasons.push(`배당 ${q.div.toFixed(1)}%+성장(배당성장주)`); }
    else if (q.div > 3 && q.revenueGrowth > 0)  { breakdown.sentiment += 5; reasons.push(`배당 ${q.div.toFixed(1)}%(안정 배당)`); }
    else if (q.div > 2)                          breakdown.sentiment += 2;
    // 배당수익률 > 국채금리면 주식 보유 유리
    if (macro.us10y?.value && q.div > macro.us10y.value) {
      breakdown.sentiment += 4; reasons.push('배당수익률 > 국채금리(매력적)');
    }
  }

  // Beta 리스크 조정: 고베타 + 과매수 = 하락 시 큰 폭 손실
  if (typeof q.beta === 'number') {
    if (q.beta > 2.0 && t.rsi > 70)       { breakdown.sentiment -= 8;  reasons.push(`고베타${q.beta.toFixed(1)}+과매수=하락위험`); }
    else if (q.beta > 1.5 && t.rsi > 65)  breakdown.sentiment -= 4;
    else if (q.beta < 0.5 && t.rsi < 40)  { breakdown.sentiment += 5;  reasons.push(`저베타${q.beta.toFixed(1)}+저RSI=방어적매수`); }
    else if (q.beta < 0 )                  { breakdown.sentiment += 3;  reasons.push('음의베타(헤지효과)'); }
  }

  // 애널리스트 커버리지 적으면 = 미발굴 보석 가능 (소형주 숨겨진 알파)
  if (typeof q.numberOfAnalysts === 'number') {
    if (q.numberOfAnalysts <= 3 && breakdown.value > 5)  { breakdown.sentiment += 5; reasons.push('소수 커버리지+저평가=숨겨진기회'); }
    else if (q.numberOfAnalysts >= 30)                    breakdown.sentiment -= 2; // 과도한 관심 = 고평가 위험
  }

  // ═══ 8. 매크로 - 드러켄밀러식 하향식 (최대 ±12점) ══════════════════
  if (macro.vix && typeof macro.vix.value === 'number') {
    const vix = macro.vix.value;
    if (vix > 40)      { breakdown.macro += 4; reasons.push(`VIX ${vix.toFixed(0)} 극공포→역발상`); }
    else if (vix > 30) { breakdown.macro -= 6; reasons.push(`VIX ${vix.toFixed(0)} 고변동성`); }
    else if (vix > 25) breakdown.macro -= 3;
    else if (vix < 15) breakdown.macro += 3;
    else if (vix < 12) breakdown.macro += 5;
  }

  if (macro.us10y && typeof macro.us10y.chg === 'number') {
    if (macro.us10y.chg > 0.2)       { breakdown.macro -= 5; reasons.push('금리 급등'); }
    else if (macro.us10y.chg > 0.1)  breakdown.macro -= 2;
    else if (macro.us10y.chg < -0.2) { breakdown.macro += 5; reasons.push('금리 급락(호재)'); }
    else if (macro.us10y.chg < -0.1) breakdown.macro += 2;
  }

  // 장단기 금리차 (수익률 곡선): 역전 = 경기침체 선행지표
  if (macro.us10y?.value && macro.us3m?.value) {
    const spread = macro.us10y.value - macro.us3m.value;
    if (spread > 1.5)       { breakdown.macro += 5; reasons.push(`금리차 +${spread.toFixed(1)}%p(경기확장)`); }
    else if (spread > 0.5)  breakdown.macro += 2;
    else if (spread < -0.5) { breakdown.macro -= 6; reasons.push(`수익률곡선역전 ${spread.toFixed(1)}%p(침체위험)`); }
    else if (spread < 0)    breakdown.macro -= 3;
  }

  // 달러 강세/약세 영향 (미국주식 기준)
  if (macro.dxy && typeof macro.dxy.chg === 'number') {
    if (macro.dxy.chg > 1.0)        { breakdown.macro -= 4; reasons.push('달러 급등(신흥국·원자재 부담)'); }
    else if (macro.dxy.chg < -1.0)  { breakdown.macro += 4; reasons.push('달러 약세(위험자산 호재)'); }
  }

  // 금 가격 상승 = 안전자산 선호 = 주식 부정적
  if (macro.gold && typeof macro.gold.chg === 'number') {
    if (macro.gold.chg > 2.0)       { breakdown.macro -= 3; reasons.push('금 급등(안전자산선호)'); }
    else if (macro.gold.chg < -2.0) { breakdown.macro += 2; reasons.push('금 하락(위험선호)'); }
  }

  // 유가 급등 = 인플레이션 우려 (에너지 섹터 제외 일반적 부정)
  if (macro.oil && typeof macro.oil.chg === 'number') {
    if (macro.oil.chg > 3.0)        { breakdown.macro -= 3; reasons.push('유가 급등(인플레이션)'); }
    else if (macro.oil.chg < -3.0)  { breakdown.macro += 2; reasons.push('유가 하락(소비여력)'); }
  }

  // ═══ 9. 추가 기술/계절/복합 신호 ═══════════════════════════════════

  // 파라볼릭 SAR
  if (typeof t.sar_signal === 'number') {
    if (t.sar_signal === 1)  { breakdown.technical += 6; reasons.push('SAR 매수(추세상승)'); }
    else                     { breakdown.technical -= 6; reasons.push('SAR 매도(추세하락)'); }
  }

  // 피보나치 지지/저항
  if (t.fib_bull) { breakdown.technical += 8; reasons.push('피보나치 지지선 위(매수)'); }
  if (t.fib_bear) { breakdown.technical -= 8; reasons.push('피보나치 저항선 아래(매도)'); }

  // VPT 추세
  if (typeof t.vpt_trend === 'number') {
    if (t.vpt_trend === 1)  breakdown.technical += 4;
    else                    breakdown.technical -= 4;
  }

  // 갭 신호
  if (t.gap_up)   { breakdown.technical += 8; reasons.push('상승 갭(강한 수급)'); }
  if (t.gap_down) { breakdown.technical -= 8; reasons.push('하락 갭(매도 압력)'); }

  // RSI 다이버전스
  if (t.bear_div) { breakdown.technical -= 10; reasons.push('베어리시 다이버전스(추세 약화)'); }
  if (t.bull_div) { breakdown.technical += 10; reasons.push('불리시 다이버전스(반등 가능)'); }

  // EV/EBITDA 근사 (marketCap / ebitda, 부채 무시한 근사치)
  if (q.ebitda > 0 && q.marketCap > 0) {
    const evEbitda = q.marketCap / q.ebitda;
    if (evEbitda < 8)        { breakdown.value += 10; reasons.push(`EV/EBITDA ${evEbitda.toFixed(1)}x 저평가`); }
    else if (evEbitda < 12)  breakdown.value += 5;
    else if (evEbitda < 20)  breakdown.value += 1;
    else if (evEbitda > 40)  { breakdown.value -= 8; reasons.push(`EV/EBITDA ${evEbitda.toFixed(1)}x 고평가`); }
    else if (evEbitda > 30)  breakdown.value -= 4;
  }

  // FCF 수익률 (버핏 최선호 가치 지표)
  if (q.freeCashflow > 0 && q.marketCap > 0) {
    const fcfYield = q.freeCashflow / q.marketCap * 100;
    if (fcfYield > 8)       { breakdown.value += 12; reasons.push(`FCF수익률 ${fcfYield.toFixed(1)}%(버핏 기준 우수)`); }
    else if (fcfYield > 5)  { breakdown.value += 7;  reasons.push(`FCF수익률 ${fcfYield.toFixed(1)}%`); }
    else if (fcfYield > 3)  breakdown.value += 3;
    else if (fcfYield < 0)  breakdown.value -= 5;
  }

  // 이익 품질 (FCF vs EPS 괴리 — 분식회계 탐지)
  // FCF << 순이익이면 이익이 현금으로 안 들어오는 것 = 회계 조작 가능성
  if (q.freeCashflow != null && q.eps > 0 && q.marketCap > 0) {
    const sharesApprox = q.marketCap / (q.price || 1);
    const netIncomeApprox = q.eps * sharesApprox;
    if (netIncomeApprox > 0) {
      const earningsQuality = q.freeCashflow / netIncomeApprox;
      if (earningsQuality > 1.2)      { breakdown.quality += 8; reasons.push('FCF>순이익(고품질이익)'); }
      else if (earningsQuality > 0.8) breakdown.quality += 3;
      else if (earningsQuality < 0.3) { breakdown.quality -= 10; reasons.push('FCF<<순이익(이익품질의심)'); }
      else if (earningsQuality < 0.5) breakdown.quality -= 5;
    }
  }

  // 가치함정 탐지 (저PER이지만 매출 감소 = 함정)
  if (typeof q.per === 'number' && q.per < 15 && typeof q.revenueGrowth === 'number' && q.revenueGrowth < -10) {
    breakdown.value -= 12; reasons.push('가치함정 경고: 저PER+매출감소');
  }

  // 경제적 해자 종합점수 (ROE+마진+성장 동시 충족)
  const moatScore =
    (q.roe > 20 ? 1 : 0) +
    (q.grossMargin > 40 ? 1 : 0) +
    (q.operatingMargin > 15 ? 1 : 0) +
    (q.revenueGrowth > 10 ? 1 : 0) +
    (q.freeCashflow > 0 ? 1 : 0);
  if (moatScore >= 5)      { breakdown.quality += 15; reasons.push('경제적 해자 최고등급(5/5)'); }
  else if (moatScore >= 4) { breakdown.quality += 9;  reasons.push('경제적 해자 우수(4/5)'); }
  else if (moatScore >= 3) breakdown.quality += 4;
  else if (moatScore <= 1) breakdown.quality -= 5;

  // 계절성 효과 (통계적으로 검증된 패턴)
  const month = new Date().getMonth() + 1; // 1~12
  if (month === 1)                         { breakdown.momentum += 5;  reasons.push('1월 효과(소형주 강세)'); }
  else if (month === 11 || month === 12)   { breakdown.momentum += 4;  reasons.push('Q4 산타랠리 시즌'); }
  else if (month >= 5 && month <= 9)       { breakdown.momentum -= 2;  } // Sell in May 효과

  // ═══ 최종: 리스크 거부권 + 확신도 승수 ════════════════════════════
  let rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // ── 리스크 거부권: 아래 조건 시 매수 신호 강제 차단 ──────────────
  const riskVetos = [];
  // 유동성 위기 (currentRatio < 0.5 = 단기 부도 위험)
  if (q.currentRatio != null && q.currentRatio < 0.5) {
    riskVetos.push('유동성위기(CR<0.5)');
    rawScore = Math.min(rawScore, -20); // 매수 불가
  }
  // 영업적자 + 음수FCF + 고부채 = 파산 위험 삼각형
  if (q.operatingMargin < 0 && q.freeCashflow < 0 && q.debtToEquity > 200) {
    riskVetos.push('파산위험삼각형(영업적자+음FCF+고부채)');
    rawScore = Math.min(rawScore, -30);
  }
  // VIX 60 이상 = 시장 패닉, 강력매수 차단
  if (macro.vix?.value > 60) {
    riskVetos.push(`시장패닉(VIX ${macro.vix.value.toFixed(0)})`);
    rawScore = Math.min(rawScore, 10);
  }
  // 수익률곡선 깊은 역전 + 고PER = 이중 위험
  if (macro.us10y?.value && macro.us3m?.value &&
      (macro.us10y.value - macro.us3m.value) < -1.0 && q.per > 40) {
    riskVetos.push('금리역전+고PER=이중위험');
    rawScore -= 15;
  }
  if (riskVetos.length > 0) reasons.push(`⚠️ 리스크거부권: ${riskVetos.join(', ')}`);

  // ── 확신도 승수: 여러 팩터 일치 시 점수 증폭 ──────────────────────
  const posFactor = [
    breakdown.technical > 15,
    breakdown.value > 15,
    breakdown.quality > 10,
    breakdown.growth > 8,
    breakdown.momentum > 8,
    breakdown.flow > 5,
  ].filter(Boolean).length;
  const negFactor = [
    breakdown.technical < -15,
    breakdown.value < -10,
    breakdown.quality < -8,
    breakdown.growth < -8,
    breakdown.momentum < -8,
    breakdown.flow < -5,
  ].filter(Boolean).length;

  // 4개 이상 팩터 동시 강세 = 확신도 높음, 점수 20% 증폭
  if (posFactor >= 4 && rawScore > 0) {
    rawScore = Math.round(rawScore * 1.2);
    reasons.push(`✅ ${posFactor}개 팩터 동시 강세 — 확신도 높음`);
  }
  if (negFactor >= 4 && rawScore < 0) {
    rawScore = Math.round(rawScore * 1.2);
    reasons.push(`🔴 ${negFactor}개 팩터 동시 약세 — 하락 확신`);
  }

  // 상충 신호 (강한 매수+강한 매도 동시) = 점수 감쇠 (불확실성)
  if (posFactor >= 2 && negFactor >= 2) {
    rawScore = Math.round(rawScore * 0.7);
    reasons.push('⚡ 강세·약세 신호 충돌 — 불확실성 높음');
  }

  const score = rawScore;
  let signal, confidence;
  const abs = Math.abs(score);
  if      (score >= 60)  { signal = '강력매수'; confidence = Math.min(95, 72 + abs * 0.15); }
  else if (score >= 30)  { signal = '매수';     confidence = Math.min(88, 62 + abs * 0.25); }
  else if (score >= 10)  { signal = '약매수';   confidence = Math.min(75, 52 + abs * 0.45); }
  else if (score <= -60) { signal = '강력매도'; confidence = Math.min(95, 72 + abs * 0.15); }
  else if (score <= -30) { signal = '매도';     confidence = Math.min(88, 62 + abs * 0.25); }
  else if (score <= -10) { signal = '약매도';   confidence = Math.min(75, 52 + abs * 0.45); }
  else                   { signal = '중립';     confidence = Math.max(40, 58 - abs * 2); }

  return {
    signal,
    confidence: Math.round(confidence),
    score: Math.round(score),
    breakdown: Object.fromEntries(Object.entries(breakdown).map(([k, v]) => [k, Math.round(v)])),
    reasons,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// 기술적 지표 — JS 폴백 (yfinance 실패 시 NAVER 차트로 계산)
// ─────────────────────────────────────────────────────────────────────────────
function calcTechnicalsJS(bars) {
  if (!Array.isArray(bars) || bars.length < 30) return null;
  const close = bars.map(b => +b.close);
  const high  = bars.map(b => +(b.high ?? b.close));
  const low   = bars.map(b => +(b.low  ?? b.close));
  const n = close.length;

  // EMA helper
  const ema = (arr, span) => {
    const k = 2 / (span + 1);
    const out = [arr[0]];
    for (let i = 1; i < arr.length; i++) out.push(arr[i] * k + out[i-1] * (1 - k));
    return out;
  };
  // Wilder smoothing (RSI/ADX style)
  const wilder = (arr, period) => {
    const out = [];
    let prev = arr.slice(0, period).reduce((a,b)=>a+b, 0) / period;
    out[period - 1] = prev;
    for (let i = period; i < arr.length; i++) {
      prev = (prev * (period - 1) + arr[i]) / period;
      out[i] = prev;
    }
    return out;
  };

  // RSI(14)
  const gains = [0], losses = [0];
  for (let i = 1; i < n; i++) {
    const d = close[i] - close[i-1];
    gains.push(Math.max(d, 0));
    losses.push(Math.max(-d, 0));
  }
  const ag = wilder(gains, 14), al = wilder(losses, 14);
  const rs = ag[n-1] && al[n-1] ? ag[n-1] / al[n-1] : (ag[n-1] ? 999 : 0);
  const rsi = al[n-1] === 0 ? 100 : 100 - 100 / (1 + rs);

  // MA20, MA50, StdDev20 → Bollinger
  const sma = (arr, p, idx) => arr.slice(idx-p+1, idx+1).reduce((a,b)=>a+b,0) / p;
  const ma20 = sma(close, 20, n-1);
  const ma50 = n >= 50 ? sma(close, 50, n-1) : null;
  const slice20 = close.slice(n-20, n);
  const variance = slice20.reduce((a,b) => a + (b-ma20)**2, 0) / 20;
  const std = Math.sqrt(variance);
  const bb_upper = ma20 + 2*std, bb_lower = ma20 - 2*std;
  const bb_pct = bb_upper !== bb_lower ? (close[n-1] - bb_lower) / (bb_upper - bb_lower) * 100 : 50;

  // MACD(12,26,9)
  const ema12 = ema(close, 12), ema26 = ema(close, 26);
  const macd_line = close.map((_, i) => ema12[i] - ema26[i]);
  const sig_line = ema(macd_line, 9);

  // Stochastic(14,3,3)
  const stochRaw = [];
  for (let i = 13; i < n; i++) {
    const lk = Math.min(...low.slice(i-13, i+1));
    const hk = Math.max(...high.slice(i-13, i+1));
    stochRaw.push(hk !== lk ? 100*(close[i]-lk)/(hk-lk) : 50);
  }
  const sma3 = arr => arr.length < 3 ? null : (arr[arr.length-3]+arr[arr.length-2]+arr[arr.length-1])/3;
  const K = sma3(stochRaw);
  const D = K != null ? sma3([stochRaw[stochRaw.length-3], stochRaw[stochRaw.length-2], (stochRaw[stochRaw.length-3]+stochRaw[stochRaw.length-2]+stochRaw[stochRaw.length-1])/3].filter(v=>v!=null)) : null;

  // DMI/ADX(14)
  const tr = [0], pdm = [0], mdm = [0];
  for (let i = 1; i < n; i++) {
    const upMove = high[i] - high[i-1], dnMove = low[i-1] - low[i];
    pdm.push(upMove > dnMove && upMove > 0 ? upMove : 0);
    mdm.push(dnMove > upMove && dnMove > 0 ? dnMove : 0);
    tr.push(Math.max(high[i]-low[i], Math.abs(high[i]-close[i-1]), Math.abs(low[i]-close[i-1])));
  }
  const atr = wilder(tr, 14), pdmSm = wilder(pdm, 14), mdmSm = wilder(mdm, 14);
  const pdi = atr[n-1] ? 100 * pdmSm[n-1] / atr[n-1] : 0;
  const mdi = atr[n-1] ? 100 * mdmSm[n-1] / atr[n-1] : 0;
  const dx = (pdi+mdi) ? 100 * Math.abs(pdi-mdi) / (pdi+mdi) : 0;
  // ADX는 dx의 Wilder 평균 — 마지막 값만 근사
  const adx = dx; // 단순화 (정확도 약간 손해, 시그널엔 충분)

  // MFI (Money Flow Index, 14) — 거래량 가중 RSI
  const vol = bars.map(b => +(b.volume ?? 0));
  const typicalPrice = close.map((c, i) => (c + high[i] + low[i]) / 3);
  const rawMoneyFlow = typicalPrice.map((tp, i) => tp * vol[i]);
  let posMF = 0, negMF = 0;
  for (let i = n - 14; i < n; i++) {
    if (typicalPrice[i] > typicalPrice[i-1]) posMF += rawMoneyFlow[i];
    else negMF += rawMoneyFlow[i];
  }
  const mfi = negMF === 0 ? 100 : 100 - 100 / (1 + posMF / negMF);

  // CMF (Chaikin Money Flow, 20) — 매집/분산 -1~+1
  let cmfNum = 0, cmfDen = 0;
  for (let i = Math.max(0, n - 20); i < n; i++) {
    const hl = high[i] - low[i];
    if (hl > 0) cmfNum += ((close[i] - low[i]) - (high[i] - close[i])) / hl * vol[i];
    cmfDen += vol[i];
  }
  const cmf = cmfDen > 0 ? cmfNum / cmfDen : 0;

  // ROC (Rate of Change, 20일) — 가격 모멘텀
  const roc20 = n >= 21 ? (close[n-1] - close[n-21]) / close[n-21] * 100 : null;
  const roc5  = n >= 6  ? (close[n-1] - close[n-6])  / close[n-6]  * 100 : null;

  // 이치모쿠 구름대 (Ichimoku Cloud)
  const ichHigh = (arr, p, i) => Math.max(...arr.slice(Math.max(0, i-p+1), i+1));
  const ichLow  = (arr, p, i) => Math.min(...arr.slice(Math.max(0, i-p+1), i+1));
  const tenkan  = n >= 9  ? (ichHigh(high, 9,  n-1) + ichLow(low, 9,  n-1)) / 2 : null;
  const kijun   = n >= 26 ? (ichHigh(high, 26, n-1) + ichLow(low, 26, n-1)) / 2 : null;
  const senkouA = (tenkan != null && kijun != null) ? (tenkan + kijun) / 2 : null;
  const senkouB = n >= 52 ? (ichHigh(high, 52, n-1) + ichLow(low, 52, n-1)) / 2 : null;
  // 구름 위 = 강세, 구름 아래 = 약세
  const ichCloudTop    = (senkouA != null && senkouB != null) ? Math.max(senkouA, senkouB) : null;
  const ichCloudBottom = (senkouA != null && senkouB != null) ? Math.min(senkouA, senkouB) : null;
  const ichSignal = ichCloudTop != null
    ? (close[n-1] > ichCloudTop ? 1 : close[n-1] < ichCloudBottom ? -1 : 0)
    : null; // +1=구름위(강세), -1=구름아래(약세), 0=구름안(중립)

  // MA5, MA10, MA200
  const ma5  = n >= 5   ? sma(close, 5,   n-1) : null;
  const ma10 = n >= 10  ? sma(close, 10,  n-1) : null;
  const ma200= n >= 200 ? sma(close, 200, n-1) : null;

  // Williams %R(14)
  const hh14 = Math.max(...high.slice(n-14, n));
  const ll14 = Math.min(...low.slice(n-14, n));
  const willR = hh14 !== ll14 ? -100 * (hh14 - close[n-1]) / (hh14 - ll14) : -50;

  // OBV (On-Balance Volume)
  let obv = 0;
  const obvArr = [0];
  for (let i = 1; i < n; i++) {
    if (close[i] > close[i-1])      obv += vol[i];
    else if (close[i] < close[i-1]) obv -= vol[i];
    obvArr.push(obv);
  }
  const obv20avg = obvArr.slice(n-20, n).reduce((a,b)=>a+b,0) / 20;
  const obvTrend = obv > obv20avg ? 1 : -1; // +1 상승, -1 하락

  // 거래량 비율 (현재 거래량 / 20일 평균 거래량)
  const vol20avg = vol.slice(n-20, n).reduce((a,b)=>a+b,0) / 20;
  const volRatio = vol20avg > 0 ? vol[n-1] / vol20avg : 1;

  // 캔들 패턴 (마지막 3봉 기반)
  const open = bars.map(b => +(b.open ?? b.close));
  const c0 = close[n-1], o0 = open[n-1], h0 = high[n-1], l0 = low[n-1];
  const c1 = close[n-2], o1 = open[n-2], h1 = high[n-2], l1 = low[n-2];
  const c2 = n >= 3 ? close[n-3] : c1, o2 = n >= 3 ? open[n-3] : o1;
  const body0 = Math.abs(c0 - o0), range0 = h0 - l0;
  const body1 = Math.abs(c1 - o1), range1 = h1 - l1;
  const candles = [];

  // 도지 (몸통이 전체의 10% 미만 → 추세 전환 가능)
  if (range0 > 0 && body0 / range0 < 0.1) candles.push('doji');

  // 망치형 (하락 후 아래꼬리 길고 몸통 위쪽 → 반등)
  const lowerShadow0 = Math.min(c0, o0) - l0;
  const upperShadow0 = h0 - Math.max(c0, o0);
  if (c1 < o1 && lowerShadow0 > body0 * 2 && upperShadow0 < body0 && body0 > 0)
    candles.push('hammer');

  // 역망치형 (하락 후 위꼬리 길고 몸통 아래쪽 → 반등 가능)
  if (c1 < o1 && upperShadow0 > body0 * 2 && lowerShadow0 < body0 && body0 > 0)
    candles.push('inverted_hammer');

  // 상승 장악형 (전봉 음봉, 현봉 양봉으로 완전히 감쌈 → 강한 반등)
  if (c1 < o1 && c0 > o0 && c0 > o1 && o0 < c1)
    candles.push('bullish_engulfing');

  // 하락 장악형 (전봉 양봉, 현봉 음봉으로 완전히 감쌈 → 강한 하락)
  if (c1 > o1 && c0 < o0 && c0 < o1 && o0 > c1)
    candles.push('bearish_engulfing');

  // 샛별형 Morning Star (양봉-도지/소봉-양봉 → 강한 반등)
  if (c2 < o2 && body1 / (h1 - l1 || 1) < 0.3 && c0 > o0 && c0 > (o2 + c2) / 2)
    candles.push('morning_star');

  // 저녁별형 Evening Star (음봉-도지/소봉-음봉 → 강한 하락)
  if (c2 > o2 && body1 / (h1 - l1 || 1) < 0.3 && c0 < o0 && c0 < (o2 + c2) / 2)
    candles.push('evening_star');

  // 52주 고/저점 (bars가 충분하면 계산, 아니면 null)
  const high52 = n >= 200 ? Math.max(...high.slice(n-252 < 0 ? 0 : n-252, n)) : Math.max(...high);
  const low52  = n >= 200 ? Math.min(...low.slice(n-252 < 0 ? 0 : n-252, n))  : Math.min(...low);
  const priceVs52H = high52 > 0 ? close[n-1] / high52 : null;
  const priceVs52L = low52  > 0 ? close[n-1] / low52  : null;

  // 피보나치 지지/저항 (52주 고/저 기준)
  const fibRange = high52 - low52;
  const fib236 = high52 - fibRange * 0.236;
  const fib382 = high52 - fibRange * 0.382;
  const fib500 = high52 - fibRange * 0.500;
  const fib618 = high52 - fibRange * 0.618;
  const fib786 = high52 - fibRange * 0.786;
  const fibLevels = [fib236, fib382, fib500, fib618, fib786];
  const cp = close[n-1];
  const fibNearest = fibLevels.reduce((best, lv) => Math.abs(cp-lv) < Math.abs(cp-best) ? lv : best, fib382);
  const nearFibPct = fibRange > 0 ? Math.abs(cp - fibNearest) / fibRange : 1;
  const fibBull = nearFibPct < 0.03 && cp >= fibNearest; // 피보나치 지지 위 = 매수
  const fibBear = nearFibPct < 0.03 && cp <  fibNearest; // 피보나치 저항 아래 = 매도

  // VPT (Volume Price Trend) — OBV 개선판
  let vpt = 0;
  const vptArr = [0];
  for (let i = 1; i < n; i++) {
    const pctChg = close[i-1] > 0 ? (close[i] - close[i-1]) / close[i-1] : 0;
    vpt += vol[i] * pctChg;
    vptArr.push(vpt);
  }
  const vpt10avg = vptArr.slice(n-10, n).reduce((a,b)=>a+b,0) / 10;
  const vptTrend = vpt > vpt10avg ? 1 : -1;

  // Parabolic SAR
  let sarBull = true, sarVal = low[0], sarEP = high[0], sarAF = 0.02;
  for (let i = 1; i < n; i++) {
    if (sarBull) {
      sarVal = sarVal + sarAF * (sarEP - sarVal);
      sarVal = Math.min(sarVal, low[i-1], i > 1 ? low[i-2] : low[i-1]);
      if (low[i] < sarVal) { sarBull = false; sarVal = sarEP; sarEP = low[i]; sarAF = 0.02; }
      else if (high[i] > sarEP) { sarEP = high[i]; sarAF = Math.min(sarAF + 0.02, 0.2); }
    } else {
      sarVal = sarVal - sarAF * (sarVal - sarEP);
      sarVal = Math.max(sarVal, high[i-1], i > 1 ? high[i-2] : high[i-1]);
      if (high[i] > sarVal) { sarBull = true; sarVal = sarEP; sarEP = high[i]; sarAF = 0.02; }
      else if (low[i] < sarEP) { sarEP = low[i]; sarAF = Math.min(sarAF + 0.02, 0.2); }
    }
  }
  const sarSignal = sarBull ? 1 : -1; // +1=가격>SAR(매수), -1=가격<SAR(매도)

  // 갭 (오늘 저가 > 전일 고가 = 상승갭)
  const gapUp   = n >= 2 && low[n-1] > high[n-2];
  const gapDown = n >= 2 && high[n-1] < low[n-2];

  // RSI 다이버전스 (가격 신고 but RSI 낮으면 = 베어리시)
  const priceHigh20 = Math.max(...close.slice(Math.max(0, n-21), n-1));
  const priceLow20  = Math.min(...close.slice(Math.max(0, n-21), n-1));
  const rsiNow = rsi;
  const bearDiv = cp > priceHigh20 * 0.99 && rsiNow < 65; // 가격 신고 but RSI 약함
  const bullDiv = cp < priceLow20  * 1.01 && rsiNow > 35; // 가격 신저 but RSI 강함

  const r = v => v == null ? null : Math.round(v * 10) / 10;
  return {
    rsi: r(rsi),
    bb_upper: r(bb_upper), bb_mid: r(ma20), bb_lower: r(bb_lower), bb_pct: r(bb_pct),
    stoch_k: r(K), stoch_d: r(D),
    adx: r(adx), pdi: r(pdi), mdi: r(mdi),
    macd: r(macd_line[n-1]), macd_signal: r(sig_line[n-1]),
    ma5: r(ma5), ma10: r(ma10), ma20: r(ma20), ma50: r(ma50), ma200: r(ma200),
    will_r: r(willR),
    obv_trend: obvTrend,
    vol_ratio: Math.round(volRatio * 100) / 100,
    candles,
    price_vs_52h: priceVs52H != null ? Math.round(priceVs52H * 1000) / 1000 : null,
    price_vs_52l: priceVs52L != null ? Math.round(priceVs52L * 1000) / 1000 : null,
    mfi: r(mfi),
    cmf: Math.round(cmf * 1000) / 1000,
    roc20: roc20 != null ? Math.round(roc20 * 10) / 10 : null,
    roc5:  roc5  != null ? Math.round(roc5  * 10) / 10 : null,
    ich_signal: ichSignal,
    fib_bull: fibBull, fib_bear: fibBear,
    vpt_trend: vptTrend,
    sar_signal: sarSignal,
    gap_up: gapUp, gap_down: gapDown,
    bear_div: bearDiv, bull_div: bullDiv,
    price: r(close[n-1]),
  };
}

// 통합: yfinance 우선, 실패 시 NAVER 차트 + JS 계산으로 폴백
async function getTechnicals(symbol, isKr) {
  const cacheKey = `tech:${symbol}`;
  const cached = getC(cacheKey);
  if (cached) return cached;
  const yfticker = isKr ? symbol + '.KS' : symbol;
  let result;
  try { result = await calcTechnicalsYF(yfticker); } catch {}
  if (!result) {
    try {
      const bars = isKr ? await naverKrItemChart(symbol, '6mo') : await naverUsChart(symbol, '6mo');
      result = calcTechnicalsJS(bars);
    } catch {}
  }
  result = result || {};
  if (Object.keys(result).length > 0) setC(cacheKey, result, 86_400_000); // 24h 캐시
  return result;
}

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
h = t.history(period='1y')
if len(h) < 30:
    print(json.dumps({'error': 'not enough data'}))
else:
    c = h['Close']; hi = h['High']; lo = h['Low']; vol = h['Volume']
    n = len(c)
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

    # MA5, MA10, MA200
    ma5  = float(c.rolling(5).mean().iloc[-1]) if n >= 5 else None
    ma10 = float(c.rolling(10).mean().iloc[-1]) if n >= 10 else None
    ma200= float(c.rolling(200).mean().iloc[-1]) if n >= 200 else None

    # Williams %R(14)
    hh14 = float(hi.rolling(14).max().iloc[-1])
    ll14 = float(lo.rolling(14).min().iloc[-1])
    will_r = -100 * (hh14 - last) / (hh14 - ll14) if hh14 != ll14 else -50

    # OBV trend
    obv = (np.where(c.diff() > 0, vol, np.where(c.diff() < 0, -vol, 0))).cumsum()
    obv_s = obv if not hasattr(obv, 'values') else obv
    obv_last = float(obv[-1]) if hasattr(obv, '__len__') else 0
    obv_avg20 = float(np.mean(obv[-20:])) if len(obv) >= 20 else obv_last
    obv_trend = 1 if obv_last > obv_avg20 else -1

    # Volume ratio
    vol_arr = vol.values
    vol_avg20 = float(np.mean(vol_arr[-20:])) if len(vol_arr) >= 20 else 1
    vol_ratio = round(float(vol_arr[-1]) / vol_avg20, 2) if vol_avg20 > 0 else 1.0

    # MFI(14) — False → 0 채워서 NaN 방지
    tp = (c + hi + lo) / 3
    rmf = tp * vol
    pos_mf = rmf.where(tp > tp.shift(), 0).rolling(14).sum().iloc[-1]
    neg_mf = rmf.where(tp < tp.shift(), 0).rolling(14).sum().iloc[-1]
    mfi = float(100 - 100 / (1 + pos_mf / neg_mf)) if neg_mf > 0 else 100.0

    # CMF(20) — hl=0 구간 0 처리
    hl = hi - lo
    clv = ((c - lo) - (hi - c)) / hl.where(hl > 0, np.nan)
    cmf_num = (clv.fillna(0) * vol).rolling(20).sum().iloc[-1]
    cmf_den = float(vol.rolling(20).sum().iloc[-1])
    cmf = round(float(cmf_num) / cmf_den, 3) if cmf_den > 0 else 0.0

    # ROC
    roc20 = round(float((last - float(c.iloc[-21])) / float(c.iloc[-21]) * 100), 1) if n >= 21 else None
    roc5  = round(float((last - float(c.iloc[-6]))  / float(c.iloc[-6])  * 100), 1) if n >= 6  else None

    # Ichimoku
    def ich_hl(s_hi, s_lo, p, i): return (s_hi.rolling(p).max().iloc[i] + s_lo.rolling(p).min().iloc[i]) / 2
    tenkan = ich_hl(hi, lo, 9, -1) if n >= 9 else None
    kijun  = ich_hl(hi, lo, 26, -1) if n >= 26 else None
    senkouA = (tenkan + kijun) / 2 if tenkan is not None and kijun is not None else None
    senkouB = ich_hl(hi, lo, 52, -1) if n >= 52 else None
    if senkouA is not None and senkouB is not None:
        cloud_top = max(senkouA, senkouB); cloud_bot = min(senkouA, senkouB)
        ich_signal = 1 if last > cloud_top else (-1 if last < cloud_bot else 0)
    else:
        ich_signal = None

    # 52-week high/low
    high52 = float(hi.max()); low52 = float(lo.min())
    price_vs_52h = round(last / high52, 3) if high52 > 0 else None
    price_vs_52l = round(last / low52, 3) if low52 > 0 else None

    # Fibonacci
    fib_range = high52 - low52
    if fib_range > 0:
        fib_levels = [high52 - fib_range * r for r in [0.236, 0.382, 0.5, 0.618, 0.786]]
        fib_nearest = min(fib_levels, key=lambda lv: abs(last - lv))
        near_pct = abs(last - fib_nearest) / fib_range
        fib_bull = near_pct < 0.03 and last >= fib_nearest
        fib_bear = near_pct < 0.03 and last < fib_nearest
    else:
        fib_bull = False; fib_bear = False

    # VPT trend
    pct_chg = c.pct_change().fillna(0)
    vpt = (vol * pct_chg).cumsum()
    vpt_last = float(vpt.iloc[-1]); vpt_avg10 = float(vpt.iloc[-10:].mean())
    vpt_trend = 1 if vpt_last > vpt_avg10 else -1

    # Parabolic SAR (simplified)
    hi_arr = hi.values; lo_arr = lo.values; cl_arr = c.values
    sar_bull = True; sar_val = lo_arr[0]; sar_ep = hi_arr[0]; sar_af = 0.02
    for i in range(1, len(cl_arr)):
        if sar_bull:
            sar_val = sar_val + sar_af * (sar_ep - sar_val)
            sar_val = min(sar_val, lo_arr[i-1], lo_arr[i-2] if i > 1 else lo_arr[i-1])
            if lo_arr[i] < sar_val: sar_bull=False; sar_val=sar_ep; sar_ep=lo_arr[i]; sar_af=0.02
            elif hi_arr[i] > sar_ep: sar_ep=hi_arr[i]; sar_af=min(sar_af+0.02, 0.2)
        else:
            sar_val = sar_val - sar_af * (sar_val - sar_ep)
            sar_val = max(sar_val, hi_arr[i-1], hi_arr[i-2] if i > 1 else hi_arr[i-1])
            if hi_arr[i] > sar_val: sar_bull=True; sar_val=sar_ep; sar_ep=hi_arr[i]; sar_af=0.02
            elif lo_arr[i] < sar_ep: sar_ep=lo_arr[i]; sar_af=min(sar_af+0.02, 0.2)
    sar_signal = 1 if sar_bull else -1

    # Gap
    gap_up   = bool(float(lo_arr[-1]) > float(hi_arr[-2])) if n >= 2 else False
    gap_down = bool(float(hi_arr[-1]) < float(lo_arr[-2])) if n >= 2 else False

    # RSI divergence
    rsi_arr = rsi_s.values
    cl20 = cl_arr[-21:-1]
    price_high20 = float(np.max(cl20)) if len(cl20) > 0 else last
    price_low20  = float(np.min(cl20)) if len(cl20) > 0 else last
    rsi_now = float(rsi_arr[-1])
    bear_div = bool(last > price_high20 * 0.99 and rsi_now < 65)
    bull_div = bool(last < price_low20  * 1.01 and rsi_now > 35)

    # Candle patterns (last 3 bars)
    o = h['Open'].values
    c0,o0,h0,l0 = float(cl_arr[-1]),float(o[-1]),float(hi_arr[-1]),float(lo_arr[-1])
    c1,o1,h1,l1 = float(cl_arr[-2]),float(o[-2]),float(hi_arr[-2]),float(lo_arr[-2])
    c2,o2 = (float(cl_arr[-3]),float(o[-3])) if n >= 3 else (c1,o1)
    body0 = abs(c0-o0); range0 = h0-l0
    body1 = abs(c1-o1); range1 = h1-l1
    ls0 = min(c0,o0)-l0; us0 = h0-max(c0,o0)
    candles = []
    if range0 > 0 and body0/range0 < 0.1: candles.append('doji')
    if c1 < o1 and ls0 > body0*2 and us0 < body0 and body0 > 0: candles.append('hammer')
    if c1 < o1 and us0 > body0*2 and ls0 < body0 and body0 > 0: candles.append('inverted_hammer')
    if c1 < o1 and c0 > o0 and c0 > o1 and o0 < c1: candles.append('bullish_engulfing')
    if c1 > o1 and c0 < o0 and c0 < o1 and o0 > c1: candles.append('bearish_engulfing')
    if c2 < o2 and body1/(h1-l1+1e-9) < 0.3 and c0 > o0 and c0 > (o2+c2)/2: candles.append('morning_star')
    if c2 > o2 and body1/(h1-l1+1e-9) < 0.3 and c0 < o0 and c0 < (o2+c2)/2: candles.append('evening_star')

    print(json.dumps({
        'rsi': round(float(rsi_s.iloc[-1]), 1),
        'bb_upper': round(bb_u, 4), 'bb_mid': round(float(mid.iloc[-1]), 4), 'bb_lower': round(bb_l, 4),
        'bb_pct': round((last - bb_l) / (bb_u - bb_l) * 100, 1) if bb_u != bb_l else 50,
        'stoch_k': round(float(K.iloc[-1]), 1), 'stoch_d': round(float(D.iloc[-1]), 1),
        'adx': round(float(adx_s.iloc[-1]), 1), 'pdi': round(float(pdi_s.iloc[-1]), 1), 'mdi': round(float(mdi_s.iloc[-1]), 1),
        'macd': round(float(macd_s.iloc[-1]), 4), 'macd_signal': round(float(sig_s.iloc[-1]), 4),
        'ma20': round(float(mid.iloc[-1]), 4), 'ma50': round(float(c.rolling(50).mean().iloc[-1]), 4),
        'ma5': round(ma5, 4) if ma5 else None,
        'ma10': round(ma10, 4) if ma10 else None,
        'ma200': round(ma200, 4) if ma200 else None,
        'price': round(last, 4),
        'will_r': round(will_r, 1),
        'obv_trend': obv_trend,
        'vol_ratio': vol_ratio,
        'mfi': round(mfi, 1),
        'cmf': cmf,
        'roc20': roc20, 'roc5': roc5,
        'ich_signal': ich_signal,
        'price_vs_52h': price_vs_52h, 'price_vs_52l': price_vs_52l,
        'fib_bull': fib_bull, 'fib_bear': fib_bear,
        'vpt_trend': vpt_trend,
        'sar_signal': sar_signal,
        'gap_up': gap_up, 'gap_down': gap_down,
        'bear_div': bear_div, 'bull_div': bull_div,
        'candles': candles,
    }))
`;
  return yfRun(py);
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM: Gemini first, Groq fallback
// ─────────────────────────────────────────────────────────────────────────────
const _GEMINI_KEYS = (process.env.GEMINI_API_KEY || '').split(',').map(s => s.trim()).filter(Boolean);
const _GEMINI_MODEL = 'gemini-2.0-flash';

async function geminiChat(prompt, { maxTokens = 1200 } = {}) {
  if (!_GEMINI_KEYS.length) throw new Error('GEMINI_API_KEY 없음');
  for (const key of _GEMINI_KEYS) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${_GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(40_000),
      }
    );
    if (resp.status === 429) continue; // 다음 키 시도
    if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
    const j = await resp.json();
    return j.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
  throw new Error('Gemini 모든 키 한도 초과');
}

async function groqChat(messages, { maxTokens = 1200 } = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY 없음');
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: maxTokens, temperature: 0.3 }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!resp.ok) throw new Error(`Groq ${resp.status}`);
  const j = await resp.json();
  return j.choices[0].message.content;
}

function buildAIPrompt(symbol, isKr, t, q, news, flow, macro, sig) {
  const { signal, score, breakdown: bk, reasons } = sig;
  const cur = isKr ? '₩' : '$';
  const n = (v, d=1) => v != null ? (+v).toFixed(d) : null;
  const pct = v => v != null ? `${(+v*100).toFixed(1)}%` : null;

  const changePct = q.changePct != null ? `${q.changePct>=0?'+':''}${q.changePct.toFixed(2)}%` : null;

  // ── 기술지표 팩트 문장 (AI가 반드시 포함해야 할 수치) ──
  const techFacts = [
    t.rsi!=null && `RSI(14) ${n(t.rsi)}${t.rsi>70?' — 과매수 구간':t.rsi<30?' — 과매도 구간':' — 중립 구간'}`,
    t.macd!=null&&t.macd_signal!=null && `MACD ${n(t.macd,3)} vs 시그널 ${n(t.macd_signal,3)} (${t.macd>t.macd_signal?'골든크로스 — 상승 모멘텀':'데드크로스 — 하락 모멘텀'})`,
    t.adx!=null && `ADX ${n(t.adx)} — ${t.adx>25?(t.pdi>t.mdi?'강한 상승추세(+DI>-DI)':'강한 하락추세(-DI>+DI)'):'추세 없음(횡보)'}`,
    t.bb_pct!=null && `볼린저밴드 ${n(t.bb_pct,0)}% 위치${t.bb_pct>80?' — 상단 돌파(과열 주의)':t.bb_pct<20?' — 하단 접근(반등 가능)':' — 밴드 중간'}`,
    t.stoch_k!=null && `스토캐스틱 K ${n(t.stoch_k,0)}${t.stoch_k>80?' — 과매수':t.stoch_k<20?' — 과매도':''}`,
    t.will_r!=null && `Williams %R ${n(t.will_r,0)}${t.will_r>-20?' — 과매수':t.will_r<-80?' — 과매도':''}`,
    t.obv_trend!=null && `OBV ${t.obv_trend>0?'상승 추세 — 매집 신호':'하락 추세 — 분산 신호'}`,
    t.cmf!=null && `CMF ${n(t.cmf,2)}${t.cmf>0.1?' — 강한 매수 압력':t.cmf<-0.1?' — 강한 매도 압력':' — 중립'}`,
    t.mfi!=null && `MFI ${n(t.mfi,0)}${t.mfi>80?' — 과매수':t.mfi<20?' — 과매도':''}`,
    t.ich_signal && `이치모쿠 ${t.ich_signal}`,
    t.roc20!=null && `ROC(20) ${n(t.roc20,1)}%${t.roc20>0?' — 양의 모멘텀':' — 음의 모멘텀'}`,
    t.sar_signal && `Parabolic SAR ${t.sar_signal}`,
    t.price_vs_52h!=null && `52주 고점 대비 ${n(t.price_vs_52h,1)}%`,
    t.price_vs_52l!=null && `52주 저점 대비 +${n(t.price_vs_52l,1)}%`,
    t.candles?.length && `캔들 패턴: ${t.candles.join(', ')}`,
  ].filter(Boolean);

  // ── 펀더멘탈 팩트 문장 ──
  const fundFacts = [
    q.per!=null && `PER ${n(q.per)}배`,
    q.forwardPer!=null && `예상 PER ${n(q.forwardPer)}배`,
    q.pbr!=null && `PBR ${n(q.pbr,2)}배`,
    q.roe!=null && `ROE ${pct(q.roe)}`,
    q.operatingMargin!=null && `영업이익률 ${pct(q.operatingMargin)}`,
    q.earningsGrowth!=null && `이익성장률 ${pct(q.earningsGrowth)}`,
    q.revenueGrowth!=null && `매출성장률 ${pct(q.revenueGrowth)}`,
    q.debtToEquity!=null && `부채비율 ${n(q.debtToEquity,0)}%`,
    q.freeCashflow!=null && `FCF ${q.freeCashflow>0?'양수(현금 창출력 우수)':'음수(현금 소진 중)'}`,
    q.recommendation && `애널리스트 컨센서스 ${q.recommendation}${q.targetPrice?` / 목표주가 ${cur}${(+q.targetPrice).toLocaleString()}`:''}`,
  ].filter(Boolean);

  // ── 수급 팩트 문장 ──
  const flowFacts = [
    flow.institutionPct!=null && `기관 지분율 ${flow.institutionPct}%`,
    flow.insiderPct!=null && `내부자 지분율 ${flow.insiderPct}%`,
    flow.shortPct!=null && `공매도 비율 ${flow.shortPct}%`,
    flow.topHolders?.length && `주요 기관주주: ${flow.topHolders.slice(0,2).map(h=>`${h.name}(${h.pct}%)`).join(', ')}`,
    flow.insiderTx?.length && `내부자 ${flow.insiderTx[0].type}: ${flow.insiderTx[0].name} ${flow.insiderTx[0].shares?.toLocaleString()}주 (${flow.insiderTx[0].date})`,
    flow.options && `풋콜비율 ${flow.options.putCallRatio} / 내재변동성 ${flow.options.impliedVol}%`,
  ].filter(Boolean);

  // ── 매크로 팩트 문장 ──
  const macroFacts = [
    macro.vix && `VIX ${macro.vix.value}${macro.vix.value>25?' — 공포 구간(시장 변동성 극대)':macro.vix.value<15?' — 안정 구간':' — 보통 수준'}`,
    macro.us10y && `미국 10년물 국채금리 ${macro.us10y.value}%${macro.us10y.value>4.5?' — 고금리(주가 할인율 상승)':''}`,
    macro.usdkrw && isKr && `원달러 환율 ${macro.usdkrw.value}원 (전일 대비 ${macro.usdkrw.chg>0?'+':''}${macro.usdkrw.chg}%)`,
    macro.gold && `금 $${macro.gold.value} (${macro.gold.chg>0?'+':''}${macro.gold.chg}%)`,
    macro.oil && `WTI 원유 $${macro.oil.value} (${macro.oil.chg>0?'+':''}${macro.oil.chg}%)`,
  ].filter(Boolean);

  const newsStr = news.slice(0,3).map(n=>n.title.slice(0,70)).join('\n- ');

  const sk = (v) => v>=0?`+${v}`:v; // signed

  return `당신은 CFA 자격을 보유한 전문 주식 애널리스트입니다. ${symbol}(${isKr?'한국':'미국'}) 종목 분석 JSON을 작성하세요.

[절대 원칙]
- 반드시 한국어 존댓말(~합니다/~입니다)로 작성
- 아래 [팩트 데이터]의 수치를 각 섹션에서 빠짐없이 인용하고, 각 수치가 무엇을 의미하는지 친절하게 설명
- 수치 나열에 그치지 말고, 수치 → 의미 → 투자 판단으로 이어지는 흐름으로 서술
- 단기·중기 예상 전개와 실질적인 투자 판단 근거 제시
- JSON만 출력 (다른 텍스트 없음)

[종합 평가]
신호: ${signal} | 점수: ${score}/200
팩터: 기술${sk(bk.technical)} / 가치${sk(bk.value)} / 품질${sk(bk.quality)} / 성장${sk(bk.growth)} / 수급${sk(bk.flow)} / 심리${sk(bk.sentiment)}
주요 시그널: ${reasons.join(' / ')}

[기술지표 팩트]
${techFacts.length ? techFacts.map(f=>`- ${f}`).join('\n') : '- 데이터 없음'}

[펀더멘탈 팩트]
${fundFacts.length ? fundFacts.map(f=>`- ${f}`).join('\n') : '- 데이터 없음'}

[수급 팩트]
${flowFacts.length ? flowFacts.map(f=>`- ${f}`).join('\n') : '- 데이터 없음'}

[매크로 팩트]
${macroFacts.length ? macroFacts.map(f=>`- ${f}`).join('\n') : '- 데이터 없음'}

[오늘 등락]
${changePct || '데이터 없음'}

[최근 뉴스]
${newsStr ? `- ${newsStr}` : '없음'}

[출력 JSON]
{
  "price_move": "${changePct ? `오늘 ${changePct} 변동. 위 뉴스와 기술지표(RSI, MACD 등)를 근거로 변동 원인을 2~3문장으로 설명하세요. 뉴스 제목을 그대로 복사하지 말고 핵심 내용을 해석하세요.` : ''}",
  "summary": "종합 점수 ${score}점(${signal}) 의미와 팩터별 점수(기술${sk(bk.technical)}/가치${sk(bk.value)}/품질${sk(bk.quality)}/성장${sk(bk.growth)})를 바탕으로, 위 주요 시그널을 인용하며 핵심 투자 포인트를 4~5문장으로 설명하세요.",
  "technical": "위 [기술지표 팩트]의 모든 수치(RSI, MACD, ADX, 볼린저밴드, 스토캐스틱, Williams%R, OBV, CMF, MFI, 이치모쿠, ROC, SAR 등)를 각각 인용하고, 각 지표가 현재 추세·모멘텀·과매수/과매도에서 무엇을 의미하는지 구체적으로 설명하세요. 기술적 점수 ${sk(bk.technical)}점의 의미도 포함하세요.",
  "fundamental": "위 [펀더멘탈 팩트]의 모든 수치(PER, 예상PER, PBR, ROE, 영업이익률, 이익성장률, 매출성장률, 부채비율, FCF, 컨센서스)를 각각 인용하고, 현재 주가가 기업 가치 대비 적정한지 설명하세요. 가치${sk(bk.value)}/품질${sk(bk.quality)}/성장${sk(bk.growth)}점도 언급하세요.",
  "flow": "위 [수급 팩트]의 모든 수치(기관지분율, 내부자지분율, 공매도비율, 주요기관주주, 내부자거래, 풋콜비율, 내재변동성)를 각각 인용하고, 기관·세력·옵션 시장의 포지션이 주가에 어떤 영향을 미칠지 해석하세요. 수급 점수 ${sk(bk.flow)}점도 언급하세요.",
  "sentiment": "위 [최근 뉴스] 내용을 해석하여 주가에 미치는 영향을 설명하고, [매크로 팩트]의 VIX·금리·환율·금·원유 수치를 모두 인용하며 현재 거시 환경이 이 종목에 유리한지 불리한지 판단하세요. 심리 점수 ${sk(bk.sentiment)}점도 언급하세요.",
  "risk": "이 종목의 [기술지표 팩트]·[펀더멘탈 팩트]·[매크로 팩트]에서 도출되는 구체적 리스크 3가지를 실제 수치를 근거로 설명하세요. 막연한 표현 없이, 이 종목 고유의 리스크를 명확한 수치와 함께 서술하세요."
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 분석 Phase 1: 결정론적 시그널 (즉시 응답)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/analysis', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  const isKr = market === 'kr';

  try {
    const data = await cached(`det:${symbol}`, 86400_000, async () => {
      const [techR, quoteR, newsR, flowR, macroR] = await Promise.allSettled([
        getTechnicals(symbol, isKr),
        (async () => {
          const cq = getC(`q:${symbol}`);
          if (cq) return cq;
          if (isKr) { const [q, fin] = await Promise.all([krQuote(symbol), krFinancials(symbol)]); return { ...q, ...fin }; }
          return usQuote(symbol);
        })(),
        getNews(symbol, isKr),
        getFlowData(symbol, isKr),
        // macroAll → /api/macro 캐시 재사용 (중복 Python 호출 제거)
        (async () => {
          const m = getC('macro');
          if (m) return normalizeMacro(m);
          return normalizeMacro(await cached('macro', 300_000, fetchMacroData));
        })(),
      ]);

      const t    = techR.status  === 'fulfilled' ? techR.value  : {};
      const q    = quoteR.status === 'fulfilled' ? quoteR.value : {};
      const news = newsR.status  === 'fulfilled' ? newsR.value  : [];
      const flow = flowR.status  === 'fulfilled' ? flowR.value  : {};
      const macro= macroR.status === 'fulfilled' ? macroR.value : {};

      // 시그널 계산 (store에 있으면 재사용, 없으면 계산 후 저장)
      let sig = _signalStore.get(symbol);
      if (!sig) {
        sig = computeSignal(t, q, flow, macro);
        sig.symbol = symbol; sig.market = isKr ? 'kr' : 'us';
        _signalStore.set(symbol, sig);
      }

      // 데이터를 signal store에도 저장해두어 AI 엔드포인트에서 재사용
      const det = buildDeterministicAnalysis(symbol, isKr, t, q, news, flow, macro, sig);
      // raw 데이터도 같이 저장 (AI 프롬프트용)
      setC(`rawdata:${symbol}`, { t, q, news, flow, macro, sig, isKr }, 86400_000);
      return det;
    });
    res.json(data);
  } catch (e) {
    console.error('analysis 실패:', symbol, e.message?.slice(0, 120));
    _c.delete(`det:${symbol}`);
    const stored = _signalStore.get(symbol);
    if (stored) {
      const { signal, confidence, score, breakdown: bk, reasons } = stored;
      return res.json({
        signal, confidence, score, breakdown: bk, reasons,
        summary: `종합 점수 ${score}점 기준 ${signal} 의견입니다. ${reasons.slice(0,5).join(', ')}`,
        technical: `기술적 점수 ${bk.technical >= 0 ? '+' : ''}${bk.technical}점입니다.`,
        fundamental: `가치 ${bk.value >= 0 ? '+' : ''}${bk.value} / 품질 ${bk.quality >= 0 ? '+' : ''}${bk.quality} / 성장 ${bk.growth >= 0 ? '+' : ''}${bk.growth}점입니다.`,
        flow: `수급 점수 ${bk.flow >= 0 ? '+' : ''}${bk.flow}점입니다.`,
        sentiment: `심리 점수 ${bk.sentiment >= 0 ? '+' : ''}${bk.sentiment}점입니다.`,
        risk: '시장 변동성 및 거시경제 리스크를 고려하시기 바랍니다.',
        price_move: '',
      });
    }
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 분석 Phase 2: AI 텍스트 생성 (Groq LLM, 24h 캐시)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/analysis/ai', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  const isKr = market === 'kr';

  // 캐시 히트 → 즉시 응답
  const cached_ai = getC(`ai-text:${symbol}`);
  if (cached_ai) return res.json(cached_ai);

  // rawdata가 없으면 det 호출해서 먼저 채움
  let raw = getC(`rawdata:${symbol}`);
  if (!raw) {
    try {
      await fetch(`http://localhost:${PORT}/api/analysis?symbol=${encodeURIComponent(symbol)}&market=${market}`);
      raw = getC(`rawdata:${symbol}`);
    } catch {}
  }
  if (!raw) return res.status(503).json({ error: '데이터 없음' });

  const { t, q, news, flow, macro, sig } = raw;

  try {
    const prompt = buildAIPrompt(symbol, isKr, t, q, news, flow, macro, sig);

    // Gemini 우선, 실패 시 Groq 폴백
    let content;
    try {
      content = await geminiChat(prompt, { maxTokens: 1200 });
    } catch (geminiErr) {
      console.warn('Gemini 실패, Groq 시도:', geminiErr.message?.slice(0, 60));
      const messages = [{ role: 'user', content: prompt }];
      content = await groqChat(messages, { maxTokens: 1200 });
    }

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 없음');
    const parsed = JSON.parse(jsonMatch[0]);

    // price_move: AI가 생성한 값 사용, 없으면 결정론적 폴백
    const isUp = (q.changePct ?? 0) >= 0;
    let price_move = parsed.price_move || '';
    if (!price_move && q.changePct != null) {
      price_move = buildDeterministicPriceMove(symbol, isKr, q, news, sig.reasons, t, flow, macro);
    }

    const result = { ...parsed, price_move };
    setC(`ai-text:${symbol}`, result, 86400_000);
    res.json(result);
  } catch (e) {
    console.error('AI 분석 실패:', symbol, e.message?.slice(0, 120));
    // 실패 시 결정론적 텍스트 폴백
    const det = getC(`det:${symbol}`);
    if (det) return res.json({ ...det, _fallback: true });
    
    // det 캐시도 없으면 rawdata로 직접 결정론적 생성
    try {
      const fallback = buildDeterministicAnalysis(symbol, isKr, t, q, news, flow, macro, sig);
      return res.json({ ...fallback, _fallback: true });
    } catch (fallbackErr) {
      console.error('결정론적 폴백 생성 실패:', symbol, fallbackErr.message?.slice(0, 120));
      res.status(500).json({ error: e.message });
    }
  }
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
  return serveSWR(res, `earn:${symbol}`, 3600_000, async () => {
      const yfticker = market === 'kr' ? symbol + '.KS' : symbol;
      const py = `
import yfinance as yf, json, re, math
import pandas as pd

def safe(v):
    if v is None: return None
    try:
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except: return v

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
                rev = safe(qi.loc['Total Revenue', col]) if 'Total Revenue' in qi.index else None
                oi  = safe(qi.loc['Operating Income', col]) if 'Operating Income' in qi.index else None
                ni  = safe(qi.loc['Net Income', col]) if 'Net Income' in qi.index else None
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

out = json.dumps(result, ensure_ascii=False, default=str)
print(re.sub(r'\\bNaN\\b', 'null', out))
`;
      try { return await _pyExecLong(py); } catch(e) { console.error('earnings 실패:', symbol, e.message?.slice(0,120)); return {}; }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 동종업계 비교 (Peers)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/peers', async (req, res) => {
  const { symbol, market } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  return serveSWR(res, `peers:${symbol}`, 3600_000, async () => {
      const isKr = market === 'kr';
      const yfticker = isKr ? symbol + '.KS' : symbol;

      // ── KR 종목: 스크리너 캐시에서 섹터 추정 ──────────────────────────────
      // (yfinance .KS info는 sector/industry가 자주 비어있어 하드코딩 맵 우선)
      const KR_PEER_MAP = {
        '005930': { sector:'반도체', peers:['000660','005930','NVDA','TSM','INTC','AVGO'] },
        '000660': { sector:'반도체', peers:['005930','NVDA','MU','INTC','AVGO','AMD'] },
        '373220': { sector:'배터리', peers:['006400','051910','000270','LTHM','ALB','LAC'] },
        '006400': { sector:'배터리', peers:['373220','051910','005380','LTHM','ALB','SQM'] },
        '207940': { sector:'바이오', peers:['068270','000661','AMGN','GILD','REGN','VRTX'] },
        '068270': { sector:'바이오', peers:['207940','000661','JNJ','LLY','PFE','ABBV'] },
        '005380': { sector:'자동차', peers:['000270','012330','TSLA','TM','F','GM'] },
        '000270': { sector:'자동차', peers:['005380','012330','TSLA','TM','F','GM'] },
        '035420': { sector:'인터넷', peers:['035720','251270','GOOGL','META','NFLX','BIDU'] },
        '035720': { sector:'인터넷', peers:['035420','251270','GOOGL','META','KAKAO','BIDU'] },
        '066570': { sector:'가전', peers:['005930','000660','AAPL','SONY','HPQ','SNE'] },
        '005490': { sector:'철강', peers:['047050','NUE','X','STLD','MT','PKX'] },
        '105560': { sector:'금융', peers:['055550','086790','JPM','BAC','WFC','GS'] },
        '055550': { sector:'금융', peers:['105560','086790','JPM','BAC','C','WFC'] },
        '086790': { sector:'금융', peers:['105560','055550','JPM','BAC','WFC','MS'] },
        '012450': { sector:'방산', peers:['047810','LMT','RTX','NOC','GD','BA'] },
        '247540': { sector:'반도체장비', peers:['000660','AMAT','KLAC','LRCX','ASML','TER'] },
        '051910': { sector:'화학', peers:['011170','006400','DOW','LYB','BASFY','CE'] },
        '033780': { sector:'식음료', peers:['097950','000080','KO','PEP','MDLZ','GIS'] },
        '096770': { sector:'에너지', peers:['010950','034020','XOM','CVX','COP','BP'] },
        '015760': { sector:'유틸리티', peers:['034020','096770','NEE','DUK','SO','D'] },
        '259960': { sector:'게임', peers:['036570','251270','TTWO','EA','ATVI','RBLX'] },
        '034020': { sector:'에너지', peers:['015760','096770','XOM','CVX','BP','SHEL'] },
        '323410': { sector:'카드/결제', peers:['105560','055550','V','MA','AXP','PYPL'] },
        '003670': { sector:'방산', peers:['012450','047810','LMT','RTX','NOC','GD'] },
        '018260': { sector:'IT서비스', peers:['035420','035720','ORCL','SAP','IBM','CTSH'] },
      };

      const py = `
import yfinance as yf, json, warnings, math
from concurrent.futures import ThreadPoolExecutor
warnings.filterwarnings('ignore')

TICKER = '${yfticker}'
IS_KR = ${isKr ? 'True' : 'False'}

# ── 업종별 동종업계 맵 (yfinance industry/sector 문자열 기준) ──────────────
PEER_MAP = {
    # 반도체
    'Semiconductors': ['NVDA','AMD','INTC','AVGO','QCOM','MU','TSM','000660.KS','005930.KS'],
    'Semiconductor Equipment & Materials': ['AMAT','KLAC','LRCX','ASML','TER','ONTO','247540.KS'],
    # 소프트웨어
    'Software—Application': ['MSFT','CRM','ADBE','NOW','WDAY','INTU','ORCL','SAP'],
    'Software—Infrastructure': ['MSFT','ORCL','PANW','CRWD','ZS','FTNT'],
    'Software': ['MSFT','ORCL','CRM','ADBE','NOW','WDAY','INTU','SAP'],
    # 인터넷
    'Internet Content & Information': ['GOOGL','META','NFLX','PINS','SNAP','035420.KS','035720.KS'],
    'Internet Retail': ['AMZN','BABA','JD','SHOP','WMT','EBAY','MELI'],
    'Electronic Gaming & Multimedia': ['TTWO','EA','RBLX','259960.KS','036570.KS','NTES'],
    # 하드웨어/전자
    'Consumer Electronics': ['AAPL','SONY','066570.KS','005930.KS','000660.KS','HPQ'],
    'Electronic Components': ['AVGO','TXN','MCHP','ADI','LSCC','MPWR'],
    'Computer Hardware': ['AAPL','DELL','HPQ','NTAP','WDC','STX'],
    'Communication Equipment': ['CSCO','NOK','ERIC','JNPR','VIAV','CIEN'],
    # 자동차
    'Auto Manufacturers': ['TSLA','TM','F','GM','HMC','STLA','005380.KS','000270.KS'],
    'Auto Parts': ['MGA','BWA','LEA','ALV','012330.KS','APTV'],
    # 금융
    'Banks—Diversified': ['JPM','BAC','WFC','GS','MS','C','105560.KS','055550.KS'],
    'Banks—Regional': ['USB','PNC','TFC','FITB','HBAN','105560.KS','055550.KS'],
    'Financial Services': ['V','MA','AXP','PYPL','GS','MS'],
    'Insurance—Diversified': ['BRK-B','MET','PRU','AFL','ALL','TRV'],
    'Asset Management': ['BLK','SCHW','AMP','IVZ','WDR','TROW'],
    'Credit Services': ['V','MA','AXP','PYPL','COF','DFS','SYF'],
    # 바이오/제약
    'Biotechnology': ['AMGN','GILD','REGN','VRTX','BIIB','MRNA','068270.KS','207940.KS'],
    'Drug Manufacturers—General': ['LLY','JNJ','PFE','ABBV','MRK','BMY','NVO','AZN'],
    'Drug Manufacturers—Specialty & Generic': ['TEVA','MYL','PRGO','ENDP','HZN'],
    'Medical Devices': ['MDT','ABT','SYK','BSX','EW','ISRG','DXCM'],
    'Healthcare Plans': ['UNH','CVS','CI','HUM','ELV','MOH'],
    # 에너지
    'Oil & Gas Integrated': ['XOM','CVX','SHEL','BP','TTE','096770.KS','034020.KS'],
    'Oil & Gas E&P': ['COP','EOG','PXD','DVN','FANG','MRO'],
    'Oil & Gas Refining & Marketing': ['VLO','MPC','PSX','DINO','PBF'],
    'Utilities—Regulated Electric': ['NEE','DUK','SO','D','AEP','EXC','015760.KS'],
    'Utilities—Renewable': ['NEE','ENPH','FSLR','RUN','SEDG','BEP'],
    # 소비재
    'Beverages—Non-Alcoholic': ['KO','PEP','MNST','CELH','COKE','033780.KS'],
    'Beverages—Alcoholic': ['BUD','TAP','STZ','SAM','HEINY'],
    'Packaged Foods': ['MDLZ','GIS','K','CPB','SJM','HRL'],
    'Household & Personal Products': ['PG','CL','CHD','EL','KMB','HENKY'],
    'Apparel—Retail': ['NKE','LULU','VFC','PVH','RL','UAA','HBI'],
    'Specialty Retail': ['HD','LOW','TGT','COST','TJX','ROST'],
    'Department Stores': ['TGT','WMT','COST','M','JWN','KSS'],
    'Discount Stores': ['WMT','COST','TGT','DLTR','DG','BJ'],
    # 통신
    'Telecom Services': ['T','VZ','TMUS','LUMN','DISH'],
    'Communication Services': ['GOOGL','META','NFLX','DIS','CMCSA','T','VZ'],
    # 산업재
    'Aerospace & Defense': ['LMT','RTX','NOC','GD','BA','HII','012450.KS','047810.KS'],
    'Industrial Machinery': ['CAT','DE','EMR','PH','ROK','XYL'],
    'Engineering & Construction': ['PWR','ACM','MTZ','FLR','STRL','KBR'],
    'Specialty Chemicals': ['LIN','APD','ECL','SHW','PPG','006400.KS','051910.KS','373220.KS'],
    'Steel': ['NUE','X','STLD','CLF','RS','005490.KS'],
    'Aluminum': ['AA','ARNC','KALU','CENX'],
    # 부동산/기타
    'REIT—Retail': ['SPG','O','KIM','REG','BRX'],
    'REIT—Industrial': ['PLD','EGP','REXR','FR','STAG'],
    'REIT—Office': ['BXP','VNO','CUZ','HIW','EQC'],
}

def safe_float(v):
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f): return None
        return f
    except: return None

# ── 메인 종목 정보 조회 ──────────────────────────────────────────────────────
info = {}
sector = ''
industry = ''
try:
    t = yf.Ticker(TICKER)
    info = t.info or {}
    sector = info.get('sector') or ''
    industry = info.get('industry') or ''
except: pass

# sector/industry 못 가져왔을 때 fast_info로 보완
if not sector and not industry:
    try:
        fi = yf.Ticker(TICKER).fast_info
        # fast_info에는 sector 없음, 그냥 빈 상태 유지
    except: pass

# ── 피어 목록 결정 ────────────────────────────────────────────────────────────
# 1순위: industry 정확 매치
# 2순위: sector 부분 매치 (키에 sector 문자열 포함)
# 3순위: 빈 리스트 (결과 없음보단 낫게, fallback 발동)
peers_list = PEER_MAP.get(industry, [])
if not peers_list:
    for k, v in PEER_MAP.items():
        if sector and sector.lower() in k.lower():
            peers_list = v
            break
if not peers_list and sector:
    # sector 키워드로 2차 시도
    sec_low = sector.lower()
    for k, v in PEER_MAP.items():
        if any(w in k.lower() for w in sec_low.split()):
            peers_list = v
            break

main_id = TICKER.replace('.KS','')
peers_list = [p for p in peers_list if p.replace('.KS','') != main_id][:6]

# ── 가격/등락률 배치 조회 ─────────────────────────────────────────────────────
all_tickers = peers_list + [TICKER]
price_cache = {}
try:
    if len(all_tickers) == 1:
        dl = yf.download(all_tickers[0], period='3d', auto_adjust=True, progress=False)
        if len(dl) >= 1:
            p = float(dl['Close'].iloc[-1])
            pv = float(dl['Close'].iloc[-2]) if len(dl) >= 2 else p
            price_cache[all_tickers[0]] = (round(p,2), round((p-pv)/pv*100 if pv else 0, 2))
    else:
        dl = yf.download(all_tickers, period='3d', auto_adjust=True, progress=False, group_by='ticker')
        for tk in all_tickers:
            try:
                if tk in dl.columns.get_level_values(0):
                    col = dl[tk]['Close'].dropna()
                else:
                    col = dl['Close'].dropna() if 'Close' in dl else None
                if col is not None and len(col) >= 1:
                    p = float(col.iloc[-1])
                    pv = float(col.iloc[-2]) if len(col) >= 2 else p
                    price_cache[tk] = (round(p,2), round((p-pv)/pv*100 if pv else 0, 2))
            except: pass
except: pass

def get_price_chg(ticker):
    if ticker in price_cache:
        return price_cache[ticker]
    try:
        fi2 = yf.Ticker(ticker).fast_info
        p = safe_float(fi2.last_price) or 0
        pv = safe_float(fi2.regular_market_previous_close) or p
        return round(p,2), round((p-pv)/pv*100 if pv else 0, 2)
    except: pass
    return None, None

# ── 피어 상세 조회 ────────────────────────────────────────────────────────────
def fetch_peer(peer):
    try:
        pt = yf.Ticker(peer)
        pi = pt.info or {}
        pfi = pt.fast_info
        price, chg = get_price_chg(peer)
        if price is None: return None  # 가격 없으면 제외
        mc = safe_float(getattr(pfi, 'market_cap', None)) or safe_float(pi.get('marketCap'))
        return {
            'ticker': peer.replace('.KS',''),
            'name': pi.get('shortName') or pi.get('longName') or peer.replace('.KS',''),
            'price': price, 'changePct': chg,
            'per': safe_float(pi.get('trailingPE')),
            'forwardPer': safe_float(pi.get('forwardPE')),
            'pbr': safe_float(pi.get('priceToBook')),
            'roe': round(safe_float(pi.get('returnOnEquity') or 0)*100, 1) if pi.get('returnOnEquity') else None,
            'marketCap': mc,
            'revenueGrowth': round(safe_float(pi.get('revenueGrowth') or 0)*100, 1) if pi.get('revenueGrowth') else None,
            'profitMargin': round(safe_float(pi.get('profitMargins') or 0)*100, 1) if pi.get('profitMargins') else None,
            'div': round(safe_float(pi.get('dividendYield') or 0)*100, 2) if pi.get('dividendYield') else None,
        }
    except: return None

if peers_list:
    with ThreadPoolExecutor(max_workers=min(6, len(peers_list))) as ex:
        result = [r for r in ex.map(fetch_peer, peers_list) if r]
else:
    result = []

p0, chg0 = get_price_chg(TICKER)
mc0 = safe_float(info.get('marketCap'))
main_data = {
    'ticker': main_id,
    'name': info.get('shortName') or info.get('longName') or main_id,
    'price': p0, 'changePct': chg0,
    'per': safe_float(info.get('trailingPE')),
    'forwardPer': safe_float(info.get('forwardPE')),
    'pbr': safe_float(info.get('priceToBook')),
    'roe': round(safe_float(info.get('returnOnEquity') or 0)*100,1) if info.get('returnOnEquity') else None,
    'revenueGrowth': round(safe_float(info.get('revenueGrowth') or 0)*100,1) if info.get('revenueGrowth') else None,
    'profitMargin': round(safe_float(info.get('profitMargins') or 0)*100,1) if info.get('profitMargins') else None,
    'marketCap': mc0,
}
print(json.dumps({'sector': sector, 'industry': industry, 'main': main_data, 'peers': result}, ensure_ascii=False, default=str))
`;
      const raw = await _pyExecLong(py).catch(e => { console.error('peers 실패:', symbol, e.message?.slice(0,100)); return null; });
      if (!raw) throw new Error('peers python 실패');

      // ── KR 종목: 하드코딩 피어맵 + 스크리너 캐시로 보완 ──────────────────
      if (isKr) {
        const sc = getC('screener') || {};
        const fill = (item) => {
          if (!item) return item;
          const code = (item.ticker||'').replace('.KS','');
          const cached = sc[code];
          if (cached) {
            if (item.per == null && cached.per) item.per = cached.per;
            if (item.pbr == null && cached.pbr) item.pbr = cached.pbr;
            if (item.roe == null && cached.roe) item.roe = cached.roe;
            if (!item.name || item.name === code) item.name = cached.name || item.name;
          }
          return item;
        };
        if (raw.main) fill(raw.main);
        if (raw.peers) raw.peers = raw.peers.map(fill);

        // 피어가 아직 없으면 KR_PEER_MAP으로 재시도 (Python info가 실패한 경우)
        if (!raw.peers?.length) {
          const krEntry = KR_PEER_MAP[symbol];
          if (krEntry) {
            raw.sector = raw.sector || krEntry.sector;
            raw.industry = raw.industry || krEntry.sector;
            // 스크리너 캐시에서 기본 피어 데이터 생성
            raw.peers = krEntry.peers
              .filter(p => p.replace('.KS','') !== symbol)
              .slice(0, 6)
              .map(p => {
                const code = p.replace('.KS','');
                const cached = sc[code];
                if (cached && cached.price) {
                  return { ticker: code, name: cached.name || code, price: cached.price,
                    changePct: cached.changePct ?? null, per: cached.per ?? null,
                    pbr: cached.pbr ?? null, roe: cached.roe ?? null,
                    marketCap: cached.marketCap ?? null, revenueGrowth: null, profitMargin: null };
                }
                return null;
              })
              .filter(Boolean);
          }
        }
      }

      // sector/industry 둘 다 없고 peers도 없으면 캐시하지 않고 재시도 유도
      if (!raw.sector && !raw.industry && !raw.peers?.length) {
        throw new Error('peers: 데이터 없음');
      }
      return raw;
  });
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
  'WFC','PYPL','UBER','ABNB','SHOP','SNAP','COIN','MSTR','INTC',
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

// NAVER 배치 API로 KR 종목 가격/PER/PBR 수집
async function fetchNaverMarket() {
  const results = {};
  // field_list 쿠키로 PER/PBR/배당 컬럼 활성화 (field_submit은 302 리다이렉트로 쿠키 손실)
  // 코스피(sosok=0) + 코스닥(sosok=1) 각 6페이지 → 최대 ~300개
  const naverHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Referer': 'https://finance.naver.com/',
    'Cookie': 'field_list=12|00000012'
  };
  const rowBlockRe = /href="\/item\/main\.naver\?code=([0-9]{6})"[^>]*class="tltle">([^<]+)<\/a>([\s\S]*?)(?=href="\/item\/main\.naver\?code=|<\/tbody>)/g;
  for (const sosok of ['0', '1']) {
    for (let page = 1; page <= 6; page++) {
      try {
        const r = await fetch(`https://finance.naver.com/sise/sise_market_sum.naver?sosok=${sosok}&pageNo=${page}`, { headers: naverHeaders });
        const buf = await r.arrayBuffer();
        const html = new TextDecoder('euc-kr').decode(buf);
        if (!html.includes('tltle')) break; // 마지막 페이지 이후
        rowBlockRe.lastIndex = 0;
        let m;
        while ((m = rowBlockRe.exec(html)) !== null) {
          const code = m[1], name = m[2].trim(), block = m[3];
          const priceM = block.match(/class="number">\s*([\d,]+)\s*</);
          const pctM = block.match(/(?:nv01|nv02)">\s*([\-\d.]+)%/);
          const numAll = [...block.matchAll(/class="number">\s*([\d.,\-]+)\s*</g)].map(x => parseFloat(x[1].replace(/,/g,''))||null);
          const price = priceM ? parseFloat(priceM[1].replace(/,/g,'')) : 0;
          const changePct = pctM ? parseFloat(pctM[1]) : 0;
          // NAVER 컬럼 순서: 가격, (등락금액), (등락%), [발행주식수], PER, PBR
          // → 마지막 2개가 PER, PBR (배당 컬럼은 쿠키에 미포함)
          const rawPer = numAll[numAll.length - 2];
          const rawPbr = numAll[numAll.length - 1];
          const per = (rawPer > 0 && rawPer < 500) ? rawPer : null;
          const pbr = (rawPbr > 0 && rawPbr < 100) ? rawPbr : null;
          if (price > 0) results[code] = { market: 'kr', name, price, changePct, per, pbr };
        }
      } catch {}
    }
  }

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
                    result[code] = {'market':'kr','price':round(p,0),'changePct':round((p-prev)/prev*100,2) if prev else 0}
            except: pass
    except: pass
print(json.dumps(result))
`;
      const krExtra = await _pyExecLong(krPy);
      for (const [code, item] of Object.entries(krExtra)) {
        item.name = _krNameMap.get(code) || code;
      }
      Object.assign(results, krExtra);
    } catch {}
  }
  return results;
}

let _isScreenerUpdating = false;
async function updateScreenerBackground() {
  if (_isScreenerUpdating) {
    console.log('  ⚠️ 이미 스크리너 백그라운드 갱신이 진행 중입니다.');
    return getC('screener');
  }
  _isScreenerUpdating = true;
  console.log('  🔄 스크리너 백그라운드 갱신 시작...');
  try {
    // KR: NAVER + 배치 polling으로 KR_UNIVERSE 전체 가격 수집
    const krResults = await fetchNaverMarket();

    // US: yfinance 주간 1y 배치 (interval='1wk' — 일간 대비 5배 적은 데이터 → 빠름)
    const usTickers = SP500.slice(0, 200); // 200개 제한 (속도)
    const usPy = `
import yfinance as yf, json, warnings, os
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'
tickers = ${JSON.stringify(usTickers)}
result = {}
try:
    # 청크별 다운로드 — 주간 데이터로 52주 고저가 추출 (일간 대비 5배 빠름)
    chunk_size = 50
    for i in range(0, len(tickers), chunk_size):
        chunk = tickers[i:i+chunk_size]
        try:
            import contextlib, io as _io
            with contextlib.redirect_stderr(_io.StringIO()):
                df = yf.download(chunk, period='1y', interval='1wk',
                                 auto_adjust=True, progress=False, group_by='ticker')
            for sym in chunk:
                try:
                    cols = df[sym] if len(chunk)>1 else df
                    cl = cols['Close'].dropna()
                    hi = cols['High'].dropna()
                    lo = cols['Low'].dropna()
                    p = float(cl.iloc[-1])
                    prev = float(cl.iloc[-2]) if len(cl) >= 2 else p
                    if p > 0:
                        result[sym] = {'market':'us','price':round(p,2),
                                       'changePct':round((p-prev)/prev*100,2) if prev else 0,
                                       'high52': round(float(hi.max()),2) if len(hi)>0 else None,
                                       'low52': round(float(lo.min()),2) if len(lo)>0 else None}
                except: pass
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
                'high52': fi.year_high,
                'low52': fi.year_low,
                'per': info.get('trailingPE'),
                'forwardPer': info.get('forwardPE'),
                'pbr': info.get('priceToBook'),
                'pegRatio': info.get('pegRatio'),
                'roe': round((info.get('returnOnEquity') or 0)*100,1) or None,
                'div': round((info.get('dividendYield') or 0)*100,2) or None,
                'revenueGrowth': round((info.get('revenueGrowth') or 0)*100,1) or None,
                'earningsGrowth': round((info.get('earningsGrowth') or 0)*100,1) or None,
                'operatingMargin': round((info.get('operatingMargins') or 0)*100,1) or None,
                'grossMargin': round((info.get('grossMargins') or 0)*100,1) or None,
                'debtToEquity': info.get('debtToEquity'),
                'currentRatio': info.get('currentRatio'),
                'freeCashflow': info.get('freeCashflow'),
                'targetPrice': info.get('targetMeanPrice'),
                'recommendation': info.get('recommendationKey'),
                'profitMargin': round((info.get('profitMargins') or 0)*100,1) or None,
                'name': info.get('shortName') or sym,
                'sector': info.get('sector',''),
            })
            result[sym] = r
        except: pass
except Exception: pass
print(json.dumps(result))
`;
    let usResults = {};
    try { usResults = await _pyExecLong(usPy); } catch(e) { console.warn("US 스크리너 실패, KR만 사용:", e.message?.slice(0,80)); }

    const result = { ...krResults, ...usResults };
    if (Object.keys(result).length > 0) {
      setC('screener', result, SIGNAL_CACHE_TTL);
      _saveScreenerCache(result);
      console.log(`  ✓ 스크리너 백그라운드 갱신 완료 (${Object.keys(result).length}개 종목)`);
      // 로드된 데이터로부터 _krNameMap 복원
      for (const [code, item] of Object.entries(result)) {
        if (item.market === 'kr' && item.name) {
          _krNameMap.set(code, item.name);
        }
      }
    }
    return result;
  } catch (e) {
    console.error('  ⚠ 스크리너 백그라운드 갱신 에러:', e.message);
    return getC('screener') || {};
  } finally {
    _isScreenerUpdating = false;
  }
}

app.get('/api/screener-data', async (_, res) => {
  try {
    let data = getC('screener');
    if (!data) {
      console.log('  ℹ 스크리너 캐시 미존재 — 즉시 동기 백그라운드 갱신 수행');
      data = await updateScreenerBackground();
    }
    res.json(data || {});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 매크로 대시보드 (지수 + 환율 + 금리 + 원자재 통합)
// ─────────────────────────────────────────────────────────────────────────────
// macro 캐시 정규화: /api/macro는 {value, change} 형식
// computeSignal/buildDeterministicAnalysis/buildAIPrompt는 {value, chg} 형식 기대
// → chg 필드를 항상 추가해 두 코드베이스 모두 호환
function normalizeMacro(m) {
  if (!m) return {};
  const out = {};
  for (const [k, v] of Object.entries(m)) {
    if (v && typeof v === 'object') {
      out[k] = { ...v };
      if (out[k].chg == null && out[k].change != null) out[k].chg = out[k].change;
      if (out[k].change == null && out[k].chg != null) out[k].change = out[k].chg;
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function fetchMacroData() {
  const result = {};
  const naverJobs = [
    ['.INX','sp500','index',false], ['.IXIC','nasdaq','index',false], ['.DJI','dow','index',false],
    ['.VIX','vix','index',true],
    ['GCcv1','gold','futures',false], ['CLcv1','oil','futures',false], ['SIcv1','silver','futures',false],
  ];
  await Promise.allSettled(naverJobs.map(async ([code, key, type, isDiff]) => {
    try {
      const q = type === 'index' ? await naverUsIndexFull(code) : await naverFutures(code);
      if (!q) return;
      result[key] = { value: q.price, change: Math.round((isDiff ? q.change : q.changePct) * 100) / 100 };
    } catch {}
  }));
  const stooqJobs = [
    ['usdkrw','usdkrw'], ['usdjpy','usdjpy'], ['eurusd','eurusd'], ['dx.f','dxy'], ['btcusd','btc'],
  ];
  await Promise.allSettled(stooqJobs.map(async ([sym, key]) => {
    try {
      const q = await stooqQuote(sym);
      result[key] = { value: q.price, change: Math.round(q.changePct * 100) / 100 };
    } catch {}
  }));
  const yahooJobs = [['^TNX','us10y'], ['^IRX','us3m'], ['^FVX','us5y']];
  await Promise.allSettled(yahooJobs.map(async ([sym, key]) => {
    try {
      const q = await yahooQuote(sym);
      result[key] = { value: q.price, change: Math.round(q.change * 100) / 100 };
    } catch {}
  }));
  return result;
}

const MACRO_CACHE_FILE = join(__dirname, '.macro-cache.json');
(function loadMacroCache() {
  try {
    if (existsSync(MACRO_CACHE_FILE)) {
      const c = JSON.parse(readFileSync(MACRO_CACHE_FILE, 'utf-8'));
      if (c.data && Date.now() - c.savedAt < 3600_000) {
        setC('macro', c.data, 300_000);
        console.log('  ✓ 매크로 캐시 로드 (디스크)');
      }
    }
  } catch {}
})();

app.get('/api/macro', async (_, res) => {
  const stale = getC('macro');
  if (stale) {
    res.json(stale);
    // 캐시가 만료됐으나 아직 남아있는 경우 백그라운드 갱신
    return;
  }
  // 캐시 없으면 stale 디스크 데이터라도 즉시 반환하고 백그라운드 갱신
  const diskStale = (() => { try { if (existsSync(MACRO_CACHE_FILE)) { const c = JSON.parse(readFileSync(MACRO_CACHE_FILE,'utf-8')); return c.data; } } catch {} return null; })();
  if (diskStale) {
    res.json(diskStale);
    // 백그라운드 갱신
    setImmediate(async () => {
      try {
        _c.delete('macro'); // 강제 갱신
        const d = await cached('macro', 300_000, fetchMacroData);
        writeFileSync(MACRO_CACHE_FILE, JSON.stringify({ savedAt: Date.now(), data: d }), 'utf-8');
      } catch {}
    });
    return;
  }
  try {
    const data = await cached('macro', 300_000, fetchMacroData);
    try { writeFileSync(MACRO_CACHE_FILE, JSON.stringify({ savedAt: Date.now(), data }), 'utf-8'); } catch {}
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 한국 업종 히트맵
app.get('/api/kr-sectors', async (_, res) => {
  try {
    const data = await cached('kr-sectors', 300_000, async () => {
      const pages = await Promise.all([1,2,3,4].map(p =>
        fetchJSON(`https://m.stock.naver.com/api/stocks/industry?market=KOSPI&page=${p}&pageSize=20`, { Referer:'https://m.stock.naver.com/' }).catch(() => ({ groups:[] }))
      ));
      const all = pages.flatMap(d => d.groups || []);
      return all.map(g => ({
        name: g.name,
        change: parseFloat(g.changeRate || 0),
        rise: g.riseCount || 0,
        fall: g.fallCount || 0,
        total: g.totalCount || 0,
      })).filter(g => g.total >= 3);
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// 섹터 ETF — 별도 엔드포인트 (홈 렌더 후 비동기 로드)
app.get('/api/sectors', async (_, res) => {
  try {
    const data = await cached('sectors', 600_000, async () => {
      const jobs = [
        ['xlk','tech'], ['xlf','finance'], ['xlv','health'],
        ['xle','energy'], ['xli','industrial'], ['xlc','comm'],
        ['xlb','materials'], ['xlre','realestate'], ['xlp','staples'],
        ['xly','discretionary'], ['xlu','utilities'],
      ];
      const result = {};
      await Promise.allSettled(jobs.map(async ([sym, key]) => {
        try {
          const q = await stooqQuote(sym);
          result[key] = { value: q.price, change: Math.round(q.changePct * 100) / 100 };
        } catch {}
      }));
      return result;
    });
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// 결정론적 시그널 사전 계산 (서버 시작 시 + 20분마다 백그라운드 갱신)
// 함수 기반이므로 AI 불필요 — 캐시에서 즉시 응답
// 시가총액 상위 700개 기업(NAVER 랭킹) 대상
// ─────────────────────────────────────────────────────────────────────────────

// 시가총액 상위 N개 종목 (NAVER 랭킹 기반) — 24h 캐시
async function fetchTopByMarketCap(limit = 700) {
  return cached(`topMcap:${limit}`, 86400_000, async () => {
    // USDKRW 환율 (KRW → USD 변환용)
    let fx = 1370;
    try {
      const q = await stooqQuote('usdkrw');
      if (q?.price && q.price > 800 && q.price < 2500) fx = q.price;
    } catch {}

    const candidates = [];

    // KR: KOSPI + KOSDAQ — 3개씩 배치로 요청 (20개 동시→rate limit 방지)
    const krPages = [];
    for (let p = 1; p <= 8; p++) krPages.push({ mkt: 'KOSPI', p });
    for (let p = 1; p <= 12; p++) krPages.push({ mkt: 'KOSDAQ', p });

    for (let i = 0; i < krPages.length; i += 3) {
      const batch = krPages.slice(i, i + 3);
      await Promise.allSettled(batch.map(async ({ mkt, p }) => {
        try {
          const d = await fetchJSON(`https://m.stock.naver.com/api/stocks/marketValue/${mkt}?page=${p}&pageSize=100`);
          for (const s of (d.stocks || [])) {
            const mcRaw = parseFloat(s.marketValueRaw || '0');
            if (!mcRaw || !s.itemCode) continue;
            _krNameMap.set(s.itemCode, s.stockName);
            candidates.push({ ticker: s.itemCode, market: 'kr', name: s.stockName, mcapUsd: mcRaw / fx });
          }
        } catch {}
      }));
      if (i + 3 < krPages.length) await new Promise(r => setTimeout(r, 200));
    }

    // US: NASDAQ 1000 + NYSE 1000
    const usJobs = [['NASDAQ', 10], ['NYSE', 10]];
    await Promise.allSettled(usJobs.map(async ([ex, pages]) => {
      for (let p = 1; p <= pages; p++) {
        try {
          const d = await fetchJSON(`https://api.stock.naver.com/stock/exchange/${ex}/marketValue?page=${p}&pageSize=100`);
          for (const s of (d.stocks || [])) {
            const mcK = parseFloat((s.marketValue || '0').replace(/,/g, ''));
            if (!mcK || !s.symbolCode) continue;
            // marketValue 는 천 USD 단위 → USD 로 환산
            const sym = s.symbolCode.replace(/\./g, '-');
            candidates.push({
              ticker: sym,
              market: 'us',
              name: s.stockNameEng || s.stockName,
              mcapUsd: mcK * 1000,
            });
          }
        } catch {}
      }
    }));

    candidates.sort((a, b) => b.mcapUsd - a.mcapUsd);
    const top = candidates.slice(0, limit);

    // NAVER API 완전 실패 시 폴백
    if (top.length < 10) {
      console.log('  ⚠ 시가총액 랭킹 불충분 — 폴백 목록 사용');
      return [
        ...['005930','000660','005380','000270','035420','035720','068270','105560','066570','012450',
            '086790','006400','096770','373220','207940','003670','034020','247540','003670','034020'].map(t => ({ ticker: t, market: 'kr', name: _krNameMap.get(t) || t, mcapUsd: 0 })),
        ...['NVDA','AAPL','MSFT','GOOGL','AMZN','META','TSLA','NFLX','AMD','AVGO',
            'QCOM','TSM','INTC','JPM','BRK-B','V','MA','LLY','UNH','PLTR','CRM','ORCL','XOM','WMT']
           .map(t => ({ ticker: t, market: 'us', name: t, mcapUsd: 0 })),
      ];
    }

    const krN = top.filter(t => t.market === 'kr').length;
    const usN = top.length - krN;
    console.log(`  ✓ 시가총액 상위 ${top.length}개 선별 (KR ${krN} / US ${usN})`);
    return top;
  });
}

// 종목별 시그널 결과 저장소 (ticker → {signal, score, confidence, breakdown, ...})
const _signalStore = new Map();
let _signalsUpdatedAt = 0;
let _signalsComputing = null; // 진행 중인 Promise (race 방지)
const SIGNAL_CACHE_FILE = join(__dirname, '.signal-cache.json');
const SCREENER_CACHE_FILE = join(__dirname, '.screener-cache.json');
const SIGNAL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간 (매일 00:00 KST 갱신)

// 글로벌 KR 종목명 맵
const _krNameMap = new Map();
const INITIAL_KR_NAMES = {
  '005930': '삼성전자', '000660': 'SK하이닉스', '373220': 'LG에너지솔루션', '207940': '삼성바이오로직스',
  '005380': '현대차', '000270': '기아', '005490': 'POSCO홀딩스', '035420': 'NAVER',
  '035720': '카카오', '068270': '셀트리온', '105560': 'KB금융', '055550': '신한지주',
  '086790': '하나금융지주', '066570': 'LG전자', '006400': '삼성SDI', '012450': '한화에어로스페이스',
  '018260': '삼성에스디에스', '259960': '크래프톤', '323410': '카카오뱅크', '033780': 'KT&G',
  '015760': '한국전력', '096770': 'SK이노베이션', '247540': '에코프로비엠', '003670': '포스코퓨처엠',
  '034020': '두산에너빌리티'
};
for (const [k, v] of Object.entries(INITIAL_KR_NAMES)) {
  _krNameMap.set(k, v);
}

function _saveSignalCache() {
  try {
    const data = { updatedAt: _signalsUpdatedAt, entries: [..._signalStore.entries()] };
    writeFileSync(SIGNAL_CACHE_FILE, JSON.stringify(data), 'utf-8');
  } catch(e) { console.log('  ⚠ 시그널 캐시 저장 실패:', e.message); }
}

function _saveScreenerCache(data) {
  try { writeFileSync(SCREENER_CACHE_FILE, JSON.stringify({ updatedAt: Date.now(), data }), 'utf-8'); }
  catch(e) { console.log('  ⚠ 스크리너 캐시 저장 실패:', e.message); }
}

function _loadScreenerCache() {
  try {
    if (!existsSync(SCREENER_CACHE_FILE)) return false;
    const c = JSON.parse(readFileSync(SCREENER_CACHE_FILE, 'utf-8'));
    if (!c.data) return false;
    // 디스크 캐시가 존재하면 우선 메모리에 항상 로드해 API 응답 즉시성 확보
    setC('screener', c.data, SIGNAL_CACHE_TTL);
    const age = Math.round((Date.now() - (c.updatedAt || 0)) / 60000);
    console.log(`  ✓ 스크리너 캐시 로드 (${Object.keys(c.data).length}개, ${age}분 전 계산)`);
    
    // 로드된 데이터로부터 _krNameMap 복원
    for (const [code, item] of Object.entries(c.data)) {
      if (item.market === 'kr' && item.name) {
        _krNameMap.set(code, item.name);
      }
    }
    return true;
  } catch(e) { console.log('  ⚠ 스크리너 캐시 로드 실패:', e.message); return false; }
}

function _loadSignalCache() {
  try {
    if (!existsSync(SIGNAL_CACHE_FILE)) return false;
    const data = JSON.parse(readFileSync(SIGNAL_CACHE_FILE, 'utf-8'));
    if (!data.entries?.length) return false;
    
    _signalStore.clear();
    for (const [k, v] of data.entries) {
      _signalStore.set(k, v);
      // 로드된 데이터로부터 _krNameMap 복원
      if (v.market === 'kr' && v.name) {
        _krNameMap.set(k, v.name);
      }
    }
    _signalsUpdatedAt = data.updatedAt || Date.now();
    const age = Math.round((Date.now() - _signalsUpdatedAt) / 60000);
    console.log(`  ✓ 시그널 캐시 로드 (${_signalStore.size}개, ${age}분 전 계산)`);
    return true;
  } catch(e) { console.log('  ⚠ 시그널 캐시 로드 실패:', e.message); return false; }
}

async function computeSignalForTicker(ticker, market, opts = {}) {
  const isKr = market === 'kr';
  const screener = getC('screener') || {};
  try {
    let q = screener[ticker];
    // opts.full=true (자정 사전계산): 실제 API로 완전한 데이터 수집
    if (opts.full) {
      if (!q || !q.price) {
        if (isKr) {
          const [base, fin] = await Promise.all([krQuote(ticker), krFinancials(ticker)]);
          q = { ...base, ...fin };
        } else {
          q = await usQuote(ticker);
        }
      } else if (isKr && !q.high52) {
        try {
          const fin = await krFinancials(ticker);
          q = { ...q, ...fin };
        } catch {}
      }
    }
    if (!q || !q.price) return null;

    // ── 기술지표: full 모드면 실제 계산, 아니면 캐시/프록시 ──────────
    let t = {};
    if (opts.full) {
      // 실제 yfinance 기술지표 계산 (개별 분석 페이지와 동일)
      try { t = await getTechnicals(ticker, isKr); } catch {}
    } else {
      t = getC(`tech:${ticker}:${market}`) || {};
    }
    // 기술지표 없으면 프록시로 보완
    if (!t.rsi && q.price && q.high52 && q.low52 && q.high52 > q.low52) {
      const pos = (q.price - q.low52) / (q.high52 - q.low52);
      const chg = q.changePct || 0;
      const chgClamped = Math.max(-10, Math.min(10, chg));
      t.rsi = Math.max(10, Math.min(90, pos * 65 + 17 + chgClamped * 1.2));
      t.bb_pct = pos * 100;
      const trend = (pos - 0.5) * 2 + chgClamped * 0.06;
      if (trend > 0.1)       { t.macd = 1;  t.macd_signal = 0; }
      else if (trend < -0.1) { t.macd = -1; t.macd_signal = 0; }
      if (pos > 0.55)       { t.ma20 = q.price * 0.98; t.ma50 = q.price * 0.95; }
      else if (pos < 0.45)  { t.ma20 = q.price * 1.02; t.ma50 = q.price * 1.05; }
    }

    // ── flow(수급): full 모드면 실제 API 호출 (개별 분석 페이지와 동일) ─
    let flow = {};
    if (opts.full) {
      try { flow = await getFlowData(ticker, isKr); } catch {}
    }

    // macro는 캐시에서 (상세 페이지와 동일)
    const macro = normalizeMacro(getC('macro'));
    const sig = computeSignal(t, q, flow, macro);
    const reason = sig.reasons.slice(0, 3).join(' · ') || '5대 전략 종합';
    return {
      ticker, id: ticker, market,
      name: q.name || ticker,
      price: q.price,
      changePct: q.changePct,
      per: q.per, pbr: q.pbr, roe: q.roe, div: q.div,
      signal: sig.signal,
      score: sig.score,
      confidence: sig.confidence,
      breakdown: sig.breakdown,
      reasons: sig.reasons,
      reason,
    };
  } catch { return null; }
}

async function precomputeAllSignals(opts = {}) {
  if (_signalsComputing) return _signalsComputing;
  const isFull = opts.full === true; // true = 자정 정밀분석, false = 빠른 screener-only
  _signalsComputing = (async () => {
    try {
      // 분석 캐시 초기화 (재계산 시 최신 신호 반영) — det:/ai-text:/rawdata: 모두 클리어
      for (const k of _c.keys()) {
        if (k.startsWith('ai:') || k.startsWith('ai-text:') || k.startsWith('det:') || k.startsWith('rawdata:')) _c.delete(k);
      }
      let universe = await fetchTopByMarketCap(1000);
      const krCount = universe.filter(u => u.market === 'kr').length;
      if (!universe.length) {
        console.log('  ⚠ 시가총액 랭킹 비어있음 — 시그널 계산 중단');
        return;
      }
      // KR 데이터가 너무 적으면 (rate limit 등) 캐시 무효화 후 재조회
      if (krCount < 200) {
        console.log(`  ⚠ KR 유니버스 너무 작음 (${krCount}개) — 재조회 중...`);
        _c.delete('topMcap:1000');
        await new Promise(r => setTimeout(r, 5000));
        universe = await fetchTopByMarketCap(1000);
        console.log(`  ✓ 재조회 결과: KR ${universe.filter(u=>u.market==='kr').length} / US ${universe.filter(u=>u.market==='us').length}`);
      }

      // full모드(자정)는 기술지표+flow 실제 API 호출 → 동시성 낮춰 서버 보호
      const CONCURRENCY = isFull ? 5 : 20;
      let idx = 0;
      let ok = 0;
      const newStore = new Map();

      async function worker() {
        while (idx < universe.length) {
          const i = idx++;
          const { ticker, market } = universe[i];
          try {
            const r = await computeSignalForTicker(ticker, market, { full: isFull });
            if (r) { newStore.set(r.ticker, r); ok++; }
          } catch {}
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

      // atomic swap
      _signalStore.clear();
      for (const [k, v] of newStore) _signalStore.set(k, v);

      _signalsUpdatedAt = Date.now();
      const counts = {};
      for (const r of _signalStore.values()) counts[r.signal] = (counts[r.signal]||0) + 1;
      const c = s => counts[s]||0;
      console.log(`  ✓ 시그널 사전 계산 완료 (${ok}/${universe.length}, 강력매수:${c('강력매수')} 매수:${c('매수')} 약매수:${c('약매수')} 중립:${c('중립')} 약매도:${c('약매도')} 매도:${c('매도')} 강력매도:${c('강력매도')})`);
      if (isFull) _saveSignalCache(); // 디스크에 저장 — full 계산 시에만 (워밍업이 덮어쓰지 않도록)
    } finally {
      _signalsComputing = null;
    }
  })();
  return _signalsComputing;
}

// 관리자 전용: 시그널 강제 재계산
app.get('/api/admin/recompute-signals', async (req, res) => {
  res.json({ ok: true, message: '시그널 재계산 시작 (백그라운드)' });
  precomputeAllSignals({ full: true }).catch(e => console.error('강제 재계산 실패:', e.message));
});

// 상위 N개 종목의 LLM 분석 사전 계산 (백그라운드)
// 캐시(`ai:${symbol}`)를 채워두어 사용자 첫 클릭이 즉시 응답되도록 함
let _llmPrecomputing = false;
async function precomputeTopAnalysis(N = 300) {
  if (_llmPrecomputing) return;
  _llmPrecomputing = true;
  try {
    // 시가총액 상위 N개 (signal store 우선, 없으면 universe fetch)
    let targets = [..._signalStore.values()].slice(0, N).map(s => ({ ticker: s.symbol, market: s.market }));
    if (targets.length < N) {
      const uni = await fetchTopByMarketCap(N).catch(() => []);
      targets = uni.slice(0, N);
    }
    console.log(`  🤖 상위 ${targets.length}개 상세 페이지 사전 계산 시작...`);
    let done = 0, skipped = 0, failed = 0;
    // AI(analysis/ai) 제외 — 사용자 클릭 시 자연스럽게 캐싱됨
    const endpoints = ['quote', 'flow', 'news', 'earnings', 'peers', 'chart', 'analysis'];
    for (const t of targets) {
      if (getC(`det:${t.ticker}`)) { skipped++; continue; }
      const reqs = endpoints.map(ep => {
        const qs = ep === 'chart' ? `range=1mo&` : '';
        const url = `http://localhost:${PORT}/api/${ep}?${qs}symbol=${t.ticker}&market=${t.market}`;
        return fetch(url, { signal: AbortSignal.timeout(60000) }).then(r => r.ok).catch(() => false);
      });
      try {
        const results = await Promise.all(reqs);
        if (results.every(Boolean)) done++; else failed++;
      } catch { failed++; }
      await new Promise(r => setTimeout(r, 500));
      if ((done + failed) % 10 === 0 && (done + failed) > 0)
        console.log(`  🤖 사전 계산 진행: ${done+failed}/${targets.length} (ok:${done} skip:${skipped} fail:${failed})`);
    }
    console.log(`  ✓ 상세 페이지 사전 계산 완료: ${done}/${targets.length} (skip:${skipped} fail:${failed})`);
  } finally {
    _llmPrecomputing = false;
  }
}

// 관리자 전용: LLM 분석 사전 계산 트리거
app.get('/api/admin/precompute-llm', async (req, res) => {
  const N = parseInt(req.query.n) || 100;
  res.json({ ok: true, message: `LLM 사전 계산 시작 (상위 ${N}개, 백그라운드)` });
  precomputeTopAnalysis(N).catch(e => console.error('LLM 사전 계산 실패:', e.message));
});

// 매수/매도 신호: mode(buy|sell) + market(kr/us/all) + signal 필터 + limit=100
// 매일 00:00 KST에 사전 계산된 _signalStore 에서 즉시 반환 (재계산 없음)
app.get('/api/buy-signals', (req, res) => {
  // 있는 데이터 즉시 반환 — 절대 블로킹 안 함 (계산은 자정 자동 실행)
  const market = req.query.market || 'all'; // kr | us | all
  const mode = req.query.mode || 'buy';     // buy | sell
  const SIGNALS = mode === 'sell'
    ? ['약매도', '매도', '강력매도']
    : ['강력매수', '매수', '약매수'];
  const allSignals = [..._signalStore.values()].filter(r => SIGNALS.includes(r.signal));
  const all = allSignals
    .filter(r => market === 'all' || r.market === market)
    .sort((a, b) => mode === 'sell' ? a.score - b.score : b.score - a.score);

  // counts: 선택된 마켓 기준으로 계산
  const counts = {};
  for (const r of all) counts[r.signal] = (counts[r.signal] || 0) + 1;
  counts.kr = allSignals.filter(r => r.market === 'kr').length;
  counts.us = allSignals.filter(r => r.market === 'us').length;
  counts.all = allSignals.length;

  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
  // 각 신호 카테고리별 상위 100개씩 반환 (모든 탭에 데이터)
  const bySignal = {};
  for (const sig of SIGNALS) {
    bySignal[sig] = all.filter(r => r.signal === sig).slice(0, 100);
  }
  const buys = SIGNALS.flatMap(s => bySignal[s]);
  res.json({ buys, total: all.length, counts, updatedAt: _signalsUpdatedAt });
});

// 단일 종목 시그널 즉시 조회 (분석 페이지에서 AI 호출 전 빠르게 표시용)
app.get('/api/signal/:ticker', (req, res) => {
  const r = _signalStore.get(req.params.ticker);
  if (!r) return res.status(404).json({ error: '시그널 미계산' });
  res.json(r);
});

// 전체 종목 시그널 (대시보드용)
app.get('/api/all-signals', (req, res) => {
  const all = [..._signalStore.values()].sort((a, b) => b.score - a.score);
  res.json({ all, total: all.length, updatedAt: _signalsUpdatedAt });
});

// 서버 시작 전 시그널 캐시 즉시 로드 (API 첫 요청부터 바로 응답)
_loadScreenerCache();
_loadSignalCache();

app.listen(PORT, () => {
  console.log(`\n  ✓ StockLens  →  http://localhost:${PORT}\n`);
  // 서버 시작 후 주요 종목 캐시 워밍업 (백그라운드)
  warmupCache();
});

async function warmupCache() {
  // 1. 지수 + macro 먼저 (NAVER + Stooq, 빠름)
  setTimeout(async () => {
    try {
      await cached('indices', 60_000, () => Promise.all([
        krIndex('KOSPI','KOSPI'), krIndex('KOSDAQ','KOSDAQ'),
        yfIndex('^GSPC','S&P 500'), yfIndex('^IXIC','NASDAQ'), yfIndex('^DJI','DOW'),
      ]));
      // /api/macro 자체를 호출해 미리 캐시
      try { await fetch(`http://localhost:${PORT}/api/macro`); } catch {}
    } catch {}
  }, 1000);

  // 2. US 주요 종목 사이드바 일괄 (NAVER 병렬, name 포함)
  setTimeout(async () => {
    const usTop = ['NVDA','AAPL','MSFT','GOOGL','AMZN','META','TSLA','NFLX','AMD','AVGO','QCOM','TSM','INTC','JPM','BRK-B','V','MA','LLY','UNH','PLTR','CRM','ORCL','XOM','WMT'];
    let ok = 0;
    await Promise.allSettled(usTop.map(async sym => {
      try {
        const q = await naverUsQuote(sym);
        if (q?.price) { setC(`sb:${sym}`, { price: q.price, changePct: q.changePct, name: q.name, market: 'us' }, 300_000); ok++; }
      } catch {}
    }));
    console.log(`  ✓ US 사이드바 워밍업 완료 (${ok}개)`);
  }, 3000);

  // 3. KR 주요 종목 사이드바 병렬 (name 포함)
  setTimeout(async () => {
    const krTop = ['005930','000660','005380','000270','035420','035720','068270','105560','066570','012450'];
    await Promise.allSettled(krTop.map(async ticker => {
      try {
        const d = await fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/stock/${ticker}`,{Referer:'https://finance.naver.com/'});
        const rt = d.datas?.[0] ?? {};
        const data = { price: pKr(rt.closePrice), changePct: parseFloat(rt.fluctuationsRatioRaw ?? '0'), name: rt.stockName, market: 'kr' };
        if (data.price) setC(`sb:${ticker}`, data, 300_000);
      } catch {}
    }));
    console.log(`  ✓ KR 사이드바 워밍업 완료`);
  }, 5000);

  // 4. 스크리너 워밍업 후 즉시 시그널 사전 계산
  setTimeout(async () => {
    try {
      // 백그라운드 갱신을 비동기로 시작하되 완료 후 시그널 계산
      updateScreenerBackground().then(async () => {
        console.log('  ✓ 스크리너 워밍업 완료');
        // 5. 시그널 캐시 없으면 screener 데이터로 빠르게 계산 (15초, API 호출 없음)
        if (_signalStore.size === 0) {
          try { await precomputeAllSignals({ full: false }); } catch(e) { console.log('  ⚠ 시그널 계산 실패:', e.message); }
        }
        // 6. 상위 300개 LLM 분석 사전 계산 (백그라운드, ~25분) — 첫 클릭 즉시 응답 보장
        setTimeout(() => {
          precomputeTopAnalysis(300).catch(e => console.log('  ⚠ LLM 사전 계산 실패:', e.message));
        }, 30_000); // 30초 후 시작 (다른 워밍업 작업과 분리)
      });
    } catch(e) { console.log('  ⚠ 스크리너 워밍업 실패:', e.message); }

    // 6. 매일 06:00 KST(=UTC 21:00 전날), 18:00 KST(=UTC 09:00) 하루 2회 재계산
    const runSignalUpdate = async (label) => {
      console.log(`  ⏰ ${label} KST — 스크리너 + 시그널 정밀 분석 시작`);
      try { await updateScreenerBackground(); console.log('  ✓ 스크리너 갱신 완료'); }
      catch(e) { console.log('  ⚠ 스크리너 갱신 실패:', e.message); }
      try { await precomputeAllSignals({ full: true }); }
      catch(e) { console.log('  ⚠ 시그널 갱신 실패:', e.message); }
      // 시그널 갱신 시 ai: 캐시도 무효화됨 → 상위 300개 LLM 재계산
      setTimeout(() => {
        precomputeTopAnalysis(300).catch(e => console.log('  ⚠ LLM 사전 계산 실패:', e.message));
      }, 60_000);
    };
    const scheduleNext = () => {
      const now = new Date();
      // UTC 기준 다음 실행 시각 후보: 09:00(=18:00 KST), 21:00(=06:00 KST)
      const candidates = [9, 21].map(h => {
        const d = new Date(now);
        d.setUTCHours(h, 0, 0, 0);
        if (d <= now) d.setUTCDate(d.getUTCDate() + 1);
        return d;
      });
      const next = candidates.reduce((a, b) => a < b ? a : b);
      const label = next.getUTCHours() === 9 ? '18:00' : '06:00';
      const ms = next - now;
      console.log(`  ✓ 다음 시그널 계산 예약: ${next.toISOString()} (${(ms/3600000).toFixed(1)}시간 후, ${label} KST)`);
      setTimeout(async () => {
        await runSignalUpdate(label);
        scheduleNext();
      }, ms);
    };
    scheduleNext();
  }, 8000);
}
