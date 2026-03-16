// Vercel 서버리스 함수: /api/search?q=...
const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { q } = req.query;
  if (!q) return res.status(200).json([]);

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    const data = await r.json();

    const items = (data.quotes || [])
      .filter(x => x.symbol && (x.symbol.endsWith('.KS') || x.symbol.endsWith('.KQ')))
      .map(x => ({
        symbol: x.symbol,
        name:   x.longname || x.shortname || x.symbol,
      }));

    res.status(200).json(items);
  } catch (e) {
    res.status(500).json([]);
  }
}
