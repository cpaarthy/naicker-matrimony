import React, { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/ui";
import { fetchFavourites, fetchApprovedProfiles, toggleFavourite } from "../data/queries";

export default function Favourites({ onNavigate, setSelectedProfileId }) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [favProfiles, setFavProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  React.useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const [{ data: favs }, { data: profs }] = await Promise.all([fetchFavourites(userId), fetchApprovedProfiles()]);
      const ids = new Set(favs.map(f => f.profile_id));
      setFavProfiles(profs.filter(p => ids.has(p.id)));
      setLoading(false);
    })();
  }, [userId]);

  async function removeFavourite(profileId) {
    setRemoving(profileId);
    const { error } = await toggleFavourite(userId, profileId, true);
    if (!error) setFavProfiles(prev => prev.filter(p => p.id !== profileId));
    setRemoving(null);
  }

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>My Favourites / பிடித்தவை</h2>

      {favProfiles.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
          <Heart size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: colors.text }}>No favourites yet / பிடித்தவை இல்லை</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Tap the heart icon on a profile to save it here. / விவரத்தில் உள்ள ஹார்ட் ஐகானை தட்டவும்.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {favProfiles.map(p => (
          <div key={p.id} onClick={() => { setSelectedProfileId(p.id); onNavigate("profileDetails"); }} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14,
            display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
          }}>
            <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="serif" style={{ fontWeight: 700, fontSize: 16.5 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{p.occupation || "—"} · Location hidden</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
