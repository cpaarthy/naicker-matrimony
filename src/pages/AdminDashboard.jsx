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
    if (!window.confirm(`Delete ${selectedIds.size} profiles? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    await bulkDeleteProfiles(ids);
    await logAdminAction({ action: "bulk_delete", targetType: "profile", details: `${ids.length} profiles` });
    showToast(`${ids.length} profiles deleted`);
    setSelectedIds(new Set());
    loadAll();
  }

  async function handleExportCsv() {
    const { data } = await fetchAllProfiles();
    const rows = data.map(p => ({
      name: p.name, age: p.age, gender: p.gender, city: p.city, district: p.district,
      state: p.state, phone: p.phone, occupation: p.occupation, education: p.education,
      caste: p.caste, sub_caste: p.sub_caste, status: p.status, created_at: p.created_at,
    }));
    exportToCsv(rows, "naicker-matrimony-profiles.csv");
    showToast("CSV exported");
  }

  async function handleFullBackup() {
    setBackingUp(true);
    const { data } = await fetchFullBackup();
    downloadJson(data, `naicker-matrimony-backup-${new Date().toISOString().split('T')[0]}.json`);
    setBackingUp(false);
    showToast("Backup downloaded");
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
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <button onClick={selectAllPending} style={{
                fontSize: 12, background: colors.card, color: colors.text, border: `1px solid ${colors.cardBorder}`,
                borderRadius: 7, padding: "6px 10px", fontWeight: 700,
              }}>Select all</button>
              <button onClick={handleBulkApprove} style={{
                fontSize: 12, background: colors.approvedText, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
              }}>Approve selected</button>
              <button onClick={handleBulkReject} style={{
                fontSize: 12, background: colors.rejectedText, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
              }}>Reject selected</button>
              <button onClick={handleBulkDelete} style={{
                fontSize: 12, background: "transparent", color: colors.rejectedText, border: `1px solid ${colors.cardBorder}`, borderRadius: 7, padding: "6px 10px",
              }}>Delete selected</button>
            </div>
          )}
          {pending.length === 0 && <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No pending profiles.</div>}
          {pending.map(p => (
            <div key={p.id} onClick={() => setDetailProfile(p)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: `1px solid ${colors.cardBorder}`,
              flexWrap: "wrap", cursor: "pointer",
            }}>
              <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: colors.textFaint }}>{p.city} · {p.phone}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleStatus(p.id, "approved"); }} style={{
                background: colors.approvedBg, border: "none", borderRadius: 7, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Check size={13} color={colors.approvedText} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleStatus(p.id, "rejected"); }} style={{
                background: colors.rejectedBg, border: "none", borderRadius: 7, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <X size={13} color={colors.rejectedText} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "all" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <input
              placeholder="Search by name, city, phone..."
              value={allProfilesSearch}
              onChange={e => setAllProfilesSearch(e.target.value)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`,
                fontSize: 13, background: colors.inputBg, color: colors.text,
              }}
            />
            <select
              value={allProfilesStatusFilter}
              onChange={e => setAllProfilesStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`,
                fontSize: 13, background: colors.inputBg, color: colors.text,
              }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {profiles
            .filter(p => {
              const searchLower = allProfilesSearch.toLowerCase();
              return !allProfilesSearch ||
                p.name?.toLowerCase().includes(searchLower) ||
                p.city?.toLowerCase().includes(searchLower) ||
                p.phone?.includes(searchLower);
            })
            .filter(p => allProfilesStatusFilter === "all" || p.status === allProfilesStatusFilter)
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
                <div style={{ fontSize: 11, color: colors.textFaint }}>{new Date(r.created_at).toLocaleString()}</div>
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

      {tab === "porutham" && <PoruthamTab colors={colors} profiles={profiles} showToast={showToast} />}

      {tab === "lists" && <MasterListsTab colors={colors} showToast={showToast} />}

      {tab === "log" && <ActivityLogTab colors={colors} />}
    </div>
  );
}

function StatCard({ label, value, colors, tone, icon: Icon }) {
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        {Icon && <Icon size={16} color={tone === "approved" ? colors.approvedText : tone === "rejected" ? colors.rejectedText : tone === "pending" ? colors.pendingText : colors.text} />}
        <div style={{ fontSize: 11, color: colors.textMuted }}>{label}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: tone === "approved" ? colors.approvedText : tone === "rejected" ? colors.rejectedText : tone === "pending" ? colors.pendingText : colors.text }}>{value}</div>
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
  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Analytics Tab</h3>
      <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
        Analytics feature is currently under development.
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
      created_at: entry.created_at,
    }));
    exportToCsv(rows, "admin-activity-log.csv");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Activity Log</h3>
        <button onClick={handleExport} style={{
          fontSize: 12, background: colors.card, color: colors.text, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 7, padding: "6px 10px", fontWeight: 700,
        }}>Export CSV</button>
      </div>
      {log.length === 0 && <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>No activity logged yet.</div>}
      {log.map(entry => (
        <div key={entry.id} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 8, padding: 10, marginBottom: 6,
          fontSize: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{actionLabels[entry.action] || entry.action}</span>
            <span style={{ color: colors.textFaint, fontSize: 11 }}>{new Date(entry.created_at).toLocaleString()}</span>
          </div>
          {entry.target_name && <div style={{ color: colors.textMuted }}>{entry.target_type}: {entry.target_name}</div>}
          {entry.details && <div style={{ color: colors.textFaint, fontSize: 11 }}>{entry.details}</div>}
        </div>
      ))}
    </div>
  );
}

function ContactMessagesTab({ messages, colors, showToast, onReload }) {
  async function handleReply(id, reply) {
    const replyText = prompt("Enter your reply:");
    if (!replyText) return;
    await replyToContactMessage(id, replyText);
    showToast("Reply sent");
    onReload();
  }

  async function handleResolve(id) {
    await resolveContactMessage(id, true);
    showToast("Message resolved");
    onReload();
  }

  return (
    <div>
      {messages.length === 0 && <div style={{ fontSize: 13.5, color: colors.textFaint, textAlign: "center", padding: 30 }}>No messages yet.</div>}
      {messages.map(m => (
        <div key={m.id} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name}</div>
            <Badge tone={m.resolved ? "approved" : "pending"}>{m.resolved ? "Resolved" : "Open"}</Badge>
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>{m.email}</div>
          <div style={{ fontSize: 12.5, color: colors.text, marginBottom: 8 }}>{m.message}</div>
          {m.admin_reply && (
            <div style={{ background: colors.approvedBg, padding: 8, borderRadius: 6, marginBottom: 8, fontSize: 12 }}>
              <b>Admin reply:</b> {m.admin_reply}
            </div>
          )}
          <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>{new Date(m.created_at).toLocaleString()}</div>
          {!m.resolved && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => handleReply(m.id)} style={{
                fontSize: 12, background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
              }}>Reply</button>
              <button onClick={() => handleResolve(m.id)} style={{
                fontSize: 12, background: colors.approvedText, color: "#fff", border: "none", borderRadius: 7, padding: "6px 10px", fontWeight: 700,
              }}>Mark resolved</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AnnouncementManager({ colors, showToast }) {
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchAllAnnouncements().then(({ data }) => setAnnouncements(data || []));
  }, []);

  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    const expires = expiresAt ? new Date(expiresAt).toISOString() : null;
    await createAnnouncement({ message, expiresAt: expires });
    showToast("Announcement created");
    setMessage("");
    setExpiresAt("");
    setLoading(false);
    fetchAllAnnouncements().then(({ data }) => setAnnouncements(data || []));
  }

  async function toggleActive(id, active) {
    await setAnnouncementActive(id, active);
    showToast(`Announcement ${active ? "activated" : "deactivated"}`);
    fetchAllAnnouncements().then(({ data }) => setAnnouncements(data || []));
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    showToast("Announcement deleted");
    fetchAllAnnouncements().then(({ data }) => setAnnouncements(data || []));
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Create Announcement</h3>
      <textarea
        placeholder="Announcement message (shows as banner on all pages)"
        value={message}
        onChange={e => setMessage(e.target.value)}
        style={{
          width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
          fontSize: 13, background: colors.inputBg, color: colors.text, minHeight: 80, marginBottom: 8,
        }}
      />
      <input
        type="datetime-local"
        value={expiresAt}
        onChange={e => setExpiresAt(e.target.value)}
        placeholder="Expiry date (optional)"
        style={{
          width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
          fontSize: 13, background: colors.inputBg, color: colors.text, marginBottom: 8,
        }}
      />
      <button onClick={handleSubmit} disabled={loading} style={{
        background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
        padding: "10px 20px", fontWeight: 700, fontSize: 13, opacity: loading ? 0.6 : 1,
      }}>
        {loading ? "Creating…" : "Create Announcement"}
      </button>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, marginTop: 20 }}>Past Announcements</h3>
      {announcements.length === 0 && <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>No announcements yet.</div>}
      {announcements.map(a => (
        <div key={a.id} style={{
          background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 8, padding: 12, marginBottom: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 13 }}>{a.message}</div>
            <Badge tone={a.active ? "approved" : "pending"}>{a.active ? "Active" : "Inactive"}</Badge>
          </div>
          <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 8 }}>
            Created: {new Date(a.created_at).toLocaleString()}
            {a.expires_at && ` • Expires: ${new Date(a.expires_at).toLocaleString()}`}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => toggleActive(a.id, !a.active)} style={{
              fontSize: 11, background: colors.card, color: colors.text, border: `1px solid ${colors.cardBorder}`,
              borderRadius: 6, padding: "4px 8px",
            }}>{a.active ? "Deactivate" : "Activate"}</button>
            <button onClick={() => handleDelete(a.id)} style={{
              fontSize: 11, background: colors.rejectedBg, color: colors.rejectedText, border: "none",
              borderRadius: 6, padding: "4px 8px",
            }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PoruthamTab({ colors, profiles, showToast }) {
  const [profileAId, setProfileAId] = useState("");
  const [profileBId, setProfileBId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function checkPorutham() {
    if (!profileAId || !profileBId) return;
    setLoading(true);
    const profileA = profiles.find(p => p.id === profileAId);
    const profileB = profiles.find(p => p.id === profileBId);
    if (!profileA || !profileB) {
      showToast("Profile not found");
      setLoading(false);
      return;
    }
    const calculated = calculatePorutham(profileA, profileB);
    setResult({ profileA, profileB, calculated });
    setLoading(false);
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Porutham Check</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <select
          value={profileAId}
          onChange={e => setProfileAId(e.target.value)}
          style={{ padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text }}
        >
          <option value="">Select first profile</option>
          {profiles.filter(p => p.status === "approved").map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.gender}, {p.age})</option>
          ))}
        </select>
        <select
          value={profileBId}
          onChange={e => setProfileBId(e.target.value)}
          style={{ padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text }}
        >
          <option value="">Select second profile</option>
          {profiles.filter(p => p.status === "approved").map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.gender}, {p.age})</option>
          ))}
        </select>
      </div>
      <button onClick={checkPorutham} disabled={loading} style={{
        background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
        padding: "10px 20px", fontWeight: 700, fontSize: 13, opacity: loading ? 0.6 : 1, marginBottom: 16,
      }}>
        {loading ? "Checking…" : "Check Porutham"}
      </button>
      {result && (
        <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              {result.profileA.name} + {result.profileA.gender === "Male" ? "♂" : "♀"}
            </div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {result.profileB.name} + {result.profileB.gender === "Male" ? "♂" : "♀"}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Calculated Porutham: {result.calculated.verdict}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12 }}>
            {result.calculated.matches.map((m, i) => (
              <div key={i} style={{ padding: "4px 8px", borderRadius: 4, background: m.matched ? colors.approvedBg : colors.rejectedBg, color: m.matched ? colors.approvedText : colors.rejectedText }}>
                {m.name}: {m.matched ? "Match" : "No match"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MasterListsTab({ colors, showToast }) {
  const [listType, setListType] = useState("sub_caste");
  const [newValue, setNewValue] = useState("");
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadValues();
  }, [listType]);

  async function loadValues() {
    setLoading(true);
    const { data } = await fetchMasterList(listType);
    setValues(data?.map(d => d.value) || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newValue.trim()) return;
    await addMasterListValue(listType, newValue);
    showToast("Value added");
    setNewValue("");
    loadValues();
  }

  async function handleDelete(value) {
    const item = values.find(v => v === value);
    if (!item) return;
    const id = values.indexOf(item);
    await deleteMasterListValue(id);
    showToast("Value deleted");
    loadValues();
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Master Lists</h3>
      <select
        value={listType}
        onChange={e => setListType(e.target.value)}
        style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text, marginBottom: 12 }}
      >
        <option value="sub_caste">Sub caste</option>
        <option value="city">City</option>
        <option value="district">District</option>
        <option value="state">State</option>
      </select>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Add new value"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          style={{ flex: 1, padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text }}
        />
        <button onClick={handleAdd} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 7,
          padding: "8px 16px", fontWeight: 700, fontSize: 13,
        }}>Add</button>
      </div>
      {loading ? <div style={{ fontSize: 12, color: colors.textFaint }}>Loading…</div> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {values.map(v => (
            <div key={v} style={{
              background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 20,
              padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6,
            }}>
              {v}
              <button onClick={() => handleDelete(v)} style={{ background: "none", border: "none", color: colors.rejectedText, cursor: "pointer", padding: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
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

function Section({ title, colors, children }) {
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function AdminEditProfile({ profile, colors, onCancel, onSaved }) {
  const [form, setForm] = useState({ ...profile });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await upsertProfile(form);
    onSaved();
  }

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div>
      <button onClick={onCancel} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0,
      }}>← Cancel</button>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Edit Profile</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <TextField label="Name" value={form.name} onChange={v => handleChange("name", v)} />
        <TextField label="Age" type="number" value={form.age} onChange={v => handleChange("age", v)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <TextField label="City" value={form.city} onChange={v => handleChange("city", v)} />
        <TextField label="District" value={form.district} onChange={v => handleChange("district", v)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <TextField label="State" value={form.state} onChange={v => handleChange("state", v)} />
        <TextField label="Phone" value={form.phone} onChange={v => handleChange("phone", v)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <TextField label="Education" value={form.education} onChange={v => handleChange("education", v)} />
        <TextField label="Occupation" value={form.occupation} onChange={v => handleChange("occupation", v)} />
      </div>

      <TextField label="About" value={form.about} onChange={v => handleChange("about", v)} multiline style={{ minHeight: 80 }} />

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={handleSave} disabled={loading} style={{
          flex: 1, background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px", fontWeight: 700, fontSize: 13, opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button onClick={onCancel} style={{
          flex: 1, background: colors.card, color: colors.text, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13,
        }}>Cancel</button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", multiline = false, style = {} }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text, ...style }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text, ...style }}
        />
      )}
    </div>
  );
}
