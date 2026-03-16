/* ────────────────────────────────────────────────────────
   한국 주식 차트 앱
   백엔드: localhost:3000 (server.ps1)
──────────────────────────────────────────────────────── */

const API = '';   // 같은 오리진

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
  new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth })).observe(el);
  return { chart, candle, vol };
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

function intervalFor(range) {
  return range === '5y' ? '1wk' : '1d';
}

function setRangeActive(groupId, activeRange) {
  document.querySelectorAll(`#${groupId} .rbtn`).forEach(b => {
    b.classList.toggle('active', b.dataset.r === activeRange);
  });
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
  inst.chart.timeScale().fitContent();
}

// ── KOSPI ───────────────────────────────────────────────
let kInst = null;
let kRange = '1mo';

function initKospi() {
  kInst = makeChart('kChart');
}

async function loadKospi(range) {
  loading(true);
  try {
    const d = await fetchChart('^KS11', range, intervalFor(range));
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
let curSym = null, curName = null, sRange = '1mo';

async function loadStock(symbol, name, range) {
  const card = document.getElementById('sCard');
  card.style.display = 'block';
  if (!sInst) sInst = makeChart('sChart');
  loading(true);
  try {
    const d = await fetchChart(symbol, range, intervalFor(range));
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

// ── 이벤트 ──────────────────────────────────────────────
document.getElementById('kRanges').addEventListener('click', e => {
  const btn = e.target.closest('.rbtn');
  if (!btn) return;
  kRange = btn.dataset.r;
  setRangeActive('kRanges', kRange);
  loadKospi(kRange);
});

document.getElementById('sRanges').addEventListener('click', e => {
  const btn = e.target.closest('.rbtn');
  if (!btn) return;
  sRange = btn.dataset.r;
  setRangeActive('sRanges', sRange);
  if (curSym) loadStock(curSym, curName, sRange);
});

document.getElementById('chipList').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  curSym = chip.dataset.s;
  curName = chip.dataset.n;
  sRange = '1mo';
  setRangeActive('sRanges', sRange);
  loadStock(curSym, curName, sRange);
});

// ── 검색 ────────────────────────────────────────────────
let sTimer;
const searchInput   = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', () => {
  clearTimeout(sTimer);
  const q = searchInput.value.trim();
  if (!q) { searchResults.style.display = 'none'; return; }
  sTimer = setTimeout(async () => {
    try {
      const items = await fetchSearch(q);
      searchResults.innerHTML = '';
      if (!items.length) {
        searchResults.innerHTML = '<li style="color:var(--muted);cursor:default">검색 결과 없음</li>';
      } else {
        items.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="r-name">${item.name}</span><span class="r-sym">${item.symbol}</span>`;
          li.onclick = () => {
            searchResults.style.display = 'none';
            searchInput.value = '';
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            curSym = item.symbol; curName = item.name; sRange = '1mo';
            setRangeActive('sRanges', sRange);
            loadStock(curSym, curName, sRange);
          };
          searchResults.appendChild(li);
        });
      }
      searchResults.style.display = 'block';
    } catch { /* 무시 */ }
  }, 350);
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) searchResults.style.display = 'none';
});

// ── 초기화 ──────────────────────────────────────────────
initKospi();
loadKospi('1mo');
