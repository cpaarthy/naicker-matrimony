import { calculateMatchScore } from "./matchScore";

export const COMPLETENESS_FIELDS = [
  "name", "gender", "age", "height", "religion", "caste", "sub_caste", "education",
  "occupation", "income", "address", "district", "city", "state", "mother_tongue",
  "phone", "photo_url", "about",
  "father_occupation", "mother_occupation", "siblings", "family_type",
  "star", "rasi", "birth_time", "birth_place",
  "complexion", "body_type", "blood_group",
  "diet", "smoking", "drinking",
  "pref_age_min", "pref_age_max", "pref_education", "pref_occupation",
];

export function calculateCompleteness(profile) {
  if (!profile) return 0;
  const filled = COMPLETENESS_FIELDS.filter(
    f => profile[f] !== null && profile[f] !== undefined && profile[f] !== "",
  ).length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isWithinDays(iso, days) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

function countViewsInPeriod(views, days) {
  return views.filter(v => isWithinDays(v.viewed_at, days)).length;
}

function uniqueViewers(views) {
  return new Set(views.map(v => v.viewer_id)).size;
}

function repeatViewers(views) {
  const counts = {};
  views.forEach(v => { counts[v.viewer_id] = (counts[v.viewer_id] || 0) + 1; });
  return Object.values(counts).filter(c => c > 1).length;
}

function opposingGender(profile) {
  if (!profile?.gender) return null;
  return profile.gender === "Male" ? "Female" : profile.gender === "Female" ? "Male" : null;
}

function matchesPreferences(myProfile, other) {
  if (myProfile.pref_age_min && other.age < myProfile.pref_age_min) return false;
  if (myProfile.pref_age_max && other.age > myProfile.pref_age_max) return false;
  if (myProfile.pref_education && !other.education?.toLowerCase().includes(myProfile.pref_education.toLowerCase())) return false;
  if (myProfile.pref_occupation && !other.occupation?.toLowerCase().includes(myProfile.pref_occupation.toLowerCase())) return false;
  return true;
}

function isNearby(myProfile, other) {
  if (!myProfile || !other) return false;
  const sameDistrict = myProfile.district && other.district
    && myProfile.district.trim().toLowerCase() === other.district.trim().toLowerCase();
  const sameCity = myProfile.city && other.city
    && myProfile.city.trim().toLowerCase() === other.city.trim().toLowerCase();
  return sameDistrict || sameCity;
}

function isOverseas(other) {
  if (!other?.state) return false;
  return other.state.trim().toLowerCase() !== "tamil nadu";
}

function avgMatchScore(profile, candidates) {
  if (!candidates.length) return 0;
  const total = candidates.reduce((sum, c) => sum + (calculateMatchScore(profile, c)?.percentage || 0), 0);
  return Math.round(total / candidates.length);
}

function preferenceGaps(profile, candidates) {
  const gaps = { age: 0, education: 0, occupation: 0, subCaste: 0, city: 0 };
  candidates.forEach(other => {
    const score = calculateMatchScore(profile, other);
    if (!score) return;
    score.breakdown.forEach(b => {
      if (b.matched) return;
      if (b.label === "Age") gaps.age += 1;
      if (b.label === "Education") gaps.education += 1;
      if (b.label === "Occupation") gaps.occupation += 1;
      if (b.label === "Sub caste") gaps.subCaste += 1;
      if (b.label === "City") gaps.city += 1;
    });
  });
  return Object.entries(gaps)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: { age: "Age range", education: "Education", occupation: "Occupation", subCaste: "Sub caste", city: "City" }[key],
      count,
    }));
}

function readLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function buildMemberAnalytics({
  profile,
  session,
  requests = [],
  favourites = [],
  notifications = [],
  blocked = [],
  recentlyViewedByMe = [],
  profileViewsReceived = [],
  approvedProfiles = [],
}) {
  const userId = profile?.id;
  const oppGender = opposingGender(profile);

  const sent = requests.filter(r => r.from_id === userId);
  const received = requests.filter(r => r.to_id === userId);
  const accepted = requests.filter(r =>
    (r.from_id === userId || r.to_id === userId) && r.status === "accepted",
  );
  const pendingSent = sent.filter(r => r.status === "pending");
  const pendingReceived = received.filter(r => r.status === "pending");
  const rejectedReceived = received.filter(r => r.status === "declined");

  const matchCandidates = approvedProfiles.filter(p =>
    p.id !== userId
    && (!oppGender || p.gender === oppGender)
    && !blocked.some(b => b.blocked_id === p.id),
  );

  const scored = matchCandidates.map(p => ({
    profile: p,
    score: calculateMatchScore(profile, p)?.percentage || 0,
  }));

  const highCompat = scored.filter(s => s.score >= 90);
  const mediumCompat = scored.filter(s => s.score >= 60 && s.score < 90);
  const newMembersMatching = matchCandidates.filter(p =>
    isWithinDays(p.created_at, 7) && matchesPreferences(profile, p),
  );
  const recentlyActive = matchCandidates.filter(p => isWithinDays(p.last_active_at, 7));
  const nearbyMatches = matchCandidates.filter(p => isNearby(profile, p));
  const overseasMatches = matchCandidates.filter(p => isOverseas(p));

  const newMatchesToday = notifications.filter(n =>
    n.type === "new_match" && isWithinDays(n.created_at, 1),
  ).length;

  const sentAccepted = sent.filter(r => r.status === "accepted").length;
  const acceptanceRate = sent.length
    ? Math.round((sentAccepted / sent.length) * 100)
    : 0;
  const responseRate = received.length
    ? Math.round((received.filter(r => r.status !== "pending").length / received.length) * 100)
    : 0;

  const loginHistory = readLocalJson("naicker_login_history", []);
  const searchHistory = readLocalJson("naicker_search_history", []);
  const savedSearches = readLocalJson("naicker_saved_searches", []);
  const poruthamViews = Number(localStorage.getItem("naicker_porutham_views") || 0);
  const passwordChangedAt = localStorage.getItem("naicker_password_changed_at");

  const gaps = preferenceGaps(profile, matchCandidates.slice(0, 20));
  const recommendationScore = avgMatchScore(profile, highCompat.length ? highCompat.map(h => h.profile) : matchCandidates.slice(0, 10));

  const membershipStart = profile?.created_at ? new Date(profile.created_at) : null;
  const membershipDays = membershipStart
    ? Math.max(0, Math.floor((Date.now() - membershipStart.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;

  const isParentManaged = profile?.profile_for && profile.profile_for !== "Self";

  return {
    personal: {
      profileCompletion: calculateCompleteness(profile),
      membershipStatus: profile?.status === "approved" ? "Active Member" : profile?.status === "pending" ? "Pending Approval" : profile?.status === "rejected" ? "Not Approved" : "Guest",
      verificationStatus: profile?.status === "approved" ? "Admin Verified" : profile?.status === "pending" ? "Awaiting Review" : "Unverified",
      profileViewsToday: countViewsInPeriod(profileViewsReceived, 1),
      profileViewsWeek: countViewsInPeriod(profileViewsReceived, 7),
      profileViewsMonth: countViewsInPeriod(profileViewsReceived, 30),
      interestsSent: sent.length,
      interestsReceived: received.length,
      shortlistedProfiles: favourites.length,
      chatRequests: 0,
      newMatchesToday,
    },
    matchAnalytics: {
      totalMatchingProfiles: matchCandidates.length,
      highCompatibility: highCompat.length,
      mediumCompatibility: mediumCompat.length,
      newMembersMatchingPreference: newMembersMatching.length,
      recentlyActiveMatches: recentlyActive.length,
      nearbyMatches: nearbyMatches.length,
      overseasMatches: overseasMatches.length,
    },
    profilePerformance: {
      totalProfileViews: profileViewsReceived.length,
      uniqueVisitors: uniqueViewers(profileViewsReceived),
      repeatVisitors: repeatViewers(profileViewsReceived),
      photoViews: profile?.photo_url ? profileViewsReceived.length : 0,
      horoscopeDownloads: poruthamViews,
      contactRequests: received.length,
      acceptanceRate,
      responseRate,
    },
    activity: {
      lastLogin: session?.user?.last_sign_in_at || null,
      loginHistory,
      recentlyViewedProfiles: recentlyViewedByMe.length,
      recentlySearchedFilters: searchHistory.length,
      savedSearches: savedSearches.length,
      searchHistory,
    },
    communication: {
      interestsSent: sent.length,
      interestsAccepted: sent.filter(r => r.status === "accepted").length,
      interestsRejected: sent.filter(r => r.status === "declined").length,
      pendingInterests: pendingSent.length + pendingReceived.length,
      chatConversations: 0,
      unreadMessages: notifications.filter(n => !n.read).length,
      blockedUsers: blocked.length,
    },
    partnerPreference: {
      preferenceMatchPercentage: recommendationScore,
      criteriaNotMatching: gaps,
      suggestedPreferenceChanges: gaps.slice(0, 3).map(g =>
        `Relax ${g.label.toLowerCase()} — ${g.count} profiles didn't match`,
      ),
      aiRecommendationScore: recommendationScore,
    },
    premium: {
      remainingMembershipDays: "Unlimited",
      membershipType: "Free Community",
      premiumFeaturesUsed: 0,
      contactUnlockCount: accepted.length,
      boostedProfileViews: 0,
      membershipDays,
    },
    security: {
      verifiedDocuments: profile?.status === "approved" ? "Profile verified by admin" : "Pending verification",
      loginDevices: loginHistory.length ? `${loginHistory.length} recorded session(s)` : "Current device only",
      lastPasswordChange: passwordChangedAt || "Not recorded",
      privacySettingsStatus: profile?.phone ? "Phone hidden from members" : "Incomplete profile",
    },
    family: {
      familyMemberAccess: isParentManaged ? "Parent-managed profile" : "Self-managed",
      parentActivity: isParentManaged ? profile.profile_for : "N/A",
      sharedProfiles: profile?.status === "approved" ? 1 : 0,
      meetingRequests: accepted.length,
    },
    success: {
      matchesContacted: sent.length + received.length,
      meetingsScheduled: 0,
      profilesFinalized: accepted.length,
      engagementStatus: accepted.length > 0 ? "Active engagement" : sent.length > 0 ? "Awaiting responses" : "Getting started",
    },
  };
}
