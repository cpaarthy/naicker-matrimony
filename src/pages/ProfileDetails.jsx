function MatchScoreCard({ myProfile, otherProfile, colors }) {
  
  const [expanded, setExpanded] = useState(true);

  const result = calculateMatchScore(myProfile, otherProfile);
  

  if (!result) return null;

  // Support both possible result formats
  const percentage = Number(
    result?.percentage ?? result?.score ?? 0
  );

  const breakdown = Array.isArray(result?.breakdown)
    ? result.breakdown
    : [];

  const scoreColor =
    percentage >= 90
      ? colors.approvedText
      : percentage >= 50
      ? colors.pendingText
      : colors.rejectedText;

  // ONLY these 4 factors are allowed
  const FACTORS = [
    {
      key: "age",
      names: ["age", "வயது"],
      label: "Age / வயது",
      weight: 35,
    },
    {
      key: "city",
      names: ["city", "நகரம்"],
      label: "City / நகரம்",
      weight: 25,
    },
    {
      key: "education",
      names: ["education", "கல்வி"],
      label: "Education / கல்வி",
      weight: 20,
    },
    {
      key: "occupation",
      names: ["occupation", "வேலை", "வேலை / தொழில்"],
      label: "Occupation / வேலை",
      weight: 20,
    },
  ];

  const getFactor = (factor) => {
    return breakdown.find((item) => {
      const key = String(
        item?.key ??
        item?.factor ??
        item?.name ??
        item?.label ??
        ""
      )
        .trim()
        .toLowerCase();

      return (
        key === factor.key ||
        factor.names.some(
          (name) => key === name.toLowerCase()
        )
      );
    });
  };

  const rows = FACTORS.map((factor) => {
    const item = getFactor(factor);

    const matched =
      item?.matched === true ||
      item?.match === true ||
      item?.isMatch === true;

    return {
      ...factor,
      matched,
      earned: matched ? factor.weight : 0,
    };
  });

  // Calculate from ONLY the four factors.
  const calculatedTotal = rows.reduce(
    (sum, row) => sum + row.earned,
    0
  );

  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
      }}
    >
      {/* HEADER */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* SCORE CIRCLE */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `3px solid ${scoreColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12.5,
              fontWeight: 800,
              color: scoreColor,
              flexShrink: 0,
            }}
          >
            {calculatedTotal}%
          </div>

          <div style={{ textAlign: "left" }}>
            <div
              className="serif"
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: colors.text,
              }}
            >
              Match Score / பொருத்த மதிப்பெண்
            </div>

            <div
              style={{
                fontSize: 11,
                color: colors.textFaint,
                marginTop: 2,
              }}
            >
              Based on your profile & preferences
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            color: colors.primary,
            fontWeight: 700,
          }}
        >
          {expanded ? "Hide" : "Details"}
        </span>
      </button>

      {/* BREAKDOWN */}
      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `1px solid ${colors.cardBorder}`,
          }}
        >
          {rows.map((row) => (
            <div
              key={row.key}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr auto auto",
                alignItems: "center",
                columnGap: 10,
                padding: "7px 0",
                fontSize: 12.5,
              }}
            >
              {/* FACTOR NAME */}
              <span
                style={{
                  color: colors.textMuted,
                }}
              >
                {row.label}
              </span>

              {/* TICK / CROSS */}
              <span
                style={{
                  width: 24,
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: 15,
                  color: row.matched
                    ? colors.approvedText
                    : colors.rejectedText,
                }}
              >
                {row.matched ? "✓" : "✗"}
              </span>

              {/* ACTUAL PERCENTAGE */}
              <span
                style={{
                  minWidth: 42,
                  textAlign: "right",
                  fontWeight: 800,
                  color: row.matched
                    ? colors.text
                    : colors.textFaint,
                }}
              >
                {row.earned}%
              </span>
            </div>
          ))}

          {/* TOTAL */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 7,
              paddingTop: 10,
              borderTop: `1px solid ${colors.cardBorder}`,
              fontSize: 13,
              fontWeight: 800,
              color: colors.text,
            }}
          >
            <span>
              Total / மொத்தம்
            </span>

            <span
              style={{
                color: scoreColor,
                fontSize: 15,
              }}
            >
              {calculatedTotal}%
            </span>
          </div>

          {/* WEIGHTS */}
          <div
            style={{
              marginTop: 8,
              fontSize: 10.5,
              color: colors.textFaint,
              textAlign: "center",
            }}
          >
            Age 35% · City 25% · Education 20% ·
            Occupation 20%
          </div>
        </div>
      )}
    </div>
  );
}
