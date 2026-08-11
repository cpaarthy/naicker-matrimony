// Match score: ONLY Age, City, Education and Occupation.
// Weights: Age 35, City 25, Education 20, Occupation 20.
// The returned object is intentionally compatible with the existing UI:
// calculateMatchScore(...).percentage and .breakdown.

const text = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const same = (a, b) => {
  const x = text(a);
  const y = text(b);
  return !!x && !!y && x === y;
};

function ageMatches(profile, candidate) {
  const age = Number(candidate?.age);
  if (!Number.isFinite(age)) return false;

  const min = Number(profile?.pref_age_min);
  const max = Number(profile?.pref_age_max);
  const hasPreference = Number.isFinite(min) || Number.isFinite(max);

  // If an age preference exists, being inside that preferred range is an
  // Age match. If no preference exists, compare the two actual ages.
  if (hasPreference) {
    if (Number.isFinite(min) && age < min) return false;
    if (Number.isFinite(max) && age > max) return false;
    return true;
  }

  const myAge = Number(profile?.age);
  return Number.isFinite(myAge) && age === myAge;
}

export function calculateMatchScore(profile, candidate) {
  if (!profile || !candidate) {
    return { percentage: 0, breakdown: [] };
  }

  const ageMatch = ageMatches(profile, candidate);
  const cityMatch = same(profile.city, candidate.city);
  const educationMatch = same(profile.education, candidate.education);
  const occupationMatch = same(profile.occupation, candidate.occupation);

  const percentage =
    (ageMatch ? 35 : 0) +
    (cityMatch ? 25 : 0) +
    (educationMatch ? 20 : 0) +
    (occupationMatch ? 20 : 0);

  return {
    percentage,
    breakdown: [
      { key: "age", label: "Age", matched: ageMatch, weight: 35 },
      { key: "city", label: "City", matched: cityMatch, weight: 25 },
      { key: "education", label: "Education", matched: educationMatch, weight: 20 },
      { key: "occupation", label: "Occupation", matched: occupationMatch, weight: 20 },
    ],
  };
}

export function getMatchCategory(scoreOrResult) {
  const value =
    typeof scoreOrResult === "object"
      ? Number(scoreOrResult?.percentage) || 0
      : Number(scoreOrResult) || 0;

  if (value >= 90) return "high";
  if (value >= 50) return "medium";
  return "low";
}

export const MATCH_SCORE_WEIGHTS = Object.freeze({
  age: 35,
  city: 25,
  education: 20,
  occupation: 20,
});
