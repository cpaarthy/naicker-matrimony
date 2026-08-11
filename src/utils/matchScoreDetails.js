export const MATCH_FACTORS = [
  { key: "age", en: "Age", ta: "வயது", weight: 35 },
  { key: "city", en: "City", ta: "நகரம்", weight: 25 },
  { key: "education", en: "Education", ta: "கல்வி", weight: 20 },
  { key: "occupation", en: "Occupation", ta: "வேலை / தொழில்", weight: 20 },
];

export function buildMatchBreakdown(profile, candidate) {
  const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const age = Number(candidate?.age);
  const min = Number(profile?.pref_age_min);
  const max = Number(profile?.pref_age_max);
  const ageMatch =
    Number.isFinite(age) &&
    ((!Number.isFinite(min) || age >= min) && (!Number.isFinite(max) || age <= max));

  const rows = [
    { key: "age", matched: ageMatch },
    { key: "city", matched: !!norm(profile?.city) && norm(profile?.city) === norm(candidate?.city) },
    { key: "education", matched: !!norm(profile?.education) && norm(profile?.education) === norm(candidate?.education) },
    { key: "occupation", matched: !!norm(profile?.occupation) && norm(profile?.occupation) === norm(candidate?.occupation) },
  ];
  const score = rows.reduce((sum, r) => sum + (r.matched ? MATCH_FACTORS.find(f => f.key === r.key).weight : 0), 0);
  return { score, breakdown: rows };
}
