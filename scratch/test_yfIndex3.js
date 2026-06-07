import { yfIndex } from './server.js';
(async () => {
  try {
    const res = await yfIndex('KRW=X', 'USD/KRW');
    console.log("yfIndex returned:", res);
  } catch(e) { console.error(e); }
})();
