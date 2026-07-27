import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Avatar } from "../components/ui";
import { fetchApprovedProfiles } from "../data/queries";

export default function Browse({ onNavigate, setSelectedProfileId }) {
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState("Any");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [religionFilter, setReligionFilter] = useState("");

  useEffect(() => {
    fetchApprovedProfiles().then(({ data }) => { setProfiles(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.name} ${p.city} ${p.occupation} ${p.caste}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (genderFilter !== "Any" && p.gender !== genderFilter) return false;
      if (ageMin && p.age < Number(ageMin)) return false;
      if (ageMax && p.age > Number(ageMax)) return false;
      if (cityFilter && !p.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (religionFilter && !p.religion?.toLowerCase().includes(religionFilter.toLowerCase())) return false;
      return true;
    });
  }, [profiles, search, genderFilter, ageMin, ageMax, cityFilter, religionFilter]);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 12 }}>Browse profiles</h2>

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
            {["Any", "Male", "Female"].map(g => (
              <button key={g} onClick={() => setGenderFilter(g)} style={{
                flex: 1, padding: "7px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                border: `1px solid ${genderFilter === g ? colors.primary : colors.cardBorder}`,
                background: genderFilter === g ? colors.primary : "transparent",
                color: genderFilter === g ? colors.primaryText : colors.textMuted,
              }}>{g}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input placeholder="Min age" value={ageMin} onChange={e => setAgeMin(e.target.value)} type="number" style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.text, fontSize: 13,
            }} />
            <input placeholder="Max age" value={ageMax} onChange={e => setAgeMax(e.target.value)} type="number" style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.text, fontSize: 13,
            }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="City" value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.text, fontSize: 13,
            }} />
            <input placeholder="Religion" value={religionFilter} onChange={e => setReligionFilter(e.target.value)} style={{
              flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.text, fontSize: 13,
            }} />
          </div>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 10 }}>{filtered.length} profiles found</div>

      {loading && <div style={{ textAlign: "center", color: colors.textFaint, padding: 30 }}>Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
          <Users size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: colors.text }}>No profiles match your search</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(p => (
          <div key={p.id} onClick={() => { setSelectedProfileId(p.id); onNavigate("profileDetails"); }} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14,
            display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer",
          }}>
            <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div className="serif" style={{ fontWeight: 700, fontSize: 16.5 }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: colors.textFaint }}>{p.age} yrs</div>
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{p.occupation || "—"} · {p.city}</div>
              <div style={{ fontSize: 12.5, color: colors.textFaint, marginTop: 2 }}>{p.religion} · {p.caste} · {p.mother_tongue}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
