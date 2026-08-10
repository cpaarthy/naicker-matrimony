import React from "react";
import { Crown, Check, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const freePlan = {
  name: "Free",
  price: "₹0",
  features: [
    "Create profile",
    "Browse approved profiles",
    "Send and receive interests",
    "Accept or decline interests",
    "Shortlist / Favourites",
    "Recently viewed profiles",
    "Advanced profile search",
    "Notifications",
    "Block and report profiles",
    "Porutham / compatibility details",
  ],
};

export default function Plans() {
  const { colors } = useTheme();

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 20 }}>
        Membership Plan / உறுப்பினர் திட்டம்
      </h2>
      <p style={{ fontSize: 12.5, color: colors.textMuted, lineHeight: 1.6 }}>
        Naicker Matrimony is currently completely free for all registered members.
        There are no paid, Gold, Premium or upgrade plans at present.
      </p>

      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.primary}`,
          borderRadius: 15,
          padding: 16,
          marginBottom: 11,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Crown size={19} color={colors.primary} />
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontWeight: 800, fontSize: 17 }}>
              {freePlan.name}
            </div>
            <div style={{ color: colors.primary, fontWeight: 900, fontSize: 20 }}>
              {freePlan.price}
              <span style={{ fontSize: 10, color: colors.textFaint }}> / forever</span>
            </div>
          </div>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              padding: "4px 7px",
              borderRadius: 999,
              background: colors.approvedBg,
              color: colors.approvedText,
            }}
          >
            CURRENT PLAN
          </span>
        </div>

        <div style={{ marginTop: 11 }}>
          {freePlan.features.map((feature) => (
            <div
              key={feature}
              style={{
                fontSize: 12,
                margin: "7px 0",
                display: "flex",
                gap: 7,
                alignItems: "center",
              }}
            >
              <Check size={14} color={colors.approvedText} />
              {feature}
            </div>
          ))}
        </div>

        <div
          style={{
            width: "100%",
            marginTop: 12,
            borderRadius: 9,
            padding: 11,
            background: colors.pendingBg,
            color: colors.pendingText,
            fontWeight: 800,
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          Free for everyone
        </div>
      </div>

      <div
        style={{
          background: colors.pendingBg,
          padding: 12,
          borderRadius: 12,
          fontSize: 11.5,
          color: colors.pendingText,
          lineHeight: 1.5,
        }}
      >
        <ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
        No payment is required. No paid membership plans are currently offered.
      </div>
    </div>
  );
}
