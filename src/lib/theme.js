import { useCallback, useEffect, useState } from "react";

const KEY = "recoverylog.theme";
export const THEMES = ["system", "light", "dark"];

// Safari does not apply iOS Dynamic Type to a web app, so a patient who has
// turned system text up gets nothing from it here. Post-operative swelling,
// painkillers and crying all degrade near vision, and this app is used in all
// three states — so the app has to offer the setting itself.
//
// It moves the root font size, and almost everything in the app is sized in rem
// (Tailwind's scale is, including spacing and heights), so a step up grows the
// text and the boxes around it together rather than clipping one inside the
// other.
const SIZE_KEY = "recoverylog.textSize";
export const TEXT_SIZES = [
  { key: "normal", label: "Normal", scale: 1 },
  { key: "large", label: "Large", scale: 1.15 },
  { key: "largest", label: "Largest", scale: 1.3 }
];

const readSize = () => {
  try {
    const v = window.localStorage.getItem(SIZE_KEY);
    return TEXT_SIZES.some((t) => t.key === v) ? v : "normal";
  } catch {
    return "normal";
  }
};

const applySize = (key) => {
  const size = TEXT_SIZES.find((t) => t.key === key) || TEXT_SIZES[0];
  // Cleared rather than set to 100%, so a browser default other than 16px is
  // still honoured at the normal setting.
  document.documentElement.style.fontSize = size.scale === 1 ? "" : `${size.scale * 100}%`;
};

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

export function useTextSize() {
  const [size, setSize] = useState(readSize);

  useEffect(() => {
    applySize(size);
  }, [size]);

  const choose = useCallback((next) => {
    setSize(next);
    try {
      window.localStorage.setItem(SIZE_KEY, next);
    } catch {
      // A phone with storage blocked still gets the size for this session.
    }
  }, []);

  return { size, choose };
}

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
// and at the right size rather than correcting itself a moment later.
export const applyStoredTheme = () => {
  apply(read());
  applySize(readSize());
};
