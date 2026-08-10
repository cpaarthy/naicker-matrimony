// Match score uses ONLY four factors: Age, City, Education, Occupation.
// Total score: 100 points (Age 35, City 25, Education 20, Occupation 20).

function norm(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function ageMatches(myProfile, otherProfile) {
  const age = Number(otherProfile?.age);
  if (!Number.isFinite(age)) return false;

  const min = Number(myProfile?.pref_age_min);
  const max = Number(myProfile?.pref_age_max);

  // If the viewer has an age preference, the candidate must be inside it.
  if (Number.isFinite(min) || Number.isFinite(max)) {
    const lower = Number.isFinite(min) ? min : 0;
    const upper = Number.isFinite(max) ? max : 200;
    return age >= lower && age <= upper;
  }

  // Without a preference, compare ages reasonably closely.
  const mine = Number(myProfile?.age);
  return Number.isFinite(mine) && Math.abs(age - mine) <= 5;
}

function educationMatches(myProfile, otherProfile) {
  const aPref = norm(myProfile?.pref_education);
  const b = norm(otherProfile?.education);
  if (!b) return false;
  if (aPref) return b.includes(aPref) || aPref.includes(b);

  const a = norm(myProfile?.education);
  return !!a && (a === b || a.includes(b) || b.includes(a));
}

function occupationMatches(myProfile, otherProfile) {
  const aPref = norm(myProfile?.pref_occupation);
  const b = norm(otherProfile?.occupation);
  if (!b) return false;
  if (aPref) return b.includes(aPref) || aPref.includes(b);

  const a = norm(myProfile?.occupation);
  return !!a && (a === b || a.includes(b) || b.includes(a));
}

export function calculateMatchScore(myProfile, otherProfile) {
  if (!myProfile || !otherProfile) return null;

  const age = ageMatches(myProfile, otherProfile);
  const city = !!norm(myProfile.city) && norm(myProfile.city) === norm(otherProfile.city);
  const education = educationMatches(myProfile, otherProfile);
  const occupation = occupationMatches(myProfile, otherProfile);

  const breakdown = [
    { label: "Age", matched: age },
    { label: "City", matched: city },
    { label: "Education", matched: education },
    { label: "Occupation", matched: occupation },
  ];

  const percentage =
    (age ? 35 : 0) +
    (city ? 25 : 0) +
    (education ? 20 : 0) +
    (occupation ? 20 : 0);

  return { percentage, breakdown };
}
