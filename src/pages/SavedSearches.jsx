import React, { useEffect, useState } from "react";
import { Bookmark, Trash2, Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fetchSavedSearches, deleteSavedSearch, createSavedSearch } from "../data/queries";
import { PrimaryButton, TextField } from "../components/ui";

export default function SavedSearches({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() { if (!userId) return; setLoading(true); const { data } = await fetchSavedSearches(userId); setItems(data || []); setLoading(false); }
  useEffect(() => { load(); }, [userId]);
  async function add() {
    if (!name.trim()) return;
    const { error } = await createSavedSearch({ userId, name: name.trim(), filters: { createdFrom: "browse" } });
    if (error) { showToast?.("Could not save search"); return; }
    setName(""); load(); showToast?.("Search saved");
  }
  async function remove(id) { await deleteSavedSearch(id, userId); load(); }
  if (!userId) return <div style={{ padding: 40, textAlign: "center" }}>Please login first.</div>;
  return <div>
    <h2 className="serif" style={{ fontSize: 20 }}>Saved Searches / சேமித்த தேடல்கள்</h2>
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
      <TextField label="Search name / தேடல் பெயர்" value={name} onChange={setName} placeholder="My Chennai matches" />
      <PrimaryButton onClick={add}><Bookmark size={15} style={{ verticalAlign: "middle", marginRight: 6 }} /> Save current search</PrimaryButton>
      <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 8 }}>This gives you a place to keep future advanced-search presets. More filter fields can be attached to each saved search.</div>
    </div>
    {loading ? <div style={{ padding: 30, textAlign: "center" }}>Loading…</div> : items.length === 0 ? <Empty colors={colors} /> : items.map(s => <div key={s.id} style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 13, display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}><Search size={16} color={colors.primary} /><div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 13.5 }}>{s.name}</div><div style={{ fontSize: 10.5, color: colors.textFaint }}>Saved {new Date(s.created_at).toLocaleDateString()}</div></div><button onClick={() => remove(s.id)} style={{ border: 0, background: "transparent", color: colors.rejectedText }}><Trash2 size={15} /></button></div>)}
  </div>;
}
function Empty({ colors }) { return <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 30, textAlign: "center", color: colors.textFaint }}>No saved searches yet.</div>; }
