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
          {profile.profile_for && profile.profile_for !== "Self" && (
            <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>
              Profile by parent for {profile.profile_for} / {profile.profile_for === "Son" ? "மகனுக்காக" : "மகளுக்காக"}
            </div>
          )}
        </div>
        <button onClick={handleToggleFav} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 10,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isFav ? <Heart size={18} color={colors.rejectedText} fill={colors.rejectedText} /> : <Heart size={18} color={colors.textFaint} />}
        </button>
      </div>

      <Section title="Basic Details / அடிப்படை விவரங்கள்" colors={colors}>
        <Row label="Religion / caste" value={`${profile.religion} · ${profile.caste}${profile.sub_caste ? " (" + profile.sub_caste + ")" : ""}`} />
        <Row label="Mother tongue" value={profile.mother_tongue} />
        <Row label="Education" value={profile.education || "—"} />
        <Row label="Occupation" value={profile.occupation || "—"} />
        <Row label="Income" value={profile.income || "—"} />
      </Section>

      {(profile.father_occupation || profile.mother_occupation || profile.siblings || profile.family_type) && (
        <Section title="Family Details / குடும்ப விவரங்கள்" colors={colors}>
          {profile.father_occupation && <Row label="Father's occupation" value={profile.father_occupation} />}
          {profile.mother_occupation && <Row label="Mother's occupation" value={profile.mother_occupation} />}
          {profile.siblings && <Row label="Siblings" value={profile.siblings} />}
          {profile.family_type && <Row label="Family type" value={profile.family_type} />}
        </Section>
      )}

      {(profile.star || profile.rasi || profile.birth_time || profile.birth_place) && (
        <Section title="Horoscope Details / ஜாதக விவரங்கள்" colors={colors}>
          {profile.star && <Row label="Star" value={profile.star} />}
          {profile.rasi && <Row label="Rasi" value={profile.rasi} />}
          {profile.birth_time && <Row label="Birth time" value={profile.birth_time} />}
          {profile.birth_place && <Row label="Birth place" value={profile.birth_place} />}
        </Section>
      )}

      {(profile.complexion || profile.body_type || profile.blood_group) && (
        <Section title="Physical Attributes / உடல் அமைப்பு" colors={colors}>
          {profile.complexion && <Row label="Complexion" value={profile.complexion} />}
          {profile.body_type && <Row label="Body type" value={profile.body_type} />}
          {profile.blood_group && <Row label="Blood group" value={profile.blood_group} />}
        </Section>
      )}

      <Section title="Lifestyle / வாழ்க்கை முறை" colors={colors}>
        <Row label="Diet" value={profile.diet || "—"} />
        <Row label="Smoking" value={profile.smoking || "—"} />
        <Row label="Drinking" value={profile.drinking || "—"} />
      </Section>

      {(profile.pref_age_min || profile.pref_age_max || profile.pref_education || profile.pref_occupation) && (
        <Section title="Partner Preference / துணை எதிர்பார்ப்பு" colors={colors}>
          {(profile.pref_age_min || profile.pref_age_max) && (
            <Row label="Preferred age" value={`${profile.pref_age_min || "—"} - ${profile.pref_age_max || "—"}`} />
          )}
          {profile.pref_education && <Row label="Preferred education" value={profile.pref_education} />}
          {profile.pref_occupation && <Row label="Preferred occupation" value={profile.pref_occupation} />}
        </Section>
      )}

      {profile.about && (
        <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13.5, color: colors.textMuted, lineHeight: 1.6 }}>
            <b style={{ color: colors.text }}>About / குறிப்பு:</b> {profile.about}
          </div>
        </div>
      )}

      <div style={{ padding: 14, borderRadius: 12, background: colors.pendingBg, marginBottom: 16 }}>
        {addressVisible() ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 700, color: colors.primary, fontSize: 15 }}>
            <MapPin size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              {profile.address && <>{profile.address}<br /></>}
              {profile.district && `${profile.district}, `}{profile.city}, {profile.state}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.pendingText, fontSize: 13.5 }}>
            <Lock size={15} /> Address hidden until interest is accepted / முகவரி மறைக்கப்பட்டுள்ளது
          </div>
        )}
      </div>

      {profile.id !== userId && !addressVisible() && (
        <PrimaryButton onClick={handleSendRequest}>
          {alreadySent ? "Request sent / அனுப்பப்பட்டது" : "Send interest request / ஆர்வம் தெரிவிக்கவும்"}
        </PrimaryButton>
      )}
    </div>
  );
}

function Section({ title, children, colors }) {
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div className="serif" style={{ fontSize: 13.5, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 2, color: colors.text }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div><b>{label}:</b> {value}</div>;
}
