import { Heart, Users, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Home({ onNavigate }) {
  const { colors } = useTheme();
  const { session } = useAuth();

  return (
    <div>
      <div style={{
        background: `linear-gradient(160deg, ${colors.primary}, #2a0d16)`, borderRadius: 16, padding: "28px 20px",
        color: colors.headerText, marginBottom: 18, textAlign: "center",
      }}>
        <Heart size={30} color={colors.accent} fill={colors.accent} style={{ marginBottom: 10 }} />
        <div className="serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Find your life partner</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
          A trusted matrimony platform for the Naicker community — every profile reviewed and approved by admin before it goes live.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => onNavigate(session ? "dashboard" : "register")} style={{
          flex: 1, background: colors.accent, color: colors.accentText, border: "none", borderRadius: 10,
          padding: "13px 10px", fontWeight: 700, fontSize: 14,
        }}>
          {session ? "Go to Dashboard" : "Register free"}
        </button>
        <button onClick={() => onNavigate("browse")} style={{
          flex: 1, background: "transparent", color: colors.primary, border: `1.5px solid ${colors.primary}`,
          borderRadius: 10, padding: "13px 10px", fontWeight: 700, fontSize: 14,
        }}>
          Browse profiles
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: ShieldCheck, title: "Admin verified", desc: "Every profile is reviewed before it appears publicly" },
          { icon: Users, title: "Privacy first", desc: "Phone numbers are only visible to admin — never shared with members" },
        ].map((f, i) => (
          <div key={i} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14,
          }}>
            <f.icon size={20} color={colors.primary} style={{ marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
            <div style={{ fontSize: 11.5, color: colors.textFaint, lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16,
        textAlign: "center",
      }}>
        <div className="serif" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>How it works</div>
        <div style={{ fontSize: 12.5, color: colors.textFaint, lineHeight: 1.7 }}>
          1. Register with email or phone<br />
          2. Complete your profile<br />
          3. Admin reviews and approves<br />
          4. Send and receive interest requests<br />
          5. Address shared only after mutual acceptance — phone stays private always
        </div>
      </div>
    </div>
  );
}
