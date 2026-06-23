import { criteria, programs, scenarios } from "./programs.js";

const storageKey = "hotel-membership-league-profile";

const defaultProfile = {
  name: "Traveler",
  statuses: {
    marriott: { tier: "Member", nights: 0, points: 0 },
    ihg: { tier: "Club", nights: 0, points: 0 },
    hyatt: { tier: "Member", nights: 0, points: 0 },
    hilton: { tier: "Member", nights: 0, points: 0 },
    accor: { tier: "Classic", nights: 0, points: 0 }
  },
  trip: {
    city: "Shanghai",
    nights: 3,
    purpose: "business",
    breakfast: true,
    lounge: true,
    upgrade: true,
    checkout: true
  }
};

const state = {
  nights: 35,
  rate: 220,
  region: "global",
  scenario: "breakfast",
  breakfast: true,
  suite: false,
  simple: false,
  selectedProgramId: "hyatt",
  profile: loadProfile()
};

const els = {
  profileNameInput: document.querySelector("#profile-name-input"),
  saveProfileButton: document.querySelector("#save-profile-button"),
  statusGrid: document.querySelector("#status-grid"),
  tripCityInput: document.querySelector("#trip-city-input"),
  tripNightsInput: document.querySelector("#trip-nights-input"),
  tripPurposeInput: document.querySelector("#trip-purpose-input"),
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
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return normalizeProfile(saved);
  } catch {
    return normalizeProfile();
  }
}

function saveProfile() {
  localStorage.setItem(storageKey, JSON.stringify(state.profile));
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

function currentScenario() {
  return scenarios.find((scenario) => scenario.id === state.scenario) || scenarios[0];
}

function qualifyingTier(program, nights = state.nights, rate = state.rate) {
  const annualSpend = nights * rate;
  return [...program.tiers]
    .filter((tier) => tier.name !== "Limitless")
    .filter((tier) => {
      const nightsOk = tier.nights === null || nights >= tier.nights;
      const spendOk = !tier.spend || annualSpend >= tier.spend;
      return nightsOk && spendOk;
    })
    .sort((a, b) => (b.nights || 999) - (a.nights || 999))[0] || program.tiers[0];
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
  const checkout = trip.checkout ? benefitProbability(tier.lateCheckout, "checkout") * (tripValueAssumptions.checkout[trip.purpose] || 25) : 0;
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

function tripScore(program) {
  const tier = effectiveTier(program);
  const trip = state.profile.trip;
  let score = tierBenefitScore(tier) + tripRegionBoost(program);
  if (trip.breakfast && benefitStatus(tier.breakfast, "breakfast") !== "no") score += 8;
  if (trip.lounge && benefitStatus(tier.lounge) !== "no") score += 8;
  if (trip.upgrade && benefitStatus(tier.upgrades) !== "no") score += 8;
  if (trip.checkout && benefitStatus(tier.lateCheckout) !== "no") score += 6;
  if (trip.purpose === "business") score += tier.lateCheckout.includes("4pm") || tier.lateCheckout === "Your24" ? 6 : 0;
  if (trip.purpose === "family") score += benefitStatus(tier.breakfast, "breakfast") !== "no" ? 6 : 0;
  if (trip.purpose === "luxury") score += tier.suite !== "No" ? 8 : 0;
  score += Math.min(tripValueFor(program).total / 12, 14);
  return clamp(score, 0, 100);
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
  els.tripBadge.textContent = `${state.profile.trip.city} · ${state.profile.trip.nights} nights`;
  els.tripSummary.textContent = `${state.profile.trip.city} ${state.profile.trip.purpose} ${state.profile.trip.nights}박 · ${fmtMoney(state.rate)}/night 기준`;
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
    { label: "현재 모드", value: scenario.name, note: scenario.copy },
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
          <span>현재 ${program.currentTier.name}</span>
          <span>${nextCopy}</span>
        </div>
        <div class="tag-row">
          ${program.strengths.slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderLadder(scored) {
  const maxNights = 100;
  els.ladderBoard.innerHTML = scored.map((program) => {
    const annualSpend = state.nights * state.rate;
    const tiers = program.tiers
      .filter((tier) => tier.nights !== null || tier.spend !== null)
      .map((tier) => {
        const position = tier.nights === null ? 100 : tier.nights / maxNights * 100;
        const unlocked = (tier.nights === null || state.nights >= tier.nights) && (!tier.spend || annualSpend >= tier.spend);
        return `
          <div class="tier-dot ${unlocked ? "is-unlocked" : ""}" style="left:${position}%">
            <span></span>
            <small>${tier.name}</small>
          </div>
        `;
      }).join("");

    return `
      <div class="ladder-row">
        <div class="ladder-name"><span class="dot" style="color:${program.color}"></span>${program.shortName}</div>
        <div class="ladder-line">
          <div class="traveler-pin" style="left:${Math.min(state.nights / maxNights * 100, 100)}%"></div>
          ${tiers}
        </div>
      </div>
    `;
  }).join("");
}

function renderRadar(program) {
  els.radarTitle.textContent = `${program.name} · ${program.currentTier?.name || currentTier(program).name}`;
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
    </a>
  `).join("");
}

function renderStatusInputs() {
  els.statusGrid.innerHTML = programs.map((program) => {
    const status = statusFor(program);
    return `
      <article class="status-card" data-status-program="${program.id}">
        <div class="status-head">
          <span class="brand-mark mini" style="background:${program.color}">${program.shortName.slice(0, 2).toUpperCase()}</span>
          <strong>${program.shortName}</strong>
        </div>
        <label>
          <span>Current tier</span>
          <select data-profile-tier="${program.id}">
            ${statusOptions(program).map((tier) => `<option value="${tier}" ${tier === status.tier ? "selected" : ""}>${tier}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>YTD nights</span>
          <input data-profile-nights="${program.id}" type="number" min="0" max="365" value="${status.nights}">
        </label>
        <label>
          <span>Points</span>
          <input data-profile-points="${program.id}" type="number" min="0" step="1000" value="${status.points || 0}">
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
  renderTripInputs();
  renderTripResults();
  const scored = scoredPrograms();
  const selected = scored.find((program) => program.id === state.selectedProgramId) || scored[0];
  renderScoreStrip(scored);
  renderLeague(scored);
  renderLadder(scored);
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
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      tier: tierControl.value
    };
  }
  if (nightsControl) {
    const programId = nightsControl.dataset.profileNights;
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      nights: Number(nightsControl.value)
    };
  }
  if (pointsControl) {
    const programId = pointsControl.dataset.profilePoints;
    state.profile.statuses[programId] = {
      ...statusFor(programs.find((program) => program.id === programId)),
      points: Math.max(Number(pointsControl.value) || 0, 0)
    };
  }
  saveProfile();
  render();
}

function syncTrip() {
  state.profile.name = els.profileNameInput.value || "Traveler";
  state.profile.trip.city = els.tripCityInput.value || "Shanghai";
  state.profile.trip.nights = Math.max(Number(els.tripNightsInput.value) || 1, 1);
  state.profile.trip.purpose = els.tripPurposeInput.value;
  state.profile.trip.breakfast = els.tripBreakfastToggle.checked;
  state.profile.trip.lounge = els.tripLoungeToggle.checked;
  state.profile.trip.upgrade = els.tripUpgradeToggle.checked;
  state.profile.trip.checkout = els.tripCheckoutToggle.checked;
  saveProfile();
  render();
}

renderScenarioOptions();
render();

[els.nightsInput, els.rateInput, els.regionInput, els.scenarioInput, els.breakfastToggle, els.suiteToggle, els.simpleToggle]
  .forEach((control) => control.addEventListener("input", syncFromControls));

[els.profileNameInput, els.tripCityInput, els.tripNightsInput, els.tripPurposeInput, els.tripBreakfastToggle, els.tripLoungeToggle, els.tripUpgradeToggle, els.tripCheckoutToggle]
  .forEach((control) => control.addEventListener("change", syncTrip));

els.statusGrid.addEventListener("change", syncFromProfile);
els.saveProfileButton.addEventListener("click", () => {
  saveProfile();
  els.saveProfileButton.textContent = "Saved";
  setTimeout(() => {
    els.saveProfileButton.textContent = "Save";
  }, 900);
});

els.leagueGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-program]");
  if (!card) return;
  state.selectedProgramId = card.dataset.program;
  render();
});
