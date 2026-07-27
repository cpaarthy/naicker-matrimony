import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const palettes = {
  light: {
    bg: "#f4ede0",
    card: "#fffdf9",
    cardBorder: "#ecdfc4",
    text: "#2b2419",
    textMuted: "#6b5e4f",
    textFaint: "#8a7a63",
    headerGradient: "linear-gradient(180deg,#3d1220,#5a1a2e)",
    headerText: "#f6ead9",
    accent: "#c9a04e",
    accentText: "#3d1220",
    primary: "#5a1a2e",
    primaryText: "#f6ead9",
    inputBg: "#fffdf9",
    inputBorder: "#d9cdb8",
    pendingBg: "#f8ecd4",
    pendingText: "#8a5a10",
    approvedBg: "#e2f0e6",
    approvedText: "#1f6b3a",
    rejectedBg: "#f7e2e2",
    rejectedText: "#a32d2d",
  },
  dark: {
    bg: "#1a1512",
    card: "#252019",
    cardBorder: "#3a3226",
    text: "#f0e6d2",
    textMuted: "#c4b8a0",
    textFaint: "#a3937a",
    headerGradient: "linear-gradient(180deg,#2a0d16,#3d1220)",
    headerText: "#f6ead9",
    accent: "#d9b568",
    accentText: "#2a1810",
    primary: "#7a2540",
    primaryText: "#f6ead9",
    inputBg: "#2f2820",
    inputBorder: "#4a4030",
    pendingBg: "#3d3320",
    pendingText: "#e0b566",
    approvedBg: "#1f3d2a",
    approvedText: "#6fcf97",
    rejectedBg: "#3d2020",
    rejectedText: "#e08080",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("naicker_theme") || "light");

  useEffect(() => {
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
