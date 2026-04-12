const API_BASE = "https://api.markethunters.kr/api";

let mhTopSymbolSlugMapPromise = null;

function mhGetTopPageLang() {
  const lang = String(document.documentElement.lang || "ko").toLowerCase();
  return lang.startsWith("en") ? "en" : "ko";
}

function mhLoadTopSymbolSlugMap() {
  if (!mhTopSymbolSlugMapPromise) {
    mhTopSymbolSlugMapPromise = fetch("/symbol_slug_map.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .catch((err) => {
        console.warn("symbol_slug_map.json load failed:", err);
        return {};
      });
  }
  return mhTopSymbolSlugMapPromise;
}

function mhGetTopLegacyStockHref(symbol, lang) {
  const sym = encodeURIComponent(String(symbol || "").trim().toUpperCase());
  if (!sym) return lang === "en" ? "/en/stock.html" : "/stock.html";
  return lang === "en"
    ? `/en/stock.html?symbol=${sym}`
    : `/stock.html?symbol=${sym}`;
}

async function mhBuildTopStockHref(symbol) {
  const sym = String(symbol || "").trim().toUpperCase();
  const lang = mhGetTopPageLang();

  if (!sym) {
    return mhGetTopLegacyStockHref("", lang);
  }

  try {
    const map = await mhLoadTopSymbolSlugMap();
    const entry = map?.[sym];

    if (entry) {
      const preferredPath = lang === "en" ? entry.en_path : entry.ko_path;
      const fallbackPath = lang === "en" ? entry.ko_path : entry.en_path;
      const resolvedPath = String(preferredPath || fallbackPath || "").trim();

      if (resolvedPath) {
        return resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
      }
    }
  } catch (err) {
    console.warn("mhBuildTopStockHref error:", err);
  }

  return mhGetTopLegacyStockHref(sym, lang);
}

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

function getEmptyTopMessage() {
  return mhGetTopPageLang() === "en"
    ? "No data available."
    : "데이터가 없습니다.";
}

function getTopLoadFailMessage() {
  return mhGetTopPageLang() === "en"
    ? "Unable to load TOP data."
    : "TOP 데이터를 불러오지 못했습니다.";
}

async function renderStockList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!items || !items.length) {
    el.innerHTML = `<div class="empty-row">${getEmptyTopMessage()}</div>`;
    return;
  }

  const rows = await Promise.all(items.map(async (item, idx) => {
    const pct = Number(item?.change_pct ?? 0);
    const pctClass = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
    const name = item?.name || item?.symbol || "-";
    const symbol = item?.symbol || "-";
    const price = formatNumber(item?.price);
    const percent = formatPercent(item?.change_pct);
    const href = await mhBuildTopStockHref(symbol);

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
  }));

  el.innerHTML = rows.join("");
}

async function fetchLeaders(market, direction, limit = 10) {
  const url = `${API_BASE}/market/leaders?market=${encodeURIComponent(market)}&direction=${encodeURIComponent(direction)}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`leaders fetch failed: ${res.status}`);
  return res.json();
}

async function loadPair(market, upId, downId) {
  try {
    const up = await fetchLeaders(market, "up", 10);
    const down = await fetchLeaders(market, "down", 10);

    await renderStockList(upId, up?.items || []);
    await renderStockList(downId, down?.items || []);
  } catch (err) {
    console.error(err);
    const ids = [upId, downId];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="empty-row">${getTopLoadFailMessage()}</div>`;
    });
  }
}

async function loadMarketTopBoards() {
  await loadPair("KOSPI", "kospi-up", "kospi-down");
  await loadPair("KOSDAQ", "kosdaq-up", "kosdaq-down");
  setTimeout(() => {
    loadPair("NASDAQ", "nasdaq-up", "nasdaq-down");
  }, 150);
}

document.addEventListener("DOMContentLoaded", loadMarketTopBoards);