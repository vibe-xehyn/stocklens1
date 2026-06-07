import re

with open("server.js", "r", encoding="utf-8") as f:
    code = f.read()

# Fix /api/rates
old_rates_func = """      // Stooq primary (Yahoo 차단됨)
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
      return rates;"""

new_rates_func = """      // Yahoo Primary
      const yPairs = [['KRW=X','usdkrw'], ['JPY=X','usdjpy'], ['EURUSD=X','eurusd'], ['DX-Y.NYB','dxy']];
      const rates = {};
      await Promise.allSettled(yPairs.map(async ([sym, key]) => {
        try {
          const q = await yahooQuote(sym);
          rates[key] = { value: q.price, change: Math.round(q.changePct * 100) / 100 };
        } catch {}
      }));
      return rates;"""

code = code.replace(old_rates_func, new_rates_func)

# Fix fetchMacroData
old_macro_stooq = """  const stooqJobs = [
    ['usdkrw','usdkrw'], ['usdjpy','usdjpy'], ['eurusd','eurusd'], ['dx.f','dxy'], ['btcusd','btc'],
  ];
  await Promise.allSettled(stooqJobs.map(async ([sym, key]) => {
    try {
      const q = await stooqQuote(sym);
      result[key] = { value: q.price, change: Math.round(q.changePct * 100) / 100 };
    } catch {}
  }));"""

new_macro_stooq = """  const forexJobs = [
    ['KRW=X','usdkrw'], ['JPY=X','usdjpy'], ['EURUSD=X','eurusd'], ['DX-Y.NYB','dxy'], ['BTC-USD','btc'],
  ];
  await Promise.allSettled(forexJobs.map(async ([sym, key]) => {
    try {
      const q = await yahooQuote(sym);
      result[key] = { value: q.price, change: Math.round(q.changePct * 100) / 100 };
    } catch {}
  }));"""

code = code.replace(old_macro_stooq, new_macro_stooq)

with open("server.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Replaced!")
