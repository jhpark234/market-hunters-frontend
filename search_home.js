const MH_API_BASE ="https://api.markethunters.kr/api";

let mhCurrentMarket = 'ALL';

let mhSlugMapPromise = null;

function mhLoadSlugMap() {
  if (!mhSlugMapPromise) {
    mhSlugMapPromise = fetch('/slug_map.json', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }
  return mhSlugMapPromise;
}

function mhStockHref(symbol) {
  const safe = String(symbol || '').trim().toUpperCase();
  const slugMap = window.__MH_SLUG_MAP__ || {};
  for (const [slug, mappedSymbol] of Object.entries(slugMap)) {
    const canonical = String(mappedSymbol || '').trim().toUpperCase();
    if (!canonical) continue;
    if (canonical === safe || canonical.replace(/\.(KS|KQ)$/i, '') === safe.replace(/\.(KS|KQ)$/i, '')) {
      return `/stocks/${slug}/`;
    }
  }
  return `stock.html?symbol=${encodeURIComponent(safe)}`;
}


function mhEscapeHtml(str) {
  return String(str ?? '').replace(/[&<>\"]/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}

function mhFmtPrice(v) {
  return (v === null || v === undefined || v === '') ? '-' : Number(v).toLocaleString('ko-KR');
}

function mhFmtChange(value) {
  const num = Number(value || 0);
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
}

function mhSignClass(value) {
  return Number(value) >= 0 ? 'positive' : 'negative';
}

function mhRenderSearchCard(item) {
  return `
    <a class="search-card link-row" href="${mhStockHref(item.symbol)}">
      <div>
        <div class="stock-name">${mhEscapeHtml(item.name)}</div>
        <div class="stock-symbol">${mhEscapeHtml(item.symbol)} · ${mhEscapeHtml(item.market || '-')}</div>
      </div>
      <div class="search-right">
        <div class="search-price">${mhFmtPrice(item.price)}</div>
        <div class="change ${mhSignClass(item.change_pct)}">${mhFmtChange(item.change_pct)}</div>
      </div>
    </a>`;
}

async function mhRunSearch() {
  const input = document.getElementById('search-input');
  const target = document.getElementById('search-results');
  if (!input || !target) return;

  const q = input.value.trim();

  // ⭐ GA4 이벤트
  if (typeof gtag === "function") {
    gtag('event','search_stock',{
      search_term: q
    });
  }
  
  if (!q) {
    target.innerHTML = '<div class="empty-state">종목명 또는 티커를 입력해줘.</div>';
    return;
  }

  target.innerHTML = '<div class="empty-state">검색 중...</div>';

  try {
    window.__MH_SLUG_MAP__ = await mhLoadSlugMap();
    const res = await fetch(`${MH_API_BASE}/stocks/search?q=${encodeURIComponent(q)}&market=${encodeURIComponent(mhCurrentMarket)}&limit=18`);
    if (!res.ok) throw new Error(`search failed: ${res.status}`);
    const data = await res.json();
    const items = data.items || [];

    target.innerHTML = items.length
      ? items.map(mhRenderSearchCard).join('')
      : '<div class="empty-state">검색 결과가 없습니다.</div>';
  } catch (err) {
    target.innerHTML = '<div class="empty-state">검색 중 오류가 발생했습니다.</div>';
    console.error(err);
  }
}

function mhBindSearchHome() {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  const segBtns = document.querySelectorAll('.seg-btn');

  searchBtn?.addEventListener('click', mhRunSearch);
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') mhRunSearch();
  });

  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      segBtns.forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
      mhCurrentMarket = btn.dataset.market || 'ALL';
      if ((searchInput?.value || '').trim()) mhRunSearch();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mhBindSearchHome);
} else {
  mhBindSearchHome();
}
