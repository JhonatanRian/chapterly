import api from './api';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UserProfile,
  UserStats,
  TokenResponse,
} from '../types';
import { ENDPOINTS, STORAGE_KEYS } from '../utils/constants';

/**
 * Serviço de autenticação
 */
class AuthService {
  /**
   * Faz login do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(ENDPOINTS.LOGIN, credentials);

    // Salvar tokens e usuário no localStorage
    if (response.data.access && response.data.refresh) {
      this.saveTokens(response.data.access, response.data.refresh);
      this.saveUser(response.data.user);
    }

    return response.data;
  }

  /**
   * Registra um novo usuário
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(ENDPOINTS.REGISTER, data);

    // Salvar tokens e usuário no localStorage
    if (response.data.access && response.data.refresh) {
      this.saveTokens(response.data.access, response.data.refresh);
      this.saveUser(response.data.user);
    }

    return response.data;
  }

  /**
   * Faz logout do usuário
   */
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      try {
        await api.post(ENDPOINTS.LOGOUT, { refresh: refreshToken });
      } catch (error) {
        // Ignorar erros de logout
        console.error('Erro ao fazer logout:', error);
      }
    }

    // Limpar localStorage
    this.clearAuth();
  }

  /**
   * Atualiza o access token usando o refresh token
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const response = await api.post<TokenResponse>(ENDPOINTS.REFRESH, {
      refresh: refreshToken,
    });

    // Salvar novo access token
    this.saveAccessToken(response.data.access);

    return response.data;
  }

  /**
   * Obtém o perfil do usuário autenticado
   */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>(ENDPOINTS.PROFILE);

    // Atualizar usuário no localStorage
    this.saveUser(response.data);

    return response.data;
  }

  /**
   * Atualiza o perfil do usuário
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.patch<UserProfile>(ENDPOINTS.PROFILE, data);

    // Atualizar usuário no localStorage
    this.saveUser(response.data);

    return response.data;
  }

  /**
   * Obtém estatísticas do usuário
   */
  async getStats(): Promise<UserStats> {
    const response = await api.get<UserStats>(ENDPOINTS.STATS);
    return response.data;
  }

  /**
   * Altera a senha do usuário
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      ENDPOINTS.CHANGE_PASSWORD,
      data
    );
    return response.data;
  }

  // === Helper Methods ===

  /**
   * Salva tokens no localStorage
   */
  saveTokens(access: string, refresh: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  }

  /**
   * Salva apenas o access token
   */
  saveAccessToken(access: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
  }

  /**
   * Salva o usuário no localStorage
   */
  saveUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Obtém o access token do localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Obtém o refresh token do localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Obtém o usuário do localStorage
   */
  getUser(): UserProfile | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Limpa todas as informações de autenticação
   */
  clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

export const authService = new AuthService();
export default authService;
