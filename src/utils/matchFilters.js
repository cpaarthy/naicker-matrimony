// Shared matching/filter rules used by Dashboard analytics and Browse.
// Keeping these rules in one place prevents the dashboard count and the
// profile list from using different logic.

export const NEW_MEMBER_DAYS = 30;
export const RECENTLY_ACTIVE_DAYS = 7;

export function daysSince(value) {
  if (!value) return Infinity;
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return Math.max(0, (Date.now() - t) / 86400000);
}

export function matchesPartnerPreference(myProfile, candidate) {
  if (!myProfile || !candidate) return false;

  if (myProfile.pref_age_min != null && myProfile.pref_age_min !== "" &&
      Number(candidate.age) < Number(myProfile.pref_age_min)) return false;
  if (myProfile.pref_age_max != null && myProfile.pref_age_max !== "" &&
      Number(candidate.age) > Number(myProfile.pref_age_max)) return false;

  const wantedEducation = String(myProfile.pref_education || "").trim().toLowerCase();
  if (wantedEducation &&
      !String(candidate.education || "").toLowerCase().includes(wantedEducation)) return false;

  const wantedOccupation = String(myProfile.pref_occupation || "").trim().toLowerCase();
  if (wantedOccupation &&
      !String(candidate.occupation || "").toLowerCase().includes(wantedOccupation)) return false;

  return true;
}

export function isOppositeGender(myProfile, candidate) {
  if (!myProfile || !candidate) return false;
  if (candidate.id === myProfile.id) return false;
  if (myProfile.gender === "Male") return candidate.gender === "Female";
  if (myProfile.gender === "Female") return candidate.gender === "Male";
  return true;
}

export function isNewMember(candidate) {
  const d = daysSince(candidate?.created_at);
  return d !== Infinity && d <= NEW_MEMBER_DAYS;
}

export function isRecentlyActive(candidate) {
  const d = daysSince(candidate?.last_active_at);
  return d !== Infinity && d <= RECENTLY_ACTIVE_DAYS;
}

export function isNearby(myProfile, candidate) {
  if (!myProfile || !candidate) return false;
  const city = String(myProfile.city || "").trim().toLowerCase();
  const candidateCity = String(candidate.city || "").trim().toLowerCase();
  const district = String(myProfile.district || "").trim().toLowerCase();
  const candidateDistrict = String(candidate.district || "").trim().toLowerCase();

  return (!!city && !!candidateCity && city === candidateCity) ||
    (!!district && !!candidateDistrict && district === candidateDistrict);
}

// matchFilter is the exact filter used by the dashboard cards.
export function matchesAnalyticsFilter(matchFilter, myProfile, candidate, scorePercentage) {
  if (!matchFilter) return true;
  if (!matchesPartnerPreference(myProfile, candidate)) return false;

  switch (matchFilter) {
    case "all":
      return true;
    case "high":
      return Number(scorePercentage) >= 90;
    case "medium":
      return Number(scorePercentage) >= 50 && Number(scorePercentage) < 90;
    case "low":
      return Number(scorePercentage) < 50;
    case "verified":
      return !!candidate.is_verified;
    case "new":
      return isNewMember(candidate);
    case "active":
      return isRecentlyActive(candidate);
    case "nearby":
      return isNearby(myProfile, candidate);
    default:
      return false;
  }
}
