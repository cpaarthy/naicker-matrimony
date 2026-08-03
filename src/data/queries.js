import { supabase } from "../supabaseClient";

export async function fetchApprovedProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function fetchProfileById(id) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return { data, error };
}

export async function upsertProfile(record) {
  const { data, error } = await supabase.from("profiles").upsert(record).select().single();
  return { data, error };
}

export async function updateProfileStatus(id, status) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  return { error };
}

export async function fetchRequestsFor(userId) {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .or(`from_id.eq.${userId},to_id.eq.${userId}`);
  return { data: data || [], error };
}

export async function fetchAllRequests() {
  const { data, error } = await supabase.from("requests").select("*");
  return { data: data || [], error };
}

export async function sendInterestRequest(fromId, toId) {
  const { error } = await supabase.from("requests").insert({ from_id: fromId, to_id: toId, status: "pending" });
  return { error };
}

export async function respondToRequest(reqId, accept) {
  const { error } = await supabase.from("requests").update({ status: accept ? "accepted" : "declined" }).eq("id", reqId);
  return { error };
}

export async function fetchFavourites(userId) {
  const { data, error } = await supabase.from("favourites").select("*").eq("user_id", userId);
  return { data: data || [], error };
}

export async function toggleFavourite(userId, profileId, isFav) {
  if (isFav) {
    const { error } = await supabase.from("favourites").delete().eq("user_id", userId).eq("profile_id", profileId);
    return { error };
  } else {
    const { error } = await supabase.from("favourites").insert({ user_id: userId, profile_id: profileId });
    return { error };
  }
}

export async function uploadProfilePhoto(userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, {
    cacheControl: "3600", upsert: true,
  });
  if (uploadError) return { error: uploadError };
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function submitContactMessage(record) {
  const { error } = await supabase.from("contact_messages").insert(record);
  return { error };
}

export async function deleteProfile(id) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  return { error };
}

export async function fetchContactMessages() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

// ============ MASTER LISTS (admin-managed dropdown options) ============
export async function fetchMasterList(listType) {
  const { data, error } = await supabase
    .from("master_lists")
    .select("*")
    .eq("list_type", listType)
    .order("value", { ascending: true });
  return { data: data || [], error };
}

export async function addMasterListValue(listType, value) {
  const { error } = await supabase.from("master_lists").insert({ list_type: listType, value });
  return { error };
}

export async function deleteMasterListValue(id) {
  const { error } = await supabase.from("master_lists").delete().eq("id", id);
  return { error };
}

// ============ BULK ACTIONS ============
export async function bulkUpdateProfileStatus(ids, status) {
  const { error } = await supabase.from("profiles").update({ status }).in("id", ids);
  return { error };
}

export async function bulkDeleteProfiles(ids) {
  const { error } = await supabase.from("profiles").delete().in("id", ids);
  return { error };
}

// ============ ACCOUNT ACTIVATION ============
export async function setProfileDeactivated(id, deactivated) {
  const { error } = await supabase.from("profiles").update({ admin_deactivated: deactivated }).eq("id", id);
  return { error };
}

// ============ CONTACT MESSAGES: resolve / reply ============
export async function resolveContactMessage(id, resolved) {
  const { error } = await supabase.from("contact_messages").update({ resolved }).eq("id", id);
  return { error };
}

export async function replyToContactMessage(id, adminReply) {
  const { error } = await supabase.from("contact_messages").update({ admin_reply: adminReply, resolved: true }).eq("id", id);
  return { error };
}

// ============ ADMIN ACTIVITY LOG ============
export async function logAdminAction({ action, targetType, targetId, targetName, details }) {
  const { error } = await supabase.from("activity_log").insert({
    action, target_type: targetType, target_id: targetId ? String(targetId) : null,
    target_name: targetName || null, details: details || null,
  });
  return { error };
}

export async function fetchActivityLog() {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return { data: data || [], error };
}

// ============ SELF-SERVICE PASSWORD RECOVERY (phone accounts) ============
// Uses a Postgres function (deployed via SQL Editor, no CLI/Edge Functions needed).
// The user proves ownership by answering their security question (mother's name).
export async function resetPasswordWithSecurityAnswer(phone, securityAnswer, newPassword) {
  const { data, error } = await supabase.rpc("reset_password_with_security_answer", {
    p_phone: phone,
    p_security_answer: securityAnswer,
    p_new_password: newPassword,
  });
  if (error) return { error: error.message || "Could not reset password" };
  if (data && data.success === false) return { error: data.error };
  return { error: null };
}

export async function resetPasswordWithSecurityAnswerEmail(email, securityAnswer, newPassword) {
  const { data, error } = await supabase.rpc("reset_password_with_security_answer_email", {
    p_email: email,
    p_security_answer: securityAnswer,
    p_new_password: newPassword,
  });
  if (error) return { error: error.message || "Could not reset password" };
  if (data && data.success === false) return { error: data.error };
  return { error: null };
}

// ============ NOTIFICATIONS ============
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function createNotification({ userId, type, relatedProfileId, message }) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId, type, related_profile_id: relatedProfileId || null, message,
  });
  return { error };
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  return { error };
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  return { error };
}

// ============ CHANGE PASSWORD (logged-in user) ============
export async function changeOwnPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message || null };
}

// ============ DELETE OWN ACCOUNT ============
export async function deleteOwnAccount() {
  const { data, error } = await supabase.rpc("delete_own_account");
  if (error) return { error: error.message || "Could not delete account" };
  if (data && data.success === false) return { error: data.error };
  return { error: null };
}

// ============ BLOCK PROFILES ============
export async function fetchBlockedProfiles(userId) {
  const { data, error } = await supabase.from("blocked_profiles").select("*").eq("blocker_id", userId);
  return { data: data || [], error };
}

export async function blockProfile(blockerId, blockedId) {
  const { error } = await supabase.from("blocked_profiles").insert({ blocker_id: blockerId, blocked_id: blockedId });
  return { error };
}

export async function unblockProfile(blockerId, blockedId) {
  const { error } = await supabase.from("blocked_profiles").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  return { error };
}

// ============ REPORT PROFILES ============
export async function submitProfileReport({ reporterId, reportedId, reason, details }) {
  const { error } = await supabase.from("profile_reports").insert({
    reporter_id: reporterId, reported_id: reportedId, reason, details: details || null,
  });
  return { error };
}

export async function fetchProfileReports() {
  const { data, error } = await supabase
    .from("profile_reports")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function updateReportStatus(id, status) {
  const { error } = await supabase.from("profile_reports").update({ status }).eq("id", id);
  return { error };
}

// ============ RECENTLY VIEWED ============
export async function recordProfileView(viewerId, viewedId) {
  const { error } = await supabase
    .from("recently_viewed")
    .upsert({ viewer_id: viewerId, viewed_id: viewedId, viewed_at: new Date().toISOString() }, { onConflict: "viewer_id,viewed_id" });
  return { error };
}

export async function fetchRecentlyViewed(viewerId) {
  const { data, error } = await supabase
    .from("recently_viewed")
    .select("*")
    .eq("viewer_id", viewerId)
    .order("viewed_at", { ascending: false })
    .limit(20);
  return { data: data || [], error };
}

// ============ SITE ANNOUNCEMENTS (admin banner) ============
export async function fetchActiveAnnouncement() {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function fetchAllAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function createAnnouncement({ message, expiresAt }) {
  const { error } = await supabase.from("announcements").insert({
    message, expires_at: expiresAt || null, active: true,
  });
  return { error };
}

export async function setAnnouncementActive(id, active) {
  const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
  return { error };
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  return { error };
}

// ============ MANUAL POROTHAM REVIEWS (admin/astrologer override) ============
export async function fetchPoruthamReviews() {
  const { data, error } = await supabase
    .from("porutham_reviews")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function savePoruthamReview({ profileAId, profileBId, calculatedMatchedCount, calculatedVerdict, manualVerdict, notes }) {
  // Store the pair in a consistent order so the unique constraint works regardless of selection order
  const [a, b] = [profileAId, profileBId].sort();
  const { error } = await supabase.from("porutham_reviews").upsert({
    profile_a_id: a, profile_b_id: b,
    calculated_matched_count: calculatedMatchedCount, calculated_verdict: calculatedVerdict,
    manual_verdict: manualVerdict, notes: notes || null,
  }, { onConflict: "profile_a_id,profile_b_id" });
  return { error };
}

export async function deletePoruthamReview(id) {
  const { error } = await supabase.from("porutham_reviews").delete().eq("id", id);
  return { error };
}

// ============ USER ENGAGEMENT TRACKING ============
export async function updateLastActive(userId) {
  const { error } = await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", userId);
  return { error };
}

// ============ FULL DATABASE BACKUP ============
const BACKUP_TABLES = [
  "profiles", "requests", "favourites", "notifications", "blocked_profiles",
  "profile_reports", "recently_viewed", "activity_log", "master_lists",
  "announcements", "contact_messages", "porutham_reviews",
];

export async function fetchFullBackup() {
  const backup = {
    generated_at: new Date().toISOString(),
    tables: {},
    errors: [],
  };
  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      backup.errors.push({ table, message: error.message });
      backup.tables[table] = [];
    } else {
      backup.tables[table] = data || [];
    }
  }
  return backup;
}
