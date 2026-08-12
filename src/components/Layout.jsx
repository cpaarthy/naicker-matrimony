import { ArrowLeft, LogOut, Moon, Sun, Home as HomeIcon, Users, User, Mail, MoreHorizontal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AnnouncementBanner from "./AnnouncementBanner";

export default function Layout({ page, onNavigate, onBack, children }) {
  const { session, logout } = useAuth();
  const { mode, toggle, colors } = useTheme();

  const wrap = {
    maxWidth: 480, margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif",
    color: colors.text, background: colors.bg, minHeight: "100vh", paddingBottom: 76,
  };
  const headerStyle = {
    background: colors.headerGradient, color: colors.headerText, padding: "20px 20px 17px",
    borderRadius: "0 0 22px 22px", position: "sticky", top: 0, zIndex: 25,
    boxShadow: "0 10px 30px rgba(20,6,11,0.28)",
    borderBottom: `1px solid rgba(216,169,80,0.35)`,
  };

  const navItems = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "browse", label: "Browse", icon: Users },
    { key: "dashboard", label: session ? "Dashboard" : "Login", icon: User },
    { key: "contact", label: "Contact", icon: Mail },
    { key: "more", label: "More", icon: MoreHorizontal },
  ];

  return (
    <div style={wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        button { cursor: pointer; font-family: 'Inter', system-ui, sans-serif; }
        body { background: ${colors.bg}; }
        ::selection { background: ${colors.accentSoft}; color: ${colors.text}; }

        .nkm-input:focus {
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 3px ${colors.accentSoft};
        }
        .nkm-btn-primary:hover:not(:disabled) { filter: brightness(1.06); }
        .nkm-btn-primary:active:not(:disabled) { transform: translateY(1px); }

        .nkm-card {
          transition: box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease;
        }
        @media (hover: hover) {
          .nkm-card:hover {
            box-shadow: ${colors.shadowLg};
            border-color: ${colors.cardBorderStrong};
          }
        }
        .nkm-navbtn { transition: color 120ms ease, transform 120ms ease; }
        .nkm-navbtn:active { transform: scale(0.94); }

        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }

        a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible {
          outline: 2px solid ${colors.accent};
          outline-offset: 2px;
        }
      `}</style>

      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => onNavigate("home")} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
              border: "1.5px solid rgba(216,169,80,0.55)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            }}>
              <img src="/images/logo.png" alt="Naicker Matrimony" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div className="serif" style={{ fontSize: 18.5, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.2 }}>Naicker Matrimony</div>
              <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginTop: 1 }}>Trusted community alliances</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={toggle} title="Toggle dark mode" style={{
              background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 9,
              width: 33, height: 33, display: "flex", alignItems: "center", justifyContent: "center",
              color: colors.headerText,
            }}>
              {mode === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            {session && (
              <button onClick={() => { logout(); onNavigate("home"); }} title="Logout" style={{
                background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 9,
                width: 33, height: 33, display: "flex", alignItems: "center", justifyContent: "center",
                color: colors.headerText,
              }}>
                <LogOut size={15} />
              </button>
            )}
            {page !== "home" && (
              <button onClick={onBack} style={{
                background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 9,
                width: 33, height: 33, display: "flex", alignItems: "center", justifyContent: "center",
                color: colors.headerText,
              }}>
                <ArrowLeft size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <AnnouncementBanner />

      <div style={{ padding: "18px 16px 0" }}>
        {children}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
        background: colors.card, borderTop: `1px solid ${colors.cardBorder}`, display: "flex",
        padding: "9px 4px", zIndex: 25, boxShadow: "0 -8px 24px rgba(0,0,0,0.06)",
      }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              className="nkm-navbtn"
              onClick={() => onNavigate(item.key)}
              style={{
                flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, padding: "6px 2px", color: active ? colors.primary : colors.textFaint,
              }}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
