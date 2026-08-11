import React from "react";
import { HeartHandshake, Quote } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
const stories = [
  { title: "From introduction to engagement", text: "Two families connected through compatible preferences and took the next step together.", tag: "Family alliance" },
  { title: "A simple search, a meaningful connection", text: "Shared values, respectful communication and family involvement made the difference.", tag: "Community match" },
  { title: "Porutham helped start the conversation", text: "The families reviewed the horoscope details and continued with a personal introduction.", tag: "Porutham" },
];
export default function SuccessStories() { const { colors } = useTheme(); return <div><h2 className="serif" style={{ fontSize: 20 }}>Success Stories / வெற்றிக் கதைகள்</h2><p style={{ fontSize: 12.5, color: colors.textMuted }}>A professional matrimonial experience should celebrate respectful family connections.</p>{stories.map((s,i)=><div key={i} style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 15, padding: 16, marginBottom: 11 }}><div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 9 }}><HeartHandshake size={19} color={colors.primary} /><div style={{ fontWeight: 800 }}>{s.title}</div></div><div style={{ fontSize: 12.5, lineHeight: 1.6, color: colors.textMuted }}><Quote size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{s.text}</div><div style={{ marginTop: 10, display: "inline-block", padding: "4px 8px", borderRadius: 999, background: colors.pendingBg, color: colors.pendingText, fontSize: 10.5, fontWeight: 800 }}>{s.tag}</div></div>)}</div>; }
