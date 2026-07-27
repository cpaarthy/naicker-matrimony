import { useState, useEffect, useCallback } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Avatar, Badge } from "../components/ui";
import { fetchAllProfiles, updateProfileStatus } from "../data/queries";

const ADMIN_PIN = "1998";

export default function AdminDashboard() {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchAllProfiles();
    setProfiles(data);
    setLoading(false);
  }, []);

  useEffect(() => { if (unlocked) load(); }, [unlocked, load]);

  async function handleStatus(id, status) {
    await updateProfileStatus(id, status);
    load();
  }

  if (!unlocked) {
    return (
      <div style={{ textAlign: "center", padding: "30px 16px" }}>
        <ShieldCheck size={30} color={colors.primary} style={{ marginBottom: 10 }} />
        <h2 className="serif" style={{ fontSize: 18, marginBottom: 12 }}>Admin Login</h2>
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setPinError(""); }}
          placeholder="Enter PIN"
          style={{
            width: "100%", maxWidth: 260, padding: "11px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
            fontSize: 15, background: colors.inputBg, color: colors.text, marginBottom: 10, textAlign: "center",
          }}
        />
        {pinError && <div style={{ color: colors.rejectedText, fontSize: 12.5, marginBottom: 10 }}>{pinError}</div>}
        <button onClick={() => { if (pin === ADMIN_PIN) setUnlocked(true); else setPinError("Incorrect PIN"); }} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px 24px", fontWeight: 700, fontSize: 14,
        }}>Enter</button>
      </div>
    );
  }

  const pending = profiles.filter(p => p.status === "pending");

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Admin — Pending Approvals</h2>
      {pending.length === 0 && <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No pending profiles.</div>}

      {pending.map(p => (
        <div key={p.id} style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontWeight: 700, fontSize: 16 }}>{p.name}, {p.age}</div>
              <div style={{ fontSize: 12.5, color: colors.textMuted }}>{p.gender} · {p.occupation || "—"} · {p.city}</div>
              <div style={{ fontSize: 12.5, color: colors.textFaint }}>{p.religion} · {p.caste} · {p.education}</div>
              <div style={{ fontSize: 12.5, color: colors.textFaint, marginTop: 4 }}>
                <Phone size={11} style={{ verticalAlign: -1, marginRight: 4 }} />{p.phone}
              </div>
              {p.about && <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>{p.about}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => handleStatus(p.id, "approved")} style={{
              flex: 1, background: colors.approvedText, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontWeight: 700, fontSize: 13.5,
            }}>Approve</button>
            <button onClick={() => handleStatus(p.id, "rejected")} style={{
              flex: 1, background: colors.rejectedText, color: "#fff", border: "none", borderRadius: 8, padding: "9px", fontWeight: 700, fontSize: 13.5,
            }}>Reject</button>
          </div>
        </div>
      ))}

      <h3 style={{ fontSize: 14, color: colors.textMuted, margin: "20px 0 8px" }}>All profiles ({profiles.length})</h3>
      {profiles.map(p => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${colors.cardBorder}` }}>
          <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: colors.textFaint }}>{p.city}</div>
          </div>
          <Badge tone={p.status === "approved" ? "approved" : p.status === "rejected" ? "rejected" : "pending"}>{p.status}</Badge>
        </div>
      ))}
    </div>
  );
}
