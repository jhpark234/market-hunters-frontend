const API_BASE = "https://api.markethunters.kr/api";
const ASSET_VERSION = "20260405-2";
const API_TIMEOUT_MS = 60000;

const params = new URLSearchParams(window.location.search);

let rawSymbol = (params.get("symbol") || "").toUpperCase().trim();
let symbol = rawSymbol || "";

let slugMapPromise = null;

function loadSlugMap() {
  if (!slugMapPromise) {
    slugMapPromise = fetch("/slug_map.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }
  return slugMapPromise;
}

async function resolveSymbolFromPath() {
  if (rawSymbol) return rawSymbol;

  try {
    const path = window.location.pathname || "";
    const match = path.match(/^\/(en\/)?stocks\/([^\/]+)\/?$/i);
    if (!match) return "";

    const slug = decodeURIComponent(match[2] || "").trim().toLowerCase();
    if (!slug) return "";

    const slugMap = await loadSlugMap();
    const mapped = String(slugMap?.[slug] || "").trim().toUpperCase();
    if (mapped) return mapped;

    if (/^[A-Z][A-Z0-9.-]{0,15}$/i.test(slug) && !/^\d{6}$/i.test(slug)) {
      return slug.toUpperCase();
    }

    if (/^\d{6}\.(KS|KQ)$/i.test(slug)) {
      return slug.toUpperCase();
    }

    return "";
  } catch (e) {
    return "";
  }
}

async function initializeSymbolFromLocation() 
  const resolved = await resolveSymbolFromPath();

  if (resolved) {
    rawSymbol = resolved;
    symbol = resolved;
    return;
  }

  if (!rawSymbol) {
    const path = window.location.pathname || "";
  
    if (path === "/stock" || path === "/stock.html" || path === "/en/stock" || path === "/en/stock.html") {
      rawSymbol = "AAPL";
      symbol = "AAPL";
    } else {
      rawSymbol = "";
      symbol = "";
    }
  }

const PAGE_LANG = document.documentElement.lang === "en" ? "en" : "ko";

const STOCK_TEXT = {
  ko: {
    generatedAt: "생성",
    aiAnalysis: "AI 종목 분석",
    aiAnalysisLoading: "AI 분석을 생성 중입니다.",
    aiAnalysisLoadingTitle: "AI 종목 분석 생성 중",
    aiAnalysisLoadingSteps: [
      "종목 데이터 수집 중...",
      "가격 흐름 분석 중...",
      "기술 데이터 계산 중...",
      "AI 종목 분석 표시 중...",
    ],
    aiAnalysisDone: "AI 분석 완료",
    aiAnalysisError: "AI 분석 데이터를 불러오지 못했습니다.",
    aiAnalysisErrorShort: "AI 분석을 불러오지 못했습니다.",
    newsSummary: "뉴스 한글 요약",
    newsSummaryLoading: "뉴스 한글 요약을 생성 중입니다.",
    newsSummaryLoadingTitle: "뉴스 한글 요약 생성 중",
    newsSummaryLoadingSteps: [
      "최신 뉴스 수집 중...",
      "중복 뉴스 정리 중...",
      "핵심 뉴스 선별 중...",
      "한글 요약 생성 중...",
    ],
    newsSummaryDone: "뉴스 요약 완료",
    newsSummaryEmpty: "AI 뉴스 한글 요약이 아직 생성되지 않았습니다.",
    newsSummaryError: "뉴스 한글 요약을 불러오지 못했습니다.",
    newsSummaryErrorShort: "뉴스 요약을 불러오지 못했습니다.",
    noData: "데이터가 없습니다.",
    noRecentNews: "최근 뉴스가 없습니다.",
    stockDetail: "종목 상세",
    stockDetailError: "데이터를 불러오지 못했습니다.",
    legalEmpty: "안내 정보가 없습니다.",
    legalError: "안내 정보를 불러오지 못했습니다.",
    technicals: "기술 참고 데이터",
    technicalsEmpty: "기술 참고 데이터가 아직 없습니다.",
    rsi: "RSI",
    rsiState: "RSI 상태",
    support: "지지",
    resistance: "저항",
    summaryMissing: "요약 데이터가 없습니다.",
    aiBriefEmpty: "AI 분석 데이터가 아직 생성되지 않았습니다.",
    recentNews: "최근 뉴스",
    seoTitleSuffix: "주가 분석 | MarketHunters",
    seoDesc: (name, code) =>
      `${name}(${code}) 주가 분석, 최신 뉴스 요약, AI 시장 해설을 확인하세요.`,
    ogDesc: (sym) => `${sym} 종목의 AI 분석과 뉴스 요약 제공`,
    chartNoData: "차트 데이터가 없습니다.",
    homeHref: "/stock.html",
    enHref: "/en/stock.html",
  },
  en: {
    generatedAt: "Generated",
    aiAnalysis: "AI Stock Analysis",
    aiAnalysisLoading: "Generating AI stock analysis.",
    aiAnalysisLoadingTitle: "Generating AI Stock Analysis",
    aiAnalysisLoadingSteps: [
      "Collecting stock data...",
      "Analyzing price action...",
      "Calculating technical data...",
      "Rendering AI analysis...",
    ],
    aiAnalysisDone: "AI analysis complete",
    aiAnalysisError: "Unable to load AI stock analysis.",
    aiAnalysisErrorShort: "Unable to load AI analysis.",
    newsSummary: "News Summary",
    newsSummaryLoading: "Generating news summary.",
    newsSummaryLoadingTitle: "Generating News Summary",
    newsSummaryLoadingSteps: [
      "Collecting latest news...",
      "Removing duplicates...",
      "Selecting key articles...",
      "Generating summary...",
    ],
    newsSummaryDone: "News summary complete",
    newsSummaryEmpty: "AI news summary is not available yet.",
    newsSummaryError: "Unable to load the news summary.",
    newsSummaryErrorShort: "Unable to load the news summary.",
    noData: "No data available.",
    noRecentNews: "No recent news.",
    stockDetail: "Stock Detail",
    stockDetailError: "Unable to load the data.",
    legalEmpty: "No legal notice available.",
    legalError: "Unable to load the legal notice.",
    technicals: "Technical Snapshot",
    technicalsEmpty: "Technical data is not available yet.",
    rsi: "RSI",
    rsiState: "RSI State",
    support: "Support",
    resistance: "Resistance",
    summaryMissing: "Summary is not available.",
    aiBriefEmpty: "AI analysis is not available yet.",
    recentNews: "Latest News",
    seoTitleSuffix: "stock analysis | MarketHunters",
    seoDesc: (name, code) =>
      `Read AI stock analysis, latest news summary, and market commentary for ${name} (${code}).`,
    ogDesc: (sym) => `AI stock analysis and news summary for ${sym}.`,
    chartNoData: "No chart data available.",
    homeHref: "/stock.html",
    enHref: "/en/stock.html",
  },
};

const T = STOCK_TEXT[PAGE_LANG];

let canonicalSymbol = rawSymbol;
let stockPageCache = [];
let currentChartPeriod = "1M";
let currentOverviewTechnicals = {};

function setOrCreateMeta(selector, createTag, attrs, content) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement(createTag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  if (typeof content === "string") {
    el.setAttribute("content", content);
  }
  return el;
}

function updateSEO(detail, meta = {}) {
  if (!detail && !meta) return;

  const safeName = String(
    detail?.name || detail?.name_kr || detail?.name_en || canonicalSymbol || rawSymbol
  ).trim();
  const safeCode = String(detail?.symbol || canonicalSymbol || rawSymbol).trim();
  const pageTitle = String(
    meta?.title || `${safeName} ${T.seoTitleSuffix}`
  ).trim();
  const pageDesc = String(
    meta?.description || T.seoDesc(safeName, safeCode)
  ).trim();
  const canonicalHref = window.location.href;

  document.title = pageTitle;

  setOrCreateMeta('meta[name="description"]', "meta", { name: "description" }, pageDesc);
  setOrCreateMeta('meta[property="og:title"]', "meta", { property: "og:title" }, pageTitle);
  setOrCreateMeta(
    'meta[property="og:description"]',
    "meta",
    { property: "og:description" },
    pageDesc
  );
  setOrCreateMeta('meta[property="og:url"]', "meta", { property: "og:url" }, canonicalHref);
  setOrCreateMeta('meta[name="twitter:title"]', "meta", { name: "twitter:title" }, pageTitle);
  setOrCreateMeta(
    'meta[name="twitter:description"]',
    "meta",
    { name: "twitter:description" },
    pageDesc
  );

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", canonicalHref);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"]/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[s]));
}

function cleanSymbol(raw) {
  return String(raw || "").trim().replace(/\.(KS|KQ)$/i, "");
}

function numberFmt(v) {
  return v === null || v === undefined || Number.isNaN(Number(v))
    ? "-"
    : Number(v).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatGeneratedAt(value) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function safeGet(id) {
  return document.getElementById(id);
}

function safeSetText(id, value) {
  const el = safeGet(id);
  if (el) el.textContent = value;
}

function setMetaTime(id, value) {
  const el = safeGet(id);
  if (!el) return;
  el.textContent = `${T.generatedAt}: ${formatGeneratedAt(value)}`;
}

function setChangeTextAndColor(id, value) {
  const el = safeGet(id);
  if (!el) return;

  el.classList.remove("up", "down", "flat");

  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    el.textContent = "-";
    el.classList.add("flat");
    return;
  }

  const n = Number(value);
  el.textContent = `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

  if (n > 0) el.classList.add("up");
  else if (n < 0) el.classList.add("down");
  else el.classList.add("flat");
}

function renderBullets(el, text) {
  if (!el) return;

  const lines = String(text || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  if (!lines.length) {
    el.innerHTML = `<div class="bullet-item">${T.noData}</div>`;
    return;
  }

  el.innerHTML = lines
    .map((line) => `<div class="bullet-item">${escapeHtml(line)}</div>`)
    .join("");
}

function isPlaceholderNews(item) {
  const headline = String(item?.headline || item?.title || "").trim().toLowerCase();
  const summary = String(item?.summary || "").trim().toLowerCase();
  const source = String(item?.source || "").trim().toLowerCase();
  const merged = `${headline} ${summary}`;

  if (source === "system" || source === "test") return true;

  const blocked = [
    "관련 뉴스가 없습니다",
    "관련 국내 뉴스가 아직 없습니다",
    "공개된 내용이 없습니다",
    "현재 별도 시장 이슈",
    "뉴스 요약이 없습니다",
    "뉴스 api 키 필요",
    "no recent news",
    "no news available",
  ];

  return blocked.some((word) => merged.includes(word.toLowerCase()));
}

function normalizeNewsRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .filter((item) => !isPlaceholderNews(item))
    .map((item) => ({
      headline: item?.headline || item?.title || T.noData,
      summary: item?.summary || "",
      source: item?.source || "-",
      url: item?.url || "#",
    }))
    .slice(0, 5);
}

function renderNewsList(news) {
  const el = safeGet("news-list");
  if (!el) return;

  const rows = normalizeNewsRows(news);
  const headTitle = PAGE_LANG === "en" ? "Title" : "제목";
  const headSource = PAGE_LANG === "en" ? "Source" : "출처";

  if (!rows.length) {
    el.innerHTML = `
      <div class="table-head"><span>${headTitle}</span><span>${headSource}</span></div>
      <div class="table-row"><span>${T.noRecentNews}</span><span>-</span></div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="table-head"><span>${headTitle}</span><span>${headSource}</span></div>
    ${rows
      .map(
        (item) => `
      <a class="table-row table-link"
         href="${escapeHtml(item.url)}"
         target="_blank"
         rel="noopener noreferrer">
        <span>${escapeHtml(item.headline)}</span>
        <span>${escapeHtml(item.source)}</span>
      </a>
    `
      )
      .join("")}
  `;
}

function getChartValue(point) {
  const n = Number(
    point?.close ??
      point?.value ??
      point?.price ??
      point?.c ??
      point?.adjClose ??
      point?.adj_close
  );
  return Number.isNaN(n) ? null : n;
}

function calcRsi(values, period = 14) {
  if (!Array.isArray(values) || values.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

function getRsiState(rsi) {
  if (rsi === null || rsi === undefined || Number.isNaN(Number(rsi))) return "-";
  if (PAGE_LANG === "en") {
    if (rsi >= 70) return "Overbought";
    if (rsi <= 30) return "Oversold";
    return "Neutral";
  }
  if (rsi >= 70) return "과매수";
  if (rsi <= 30) return "과매도";
  return "중립";
}

function calcSupportResistance(values, windowSize = 20) {
  if (!Array.isArray(values) || !values.length) {
    return { support: null, resistance: null };
  }

  const windowed = values.slice(-windowSize);
  const support = Math.min(...windowed);
  const resistance = Math.max(...windowed);

  return {
    support: Number.isFinite(support) ? Number(support.toFixed(2)) : null,
    resistance: Number.isFinite(resistance) ? Number(resistance.toFixed(2)) : null,
  };
}

function buildTechnicalsFromHistory(history) {
  const rows = Array.isArray(history) ? history : [];
  const closes = rows
    .map(getChartValue)
    .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)));

  if (closes.length < 5) {
    return {
      rsi: null,
      rsi_state: "-",
      support: null,
      resistance: null,
    };
  }

  const rsi = calcRsi(closes, 14);
  const sr = calcSupportResistance(closes, 20);

  return {
    rsi,
    rsi_state: getRsiState(rsi),
    support: sr.support,
    resistance: sr.resistance,
  };
}

function getFilteredHistory(history, period) {
  const rows = Array.isArray(history) ? history : [];
  if (!rows.length) return [];

  const sizeMap = {
    "1D": 20,
    "1W": 35,
    "1M": 90,
    "6M": 180,
  };

  const size = sizeMap[period] || sizeMap["1M"];
  return rows.slice(-size);
}

function drawChart(history, period = currentChartPeriod) {
  const canvas = safeGet("stock-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rows = getFilteredHistory(history, period);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || canvas.parentElement?.clientWidth || 600));
  const height = 280;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = "100%";
  canvas.style.height = `${height}px`;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const values = rows.map(getChartValue).filter((v) => v !== null);

  if (!values.length) {
    ctx.fillStyle = "#9aa4b2";
    ctx.font = "13px Arial";
    ctx.fillText(T.chartNoData, 16, 24);
    return;
  }

  const padding = { top: 16, right: 16, bottom: 26, left: 56 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = padding.top + (plotH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#5e9dff";
  ctx.lineWidth = 3;
  ctx.beginPath();

  values.forEach((value, idx) => {
    const x = padding.left + (plotW * idx / Math.max(values.length - 1, 1));
    const y = padding.top + plotH - ((value - min) / range) * plotH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.fillStyle = "#eef4ff";
  ctx.font = "12px Arial";
  ctx.fillText(numberFmt(max), 8, padding.top + 6);
  ctx.fillText(numberFmt(min), 8, padding.top + plotH);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function getSymbolCandidates(targetSymbol) {
  const raw = String(targetSymbol || "").trim().toUpperCase();
  const cleaned = raw.replace(/\.(KS|KQ)$/i, "");

  if (!raw) return [];

  return [...new Set([raw, cleaned].filter(Boolean))];
}

async function fetchJsonBySymbolPath(pathBuilder, targetSymbol) {
  let lastError = null;

  for (const candidate of getSymbolCandidates(targetSymbol)) {
    try {
      return await fetchJson(pathBuilder(candidate));
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("symbol request failed");
}

function getOverviewChartRows(overview, fallbackDetail = {}) {
  const detail = overview?.detail || fallbackDetail || {};

  return Array.isArray(detail?.chart)
    ? detail.chart
    : Array.isArray(overview?.chart)
      ? overview.chart
      : Array.isArray(detail?.history)
        ? detail.history
        : Array.isArray(overview?.history)
          ? overview.history
          : Array.isArray(detail?.prices)
            ? detail.prices
            : Array.isArray(overview?.prices)
              ? overview.prices
              : Array.isArray(detail?.price_history)
                ? detail.price_history
                : Array.isArray(overview?.price_history)
                  ? overview.price_history
                  : [];
}

function hasUsablePriceData(overview, fallbackDetail = {}) {
  const detail = overview?.detail || fallbackDetail || {};

  const directPriceCandidates = [
    detail?.price,
    detail?.close,
    detail?.current_price,
    detail?.last_price,
  ];

  const hasDirectPrice = directPriceCandidates.some(
    (v) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v))
  );

  if (hasDirectPrice) return true;

  const chartRows = getOverviewChartRows(overview, fallbackDetail);
  if (!chartRows.length) return false;

  const latest = getChartValue(chartRows[chartRows.length - 1]);
  return latest !== null;
}

async function fetchOverviewWithRetry(targetSymbol, retries = 2, delayMs = 500) {
  let overview = await fetchJsonBySymbolPath(
    (candidate) => `${API_BASE}/stocks/overview/${encodeURIComponent(candidate)}`,
    targetSymbol
  );

  if (hasUsablePriceData(overview)) {
    return overview;
  }

  for (let i = 0; i < retries; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    overview = await fetchJsonBySymbolPath(
      (candidate) => `${API_BASE}/stocks/overview/${encodeURIComponent(candidate)}`,
      targetSymbol
    );

    if (hasUsablePriceData(overview)) {
      return overview;
    }
  }

  return overview;
}

async function loadLegal() {
  try {
    const data = await fetchJson(`${API_BASE}/meta/legal`);
    const box = safeGet("stock-legal");
    if (!box) return;

    const items = [data?.legal_notice, ...(data?.safe_analysis_principles || [])].filter(Boolean);

    if (!items.length) {
      box.innerHTML = `<div class="bullet-item">${T.legalEmpty}</div>`;
      return;
    }

    box.innerHTML = items
      .map((x) => `<div class="bullet-item">${escapeHtml(x)}</div>`)
      .join("");
  } catch (e) {
    console.error("loadLegal error:", e);
    renderBullets(safeGet("stock-legal"), T.legalError);
  }
}

function formatDisplayTitle(name, code) {
  const safeName = String(name || "").trim();
  const safeCode = String(code || "").trim();

  if (!safeName && !safeCode) return T.stockDetail;
  if (!safeName) return safeCode;
  if (!safeCode) return safeName;
  if (safeName === safeCode) return safeCode;
  return `${safeName} (${safeCode})`;
}

function renderRating(stockBrief) {
  const ratingEl = safeGet("stock-rating");
  if (!ratingEl) return;

  const rawScore = stockBrief?.score ?? stockBrief?.rating ?? null;
  const numeric = Number(rawScore);

  if (rawScore === null || rawScore === undefined || Number.isNaN(numeric)) {
    ratingEl.textContent = "-";
    ratingEl.title = PAGE_LANG === "en" ? "No rating data" : "별점 데이터 없음";
    return;
  }

  const score = Math.max(0, Math.min(5, Math.round(numeric)));
  ratingEl.textContent = `${"★".repeat(score)}${"☆".repeat(5 - score)}`;
  ratingEl.title = `${score} / 5`;
}

function renderTechnicalData(technicals) {
  const data = technicals && typeof technicals === "object" ? technicals : {};

  const rows = [
    { label: T.rsi, value: data?.rsi ?? "-", tone: "blue" },
    { label: T.rsiState, value: data?.rsi_state ?? "-", tone: "violet" },
    { label: T.support, value: data?.support ?? "-", tone: "green" },
    { label: T.resistance, value: data?.resistance ?? "-", tone: "red" },
  ];

  const toneMap = {
    blue: "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(96,165,250,0.05))",
    violet: "linear-gradient(135deg, rgba(139,92,246,0.16), rgba(167,139,250,0.05))",
    green: "linear-gradient(135deg, rgba(16,185,129,0.16), rgba(52,211,153,0.05))",
    red: "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(248,113,113,0.05))",
  };

  return `
    <div style="margin-top:16px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);">
      <div class="brief-title" style="font-size:14px; margin-bottom:12px;">${T.technicals}</div>
      <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px;">
        ${rows
          .map(
            (item) => `
          <div style="
            padding:12px 13px;
            border:1px solid rgba(255,255,255,0.08);
            border-radius:14px;
            background:${toneMap[item.tone] || "rgba(255,255,255,0.03)"};
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          ">
            <div style="font-size:12px; color:#9fb0cb; margin-bottom:6px;">${escapeHtml(item.label)}</div>
            <div style="font-size:15px; font-weight:800; color:#f3f7ff; letter-spacing:-0.01em;">
              ${escapeHtml(String(item.value))}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function highlightFirstSentenceHtml(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const normalized = raw.replace(/\n+/g, " ").trim();
  const match = normalized.match(/^(.*?[.!?。]|.*?$)(\s*)([\s\S]*)$/);

  if (!match) return escapeHtml(normalized);

  const first = String(match[1] || "").trim();
  const rest = String(match[3] || "").trim();

  if (!first) return escapeHtml(normalized);
  if (!rest) return `<strong>${escapeHtml(first)}</strong>`;

  return `<strong>${escapeHtml(first)}</strong> ${escapeHtml(rest)}`;
}

function renderAiBrief(stockBrief, fallbackTechnicals = {}) {
  const box = safeGet("stock-ai-brief");
  if (!box) return;

  const summary = String(stockBrief?.summary || "").trim();
  const technicals =
    (stockBrief?.technicals &&
      typeof stockBrief.technicals === "object" &&
      Object.keys(stockBrief.technicals).length)
      ? stockBrief.technicals
      : fallbackTechnicals;

  const technicalHtml = renderTechnicalData(technicals);

  if (summary) {
    box.innerHTML = `
      <div style="
        padding:16px 16px 14px 16px;
        border:1px solid rgba(255,255,255,0.08);
        border-radius:18px;
        background:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      ">
        <div class="brief-title" style="font-size:15px; margin-bottom:10px; color:#f5f8ff;">
          ${T.aiAnalysis}
        </div>
        <div class="brief-content" style="
          margin-bottom:6px;
          color:#dbe7ff;
          line-height:1.8;
          font-size:14px;
          white-space:normal;
        ">
          ${highlightFirstSentenceHtml(summary || T.summaryMissing)}
        </div>
        ${technicalHtml}
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="bullet-item">${T.aiBriefEmpty}</div>
    ${technicalHtml}
  `;
}

function extractPureAiSummary(summaryObj) {
  const raw = String(summaryObj?.summary || "").trim();
  if (!raw) return "";

  const lines = raw
    .split("\n")
    .map((x) => x.replace(/^[-•●]\s*/, "").trim())
    .filter(Boolean);

  const filtered = lines.filter((line) => {
    const lower = line.toLowerCase();

    if (
      lower.includes("v.daum.net") ||
      lower.includes("news.naver.com") ||
      lower.includes("msn") ||
      lower.includes("chosunbiz")
    ) {
      return false;
    }

    if (line.length < 8) return false;

    return true;
  });

  return [...new Set(filtered)].join("\n").trim();
}

function ensureLoadingStyles() {
  if (document.getElementById("mh-loading-styles")) return;

  const style = document.createElement("style");
  style.id = "mh-loading-styles";
  style.textContent = `
    .mh-loading-box {
      margin: 0 0 14px 0;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(94, 157, 255, 0.14);
      background: rgba(255, 255, 255, 0.03);
      color: #b8c7e6;
      box-sizing: border-box;
      width: 100%;
    }

    .mh-loading-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .mh-loading-spinner {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid rgba(94, 157, 255, 0.18);
      border-top-color: #5e9dff;
      animation: mh-spin 0.85s linear infinite;
      flex-shrink: 0;
    }

    .mh-loading-title {
      font-size: 14px;
      font-weight: 700;
      color: #eef4ff;
      margin-bottom: 4px;
    }

    .mh-loading-step {
      font-size: 13px;
      color: #9aa4b2;
      min-height: 18px;
    }

    .mh-loading-progress {
      width: 100%;
      height: 6px;
      border-radius: 999px;
      overflow: hidden;
      background: rgba(255,255,255,0.06);
      margin-bottom: 12px;
    }

    .mh-loading-progress-bar {
      width: 18%;
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #4f82ff 0%, #79a8ff 100%);
      box-shadow: 0 0 14px rgba(79, 130, 255, 0.25);
      transition: width 0.4s ease;
    }

    .mh-skeleton-wrap {
      display: grid;
      gap: 9px;
    }

    .mh-skeleton-line {
      position: relative;
      height: 11px;
      border-radius: 999px;
      background: rgba(255,255,255,0.05);
      overflow: hidden;
    }

    .mh-skeleton-line::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0) 0%,
        rgba(255,255,255,0.18) 50%,
        rgba(255,255,255,0) 100%
      );
      animation: mh-shimmer 1.3s ease-in-out infinite;
    }

    .mh-w-100 { width: 100%; }
    .mh-w-94 { width: 94%; }
    .mh-w-88 { width: 88%; }
    .mh-w-82 { width: 82%; }
    .mh-w-72 { width: 72%; }

    .mh-loading-success {
      color: #86efac;
    }

    .mh-loading-error {
      color: #fca5a5;
    }

    @keyframes mh-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes mh-shimmer {
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

function findCardContainerByTargetId(targetId) {
  const target = safeGet(targetId);
  if (!target) return null;
  return target.closest(".detail-card") || target.parentElement || null;
}

function ensureLoadingBox(targetId, loadingId, title) {
  ensureLoadingStyles();

  let loadingEl = document.getElementById(loadingId);
  if (loadingEl) return loadingEl;

  const target = safeGet(targetId);
  const card = findCardContainerByTargetId(targetId);

  if (!target || !card) return null;

  loadingEl = document.createElement("div");
  loadingEl.id = loadingId;
  loadingEl.className = "mh-loading-box";
  loadingEl.innerHTML = `
    <div class="mh-loading-top">
      <div class="mh-loading-spinner"></div>
      <div>
        <div class="mh-loading-title">${escapeHtml(title)}</div>
        <div class="mh-loading-step">${PAGE_LANG === "en" ? "Preparing analysis..." : "분석 준비 중..."}</div>
      </div>
    </div>
    <div class="mh-loading-progress">
      <div class="mh-loading-progress-bar"></div>
    </div>
    <div class="mh-skeleton-wrap">
      <div class="mh-skeleton-line mh-w-100"></div>
      <div class="mh-skeleton-line mh-w-94"></div>
      <div class="mh-skeleton-line mh-w-88"></div>
      <div class="mh-skeleton-line mh-w-82"></div>
      <div class="mh-skeleton-line mh-w-72"></div>
    </div>
  `;

  if (targetId === "news-summary") {
    const timeEl = safeGet("news-summary-time");
    const h3 = card.querySelector("h3");

    if (timeEl && timeEl.nextSibling) {
      card.insertBefore(loadingEl, timeEl.nextSibling);
    } else if (timeEl) {
      card.appendChild(loadingEl);
    } else if (h3) {
      card.insertBefore(loadingEl, h3);
    } else {
      card.insertBefore(loadingEl, target);
    }
  } else if (targetId === "stock-ai-brief") {
    const timeEl = safeGet("stock-ai-time");

    if (timeEl && timeEl.nextSibling) {
      card.insertBefore(loadingEl, timeEl.nextSibling);
    } else if (timeEl) {
      card.appendChild(loadingEl);
    } else {
      card.insertBefore(loadingEl, target);
    }
  } else {
    card.insertBefore(loadingEl, target);
  }

  return loadingEl;
}

function createLoadingController(targetId, loadingId, title, steps) {
  const loadingEl = ensureLoadingBox(targetId, loadingId, title);

  let stepTimer = null;
  let progressTimer = null;
  let stepIndex = 0;
  let progressIndex = 0;
  const progressPattern = [18, 28, 39, 52, 66, 78, 88, 94];

  function clearAllTimers() {
    if (stepTimer) {
      clearInterval(stepTimer);
      stepTimer = null;
    }
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function updateStep(text) {
    if (!loadingEl) return;
    const stepEl = loadingEl.querySelector(".mh-loading-step");
    if (stepEl) stepEl.textContent = text;
  }

  function updateProgress(percent) {
    if (!loadingEl) return;
    const barEl = loadingEl.querySelector(".mh-loading-progress-bar");
    if (barEl) barEl.style.width = `${percent}%`;
  }

  function resetVisualState() {
    if (!loadingEl) return;

    const spinner = loadingEl.querySelector(".mh-loading-spinner");
    const stepEl = loadingEl.querySelector(".mh-loading-step");

    if (spinner) spinner.style.display = "";
    if (stepEl) {
      stepEl.classList.remove("mh-loading-success", "mh-loading-error");
    }
  }

  function show() {
    if (!loadingEl) return;

    loadingEl.style.display = "";
    stepIndex = 0;
    progressIndex = 0;

    resetVisualState();
    updateStep(steps[0] || (PAGE_LANG === "en" ? "Loading..." : "불러오는 중..."));
    updateProgress(progressPattern[0]);

    clearAllTimers();

    stepTimer = window.setInterval(() => {
      stepIndex = (stepIndex + 1) % Math.max(steps.length, 1);
      updateStep(steps[stepIndex] || (PAGE_LANG === "en" ? "Loading..." : "불러오는 중..."));
    }, 1400);

    progressTimer = window.setInterval(() => {
      if (progressIndex < progressPattern.length - 1) {
        progressIndex += 1;
        updateProgress(progressPattern[progressIndex]);
      }
    }, 900);
  }

  function success(text = PAGE_LANG === "en" ? "Done" : "완료") {
    if (!loadingEl) return;

    clearAllTimers();
    updateProgress(100);
    updateStep(text);

    const stepEl = loadingEl.querySelector(".mh-loading-step");
    if (stepEl) {
      stepEl.classList.remove("mh-loading-error");
      stepEl.classList.add("mh-loading-success");
    }

    setTimeout(() => {
      if (loadingEl) loadingEl.style.display = "none";
    }, 500);
  }

  function fail(text = PAGE_LANG === "en" ? "Unable to load." : "불러오지 못했습니다.") {
    if (!loadingEl) return;

    clearAllTimers();

    const spinner = loadingEl.querySelector(".mh-loading-spinner");
    const stepEl = loadingEl.querySelector(".mh-loading-step");
    const barEl = loadingEl.querySelector(".mh-loading-progress-bar");

    if (spinner) spinner.style.display = "none";
    if (barEl) barEl.style.width = "100%";

    if (stepEl) {
      stepEl.textContent = text;
      stepEl.classList.remove("mh-loading-success");
      stepEl.classList.add("mh-loading-error");
    }
  }

  return { show, success, fail };
}

function fillOverviewBase(overview, aiDetailFallback = {}) {
  const detail = overview?.detail || aiDetailFallback || {};

  canonicalSymbol = String(detail?.symbol || canonicalSymbol || rawSymbol).trim().toUpperCase();

  const displayName =
    detail?.name || detail?.name_kr || detail?.name_en || cleanSymbol(canonicalSymbol);

  const displayCode = cleanSymbol(canonicalSymbol);
  const displayTitle = formatDisplayTitle(displayName, displayCode);

  document.title = `${displayTitle} | MarketHunters`;

  safeSetText("stock-title", displayTitle);
  safeSetText(
    "stock-subtitle",
    detail?.summary || (
      PAGE_LANG === "en"
        ? `Check recent price action, volatility, related news, and AI analysis for ${displayTitle}.`
        : `${displayTitle}의 최근 주가, 변동률, 관련 뉴스와 AI 해설을 확인할 수 있습니다.`
    )
  );
  safeSetText("stock-market", detail?.market || "-");
  safeSetText("stock-exchange", detail?.exchange || "-");
  safeSetText("stock-currency", detail?.currency || "-");
  safeSetText("stock-industry", detail?.industry || "-");
  safeSetText("stock-summary", detail?.summary || "-");

  const chartRows = getOverviewChartRows(overview, aiDetailFallback);
  const latest = chartRows.length ? getChartValue(chartRows[chartRows.length - 1]) : null;
  const prev = chartRows.length > 1 ? getChartValue(chartRows[chartRows.length - 2]) : null;

  const price =
    detail?.price ??
    detail?.close ??
    detail?.current_price ??
    detail?.last_price ??
    latest;

  let change =
    detail?.change_pct ??
    detail?.rate ??
    detail?.diff_pct ??
    detail?.changePercent ??
    null;

  if (
    (
      change === null ||
      change === undefined ||
      change === "" ||
      (Number(change) === 0 && latest !== null && prev !== null && prev !== 0 && latest !== prev)
    ) &&
    latest !== null &&
    prev !== null &&
    prev !== 0
  ) {
    change = ((latest - prev) / prev) * 100;
  }

  const hasValidPrice =
    price !== null &&
    price !== undefined &&
    price !== "" &&
    !Number.isNaN(Number(price));

  const hasValidChange =
    change !== null &&
    change !== undefined &&
    change !== "" &&
    !Number.isNaN(Number(change));

  if (hasValidPrice) {
    safeSetText("stock-price", numberFmt(price));
  } else {
    safeSetText("stock-price", "-");
  }

  if (hasValidChange) {
    setChangeTextAndColor("stock-change", change);
  } else {
    setChangeTextAndColor("stock-change", null);
  }

  stockPageCache = chartRows;
  currentOverviewTechnicals = buildTechnicalsFromHistory(stockPageCache);
  drawChart(stockPageCache, currentChartPeriod);
}

function resetDetailToError() {
  safeSetText("stock-title", T.stockDetail);
  safeSetText("stock-subtitle", T.stockDetailError);
  safeSetText("stock-market", "-");
  safeSetText("stock-exchange", "-");
  safeSetText("stock-currency", "-");
  safeSetText("stock-price", "-");
  safeSetText("stock-change", "-");
  safeSetText("stock-industry", "-");
  safeSetText("stock-summary", "-");
  safeSetText("stock-rating", "-");
  setMetaTime("stock-ai-time", null);
  setMetaTime("news-summary-time", null);

  renderBullets(safeGet("news-summary"), T.stockDetailError);
  renderNewsList([]);
  renderBullets(safeGet("stock-ai-brief"), T.aiAnalysisError);

  stockPageCache = [];
  currentOverviewTechnicals = {};
  drawChart(stockPageCache, currentChartPeriod);
}

async function loadAiSection(targetSymbol = canonicalSymbol) {
  const aiLoader = createLoadingController(
    "stock-ai-brief",
    "stock-ai-loading",
    T.aiAnalysisLoadingTitle,
    T.aiAnalysisLoadingSteps
  );

  aiLoader.show();
  setMetaTime("stock-ai-time", null);

  try {
    const finalTarget = String(targetSymbol || canonicalSymbol || rawSymbol).trim().toUpperCase();

    const stockBrief = await fetchJsonBySymbolPath(
      (candidate) => `${API_BASE}/ai/stock-brief/${encodeURIComponent(candidate)}?lang=${encodeURIComponent(PAGE_LANG)}`,
      finalTarget
    );

    renderRating(stockBrief);
    renderAiBrief(stockBrief, currentOverviewTechnicals);
    setMetaTime(
      "stock-ai-time",
      stockBrief?.generated_at || stockBrief?.updated_at || stockBrief?.created_at || null
    );

    aiLoader.success(T.aiAnalysisDone);
  } catch (e) {
    console.error("loadAiSection error:", e);
    renderBullets(safeGet("stock-ai-brief"), T.aiAnalysisError);
    safeSetText("stock-rating", "-");
    setMetaTime("stock-ai-time", null);
    aiLoader.fail(T.aiAnalysisErrorShort);
  }
}

async function loadNewsSection(overviewNews = [], targetSymbol = canonicalSymbol) {
  const newsLoader = createLoadingController(
    "news-summary",
    "news-summary-loading",
    T.newsSummaryLoadingTitle,
    T.newsSummaryLoadingSteps
  );

  newsLoader.show();
  setMetaTime("news-summary-time", null);

  try {
    const finalTarget = String(targetSymbol || canonicalSymbol || rawSymbol).trim().toUpperCase();

    const summary = await fetchJsonBySymbolPath(
      (candidate) => `${API_BASE}/ai/news-summary/${encodeURIComponent(candidate)}?lang=${encodeURIComponent(PAGE_LANG)}`,
      finalTarget
    );

    const newsRows = normalizeNewsRows(summary?.news || overviewNews || []);
    const aiSummaryText = extractPureAiSummary(summary);

    if (!aiSummaryText) {
      renderBullets(safeGet("news-summary"), T.newsSummaryEmpty);
    } else {
      renderBullets(safeGet("news-summary"), aiSummaryText);
    }

    setMetaTime("news-summary-time", summary?.generated_at || null);
    renderNewsList(newsRows);
    newsLoader.success(T.newsSummaryDone);
  } catch (e) {
    console.error("loadNewsSection error:", e);

    renderBullets(safeGet("news-summary"), T.newsSummaryError);
    renderNewsList(normalizeNewsRows(overviewNews));
    setMetaTime("news-summary-time", null);
    newsLoader.fail(T.newsSummaryErrorShort);
  }
}

async function loadStock() {
  try {
    setMetaTime("stock-ai-time", null);
    setMetaTime("news-summary-time", null);

    const overview = await fetchOverviewWithRetry(symbol, 2, 500);
    const detail = overview?.detail || {};

    canonicalSymbol = String(detail?.symbol || rawSymbol).trim().toUpperCase();

    fillOverviewBase(overview, {});
    updateSEO(detail, overview?.meta || {});
    renderNewsList(normalizeNewsRows(overview?.news || []));
    renderBullets(safeGet("stock-ai-brief"), T.aiAnalysisLoading);
    renderBullets(safeGet("news-summary"), T.newsSummaryLoading);

    await Promise.allSettled([
      loadAiSection(canonicalSymbol),
      loadNewsSection(overview?.news || [], canonicalSymbol),
    ]);
  } catch (e) {
    console.error("loadStock error:", e);
    resetDetailToError();
  }
}

window.addEventListener("resize", () => {
  drawChart(stockPageCache, currentChartPeriod);
});

document.addEventListener("DOMContentLoaded", async () => {
  const periodSelect = safeGet("chart-period");

  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      currentChartPeriod = e.target.value || "1M";
      drawChart(stockPageCache, currentChartPeriod);
    });
  }

  ensureLoadingStyles();
  await initializeSymbolFromLocation();
  loadLegal();
  loadStock();
});

/* ============================= */
/* Language switch keep symbol   */
/* ============================= */
(function () {
  const params = new URLSearchParams(window.location.search);
  const currentSymbol = params.get("symbol");

  if (!currentSymbol) return;

  const krBtn = document.querySelector('a[href="/stock.html"]');
  const enBtn = document.querySelector('a[href="/en/stock.html"]');

  if (krBtn) {
    krBtn.href = `/stock.html?symbol=${encodeURIComponent(currentSymbol)}`;
  }

  if (enBtn) {
    enBtn.href = `/en/stock.html?symbol=${encodeURIComponent(currentSymbol)}`;
  }
})();

/* ========================= */
/* SEO TITLE / DESCRIPTION   */
/* ========================= */
(function () {
  try {
    const params = new URLSearchParams(window.location.search);
    const currentSymbol = params.get("symbol");

    if (!currentSymbol) return;

    const sym = currentSymbol.toUpperCase();
    const pageTitle = `${sym} ${T.seoTitleSuffix}`;
    const pageDesc = PAGE_LANG === "en"
      ? `Read AI stock analysis, latest news summary, and market commentary for ${sym} on MarketHunters.`
      : `${sym} 종목의 AI 분석, 최신 뉴스 요약, 차트와 핵심 체크포인트를 MarketHunters에서 확인하세요.`;

    document.title = pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", pageDesc);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", pageTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute("content", T.ogDesc(sym));
    }
  } catch (e) {
    console.warn("SEO meta update skipped", e);
  }
})();