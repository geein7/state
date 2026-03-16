// Vercel 서버리스 함수: /api/chart/:symbol
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { symbol } = req.query;
  const range    = req.query.range    || '1mo';
  const interval = req.query.interval || '1d';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    const data = await r.json();

    const result = data.chart?.result?.[0];
    if (!result) throw new Error('데이터 없음');

    const ts   = result.timestamp;
    const q    = result.indicators.quote[0];
    const meta = result.meta;

    const candles = ts
      .map((t, i) => ({
        time:   t,
        open:   q.open[i]   != null ? Math.round(q.open[i]   * 100) / 100 : null,
        high:   q.high[i]   != null ? Math.round(q.high[i]   * 100) / 100 : null,
        low:    q.low[i]    != null ? Math.round(q.low[i]    * 100) / 100 : null,
        close:  q.close[i]  != null ? Math.round(q.close[i]  * 100) / 100 : null,
        volume: q.volume[i] || 0,
      }))
      .filter(c => c.open != null && c.close != null);

    res.status(200).json({
      symbol:    meta.symbol,
      price:     meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose,
      currency:  meta.currency,
      candles,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
