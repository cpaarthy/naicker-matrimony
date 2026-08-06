import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, Users, Lock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, PrimaryButton } from "../components/ui";
import { fetchApprovedProfiles, fetchMasterList, fetchBlockedProfiles } from "../data/queries";
import { calculateMatchScore } from "../utils/matchScore";

export default function Browse({ onNavigate, setSelectedProfileId }) {
  const { colors } = useTheme();
  const { session, profile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [subCasteFilter, setSubCasteFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [blockedIds, setBlockedIds] = useState(new Set());

  const [subCasteOptions, setSubCasteOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetchApprovedProfiles().then(({ data }) => { setProfiles(data); setLoading(false); });
    fetchMasterList("sub_caste").then(({ data }) => setSubCasteOptions(data.map(d => d.value)));
    fetchMasterList("city").then(({ data }) => setCityOptions(data.map(d => d.value)));
    fetchMasterList("district").then(({ data }) => setDistrictOptions(data.map(d => d.value)));
    fetchMasterList("state").then(({ data }) => setStateOptions(data.map(d => d.value)));
    if (session.user?.id) {
      fetchBlockedProfiles(session.user.id).then(({ data }) => setBlockedIds(new Set(data.map(b => b.blocked_id))));
    }
  }, [session]);

  const opposingGender = profile?.gender === "Male" ? "Female" : profile?.gender === "Female" ? "Male" : null;

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      if (opposingGender && p.gender !== opposingGender) return false;
      if (blockedIds.has(p.id)) return false;
      if (p.visible === false) return false; // Hide profiles with visible = false
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.name} ${p.city} ${p.occupation} ${p.caste} ${p.sub_caste || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (ageMin && p.age < Number(ageMin)) return false;
      if (ageMax && p.age > Number(ageMax)) return false;
      if (subCasteFilter && p.sub_caste !== subCasteFilter) return false;
      if (cityFilter && p.city !== cityFilter) return false;
      if (districtFilter && p.district !== districtFilter) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      return true;
    });
  }, [profiles, opposingGender, blockedIds, search, ageMin, ageMax, subCasteFilter, cityFilter, districtFilter, stateFilter]);

  const hasActiveFilters = !!(search || ageMin || ageMax || subCasteFilter || cityFilter || districtFilter || stateFilter);

  const recommended = useMemo(() => {
    if (hasActiveFilters || !profile) return [];
    const hasPrefs = profile.pref_age_min || profile.pref_age_max || profile.pref_education || profile.pref_occupation;
    if (!hasPrefs) return [];
    return filtered.filter(p => {
      if (profile.pref_age_min && p.age < profile.pref_age_min) return false;
      if (profile.pref_age_max && p.age > profile.pref_age_max) return false;
      if (profile.pref_education && !p.education?.toLowerCase().includes(profile.pref_education.toLowerCase())) return false;
      if (profile.pref_occupation && !p.occupation?.toLowerCase().includes(profile.pref_occupation.toLowerCase())) return false;
      return true;
    }).slice(0, 5);
  }, [filtered, profile, hasActiveFilters]);

  function DropdownFilter({ value, onChange, options, placeholder }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
        background: colors.inputBg, color: colors.text, fontSize: 13,
      }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
        <Lock size={30} style={{ marginBottom: 12, opacity: 0.6 }} />
        <div style={{ fontWeight: 700, color: colors.text, fontSize: 16, marginBottom: 6 }}>
          Please log in to browse profiles / விவரங்களை பார்க்க உள்நுழையவும்
        </div>
        <div style={{ fontSize: 13, marginBottom: 18 }}>
          You need an account to view member profiles. / உறுப்பினர் விவரங்களை பார்க்க கணக்கு தேவை.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => onNavigate("login")} style={{
            background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 700, fontSize: 14,
          }}>Log in / உள்நுழையவும்</button>
          <button onClick={() => onNavigate("register")} style={{
            background: "transparent", color: colors.primary, border: `1.5px solid ${colors.primary}`, borderRadius: 8,
            padding: "10px 20px", fontWeight: 700, fontSize: 14,
          }}>Register / பதிவு</button>
        </div>
      </div>
    );
  }

  if (session && !profile) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
        <Lock size={30} style={{ marginBottom: 12, opacity: 0.6 }} />
        <div style={{ fontWeight: 700, color: colors.text, fontSize: 16, marginBottom: 6 }}>
          Complete your profile to browse / விவரத்தை பூர்த்தி செய்யவும்
        </div>
        <div style={{ fontSize: 13, marginBottom: 18 }}>
          We need your profile details (like gender) to show you suitable matches. / பொருத்தமான விவரங்களைக் காட்ட, உங்கள் விவரம் தேவை.
        </div>
        <button onClick={() => onNavigate("editProfile")} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 700, fontSize: 14,
        }}>Complete profile / விவரத்தை பூர்த்தி செய்யவும்</button>
      </div>
    );
  }

  if (profile?.admin_deactivated) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
        <Lock size={30} style={{ marginBottom: 12, opacity: 0.6 }} />
        <div style={{ fontWeight: 700, color: colors.text, fontSize: 16, marginBottom: 6 }}>
          Your account has been deactivated / உங்கள் கணக்கு முடக்கப்பட்டுள்ளது
        </div>
        <div style={{ fontSize: 13 }}>
          Please contact the admin for more information. / மேலும் தகவலுக்கு நிர்வாகியை தொடர்பு கொள்ளவும்.
        </div>
      </div>
    );
  }

  const lastSignIn = session?.user?.last_sign_in_at ? new Date(session.user.last_sign_in_at) : null;
  const daysSinceLogin = lastSignIn ? (Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24) : 0;
  const isInactive = daysSinceLogin > 150;

  if (isInactive) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
        <Lock size={30} style={{ marginBottom: 12, opacity: 0.6 }} />
        <div style={{ fontWeight: 700, color: colors.text, fontSize: 16, marginBottom: 6 }}>
          Your account is inactive / உங்கள் கணக்கு செயலற்றது
        </div>
        <div style={{ fontSize: 13, marginBottom: 6 }}>
          You haven't logged in for over 150 days, so browsing is paused for your account's safety.
        </div>
        <div style={{ fontSize: 13 }}>
          150 நாட்களுக்கும் மேலாக நீங்கள் உள்நுழையவில்லை, எனவே பாதுகாப்பிற்காக பார்வையிடுதல் இடைநிறுத்தப்பட்டுள்ளது.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 12 }}>Browse profiles / விவரங்களை பார்க்க</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8, background: colors.card,
          border: `1px solid ${colors.cardBorder}`, borderRadius: 10, padding: "9px 12px",
        }}>
          <Search size={16} color={colors.textFaint} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city, occupation..."
            style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 14, color: colors.text }}
          />
        </div>
        <button onClick={() => setShowFilters(s => !s)} style={{
          background: showFilters ? colors.primary : colors.card, color: showFilters ? colors.primaryText : colors.text,
          border: `1px solid ${colors.cardBorder}`, borderRadius: 10, width: 40, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {showFilters && (
        <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input placeholder="Min age / குறை வயது" value={ageMin} onChange={e => setAgeMin(e.target.value)} type="number" style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.text, fontSize: 13,
            }} />
            <input placeholder="Max age / அதிக வயது" value={ageMax} onChange={e => setAgeMax(e.target.value)} type="number" style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.text, fontSize: 13,
            }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <DropdownFilter value={subCasteFilter} onChange={setSubCasteFilter} options={subCasteOptions} placeholder="Sub caste / உட்பிரிவு" />
            <DropdownFilter value={stateFilter} onChange={setStateFilter} options={stateOptions} placeholder="State / மாநிலம்" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <DropdownFilter value={districtFilter} onChange={setDistrictFilter} options={districtOptions} placeholder="District / மாவட்டம்" />
            <DropdownFilter value={cityFilter} onChange={setCityFilter} options={cityOptions} placeholder="City / ஊர்" />
          </div>
        </div>
      )}

      {recommended.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>
            Recommended for you / உங்களுக்கான பரிந்துரைகள்
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recommended.map(p => (
              <div key={p.id} onClick={() => { setSelectedProfileId(p.id); onNavigate("profileDetails"); }} style={{
                background: colors.pendingBg, border: `1px solid ${colors.pendingText}`, borderRadius: 14, padding: 12,
                display: "flex", gap: 12, alignItems: "center", cursor: "pointer",
              }}>
                <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontWeight: 700, fontSize: 14.5 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{p.occupation || "—"} · {p.city}, {p.age} yrs</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 10 }}>{filtered.length} profiles found / விவரங்கள்</div>

      {loading && <div style={{ textAlign: "center", color: colors.textFaint, padding: 30 }}>Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
          <Users size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: colors.text }}>No profiles match your search / பொருந்தும் விவரங்கள் இல்லை</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(p => {
          const match = profile ? calculateMatchScore(profile, p) : null;
          return (
            <div key={p.id} onClick={() => { setSelectedProfileId(p.id); onNavigate("profileDetails"); }} style={{
              background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14,
              display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
            }}>
              <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div className="serif" style={{ fontWeight: 700, fontSize: 16.5 }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {match && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                        background: match.percentage >= 70 ? colors.approvedBg : match.percentage >= 40 ? colors.pendingBg : colors.rejectedBg,
                        color: match.percentage >= 70 ? colors.approvedText : match.percentage >= 40 ? colors.pendingText : colors.rejectedText,
                      }}>{match.percentage}% match</span>
                    )}
                    <div style={{ fontSize: 12.5, color: colors.textFaint }}>{p.age} yrs</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{p.occupation || "—"} · {p.city}</div>
                <div style={{ fontSize: 12.5, color: colors.textFaint, marginTop: 2 }}>
                  {p.religion} · {p.caste}{p.sub_caste ? ` (${p.sub_caste})` : ""} · {p.mother_tongue}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
