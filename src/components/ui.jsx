import { useTheme } from "../context/ThemeContext";
import React from "react";

export function SectionDivider() {
  const { colors } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "22px 0 16px" }} aria-hidden="true">
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${colors.cardBorderStrong})` }} />
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: colors.accent, transform: "rotate(45deg)" }} />
      <div style={{ width: 4, height: 4, background: colors.accent, transform: "rotate(45deg)" }} />
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: colors.accent, transform: "rotate(45deg)" }} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${colors.cardBorderStrong}, transparent)` }} />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, tamil, colors: colorsProp }) {
  const { colors: themeColors } = useTheme();
  const colors = colorsProp || themeColors;
  return (
    <div style={{ marginBottom: 12 }}>
      {eyebrow && (
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase",
          color: colors.accent, marginBottom: 4,
        }}>{eyebrow}</div>
      )}
      <div className="serif" style={{ fontWeight: 800, fontSize: 19, color: colors.text, letterSpacing: -0.2 }}>{title}</div>
      {tamil && <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 3 }}>{tamil}</div>}
    </div>
  );
}

export function Stepper({ steps, currentIndex }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
      {steps.map((label, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "0 0 auto" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11.5, fontWeight: 800,
                background: done ? colors.primary : active ? colors.card : colors.bgSubtle,
                color: done ? colors.primaryText : active ? colors.primary : colors.textFaint,
                border: active ? `2px solid ${colors.primary}` : `1.5px solid ${done ? colors.primary : colors.cardBorder}`,
                transition: "all 160ms ease",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: active ? 800 : 600, color: active ? colors.primary : colors.textFaint,
                whiteSpace: "nowrap", maxWidth: 62, textAlign: "center", lineHeight: 1.2,
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 4px 16px", borderRadius: 1,
                background: done ? colors.primary : colors.cardBorder, transition: "background 160ms ease",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function Avatar({ name, gender, photoUrl, size = 56 }) {
  const { colors } = useTheme();
  const initials = (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const bg = gender === "Female"
    ? "linear-gradient(150deg,#7a1f3d,#9c2a4f)"
    : "linear-gradient(150deg,#1f4d3d,#28654f)";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
          border: `2px solid ${colors.card}`, boxShadow: `0 0 0 1px ${colors.cardBorder}`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: "#f8ecd8",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
      border: `2px solid ${colors.card}`, boxShadow: `0 0 0 1px ${colors.cardBorder}`,
    }}>
      {initials}
    </div>
  );
}

export function Badge({ children, tone = "pending" }) {
  const { colors } = useTheme();
  const tones = {
    pending: { bg: colors.pendingBg, color: colors.pendingText },
    approved: { bg: colors.approvedBg, color: colors.approvedText },
    rejected: { bg: colors.rejectedBg, color: colors.rejectedText },
  };
  const t = tones[tone];
  return (
    <span style={{
      background: t.bg, color: t.color, fontSize: 10.5, fontWeight: 800,
      padding: "3.5px 10px", borderRadius: 999, letterSpacing: 0.5, textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

export function PlanBadge({ plan }) {
  if (!plan || plan === "free") return null;
  const label = plan === "gold" ? "Gold" : plan === "silver" ? "Silver" : plan;
  const bg = plan === "gold" ? "#fdf1d3" : "#eef1f4";
  const color = plan === "gold" ? "#8a6a10" : "#4a5a68";
  return (
    <span style={{
      background: bg, color, fontSize: 9.5, fontWeight: 800,
      padding: "2px 7px", borderRadius: 999, letterSpacing: 0.3, textTransform: "uppercase",
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      ★ {label}
    </span>
  );
}

export function TextField({ label, value, onChange, type = "text", placeholder, required }) {
  const { colors } = useTheme();
  return (
    <label style={{ display: "block", marginBottom: 15 }}>
      <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.2 }}>
        {label}{required && <span style={{ color: colors.rejectedText }}> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="nkm-input"
        style={{
          width: "100%", padding: "11.5px 13px", borderRadius: 9, border: `1.5px solid ${colors.inputBorder}`,
          fontSize: 15, background: colors.inputBg, color: colors.text, boxSizing: "border-box",
          outline: "none", transition: "border-color 120ms ease, box-shadow 120ms ease",
        }}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options, id }) {
  const { colors } = useTheme();
  return (
    <label style={{ display: "block", marginBottom: 15 }}>
      <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.2 }}>{label}</span>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="nkm-input"
        style={{
          width: "100%", padding: "11.5px 13px", borderRadius: 9, border: `1.5px solid ${colors.inputBorder}`,
          fontSize: 15, background: colors.inputBg, color: colors.text, boxSizing: "border-box",
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function PrimaryButton({ children, onClick, disabled, style = {} }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="nkm-btn-primary"
      style={{
        width: "100%", background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 11,
        padding: "13.5px", fontWeight: 700, fontSize: 15, opacity: disabled ? 0.55 : 1,
        boxShadow: disabled ? "none" : "0 4px 14px rgba(74,21,36,0.22)",
        transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: 0.2, ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "sticky", top: 8, zIndex: 30, margin: "10px 16px 0", background: "#241d16", color: "#f8ecd8",
      padding: "11px 15px", borderRadius: 10, fontSize: 13.5, textAlign: "center",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)", fontWeight: 500,
    }}>
      {message}
    </div>
  );
}

// Dropdown backed by an admin-managed master list. If the list is empty, falls back to free text.
export function MasterListSelect({ label, value, onChange, options, required, placeholder }) {
  const { colors } = useTheme();
  if (!options || options.length === 0) {
    return <TextField label={label} value={value} onChange={onChange} required={required} placeholder={placeholder} />;
  }
  return (
    <label style={{ display: "block", marginBottom: 15 }}>
      <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 6, fontWeight: 700, letterSpacing: 0.2 }}>
        {label}{required && <span style={{ color: colors.rejectedText }}> *</span>}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="nkm-input"
        style={{
          width: "100%", padding: "11.5px 13px", borderRadius: 9, border: `1.5px solid ${colors.inputBorder}`,
          fontSize: 15, background: colors.inputBg, color: colors.text, boxSizing: "border-box",
        }}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
