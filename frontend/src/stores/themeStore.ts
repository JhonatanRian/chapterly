import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeStore } from "../types";
import { STORAGE_KEYS } from "../utils/constants";

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      theme: "light",

      // Actions
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "light" ? "dark" : "light";

        // Atualizar estado
        set({ theme: newTheme });

        // Aplicar tema no documento imediatamente
        applyTheme(newTheme);

        console.log(`🌓 Tema alterado: ${currentTheme} → ${newTheme}`);
      },

      setTheme: (theme: "light" | "dark") => {
        set({ theme });
        applyTheme(theme);
        console.log(`🌓 Tema definido: ${theme}`);
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      // Callback quando estado é restaurado do localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("🌓 Tema restaurado do localStorage:", state.theme);
          applyTheme(state.theme);
        }
      },
    },
  ),
);

/**
 * Aplica o tema no documento HTML
 */
function applyTheme(theme: "light" | "dark") {
  const html = document.documentElement;

  if (theme === "dark") {
    html.classList.add("dark");
    html.classList.remove("light");
  } else {
    html.classList.add("light");
    html.classList.remove("dark");
  }

  // Log para debug
  console.log("🌓 Classes do HTML:", html.classList.toString());
}

/**
 * Função para inicializar o tema
 * Chamada automaticamente ao importar o módulo
 */
export function initTheme() {
  const state = useThemeStore.getState();
  const theme = state.theme;

  console.log("🌓 Inicializando tema:", theme);
  applyTheme(theme);
}

/**
 * Detectar preferência do sistema (opcional)
 */
export function detectSystemTheme(): "light" | "dark" {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

/**
 * Aplicar preferência do sistema se não houver tema salvo
 */
export function initThemeWithSystemPreference() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);

  // Se não há tema salvo, usar preferência do sistema
  if (!savedTheme) {
    const systemTheme = detectSystemTheme();
    console.log("🌓 Usando tema do sistema:", systemTheme);
    useThemeStore.getState().setTheme(systemTheme);
  } else {
    // Se há tema salvo, aplicá-lo
    initTheme();
  }
}

// Auto-inicializar tema ao importar
if (typeof window !== "undefined") {
  // Aguardar DOM estar pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initTheme();
    });
  } else {
    initTheme();
  }

  // Detectar mudança na preferência do sistema (opcional)
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      const newTheme = e.matches ? "dark" : "light";
      console.log("🌓 Preferência do sistema mudou:", newTheme);
      // Opcional: atualizar tema automaticamente
      // useThemeStore.getState().setTheme(newTheme);
    });
  }
}
