import React, { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fetchPrivacySettings, savePrivacySettings } from "../data/queries";

const DEFAULTS = { showPhoto: true, showPhone: false, showAddress: false, showLastActive: true };
export default function PrivacySettings({ showToast }) {
  const { colors } = useTheme(); const { userId } = useAuth(); const [settings, setSettings] = useState(DEFAULTS); const [saving, setSaving] = useState(false);
  useEffect(() => { if (userId) fetchPrivacySettings(userId).then(({ data }) => data && setSettings({ ...DEFAULTS, ...data })); }, [userId]);
  async function toggle(key) { const next = { ...settings, [key]: !settings[key] }; setSettings(next); setSaving(true); const { error } = await savePrivacySettings(userId, next); setSaving(false); if (error) showToast?.("Could not save privacy settings"); }
  if (!userId) return <div style={{ padding: 40, textAlign: "center" }}>Please login first.</div>;
  return <div><h2 className="serif" style={{ fontSize: 20 }}>Privacy & Safety / தனியுரிமை மற்றும் பாதுகாப்பு</h2><p style={{ fontSize: 12.5, color: colors.textMuted }}>Control what other members can see.</p>
    <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, overflow: "hidden" }}>
      {[["showPhoto","Show profile photo","சுயவிவரப் புகைப்படத்தைக் காட்டு"],["showPhone","Show phone number","தொலைபேசி எண்ணைக் காட்டு"],["showAddress","Show full address","முழு முகவரியைக் காட்டு"],["showLastActive","Show last active status","கடைசியாக செயல்பட்டதை காட்டு"]].map(([key,en,ta]) => <button key={key} onClick={() => toggle(key)} style={{ width: "100%", border: 0, borderBottom: `1px solid ${colors.cardBorder}`, background: "transparent", padding: 14, display: "flex", alignItems: "center", gap: 11, textAlign: "left" }}><div style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: settings[key] ? colors.approvedBg : colors.rejectedBg, color: settings[key] ? colors.approvedText : colors.rejectedText }}>{settings[key] ? <Eye size={16} /> : <EyeOff size={16} />}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 13 }}>{en}</div><div style={{ fontSize: 10.5, color: colors.textFaint }}>{ta}</div></div><div style={{ fontSize: 11, fontWeight: 800, color: settings[key] ? colors.approvedText : colors.textFaint }}>{settings[key] ? "ON" : "OFF"}</div></button>)}
    </div><div style={{ marginTop: 12, fontSize: 10.5, color: colors.textFaint }}><LockKeyhole size={12} style={{ verticalAlign: "middle" }} /> {saving ? "Saving…" : "Settings are saved automatically."}</div>
  </div>;
}
