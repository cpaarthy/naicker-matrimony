import React, { useState, useRef } from "react";
import { Lock, Camera } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, SelectField, MasterListSelect, PrimaryButton, Avatar } from "../components/ui";
import { upsertProfile, uploadProfilePhoto, fetchMasterList } from "../data/queries";

const REGISTRATION_DRAFT_KEY = "naicker_registration_draft";

const emptyForm = {
  profile_for: "Self",
  name: "", gender: "Male", age: "", height: "", religion: "", caste: "",
  sub_caste: "", education: "", occupation: "", income: "", address: "", village: "", district: "",
  city: "", state: "Tamil Nadu", mother_tongue: "", about: "", phone: "", photo_url: "",
  father_occupation: "", mother_occupation: "", siblings: "", family_type: "Nuclear",
  star: "", rasi: "", birth_time: "", birth_place: "",
  complexion: "", body_type: "", blood_group: "",
  diet: "Vegetarian", smoking: "No", drinking: "No",
  pref_age_min: "", pref_age_max: "", pref_education: "", pref_occupation: "",
  security_answer: "",
};

function SectionTitle({ children }) {
  const { colors } = useTheme();
  return (
    <h3 className="serif" style={{ fontSize: 15, fontWeight: 700, margin: "22px 0 10px", color: colors.primary, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 6 }}>
      {children}
    </h3>
  );
}

export default function EditProfile({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { userId, profile, reloadProfile, session } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const [subCasteOptions, setSubCasteOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [starOptions, setStarOptions] = useState([]);
  const [rasiOptions, setRasiOptions] = useState([]);
  const [motherTongueOptions, setMotherTongueOptions] = useState([]);
  const [religionOptions, setReligionOptions] = useState([]);
  const [educationOptions, setEducationOptions] = useState([]);
  const [occupationOptions, setOccupationOptions] = useState([]);
  const [casteOptions, setCasteOptions] = useState([]);
  const [fatherOccupationOptions, setFatherOccupationOptions] = useState([]);
  const [motherOccupationOptions, setMotherOccupationOptions] = useState([]);
  const [siblingsOptions, setSiblingsOptions] = useState([]);
  const [complexionOptions, setComplexionOptions] = useState([]);
  const [bodyTypeOptions, setBodyTypeOptions] = useState([]);
  const [bloodGroupOptions, setBloodGroupOptions] = useState([]);
  const [villageOptions, setVillageOptions] = useState([]);

  React.useEffect(() => {
    loadMasterLists();
  }, []);

  async function loadMasterLists() {
    const results = await Promise.all([
      fetchMasterList("sub_caste"),
      fetchMasterList("city"),
      fetchMasterList("district"),
      fetchMasterList("state"),
      fetchMasterList("star"),
      fetchMasterList("rasi"),
      fetchMasterList("mother_tongue"),
      fetchMasterList("religion"),
      fetchMasterList("education"),
      fetchMasterList("occupation"),
      fetchMasterList("caste"),
      fetchMasterList("father_occupation"),
      fetchMasterList("mother_occupation"),
      fetchMasterList("siblings"),
      fetchMasterList("complexion"),
      fetchMasterList("body_type"),
      fetchMasterList("blood_group"),
      fetchMasterList("village"),
    ]);

    setSubCasteOptions(results[0].data?.map(d => d.value) || []);
    setCityOptions(results[1].data?.map(d => d.value) || []);
    setDistrictOptions(results[2].data?.map(d => d.value) || []);
    setStateOptions(results[3].data?.map(d => d.value) || []);
    setStarOptions(results[4].data?.map(d => d.value) || []);
    setRasiOptions(results[5].data?.map(d => d.value) || []);
    setMotherTongueOptions(results[6].data?.map(d => d.value) || []);
    setReligionOptions(results[7].data?.map(d => d.value) || []);
    setEducationOptions(results[8].data?.map(d => d.value) || []);
    setOccupationOptions(results[9].data?.map(d => d.value) || []);
    setCasteOptions(results[10].data?.map(d => d.value) || []);
    setFatherOccupationOptions(results[11].data?.map(d => d.value) || []);
    setMotherOccupationOptions(results[12].data?.map(d => d.value) || []);
    setSiblingsOptions(results[13].data?.map(d => d.value) || []);
    setComplexionOptions(results[14].data?.map(d => d.value) || []);
    setBodyTypeOptions(results[15].data?.map(d => d.value) || []);
    setBloodGroupOptions(results[16].data?.map(d => d.value) || []);
    setVillageOptions(results[17].data?.map(d => d.value) || []);
  }

  React.useEffect(() => {
    if (profile) {
      let draft = {};
      try {
        const raw = localStorage.getItem(REGISTRATION_DRAFT_KEY);
        if (raw) draft = JSON.parse(raw) || {};
      } catch (_) {}
      const source = { ...draft, ...profile };
      setForm({
        profile_for: source.profile_for || "Self",
        name: source.name || "", gender: source.gender || "Male", age: String(source.age || ""),
        height: source.height || "", religion: source.religion || "", caste: source.caste || "",
        sub_caste: source.sub_caste || "",
        education: source.education || "", occupation: source.occupation || "", income: source.income || "",
        address: source.address || "", village: source.village || "", district: source.district || "",
        city: source.city || "", state: source.state || "Tamil Nadu", mother_tongue: source.mother_tongue || "",
        about: source.about || "", phone: source.phone || "", photo_url: source.photo_url || "",
        father_occupation: source.father_occupation || "", mother_occupation: source.mother_occupation || "",
        siblings: source.siblings || "", family_type: source.family_type || "Nuclear",
        star: source.star || "", rasi: source.rasi || "", birth_time: source.birth_time || "", birth_place: source.birth_place || "",
        complexion: source.complexion || "", body_type: source.body_type || "", blood_group: source.blood_group || "",
        diet: source.diet || "Vegetarian", smoking: source.smoking || "No", drinking: source.drinking || "No",
        pref_age_min: String(source.pref_age_min || ""), pref_age_max: String(source.pref_age_max || ""),
        pref_education: source.pref_education || "", pref_occupation: source.pref_occupation || "",
        security_answer: source.security_answer || "",
      });
    }
  }, [profile]);

  React.useEffect(() => {
    if (profile) return;
    try {
      const raw = localStorage.getItem(REGISTRATION_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) || {};
      setForm(f => ({ ...f, ...draft, age: String(draft.age ?? f.age ?? ""), phone: draft.phone || f.phone || "" }));
    } catch (_) {}
  }, [profile]);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024) { showToast("Photo must be under 50KB / புகைப்படம் 50KB-க்குள் இருக்க வேண்டும்"); return; }
    setUploading(true);
    const { url, error } = await uploadProfilePhoto(userId, file);
    setUploading(false);
    if (error) { showToast("Photo upload failed"); return; }
    setForm(f => ({ ...f, photo_url: url }));
    showToast("Photo uploaded");
  }

  async function handleSubmit() {
    // Read the visible select as a fallback as well as React state. This prevents
    // a stale profile hydration/render from making a selected age look empty.
    const ageFromForm = String(form.age ?? "").trim();
    const ageFromSelect = String(document.getElementById("profile-age")?.value ?? "").trim();
    const normalizedAge = ageFromForm || ageFromSelect;
    const missing = [];
    if (!String(form.name ?? "").trim()) missing.push("name");
    if (!normalizedAge || !Number.isFinite(Number(normalizedAge)) || Number(normalizedAge) < 18 || Number(normalizedAge) > 70) missing.push("age");
    if (!String(form.religion ?? "").trim()) missing.push("religion");
    if (!String(form.caste ?? "").trim()) missing.push("caste");
    if (!String(form.sub_caste ?? "").trim()) missing.push("sub caste");
    if (!String(form.occupation ?? "").trim()) missing.push("occupation");
    if (!String(form.address ?? "").trim()) missing.push("address");
    if (!String(form.district ?? "").trim()) missing.push("district");
    if (!String(form.city ?? "").trim()) missing.push("city");
    if (!String(form.state ?? "").trim()) missing.push("state");
    if (!String(form.phone ?? "").trim()) missing.push("phone number");
    if (missing.length > 0) {
      showToast(`Fill required fields: ${missing.join(", ")}`);
      return;
    }
    setSubmitting(true);
    const keepApproved = profile?.status === "approved";
    const record = {
      ...form, id: userId, status: keepApproved ? "approved" : "pending",
      age: Number(normalizedAge),
      pref_age_min: form.pref_age_min ? Number(form.pref_age_min) : null,
      pref_age_max: form.pref_age_max ? Number(form.pref_age_max) : null,
    };
    console.log("Submitting profile record:", record);
    const result = await upsertProfile(record);
    console.log("Upsert result:", result);
    setSubmitting(false);
    if (result.error) {
      console.error("Profile submission error:", result.error);
      let errorMessage = "Unknown error";
      if (typeof result.error === 'string') {
        errorMessage = result.error;
      } else if (result.error.message) {
        errorMessage = result.error.message;
      } else if (result.error.details) {
        errorMessage = result.error.details;
      } else {
        errorMessage = JSON.stringify(result.error);
      }
      showToast("Could not submit. Try again. Error: " + errorMessage);
      return;
    }
    showToast(keepApproved ? "Profile updated." : "Profile submitted. Waiting for admin approval.");
    await reloadProfile();
    onNavigate("dashboard");
  }

  if (!session) {
    return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Please log in to edit your profile. / தயவுசெய்து உள்நுழையவும்.</div>;
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 4 }}>
        {profile ? "Edit your profile / உங்கள் விவரங்களை திருத்தவும்" : "Complete your profile / உங்கள் விவரங்களை பூர்த்தி செய்யவும்"}
      </h2>
      <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>
        Your phone number is only visible to the admin for verification purposes — it is never shown to other members. Your address is shared with a member only after a mutual interest request is accepted.
        <br /><br />
        உங்கள் தொலைபேசி எண் நிர்வாகி மட்டுமே பார்க்க முடியும். உங்கள் முகவரி, இருதரப்பும் ஒப்புக்கொண்ட பிறகே பகிரப்படும்.
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
      {uploading && <div style={{ textAlign: "center", fontSize: 12.5, color: colors.textFaint, marginBottom: 14 }}>Uploading photo…</div>}
      <div style={{ textAlign: "center", fontSize: 11, color: colors.textFaint, marginBottom: 14, marginTop: -10 }}>
        Max size: 50KB — please compress your photo before uploading / புகைப்படத்தை சுருக்கி பதிவேற்றவும் (அதிகபட்சம் 50KB)
      </div>

      <SectionTitle>Basic Details / அடிப்படை விவரங்கள்</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <TextField label="Full name / முழு பெயர்" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
        </div>
        <SelectField label="Gender / பாலினம்" value={form.gender} onChange={v => setForm(f => ({ ...f, gender: v }))} options={["Male", "Female"]} />
        <SelectField id="profile-age" label="Age / வயது" value={String(form.age ?? "")} onChange={v => setForm(f => ({ ...f, age: String(v) }))} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} required />
        <TextField label={'Height / உயரம் (e.g. 5\'6")'} value={form.height} onChange={v => setForm(f => ({ ...f, height: v }))} />
        <MasterListSelect label="Mother tongue / தாய்மொழி" value={form.mother_tongue} onChange={v => setForm(f => ({ ...f, mother_tongue: v }))} options={motherTongueOptions} />
        <MasterListSelect label="Religion / மதம்" value={form.religion} onChange={v => setForm(f => ({ ...f, religion: v }))} options={religionOptions} />
        <MasterListSelect label="Caste / சாதி" value={form.caste} onChange={v => setForm(f => ({ ...f, caste: v }))} options={casteOptions} required />
        <MasterListSelect label="Sub caste / உட்பிரிவு" value={form.sub_caste} onChange={v => setForm(f => ({ ...f, sub_caste: v }))} options={subCasteOptions} required />
        <MasterListSelect label="Education / கல்வி" value={form.education} onChange={v => setForm(f => ({ ...f, education: v }))} options={educationOptions} />
        <MasterListSelect label="Occupation / தொழில்" value={form.occupation} onChange={v => setForm(f => ({ ...f, occupation: v }))} options={occupationOptions} required />
        <TextField label="Monthly income / மாத வருமானம்" value={form.income} onChange={v => setForm(f => ({ ...f, income: v }))} />
      </div>

      <SectionTitle>Location / இருப்பிடம்</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <TextField label="Address / முகவரி" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Door no, street, area" required />
        </div>
        <MasterListSelect label="Village / கிராமம்" value={form.village} onChange={v => setForm(f => ({ ...f, village: v }))} options={villageOptions} />
        <MasterListSelect label="District / மாவட்டம்" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} options={districtOptions} required />
        <MasterListSelect label="City / ஊர்" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} options={cityOptions} required />
        <MasterListSelect label="State / மாநிலம்" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} options={stateOptions} required />
      </div>

      <SectionTitle>Family Details / குடும்ப விவரங்கள்</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <MasterListSelect label="Father's occupation / தந்தையின் தொழில்" value={form.father_occupation} onChange={v => setForm(f => ({ ...f, father_occupation: v }))} options={fatherOccupationOptions} />
        <MasterListSelect label="Mother's occupation / தாயின் தொழில்" value={form.mother_occupation} onChange={v => setForm(f => ({ ...f, mother_occupation: v }))} options={motherOccupationOptions} />
        <MasterListSelect label="Siblings / உடன்பிறப்புகள்" value={form.siblings} onChange={v => setForm(f => ({ ...f, siblings: v }))} options={siblingsOptions} />
        <SelectField label="Family type / குடும்ப வகை" value={form.family_type} onChange={v => setForm(f => ({ ...f, family_type: v }))} options={["Nuclear", "Joint"]} />
      </div>

      <SectionTitle>Horoscope Details / ஜாதக விவரங்கள்</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <MasterListSelect label="Star / நட்சத்திரம்" value={form.star} onChange={v => setForm(f => ({ ...f, star: v }))} options={starOptions} />
        <MasterListSelect label="Rasi / ராசி" value={form.rasi} onChange={v => setForm(f => ({ ...f, rasi: v }))} options={rasiOptions} />
        <TextField label="Birth time / பிறந்த நேரம்" value={form.birth_time} onChange={v => setForm(f => ({ ...f, birth_time: v }))} placeholder="e.g. 6:30 AM" />
        <TextField label="Birth place / பிறந்த ஊர்" value={form.birth_place} onChange={v => setForm(f => ({ ...f, birth_place: v }))} />
      </div>

      <SectionTitle>Physical Attributes / உடல் அமைப்பு</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <MasterListSelect label="Complexion / நிறம்" value={form.complexion} onChange={v => setForm(f => ({ ...f, complexion: v }))} options={complexionOptions} />
        <MasterListSelect label="Body type / உடல் வகை" value={form.body_type} onChange={v => setForm(f => ({ ...f, body_type: v }))} options={bodyTypeOptions} />
        <MasterListSelect label="Blood group / இரத்த வகை" value={form.blood_group} onChange={v => setForm(f => ({ ...f, blood_group: v }))} options={bloodGroupOptions} />
      </div>

      <SectionTitle>Lifestyle / வாழ்க்கை முறை</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <SelectField label="Diet / உணவு முறை" value={form.diet} onChange={v => setForm(f => ({ ...f, diet: v }))} options={["Vegetarian", "Non-Vegetarian", "Eggetarian"]} />
        <SelectField label="Smoking / புகைபிடித்தல்" value={form.smoking} onChange={v => setForm(f => ({ ...f, smoking: v }))} options={["No", "Occasionally", "Yes"]} />
        <SelectField label="Drinking / மது அருந்துதல்" value={form.drinking} onChange={v => setForm(f => ({ ...f, drinking: v }))} options={["No", "Occasionally", "Yes"]} />
      </div>

      <SectionTitle>Partner Preference / துணை எதிர்பார்ப்பு</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <SelectField label="Preferred age (min) / குறைந்தபட்ச வயது" value={String(form.pref_age_min || "")} onChange={v => setForm(f => ({ ...f, pref_age_min: v }))} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} />
        <SelectField label="Preferred age (max) / அதிகபட்ச வயது" value={String(form.pref_age_max || "")} onChange={v => setForm(f => ({ ...f, pref_age_max: v }))} options={Array.from({ length: 53 }, (_, i) => String(i + 18))} />
        <MasterListSelect label="Preferred education / விரும்பும் கல்வி" value={form.pref_education} onChange={v => setForm(f => ({ ...f, pref_education: v }))} options={educationOptions} />
        <MasterListSelect label="Preferred occupation / விரும்பும் தொழில்" value={form.pref_occupation} onChange={v => setForm(f => ({ ...f, pref_occupation: v }))} options={occupationOptions} />
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

      <TextField label="Phone number / தொலைபேசி எண் (kept private)" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="10-digit mobile number" required />

      <TextField label="Mother's name (for password recovery) / தாயின் பெயர்" value={form.security_answer} onChange={v => setForm(f => ({ ...f, security_answer: v }))} placeholder="Used if you ever need to reset your password" />

      {profile?.status === "approved" ? (
        <div style={{ background: colors.approvedBg, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: colors.approvedText, display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8, marginBottom: 16 }}>
          <Lock size={14} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>Your profile is already approved. Updates here go live immediately, no re-approval needed. / உங்கள் விவரம் ஏற்கனவே அனுமதிக்கப்பட்டது. மாற்றங்கள் உடனடியாக வெளியிடப்படும்.</span>
        </div>
      ) : (
        <div style={{ background: colors.pendingBg, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: colors.pendingText, display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8, marginBottom: 16 }}>
          <Lock size={14} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>After you submit, an admin reviews your profile before it appears publicly. / சமர்ப்பித்த பிறகு, நிர்வாகி சரிபார்த்த பின்னரே வெளியிடப்படும்.</span>
        </div>
      )}

      <PrimaryButton onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving… / சேமிக்கப்படுகிறது…" : profile?.status === "approved" ? "Save changes / மாற்றங்களை சேமிக்கவும்" : "Submit for approval / சமர்ப்பிக்கவும்"}
      </PrimaryButton>
    </div>
  );
}
