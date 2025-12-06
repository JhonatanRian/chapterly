import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/auth.service";
import type {
  AuthStore,
  LoginCredentials,
  RegisterData,
  UserProfile,
} from "../types";
import { STORAGE_KEYS } from "../utils/constants";

// BroadcastChannel para sincronizar entre abas
const authChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("auth_channel")
    : null;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            token: response.access,
            refreshToken: response.refresh,
            isAuthenticated: true,
            isLoading: false,
          });

          // Notificar outras abas sobre o login
          authChannel?.postMessage({ type: "LOGIN" });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            token: response.access,
            refreshToken: response.refresh,
            isAuthenticated: true,
            isLoading: false,
          });

          // Notificar outras abas sobre o registro/login
          authChannel?.postMessage({ type: "LOGIN" });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        // Tentar chamar o backend PRIMEIRO (mas não bloquear)
        const logoutPromise = authService.logout().catch((error) => {
          // Ignorar erros do backend - o importante é limpar o frontend
          console.warn("Backend logout falhou (isso é ok):", error);
        });

        // Limpar estado local IMEDIATAMENTE (síncrono)
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // Limpar localStorage manualmente (zustand persist pode demorar)
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

        // Notificar outras abas sobre o logout
        authChannel?.postMessage({ type: "LOGOUT" });

        // Aguardar logout do backend (sem bloquear a UI)
        await logoutPromise;
      },

      setUser: (user: UserProfile) => {
        set({ user });
      },

      setTokens: (access: string, refresh: string) => {
        set({
          token: access,
          refreshToken: refresh,
          isAuthenticated: true,
        });
      },

      refreshAccessToken: async () => {
        try {
          const response = await authService.refreshToken();
          set({ token: response.access });

          // Notificar outras abas que o token foi renovado
          authChannel?.postMessage({
            type: "TOKEN_REFRESHED",
            payload: { token: response.access },
          });
        } catch (error) {
          // Se falhar, fazer logout
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Função para inicializar o store com dados do localStorage
export function initAuthStore() {
  const token = authService.getAccessToken();
  const refreshToken = authService.getRefreshToken();
  const user = authService.getUser();

  if (token && refreshToken && user) {
    useAuthStore.setState({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
    });
  }
}
