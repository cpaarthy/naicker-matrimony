// Minimal, dependency-free SVG chart components for the Admin Overview tab.

export function LineChart({ data, colors, height = 140, lineColor }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const stepX = data.length > 1 ? 100 / (data.length - 1) : 0;
  const chartHeight = height - 20;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * stepX : 50;
    const y = chartHeight - (d.value / max) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block", overflow: "visible" }}>
      <path d={areaD} fill={lineColor || colors.primary} opacity="0.12" stroke="none" />
      <path d={pathD} fill="none" stroke={lineColor || colors.primary} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="1.6" fill={lineColor || colors.primary} />
          <text x={p.x} y={height - 6} fontSize="4" textAnchor="middle" fill={colors.textFaint}>{p.label}</text>
          <text x={p.x} y={Math.max(p.y - 3, 5)} fontSize="4.5" textAnchor="middle" fill={colors.text} fontWeight="700">{p.value}</text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({ data, colors, height = 140, barColor }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - 20);
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        const y = height - 20 - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={barHeight} rx="1" fill={barColor || colors.primary} />
            <text x={x + w / 2} y={height - 6} fontSize="4" textAnchor="middle" fill={colors.textFaint}>
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + w / 2} y={y - 2} fontSize="4.5" textAnchor="middle" fill={colors.text} fontWeight="700">
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({ segments, colors, size = 140 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div style={{ textAlign: "center", color: colors.textFaint, fontSize: 12, padding: 20 }}>No data yet</div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offsetAccum = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ flexShrink: 0 }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke={colors.cardBorder} strokeWidth="14" />
        {segments.map((s, i) => {
          const fraction = s.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const rotation = (offsetAccum / total) * 360 - 90;
          offsetAccum += s.value;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={radius} fill="none"
              stroke={s.color} strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotation} 50 50)`}
              strokeLinecap="butt"
            />
          );
        })}
        <text x="50" y="53" fontSize="14" textAnchor="middle" fill={colors.text} fontWeight="800">{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
            <span style={{ color: colors.textMuted }}>{s.label}</span>
            <span style={{ color: colors.text, fontWeight: 700 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
