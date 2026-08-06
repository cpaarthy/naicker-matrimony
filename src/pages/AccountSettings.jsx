import { useState } from "react";
import { Lock, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { TextField, PrimaryButton } from "../components/ui";
import { changeOwnPassword, deleteOwnAccount, toggleProfileVisibility } from "../data/queries";

export default function AccountSettings({ onNavigate, showToast }) {
  const { colors } = useTheme();
  const { logout, profile } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [profileVisible, setProfileVisible] = useState(profile?.visible !== false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  async function handleToggleVisibility() {
    setTogglingVisibility(true);
    const newVisibility = !profileVisible;
    const { error } = await toggleProfileVisibility(profile.id, newVisibility);
    setTogglingVisibility(false);
    if (error) {
      showToast("Could not update visibility: " + error);
      return;
    }
    setProfileVisible(newVisibility);
    showToast(newVisibility ? "Profile is now visible to others" : "Profile is now hidden from others");
  }

  async function handleChangePassword() {
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setSaving(true);
    const { error } = await changeOwnPassword(newPassword);
    setSaving(false);
    if (error) { setError(error); return; }
    setNewPassword("");
    setConfirmPassword("");
    showToast("Password changed successfully");
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    const { error } = await deleteOwnAccount();
    setDeleting(false);
    if (error) { showToast("Could not delete account: " + error); return; }
    await logout();
    onNavigate("home");
  }

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 19, marginBottom: 14 }}>Account Settings / கணக்கு அமைப்புகள்</h2>

      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Lock size={16} color={colors.primary} />
          <div className="serif" style={{ fontWeight: 700, fontSize: 15 }}>Change Password / கடவுச்சொல்லை மாற்றவும்</div>
        </div>

        <TextField label="New password / புதிய கடவுச்சொல்" type="password" value={newPassword} onChange={setNewPassword} placeholder="At least 6 characters" />
        <TextField label="Confirm new password / உறுதிப்படுத்தவும்" type="password" value={confirmPassword} onChange={setConfirmPassword} />

        {error && (
          <div style={{ background: colors.rejectedBg, color: colors.rejectedText, borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <PrimaryButton onClick={handleChangePassword} disabled={saving}>
          {saving ? "Saving…" : "Change password / மாற்றவும்"}
        </PrimaryButton>
      </div>

      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {profileVisible ? <Eye size={16} color={colors.primary} /> : <EyeOff size={16} color={colors.textMuted} />}
          <div className="serif" style={{ fontWeight: 700, fontSize: 15 }}>Profile Visibility / சுயவிவர தெரிவு</div>
        </div>

        <p style={{ fontSize: 12.5, color: colors.textMuted, marginBottom: 12 }}>
          {profileVisible
            ? "Your profile is currently visible to other users. / உங்கள் சுயவிவரம் தற்போது மற்ற பயனர்களுக்கு தெரியும்."
            : "Your profile is currently hidden from other users. / உங்கள் சுயவிவரம் தற்போது மற்ற பயனர்களுக்கு தெரியாது."
          }
        </p>

        <button
          onClick={handleToggleVisibility}
          disabled={togglingVisibility}
          style={{
            background: profileVisible ? colors.pendingBg : colors.approvedBg,
            color: profileVisible ? colors.pendingText : colors.approvedText,
            border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13.5,
            display: "flex", alignItems: "center", gap: 6, opacity: togglingVisibility ? 0.6 : 1,
          }}
        >
          {togglingVisibility ? "Updating…" : profileVisible ? <><EyeOff size={14} /> Hide profile / மறைக்க</> : <><Eye size={14} /> Show profile / காட்டு</>}
        </button>
      </div>

      <div style={{ background: colors.rejectedBg, border: `1px solid ${colors.rejectedText}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={16} color={colors.rejectedText} />
          <div className="serif" style={{ fontWeight: 700, fontSize: 15, color: colors.rejectedText }}>Danger Zone / ஆபத்தான பகுதி</div>
        </div>
        <p style={{ fontSize: 12.5, color: colors.rejectedText, marginBottom: 12 }}>
          Deleting your account is permanent. Your profile, requests, and messages will be removed and cannot be recovered.
          <br />உங்கள் கணக்கை நீக்குவது நிரந்தரமானது. இதை மீட்டெடுக்க முடியாது.
        </p>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            background: colors.rejectedText, color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 16px", fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6,
          }}>
            <Trash2 size={14} /> Delete my account / கணக்கை நீக்கவும்
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 12.5, color: colors.rejectedText, marginBottom: 8, fontWeight: 600 }}>
              Type DELETE below to confirm / உறுதிசெய்ய "DELETE" என தட்டச்சு செய்யவும்
            </p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.rejectedText}`,
                fontSize: 14, background: colors.inputBg, color: colors.text, marginBottom: 10, boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} style={{
                flex: 1, background: "transparent", border: `1px solid ${colors.rejectedText}`, borderRadius: 8,
                padding: "10px", fontSize: 13.5, color: colors.rejectedText,
              }}>Cancel</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                style={{
                  flex: 1, background: colors.rejectedText, color: "#fff", border: "none", borderRadius: 8,
                  padding: "10px", fontWeight: 700, fontSize: 13.5,
                  opacity: deleteConfirmText !== "DELETE" || deleting ? 0.5 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Confirm delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
