import { useCallback, useEffect, useState } from "react";

const KEY = "recoverylog.theme";
export const THEMES = ["system", "light", "dark"];

const read = () => {
  try {
    const v = window.localStorage.getItem(KEY);
    return THEMES.includes(v) ? v : "system";
  } catch {
    return "system";
  }
};

// "system" leaves both classes off, which is what lets the media query in
// index.css answer. Naming a scheme pins it either way.
const apply = (theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
};

export function useTheme() {
  const [theme, setTheme] = useState(read);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  const choose = useCallback((next) => {
    setTheme(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // A phone with storage blocked still gets the scheme for this session.
    }
  }, []);

  return { theme, choose };
}

// Run before React mounts, so the first paint is already in the right scheme
// rather than flashing the light one and correcting itself.
export const applyStoredTheme = () => apply(read());
