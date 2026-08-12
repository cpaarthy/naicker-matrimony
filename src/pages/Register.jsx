import React, { useState, useRef } from "react";
import { Mail, Phone, Camera, ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, SelectField, MasterListSelect, PrimaryButton, Avatar, Stepper } from "../components/ui";
import TermsModal from "../components/TermsModal";
import { upsertProfile, uploadProfilePhoto, fetchMasterList } from "../data/queries";

const REGISTRATION_DRAFT_KEY = "naicker_registration_draft";

const emptyForm = {
  profile_for: "Self",
  name: "", gender: "Male", age: "", caste: "Naicker", sub_caste: "Malava",
  occupation: "", education: "", pref_age_min: "", pref_age_max: "", pref_education: "", pref_occupation: "",
  address: "", district: "", city: "", state: "Tamil Nadu",
  phone: "", photo_url: "",
};

const STEP_LABELS = ["Basics", "Location", "Preference", "Account"];

function ErrorBox({ children, colors }) {
  return (
    <div style={{ background: colors.rejectedBg, color: colors.rejectedText, borderRadius: 9, padding: "10px 13px", fontSize: 13, marginBottom: 15, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function StepCard({ children, colors }) {
  return (
    <div style={{
      background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 18,
      padding: 20, boxShadow: colors.shadow,
    }}>
      {children}
    </div>
  );
}

function BackLink({ onClick, children, colors }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
      color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0, fontWeight: 600,
    }}>
      <ArrowLeft size={14} /> {children}
    </button>
  );
}

export default function Register({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { sendEmailOtp, verifyEmailOtp, signUpWithPhone } = useAuth();

  // Wizard stages, in order: basics -> location -> preference -> account -> otp
  const [stage, setStage] = useState("basics");
  const [form, setForm] = useState(() => {
    try {
      const draft = localStorage.getItem(REGISTRATION_DRAFT_KEY);
      if (draft) return { ...emptyForm, ...JSON.parse(draft) };
    } catch (_) {}
    return emptyForm;
  });
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const fileRef = useRef(null);

  const [subCasteOptions, setSubCasteOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [educationOptions, setEducationOptions] = useState([]);
  const [occupationOptions, setOccupationOptions] = useState([]);

  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    fetchMasterList("sub_caste").then(({ data }) => setSubCasteOptions(data.map(d => d.value)));
    fetchMasterList("city").then(({ data }) => setCityOptions(data.map(d => d.value)));
    fetchMasterList("district").then(({ data }) => setDistrictOptions(data.map(d => d.value)));
    fetchMasterList("state").then(({ data }) => setStateOptions(data.map(d => d.value)));
    fetchMasterList("education").then(({ data }) => setEducationOptions(data.map(d => d.value)));
    fetchMasterList("occupation").then(({ data }) => setOccupationOptions(data.map(d => d.value)));
  }, []);

  function saveDraft(nextForm) {
    try {
      localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify({ ...nextForm, age: String(nextForm.age ?? "") }));
    } catch (_) {}
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024) { showToast("Photo must be under 50KB / புகைப்படம் 50KB-க்குள் இருக்க வேண்டும்"); return; }
    setPendingPhotoFile(file);
    setForm(f => ({ ...f, photo_url: URL.createObjectURL(file) }));
  }

  // ---- Per-step validation, so each screen only asks for what it needs ----
  function validateBasics() {
    const ageFromForm = String(form.age ?? "").trim();
    const ageFromSelect = String(document.getElementById("register-age")?.value ?? "").trim();
    const normalizedAge = ageFromForm || ageFromSelect;
    const missing = [];
    if (!String(form.name ?? "").trim()) missing.push("name");
    if (!normalizedAge || !Number.isFinite(Number(normalizedAge)) || Number(normalizedAge) < 18 || Number(normalizedAge) > 70) missing.push("age");
    if (!String(form.caste ?? "").trim()) missing.push("caste");
    if (!String(form.sub_caste ?? "").trim()) missing.push("sub caste");
    if (!String(form.occupation ?? "").trim()) missing.push("occupation");
    if (missing.length > 0) {
      showToast(`Fill required fields: ${missing.join(", ")}`);
      return false;
    }
    setForm(f => ({ ...f, age: normalizedAge }));
    return true;
  }

  function validateLocation() {
    const missing = [];
    if (!String(form.address ?? "").trim()) missing.push("address");
    if (!String(form.district ?? "").trim()) missing.push("district");
    if (!String(form.city ?? "").trim()) missing.push("city");
    if (!String(form.state ?? "").trim()) missing.push("state");
    if (!String(form.phone ?? phone ?? "").trim()) missing.push("phone number");
    if (missing.length > 0) {
      showToast(`Fill required fields: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  function goNext(nextStage, validate) {
    if (validate && !validate()) return;
    saveDraft(form);
    setStage(nextStage);
  }

  function goToAccountStep() {
    if (!agreedToTerms) { showToast("Please accept the Terms & Conditions to continue"); return; }
    saveDraft({ ...form, phone: form.phone || phone || "" });
    setStage("account");
  }

  async function saveProfileAfterAuth(newUserId) {
    let photoUrl = form.photo_url && !form.photo_url.startsWith("blob:") ? form.photo_url : "";
    if (pendingPhotoFile) {
      const { url } = await uploadProfilePhoto(newUserId, pendingPhotoFile);
      if (url) photoUrl = url;
    }
    const ageValue = Number(
      String(form.age ?? document.getElementById("register-age")?.value ?? "").trim()
    );
    if (!Number.isFinite(ageValue) || ageValue < 18 || ageValue > 70) {
      setError("Please select a valid age (18–70) before saving.");
      return false;
    }
    const record = {
      ...form, id: newUserId, status: "pending", photo_url: photoUrl,
      age: ageValue,
      pref_age_min: form.pref_age_min ? Number(form.pref_age_min) : null,
      pref_age_max: form.pref_age_max ? Number(form.pref_age_max) : null,
      phone: form.phone || phone,
      security_answer: securityAnswer || null,
    };
    const { error: profileError } = await upsertProfile(record);
    if (profileError) {
      setError(profileError.message || "Could not save your profile. Please try again.");
      return false;
    }
    return true;
  }

  async function handleSendOtp() {
    setError("");
    if (!agreedToTerms) { setError("Please accept the Terms & Conditions to continue"); return; }
    if (!email || !password) { setError("Enter your email and choose a password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!securityAnswer.trim()) { setError("Enter your mother's name (used to recover your password later)"); return; }
    setLoading(true);
    const { error } = await sendEmailOtp(email);
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStage("otp");
    showToast("OTP sent to your email");
  }

  async function handleVerifyOtp() {
    setError("");
    if (!otp) { setError("Enter the OTP sent to your email"); return; }
    setLoading(true);
    const { data, error } = await verifyEmailOtp(email, otp, password);
    setLoading(false);
    if (error) { setError("Invalid or expired OTP, or password could not be set"); return; }
    const newUserId = data?.session?.user?.id;
    if (newUserId) {
      const saved = await saveProfileAfterAuth(newUserId);
      if (!saved) return;
    }
    try { localStorage.removeItem(REGISTRATION_DRAFT_KEY); } catch (_) {}
    showToast("Account created. Please complete your profile.");
    onNavigate("editProfile");
  }

  async function handlePhoneSignup() {
    setError("");
    if (!agreedToTerms) { setError("Please accept the Terms & Conditions to continue"); return; }
    if (!phone || !password) { setError("Enter phone number and password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!securityAnswer.trim()) { setError("Enter your mother's name (used to recover your password later)"); return; }
    setLoading(true);
    const { data, error } = await signUpWithPhone(phone, password, form.name);
    setLoading(false);
    if (error) {
      setError(error.message.includes("already registered") ? "This phone number is already registered. Try logging in." : error.message);
      return;
    }
    const newUserId = data?.session?.user?.id;
    if (newUserId) {
      const saved = await saveProfileAfterAuth(newUserId);
      if (!saved) return;
    }
    try { localStorage.removeItem(REGISTRATION_DRAFT_KEY); } catch (_) {}
    showToast("Account created. Please complete your profile.");
    onNavigate("editProfile");
  }

  const stepIndex = { basics: 0, location: 1, preference: 2, account: 3, otp: 3 }[stage] ?? 0;

  // ---- Step 1: Basics ----
  if (stage === "basics") {
    return (
      <div>
        <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />
        <StepCard colors={colors}>
          <h2 className="serif" style={{ fontSize: 19, marginBottom: 4, letterSpacing: -0.2 }}>Let's start with the basics</h2>
          <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 18, lineHeight: 1.55 }}>
            Just a few essentials to get going — you can add more later.
            <br />சில அடிப்படை விவரங்கள் மட்டும் இப்போது தேவை.
          </p>

          <SelectField
            label="This profile is for / இந்த விவரம் யாருக்காக"
            value={form.profile_for}
            onChange={v => setForm(f => ({ ...f, profile_for: v }))}
            options={["Self", "Son", "Daughter"]}
          />

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <div style={{ position: "relative" }}>
              <Avatar name={form.name} gender={form.gender} photoUrl={form.photo_url} size={90} />
              <button onClick={() => fileRef.current?.click()} style={{
                position: "absolute", bottom: -2, right: -2, width: 30, height: 30, borderRadius: "50%",
                background: colors.primary, border: `2px solid ${colors.card}`, display: "flex",
                alignItems: "center", justifyContent: "center", color: colors.primaryText,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 10.5, color: colors.textFaint, marginBottom: 18, marginTop: -10 }}>
            Optional — you can add this later. Max 50KB if adding now.
          </div>

          <TextField label="Full name / முழு பெயர்" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <SelectField label="Gender / பாலினம்" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} options={["Male", "Female"]} />
            <SelectField id="register-age" label="Age / வயது" value={String(form.age ?? "")} onChange={v => setForm(f => ({ ...f, age: String(v) }))} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} required />
            <TextField label="Caste / சாதி" value={form.caste} onChange={v => setForm(f => ({ ...f, caste: v }))} required />
            <MasterListSelect label="Sub caste / உட்பிரிவு" value={form.sub_caste} onChange={v => setForm(f => ({ ...f, sub_caste: v }))} options={subCasteOptions} required />
            <MasterListSelect label="Education / கல்வி" value={form.education} onChange={v => setForm(f => ({ ...f, education: v }))} options={educationOptions} />
            <MasterListSelect label="Occupation / தொழில்" value={form.occupation} onChange={v => setForm(f => ({ ...f, occupation: v }))} options={occupationOptions} required />
          </div>

          <div style={{ marginTop: 8 }}>
            <PrimaryButton onClick={() => goNext("location", validateBasics)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Continue / தொடரவும் <ArrowRight size={15} />
            </PrimaryButton>
          </div>
        </StepCard>

        <p style={{ fontSize: 12.5, color: colors.textFaint, marginTop: 18, textAlign: "center" }}>
          Already have an account? / ஏற்கனவே கணக்கு உள்ளதா?{" "}
          <button onClick={() => onNavigate("login")} style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12.5, padding: 0 }}>
            Log in / உள்நுழையவும்
          </button>
        </p>
      </div>
    );
  }

  // ---- Step 2: Location & contact ----
  if (stage === "location") {
    return (
      <div>
        <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />
        <BackLink onClick={() => setStage("basics")} colors={colors}>Back / பின்செல்ல</BackLink>
        <StepCard colors={colors}>
          <h2 className="serif" style={{ fontSize: 19, marginBottom: 4, letterSpacing: -0.2 }}>Where are you based?</h2>
          <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 18, lineHeight: 1.55 }}>
            This stays visible to the admin only — your exact address is never shown to other members.
            <br />உங்கள் முகவரி நிர்வாகிக்கு மட்டுமே தெரியும்.
          </p>

          <TextField label="Address / முகவரி" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Door no, street, area" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <MasterListSelect label="District / மாவட்டம்" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} options={districtOptions} required />
            <MasterListSelect label="City / ஊர்" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} options={cityOptions} required />
          </div>
          <MasterListSelect label="State / மாநிலம்" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} options={stateOptions} required />
          <TextField label="Phone number / தொலைபேசி எண் (kept private, admin only)" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="10-digit mobile number" required />

          <div style={{ marginTop: 8 }}>
            <PrimaryButton onClick={() => goNext("preference", validateLocation)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Continue / தொடரவும் <ArrowRight size={15} />
            </PrimaryButton>
          </div>
        </StepCard>
      </div>
    );
  }

  // ---- Step 3: Partner preference (optional, skippable) ----
  if (stage === "preference") {
    return (
      <div>
        <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />
        <BackLink onClick={() => setStage("location")} colors={colors}>Back / பின்செல்ல</BackLink>
        <StepCard colors={colors}>
          <h2 className="serif" style={{ fontSize: 19, marginBottom: 4, letterSpacing: -0.2 }}>Partner preference</h2>
          <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 18, lineHeight: 1.55 }}>
            Optional — helps us show better matches. Skip this and add it anytime from your dashboard.
            <br />விருப்பமானது — இப்போது தவிர்த்து பின்னர் சேர்க்கலாம்.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <SelectField label="Preferred min age / குறைந்தபட்ச வயது" value={String(form.pref_age_min || "")} onChange={v => setForm(f => ({ ...f, pref_age_min: v }))} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} />
            <SelectField label="Preferred max age / அதிகபட்ச வயது" value={String(form.pref_age_max || "")} onChange={v => setForm(f => ({ ...f, pref_age_max: v }))} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} />
          </div>
          <MasterListSelect label="Preferred education / விரும்பும் கல்வி" value={form.pref_education} onChange={v => setForm(f => ({ ...f, pref_education: v }))} options={educationOptions} />
          <MasterListSelect label="Preferred occupation / விரும்பும் தொழில்" value={form.pref_occupation} onChange={v => setForm(f => ({ ...f, pref_occupation: v }))} options={occupationOptions} />

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={goToAccountStep} style={{
              flex: "0 0 auto", background: "none", border: `1.5px solid ${colors.cardBorder}`, color: colors.textMuted,
              borderRadius: 11, padding: "13.5px 16px", fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <SkipForward size={15} /> Skip
            </button>
            <PrimaryButton onClick={goToAccountStep} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              Continue / தொடரவும் <ArrowRight size={15} />
            </PrimaryButton>
          </div>
        </StepCard>
      </div>
    );
  }

  // ---- Step 4: Account creation ----
  if (stage === "account") {
    return (
      <div>
        <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />
        <BackLink onClick={() => setStage("preference")} colors={colors}>Back / பின்செல்ல</BackLink>
        <StepCard colors={colors}>
          <h2 className="serif" style={{ fontSize: 19, marginBottom: 4, letterSpacing: -0.2 }}>Almost done — create your login</h2>
          <p style={{ fontSize: 12.5, color: colors.textFaint, marginBottom: 18, lineHeight: 1.55 }}>
            Your profile details are saved. Create a login below to submit them for admin approval.
            <br />உங்கள் விவரங்கள் சேமிக்கப்பட்டுள்ளன. இப்போது கணக்கை உருவாக்கவும்.
          </p>

          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: colors.bgSubtle, borderRadius: 11, padding: 4, border: `1px solid ${colors.cardBorder}` }}>
            <button onClick={() => { setMethod("email"); setError(""); }} style={{
              flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
              background: method === "email" ? colors.primary : "transparent",
              color: method === "email" ? colors.primaryText : colors.textMuted,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: method === "email" ? "0 2px 6px rgba(74,21,36,0.2)" : "none",
            }}><Mail size={14} /> Email OTP</button>
            <button onClick={() => { setMethod("phone"); setError(""); }} style={{
              flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
              background: method === "phone" ? colors.primary : "transparent",
              color: method === "phone" ? colors.primaryText : colors.textMuted,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: method === "phone" ? "0 2px 6px rgba(74,21,36,0.2)" : "none",
            }}><Phone size={14} /> Phone + password</button>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12.5, color: colors.textMuted, lineHeight: 1.5 }}>
              I agree to the{" "}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12.5, padding: 0, textDecoration: "underline" }}
              >
                Terms & Conditions
              </button>
              {" "}/ நான் <button
                type="button"
                onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12.5, padding: 0, textDecoration: "underline" }}
              >
                விதிமுறைகளை
              </button> ஏற்கிறேன்
            </span>
          </label>

          {method === "email" && (
            <>
              <TextField label="Email address / மின்னஞ்சல்" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
              <TextField label="Password / கடவுச்சொல்" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required />
              <TextField label="Mother's name / தாயின் பெயர்" value={securityAnswer} onChange={setSecurityAnswer} placeholder="Used to recover your password later" required />
              <p style={{ fontSize: 11.5, color: colors.textFaint, marginTop: -10, marginBottom: 14, lineHeight: 1.5 }}>
                You'll verify your email with an OTP now, then use this password to log in next time. If you forget it, you'll need your mother's name to reset it.
              </p>
              {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
              <PrimaryButton onClick={handleSendOtp} disabled={loading || !agreedToTerms}>
                {loading ? "Sending OTP…" : "Send OTP to email / OTP அனுப்பவும்"}
              </PrimaryButton>
            </>
          )}

          {method === "phone" && (
            <>
              <TextField label="Phone number / தொலைபேசி எண்" value={phone} onChange={setPhone} placeholder="10-digit mobile number" required />
              <TextField label="Password / கடவுச்சொல்" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required />
              <TextField label="Mother's name / தாயின் பெயர்" value={securityAnswer} onChange={setSecurityAnswer} placeholder="Used to recover your password later" required />
              <p style={{ fontSize: 11.5, color: colors.textFaint, marginTop: -10, marginBottom: 14, lineHeight: 1.5 }}>
                If you forget your password, you'll need this answer to reset it — please remember it.
              </p>
              {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
              <PrimaryButton onClick={handlePhoneSignup} disabled={loading || !agreedToTerms}>
                {loading ? "Creating account…" : "Create account / கணக்கு உருவாக்கவும்"}
              </PrimaryButton>
            </>
          )}

          {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
        </StepCard>
      </div>
    );
  }

  // ---- Step 5: OTP verification (email method only) ----
  return (
    <div>
      <Stepper steps={STEP_LABELS} currentIndex={stepIndex} />
      <StepCard colors={colors}>
        <h2 className="serif" style={{ fontSize: 18, marginBottom: 4, letterSpacing: -0.2 }}>Verify your email</h2>
        <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 16, lineHeight: 1.55 }}>
          We sent a 6-digit code to <b style={{ color: colors.text }}>{email}</b>. Enter it below.
          <br />6 இலக்க குறியீடு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.
        </p>
        <TextField label="OTP code / OTP குறியீடு" value={otp} onChange={setOtp} placeholder="6-digit code" required />
        {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
        <PrimaryButton onClick={handleVerifyOtp} disabled={loading}>
          {loading ? "Verifying…" : "Verify & finish / சரிபார்த்து முடிக்கவும்"}
        </PrimaryButton>
        <button onClick={() => setStage("account")} style={{
          width: "100%", background: "none", border: "none", color: colors.textFaint, fontSize: 12.5, marginTop: 12, fontWeight: 600,
        }}>
          Change email / resend / மின்னஞ்சலை மாற்றவும்
        </button>
      </StepCard>
    </div>
  );
}
