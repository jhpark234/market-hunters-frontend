const API_BASE = "https://api.markethunters.kr/api";

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "-";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detectLang() {
  const htmlLang = String(document.documentElement.lang || "").trim().toLowerCase();
  if (htmlLang === "en") return "en";
  if (window.location.pathname.includes("/en/")) return "en";
  return "ko";
}

const LANG = detectLang();

const I18N = {
  ko: {
    pageDefaultTitle: "경제지표",
    invalidAccess: "잘못된 접근입니다.",
    loadingDescription: "경제지표 데이터를 불러오는 중입니다.",
    noContent: "내용이 없습니다.",
    noSummary: "요약 정보가 없습니다.",
    noAnalysis: "분석 정보가 없습니다.",
    noScheduleInfo: "일정 정보 없음",
    needScheduleCheck: "일정 확인 필요",
    scheduled: "예정",
    released: "발표 완료",
    comparePending: "비교 대기",
    comparePendingNote: "수치 비교 확인",
    upVsPrevious: "▲ 이전 대비 상승",
    upVsPreviousNote: "이전값보다 높음",
    downVsPrevious: "▼ 이전 대비 하락",
    downVsPreviousNote: "이전값보다 낮음",
    sameAsPrevious: "■ 이전과 동일",
    sameAsPreviousNote: "이전값과 유사",
    noConsensus: "컨센서스 없음",
    noConsensusNote: "예상 대비 비교 불가",
    aboveForecast: "▲ 예상 상회",
    aboveForecastNote: "예상보다 높음",
    belowForecast: "▼ 예상 하회",
    belowForecastNote: "예상보다 낮음",
    inlineForecast: "■ 예상 부합",
    inlineForecastNote: "예상과 유사",
    recentSchedule: "가장 최근 확인 일정",
    nextSchedule: "다음 발표 일정",
    previousReleaseBase: "직전 발표 기준",
    previousReleaseBadge: "이전 발표값",
    summaryLoadFail: "요약 정보를 불러오지 못했습니다.",
    analysisLoadFail: "시장 영향 해설을 불러오지 못했습니다.",
    retryCheck: "데이터 연결 상태를 확인한 뒤 다시 시도해 주세요.",
    loadFailDescription: "데이터를 불러오지 못했습니다.",
    loadFailRelease: "불러오기 실패",
    errorBadge: "오류",
    noData: "데이터 없음",
    neutral: "중립",
    marketImpactTail:
      "투자자 입장에서 중요한 것은 숫자 하나만 보는 것이 아니라, 이전 발표 대비 변화와 시장 기대의 차이를 함께 해석하는 것입니다. 특히 금리와 환율, 기술주 및 채권시장의 반응은 같은 숫자라도 당시의 매크로 환경에 따라 달라질 수 있습니다.",
    calloutUp:
      "{title}의 이번 수치는 이전 발표보다 높은 수준입니다. 시장은 이 변화가 금리 기대와 위험자산 선호에 어떤 영향을 줄지 함께 해석하려 할 가능성이 큽니다.",
    calloutDown:
      "{title}의 이번 수치는 이전 발표보다 낮은 수준입니다. 숫자 자체보다도 시장 기대와 중앙은행 정책 방향이 함께 어떻게 바뀌는지가 중요합니다.",
    calloutFlat:
      "{title}는 이전 발표와 큰 차이가 없거나 비교 가능한 데이터가 제한적입니다. 발표 직후에는 수치 자체보다 시장의 해석과 금리 기대 변화를 함께 보는 것이 중요합니다.",
    pageDesc:
      "{title}의 발표일, 실제값, 예상값, 이전값과 시장 영향 포인트를 제공합니다.",
    metaDesc:
      "{title}의 발표일, 실제값, 예상값, 이전값과 시장 영향 해설을 MarketHunters에서 확인하세요.",
    ogDesc:
      "{title}의 발표일, 실제값, 예상값, 이전값과 시장 영향 해설 제공"
  },
  en: {
    pageDefaultTitle: "Economic Indicator",
    invalidAccess: "Invalid request.",
    loadingDescription: "Loading economic indicator data...",
    noContent: "No content available.",
    noSummary: "No summary available.",
    noAnalysis: "No analysis available.",
    noScheduleInfo: "No schedule info",
    needScheduleCheck: "Schedule needs review",
    scheduled: "Scheduled",
    released: "Released",
    comparePending: "Waiting",
    comparePendingNote: "Comparison unavailable",
    upVsPrevious: "▲ Up vs previous",
    upVsPreviousNote: "Higher than previous",
    downVsPrevious: "▼ Down vs previous",
    downVsPreviousNote: "Lower than previous",
    sameAsPrevious: "■ In line with previous",
    sameAsPreviousNote: "Similar to previous",
    noConsensus: "No consensus",
    noConsensusNote: "Forecast comparison unavailable",
    aboveForecast: "▲ Above forecast",
    aboveForecastNote: "Higher than forecast",
    belowForecast: "▼ Below forecast",
    belowForecastNote: "Lower than forecast",
    inlineForecast: "■ In line with forecast",
    inlineForecastNote: "Similar to forecast",
    recentSchedule: "Most recently confirmed schedule",
    nextSchedule: "Next scheduled release",
    previousReleaseBase: "Based on previous release",
    previousReleaseBadge: "Previous release",
    summaryLoadFail: "Unable to load summary information.",
    analysisLoadFail: "Unable to load market impact analysis.",
    retryCheck: "Please check the data connection and try again.",
    loadFailDescription: "Unable to load data.",
    loadFailRelease: "Load failed",
    errorBadge: "Error",
    noData: "No data",
    neutral: "Neutral",
    marketImpactTail:
      "For investors, it is important not to focus only on one number. What matters is how the result changes versus the previous release and how it shifts market expectations. Reactions in rates, FX, technology stocks, and bonds can vary depending on the broader macro environment.",
    calloutUp:
      "This release of {title} came in higher than the previous reading. The market is likely to interpret how that change may affect rate expectations and overall risk appetite.",
    calloutDown:
      "This release of {title} came in lower than the previous reading. More than the number itself, what matters is how market expectations and central bank policy views change together.",
    calloutFlat:
      "{title} showed little change versus the previous release, or comparable data may be limited. Right after the release, market interpretation and changes in rate expectations matter as much as the number itself.",
    pageDesc:
      "Check the release date, actual, forecast, previous value, and market impact for {title}.",
    metaDesc:
      "Check the release date, actual, forecast, previous value, and market impact analysis for {title} on MarketHunters.",
    ogDesc:
      "Release date, actual, forecast, previous value, and market impact analysis for {title}."
  }
};

const T = I18N[LANG];

function t(key, vars = {}) {
  let text = T[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replaceAll(`{${k}}`, String(v ?? ""));
  });
  return text;
}

function nl2p(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return `<p>${escapeHtml(t("noContent"))}</p>`;

  const blocks = raw
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `<p>${escapeHtml(s).replace(/\n/g, "<br>")}</p>`);

  return blocks.join("");
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  if (LANG === "en") {
    return `${y}-${m}-${day} ${hh}:${mm}`;
  }

  return `${y}-${m}-${day} ${hh}:${mm}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function releaseStateText(value) {
  if (!value) return t("noScheduleInfo");

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return t("needScheduleCheck");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() >= today.getTime()) {
    return t("scheduled");
  }

  return t("released");
}

function parseNumeric(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/K/g, "")
    .trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function setBadge(id, text, type) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.className = `eco-delta ${type}`;
}

function compareValues(actual, previous) {
  const a = parseNumeric(actual);
  const p = parseNumeric(previous);

  if (a === null || p === null) {
    return {
      type: "flat",
      text: t("comparePending"),
      note: t("comparePendingNote")
    };
  }

  if (a > p) {
    return {
      type: "up",
      text: t("upVsPrevious"),
      note: t("upVsPreviousNote")
    };
  }

  if (a < p) {
    return {
      type: "down",
      text: t("downVsPrevious"),
      note: t("downVsPreviousNote")
    };
  }

  return {
    type: "flat",
    text: t("sameAsPrevious"),
    note: t("sameAsPreviousNote")
  };
}

function compareForecast(actual, forecast) {
  const a = parseNumeric(actual);
  const f = parseNumeric(forecast);

  if (a === null || f === null) {
    return {
      type: "flat",
      text: t("noConsensus"),
      note: t("noConsensusNote")
    };
  }

  if (a > f) {
    return {
      type: "up",
      text: t("aboveForecast"),
      note: t("aboveForecastNote")
    };
  }

  if (a < f) {
    return {
      type: "down",
      text: t("belowForecast"),
      note: t("belowForecastNote")
    };
  }

  return {
    type: "flat",
    text: t("inlineForecast"),
    note: t("inlineForecastNote")
  };
}

function buildCallout(title, actual, previous) {
  const cmp = compareValues(actual, previous);

  if (cmp.type === "up") {
    return t("calloutUp", { title });
  }

  if (cmp.type === "down") {
    return t("calloutDown", { title });
  }

  return t("calloutFlat", { title });
}

function setMeta(title) {
  document.title = `${title} | MarketHunters`;

  const desc = document.querySelector('meta[name="description"]');
  if (desc) {
    desc.setAttribute("content", t("metaDesc", { title }));
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute("content", `${title} | MarketHunters`);
  }

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute("content", t("ogDesc", { title }));
  }
}

async function loadEconomicDetail() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");

  if (!eventId) {
    setText("eco-title", t("pageDefaultTitle"));
    setText("eco-description", t("invalidAccess"));
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/economic/detail/${encodeURIComponent(eventId)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    const title = data?.event_name || t("pageDefaultTitle");
    const country = data?.country || "GLOBAL";
    const releaseDate = data?.release_date || "";
    const actual = data?.actual || "-";
    const forecast = data?.forecast || "-";
    const previous = data?.previous || "-";
    const source = data?.source || "-";
    const updatedAt = data?.updated_at || "";
    const summaryText = data?.summary_text || t("noSummary");
    const analysisText = data?.analysis_text || t("noAnalysis");

    setText("eco-country", country);
    setText("eco-badge", country);
    setText("eco-title", title);
    setText("eco-description", t("pageDesc", { title }));

    const releaseState = releaseStateText(releaseDate);
    setText("eco-release-date", formatDate(releaseDate));
    setText(
      "eco-release-note",
      releaseState === t("scheduled") ? t("nextSchedule") : t("recentSchedule")
    );
    setBadge(
      "eco-release-badge",
      releaseState,
      releaseState === t("scheduled") ? "up" : "flat"
    );

    setText("eco-actual", actual);
    const actualVsPrev = compareValues(actual, previous);
    setText("eco-actual-note", actualVsPrev.note);
    setBadge("eco-actual-badge", actualVsPrev.text, actualVsPrev.type);

    setText("eco-forecast", forecast);
    const actualVsForecast = compareForecast(actual, forecast);
    setText("eco-forecast-note", actualVsForecast.note);
    setBadge("eco-forecast-badge", actualVsForecast.text, actualVsForecast.type);

    setText("eco-previous", previous);
    setText("eco-previous-note", t("previousReleaseBase"));
    setBadge("eco-previous-badge", t("previousReleaseBadge"), "flat");

    const summaryEl = $("eco-summary");
    if (summaryEl) {
      summaryEl.innerHTML = nl2p(summaryText);
    }

    const analysisEl = $("eco-analysis");
    if (analysisEl) {
      const refinedAnalysis = `${analysisText}\n\n${t("marketImpactTail")}`;
      analysisEl.innerHTML = nl2p(refinedAnalysis);
    }

    setText("eco-callout", buildCallout(title, actual, previous));

    setText("eco-source", source);
    setText("eco-updated-at", formatDateTime(updatedAt));

    setMeta(title);
  } catch (err) {
    console.error("economic-detail error:", err);

    setText("eco-title", t("pageDefaultTitle"));
    setText("eco-description", t("loadFailDescription"));
    setText("eco-release-date", "-");
    setText("eco-release-note", t("loadFailRelease"));
    setText("eco-actual", "-");
    setText("eco-forecast", "-");
    setText("eco-previous", "-");
    setText("eco-source", "-");
    setText("eco-updated-at", "-");

    setBadge("eco-release-badge", t("errorBadge"), "down");
    setBadge("eco-actual-badge", t("noData"), "flat");
    setBadge("eco-forecast-badge", t("noData"), "flat");
    setBadge("eco-previous-badge", t("noData"), "flat");

    const summaryEl = $("eco-summary");
    if (summaryEl) {
      summaryEl.innerHTML = `<p>${escapeHtml(t("summaryLoadFail"))}</p>`;
    }

    const analysisEl = $("eco-analysis");
    if (analysisEl) {
      analysisEl.innerHTML = `<p>${escapeHtml(t("analysisLoadFail"))}</p>`;
    }

    setText("eco-callout", t("retryCheck"));
  }
}

document.addEventListener("DOMContentLoaded", loadEconomicDetail);