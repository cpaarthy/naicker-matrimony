// Match score: ONLY Age, City, Education and Occupation.
// Weights: Age 35, City 25, Education 20, Occupation 20.
// A matching factor gets its full weight; otherwise it gets 0.
// Total is always an integer from 0 to 100.

const text = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const same = (a, b) => {
  const x = text(a);
  const y = text(b);
  return !!x && !!y && x === y;
};

const ageInPreference = (candidateAge, min, max) => {
  const age = Number(candidateAge);
  if (!Number.isFinite(age)) return false;

  const lo = Number(min);
  const hi = Number(max);

  if (Number.isFinite(lo) && age < lo) return false;
  if (Number.isFinite(hi) && age > hi) return false;
  return true;
};

export function calculateMatchScore(profile, candidate) {
  if (!profile || !candidate) return 0;

  // Age factor: full 35 points when the candidate's age is within
  // the viewer's stated min/max preference. If no min/max is stored,
  // compare exact age so missing preferences do not create a score.
  const hasAgePreference =
    Number.isFinite(Number(profile.pref_age_min)) ||
    Number.isFinite(Number(profile.pref_age_max));

  const ageMatch = hasAgePreference
    ? ageInPreference(
        candidate.age,
        profile.pref_age_min,
        profile.pref_age_max
      )
    : Number(profile.age) === Number(candidate.age);

  // City: exact normalized city match.
  const cityMatch = same(profile.city, candidate.city);

  // Education: exact normalized education match.
  const educationMatch = same(profile.education, candidate.education);

  // Occupation: exact normalized occupation match.
  const occupationMatch = same(profile.occupation, candidate.occupation);

  return (
    (ageMatch ? 35 : 0) +
    (cityMatch ? 25 : 0) +
    (educationMatch ? 20 : 0) +
    (occupationMatch ? 20 : 0)
  );
}

export function getMatchCategory(score) {
  const value = Number(score) || 0;
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
