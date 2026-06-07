const fetch = require('node-fetch');
async function test() {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?range=1d&interval=1d`;
  const r = await fetch(url);
  const j = await r.json();
  console.log(JSON.stringify(j?.chart?.result?.[0]?.meta, null, 2));
}
test();
