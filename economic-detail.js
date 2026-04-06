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

function nl2p(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return "<p>내용이 없습니다.</p>";

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
  if (!value) return "일정 정보 없음";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "일정 확인 필요";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() >= today.getTime()) {
    return "예정";
  }

  return "발표 완료";
}

function parseNumeric(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/,/g, "").replace(/%/g, "").replace(/K/g, "").trim();
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
      text: "비교 대기",
      note: "수치 비교 확인"
    };
  }

  if (a > p) {
    return {
      type: "up",
      text: "▲ 이전 대비 상승",
      note: "이전값보다 높음"
    };
  }

  if (a < p) {
    return {
      type: "down",
      text: "▼ 이전 대비 하락",
      note: "이전값보다 낮음"
    };
  }

  return {
    type: "flat",
    text: "■ 이전과 동일",
    note: "이전값과 유사"
  };
}

function compareForecast(actual, forecast) {
  const a = parseNumeric(actual);
  const f = parseNumeric(forecast);

  if (a === null || f === null) {
    return {
      type: "flat",
      text: "컨센서스 없음",
      note: "예상 대비 비교 불가"
    };
  }

  if (a > f) {
    return {
      type: "up",
      text: "▲ 예상 상회",
      note: "예상보다 높음"
    };
  }

  if (a < f) {
    return {
      type: "down",
      text: "▼ 예상 하회",
      note: "예상보다 낮음"
    };
  }

  return {
    type: "flat",
    text: "■ 예상 부합",
    note: "예상과 유사"
  };
}

function buildCallout(title, actual, previous) {
  const cmp = compareValues(actual, previous);

  if (cmp.type === "up") {
    return `${title}의 이번 수치는 이전 발표보다 높은 수준입니다. 시장은 이 변화가 금리 기대와 위험자산 선호에 어떤 영향을 줄지 함께 해석하려 할 가능성이 큽니다.`;
  }

  if (cmp.type === "down") {
    return `${title}의 이번 수치는 이전 발표보다 낮은 수준입니다. 숫자 자체보다도 시장 기대와 중앙은행 정책 방향이 함께 어떻게 바뀌는지가 중요합니다.`;
  }

  return `${title}는 이전 발표와 큰 차이가 없거나 비교 가능한 데이터가 제한적입니다. 발표 직후에는 수치 자체보다 시장의 해석과 금리 기대 변화를 함께 보는 것이 중요합니다.`;
}

async function loadEconomicDetail() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("id");

  if (!eventId) {
    setText("eco-title", "경제지표");
    setText("eco-description", "잘못된 접근입니다.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/economic/detail/${encodeURIComponent(eventId)}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    const title = data?.event_name || "경제지표";
    const country = data?.country || "GLOBAL";
    const releaseDate = data?.release_date || "";
    const actual = data?.actual || "-";
    const forecast = data?.forecast || "-";
    const previous = data?.previous || "-";
    const source = data?.source || "-";
    const updatedAt = data?.updated_at || "";
    const summaryText = data?.summary_text || "요약 정보가 없습니다.";
    const analysisText = data?.analysis_text || "분석 정보가 없습니다.";

    setText("eco-country", country);
    setText("eco-badge", country);
    setText("eco-title", title);
    setText("eco-description", `${title}의 발표일, 실제값, 예상값, 이전값과 시장 영향 포인트를 제공합니다.`);

    const releaseState = releaseStateText(releaseDate);
    setText("eco-release-date", formatDate(releaseDate));
    setText("eco-release-note", releaseState === "예정" ? "다음 발표 일정" : "가장 최근 확인 일정");
    setBadge("eco-release-badge", releaseState, releaseState === "예정" ? "up" : "flat");

    setText("eco-actual", actual);
    const actualVsPrev = compareValues(actual, previous);
    setText("eco-actual-note", actualVsPrev.note);
    setBadge("eco-actual-badge", actualVsPrev.text, actualVsPrev.type);

    setText("eco-forecast", forecast);
    const actualVsForecast = compareForecast(actual, forecast);
    setText("eco-forecast-note", actualVsForecast.note);
    setBadge("eco-forecast-badge", actualVsForecast.text, actualVsForecast.type);

    setText("eco-previous", previous);
    setText("eco-previous-note", "직전 발표 기준");
    setBadge("eco-previous-badge", "이전 발표값", "flat");

    const summaryEl = $("eco-summary");
    if (summaryEl) {
      summaryEl.innerHTML = nl2p(summaryText);
    }

    const analysisEl = $("eco-analysis");
    if (analysisEl) {
      const refinedAnalysis = `${analysisText}

투자자 입장에서 중요한 것은 숫자 하나만 보는 것이 아니라, 이전 발표 대비 변화와 시장 기대의 차이를 함께 해석하는 것입니다. 특히 금리와 환율, 기술주 및 채권시장의 반응은 같은 숫자라도 당시의 매크로 환경에 따라 달라질 수 있습니다.`;
      analysisEl.innerHTML = nl2p(refinedAnalysis);
    }

    setText("eco-callout", buildCallout(title, actual, previous));

    setText("eco-source", source);
    setText("eco-updated-at", formatDateTime(updatedAt));

    document.title = `${title} | MarketHunters`;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        `${title}의 발표일, 실제값, 예상값, 이전값과 시장 영향 해설을 MarketHunters에서 확인하세요.`
      );
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", `${title} | MarketHunters`);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute(
        "content",
        `${title}의 발표일, 실제값, 예상값, 이전값과 시장 영향 해설 제공`
      );
    }
  } catch (err) {
    console.error("economic-detail error:", err);

    setText("eco-title", "경제지표");
    setText("eco-description", "데이터를 불러오지 못했습니다.");
    setText("eco-release-date", "-");
    setText("eco-release-note", "불러오기 실패");
    setText("eco-actual", "-");
    setText("eco-forecast", "-");
    setText("eco-previous", "-");
    setText("eco-source", "-");
    setText("eco-updated-at", "-");

    setBadge("eco-release-badge", "오류", "down");
    setBadge("eco-actual-badge", "데이터 없음", "flat");
    setBadge("eco-forecast-badge", "데이터 없음", "flat");
    setBadge("eco-previous-badge", "데이터 없음", "flat");

    const summaryEl = $("eco-summary");
    if (summaryEl) summaryEl.innerHTML = "<p>요약 정보를 불러오지 못했습니다.</p>";

    const analysisEl = $("eco-analysis");
    if (analysisEl) analysisEl.innerHTML = "<p>시장 영향 해설을 불러오지 못했습니다.</p>";

    setText("eco-callout", "데이터 연결 상태를 확인한 뒤 다시 시도해 주세요.");
  }
}

document.addEventListener("DOMContentLoaded", loadEconomicDetail);