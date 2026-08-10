import React, { useState, useCallback } from "react";
import {
  Phone, ShieldCheck, BadgeCheck, Users, Heart, Mail, BarChart3, Trash2, Pencil, User, UserRound,
  ListChecks, Plus, X, Download, Power, History, CheckSquare, Square, Reply, Check, Flag, Megaphone, Star,
  Database as DatabaseIcon, Camera, MapPin, Eye, Briefcase, BookOpen,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../supabaseClient";
import { Avatar, Badge } from "../components/ui";
import {
  fetchAllProfiles, updateProfileStatus, deleteProfile, updateProfileByAdmin,
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
  fetchAllVerifications, updateVerificationStatus,
} from "../data/queries";
import { calculatePorutham, isHoroscopeDataAvailable } from "../utils/porutham";
import { BarChart, DonutChart } from "../components/AdminCharts";
import { exportToCsv } from "../utils/exportCsv";
import { downloadJson } from "../utils/downloadJson";
import { calculateMatchScore } from "../utils/matchScore";

const TABS = [
  { key: "stats", label: "Overview", icon: BarChart3 },
  { key: "pending", label: "Pending", icon: ShieldCheck },
  { key: "all", label: "All Profiles", icon: Users },
  { key: "requests", label: "Requests", icon: Heart },
  { key: "contact", label: "Messages", icon: Mail },
  { key: "reports", label: "Reports", icon: Flag },
  { key: "verification", label: "Verification", icon: BadgeCheck },
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
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [allProfilesSearch, setAllProfilesSearch] = useState("");
  const [allProfilesStatusFilter, setAllProfilesStatusFilter] = useState("all");
  const [detailProfile, setDetailProfile] = useState(null);
  const [backingUp, setBackingUp] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const results = await Promise.all([
        fetchAllProfiles(pin),
        fetchAllRequests(),
        fetchContactMessages(),
        fetchProfileReports(),
        fetchAllVerifications(),
      ]);
      const [profileResult, requestResult, messageResult, reportResult, verificationResult] = results;

      if (profileResult?.error) {
        throw new Error(profileResult.error.message || profileResult.error);
      }

      setProfiles(Array.isArray(profileResult?.data) ? profileResult.data : []);
      setRequests(Array.isArray(requestResult?.data) ? requestResult.data : []);
      setMessages(Array.isArray(messageResult?.data) ? messageResult.data : []);
      setReports(Array.isArray(reportResult?.data) ? reportResult.data : []);
      setVerifications(Array.isArray(verificationResult?.data) ? verificationResult.data : []);
    } catch (err) {
      console.error("Admin dashboard load failed:", err);
      setProfiles([]);
      setRequests([]);
      setMessages([]);
      setReports([]);
      setVerifications([]);
      setLoadError(err?.message || "Could not load admin data. Please check the V5 Supabase migration.");
    } finally {
      setLoading(false);
    }
  }, [pin]);

  React.useEffect(() => { if (unlocked) loadAll(); }, [unlocked, loadAll]);

  async function handleStatus(id, status) {
    const p = profiles.find(x => x.id === id);
    const wasAlreadyApproved = p?.status === "approved";
    await updateProfileStatus(id, status, pin);
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
    const { error } = await deleteProfile(id, pin);
    if (error) { showToast("Could not delete profile"); return; }
    await logAdminAction({ action: "delete", targetType: "profile", targetId: id, targetName: name });
    showToast("Profile deleted");
    loadAll();
  }

  async function handleToggleActive(p) {
    const newVal = !p.admin_deactivated;
    const { error } = await setProfileDeactivated(p.id, newVal, pin);
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
    await bulkUpdateProfileStatus(ids, "approved", pin);
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
    await bulkUpdateProfileStatus(ids, "rejected", pin);
    await logAdminAction({ action: "bulk_reject", targetType: "profile", details: `${ids.length} profiles` });
    showToast(`${ids.length} profiles rejected`);
    setSelectedIds(new Set());
    loadAll();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} profiles? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    await bulkDeleteProfiles(ids, pin);
    await logAdminAction({ action: "bulk_delete", targetType: "profile", details: `${ids.length} profiles` });
    showToast(`${ids.length} profiles deleted`);
    setSelectedIds(new Set());
    loadAll();
  }

  async function handleExportCsv() {
    try {
      console.log("Starting CSV export...");
      const { data, error } = await fetchAllProfiles(pin);
      if (error) {
        console.error("Error fetching profiles:", error);
        showToast("Error fetching profiles: " + error);
        return;
      }
      console.log("Fetched profiles:", data?.length);
      const rows = data.map(p => ({
        name: p.name, age: p.age, gender: p.gender, city: p.city, district: p.district,
        state: p.state, phone: p.phone, occupation: p.occupation, education: p.education,
        caste: p.caste, sub_caste: p.sub_caste, status: p.status, created_at: p.created_at,
      }));
      console.log("CSV rows:", rows.length);
      exportToCsv("naicker-matrimony-profiles.csv", rows);
      showToast("CSV exported");
    } catch (err) {
      console.error("CSV export error:", err);
      showToast("CSV export failed: " + err.message);
    }
  }

  async function handleFullBackup() {
    setBackingUp(true);
    const { data } = await fetchFullBackup(pin);
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
        <button onClick={async () => {
          if (!pin) { setPinError("Enter admin password"); return; }
          const { data, error } = await supabase.rpc("is_valid_admin_pin", { p_pin: pin });
          if (!error && data === true) setUnlocked(true);
          else setPinError("Incorrect password");
        }} style={{
          background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px 24px", fontWeight: 700, fontSize: 14,
        }}>Enter</button>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  if (loadError) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <ShieldCheck size={30} color={colors.rejectedText} style={{ marginBottom: 10 }} />
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Admin data could not be loaded</h3>
        <div style={{ color: colors.rejectedText, fontSize: 12.5, marginBottom: 14 }}>{loadError}</div>
        <button onClick={loadAll} style={{ background: colors.primary, color: colors.primaryText, border: 0, borderRadius: 8, padding: "9px 18px", fontWeight: 700 }}>Retry</button>
      </div>
    );
  }

  if (editingProfile) {
    return (
      <AdminEditProfile
        profile={editingProfile}
        adminPin={pin}
        colors={colors}
        onCancel={() => setEditingProfile(null)}
        showToast={showToast}
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

      {tab === "verification" && (
        <VerificationTab verifications={verifications} profiles={profiles} colors={colors} showToast={showToast} onReload={loadAll} adminPin={pin} />
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

      {tab === "log" && <ActivityLogTab colors={colors} showToast={showToast} />}
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

function VerificationTab({ verifications, profiles, colors, showToast, onReload, adminPin }) {
  const [saving, setSaving] = useState(null);
  async function update(id, status) {
    setSaving(id);
    const { error } = await updateVerificationStatus(id, status, "", adminPin);
    setSaving(null);
    if (error) { showToast("Could not update verification"); return; }
    showToast(`Verification ${status}`);
    onReload();
  }
  return <div>
    <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Profile Verification Requests</h3>
    {verifications.length === 0 && <div style={{ padding: 30, textAlign: "center", color: colors.textFaint }}>No verification requests.</div>}
    {verifications.map(v => {
      const p = profiles.find(x => x.id === v.user_id);
      return <div key={v.id} style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 13, padding: 13, marginBottom: 9 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={p?.name || "Member"} gender={p?.gender} photoUrl={p?.photo_url} size={46} /><div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{p?.name || v.user_id}</div><div style={{ fontSize: 11, color: colors.textFaint }}>{v.type} · {new Date(v.created_at).toLocaleString()}</div></div><Badge tone={v.status === "approved" ? "approved" : v.status === "rejected" ? "rejected" : "pending"}>{v.status}</Badge></div>
        {v.note && <div style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>{v.note}</div>}
        {v.status === "pending" && <div style={{ display: "flex", gap: 7, marginTop: 10 }}><button disabled={saving === v.id} onClick={() => update(v.id, "approved")} style={{ flex: 1, border: 0, borderRadius: 8, padding: 9, background: colors.approvedBg, color: colors.approvedText, fontWeight: 800 }}>Approve</button><button disabled={saving === v.id} onClick={() => update(v.id, "rejected")} style={{ flex: 1, border: 0, borderRadius: 8, padding: 9, background: colors.rejectedBg, color: colors.rejectedText, fontWeight: 800 }}>Reject</button></div>}
      </div>;
    })}
  </div>;
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

  React.useEffect(() => {
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

  const validData = data.filter(d => d && typeof d === 'object' && d.total_percentage !== undefined && typeof d.total_percentage === 'number');

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
          <span>{String(d.name || 'Unknown')}</span>
          <span style={{ fontWeight: 600 }}>{d.total_percentage}%</span>
        </div>
      ))}
    </div>
  );
}

function PhotoStatisticsReport({ data, colors }) {
  console.log("PhotoStatisticsReport data:", data);

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
  console.log("DistrictAnalysisReport data:", data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>District-wise Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No district data available
        </div>
      </div>
    );
  }

  const validData = data.filter(d => d && typeof d === 'object' && d.district);

  if (validData.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>District-wise Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No valid district data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>District-wise Analysis</h3>
      <div>
        {validData.slice(0, 10).map((d, index) => (
          <div key={d.district || index} style={{
            background: colors.card, padding: 12, borderRadius: 8, marginBottom: 8, border: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{String(d.district)}</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total || 0} profiles</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
              <div><span style={{ color: colors.approvedText }}>{d.approved || 0}</span> approved</div>
              <div><span style={{ color: colors.pendingText }}>{d.pending || 0}</span> pending</div>
              <div>Male: {d.male || 0} / Female: {d.female || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgeDistributionReport({ data, colors }) {
  console.log("AgeDistributionReport data:", data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Age Distribution</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No age data available
        </div>
      </div>
    );
  }

  const validData = data.filter(d => d && typeof d === 'object' && d.group);

  if (validData.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Age Distribution</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No valid age data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Age Distribution</h3>
      {validData.map((d, index) => (
        <div key={d.group || index} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{String(d.group)}</span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total || 0} profiles</span>
          </div>
          <div style={{
            height: 8, background: colors.cardBorder, borderRadius: 4, overflow: "hidden", marginBottom: 4
          }}>
            <div style={{
              height: "100%", background: colors.primary, width: `${Math.min((d.total || 0) * 2, 100)}%`
            }} />
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            Male: {d.male || 0} | Female: {d.female || 0} | Approved: {d.approved || 0}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResponseRateReport({ data, colors }) {
  console.log("ResponseRateReport data:", data);

  if (!data || typeof data !== 'object' || data.total_requests === 0) {
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
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.text }}>{data.total_requests || 0}</div>
        </div>
        <div style={{ background: colors.card, padding: 12, borderRadius: 8, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Acceptance Rate</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.approvedText }}>{data.acceptance_rate || 0}%</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: colors.approvedBg, padding: 10, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.approvedText }}>{data.accepted || 0}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Accepted</div>
        </div>
        <div style={{ background: colors.rejectedBg, padding: 10, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.rejectedText }}>{data.declined || 0}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Declined</div>
        </div>
        <div style={{ background: colors.pendingBg, padding: 10, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.pendingText }}>{data.pending || 0}</div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>Pending</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted }}>
        Average response time: ~{data.average_response_days || 0} days
      </div>
    </div>
  );
}

function MostViewedReport({ data, colors }) {
  console.log("MostViewedReport data:", data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Most Viewed Profiles (Top 20)</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No view data available
        </div>
      </div>
    );
  }

  const validData = data.filter(d => d && typeof d === 'object' && d.profile_id);

  if (validData.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Most Viewed Profiles (Top 20)</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No valid view data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Most Viewed Profiles (Top 20)</h3>
      <div>
        {validData.map((d, index) => (
          <div key={d.profile_id || index} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: colors.primary, color: colors.primaryText,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700
            }}>
              {index + 1}
            </div>
            {d.profile && typeof d.profile === 'object' ? (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{String(d.profile.name || 'Unknown')}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{String(d.profile.city || 'Unknown')} · {d.profile.age || 0} yrs</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.total_views || 0}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>{d.unique_viewers || 0} unique</div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, fontSize: 12, color: colors.textMaint }}>
                Profile data not available
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OccupationAnalysisReport({ data, colors }) {
  console.log("OccupationAnalysisReport data:", data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Occupation Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No occupation data available
        </div>
      </div>
    );
  }

  const validData = data.filter(d => d && typeof d === 'object' && d.occupation);

  if (validData.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Occupation Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No valid occupation data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Occupation Analysis</h3>
      <div>
        {validData.slice(0, 15).map((d, index) => (
          <div key={d.occupation || index} style={{
            background: colors.card, padding: 12, borderRadius: 8, marginBottom: 8, border: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{String(d.occupation)}</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total || 0} profiles</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
              <div><span style={{ color: colors.approvedText }}>{d.approved || 0}</span> approved</div>
              <div>Male: {d.male || 0} / Female: {d.female || 0}</div>
              <div>Success: {d.success_rate || 0}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EducationAnalysisReport({ data, colors }) {
  console.log("EducationAnalysisReport data:", data);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Education Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No education data available
        </div>
      </div>
    );
  }

  const validData = data.filter(d => d && typeof d === 'object' && d.education);

  if (validData.length === 0) {
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Education Analysis</h3>
        <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>
          No valid education data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Education Analysis</h3>
      <div>
        {validData.slice(0, 15).map((d, index) => (
          <div key={d.education || index} style={{
            background: colors.card, padding: 12, borderRadius: 8, marginBottom: 8, border: `1px solid ${colors.cardBorder}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{String(d.education)}</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>{d.total || 0} profiles</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11 }}>
              <div><span style={{ color: colors.approvedText }}>{d.approved || 0}</span> approved</div>
              <div>Male: {d.male || 0} / Female: {d.female || 0}</div>
              <div>Approval: {d.approval_rate || 0}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLogTab({ colors, showToast }) {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredLog, setFilteredLog] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [userOptions, setUserOptions] = useState([]);
  const [activityType, setActivityType] = useState("admin"); // "admin" or "user"

  React.useEffect(() => {
    loadActivityLog();
    loadUsers();
  }, []);

  async function loadActivityLog() {
    setLoading(true);
    const { data } = await fetchActivityLog();
    setLog(data || []);
    setLoading(false);
  }

  async function loadUsers() {
    const { data } = await fetchAllProfiles();
    const users = data?.map(p => ({ id: p.id, name: p.name })) || [];
    setUserOptions(users);
  }

  React.useEffect(() => {
    if (activityType === "admin") {
      const adminOnlyLog = log.filter(entry => !entry.user_id);
      if (selectedUser === "all") {
        setFilteredLog(adminOnlyLog);
      } else {
        setFilteredLog(adminOnlyLog.filter(entry => entry.target_id === selectedUser));
      }
    } else {
      const userOnlyLog = log.filter(entry => entry.user_id);
      if (selectedUser === "all") {
        setFilteredLog(userOnlyLog);
      } else {
        setFilteredLog(userOnlyLog.filter(entry => entry.user_id === selectedUser));
      }
    }
  }, [log, selectedUser, activityType]);

  const actionLabels = {
    approved: "Approved", rejected: "Rejected", delete: "Deleted", edit: "Edited",
    reply_message: "Replied to message", resolve_message: "Resolved message", reopen_message: "Reopened message",
    reset_password: "Reset password", deactivate: "Deactivated account", activate: "Activated account",
    bulk_approve: "Bulk approved", bulk_reject: "Bulk rejected", bulk_delete: "Bulk deleted", export: "Exported data",
    full_backup: "Downloaded full backup",
    sent_interest: "Sent interest", accepted_interest: "Accepted interest", declined_interest: "Declined interest",
    added_favourite: "Added to favourites", removed_favourite: "Removed from favourites",
    reported_profile: "Reported profile", viewed_profile: "Viewed profile",
  };

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 30 }}>Loading…</div>;

  function handleExport() {
    try {
      console.log("Starting activity log export...");
      const rows = filteredLog.map(entry => ({
        action: actionLabels[entry.action] || entry.action,
        target_type: entry.target_type,
        target_name: entry.target_name || "",
        details: entry.details || "",
        created_at: entry.created_at,
      }));
      console.log("Activity log rows:", rows.length);
      exportToCsv(activityType + "-activity-log.csv", rows);
      showToast("Activity log exported");
    } catch (err) {
      console.error("Activity log export error:", err);
      showToast("Activity log export failed: " + err.message);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Activity Log</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <select
            value={activityType}
            onChange={e => setActivityType(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.inputBorder}`,
              fontSize: 12, background: colors.inputBg, color: colors.text,
            }}
          >
            <option value="admin">Admin Activity</option>
            <option value="user">User Activity</option>
          </select>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.inputBorder}`,
              fontSize: 12, background: colors.inputBg, color: colors.text,
            }}
          >
            <option value="all">All Users</option>
            {userOptions.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button onClick={handleExport} style={{
            fontSize: 12, background: colors.card, color: colors.text, border: `1px solid ${colors.cardBorder}`,
            borderRadius: 7, padding: "6px 10px", fontWeight: 700,
          }}>Export CSV</button>
        </div>
      </div>
      {filteredLog.length === 0 && <div style={{ fontSize: 12, color: colors.textFaint, textAlign: "center", padding: 20 }}>No activity logged yet.</div>}
      {filteredLog.map(entry => {
        const user = userOptions.find(u => u.id === entry.user_id);
        return (
          <div key={entry.id} style={{
            background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 8, padding: 10, marginBottom: 6,
            fontSize: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{actionLabels[entry.action] || entry.action}</span>
              <span style={{ color: colors.textFaint, fontSize: 11 }}>{new Date(entry.created_at).toLocaleString()}</span>
            </div>
            {user && <div style={{ color: colors.textMuted, fontSize: 11.5 }}>By: {user.name}</div>}
            {entry.target_name && <div style={{ color: colors.textMuted }}>{entry.target_type}: {entry.target_name}</div>}
            {entry.details && <div style={{ color: colors.textFaint, fontSize: 11 }}>{entry.details}</div>}
          </div>
        );
      })}
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

  React.useEffect(() => {
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

  React.useEffect(() => {
    loadValues();
  }, [listType]);

  async function loadValues() {
    setLoading(true);
    const { data } = await fetchMasterList(listType);
    setValues(data || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newValue.trim()) return;
    await addMasterListValue(listType, newValue);
    showToast("Value added");
    setNewValue("");
    loadValues();
  }

  async function handleDelete(id) {
    const { error } = await deleteMasterListValue(id);
    if (error) {
      showToast("Could not delete value: " + error);
      return;
    }
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
        <option value="mother_tongue">Mother tongue</option>
        <option value="religion">Religion</option>
        <option value="education">Education</option>
        <option value="occupation">Occupation</option>
        <option value="caste">Caste</option>
        <option value="father_occupation">Father occupation</option>
        <option value="mother_occupation">Mother occupation</option>
        <option value="siblings">Siblings</option>
        <option value="complexion">Complexion</option>
        <option value="body_type">Body type</option>
        <option value="blood_group">Blood group</option>
        <option value="village">Village</option>
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
            <div key={v.id} style={{
              background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 20,
              padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6,
            }}>
              {v.value}
              <button onClick={() => handleDelete(v.id)} style={{ background: "none", border: "none", color: colors.rejectedText, cursor: "pointer", padding: 0 }}>×</button>
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

function AdminEditProfile({ profile, adminPin, colors, onCancel, onSaved, showToast }) {
  const [form, setForm] = React.useState({ ...profile });
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState({
    education: [], occupation: [], district: [], city: [], state: [], sub_caste: [],
    religion: [], caste: [], mother_tongue: [], star: [], rasi: [],
    father_occupation: [], mother_occupation: [], siblings: [], village: [],
    complexion: [], body_type: [], blood_group: [],
  });

  React.useEffect(() => {
    const listTypes = Object.keys(options);
    Promise.all(listTypes.map(async (type) => {
      const { data } = await fetchMasterList(type);
      return [type, (data || []).map(x => x.value)];
    })).then(entries => setOptions(Object.fromEntries(entries)));
  }, []);

  async function handleSave() {
    setLoading(true);
    const payload = { ...form };
    if (payload.age !== "" && payload.age != null) payload.age = Number(payload.age);
    if (payload.pref_age_min !== "" && payload.pref_age_min != null) payload.pref_age_min = Number(payload.pref_age_min);
    if (payload.pref_age_max !== "" && payload.pref_age_max != null) payload.pref_age_max = Number(payload.pref_age_max);

    const { error } = await updateProfileByAdmin(profile.id, payload, adminPin);
    setLoading(false);
    if (error) {
      console.error("Admin profile update failed:", error);
      showToast?.(`Could not save profile: ${error.message || "Update failed"}`);
      return;
    }
    onSaved();
  }

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const ageOptions = Array.from({ length: 53 }, (_, i) => String(i + 18));

  return (
    <div>
      <button onClick={onCancel} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0,
      }}>← Cancel</button>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Edit Profile / விவரத்தை திருத்தவும்</h3>
      <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 14 }}>
        Admin can edit the complete member profile, including private phone number.
      </div>

      <AdminSelect colors={colors} label="Profile for" value={form.profile_for || "Self"} onChange={v => handleChange("profile_for", v)} options={["Self", "Son", "Daughter"]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <TextField colors={colors} label="Name" value={form.name || ""} onChange={v => handleChange("name", v)} />
        <AdminSelect colors={colors} label="Gender" value={form.gender || ""} onChange={v => handleChange("gender", v)} options={["Male", "Female"]} />
        <AdminSelect colors={colors} label="Age" value={String(form.age || "")} onChange={v => handleChange("age", v)} options={ageOptions} />
        <TextField colors={colors} label="Height" value={form.height || ""} onChange={v => handleChange("height", v)} />
        <AdminSelect colors={colors} label="Mother tongue" value={form.mother_tongue || ""} onChange={v => handleChange("mother_tongue", v)} options={options.mother_tongue} />
        <AdminSelect colors={colors} label="Religion" value={form.religion || ""} onChange={v => handleChange("religion", v)} options={options.religion} />
        <AdminSelect colors={colors} label="Caste" value={form.caste || ""} onChange={v => handleChange("caste", v)} options={options.caste} />
        <AdminSelect colors={colors} label="Sub caste" value={form.sub_caste || ""} onChange={v => handleChange("sub_caste", v)} options={options.sub_caste} />
        <AdminSelect colors={colors} label="Education" value={form.education || ""} onChange={v => handleChange("education", v)} options={options.education} />
        <AdminSelect colors={colors} label="Occupation" value={form.occupation || ""} onChange={v => handleChange("occupation", v)} options={options.occupation} />
        <TextField colors={colors} label="Income" value={form.income || ""} onChange={v => handleChange("income", v)} />
      </div>

      <h4 style={{ color: colors.primary, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 6 }}>Location</h4>
      <TextField colors={colors} label="Address" value={form.address || ""} onChange={v => handleChange("address", v)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <AdminSelect colors={colors} label="Village" value={form.village || ""} onChange={v => handleChange("village", v)} options={options.village} />
        <AdminSelect colors={colors} label="District" value={form.district || ""} onChange={v => handleChange("district", v)} options={options.district} />
        <AdminSelect colors={colors} label="City" value={form.city || ""} onChange={v => handleChange("city", v)} options={options.city} />
        <AdminSelect colors={colors} label="State" value={form.state || ""} onChange={v => handleChange("state", v)} options={options.state} />
      </div>

      <h4 style={{ color: colors.primary, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 6 }}>Partner Preference</h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <AdminSelect colors={colors} label="Preferred min age" value={String(form.pref_age_min || "")} onChange={v => handleChange("pref_age_min", v)} options={ageOptions} />
        <AdminSelect colors={colors} label="Preferred max age" value={String(form.pref_age_max || "")} onChange={v => handleChange("pref_age_max", v)} options={ageOptions} />
        <AdminSelect colors={colors} label="Preferred education" value={form.pref_education || ""} onChange={v => handleChange("pref_education", v)} options={options.education} />
        <AdminSelect colors={colors} label="Preferred occupation" value={form.pref_occupation || ""} onChange={v => handleChange("pref_occupation", v)} options={options.occupation} />
      </div>

      <h4 style={{ color: colors.primary, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 6 }}>Family & Horoscope</h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <AdminSelect colors={colors} label="Father occupation" value={form.father_occupation || ""} onChange={v => handleChange("father_occupation", v)} options={options.father_occupation} />
        <AdminSelect colors={colors} label="Mother occupation" value={form.mother_occupation || ""} onChange={v => handleChange("mother_occupation", v)} options={options.mother_occupation} />
        <AdminSelect colors={colors} label="Siblings" value={form.siblings || ""} onChange={v => handleChange("siblings", v)} options={options.siblings} />
        <AdminSelect colors={colors} label="Family type" value={form.family_type || ""} onChange={v => handleChange("family_type", v)} options={["Nuclear", "Joint"]} />
        <AdminSelect colors={colors} label="Star" value={form.star || ""} onChange={v => handleChange("star", v)} options={options.star} />
        <AdminSelect colors={colors} label="Rasi" value={form.rasi || ""} onChange={v => handleChange("rasi", v)} options={options.rasi} />
        <TextField colors={colors} label="Birth time" value={form.birth_time || ""} onChange={v => handleChange("birth_time", v)} />
        <TextField colors={colors} label="Birth place" value={form.birth_place || ""} onChange={v => handleChange("birth_place", v)} />
        <AdminSelect colors={colors} label="Complexion" value={form.complexion || ""} onChange={v => handleChange("complexion", v)} options={options.complexion} />
        <AdminSelect colors={colors} label="Body type" value={form.body_type || ""} onChange={v => handleChange("body_type", v)} options={options.body_type} />
        <AdminSelect colors={colors} label="Blood group" value={form.blood_group || ""} onChange={v => handleChange("blood_group", v)} options={options.blood_group} />
        <AdminSelect colors={colors} label="Diet" value={form.diet || ""} onChange={v => handleChange("diet", v)} options={["Vegetarian", "Non-Vegetarian", "Eggetarian"]} />
        <AdminSelect colors={colors} label="Smoking" value={form.smoking || ""} onChange={v => handleChange("smoking", v)} options={["No", "Occasionally", "Yes"]} />
        <AdminSelect colors={colors} label="Drinking" value={form.drinking || ""} onChange={v => handleChange("drinking", v)} options={["No", "Occasionally", "Yes"]} />
      </div>

      <h4 style={{ color: colors.primary, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 6 }}>Private / Admin only</h4>
      <TextField colors={colors} label="Phone number (Admin only)" value={form.phone || ""} onChange={v => handleChange("phone", v)} />
      <TextField colors={colors} label="Security answer" value={form.security_answer || ""} onChange={v => handleChange("security_answer", v)} />
      <TextField colors={colors} label="About" value={form.about || ""} onChange={v => handleChange("about", v)} multiline style={{ minHeight: 80 }} />

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={handleSave} disabled={loading} style={{
          flex: 1, background: colors.primary, color: colors.primaryText, border: "none", borderRadius: 8,
          padding: "10px", fontWeight: 700, fontSize: 13, opacity: loading ? 0.6 : 1,
        }}>{loading ? "Saving…" : "Save changes"}</button>
        <button onClick={onCancel} style={{
          flex: 1, background: colors.card, color: colors.text, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13,
        }}>Cancel</button>
      </div>
    </div>
  );
}

function AdminSelect({ colors, label, value, onChange, options = [] }) {
  const safeOptions = value && !(options || []).includes(value) ? [value, ...(options || [])] : (options || []);
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
      <select value={value || ""} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`,
        fontSize: 13, background: colors.inputBg, color: colors.text,
      }}>
        <option value="">Select {label}</option>
        {safeOptions.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function TextField({ colors, label, value, onChange, type = "text", multiline = false, style = {} }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11.5, color: colors.textMuted, marginBottom: 4 }}>{label}</div>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text, ...style }}
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${colors.inputBorder}`, fontSize: 13, background: colors.inputBg, color: colors.text, ...style }}
        />
      )}
    </div>
  );
}
