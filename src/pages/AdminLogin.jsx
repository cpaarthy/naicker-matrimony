import React, { useState } from "react";
import { ShieldCheck, LockKeyhole, Mail, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabaseClient";

export default function AdminLogin({ onNavigate, showToast, onAuthenticated }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Enter admin email and password.");
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("is_valid_admin_credentials", {
      p_email: normalizedEmail,
      p_password: password,
    });
    setLoading(false);
    if (rpcError || data !== true) {
      setError("Invalid admin email or password.");
      return;
    }
    onAuthenticated({ email: normalizedEmail, pin: password });
    showToast("Admin login successful");
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", padding: "18px 4px" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{
          width: 64, height: 64, margin: "0 auto 13px", borderRadius: 19, background: colors.headerGradient,
          color: colors.primaryText, display: "grid", placeItems: "center", boxShadow: colors.shadowLg,
          border: "1px solid rgba(216,169,80,0.35)",
        }}>
          <ShieldCheck size={30} color="#d8a950" />
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.6, color: colors.accent, textTransform: "uppercase" }}>Naicker Matrimony</div>
        <h2 className="serif" style={{ fontSize: 24, margin: "6px 0 4px", letterSpacing: -0.3 }}>Admin Portal</h2>
        <p style={{ margin: 0, color: colors.textMuted, fontSize: 12.5 }}>Secure administrator access / நிர்வாகி பாதுகாப்பான உள்நுழைவு</p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 18, padding: 20, boxShadow: colors.shadow }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.textMuted, marginBottom: 6, letterSpacing: 0.2 }}>Admin email / நிர்வாகி மின்னஞ்சல்</label>
        <div style={{ position: "relative", marginBottom: 15 }}>
          <Mail size={16} style={{ position: "absolute", left: 12, top: 13.5, color: colors.textFaint }} />
          <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@naickermatrimony.com" className="nkm-input" style={{ width: "100%", boxSizing: "border-box", padding: "11.5px 13px 11.5px 37px", borderRadius: 9, border: `1.5px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, fontSize: 14 }} />
        </div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.textMuted, marginBottom: 6, letterSpacing: 0.2 }}>Admin password / கடவுச்சொல்</label>
        <div style={{ position: "relative", marginBottom: 15 }}>
          <LockKeyhole size={16} style={{ position: "absolute", left: 12, top: 13.5, color: colors.textFaint }} />
          <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" className="nkm-input" style={{ width: "100%", boxSizing: "border-box", padding: "11.5px 42px 11.5px 37px", borderRadius: 9, border: `1.5px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, fontSize: 14 }} />
          <button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Show password" style={{ position: "absolute", right: 8, top: 7, width: 30, height: 30, border: 0, background: "transparent", color: colors.textFaint }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>

        {error && <div style={{ background: colors.rejectedBg, color: colors.rejectedText, borderRadius: 9, padding: "10px 12px", fontSize: 12.5, marginBottom: 14, fontWeight: 500 }}>{error}</div>}

        <button type="submit" disabled={loading} className="nkm-btn-primary" style={{ width: "100%", border: 0, borderRadius: 11, padding: 13, background: colors.primary, color: colors.primaryText, fontWeight: 800, fontSize: 14, cursor: loading ? "wait" : "pointer", opacity: loading ? .7 : 1, boxShadow: "0 4px 14px rgba(74,21,36,0.22)" }}>
          {loading ? "Checking…" : "Sign in to Admin Portal"}
        </button>
        <button type="button" onClick={() => onNavigate("home")} style={{ width: "100%", marginTop: 10, border: `1.5px solid ${colors.cardBorder}`, borderRadius: 11, padding: 10, background: "transparent", color: colors.textMuted, fontWeight: 700, fontSize: 12.5 }}>← Back to member site</button>
      </form>

      <div style={{ marginTop: 15, background: colors.pendingBg, color: colors.pendingText, borderRadius: 12, padding: 12, fontSize: 11.5, lineHeight: 1.55 }}>
        <b>Admin only:</b> This portal is separate from member login. Do not share administrator credentials.
      </div>
    </div>
  );
}
