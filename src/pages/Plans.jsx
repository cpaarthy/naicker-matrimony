import React from "react";
import { Crown, Check, ShieldCheck, Star, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { normalizePlan } from "../utils/plans";

const PLAN_CARDS = [
  {
    key: "free",
    name: "Free",
    tamil: "இலவசம்",
    price: "₹0",
    icon: Check,
    features: [
      "Create profile",
      "Browse approved profiles",
      "Unlimited interest requests",
      "Unlimited profile views",
      "Shortlist / Favourites",
      "Porutham / compatibility details",
      "Profile verification request",
    ],
  },
  {
    key: "silver",
    name: "Silver",
    tamil: "சில்வர்",
    price: "Admin activated",
    icon: Star,
    features: [
      "Everything in Free",
      "Priority listing in Browse",
      "See who viewed your profile",
      "Silver badge on your profile",
    ],
  },
  {
    key: "gold",
    name: "Gold",
    tamil: "கோல்டு",
    price: "Admin activated",
    icon: Crown,
    features: [
      "Everything in Silver",
      "Top priority listing in Browse",
      "See who viewed your profile",
      "Gold badge on your profile",
    ],
  },
];

export default function Plans() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const currentPlan = normalizePlan(profile?.plan);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 20 }}>
        Membership Plans / உறுப்பினர் திட்டங்கள்
      </h2>
      <p style={{ fontSize: 12.5, color: colors.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
        All core features — unlimited browsing, interests and profile views — are free for every member.
        Silver and Gold add priority listing and let you see who viewed your profile.
        <br />
        அடிப்படை அம்சங்கள் அனைவருக்கும் இலவசம், வரம்பு இல்லாமல். Silver/Gold திட்டங்கள் முன்னுரிமை பட்டியல் மற்றும் யார் பார்த்தார்கள் என்பதைக் காட்டும்.
      </p>

      {PLAN_CARDS.map((plan) => {
        const Icon = plan.icon;
        const isCurrent = currentPlan === plan.key;
        return (
          <div
            key={plan.key}
            className="nkm-card"
            style={{
              background: colors.card,
              border: `1.5px solid ${isCurrent ? colors.primary : colors.cardBorder}`,
              borderRadius: 16,
              padding: 17,
              marginBottom: 12,
              boxShadow: isCurrent ? colors.shadow : colors.shadowSm,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Icon size={19} color={colors.primary} />
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontWeight: 800, fontSize: 17 }}>
                  {plan.name} <span style={{ fontSize: 11, color: colors.textFaint, fontFamily: "'Inter', sans-serif" }}>/ {plan.tamil}</span>
                </div>
                <div style={{ color: colors.primary, fontWeight: 900, fontSize: plan.key === "free" ? 20 : 13 }}>
                  {plan.price}
                  {plan.key === "free" && <span style={{ fontSize: 10, color: colors.textFaint }}> / forever</span>}
                </div>
              </div>
              {isCurrent && (
                <span style={{
                  fontSize: 9.5, fontWeight: 800, padding: "4px 7px", borderRadius: 999,
                  background: colors.approvedBg, color: colors.approvedText,
                }}>
                  CURRENT PLAN
                </span>
              )}
            </div>

            <div style={{ marginTop: 11 }}>
              {plan.features.map((feature) => (
                <div key={feature} style={{ fontSize: 12, margin: "7px 0", display: "flex", gap: 7, alignItems: "center" }}>
                  <Check size={14} color={colors.approvedText} />
                  {feature}
                </div>
              ))}
            </div>

            <div style={{
              width: "100%", marginTop: 12, borderRadius: 9, padding: 11,
              background: isCurrent ? colors.approvedBg : colors.pendingBg,
              color: isCurrent ? colors.approvedText : colors.pendingText,
              fontWeight: 800, textAlign: "center", boxSizing: "border-box", fontSize: 12.5,
            }}>
              {isCurrent
                ? plan.key === "free"
                  ? "Unlimited browsing, interests & views"
                  : "Priority listing + who viewed your profile"
                : plan.key === "free"
                  ? "Default plan for every new member"
                  : "Contact admin to activate this plan"}
            </div>
          </div>
        );
      })}

      <div style={{
        background: colors.pendingBg, padding: 12, borderRadius: 12, fontSize: 11.5,
        color: colors.pendingText, lineHeight: 1.5,
      }}>
        <ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
        Silver and Gold plans are currently activated manually by the admin — there's no
        online payment yet. Contact us if you'd like to upgrade.
        <br />
        Silver/Gold திட்டங்களை தற்போது நிர்வாகி மட்டுமே செயல்படுத்த முடியும். மேம்படுத்த எங்களை தொடர்பு கொள்ளவும்.
      </div>
    </div>
  );
}
