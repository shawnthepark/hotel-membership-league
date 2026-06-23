export const programs = [
  {
    id: "marriott",
    name: "Marriott Bonvoy",
    shortName: "Marriott",
    color: "#d71920",
    footprintLabel: "초대형 글로벌 커버리지",
    pointValue: 0.84,
    basePointsPerDollar: 10,
    sourceUrl: "https://www.marriott.com/loyalty/member-benefits.mi",
    sourceLabel: "Marriott Bonvoy benefits",
    verifiedAt: "2026-06-23",
    strengths: ["브랜드 수", "상위 티어 조식/라운지", "50/75박 Choice Benefit"],
    tiers: [
      { name: "Member", nights: 0, spend: 0, bonus: 0, lateCheckout: "Wi-Fi", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "Member rates" },
      { name: "Silver", nights: 10, spend: 0, bonus: 10, lateCheckout: "Priority", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "10% bonus" },
      { name: "Gold", nights: 25, spend: 0, bonus: 25, lateCheckout: "2pm", breakfast: "No", lounge: "No", upgrades: "Room", suite: "No", milestone: "Enhanced upgrades" },
      { name: "Platinum", nights: 50, spend: 0, bonus: 50, lateCheckout: "4pm", breakfast: "Choice", lounge: "Yes", upgrades: "Room + select suites", suite: "Available", milestone: "Annual Choice at 50" },
      { name: "Titanium", nights: 75, spend: 0, bonus: 75, lateCheckout: "4pm", breakfast: "Choice", lounge: "Yes", upgrades: "Room + select suites", suite: "Available", milestone: "Annual Choice at 75" },
      { name: "Ambassador", nights: 100, spend: 23000, bonus: 75, lateCheckout: "Your24", breakfast: "Choice", lounge: "Yes", upgrades: "Room + select suites", suite: "Available", milestone: "Ambassador + Your24" }
    ],
    scores: {
      breakfast: 78,
      upgrades: 82,
      lounge: 78,
      milestone: 72,
      earning: 82,
      redemption: 76,
      footprint: 96,
      ease: 58,
      finePrint: 55
    }
  },
  {
    id: "ihg",
    name: "IHG One Rewards",
    shortName: "IHG",
    color: "#0f766e",
    footprintLabel: "Holiday Inn 계열 포함 대형 네트워크",
    pointValue: 0.55,
    basePointsPerDollar: 10,
    sourceUrl: "https://www.ihg.com/onerewards/content/us/en/tier-benefits",
    sourceLabel: "IHG One Rewards benefits",
    verifiedAt: "2026-06-23",
    strengths: ["20박부터 10박 단위 Milestone Rewards", "Diamond 조식 선택", "Confirmable Suite Upgrade 선택지"],
    tiers: [
      { name: "Club", nights: 0, spend: 0, bonus: 0, lateCheckout: "2pm request", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "Member rates" },
      { name: "Silver", nights: 10, spend: 0, bonus: 20, lateCheckout: "2pm request", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "Points do not expire" },
      { name: "Gold", nights: 20, spend: 0, bonus: 40, lateCheckout: "2pm request", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "40% bonus" },
      { name: "Platinum", nights: 40, spend: 0, bonus: 60, lateCheckout: "2pm request", breakfast: "No", lounge: "Milestone", upgrades: "Room", suite: "Milestone", milestone: "Annual lounge option at 40" },
      { name: "Diamond", nights: 70, spend: 0, bonus: 100, lateCheckout: "2pm request", breakfast: "Yes", lounge: "Milestone", upgrades: "Room", suite: "Milestone", milestone: "Breakfast amenity + 100% bonus" }
    ],
    milestones: [20, 30, 40, 50, 60, 70, 80, 90, 100],
    scores: {
      breakfast: 82,
      upgrades: 76,
      lounge: 66,
      milestone: 94,
      earning: 82,
      redemption: 70,
      footprint: 90,
      ease: 72,
      finePrint: 68
    }
  },
  {
    id: "hyatt",
    name: "World of Hyatt",
    shortName: "Hyatt",
    color: "#1d4ed8",
    footprintLabel: "규모는 작지만 상위 혜택 강함",
    pointValue: 1.7,
    basePointsPerDollar: 5,
    sourceUrl: "https://world.hyatt.com/content/gp/en/tiers-and-benefits.html",
    sourceLabel: "World of Hyatt benefits",
    verifiedAt: "2026-06-23",
    strengths: ["Globalist 조식/클럽", "Globalist 스탠다드 스위트 업그레이드", "리조트피 면제"],
    tiers: [
      { name: "Member", nights: 0, spend: 0, bonus: 0, lateCheckout: "Member rates", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "Free night awards" },
      { name: "Discoverist", nights: 10, spend: 0, bonus: 10, lateCheckout: "2pm", breakfast: "No", lounge: "No", upgrades: "Preferred room", suite: "No", milestone: "2pm checkout" },
      { name: "Explorist", nights: 30, spend: 0, bonus: 20, lateCheckout: "2pm", breakfast: "No", lounge: "Awards", upgrades: "Room, no suites", suite: "Awards", milestone: "Club access awards possible" },
      { name: "Globalist", nights: 60, spend: 0, bonus: 30, lateCheckout: "4pm", breakfast: "Yes", lounge: "Yes", upgrades: "Including standard suites", suite: "Yes", milestone: "Guest of Honor style value" }
    ],
    scores: {
      breakfast: 96,
      upgrades: 96,
      lounge: 88,
      milestone: 86,
      earning: 72,
      redemption: 96,
      footprint: 58,
      ease: 62,
      finePrint: 82
    }
  },
  {
    id: "hilton",
    name: "Hilton Honors",
    shortName: "Hilton",
    color: "#7c3aed",
    footprintLabel: "대형 글로벌 커버리지",
    pointValue: 0.58,
    basePointsPerDollar: 10,
    sourceUrl: "https://www.hilton.com/en/hilton-honors/member-benefits/",
    sourceLabel: "Hilton Honors benefits",
    verifiedAt: "2026-06-23",
    strengths: ["Gold부터 조식/F&B 계열 혜택", "Diamond 라운지", "5th night free 구조"],
    tiers: [
      { name: "Member", nights: 0, spend: 0, bonus: 0, lateCheckout: "Request", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "No resort fees on awards" },
      { name: "Silver", nights: 10, spend: 0, bonus: 20, lateCheckout: "Request", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "5th night free on awards" },
      { name: "Gold", nights: 25, spend: 0, bonus: 80, lateCheckout: "Request", breakfast: "F&B / breakfast", lounge: "No", upgrades: "Room", suite: "No", milestone: "Gold sweet spot" },
      { name: "Diamond", nights: 50, spend: 11500, bonus: 100, lateCheckout: "Request", breakfast: "F&B / breakfast", lounge: "Yes", upgrades: "Up to 1-bedroom suite", suite: "Available", milestone: "48-hour guarantee" },
      { name: "Diamond Reserve", nights: 80, spend: 18000, bonus: 120, lateCheckout: "4pm guaranteed", breakfast: "F&B / breakfast", lounge: "Premium Clubs", upgrades: "Confirmable upgrade", suite: "Confirmable", milestone: "Premium club + confirmable upgrade" }
    ],
    scores: {
      breakfast: 84,
      upgrades: 82,
      lounge: 84,
      milestone: 68,
      earning: 92,
      redemption: 76,
      footprint: 92,
      ease: 86,
      finePrint: 66
    }
  },
  {
    id: "accor",
    name: "ALL - Accor Live Limitless",
    shortName: "Accor",
    color: "#d97706",
    footprintLabel: "유럽/아시아/미드스케일 강점",
    pointValue: 2.0,
    basePointsPerDollar: 2.5,
    sourceUrl: "https://all.accor.com/loyalty-program/cards-status-benefits-details/index.en.shtml",
    sourceLabel: "ALL Accor benefits",
    verifiedAt: "2026-06-23",
    strengths: ["현금 할인처럼 쓰기 쉬운 포인트", "유럽 커버리지", "Platinum부터 라운지/SNU"],
    tiers: [
      { name: "Classic", nights: 0, spend: 0, bonus: 0, lateCheckout: "Member rate", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "Premium Wi-Fi" },
      { name: "Silver", nights: 10, spend: 800, bonus: 24, lateCheckout: "Late checkout", breakfast: "No", lounge: "No", upgrades: "No", suite: "No", milestone: "Welcome drink" },
      { name: "Gold", nights: 30, spend: 2800, bonus: 48, lateCheckout: "Early or late", breakfast: "No", lounge: "No", upgrades: "Room", suite: "No", milestone: "Room upgrade" },
      { name: "Platinum", nights: 60, spend: 5600, bonus: 76, lateCheckout: "Early and late", breakfast: "APAC / weekends", lounge: "Yes", upgrades: "Room", suite: "SNU", milestone: "Suite Night Upgrades" },
      { name: "Diamond", nights: null, spend: 10400, bonus: 100, lateCheckout: "Early and late", breakfast: "Weekend / APAC", lounge: "Yes", upgrades: "Room", suite: "SNU", milestone: "Dining & Spa Rewards" },
      { name: "Limitless", nights: null, spend: null, bonus: 100, lateCheckout: "Concierge", breakfast: "Diamond+", lounge: "Yes", upgrades: "Room", suite: "SNU", milestone: "Invitation only" }
    ],
    scores: {
      breakfast: 70,
      upgrades: 74,
      lounge: 78,
      milestone: 76,
      earning: 76,
      redemption: 84,
      footprint: 78,
      ease: 70,
      finePrint: 60
    }
  }
];

export const criteria = [
  { key: "breakfast", label: "조식" },
  { key: "upgrades", label: "업그레이드" },
  { key: "lounge", label: "라운지" },
  { key: "milestone", label: "마일스톤" },
  { key: "earning", label: "적립력" },
  { key: "redemption", label: "리뎀션" },
  { key: "footprint", label: "커버리지" },
  { key: "ease", label: "쉬운 혜택" },
  { key: "finePrint", label: "명확성" }
];

export const scenarios = [
  {
    id: "breakfast",
    name: "Breakfast Boss",
    copy: "조식과 F&B 혜택이 중요한 여행자",
    weights: { breakfast: 2.2, ease: 1.2, footprint: 1.0, finePrint: 1.0 }
  },
  {
    id: "suite",
    name: "Suite Hunter",
    copy: "스위트와 확정 업그레이드를 노리는 여행자",
    weights: { upgrades: 2.2, milestone: 1.5, lounge: 1.2, finePrint: 1.0 }
  },
  {
    id: "road",
    name: "Road Warrior",
    copy: "출장 빈도가 높고 late checkout이 중요한 여행자",
    weights: { footprint: 1.6, earning: 1.5, lounge: 1.3, breakfast: 1.2, ease: 1.0 }
  },
  {
    id: "family",
    name: "Family Value",
    copy: "가족 여행과 포인트 숙박 가치를 보는 여행자",
    weights: { redemption: 1.8, breakfast: 1.5, footprint: 1.4, ease: 1.0 }
  },
  {
    id: "europe",
    name: "Europe King",
    copy: "유럽 여행과 미드스케일 선택지가 많은 여행자",
    weights: { footprint: 1.6, redemption: 1.2, ease: 1.0, finePrint: 0.8 },
    regionBoost: { accor: 12, marriott: 4, ihg: 5, hilton: 4 }
  }
];
