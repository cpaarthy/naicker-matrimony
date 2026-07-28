import { useTheme } from "../context/ThemeContext";

export function Avatar({ name, gender, photoUrl, size = 56 }) {
  const { colors } = useTheme();
  const initials = (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const bg = gender === "Female" ? "#7a1f3d" : "#1f4d3d";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
          border: `1px solid ${colors.cardBorder}`,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: "#f6ead9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
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
      background: t.bg, color: t.color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 999, letterSpacing: 0.4, textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

export function TextField({ label, value, onChange, type = "text", placeholder, required }) {
  const { colors } = useTheme();
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>
        {label}{required && <span style={{ color: colors.rejectedText }}> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
          fontSize: 15, background: colors.inputBg, color: colors.text, boxSizing: "border-box",
          outline: "none",
        }}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  const { colors } = useTheme();
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
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
      style={{
        width: "100%", background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 10,
        padding: "13px", fontWeight: 700, fontSize: 15, opacity: disabled ? 0.6 : 1, ...style,
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
      position: "sticky", top: 8, zIndex: 30, margin: "10px 16px 0", background: "#2b2419", color: "#fff",
      padding: "10px 14px", borderRadius: 8, fontSize: 13.5, textAlign: "center",
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
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>
        {label}{required && <span style={{ color: colors.rejectedText }}> *</span>}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
          fontSize: 15, background: colors.inputBg, color: colors.text, boxSizing: "border-box",
        }}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
