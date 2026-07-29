import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Camera, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, SelectField, MasterListSelect, PrimaryButton, Avatar } from "../components/ui";
import TermsModal from "../components/TermsModal";
import { upsertProfile, uploadProfilePhoto, fetchMasterList } from "../data/queries";

const emptyForm = {
  profile_for: "Self",
  name: "", gender: "Male", age: "", caste: "Naicker", sub_caste: "Malava",
  occupation: "", address: "", district: "", city: "", state: "Tamil Nadu",
  phone: "", photo_url: "",
};

function ErrorBox({ children, colors }) {
  return (
    <div style={{ background: colors.rejectedBg, color: colors.rejectedText, borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 14 }}>
      {children}
    </div>
  );
}

export default function Register({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { sendEmailOtp, verifyEmailOtp, signUpWithPhone } = useAuth();

  const [stage, setStage] = useState("profile");
  const [form, setForm] = useState(emptyForm);
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const fileRef = useRef(null);

  const [subCasteOptions, setSubCasteOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMasterList("sub_caste").then(({ data }) => setSubCasteOptions(data.map(d => d.value)));
    fetchMasterList("city").then(({ data }) => setCityOptions(data.map(d => d.value)));
    fetchMasterList("district").then(({ data }) => setDistrictOptions(data.map(d => d.value)));
    fetchMasterList("state").then(({ data }) => setStateOptions(data.map(d => d.value)));
  }, []);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Photo must be under 5MB"); return; }
    setPendingPhotoFile(file);
    setForm(f => ({ ...f, photo_url: URL.createObjectURL(file) }));
  }

  function validateProfileForm() {
    const missing = [];
    if (!form.name) missing.push("name");
    if (!form.age) missing.push("age");
    if (!form.caste) missing.push("caste");
    if (!form.sub_caste) missing.push("sub caste");
    if (!form.occupation) missing.push("occupation");
    if (!form.address) missing.push("address");
    if (!form.district) missing.push("district");
    if (!form.city) missing.push("city");
    if (!form.state) missing.push("state");
    if (!form.phone) missing.push("phone number");
    if (missing.length > 0) {
      showToast(`Fill required fields: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  function goToAccountStep() {
    if (!validateProfileForm()) return;
    setStage("account");
  }

  async function saveProfileAfterAuth(newUserId) {
    let photoUrl = form.photo_url && !form.photo_url.startsWith("blob:") ? form.photo_url : "";
    if (pendingPhotoFile) {
      const { url } = await uploadProfilePhoto(newUserId, pendingPhotoFile);
      if (url) photoUrl = url;
    }
    const record = {
      ...form, id: newUserId, status: "pending", photo_url: photoUrl,
      age: Number(form.age),
      phone: form.phone || phone,
    };
    await upsertProfile(record);
  }

  async function handleSendOtp() {
    setError("");
    if (!agreedToTerms) { setError("Please accept the Terms & Conditions to continue"); return; }
    if (!email) { setError("Enter your email"); return; }
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
    const { data, error } = await verifyEmailOtp(email, otp);
    setLoading(false);
    if (error) { setError("Invalid or expired OTP"); return; }
    const newUserId = data?.session?.user?.id;
    if (newUserId) await saveProfileAfterAuth(newUserId);
    showToast("Account created and profile submitted!");
    onNavigate("dashboard");
  }

  async function handlePhoneSignup() {
    setError("");
    if (!agreedToTerms) { setError("Please accept the Terms & Conditions to continue"); return; }
    if (!phone || !password) { setError("Enter phone number and password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { data, error } = await signUpWithPhone(phone, password, form.name);
    setLoading(false);
    if (error) {
      setError(error.message.includes("already registered") ? "This phone number is already registered. Try logging in." : error.message);
      return;
    }
    const newUserId = data?.session?.user?.id;
    if (newUserId) await saveProfileAfterAuth(newUserId);
    showToast("Account created and profile submitted!");
    onNavigate("dashboard");
  }

  if (stage === "profile") {
    return (
      <div>
        <h2 className="serif" style={{ fontSize: 19, marginBottom: 4 }}>Create your profile / விவரத்தை உருவாக்கவும்</h2>
        <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>
          Fill in the basic details below. You can add more details (family, horoscope, lifestyle, etc.) later from your dashboard after admin approval.
          <br />அடிப்படை விவரங்களை நிரப்பவும். மேலும் விவரங்களை (குடும்பம், ஜாதகம் போன்றவை) அனுமதிக்கப்பட்ட பிறகு சேர்க்கலாம்.
        </p>

        <SelectField
          label="This profile is for / இந்த விவரம் யாருக்காக"
          value={form.profile_for}
          onChange={v => setForm(f => ({ ...f, profile_for: v }))}
          options={["Self", "Son", "Daughter"]}
        />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <Avatar name={form.name} gender={form.gender} photoUrl={form.photo_url} size={90} />
            <button onClick={() => fileRef.current?.click()} style={{
              position: "absolute", bottom: -2, right: -2, width: 30, height: 30, borderRadius: "50%",
              background: colors.primary, border: `2px solid ${colors.bg}`, display: "flex",
              alignItems: "center", justifyContent: "center", color: colors.primaryText,
            }}>
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <TextField label="Full name / முழு பெயர்" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          </div>
          <SelectField label="Gender / பாலினம்" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} options={["Male", "Female"]} />
          <TextField label="Age / வயது" type="number" value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} required />
          <TextField label="Caste / சாதி" value={form.caste} onChange={v => setForm(f => ({ ...f, caste: v }))} required />
          <MasterListSelect label="Sub caste / உட்பிரிவு" value={form.sub_caste} onChange={v => setForm(f => ({ ...f, sub_caste: v }))} options={subCasteOptions} required />
          <TextField label="Occupation / தொழில்" value={form.occupation} onChange={v => setForm(f => ({ ...f, occupation: v }))} required />
          <div style={{ gridColumn: "1 / -1" }}>
            <TextField label="Address / முகவரி" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Door no, street, area" required />
          </div>
          <MasterListSelect label="District / மாவட்டம்" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} options={districtOptions} required />
          <MasterListSelect label="City / ஊர்" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} options={cityOptions} required />
          <MasterListSelect label="State / மாநிலம்" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} options={stateOptions} required />
        </div>

        <TextField label="Phone number / தொலைபேசி எண் (kept private, admin only)" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="10-digit mobile number" required />

        <div style={{ marginTop: 8 }}>
          <PrimaryButton onClick={goToAccountStep}>
            Continue to create login / கணக்கு உருவாக்க தொடரவும்
          </PrimaryButton>
        </div>

        <p style={{ fontSize: 12, color: colors.textFaint, marginTop: 16, textAlign: "center" }}>
          Already have an account? / ஏற்கனவே கணக்கு உள்ளதா?{" "}
          <button onClick={() => onNavigate("login")} style={{ background: "none", border: "none", color: colors.primary, fontWeight: 700, fontSize: 12, padding: 0 }}>
            Log in / உள்நுழையவும்
          </button>
        </p>
      </div>
    );
  }

  if (stage === "account") {
    return (
      <div>
        <button onClick={() => setStage("profile")} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          color: colors.textFaint, fontSize: 12.5, marginBottom: 14, padding: 0,
        }}>
          <ArrowLeft size={14} /> Back to profile details / விவரங்களுக்கு திரும்பு
        </button>

        <h2 className="serif" style={{ fontSize: 19, marginBottom: 4 }}>Almost done — create your login / கணக்கை உருவாக்கவும்</h2>
        <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>
          Your profile details are saved. Create a login below to submit them for admin approval.
          <br />உங்கள் விவரங்கள் சேமிக்கப்பட்டுள்ளன. இப்போது கணக்கை உருவாக்கவும்.
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: colors.pendingBg, borderRadius: 10, padding: 4 }}>
          <button onClick={() => { setMethod("email"); setError(""); }} style={{
            flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
            background: method === "email" ? colors.primary : "transparent",
            color: method === "email" ? colors.primaryText : colors.textMuted,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}><Mail size={14} /> Email OTP</button>
          <button onClick={() => { setMethod("phone"); setError(""); }} style={{
            flex: 1, padding: "9px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12.5,
            background: method === "phone" ? colors.primary : "transparent",
            color: method === "phone" ? colors.primaryText : colors.textMuted,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
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
            {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
            <PrimaryButton onClick={handlePhoneSignup} disabled={loading || !agreedToTerms}>
              {loading ? "Creating account…" : "Create account / கணக்கு உருவாக்கவும்"}
            </PrimaryButton>
          </>
        )}

        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 14 }}>
        We sent a 6-digit code to <b>{email}</b>. Enter it below.
        <br />6 இலக்க குறியீடு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது.
      </p>
      <TextField label="OTP code / OTP குறியீடு" value={otp} onChange={setOtp} placeholder="6-digit code" required />
      {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
      <PrimaryButton onClick={handleVerifyOtp} disabled={loading}>
        {loading ? "Verifying…" : "Verify & finish / சரிபார்த்து முடிக்கவும்"}
      </PrimaryButton>
      <button onClick={() => setStage("account")} style={{
        width: "100%", background: "none", border: "none", color: colors.textFaint, fontSize: 12.5, marginTop: 10,
      }}>
        Change email / resend / மின்னஞ்சலை மாற்றவும்
      </button>
    </div>
  );
}
