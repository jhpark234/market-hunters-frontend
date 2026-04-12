// frontend/home_live.js

(() => {
  const HOME_API_BASE = "https://api.markethunters.kr/api";
  const PAGE_LANG = document.documentElement.lang === "en" ? "en" : "ko";

  const MARKET_BRIEF_CACHE_KEY = `mh_market_brief_cache_v3_${PAGE_LANG}`;
  const MARKET_BRIEF_LAST_SLOT_KEY = `mh_market_brief_last_slot_v3_${PAGE_LANG}`;
  const BRIEF_REFRESH_HOURS_KST = [9, 18]; // 오전 9시, 오후 6시 기준
  const BRIEF_CHECK_INTERVAL_MS = 60 * 1000; // 1분마다 슬롯 변경 체크

  const MARKET_INDEX_CACHE_KEY = "mh_market_index_cache_v1";
  const MARKET_INDEX_CACHE_MINUTES = 1; // 시장지수 1분 캐시

  const TEXT = PAGE_LANG === "en"
    ? {
        briefLoadingTitle: "Generating AI market brief",
        briefLoadingSteps: [
          "Collecting market data...",
          "Summarizing key issues...",
          "Generating AI brief...",
          "Polishing the wording..."
        ],
        briefSuccess: "Brief updated",
        briefFail: "Unable to load the brief.",
        briefTitle: "AI Market Brief",
        briefEmpty: "No market brief is available.",
        briefGenerated: "Generated",
        briefStale: "Showing the previously saved brief",
        indicesLoading: "Loading market indices...",
        indicesEmpty: "No market index data available",
        indicesFail: "Unable to load market indices.",
        nasdaqNote: "U.S. technology benchmark (proxy)",
        sp500Note: "U.S. large-cap benchmark (proxy)"
      }
    : {
        briefLoadingTitle: "AI 시장 브리핑 생성 중",
        briefLoadingSteps: [
          "시장 데이터 수집 중...",
          "주요 이슈 정리 중...",
          "AI 브리핑 문장 생성 중...",
          "표현 다듬는 중..."
        ],
        briefSuccess: "브리핑 업데이트 완료",
        briefFail: "브리핑을 불러오지 못했습니다.",
        briefTitle: "오늘 시장 브리핑",
        briefEmpty: "시장 브리핑이 없습니다.",
        briefGenerated: "생성",
        briefStale: "이전 저장 브리핑 표시 중",
        indicesLoading: "시장 지수 불러오는 중...",
        indicesEmpty: "시장 지수 데이터 없음",
        indicesFail: "시장 지수를 불러오지 못했습니다.",
        nasdaqNote: "미국 기술주 지표 (프록시)",
        sp500Note: "미국 대형주 지표 (프록시)"
      };

  function fmtNumber(value) {
    if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
      return "-";
    }
    return Number(value).toLocaleString("ko-KR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function fmtPct(value) {
    if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
      return "-";
    }
    const n = Number(value);
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toFixed(2)}%`;
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"]/g, (s) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[s]));
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

  function getKstNowDate() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 9 * 60 * 60 * 1000);
  }

  function formatYmd(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function getCurrentBriefSlotKey() {
    const kstNow = getKstNowDate();
    const hour = kstNow.getHours();
    const slotDate = new Date(kstNow);
    let slotHourLabel = "18";

    if (hour < BRIEF_REFRESH_HOURS_KST[0]) {
      slotDate.setDate(slotDate.getDate() - 1);
      slotHourLabel = "18";
    } else if (hour < BRIEF_REFRESH_HOURS_KST[1]) {
      slotHourLabel = "09";
    } else {
      slotHourLabel = "18";
    }

    return `${formatYmd(slotDate)}-${slotHourLabel}`;
  }

  function loadBriefCache() {
    try {
      const raw = localStorage.getItem(MARKET_BRIEF_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveBriefCache(payload) {
    try {
      localStorage.setItem(MARKET_BRIEF_CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("saveBriefCache warning:", e);
    }
  }

  function saveLastSlotKey(slotKey) {
    try {
      localStorage.setItem(MARKET_BRIEF_LAST_SLOT_KEY, slotKey);
    } catch (e) {
      console.warn("saveLastSlotKey warning:", e);
    }
  }

  function loadLastSlotKey() {
    try {
      return localStorage.getItem(MARKET_BRIEF_LAST_SLOT_KEY) || "";
    } catch {
      return "";
    }
  }

  function loadIndexCache() {
    try {
      const raw = localStorage.getItem(MARKET_INDEX_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.savedAt || !Array.isArray(parsed.data)) return null;

      const savedAt = new Date(parsed.savedAt).getTime();
      if (Number.isNaN(savedAt)) return null;

      const now = Date.now();
      const diff = now - savedAt;

      if (diff > MARKET_INDEX_CACHE_MINUTES * 60 * 1000) {
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  }

  function saveIndexCache(data) {
    try {
      localStorage.setItem(MARKET_INDEX_CACHE_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        data
      }));
    } catch (e) {
      console.warn("saveIndexCache warning:", e);
    }
  }

  function ensureBriefLoadingStyles() {
    if (document.getElementById("market-brief-loading-styles")) return;

    const style = document.createElement("style");
    style.id = "market-brief-loading-styles";
    style.textContent = `
      .mh-brief-loading {
        margin-top: 8px;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid rgba(94, 157, 255, 0.14);
        background: rgba(255, 255, 255, 0.03);
        color: #b8c7e6;
      }

      .mh-brief-loading-top {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .mh-brief-spinner {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid rgba(94, 157, 255, 0.18);
        border-top-color: #5e9dff;
        animation: mh-brief-spin 0.85s linear infinite;
        flex-shrink: 0;
      }

      .mh-brief-loading-title {
        font-size: 14px;
        font-weight: 700;
        color: #eef4ff;
        margin-bottom: 4px;
      }

      .mh-brief-loading-step {
        font-size: 13px;
        color: #9aa4b2;
        min-height: 18px;
      }

      .mh-brief-progress {
        width: 100%;
        height: 6px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255,255,255,0.06);
        margin-bottom: 12px;
      }

      .mh-brief-progress-bar {
        width: 18%;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #4f82ff 0%, #79a8ff 100%);
        box-shadow: 0 0 14px rgba(79, 130, 255, 0.25);
        transition: width 0.4s ease;
      }

      .mh-brief-skeleton-wrap {
        display: grid;
        gap: 9px;
      }

      .mh-brief-skeleton-line {
        position: relative;
        height: 11px;
        border-radius: 999px;
        background: rgba(255,255,255,0.05);
        overflow: hidden;
      }

      .mh-brief-skeleton-line::after {
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
        animation: mh-brief-shimmer 1.3s ease-in-out infinite;
      }

      .mh-brief-w-100 { width: 100%; }
      .mh-brief-w-92 { width: 92%; }
      .mh-brief-w-86 { width: 86%; }
      .mh-brief-w-80 { width: 80%; }
      .mh-brief-w-72 { width: 72%; }

      .mh-brief-success {
        color: #86efac;
      }

      .mh-brief-error {
        color: #fca5a5;
      }

      @keyframes mh-brief-spin {
        to { transform: rotate(360deg); }
      }

      @keyframes mh-brief-shimmer {
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureBriefLoadingBox() {
    ensureBriefLoadingStyles();

    const briefEl = document.getElementById("brief");
    if (!briefEl || !briefEl.parentNode) return null;

    let loadingEl = document.getElementById("market-brief-loading");
    if (loadingEl) return loadingEl;

    loadingEl = document.createElement("div");
    loadingEl.id = "market-brief-loading";
    loadingEl.className = "mh-brief-loading";
    loadingEl.style.display = "none";
    loadingEl.innerHTML = `
      <div class="mh-brief-loading-top">
        <div class="mh-brief-spinner"></div>
        <div>
          <div class="mh-brief-loading-title">${escapeHtml(TEXT.briefLoadingTitle)}</div>
          <div class="mh-brief-loading-step">${escapeHtml(TEXT.briefLoadingSteps[0])}</div>
        </div>
      </div>
      <div class="mh-brief-progress">
        <div class="mh-brief-progress-bar"></div>
      </div>
      <div class="mh-brief-skeleton-wrap">
        <div class="mh-brief-skeleton-line mh-brief-w-100"></div>
        <div class="mh-brief-skeleton-line mh-brief-w-92"></div>
        <div class="mh-brief-skeleton-line mh-brief-w-86"></div>
        <div class="mh-brief-skeleton-line mh-brief-w-80"></div>
        <div class="mh-brief-skeleton-line mh-brief-w-72"></div>
      </div>
    `;

    briefEl.parentNode.insertBefore(loadingEl, briefEl);
    return loadingEl;
  }

  function createBriefLoadingController() {
    const loadingEl = ensureBriefLoadingBox();
    let stepTimer = null;
    let progressTimer = null;
    let stepIndex = 0;
    let progressIndex = 0;

    const steps = TEXT.briefLoadingSteps;
    const progressPattern = [18, 29, 43, 58, 72, 84, 93];

    function clearTimers() {
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
      const stepEl = loadingEl.querySelector(".mh-brief-loading-step");
      if (stepEl) stepEl.textContent = text;
    }

    function updateProgress(value) {
      if (!loadingEl) return;
      const barEl = loadingEl.querySelector(".mh-brief-progress-bar");
      if (barEl) barEl.style.width = `${value}%`;
    }

    function resetState() {
      if (!loadingEl) return;
      const spinnerEl = loadingEl.querySelector(".mh-brief-spinner");
      const stepEl = loadingEl.querySelector(".mh-brief-loading-step");

      if (spinnerEl) spinnerEl.style.display = "";
      if (stepEl) {
        stepEl.classList.remove("mh-brief-success", "mh-brief-error");
      }
    }

    function show() {
      if (!loadingEl) return;

      resetState();
      loadingEl.style.display = "";
      stepIndex = 0;
      progressIndex = 0;

      updateStep(steps[0]);
      updateProgress(progressPattern[0]);

      clearTimers();

      stepTimer = window.setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        updateStep(steps[stepIndex]);
      }, 1400);

      progressTimer = window.setInterval(() => {
        if (progressIndex < progressPattern.length - 1) {
          progressIndex += 1;
          updateProgress(progressPattern[progressIndex]);
        }
      }, 900);
    }

    function success(text = TEXT.briefSuccess) {
      if (!loadingEl) return;

      clearTimers();
      updateProgress(100);

      const stepEl = loadingEl.querySelector(".mh-brief-loading-step");
      if (stepEl) {
        stepEl.textContent = text;
        stepEl.classList.remove("mh-brief-error");
        stepEl.classList.add("mh-brief-success");
      }

      setTimeout(() => {
        if (loadingEl) loadingEl.style.display = "none";
      }, 500);
    }

    function fail(text = TEXT.briefFail) {
      if (!loadingEl) return;

      clearTimers();

      const spinnerEl = loadingEl.querySelector(".mh-brief-spinner");
      const stepEl = loadingEl.querySelector(".mh-brief-loading-step");
      const barEl = loadingEl.querySelector(".mh-brief-progress-bar");

      if (spinnerEl) spinnerEl.style.display = "none";
      if (barEl) barEl.style.width = "100%";
      if (stepEl) {
        stepEl.textContent = text;
        stepEl.classList.remove("mh-brief-success");
        stepEl.classList.add("mh-brief-error");
      }
    }

    return { show, success, fail };
  }

  function renderMarketBrief(data, options = {}) {
    const el = document.getElementById("brief");
    const timeEl = document.getElementById("market-brief-time");

    if (!el) return;

    const titleText = data?.title || TEXT.briefTitle;
    const briefText = data?.brief || data?.content || TEXT.briefEmpty;
    const generatedAt = data?.generated_at || data?.created_at || data?.updated_at || null;
    const staleLabel = options.stale
      ? `<div style="margin-top:8px; font-size:12px; color:#fbbf24;">${escapeHtml(TEXT.briefStale)}</div>`
      : "";

    el.innerHTML = `
      <div class="brief-title">${escapeHtml(titleText)}</div>
      <div class="brief-content">${escapeHtml(String(briefText)).replace(/\r?\n/g, "<br>")}</div>
      ${staleLabel}
    `;

    if (timeEl) {
      timeEl.textContent = `${TEXT.briefGenerated}: ${formatGeneratedAt(generatedAt)}`;
    }
  }

  function renderIndices(items) {
    const el = document.getElementById("indices");
    if (!el) return;

    if (!items || !items.length) {
      el.innerHTML = `<div class="empty-row">${escapeHtml(TEXT.indicesEmpty)}</div>`;
      return;
    }

    el.innerHTML = items.map((item) => {
      const pct = Number(item?.change_pct ?? 0);
      const cls = pct > 0 ? "up" : pct < 0 ? "down" : "flat";

      const noteMap = {
        NASDAQ: TEXT.nasdaqNote,
        SP500: TEXT.sp500Note
      };

      const note = noteMap[item?.code] || item?.note || "";

      return `
        <div class="index-row">
          <div class="index-left">
            <div class="index-name">${escapeHtml(item?.name || item?.code || "-")}</div>
            <div class="index-sub">${escapeHtml(note)}</div>
          </div>

          <div class="index-right">
            <div class="index-value">${fmtNumber(item?.value)}</div>
            <div class="index-pct ${cls}">${fmtPct(item?.change_pct)}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  async function loadIndices() {
    const el = document.getElementById("indices");
    if (!el) return;

    const cached = loadIndexCache();

    if (cached?.length) {
      renderIndices(cached);
    } else {
      el.innerHTML = `<div class="empty-row">${escapeHtml(TEXT.indicesLoading)}</div>`;
    }

    try {
      const res = await fetch(`${HOME_API_BASE}/market/index`, {
        cache: "no-store"
      });

      if (!res.ok) {
        throw new Error(`index fetch fail: ${res.status}`);
      }

      const data = await res.json();
      const items = data?.indices || [];

      if (!items.length) {
        if (!cached?.length) {
          el.innerHTML = `<div class="empty-row">${escapeHtml(TEXT.indicesEmpty)}</div>`;
        }
        return;
      }

      saveIndexCache(items);
      renderIndices(items);
    } catch (e) {
      console.error("loadIndices error:", e);

      if (!cached?.length) {
        el.innerHTML = `<div class="empty-row">${escapeHtml(TEXT.indicesFail)}</div>`;
      }
    }
  }

  async function loadMarketBrief(options = {}) {
    const el = document.getElementById("brief");
    const timeEl = document.getElementById("market-brief-time");
    const force = Boolean(options.force);
    const loader = createBriefLoadingController();

    if (!el) return;

    const currentSlotKey = getCurrentBriefSlotKey();
    const cached = loadBriefCache();

    if (!force && cached?.slotKey === currentSlotKey && cached?.lang === PAGE_LANG && cached?.data) {
      renderMarketBrief(cached.data, { stale: false });
      saveLastSlotKey(currentSlotKey);
      return;
    }

    try {
      if (timeEl) {
        timeEl.textContent = `${TEXT.briefGenerated}: -`;
      }

      loader.show();

      const res = await fetch(`${HOME_API_BASE}/ai/market-brief?lang=${encodeURIComponent(PAGE_LANG)}`, {
        cache: "no-store"
      });

      if (!res.ok) {
        throw new Error(`brief fetch fail: ${res.status}`);
      }

      const data = await res.json();

      renderMarketBrief(data, { stale: false });

      saveBriefCache({
        slotKey: currentSlotKey,
        fetchedAt: new Date().toISOString(),
        lang: PAGE_LANG,
        data
      });

      saveLastSlotKey(currentSlotKey);
      loader.success(TEXT.briefSuccess);
    } catch (e) {
      console.error("loadMarketBrief error:", e);

      if (cached?.data) {
        renderMarketBrief(cached.data, { stale: true });
      } else {
        el.innerHTML = `<div class="empty-row">${escapeHtml(TEXT.briefFail)}</div>`;
        if (timeEl) {
          timeEl.textContent = `${TEXT.briefGenerated}: -`;
        }
      }

      loader.fail(TEXT.briefFail);
    }
  }

  function watchBriefRefreshSlot() {
    setInterval(() => {
      const currentSlotKey = getCurrentBriefSlotKey();
      const lastSlotKey = loadLastSlotKey();

      if (currentSlotKey !== lastSlotKey) {
        loadMarketBrief({ force: true });
      }
    }, BRIEF_CHECK_INTERVAL_MS);
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureBriefLoadingStyles();
    loadIndices();
    loadMarketBrief();
    watchBriefRefreshSlot();
  });
})();

/* ===== LIVE AI SIGNAL (B plan, backend-driven) ===== */
(() => {
  const API_BASE = "https://api.markethunters.kr/api";
  const PAGE_LANG = document.documentElement.lang === "en" ? "en" : "ko";
  const CACHE_KEY = `mh_live_signal_v2_${PAGE_LANG}`;
  const CACHE_MINUTES = 10;
  const REFRESH_MS = 5 * 60 * 1000;

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"]/g, (s) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[s]));
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.savedAt || !parsed?.data) return null;
      const diff = Date.now() - new Date(parsed.savedAt).getTime();
      if (Number.isNaN(diff) || diff > CACHE_MINUTES * 60 * 1000) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function saveCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        data
      }));
    } catch {}
  }

  function signalClass(state) {
    if (state === "bull") return "mh-live-bull";
    if (state === "risk") return "mh-live-risk";
    return "mh-live-off";
  }

  function ensureLiveSignalStyles() {
    if (document.getElementById("mh-live-signal-styles")) return;

    const style = document.createElement("style");
    style.id = "mh-live-signal-styles";
    style.textContent = `
      .hero-signal-grid span {
        transition: transform .18s ease, opacity .18s ease, filter .18s ease, background .18s ease;
      }
      .hero-signal-grid span.mh-live-bull {
        background: linear-gradient(135deg, rgba(34,211,238,.92), rgba(99,102,241,.68));
        opacity: .98;
      }
      .hero-signal-grid span.mh-live-risk {
        background: linear-gradient(135deg, rgba(168,85,247,.82), rgba(59,130,246,.55));
        opacity: .96;
      }
      .hero-signal-grid span.mh-live-off {
        background: linear-gradient(135deg, rgba(15,23,42,1), rgba(14,31,57,.96));
        border: 1px solid rgba(255,255,255,.05);
        opacity: .9;
      }
    `;
    document.head.appendChild(style);
  }

  function applyGrid(grid) {
    const cells = $all(".hero-signal-grid span");
    const flat = Array.isArray(grid) ? grid.flat() : [];
    cells.forEach((cell, idx) => {
      cell.classList.remove("mh-live-bull", "mh-live-risk", "mh-live-off");
      cell.classList.add(signalClass(flat[idx] || "off"));
    });
  }

  function applyHero(data) {
    const scoreEl = $(".hero-visual .visual-score");
    const pillEl = $(".hero-visual .visual-pill");
    if (scoreEl) {
      scoreEl.innerHTML = `${Number(data?.score || 0)}<span>/100</span>`;
    }
    if (pillEl) {
      pillEl.textContent = data?.status || "AI WATCH";
    }
    applyGrid(data?.grid || []);
  }

  function applySignalStrip(data) {
    const cards = $all(".signal-strip .signal-card");
    if (cards.length < 3) return;

    const marketCard = cards[0];
    const riskCard = cards[1];
    const sectorCard = cards[2];

    const marketLabel = marketCard.querySelector(".signal-label");
    const marketValue = marketCard.querySelector(".signal-value");
    const marketBar = marketCard.querySelector(".signal-bar span");
    const marketCopy = marketCard.querySelector(".signal-copy");

    if (marketLabel) marketLabel.textContent = PAGE_LANG === "en" ? "AI Market Signal" : "AI MARKET SIGNAL";
    if (marketValue) marketValue.textContent = `${Number(data?.score || 0)} / 100`;
    if (marketBar) marketBar.style.width = `${Math.max(0, Math.min(100, Number(data?.score || 0)))}%`;
    if (marketCopy) marketCopy.textContent = data?.strip_summary || data?.summary || "";

    const riskLabel = riskCard.querySelector(".signal-label");
    const riskTags = riskCard.querySelector(".signal-tags");
    const riskCopy = riskCard.querySelector(".signal-copy");
    if (riskLabel) riskLabel.textContent = PAGE_LANG === "en" ? "Risk Focus" : "RISK FOCUS";
    if (riskTags) {
      riskTags.innerHTML = (data?.risk_focus || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    }
    if (riskCopy) {
      riskCopy.textContent = data?.summary || "";
    }

    const sectorLabel = sectorCard.querySelector(".signal-label");
    const sectorTags = sectorCard.querySelector(".signal-tags");
    const sectorCopy = sectorCard.querySelector(".signal-copy");
    if (sectorLabel) sectorLabel.textContent = PAGE_LANG === "en" ? "Focus Sectors" : "FOCUS SECTORS";
    if (sectorTags) {
      sectorTags.innerHTML = (data?.focus_sectors || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    }
    if (sectorCopy) {
      sectorCopy.textContent = data?.strip_summary || "";
    }
  }

  function applyData(data) {
    if (!data) return;
    applyHero(data);
    applySignalStrip(data);
  }

  async function fetchLiveSignal() {
    const res = await fetch(`${API_BASE}/ai/live-signal?lang=${encodeURIComponent(PAGE_LANG)}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache"
      }
    });
    if (!res.ok) throw new Error(`live-signal fetch failed: ${res.status}`);
    return await res.json();
  }

  async function loadLiveSignal(force = false) {
    if (!force) {
      const cached = loadCache();
      if (cached) {
        applyData(cached);
      }
    }
    try {
      const data = await fetchLiveSignal();
      saveCache(data);
      applyData(data);
    } catch (err) {
      console.error("loadLiveSignal error:", err);
    }
  }

  function bootLiveSignal() {
    if (!$(".hero-visual") || !$all(".signal-strip .signal-card").length) return;
    ensureLiveSignalStyles();
    loadLiveSignal(false);
    setInterval(() => loadLiveSignal(true), REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootLiveSignal);
  } else {
    bootLiveSignal();
  }
})();
