import { useState, useEffect, useRef } from "react";
import { Lock, Camera } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, SelectField, PrimaryButton, Avatar } from "../components/ui";
import { upsertProfile, uploadProfilePhoto } from "../data/queries";

const emptyForm = {
  name: "", gender: "Male", age: "", height: "", religion: "Hindu", caste: "Naicker",
  sub_caste: "Malava", education: "", occupation: "", income: "", address: "", district: "",
  city: "", state: "Tamil Nadu", mother_tongue: "Tamil", about: "", phone: "", photo_url: "",
};

export default function EditProfile({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { userId, profile, reloadProfile, session } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "", gender: profile.gender || "Male", age: String(profile.age || ""),
        height: profile.height || "", religion: profile.religion || "Hindu", caste: profile.caste || "Naicker",
        sub_caste: profile.sub_caste || "Malava",
        education: profile.education || "", occupation: profile.occupation || "", income: profile.income || "",
        address: profile.address || "", district: profile.district || "",
        city: profile.city || "", state: profile.state || "Tamil Nadu", mother_tongue: profile.mother_tongue || "Tamil",
        about: profile.about || "", phone: profile.phone || "", photo_url: profile.photo_url || "",
      });
    }
  }, [profile]);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Photo must be under 5MB"); return; }
    setUploading(true);
    const { url, error } = await uploadProfilePhoto(userId, file);
    setUploading(false);
    if (error) { showToast("Photo upload failed"); return; }
    setForm(f => ({ ...f, photo_url: url }));
    showToast("Photo uploaded");
  }

  async function handleSubmit() {
    if (!form.name || !form.age || !form.phone || !form.city) {
      showToast("Fill required fields (name, age, phone, city)");
      return;
    }
    setSubmitting(true);
    const record = { ...form, age: Number(form.age), status: "pending", id: userId };
    const { error } = await upsertProfile(record);
    setSubmitting(false);
    if (error) { showToast("Could not submit. Try again."); return; }
    showToast("Profile submitted. Waiting for admin approval.");
    await reloadProfile();
    onNavigate("dashboard");
  }

  if (!session) {
    return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Please log in to edit your profile.</div>;
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 4 }}>
        {profile ? "Edit your profile / உங்கள் விவரங்களை திருத்தவும்" : "Complete your profile / உங்கள் விவரங்களை பூர்த்தி செய்யவும்"}
      </h2>
      <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>
        Your phone number is only visible to the admin for verification purposes — it is never shown to other members. Your city/address is shared with a member only after a mutual interest request is accepted.
        <br /><br />
        உங்கள் தொலைபேசி எண் நிர்வாகி மட்டுமே பார்க்க முடியும் — இது மற்ற உறுப்பினர்களுக்கு காட்டப்படாது. உங்கள் முகவரி, இருதரப்பும் ஒப்புக்கொண்ட பிறகே பகிரப்படும்.
      </p>

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
        <TextField label="Sub caste / உட்பிரிவு" value={form.sub_caste} onChange={v => setForm(f => ({ ...f, sub_caste: v }))} />
        <TextField label="Education / கல்வி" value={form.education} onChange={v => setForm(f => ({ ...f, education: v }))} />
        <TextField label="Occupation / தொழில்" value={form.occupation} onChange={v => setForm(f => ({ ...f, occupation: v }))} />
        <TextField label="Monthly income / மாத வருமானம்" value={form.income} onChange={v => setForm(f => ({ ...f, income: v }))} />
        <div style={{ gridColumn: "1 / -1" }}>
          <TextField label="Address / முகவரி" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Door no, street, area" />
        </div>
        <TextField label="District / மாவட்டம்" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} />
        <TextField label="City / ஊர்" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} required />
        <TextField label="State / மாநிலம்" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} />
      </div>

      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>About / குறிப்பு</span>
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

      <div style={{ background: colors.pendingBg, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: colors.pendingText, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16 }}>
        <Lock size={14} style={{ marginTop: 2, flexShrink: 0 }} />
        <span>After you submit, an admin reviews your profile before it appears publicly. / சமர்ப்பித்த பிறகு, நிர்வாகி சரிபார்த்த பின்னரே உங்கள் விவரம் வெளியிடப்படும்.</span>
      </div>

      <PrimaryButton onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting… / சமர்ப்பிக்கப்படுகிறது…" : "Submit for approval / சமர்ப்பிக்கவும்"}
      </PrimaryButton>
    </div>
  );
}
