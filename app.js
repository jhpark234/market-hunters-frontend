let MH_SYMBOL_SLUG_CACHE = null;
async function mhLoadSymbolSlugMap(){
  if (MH_SYMBOL_SLUG_CACHE) return MH_SYMBOL_SLUG_CACHE;
  try {
    const res = await fetch('/symbol_slug_map.json', { cache: 'no-store' });
    MH_SYMBOL_SLUG_CACHE = res.ok ? await res.json() : {};
  } catch (_) {
    MH_SYMBOL_SLUG_CACHE = {};
  }
  return MH_SYMBOL_SLUG_CACHE;
}
function mhCurrentLang(){
  const p = window.location.pathname || '';
  return (document.documentElement.lang === 'en' || p.startsWith('/en/')) ? 'en' : 'ko';
}
async function mhStockUrl(symbol){
  const sym = String(symbol || '').trim().toUpperCase();
  const map = await mhLoadSymbolSlugMap();
  const entry = map?.[sym];
  if (entry) return mhCurrentLang() === 'en' ? entry.en_path : entry.ko_path;
  return mhCurrentLang() === 'en' ? `/en/stock.html?symbol=${encodeURIComponent(sym)}` : `/stock.html?symbol=${encodeURIComponent(sym)}`;
}
const API_BASE = "https://market-hunters-backend.onrender.com/api";
let currentMarket = 'ALL';

function signClass(value){ return Number(value) >= 0 ? "positive" : "negative"; }
function fmtChange(value){ const num = Number(value || 0); return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`; }
function escapeHtml(str){ return String(str ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
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
  const href = await mhStockUrl(item.symbol);
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
  const href = await mhStockUrl(item.symbol);
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
    target.innerHTML = `<div class="empty-state">종목명 또는 티커를 입력해줘.</div>`;
    return;
  }
  target.innerHTML = `<div class="empty-state">검색 중...</div>`;
  const res = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(q)}&market=${encodeURIComponent(currentMarket)}&limit=18`);
  const data = await res.json();
  target.innerHTML = data.items?.length ? data.items.map(searchCard).join('') : `<div class="empty-state">검색 결과가 없어. 다른 키워드로 다시 찾아봐.</div>`;
}

async function loadLegal(){
  const res = await fetch(`${API_BASE}/meta/legal`);
  const data = await res.json();
  const el = document.getElementById("legal-box");
  if(!el) return;
  const principles = (data.safe_analysis_principles || []).map(x => `<div class="brief-item">${escapeHtml(x)}</div>`).join("");
  el.innerHTML = `<div class="brief-item">${escapeHtml(data.legal_notice || "")}</div>${principles}`;
}

async function loadEconomic(){
  const res = await fetch(`${API_BASE}/economic/calendar`);
  const data = await res.json();
  const el = document.getElementById("economic");
  el.innerHTML = data.items.map(item => `
    <a class="economic-row economic-link" href="economic-detail.html?id=${encodeURIComponent(item.id)}">
      <div class="economic-main">
        <div class="economic-event">${item.event}</div>
        <div class="economic-note">${escapeHtml(item.country)} · ${escapeHtml(item.note)}</div>
      </div>
      <div class="economic-side">
        <div class="economic-time">${item.time}</div>
        <div class="economic-impact ${impactClass(item.impact)}">${item.impact}</div>
      </div>
    </a>`).join("");
}

function bindUI(){
  document.getElementById('search-btn').addEventListener('click', runSearch);
  document.getElementById('search-input').addEventListener('keydown', e => { if(e.key === 'Enter') runSearch(); });
  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      currentMarket = btn.dataset.market;
      if(document.getElementById('search-input').value.trim()) runSearch();
    });
  });
}

async function boot(){
  bindUI();
  await Promise.all([loadIndices(), loadMovers(), loadEconomic(), loadBrief(), loadLegal()]);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
boot();


// =========================
// MARKET TOP LOADER
// =========================

const API = "https://market-hunters-backend.onrender.com/api";

async function loadMarketTop(market) {

  const upRes = await fetch(`${API}/market/leaders?market=${market}&direction=up`)
  const downRes = await fetch(`${API}/market/leaders?market=${market}&direction=down`)

  const upData = await upRes.json()
  const downData = await downRes.json()

  renderList(`${market.toLowerCase()}-up`, upData.items)
  renderList(`${market.toLowerCase()}-down`, downData.items)
}

function renderList(id, items) {

  const el = document.getElementById(id)

  if (!el) return

  el.innerHTML = items.map(s => {

    const color = s.change_pct >= 0 ? "up" : "down"

    return `
      <div class="stock-row">
        <div class="name">${s.name}</div>
        <div class="pct ${color}">
          ${s.change_pct.toFixed(2)}%
        </div>
      </div>
    `
  }).join("")
}

async function loadAllMarkets(){

  await loadMarketTop("KOSPI")
  await loadMarketTop("KOSDAQ")
  await loadMarketTop("NASDAQ")

}
loadAllMarkets()
