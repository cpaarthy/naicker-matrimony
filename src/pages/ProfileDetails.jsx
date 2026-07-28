import { useState, useEffect } from "react";
import { MapPin, Lock, Heart } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, PrimaryButton } from "../components/ui";
import { fetchProfileById, fetchRequestsFor, sendInterestRequest, fetchFavourites, toggleFavourite } from "../data/queries";

export default function ProfileDetails({ profileId, onNavigate, showToast }) {
  const { colors } = useTheme();
  const { userId, session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState([]);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    load();
  }, [profileId]);

  async function load() {
    setLoading(true);
    const { data } = await fetchProfileById(profileId);
    setProfile(data);
    if (userId) {
      const { data: reqs } = await fetchRequestsFor(userId);
      setMyRequests(reqs);
      const { data: favs } = await fetchFavourites(userId);
      setIsFav(favs.some(f => f.profile_id === profileId));
    }
    setLoading(false);
  }

  async function handleSendRequest() {
    if (!session) { showToast("Please log in first"); onNavigate("login"); return; }
    const existing = myRequests.find(r => r.from_id === userId && r.to_id === profileId);
    if (existing) { showToast("Request already sent"); return; }
    const { error } = await sendInterestRequest(userId, profileId);
    if (error) { showToast("Could not send request"); return; }
    showToast("Interest request sent");
    load();
  }

  async function handleToggleFav() {
    if (!session) { showToast("Please log in first"); onNavigate("login"); return; }
    const { error } = await toggleFavourite(userId, profileId, isFav);
    if (!error) { setIsFav(!isFav); showToast(isFav ? "Removed from favourites" : "Added to favourites"); }
  }

  function addressVisible() {
    if (!profile) return false;
    if (profile.id === userId) return true;
    return myRequests.some(r =>
      ((r.from_id === userId && r.to_id === profile.id) || (r.from_id === profile.id && r.to_id === userId))
      && r.status === "accepted"
    );
  }

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;
  if (!profile) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Profile not found.</div>;

  const alreadySent = myRequests.some(r => r.from_id === userId && r.to_id === profile.id);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <Avatar name={profile.name} gender={profile.gender} photoUrl={profile.photo_url} size={72} />
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontWeight: 700, fontSize: 20 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: colors.textFaint }}>{profile.age} yrs · {profile.height}</div>
        </div>
        <button onClick={handleToggleFav} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 10,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isFav ? <Heart size={18} color={colors.rejectedText} fill={colors.rejectedText} /> : <Heart size={18} color={colors.textFaint} />}
        </button>
      </div>

      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 13.5, lineHeight: 2, color: colors.text }}>
          <Row label="Religion / caste" value={`${profile.religion} · ${profile.caste}`} />
          <Row label="Mother tongue" value={profile.mother_tongue} />
          <Row label="Education" value={profile.education || "—"} />
          <Row label="Occupation" value={profile.occupation || "—"} />
          <Row label="Income" value={profile.income || "—"} />
        </div>
        {profile.about && (
          <div style={{ marginTop: 10, fontSize: 13.5, color: colors.textMuted, lineHeight: 1.6 }}>
            <b style={{ color: colors.text }}>About:</b> {profile.about}
          </div>
        )}
      </div>

      <div style={{ padding: 14, borderRadius: 12, background: colors.pendingBg, marginBottom: 16 }}>
        {addressVisible() ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: colors.primary, fontSize: 15 }}>
            <MapPin size={16} /> {profile.city}, {profile.state}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.pendingText, fontSize: 13.5 }}>
            <Lock size={15} /> Address hidden until interest is accepted
          </div>
        )}
      </div>

      {profile.id !== userId && !addressVisible() && (
        <PrimaryButton onClick={handleSendRequest}>
          {alreadySent ? "Request sent" : "Send interest request"}
        </PrimaryButton>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return <div><b>{label}:</b> {value}</div>;
}
