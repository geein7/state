const https = require('https');

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

function callClaude(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다' });

  try {
    const { symbol, name, candles } = await readBody(req);
    if (!candles || candles.length < 5) return res.status(400).json({ error: '데이터 부족' });

    const recent = candles.slice(-20);
    const prices = recent.map(c => c.close);
    const last = prices[prices.length - 1];
    const ma5  = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const ma20 = prices.reduce((a, b) => a + b, 0) / prices.length;
    const change20 = ((last - prices[0]) / prices[0] * 100).toFixed(2);
    const vols = recent.slice(-5).map(c => c.volume);
    const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
    const prevVols = recent.slice(-10, -5).map(c => c.volume);
    const prevAvg = prevVols.reduce((a, b) => a + b, 0) / prevVols.length;
    const volChg = ((avgVol - prevAvg) / prevAvg * 100).toFixed(1);

    const prompt = `당신은 한국 주식 시장 전문 기술적 분석가입니다. 다음 데이터를 분석해 내일 주가를 예측해주세요.

종목: ${name} (${symbol})
최근 ${recent.length}거래일 종가: ${prices.map(p => Math.round(p).toLocaleString()).join(', ')}원

기술적 지표:
- 현재가: ${Math.round(last).toLocaleString()}원
- MA5: ${Math.round(ma5).toLocaleString()}원 (${last > ma5 ? '현재가 위' : '현재가 아래'})
- MA20: ${Math.round(ma20).toLocaleString()}원 (${last > ma20 ? '현재가 위' : '현재가 아래'})
- 20일 변화율: ${change20}%
- 최근 5일 거래량 변화: ${volChg}%

다음 형식으로 분석해주세요:

**추세:** (1-2줄로 현재 추세 설명)
**내일 전망:** 상승 / 하락 / 횡보 중 하나 + 이유 (1줄)
**예상 범위:** 저가 X,XXX원 ~ 고가 X,XXX원
**리스크:** (주의 사항 1줄)

⚠️ 투자 참고용이며 실제 투자 결정에 사용하지 마세요.`;

    const data = await callClaude(apiKey, prompt);
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('응답 없음');
    res.status(200).json({ analysis: text });
  } catch (e) {
    res.status(500).json({ error: 'AI 분석 실패: ' + e.message });
  }
};
