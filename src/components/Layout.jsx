import { ArrowLeft, LogOut, Moon, Sun, Home as HomeIcon, Users, User, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Layout({ page, onNavigate, onBack, children }) {
  const { session, logout } = useAuth();
  const { mode, toggle, colors } = useTheme();

  const wrap = {
    maxWidth: 480, margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif",
    color: colors.text, background: colors.bg, minHeight: "100vh", paddingBottom: 70,
  };
  const headerStyle = {
    background: colors.headerGradient, color: colors.headerText, padding: "18px 20px 16px",
    borderRadius: "0 0 18px 18px", position: "sticky", top: 0, zIndex: 25,
  };

  const navItems = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "browse", label: "Browse", icon: Users },
    { key: "dashboard", label: session ? "Dashboard" : "Login", icon: User },
    { key: "contact", label: "Contact", icon: Mail },
  ];

  return (
    <div style={wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        button { cursor: pointer; font-family: 'Inter', system-ui, sans-serif; }
        body { background: ${colors.bg}; }
      `}</style>

      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => onNavigate("home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
            }}>
              <img src="/images/logo.png" alt="Naicker Matrimony" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>Naicker Matrimony</div>
              <div style={{ fontSize: 10.5, opacity: 0.75, letterSpacing: 0.4 }}>Trusted community alliances</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={toggle} title="Toggle dark mode" style={{
              background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              color: colors.headerText,
            }}>
              {mode === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            {session && (
              <button onClick={() => { logout(); onNavigate("home"); }} title="Logout" style={{
                background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
                width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                color: colors.headerText,
              }}>
                <LogOut size={15} />
              </button>
            )}
            {page !== "home" && (
              <button onClick={onBack} style={{
                background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
                width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                color: colors.headerText,
              }}>
                <ArrowLeft size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {children}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480,
        background: colors.card, borderTop: `1px solid ${colors.cardBorder}`, display: "flex",
        padding: "8px 4px", zIndex: 25,
      }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2, padding: "6px 2px", color: active ? colors.primary : colors.textFaint,
              }}
            >
              <Icon size={19} />
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
