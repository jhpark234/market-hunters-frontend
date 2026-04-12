(function(){
  let mapPromise = null;
  function loadMap(){
    if(!mapPromise){
      mapPromise = fetch('/symbol_slug_map.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({}));
    }
    return mapPromise;
  }
  function isEn(){
    const p = window.location.pathname || '';
    return document.documentElement.lang === 'en' || p.startsWith('/en/');
  }
  function extractSymbol(href){
    try {
      const u = new URL(href, window.location.origin);
      const p = u.pathname || '';
      if (!(/\/stock\.html$/i.test(p) || /\/en\/stock\.html$/i.test(p))) return '';
      return String(u.searchParams.get('symbol') || '').trim().toUpperCase();
    } catch (_) { return ''; }
  }
  async function rewrite(){
    const map = await loadMap();
    document.querySelectorAll('a[href*="stock.html?symbol="]').forEach(a => {
      const sym = extractSymbol(a.getAttribute('href'));
      const entry = map?.[sym];
      if (!sym || !entry) return;
      a.setAttribute('href', isEn() ? entry.en_path : entry.ko_path);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', rewrite); } else { rewrite(); }
})();
