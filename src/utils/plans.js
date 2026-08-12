// Shared membership plan config. Plans are set by the admin only (manual
// toggle) — there's no payment gateway wired up yet. When one is added
// later, it should call the same admin_set_profile_plan RPC on successful
// payment instead of a person doing it by hand.

export const PLAN_ORDER = ["free", "silver", "gold"];

export const PLAN_INFO = {
  free: {
    label: "Free",
    tamil: "இலவசம்",
    dailyViewLimit: 10,
    dailyInterestLimit: 5,
    priority: false,
    whoViewed: false,
    color: "#8a7a63",
  },
  silver: {
    label: "Silver",
    tamil: "சில்வர்",
    dailyViewLimit: 50,
    dailyInterestLimit: null, // unlimited
    priority: true,
    whoViewed: true,
    color: "#7a8a99",
  },
  gold: {
    label: "Gold",
    tamil: "கோல்டு",
    dailyViewLimit: null, // unlimited
    dailyInterestLimit: null, // unlimited
    priority: true,
    whoViewed: true,
    color: "#b8860b",
  },
};

export function normalizePlan(plan) {
  return PLAN_ORDER.includes(plan) ? plan : "free";
}

export function getPlanInfo(plan) {
  return PLAN_INFO[normalizePlan(plan)];
}

export function formatDailyViewLimit(plan) {
  const info = getPlanInfo(plan);
  return info.dailyViewLimit == null ? "Unlimited" : `${info.dailyViewLimit} / day`;
}

export function formatDailyInterestLimit(plan) {
  const info = getPlanInfo(plan);
  return info.dailyInterestLimit == null ? "Unlimited" : `${info.dailyInterestLimit} / day`;
}
