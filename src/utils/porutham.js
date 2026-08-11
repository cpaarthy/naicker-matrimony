// Thirumana Porutham (திருமண பொருத்தம்) — traditional 10-point Tamil horoscope
// matching system, calculated from birth Star (Nakshatra) and Rasi only, matching
// the fields already collected on user profiles.
//
// This is a well-established rule-based system (not a personalized astrological
// reading) — it mirrors the standard reference tables used by Tamil astrologers
// and matching calculators. Each of the 10 poruthams is scored, and results are
// combined into an overall verdict. Rajju and Dina are flagged as the two most
// important factors, consistent with traditional practice.

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krithikai", "Rohini", "Mrigashirsham", "Thiruvathirai",
  "Punarpoosam", "Poosam", "Ayilyam", "Magam", "Pooram", "Uthiram",
  "Hastham", "Chithirai", "Swathi", "Visakam", "Anusham", "Kettai",
  "Moolam", "Pooradam", "Uthiradam", "Thiruvonam", "Avittam", "Sadayam",
  "Poorattathi", "Uthirattathi", "Revathi",
];

const RASIS = [
  "Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam", "Kanni",
  "Thulam", "Vrichigam", "Dhanusu", "Magaram", "Kumbam", "Meenam",
];

function normalize(name) {
  return (name || "").trim().toLowerCase().replace(/[^a-z]/g, "");
}

const NAK_ALIASES = {
  ashwini: "Ashwini", aswini: "Ashwini",
  bharani: "Bharani",
  krithikai: "Krithikai", krittika: "Krithikai", karthigai: "Krithikai", karthikai: "Krithikai",
  rohini: "Rohini",
  mrigashirsham: "Mrigashirsham", mrigasirisham: "Mrigashirsham", mirugasirisham: "Mrigashirsham", mrigashira: "Mrigashirsham",
  thiruvathirai: "Thiruvathirai", ardra: "Thiruvathirai", thiruvadhirai: "Thiruvathirai",
  punarpoosam: "Punarpoosam", punarvasu: "Punarpoosam",
  poosam: "Poosam", pushya: "Poosam", pushyami: "Poosam",
  ayilyam: "Ayilyam", ashlesha: "Ayilyam",
  magam: "Magam", makam: "Magam", magha: "Magam",
  pooram: "Pooram", purvaphalguni: "Pooram", poorvaphalguni: "Pooram",
  uthiram: "Uthiram", uttaraphalguni: "Uthiram", utharaphalguni: "Uthiram",
  hastham: "Hastham", hasta: "Hastham",
  chithirai: "Chithirai", chitra: "Chithirai", chittirai: "Chithirai",
  swathi: "Swathi", swati: "Swathi",
  visakam: "Visakam", vishakha: "Visakam", visaakam: "Visakam",
  anusham: "Anusham", anuradha: "Anusham",
  kettai: "Kettai", jyeshta: "Kettai", jyeshtha: "Kettai",
  moolam: "Moolam", mula: "Moolam",
  pooradam: "Pooradam", purvashada: "Pooradam", poorvashada: "Pooradam",
  uthiradam: "Uthiradam", uttarashada: "Uthiradam", utharashada: "Uthiradam",
  thiruvonam: "Thiruvonam", shravana: "Thiruvonam", thiruvonnam: "Thiruvonam",
  avittam: "Avittam", dhanishta: "Avittam", dhanishtha: "Avittam",
  sadayam: "Sadayam", shatabhisha: "Sadayam", sathayam: "Sadayam",
  poorattathi: "Poorattathi", purvabhadrapada: "Poorattathi", poorvabhadrapada: "Poorattathi",
  uthirattathi: "Uthirattathi", uttarabhadrapada: "Uthirattathi", utharabhadrapada: "Uthirattathi",
  revathi: "Revathi",
};

const RASI_ALIASES = {
  mesham: "Mesham", mesha: "Mesham", aries: "Mesham",
  rishabam: "Rishabam", rishaba: "Rishabam", vrishabam: "Rishabam", taurus: "Rishabam",
  mithunam: "Mithunam", gemini: "Mithunam",
  kadagam: "Kadagam", kataka: "Kadagam", cancer: "Kadagam",
  simmam: "Simmam", simha: "Simmam", leo: "Simmam",
  kanni: "Kanni", kanya: "Kanni", virgo: "Kanni",
  thulam: "Thulam", thula: "Thulam", libra: "Thulam",
  vrichigam: "Vrichigam", vrischika: "Vrichigam", scorpio: "Vrichigam",
  dhanusu: "Dhanusu", dhanus: "Dhanusu", sagittarius: "Dhanusu",
  magaram: "Magaram", makara: "Magaram", capricorn: "Magaram",
  kumbam: "Kumbam", kumbha: "Kumbam", aquarius: "Kumbam",
  meenam: "Meenam", meena: "Meenam", pisces: "Meenam",
};

function matchNakshatra(input) {
  const key = normalize(input);
  if (!key) return null;
  if (NAK_ALIASES[key]) return NAK_ALIASES[key];
  const found = NAKSHATRAS.find(n => normalize(n) === key || normalize(n).includes(key) || key.includes(normalize(n)));
  return found || null;
}

function matchRasi(input) {
  const key = normalize(input);
  if (!key) return null;
  if (RASI_ALIASES[key]) return RASI_ALIASES[key];
  const found = RASIS.find(r => normalize(r) === key || normalize(r).includes(key) || key.includes(normalize(r)));
  return found || null;
}

const GANA = {
  Ashwini: "Deva", Mrigashirsham: "Deva", Punarpoosam: "Deva", Poosam: "Deva",
  Hastham: "Deva", Swathi: "Deva", Anusham: "Deva", Sadayam: "Deva", Revathi: "Deva",
  Bharani: "Manushya", Rohini: "Manushya", Pooram: "Manushya", Uthiram: "Manushya",
  Pooradam: "Manushya", Uthiradam: "Manushya", Poorattathi: "Manushya", Uthirattathi: "Manushya",
  Thiruvonam: "Manushya",
  Krithikai: "Rakshasa", Ayilyam: "Rakshasa", Magam: "Rakshasa", Chithirai: "Rakshasa",
  Visakam: "Rakshasa", Kettai: "Rakshasa", Moolam: "Rakshasa", Avittam: "Rakshasa",
  Thiruvathirai: "Rakshasa",
};

const YONI = {
  Ashwini: "Horse", Sadayam: "Horse",
  Bharani: "Elephant", Revathi: "Elephant",
  Krithikai: "Goat(F)", Pooradam: "Goat(F)",
  Rohini: "Serpent", Mrigashirsham: "Serpent",
  Thiruvathirai: "Dog", Anusham: "Dog",
  Punarpoosam: "Cat", Poosam: "Sheep",
  Ayilyam: "Cat", Magam: "Rat",
  Pooram: "Rat", Uthiram: "Cow",
  Hastham: "Buffalo", Chithirai: "Tiger",
  Swathi: "Buffalo", Visakam: "Tiger",
  Kettai: "Deer", Moolam: "Dog",
  Uthiradam: "Mongoose", Thiruvonam: "Monkey",
  Avittam: "Lion", Poorattathi: "Lion",
  Uthirattathi: "Cow",
};

const YONI_ENEMIES = [
  ["Cat", "Rat"], ["Serpent", "Mongoose"], ["Dog", "Deer"], ["Cow", "Tiger"],
  ["Monkey", "Sheep"], ["Lion", "Elephant"], ["Horse", "Buffalo"],
];

const RAJJU = {
  Ashwini: "Paatha", Bharani: "Paatha", Revathi: "Paatha", Ayilyam: "Paatha",
  Krithikai: "Kadi", Rohini: "Kadi", Uthirattathi: "Kadi", Poorattathi: "Kadi",
  Mrigashirsham: "Nethra", Thiruvathirai: "Nethra", Sadayam: "Nethra", Avittam: "Nethra",
  Punarpoosam: "Kanda", Poosam: "Kanda", Uthiradam: "Kanda", Thiruvonam: "Kanda",
  Magam: "Nabhi", Pooram: "Nabhi", Uthiram: "Nabhi", Moolam: "Nabhi", Pooradam: "Nabhi",
  Hastham: "Kati", Chithirai: "Kati", Anusham: "Kati", Kettai: "Kati",
  Swathi: "Siro", Visakam: "Siro",
};

const VASIYA_GROUP = {
  Mesham: "Chatushpadha", Rishabam: "Chatushpadha", Simmam: "Chatushpadha",
  Mithunam: "Manava", Kanni: "Manava", Thulam: "Manava", Kumbam: "Manava",
  Kadagam: "Jalachara", Meenam: "Jalachara",
  Dhanusu: "Vanachara", Magaram: "Vanachara",
  Vrichigam: "Keeta",
};

const VASIYA_FRIENDS = {
  Chatushpadha: ["Chatushpadha", "Vanachara"],
  Manava: ["Manava"],
  Jalachara: ["Jalachara"],
  Vanachara: ["Chatushpadha"],
  Keeta: [],
};

const RASI_LORD = {
  Mesham: "Mars", Vrichigam: "Mars",
  Rishabam: "Venus", Thulam: "Venus",
  Mithunam: "Mercury", Kanni: "Mercury",
  Kadagam: "Moon",
  Simmam: "Sun",
  Dhanusu: "Jupiter", Meenam: "Jupiter",
  Magaram: "Saturn", Kumbam: "Saturn",
};

const LORD_FRIENDS = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Venus", "Mercury"],
};

function nakIndex(name) {
  return NAKSHATRAS.indexOf(name) + 1;
}

function countFromTo(fromIdx, toIdx) {
  let diff = toIdx - fromIdx;
  if (diff < 0) diff += 27;
  return diff + 1;
}

const VEDHA_PAIRS = [
  ["Ashwini", "Kettai"], ["Bharani", "Anusham"], ["Krithikai", "Visakam"],
  ["Rohini", "Swathi"], ["Mrigashirsham", "Chithirai"], ["Thiruvathirai", "Thiruvonam"],
  ["Punarpoosam", "Pooradam"], ["Poosam", "Uthiradam"], ["Ayilyam", "Moolam"],
  ["Magam", "Revathi"], ["Pooram", "Uthirattathi"], ["Uthiram", "Poorattathi"],
  ["Hastham", "Sadayam"],
];

function isVedha(a, b) {
  return VEDHA_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function dinaPorutham(boyIdx, girlIdx) {
  const count = countFromTo(girlIdx, boyIdx);
  const goodCounts = [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26];
  const badCounts = [7, 22];
  const matched = goodCounts.includes(count) && !badCounts.includes(count);
  return { label: "Dina Porutham / தின பொருத்தம்", matched, note: "Health & prosperity / ஆரோக்கியம் & செழிப்பு" };
}

function ganaPorutham(boyNak, girlNak) {
  const bg = GANA[boyNak];
  const gg = GANA[girlNak];
  let matched;
  if (bg === gg) matched = true;
  else if ((bg === "Deva" && gg === "Manushya") || (bg === "Manushya" && gg === "Deva")) matched = true;
  else matched = false;
  return { label: "Gana Porutham / கண பொருத்தம்", matched, note: "Temperament compatibility / மனநிலை பொருத்தம்" };
}

function mahendraPorutham(boyIdx, girlIdx) {
  const count = countFromTo(girlIdx, boyIdx);
  const goodCounts = [4, 7, 10, 13, 16, 19, 22, 25];
  const matched = goodCounts.includes(count);
  return { label: "Mahendra Porutham / மகேந்திர பொருத்தம்", matched, note: "Longevity & progeny / ஆயுள் & சந்ததி" };
}

function sthreeDheerghaPorutham(boyIdx, girlIdx) {
  const count = countFromTo(girlIdx, boyIdx);
  const matched = count >= 13;
  return { label: "Sthree Dheergha Porutham / ஸ்திரீ தீர்க்க பொருத்தம்", matched, note: "Bride's prosperity / மணமகள் செழிப்பு" };
}

function yoniPorutham(boyNak, girlNak) {
  const by = YONI[boyNak];
  const gy = YONI[girlNak];
  if (!by || !gy) return { label: "Yoni Porutham / யோனி பொருத்தம்", matched: false, note: "Sexual compatibility / பாலியல் பொருத்தம்" };
  if (by === gy) return { label: "Yoni Porutham / யோனி பொருத்தம்", matched: true, note: "Sexual compatibility / பாலியல் பொருத்தம்" };
  const enemies = YONI_ENEMIES.some(([a, b]) => (a === by && b === gy) || (a === gy && b === by));
  return { label: "Yoni Porutham / யோனி பொருத்தம்", matched: !enemies, note: "Sexual compatibility / பாலியல் பொருத்தம்" };
}

function rasiPorutham(boyRasi, girlRasi) {
  const bi = RASIS.indexOf(boyRasi);
  const gi = RASIS.indexOf(girlRasi);
  if (bi === -1 || gi === -1) return { label: "Rasi Porutham / ராசி பொருத்தம்", matched: false, note: "Emotional compatibility / உணர்வு பொருத்தம்" };
  const diff = Math.abs(bi - gi);
  const distance = Math.min(diff, 12 - diff);
  const matched = !(distance === 6 || distance === 1);
  return { label: "Rasi Porutham / ராசி பொருத்தம்", matched, note: "Emotional compatibility / உணர்வு பொருத்தம்" };
}

function rasiAdhipathiPorutham(boyRasi, girlRasi) {
  const bl = RASI_LORD[boyRasi];
  const gl = RASI_LORD[girlRasi];
  if (!bl || !gl) return { label: "Rasi Adhipathi Porutham / ராசி அதிபதி பொருத்தம்", matched: false, note: "Ruling planet friendship / ஆளும் கிரக நட்பு" };
  const matched = bl === gl || (LORD_FRIENDS[bl] && LORD_FRIENDS[bl].includes(gl));
  return { label: "Rasi Adhipathi Porutham / ராசி அதிபதி பொருத்தம்", matched, note: "Ruling planet friendship / ஆளும் கிரக நட்பு" };
}

function vasiyaPorutham(boyRasi, girlRasi) {
  const bv = VASIYA_GROUP[boyRasi];
  const gv = VASIYA_GROUP[girlRasi];
  if (!bv || !gv) return { label: "Vasiya Porutham / வசிய பொருத்தம்", matched: false, note: "Mutual influence / பரஸ்பர தாக்கம்" };
  const matched = bv === gv || (VASIYA_FRIENDS[bv] && VASIYA_FRIENDS[bv].includes(gv))
    || (VASIYA_FRIENDS[gv] && VASIYA_FRIENDS[gv].includes(bv));
  return { label: "Vasiya Porutham / வசிய பொருத்தம்", matched, note: "Mutual influence / பரஸ்பர தாக்கம்" };
}

function rajjuPorutham(boyNak, girlNak) {
  const br = RAJJU[boyNak];
  const gr = RAJJU[girlNak];
  if (!br || !gr) return { label: "Rajju Porutham / ராஜு பொருத்தம்", matched: false, note: "Longevity / ஆயுள்", critical: true };
  const matched = br !== gr;
  return { label: "Rajju Porutham / ராஜு பொருத்தம்", matched, note: "Longevity of marriage / திருமண ஆயுள்", critical: true };
}

function vedhaPorutham(boyNak, girlNak) {
  const matched = !isVedha(boyNak, girlNak);
  return { label: "Vedha Porutham / வேத பொருத்தம்", matched, note: "Mutual affection / பரஸ்பர பாசம்" };
}

export function calculatePorutham(profileA, profileB) {
  let boy = profileA, girl = profileB;
  if (profileA.gender === "Female" && profileB.gender === "Male") {
    boy = profileB; girl = profileA;
  }

  const boyNak = matchNakshatra(boy.star);
  const girlNak = matchNakshatra(girl.star);
  const boyRasi = matchRasi(boy.rasi);
  const girlRasi = matchRasi(girl.rasi);

  if (!boyNak || !girlNak || !boyRasi || !girlRasi) {
    return null;
  }

  const boyIdx = nakIndex(boyNak);
  const girlIdx = nakIndex(girlNak);

  const poruthams = [
    dinaPorutham(boyIdx, girlIdx),
    ganaPorutham(boyNak, girlNak),
    mahendraPorutham(boyIdx, girlIdx),
    sthreeDheerghaPorutham(boyIdx, girlIdx),
    yoniPorutham(boyNak, girlNak),
    rasiPorutham(boyRasi, girlRasi),
    rasiAdhipathiPorutham(boyRasi, girlRasi),
    vasiyaPorutham(boyRasi, girlRasi),
    rajjuPorutham(boyNak, girlNak),
    vedhaPorutham(boyNak, girlNak),
  ];

  const matchedCount = poruthams.filter(p => p.matched).length;
  const rajjuMatched = poruthams.find(p => p.label.startsWith("Rajju Porutham"))?.matched;
  const dinaMatched = poruthams.find(p => p.label.startsWith("Dina Porutham"))?.matched;

  let verdict;
  if (matchedCount >= 8) verdict = "Uthamam";
  else if (matchedCount >= 6) verdict = "Nalladhu";
  else if (matchedCount >= 4) verdict = "Madhyamam";
  else verdict = "Adhamam";

  return {
    boyStar: boyNak, girlStar: girlNak, boyRasi, girlRasi,
    poruthams,
    matchedCount,
    totalCount: 10,
    verdict,
    rajjuMatched: !!rajjuMatched,
    dinaMatched: !!dinaMatched,
    hasSeriousDosham: !rajjuMatched,
  };
}

export function isHoroscopeDataAvailable(profile) {
  return !!(matchNakshatra(profile?.star) && matchRasi(profile?.rasi));
}
