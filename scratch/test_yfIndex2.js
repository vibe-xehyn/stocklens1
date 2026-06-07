(async () => {
  const s = require('./server.js');
  try {
    const res = await s.yfIndex('KRW=X', 'USD/KRW');
    console.log("yfIndex returned:", res);
  } catch(e) { console.error(e); }
})();
