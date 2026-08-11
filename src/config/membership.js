// Membership configuration
// Currently only Free membership is active.
// Paid plans are prepared for future use.

export const MEMBERSHIP_PLANS = {
  free: {
    id: "free",
    name: "Free",
    active: true,

    features: {
      profile: true,
      browse: true,
      search: true,
      interests: true,
      favourites: true,
      matchScore: true,
      porutham: true,
      messaging: true,
      notifications: true,
      profileViews: true,
      blocking: true,
      reporting: true,
    },
  },

  silver: {
    id: "silver",
    name: "Silver",
    active: false,
    features: {},
  },

  gold: {
    id: "gold",
    name: "Gold",
    active: false,
    features: {},
  },

  premium: {
    id: "premium",
    name: "Premium",
    active: false,
    features: {},
  },
};

// Current default membership.
// Until paid membership is introduced, everyone remains Free.
export const DEFAULT_MEMBERSHIP = "free";

export function getMembershipPlan(membership = DEFAULT_MEMBERSHIP) {
  return (
    MEMBERSHIP_PLANS[membership] ||
    MEMBERSHIP_PLANS[DEFAULT_MEMBERSHIP]
  );
}

export function hasMembershipFeature(
  membership,
  feature
) {
  const plan = getMembershipPlan(membership);

  return Boolean(plan?.active && plan?.features?.[feature]);
}

export function getActiveMembershipPlans() {
  return Object.values(MEMBERSHIP_PLANS).filter(
    (plan) => plan.active
  );
}