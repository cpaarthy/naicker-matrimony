import React, { useMemo, useState } from "react";
import { Crown, Check, Lock, Search, Users } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const PLANS = [
  {
    id: "free",
    name: "Free",
    tamil: "இலவசம்",
    active: true,
  },
  {
    id: "silver",
    name: "Silver",
    tamil: "சில்வர்",
    active: false,
  },
  {
    id: "gold",
    name: "Gold",
    tamil: "கோல்டு",
    active: false,
  },
  {
    id: "premium",
    name: "Premium",
    tamil: "பிரீமியம்",
    active: false,
  },
];

const FREE_FEATURES = [
  ["Create profile", "சுயவிவரம் உருவாக்குதல்"],
  ["Browse approved profiles", "அங்கீகரிக்கப்பட்ட சுயவிவரங்களைப் பார்வையிடுதல்"],
  ["Send and receive interests", "விருப்பங்களை அனுப்புதல் மற்றும் பெறுதல்"],
  ["Accept or decline interests", "விருப்பங்களை ஏற்றுக்கொள்ளுதல் / நிராகரித்தல்"],
  ["Shortlist / Favourites", "விருப்பப் பட்டியல் / பிடித்தவை"],
  ["Recently viewed profiles", "சமீபத்தில் பார்த்த சுயவிவரங்கள்"],
  ["Advanced profile search", "மேம்பட்ட சுயவிவரத் தேடல்"],
  ["Notifications", "அறிவிப்புகள்"],
  ["Block and report profiles", "தடை மற்றும் புகார் வசதி"],
  ["Porutham / Compatibility", "பொருத்தம் / இணக்க விவரங்கள்"],
  ["Profile verification", "சுயவிவர சரிபார்ப்பு"],
  ["Verified-profile search", "சரிபார்க்கப்பட்ட சுயவிவரத் தேடல்"],
  ["Privacy tools", "தனியுரிமை கருவிகள்"],
  ["Match Score", "பொருத்த மதிப்பெண்"],
];

export default function MembershipManagement() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");

  /*
   * This page is currently informational.
   * All members remain Free.
   *
   * Future Silver / Gold / Premium plans are prepared
   * but are not activated.
   */

  const activePlan = PLANS.find((p) => p.active);

  const planStats = useMemo(
    () => ({
      free: 0,
      silver: 0,
      gold: 0,
      premium: 0,
    }),
    []
  );

  return (
    <div style={{ paddingBottom: 30 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <Crown size={21} color={colors.primary} />

          <h2
            className="serif"
            style={{
              fontSize: 20,
              margin: 0,
              fontWeight: 800,
            }}
          >
            Membership / உறுப்பினர் திட்டம்
          </h2>
        </div>

        <p
          style={{
            fontSize: 12,
            color: colors.textFaint,
            lineHeight: 1.6,
            marginTop: 7,
          }}
        >
          Currently all members have Free membership.
          <br />
          தற்போது அனைத்து உறுப்பினர்களும் Free உறுப்பினர்களாக உள்ளனர்.
        </p>
      </div>

      {/* CURRENT PLAN */}
      <div
        style={{
          background: colors.card,
          border: `2px solid ${colors.primary}`,
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: colors.pendingBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Crown size={22} color={colors.primary} />
          </div>

          <div style={{ flex: 1 }}>
            <div
              className="serif"
              style={{
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              {activePlan.name} / {activePlan.tamil}
            </div>

            <div
              style={{
                color: colors.primary,
                fontSize: 21,
                fontWeight: 900,
                marginTop: 2,
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

          <span
            style={{
              background: colors.approvedBg,
              color: colors.approvedText,
              padding: "5px 8px",
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            CURRENT
          </span>
        </div>

        <div
          style={{
            marginTop: 14,
            background: colors.approvedBg,
            color: colors.approvedText,
            borderRadius: 10,
            padding: 11,
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.5,
          }}
        >
          ✓ All features available
          <br />
          ✓ அனைத்து வசதிகளும் கிடைக்கும்
        </div>
      </div>

      {/* FEATURES */}
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
            fontSize: 15,
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          Free Features / இலவச வசதிகள்
        </div>

        {FREE_FEATURES.map(([english, tamil]) => (
          <div
            key={english}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              margin: "9px 0",
              fontSize: 12,
              lineHeight: 1.4,
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
              <div>{english}</div>

              <div
                style={{
                  fontSize: 10.5,
                  color: colors.textFaint,
                  marginTop: 1,
                }}
              >
                {tamil}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FUTURE PLANS */}
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
            fontSize: 15,
            fontWeight: 800,
            marginBottom: 5,
          }}
        >
          Future Plans / எதிர்கால திட்டங்கள்
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: colors.textFaint,
            lineHeight: 1.5,
            marginBottom: 10,
          }}
        >
          Paid membership may be introduced in the future.
          <br />
          எதிர்காலத்தில் கட்டண உறுப்பினர் திட்டங்கள் அறிமுகப்படுத்தப்படலாம்.
        </div>

        {PLANS.filter((plan) => !plan.active).map((plan) => (
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
            <Lock size={14} color={colors.textFaint} />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
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
                fontSize: 9,
                fontWeight: 800,
                color: colors.textFaint,
                background: colors.cardBorder,
                padding: "4px 7px",
                borderRadius: 999,
              }}
            >
              FUTURE
            </span>
          </div>
        ))}
      </div>

      {/* STATUS */}
      <div
        style={{
          background: colors.pendingBg,
          color: colors.pendingText,
          borderRadius: 12,
          padding: 13,
          fontSize: 11.5,
          lineHeight: 1.55,
        }}
      >
        <Users
          size={14}
          style={{
            verticalAlign: "middle",
            marginRight: 5,
          }}
        />

        All registered members currently use Free membership.
        <br />
        அனைத்து பதிவு செய்யப்பட்ட உறுப்பினர்களும் தற்போது Free
        membership பயன்படுத்துகின்றனர்.
        <br />
        <br />
        No payment is required at present.
        <br />
        தற்போது எந்த கட்டணமும் தேவையில்லை.
      </div>
    </div>
  );
}