import re

with open("server.js", "r", encoding="utf-8") as f:
    server_code = f.read()

# 1. Update yahooChart to return full ISO string
server_code = server_code.replace(
    "date: new Date(t*1000).toISOString().slice(0,10),",
    "date: new Date(t*1000).toISOString(),"
)

# 2. Update /api/chart to map range to interval
old_api_chart = """app.get('/api/chart', async (req, res) => {
  const { symbol, range='1mo', market } = req.query;
  if (!symbol || symbol === 'UNDEFINED' || symbol === 'undefined' || symbol === 'null') return res.status(400).json({ error: 'symbol required' });
  await serveSWR(res, `c:${symbol}:${range}`, 300_000, () => fetchChartData(symbol, range, market));
});"""

new_api_chart = """app.get('/api/chart', async (req, res) => {
  const { symbol, range='1y', market } = req.query;
  if (!symbol || symbol === 'UNDEFINED' || symbol === 'undefined' || symbol === 'null') return res.status(400).json({ error: 'symbol required' });
  
  let interval = '1d';
  if (range === '1d') interval = '5m';
  else if (range === '5y') interval = '1mo';
  else if (range === 'max') interval = '3mo';
  
  await serveSWR(res, `c:${symbol}:${range}`, 300_000, () => fetchChartData(symbol, range, interval, market));
});"""
server_code = server_code.replace(old_api_chart, new_api_chart)

# 3. Update fetchChartData signature
server_code = server_code.replace(
    "async function fetchChartData(symbol, range, market) {",
    "async function fetchChartData(symbol, range, interval, market) {"
)
server_code = server_code.replace(
    "const raw = market==='kr' ? await krChart(symbol,range) : await usChart(symbol,range);",
    "const raw = market==='kr' ? await krChart(symbol,range,interval) : await usChart(symbol,range,interval);"
)

# 4. Fix date formatting in fetchChartData labels
old_fmt = """  const longRange = ['6mo','1y'].includes(range);
  const fmtOpts = longRange
    ? { year:'2-digit', month:'short', day:'numeric' }
    : { month:'short', day:'numeric' };"""

new_fmt = """  let fmtOpts = { month:'short', day:'numeric' };
  if (range === '1d') fmtOpts = { hour: '2-digit', minute: '2-digit' };
  else if (['5y', 'max'].includes(range)) fmtOpts = { year:'numeric', month:'short' };
  else if (range === '1y') fmtOpts = { year:'2-digit', month:'short', day:'numeric' };"""
server_code = server_code.replace(old_fmt, new_fmt)

# 5. Rewrite usChart and krChart to just use yahooChart
old_usChart = re.search(r"async function usChart\(ticker, range\).*?\n\}", server_code, re.DOTALL).group(0)
new_usChart = """async function usChart(ticker, range, interval) {
  const { rows } = await yahooChart(ticker, range, interval);
  return rows.map(r => ({
    date:   r.date,
    close:  Math.round(r.close  * 100) / 100,
    open:   Math.round((r.open  ?? r.close) * 100) / 100,
    high:   Math.round((r.high  ?? r.close) * 100) / 100,
    low:    Math.round((r.low   ?? r.close) * 100) / 100,
    volume: r.volume ?? 0,
  }));
}"""
server_code = server_code.replace(old_usChart, new_usChart)

old_krChart = re.search(r"async function krChart\(ticker, range\).*?\n\}", server_code, re.DOTALL).group(0)
new_krChart = """async function krChart(ticker, range, interval) {
  const { rows } = await yahooChart(ticker + '.KS', range, interval);
  return rows.map(r => ({
    date:   r.date,
    close:  Math.round(r.close  * 100) / 100,
    open:   Math.round((r.open  ?? r.close) * 100) / 100,
    high:   Math.round((r.high  ?? r.close) * 100) / 100,
    low:    Math.round((r.low   ?? r.close) * 100) / 100,
    volume: r.volume ?? 0,
  }));
}"""
server_code = server_code.replace(old_krChart, new_krChart)

with open("server.js", "w", encoding="utf-8") as f:
    f.write(server_code)

print("server.js updated")

with open("public/index.html", "r", encoding="utf-8") as f:
    html_code = f.read()

# 1. Chart sizing and watermark
html_code = html_code.replace("height: 220,", "height: 450,")
html_code = html_code.replace("layout: { background: { color: 'transparent' }, textColor: '#86868B', fontSize: 11 },", "layout: { background: { color: 'transparent' }, textColor: '#86868B', fontSize: 11, attributionLogo: false },")

# 2. Update ranges
html_code = html_code.replace("['1wk','1mo','3mo','6mo','1y'].map", "['1d','1y','5y','max'].map")
html_code = html_code.replace("function rangeLabel(r) { return { '1wk':'1W','1mo':'1M','3mo':'3M','6mo':'6M','1y':'1Y' }[r]||r; }", "function rangeLabel(r) { return { '1d':'분봉','1y':'일봉','5y':'월봉','max':'연봉' }[r]||r; }")

# Update renderStockDetails ranges too
html_code = html_code.replace("let range = '1mo';", "let range = '1y';")
html_code = html_code.replace("let currentRange = '1mo';", "let currentRange = '1y';")

with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(html_code)

print("public/index.html updated")
