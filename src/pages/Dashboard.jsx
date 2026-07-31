import { useEffect, useState } from "react";
import { Heart, Mail, ShieldCheck, Bell, Settings, Clock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, Badge } from "../components/ui";
import Login from "./Login";
import { fetchRequestsFor, fetchNotifications } from "../data/queries";

const COMPLETENESS_FIELDS = [
  "name", "gender", "age", "height", "religion", "caste", "sub_caste", "education",
  "occupation", "income", "address", "district", "city", "state", "mother_tongue",
  "phone", "photo_url", "about",
  "father_occupation", "mother_occupation", "siblings", "family_type",
  "star", "rasi", "birth_time", "birth_place",
  "complexion", "body_type", "blood_group",
  "diet", "smoking", "drinking",
  "pref_age_min", "pref_age_max", "pref_education", "pref_occupation",
];

function calculateCompleteness(profile) {
  if (!profile) return 0;
  const filled = COMPLETENESS_FIELDS.filter(f => profile[f] !== null && profile[f] !== undefined && profile[f] !== "").length;
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

export default function Dashboard({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { session, profile, profileLoading, userId } = useAuth();
  const [pendingIncoming, setPendingIncoming] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchRequestsFor(userId).then(({ data }) => {
        setPendingIncoming(data.filter(r => r.to_id === userId && r.status === "pending").length);
      });
      fetchNotifications(userId).then(({ data }) => {
        setUnreadNotifications(data.filter(n => !n.read).length);
      });
    }
  }, [userId]);

  if (!session) {
    return <Login onNavigate={onNavigate} showToast={showToast} />;
  }

  if (profileLoading) {
    return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;
  }

  const completeness = calculateCompleteness(profile);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Dashboard / டாஷ்போர்டு</h2>

      {!profile && (
        <div style={{ textAlign: "center", padding: "30px 16px", background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}`, marginBottom: 16 }}>
          <div style={{ color: colors.text, fontWeight: 600, marginBottom: 6 }}>No profile yet / விவரம் இல்லை</div>
          <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: 14 }}>Complete your profile to start receiving interest requests. / விவரத்தை பூர்த்தி செய்யவும்.</div>
          <button onClick={() => onNavigate("editProfile")} style={{
            background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
            padding: "10px 18px", fontWeight: 700, fontSize: 14,
          }}>Complete profile / விவரத்தை பூர்த்தி செய்யவும்</button>
        </div>
      )}

      {profile && (
        <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div onClick={() => onNavigate("editProfile")} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer", marginBottom: 12 }}>
            <Avatar name={profile.name} gender={profile.gender} photoUrl={profile.photo_url} />
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontWeight: 700, fontSize: 16 }}>{profile.name}</div>
              <div style={{ fontSize: 12.5, color: colors.textFaint }}>{profile.city} · {profile.age} yrs</div>
            </div>
            <Badge tone={profile.status === "approved" ? "approved" : profile.status === "rejected" ? "rejected" : "pending"}>
              {profile.status}
            </Badge>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, color: colors.textFaint }}>Profile completeness / விவர முழுமை</span>
              <span style={{ fontSize: 11.5, color: colors.primary, fontWeight: 700 }}>{completeness}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: colors.pendingBg, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${completeness}%`, borderRadius: 999,
                background: completeness === 100 ? colors.approvedText : colors.accent,
                transition: "width 0.3s ease",
              }} />
            </div>
            {completeness < 100 && (
              <button onClick={() => onNavigate("editProfile")} style={{
                background: "none", border: "none", color: colors.primary, fontSize: 11.5, fontWeight: 700,
                padding: 0, marginTop: 6,
              }}>Complete more details →</button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <DashCard icon={Heart} title="Interest Requests / ஆர்வ கோரிக்கைகள்" badge={pendingIncoming > 0 ? pendingIncoming : null} onClick={() => onNavigate("requests")} colors={colors} />
        <DashCard icon={Bell} title="Notifications / அறிவிப்புகள்" badge={unreadNotifications > 0 ? unreadNotifications : null} onClick={() => onNavigate("notifications")} colors={colors} />
        <DashCard icon={ShieldCheck} title="Favourites / பிடித்தவை" onClick={() => onNavigate("favourites")} colors={colors} />
        <DashCard icon={Clock} title="Recently Viewed / சமீபத்தியவை" onClick={() => onNavigate("recentlyViewed")} colors={colors} />
        <DashCard icon={Mail} title="Contact Us / தொடர்பு கொள்ள" onClick={() => onNavigate("contact")} colors={colors} />
        <DashCard icon={Settings} title="Account Settings / அமைப்புகள்" onClick={() => onNavigate("accountSettings")} colors={colors} />
      </div>
    </div>
  );
}

function DashCard({ icon: Icon, title, badge, onClick, colors }) {
  return (
    <button onClick={onClick} style={{
      background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16,
      textAlign: "left", position: "relative",
    }}>
      <Icon size={20} color={colors.primary} style={{ marginBottom: 8 }} />
      <div style={{ fontWeight: 700, fontSize: 13.5, color: colors.text }}>{title}</div>
      {badge && (
        <span style={{
          position: "absolute", top: 10, right: 10, background: colors.rejectedText, color: "#fff",
          borderRadius: 999, fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
        }}>{badge}</span>
      )}
    </button>
  );
}
