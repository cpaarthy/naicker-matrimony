import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Camera, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, SelectField, MasterListSelect, PrimaryButton, Avatar } from "../components/ui";
import { upsertProfile, uploadProfilePhoto, fetchMasterList } from "../data/queries";

const emptyForm = {
  profile_for: "Self",
  name: "", gender: "Male", age: "", height: "", religion: "Hindu", caste: "Naicker",
  sub_caste: "Malava", education: "", occupation: "", income: "", address: "", district: "",
  city: "", state: "Tamil Nadu", mother_tongue: "Tamil", about: "", phone: "", photo_url: "",
  father_occupation: "", mother_occupation: "", siblings: "", family_type: "Nuclear",
  star: "", rasi: "", birth_time: "", birth_place: "",
  complexion: "", body_type: "", blood_group: "",
  diet: "Vegetarian", smoking: "No", drinking: "No",
  pref_age_min: "", pref_age_max: "", pref_education: "", pref_occupation: "",
};

function SectionTitle({ children }) {
  const { colors } = useTheme();
  return (
    <h3 className="serif" style={{ fontSize: 15, fontWeight: 700, margin: "22px 0 10px", color: colors.primary, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 6 }}>
      {children}
    </h3>
  );
}

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
  const [uploading, setUploading] = useState(false);
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
    if (!form.name || !form.age || !form.city) {
      showToast("Fill required fields (name, age, city)");
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
      pref_age_min: form.pref_age_min ? Number(form.pref_age_min) : null,
      pref_age_max: form.pref_age_max ? Number(form.pref_age_max) : null,
      phone: form.phone || phone,
    };
    await upsertProfile(record);
  }

  async function handleSendOtp() {
    setError("");
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
          Fill in the details below first. You'll create your login at the end.
          <br />முதலில் விவரங்களை நிரப்பவும். இறுதியில் உங்கள் கணக்கை உருவாக்கலாம்.
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

        <SectionTitle>Basic Details / அடிப்படை விவரங்கள்</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <TextField label="Full name / முழு பெயர்" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          </div>
          <SelectField label="Gender / பாலினம்" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} options={["Male", "Female"]} />
          <TextField label="Age / வயது" type="number" value={form.age} onChange={v => setForm(f => ({ ...f, age: v }))} required />
          <TextField label={'Height / உயரம் (e.g. 5\'6")'} value={form.height} onChange={v => setForm(f => ({ ...f, height: v }))} />
          <TextField label="Mother tongue / தாய்மொழி" value={form.mother_tongue} onChange={v => setForm(f => ({ ...f, mother_tongue: v }))} />
          <TextField label="Religion / மதம்" value={form.religion} onChange={v => setForm(f => ({ ...f, religion: v }))} />
          <TextField label="Caste / சாதி" value={form.caste} onChange={v => setForm(f => ({ ...f, caste: v }))} />
          <MasterListSelect label="Sub caste / உட்பிரிவு" value={form.sub_caste} onChange={v => setForm(f => ({ ...f, sub_caste: v }))} options={subCasteOptions} />
          <TextField label="Education / கல்வி" value={form.education} onChange={v => setForm(f => ({ ...f, education: v }))} />
          <TextField label="Occupation / தொழில்" value={form.occupation} onChange={v => setForm(f => ({ ...f, occupation: v }))} />
          <TextField label="Monthly income / மாத வருமானம்" value={form.income} onChange={v => setForm(f => ({ ...f, income: v }))} />
        </div>

        <SectionTitle>Location / இருப்பிடம்</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <TextField label="Address / முகவரி" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Door no, street, area" />
          </div>
          <MasterListSelect label="District / மாவட்டம்" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} options={districtOptions} />
          <MasterListSelect label="City / ஊர்" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} options={cityOptions} required />
          <MasterListSelect label="State / மாநிலம்" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} options={stateOptions} />
        </div>

        <SectionTitle>Family Details / குடும்ப விவரங்கள்</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <TextField label="Father's occupation / தந்தையின் தொழில்" value={form.father_occupation} onChange={v => setForm(f => ({ ...f, father_occupation: v }))} />
          <TextField label="Mother's occupation / தாயின் தொழில்" value={form.mother_occupation} onChange={v => setForm(f => ({ ...f, mother_occupation: v }))} />
          <TextField label="Siblings / உடன்பிறப்புகள்" value={form.siblings} onChange={v => setForm(f => ({ ...f, siblings: v }))} placeholder="e.g. 1 brother, 1 sister" />
          <SelectField label="Family type / குடும்ப வகை" value={form.family_type} onChange={v => setForm(f => ({ ...f, family_type: v }))} options={["Nuclear", "Joint"]} />
        </div>

        <SectionTitle>Horoscope Details / ஜாதக விவரங்கள்</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <TextField label="Star / நட்சத்திரம்" value={form.star} onChange={v => setForm(f => ({ ...f, star: v }))} />
          <TextField label="Rasi / ராசி" value={form.rasi} onChange={v => setForm(f => ({ ...f, rasi: v }))} />
          <TextField label="Birth time / பிறந்த நேரம்" value={form.birth_time} onChange={v => setForm(f => ({ ...f, birth_time: v }))} placeholder="e.g. 6:30 AM" />
          <TextField label="Birth place / பிறந்த ஊர்" value={form.birth_place} onChange={v => setForm(f => ({ ...f, birth_place: v }))} />
        </div>

        <SectionTitle>Physical Attributes / உடல் அமைப்பு</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <TextField label="Complexion / நிறம்" value={form.complexion} onChange={v => setForm(f => ({ ...f, complexion: v }))} placeholder="e.g. Fair, Wheatish, Dark" />
          <TextField label="Body type / உடல் வகை" value={form.body_type} onChange={v => setForm(f => ({ ...f, body_type: v }))} placeholder="e.g. Slim, Average, Athletic" />
          <TextField label="Blood group / இரத்த வகை" value={form.blood_group} onChange={v => setForm(f => ({ ...f, blood_group: v }))} placeholder="e.g. B+" />
        </div>

        <SectionTitle>Lifestyle / வாழ்க்கை முறை</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <SelectField label="Diet / உணவு முறை" value={form.diet} onChange={v => setForm(f => ({ ...f, diet: v }))} options={["Vegetarian", "Non-Vegetarian", "Eggetarian"]} />
          <SelectField label="Smoking / புகைபிடித்தல்" value={form.smoking} onChange={v => setForm(f => ({ ...f, smoking: v }))} options={["No", "Occasionally", "Yes"]} />
          <SelectField label="Drinking / மது அருந்துதல்" value={form.drinking} onChange={v => setForm(f => ({ ...f, drinking: v }))} options={["No", "Occasionally", "Yes"]} />
        </div>

        <SectionTitle>Partner Preference / துணை எதிர்பார்ப்பு</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          <TextField label="Preferred age (min) / குறைந்தபட்ச வயது" type="number" value={form.pref_age_min} onChange={v => setForm(f => ({ ...f, pref_age_min: v }))} />
          <TextField label="Preferred age (max) / அதிகபட்ச வயது" type="number" value={form.pref_age_max} onChange={v => setForm(f => ({ ...f, pref_age_max: v }))} />
          <TextField label="Preferred education / விரும்பும் கல்வி" value={form.pref_education} onChange={v => setForm(f => ({ ...f, pref_education: v }))} />
          <TextField label="Preferred occupation / விரும்பும் தொழில்" value={form.pref_occupation} onChange={v => setForm(f => ({ ...f, pref_occupation: v }))} />
        </div>

        <SectionTitle>About / குறிப்பு</SectionTitle>
        <label style={{ display: "block", marginBottom: 14 }}>
          <textarea
            value={form.about}
            onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
            rows={3}
            placeholder="Family background, hobbies, expectations..."
            style={{
              width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
              fontSize: 15, background: colors.inputBg, color: colors.text, resize: "vertical",
            }}
          />
        </label>

        <TextField label="Phone number / தொலைபேசி எண் (optional here if signing up with phone below)" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="10-digit mobile number" />

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

        {method === "email" && (
          <>
            <TextField label="Email address / மின்னஞ்சல்" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
            {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
            <PrimaryButton onClick={handleSendOtp} disabled={loading}>
              {loading ? "Sending OTP…" : "Send OTP to email / OTP அனுப்பவும்"}
            </PrimaryButton>
          </>
        )}

        {method === "phone" && (
          <>
            <TextField label="Phone number / தொலைபேசி எண்" value={phone} onChange={setPhone} placeholder="10-digit mobile number" required />
            <TextField label="Password / கடவுச்சொல்" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required />
            {error && <ErrorBox colors={colors}>{error}</ErrorBox>}
            <PrimaryButton onClick={handlePhoneSignup} disabled={loading}>
              {loading ? "Creating account…" : "Create account / கணக்கு உருவாக்கவும்"}
            </PrimaryButton>
          </>
        )}
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
