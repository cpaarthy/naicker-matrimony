import React from "react";

const labels = {
  age: { en: "Age", ta: "வயது", weight: 35 },
  city: { en: "City", ta: "நகரம்", weight: 25 },
  education: { en: "Education", ta: "கல்வி", weight: 20 },
  occupation: { en: "Occupation", ta: "வேலை / தொழில்", weight: 20 },
};

export default function MatchDetails({ score = 0, breakdown = [], tamil = true }) {
  const rows = ["age", "city", "education", "occupation"].map((key) => {
    const item = breakdown.find(
      (x) => String(x.key || x.factor || x.label || "").toLowerCase() === key
    );
    const matched = Boolean(item?.matched ?? item?.match);
    return { key, matched, points: matched ? labels[key].weight : 0 };
  });

  return (
    <div className="rounded-xl border p-4 bg-white/80">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold">
            {tamil ? "பொருத்த மதிப்பெண்" : "Match Score"}
          </div>
          <div className="text-sm opacity-70">
            {tamil ? "பொருத்தம் ஏன் வந்தது?" : "Why this match?"}
          </div>
        </div>
        <div className="text-2xl font-bold">{Math.round(Number(score) || 0)}%</div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const l = labels[row.key];
          return (
            <div key={row.key} className="flex items-center justify-between text-sm">
              <span>
                {tamil ? `${l.ta} (${l.en})` : l.en}
              </span>
              <span className={row.matched ? "font-semibold" : "opacity-60"}>
                {row.matched ? "✓" : "✗"} {row.points}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t text-xs opacity-70">
        {tamil
          ? "வயது 35% • நகரம் 25% • கல்வி 20% • வேலை / தொழில் 20%"
          : "Age 35% • City 25% • Education 20% • Occupation 20%"}
      </div>
    </div>
  );
}
