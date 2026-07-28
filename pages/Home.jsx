import { Heart, Users, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Home({ onNavigate }) {
  const { colors } = useTheme();
  const { session } = useAuth();

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${colors.accent}, #b8853a)`, borderRadius: 12, padding: "10px 16px",
        marginBottom: 14, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>🎉</span>
        <span style={{ fontWeight: 800, fontSize: 13, color: colors.accentText, fontFamily: "'Playfair Display', Georgia, serif" }}>
          Celebrating 1 Year of Matchmaking! / 1 வருட மேட்ச்மேக்கிங்!
        </span>
        <span style={{ fontSize: 16 }}>🎉</span>
      </div>

      <div style={{
        background: `linear-gradient(160deg, ${colors.primary}, #2a0d16)`, borderRadius: 16, padding: "28px 20px",
        color: colors.headerText, marginBottom: 18, textAlign: "center",
      }}>
        <Heart size={30} color={colors.accent} fill={colors.accent} style={{ marginBottom: 10 }} />
        <div className="serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          Find your life partner / உங்கள் வாழ்க்கைத் துணையைக் கண்டறியுங்கள்
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
          A trusted matrimony platform for the Naicker community — every profile reviewed and approved by admin before it goes live.
          <br /><br />
          நாயக்கர் சமூகத்திற்கான நம்பகமான திருமண தளம் — ஒவ்வொரு விவரமும் நிர்வாகியால் சரிபார்க்கப்பட்ட பின்னரே வெளியிடப்படும்.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => onNavigate(session ? "dashboard" : "register")} style={{
          flex: 1, background: colors.accent, color: colors.accentText, border: "none", borderRadius: 10,
          padding: "13px 10px", fontWeight: 700, fontSize: 14,
        }}>
          {session ? "Go to Dashboard / டாஷ்போர்டு" : "Register free / இலவசமாக பதிவு செய்யுங்கள்"}
        </button>
        <button onClick={() => onNavigate("browse")} style={{
          flex: 1, background: "transparent", color: colors.primary, border: `1.5px solid ${colors.primary}`,
          borderRadius: 10, padding: "13px 10px", fontWeight: 700, fontSize: 14,
        }}>
          Browse profiles / விவரங்களை பார்க்க
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: ShieldCheck, title: "Admin verified / நிர்வாகி சரிபார்த்தது", desc: "Every profile is reviewed before it appears publicly / வெளியிடும் முன் ஒவ்வொரு விவரமும் சரிபார்க்கப்படும்" },
          { icon: Users, title: "Privacy first / தனியுரிமை முதலில்", desc: "Phone numbers are only visible to admin — never shared with members / தொலைபேசி எண் நிர்வாகிக்கு மட்டுமே தெரியும்" },
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
        <div className="serif" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>How it works / எப்படி செயல்படும்</div>
        <div style={{ fontSize: 12.5, color: colors.textFaint, lineHeight: 1.7 }}>
          1. Register with email or phone / மின்னஞ்சல் அல்லது தொலைபேசி மூலம் பதிவு செய்யவும்<br />
          2. Complete your profile / உங்கள் விவரத்தை பூர்த்தி செய்யவும்<br />
          3. Admin reviews and approves / நிர்வாகி சரிபார்த்து அனுமதிக்கிறார்<br />
          4. Send and receive interest requests / ஆர்வ கோரிக்கைகளை அனுப்பவும், பெறவும்<br />
          5. Address shared only after mutual acceptance — phone stays private always / இருதரப்பும் ஒப்புக்கொண்ட பின்னரே முகவரி பகிரப்படும்
        </div>
      </div>
    </div>
  );
}
