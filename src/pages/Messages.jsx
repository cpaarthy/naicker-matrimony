import React, { useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, CheckCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/ui";
import { fetchAllProfiles, fetchConversations, fetchMessages, sendMessage, markMessagesRead } from "../data/queries";

export default function Messages({ onNavigate, setSelectedProfileId, showToast }) {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const activeProfile = useMemo(() => profiles.find(p => p.id === activeId), [profiles, activeId]);

  async function load() {
    if (!userId) return;
    setLoading(true);
    const [{ data: ps }, { data: cs }] = await Promise.all([fetchAllProfiles(), fetchConversations(userId)]);
    setProfiles(ps || []);
    setConversations(cs || []);
    if (!activeId && cs?.[0]?.other_id) setActiveId(cs[0].other_id);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);
  useEffect(() => {
    if (!userId || !activeId) return;
    fetchMessages(userId, activeId).then(({ data }) => setMessages(data || []));
    markMessagesRead(userId, activeId);
  }, [userId, activeId]);

  async function send() {
    const body = text.trim();
    if (!body || !activeId) return;
    const { error } = await sendMessage({ senderId: userId, receiverId: activeId, body });
    if (error) { showToast?.("Could not send message"); return; }
    setText("");
    const { data } = await fetchMessages(userId, activeId);
    setMessages(data || []);
    load();
  }

  if (!userId) return <div style={{ padding: 40, textAlign: "center" }}>Please login to use messages.</div>;
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: colors.textFaint }}>Loading messages…</div>;

  return <div>
    <h2 className="serif" style={{ fontSize: 20, marginBottom: 6 }}>Messages / செய்திகள்</h2>
    <p style={{ marginTop: 0, fontSize: 12.5, color: colors.textMuted }}>Chat privately after an interest is accepted.</p>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 38%) 1fr", gap: 10, minHeight: 480 }}>
      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, overflow: "auto" }}>
        {conversations.length === 0 && <div style={{ padding: 18, fontSize: 12.5, color: colors.textFaint }}>No conversations yet.</div>}
        {conversations.map(c => {
          const p = profiles.find(x => x.id === c.other_id);
          if (!p) return null;
          return <button key={c.other_id} onClick={() => setActiveId(c.other_id)} style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", padding: 10, border: 0, borderBottom: `1px solid ${colors.cardBorder}`, background: activeId === c.other_id ? colors.pendingBg : "transparent", textAlign: "left" }}>
            <Avatar name={p.name} gender={p.gender} photoUrl={p.photo_url} size={40} />
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 12.5 }}>{p.name}</div><div style={{ fontSize: 10.5, color: colors.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last_body || "Conversation"}</div></div>
          </button>;
        })}
      </div>
      <div style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!activeProfile ? <div style={{ margin: "auto", color: colors.textFaint, textAlign: "center" }}><MessageCircle size={30} /><div>Select a conversation</div></div> : <>
          <button onClick={() => { setSelectedProfileId(activeProfile.id); onNavigate("profileDetails"); }} style={{ padding: 12, border: 0, borderBottom: `1px solid ${colors.cardBorder}`, background: "transparent", display: "flex", alignItems: "center", gap: 9, textAlign: "left" }}><Avatar name={activeProfile.name} gender={activeProfile.gender} photoUrl={activeProfile.photo_url} size={38} /><div><div style={{ fontWeight: 800 }}>{activeProfile.name}</div><div style={{ fontSize: 11, color: colors.textFaint }}>View profile</div></div></button>
          <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
            {messages.map(m => <div key={m.id} style={{ display: "flex", justifyContent: m.sender_id === userId ? "flex-end" : "flex-start", marginBottom: 8 }}><div style={{ maxWidth: "78%", padding: "9px 11px", borderRadius: 12, background: m.sender_id === userId ? colors.primary : colors.pendingBg, color: m.sender_id === userId ? colors.primaryText : colors.text, fontSize: 12.5 }}>{m.body}<div style={{ fontSize: 9.5, opacity: .65, marginTop: 3, display: "flex", justifyContent: "flex-end", gap: 3 }}>{new Date(m.created_at).toLocaleString()} {m.sender_id === userId && <CheckCheck size={11} />}</div></div></div>)}
            {messages.length === 0 && <div style={{ textAlign: "center", color: colors.textFaint, padding: 30, fontSize: 12 }}>Start a respectful conversation.</div>}
          </div>
          <div style={{ display: "flex", gap: 7, padding: 9, borderTop: `1px solid ${colors.cardBorder}` }}><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Type a message…" style={{ flex: 1, minWidth: 0, border: `1px solid ${colors.inputBorder}`, borderRadius: 9, padding: "10px", background: colors.inputBg, color: colors.text }} /><button onClick={send} style={{ width: 42, border: 0, borderRadius: 9, background: colors.primary, color: colors.primaryText }}><Send size={16} /></button></div>
        </>}
      </div>
    </div>
  </div>;
}
