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
const API_BASE ="https://api.markethunters.kr/api";

function formatNumber(value) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    return "-";
  }
  return Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    return "-";
  }
  const n = Number(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function renderStockList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!items || !items.length) {
    el.innerHTML = `<div class="empty-row">데이터가 없습니다.</div>`;
    return;
  }

  Promise.all(items.map(async (item, idx) => {
    const pct = Number(item.change_pct ?? 0);
    const pctClass = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
    const name = item.name || item.symbol || "-";
    const symbol = item.symbol || "-";
    const price = formatNumber(item.price);
    const percent = formatPercent(item.change_pct);

    const href = await mhStockUrl(symbol);
    return `
      <a class="stock-row" href="${href}"
         style="
           display:grid;
           grid-template-columns:28px minmax(0,1fr) 92px;
           align-items:center;
           gap:10px;
           min-width:0;
         ">
        
        <div style="
          width:28px;
          height:28px;
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:rgba(255,255,255,.08);
          border:1px solid rgba(255,255,255,.06);
          color:#deebff;
          font-size:12px;
          font-weight:800;
          flex-shrink:0;
        ">
          ${idx + 1}
        </div>

        <div style="
          min-width:0;
          overflow:hidden;
          display:block;
        ">
          <div style="
            display:block;
            font-size:15px;
            font-weight:800;
            color:#f5f8ff;
            line-height:1.2;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          " title="${name}">
            ${name}
          </div>

          <div style="
            display:block;
            margin-top:3px;
            font-size:11px;
            color:rgba(190,205,230,.7);
            line-height:1.1;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          " title="${symbol}">
            ${symbol}
          </div>
        </div>

        <div style="
          width:92px;
          min-width:92px;
          text-align:right;
        ">
          <div style="
            display:block;
            font-size:15px;
            font-weight:800;
            color:#ffffff;
            line-height:1.2;
            white-space:nowrap;
            font-variant-numeric:tabular-nums;
          ">
            ${price}
          </div>

          <div class="stock-change ${pctClass}" style="
            display:block;
            margin-top:3px;
            font-size:12px;
            font-weight:800;
            line-height:1.1;
            white-space:nowrap;
            font-variant-numeric:tabular-nums;
          ">
            ${percent}
          </div>
        </div>
      </a>
    `;
  })).then((rows) => {
    el.innerHTML = rows.join("");
  });
}

async function fetchLeaders(market, direction, limit = 10) {
  const url = `${API_BASE}/market/leaders?market=${encodeURIComponent(market)}&direction=${encodeURIComponent(direction)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`leaders fetch failed: ${res.status}`);
  return res.json();
}

async function loadPair(market, upId, downId) {
  try {
    const up = await fetchLeaders(market,"up",10);
    const down = await fetchLeaders(market,"down",10);

    renderStockList(upId, up.items || []);
    renderStockList(downId, down.items || []);
  } catch(err) {
    console.error(err);
    const ids=[upId,downId];
    ids.forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.innerHTML=`<div class="empty-row">TOP 데이터를 불러오지 못했습니다.</div>`;
    });
  }
}

async function loadMarketTopBoards() {

  // 1️⃣ 코스피 먼저
  await loadPair("KOSPI","kospi-up","kospi-down");

  // 2️⃣ 코스닥
  await loadPair("KOSDAQ","kosdaq-up","kosdaq-down");

  // 3️⃣ 나스닥 (약간 늦게)
  setTimeout(()=>{
    loadPair("NASDAQ","nasdaq-up","nasdaq-down");
  },150);
}

document.addEventListener("DOMContentLoaded", loadMarketTopBoards);