const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchJSON(url, h={}) {
  const r = await fetch(url, { headers:{'User-Agent':UA,Accept:'application/json',...h}, signal:AbortSignal.timeout(9000) });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function test() {
  const ticker = '005930';
  const nv={Referer:'https://m.stock.naver.com/'}, pv={Referer:'https://finance.naver.com/'};
  console.log('Testing basic...');
  try {
    const basic = await fetchJSON(`https://m.stock.naver.com/api/stock/${ticker}/basic`, nv);
    console.log('Basic success. closePrice:', basic.closePrice);
  } catch (e) {
    console.error('Basic failed:', e.message);
  }

  console.log('Testing realtime...');
  try {
    const rtRes = await fetchJSON(`https://polling.finance.naver.com/api/realtime/domestic/stock/${ticker}`, pv);
    console.log('Realtime success. closePrice:', rtRes.datas?.[0]?.closePrice);
  } catch (e) {
    console.error('Realtime failed:', e.message);
  }
}

test();
