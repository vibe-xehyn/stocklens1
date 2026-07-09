import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTFOLIOS_FILE = join(__dirname, 'data', 'portfolios.json');
const ORDERS_FILE = join(__dirname, 'data', 'orders.json');
const HISTORY_FILE = join(__dirname, 'data', 'history.json');
const SCREENER_CACHE_FILE = join(__dirname, '.screener-cache.json');

// File locking/queueing system to prevent race conditions on 1GB RAM budget
const fileQueues = new Map();

function enqueue(filePath, operation) {
  if (!fileQueues.has(filePath)) {
    fileQueues.set(filePath, Promise.resolve());
  }
  const promise = fileQueues.get(filePath).then(async () => {
    try {
      return await operation();
    } catch (e) {
      console.error(`[LOCK ENGINE] Error in file queue operations for ${filePath}:`, e);
      throw e;
    }
  });
  fileQueues.set(filePath, promise.catch(() => {}));
  return promise;
}

async function readJSONSafe(filePath, defaultValue = {}) {
  return enqueue(filePath, async () => {
    try {
      if (!existsSync(filePath)) {
        writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
        return defaultValue;
      }
      const data = readFileSync(filePath, 'utf-8');
      return JSON.parse(data || JSON.stringify(defaultValue));
    } catch (e) {
      console.error(`[LOCK ENGINE] Error reading JSON from ${filePath}:`, e);
      return defaultValue;
    }
  });
}

async function writeJSONSafe(filePath, data) {
  return enqueue(filePath, async () => {
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error(`[LOCK ENGINE] Error writing JSON to ${filePath}:`, e);
      throw e;
    }
  });
}

// ── PRICING MATH ENGINES ─────────────────────────────────────────────────────

// Normal Cumulative Distribution Function (CDF) Hastings approximation
function stdNormalCDF(x) {
  const b1 =  0.319381530;
  const b2 = -0.356563782;
  const b3 =  1.781477937;
  const b4 = -1.821255978;
  const b5 =  1.330274429;
  const p  =  0.2316419;
  const c  =  0.39894228;

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return (1.0 - c * Math.exp(-x * x / 2.0) * t *
           (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
  } else {
    const t = 1.0 / (1.0 - p * x);
    return (c * Math.exp(-x * x / 2.0) * t *
           (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
  }
}

// Black-Scholes Options Pricing Model
function calculateOptionPrice(S, K, T, r, sigma, type) {
  if (T <= 0) {
    if (type === 'call') return Math.max(0, S - K);
    return Math.max(0, K - S);
  }
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2.0) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  if (type === 'call') {
    return S * stdNormalCDF(d1) - K * Math.exp(-r * T) * stdNormalCDF(d2);
  } else {
    return K * Math.exp(-r * T) * stdNormalCDF(-d2) - S * stdNormalCDF(-d1);
  }
}

// Bond Pricing Model (PV of coupons + PV of maturity par value)
function calculateBondPrice(faceValue, couponRate, yearsToMaturity, ytm, frequency = 2) {
  if (yearsToMaturity <= 0) return faceValue;
  const periods = Math.ceil(yearsToMaturity * frequency);
  const couponPayment = (faceValue * couponRate) / frequency;
  const ratePerPeriod = ytm / frequency;
  
  let price = 0;
  for (let t = 1; t <= periods; t++) {
    price += couponPayment / Math.pow(1 + ratePerPeriod, t);
  }
  price += faceValue / Math.pow(1 + ratePerPeriod, periods);
  return price;
}

// ── ASSET EVALUATION WRAPPERS ────────────────────────────────────────────────

// Helper: Get stock price from cache
function getAssetPrice(ticker, market, type) {
  if (type === 'stock') {
    try {
      if (existsSync(SCREENER_CACHE_FILE)) {
        const c = JSON.parse(readFileSync(SCREENER_CACHE_FILE, 'utf-8'));
        if (c && c.data && c.data[ticker]) {
          return c.data[ticker].price || 0;
        }
      }
    } catch (e) {
      console.error('[PRICING ENGINE] Screener cache parse error:', e);
    }
    return market === 'kr' ? 70000 : 150; // default fallbacks
  } else if (type === 'bond') {
    return 1000.0; // par fallback
  } else if (type === 'option') {
    return 5.0; // premium fallback
  }
  return 0;
}

function getOptionPrice(ticker, market, optionDetails) {
  if (!optionDetails || !optionDetails.strike || !optionDetails.expiry || !optionDetails.optionType) {
    return 5.0;
  }
  const S = getAssetPrice(ticker, market, 'stock');
  const K = parseFloat(optionDetails.strike);
  const expiryDate = new Date(optionDetails.expiry);
  const now = new Date();
  const T = (expiryDate - now) / (365 * 24 * 3600 * 1000); // expiry duration in years
  
  const r = 0.035; // 3.5% yield
  const sigma = 0.30; // 30% volatility
  const type = optionDetails.optionType;
  
  const price = calculateOptionPrice(S, K, T, r, sigma, type);
  return parseFloat(price.toFixed(2));
}

function getBondPrice(ticker, market, bondDetails) {
  if (!bondDetails || !bondDetails.maturityDate || !bondDetails.couponRate) {
    return 1000.0;
  }
  const faceValue = 1000.0;
  const couponRate = parseFloat(bondDetails.couponRate);
  const maturityDate = new Date(bondDetails.maturityDate);
  const now = new Date();
  const yearsToMaturity = (maturityDate - now) / (365 * 24 * 3600 * 1000);
  
  const ytm = 0.045; // 4.5% yield
  const frequency = bondDetails.couponFrequency ? parseInt(bondDetails.couponFrequency, 10) : 2;
  
  const price = calculateBondPrice(faceValue, couponRate, yearsToMaturity, ytm, frequency);
  return parseFloat(price.toFixed(2));
}

// ── ORDER BOOK SIMULATOR ─────────────────────────────────────────────────────

function generateOrderBook(ticker, market, type, optionDetails, bondDetails) {
  let refPrice = 0;
  if (type === 'stock') {
    refPrice = getAssetPrice(ticker, market, 'stock');
  } else if (type === 'option') {
    refPrice = getOptionPrice(ticker, market, optionDetails);
  } else if (type === 'bond') {
    refPrice = getBondPrice(ticker, market, bondDetails);
  }

  if (refPrice <= 0) return null;

  // Compute bid/ask spreads based on asset volatility profile
  let spreadPct = 0.0005; // 0.05% default
  if (type === 'stock' && market === 'us') spreadPct = 0.001; // 0.1%
  if (type === 'option') spreadPct = 0.01; // 1%
  
  const spread = refPrice * spreadPct;

  const asks = [];
  const bids = [];

  for (let i = 1; i <= 5; i++) {
    const askPrice = refPrice + (spread * i);
    const bidPrice = refPrice - (spread * i);

    const askVol = Math.floor(Math.random() * 4500) + 500;
    const bidVol = Math.floor(Math.random() * 4500) + 500;

    asks.push({ price: parseFloat(askPrice.toFixed(2)), volume: askVol });
    bids.push({ price: parseFloat(bidPrice.toFixed(2)), volume: bidVol });
  }

  return {
    ticker,
    type,
    price: refPrice,
    asks: asks.reverse(), // Highest ask price at top of asks list
    bids: bids            // Highest bid price at top of bids list
  };
}

// ── TIMEZONE OPERATIONAL CHECKS ─────────────────────────────────────────────

function getLocalTime(timezone) {
  const date = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short'
  });
  
  const weekday = dayFormatter.format(date);
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  
  return {
    weekday,
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10)
  };
}

function isMarketOpen(market) {
  try {
    if (market === 'kr') {
      const time = getLocalTime('Asia/Seoul');
      if (time.weekday === 'Sat' || time.weekday === 'Sun') return false;
      const minutes = time.hour * 60 + time.minute;
      return minutes >= 9 * 60 && minutes <= 15 * 60 + 30; // 09:00 - 15:30
    } else if (market === 'us') {
      const time = getLocalTime('America/New_York');
      if (time.weekday === 'Sat' || time.weekday === 'Sun') return false;
      const minutes = time.hour * 60 + time.minute;
      return minutes >= 9 * 60 + 30 && minutes <= 16 * 60; // 09:30 - 16:00
    }
  } catch (e) {
    console.error('[MARKET STATE ENGINE] Error in isMarketOpen evaluation:', e);
  }
  return false;
}

// ── BACKGROUND ORDER MATCHER ─────────────────────────────────────────────────

function startOrderMatcher() {
  console.log('[SECURITY ENGINE] Starting simulated order matching loop (5s interval)');
  setInterval(async () => {
    try {
      const orders = await readJSONSafe(ORDERS_FILE, {});
      const pendingOrders = Object.values(orders).filter(o => o.status === 'pending');
      if (pendingOrders.length === 0) return;
      
      let portfolios = null;
      let history = null;
      let updated = false;
      
      for (const order of pendingOrders) {
        if (order.mode === 'realtime' && !isMarketOpen(order.market)) {
          continue; // market is closed, skip matching
        }
        
        // Get price for the asset
        let currentPrice = 0;
        if (order.type === 'stock') {
          currentPrice = getAssetPrice(order.ticker, order.market, 'stock');
        } else if (order.type === 'option') {
          currentPrice = getOptionPrice(order.ticker, order.market, order.optionDetails);
        } else if (order.type === 'bond') {
          currentPrice = getBondPrice(order.ticker, order.market, order.bondDetails);
        }
        
        if (currentPrice <= 0) continue;
        
        let isMatched = false;
        if (order.side === 'buy') {
          if (currentPrice <= order.price) isMatched = true;
        } else {
          if (currentPrice >= order.price) isMatched = true;
        }
        
        if (isMatched) {
          if (!portfolios) portfolios = await readJSONSafe(PORTFOLIOS_FILE, {});
          if (!history) history = await readJSONSafe(HISTORY_FILE, {});
          
          const userId = order.userId;
          if (!portfolios[userId]) {
            portfolios[userId] = { cash: 10000000, investedPrincipal: 0, holdings: [] };
          }
          const userPort = portfolios[userId];
          const transactionValue = order.price * order.quantity;
          const commissionRate = 0.00015;
          const fee = transactionValue * commissionRate;
          
          if (order.side === 'buy') {
            const assetId = `${order.ticker}_${order.market}`;
            let holding = userPort.holdings.find(h => h.assetId === assetId);
            if (!holding) {
              holding = {
                assetId,
                ticker: order.ticker,
                market: order.market,
                type: order.type,
                avgPrice: order.price,
                quantity: order.quantity,
                optionDetails: order.optionDetails,
                bondDetails: order.bondDetails
              };
              userPort.holdings.push(holding);
            } else {
              const totalQty = holding.quantity + order.quantity;
              holding.avgPrice = ((holding.quantity * holding.avgPrice) + (order.quantity * order.price)) / totalQty;
              holding.quantity = totalQty;
            }
            userPort.investedPrincipal = (userPort.investedPrincipal || 0) + transactionValue;
          } else {
            userPort.cash += (transactionValue - fee);
            userPort.investedPrincipal = Math.max(0, (userPort.investedPrincipal || 0) - transactionValue);
          }
          
          order.status = 'filled';
          order.filledQuantity = order.quantity;
          
          if (!history[userId]) history[userId] = [];
          history[userId].push({
            historyId: `hist_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            type: 'trade',
            ticker: order.ticker,
            side: order.side,
            price: order.price,
            quantity: order.quantity,
            amount: order.side === 'buy' ? -(transactionValue + fee) : (transactionValue - fee),
            fee,
            timestamp: new Date().toISOString(),
            memo: `${order.ticker} ${order.quantity}주 ${order.side === 'buy' ? '매수' : '매도'} 체결 완료 (대기 주문 체결)`
          });
          
          updated = true;
        }
      }
      
      if (updated) {
        await writeJSONSafe(ORDERS_FILE, orders);
        if (portfolios) await writeJSONSafe(PORTFOLIOS_FILE, portfolios);
        if (history) await writeJSONSafe(HISTORY_FILE, history);
        console.log('[SECURITY ENGINE] Processed matched pending orders.');
      }
    } catch (e) {
      console.error('[SECURITY ENGINE] Order matcher matching interval failed:', e);
    }
  }, 5000);
}

// Start matching loop immediately on router load
startOrderMatcher();

// ── ENDPOINTS ────────────────────────────────────────────────────────────────

// 1. Get Portfolio
router.get('/portfolio', async (req, res) => {
  const userId = req.user.id;
  try {
    const portfolios = await readJSONSafe(PORTFOLIOS_FILE, {});
    if (!portfolios[userId]) {
      portfolios[userId] = {
        cash: 10000000,
        investedPrincipal: 0,
        holdings: []
      };
      await writeJSONSafe(PORTFOLIOS_FILE, portfolios);
    }
    
    const userPort = portfolios[userId];
    let totalHoldingsValue = 0;
    let totalHoldingsCost = 0;
    
    const holdingsWithPrice = userPort.holdings.map(h => {
      let currentPrice = 0;
      if (h.type === 'stock') {
        currentPrice = getAssetPrice(h.ticker, h.market, 'stock');
      } else if (h.type === 'option') {
        currentPrice = getOptionPrice(h.ticker, h.market, h.optionDetails);
      } else if (h.type === 'bond') {
        currentPrice = getBondPrice(h.ticker, h.market, h.bondDetails);
      }
      
      const evaluationValue = h.quantity * currentPrice;
      const cost = h.quantity * h.avgPrice;
      const profit = evaluationValue - cost;
      const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
      
      totalHoldingsValue += evaluationValue;
      totalHoldingsCost += cost;
      
      return {
        ...h,
        currentPrice,
        evaluationValue,
        profit,
        profitPct
      };
    });
    
    const totalAssetValuation = userPort.cash + totalHoldingsValue;
    const totalEvaluationProfit = totalHoldingsValue - totalHoldingsCost;
    const totalEvaluationProfitPct = totalHoldingsCost > 0 ? (totalEvaluationProfit / totalHoldingsCost) * 100 : 0;
    
    res.json({
      cash: userPort.cash,
      investedPrincipal: userPort.investedPrincipal || totalHoldingsCost,
      totalAssetValuation,
      totalHoldingsValue,
      totalHoldingsCost,
      totalEvaluationProfit,
      totalEvaluationProfitPct,
      holdings: holdingsWithPrice
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Submit Order
router.post('/order', async (req, res) => {
  const userId = req.user.id;
  const { ticker, market, type, side, price, quantity, mode, optionDetails, bondDetails } = req.body;
  
  if (!ticker || !market || !type || !side || !price || !quantity || !mode) {
    return res.status(400).json({ error: '필수 주문 매개변수가 누락되었습니다.' });
  }
  
  const parsedPrice = parseFloat(price);
  const parsedQty = parseInt(quantity, 10);
  
  if (isNaN(parsedPrice) || parsedPrice <= 0 || isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ error: '올바른 수량 및 가격을 입력해 주세요.' });
  }
  
  if (side !== 'buy' && side !== 'sell') {
    return res.status(400).json({ error: '주문 방향은 buy 또는 sell이어야 합니다.' });
  }
  
  const commissionRate = 0.00015; // 0.015%
  const transactionValue = parsedPrice * parsedQty;
  const fee = transactionValue * commissionRate;
  
  try {
    const portfolios = await readJSONSafe(PORTFOLIOS_FILE, {});
    const orders = await readJSONSafe(ORDERS_FILE, {});
    
    if (!portfolios[userId]) {
      portfolios[userId] = { cash: 10000000, investedPrincipal: 0, holdings: [] };
    }
    const userPort = portfolios[userId];
    
    // Validate bounds / execute cash reserve or stock deduct
    if (side === 'buy') {
      const requiredCash = transactionValue + fee;
      if (userPort.cash < requiredCash) {
        return res.status(400).json({ error: `잔액이 부족합니다. (필요: ${requiredCash.toLocaleString()}원, 잔고: ${userPort.cash.toLocaleString()}원)` });
      }
      userPort.cash -= requiredCash;
    } else {
      const assetId = `${ticker}_${market}`;
      const holding = userPort.holdings.find(h => h.assetId === assetId);
      if (!holding || holding.quantity < parsedQty) {
        return res.status(400).json({ error: '보유 수량이 부족하여 매도할 수 없습니다.' });
      }
      holding.quantity -= parsedQty;
      if (holding.quantity === 0) {
        userPort.holdings = userPort.holdings.filter(h => h.assetId !== assetId);
      }
    }
    
    // Evaluate if execution can occur immediately
    const isOpen = isMarketOpen(market);
    const executeImmediately = (mode === 'virtual') || (mode === 'realtime' && isOpen);
    
    const orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newOrder = {
      orderId,
      userId,
      ticker,
      market,
      type,
      side,
      price: parsedPrice,
      quantity: parsedQty,
      filledQuantity: executeImmediately ? parsedQty : 0,
      status: executeImmediately ? 'filled' : 'pending',
      mode,
      createdAt: new Date().toISOString(),
      optionDetails: optionDetails || null,
      bondDetails: bondDetails || null
    };
    
    if (executeImmediately) {
      if (side === 'buy') {
        const assetId = `${ticker}_${market}`;
        let holding = userPort.holdings.find(h => h.assetId === assetId);
        if (!holding) {
          holding = {
            assetId,
            ticker,
            market,
            type,
            avgPrice: parsedPrice,
            quantity: parsedQty,
            optionDetails: optionDetails || null,
            bondDetails: bondDetails || null
          };
          userPort.holdings.push(holding);
        } else {
          const totalQty = holding.quantity + parsedQty;
          holding.avgPrice = ((holding.quantity * holding.avgPrice) + (parsedQty * parsedPrice)) / totalQty;
          holding.quantity = totalQty;
        }
        userPort.investedPrincipal = (userPort.investedPrincipal || 0) + transactionValue;
      } else {
        userPort.cash += (transactionValue - fee);
        userPort.investedPrincipal = Math.max(0, (userPort.investedPrincipal || 0) - transactionValue);
      }
      
      const history = await readJSONSafe(HISTORY_FILE, {});
      if (!history[userId]) history[userId] = [];
      history[userId].push({
        historyId: `hist_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        type: 'trade',
        ticker,
        side,
        price: parsedPrice,
        quantity: parsedQty,
        amount: side === 'buy' ? -(transactionValue + fee) : (transactionValue - fee),
        fee,
        timestamp: new Date().toISOString(),
        memo: `${ticker} ${parsedQty}주 ${side === 'buy' ? '매수' : '매도'} 체결 완료`
      });
      await writeJSONSafe(HISTORY_FILE, history);
    }
    
    orders[orderId] = newOrder;
    await writeJSONSafe(ORDERS_FILE, orders);
    await writeJSONSafe(PORTFOLIOS_FILE, portfolios);
    
    res.json({ ok: true, order: newOrder });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. Cancel Order
router.post('/cancel', async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ error: 'orderId가 필요합니다.' });
  }
  
  try {
    const orders = await readJSONSafe(ORDERS_FILE, {});
    const order = orders[orderId];
    
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: '해당 주문을 찾을 수 없습니다.' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '대기 중인 주문만 취소할 수 있습니다.' });
    }
    
    const portfolios = await readJSONSafe(PORTFOLIOS_FILE, {});
    const userPort = portfolios[userId];
    
    const commissionRate = 0.00015;
    const transactionValue = order.price * order.quantity;
    const fee = transactionValue * commissionRate;
    
    if (order.side === 'buy') {
      userPort.cash += (transactionValue + fee);
    } else {
      const assetId = `${order.ticker}_${order.market}`;
      let holding = userPort.holdings.find(h => h.assetId === assetId);
      if (!holding) {
        holding = {
          assetId,
          ticker: order.ticker,
          market: order.market,
          type: order.type,
          avgPrice: order.price,
          quantity: order.quantity,
          optionDetails: order.optionDetails,
          bondDetails: order.bondDetails
        };
        userPort.holdings.push(holding);
      } else {
        holding.quantity += order.quantity;
      }
    }
    
    order.status = 'cancelled';
    
    const history = await readJSONSafe(HISTORY_FILE, {});
    if (!history[userId]) history[userId] = [];
    history[userId].push({
      historyId: `hist_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      type: 'cancel',
      ticker: order.ticker,
      side: order.side,
      price: order.price,
      quantity: order.quantity,
      amount: 0,
      fee: 0,
      timestamp: new Date().toISOString(),
      memo: `${order.ticker} ${order.quantity}주 ${order.side === 'buy' ? '매수' : '매도'} 주문 취소`
    });
    
    await writeJSONSafe(ORDERS_FILE, orders);
    await writeJSONSafe(PORTFOLIOS_FILE, portfolios);
    await writeJSONSafe(HISTORY_FILE, history);
    
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. Get Transaction History
router.get('/history', async (req, res) => {
  const userId = req.user.id;
  try {
    const history = await readJSONSafe(HISTORY_FILE, {});
    res.json(history[userId] || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Get Order Book
router.get('/orderbook', (req, res) => {
  const { ticker, market, type, strike, expiry, optionType, couponRate, maturityDate, couponFrequency } = req.query;
  if (!ticker || !market || !type) {
    return res.status(400).json({ error: 'ticker, market, type 매개변수가 필요합니다.' });
  }
  
  let optionDetails = null;
  if (type === 'option') {
    optionDetails = { strike, expiry, optionType };
  }
  
  let bondDetails = null;
  if (type === 'bond') {
    bondDetails = { couponRate, maturityDate, couponFrequency };
  }
  
  const orderBook = generateOrderBook(ticker, market, type, optionDetails, bondDetails);
  if (!orderBook) {
    return res.status(404).json({ error: '해당 자산의 가격을 조회할 수 없어 호가창을 생성하지 못했습니다.' });
  }
  
  res.json(orderBook);
});

export default router;
