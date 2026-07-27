import { useState, useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, Badge } from "../components/ui";
import { fetchRequestsFor, fetchAllProfiles, respondToRequest } from "../data/queries";

export default function InterestRequests({ onNavigate, setSelectedProfileId, showToast }) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: reqs }, { data: profs }] = await Promise.all([
      fetchRequestsFor(userId),
      fetchAllProfiles(),
    ]);
    setRequests(reqs);
    setProfiles(profs);
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);

  async function handleRespond(reqId, accept) {
    const { error } = await respondToRequest(reqId, accept);
    if (error) { showToast("Could not update request"); return; }
    showToast(accept ? "Request accepted" : "Request declined");
    load();
  }

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  const incoming = requests.filter(r => r.to_id === userId);
  const outgoing = requests.filter(r => r.from_id === userId);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Interest Requests</h2>

      <h3 style={{ fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>Received ({incoming.length})</h3>
      {incoming.length === 0 && <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>No requests yet.</div>}
      {incoming.map(r => {
        const p = profiles.find(x => x.id === r.from_id);
        if (!p) return null;
        return (
          <div key={r.id} onClick={() => { setSelectedProfileId(p.id); onNavigate("profileDetails"); }} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 12,
            marginBottom: 8, display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }}>
            <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: colors.textFaint }}>{p.city} · {p.age} yrs</div>
            </div>
            {r.status === "pending" ? (
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => handleRespond(r.id, true)} style={{ background: colors.approvedBg, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={16} color={colors.approvedText} />
                </button>
                <button onClick={() => handleRespond(r.id, false)} style={{ background: colors.rejectedBg, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} color={colors.rejectedText} />
                </button>
              </div>
            ) : (
              <Badge tone={r.status === "accepted" ? "approved" : "rejected"}>{r.status}</Badge>
            )}
          </div>
        );
      })}

      <h3 style={{ fontSize: 14, color: colors.textMuted, margin: "18px 0 8px" }}>Sent ({outgoing.length})</h3>
      {outgoing.length === 0 && <div style={{ fontSize: 13, color: colors.textFaint }}>You haven't sent any requests yet.</div>}
      {outgoing.map(r => {
        const p = profiles.find(x => x.id === r.to_id);
        if (!p) return null;
        return (
          <div key={r.id} onClick={() => { setSelectedProfileId(p.id); onNavigate("profileDetails"); }} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 12,
            marginBottom: 8, display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }}>
            <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: colors.textFaint }}>{p.city} · {p.age} yrs</div>
            </div>
            <Badge tone={r.status === "accepted" ? "approved" : r.status === "declined" ? "rejected" : "pending"}>
              {r.status === "pending" ? "waiting" : r.status}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
