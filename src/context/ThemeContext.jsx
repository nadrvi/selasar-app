import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "selasar-dark-mode";

const ThemeContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const lightTheme = {
  pageBg: "bg-[#EBE7DF]",
  headerBg: "bg-[#EBE7DF]/80",
  cardBg: "bg-white",
  cardBorder: "border-gray-100",
  divider: "bg-gray-100",
  itemHover: "hover:bg-[#F5F2EB]",
  itemActive: "active:bg-[#EBE7DF]",
  textPrimary: "text-[#594A42]",
  textSecondary: "text-[#8B6B4F]",
  iconBg: "bg-[#EBE7DF] text-[#8B6B4F]",
  inputBg: "bg-[#F9F7F3]",
  inputBorder: "border-gray-200",
  circleBtnBg: "bg-white",
  faqBg: "bg-[#F9F7F3]",
};

// eslint-disable-next-line react-refresh/only-export-components
export const darkTheme = {
  pageBg: "bg-[#221D1A]",
  headerBg: "bg-[#221D1A]/80",
  cardBg: "bg-[#2D2723]",
  cardBorder: "border-[#403732]",
  divider: "bg-[#403732]",
  itemHover: "hover:bg-[#3B322D]",
  itemActive: "active:bg-[#403732]",
  textPrimary: "text-[#F5F2EB]",
  textSecondary: "text-[#C8A97E]",
  iconBg: "bg-[#3B322D] text-[#C8A97E]",
  inputBg: "bg-[#312A25]",
  inputBorder: "border-[#463C36]",
  circleBtnBg: "bg-[#3B322D]",
  faqBg: "bg-[#2A2420]",
  primaryButton: "bg-[#8B6B4F]",
  secondaryButton: "bg-[#3B322D]",
  chipBg: "bg-[#3A312C]",
  chipText: "text-[#D7C1A3]",
  glass: "bg-[#2D2723]/80 backdrop-blur-md",
  shadow: "shadow-black/30",
};

function getInitialDarkMode() {
  if (typeof window === "undefined") return false;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved !== null) return saved === "true";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
    window.localStorage.setItem(STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = (e) => {
    const next = !darkMode;
    const applyChange = () => setDarkMode(next);

    if (typeof e?.clientX === "number") {
      document.documentElement.style.setProperty(
        "--reveal-x",
        `${e.clientX}px`,
      );
      document.documentElement.style.setProperty(
        "--reveal-y",
        `${e.clientY}px`,
      );
    }

    if (document.startViewTransition) {
      document.startViewTransition(applyChange);
    } else {
      applyChange();
    }
  };

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme() harus dipanggil di dalam <ThemeProvider>");
  }
  return ctx;
}