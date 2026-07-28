import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, PrimaryButton } from "../components/ui";
import { submitContactMessage } from "../data/queries";

export default function Contact({ showToast }) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name || !email || !message) { showToast("Fill all fields"); return; }
    setSubmitting(true);
    const { error } = await submitContactMessage({ name, email, message });
    setSubmitting(false);
    if (error) { showToast("Could not send message. Try again."); return; }
    showToast("Message sent. We'll get back to you soon.");
    setMessage("");
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 4 }}>Contact Us / தொடர்பு கொள்ள</h2>
      <p style={{ fontSize: 13, color: colors.textFaint, marginBottom: 18 }}>
        Have a question or need help? Send us a message. / கேள்வி இருந்தால் எங்களுக்கு அனுப்பவும்.
      </p>

      <TextField label="Your name / உங்கள் பெயர்" value={name} onChange={setName} required />
      <TextField label="Email address / மின்னஞ்சல்" type="email" value={email} onChange={setEmail} required />

      <label style={{ display: "block", marginBottom: 14 }}>
        <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, marginBottom: 5, fontWeight: 600 }}>
          Message / செய்தி <span style={{ color: colors.rejectedText }}>*</span>
        </span>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          placeholder="How can we help?"
          style={{
            width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${colors.inputBorder}`,
            fontSize: 15, background: colors.inputBg, color: colors.text, resize: "vertical",
          }}
        />
      </label>

      <PrimaryButton onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Sending…" : "Send message / அனுப்பவும்"}
      </PrimaryButton>
    </div>
  );
}
