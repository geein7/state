const API = '';

// ── 차트 공통 옵션 ──────────────────────────────────────
const CHART_OPT = {
  layout: { background: { color: '#161b22' }, textColor: '#8b949e' },
  grid:   { vertLines: { color: '#21262d' }, horzLines: { color: '#21262d' } },
  crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
  rightPriceScale: { borderColor: '#30363d' },
  timeScale: { borderColor: '#30363d', timeVisible: true, secondsVisible: false },
};
const CANDLE_OPT = {
  upColor: '#3fb950', downColor: '#f85149',
  borderUpColor: '#3fb950', borderDownColor: '#f85149',
  wickUpColor: '#3fb950', wickDownColor: '#f85149',
};

const MA_OPTS = [
  { period: 10,  color: '#e53935', title: 'MA10'  },
  { period: 60,  color: '#43a047', title: 'MA60'  },
  { period: 360, color: '#000000', title: 'MA360' },
  { period: 500, color: '#757575', title: 'MA500' },
];

function makeChart(containerId) {
  const el = document.getElementById(containerId);
  const chart = LightweightCharts.createChart(el, {
    ...CHART_OPT, width: el.clientWidth, height: el.clientHeight,
  });
  const candle = chart.addCandlestickSeries(CANDLE_OPT);
  const vol = chart.addHistogramSeries({
    priceFormat: { type: 'volume' }, priceScaleId: 'vol',
  });
  vol.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

  const maLines = MA_OPTS.map(({ color, title }) =>
    chart.addLineSeries({
      color, lineWidth: 1, title,
      priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
  );

  new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth })).observe(el);
  return { chart, candle, vol, maLines };
}

function calcMA(candles, period) {
  const result = [];
  for (let i = period - 1; i < candles.length; i++) {
    const sum = candles.slice(i - period + 1, i + 1).reduce((a, c) => a + c.close, 0);
    result.push({ time: candles[i].time, value: Math.round((sum / period) * 100) / 100 });
  }
  return result;
}

// ── 인터벌별 기간 설정 ──────────────────────────────────
const INTERVAL_RANGES = {
  '1m':  [{r:'1d',l:'1일'},{r:'5d',l:'5일'}],
  '5m':  [{r:'1d',l:'1일'},{r:'5d',l:'5일'},{r:'1mo',l:'1개월'}],
  '15m': [{r:'5d',l:'5일'},{r:'1mo',l:'1개월'},{r:'3mo',l:'3개월'}],
  '30m': [{r:'5d',l:'5일'},{r:'1mo',l:'1개월'},{r:'3mo',l:'3개월'}],
  '60m': [{r:'1mo',l:'1개월'},{r:'3mo',l:'3개월'},{r:'6mo',l:'6개월'}],
  '1d':  [{r:'1mo',l:'1개월'},{r:'3mo',l:'3개월'},{r:'6mo',l:'6개월'},{r:'1y',l:'1년'},{r:'5y',l:'5년'}],
  '1wk': [{r:'6mo',l:'6개월'},{r:'1y',l:'1년'},{r:'2y',l:'2년'},{r:'5y',l:'5년'}],
  '1mo': [{r:'1y',l:'1년'},{r:'2y',l:'2년'},{r:'5y',l:'5년'},{r:'10y',l:'10년'}],
};
const DEFAULT_RANGE = {
  '1m':'1d','5m':'5d','15m':'1mo','30m':'1mo','60m':'3mo',
  '1d':'1mo','1wk':'1y','1mo':'5y',
};

function renderRangeButtons(groupId, interval, activeRange) {
  const container = document.getElementById(groupId);
  const ranges = INTERVAL_RANGES[interval] || INTERVAL_RANGES['1d'];
  const valid = activeRange && ranges.some(x => x.r === activeRange);
  const range = valid ? activeRange : DEFAULT_RANGE[interval];
  container.innerHTML = '';
  ranges.forEach(({r, l}) => {
    const btn = document.createElement('button');
    btn.className = 'rbtn' + (r === range ? ' active' : '');
    btn.dataset.r = r;
    btn.textContent = l;
    container.appendChild(btn);
  });
  return range;
}

function setIntervalActive(groupId, activeInterval) {
  document.querySelectorAll(`#${groupId} .ibtn`).forEach(b => {
    b.classList.toggle('active', b.dataset.i === activeInterval);
  });
}

// ── API 호출 ────────────────────────────────────────────
async function fetchChart(symbol, range, interval) {
  const res = await fetch(`${API}/api/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`);
  if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d;
}

async function fetchSearch(q) {
  const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

// ── UI 헬퍼 ─────────────────────────────────────────────
const loader = document.getElementById('loader');
const toast  = document.getElementById('toast');
let toastTimer;

function loading(on) { loader.classList.toggle('on', on); }

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 5000);
}

function fmt(n) {
  if (n == null || isNaN(n)) return '-';
  return Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

function setChg(el, cur, prev) {
  if (!cur || !prev) { el.textContent = ''; return; }
  const d = cur - prev, p = (d / prev) * 100;
  const s = d >= 0 ? '+' : '';
  el.textContent = `${s}${fmt(d)} (${s}${p.toFixed(2)}%)`;
  el.className = 'chg ' + (d >= 0 ? 'up' : 'down');
}

// ── 차트 데이터 적용 ────────────────────────────────────
function applyData(inst, data) {
  const candles = data.candles.map(c => ({
    time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
  }));
  const volumes = data.candles.map(c => ({
    time: c.time, value: c.volume,
    color: c.close >= c.open ? '#3fb95055' : '#f8514955',
  }));
  inst.candle.setData(candles);
  inst.vol.setData(volumes);

  MA_OPTS.forEach(({ period }, idx) => {
    inst.maLines[idx].setData(calcMA(data.candles, period));
  });

  inst.chart.timeScale().fitContent();
}

// ── KOSPI ───────────────────────────────────────────────
let kInst = null;
let kRange = '1mo';
let kInterval = '1d';

function initKospi() {
  kInst = makeChart('kChart');
}

async function loadKospi(range) {
  loading(true);
  try {
    const d = await fetchChart('^KS11', range, kInterval);
    applyData(kInst, d);
    const last = d.candles[d.candles.length - 1];
    document.getElementById('kPrice').textContent = fmt(last?.close);
    setChg(document.getElementById('kChg'), last?.close, d.prevClose);
  } catch (e) {
    showToast('KOSPI 로드 실패: ' + e.message);
    document.getElementById('kPrice').textContent = '오류';
  } finally {
    loading(false);
  }
}

// ── 개별 종목 ───────────────────────────────────────────
let sInst = null;
let curSym = null, curName = null, sRange = '1mo', sInterval = '1d';

async function loadStock(symbol, name, range) {
  const card = document.getElementById('sCard');
  card.style.display = 'block';
  if (!sInst) sInst = makeChart('sChart');
  loading(true);
  try {
    const d = await fetchChart(symbol, range, sInterval);
    applyData(sInst, d);
    const last = d.candles[d.candles.length - 1];
    document.getElementById('sName').textContent = name;
    document.getElementById('sSym').textContent = symbol;
    document.getElementById('sPrice').textContent = fmt(last?.close);
    setChg(document.getElementById('sChg'), last?.close, d.prevClose);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    showToast(name + ' 로드 실패: ' + e.message);
  } finally {
    loading(false);
  }
}

// ── 이벤트: KOSPI ────────────────────────────────────────
document.getElementById('kIntervals').addEventListener('click', e => {
  const btn = e.target.closest('.ibtn');
  if (!btn) return;
  kInterval = btn.dataset.i;
  setIntervalActive('kIntervals', kInterval);
  kRange = renderRangeButtons('kRanges', kInterval, kRange);
  loadKospi(kRange);
});

document.getElementById('kRanges').addEventListener('click', e => {
  const btn = e.target.closest('.rbtn');
  if (!btn) return;
  kRange = btn.dataset.r;
  document.querySelectorAll('#kRanges .rbtn').forEach(b =>
    b.classList.toggle('active', b === btn));
  loadKospi(kRange);
});

// ── 이벤트: 개별 종목 ───────────────────────────────────
document.getElementById('sIntervals').addEventListener('click', e => {
  const btn = e.target.closest('.ibtn');
  if (!btn) return;
  sInterval = btn.dataset.i;
  setIntervalActive('sIntervals', sInterval);
  sRange = renderRangeButtons('sRanges', sInterval, sRange);
  if (curSym) loadStock(curSym, curName, sRange);
});

document.getElementById('sRanges').addEventListener('click', e => {
  const btn = e.target.closest('.rbtn');
  if (!btn) return;
  sRange = btn.dataset.r;
  document.querySelectorAll('#sRanges .rbtn').forEach(b =>
    b.classList.toggle('active', b === btn));
  if (curSym) loadStock(curSym, curName, sRange);
});

// ── 내 종목 관리 ────────────────────────────────────────
const USER_KEY = 'userStocks';

function getUserStocks() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || []; }
  catch { return []; }
}
function saveUserStocks(list) {
  localStorage.setItem(USER_KEY, JSON.stringify(list));
}
function renderUserChips() {
  const list = getUserStocks();
  const container = document.getElementById('userChipList');
  document.getElementById('userCard').style.display = list.length ? 'block' : 'none';
  container.innerHTML = '';
  list.forEach(({ symbol, name }) => {
    const btn = document.createElement('button');
    btn.className = 'chip user-chip';
    btn.dataset.s = symbol;
    btn.dataset.n = name;
    btn.innerHTML = `<span class="chip-label">${name}</span><span class="chip-remove" data-s="${symbol}" title="삭제">×</span>`;
    container.appendChild(btn);
  });
}
function addUserStock(symbol, name) {
  const list = getUserStocks();
  if (!list.find(x => x.symbol === symbol)) {
    list.push({ symbol, name });
    saveUserStocks(list);
  }
  renderUserChips();
}
function removeUserStock(symbol) {
  saveUserStocks(getUserStocks().filter(x => x.symbol !== symbol));
  renderUserChips();
}

function activateStock(symbol, name) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('#userChipList .chip').forEach(c => {
    if (c.dataset.s === symbol) c.classList.add('active');
  });
  curSym = symbol; curName = name;
  sInterval = '1d'; sRange = '1mo';
  setIntervalActive('sIntervals', sInterval);
  sRange = renderRangeButtons('sRanges', sInterval, sRange);
  loadStock(curSym, curName, sRange);
}

document.getElementById('userChipList').addEventListener('click', e => {
  const removeBtn = e.target.closest('.chip-remove');
  if (removeBtn) {
    e.stopPropagation();
    removeUserStock(removeBtn.dataset.s);
    return;
  }
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activateStock(chip.dataset.s, chip.dataset.n);
});

document.getElementById('chipList').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activateStock(chip.dataset.s, chip.dataset.n);
});

// ── 검색 ────────────────────────────────────────────────
let sTimer;
const searchInput   = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

function selectSearchItem(symbol, name) {
  searchResults.style.display = 'none';
  searchInput.value = '';
  addUserStock(symbol, name);
  activateStock(symbol, name);
}

async function runSearch(q) {
  try {
    const items = await fetchSearch(q);
    searchResults.innerHTML = '';
    if (!items.length) {
      searchResults.innerHTML = '<li style="color:var(--muted);cursor:default">검색 결과 없음</li>';
    } else {
      items.forEach(item => {
        const li = document.createElement('li');
        li.dataset.symbol = item.symbol;
        li.dataset.name   = item.name;
        li.innerHTML = `<span class="r-name">${item.name}</span><span class="r-sym">${item.symbol}</span>`;
        li.onclick = () => selectSearchItem(item.symbol, item.name);
        searchResults.appendChild(li);
      });
    }
    searchResults.style.display = 'block';
    return items;
  } catch {
    return [];
  }
}

// 입력 시 자동완성 (350ms 디바운스)
searchInput.addEventListener('input', () => {
  clearTimeout(sTimer);
  const q = searchInput.value.trim();
  if (!q) { searchResults.style.display = 'none'; return; }
  sTimer = setTimeout(() => runSearch(q), 350);
});

// Enter 키: 결과 있으면 첫 번째 선택, 없으면 즉시 검색 후 첫 번째 선택
searchInput.addEventListener('keydown', async e => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  clearTimeout(sTimer);
  const q = searchInput.value.trim();
  if (!q) return;

  const firstLi = searchResults.querySelector('li[data-symbol]');
  if (firstLi && searchResults.style.display !== 'none') {
    selectSearchItem(firstLi.dataset.symbol, firstLi.dataset.name);
    return;
  }

  const items = await runSearch(q);
  if (items.length > 0) selectSearchItem(items[0].symbol, items[0].name);
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) searchResults.style.display = 'none';
});

// ── 예측 ────────────────────────────────────────────────

// A) 선형회귀 (client-side JS)
function linearRegressionPredict(prices) {
  const n = prices.length;
  const xs = Array.from({length: n}, (_, i) => i);
  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = prices.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * prices[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;
  const predicted = intercept + slope * n;
  const residuals = prices.map((p, i) => p - (intercept + slope * i));
  const std = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / n);
  return {
    prediction: Math.round(predicted),
    ci_low:     Math.round(predicted - 1.645 * std),
    ci_high:    Math.round(predicted + 1.645 * std),
  };
}

// B) Holt-Winters via Python API
async function hwPredict(prices) {
  const res = await fetch(`${API}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prices }),
  });
  if (!res.ok) throw new Error(`HW API ${res.status}`);
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d;
}

// C) Claude AI via analyze API
async function aiAnalyze(symbol, name, candles) {
  const res = await fetch(`${API}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, name, candles }),
  });
  if (!res.ok) throw new Error(`AI API ${res.status}`);
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.analysis;
}

function fmtPred(price) {
  return price != null ? Math.round(price).toLocaleString('ko-KR') + '원' : '-';
}

async function runPredictions() {
  if (!curSym || !sInst) return;

  const predPanel = document.getElementById('predPanel');
  predPanel.style.display = 'block';
  predPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Reset to loading state
  document.getElementById('predStatPrice').innerHTML = '<span class="pred-spin"></span>';
  document.getElementById('predStatRange').textContent = '';
  document.getElementById('predHWPrice').innerHTML  = '<span class="pred-spin"></span>';
  document.getElementById('predHWRange').textContent  = '';
  document.getElementById('predAIText').innerHTML   = '<span class="pred-spin"></span> 분석 중...';

  // Get candles from current chart data (fetch fresh 1d/3mo)
  let candles;
  try {
    const d = await fetchChart(curSym, '3mo', '1d');
    candles = d.candles;
  } catch(e) {
    showToast('예측용 데이터 로드 실패: ' + e.message);
    return;
  }

  const prices = candles.map(c => c.close).filter(Boolean);
  if (prices.length < 5) { showToast('데이터 부족'); return; }

  // A) Linear regression (instant)
  try {
    const stat = linearRegressionPredict(prices.slice(-20));
    document.getElementById('predStatPrice').textContent = fmtPred(stat.prediction);
    document.getElementById('predStatRange').textContent =
      `범위: ${fmtPred(stat.ci_low)} ~ ${fmtPred(stat.ci_high)}`;
  } catch(e) {
    document.getElementById('predStatPrice').innerHTML = `<span class="pred-error">오류: ${e.message}</span>`;
  }

  // B) Holt-Winters & C) AI in parallel
  const [hwResult, aiResult] = await Promise.allSettled([
    hwPredict(prices),
    aiAnalyze(curSym, curName, candles.slice(-20)),
  ]);

  if (hwResult.status === 'fulfilled') {
    const hw = hwResult.value;
    document.getElementById('predHWPrice').textContent = fmtPred(hw.prediction);
    document.getElementById('predHWRange').textContent =
      `범위: ${fmtPred(hw.ci_low)} ~ ${fmtPred(hw.ci_high)}`;
  } else {
    document.getElementById('predHWPrice').innerHTML =
      `<span class="pred-error">오류: ${hwResult.reason.message}</span>`;
  }

  if (aiResult.status === 'fulfilled') {
    document.getElementById('predAIText').textContent = aiResult.value;
  } else {
    document.getElementById('predAIText').innerHTML =
      `<span class="pred-error">오류: ${aiResult.reason.message}</span>`;
  }
}

document.getElementById('predBtn').addEventListener('click', runPredictions);
document.getElementById('predClose').addEventListener('click', () => {
  document.getElementById('predPanel').style.display = 'none';
});

// ── 초기화 ──────────────────────────────────────────────
renderUserChips();
kRange = renderRangeButtons('kRanges', kInterval, kRange);
renderRangeButtons('sRanges', sInterval, sRange);
initKospi();
loadKospi(kRange);
