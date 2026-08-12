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
import { SectionDivider } from "../components/ui";

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
        margin: "-2px -2px 20px",
        borderRadius: 22,
        overflow: "hidden",
        border: `1px solid ${colors.cardBorder}`,
        background: colors.card,
        boxShadow: colors.shadowLg,
      }}>
        <img
          src="/images/home-hero.webp"
          alt="Naicker Matrimony — நாயக்கர் மேட்ரிமோனி"
          style={{ width: "100%", display: "block", height: "auto" }}
        />
        <div style={{
          padding: 13,
          background: colors.card,
          borderTop: `1px solid ${colors.cardBorder}`,
          display: "flex",
          gap: 8,
        }}>
          <button
            onClick={() => onNavigate(primaryAction)}
            className="nkm-btn-primary"
            style={{
              flex: 1, border: 0, borderRadius: 12, padding: "13px 10px",
              background: colors.primary, color: colors.primaryText, fontWeight: 800,
              fontSize: 12.5, boxShadow: "0 6px 16px rgba(74,21,36,0.24)", letterSpacing: 0.2,
            }}
          >
            {session ? "My Dashboard / என் டாஷ்போர்டு" : "Register Free / இலவச பதிவு"}
          </button>
          <button
            onClick={() => onNavigate("browse")}
            style={{
              flex: 1, border: `1.5px solid ${colors.primary}`, borderRadius: 12, padding: "13px 10px",
              background: "transparent", color: colors.primary, fontWeight: 800, fontSize: 12.5, letterSpacing: 0.2,
            }}
          >
            Browse / பார்க்க
          </button>
        </div>
      </section>

      {/* Welcome strip */}
      <section style={{
        background: colors.headerGradient,
        color: colors.primaryText,
        borderRadius: 18,
        padding: "18px 17px",
        marginBottom: 6,
        boxShadow: colors.shadowLg,
        border: `1px solid rgba(216,169,80,0.3)`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(216,169,80,0.16), transparent 70%)",
        }} />
        <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 6 }}>
          <Sparkles size={17} color="#d8a950" />
          <div className="serif" style={{ fontWeight: 800, fontSize: 16.5, letterSpacing: -0.2 }}>
            A trusted beginning for a lifelong relationship
          </div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.88 }}>
          உங்கள் வாழ்க்கைத் துணையை நம்பிக்கையுடன் தேடுங்கள் — சரிபார்ப்பு, தனியுரிமை மற்றும் குடும்ப மரியாதைக்கு முன்னுரிமை.
        </div>
      </section>

      <SectionDivider />

      {/* Trust */}
      <section style={{ marginBottom: 4 }}>
        <div style={{ marginBottom: 11 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: colors.accent, marginBottom: 4 }}>Why choose us</div>
          <div className="serif" style={{ fontWeight: 800, fontSize: 19, letterSpacing: -0.2 }}>Why Naicker Matrimony?</div>
          <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 3 }}>நம்பிக்கையுடன் தொடங்கும் ஒரு பாதுகாப்பான திருமண தளம்</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {trustItems.map(({ icon: Icon, title, tamil, desc }) => (
            <div key={title} className="nkm-card" style={{
              background: colors.card,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 15,
              padding: 13,
              minHeight: 136,
              boxShadow: colors.shadowSm,
            }}>
              <div style={{
                width: 33, height: 33, borderRadius: 10,
                background: colors.pendingBg, color: colors.primary,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 9,
              }}>
                <Icon size={17} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 12.5 }}>{title}</div>
              <div style={{ color: colors.primary, fontSize: 10.5, fontWeight: 700, marginTop: 2 }}>{tamil}</div>
              <div style={{ color: colors.textFaint, fontSize: 10.5, lineHeight: 1.5, marginTop: 6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* How it works */}
      <section style={{ marginBottom: 4 }}>
        <div style={{ marginBottom: 11 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: colors.accent, marginBottom: 4 }}>Getting started</div>
          <div className="serif" style={{ fontWeight: 800, fontSize: 19, letterSpacing: -0.2 }}>How it works</div>
          <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 3 }}>நான்கு எளிய படிகளில் உங்கள் பயணம்</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {steps.map(({ icon: Icon, no, title, tamil, text }) => (
            <div key={no} className="nkm-card" style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              background: colors.card, border: `1px solid ${colors.cardBorder}`,
              borderRadius: 15, padding: 13, boxShadow: colors.shadowSm,
            }}>
              <div style={{
                flex: "0 0 42px", width: 42, height: 42, borderRadius: 13,
                background: colors.primary, color: colors.primaryText,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: "0 3px 10px rgba(74,21,36,0.28)",
              }}>
                <Icon size={16} />
                <span style={{ fontSize: 7.5, marginTop: 1, fontWeight: 800, color: "#d8a950" }}>{no}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 12.5 }}>{title}</div>
                <div style={{ color: colors.primary, fontSize: 10.5, fontWeight: 700 }}>{tamil}</div>
                <div style={{ color: colors.textFaint, fontSize: 10.5, lineHeight: 1.5, marginTop: 4 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Explore */}
      <section style={{
        background: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 17,
        padding: 16,
        marginBottom: 4,
        boxShadow: colors.shadowSm,
      }}>
        <div className="serif" style={{ fontWeight: 800, fontSize: 17.5, letterSpacing: -0.2 }}>Explore the platform</div>
        <div style={{ color: colors.textFaint, fontSize: 11.5, lineHeight: 1.55, margin: "5px 0 13px" }}>
          Browse approved profiles, compare compatibility, view success stories and learn about membership options.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          {[
            ["Browse Profiles", "விவரங்களை பார்க்க", "browse", Users],
            ["Match Analytics", "பொருத்தம்", "dashboard", Sparkles],
            ["Success Stories", "வெற்றிக் கதைகள்", "successStories", HeartHandshake],
            ["Membership Plans", "உறுப்பினர் திட்டங்கள்", "plans", BadgeCheck],
          ].map(([title, tamil, page, Icon]) => (
            <button key={page} onClick={() => onNavigate(page)} className="nkm-card" style={{
              textAlign: "left", background: colors.inputBg, border: `1px solid ${colors.cardBorder}`,
              borderRadius: 12, padding: 11, color: colors.text,
            }}>
              <Icon size={16} color={colors.primary} />
              <div style={{ fontWeight: 800, fontSize: 11.5, marginTop: 6 }}>{title}</div>
              <div style={{ color: colors.textFaint, fontSize: 9.5, marginTop: 2 }}>{tamil}</div>
            </button>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* Final CTA */}
      <section style={{
        borderRadius: 18,
        padding: 19,
        textAlign: "center",
        background: `linear-gradient(155deg, ${colors.accentSoft}, #ecd6a0)`,
        border: `1px solid ${colors.cardBorderStrong}`,
        boxShadow: colors.shadowSm,
      }}>
        <HeartHandshake size={25} color={colors.primary} style={{ marginBottom: 6 }} />
        <div className="serif" style={{ fontSize: 17.5, fontWeight: 800, letterSpacing: -0.2 }}>Your journey can start today</div>
        <div style={{ fontSize: 11.5, color: colors.textMuted, margin: "5px 0 12px", lineHeight: 1.55 }}>
          இன்று உங்கள் வாழ்க்கைத் துணையை தேடும் பயணத்தை தொடங்குங்கள்.
        </div>
        <button onClick={() => onNavigate(primaryAction)} className="nkm-btn-primary" style={{
          width: "100%", border: 0, borderRadius: 11, padding: 13,
          background: colors.primary, color: colors.primaryText, fontWeight: 800, fontSize: 12.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: "0 6px 16px rgba(74,21,36,0.24)", letterSpacing: 0.2,
        }}>
          {session ? "Open Dashboard / டாஷ்போர்டு" : "Create Your Profile / பதிவு செய்யுங்கள்"}
          <ArrowRight size={15} />
        </button>
      </section>

      <div style={{ textAlign: "center", padding: "20px 0 2px", color: colors.textFaint, fontSize: 10.5, lineHeight: 1.6 }}>
        Naicker Matrimony · Trusted community matchmaking<br />
        உங்கள் தனியுரிமை எங்களின் முக்கிய முன்னுரிமை.
      </div>
    </div>
  );
}
