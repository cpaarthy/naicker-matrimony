import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ShareProfileModal({ profileId, onClose }) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?profile=${profileId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
    }}>
      <div style={{ background: colors.bg, borderRadius: 16, padding: 22, width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 className="serif" style={{ fontSize: 17, margin: 0 }}>Share Profile / பகிரவும்</h3>
          <button onClick={onClose} style={{
            background: colors.card, border: "none", borderRadius: 8, width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted,
          }}>
            <X size={15} />
          </button>
        </div>

        <div style={{
          display: "flex", justifyContent: "center", background: "#fff", borderRadius: 12,
          padding: 16, marginBottom: 16,
        }}>
          <QRCodeSVG value={shareUrl} size={180} level="M" />
        </div>

        <p style={{ fontSize: 11.5, color: colors.textFaint, textAlign: "center", marginBottom: 14 }}>
          Scan this QR code or share the link below. The person will need to log in to view the profile.
          <br />QR குறியீட்டை ஸ்கேன் செய்யவும் அல்லது கீழே உள்ள இணைப்பைப் பகிரவும்.
        </p>

        <div style={{
          display: "flex", gap: 8, background: colors.card, border: `1px solid ${colors.cardBorder}`,
          borderRadius: 10, padding: "10px 12px", marginBottom: 12, alignItems: "center",
        }}>
          <div style={{
            flex: 1, fontSize: 12, color: colors.textMuted, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {shareUrl}
          </div>
        </div>

        <button onClick={handleCopy} style={{
          width: "100%", background: copied ? colors.approvedText : colors.primary, color: "#fff",
          border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Link copied! / நகலெடுக்கப்பட்டது!" : "Copy link / இணைப்பை நகலெடுக்கவும்"}
        </button>
      </div>
    </div>
  );
}
