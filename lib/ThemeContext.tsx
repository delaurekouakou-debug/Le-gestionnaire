"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const THEMES = [
  { valeur: "clair", libelle: "Clair" },
  { valeur: "sombre", libelle: "Sombre" },
  { valeur: "epure-ardoise", libelle: "Épuré Ardoise" },
  { valeur: "epure-sauge", libelle: "Épuré Sauge" },
  { valeur: "epure-sable", libelle: "Épuré Sable" },
] as const;

export type Theme = (typeof THEMES)[number]["valeur"];

const CLE_STOCKAGE = "legestionnaire-theme";

interface ThemeContextValue {
  theme: Theme;
  definirTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function themeInitial(): Theme {
  if (typeof window === "undefined") return "clair";
  const stocke = window.localStorage.getItem(CLE_STOCKAGE) as Theme | null;
  return stocke && THEMES.some((t) => t.valeur === stocke) ? stocke : "clair";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(themeInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const definirTheme = (nouveauTheme: Theme) => {
    setTheme(nouveauTheme);
    window.localStorage.setItem(CLE_STOCKAGE, nouveauTheme);
  };

  const value = useMemo(() => ({ theme, definirTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  return ctx;
}
