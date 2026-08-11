import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Users, Lock, BadgeCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, PrimaryButton } from "../components/ui";
import { fetchApprovedProfiles, fetchMasterList, fetchBlockedProfiles, fetchFavourites } from "../data/queries";
import { calculateMatchScore } from "../utils/matchScore";
import {
import MatchDetails from '../components/MatchDetails';
  matchesPartnerPreference,
  isOppositeGender,
  matchesAnalyticsFilter,
} from "../utils/matchFilters";

export default function Browse({ onNavigate, setSelectedProfileId, matchFilter = null }) {
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
  const [educationFilter, setEducationFilter] = useState("");
  const [occupationFilter, setOccupationFilter] = useState("");
  const [incomeFilter, setIncomeFilter] = useState("");
  const [starFilter, setStarFilter] = useState("");
  const [rasiFilter, setRasiFilter] = useState("");
  const [dietFilter, setDietFilter] = useState("");
  const [smokingFilter, setSmokingFilter] = useState("");
  const [drinkingFilter, setDrinkingFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [motherTongueFilter, setMotherTongueFilter] = useState("");
  const [familyTypeFilter, setFamilyTypeFilter] = useState("");
  const [heightMin, setHeightMin] = useState("");
  const [heightMax, setHeightMax] = useState("");
  const [complexionFilter, setComplexionFilter] = useState("");
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [shortlistedIds, setShortlistedIds] = useState(new Set());

  const [subCasteOptions, setSubCasteOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [starOptions, setStarOptions] = useState([]);
  const [rasiOptions, setRasiOptions] = useState([]);
  const [motherTongueOptions, setMotherTongueOptions] = useState([]);

  React.useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetchApprovedProfiles().then(({ data }) => { setProfiles(data); setLoading(false); });
    fetchMasterList("sub_caste").then(({ data }) => setSubCasteOptions(data.map(d => d.value)));
    fetchMasterList("city").then(({ data }) => setCityOptions(data.map(d => d.value)));
    fetchMasterList("district").then(({ data }) => setDistrictOptions(data.map(d => d.value)));
    fetchMasterList("state").then(({ data }) => setStateOptions(data.map(d => d.value)));
    fetchMasterList("star").then(({ data }) => setStarOptions(data.map(d => d.value)));
    fetchMasterList("rasi").then(({ data }) => setRasiOptions(data.map(d => d.value)));
    fetchMasterList("mother_tongue").then(({ data }) => setMotherTongueOptions(data.map(d => d.value)));
    if (session.user?.id) {
      fetchBlockedProfiles(session.user.id).then(({ data }) => setBlockedIds(new Set((data || []).map(b => b.blocked_id))));
      fetchFavourites(session.user.id).then(({ data }) => setShortlistedIds(new Set((data || []).map(f => f.profile_id))));
    }
  }, [session]);

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      if (!isOppositeGender(profile, p)) return false;
      if (blockedIds.has(p.id)) return false;

      const score = profile ? calculateMatchScore(profile, p) : null;
      const pct = score?.percentage ?? 0;
      if (!matchesAnalyticsFilter(matchFilter === "shortlisted" ? null : matchFilter, profile, p, pct)) return false;
      if (matchFilter === "shortlisted" && !shortlistedIds.has(p.id)) return false;

      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.name || ""} ${p.city || ""} ${p.occupation || ""} ${p.caste || ""} ${p.sub_caste || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (ageMin && Number(p.age) < Number(ageMin)) return false;
      if (ageMax && Number(p.age) > Number(ageMax)) return false;
      if (subCasteFilter && p.sub_caste !== subCasteFilter) return false;
      if (cityFilter && p.city !== cityFilter) return false;
      if (districtFilter && p.district !== districtFilter) return false;
      if (stateFilter && p.state !== stateFilter) return false;
      if (educationFilter && !String(p.education || "").toLowerCase().includes(educationFilter.toLowerCase())) return false;
      if (occupationFilter && !String(p.occupation || "").toLowerCase().includes(occupationFilter.toLowerCase())) return false;
      if (incomeFilter && !String(p.income || "").toLowerCase().includes(incomeFilter.toLowerCase())) return false;
      if (starFilter && p.star !== starFilter) return false;
      if (rasiFilter && p.rasi !== rasiFilter) return false;
      if (dietFilter && p.diet !== dietFilter) return false;
      if (smokingFilter && p.smoking !== smokingFilter) return false;
      if (drinkingFilter && p.drinking !== drinkingFilter) return false;
      if (verifiedOnly && !p.is_verified) return false;
      if (motherTongueFilter && p.mother_tongue !== motherTongueFilter) return false;
      if (familyTypeFilter && p.family_type !== familyTypeFilter) return false;
      const heightInches = parseHeightInches(p.height);
      if (heightMin && (!heightInches || heightInches < Number(heightMin))) return false;
      if (heightMax && (!heightInches || heightInches > Number(heightMax))) return false;
      if (complexionFilter && p.complexion !== complexionFilter) return false;
      return true;
    });
  }, [profiles, blockedIds, shortlistedIds, search, ageMin, ageMax, subCasteFilter, cityFilter, districtFilter, stateFilter, educationFilter, occupationFilter, incomeFilter, starFilter, rasiFilter, dietFilter, smokingFilter, drinkingFilter, verifiedOnly, motherTongueFilter, familyTypeFilter, heightMin, heightMax, complexionFilter, matchFilter, profile]);

  const hasActiveFilters = !!(search || ageMin || ageMax || subCasteFilter || cityFilter || districtFilter || stateFilter || educationFilter || occupationFilter || incomeFilter || starFilter || rasiFilter || dietFilter || smokingFilter || drinkingFilter || verifiedOnly || motherTongueFilter || familyTypeFilter || heightMin || heightMax || complexionFilter);

  const recommended = useMemo(() => {
    if (hasActiveFilters || !profile || matchFilter) return [];
    const hasPrefs = profile.pref_age_min || profile.pref_age_max || profile.pref_education || profile.pref_occupation;
    if (!hasPrefs) return [];
    return filtered.filter(p => {
      if (profile.pref_age_min && p.age < profile.pref_age_min) return false;
      if (profile.pref_age_max && p.age > profile.pref_age_max) return false;
      if (profile.pref_education && !p.education?.toLowerCase().includes(profile.pref_education.toLowerCase())) return false;
      if (profile.pref_occupation && !p.occupation?.toLowerCase().includes(profile.pref_occupation.toLowerCase())) return false;
      return true;
    }).slice(0, 5);
  }, [filtered, profile, hasActiveFilters, matchFilter]);

  function parseHeightInches(value) {
    const text = String(value || "").trim();
    const feetInches = text.match(/(\d+)\s*[\'′]\s*(\d+)?/);
    if (feetInches) return Number(feetInches[1]) * 12 + Number(feetInches[2] || 0);
    const cm = text.match(/(\d+(?:\.\d+)?)\s*cm/i);
    if (cm) return Number(cm[1]) / 2.54;
    return null;
  }

  function DropdownFilter({ value, onChange, options, placeholder }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
        background: colors.inputBg, color: colors.text, fontSize: 13,
      }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{placeholder.startsWith("Min height") || placeholder.startsWith("Max height") ? `${Math.floor(Number(o) / 12)}'${Number(o) % 12}` : o}</option>)}
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
          We need your profile details (like gender) to show you suitable matches. / பொருத்தமான விவரங்களைக் காட்க, உங்கள் விவரம் தேவை.
        </div>
        <button onClick={() => onNavigate("editProfile")} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 700, fontSize: 14,
        }}>Complete profile / விவரத்தை பூர்த்தி செய்யவும்</button>
      </div>
    );
  }

  if (profile?.status !== "approved") {
    const isRejected = profile?.status === "rejected";
    return (
      <div style={{ textAlign: "center", padding: "50px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
        <Lock size={30} style={{ marginBottom: 12, opacity: 0.6 }} />
        <div style={{ fontWeight: 700, color: colors.text, fontSize: 16, marginBottom: 8 }}>
          {isRejected
            ? "Profile approval required / உங்கள் விவரம் நிராகரிக்கப்பட்டுள்ளது"
            : "Waiting for admin approval / நிர்வாகி அனுமதிக்காக காத்திருக்கிறது"}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
          {isRejected
            ? "Please update your profile and contact admin for approval."
            : "You can browse other profiles only after the admin approves your profile."}
          <br />
          {isRejected
            ? "உங்கள் விவரங்களை சரிசெய்து நிர்வாகியை தொடர்பு கொள்ளவும்."
            : "நிர்வாகி உங்கள் விவரத்தை அனுமதித்த பிறகே மற்ற உறுப்பினர்களின் விவரங்களை பார்க்க முடியும்."}
        </div>
        <button onClick={() => onNavigate("editProfile")} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 700, fontSize: 14,
        }}>Edit profile / விவரத்தை திருத்தவும்</button>
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
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
        {[
          ["all", "All / அனைத்தும்"],
          ["high", "High Match"],
          ["medium", "Medium Match"],
          ["low", "Low Match"],
          ["new", "New 30 Days"],
          ["active", "Recently Active"],
          ["verified", "Verified"],
          ["shortlisted", "Shortlisted"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => onNavigate(`browse:${key}`)} style={{
            flex: "0 0 auto", padding: "7px 11px", borderRadius: 999,
            border: `1px solid ${matchFilter === key ? colors.primary : colors.cardBorder}`,
            background: matchFilter === key ? colors.primary : colors.card,
            color: matchFilter === key ? colors.primaryText : colors.text,
            fontSize: 11.5, fontWeight: 700, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {matchFilter && (
        <div style={{ background: colors.pendingBg, border: `1px solid ${colors.pendingText}`, borderRadius: 10, padding: "9px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.pendingText }}>
            {matchFilter === "all" && "Total Matching Profiles / மொத்த பொருத்தமான விவரங்கள்"}
            {matchFilter === "high" && "High Compatibility (90%+) / அதிக பொருத்தம்"}
            {matchFilter === "medium" && "Medium Compatibility (50–89%) / நடுத்தர பொருத்தம்"}
            {matchFilter === "low" && "Low Compatibility (<50%) / குறைந்த பொருத்தம்"}
            {matchFilter === "verified" && "Verified Profiles / சரிபார்க்கப்பட்ட விவரங்கள்"}
            {matchFilter === "shortlisted" && "My Shortlisted Profiles / விருப்பப் பட்டியல்"}
            {matchFilter === "new" && "New Members — Last 30 Days / கடந்த 30 நாட்களில் புதிய உறுப்பினர்கள்"}
            {matchFilter === "active" && "Recently Active — Last 7 Days / கடந்த 7 நாட்களில் செயலில் இருந்தவர்கள்"}
            {matchFilter === "nearby" && "Nearby Matches — Same City/District / அருகிலுள்ள பொருத்தங்கள்"}
          </div>
          <button onClick={() => onNavigate("browse")} style={{ border: "none", background: "transparent", color: colors.primary, fontWeight: 800, cursor: "pointer", fontSize: 12 }}>
            Clear / நீக்கு
          </button>
        </div>
      )}

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
            <DropdownFilter value={ageMin} onChange={setAgeMin} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} placeholder="Min age / குறைந்த வயது" />
            <DropdownFilter value={ageMax} onChange={setAgeMax} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} placeholder="Max age / அதிக வயது" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <DropdownFilter value={subCasteFilter} onChange={setSubCasteFilter} options={subCasteOptions} placeholder="Sub caste / உட்பிரிவு" />
            <DropdownFilter value={stateFilter} onChange={setStateFilter} options={stateOptions} placeholder="State / மாநிலம்" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <DropdownFilter value={districtFilter} onChange={setDistrictFilter} options={districtOptions} placeholder="District / மாவட்டம்" />
            <DropdownFilter value={cityFilter} onChange={setCityFilter} options={cityOptions} placeholder="City / ஊர்" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={educationFilter} onChange={e => setEducationFilter(e.target.value)} placeholder="Education / கல்வி" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13 }} />
            <input value={occupationFilter} onChange={e => setOccupationFilter(e.target.value)} placeholder="Occupation / வேலை" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={incomeFilter} onChange={e => setIncomeFilter(e.target.value)} placeholder="Income / வருமானம்" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13 }} />
            <DropdownFilter value={starFilter} onChange={setStarFilter} options={starOptions} placeholder="Star / நட்சத்திரம்" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <DropdownFilter value={rasiFilter} onChange={setRasiFilter} options={rasiOptions} placeholder="Rasi / ராசி" />
            <DropdownFilter value={dietFilter} onChange={setDietFilter} options={["Vegetarian", "Non-Vegetarian", "Eggetarian"]} placeholder="Diet / உணவு" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <DropdownFilter value={smokingFilter} onChange={setSmokingFilter} options={["No", "Occasionally", "Yes"]} placeholder="Smoking / புகை" />
            <DropdownFilter value={drinkingFilter} onChange={setDrinkingFilter} options={["No", "Occasionally", "Yes"]} placeholder="Drinking / மது" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <DropdownFilter value={motherTongueFilter} onChange={setMotherTongueFilter} options={motherTongueOptions} placeholder="Mother tongue / தாய்மொழி" />
            <DropdownFilter value={familyTypeFilter} onChange={setFamilyTypeFilter} options={["Nuclear", "Joint"]} placeholder="Family type / குடும்பம்" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <DropdownFilter value={heightMin} onChange={setHeightMin} options={Array.from({ length: 19 }, (_, i) => String((4 * 12 + 10 + i)))} placeholder="Min height" />
            <DropdownFilter value={heightMax} onChange={setHeightMax} options={Array.from({ length: 19 }, (_, i) => String((5 * 12 + 2 + i)))} placeholder="Max height" />
            <DropdownFilter value={complexionFilter} onChange={setComplexionFilter} options={["Very Fair", "Fair", "Wheatish", "Dusky", "Dark"]} placeholder="Complexion" />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: colors.text }}><input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} /> Verified profiles only / சரிபார்க்கப்பட்டவர்கள் மட்டும்</label>
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
                  <div className="serif" style={{ fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 5 }}>{p.name}{p.is_verified && <span title="Verified profile" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "sans-serif", fontSize: 9.5, fontWeight: 800, color: colors.approvedText }}><BadgeCheck size={13} /> Verified</span>}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{p.occupation || "—"} · Location hidden · {p.age} yrs</div>
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
                  <div className="serif" style={{ fontWeight: 700, fontSize: 16.5, display: "flex", alignItems: "center", gap: 6 }}>{p.name}{p.is_verified && <span title="Verified profile" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "sans-serif", fontSize: 9.5, fontWeight: 800, color: colors.approvedText, whiteSpace: "nowrap" }}><BadgeCheck size={14} /> Verified</span>}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {match && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                        background: match.percentage >= 90 ? colors.approvedBg : match.percentage >= 50 ? colors.pendingBg : colors.rejectedBg,
                        color: match.percentage >= 90 ? colors.approvedText : match.percentage >= 50 ? colors.pendingText : colors.rejectedText,
                      }}>{match.percentage}% match</span>
                    )}
                    <div style={{ fontSize: 12.5, color: colors.textFaint }}>{p.age} yrs</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{p.occupation || "—"} · Location hidden</div>
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

// V9.2 MatchDetails available: render <MatchDetails score={matchScore} breakdown={breakdown} tamil={true} /> where match details are shown.
