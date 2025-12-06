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
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (error) {
          console.error("Erro ao fazer logout:", error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
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
