(() => {
  const HOME_API_BASE = "https://api.markethunters.kr/api";

  const MARKET_BRIEF_CACHE_KEY = "mh_market_brief_cache_v2";
  const MARKET_BRIEF_LAST_SLOT_KEY = "mh_market_brief_last_slot_v2";
  const BRIEF_REFRESH_HOURS_KST = [9, 18]; // 오전 9시, 오후 6시 기준
  const BRIEF_CHECK_INTERVAL_MS = 60 * 1000; // 1분마다 슬롯 변경 체크

  const MARKET_INDEX_CACHE_KEY = "mh_market_index_cache_v1";
  const MARKET_INDEX_CACHE_MINUTES = 1; // 시장지수 1분 캐시

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
          <div class="mh-brief-loading-title">AI 시장 브리핑 생성 중</div>
          <div class="mh-brief-loading-step">시장 데이터 수집 중...</div>
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

    const steps = [
      "시장 데이터 수집 중...",
      "주요 이슈 정리 중...",
      "AI 브리핑 문장 생성 중...",
      "표현 다듬는 중..."
    ];

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

    function success(text = "브리핑 업데이트 완료") {
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

    function fail(text = "브리핑을 불러오지 못했습니다.") {
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

    const titleText = data?.title || "오늘 시장 브리핑";
    const briefText = data?.brief || data?.content || "시장 브리핑이 없습니다.";
    const generatedAt = data?.generated_at || data?.created_at || data?.updated_at || null;
    const staleLabel = options.stale ? '<div style="margin-top:8px; font-size:12px; color:#fbbf24;">이전 저장 브리핑 표시 중</div>' : "";

    el.innerHTML = `
      <div class="brief-title">${escapeHtml(titleText)}</div>
      <div class="brief-content">${escapeHtml(String(briefText)).replace(/\r?\n/g, "<br>")}</div>
      ${staleLabel}
    `;

    if (timeEl) {
      timeEl.textContent = `생성: ${formatGeneratedAt(generatedAt)}`;
    }
  }

  function renderIndices(items) {
    const el = document.getElementById("indices");
    if (!el) return;

    if (!items || !items.length) {
      el.innerHTML = '<div class="empty-row">시장 지수 데이터 없음</div>';
      return;
    }

    el.innerHTML = items.map((item) => {
      const pct = Number(item?.change_pct ?? 0);
      const cls = pct > 0 ? "up" : pct < 0 ? "down" : "flat";

      const noteMap = {
        NASDAQ: "미국 기술주 지표 (프록시)",
        SP500: "미국 대형주 지표 (프록시)"
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
      el.innerHTML = '<div class="empty-row">시장 지수 불러오는 중...</div>';
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
          el.innerHTML = '<div class="empty-row">시장 지수 데이터 없음</div>';
        }
        return;
      }

      saveIndexCache(items);
      renderIndices(items);
    } catch (e) {
      console.error("loadIndices error:", e);

      if (!cached?.length) {
        el.innerHTML = '<div class="empty-row">시장 지수를 불러오지 못했습니다.</div>';
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

    if (!force && cached?.slotKey === currentSlotKey && cached?.data) {
      renderMarketBrief(cached.data, { stale: false });
      saveLastSlotKey(currentSlotKey);
      return;
    }

    try {
      if (timeEl) {
        timeEl.textContent = "생성: -";
      }

      loader.show();

      const res = await fetch(`${HOME_API_BASE}/ai/market-brief`, {
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
        data
      });

      saveLastSlotKey(currentSlotKey);
      loader.success("브리핑 업데이트 완료");
    } catch (e) {
      console.error("loadMarketBrief error:", e);

      if (cached?.data) {
        renderMarketBrief(cached.data, { stale: true });
      } else {
        el.innerHTML = '<div class="empty-row">브리핑을 불러오지 못했습니다.</div>';
        if (timeEl) {
          timeEl.textContent = "생성: -";
        }
      }

      loader.fail("브리핑을 불러오지 못했습니다.");
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