// Vercel 서버리스 함수: /api/chart/:symbol
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

module.exports = async function handler(req, res) {
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

    // 일봉/주봉/월봉은 YYYY-MM-DD 문자열로 변환 (timezone 불일치 방지)
    const isDailyPlus = ['1d', '1wk', '1mo'].includes(interval);
    function toDateStr(t) {
      const d = new Date(t * 1000);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    const candles = ts
      .map((t, i) => ({
        time:   isDailyPlus ? toDateStr(t) : t,
        open:   q.open[i]   != null ? Math.round(q.open[i]   * 100) / 100 : null,
        high:   q.high[i]   != null ? Math.round(q.high[i]   * 100) / 100 : null,
        low:    q.low[i]    != null ? Math.round(q.low[i]    * 100) / 100 : null,
        close:  q.close[i]  != null ? Math.round(q.close[i]  * 100) / 100 : null,
        volume: q.volume[i] || 0,
      }))
      .filter(c => c.open != null && c.close != null)
      .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0)); // 분봉/일봉 모두 정렬

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
