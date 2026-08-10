import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

function phoneToEmail(phone) {
  const digits = phone.replace(/\D/g, "");
  return `phone${digits}@naickermatrimony.app`;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id || null;

  const loadProfile = useCallback(async () => {
    if (!userId) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    const [{ data: publicProfile, error: publicError }, { data: privateProfile }] = await Promise.all([
      supabase.rpc("member_fetch_profile", { p_profile_id: userId }),
      supabase.from("profile_private").select("phone,security_answer").eq("user_id", userId).maybeSingle(),
    ]);
    if (publicError) {
      console.error("Own profile load error:", publicError);
    }
    const data = publicProfile ? { ...publicProfile, ...(privateProfile || {}) } : null;
    setProfile(data || null);
    setProfileLoading(false);
    if (data) {
      // Fire-and-forget: track engagement without blocking the UI or its own error handling.
      supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", userId).then(() => {});
    }
  }, [userId]);

  React.useEffect(() => { loadProfile(); }, [loadProfile]);

  // --- Email OTP flow ---
  async function sendEmailOtp(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error };
  }

  async function verifyEmailOtp(email, token, password) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) return { data, error };
    setSession(data.session);
    // Set the password now that the user is verified and has an active session,
    // so future logins can use email + password instead of requesting a new OTP.
    if (password) {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) return { data, error: pwError };
    }
    return { data, error: null };
  }

  async function loginWithEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setSession(data.session);
    return { data, error };
  }

  // --- Phone + password flow ---
  async function signUpWithPhone(phone, password, name) {
    const email = phoneToEmail(phone);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, login_method: "phone" } },
    });
    if (!error) setSession(data.session);
    return { data, error };
  }

  async function loginWithPhone(phone, password) {
    const email = phoneToEmail(phone);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setSession(data.session);
    return { data, error };
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const value = {
    session, authChecked, userId,
    profile, profileLoading, reloadProfile: loadProfile,
    sendEmailOtp, verifyEmailOtp, loginWithEmailPassword,
    signUpWithPhone, loginWithPhone,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
