import React, { createContext, useContext, useState } from "react";

const ThemeContext = createContext(null);

export const palettes = {
  light: {
    bg: "#f7f2e7",
    bgSubtle: "#f1e9d8",
    card: "#fffdf9",
    cardBorder: "#e7d9bd",
    cardBorderStrong: "#d9c69b",
    text: "#241d16",
    textMuted: "#6b5c48",
    textFaint: "#8d7c62",
    headerGradient: "linear-gradient(165deg,#33101c 0%,#4a1524 55%,#5c1a2c 100%)",
    headerText: "#f8ecd8",
    accent: "#b8862e",
    accentSoft: "#f3e3bd",
    accentText: "#4a1524",
    primary: "#4a1524",
    primaryHover: "#5c1a2c",
    primaryText: "#f8ecd8",
    inputBg: "#fffdf9",
    inputBorder: "#ddceac",
    pendingBg: "#f8ecd0",
    pendingText: "#8a5a10",
    approvedBg: "#e2f0e6",
    approvedText: "#1f6b3a",
    rejectedBg: "#f7e2e2",
    rejectedText: "#a32d2d",
    shadow: "0 1px 2px rgba(36,22,14,0.04), 0 8px 24px rgba(36,22,14,0.07)",
    shadowSm: "0 1px 2px rgba(36,22,14,0.05)",
    shadowLg: "0 10px 40px rgba(74,21,36,0.14)",
  },
  dark: {
    bg: "#17130f",
    bgSubtle: "#1e1913",
    card: "#231d16",
    cardBorder: "#382e21",
    cardBorderStrong: "#4a3d2b",
    text: "#f1e6d2",
    textMuted: "#c7b89e",
    textFaint: "#a3937a",
    headerGradient: "linear-gradient(165deg,#220a10 0%,#33101c 55%,#3d1220 100%)",
    headerText: "#f8ecd8",
    accent: "#d9b568",
    accentSoft: "#3a2f1c",
    accentText: "#2a1810",
    primary: "#7a2540",
    primaryHover: "#8f2c4a",
    primaryText: "#f8ecd8",
    inputBg: "#2a2318",
    inputBorder: "#453a29",
    pendingBg: "#3d3320",
    pendingText: "#e0b566",
    approvedBg: "#1f3d2a",
    approvedText: "#6fcf97",
    rejectedBg: "#3d2020",
    rejectedText: "#e08080",
    shadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35)",
    shadowSm: "0 1px 2px rgba(0,0,0,0.3)",
    shadowLg: "0 10px 40px rgba(0,0,0,0.45)",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("naicker_theme") || "light");

  React.useEffect(() => {
    localStorage.setItem("naicker_theme", mode);
  }, [mode]);

  const toggle = () => setMode(m => (m === "light" ? "dark" : "light"));
  const colors = palettes[mode];

  return (
    <ThemeContext.Provider value={{ mode, toggle, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
