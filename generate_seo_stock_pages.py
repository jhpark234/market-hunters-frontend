#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import quote
from datetime import datetime, timezone
from xml.sax.saxutils import escape as xesc
import json, re, html, shutil
import pandas as pd

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / 'stock_slug_reference_700.csv'
ASSET_VERSION = '20260412-seo1'
DATE_TAG = datetime.now(timezone.utc).strftime('%Y-%m-%d')

WORD_OVERRIDES = {
    'sk':'SK','lg':'LG','kb':'KB','nh':'NH','hlb':'HLB','hd':'HD','db':'DB','bnk':'BNK','kt':'KT','cj':'CJ','posco':'POSCO',
    'naver':'NAVER','hybe':'HYBE','kakao':'Kakao','hanwha':'Hanwha','skt':'SKT','sbi':'SBI','kg':'KG','ls':'LS','gs':'GS','lx':'LX','jb':'JB'
}

def norm_space(s):
    return re.sub(r'\s+', ' ', str(s or '')).strip()

def has_hangul(s):
    return bool(re.search(r'[\uac00-\ud7a3]', s or ''))

def clean_ko_slug(name):
    s = norm_space(name)
    s = s.replace('/', ' ').replace('&', ' ').replace('+', ' ')
    s = re.sub(r'[^0-9A-Za-z\uac00-\ud7a3\s-]', '', s)
    s = s.strip().replace(' ', '-')
    s = re.sub(r'-{2,}', '-', s).strip('-')
    return s.lower() if not has_hangul(s) else s

def title_from_slug(slug):
    parts = [p for p in str(slug).split('-') if p]
    out=[]
    for p in parts:
        low=p.lower()
        if low in WORD_OVERRIDES:
            out.append(WORD_OVERRIDES[low])
        elif p.isupper() and len(p)<=5:
            out.append(p)
        elif re.fullmatch(r'[A-Z0-9]+', p):
            out.append(p)
        else:
            out.append(p.capitalize())
    return ' '.join(out)

def derive_name_en(name_en, slug):
    name_en = norm_space(name_en)
    if name_en and not has_hangul(name_en):
        return name_en
    return title_from_slug(slug)

def prepare_records(df):
    records=[]
    used_ko=set(); used_en=set()
    for _, row in df.iterrows():
        symbol = norm_space(row['symbol']).upper()
        slug_base = norm_space(row.get('slug','')).lower().strip('-')
        name_kr = norm_space(row.get('name_kr',''))
        name_en = derive_name_en(row.get('name_en',''), slug_base)
        market = norm_space(row.get('market','')) or ('KOSPI' if symbol.endswith('.KS') else 'KOSDAQ' if symbol.endswith('.KQ') else 'NASDAQ')
        exchange = norm_space(row.get('exchange','')) or ('KRX' if symbol.endswith(('.KS','.KQ')) else 'NASDAQ')
        currency = 'KRW' if symbol.endswith(('.KS','.KQ')) else 'USD'

        en_slug = f"{slug_base}-stock-forecast" if slug_base and not slug_base.endswith('stock-forecast') else (slug_base or re.sub(r'[^a-z0-9]+','-',symbol.lower()).strip('-')+'-stock-forecast')
        en_slug = re.sub(r'-{2,}','-',en_slug).strip('-')
        ko_slug = re.sub(r'-{2,}','-',f"{clean_ko_slug(name_kr or symbol)}-주가-전망").strip('-')

        en_try=en_slug; i=2
        while en_try in used_en:
            en_try=f"{en_slug}-{i}"; i+=1
        en_slug=en_try; used_en.add(en_slug)

        ko_try=ko_slug; i=2
        while ko_try in used_ko:
            suffix=clean_ko_slug(symbol)
            ko_try=f"{ko_slug}-{suffix}" if i==2 else f"{ko_slug}-{suffix}-{i}"
            i+=1
        ko_slug=ko_try; used_ko.add(ko_slug)

        records.append({
            'symbol':symbol,'market':market,'exchange':exchange,'currency':currency,
            'name_kr':name_kr,'name_en':name_en,'base_slug':slug_base,
            'ko_slug':ko_slug,'en_slug':en_slug,
        })
    return records

def build_maps(records):
    slug_map={}
    symbol_map={}
    for rec in records:
        slug_map[rec['ko_slug']] = rec['symbol']
        slug_map[rec['en_slug']] = rec['symbol']
        symbol_map[rec['symbol']] = {
            'ko_slug': rec['ko_slug'], 'en_slug': rec['en_slug'],
            'ko_path': '/stocks/' + quote(rec['ko_slug'], safe='-._~/') + '/',
            'en_path': '/en/stocks/' + quote(rec['en_slug'], safe='-._~/') + '/',
            'name_kr': rec['name_kr'], 'name_en': rec['name_en'],
            'market': rec['market'], 'exchange': rec['exchange'], 'currency': rec['currency'],
        }
    return slug_map, symbol_map

def page_html(rec, symbol_map, lang='ko'):
    is_en = lang == 'en'
    name = rec['name_en'] if is_en else rec['name_kr']
    symbol = rec['symbol']
    market = rec['market']
    exchange = rec['exchange']
    currency = rec['currency']
    canonical_path = symbol_map[symbol]['en_path' if is_en else 'ko_path']
    alt_path = symbol_map[symbol]['ko_path' if is_en else 'en_path']
    canonical = 'https://markethunters.kr' + canonical_path
    alt = 'https://markethunters.kr' + alt_path
    title = f"{name} Stock Forecast 2026 | AI Analysis | MarketHunters" if is_en else f"{name} 주가 전망 2026 | AI 분석 | MarketHunters"
    desc = (f"AI analysis, live price chart, news summary, and market commentary for {name} ({symbol})." if is_en else f"{name}({symbol}) 주가 전망, AI 분석, 실시간 차트, 뉴스 요약과 시장 해설을 확인하세요.")
    subtitle = (f"{name} ({symbol}) AI stock analysis, live chart, and news summary." if is_en else f"{name} ({symbol}) AI 종목 분석, 실시간 차트, 뉴스 요약 페이지")
    intro_h2 = 'What you can check on this page' if is_en else '이 페이지에서 확인할 수 있는 내용'
    intro_items = [
        f"{name} ({symbol}) live price and chart" if is_en else f"{name}({symbol}) 실시간 가격과 차트",
        'AI stock analysis and key risk points' if is_en else 'AI 종목 분석과 핵심 리스크 포인트',
        'News summary and recent headlines' if is_en else '뉴스 요약과 최근 헤드라인'
    ]
    back = '← Home' if is_en else '← 홈'
    labels = {
        'price':'Price' if is_en else '현재가','change':'Change' if is_en else '등락','industry':'Sector / Note' if is_en else '산업 / 메모','summary':'Summary' if is_en else '요약','rating':'AI Rating' if is_en else 'AI 별점','recent':'Recent Price Trend' if is_en else '최근 가격 추이','analysis':'AI Stock Analysis' if is_en else 'AI 종목 분석','news':'News Summary' if is_en else '뉴스 한글 요약','latest':'Latest News' if is_en else '최근 뉴스','notice':'Notice' if is_en else '안내','generated':'Generated' if is_en else '생성','loading_price':'Loading live data...' if is_en else '실시간 데이터 로딩 중...','loading_summary':'Live AI content will load automatically after the page opens.' if is_en else '페이지가 열리면 실시간 AI 콘텐츠가 자동으로 로드됩니다.','notice_text':'This page provides information only and is not investment advice.' if is_en else '이 페이지의 정보는 참고용이며 투자 자문이 아닙니다.','about':'About' if is_en else '소개','privacy':'Privacy Policy' if is_en else '개인정보처리방침','terms':'Terms of Service' if is_en else '이용약관','contact':'Contact' if is_en else '문의'
    }
    home_href = '/en/index.html' if is_en else '/index.html'
    footer_prefix = '/en/' if is_en else '/'
    jsonld = {'@context':'https://schema.org','@type':'WebPage','name':title,'url':canonical,'description':desc,'inLanguage':'en' if is_en else 'ko','dateModified':DATE_TAG,'isPartOf':{'@type':'WebSite','name':'MarketHunters','url':'https://markethunters.kr/'},'about':{'@type':'Thing','name':name}}
    breadcrumb = {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'MarketHunters','item':'https://markethunters.kr/' + ('en/' if is_en else '')},{'@type':'ListItem','position':2,'name':'Stocks','item':'https://markethunters.kr/' + ('en/' if is_en else '') + 'stocks.html'},{'@type':'ListItem','position':3,'name':name,'item':canonical}]}
    return f'''<!DOCTYPE html>
<html lang="{'en' if is_en else 'ko'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>{html.escape(title)}</title>
  <meta name="description" content="{html.escape(desc)}" />
  <meta name="keywords" content="{html.escape(name)}, {html.escape(symbol)}, {'stock forecast, AI stock analysis' if is_en else '주가 전망, AI 종목 분석'}" />
  <meta name="author" content="MarketHunters" />
  <meta name="theme-color" content="#07172f" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="{canonical}" />
  <link rel="alternate" hreflang="{'ko' if is_en else 'en'}" href="{alt}" />
  <link rel="alternate" hreflang="{'en' if is_en else 'ko'}" href="{canonical}" />
  <link rel="alternate" hreflang="x-default" href="{canonical}" />
  <meta property="og:title" content="{html.escape(title)}" />
  <meta property="og:description" content="{html.escape(desc)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="{canonical}" />
  <meta property="og:image" content="https://markethunters.kr/assets/og-card.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{html.escape(title)}" />
  <meta name="twitter:description" content="{html.escape(desc)}" />
  <meta name="twitter:image" content="https://markethunters.kr/assets/og-card.svg" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="icon" href="/assets/logo.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/style.css?v={ASSET_VERSION}" />
  <script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>
  <script type="application/ld+json">{json.dumps(breadcrumb, ensure_ascii=False)}</script>
</head>
<body>
  <div class="mobile-app-shell">
    <div class="detail-shell">
      <header class="detail-topbar compact-topbar">
        <a href="{home_href}" class="back-link">{back}</a>
        <div class="detail-title-wrap stock-title-wrap">
          <div class="detail-kicker">Stock Intelligence</div>
          <h1 id="stock-title">{html.escape(name)}</h1>
          <p id="stock-subtitle">{html.escape(subtitle)}</p>
          <div class="lang-switch">
            <a href="{symbol_map[symbol]['ko_path']}" class="lang-btn" data-lang="ko">KR</a>
            <a href="{symbol_map[symbol]['en_path']}" class="lang-btn" data-lang="en">EN</a>
          </div>
        </div>
      </header>
      <section class="detail-card">
        <h2>{intro_h2}</h2>
        <div class="bullet-list">
          <div>• {html.escape(intro_items[0])}</div>
          <div>• {html.escape(intro_items[1])}</div>
          <div>• {html.escape(intro_items[2])}</div>
        </div>
      </section>
      <section class="detail-grid stock-detail-grid">
        <div class="detail-card">
          <div class="detail-meta-row">
            <span id="stock-market" class="detail-pill">{html.escape(market)}</span>
            <span id="stock-exchange" class="detail-pill ghost">{html.escape(exchange)}</span>
            <span id="stock-currency" class="detail-pill ghost">{html.escape(currency)}</span>
          </div>
          <div class="metric-grid">
            <div class="metric-card"><div class="metric-label">{labels['price']}</div><div class="metric-value" id="stock-price">{labels['loading_price']}</div></div>
            <div class="metric-card"><div class="metric-label">{labels['change']}</div><div class="metric-value stock-change flat" id="stock-change">-</div></div>
            <div class="metric-card"><div class="metric-label">{labels['industry']}</div><div class="metric-value small" id="stock-industry">{html.escape(market)} · {html.escape(symbol)}</div></div>
            <div class="metric-card"><div class="metric-label">{labels['summary']}</div><div class="metric-value small" id="stock-summary">{html.escape(labels['loading_summary'])}</div></div>
            <div class="metric-card metric-card-wide"><div class="metric-label">{labels['rating']}</div><div class="metric-value small" id="stock-rating">-</div></div>
          </div>
        </div>
        <div class="detail-card">
          <div class="chart-header-row"><h2>{labels['recent']}</h2><select id="chart-period" class="period-select"><option value="1D">1D</option><option value="1W">1W</option><option value="1M" selected>1M</option><option value="6M">6M</option></select></div>
          <canvas id="stock-chart" height="280"></canvas>
        </div>
      </section>
      <section class="detail-grid second">
        <div class="detail-card"><h2>{labels['analysis']}</h2><div id="stock-ai-time" class="meta-time">{labels['generated']}: -</div><div id="stock-ai-brief" class="bullet-list"><div>• {html.escape(labels['loading_summary'])}</div></div></div>
        <div class="detail-card"><h2>{labels['news']}</h2><div id="news-summary-time" class="meta-time">{labels['generated']}: -</div><div id="news-summary" class="bullet-list"><div>• {html.escape(labels['loading_summary'])}</div></div><h3>{labels['latest']}</h3><div id="news-list" class="history-table"></div></div>
      </section>
      <section id="mh-seo-sections" class="mh-seo-wrap" aria-label="SEO related stocks sections"></section>
      <section class="detail-card disclaimer-card"><h2>{labels['notice']}</h2><div id="stock-legal" class="bullet-list"><div>• {html.escape(labels['notice_text'])}</div></div></section>
    </div>
    <footer style="margin: 30px 0 90px 0; padding: 16px 20px; font-size: 14px; color: #9aa4b2; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
      <a href="{footer_prefix}about.html" style="color:#9aa4b2; text-decoration:none; margin:0 6px;">{labels['about']}</a>
      <span>|</span>
      <a href="{footer_prefix}privacy.html" style="color:#9aa4b2; text-decoration:none; margin:0 6px;">{labels['privacy']}</a>
      <span>|</span>
      <a href="{footer_prefix}terms.html" style="color:#9aa4b2; text-decoration:none; margin:0 6px;">{labels['terms']}</a>
      <span>|</span>
      <a href="{footer_prefix}contact.html" style="color:#9aa4b2; text-decoration:none; margin:0 6px;">{labels['contact']}</a>
    </footer>
  </div>
  <script src="/stock.js?v={ASSET_VERSION}"></script>
  <script src="/seo_links.js?v=20260412-1" defer></script>
  <script src="/stock_seo_sections.js?v=20260412-1" defer></script>
</body>
</html>'''

def patch_js_files():
    stock_js = (ROOT/'stock.js').read_text(encoding='utf-8')
    if 'symbolSlugMapPromise' not in stock_js:
        stock_js = stock_js.replace('function loadSlugMap() {', '''let symbolSlugMapPromise = null;\n\nfunction loadSymbolSlugMap() {\n  if (!symbolSlugMapPromise) {\n    symbolSlugMapPromise = fetch("/symbol_slug_map.json", { cache: "no-store" })\n      .then((res) => (res.ok ? res.json() : {}))\n      .catch(() => ({}));\n  }\n  return symbolSlugMapPromise;\n}\n\nasync function getPrettyPathForSymbol(inputSymbol, lang) {\n  const sym = String(inputSymbol || "").trim().toUpperCase();\n  if (!sym) return "";\n  try {\n    const map = await loadSymbolSlugMap();\n    const entry = map?.[sym];\n    if (!entry) return "";\n    return lang === "en" ? String(entry.en_path || "") : String(entry.ko_path || "");\n  } catch (_) {\n    return "";\n  }\n}\n\nasync function updateLanguageLinksForSymbol(inputSymbol) {\n  const sym = String(inputSymbol || canonicalSymbol || rawSymbol || "").trim().toUpperCase();\n  const krBtn = document.querySelector('a[data-lang="ko"]') || document.querySelector('a[href="/stock.html"]');\n  const enBtn = document.querySelector('a[data-lang="en"]') || document.querySelector('a[href="/en/stock.html"]');\n  if (!sym) return;\n  const [koPath, enPath] = await Promise.all([getPrettyPathForSymbol(sym, "ko"), getPrettyPathForSymbol(sym, "en")]);\n  if (krBtn) krBtn.href = koPath || `/stock.html?symbol=${encodeURIComponent(sym)}`;\n  if (enBtn) enBtn.href = enPath || `/en/stock.html?symbol=${encodeURIComponent(sym)}`;\n}\n\nfunction loadSlugMap() {''', 1)
    stock_js = re.sub(r'/\* ============================= \*/\n/\* Language switch keep symbol   \*/\n/\* ============================= \*/\n\(function \(\) \{.*?\}\)\(\);', '/* ============================= */\n/* Language switch keep symbol   */\n/* ============================= */', stock_js, flags=re.S)
    stock_js = stock_js.replace('    updateSEO(detail, overview?.meta || {});', '    updateSEO(detail, overview?.meta || {});\n    await updateLanguageLinksForSymbol(canonicalSymbol || finalSymbol);')
    (ROOT/'stock.js').write_text(stock_js, encoding='utf-8')

    prefix = """let MH_SYMBOL_SLUG_CACHE = null;\nasync function mhLoadSymbolSlugMap(){\n  if (MH_SYMBOL_SLUG_CACHE) return MH_SYMBOL_SLUG_CACHE;\n  try {\n    const res = await fetch('/symbol_slug_map.json', { cache: 'no-store' });\n    MH_SYMBOL_SLUG_CACHE = res.ok ? await res.json() : {};\n  } catch (_) {\n    MH_SYMBOL_SLUG_CACHE = {};\n  }\n  return MH_SYMBOL_SLUG_CACHE;\n}\nfunction mhCurrentLang(){\n  const p = window.location.pathname || '';\n  return (document.documentElement.lang === 'en' || p.startsWith('/en/')) ? 'en' : 'ko';\n}\nasync function mhStockUrl(symbol){\n  const sym = String(symbol || '').trim().toUpperCase();\n  const map = await mhLoadSymbolSlugMap();\n  const entry = map?.[sym];\n  if (entry) return mhCurrentLang() === 'en' ? entry.en_path : entry.ko_path;\n  return mhCurrentLang() === 'en' ? `/en/stock.html?symbol=${encodeURIComponent(sym)}` : `/stock.html?symbol=${encodeURIComponent(sym)}`;\n}\n"""

    for fname in ['app.js','search_home.js','market_top10.js']:
        txt = (ROOT/fname).read_text(encoding='utf-8')
        if 'mhLoadSymbolSlugMap' not in txt:
            txt = prefix + txt
        if fname=='search_home.js':
            txt = txt.replace('function mhRenderSearchCard(item) {\n  return `\n    <a class="search-card link-row" href="stock.html?symbol=${encodeURIComponent(item.symbol)}">', 'async function mhRenderSearchCard(item) {\n  const href = await mhStockUrl(item.symbol);\n  return `\n    <a class="search-card link-row" href="${href}">')
            txt = txt.replace("    target.innerHTML = items.length\n      ? items.map(mhRenderSearchCard).join('')\n      : '<div class=\"empty-state\">검색 결과가 없습니다.</div>';", "    if (items.length) {\n      const cards = await Promise.all(items.map(mhRenderSearchCard));\n      target.innerHTML = cards.join('');\n    } else {\n      target.innerHTML = '<div class=\"empty-state\">검색 결과가 없습니다.</div>';\n    }")
        elif fname=='market_top10.js':
            txt = txt.replace('  el.innerHTML = items.map((item, idx) => {', '  Promise.all(items.map(async (item, idx) => {')
            txt = txt.replace('    return `\n      <a class="stock-row" href="stock.html?symbol=${encodeURIComponent(symbol)}"', '    const href = await mhStockUrl(symbol);\n    return `\n      <a class="stock-row" href="${href}"')
            txt = txt.replace('  }).join("");', '  })).then((rows) => {\n    el.innerHTML = rows.join("");\n  });')
        elif fname=='app.js':
            txt = txt.replace('function stockTemplate(item, direction){\n  return `\n    <a class="stock-row link-row" href="stock.html?symbol=${encodeURIComponent(item.symbol)}">', 'async function stockTemplate(item, direction){\n  const href = await mhStockUrl(item.symbol);\n  return `\n    <a class="stock-row link-row" href="${href}">')
            txt = txt.replace('function searchCard(item){\n  return `\n    <a class="search-card link-row" href="stock.html?symbol=${encodeURIComponent(item.symbol)}">', 'async function searchCard(item){\n  const href = await mhStockUrl(item.symbol);\n  return `\n    <a class="search-card link-row" href="${href}">')
            txt = txt.replace('  document.getElementById("kospi-up").innerHTML = k1.up.map(x => stockTemplate(x, "up")).join("");\n  document.getElementById("kospi-down").innerHTML = k1.down.map(x => stockTemplate(x, "down")).join("");\n  document.getElementById("kosdaq-up").innerHTML = k2.up.map(x => stockTemplate(x, "up")).join("");\n  document.getElementById("kosdaq-down").innerHTML = k2.down.map(x => stockTemplate(x, "down")).join("");\n  document.getElementById("nasdaq-up").innerHTML = k3.up.map(x => stockTemplate(x, "up")).join("");\n  document.getElementById("nasdaq-down").innerHTML = k3.down.map(x => stockTemplate(x, "down")).join("");', '  document.getElementById("kospi-up").innerHTML = (await Promise.all(k1.up.map(x => stockTemplate(x, "up")))).join("");\n  document.getElementById("kospi-down").innerHTML = (await Promise.all(k1.down.map(x => stockTemplate(x, "down")))).join("");\n  document.getElementById("kosdaq-up").innerHTML = (await Promise.all(k2.up.map(x => stockTemplate(x, "up")))).join("");\n  document.getElementById("kosdaq-down").innerHTML = (await Promise.all(k2.down.map(x => stockTemplate(x, "down")))).join("");\n  document.getElementById("nasdaq-up").innerHTML = (await Promise.all(k3.up.map(x => stockTemplate(x, "up")))).join("");\n  document.getElementById("nasdaq-down").innerHTML = (await Promise.all(k3.down.map(x => stockTemplate(x, "down")))).join("");')
            txt = txt.replace("    target.innerHTML = data.items?.length ? data.items.map(searchCard).join('') : `<div class=\"empty-state\">검색 결과가 없어. 다른 키워드로 다시 찾아봐.</div>`;", "    if (data.items?.length) {\n      target.innerHTML = (await Promise.all(data.items.map(searchCard))).join('');\n    } else {\n      target.innerHTML = `<div class=\"empty-state\">검색 결과가 없어. 다른 키워드로 다시 찾아봐.</div>`;\n    }")
        (ROOT/fname).write_text(txt, encoding='utf-8')

def write_support_files(records, slug_map, symbol_map):
    pd.DataFrame(records).to_csv(ROOT/'stock_slug_reference_700.csv', index=False, encoding='utf-8-sig')
    with open(ROOT/'slug_map.json','w',encoding='utf-8') as f: json.dump(slug_map,f,ensure_ascii=False,indent=2)
    with open(ROOT/'symbol_slug_map.json','w',encoding='utf-8') as f: json.dump(symbol_map,f,ensure_ascii=False,indent=2)
    seo_links_js = """(function(){\n  let mapPromise = null;\n  function loadMap(){\n    if(!mapPromise){\n      mapPromise = fetch('/symbol_slug_map.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}).catch(() => ({}));\n    }\n    return mapPromise;\n  }\n  function isEn(){\n    const p = window.location.pathname || '';\n    return document.documentElement.lang === 'en' || p.startsWith('/en/');\n  }\n  function extractSymbol(href){\n    try {\n      const u = new URL(href, window.location.origin);\n      const p = u.pathname || '';\n      if (!(/\\/stock\\.html$/i.test(p) || /\\/en\\/stock\\.html$/i.test(p))) return '';\n      return String(u.searchParams.get('symbol') || '').trim().toUpperCase();\n    } catch (_) { return ''; }\n  }\n  async function rewrite(){\n    const map = await loadMap();\n    document.querySelectorAll('a[href*="stock.html?symbol="]').forEach(a => {\n      const sym = extractSymbol(a.getAttribute('href'));\n      const entry = map?.[sym];\n      if (!sym || !entry) return;\n      a.setAttribute('href', isEn() ? entry.en_path : entry.ko_path);\n    });\n  }\n  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', rewrite); } else { rewrite(); }\n})();\n"""
    (ROOT/'seo_links.js').write_text(seo_links_js, encoding='utf-8')
    for hp in list(ROOT.glob('*.html')) + list((ROOT/'en').glob('*.html')):
        txt = hp.read_text(encoding='utf-8')
        if '/seo_links.js' not in txt and '</body>' in txt:
            txt = txt.replace('</body>', '  <script src="/seo_links.js?v=20260412-1" defer></script>\n</body>')
            hp.write_text(txt, encoding='utf-8')
    (ROOT/'_redirects').write_text('/stocks/*      /stock.html      200\n/en/stocks/*   /en/stock.html   200\n', encoding='utf-8')

def write_pages(records, symbol_map):
    shutil.rmtree(ROOT/'stocks', ignore_errors=True)
    shutil.rmtree(ROOT/'en'/'stocks', ignore_errors=True)
    (ROOT/'stocks').mkdir(parents=True, exist_ok=True)
    (ROOT/'en'/'stocks').mkdir(parents=True, exist_ok=True)
    for rec in records:
        ko_dir = ROOT/'stocks'/rec['ko_slug']
        en_dir = ROOT/'en'/'stocks'/rec['en_slug']
        ko_dir.mkdir(parents=True, exist_ok=True)
        en_dir.mkdir(parents=True, exist_ok=True)
        (ko_dir/'index.html').write_text(page_html(rec, symbol_map, 'ko'), encoding='utf-8')
        (en_dir/'index.html').write_text(page_html(rec, symbol_map, 'en'), encoding='utf-8')

def write_sitemaps(records, symbol_map):
    def url_entry(loc, priority='0.8', changefreq='daily', alt=None, lang=None, alt_lang=None):
        extra=''
        if alt and lang and alt_lang:
            extra = f'\n    <xhtml:link rel="alternate" hreflang="{lang}" href="{loc}" />\n    <xhtml:link rel="alternate" hreflang="{alt_lang}" href="{alt}" />'
        return f'''  <url>\n    <loc>{xesc(loc)}</loc>{extra}\n    <changefreq>{changefreq}</changefreq>\n    <priority>{priority}</priority>\n  </url>'''
    header='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'; footer='\n</urlset>\n'
    kr_entries=[url_entry('https://markethunters.kr/','1.0','daily'),url_entry('https://markethunters.kr/stocks.html','0.9','daily'),url_entry('https://markethunters.kr/stock.html','0.5','weekly'),url_entry('https://markethunters.kr/insights.html','0.7','weekly')]
    en_entries=[url_entry('https://markethunters.kr/en/','0.9','daily'),url_entry('https://markethunters.kr/en/stocks.html','0.8','daily'),url_entry('https://markethunters.kr/en/stock.html','0.4','weekly')]
    for rec in records:
        sym=rec['symbol']
        ko='https://markethunters.kr'+symbol_map[sym]['ko_path']
        en='https://markethunters.kr'+symbol_map[sym]['en_path']
        kr_entries.append(url_entry(ko,'0.8','daily',alt=en,lang='ko',alt_lang='en'))
        en_entries.append(url_entry(en,'0.7','daily',alt=ko,lang='en',alt_lang='ko'))
    (ROOT/'sitemap_kr.xml').write_text(header+'\n'.join(kr_entries)+footer, encoding='utf-8')
    (ROOT/'sitemap_en.xml').write_text(header+'\n'.join(en_entries)+footer, encoding='utf-8')
    (ROOT/'sitemap_index.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>https://markethunters.kr/sitemap_kr.xml</loc></sitemap>\n  <sitemap><loc>https://markethunters.kr/sitemap_en.xml</loc></sitemap>\n</sitemapindex>\n', encoding='utf-8')

def main():
    df = pd.read_csv(CSV_PATH)
    records = prepare_records(df)
    slug_map, symbol_map = build_maps(records)
    write_support_files(records, slug_map, symbol_map)
    patch_js_files()
    write_pages(records, symbol_map)
    write_sitemaps(records, symbol_map)
    print(f'Generated {len(records)} KR pages and {len(records)} EN pages.')

if __name__ == '__main__':
    main()
