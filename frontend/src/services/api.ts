import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, STORAGE_KEYS, ENDPOINTS } from "../utils/constants";
import { toast } from "sonner";

// Criar instância do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Controle de refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Adiciona token JWT às requisições
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Não adicionar token em endpoints de autenticação
    const isAuthEndpoint =
      config.url?.includes(ENDPOINTS.LOGIN) ||
      config.url?.includes(ENDPOINTS.REGISTER) ||
      config.url?.includes(ENDPOINTS.REFRESH);

    if (isAuthEndpoint) {
      return config;
    }

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
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Se o erro não for 401 ou não tiver config, rejeitar
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Se for endpoint de login, refresh ou logout, não tentar renovar
    if (
      originalRequest.url?.includes(ENDPOINTS.LOGIN) ||
      originalRequest.url?.includes(ENDPOINTS.REFRESH) ||
      originalRequest.url?.includes(ENDPOINTS.LOGOUT)
    ) {
      return Promise.reject(error);
    }

    // Se já tentou fazer retry, não tentar novamente
    if (originalRequest._retry) {
      // Token refresh falhou, fazer logout suave
      handleSessionExpired();
      return Promise.reject(error);
    }

    // Se já está fazendo refresh, adicionar à fila
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Marcar como retry e iniciar refresh
    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      isRefreshing = false;
      handleSessionExpired();
      return Promise.reject(error);
    }

    try {
      // Tentar renovar o access token
      const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.REFRESH}`, {
        refresh: refreshToken,
      });

      const { access } = response.data;

      if (!access) {
        throw new Error("Token não retornado pelo servidor");
      }

      // Salvar novo token
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);

      // Atualizar Zustand store
      const userStorage = localStorage.getItem(STORAGE_KEYS.USER);
      if (userStorage) {
        try {
          const parsed = JSON.parse(userStorage);
          parsed.state.token = access;
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
        } catch (e) {
          console.error("Erro ao atualizar token no Zustand:", e);
        }
      }

      // Processar fila de requests pendentes
      processQueue(null, access);

      // Atualizar header da requisição original
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access}`;
      }

      isRefreshing = false;

      // Tentar a requisição novamente
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh falhou
      processQueue(refreshError, null);
      isRefreshing = false;
      handleSessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

/**
 * Trata sessão expirada de forma suave (sem reload forçado)
 */
function handleSessionExpired() {
  // Limpar tokens
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);

  // Mostrar toast informativo
  toast.error("Sua sessão expirou. Por favor, faça login novamente.", {
    duration: 5000,
    id: "session-expired", // Prevenir toasts duplicados
  });

  // Redirecionar suavemente (sem reload)
  // O ProtectedRoute vai lidar com isso ao detectar isAuthenticated = false
  // Usar timeout para dar tempo do toast aparecer
  setTimeout(() => {
    // Dispatch evento customizado para o hook de sessão lidar
    window.dispatchEvent(new CustomEvent("session-expired"));
  }, 500);
}

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
      if (data.error) return data.error;

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

    // Timeout
    if (axiosError.code === "ECONNABORTED") {
      return "A requisição demorou muito. Tente novamente.";
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

// Helper para verificar se é erro de servidor
export function isServerError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status !== undefined && status >= 500 && status < 600;
  }
  return false;
}

// Helper para verificar se é erro de rede
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.message === "Network Error" || error.code === "ERR_NETWORK";
  }
  return false;
}

export default api;
