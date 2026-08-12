import React, { useState } from "react";
import { Eye, Lock, BadgeCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, PlanBadge } from "../components/ui";
import { fetchProfileViewers } from "../data/queries";

export default function WhoViewedMe({ onNavigate, setSelectedProfileId }) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);
  const [viewers, setViewers] = useState([]);

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const res = await fetchProfileViewers(userId);
    setAllowed(res.allowed);
    setViewers(res.viewers);
    setLoading(false);
  }

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 20, marginBottom: 5 }}>
        Who Viewed My Profile / யார் பார்த்தார்கள்
      </h2>

      {!allowed && (
        <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}`, marginTop: 12 }}>
          <Lock size={30} style={{ marginBottom: 12, opacity: 0.6 }} />
          <div style={{ fontWeight: 700, color: colors.text, fontSize: 16, marginBottom: 6 }}>
            Silver / Gold members only
          </div>
          <div style={{ fontSize: 13, marginBottom: 18 }}>
            Upgrade to Silver or Gold to see who has viewed your profile.
            <br />உங்கள் சுயவிவரத்தை யார் பார்த்தார்கள் என்பதைப் பார்க்க Silver/Gold திட்டத்திற்கு மேம்படுத்தவும்.
          </div>
          <button onClick={() => onNavigate("plans")} style={{
            background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 700, fontSize: 14,
          }}>View Membership Plans / திட்டங்களைப் பார்க்க</button>
        </div>
      )}

      {allowed && viewers.length === 0 && (
        <div style={{ textAlign: "center", color: colors.textFaint, padding: 40, fontSize: 13 }}>
          No one has viewed your profile yet. / இதுவரை யாரும் பார்க்கவில்லை.
        </div>
      )}

      {allowed && viewers.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {viewers.map((v) => (
            <div key={v.id + v.viewed_at} onClick={() => { setSelectedProfileId(v.id); onNavigate("profileDetails"); }} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
              borderBottom: `1px solid ${colors.cardBorder}`, cursor: "pointer",
            }}>
              <Avatar name={v.name} gender={v.gender} photoUrl={v.photo_url} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <Eye size={13} color={colors.textFaint} /> {v.name} <PlanBadge plan={v.plan} />
                </div>
                <div style={{ fontSize: 11, color: colors.textFaint }}>
                  Viewed {new Date(v.viewed_at).toLocaleDateString()} {new Date(v.viewed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
