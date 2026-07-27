import { createContext, useContext, useState, useEffect, useCallback } from "react";
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

  useEffect(() => {
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
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data || null);
    setProfileLoading(false);
  }, [userId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // --- Email OTP flow ---
  async function sendEmailOtp(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error };
  }

  async function verifyEmailOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
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
    sendEmailOtp, verifyEmailOtp,
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
