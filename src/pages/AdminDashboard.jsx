import { useState, useEffect, useCallback } from "react";
import { Phone, ShieldCheck, Users, Heart, Mail, BarChart3, Trash2, Pencil, User, UserRound } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Avatar, Badge } from "../components/ui";
import {
  fetchAllProfiles, updateProfileStatus, deleteProfile,
  fetchAllRequests, fetchContactMessages, upsertProfile,
} from "../data/queries";

const ADMIN_PIN = "1998";

const TABS = [
  { key: "stats", label: "Overview", icon: BarChart3 },
  { key: "pending", label: "Pending", icon: ShieldCheck },
  { key: "all", label: "All Profiles", icon: Users },
  { key: "requests", label: "Requests", icon: Heart },
  { key: "contact", label: "Messages", icon: Mail },
];

export default function AdminDashboard({ onNavigate, setSelectedProfileId, showToast }) {
  const { colors } = useTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [tab, setTab] = useState("stats");

  const [profiles, setProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: profs }, { data: reqs }, { data: msgs }] = await Promise.all([
      fetchAllProfiles(), fetchAllRequests(), fetchContactMessages(),
    ]);
    setProfiles(profs);
    setRequests(reqs);
    setMessages(msgs);
    setLoading(false);
  }, []);

  useEffect(() => { if (unlocked) loadAll(); }, [unlocked, loadAll]);

  async function handleStatus(id, status) {
    await updateProfileStatus(id, status);
    showToast(`Profile ${status}`);
    loadAll();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete profile "${name}"? This cannot be undone.`)) return;
    const { error } = await deleteProfile(id);
    if (error) { showToast("Could not delete profile"); return; }
    showToast("Profile deleted");
    loadAll();
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

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  if (editingProfile) {
    return (
      <AdminEditProfile
        profile={editingProfile}
        colors={colors}
        onCancel={() => setEditingProfile(null)}
        onSaved={() => { setEditingProfile(null); loadAll(); showToast("Profile updated"); }}
      />
    );
  }

  const pending = profiles.filter(p => p.status === "pending");
  const approved = profiles.filter(p => p.status === "approved");
  const rejected = profiles.filter(p => p.status === "rejected");
  const male = profiles.filter(p => p.gender === "Male");
  const female = profiles.filter(p => p.gender === "Female");
  const acceptedReqs = requests.filter(r => r.status === "accepted");
  const pendingReqs = requests.filter(r => r.status === "pending");

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Admin Dashboard</h2>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8,
              fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
              background: active ? colors.primary : colors.card,
              color: active ? colors.primaryText : colors.textMuted,
              border: `1px solid ${active ? colors.primary : colors.cardBorder}`,
            }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "stats" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <StatCard label="Total profiles" value={profiles.length} colors={colors} />
            <StatCard label="Pending review" value={pending.length} colors={colors} tone="pending" />
            <StatCard label="Approved" value={approved.length} colors={colors} tone="approved" />
            <StatCard label="Rejected" value={rejected.length} colors={colors} tone="rejected" />
            <StatCard label="Male profiles" value={male.length} colors={colors} icon={User} />
            <StatCard label="Female profiles" value={female.length} colors={colors} icon={UserRound} />
            <StatCard label="Interest requests" value={requests.length} colors={colors} />
            <StatCard label="Matches (accepted)" value={acceptedReqs.length} colors={colors} tone="approved" />
            <StatCard label="Pending requests" value={pendingReqs.length} colors={colors} tone="pending" />
            <StatCard label="Contact messages" value={messages.length} colors={colors} />
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div>
          {pending.length === 0 && (
            <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No pending profiles.</div>
          )}
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
        </div>
      )}

      {tab === "all" && (
        <div>
          {profiles.map(p => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${colors.cardBorder}`,
            }}>
              <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: colors.textFaint }}>{p.city} · {p.phone}</div>
              </div>
              <Badge tone={p.status === "approved" ? "approved" : p.status === "rejected" ? "rejected" : "pending"}>{p.status}</Badge>
              <button onClick={() => setEditingProfile(p)} style={{
                background: colors.pendingBg, border: "none", borderRadius: 7, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Pencil size={13} color={colors.pendingText} />
              </button>
              <button onClick={() => handleDelete(p.id, p.name)} style={{
                background: colors.rejectedBg, border: "none", borderRadius: 7, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Trash2 size={13} color={colors.rejectedText} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "requests" && (
        <div>
          {requests.length === 0 && <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No requests yet.</div>}
          {requests.map(r => {
            const fromP = profiles.find(p => p.id === r.from_id);
            const toP = profiles.find(p => p.id === r.to_id);
            return (
              <div key={r.id} style={{
                background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 12, marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {fromP?.name || "Unknown"} → {toP?.name || "Unknown"}
                  </div>
                  <Badge tone={r.status === "accepted" ? "approved" : r.status === "declined" ? "rejected" : "pending"}>{r.status}</Badge>
                </div>
                <div style={{ fontSize: 11.5, color: colors.textFaint }}>
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "contact" && (
        <div>
          {messages.length === 0 && <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No messages yet.</div>}
          {messages.map(m => (
            <div key={m.id} style={{
              background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: colors.textFaint }}>{new Date(m.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>{m.email}</div>
              <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5 }}>{m.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, colors, tone, icon: Icon }) {
  const toneColors = tone ? {
    pending: colors.pendingText, approved: colors.approvedText, rejected: colors.rejectedText,
  }[tone] : colors.primary;
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14 }}>
      {Icon && <Icon size={16} color={toneColors} style={{ marginBottom: 4 }} />}
      <div style={{ fontSize: 22, fontWeight: 800, color: toneColors, fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function AdminEditProfile({ profile, colors, onCancel, onSaved }) {
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { error } = await upsertProfile({ ...form, age: Number(form.age) });
    setSaving(false);
    if (!error) onSaved();
  }

  const fields = [
    ["name", "Full name"], ["age", "Age"], ["height", "Height"], ["religion", "Religion"],
    ["caste", "Caste"], ["education", "Education"], ["occupation", "Occupation"],
    ["income", "Income"], ["city", "City"], ["state", "State"], ["mother_tongue", "Mother tongue"],
    ["phone", "Phone"],
  ];

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 18, marginBottom: 14 }}>Edit: {profile.name}</h2>
      {fields.map(([key, label]) => (
        <label key={key} style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 4, fontWeight: 600 }}>{label}</span>
          <input
            value={form[key] || ""}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{
              width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              fontSize: 14, background: colors.inputBg, color: colors.text, boxSizing: "border-box",
            }}
          />
        </label>
      ))}
      <label style={{ display: "block", marginBottom: 16 }}>
        <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 4, fontWeight: 600 }}>About</span>
        <textarea
          value={form.about || ""}
          onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
          rows={3}
          style={{
            width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
            fontSize: 14, background: colors.inputBg, color: colors.text, boxSizing: "border-box", resize: "vertical",
          }}
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1, background: "transparent", border: `1px solid ${colors.inputBorder}`, borderRadius: 8,
          padding: "11px", fontSize: 14, color: colors.text,
        }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "11px", fontWeight: 700, fontSize: 14, opacity: saving ? 0.6 : 1,
        }}>{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}
