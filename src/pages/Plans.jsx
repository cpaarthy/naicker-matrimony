import React from "react";
import { Crown, Check, ShieldCheck, Lock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { MEMBERSHIP_PLANS } from "../config/membership";

const FREE_FEATURES = [
  {
    en: "Create profile",
    ta: "சுயவிவரம் உருவாக்குதல்",
  },
  {
    en: "Browse approved profiles",
    ta: "அங்கீகரிக்கப்பட்ட சுயவிவரங்களைப் பார்வையிடுதல்",
  },
  {
    en: "Send and receive interests",
    ta: "விருப்பங்களை அனுப்புதல் மற்றும் பெறுதல்",
  },
  {
    en: "Accept or decline interests",
    ta: "விருப்பங்களை ஏற்றுக்கொள்ளுதல் அல்லது நிராகரித்தல்",
  },
  {
    en: "Shortlist / Favourites",
    ta: "விருப்பப் பட்டியல் / பிடித்தவை",
  },
  {
    en: "Recently viewed profiles",
    ta: "சமீபத்தில் பார்த்த சுயவிவரங்கள்",
  },
  {
    en: "Advanced profile search",
    ta: "மேம்பட்ட சுயவிவரத் தேடல்",
  },
  {
    en: "Notifications",
    ta: "அறிவிப்புகள்",
  },
  {
    en: "Block and report profiles",
    ta: "சுயவிவரங்களைத் தடுக்கவும் புகாரளிக்கவும்",
  },
  {
    en: "Porutham / compatibility details",
    ta: "பொருத்தம் / இணக்க விவரங்கள்",
  },
  {
    en: "Profile verification request",
    ta: "சுயவிவர சரிபார்ப்பு கோரிக்கை",
  },
  {
    en: "Verified-profile search",
    ta: "சரிபார்க்கப்பட்ட சுயவிவரத் தேடல்",
  },
  {
    en: "Privacy, block and report tools",
    ta: "தனியுரிமை, தடை மற்றும் புகார் கருவிகள்",
  },
  {
    en: "Match Score",
    ta: "பொருத்த மதிப்பெண்",
  },
];

const FUTURE_PLANS = [
  {
    id: "silver",
    name: "Silver",
    tamil: "சில்வர்",
  },
  {
    id: "gold",
    name: "Gold",
    tamil: "கோல்டு",
  },
  {
    id: "premium",
    name: "Premium",
    tamil: "பிரீமியம்",
  },
];

export default function Plans() {
  const { colors } = useTheme();
  const { membership = "free" } = useAuth();

  const freePlan = MEMBERSHIP_PLANS.free;
  const isFree = membership === "free";

  return (
    <div>
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 16 }}>
        <h2
          className="serif"
          style={{
            fontSize: 20,
            marginBottom: 5,
          }}
        >
          Membership Plan / உறுப்பினர் திட்டம்
        </h2>

        <p
          style={{
            fontSize: 12.5,
            color: colors.textMuted,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Naicker Matrimony is currently completely free for all
          registered members.
          <br />
          தற்போது அனைத்து உறுப்பினர்களுக்கும் அனைத்து வசதிகளும்
          இலவசமாக வழங்கப்படுகின்றன.
        </p>
      </div>

      {/* CURRENT FREE PLAN */}
      <div
        style={{
          background: colors.card,
          border: `2px solid ${colors.primary}`,
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* PLAN HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: colors.pendingBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Crown
              size={21}
              color={colors.primary}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div
              className="serif"
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: colors.text,
              }}
            >
              Free / இலவசம்
            </div>

            <div
              style={{
                color: colors.primary,
                fontWeight: 900,
                fontSize: 20,
                marginTop: 1,
              }}
            >
              ₹0
              <span
                style={{
                  fontSize: 10,
                  color: colors.textFaint,
                  fontWeight: 500,
                }}
              >
                {" "}
                / forever
              </span>
            </div>
          </div>

          {/* CURRENT PLAN */}
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              padding: "5px 8px",
              borderRadius: 999,
              background: colors.approvedBg,
              color: colors.approvedText,
              whiteSpace: "nowrap",
            }}
          >
            CURRENT PLAN
          </span>
        </div>

        {/* FREE STATUS */}
        <div
          style={{
            marginTop: 14,
            padding: 11,
            borderRadius: 10,
            background: colors.approvedBg,
            color: colors.approvedText,
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.5,
          }}
        >
          ✓ All features are available
          <br />
          ✓ அனைத்து வசதிகளும் கிடைக்கும்
        </div>

        {/* FEATURES */}
        <div
          style={{
            marginTop: 13,
          }}
        >
          <div
            className="serif"
            style={{
              fontWeight: 800,
              fontSize: 14,
              marginBottom: 8,
              color: colors.text,
            }}
          >
            Included Features / உள்ள வசதிகள்
          </div>

          {FREE_FEATURES.map((feature) => (
            <div
              key={feature.en}
              style={{
                fontSize: 12,
                margin: "8px 0",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                lineHeight: 1.45,
              }}
            >
              <Check
                size={14}
                color={colors.approvedText}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <div>
                <div style={{ color: colors.text }}>
                  {feature.en}
                </div>

                <div
                  style={{
                    color: colors.textFaint,
                    fontSize: 11,
                    marginTop: 1,
                  }}
                >
                  {feature.ta}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FREE FOREVER */}
        <div
          style={{
            width: "100%",
            marginTop: 14,
            borderRadius: 10,
            padding: 12,
            background: colors.pendingBg,
            color: colors.pendingText,
            fontWeight: 800,
            textAlign: "center",
            boxSizing: "border-box",
            fontSize: 12,
          }}
        >
          Free for everyone / அனைவருக்கும் இலவசம்
        </div>
      </div>

      {/* FUTURE MEMBERSHIP */}
      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 14,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div
          className="serif"
          style={{
            fontWeight: 800,
            fontSize: 14,
            color: colors.text,
            marginBottom: 5,
          }}
        >
          Future Membership Plans
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: colors.textFaint,
            lineHeight: 1.5,
            marginBottom: 11,
          }}
        >
          Paid membership plans may be introduced in the
          future.
          <br />
          எதிர்காலத்தில் கட்டண உறுப்பினர் திட்டங்கள்
          அறிமுகப்படுத்தப்படலாம்.
        </div>

        {FUTURE_PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "10px 0",
              borderTop: `1px solid ${colors.cardBorder}`,
            }}
          >
            <Lock
              size={14}
              color={colors.textFaint}
            />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.textMuted,
                }}
              >
                {plan.name}
              </div>

              <div
                style={{
                  fontSize: 10.5,
                  color: colors.textFaint,
                }}
              >
                {plan.tamil}
              </div>
            </div>

            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: colors.textFaint,
                background: colors.cardBorder,
                padding: "4px 7px",
                borderRadius: 999,
              }}
            >
              COMING LATER
            </span>
          </div>
        ))}
      </div>

      {/* SECURITY / PAYMENT NOTICE */}
      <div
        style={{
          background: colors.pendingBg,
          padding: 13,
          borderRadius: 12,
          fontSize: 11.5,
          color: colors.pendingText,
          lineHeight: 1.55,
        }}
      >
        <ShieldCheck
          size={14}
          style={{
            verticalAlign: "middle",
            marginRight: 5,
          }}
        />

        <strong>No payment is required now.</strong>
        <br />
        இப்போது எந்த கட்டணமும் தேவையில்லை.
        <br />
        All current features are available to Free members.
        <br />
        தற்போது அனைத்து வசதிகளும் Free உறுப்பினர்களுக்கு
        கிடைக்கின்றன.
      </div>
    </div>
  );
}
