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
const MH_API_BASE ="https://api.markethunters.kr/api";

let mhCurrentMarket = 'ALL';

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

async function mhRenderSearchCard(item) {
  const href = await mhStockUrl(item.symbol);
  return `
    <a class="search-card link-row" href="${href}">
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
    const res = await fetch(`${MH_API_BASE}/stocks/search?q=${encodeURIComponent(q)}&market=${encodeURIComponent(mhCurrentMarket)}&limit=18`);
    if (!res.ok) throw new Error(`search failed: ${res.status}`);
    const data = await res.json();
    const items = data.items || [];

    if (items.length) {
      const cards = await Promise.all(items.map(mhRenderSearchCard));
      target.innerHTML = cards.join('');
    } else {
      target.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
    }
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
