import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeStore } from "../types";
import { STORAGE_KEYS } from "../utils/constants";

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      // State
      theme: "light",

      // Actions
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";

          // Aplicar tema no documento
          if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }

          return { theme: newTheme };
        });
      },

      setTheme: (theme: "light" | "dark") => {
        set({ theme });

        // Aplicar tema no documento
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
    },
  ),
);

// Função para inicializar o tema
export function initTheme() {
  const theme = useThemeStore.getState().theme;

  // Aplicar tema salvo
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// Detectar preferência do sistema (opcional)
export function detectSystemTheme(): "light" | "dark" {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

// Auto-inicializar tema ao importar
if (typeof window !== "undefined") {
  initTheme();
}
