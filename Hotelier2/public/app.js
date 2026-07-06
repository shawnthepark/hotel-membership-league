import { criteria, programs, scenarios } from "./programs.js";

const storageKey = "hotel-membership-tracker-profile-v2";
const legacyStorageKeys = ["hotel-membership-league-profile"];
const localeStorageKey = "hotel-membership-tracker-locale";

const localeCopy = {
  ko: {
    subcopy: "나의 Marriott, IHG, Hyatt, Hilton, Accor 멤버십 현재 등급을 바탕으로 혜택 가득한 여행과 출장을 준비합니다.",
    source: "Official pages checked 2026-06-23",
    feedback: "Feedback",
    guide: "Privacy & Guide"
  },
  en: {
    subcopy: "Maximize every trip with benefits tailored to your hotel membership tiers.",
    source: "Official pages checked 2026-06-23",
    feedback: "Feedback",
    guide: "Privacy & Guide"
  }
};

const purposeCopy = {
  business: "출장 기준: late checkout, 라운지, 업무 편의성, 마지막 날 일정 여유를 더 높게 봅니다.",
  family: "가족 여행 기준: 조식, 객실 업그레이드, 포인트 숙박 가치를 더 높게 봅니다.",
  luxury: "휴식/럭셔리 기준: 스위트 업그레이드, 라운지, 상위 티어 체감 혜택을 더 높게 봅니다.",
  points: "등급/포인트 목적: 이번 숙박이 다음 티어에 얼마나 가까워지는지와 적립 가치를 더 높게 봅니다."
};

const defaultProfile = {
  name: "",
  statuses: {
    marriott: { tier: "Member", nights: 0, points: 0 },
    ihg: { tier: "Club", nights: 0, points: 0 },
    hyatt: { tier: "Member", nights: 0, points: 0 },
    hilton: { tier: "Member", nights: 0, points: 0 },
    accor: { tier: "Classic", nights: 0, points: 0 }
  },
  trip: {
    city: "",
    nights: 0,
    purpose: "business",
    breakfast: false,
    lounge: false,
    upgrade: false,
    checkout: false
  }
};

const state = {
  nights: 0,
  rate: 0,
  region: "global",
  scenario: "breakfast",
  breakfast: false,
  suite: false,
  simple: false,
  selectedProgramId: "hyatt",
  profile: loadProfile()
};

let profileRenderTimer = null;
let pendingCsvImport = null;

const els = {
  profileNameInput: document.querySelector("#profile-name-input"),
  saveProfileButton: document.querySelector("#save-profile-button"),
  exportCsvButton: document.querySelector("#export-csv-button"),
  importCsvButton: document.querySelector("#import-csv-button"),
  csvImportModal: document.querySelector("#csv-import-modal"),
  csvImportCloseButton: document.querySelector("#csv-import-close-button"),
  csvImportCancelButton: document.querySelector("#csv-import-cancel-button"),
  csvImportApplyButton: document.querySelector("#csv-import-apply-button"),
  csvFileInput: document.querySelector("#csv-file-input"),
  csvFileName: document.querySelector("#csv-file-name"),
  csvImportStatus: document.querySelector("#csv-import-status"),
  csvPreviewWrap: document.querySelector("#csv-preview-wrap"),
  csvPreviewBody: document.querySelector("#csv-preview-body"),
  appSubcopy: document.querySelector("#app-subcopy"),
  sourcePill: document.querySelector("#source-pill"),
  languageToggle: document.querySelector("#language-toggle"),
  languageButtons: document.querySelectorAll("[data-locale]"),
  feedbackButton: document.querySelector("#feedback-button"),
  feedbackModal: document.querySelector("#feedback-modal"),
  feedbackCloseButton: document.querySelector("#feedback-close-button"),
  feedbackFormLink: document.querySelector("#feedback-form-link"),
  guideButton: document.querySelector("#guide-button"),
  guideModal: document.querySelector("#guide-modal"),
  guideCloseButton: document.querySelector("#guide-close-button"),
  statusGrid: document.querySelector("#status-grid"),
  nextTierGrid: document.querySelector("#next-tier-grid"),
  selectedBenefitBadge: document.querySelector("#selected-benefit-badge"),
  currentTierLabel: document.querySelector("#current-tier-label"),
  currentTierBenefits: document.querySelector("#current-tier-benefits"),
  nextTierLabel: document.querySelector("#next-tier-label"),
  nextTierBenefits: document.querySelector("#next-tier-benefits"),
  tripCityInput: document.querySelector("#trip-city-input"),
  tripNightsInput: document.querySelector("#trip-nights-input"),
  tripPurposeInput: document.querySelector("#trip-purpose-input"),
  tripPurposeOptions: document.querySelectorAll("[data-trip-purpose-option]"),
  purposeDescription: document.querySelector("#purpose-description"),
  tripBreakfastToggle: document.querySelector("#trip-breakfast-toggle"),
  tripLoungeToggle: document.querySelector("#trip-lounge-toggle"),
  tripUpgradeToggle: document.querySelector("#trip-upgrade-toggle"),
  tripCheckoutToggle: document.querySelector("#trip-checkout-toggle"),
  tripBadge: document.querySelector("#trip-badge"),
  tripSummary: document.querySelector("#trip-summary"),
  tripWinner: document.querySelector("#trip-winner"),
  tripResultGrid: document.querySelector("#trip-result-grid"),
  nightsInput: document.querySelector("#nights-input"),
  rateInput: document.querySelector("#rate-input"),
  regionInput: document.querySelector("#region-input"),
  scenarioInput: document.querySelector("#scenario-input"),
  breakfastToggle: document.querySelector("#breakfast-toggle"),
  suiteToggle: document.querySelector("#suite-toggle"),
  simpleToggle: document.querySelector("#simple-toggle"),
  nightsValue: document.querySelector("#nights-value"),
  rateValue: document.querySelector("#rate-value"),
  scoreStrip: document.querySelector("#score-strip"),
  leagueGrid: document.querySelector("#league-grid"),
  ladderBoard: document.querySelector("#ladder-board"),
  radarTabs: document.querySelector("#radar-tabs"),
  radarTitle: document.querySelector("#radar-title"),
  radarChart: document.querySelector("#radar-chart"),
  benefitBody: document.querySelector("#benefit-table tbody"),
  heatmap: document.querySelector("#fineprint-heatmap"),
  sourceGrid: document.querySelector("#source-grid")
};

const tripValueAssumptions = {
  breakfast: 30,
  lounge: 25,
  upgrade: 60,
  checkout: {
    business: 45,
    family: 25,
    luxury: 35,
    points: 20
  }
};

function normalizeProfile(profile) {
  const base = structuredClone(defaultProfile);
  const saved = profile || {};
  const merged = {
    ...base,
    ...saved,
    statuses: {},
    trip: {
      ...base.trip,
      ...(saved.trip || {})
    }
  };

  programs.forEach((program) => {
    merged.statuses[program.id] = {
      ...base.statuses[program.id],
      ...(saved.statuses?.[program.id] || {})
    };
  });

  return merged;
}

function loadProfile() {
  legacyStorageKeys.forEach((key) => localStorage.removeItem(key));
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return normalizeProfile(saved);
  } catch {
    return normalizeProfile();
  }
}

function loadLocale() {
  const saved = localStorage.getItem(localeStorageKey);
  return saved === "en" ? "en" : "ko";
}

function saveProfile() {
  localStorage.setItem(storageKey, JSON.stringify(state.profile));
}

function scheduleProfileRender() {
  window.clearTimeout(profileRenderTimer);
  profileRenderTimer = window.setTimeout(() => {
    render();
  }, 180);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fmtMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function fmtNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

function parseNumberInput(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((item) => item.some((cell) => String(cell).trim() !== ""));
}

function parseCsvNumber(value, label) {
  const raw = String(value ?? "").trim().replace(/,/g, "");
  if (!raw) return { value: 0, error: `${label} 값이 비어 있습니다.` };
  if (!/^\d+$/.test(raw)) return { value: 0, error: `${label} 값은 0 이상의 정수여야 합니다.` };
  return { value: Number(raw), error: "" };
}

function currentScenario() {
  return scenarios.find((scenario) => scenario.id === state.scenario) || scenarios[0];
}

function qualifyingTier(program, nights = state.nights, rate = state.rate) {
  const annualSpend = nights * rate;
  const eligibleTiers = program.tiers
    .filter((tier) => tier.name !== "Limitless")
    .filter((tier) => {
      const nightsOk = tier.nights === null || nights >= tier.nights;
      const spendOk = !tier.spend || annualSpend >= tier.spend;
      return nightsOk && spendOk;
    });
  return eligibleTiers.at(-1) || program.tiers[0];
}

function currentTier(program) {
  return qualifyingTier(program);
}

function nextTierFor(program, nights = state.nights, rate = state.rate, fromTierName = null) {
  const annualSpend = nights * rate;
  const fromIndex = fromTierName ? tierRank(program, fromTierName) : -1;
  return program.tiers.find((tier) => {
    if (tier.name === "Limitless") return false;
    if (fromIndex >= 0 && tierRank(program, tier.name) <= fromIndex) return false;
    const needsNights = tier.nights !== null && nights < tier.nights;
    const needsSpend = tier.spend && annualSpend < tier.spend;
    return needsNights || needsSpend;
  }) || null;
}

function nextTier(program) {
  return nextTierFor(program);
}

function tierRank(program, tierName) {
  const normalized = normalizeTierName(tierName);
  const index = program.tiers.findIndex((tier) => tier.name === normalized);
  return index >= 0 ? index : 0;
}

function normalizeTierName(tierName) {
  return tierName?.replace("Lifetime ", "") || "Member";
}

function tierByName(program, tierName) {
  const normalized = normalizeTierName(tierName);
  return program.tiers.find((tier) => tier.name === normalized) || program.tiers[0];
}

function statusFor(program) {
  return state.profile.statuses[program.id] || defaultProfile.statuses[program.id] || { tier: program.tiers[0].name, nights: 0, points: 0 };
}

function effectiveTier(program) {
  return tierByName(program, statusFor(program).tier);
}

function projectedNightsFor(program) {
  return Number(statusFor(program).nights || 0) + Number(state.profile.trip.nights || 0);
}

function statusOptions(program) {
  const base = program.tiers
    .filter((tier) => tier.name !== "Limitless")
    .map((tier) => tier.name);
  if (program.id === "marriott") {
    return [...base, "Lifetime Silver", "Lifetime Gold", "Lifetime Platinum"];
  }
  return base;
}

function inferTripRegion(city) {
  const text = city.toLowerCase();
  if (["shanghai", "seoul", "tokyo", "singapore", "bangkok", "hong kong", "kuala lumpur"].some((item) => text.includes(item))) return "asia";
  if (["paris", "london", "berlin", "madrid", "rome", "amsterdam"].some((item) => text.includes(item))) return "europe";
  if (["new york", "chicago", "los angeles", "san francisco", "dallas"].some((item) => text.includes(item))) return "us";
  return "global";
}

function tripRegionBoost(program) {
  const region = inferTripRegion(state.profile.trip.city);
  if (region === "asia") return { accor: 7, marriott: 6, hilton: 5, hyatt: 5, ihg: 4 }[program.id] || 0;
  if (region === "europe") return { accor: 12, ihg: 5, marriott: 5, hilton: 4, hyatt: -3 }[program.id] || 0;
  if (region === "us") return { marriott: 8, hilton: 8, ihg: 6, hyatt: 4, accor: -8 }[program.id] || 0;
  return 0;
}

function hasPositive(value) {
  return !["No", "Member rates", "Wi-Fi", "Request"].includes(value);
}

function benefitStatus(value, type = "generic") {
  if (value === "Yes" || value === "4pm" || value === "4pm guaranteed" || value === "Your24") return "yes";
  if (type === "breakfast" && ["Choice", "F&B / breakfast", "APAC / weekends", "Weekend / APAC", "Diamond+"].includes(value)) return "conditional";
  if (hasPositive(value)) return "conditional";
  return "no";
}

function benefitCopy(value, type) {
  const status = benefitStatus(value, type);
  if (status === "yes") return "가능";
  if (value === "F&B / breakfast") return "조식 또는 F&B Credit";
  if (status === "conditional") return value;
  return "낮음";
}

function benefitProbability(value, type = "generic") {
  const status = benefitStatus(value, type);
  if (status === "yes") return 1;
  if (status === "conditional" && type === "breakfast") return 0.72;
  if (status === "conditional" && type === "lounge") return 0.58;
  if (status === "conditional" && type === "upgrade") return 0.5;
  if (status === "conditional" && type === "checkout") return 0.55;
  if (status === "conditional") return 0.6;
  return 0;
}

function tripSpend() {
  return Number(state.profile.trip.nights || 0) * Number(state.rate || 0);
}

function pointCashValue(program, points) {
  return Number(points || 0) * Number(program.pointValue || 0) / 100;
}

function walletPointValue(program) {
  return pointCashValue(program, statusFor(program).points);
}

function tripEarnedPoints(program) {
  const tier = effectiveTier(program);
  const base = tripSpend() * Number(program.basePointsPerDollar || 0);
  return Math.round(base * (1 + Number(tier.bonus || 0) / 100));
}

function confidenceFor(program) {
  const tier = effectiveTier(program);
  const trip = state.profile.trip;
  const items = [];
  if (trip.breakfast) items.push({ probability: benefitProbability(tier.breakfast, "breakfast"), weight: 1.1 });
  if (trip.lounge) items.push({ probability: benefitProbability(tier.lounge, "lounge"), weight: 1 });
  if (trip.upgrade) items.push({ probability: benefitProbability(tier.upgrades, "upgrade"), weight: 1.25 });
  if (trip.checkout) items.push({ probability: benefitProbability(tier.lateCheckout, "checkout"), weight: 0.85 });
  items.push({ probability: program.basePointsPerDollar ? 0.94 : 0.7, weight: 0.55 });

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0) || 1;
  const score = items.reduce((sum, item) => sum + item.probability * item.weight, 0) / totalWeight * 100;
  if (score >= 75) return { score, label: "High", className: "high" };
  if (score >= 45) return { score, label: "Medium", className: "medium" };
  return { score, label: "Low", className: "low" };
}

function tripValueFor(program) {
  const tier = effectiveTier(program);
  const trip = state.profile.trip;
  const nights = Number(trip.nights || 0);
  const breakfast = trip.breakfast ? benefitProbability(tier.breakfast, "breakfast") * tripValueAssumptions.breakfast * nights : 0;
  const lounge = trip.lounge ? benefitProbability(tier.lounge, "lounge") * tripValueAssumptions.lounge * nights : 0;
  const upgrade = trip.upgrade ? benefitProbability(tier.upgrades, "upgrade") * tripValueAssumptions.upgrade * nights : 0;
  const checkout = trip.checkout && nights > 0 ? benefitProbability(tier.lateCheckout, "checkout") * (tripValueAssumptions.checkout[trip.purpose] || 25) : 0;
  const earnedPoints = tripEarnedPoints(program);
  const earnedPointValue = pointCashValue(program, earnedPoints);
  const total = breakfast + lounge + upgrade + checkout + earnedPointValue;

  return {
    breakfast,
    lounge,
    upgrade,
    checkout,
    earnedPoints,
    earnedPointValue,
    walletValue: walletPointValue(program),
    total,
    confidence: confidenceFor(program)
  };
}

function tierBenefitScore(tier) {
  let score = 10;
  if (benefitStatus(tier.breakfast, "breakfast") === "yes") score += 24;
  if (benefitStatus(tier.breakfast, "breakfast") === "conditional") score += 16;
  if (benefitStatus(tier.lounge) === "yes") score += 18;
  if (benefitStatus(tier.lounge) === "conditional") score += 10;
  if (benefitStatus(tier.upgrades) === "yes") score += 18;
  if (benefitStatus(tier.upgrades) === "conditional") score += 12;
  if (tier.suite === "Yes" || tier.suite === "Confirmable") score += 12;
  if (tier.suite === "Available" || tier.suite === "SNU" || tier.suite === "Milestone") score += 8;
  if (tier.lateCheckout.includes("4pm") || tier.lateCheckout === "Your24") score += 12;
  else if (tier.lateCheckout.includes("2pm") || tier.lateCheckout.includes("late")) score += 6;
  return score;
}

function tierRequirement(tier) {
  if (tier.nights === null && tier.spend) return { main: fmtCompactMoney(tier.spend), sub: "spend" };
  if (tier.nights === null) return { main: "Invite", sub: "" };
  if (tier.spend) return { main: `${tier.nights}+`, sub: fmtCompactMoney(tier.spend) };
  return { main: `${tier.nights}`, sub: "" };
}

function fmtCompactMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000) {
    const compact = amount / 1000;
    return `$${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return fmtMoney(amount);
}

function nextTierPath(program) {
  const status = statusFor(program);
  const currentNights = Number(status.nights || 0);
  const projected = projectedNightsFor(program);
  const tier = effectiveTier(program);
  const next = nextTierFor(program, currentNights, state.rate, tier.name);
  const maxNightTier = [...program.tiers].reverse().find((item) => item.nights !== null) || program.tiers.at(-1);
  const maxNights = Math.max(maxNightTier?.nights || 100, 1);

  if (!next) {
    return {
      next: null,
      currentNights,
      projected,
      remainingNow: 0,
      remainingAfterTrip: 0,
      progress: 100,
      copy: "현재 입력 기준 다음 체감 티어 없음"
    };
  }

  const requiredNights = next.nights ?? maxNights;
  const remainingNow = Math.max(requiredNights - currentNights, 0);
  const remainingAfterTrip = Math.max(requiredNights - projected, 0);
  const spendCopy = next.spend ? ` · ${fmtMoney(next.spend)} 조건 확인` : "";

  return {
    next,
    currentNights,
    projected,
    remainingNow,
    remainingAfterTrip,
    progress: clamp(currentNights / requiredNights * 100, 0, 100),
    copy: `${next.name}까지 ${remainingNow}박${spendCopy}`
  };
}

const purposeWeights = {
  business: {
    checkout: 0.28,
    lounge: 0.2,
    upgrade: 0.14,
    breakfast: 0.1,
    tripValue: 0.14,
    region: 0.1,
    tierPower: 0.04
  },
  family: {
    breakfast: 0.32,
    upgrade: 0.18,
    suite: 0.08,
    tripValue: 0.2,
    checkout: 0.08,
    region: 0.1,
    tierPower: 0.04
  },
  luxury: {
    suite: 0.25,
    upgrade: 0.24,
    lounge: 0.18,
    checkout: 0.1,
    tripValue: 0.12,
    region: 0.07,
    tierPower: 0.04
  },
  points: {
    nextTier: 0.7,
    earned: 0.2,
    region: 0.08,
    tripValue: 0.02
  }
};

function suiteProbability(tier) {
  if (tier.suite === "Yes" || tier.suite === "Confirmable") return 1;
  if (tier.suite === "SNU" || tier.suite === "Available") return 0.7;
  if (tier.suite === "Milestone") return 0.45;
  return 0;
}

function nextTierMomentum(program) {
  const path = nextTierPath(program);
  if (!path.next) return 0.15;
  const currentTier = effectiveTier(program);
  const requiredNights = Math.max(Number(path.next.nights || 100), 1);
  const tripNights = Math.max(Number(state.profile.trip.nights || 0), 0);
  const closenessAfterTrip = 1 - clamp(path.remainingAfterTrip / requiredNights, 0, 1);
  const tripShare = clamp(tripNights / Math.max(path.remainingNow, 1), 0, 1);
  const currentValue = tierBenefitScore(currentTier) + Number(currentTier.bonus || 0) / 4;
  const nextValue = tierBenefitScore(path.next) + Number(path.next.bonus || 0) / 4;
  const upside = clamp((nextValue - currentValue) / 40, 0, 1);
  return clamp(closenessAfterTrip * 0.45 + tripShare * 0.2 + upside * 0.35, 0, 1);
}

function tripScoreComponents(program) {
  const tier = effectiveTier(program);
  const trip = state.profile.trip;
  const value = tripValueFor(program);
  return {
    breakfast: trip.breakfast ? benefitProbability(tier.breakfast, "breakfast") : 0,
    lounge: trip.lounge ? benefitProbability(tier.lounge, "lounge") : 0,
    upgrade: trip.upgrade ? benefitProbability(tier.upgrades, "upgrade") : 0,
    suite: trip.upgrade ? suiteProbability(tier) : 0,
    checkout: trip.checkout ? benefitProbability(tier.lateCheckout, "checkout") : 0,
    tripValue: clamp(value.total / 360, 0, 1),
    earned: clamp(value.earnedPointValue / 90, 0, 1),
    wallet: clamp(value.walletValue / 2500, 0, 1),
    nextTier: nextTierMomentum(program),
    region: clamp((tripRegionBoost(program) + 8) / 20, 0, 1),
    tierPower: clamp(tierBenefitScore(tier) / 96, 0, 1)
  };
}

function tripScore(program) {
  const components = tripScoreComponents(program);
  const weights = purposeWeights[state.profile.trip.purpose] || purposeWeights.business;
  const rawScore = Object.entries(weights)
    .reduce((sum, [key, weight]) => sum + (components[key] || 0) * weight, 0);
  return clamp(rawScore * 100, 0, 100);
}
function regionBoost(program) {
  if (state.region === "europe") {
    return { accor: 13, ihg: 5, marriott: 5, hilton: 4, hyatt: -4 }[program.id] || 0;
  }
  if (state.region === "asia") {
    return { accor: 8, marriott: 6, hilton: 6, hyatt: 5, ihg: 5 }[program.id] || 0;
  }
  if (state.region === "us") {
    return { marriott: 8, hilton: 8, ihg: 6, hyatt: 4, accor: -8 }[program.id] || 0;
  }
  if (state.region === "luxury") {
    return { hyatt: 9, marriott: 8, hilton: 4, accor: 4, ihg: 1 }[program.id] || 0;
  }
  return 0;
}

function tierBoost(program) {
  const tier = currentTier(program);
  const index = program.tiers.indexOf(tier);
  const topIndex = Math.max(program.tiers.length - 1, 1);
  return index / topIndex * 15;
}

function scoreProgram(program) {
  const scenario = currentScenario();
  const weights = {
    breakfast: 1,
    upgrades: 1,
    lounge: 1,
    milestone: 1,
    earning: 1,
    redemption: 1,
    footprint: 1,
    ease: 1,
    finePrint: 1,
    ...scenario.weights
  };

  if (state.breakfast) weights.breakfast += 0.8;
  if (state.suite) {
    weights.upgrades += 0.9;
    weights.milestone += 0.6;
  }
  if (state.simple) weights.finePrint += 1.1;

  const weighted = criteria.reduce((sum, item) => {
    return sum + program.scores[item.key] * (weights[item.key] || 1);
  }, 0);
  const totalWeight = criteria.reduce((sum, item) => sum + (weights[item.key] || 1), 0);
  const scenarioBoost = scenario.regionBoost?.[program.id] || 0;
  const spendPenalty = nextTier(program)?.spend && state.nights >= (nextTier(program).nights || 0) ? -4 : 0;
  return clamp(weighted / totalWeight + regionBoost(program) + scenarioBoost + tierBoost(program) + spendPenalty, 0, 100);
}

function scoredPrograms() {
  return programs
    .map((program) => ({
      ...program,
      score: scoreProgram(program),
      currentTier: currentTier(program),
      nextTier: nextTier(program)
    }))
    .sort((a, b) => b.score - a.score);
}

function renderControls() {
  els.nightsValue.textContent = `${state.nights}박`;
  els.rateValue.textContent = fmtMoney(state.rate);
  els.profileNameInput.value = state.profile.name;
  const city = String(state.profile.trip.city || "").trim();
  const nights = Number(state.profile.trip.nights || 0);
  els.tripBadge.textContent = city || nights ? `${city || "City blank"} · ${nights} nights` : "Trip blank";
  els.tripSummary.textContent = city || nights
    ? `${city || "City blank"} ${state.profile.trip.purpose} ${nights}박 · ${fmtMoney(state.rate)}/night 기준`
    : "여행 정보를 입력하면 비교가 업데이트됩니다.";
}

function renderScenarioOptions() {
  els.scenarioInput.innerHTML = scenarios.map((scenario) => {
    return `<option value="${scenario.id}">${scenario.name}</option>`;
  }).join("");
  els.scenarioInput.value = state.scenario;
}

function renderScoreStrip(scored) {
  const leader = scored[0];
  const scenario = currentScenario();
  const fastest = [...scored].sort((a, b) => a.currentTier.nights - b.currentTier.nights)[0];
  const breakfastBoss = [...scored].sort((a, b) => b.scores.breakfast - a.scores.breakfast)[0];
  const suiteBoss = [...scored].sort((a, b) => b.scores.upgrades - a.scores.upgrades)[0];

  const cards = [
    { label: "리그 1위", value: leader.shortName, note: `${leader.score.toFixed(0)}점 · ${scenario.name}` },
    { label: "현재 관점", value: scenario.name, note: scenario.copy },
    { label: "조식 강자", value: breakfastBoss.shortName, note: `${breakfastBoss.scores.breakfast}점` },
    { label: "업그레이드 강자", value: suiteBoss.shortName, note: `${suiteBoss.scores.upgrades}점` }
  ];

  if (state.nights <= 15) {
    cards[3] = { label: "초반 체감", value: fastest.shortName, note: `${fastest.currentTier.name} 진입` };
  }

  els.scoreStrip.innerHTML = cards.map((card) => `
    <article>
      <span>${card.label}</span>
      <strong>${card.value}</strong>
      <small>${card.note}</small>
    </article>
  `).join("");
}

function renderLeague(scored) {
  const maxScore = scored[0]?.score || 1;
  els.leagueGrid.innerHTML = scored.map((program, index) => {
    const next = program.nextTier;
    const progress = Math.min(program.score / maxScore * 100, 100);
    const annualSpend = state.nights * state.rate;
    const myTierLabel = statusFor(program).tier;
    const simulationTier = program.currentTier.name;
    const nextCopy = next
      ? next.spend && annualSpend < next.spend
        ? `${next.name}까지 ${fmtMoney(next.spend - annualSpend)} 지출 필요`
        : `${next.name}까지 ${Math.max((next.nights || 0) - state.nights, 0)}박`
      : "최상위권 도달";

    return `
      <article class="league-card ${program.id === state.selectedProgramId ? "is-selected" : ""}" data-program="${program.id}">
        <div class="card-top">
          <div class="brand-mark" style="background:${program.color}">${program.shortName.slice(0, 2).toUpperCase()}</div>
          <div class="rank">#${index + 1}</div>
        </div>
        <h3>${program.name}</h3>
        <p>${program.footprintLabel}</p>
        <div class="score-row">
          <strong>${program.score.toFixed(0)}</strong>
          <span>/ 100</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${progress}%;background:${program.color}"></div></div>
        <div class="mini-stats">
          <span>내 현재: ${myTierLabel}</span>
          <span>시뮬레이션: ${simulationTier} · ${nextCopy}</span>
        </div>
        <div class="tag-row">
          ${program.strengths.slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderNextTierPath() {
  els.nextTierGrid.innerHTML = programs.map((program) => {
    const status = statusFor(program);
    const path = nextTierPath(program);
    const afterCopy = path.next
      ? `출장 후 ${path.remainingAfterTrip}박 남음`
      : `출장 후 ${path.projected}박`;
    return `
      <article class="next-tier-card" data-program="${program.id}">
        <div class="next-tier-top">
          <span class="brand-mark mini" style="background:${program.color}">${program.shortName.slice(0, 2).toUpperCase()}</span>
          <div class="next-tier-meta">
            <strong>${program.shortName}</strong>
            <span class="next-tier-line">${status.tier}</span>
            <span class="next-tier-line">올해 ${status.nights || 0}박</span>
          </div>
        </div>
        <div class="next-tier-copy">${path.copy}</div>
        <div class="bar-track thin"><div class="bar-fill" style="width:${path.progress}%;background:${program.color}"></div></div>
        <div class="next-tier-foot">
          <span>올해 ${path.currentNights}박</span>
          <span>${afterCopy}</span>
        </div>
      </article>
    `;
  }).join("");
}

function tierBenefitItems(tier) {
  return [
    { label: "포인트 보너스", value: `${tier.bonus || 0}%`, className: (tier.bonus || 0) > 0 ? "yes" : "no" },
    { label: "조식", value: benefitCopy(tier.breakfast, "breakfast"), className: benefitStatus(tier.breakfast, "breakfast") },
    { label: "라운지", value: benefitCopy(tier.lounge, "lounge"), className: benefitStatus(tier.lounge, "lounge") },
    { label: "업그레이드", value: benefitCopy(tier.upgrades, "upgrade"), className: benefitStatus(tier.upgrades, "upgrade") },
    { label: "스위트", value: benefitCopy(tier.suite, "upgrade"), className: benefitStatus(tier.suite, "upgrade") },
    { label: "체크아웃", value: tier.lateCheckout, className: benefitStatus(tier.lateCheckout, "checkout") },
    { label: "마일스톤", value: tier.milestone, className: benefitStatus(tier.milestone, "milestone") }
  ];
}

function renderBenefitChips(tier) {
  return tierBenefitItems(tier).map((item) => `
    <div class="benefit-chip ${item.className}">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
    </div>
  `).join("");
}

function renderTierBenefits() {
  const program = programs.find((item) => item.id === state.selectedProgramId) || programs[0];
  const status = statusFor(program);
  const currentTier = effectiveTier(program);
  const path = nextTierPath(program);
  const nextTier = path.next;
  const currentTierLabel = status.tier.startsWith("Lifetime") ? status.tier : currentTier.name;

  els.selectedBenefitBadge.textContent = program.shortName;
  els.currentTierLabel.textContent = currentTierLabel;
  els.currentTierBenefits.innerHTML = renderBenefitChips(currentTier);

  if (!nextTier) {
    els.nextTierLabel.textContent = "No next tier";
    els.nextTierBenefits.innerHTML = `
      <div class="benefit-empty">
        현재 입력 기준 다음 체감 티어가 없습니다. 올해 ${fmtNumber(status.nights || 0)}박, 지갑 가치는 ${fmtMoney(walletPointValue(program))}로 보고 있어요.
      </div>
    `;
    return;
  }

  els.nextTierLabel.textContent = `${nextTier.name} · ${path.remainingNow}박 남음`;
  els.nextTierBenefits.innerHTML = `
    ${renderBenefitChips(nextTier)}
    <div class="benefit-next-note">
      이번 여행 후 ${path.remainingAfterTrip}박 남음 · ${fmtNumber(path.projected)}박 예상
    </div>
  `;
}

function renderLadder(scored) {
  const maxNights = 100;
  els.ladderBoard.innerHTML = programs.map((program) => {
    const status = statusFor(program);
    const ownedTier = effectiveTier(program);
    const ownedRank = tierRank(program, status.tier);
    const currentNights = Number(status.nights || 0);
    const projected = projectedNightsFor(program);
    const ownedPosition = Math.min((ownedTier.nights === null ? maxNights : ownedTier.nights) / maxNights * 100, 100);
    const currentProgressPosition = Math.min(currentNights / maxNights * 100, 100);
    const projectedPosition = Math.min(projected / maxNights * 100, 100);
    const segmentLeft = Math.min(currentProgressPosition, projectedPosition);
    const segmentWidth = Math.max(Math.abs(projectedPosition - currentProgressPosition), projected > currentNights ? 1.2 : 0);
    const showAnnualPin = Math.abs(ownedPosition - currentProgressPosition) > 1.5;
    const annualDisplayPosition = showAnnualPin && currentProgressPosition <= 0 ? 1.2 : currentProgressPosition;
    const annualSpend = currentNights * state.rate;
    const tiers = program.tiers
      .filter((tier) => tier.nights !== null || tier.spend !== null)
      .map((tier) => {
        const position = tier.nights === null ? 100 : tier.nights / maxNights * 100;
        const rankUnlocked = tierRank(program, tier.name) <= ownedRank;
        const earnedUnlocked = (tier.nights === null || currentNights >= tier.nights) && (!tier.spend || annualSpend >= tier.spend);
        const unlocked = rankUnlocked || earnedUnlocked;
        const requirement = tierRequirement(tier);
        const edgeClass = position >= 94 ? "is-edge" : "";
        return `
          <div class="tier-dot ${unlocked ? "is-unlocked" : ""} ${edgeClass}" style="left:${position}%">
            <span>${requirement.main}</span>
            <small>${tier.name}${requirement.sub ? `<em>${requirement.sub}</em>` : ""}</small>
          </div>
        `;
      }).join("");

    return `
      <div class="ladder-row">
        <div class="ladder-name"><span class="dot" style="color:${program.color}"></span>${program.shortName}</div>
        <div class="ladder-line">
          <div class="trip-segment" style="left:${segmentLeft}%;width:${segmentWidth}%"></div>
          <div class="traveler-pin owned" style="left:${ownedPosition}%" title="보유 ${status.tier}"><span>보유 ${status.tier}</span></div>
          ${showAnnualPin ? `<div class="progress-pin annual" style="left:${annualDisplayPosition}%" title="올해 ${currentNights}박"><span>올해 ${currentNights}박</span></div>` : ""}
          <div class="traveler-pin projected" style="left:${projectedPosition}%" title="여행 후 ${projected}박"><span>여행 후 ${projected}박</span></div>
          ${tiers}
        </div>
        <div class="ladder-meta">
          <span>보유 ${status.tier}</span>
          <span>올해 ${currentNights}박 · 여행 후 ${projected}박</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderRadarTabs() {
  els.radarTabs.innerHTML = programs.map((program) => `
    <button class="${program.id === state.selectedProgramId ? "is-active" : ""}" data-radar-program="${program.id}" style="--brand:${program.color}">
      ${program.shortName}
    </button>
  `).join("");
}

function renderRadar(program) {
  els.radarTitle.textContent = `${program.name} · 내 현재 ${statusFor(program).tier}`;
  const center = { x: 210, y: 175 };
  const radius = 115;
  const radarCriteria = criteria.slice(0, 8);
  const levels = [0.25, 0.5, 0.75, 1];

  const pointsFor = (scale = 1) => radarCriteria.map((item, index) => {
    const angle = -Math.PI / 2 + index / radarCriteria.length * Math.PI * 2;
    const value = (program.scores[item.key] / 100) * scale;
    return {
      x: center.x + Math.cos(angle) * radius * value,
      y: center.y + Math.sin(angle) * radius * value,
      labelX: center.x + Math.cos(angle) * (radius + 32),
      labelY: center.y + Math.sin(angle) * (radius + 32),
      label: item.label,
      value: program.scores[item.key]
    };
  });

  const rings = levels.map((level) => {
    const ring = pointsFor(level).map((point) => `${point.x},${point.y}`).join(" ");
    return `<polygon points="${ring}" fill="none" stroke="#dce5ee" stroke-width="1"></polygon>`;
  }).join("");
  const spokes = pointsFor(1).map((point) => {
    return `<line x1="${center.x}" y1="${center.y}" x2="${point.x}" y2="${point.y}" stroke="#e2e8f0"></line>`;
  }).join("");
  const shape = pointsFor(1).map((point) => `${point.x},${point.y}`).join(" ");
  const labels = pointsFor(1).map((point) => `
    <text class="radar-label" x="${point.labelX}" y="${point.labelY}" text-anchor="middle">${point.label}</text>
    <text class="radar-score" x="${point.x}" y="${point.y - 7}" text-anchor="middle">${point.value}</text>
  `).join("");

  els.radarChart.innerHTML = `
    ${rings}
    ${spokes}
    <polygon points="${shape}" fill="${program.color}" opacity="0.16" stroke="${program.color}" stroke-width="3"></polygon>
    ${labels}
  `;
}

function sweetSpot(program) {
  if (program.id === "hyatt") return "Globalist 60박";
  if (program.id === "hilton") return "Gold 25박";
  if (program.id === "ihg") return "Diamond 70박 또는 40박 마일스톤";
  if (program.id === "marriott") return "Platinum 50박";
  return "Platinum 60박 / Diamond 지출형";
}

function topTier(program) {
  return [...program.tiers].reverse().find((tier) => tier.name !== "Limitless") || program.tiers.at(-1);
}

function renderBenefitTable(scored) {
  els.benefitBody.innerHTML = scored.map((program) => {
    const top = topTier(program);
    return `
      <tr>
        <td><span class="dot" style="display:inline-block;color:${program.color};margin-right:7px"></span><strong>${program.shortName}</strong></td>
        <td>${sweetSpot(program)}</td>
        <td>${top.breakfast}</td>
        <td>${top.upgrades}</td>
        <td>${top.lounge}</td>
        <td>${top.lateCheckout}</td>
        <td>${program.milestones ? `${program.milestones.length} milestones` : top.milestone}</td>
      </tr>
    `;
  }).join("");
}

function heatColor(value) {
  const hue = value >= 75 ? "18,128,92" : value >= 65 ? "217,119,6" : "194,65,58";
  return `rgba(${hue}, ${0.18 + value / 100 * 0.48})`;
}

function renderHeatmap(scored) {
  const fields = [
    { key: "breakfast", label: "조식" },
    { key: "upgrades", label: "업그레이드" },
    { key: "lounge", label: "라운지" },
    { key: "redemption", label: "포인트" },
    { key: "finePrint", label: "명확성" }
  ];

  els.heatmap.innerHTML = `
    <div class="heat-grid">
      <div></div>
      ${fields.map((field) => `<div class="heat-head">${field.label}</div>`).join("")}
      ${scored.map((program) => `
        <div class="heat-name"><span class="dot" style="color:${program.color}"></span>${program.shortName}</div>
        ${fields.map((field) => {
          const value = program.scores[field.key];
          return `<div class="heat-cell" style="background:${heatColor(value)}">${value}</div>`;
        }).join("")}
      `).join("")}
    </div>
  `;
}

function renderSources() {
  els.sourceGrid.innerHTML = programs.map((program) => `
    <a class="source-card" href="${program.sourceUrl}" target="_blank" rel="noreferrer">
      <span class="brand-mark mini" style="background:${program.color}">${program.shortName.slice(0, 2).toUpperCase()}</span>
      <div>
        <strong>${program.sourceLabel}</strong>
        <small>${program.verifiedAt} 확인 · 공식 페이지</small>
      </div>
      <svg class="outlink-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17 17 7"></path>
        <path d="M9 7h8v8"></path>
      </svg>
    </a>
  `).join("");
}

function renderStatusInputs() {
  els.statusGrid.innerHTML = programs.map((program) => {
    const status = statusFor(program);
    const isSelected = program.id === state.selectedProgramId;
    return `
      <article class="status-card ${isSelected ? "is-selected" : ""}" data-status-program="${program.id}" style="--selected-color:${program.color}">
        <div class="status-head">
          <span class="brand-mark mini" style="background:${program.color}">${program.shortName.slice(0, 2).toUpperCase()}</span>
          <strong>${program.shortName}</strong>
          ${isSelected ? '<span class="selected-chip">Selected</span>' : ""}
        </div>
        <label>
          <span>보유 티어</span>
          <select data-profile-tier="${program.id}">
            ${statusOptions(program).map((tier) => `<option value="${tier}" ${tier === status.tier ? "selected" : ""}>${tier}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>올해 숙박</span>
          <input data-profile-nights="${program.id}" type="number" min="0" max="365" value="${status.nights}">
        </label>
        <label>
          <span>보유 포인트</span>
          <input data-profile-points="${program.id}" type="text" inputmode="numeric" value="${fmtNumber(status.points || 0)}">
        </label>
        <div class="wallet-value">${fmtMoney(walletPointValue(program))} est. wallet</div>
      </article>
    `;
  }).join("");
}

function renderTripInputs() {
  els.tripCityInput.value = state.profile.trip.city;
  els.tripNightsInput.value = state.profile.trip.nights;
  els.tripPurposeInput.value = state.profile.trip.purpose;
  els.tripPurposeOptions.forEach((option) => {
    option.checked = option.value === state.profile.trip.purpose;
  });
  els.purposeDescription.textContent = purposeCopy[state.profile.trip.purpose] || purposeCopy.business;
  els.tripBreakfastToggle.checked = state.profile.trip.breakfast;
  els.tripLoungeToggle.checked = state.profile.trip.lounge;
  els.tripUpgradeToggle.checked = state.profile.trip.upgrade;
  els.tripCheckoutToggle.checked = state.profile.trip.checkout;
}

function nextTripProgress(program) {
  const status = statusFor(program);
  const currentNights = Number(status.nights || 0);
  const tripNights = Number(state.profile.trip.nights || 0);
  const projectedNights = Number(status.nights || 0) + Number(state.profile.trip.nights || 0);
  const tier = effectiveTier(program);
  const next = nextTierFor(program, projectedNights, state.rate, tier.name);
  if (!next) return "다음 체감 티어 없음";
  if (next.spend) return `${next.name}까지 조건 확인 필요`;
  const before = Math.max(next.nights - currentNights, 0);
  const after = Math.max(next.nights - projectedNights, 0);
  return `${next.name}까지 ${after}박 · 이번 여행이 ${Math.min(tripNights, before)}박 줄임`;
}

function renderTripResults() {
  const ranked = programs
    .map((program) => ({
      ...program,
      effectiveTier: effectiveTier(program),
      status: statusFor(program),
      tripScore: tripScore(program),
      tripValue: tripValueFor(program)
    }))
    .sort((a, b) => b.tripScore - a.tripScore);
  const winner = ranked[0];
  els.tripWinner.textContent = `Best fit: ${winner.shortName} ${winner.tripScore.toFixed(0)}`;

  els.tripResultGrid.innerHTML = ranked.map((program, index) => {
    const tier = program.effectiveTier;
    const status = program.status;
    const value = program.tripValue;
    const confidence = value.confidence;
    const tierLabel = status.tier.startsWith("Lifetime") ? `${status.tier} 혜택` : `${tier.name} 혜택`;
    const projected = Number(status.nights || 0) + Number(state.profile.trip.nights || 0);
    return `
      <article class="trip-result-card ${index === 0 ? "is-winner" : ""}">
        <div class="trip-result-top">
          <div>
            <span class="trip-rank">#${index + 1}</span>
            <h3>${program.shortName}</h3>
          </div>
          <strong>${program.tripScore.toFixed(0)}</strong>
        </div>
        <p>${tierLabel} · 올해 ${status.nights}박 → 여행 후 ${projected}박</p>
        <div class="value-row">
          <div class="value-stack">
            <span>Trip value</span>
            <strong>${fmtMoney(value.total)}</strong>
          </div>
          <div class="confidence ${confidence.className}">
            <span>${confidence.label}</span>
            <strong>${confidence.score.toFixed(0)}%</strong>
          </div>
        </div>
        <div class="perk-grid">
          <div class="perk ${benefitStatus(tier.breakfast, "breakfast")}"><span>조식</span><strong>${benefitCopy(tier.breakfast, "breakfast")}</strong></div>
          <div class="perk ${benefitStatus(tier.lounge)}"><span>라운지</span><strong>${benefitCopy(tier.lounge)}</strong></div>
          <div class="perk ${benefitStatus(tier.upgrades)}"><span>업그레이드</span><strong>${benefitCopy(tier.upgrades)}</strong></div>
          <div class="perk ${benefitStatus(tier.lateCheckout)}"><span>체크아웃</span><strong>${tier.lateCheckout}</strong></div>
        </div>
        <div class="points-line">
          <span>Wallet ${fmtMoney(value.walletValue)}</span>
          <span>Earn +${fmtNumber(value.earnedPoints)} pts (${fmtMoney(value.earnedPointValue)})</span>
        </div>
        <div class="progress-note">${nextTripProgress(program)}</div>
      </article>
    `;
  }).join("");
}

function render() {
  renderControls();
  renderStatusInputs();
  renderNextTierPath();
  renderTierBenefits();
  renderTripInputs();
  renderTripResults();
  const scored = scoredPrograms();
  const selected = scored.find((program) => program.id === state.selectedProgramId) || scored[0];
  renderScoreStrip(scored);
  renderLeague(scored);
  renderLadder(scored);
  renderRadarTabs();
  renderRadar(selected);
  renderBenefitTable(scored);
  renderHeatmap(scored);
  renderSources();
}

function syncFromControls() {
  state.nights = Number(els.nightsInput.value);
  state.rate = Number(els.rateInput.value);
  state.region = els.regionInput.value;
  state.scenario = els.scenarioInput.value;
  state.breakfast = els.breakfastToggle.checked;
  state.suite = els.suiteToggle.checked;
  state.simple = els.simpleToggle.checked;
  render();
}

function syncFromProfile(event) {
  const tierControl = event.target.closest("[data-profile-tier]");
  const nightsControl = event.target.closest("[data-profile-nights]");
  const pointsControl = event.target.closest("[data-profile-points]");
  if (tierControl) {
    const programId = tierControl.dataset.profileTier;
    state.selectedProgramId = programId;
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      tier: tierControl.value
    };
    saveProfile();
    render();
    return;
  }
  if (nightsControl) {
    const programId = nightsControl.dataset.profileNights;
    state.selectedProgramId = programId;
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      nights: Math.max(Number(nightsControl.value) || 0, 0)
    };
  }
  if (pointsControl) {
    const programId = pointsControl.dataset.profilePoints;
    state.selectedProgramId = programId;
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      points: Math.max(parseNumberInput(pointsControl.value), 0)
    };
  }
  saveProfile();
  scheduleProfileRender();
}

function syncProfileDraft(event) {
  const nightsControl = event.target.closest("[data-profile-nights]");
  const pointsControl = event.target.closest("[data-profile-points]");
  if (nightsControl) {
    const programId = nightsControl.dataset.profileNights;
    state.selectedProgramId = programId;
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      nights: Math.max(Number(nightsControl.value) || 0, 0)
    };
    saveProfile();
  }
  if (pointsControl) {
    const programId = pointsControl.dataset.profilePoints;
    state.selectedProgramId = programId;
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      points: Math.max(parseNumberInput(pointsControl.value), 0)
    };
    saveProfile();
  }
}

function syncTrip() {
  const selectedPurpose = [...els.tripPurposeOptions].find((option) => option.checked)?.value || els.tripPurposeInput.value || "business";
  state.profile.name = els.profileNameInput.value.trim();
  state.profile.trip.city = els.tripCityInput.value.trim();
  state.profile.trip.nights = clamp(Number(els.tripNightsInput.value) || 0, 0, 30);
  state.profile.trip.purpose = selectedPurpose;
  els.tripPurposeInput.value = selectedPurpose;
  state.profile.trip.breakfast = els.tripBreakfastToggle.checked;
  state.profile.trip.lounge = els.tripLoungeToggle.checked;
  state.profile.trip.upgrade = els.tripUpgradeToggle.checked;
  state.profile.trip.checkout = els.tripCheckoutToggle.checked;
  saveProfile();
  render();
}

function exportProfileCsv() {
  const exportedAt = new Date().toISOString().slice(0, 10);
  state.profile.name = els.profileNameInput.value.trim();
  saveProfile();

  const header = ["profile_name", "program_id", "program_name", "tier", "nights_ytd", "points", "exported_at"];
  const rows = programs.map((program) => {
    const status = statusFor(program);
    return [
      state.profile.name,
      program.id,
      program.shortName,
      status.tier,
      Number(status.nights || 0),
      Number(status.points || 0),
      exportedAt
    ];
  });
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const profileSlug = (state.profile.name || "traveler")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "traveler";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hotel-membership-status-${profileSlug}-${exportedAt}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function resetCsvImport() {
  pendingCsvImport = null;
  els.csvFileInput.value = "";
  els.csvFileName.textContent = "No file selected";
  els.csvImportStatus.className = "csv-import-status";
  els.csvImportStatus.textContent = "CSV 파일을 선택하면 미리보기가 표시됩니다.";
  els.csvPreviewBody.innerHTML = "";
  els.csvPreviewWrap.hidden = true;
  els.csvImportApplyButton.disabled = true;
}

function parseProfileCsv(text) {
  const rows = parseCsvRows(text);
  const errors = [];
  const warnings = [];
  const parsedRows = [];

  if (rows.length < 2) {
    return { profileName: "", rows: [], errors: ["CSV 내용이 비어 있습니다."], warnings: [] };
  }

  const headers = rows[0].map((cell) => String(cell).replace(/^\uFEFF/, "").trim().toLowerCase());
  const indexFor = (key) => headers.indexOf(key);
  const required = ["program_id", "tier", "nights_ytd", "points"];
  required.forEach((key) => {
    if (indexFor(key) < 0) errors.push(`필수 컬럼이 없습니다: ${key}`);
  });
  if (errors.length) return { profileName: "", rows: [], errors, warnings };

  const profileIndex = indexFor("profile_name");
  const profileName = rows.slice(1)
    .map((row) => String(row[profileIndex] || "").trim())
    .find(Boolean) || state.profile.name;
  const seenPrograms = new Set();

  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const programId = String(row[indexFor("program_id")] || "").trim().toLowerCase();
    const program = programs.find((item) => item.id === programId);
    const tier = String(row[indexFor("tier")] || "").trim();
    const nightsResult = parseCsvNumber(row[indexFor("nights_ytd")], `Row ${rowNumber} nights_ytd`);
    const pointsResult = parseCsvNumber(row[indexFor("points")], `Row ${rowNumber} points`);
    const issues = [];

    if (!program) {
      issues.push(`알 수 없는 program_id: ${programId || "(empty)"}`);
    } else if (!statusOptions(program).includes(tier)) {
      issues.push(`${program.shortName}에 없는 tier: ${tier || "(empty)"}`);
    }
    if (nightsResult.error) issues.push(nightsResult.error);
    if (pointsResult.error) issues.push(pointsResult.error);
    if (program && seenPrograms.has(program.id)) issues.push(`${program.shortName} 행이 중복되었습니다.`);

    if (program) seenPrograms.add(program.id);
    if (issues.length) errors.push(`Row ${rowNumber}: ${issues.join(" / ")}`);

    parsedRows.push({
      programId,
      programName: program?.shortName || programId || "Unknown",
      tier,
      nights: nightsResult.value,
      points: pointsResult.value,
      issues
    });
  });

  const missingPrograms = programs
    .filter((program) => !seenPrograms.has(program.id))
    .map((program) => program.shortName);
  if (missingPrograms.length) warnings.push(`CSV에 없는 호텔은 현재 값 유지: ${missingPrograms.join(", ")}`);

  return { profileName, rows: parsedRows, errors, warnings };
}

function renderCsvImportPreview(result) {
  const hasErrors = result.errors.length > 0;
  const hasWarnings = result.warnings.length > 0;
  const statusItems = [
    ...result.errors.map((item) => `<li>${escapeHtml(item)}</li>`),
    ...result.warnings.map((item) => `<li>${escapeHtml(item)}</li>`)
  ].join("");

  els.csvImportStatus.className = `csv-import-status ${hasErrors ? "has-error" : hasWarnings ? "has-warning" : "is-ready"}`;
  els.csvImportStatus.innerHTML = hasErrors || hasWarnings
    ? `<ul>${statusItems}</ul>`
    : `${escapeHtml(result.profileName || state.profile.name)} 프로필을 Import할 수 있습니다.`;

  els.csvPreviewBody.innerHTML = result.rows.map((row) => `
    <tr class="${row.issues.length ? "is-invalid" : ""}">
      <td>${escapeHtml(row.programName)}</td>
      <td>${escapeHtml(row.tier)}</td>
      <td>${fmtNumber(row.nights)}</td>
      <td>${fmtNumber(row.points)}</td>
      <td>${row.issues.length ? escapeHtml(row.issues.join(" / ")) : "Ready"}</td>
    </tr>
  `).join("");
  els.csvPreviewWrap.hidden = result.rows.length === 0;
  els.csvImportApplyButton.disabled = hasErrors || result.rows.length === 0;
}

function handleCsvFileChange() {
  const file = els.csvFileInput.files?.[0];
  if (!file) {
    resetCsvImport();
    return;
  }

  els.csvFileName.textContent = file.name;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    pendingCsvImport = parseProfileCsv(String(reader.result || ""));
    renderCsvImportPreview(pendingCsvImport);
  });
  reader.addEventListener("error", () => {
    pendingCsvImport = { profileName: "", rows: [], errors: ["CSV 파일을 읽지 못했습니다."], warnings: [] };
    renderCsvImportPreview(pendingCsvImport);
  });
  reader.readAsText(file);
}

function openCsvImportModal() {
  resetCsvImport();
  els.csvImportModal.hidden = false;
  els.csvFileInput.focus();
}

function closeCsvImportModal() {
  els.csvImportModal.hidden = true;
  resetCsvImport();
  els.importCsvButton.focus();
}

function applyCsvImport() {
  if (!pendingCsvImport || pendingCsvImport.errors.length) return;
  if (pendingCsvImport.profileName) state.profile.name = pendingCsvImport.profileName;
  pendingCsvImport.rows
    .filter((row) => !row.issues.length)
    .forEach((row) => {
      state.profile.statuses[row.programId] = {
        ...statusFor(programs.find((program) => program.id === row.programId)),
        tier: row.tier,
        nights: row.nights,
        points: row.points
      };
    });
  saveProfile();
  closeCsvImportModal();
  render();
}

function applyLocale(locale) {
  const nextLocale = locale === "en" ? "en" : "ko";
  const copy = localeCopy[nextLocale];
  localStorage.setItem(localeStorageKey, nextLocale);
  document.documentElement.lang = nextLocale;
  els.appSubcopy.textContent = copy.subcopy;
  els.sourcePill.textContent = copy.source;
  els.feedbackButton.textContent = copy.feedback;
  els.guideButton.textContent = copy.guide;
  els.languageButtons.forEach((button) => {
    const isActive = button.dataset.locale === nextLocale;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function openGuideModal() {
  els.guideModal.hidden = false;
  els.guideCloseButton.focus();
}

function closeGuideModal() {
  els.guideModal.hidden = true;
  els.guideButton.focus();
}

function openFeedbackModal() {
  els.feedbackModal.hidden = false;
  els.feedbackFormLink.focus();
}

function closeFeedbackModal() {
  els.feedbackModal.hidden = true;
  els.feedbackButton.focus();
}

renderScenarioOptions();
render();
applyLocale(loadLocale());

[els.nightsInput, els.rateInput, els.regionInput, els.scenarioInput, els.breakfastToggle, els.suiteToggle, els.simpleToggle]
  .forEach((control) => control.addEventListener("input", syncFromControls));

[els.profileNameInput, els.tripCityInput, els.tripNightsInput, els.tripPurposeInput, els.tripBreakfastToggle, els.tripLoungeToggle, els.tripUpgradeToggle, els.tripCheckoutToggle]
  .forEach((control) => control.addEventListener("change", syncTrip));

els.tripPurposeOptions.forEach((control) => control.addEventListener("change", syncTrip));

els.statusGrid.addEventListener("change", syncFromProfile);
els.statusGrid.addEventListener("input", syncProfileDraft);
els.saveProfileButton.addEventListener("click", () => {
  state.profile.name = els.profileNameInput.value.trim();
  saveProfile();
  els.saveProfileButton.textContent = "Saved";
  setTimeout(() => {
    els.saveProfileButton.textContent = "Save";
  }, 900);
});

els.exportCsvButton.addEventListener("click", exportProfileCsv);
els.importCsvButton.addEventListener("click", openCsvImportModal);
els.csvImportCloseButton.addEventListener("click", closeCsvImportModal);
els.csvImportCancelButton.addEventListener("click", closeCsvImportModal);
els.csvFileInput.addEventListener("change", handleCsvFileChange);
els.csvImportApplyButton.addEventListener("click", applyCsvImport);
els.csvImportModal.addEventListener("click", (event) => {
  if (event.target === els.csvImportModal) closeCsvImportModal();
});

els.guideButton.addEventListener("click", openGuideModal);
els.guideCloseButton.addEventListener("click", closeGuideModal);
els.guideModal.addEventListener("click", (event) => {
  if (event.target === els.guideModal) closeGuideModal();
});

els.feedbackButton.addEventListener("click", openFeedbackModal);
els.feedbackCloseButton.addEventListener("click", closeFeedbackModal);
els.feedbackModal.addEventListener("click", (event) => {
  if (event.target === els.feedbackModal) closeFeedbackModal();
});
els.languageToggle.addEventListener("click", (event) => {
  const button = event.target.closest("[data-locale]");
  if (!button) return;
  applyLocale(button.dataset.locale);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.guideModal.hidden) closeGuideModal();
  if (event.key === "Escape" && !els.feedbackModal.hidden) closeFeedbackModal();
  if (event.key === "Escape" && !els.csvImportModal.hidden) closeCsvImportModal();
});

els.leagueGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-program]");
  if (!card) return;
  state.selectedProgramId = card.dataset.program;
  render();
});

els.statusGrid.addEventListener("click", (event) => {
  if (event.target.closest("input, select, label")) return;
  const card = event.target.closest("[data-status-program]");
  if (!card) return;
  state.selectedProgramId = card.dataset.statusProgram;
  render();
});

els.nextTierGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-program]");
  if (!card) return;
  state.selectedProgramId = card.dataset.program;
  render();
});

els.radarTabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-radar-program]");
  if (!tab) return;
  state.selectedProgramId = tab.dataset.radarProgram;
  render();
});
