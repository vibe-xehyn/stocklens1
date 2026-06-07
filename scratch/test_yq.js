import { yahooChart } from './server.js';
(async () => {
  try {
    const { meta, rows } = await yahooChart('KRW=X', '5d', '1d');
    const last = rows[rows.length - 1];
    const prev = rows.length >= 2 ? rows[rows.length - 2] : last;
    const price = meta.regularMarketPrice ?? last?.close;
    console.log("price:", price);
  } catch(e) {
    console.error("error:", e.message);
  }
})();
