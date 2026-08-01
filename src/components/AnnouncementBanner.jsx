import { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { fetchActiveAnnouncement } from "../data/queries";

const DISMISSED_KEY = "naicker_dismissed_announcement_id";

export default function AnnouncementBanner() {
  const { colors } = useTheme();
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchActiveAnnouncement().then(({ data }) => {
      if (data) {
        const dismissedId = sessionStorage.getItem(DISMISSED_KEY);
        if (dismissedId === data.id) {
          setDismissed(true);
        }
        setAnnouncement(data);
      }
    });
  }, []);

  function handleDismiss() {
    if (announcement) sessionStorage.setItem(DISMISSED_KEY, announcement.id);
    setDismissed(true);
  }

  if (!announcement || dismissed) return null;

  return (
    <div style={{
      background: colors.accent, color: colors.accentText, padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 10, fontSize: 12.5,
    }}>
      <Megaphone size={15} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>{announcement.message}</div>
      <button onClick={handleDismiss} style={{
        background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 6, width: 24, height: 24,
        display: "flex", alignItems: "center", justifyContent: "center", color: colors.accentText, flexShrink: 0,
      }}>
        <X size={13} />
      </button>
    </div>
  );
}
