const MH_API_BASE = "https://api.markethunters.kr/api";

let mhCurrentMarket = "ALL";
let mhSymbolSlugMapPromise = null;

function mhEscapeHtml(str) {
  return String(str ?? "").replace(/[&<>"]/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[s]));
}

function mhFmtPrice(v) {
  return v === null || v === undefined || v === ""
    ? "-"
    : Number(v).toLocaleString("ko-KR");
}

function mhFmtChange(value) {
  const num = Number(value || 0);
  return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function mhSignClass(value) {
  return Number(value) >= 0 ? "positive" : "negative";
}

function mhGetPageLang() {
  const lang = String(document.documentElement.lang || "ko").toLowerCase();
  return lang.startsWith("en") ? "en" : "ko";
}

function mhGetLegacyStockHref(symbol, lang) {
  const safeSymbol = encodeURIComponent(String(symbol || "").trim().toUpperCase());
  return lang === "en"
    ? `/en/stock.html?symbol=${safeSymbol}`
    : `/stock.html?symbol=${safeSymbol}`;
}

function mhLoadSymbolSlugMap() {
  if (!mhSymbolSlugMapPromise) {
    mhSymbolSlugMapPromise = fetch("/symbol_slug_map.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .catch((err) => {
        console.warn("symbol_slug_map.json load failed:", err);
        return {};
      });
  }
  return mhSymbolSlugMapPromise;
}

async function mhResolveStockHref(item) {
  const lang = mhGetPageLang();
  const symbol = String(item?.symbol || "").trim().toUpperCase();

  if (!symbol) return "#";

  try {
    const map = await mhLoadSymbolSlugMap();
    const entry = map?.[symbol];

    if (entry) {
      const preferredPath = lang === "en" ? entry.en_path : entry.ko_path;
      const fallbackPath = lang === "en" ? entry.ko_path : entry.en_path;
      const resolvedPath = String(preferredPath || fallbackPath || "").trim();

      if (resolvedPath) {
        return resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
      }
    }
  } catch (err) {
    console.warn("mhResolveStockHref error:", err);
  }

  return mhGetLegacyStockHref(symbol, lang);
}

function mhRenderSearchCard(item, href) {
  return `
    <a class="search-card link-row" href="${mhEscapeHtml(href)}">
      <div>
        <div class="stock-name">${mhEscapeHtml(item.name)}</div>
        <div class="stock-symbol">${mhEscapeHtml(item.symbol)} · ${mhEscapeHtml(item.market || "-")}</div>
      </div>
      <div class="search-right">
        <div class="search-price">${mhFmtPrice(item.price)}</div>
        <div class="change ${mhSignClass(item.change_pct)}">${mhFmtChange(item.change_pct)}</div>
      </div>
    </a>`;
}

async function mhRunSearch() {
  const input = document.getElementById("search-input");
  const target = document.getElementById("search-results");
  if (!input || !target) return;

  const q = input.value.trim();

  if (typeof gtag === "function") {
    gtag("event", "search_stock", {
      search_term: q,
    });
  }

  if (!q) {
    target.innerHTML = '<div class="empty-state">종목명 또는 티커를 입력해줘.</div>';
    return;
  }

  target.innerHTML = '<div class="empty-state">검색 중...</div>';

  try {
    const res = await fetch(
      `${MH_API_BASE}/stocks/search?q=${encodeURIComponent(q)}&market=${encodeURIComponent(mhCurrentMarket)}&limit=18`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`search failed: ${res.status}`);
    }

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      target.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
      return;
    }

    const renderedCards = await Promise.all(
      items.map(async (item) => {
        const href = await mhResolveStockHref(item);
        return mhRenderSearchCard(item, href);
      })
    );

    target.innerHTML = renderedCards.join("");
  } catch (err) {
    target.innerHTML = '<div class="empty-state">검색 중 오류가 발생했습니다.</div>';
    console.error(err);
  }
}

function mhBindSearchHome() {
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("search-input");
  const segBtns = document.querySelectorAll(".seg-btn");

  searchBtn?.addEventListener("click", mhRunSearch);

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") mhRunSearch();
  });

  segBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      segBtns.forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      mhCurrentMarket = btn.dataset.market || "ALL";
      if ((searchInput?.value || "").trim()) mhRunSearch();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mhBindSearchHome);
} else {
  mhBindSearchHome();
}