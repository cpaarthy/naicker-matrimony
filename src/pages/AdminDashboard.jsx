import { useState, useEffect, useCallback } from "react";
import {
  Phone, ShieldCheck, Users, Heart, Mail, BarChart3, Trash2, Pencil, User, UserRound,
  ListChecks, Plus, X, Download, Power, History, CheckSquare, Square, Reply, Check, Flag, Megaphone, Star,
  Database as DatabaseIcon, Camera, MapPin, Eye, Briefcase, BookOpen,
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
  createNotification,
  fetchPoruthamReviews, savePoruthamReview, deletePoruthamReview,
  fetchFullBackup,
  fetchProfileCompletionReport, fetchPhotoStatistics, fetchDistrictAnalysis,
  fetchAgeDistribution, fetchResponseRateAnalysis, fetchMostViewedProfiles,
  fetchOccupationAnalysis, fetchEducationAnalysis,
} from "../data/queries";
import { calculatePorutham, isHoroscopeDataAvailable } from "../utils/porutham";
import { BarChart, DonutChart } from "../components/AdminCharts";
import { exportToCsv } from "../utils/exportCsv";
import { downloadJson } from "../utils/downloadJson";
import { calculateMatchScore } from "../utils/matchScore";

const ADMIN_PIN = "Naik@1998!";

const TABS = [
  { key: "stats", label: "Overview", icon: BarChart3 },
  { key: "pending", label: "Pending", icon: ShieldCheck },
  { key: "all", label: "All Profiles", icon: Users },
  { key: "requests", label: "Requests", icon: Heart },
  { key: "contact", label: "Messages", icon: Mail },
  { key: "reports", label: "Reports", icon: Flag },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "announce", label: "Announcement", icon: Megaphone },
  { key: "porutham", label: "Porutham Check", icon: Star },
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
  const [allProfilesSearch, setAllProfilesSearch] = useState("");
  const [allProfilesStatusFilter, setAllProfilesStatusFilter] = useState("all");
  const [detailProfile, setDetailProfile] = useState(null);
  const [backingUp, setBackingUp] = useState(false);

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
    const wasAlreadyApproved = p?.status === "approved";
    await updateProfileStatus(id, status);
    await logAdminAction({ action: status, targetType: "profile", targetId: id, targetName: p?.name });

    if (status === "approved" && p && !wasAlreadyApproved) {
      await notifyMatchesForNewProfile(p);
    }

    showToast(`Profile ${status}`);
    loadAll();
  }

  async function notifyMatchesForNewProfile(newProfile) {
    // Notify existing approved, opposite-gender members whose match score with this
    // newly-approved profile is 25% or higher.
    const opposingGender = newProfile.gender === "Male" ? "Female" : newProfile.gender === "Female" ? "Male" : null;
    if (!opposingGender) return;
    const candidates = profiles.filter(x => x.status === "approved" && x.gender === opposingGender && x.id !== newProfile.id);
    for (const candidate of candidates) {
      const result = calculateMatchScore(candidate, newProfile);
      if (result && result.percentage >= 25) {
        await createNotification({
          userId: candidate.id,
          type: "new_match",
          relatedProfileId: newProfile.id,
          message: `New match found! ${newProfile.name} is a ${result.percentage}% match for you.`,
        });
      }
    }
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
    const newlyApproved = profiles.filter(p => ids.includes(p.id) && p.status !== "approved");
    await bulkUpdateProfileStatus(ids, "approved");
    await logAdminAction({ action: "bulk_approve", targetType: "profile", details: `${ids.length} profiles` });
    for (const p of newlyApproved) {
      await notifyMatchesForNewProfile(p);
    }
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

  async function handleFullBackup() {
    setBackingUp(true);
    const backup = await fetchFullBackup();
    setBackingUp(false);
    downloadJson(`naicker-matrimony-backup-${new Date().toISOString().slice(0, 10)}.json`, backup);
    const totalRows = Object.values(backup.tables).reduce((sum, rows) => sum + rows.length, 0);
    await logAdminAction({ action: "full_backup", targetType: "database", details: `${totalRows} rows across ${Object.keys(backup.tables).length} tables` });
    if (backup.errors.length > 0) {
      showToast(`Backup downloaded with ${backup.errors.length} table(s) skipped due to errors`);
    } else {
      showToast("Full backup downloaded");
    }
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

  if (detailProfile) {
    return (
      <AdminProfileDetail
        profile={detailProfile}
        profiles={profiles}
        requests={requests}
        reports={reports}
        colors={colors}
        onBack={() => setDetailProfile(null)}
        onEdit={(p) => { setDetailProfile(null); setEditingProfile(p); }}
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

  // Registrations per day, last 14 days
  const registrationsByDay = (() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    return days.map(day => {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const count = profiles.filter(p => {
        const created = new Date(p.created_at);
        return created >= day && created < next;
      }).length;
      return { label: `${day.getDate()}/${day.getMonth() + 1}`, value: count };
    });
  })();

  // Active vs inactive (based on last_active_at within 30 days)
  const now = Date.now();
  const activeUsers = profiles.filter(p => p.last_active_at && (now - new Date(p.last_active_at).getTime()) < 30 * 24 * 60 * 60 * 1000);
  const inactiveUsers = profiles.filter(p => !p.last_active_at || (now - new Date(p.last_active_at).getTime()) >= 30 * 24 * 60 * 60 * 1000);
  const veryInactiveUsers = profiles.filter(p => p.last_active_at && (now - new Date(p.last_active_at).getTime()) >= 150 * 24 * 60 * 60 * 1000);


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
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={handleExportCsv} style={{
              display: "flex", alignItems: "center", gap: 6, background: colors.primary, color: colors.primaryText,
              border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13,
            }}>
              <Download size={14} /> Export all profiles (CSV)
            </button>
            <button onClick={handleFullBackup} disabled={backingUp} style={{
              display: "flex", alignItems: "center", gap: 6, background: colors.card, color: colors.text,
              border: `1px solid ${colors.cardBorder}`, borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 13,
              opacity: backingUp ? 0.6 : 1,
            }}>
              <DatabaseIcon size={14} /> {backingUp ? "Backing up…" : "Backup full database (JSON)"}
            </button>
          </div>
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

          <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>
              Registrations — last 14 days
            </div>
            <BarChart data={registrationsByDay} colors={colors} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>Gender ratio</div>
              <DonutChart
                colors={colors}
                size={110}
                segments={[
                  { label: "Male", value: male.length, color: "#1f4d3d" },
                  { label: "Female", value: female.length, color: "#7a1f3d" },
                ]}
              />
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>Status split</div>
              <DonutChart
                colors={colors}
                size={110}
                segments={[
                  { label: "Approved", value: approved.length, color: colors.approvedText },
                  { label: "Pending", value: pending.length, color: colors.pendingText },
                  { label: "Rejected", value: rejected.length, color: colors.rejectedText },
                ]}
              />
            </div>
          </div>

          <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>User engagement</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: colors.approvedText, fontFamily: "'Playfair Display', Georgia, serif" }}>{activeUsers.length}</div>
                <div style={{ fontSize: 10.5, color: colors.textFaint }}>Active (30 days)</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: colors.pendingText, fontFamily: "'Playfair Display', Georgia, serif" }}>{inactiveUsers.length}</div>
                <div style={{ fontSize: 10.5, color: colors.textFaint }}>Inactive (30+ days)</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: colors.rejectedText, fontFamily: "'Playfair Display', Georgia, serif" }}>{veryInactiveUsers.length}</div>
                <div style={{ fontSize: 10.5, color: colors.textFaint }}>Inactive (150+ days)</div>
              </div>
            </div>
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
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={allProfilesSearch}
              onChange={e => setAllProfilesSearch(e.target.value)}
              placeholder="Search by name, city, phone…"
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
                fontSize: 13, background: colors.inputBg, color: colors.text,
              }}
            />
            <select value={allProfilesStatusFilter} onChange={e => setAllProfilesStatusFilter(e.target.value)} style={{
              padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              fontSize: 13, background: colors.inputBg, color: colors.text,
            }}>
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {profiles
            .filter(p => {
              if (allProfilesStatusFilter !== "all" && p.status !== allProfilesStatusFilter) return false;
              if (allProfilesSearch) {
                const q = allProfilesSearch.toLowerCase();
                const hay = `${p.name} ${p.city} ${p.phone} ${p.district} ${p.state}`.toLowerCase();
                if (!hay.includes(q)) return false;
              }
              return true;
            })
            .map(p => (
            <div key={p.id} onClick={() => setDetailProfile(p)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${colors.cardBorder}`,
              flexWrap: "wrap", cursor: "pointer",
            }}>
              <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: colors.textFaint }}>{p.city} · {p.phone}</div>
              </div>
              <Badge tone={p.status === "approved" ? "approved" : p.status === "rejected" ? "rejected" : "pending"}>{p.status}</Badge>
              {p.admin_deactivated && <Badge tone="rejected">inactive</Badge>}
              <button onClick={(e) => { e.stopPropagation(); handleToggleActive(p); }} title={p.admin_deactivated ? "Activate account" : "Deactivate account"} style={{
                background: p.admin_deactivated ? colors.approvedBg : colors.pendingBg, border: "none", borderRadius: 7, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Power size={13} color={p.admin_deactivated ? colors.approvedText : colors.pendingText} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setEditingProfile(p); }} style={{
                background: colors.pendingBg, border: "none", borderRadius: 7, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Pencil size={13} color={colors.pendingText} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }} style={{
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

      {tab === "analytics" && (
        <AnalyticsTab
          colors={colors}
          showToast={showToast}
        />
      )}

      {tab === "announce" && <AnnouncementManager colors={colors} showToast={showToast} />}

      {tab === "porutham" && <PoruthamCheckManager profiles={profiles} colors={colors} showToast={showToast} />}

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

function AdminProfileDetail({ profile, profiles, requests, reports, colors, onBack, onEdit }) {
  const incoming = requests.filter(r => r.to_id === profile.id);
  const outgoing = requests.filter(r => r.from_id === profile.id);
  const reportsAgainst = reports.filter(r => r.reported_id === profile.id);
  const reportsBy = reports.filter(r => r.reporter_id === profile.id);

  const FIELDS = [
    ["Age", profile.age], ["Gender", profile.gender], ["Height", profile.height],
    ["Religion", profile.religion], ["Caste", profile.caste], ["Sub caste", profile.sub_caste],
    ["Education", profile.education], ["Occupation", profile.occupation], ["Income", profile.income],
    ["Address", profile.address], ["District", profile.district], ["City", profile.city], ["State", profile.state],
    ["Mother tongue", profile.mother_tongue], ["Phone", profile.phone],
    ["Father's occupation", profile.father_occupation], ["Mother's occupation", profile.mother_occupation],
    ["Siblings", profile.siblings], ["Family type", profile.family_type],
    ["Star", profile.star], ["Rasi", profile.rasi], ["Birth time", profile.birth_time], ["Birth place", profile.birth_place],
    ["Complexion", profile.complexion], ["Body type", profile.body_type], ["Blood group", profile.blood_group],
    ["Diet", profile.diet], ["Smoking", profile.smoking], ["Drinking", profile.drinking],
  ].filter(([, v]) => v);

  return (
    <div>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0,
      }}>← Back to All Profiles</button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Avatar name={profile.name} gender={profile.gender} photoUrl={profile.photo_url} size={56} />
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontWeight: 700, fontSize: 18 }}>{profile.name}</div>
          <div style={{ fontSize: 12.5, color: colors.textFaint }}>{profile.city} · {profile.age} yrs</div>
        </div>
        <Badge tone={profile.status === "approved" ? "approved" : profile.status === "rejected" ? "rejected" : "pending"}>{profile.status}</Badge>
      </div>

      {profile.admin_deactivated && (
        <div style={{ background: colors.rejectedBg, color: colors.rejectedText, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, marginBottom: 14, fontWeight: 700 }}>
          Account deactivated by admin
        </div>
      )}

      <button onClick={() => onEdit(profile)} style={{
        width: "100%", background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
        padding: "10px", fontWeight: 700, fontSize: 13.5, marginBottom: 16,
      }}>Edit this profile</button>

      <Section title="Profile Details" colors={colors}>
        {FIELDS.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5, borderBottom: `1px solid ${colors.cardBorder}` }}>
            <span style={{ color: colors.textFaint }}>{label}</span>
            <span style={{ color: colors.text, fontWeight: 600, textAlign: "right" }}>{value}</span>
          </div>
        ))}
        {profile.about && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: colors.text }}>
            <b>About:</b> {profile.about}
          </div>
        )}
      </Section>

      <Section title={`Interest requests received (${incoming.length})`} colors={colors}>
        {incoming.length === 0 && <div style={{ fontSize: 12, color: colors.textFaint }}>None</div>}
        {incoming.map(r => {
          const p = profiles.find(x => x.id === r.from_id);
          return (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}>
              <span style={{ color: colors.text }}>{p?.name || "Unknown"}</span>
              <Badge tone={r.status === "accepted" ? "approved" : r.status === "declined" ? "rejected" : "pending"}>{r.status}</Badge>
            </div>
          );
        })}
      </Section>

      <Section title={`Interest requests sent (${outgoing.length})`} colors={colors}>
        {outgoing.length === 0 && <div style={{ fontSize: 12, color: colors.textFaint }}>None</div>}
        {outgoing.map(r => {
          const p = profiles.find(x => x.id === r.to_id);
          return (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}>
              <span style={{ color: colors.text }}>{p?.name || "Unknown"}</span>
              <Badge tone={r.status === "accepted" ? "approved" : r.status === "declined" ? "rejected" : "pending"}>{r.status}</Badge>
            </div>
          );
        })}
      </Section>

      {(reportsAgainst.length > 0 || reportsBy.length > 0) && (
        <Section title="Reports" colors={colors}>
          {reportsAgainst.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, color: colors.textFaint, fontWeight: 700, marginBottom: 4 }}>Reported by others ({reportsAgainst.length})</div>
              {reportsAgainst.map(r => (
                <div key={r.id} style={{ fontSize: 12, color: colors.text, padding: "3px 0" }}>{r.reason} — {r.status}</div>
              ))}
            </div>
          )}
          {reportsBy.length > 0 && (
            <div>
              <div style={{ fontSize: 11.5, color: colors.textFaint, fontWeight: 700, marginBottom: 4 }}>Reports filed by this user ({reportsBy.length})</div>
              {reportsBy.map(r => (
                <div key={r.id} style={{ fontSize: 12, color: colors.text, padding: "3px 0" }}>{r.reason} — {r.status}</div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, colors }) {
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.primary, marginBottom: 8 }}>{title}</div>
      {children}
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

function AnalyticsTab({ colors, showToast }) {
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState("profile_completion");
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const REPORTS = [
    { key: "profile_completion", label: "Profile Completion", icon: User },
    { key: "photo_stats", label: "Photo Statistics", icon: Camera },
    { key: "district_analysis", label: "District Analysis", icon: MapPin },
    { key: "age_distribution", label: "Age Distribution", icon: BarChart3 },
    { key: "response_rate", label: "Response Rate", icon: Heart },
    { key: "most_viewed", label: "Most Viewed Profiles", icon: Eye },
    { key: "occupation_analysis", label: "Occupation Analysis", icon: Briefcase },
    { key: "education_analysis", label: "Education Analysis", icon: BookOpen },
  ];

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReport]);

  async function loadReport() {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      let result;
      switch (currentReport) {
        case "profile_completion":
          result = await fetchProfileCompletionReport();
          break;
        case "photo_stats":
          result = await fetchPhotoStatistics();
          break;
        case "district_analysis":
          result = await fetchDistrictAnalysis();
          break;
        case "age_distribution":
          result = await fetchAgeDistribution();
          break;
        case "response_rate":
          result = await fetchResponseRateAnalysis();
          break;
        case "most_viewed":
          result = await fetchMostViewedProfiles(20);
          break;
        case "occupation_analysis":
          result = await fetchOccupationAnalysis();
          break;
        case "education_analysis":
          result = await fetchEducationAnalysis();
          break;
        default:
          result = { data: null, error: null };
      }

      console.log("Report result:", result);
      setReportData(result.data);
      if (result.error) {
        setError(result.error);
        showToast(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Error loading report:", err);
      setError(err.message);
      showToast("Error loading analytics data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading analytics…</div>;

  if (error) {
    return (
      <div>
        <div style={{ textAlign: "center", color: colors.rejectedText, padding: 40 }}>
          Error: {error}
        </div>
        <button onClick={loadReport} style={{
          display: "block", margin: "0 auto", background: colors.primary, color: colors.primaryText,
          border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {REPORTS.map(r => {
          const Icon = r.icon;
          const active = currentReport === r.key;
          return (
            <button key={r.key} onClick={() => { setCurrentReport(r.key); }} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8,
              fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
              background: active ? colors.primary : colors.card,
              color: active ? colors.primaryText : colors.textMuted,
              border: `1px solid ${active ? colors.primary : colors.cardBorder}`,
            }}>
              <Icon size={13} /> {r.label}
            </button>
          );
        })}
      </div>

      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16 }}>
        {currentReport === "profile_completion" && <ProfileCompletionReport data={reportData} colors={colors} />}
        {currentReport === "photo_stats" && <PhotoStatisticsReport data={reportData} colors={colors} />}
        {currentReport === "district_analysis" && <DistrictAnalysisReport data={reportData} colors={colors} />}
        {currentReport === "age_distribution" && <AgeDistributionReport data={reportData} colors={colors} />}
        {currentReport === "response_rate" && <ResponseRateReport data={reportData} colors={colors} />}
        {currentReport === "most_viewed" && <MostViewedReport data={reportData} colors={colors} />}
        {currentReport === "occupation_analysis" && <OccupationAnalysisReport data={reportData} colors={colors} />}
        {currentReport === "education_analysis" && <EducationAnalysisReport data={reportData} colors={colors} />}
        {!reportData && !loading && !error && (
          <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
            No data available for this report
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCompletionReport({ data, colors }) {
  console.log("ProfileCompletionReport data:", data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Profile Completion Report</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No profile data available
        </div>
      </div>
    );
  }

  // Filter out invalid data
  const validData = data.filter(d => d && typeof d === 'object' && d.total_percentage !== undefined);

  if (validData.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Profile Completion Report</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No valid profile data available
        </div>
      </div>
    );
  }

  const total = validData.length;
  const highCompletion = validData.filter(d => d.total_percentage >= 80).length;
  const mediumCompletion = validData.filter(d => d.total_percentage >= 50 && d.total_percentage < 80).length;
  const lowCompletion = validData.filter(d => d.total_percentage < 50).length;

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Profile Completion Report</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: colors.approvedBg, padding: 12, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.approvedText }}>{highCompletion}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>High (80%+)</div>
        </div>
        <div style={{ background: colors.pendingBg, padding: 12, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.pendingText }}>{mediumCompletion}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Medium (50-79%)</div>
        </div>
        <div style={{ background: colors.rejectedBg, padding: 12, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.rejectedText }}>{lowCompletion}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Low (&lt;50%)</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 8 }}>Top 5 least complete profiles:</div>
      {validData.slice(0, 5).map((d, index) => (
        <div key={d.id || index} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.cardBorder}`, fontSize: 12.5 }}>
          <span>{d.name || 'Unknown'}</span>
          <span style={{ fontWeight: 600 }}>{d.total_percentage || 0}%</span>
        </div>
      ))}
    </div>
  );
}

function PhotoStatisticsReport({ data, colors }) {
  if (!data || data.total === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Photo Statistics</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No photo data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Photo Statistics</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: colors.card, padding: 12, borderRadius: 8, textAlign: "center", border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{data.with_photo || 0}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>With Photo ({data.with_photo_percentage || 0}%)</div>
        </div>
        <div style={{ background: colors.card, padding: 12, borderRadius: 8, textAlign: "center", border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{data.without_photo || 0}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Without Photo</div>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>By Gender:</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: colors.textMuted }}>Male: </span>
          {data.by_gender?.male_with_photo || 0} with / {data.by_gender?.male_without_photo || 0} without
        </div>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: colors.textMuted }}>Female: </span>
          {data.by_gender?.female_with_photo || 0} with / {data.by_gender?.female_without_photo || 0} without
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>By Status:</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: colors.textMuted }}>Approved: </span>
          {data.by_status?.approved_with_photo || 0} with / {data.by_status?.approved_without_photo || 0} without
        </div>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: colors.textMuted }}>Pending: </span>
          {data.by_status?.pending_with_photo || 0} with / {data.by_status?.pending_without_photo || 0} without
        </div>
      </div>
    </div>
  );
}

function DistrictAnalysisReport({ data, colors }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>District-wise Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No district data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>District-wise Analysis</h3>
      <div>
        {data.slice(0, 10).map(d => (
          <div key={d.district} style={{
            background: colors.card, padding: 12, borderRadius: 8, marginBottom: 8, border: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{d.district}</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total} profiles</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
              <div><span style={{ color: colors.approvedText }}>{d.approved}</span> approved</div>
              <div><span style={{ color: colors.pendingText }}>{d.pending}</span> pending</div>
              <div>Male: {d.male} / Female: {d.female}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgeDistributionReport({ data, colors }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Age Distribution</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No age data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Age Distribution</h3>
      {data.map(d => (
        <div key={d.group} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{d.group}</span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total} profiles</span>
          </div>
          <div style={{
            height: 8, background: colors.cardBorder, borderRadius: 4, overflow: "hidden", marginBottom: 4
          }}>
            <div style={{
              height: "100%", background: colors.primary, width: `${Math.min(d.total * 2, 100)}%`
            }} />
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            Male: {d.male} | Female: {d.female} | Approved: {d.approved}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResponseRateReport({ data, colors }) {
  if (!data || data.total_requests === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Response Rate Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No request data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Response Rate Analysis</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: colors.card, padding: 12, borderRadius: 8, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Total Requests</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.text }}>{data.total_requests}</div>
        </div>
        <div style={{ background: colors.card, padding: 12, borderRadius: 8, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Acceptance Rate</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.approvedText }}>{data.acceptance_rate}%</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: colors.approvedBg, padding: 10, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.approvedText }}>{data.accepted}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Accepted</div>
        </div>
        <div style={{ background: colors.rejectedBg, padding: 10, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.rejectedText }}>{data.declined}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Declined</div>
        </div>
        <div style={{ background: colors.pendingBg, padding: 10, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.pendingText }}>{data.pending}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Pending</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted }}>
        Average response time: ~{data.average_response_days} days
      </div>
    </div>
  );
}

function MostViewedReport({ data, colors }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Most Viewed Profiles (Top 20)</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No view data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Most Viewed Profiles (Top 20)</h3>
      <div>
        {data.map((d, index) => (
          <div key={d.profile_id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: colors.primary, color: colors.primaryText,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700
            }}>
              {index + 1}
            </div>
            {d.profile && (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.profile.name}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{d.profile.city} · {d.profile.age} yrs</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.total_views}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>{d.unique_viewers} unique</div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OccupationAnalysisReport({ data, colors }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Occupation Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No occupation data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Occupation Analysis</h3>
      <div>
        {data.slice(0, 15).map(d => (
          <div key={d.occupation} style={{
            background: colors.card, padding: 12, borderRadius: 8, marginBottom: 8, border: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{d.occupation}</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total} profiles</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
              <div><span style={{ color: colors.approvedText }}>{d.approved}</span> approved</div>
              <div>Male: {d.male} / Female: {d.female}</div>
              <div>Success: {d.success_rate}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EducationAnalysisReport({ data, colors }) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Education Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No education data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Education Analysis</h3>
      <div>
        {data.slice(0, 15).map(d => (
          <div key={d.education} style={{
            background: colors.card, padding: 12, borderRadius: 8, marginBottom: 8, border: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{d.education}</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total} profiles</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
              <div><span style={{ color: colors.approvedText }}>{d.approved}</span> approved</div>
              <div>Male: {d.male} / Female: {d.female}</div>
              <div>Approval: {d.approval_rate}%</div>
            </div>
          </div>
        ))}
      </div>
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
    full_backup: "Downloaded full backup",
  };

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 30 }}>Loading…</div>;

  function handleExport() {
    const rows = log.map(entry => ({
      action: actionLabels[entry.action] || entry.action,
      target_type: entry.target_type,
      target_name: entry.target_name || "",
      details: entry.details || "",
      timestamp: new Date(entry.created_at).toLocaleString(),
    }));
    exportToCsv(`naicker-matrimony-activity-log-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  if (log.length === 0) return <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No activity yet.</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: colors.textFaint, margin: 0 }}>Showing the most recent 200 admin actions.</p>
        <button onClick={handleExport} style={{
          display: "flex", alignItems: "center", gap: 6, background: colors.primary, color: colors.primaryText,
          border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, flexShrink: 0,
        }}>
          <Download size={13} /> Export CSV
        </button>
      </div>
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

function PoruthamCheckManager({ profiles, colors, showToast }) {
  const [profileAId, setProfileAId] = useState("");
  const [profileBId, setProfileBId] = useState("");
  const [notes, setNotes] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const approvedProfiles = profiles.filter(p => p.status === "approved");

  const load = async () => {
    setLoading(true);
    const { data } = await fetchPoruthamReviews();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const profileA = approvedProfiles.find(p => p.id === profileAId);
  const profileB = approvedProfiles.find(p => p.id === profileBId);

  let calcResult = null;
  let horoscopeMissing = false;
  if (profileA && profileB) {
    if (!isHoroscopeDataAvailable(profileA) || !isHoroscopeDataAvailable(profileB)) {
      horoscopeMissing = true;
    } else {
      calcResult = calculatePorutham(profileA, profileB);
    }
  }

  const existingReview = profileA && profileB
    ? reviews.find(r => {
        const pair = [profileAId, profileBId].sort();
        return r.profile_a_id === pair[0] && r.profile_b_id === pair[1];
      })
    : null;

  async function handleSaveVerdict(manualVerdict) {
    if (!profileA || !profileB || !calcResult) return;
    setSaving(true);
    const { error } = await savePoruthamReview({
      profileAId, profileBId,
      calculatedMatchedCount: calcResult.matchedCount,
      calculatedVerdict: calcResult.verdict,
      manualVerdict, notes,
    });
    setSaving(false);
    if (error) { showToast("Could not save review"); return; }
    await logAdminAction({
      action: manualVerdict === "approved" ? "porutham_approved" : "porutham_rejected",
      targetType: "porutham_review", details: `${profileA.name} × ${profileB.name}`,
    });
    // Let both members know an astrologer has reviewed their horoscope match.
    await createNotification({ userId: profileA.id, type: "new_match", relatedProfileId: profileB.id, message: `Astrologer review: your Porutham with ${profileB.name} — ${manualVerdict}.` });
    await createNotification({ userId: profileB.id, type: "new_match", relatedProfileId: profileA.id, message: `Astrologer review: your Porutham with ${profileA.name} — ${manualVerdict}.` });
    showToast(`Marked as ${manualVerdict} by astrologer`);
    setNotes("");
    load();
  }

  async function handleDeleteReview(id) {
    await deletePoruthamReview(id);
    showToast("Review removed");
    load();
  }

  return (
    <div>
      <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 14 }}>
        Select two approved profiles to see the calculated Porutham, then record an
        astrologer's manual verdict. / இரு விவரங்களைத் தேர்ந்தெடுத்து பொருத்தத்தை பார்க்கவும்.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <select value={profileAId} onChange={e => setProfileAId(e.target.value)} style={{
          padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
          fontSize: 13, background: colors.inputBg, color: colors.text,
        }}>
          <option value="">Select profile A…</option>
          {approvedProfiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.gender})</option>)}
        </select>
        <select value={profileBId} onChange={e => setProfileBId(e.target.value)} style={{
          padding: "9px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
          fontSize: 13, background: colors.inputBg, color: colors.text,
        }}>
          <option value="">Select profile B…</option>
          {approvedProfiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.gender})</option>)}
        </select>
      </div>

      {profileA && profileB && profileAId === profileBId && (
        <div style={{ fontSize: 13, color: colors.rejectedText, textAlign: "center", padding: 20 }}>
          Please select two different profiles.
        </div>
      )}

      {profileA && profileB && profileAId !== profileBId && horoscopeMissing && (
        <div style={{ fontSize: 13, color: colors.textFaint, textAlign: "center", padding: 20, background: colors.card, borderRadius: 12, border: `1px solid ${colors.cardBorder}` }}>
          One or both profiles are missing Star/Rasi details.
        </div>
      )}

      {calcResult && profileAId !== profileBId && (
        <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: colors.primary, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {calcResult.matchedCount} / {calcResult.totalCount}
            </div>
            <div style={{ fontSize: 12.5, color: colors.textFaint }}>{calcResult.verdict}</div>
            {calcResult.hasSeriousDosham && (
              <div style={{ fontSize: 11.5, color: colors.rejectedText, marginTop: 4, fontWeight: 700 }}>⚠ Rajju Dosham present</div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            {calcResult.poruthams.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12.5 }}>
                <span style={{ color: colors.textMuted }}>{p.label}</span>
                <span style={{ color: p.matched ? colors.approvedText : colors.rejectedText, fontWeight: 700 }}>{p.matched ? "✓" : "✗"}</span>
              </div>
            ))}
          </div>

          {existingReview && (
            <div style={{ background: colors.pendingBg, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: colors.pendingText, marginBottom: 10 }}>
              Previously reviewed: <b>{existingReview.manual_verdict}</b>
              {existingReview.notes && <div style={{ marginTop: 3 }}>{existingReview.notes}</div>}
            </div>
          )}

          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>Astrologer notes (optional)</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
                fontSize: 13, background: colors.inputBg, color: colors.text, resize: "vertical", boxSizing: "border-box",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleSaveVerdict("approved")} disabled={saving} style={{
              flex: 1, background: colors.approvedText, color: "#fff", border: "none", borderRadius: 8,
              padding: "10px", fontWeight: 700, fontSize: 13.5, opacity: saving ? 0.6 : 1,
            }}>Approved by astrologer</button>
            <button onClick={() => handleSaveVerdict("rejected")} disabled={saving} style={{
              flex: 1, background: colors.rejectedText, color: "#fff", border: "none", borderRadius: 8,
              padding: "10px", fontWeight: 700, fontSize: 13.5, opacity: saving ? 0.6 : 1,
            }}>Rejected</button>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 14, color: colors.textMuted, margin: "20px 0 8px" }}>Past reviews</h3>
      {loading ? (
        <div style={{ textAlign: "center", color: colors.textFaint, padding: 20 }}>Loading…</div>
      ) : reviews.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textFaint, textAlign: "center", padding: 20 }}>No reviews yet.</div>
      ) : (
        reviews.map(r => {
          const pa = profiles.find(p => p.id === r.profile_a_id);
          const pb = profiles.find(p => p.id === r.profile_b_id);
          return (
            <div key={r.id} style={{
              background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 12, marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{pa?.name || "Unknown"} × {pb?.name || "Unknown"}</div>
                <Badge tone={r.manual_verdict === "approved" ? "approved" : "rejected"}>{r.manual_verdict}</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: colors.textFaint, marginBottom: 6 }}>
                System: {r.calculated_matched_count}/10 ({r.calculated_verdict})
              </div>
              {r.notes && <div style={{ fontSize: 12, color: colors.text, marginBottom: 8 }}>{r.notes}</div>}
              <button onClick={() => handleDeleteReview(r.id)} style={{
                fontSize: 11.5, background: colors.rejectedBg, color: colors.rejectedText,
                border: "none", borderRadius: 6, padding: "5px 9px", fontWeight: 700,
              }}>Delete</button>
            </div>
          );
        })
      )}
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
    { key: "star", label: "Star / நட்சத்திரம்" },
    { key: "rasi", label: "Rasi / ராசி" },
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
