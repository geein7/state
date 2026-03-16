const KR_STOCKS = require('./stocks.json');

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

function isKorean(text) {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

// 로컬 DB 검색 (2600+ 전체 종목)
function searchLocal(q) {
  const lower = q.toLowerCase();
  return KR_STOCKS
    .filter(s => s.name.toLowerCase().includes(lower) || s.symbol.toLowerCase().includes(lower))
    .slice(0, 10);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { q } = req.query;
  if (!q) return res.status(200).json([]);

  // 한국어 → 로컬 DB 직접 검색
  if (isKorean(q)) {
    return res.status(200).json(searchLocal(q));
  }

  // 영어 → Yahoo Finance 시도 후 로컬 DB fallback
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    const data = await r.json();
    const items = (data.quotes || [])
      .filter(x => x.symbol && (x.symbol.endsWith('.KS') || x.symbol.endsWith('.KQ')))
      .map(x => {
        const local = KR_STOCKS.find(s => s.symbol === x.symbol);
        return { symbol: x.symbol, name: local ? local.name : (x.longname || x.shortname || x.symbol) };
      });
    if (items.length > 0) return res.status(200).json(items);
  } catch { /* fallback */ }

  return res.status(200).json(searchLocal(q));
};
