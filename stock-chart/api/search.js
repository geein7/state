// 주요 한국 상장 종목 로컬 DB (한국어 검색 지원)
const KR_STOCKS = [
  // KOSPI 대형주
  {symbol:'005930.KS', name:'삼성전자'},
  {symbol:'000660.KS', name:'SK하이닉스'},
  {symbol:'035420.KS', name:'NAVER'},
  {symbol:'005380.KS', name:'현대차'},
  {symbol:'051910.KS', name:'LG화학'},
  {symbol:'006400.KS', name:'삼성SDI'},
  {symbol:'035720.KS', name:'카카오'},
  {symbol:'000270.KS', name:'기아'},
  {symbol:'012330.KS', name:'현대모비스'},
  {symbol:'068270.KS', name:'셀트리온'},
  {symbol:'207940.KS', name:'삼성바이오로직스'},
  {symbol:'066570.KS', name:'LG전자'},
  {symbol:'373220.KS', name:'LG에너지솔루션'},
  {symbol:'105560.KS', name:'KB금융'},
  {symbol:'055550.KS', name:'신한지주'},
  {symbol:'086790.KS', name:'하나금융지주'},
  {symbol:'316140.KS', name:'우리금융지주'},
  {symbol:'032830.KS', name:'삼성생명'},
  {symbol:'005490.KS', name:'POSCO홀딩스'},
  {symbol:'028260.KS', name:'삼성물산'},
  {symbol:'000810.KS', name:'삼성화재'},
  {symbol:'030200.KS', name:'KT'},
  {symbol:'017670.KS', name:'SK텔레콤'},
  {symbol:'015760.KS', name:'한국전력'},
  {symbol:'034730.KS', name:'SK'},
  {symbol:'018260.KS', name:'삼성에스디에스'},
  {symbol:'096770.KS', name:'SK이노베이션'},
  {symbol:'003670.KS', name:'포스코퓨처엠'},
  {symbol:'047050.KS', name:'포스코인터내셔널'},
  {symbol:'034220.KS', name:'LG디스플레이'},
  {symbol:'010130.KS', name:'고려아연'},
  {symbol:'000720.KS', name:'현대건설'},
  {symbol:'006800.KS', name:'미래에셋증권'},
  {symbol:'042660.KS', name:'한화오션'},
  {symbol:'009540.KS', name:'HD한국조선해양'},
  {symbol:'329180.KS', name:'HD현대중공업'},
  {symbol:'010620.KS', name:'현대미포조선'},
  {symbol:'001450.KS', name:'현대해상'},
  {symbol:'090430.KS', name:'아모레퍼시픽'},
  {symbol:'003550.KS', name:'LG'},
  {symbol:'064350.KS', name:'현대로템'},
  {symbol:'010140.KS', name:'삼성중공업'},
  {symbol:'047810.KS', name:'한국항공우주'},
  {symbol:'082740.KS', name:'한화시스템'},
  {symbol:'009830.KS', name:'한화솔루션'},
  {symbol:'012450.KS', name:'한화에어로스페이스'},
  {symbol:'004020.KS', name:'현대제철'},
  {symbol:'005940.KS', name:'NH투자증권'},
  {symbol:'071050.KS', name:'한국금융지주'},
  {symbol:'016360.KS', name:'삼성증권'},
  {symbol:'024110.KS', name:'기업은행'},
  {symbol:'267250.KS', name:'HD현대'},
  {symbol:'032640.KS', name:'LG유플러스'},
  {symbol:'033780.KS', name:'KT&G'},
  {symbol:'000100.KS', name:'유한양행'},
  {symbol:'293490.KS', name:'카카오뱅크'},
  {symbol:'097950.KS', name:'CJ제일제당'},
  {symbol:'000120.KS', name:'CJ대한통운'},
  {symbol:'011170.KS', name:'롯데케미칼'},
  {symbol:'004370.KS', name:'농심'},
  {symbol:'007070.KS', name:'GS리테일'},
  {symbol:'078930.KS', name:'GS'},
  {symbol:'036460.KS', name:'한국가스공사'},
  {symbol:'003490.KS', name:'대한항공'},
  {symbol:'020560.KS', name:'아시아나항공'},
  {symbol:'139480.KS', name:'이마트'},
  {symbol:'023530.KS', name:'롯데쇼핑'},
  {symbol:'004170.KS', name:'신세계'},
  {symbol:'069960.KS', name:'현대백화점'},
  {symbol:'000240.KS', name:'한국타이어앤테크놀로지'},
  {symbol:'011780.KS', name:'금호석유'},
  {symbol:'051600.KS', name:'한전KPS'},
  {symbol:'036490.KS', name:'SK바이오팜'},
  {symbol:'326030.KS', name:'SK바이오사이언스'},
  // KOSDAQ 주요종목
  {symbol:'091990.KQ', name:'셀트리온헬스케어'},
  {symbol:'145020.KQ', name:'휴젤'},
  {symbol:'263750.KQ', name:'펄어비스'},
  {symbol:'112040.KQ', name:'위메이드'},
  {symbol:'196170.KQ', name:'알테오젠'},
  {symbol:'357780.KQ', name:'솔브레인'},
  {symbol:'251270.KS', name:'넷마블'},
  {symbol:'036570.KS', name:'엔씨소프트'},
  {symbol:'259960.KS', name:'크래프톤'},
  {symbol:'035900.KS', name:'JYP Ent.'},
  {symbol:'041510.KS', name:'SM엔터테인먼트'},
  {symbol:'352820.KS', name:'하이브'},
  {symbol:'042670.KS', name:'HD현대인프라코어'},
];

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com',
};

function isKorean(text) {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

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

  // 한국어 쿼리 → 로컬 DB 검색
  if (isKorean(q)) {
    return res.status(200).json(searchLocal(q));
  }

  // 영어 쿼리 → Yahoo Finance 시도, 실패 시 로컬 DB fallback
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    const r = await fetch(url, { headers: YAHOO_HEADERS });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    const data = await r.json();

    const items = (data.quotes || [])
      .filter(x => x.symbol && (x.symbol.endsWith('.KS') || x.symbol.endsWith('.KQ')))
      .map(x => {
        const local = KR_STOCKS.find(s => s.symbol === x.symbol);
        return {
          symbol: x.symbol,
          name: local ? local.name : (x.longname || x.shortname || x.symbol),
        };
      });

    return res.status(200).json(items.length ? items : searchLocal(q));
  } catch {
    return res.status(200).json(searchLocal(q));
  }
};
