
(function () {
  const PAGE_LANG = document.documentElement.lang === "en" ? "en" : "ko";

  const TEXT = {
    ko: {
      eyebrow: "SEO UPGRADE",
      title: "종목 상세 하단을 이렇게 강화합니다",
      subtitle: "AI 분석을 읽기 쉽게 정리하고, 관련 종목과 추천 종목을 연결해 내부링크와 체류시간을 함께 올리는 구조입니다.",
      quickSummary: "한줄 요약",
      bullCase: "상승 시나리오",
      riskCase: "리스크 요인",
      checkpoints: "체크 포인트",
      related: "같은 섹터 종목",
      relatedSub: "관련 종목 페이지로 이동",
      picks: "AI 추천 종목",
      picksSub: "시장/테마/인기도 기반",
      popular: "많이 보는 종목",
      fallbackSummary: "현재 종목의 최근 흐름과 뉴스, AI 해설을 종합해 핵심 체크 포인트를 확인하세요.",
      fallbackBull: "수급과 실적 기대가 함께 이어지면 추가 상승 여지가 남아 있을 수 있습니다.",
      fallbackRisk: "단기 변동성과 외부 변수에 따라 가격 조정이 나올 수 있어 분할 접근이 필요합니다.",
      checkpointsTpl: function (name) {
        return [
          name + "의 다음 실적 발표와 가이던스 변화를 확인하세요.",
          "기관 수급과 관련 뉴스 흐름이 유지되는지 체크하세요.",
          "단기 가격 추세와 주요 지지/저항 구간 돌파 여부를 확인하세요."
        ];
      },
      relatedTag: "같은 테마",
      scoreTag: "AI SCORE",
      popularFallback: ["005930.KS", "000660.KS", "NVDA", "TSLA", "AAPL", "AMZN", "005380.KS", "035420.KS"]
    },
    en: {
      eyebrow: "SEO UPGRADE",
      title: "This is how the lower stock page should look",
      subtitle: "The analysis is structured for readability while related stocks and AI picks create stronger internal links and longer session time.",
      quickSummary: "Quick Summary",
      bullCase: "Bull Case",
      riskCase: "Risk Factors",
      checkpoints: "Checkpoints",
      related: "Related Stocks",
      relatedSub: "Open related stock page",
      picks: "AI Picks",
      picksSub: "Based on market, theme, and popularity",
      popular: "Trending Names",
      fallbackSummary: "Review recent price action, major news flow, and AI commentary for the current stock in a more structured format.",
      fallbackBull: "If demand, earnings expectations, and risk appetite hold up, the stock may keep its upside momentum.",
      fallbackRisk: "Short-term volatility, macro pressure, and fast-moving flows can still trigger price pullbacks.",
      checkpointsTpl: function (name) {
        return [
          "Watch the next earnings release and guidance update for " + name + ".",
          "Monitor institutional flow and headline momentum together.",
          "Track whether price action can hold support and break resistance."
        ];
      },
      relatedTag: "Theme Match",
      scoreTag: "AI SCORE",
      popularFallback: ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "005930.KS"]
    }
  };

  const POPULAR_SCORES = {
    "NVDA": 100, "AAPL": 98, "MSFT": 97, "AMZN": 95, "GOOGL": 94, "META": 92, "TSLA": 91,
    "AMD": 89, "TSM": 88, "AVGO": 87, "ASML": 86, "SMCI": 84, "ARM": 82, "MU": 80, "ALAB": 76, "MPWR": 75,
    "005930.KS": 100, "000660.KS": 95, "373220.KS": 90, "005380.KS": 86, "035420.KS": 84, "000270.KS": 82,
    "051910.KS": 80, "006400.KS": 79, "207940.KS": 77, "068270.KS": 76, "028260.KS": 75,
    "247540.KQ": 74, "196170.KQ": 73, "352820.KQ": 72, "214450.KQ": 71
  };

  const LABELS = {
    "NVDA": { ko: "엔비디아", en: "NVIDIA" },
    "AMD": { ko: "AMD", en: "AMD" },
    "TSM": { ko: "TSMC", en: "TSMC" },
    "ASML": { ko: "ASML", en: "ASML" },
    "AVGO": { ko: "브로드컴", en: "Broadcom" },
    "ARM": { ko: "ARM", en: "ARM" },
    "MU": { ko: "마이크론", en: "Micron" },
    "SMCI": { ko: "슈퍼마이크로컴퓨터", en: "Super Micro Computer" },
    "MPWR": { ko: "모놀리식 파워 시스템즈", en: "Monolithic Power Systems" },
    "ALAB": { ko: "아스테라 랩스", en: "Astera Labs" },
    "MSFT": { ko: "마이크로소프트", en: "Microsoft" },
    "AMZN": { ko: "아마존", en: "Amazon" },
    "META": { ko: "메타", en: "Meta" },
    "GOOGL": { ko: "알파벳", en: "Alphabet" },
    "AAPL": { ko: "애플", en: "Apple" },
    "TSLA": { ko: "테슬라", en: "Tesla" },
    "005930.KS": { ko: "삼성전자", en: "Samsung Electronics" },
    "000660.KS": { ko: "SK하이닉스", en: "SK hynix" },
    "373220.KS": { ko: "LG에너지솔루션", en: "LG Energy Solution" },
    "005380.KS": { ko: "현대차", en: "Hyundai Motor" },
    "035420.KS": { ko: "NAVER", en: "NAVER" },
    "000270.KS": { ko: "기아", en: "Kia" },
    "051910.KS": { ko: "LG화학", en: "LG Chem" },
    "006400.KS": { ko: "삼성SDI", en: "Samsung SDI" },
    "207940.KS": { ko: "삼성바이오로직스", en: "Samsung Biologics" },
    "068270.KS": { ko: "셀트리온", en: "Celltrion" }
  };

  let symbolSlugMapPromise = null;
  let slugMapPromise = null;
  let relatedMapPromise = null;

  function t() { return TEXT[PAGE_LANG]; }

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"]/g, function (s) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[s];
    });
  }

  function safeText(id) {
    var el = document.getElementById(id);
    return String(el && el.textContent || "").trim();
  }

  function getLabel(symbol, entry) {
    if (LABELS[symbol]) return LABELS[symbol][PAGE_LANG] || LABELS[symbol].en || LABELS[symbol].ko || symbol;
    if (entry) {
      var path = PAGE_LANG === "en" ? entry.en_path : entry.ko_path;
      var raw = String(path || "").split("/").filter(Boolean).pop() || "";
      raw = raw.replace(/-stock-forecast$/i, "").replace(/-주가-전망$/i, "");
      raw = raw.replace(/-/g, " ").trim();
      if (!raw) return symbol;
      if (PAGE_LANG === "en") {
        return raw.replace(/\b\w/g, function (m) { return m.toUpperCase(); });
      }
      return raw;
    }
    return symbol;
  }

  function inferMarket(symbol) {
    if (/\.KS$/i.test(symbol)) return "KOSPI";
    if (/\.KQ$/i.test(symbol)) return "KOSDAQ";
    return "US";
  }

  function inferTheme(symbol, entry) {
    var text = [
      symbol,
      LABELS[symbol] ? (LABELS[symbol].ko || "") : "",
      LABELS[symbol] ? (LABELS[symbol].en || "") : "",
      entry ? (entry.ko_path || "") : "",
      entry ? (entry.en_path || "") : ""
    ].join(" ").toLowerCase();

    var themes = [];

    function has(words) {
      return words.some(function (w) { return text.indexOf(w) > -1; });
    }

    if (has(["반도체", "semiconductor", "nvidia", "amd", "tsmc", "asml", "broadcom", "micron", "arm", "super-micro", "hynix", "electronics"])) themes.push("semiconductor");
    if (has(["ai", "gpu", "cloud", "copilot", "gemini", "aws", "meta", "microsoft", "alphabet", "amazon"])) themes.push("ai-cloud");
    if (has(["자동차", "vehicle", "ev", "tesla", "hyundai", "kia", "robotaxi"])) themes.push("autos");
    if (has(["배터리", "battery", "energy solution", "lg에너지솔루션", "sdi", "화학", "cathode"])) themes.push("battery");
    if (has(["바이오", "bio", "pharma", "biologics", "celltrion", "알테오젠", "파마리서치"])) themes.push("bio");
    if (has(["internet", "platform", "naver", "kakao", "commerce", "ad", "광고"])) themes.push("internet");
    if (!themes.length) themes.push(inferMarket(symbol).toLowerCase());
    return themes;
  }

  function loadSymbolSlugMap() {
    if (!symbolSlugMapPromise) {
      symbolSlugMapPromise = fetch("/symbol_slug_map.json", { cache: "no-store" })
        .then(function (res) { return res.ok ? res.json() : {}; })
        .catch(function () { return {}; });
    }
    return symbolSlugMapPromise;
  }

  function loadSlugMap() {
    if (!slugMapPromise) {
      slugMapPromise = fetch("/slug_map.json", { cache: "no-store" })
        .then(function (res) { return res.ok ? res.json() : {}; })
        .catch(function () { return {}; });
    }
    return slugMapPromise;
  }

  function loadRelatedMap() {
    if (!relatedMapPromise) {
      relatedMapPromise = fetch("/related_map.json", { cache: "no-store" })
        .then(function (res) { return res.ok ? res.json() : {}; })
        .catch(function () { return {}; });
    }
    return relatedMapPromise;
  }

  async function resolveCurrentSymbol() {
    var params = new URLSearchParams(window.location.search);
    var sym = String(params.get("symbol") || params.get("code") || "").trim().toUpperCase();
    if (sym) return sym;

    var path = window.location.pathname.replace(/\/+$/, "");
    var parts = path.split("/").filter(Boolean);
    var slug = "";

    if (parts.length >= 2 && parts[0] === "stocks") {
      slug = decodeURIComponent(parts[1] || "").trim();
    } else if (parts.length >= 3 && parts[0] === "en" && parts[1] === "stocks") {
      slug = decodeURIComponent(parts[2] || "").trim();
    }

    if (slug) {
      var slugMap = await loadSlugMap();
      var mapped = String((slugMap && (slugMap[slug] || slugMap[slug.toLowerCase()] || slugMap[slug.toUpperCase()])) || "").trim().toUpperCase();
      if (mapped) return mapped;
    }

    var title = safeText("stock-title");
    var m = title.match(/\(([^)]+)\)/);
    return m ? m[1].trim().toUpperCase() : "";
  }

  async function buildHref(symbol) {
    var sym = String(symbol || "").trim().toUpperCase();
    if (!sym) return PAGE_LANG === "en" ? "/en/stock.html" : "/stock.html";

    try {
      var map = await loadSymbolSlugMap();
      var entry = map && map[sym];
      if (entry) {
        var preferred = PAGE_LANG === "en" ? entry.en_path : entry.ko_path;
        var fallback = PAGE_LANG === "en" ? entry.ko_path : entry.en_path;
        var path = String(preferred || fallback || "").trim();
        if (path) return path.charAt(0) === "/" ? path : "/" + path;
      }
    } catch (_) {}

    return PAGE_LANG === "en"
      ? "/en/stock.html?symbol=" + encodeURIComponent(sym)
      : "/stock.html?symbol=" + encodeURIComponent(sym);
  }

  async function getUniverse() {
    var map = await loadSymbolSlugMap();
    return Object.keys(map || {}).map(function (sym) {
      return {
        symbol: sym,
        entry: map[sym],
        market: inferMarket(sym),
        themes: inferTheme(sym, map[sym]),
        popularity: POPULAR_SCORES[sym] || 0
      };
    });
  }

  function uniqueSymbols(list, currentSymbol) {
    var out = [];
    var seen = {};
    list.forEach(function (sym) {
      var s = String(sym || "").trim().toUpperCase();
      if (!s || s === currentSymbol || seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    return out;
  }

  async function getRecommendationSet(currentSymbol) {
    var relatedMap = await loadRelatedMap();
    var explicit = relatedMap && relatedMap[currentSymbol];
    if (explicit) {
      return {
        related: uniqueSymbols(explicit.related || [], currentSymbol).slice(0, 6),
        picks: uniqueSymbols(explicit.ai_picks || [], currentSymbol).slice(0, 4),
        popular: uniqueSymbols(explicit.popular || [], currentSymbol).slice(0, 8)
      };
    }

    var universe = await getUniverse();
    var current = universe.find(function (row) { return row.symbol === currentSymbol; });

    if (!current) {
      return {
        related: uniqueSymbols(t().popularFallback || [], currentSymbol).slice(0, 6),
        picks: uniqueSymbols(t().popularFallback || [], currentSymbol).slice(0, 4),
        popular: uniqueSymbols(t().popularFallback || [], currentSymbol).slice(0, 8)
      };
    }

    var scored = universe
      .filter(function (row) { return row.symbol !== currentSymbol; })
      .map(function (row) {
        var score = 0;
        if (row.market === current.market) score += 4;
        current.themes.forEach(function (theme) {
          if (row.themes.indexOf(theme) > -1) score += 5;
        });
        score += row.popularity / 25;
        if (current.market === "US" && row.market === "US") score += 1;
        if (current.market !== "US" && row.market === current.market) score += 2;
        return { symbol: row.symbol, score: score, market: row.market, entry: row.entry };
      })
      .sort(function (a, b) { return b.score - a.score; });

    var related = scored.slice(0, 6).map(function (row) { return row.symbol; });
    var picks = scored.filter(function (row) { return row.market === current.market; }).slice(0, 4).map(function (row) { return row.symbol; });

    var popular = Object.keys(POPULAR_SCORES)
      .sort(function (a, b) { return (POPULAR_SCORES[b] || 0) - (POPULAR_SCORES[a] || 0); })
      .filter(function (sym) { return sym !== currentSymbol; });

    if (current.market === "US") {
      popular = popular.filter(function (sym) { return inferMarket(sym) === "US"; }).concat(
        popular.filter(function (sym) { return inferMarket(sym) !== "US"; })
      );
    } else {
      popular = popular.filter(function (sym) { return inferMarket(sym) === current.market; }).concat(
        popular.filter(function (sym) { return inferMarket(sym) !== current.market; })
      );
    }

    return {
      related: uniqueSymbols(related, currentSymbol).slice(0, 6),
      picks: uniqueSymbols(picks, currentSymbol).slice(0, 4),
      popular: uniqueSymbols(popular, currentSymbol).slice(0, 8)
    };
  }

  function computeScore(symbol) {
    var base = 70 + ((POPULAR_SCORES[symbol] || 60) % 23);
    return Math.max(71, Math.min(96, base));
  }

  async function renderSeoSections() {
    var mount = document.getElementById("mh-seo-sections");
    if (!mount) return;

    var currentSymbol = await resolveCurrentSymbol();
    if (!currentSymbol) return;

    var labelsMap = await loadSymbolSlugMap();
    var rec = await getRecommendationSet(currentSymbol);

    var displayName = safeText("stock-title").replace(/\s*\([^)]+\)\s*$/, "").trim() || (PAGE_LANG === "en" ? "This stock" : "이 종목");
    var summaryText = safeText("stock-summary") || t().fallbackSummary;
    var aiText = safeText("stock-ai-brief");
    var newsText = safeText("news-summary");
    var bullText = aiText || t().fallbackBull;
    var riskText = newsText || t().fallbackRisk;
    var checks = t().checkpointsTpl(displayName);

    var relatedCards = await Promise.all(rec.related.map(async function (sym) {
      var href = await buildHref(sym);
      var entry = labelsMap[sym];
      return '<a class="mh-link-card" href="' + escapeHtml(href) + '">' +
        '<div class="mh-link-row"><div class="mh-link-name">' + escapeHtml(getLabel(sym, entry)) + '</div>' +
        '<div class="mh-score-badge">' + escapeHtml(t().relatedTag) + '</div></div>' +
        '<div class="mh-link-sub">' + escapeHtml(t().relatedSub) + '</div></a>';
    }));

    var aiPickCards = await Promise.all(rec.picks.map(async function (sym) {
      var href = await buildHref(sym);
      var entry = labelsMap[sym];
      return '<a class="mh-link-card" href="' + escapeHtml(href) + '">' +
        '<div class="mh-link-row"><div><div class="mh-link-name">' + escapeHtml(getLabel(sym, entry)) + '</div>' +
        '<div class="mh-link-sub">' + escapeHtml(t().picksSub) + '</div></div>' +
        '<div class="mh-score-badge">' + escapeHtml(String(computeScore(sym))) + '</div></div></a>';
    }));

    var popularLinks = await Promise.all(rec.popular.map(async function (sym) {
      var href = await buildHref(sym);
      var entry = labelsMap[sym];
      return '<a class="mh-pill-link" href="' + escapeHtml(href) + '">' + escapeHtml(getLabel(sym, entry)) + '</a>';
    }));

    mount.innerHTML =
      '<section class="mh-seo-card">' +
        '<div class="mh-seo-eyebrow">' + escapeHtml(t().eyebrow) + '</div>' +
        '<h2 class="mh-seo-title">' + escapeHtml(t().title) + '</h2>' +
        '<p class="mh-seo-sub">' + escapeHtml(t().subtitle) + '</p>' +
      '</section>' +
      '<section class="mh-seo-grid">' +
        '<article class="mh-seo-card">' +
          '<div class="mh-seo-stack">' +
            '<div class="mh-seo-box hero"><div class="mh-seo-box-title">' + escapeHtml(t().quickSummary) + '</div><p>' + escapeHtml(summaryText) + '</p></div>' +
            '<div class="mh-seo-box green"><div class="mh-seo-box-title">' + escapeHtml(t().bullCase) + '</div><p>' + escapeHtml(bullText) + '</p></div>' +
            '<div class="mh-seo-box red"><div class="mh-seo-box-title">' + escapeHtml(t().riskCase) + '</div><p>' + escapeHtml(riskText) + '</p></div>' +
            '<div class="mh-seo-box"><div class="mh-seo-box-title">' + escapeHtml(t().checkpoints) + '</div><div class="mh-seo-checks">' +
              checks.map(function (item) { return '<div class="mh-seo-check">' + escapeHtml(item) + '</div>'; }).join('') +
            '</div></div>' +
          '</div>' +
        '</article>' +
        '<aside class="mh-seo-stack">' +
          '<section class="mh-seo-card"><div class="mh-seo-eyebrow">' + escapeHtml(t().related) + '</div><div class="mh-link-grid">' + relatedCards.join('') + '</div></section>' +
          '<section class="mh-seo-card"><div class="mh-seo-eyebrow">' + escapeHtml(t().picks) + '</div><div class="mh-seo-stack">' + aiPickCards.join('') + '</div></section>' +
          '<section class="mh-seo-card"><div class="mh-seo-eyebrow">' + escapeHtml(t().popular) + '</div><div class="mh-pill-wrap">' + popularLinks.join('') + '</div></section>' +
        '</aside>' +
      '</section>';
  }

  function waitForStockRender() {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      var title = safeText("stock-title");
      var summary = safeText("stock-summary");
      if ((title && !/^(종목 상세|Stock Detail)$/i.test(title)) || tries > 20 || (summary && summary !== "-")) {
        clearInterval(timer);
        renderSeoSections();
      }
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForStockRender);
  } else {
    waitForStockRender();
  }
})();
