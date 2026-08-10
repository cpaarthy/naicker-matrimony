import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Admin verified",
    tamil: "நிர்வாகி சரிபார்ப்பு",
    desc: "Profiles are reviewed before they become visible in Browse.",
  },
  {
    icon: LockKeyhole,
    title: "Phone stays private",
    tamil: "தொலைபேசி எண் தனியுரிமை",
    desc: "Member phone numbers are never displayed to other members.",
  },
  {
    icon: BadgeCheck,
    title: "Genuine profiles",
    tamil: "உண்மையான விவரங்கள்",
    desc: "A verification-first approach helps keep the community trustworthy.",
  },
  {
    icon: HeartHandshake,
    title: "Family-friendly",
    tamil: "குடும்ப நட்பு",
    desc: "A respectful space for meaningful introductions and alliances.",
  },
];

const steps = [
  { icon: UserPlus, no: "01", title: "Create your profile", tamil: "உங்கள் விவரத்தை பதிவு செய்யுங்கள்", text: "Add your basic details, preferences and horoscope information." },
  { icon: ShieldCheck, no: "02", title: "Admin verification", tamil: "நிர்வாகி சரிபார்ப்பு", text: "Your profile is reviewed before it appears publicly." },
  { icon: Search, no: "03", title: "Find compatible matches", tamil: "பொருத்தமானவர்களை தேடுங்கள்", text: "Use age, education, occupation, location and match filters." },
  { icon: MessageCircleHeart, no: "04", title: "Connect respectfully", tamil: "மரியாதையுடன் தொடர்பு கொள்ளுங்கள்", text: "Send interests and continue only when both sides are comfortable." },
];

export default function Home({ onNavigate }) {
  const { colors } = useTheme();
  const { session } = useAuth();

  const primaryAction = session ? "dashboard" : "register";

  return (
    <div style={{ paddingBottom: 22 }}>
      {/* Hero */}
      <section style={{
        position: "relative",
        margin: "-2px -2px 18px",
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${colors.cardBorder}`,
        background: colors.card,
        boxShadow: "0 10px 30px rgba(61,18,32,0.10)",
      }}>
        <img
          src="/images/home-hero.webp"
          alt="Naicker Matrimony — நாயக்கர் மேட்ரிமோனி"
          style={{ width: "100%", display: "block", height: "auto" }}
        />
        <div style={{
          padding: 12,
          background: colors.card,
          borderTop: `1px solid ${colors.cardBorder}`,
          display: "flex",
          gap: 8,
        }}>
          <button
            onClick={() => onNavigate(primaryAction)}
            style={{
              flex: 1, border: 0, borderRadius: 11, padding: "12px 10px",
              background: colors.primary, color: colors.primaryText, fontWeight: 800,
              fontSize: 12.5, boxShadow: "0 5px 14px rgba(90,26,46,0.18)",
            }}
          >
            {session ? "My Dashboard / என் டாஷ்போர்டு" : "Register Free / இலவச பதிவு"}
          </button>
          <button
            onClick={() => onNavigate("browse")}
            style={{
              flex: 1, border: `1.5px solid ${colors.primary}`, borderRadius: 11, padding: "12px 10px",
              background: "transparent", color: colors.primary, fontWeight: 800, fontSize: 12.5,
            }}
          >
            Browse / பார்க்க
          </button>
        </div>
      </section>

      {/* Welcome strip */}
      <section style={{
        background: `linear-gradient(135deg, ${colors.primary}, #7b2845)`,
        color: colors.primaryText,
        borderRadius: 16,
        padding: "16px 15px",
        marginBottom: 18,
        boxShadow: "0 8px 22px rgba(90,26,46,0.16)",
      }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 5 }}>
          <Sparkles size={18} />
          <div className="serif" style={{ fontWeight: 800, fontSize: 16 }}>
            A trusted beginning for a lifelong relationship
          </div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.9 }}>
          உங்கள் வாழ்க்கைத் துணையை நம்பிக்கையுடன் தேடுங்கள் — சரிபார்ப்பு, தனியுரிமை மற்றும் குடும்ப மரியாதைக்கு முன்னுரிமை.
        </div>
      </section>

      {/* Trust */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div className="serif" style={{ fontWeight: 800, fontSize: 18 }}>Why Naicker Matrimony?</div>
          <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 2 }}>நம்பிக்கையுடன் தொடங்கும் ஒரு பாதுகாப்பான திருமண தளம்</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {trustItems.map(({ icon: Icon, title, tamil, desc }) => (
            <div key={title} style={{
              background: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: 12,
              minHeight: 132,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: colors.pendingBg, color: colors.primary,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8,
              }}>
                <Icon size={17} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 12.5 }}>{title}</div>
              <div style={{ color: colors.primary, fontSize: 10.5, fontWeight: 700, marginTop: 2 }}>{tamil}</div>
              <div style={{ color: colors.textFaint, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <div className="serif" style={{ fontWeight: 800, fontSize: 18 }}>How it works / எப்படி செயல்படும்</div>
          <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 2 }}>நான்கு எளிய படிகளில் உங்கள் பயணம்</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map(({ icon: Icon, no, title, tamil, text }) => (
            <div key={no} style={{
              display: "flex", gap: 11, alignItems: "flex-start",
              background: colors.card, border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14, padding: 12,
            }}>
              <div style={{
                flex: "0 0 40px", width: 40, height: 40, borderRadius: 12,
                background: colors.primary, color: colors.primaryText,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={16} />
                <span style={{ fontSize: 7.5, marginTop: 1, fontWeight: 800 }}>{no}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 12.5 }}>{title}</div>
                <div style={{ color: colors.primary, fontSize: 10.5, fontWeight: 700 }}>{tamil}</div>
                <div style={{ color: colors.textFaint, fontSize: 10.5, lineHeight: 1.45, marginTop: 3 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Explore */}
      <section style={{
        background: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 16,
        padding: 15,
        marginBottom: 18,
      }}>
        <div className="serif" style={{ fontWeight: 800, fontSize: 17 }}>Explore the platform / தளத்தை பயன்படுத்துங்கள்</div>
        <div style={{ color: colors.textFaint, fontSize: 11.5, lineHeight: 1.5, margin: "5px 0 12px" }}>
          Browse approved profiles, compare compatibility, view success stories and learn about membership options.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["Browse Profiles", "விவரங்களை பார்க்க", "browse", Users],
            ["Match Analytics", "பொருத்தம்", "dashboard", Sparkles],
            ["Success Stories", "வெற்றிக் கதைகள்", "successStories", HeartHandshake],
            ["Membership Plans", "உறுப்பினர் திட்டங்கள்", "plans", BadgeCheck],
          ].map(([title, tamil, page, Icon]) => (
            <button key={page} onClick={() => onNavigate(page)} style={{
              textAlign: "left", background: colors.inputBg, border: `1px solid ${colors.cardBorder}`,
              borderRadius: 11, padding: 10, color: colors.text,
            }}>
              <Icon size={16} color={colors.primary} />
              <div style={{ fontWeight: 800, fontSize: 11.5, marginTop: 5 }}>{title}</div>
              <div style={{ color: colors.textFaint, fontSize: 9.5, marginTop: 2 }}>{tamil}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        borderRadius: 16,
        padding: 17,
        textAlign: "center",
        background: `linear-gradient(135deg, ${colors.pendingBg}, #f4e0b8)`,
        border: `1px solid ${colors.cardBorder}`,
      }}>
        <HeartHandshake size={24} color={colors.primary} style={{ marginBottom: 5 }} />
        <div className="serif" style={{ fontSize: 17, fontWeight: 800 }}>Your journey can start today</div>
        <div style={{ fontSize: 11.5, color: colors.textMuted, margin: "4px 0 11px", lineHeight: 1.5 }}>
          இன்று உங்கள் வாழ்க்கைத் துணையை தேடும் பயணத்தை தொடங்குங்கள்.
        </div>
        <button onClick={() => onNavigate(primaryAction)} style={{
          width: "100%", border: 0, borderRadius: 10, padding: 12,
          background: colors.primary, color: colors.primaryText, fontWeight: 800, fontSize: 12.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {session ? "Open Dashboard / டாஷ்போர்டு" : "Create Your Profile / பதிவு செய்யுங்கள்"}
          <ArrowRight size={15} />
        </button>
      </section>

      <div style={{ textAlign: "center", padding: "17px 0 2px", color: colors.textFaint, fontSize: 10.5, lineHeight: 1.5 }}>
        Naicker Matrimony · Trusted community matchmaking<br />
        உங்கள் தனியுரிமை எங்களின் முக்கிய முன்னுரிமை.
      </div>
    </div>
  );
}
