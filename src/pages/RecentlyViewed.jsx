import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/ui";
import { fetchRecentlyViewed, fetchAllProfiles } from "../data/queries";

export default function RecentlyViewed({ onNavigate, setSelectedProfileId }) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [viewedProfiles, setViewedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const [{ data: views }, { data: profs }] = await Promise.all([fetchRecentlyViewed(userId), fetchAllProfiles()]);
      const ordered = views
        .map(v => ({ ...profs.find(p => p.id === v.viewed_id), viewed_at: v.viewed_at }))
        .filter(p => p.id);
      setViewedProfiles(ordered);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Recently Viewed / சமீபத்தியவை</h2>

      {viewedProfiles.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
          <Clock size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: colors.text }}>No recently viewed profiles / பார்வையிட்ட விவரங்கள் இல்லை</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {viewedProfiles.map(p => (
          <div key={p.id} onClick={() => { setSelectedProfileId(p.id); onNavigate("profileDetails"); }} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14,
            display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
          }}>
            <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="serif" style={{ fontWeight: 700, fontSize: 16.5 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{p.occupation || "—"} · {p.city}</div>
              <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>
                Viewed {new Date(p.viewed_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
