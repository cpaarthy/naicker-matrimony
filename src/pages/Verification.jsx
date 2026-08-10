import React, { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck, Clock3 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fetchMyVerification, submitVerificationRequest } from "../data/queries";
import { PrimaryButton, TextField } from "../components/ui";

export default function Verification({ showToast }) {
  const { colors } = useTheme();
  const { userId, profile } = useAuth();
  const [status, setStatus] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (userId) fetchMyVerification(userId).then(({ data }) => setStatus(data)); }, [userId]);
  async function request() { setSaving(true); const { data, error } = await submitVerificationRequest({ userId, type: "identity", note }); setSaving(false); if (error) { showToast?.("Could not submit verification request"); return; } setStatus(data); showToast?.("Verification request submitted"); }
  if (!userId) return <div style={{ padding: 40, textAlign: "center" }}>Please login first.</div>;
  const verified = status?.status === "approved";
  return <div>
    <h2 className="serif" style={{ fontSize: 20 }}>Profile Verification / சுயவிவர சரிபார்ப்பு</h2>
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 16, padding: 18, textAlign: "center", marginBottom: 14 }}>
      <div style={{ width: 62, height: 62, borderRadius: "50%", margin: "0 auto 10px", display: "grid", placeItems: "center", background: verified ? colors.approvedBg : colors.pendingBg, color: verified ? colors.approvedText : colors.pendingText }}>{verified ? <BadgeCheck size={32} /> : status?.status === "pending" ? <Clock3 size={30} /> : <ShieldCheck size={30} />}</div>
      <div className="serif" style={{ fontSize: 18, fontWeight: 800 }}>{verified ? "Verified Profile" : status?.status === "pending" ? "Verification under review" : "Build trust with verification"}</div>
      <p style={{ fontSize: 12.5, color: colors.textMuted, lineHeight: 1.6 }}>A verification badge helps other members feel more confident. Admin can review your request and mark it approved.</p>
      {!verified && status?.status !== "pending" && <><TextField label="Note for admin / நிர்வாகிக்கு குறிப்பு" value={note} onChange={setNote} placeholder="I am ready for profile verification" /><PrimaryButton onClick={request} disabled={saving}>{saving ? "Submitting…" : "Request verification"}</PrimaryButton></>}
    </div>
    <div style={{ background: colors.pendingBg, borderRadius: 12, padding: 13, fontSize: 11.5, color: colors.pendingText }}>Your account email/phone is already handled by authentication. Verification here is an additional profile-trust workflow controlled by the admin.</div>
  </div>;
}
