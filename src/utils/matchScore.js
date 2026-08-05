// Calculates a rule-based "match score" between the logged-in user's profile and
// the profile being viewed, using existing fields (age, caste, sub-caste, city,
// education, occupation, mother tongue, diet) plus the viewer's stated partner
// preferences. Each criterion contributes a weighted amount to the total score
// out of 100. Weights are kept in smaller, finer-grained units (max 15 each) so
// that a genuinely near-perfect match can realistically land in the 90%+ band —
// with only a couple of large (20-point) criteria, 90%+ was only reachable via
// a near-impossible single scenario (missing exactly District while everything
// else matched), which meant "High Compatibility" almost never triggered.

export function calculateMatchScore(myProfile, otherProfile) {
  if (!myProfile || !otherProfile) return null;

  const results = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  // Age — matches if within the viewer's stated preferred range, or if no
  // preference was set, matches loosely (within 5 years is treated as a match).
  {
    const weight = 15;
    totalWeight += weight;
    const hasPref = myProfile.pref_age_min || myProfile.pref_age_max;
    let matched;
    if (hasPref) {
      const min = myProfile.pref_age_min || 0;
      const max = myProfile.pref_age_max || 200;
      matched = otherProfile.age >= min && otherProfile.age <= max;
    } else {
      matched = Math.abs((otherProfile.age || 0) - (myProfile.age || 0)) <= 5;
    }
    if (matched) earnedWeight += weight;
    results.push({ label: "Age", matched: !!matched });
  }

  // Sub caste — exact match
  {
    const weight = 15;
    totalWeight += weight;
    const matched = myProfile.sub_caste && otherProfile.sub_caste
      && myProfile.sub_caste.trim().toLowerCase() === otherProfile.sub_caste.trim().toLowerCase();
    if (matched) earnedWeight += weight;
    results.push({ label: "Sub caste", matched: !!matched });
  }

  // City — exact match
  {
    const weight = 10;
    totalWeight += weight;
    const matched = myProfile.city && otherProfile.city
      && myProfile.city.trim().toLowerCase() === otherProfile.city.trim().toLowerCase();
    if (matched) earnedWeight += weight;
    results.push({ label: "City", matched: !!matched });
  }

  // District — exact match
  {
    const weight = 10;
    totalWeight += weight;
    const matched = myProfile.district && otherProfile.district
      && myProfile.district.trim().toLowerCase() === otherProfile.district.trim().toLowerCase();
    if (matched) earnedWeight += weight;
    results.push({ label: "District", matched: !!matched });
  }

  // Education — matches the viewer's stated preference (substring match), or if
  // no preference was set, any filled-in education on both sides counts as a match.
  {
    const weight = 15;
    totalWeight += weight;
    let matched;
    if (myProfile.pref_education && myProfile.pref_education.trim()) {
      matched = otherProfile.education
        && otherProfile.education.toLowerCase().includes(myProfile.pref_education.trim().toLowerCase());
    } else {
      matched = !!(myProfile.education && otherProfile.education);
    }
    if (matched) earnedWeight += weight;
    results.push({ label: "Education", matched: !!matched });
  }

  // Occupation — matches the viewer's stated preference (substring match), or if
  // no preference was set, any filled-in occupation on both sides counts as a match.
  {
    const weight = 15;
    totalWeight += weight;
    let matched;
    if (myProfile.pref_occupation && myProfile.pref_occupation.trim()) {
      matched = otherProfile.occupation
        && otherProfile.occupation.toLowerCase().includes(myProfile.pref_occupation.trim().toLowerCase());
    } else {
      matched = !!(myProfile.occupation && otherProfile.occupation);
    }
    if (matched) earnedWeight += weight;
    results.push({ label: "Occupation", matched: !!matched });
  }

  // Mother tongue — exact match
  {
    const weight = 10;
    totalWeight += weight;
    const matched = myProfile.mother_tongue && otherProfile.mother_tongue
      && myProfile.mother_tongue.trim().toLowerCase() === otherProfile.mother_tongue.trim().toLowerCase();
    if (matched) earnedWeight += weight;
    results.push({ label: "Mother tongue", matched: !!matched });
  }

  // Diet — exact match (Vegetarian / Non-Vegetarian / Eggetarian)
  {
    const weight = 10;
    totalWeight += weight;
    const matched = myProfile.diet && otherProfile.diet
      && myProfile.diet.trim().toLowerCase() === otherProfile.diet.trim().toLowerCase();
    if (matched) earnedWeight += weight;
    results.push({ label: "Diet", matched: !!matched });
  }

  const percentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return { percentage, breakdown: results };
}
