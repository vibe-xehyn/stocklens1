
async function fetchJSON(url, headers = {}) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const NAVER_REF = { Referer: 'https://m.stock.naver.com/' };

async function test() {
  const d1 = await fetchJSON('https://api.stock.naver.com/marketindex/exchange/FX_USDKRW', NAVER_REF);
  const d2 = await fetchJSON('https://api.stock.naver.com/marketindex/exchange/FX_JPYKRW', NAVER_REF);
  const d3 = await fetchJSON('https://api.stock.naver.com/marketindex/exchange/FX_EURKRW', NAVER_REF);
  const d4 = await fetchJSON('https://polling.finance.naver.com/api/realtime/worldstock/index/.DXY', NAVER_REF);

  const usdkrw = parseFloat(d1.exchangeInfo.closePrice.replace(/,/g, ''));
  const jpykrw = parseFloat(d2.exchangeInfo.closePrice.replace(/,/g, ''));
  const eurkrw = parseFloat(d3.exchangeInfo.closePrice.replace(/,/g, ''));
  
  const usdjpy = (usdkrw / jpykrw) * 100;
  const eurusd = eurkrw / usdkrw;
  
  const dxyInfo = d4.datas?.[0];
  const dxy = parseFloat(dxyInfo.closePrice.replace(/,/g, ''));

  console.log("USD/KRW:", usdkrw);
  console.log("JPY/KRW:", jpykrw);
  console.log("EUR/KRW:", eurkrw);
  console.log("USD/JPY (calculated):", usdjpy);
  console.log("EUR/USD (calculated):", eurusd);
  console.log("DXY:", dxy);
}

test().catch(console.error);
