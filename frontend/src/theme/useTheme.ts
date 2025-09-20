import { useCallback, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const readStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : null;
  } catch (error) {
    return null;
  }
};

const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? "light");

  useEffect(() => {
    applyTheme(theme);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // ignore private mode write errors
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      const nextTheme = event.newValue === "dark" ? "dark" : "light";
      setThemeState(nextTheme);
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );
};
