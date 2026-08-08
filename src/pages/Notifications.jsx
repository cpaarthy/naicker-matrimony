import React, { useState, useCallback } from "react";
import { Bell, Heart, Check, X as XIcon, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../data/queries";

const ICONS = {
  request_received: Heart,
  request_accepted: Check,
  request_declined: XIcon,
  new_match: Sparkles,
};

export default function Notifications({ onNavigate, setSelectedProfileId }) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await fetchNotifications(userId);
    setNotifications(data);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  async function handleClick(n) {
    if (!n.read) await markNotificationRead(n.id);
    if (n.related_profile_id) {
      setSelectedProfileId(n.related_profile_id);
      onNavigate("profileDetails");
    } else {
      load();
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(userId);
    load();
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div style={{ textAlign: "center", color: colors.textFaint, padding: 40 }}>Loading…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 className="serif" style={{ fontSize: 19, margin: 0 }}>Notifications / அறிவிப்புகள்</h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} style={{
            background: "none", border: "none", color: colors.primary, fontSize: 12, fontWeight: 700, padding: 0,
          }}>Mark all read</button>
        )}
      </div>

      {notifications.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textFaint, background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>
          <Bell size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div style={{ fontWeight: 600, color: colors.text }}>No notifications yet / அறிவிப்புகள் இல்லை</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {notifications.map(n => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <div key={n.id} onClick={() => handleClick(n)} style={{
              background: n.read ? colors.card : colors.pendingBg,
              border: `1px solid ${n.read ? colors.cardBorder : colors.pendingText}`,
              borderRadius: 12, padding: 12, display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: colors.card, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={15} color={colors.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: colors.text }}>{n.message}</div>
                <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.primary, marginTop: 4, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
