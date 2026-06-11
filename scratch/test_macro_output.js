const NAVER_REF = { Referer: 'https://m.stock.naver.com/' };

async function fetchJSON(url) {
  const r = await fetch(url, { headers: NAVER_REF });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function test() {
  const result = {};

  const naverBondJobs = [
    ['KR10YT=RR', 'kr10y'],
    ['KR3YT=RR', 'kr3y'],
  ];
  await Promise.allSettled(naverBondJobs.map(async ([code, key]) => {
    try {
      const d = await fetchJSON(`https://api.stock.naver.com/marketindex/bond/${code}`);
      if (d && d.closePrice) {
        const price = parseFloat(d.closePrice);
        const change = parseFloat(d.fluctuations) * (d.fluctuationsType.name === 'FALLING' ? -1 : 1);
        result[key] = { value: price, change: Math.round(change * 100) / 100 };
      }
    } catch (err) {
      console.error(`[fetchMacroData] Naver bond fetch failed for ${code}:`, err.message);
    }
  }));

  // US yields for mock calculation
  result.us10y = { value: 4.53, change: -0.01 };
  result.us3m = { value: 5.25, change: 0.01 };

  // 5. 미국 장단기 금리차 (10Y - 3M Spread) 계산 및 가공
  if (result.us10y && result.us3m) {
    const spread = result.us10y.value - result.us3m.value;
    const spreadChange = (result.us10y.change || 0) - (result.us3m.change || 0);
    result['us10y3m'] = { value: parseFloat(spread.toFixed(3)), change: parseFloat(spreadChange.toFixed(3)) };
  }

  // 6. 한국 장단기 금리차 (10Y - 3Y Spread) 계산 및 가공
  if (result.kr10y && result.kr3y) {
    const spread = result.kr10y.value - result.kr3y.value;
    const spreadChange = (result.kr10y.change || 0) - (result.kr3y.change || 0);
    result['kr10y3y'] = { value: parseFloat(spread.toFixed(3)), change: parseFloat(spreadChange.toFixed(3)) };
  }

  console.log("Mock fetchMacroData Output:", JSON.stringify(result, null, 2));
}

test();
