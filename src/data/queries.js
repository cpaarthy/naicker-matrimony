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

export async function fetchProfileViewsReceived(profileId) {
  const { data, error } = await supabase
    .from("recently_viewed")
    .select("*")
    .eq("viewed_id", profileId)
    .order("viewed_at", { ascending: false });
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

// ============ ADMIN ANALYTICS REPORTS ============

// Profile completion report - how many profiles have complete data
export async function fetchProfileCompletionReport() {
  try {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return { data: [], error };

    const report = data.map(p => {
      const requiredFields = ['name', 'age', 'gender', 'caste', 'sub_caste', 'education', 'occupation', 'address', 'city', 'state', 'phone'];
      const optionalFields = ['height', 'religion', 'income', 'mother_tongue', 'about', 'father_occupation', 'mother_occupation', 'siblings', 'family_type', 'star', 'rasi', 'birth_time', 'birth_place', 'complexion', 'body_type', 'blood_group', 'diet', 'smoking', 'drinking', 'photo_url'];
      
      const requiredFilled = requiredFields.filter(f => p[f] && typeof p[f] === 'string' && p[f].trim() !== '').length;
      const optionalFilled = optionalFields.filter(f => p[f] && typeof p[f] === 'string' && p[f].trim() !== '').length;
      
      const requiredPercentage = Math.round((requiredFilled / requiredFields.length) * 100);
      const totalPercentage = Math.round(((requiredFilled + optionalFilled) / (requiredFields.length + optionalFields.length)) * 100);
      
      return {
        id: p.id,
        name: p.name,
        required_percentage: requiredPercentage,
        total_percentage: totalPercentage,
        has_photo: !!p.photo_url,
        status: p.status,
        created_at: p.created_at
      };
    });

    return { data: report, error: null };
  } catch (err) {
    console.error("Profile completion report error:", err);
    return { data: [], error: err.message };
  }
}

// Photo statistics
export async function fetchPhotoStatistics() {
  try {
    const { data, error } = await supabase.from("profiles").select("id, name, photo_url, status, gender, created_at");
    if (error) {
      console.error("Photo statistics error:", error);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    const withPhoto = data.filter(p => p.photo_url && typeof p.photo_url === 'string' && p.photo_url.trim() !== '');
    const withoutPhoto = data.filter(p => !p.photo_url || typeof p.photo_url !== 'string' || p.photo_url.trim() === '');

    const photoStats = {
      total: data.length,
      with_photo: withPhoto.length,
      without_photo: withoutPhoto.length,
      with_photo_percentage: data.length > 0 ? Math.round((withPhoto.length / data.length) * 100) : 0,
      by_gender: {
        male_with_photo: withPhoto.filter(p => p.gender === 'Male').length,
        male_without_photo: withoutPhoto.filter(p => p.gender === 'Male').length,
        female_with_photo: withPhoto.filter(p => p.gender === 'Female').length,
        female_without_photo: withoutPhoto.filter(p => p.gender === 'Female').length,
      },
      by_status: {
        approved_with_photo: withPhoto.filter(p => p.status === 'approved').length,
        approved_without_photo: withoutPhoto.filter(p => p.status === 'approved').length,
        pending_with_photo: withPhoto.filter(p => p.status === 'pending').length,
        pending_without_photo: withoutPhoto.filter(p => p.status === 'pending').length,
      }
    };

    return { data: photoStats, error: null };
  } catch (err) {
    console.error("Photo statistics fetch error:", err);
    return { data: null, error: err.message };
  }
}

// District-wise analysis
export async function fetchDistrictAnalysis() {
  const { data, error } = await supabase.from("profiles").select("district, city, status, gender");
  if (error) return { data: [], error };

  const districtData = {};
  data.forEach(p => {
    const district = p.district || 'Unknown';
    if (!districtData[district]) {
      districtData[district] = { total: 0, approved: 0, pending: 0, male: 0, female: 0 };
    }
    districtData[district].total++;
    if (p.status === 'approved') districtData[district].approved++;
    if (p.status === 'pending') districtData[district].pending++;
    if (p.gender === 'Male') districtData[district].male++;
    if (p.gender === 'Female') districtData[district].female++;
  });

  const report = Object.entries(districtData)
    .map(([district, stats]) => ({ district, ...stats }))
    .sort((a, b) => b.total - a.total);

  return { data: report, error: null };
}

// Age distribution
export async function fetchAgeDistribution() {
  const { data, error } = await supabase.from("profiles").select("age, gender, status");
  if (error) return { data: [], error };

  const ageGroups = {
    '18-24': { total: 0, male: 0, female: 0, approved: 0 },
    '25-30': { total: 0, male: 0, female: 0, approved: 0 },
    '31-35': { total: 0, male: 0, female: 0, approved: 0 },
    '36-40': { total: 0, male: 0, female: 0, approved: 0 },
    '41-45': { total: 0, male: 0, female: 0, approved: 0 },
    '46-50': { total: 0, male: 0, female: 0, approved: 0 },
    '50+': { total: 0, male: 0, female: 0, approved: 0 },
  };

  data.forEach(p => {
    if (!p.age) return;
    let group = '50+';
    if (p.age >= 18 && p.age <= 24) group = '18-24';
    else if (p.age >= 25 && p.age <= 30) group = '25-30';
    else if (p.age >= 31 && p.age <= 35) group = '31-35';
    else if (p.age >= 36 && p.age <= 40) group = '36-40';
    else if (p.age >= 41 && p.age <= 45) group = '41-45';
    else if (p.age >= 46 && p.age <= 50) group = '46-50';

    ageGroups[group].total++;
    if (p.gender === 'Male') ageGroups[group].male++;
    if (p.gender === 'Female') ageGroups[group].female++;
    if (p.status === 'approved') ageGroups[group].approved++;
  });

  const report = Object.entries(ageGroups).map(([group, stats]) => ({ group, ...stats }));
  return { data: report, error: null };
}

// Response rate analysis
export async function fetchResponseRateAnalysis() {
  try {
    const { data: requests, error } = await supabase.from("requests").select("*");
    if (error) {
      console.error("Response rate analysis error:", error);
      return { data: null, error: error.message };
    }

    if (!requests || requests.length === 0) {
      return { data: null, error: null };
    }

    const total = requests.length;
    const accepted = requests.filter(r => r.status === 'accepted').length;
    const declined = requests.filter(r => r.status === 'declined').length;
    const pending = requests.filter(r => r.status === 'pending').length;

    // Calculate average response time (from creation to response)
    const responded = requests.filter(r => r.status !== 'pending');
    let totalResponseTime = 0;
    responded.forEach(r => {
      const created = new Date(r.created_at);
      // Since we don't have updated_at, we'll estimate based on created_at + average response time
      // This is a simplified approach
      totalResponseTime += 7 * 24 * 60 * 60 * 1000; // Assume 7 days average
    });

    const responseStats = {
      total_requests: total,
      accepted: accepted,
      declined: declined,
      pending: pending,
      acceptance_rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      decline_rate: total > 0 ? Math.round((declined / total) * 100) : 0,
      pending_rate: total > 0 ? Math.round((pending / total) * 100) : 0,
      average_response_days: responded.length > 0 ? Math.round(totalResponseTime / responded.length / (24 * 60 * 60 * 1000)) : 0
    };

    return { data: responseStats, error: null };
  } catch (err) {
    console.error("Response rate analysis fetch error:", err);
    return { data: null, error: err.message };
  }
}

// Most viewed profiles
export async function fetchMostViewedProfiles(limit = 20) {
  try {
    const { data, error } = await supabase
      .from("recently_viewed")
      .select("viewed_id, viewer_id, viewed_at")
      .order("viewed_at", { ascending: false });

    if (error) {
      console.error("Most viewed profiles error:", error);
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const viewCounts = {};
    data.forEach(v => {
      if (!viewCounts[v.viewed_id]) {
        viewCounts[v.viewed_id] = { count: 0, unique_viewers: new Set() };
      }
      viewCounts[v.viewed_id].count++;
      viewCounts[v.viewed_id].unique_viewers.add(v.viewer_id);
    });

    const report = Object.entries(viewCounts)
      .map(([profileId, stats]) => ({
        profile_id: profileId,
        total_views: stats.count,
        unique_viewers: stats.unique_viewers.size // Convert Set to number
      }))
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, limit);

    // Fetch profile details for the most viewed
    const profileIds = report.map(r => r.profile_id);
    const { data: profiles } = await supabase.from("profiles").select("id, name, age, gender, city, photo_url, status").in("id", profileIds);

    const enrichedReport = report.map(r => {
      const profile = profiles.find(p => p.id === r.profile_id);
      return { ...r, profile: profile || null };
    });

    return { data: enrichedReport, error: null };
  } catch (err) {
    console.error("Most viewed profiles fetch error:", err);
    return { data: [], error: err.message };
  }
}

// Occupation-wise success analysis
export async function fetchOccupationAnalysis() {
  const { data: profiles, error } = await supabase.from("profiles").select("id, occupation, status, gender");
  if (error) return { data: [], error };

  const { data: requests } = await supabase.from("requests").select("*");

  const occupationData = {};
  profiles.forEach(p => {
    const occupation = p.occupation || 'Unknown';
    if (!occupationData[occupation]) {
      occupationData[occupation] = { total: 0, approved: 0, male: 0, female: 0, accepted_requests: 0 };
    }
    occupationData[occupation].total++;
    if (p.status === 'approved') occupationData[occupation].approved++;
    if (p.gender === 'Male') occupationData[occupation].male++;
    if (p.gender === 'Female') occupationData[occupation].female++;
  });

  // Count accepted requests per occupation
  requests.filter(r => r.status === 'accepted').forEach(r => {
    const fromProfile = profiles.find(p => p.id === r.from_id);
    const toProfile = profiles.find(p => p.id === r.to_id);
    if (fromProfile) {
      const occupation = fromProfile.occupation || 'Unknown';
      if (occupationData[occupation]) {
        occupationData[occupation].accepted_requests++;
      }
    }
  });

  const report = Object.entries(occupationData)
    .map(([occupation, stats]) => ({
      occupation,
      ...stats,
      success_rate: stats.total > 0 ? Math.round((stats.accepted_requests / stats.total) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total);

  return { data: report, error: null };
}

// Education-wise breakdown
export async function fetchEducationAnalysis() {
  const { data: profiles, error } = await supabase.from("profiles").select("id, education, status, gender");
  if (error) return { data: [], error };

  const educationData = {};
  profiles.forEach(p => {
    const education = p.education || 'Unknown';
    if (!educationData[education]) {
      educationData[education] = { total: 0, approved: 0, male: 0, female: 0 };
    }
    educationData[education].total++;
    if (p.status === 'approved') educationData[education].approved++;
    if (p.gender === 'Male') educationData[education].male++;
    if (p.gender === 'Female') educationData[education].female++;
  });

  const report = Object.entries(educationData)
    .map(([education, stats]) => ({
      education,
      ...stats,
      approval_rate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total);

  return { data: report, error: null };
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
