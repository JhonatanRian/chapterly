import axios, { AxiosError } from "axios";
import { API_BASE_URL, STORAGE_KEYS, ENDPOINTS } from "../utils/constants";

// Criar instância do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Adiciona token JWT às requisições
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Trata erros e refresh de token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Se o erro for 401 (Unauthorized) e não for na rota de login/refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(ENDPOINTS.LOGIN) &&
      !originalRequest.url?.includes(ENDPOINTS.REFRESH)
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // Não tem refresh token, redirecionar para login
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Tentar renovar o access token
        const response = await axios.post(
          `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
          {
            refresh: refreshToken,
          },
        );

        const { access } = response.data;

        // Salvar novo token
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);

        // Atualizar header da requisição original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        // Tentar a requisição novamente
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, limpar tudo e redirecionar para login
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Helper para extrair mensagem de erro da API
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Se tem resposta da API
    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      // Tentar extrair mensagem
      if (data.detail) return data.detail;
      if (data.message) return data.message;

      // Se for um objeto com erros de validação
      if (typeof data === "object" && !Array.isArray(data)) {
        const firstError = Object.values(data)[0];
        if (Array.isArray(firstError)) {
          return firstError[0];
        }
        if (typeof firstError === "string") {
          return firstError;
        }
      }

      // Se for array de erros
      if (Array.isArray(data)) {
        return data[0];
      }
    }

    // Erros de rede
    if (axiosError.message === "Network Error") {
      return "Erro de conexão. Verifique sua internet.";
    }

    return axiosError.message;
  }

  // Erro genérico
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

// Helper para verificar se é erro de autenticação
export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

// Helper para verificar se é erro de permissão
export function isForbiddenError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 403;
  }
  return false;
}

// Helper para verificar se é erro de validação
export function isValidationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 400;
  }
  return false;
}

export default api;
