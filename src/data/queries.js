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
