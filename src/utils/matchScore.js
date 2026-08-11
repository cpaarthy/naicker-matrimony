/**
 * CENTRAL MATCH SCORE
 * Only 4 factors:
 * Age 35, City 25, Education 20, Occupation 20.
 * Every screen must use calculateMatchScore().
 */

export const MATCH_WEIGHTS = Object.freeze({
  age: 35,
  city: 25,
  education: 20,
  occupation: 20,
});

const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const equalText = (a, b) => {
  const x = norm(a);
  const y = norm(b);
  return !!x && !!y && x === y;
};

const getAgeMatch = (viewer, candidate) => {
  const age = Number(candidate?.age);
  if (!Number.isFinite(age)) return false;

  const min = Number(viewer?.pref_age_min ?? viewer?.partner_min_age);
  const max = Number(viewer?.pref_age_max ?? viewer?.partner_max_age);

  if (Number.isFinite(min) && age < min) return false;
  if (Number.isFinite(max) && age > max) return false;

  if (Number.isFinite(min) || Number.isFinite(max)) return true;

  const ownAge = Number(viewer?.age);
  return Number.isFinite(ownAge) && ownAge === age;
};

export function getMatchBreakdown(viewer, candidate) {
  const rows = [
    { key: "age", label: "Age / வயது", weight: 35, matched: getAgeMatch(viewer, candidate) },
    { key: "city", label: "City / நகரம்", weight: 25, matched: equalText(viewer?.city, candidate?.city) },
    { key: "education", label: "Education / கல்வி", weight: 20, matched: equalText(viewer?.education, candidate?.education) },
    { key: "occupation", label: "Occupation / வேலை", weight: 20, matched: equalText(viewer?.occupation, candidate?.occupation) },
  ].map((r) => ({ ...r, earned: r.matched ? r.weight : 0 }));

  const percentage = rows.reduce((sum, r) => sum + r.earned, 0);
  return { percentage, breakdown: rows };
}

export function calculateMatchScore(viewer, candidate) {
  return getMatchBreakdown(viewer, candidate).percentage;
}

export function getMatchScoreResult(viewer, candidate) {
  return getMatchBreakdown(viewer, candidate);
}

export function getMatchCategory(score) {
  const n = Number(score) || 0;
  if (n >= 90) return "high";
  if (n >= 50) return "medium";
  return "low";
}
