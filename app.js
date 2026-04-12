let mhAppSymbolSlugMapPromise = null;

function mhLoadAppSymbolSlugMap() {
  if (!mhAppSymbolSlugMapPromise) {
    mhAppSymbolSlugMapPromise = fetch('/symbol_slug_map.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }
  return mhAppSymbolSlugMapPromise;
}

async function mhBuildAppStockHref(symbol, lang = 'ko') {
  const sym = String(symbol || '').trim().toUpperCase();
  if (!sym) return lang === 'en' ? '/en/stock.html' : 'stock.html';

  try {
    const map = await mhLoadAppSymbolSlugMap();
    const entry = map?.[sym];
    if (lang === 'en' && entry?.en_path) return entry.en_path;
    if (lang !== 'en' && entry?.ko_path) return entry.ko_path;
  } catch (_) {}

  return lang === 'en'
    ? `/en/stock.html?symbol=${encodeURIComponent(sym)}`
    : `stock.html?symbol=${encodeURIComponent(sym)}`;
}

const API_BASE = "https://market-hunters-backend.onrender.com/api";
let currentMarket = 'ALL';

function signClass(value){ return Number(value) >= 0 ? "positive" : "negative"; }
function fmtChange(value){ const num = Number(value || 0); return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`; }
function escapeHtml(str){ return String(str ?? '').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
function impactClass(impact){ return impact === '상' ? 'impact-high' : impact === '중' ? 'impact-medium' : 'impact-low'; }
function fmtPrice(v){ return (v === null || v === undefined || v === '') ? '-' : Number(v).toLocaleString('ko-KR'); }

async function loadIndices(){
  const res = await fetch(`${API_BASE}/market/indices`);
  const data = await res.json();
  const el = document.getElementById("indices");
  el.innerHTML = data.items.map(item => `
    <div class="index-row compact-row">
      <div class="index-left">
        <strong>${item.code}</strong>
        <span>${item.name}</span>
      </div>
      <div>
        <div class="index-value">${fmtPrice(item.value)}</div>
        <div class="change ${signClass(item.change_pct)}">${fmtChange(item.change_pct)}</div>
      </div>
    </div>
  `).join("");
}

async function stockTemplate(item, direction){
  const href = await mhBuildAppStockHref(item.symbol, 'ko');
  return `
    <a class="stock-row link-row" href="${href}">
      <div class="stock-top">
        <div>
          <div class="stock-name">${item.name}</div>
          <div class="stock-symbol">${item.symbol}</div>
        </div>
        <div class="stock-change ${direction}">${fmtChange(item.change_pct)}</div>
      </div>
      <div class="stock-why">현재가 ${fmtPrice(item.price)}</div>
    </a>`;
}

async function searchCard(item){
  const href = await mhBuildAppStockHref(item.symbol, 'ko');
  return `
    <a class="search-card link-row" href="${href}">
      <div>
        <div class="stock-name">${escapeHtml(item.name)}</div>
        <div class="stock-symbol">${escapeHtml(item.symbol)} · ${escapeHtml(item.market)}</div>
      </div>
      <div class="search-right">
        <div class="search-price">${fmtPrice(item.price)}</div>
        <div class="change ${signClass(item.change_pct)}">${fmtChange(item.change_pct)}</div>
      </div>
    </a>`;
}

async function loadMovers(){
  const [k1,k2,k3] = await Promise.all([
    fetch(`${API_BASE}/market/movers?market=KOSPI`).then(r=>r.json()),
    fetch(`${API_BASE}/market/movers?market=KOSDAQ`).then(r=>r.json()),
    fetch(`${API_BASE}/market/movers?market=NASDAQ`).then(r=>r.json()),
  ]);
  document.getElementById("kospi-up").innerHTML = (await Promise.all(k1.up.map(x => stockTemplate(x, "up")))).join("");
  document.getElementById("kospi-down").innerHTML = (await Promise.all(k1.down.map(x => stockTemplate(x, "down")))).join("");
  document.getElementById("kosdaq-up").innerHTML = (await Promise.all(k2.up.map(x => stockTemplate(x, "up")))).join("");
  document.getElementById("kosdaq-down").innerHTML = (await Promise.all(k2.down.map(x => stockTemplate(x, "down")))).join("");
  document.getElementById("nasdaq-up").innerHTML = (await Promise.all(k3.up.map(x => stockTemplate(x, "up")))).join("");
  document.getElementById("nasdaq-down").innerHTML = (await Promise.all(k3.down.map(x => stockTemplate(x, "down")))).join("");
}

async function loadBrief(){
  const res = await fetch(`${API_BASE}/ai/market-brief`);
  const data = await res.json();
  const el = document.getElementById("brief");
  el.innerHTML = `<div class="brief-item"><pre>${escapeHtml(data.brief)}</pre></div>`;
}

async function runSearch(){
  const q = document.getElementById('search-input').value.trim();
  const target = document.getElementById('search-results');
  if(!q){
    target.innerHTML = '<div class="empty-row">종목명 또는 티커를 입력하세요.</div>';
    return;
  }
  target.innerHTML = '<div class="empty-row">검색 중...</div>';
  const res = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(q)}&market=${encodeURIComponent(currentMarket)}`);
  const data = await res.json();
  const items = data.items || [];
  target.innerHTML = items.length ? (await Promise.all(items.map(searchCard))).join("") : '<div class="empty-row">검색 결과가 없습니다.</div>';
}

async function loadCalendar(){
  const res = await fetch(`${API_BASE}/economic/upcoming`);
  const data = await res.json();
  const el = document.getElementById("calendar-list");
  el.innerHTML = data.items.map(item => `
    <a class="economic-row economic-link" href="economic-detail.html?id=${encodeURIComponent(item.id)}">
      <div>
        <div class="economic-title">${escapeHtml(item.title)}</div>
        <div class="economic-meta">${escapeHtml(item.country)} · ${escapeHtml(item.date)}</div>
      </div>
      <span class="impact-chip ${impactClass(item.impact)}">${escapeHtml(item.impact)}</span>
    </a>
  `).join("");
}

function bindSearch(){
  const input = document.getElementById('search-input');
  document.getElementById('search-btn')?.addEventListener('click', runSearch);
  input?.addEventListener('keydown', e => { if(e.key === 'Enter') runSearch(); });
  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      currentMarket = btn.dataset.market || 'ALL';
      if(input?.value.trim()) runSearch();
    });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  bindSearch();
  await Promise.all([loadIndices(), loadMovers(), loadBrief(), loadCalendar()]);
});
