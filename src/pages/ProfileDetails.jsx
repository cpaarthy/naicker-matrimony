import React, { useState } from "react";
import { MapPin, Lock, Heart, Flag, ShieldOff, ShieldCheck, Star, BadgeCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, PrimaryButton } from "../components/ui";
import {
  fetchProfileById, fetchRequestsFor, sendInterestRequest, fetchFavourites, toggleFavourite,
  createNotification, recordProfileView, fetchBlockedProfiles, blockProfile, unblockProfile, submitProfileReport,
} from "../data/queries";
import { calculateMatchScore } from "../utils/matchScore";

export default function ProfileDetails({ profileId, onNavigate, showToast }) {
  const { colors } = useTheme();
  const { userId, session, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState([]);
  const [isFav, setIsFav] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  React.useEffect(() => {
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
      const { data: blocks } = await fetchBlockedProfiles(userId);
      setIsBlocked(blocks.some(b => b.blocked_id === profileId));
      if (profileId !== userId) recordProfileView(userId, profileId);
    }
    setLoading(false);
  }

  async function handleSendRequest() {
    if (!session) { showToast("Please log in first"); onNavigate("login"); return; }
    const existing = myRequests.find(r => r.from_id === userId && r.to_id === profileId);
    if (existing) { showToast("Request already sent"); return; }
    const { error } = await sendInterestRequest(userId, profileId);
    if (error) { showToast("Could not send request"); return; }
    await createNotification({
      userId: profileId, type: "request_received", relatedProfileId: userId,
      message: `${myProfile?.name || "Someone"} sent you an interest request.`,
    });
    showToast("Interest request sent");
    load();
  }

  async function handleToggleFav() {
    if (!session) { showToast("Please log in first"); onNavigate("login"); return; }
    const { error } = await toggleFavourite(userId, profileId, isFav);
    if (!error) { setIsFav(!isFav); showToast(isFav ? "Removed from favourites" : "Added to favourites"); }
  }

  async function handleToggleBlock() {
    if (!session) { showToast("Please log in first"); onNavigate("login"); return; }
    if (isBlocked) {
      const { error } = await unblockProfile(userId, profileId);
      if (!error) { setIsBlocked(false); showToast("Profile unblocked"); }
    } else {
      if (!window.confirm(`Block ${profile.name}? You won't see them while browsing.`)) return;
      const { error } = await blockProfile(userId, profileId);
      if (!error) { setIsBlocked(true); showToast("Profile blocked"); }
    }
  }

  async function handleSubmitReport(reason, details) {
    if (!session) { showToast("Please log in first"); onNavigate("login"); return; }
    const { error } = await submitProfileReport({ reporterId: userId, reportedId: profileId, reason, details });
    if (error) { showToast("Could not submit report"); return; }
    setShowReportModal(false);
    showToast("Report submitted. Admin will review it.");
  }

  function addressVisible() {
    // Member privacy rule: location is visible ONLY to the owner or after an
    // interest request involving both members has been accepted.
    if (profile?.id === userId) return true;
    return myRequests.some(r =>
      r.status === "accepted" &&
      ((r.from_id === userId && r.to_id === profile?.id) ||
       (r.from_id === profile?.id && r.to_id === userId))
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
          <div className="serif" style={{ fontWeight: 700, fontSize: 20, display: "flex", alignItems: "center", gap: 6 }}>{profile.name}{profile.is_verified && <BadgeCheck size={17} color={colors.approvedText} />}</div>
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

      {profile.id !== userId && myProfile && (
        <MatchScoreCard myProfile={myProfile} otherProfile={profile} colors={colors} />
      )}

      {profile.id !== userId && myProfile && (
        <button onClick={() => onNavigate("porutham")} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12,
          padding: "12px", fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 14,
        }}>
          <Star size={15} /> View Porutham / பொருத்தம் பார்க்கவும்
        </button>
      )}

      {profile.id !== userId && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={handleToggleBlock} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 8,
            padding: "8px", fontSize: 12.5, color: isBlocked ? colors.approvedText : colors.textMuted,
          }}>
            {isBlocked ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
            {isBlocked ? "Unblock" : "Block"}
          </button>
          <button onClick={() => setShowReportModal(true)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 8,
            padding: "8px", fontSize: 12.5, color: colors.textMuted,
          }}>
            <Flag size={13} /> Report
          </button>
        </div>
      )}

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

      {showReportModal && (
        <ReportModal colors={colors} onClose={() => setShowReportModal(false)} onSubmit={handleSubmitReport} />
      )}
    </div>
  );
}

function MatchScoreCard({ myProfile, otherProfile, colors }) {
  const [expanded, setExpanded] = useState(true);
  const result = calculateMatchScore(myProfile, otherProfile);
  if (!result) return null;

  const { percentage, breakdown = [] } = result;
  const scoreColor =
    percentage >= 90 ? colors.approvedText :
    percentage >= 50 ? colors.pendingText :
    colors.rejectedText;

  const factorNames = {
    age: "வயது / Age",
    city: "நகரம் / City",
    education: "கல்வி / Education",
    occupation: "வேலை / Occupation",
  };
  const weights = { age: 35, city: 25, education: 20, occupation: 20 };

  const rows = ["age", "city", "education", "occupation"].map((key) => {
    const item = breakdown.find((b) => b.key === key);
    const matched = Boolean(item?.matched);
    return {
      key,
      name: factorNames[key],
      matched,
      weight: weights[key],
      earned: matched ? weights[key] : 0,
    };
  });

  return (
    <div style={{
      background: colors.card,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}>
        <div>
          <div className="serif" style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
            Match Score / பொருத்த மதிப்பெண்
          </div>
          <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>
            Age 35% · City 25% · Education 20% · Occupation 20%
          </div>
        </div>
        <div style={{
          minWidth: 62,
          height: 62,
          borderRadius: "50%",
          border: `4px solid ${scoreColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          fontWeight: 900,
          color: scoreColor,
        }}>
          {percentage}%
        </div>
      </div>

      <div style={{
        borderTop: `1px solid ${colors.cardBorder}`,
        paddingTop: 10,
      }}>
        {rows.map((row) => (
          <div key={row.key} style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 10,
            alignItems: "center",
            padding: "8px 0",
            fontSize: 12.5,
          }}>
            <span style={{ color: colors.textMuted, fontWeight: 600 }}>
              {row.name}
            </span>
            <span style={{
              color: row.matched ? colors.approvedText : colors.rejectedText,
              fontWeight: 800,
            }}>
              {row.matched ? "✓ Match" : "✗ No match"}
            </span>
            <span style={{
              minWidth: 42,
              textAlign: "right",
              color: row.matched ? colors.text : colors.textFaint,
              fontWeight: 900,
            }}>
              +{row.earned}%
            </span>
          </div>
        ))}

        <div style={{
          borderTop: `1px solid ${colors.cardBorder}`,
          marginTop: 5,
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 900,
          fontSize: 13,
        }}>
          <span>மொத்தம் / Total</span>
          <span style={{ color: scoreColor }}>{percentage}%</span>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ colors, onClose, onSubmit }) {
  const [reason, setReason] = useState("Fake profile");
  const [details, setDetails] = useState("");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 90, padding: 16,
    }}>
      <div style={{ background: colors.bg, borderRadius: 14, padding: 20, width: "100%", maxWidth: 380 }}>
        <h3 className="serif" style={{ fontSize: 16, marginBottom: 12 }}>Report this profile</h3>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Reason</span>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{
              width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              fontSize: 14, background: colors.inputBg, color: colors.text,
            }}
          >
            <option>Fake profile</option>
            <option>Inappropriate content</option>
            <option>Harassment</option>
            <option>Asking for money</option>
            <option>Other</option>
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Details (optional)</span>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              fontSize: 14, background: colors.inputBg, color: colors.text, resize: "vertical",
            }}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, background: "transparent", border: `1px solid ${colors.inputBorder}`, borderRadius: 8,
            padding: "10px", fontSize: 14, color: colors.text,
          }}>Cancel</button>
          <button onClick={() => onSubmit(reason, details)} style={{
            flex: 1, background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
            padding: "10px", fontWeight: 700, fontSize: 14,
          }}>Submit report</button>
        </div>
      </div>
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
