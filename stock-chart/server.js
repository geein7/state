const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

const yahooHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

// 차트 데이터 (OHLCV 캔들스틱)
app.get('/api/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { range = '3mo', interval = '1d' } = req.query;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
    const response = await axios.get(url, {
      params: { range, interval, includePrePost: false },
      headers: yahooHeaders,
      timeout: 10000,
    });

    const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const ohlcv = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose;

    const candles = timestamps.map((t, i) => ({
      time: t,
      open: ohlcv.open[i],
      high: ohlcv.high[i],
      low: ohlcv.low[i],
      close: ohlcv.close[i],
      volume: ohlcv.volume[i],
    })).filter(c => c.open != null && c.close != null);

    const meta = result.meta;
    res.json({
      symbol: meta.symbol,
      currency: meta.currency,
      exchangeName: meta.exchangeName,
      regularMarketPrice: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose,
      candles,
    });
  } catch (err) {
    console.error(`차트 데이터 오류 [${symbol}]:`, err.message);
    res.status(500).json({ error: '데이터를 가져올 수 없습니다.' });
  }
});

// 종목 검색
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search`;
    const response = await axios.get(url, {
      params: { q, newsCount: 0, quotesCount: 10, enableFuzzyQuery: false },
      headers: yahooHeaders,
      timeout: 8000,
    });

    const quotes = (response.data.quotes || [])
      .filter(item => item.exchDisp && (item.exchDisp.includes('KSC') || item.exchDisp.includes('KOE') || item.exchDisp.includes('Seoul')))
      .map(item => ({
        symbol: item.symbol,
        name: item.longname || item.shortname || item.symbol,
        exchange: item.exchDisp,
      }));

    res.json(quotes);
  } catch (err) {
    console.error('검색 오류:', err.message);
    res.status(500).json({ error: '검색 실패' });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
