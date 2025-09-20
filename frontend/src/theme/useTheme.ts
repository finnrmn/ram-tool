import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

type ThemeSnapshot = {
  theme: Theme;
  ready: boolean;
};

let currentTheme: Theme = "light";
let isReady = false;
let initialized = false;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const applyThemeToDocument = () => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (currentTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.style.colorScheme = currentTheme;
};

const readStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem("theme");
  return stored === "dark" || stored === "light" ? stored : null;
};

const readSystemPreference = (): Theme | null => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const ensureInitialized = () => {
  if (initialized || typeof window === "undefined") {
    return;
  }
  initialized = true;
  const storedTheme = readStoredTheme();
  const initialTheme = storedTheme ?? readSystemPreference() ?? "light";
  currentTheme = initialTheme;
  isReady = true;
  applyThemeToDocument();

  window.addEventListener("storage", (event) => {
    if (event.key === "theme") {
      const value = event.newValue === "dark" ? "dark" : event.newValue === "light" ? "light" : null;
      if (value && value !== currentTheme) {
        currentTheme = value;
        applyThemeToDocument();
        notify();
      }
    }
  });
};

const setThemeInternal = (nextTheme: Theme, persist = true) => {
  if (currentTheme === nextTheme) {
    return;
  }
  currentTheme = nextTheme;
  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem("theme", nextTheme);
  }
  applyThemeToDocument();
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): ThemeSnapshot => ({ theme: currentTheme, ready: isReady });

const getServerSnapshot = (): ThemeSnapshot => ({ theme: "light", ready: false });

export const useTheme = () => {
  if (typeof window !== "undefined") {
    ensureInitialized();
  }

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeInternal(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeInternal(snapshot.theme === "dark" ? "light" : "dark");
  }, [snapshot.theme]);

  return {
    theme: snapshot.theme,
    isDark: snapshot.theme === "dark",
    setTheme,
    toggleTheme,
    ready: snapshot.ready,
  };
};
