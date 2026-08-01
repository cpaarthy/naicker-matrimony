import { useState, useEffect, useCallback } from "react";
import {
  Phone, ShieldCheck, Users, Heart, Mail, BarChart3, Trash2, Pencil, User, UserRound,
  ListChecks, Plus, X, Download, Power, History, CheckSquare, Square, Reply, Check, Flag, Megaphone,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Avatar, Badge } from "../components/ui";
import {
  fetchAllProfiles, updateProfileStatus, deleteProfile,
  fetchAllRequests, fetchContactMessages, upsertProfile,
  fetchMasterList, addMasterListValue, deleteMasterListValue,
  bulkUpdateProfileStatus, bulkDeleteProfiles, setProfileDeactivated,
  resolveContactMessage, replyToContactMessage, logAdminAction, fetchActivityLog,
  fetchProfileReports, updateReportStatus,
  fetchAllAnnouncements, createAnnouncement, setAnnouncementActive, deleteAnnouncement,
} from "../data/queries";
import { exportToCsv } from "../utils/exportCsv";

const ADMIN_PIN = "Naik@1998!";

const TABS = [
  { key: "stats", label: "Overview", icon: BarChart3 },
  { key: "pending", label: "Pending", icon: ShieldCheck },
  { key: "all", label: "All Profiles", icon: Users },
  { key: "requests", label: "Requests", icon: Heart },
  { key: "contact", label: "Messages", icon: Mail },
  { key: "reports", label: "Reports", icon: Flag },
  { key: "announce", label: "Announcement", icon: Megaphone },
  { key: "lists", label: "Lists", icon: ListChecks },
  { key: "log", label: "Activity Log", icon: History },
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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: profs }, { data: reqs }, { data: msgs }, { data: reps }] = await Promise.all([
      fetchAllProfiles(), fetchAllRequests(), fetchContactMessages(), fetchProfileReports(),
    ]);
    setProfiles(profs);
    setRequests(reqs);
    setMessages(msgs);
    setReports(reps);
    setLoading(false);
  }, []);

  useEffect(() => { if (unlocked) loadAll(); }, [unlocked, loadAll]);

  async function handleStatus(id, status) {
    const p = profiles.find(x => x.id === id);
    await updateProfileStatus(id, status);
    await logAdminAction({ action: status, targetType: "profile", targetId: id, targetName: p?.name });
    showToast(`Profile ${status}`);
    loadAll();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete profile "${name}"? This cannot be undone.`)) return;
    const { error } = await deleteProfile(id);
    if (error) { showToast("Could not delete profile"); return; }
    await logAdminAction({ action: "delete", targetType: "profile", targetId: id, targetName: name });
    showToast("Profile deleted");
    loadAll();
  }

  async function handleToggleActive(p) {
    const newVal = !p.admin_deactivated;
    const { error } = await setProfileDeactivated(p.id, newVal);
    if (error) { showToast("Could not update account"); return; }
    await logAdminAction({
      action: newVal ? "deactivate" : "activate", targetType: "profile", targetId: p.id, targetName: p.name,
    });
    showToast(newVal ? "Account deactivated" : "Account activated");
    loadAll();
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllPending(pendingList) {
    setSelectedIds(new Set(pendingList.map(p => p.id)));
  }

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await bulkUpdateProfileStatus(ids, "approved");
    await logAdminAction({ action: "bulk_approve", targetType: "profile", details: `${ids.length} profiles` });
    showToast(`${ids.length} profiles approved`);
    setSelectedIds(new Set());
    loadAll();
  }

  async function handleBulkReject() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await bulkUpdateProfileStatus(ids, "rejected");
    await logAdminAction({ action: "bulk_reject", targetType: "profile", details: `${ids.length} profiles` });
    showToast(`${ids.length} profiles rejected`);
    setSelectedIds(new Set());
    loadAll();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected profiles? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    await bulkDeleteProfiles(ids);
    await logAdminAction({ action: "bulk_delete", targetType: "profile", details: `${ids.length} profiles` });
    showToast(`${ids.length} profiles deleted`);
    setSelectedIds(new Set());
    loadAll();
  }

  function handleExportCsv() {
    const rows = profiles.map(p => ({
      name: p.name, gender: p.gender, age: p.age, phone: p.phone, city: p.city, district: p.district,
      state: p.state, caste: p.caste, sub_caste: p.sub_caste, occupation: p.occupation,
      status: p.status, admin_deactivated: p.admin_deactivated, created_at: p.created_at,
    }));
    exportToCsv(`naicker-matrimony-profiles-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    logAdminAction({ action: "export", targetType: "profile", details: `${rows.length} profiles exported` });
    showToast("CSV downloaded");
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
          placeholder="Enter admin password"
          style={{
            width: "100%", maxWidth: 260, padding: "11px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
            fontSize: 15, background: colors.inputBg, color: colors.text, marginBottom: 10, textAlign: "center",
          }}
        />
        {pinError && <div style={{ color: colors.rejectedText, fontSize: 12.5, marginBottom: 10 }}>{pinError}</div>}
        <button onClick={() => { if (pin === ADMIN_PIN) setUnlocked(true); else setPinError("Incorrect password"); }} style={{
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
        onSaved={() => {
          logAdminAction({ action: "edit", targetType: "profile", targetId: editingProfile.id, targetName: editingProfile.name });
          setEditingProfile(null); loadAll(); showToast("Profile updated");
        }}
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
  const unresolvedMessages = messages.filter(m => !m.resolved);
  const openReports = reports.filter(r => r.status === "open");

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Admin Dashboard</h2>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedIds(new Set()); }} style={{
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
          <button onClick={handleExportCsv} style={{
            display: "flex", alignItems: "center", gap: 6, background: colors.primary, color: colors.primaryText,
            border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13, marginBottom: 14,
          }}>
            <Download size={14} /> Export all profiles (CSV)
          </button>
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
            <StatCard label="Unresolved messages" value={unresolvedMessages.length} colors={colors} tone="pending" />
            <StatCard label="Open reports" value={openReports.length} colors={colors} tone="pending" />
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div>
          {pending.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => selectAllPending(pending)} style={{
                fontSize: 12, background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 7,
                padding: "6px 10px", color: colors.textMuted, display: "flex", alignItems: "center", gap: 5,
              }}>
                <CheckSquare size={13} /> Select all
              </button>
              {selectedIds.size > 0 && (
                <>
                  <span style={{ fontSize: 12, color: colors.textFaint }}>{selectedIds.size} selected</span>
                  <button onClick={handleBulkApprove} style={{
                    fontSize: 12, background: colors.approvedText, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
                  }}>Approve selected</button>
                  <button onClick={handleBulkReject} style={{
                    fontSize: 12, background: colors.rejectedText, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
                  }}>Reject selected</button>
                  <button onClick={handleBulkDelete} style={{
                    fontSize: 12, background: "transparent", color: colors.rejectedText, border: `1px solid ${colors.rejectedText}`, borderRadius: 7, padding: "6px 10px", fontWeight: 700,
                  }}>Delete selected</button>
                </>
              )}
            </div>
          )}

          {pending.length === 0 && (
            <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No pending profiles.</div>
          )}
          {pending.map(p => (
            <div key={p.id} style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <button onClick={() => toggleSelect(p.id)} style={{ background: "none", border: "none", padding: 2, marginTop: 2 }}>
                  {selectedIds.has(p.id) ? <CheckSquare size={18} color={colors.primary} /> : <Square size={18} color={colors.textFaint} />}
                </button>
                <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} />
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontWeight: 700, fontSize: 16 }}>
                    {p.name}, {p.age}
                    {p.profile_for && p.profile_for !== "Self" && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: colors.textFaint, marginLeft: 6 }}>(for {p.profile_for})</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: colors.textMuted }}>{p.gender} · {p.occupation || "—"} · {p.city}</div>
                  <div style={{ fontSize: 12.5, color: colors.textFaint }}>{p.religion} · {p.caste}{p.sub_caste ? ` (${p.sub_caste})` : ""} · {p.education}</div>
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
              display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${colors.cardBorder}`, flexWrap: "wrap",
            }}>
              <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: colors.textFaint }}>{p.city} · {p.phone}</div>
              </div>
              <Badge tone={p.status === "approved" ? "approved" : p.status === "rejected" ? "rejected" : "pending"}>{p.status}</Badge>
              {p.admin_deactivated && <Badge tone="rejected">inactive</Badge>}
              <button onClick={() => handleToggleActive(p)} title={p.admin_deactivated ? "Activate account" : "Deactivate account"} style={{
                background: p.admin_deactivated ? colors.approvedBg : colors.pendingBg, border: "none", borderRadius: 7, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Power size={13} color={p.admin_deactivated ? colors.approvedText : colors.pendingText} />
              </button>
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
        <ContactMessagesTab
          messages={messages}
          colors={colors}
          showToast={showToast}
          onReload={loadAll}
        />
      )}

      {tab === "reports" && (
        <ReportsTab
          reports={reports}
          profiles={profiles}
          colors={colors}
          showToast={showToast}
          onReload={loadAll}
        />
      )}

      {tab === "announce" && <AnnouncementManager colors={colors} showToast={showToast} />}

      {tab === "lists" && <MasterListsManager colors={colors} />}

      {tab === "log" && <ActivityLogTab colors={colors} />}
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
    ["profile_for", "Profile For"], ["name", "Full name"], ["age", "Age"], ["height", "Height"], ["religion", "Religion"],
    ["caste", "Caste"], ["sub_caste", "Sub caste"], ["education", "Education"], ["occupation", "Occupation"],
    ["income", "Income"], ["address", "Address"], ["district", "District"], ["city", "City"], ["state", "State"],
    ["mother_tongue", "Mother tongue"], ["phone", "Phone"],
    ["father_occupation", "Father's occupation"], ["mother_occupation", "Mother's occupation"],
    ["siblings", "Siblings"], ["family_type", "Family type"],
    ["star", "Star"], ["rasi", "Rasi"], ["birth_time", "Birth time"], ["birth_place", "Birth place"],
    ["complexion", "Complexion"], ["body_type", "Body type"], ["blood_group", "Blood group"],
    ["diet", "Diet"], ["smoking", "Smoking"], ["drinking", "Drinking"],
    ["pref_age_min", "Preferred age (min)"], ["pref_age_max", "Preferred age (max)"],
    ["pref_education", "Preferred education"], ["pref_occupation", "Preferred occupation"],
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

function ContactMessagesTab({ messages, colors, showToast, onReload }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  async function handleResolve(id, resolved) {
    await resolveContactMessage(id, resolved);
    await logAdminAction({ action: resolved ? "resolve_message" : "reopen_message", targetType: "contact_message", targetId: id });
    showToast(resolved ? "Marked as resolved" : "Marked as unresolved");
    onReload();
  }

  async function handleReply(id) {
    if (!replyText.trim()) return;
    await replyToContactMessage(id, replyText.trim());
    await logAdminAction({ action: "reply_message", targetType: "contact_message", targetId: id });
    showToast("Reply saved");
    setReplyingTo(null);
    setReplyText("");
    onReload();
  }

  if (messages.length === 0) return <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No messages yet.</div>;

  return (
    <div>
      {messages.map(m => (
        <div key={m.id} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{m.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Badge tone={m.resolved ? "approved" : "pending"}>{m.resolved ? "resolved" : "open"}</Badge>
              <div style={{ fontSize: 11, color: colors.textFaint }}>{new Date(m.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>{m.email}</div>
          <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, marginBottom: 8 }}>{m.message}</div>

          {m.admin_reply && (
            <div style={{ background: colors.pendingBg, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, color: colors.pendingText, marginBottom: 8 }}>
              <b>Your reply:</b> {m.admin_reply}
            </div>
          )}

          {replyingTo === m.id ? (
            <div>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={2}
                placeholder="Type your reply..."
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
                  fontSize: 13, background: colors.inputBg, color: colors.text, marginBottom: 6, boxSizing: "border-box", resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => handleReply(m.id)} style={{
                  fontSize: 12, background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 7, padding: "6px 12px", fontWeight: 700,
                }}>Send reply</button>
                <button onClick={() => { setReplyingTo(null); setReplyText(""); }} style={{
                  fontSize: 12, background: "transparent", border: `1px solid ${colors.inputBorder}`, borderRadius: 7, padding: "6px 12px", color: colors.text,
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setReplyingTo(m.id)} style={{
                fontSize: 12, background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 7, padding: "6px 10px",
                color: colors.textMuted, display: "flex", alignItems: "center", gap: 4,
              }}><Reply size={12} /> Reply</button>
              <button onClick={() => handleResolve(m.id, !m.resolved)} style={{
                fontSize: 12, background: m.resolved ? colors.pendingBg : colors.approvedBg,
                border: "none", borderRadius: 7, padding: "6px 10px",
                color: m.resolved ? colors.pendingText : colors.approvedText, display: "flex", alignItems: "center", gap: 4,
              }}><Check size={12} /> {m.resolved ? "Reopen" : "Mark resolved"}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReportsTab({ reports, profiles, colors, showToast, onReload }) {
  async function handleStatusChange(id, status) {
    await updateReportStatus(id, status);
    await logAdminAction({ action: status === "reviewed" ? "review_report" : "dismiss_report", targetType: "report", targetId: id });
    showToast(`Report marked as ${status}`);
    onReload();
  }

  if (reports.length === 0) return <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No reports yet.</div>;

  return (
    <div>
      {reports.map(r => {
        const reporter = profiles.find(p => p.id === r.reporter_id);
        const reported = profiles.find(p => p.id === r.reported_id);
        return (
          <div key={r.id} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.reason}</div>
              <Badge tone={r.status === "reviewed" ? "approved" : r.status === "dismissed" ? "rejected" : "pending"}>{r.status}</Badge>
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
              Reported by <b>{reporter?.name || "Unknown"}</b> against <b>{reported?.name || "Unknown"}</b>
            </div>
            {r.details && <div style={{ fontSize: 12.5, color: colors.text, marginBottom: 8 }}>{r.details}</div>}
            <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>{new Date(r.created_at).toLocaleString()}</div>
            {r.status === "open" && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => handleStatusChange(r.id, "reviewed")} style={{
                  fontSize: 12, background: colors.approvedText, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
                }}>Mark reviewed</button>
                <button onClick={() => handleStatusChange(r.id, "dismissed")} style={{
                  fontSize: 12, background: "transparent", color: colors.textMuted, border: `1px solid ${colors.cardBorder}`, borderRadius: 7, padding: "6px 10px",
                }}>Dismiss</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActivityLogTab({ colors }) {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityLog().then(({ data }) => { setLog(data); setLoading(false); });
  }, []);

  const actionLabels = {
    approved: "Approved", rejected: "Rejected", delete: "Deleted", edit: "Edited",
    reply_message: "Replied to message", resolve_message: "Resolved message", reopen_message: "Reopened message",
    reset_password: "Reset password", deactivate: "Deactivated account", activate: "Activated account",
    bulk_approve: "Bulk approved", bulk_reject: "Bulk rejected", bulk_delete: "Bulk deleted", export: "Exported data",
  };

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 30 }}>Loading…</div>;
  if (log.length === 0) return <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No activity yet.</div>;

  return (
    <div>
      <p style={{ fontSize: 12, color: colors.textFaint, marginBottom: 12 }}>Showing the most recent 200 admin actions.</p>
      {log.map(entry => (
        <div key={entry.id} style={{
          padding: "9px 0", borderBottom: `1px solid ${colors.cardBorder}`, display: "flex", justifyContent: "space-between", gap: 8,
        }}>
          <div style={{ fontSize: 12.5, color: colors.text }}>
            <b>{actionLabels[entry.action] || entry.action}</b>
            {entry.target_name && <span style={{ color: colors.textMuted }}> — {entry.target_name}</span>}
            {entry.details && <div style={{ fontSize: 11.5, color: colors.textFaint }}>{entry.details}</div>}
          </div>
          <div style={{ fontSize: 11, color: colors.textFaint, whiteSpace: "nowrap" }}>
            {new Date(entry.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnnouncementManager({ colors, showToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await fetchAllAnnouncements();
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!message.trim()) { showToast("Enter an announcement message"); return; }
    setSaving(true);
    const { error } = await createAnnouncement({
      message: message.trim(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    setSaving(false);
    if (error) { showToast("Could not create announcement"); return; }
    await logAdminAction({ action: "create_announcement", targetType: "announcement", details: message.trim() });
    setMessage("");
    setExpiresAt("");
    showToast("Announcement posted");
    load();
  }

  async function handleToggleActive(a) {
    await setAnnouncementActive(a.id, !a.active);
    await logAdminAction({ action: a.active ? "deactivate_announcement" : "activate_announcement", targetType: "announcement", targetId: a.id });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    await logAdminAction({ action: "delete_announcement", targetType: "announcement", targetId: id });
    showToast("Announcement deleted");
    load();
  }

  function isExpired(a) {
    return a.expires_at && new Date(a.expires_at) < new Date();
  }

  return (
    <div>
      <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 14 }}>
        Post a banner that appears at the top of every page for all visitors. / அனைத்து பயனர்களுக்கும் தலைப்பில் தோன்றும் அறிவிப்பு.
      </p>

      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Message</span>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            placeholder="e.g. Site maintenance on Sunday 10 PM - 11 PM"
            style={{
              width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              fontSize: 14, background: colors.inputBg, color: colors.text, resize: "vertical", boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 14 }}>
          <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Expires on (optional)</span>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            style={{
              width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              fontSize: 14, background: colors.inputBg, color: colors.text, boxSizing: "border-box",
            }}
          />
        </label>
        <button onClick={handleCreate} disabled={saving} style={{
          width: "100%", background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px", fontWeight: 700, fontSize: 14, opacity: saving ? 0.6 : 1,
        }}>{saving ? "Posting…" : "Post announcement"}</button>
      </div>

      <h3 style={{ fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>All announcements</h3>
      {loading ? (
        <div style={{ textAlign: "center", color: colors.textFaint, padding: 20 }}>Loading…</div>
      ) : announcements.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textFaint, textAlign: "center", padding: 20 }}>No announcements yet.</div>
      ) : (
        announcements.map(a => (
          <div key={a.id} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 12, marginBottom: 8,
          }}>
            <div style={{ fontSize: 13, color: colors.text, marginBottom: 6 }}>{a.message}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <Badge tone={a.active && !isExpired(a) ? "approved" : "rejected"}>
                {isExpired(a) ? "expired" : a.active ? "active" : "inactive"}
              </Badge>
              {a.expires_at && (
                <span style={{ fontSize: 11, color: colors.textFaint }}>
                  Expires: {new Date(a.expires_at).toLocaleString()}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => handleToggleActive(a)} style={{
                fontSize: 12, background: a.active ? colors.pendingBg : colors.approvedBg,
                color: a.active ? colors.pendingText : colors.approvedText,
                border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
              }}>{a.active ? "Deactivate" : "Activate"}</button>
              <button onClick={() => handleDelete(a.id)} style={{
                fontSize: 12, background: colors.rejectedBg, color: colors.rejectedText,
                border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
              }}>Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MasterListsManager({ colors }) {
  const LIST_TYPES = [
    { key: "sub_caste", label: "Sub Caste / உட்பிரிவு" },
    { key: "city", label: "City / ஊர்" },
    { key: "district", label: "District / மாவட்டம்" },
    { key: "state", label: "State / மாநிலம்" },
  ];
  const [activeList, setActiveList] = useState("sub_caste");
  const [items, setItems] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await fetchMasterList(activeList);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeList]);

  async function handleAdd() {
    if (!newValue.trim()) return;
    const { error } = await addMasterListValue(activeList, newValue.trim());
    if (!error) { setNewValue(""); load(); }
  }

  async function handleDelete(id) {
    await deleteMasterListValue(id);
    load();
  }

  return (
    <div>
      <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 14 }}>
        Manage dropdown options shown to members when they fill their profile. / உறுப்பினர்கள் பதிவு செய்யும்போது தோன்றும் விருப்பங்களை இங்கே நிர்வகிக்கலாம்.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
        {LIST_TYPES.map(lt => (
          <button key={lt.key} onClick={() => setActiveList(lt.key)} style={{
            padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            background: activeList === lt.key ? colors.primary : colors.card,
            color: activeList === lt.key ? colors.primaryText : colors.textMuted,
            border: `1px solid ${activeList === lt.key ? colors.primary : colors.cardBorder}`,
          }}>{lt.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Add new value..."
          style={{
            flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
            fontSize: 14, background: colors.inputBg, color: colors.text,
          }}
        />
        <button onClick={handleAdd} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          width: 40, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Plus size={18} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: colors.textFaint, padding: 20 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textFaint, textAlign: "center", padding: 20 }}>No values yet. Add one above.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 6, background: colors.card,
              border: `1px solid ${colors.cardBorder}`, borderRadius: 20, padding: "6px 8px 6px 12px", fontSize: 13,
            }}>
              {item.value}
              <button onClick={() => handleDelete(item.id)} style={{
                background: colors.rejectedBg, border: "none", borderRadius: "50%", width: 18, height: 18,
                display: "flex", alignItems: "center", justifyContent: "center", color: colors.rejectedText,
              }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
