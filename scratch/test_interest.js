async function run() {
  const codes = ['KR10YT=RR', 'KR3YT=RR'];
  for (const code of codes) {
    const url = `https://api.stock.naver.com/marketindex/bond/${encodeURIComponent(code)}`;
    try {
      const res = await fetch(url, { headers: { Referer: 'https://m.stock.naver.com/' } });
      const data = await res.json();
      console.log(code, "->", JSON.stringify(data, null, 2));
    } catch (e) {
      console.log(code, "failed:", e.message);
    }
  }
}
run();
