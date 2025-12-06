import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { queryClient } from "@/providers/QueryProvider";
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  user_id: number;
  [key: string]: any;
}

const SESSION_CHECK_INTERVAL = 60 * 1000; // Verificar a cada 1 minuto
const WARNING_TIME = 5 * 60 * 1000; // Avisar 5 minutos antes de expirar
const REFRESH_THRESHOLD = 10 * 60 * 1000; // Tentar refresh 10 minutos antes

// BroadcastChannel para sincronizar entre abas
const authChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("auth_channel")
    : null;

export function useSessionManager() {
  const { token, refreshAccessToken, logout, isAuthenticated } = useAuthStore();
  const checkIntervalRef = useRef<number | undefined>(undefined);
  const hasShownWarningRef = useRef(false);
  const isRefreshingRef = useRef(false);

  /**
   * Decodifica o token JWT e retorna o payload
   */
  const decodeToken = useCallback((token: string): JWTPayload | null => {
    try {
      return jwtDecode<JWTPayload>(token);
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  }, []);

  /**
   * Calcula quanto tempo falta para o token expirar (em ms)
   */
  const getTimeUntilExpiry = useCallback(
    (token: string): number => {
      const decoded = decodeToken(token);
      if (!decoded?.exp) return 0;

      const expiryTime = decoded.exp * 1000; // exp está em segundos
      const now = Date.now();
      return expiryTime - now;
    },
    [decodeToken],
  );

  /**
   * Verifica se o token está válido
   */
  const isTokenValid = useCallback(
    (token: string): boolean => {
      const timeUntilExpiry = getTimeUntilExpiry(token);
      return timeUntilExpiry > 0;
    },
    [getTimeUntilExpiry],
  );

  /**
   * Tenta fazer refresh do token automaticamente
   */
  const attemptTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return; // Já está fazendo refresh
    }

    isRefreshingRef.current = true;

    try {
      await refreshAccessToken();
      hasShownWarningRef.current = false; // Reset warning flag
      toast.success("Sessão renovada automaticamente", {
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      toast.error("Não foi possível renovar a sessão. Faça login novamente.", {
        duration: 6000,
      });

      // Aguardar um pouco para o usuário ver a mensagem antes de deslogar
      setTimeout(() => {
        handleSessionExpired();
      }, 2000);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshAccessToken]);

  /**
   * Trata sessão expirada
   */
  const handleSessionExpired = useCallback(async () => {
    // Limpar cache do React Query
    queryClient.clear();

    // Fazer logout
    await logout();

    // Notificar outras abas
    authChannel?.postMessage({ type: "LOGOUT" });

    // Mostrar toast
    toast.error("Sua sessão expirou. Por favor, faça login novamente.", {
      duration: 5000,
    });

    // Disparar evento customizado para o modal
    window.dispatchEvent(new CustomEvent("session-expired"));
  }, [logout]);

  /**
   * Verifica o estado da sessão
   */
  const checkSession = useCallback(() => {
    if (!token || !isAuthenticated) {
      return;
    }

    // Verificar se o token ainda é válido
    if (!isTokenValid(token)) {
      console.warn("Token expirado detectado");
      handleSessionExpired();
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiry(token);

    // Se falta menos que o threshold de refresh, tentar renovar
    if (timeUntilExpiry < REFRESH_THRESHOLD && timeUntilExpiry > 0) {
      console.log(
        `Token expira em ${Math.round(timeUntilExpiry / 1000 / 60)} minutos. Tentando renovar...`,
      );
      attemptTokenRefresh();
      return;
    }

    // Se falta menos que o tempo de aviso, mostrar warning (apenas uma vez)
    if (
      timeUntilExpiry < WARNING_TIME &&
      timeUntilExpiry > 0 &&
      !hasShownWarningRef.current
    ) {
      const minutesLeft = Math.round(timeUntilExpiry / 1000 / 60);
      toast.warning(
        `Sua sessão expira em ${minutesLeft} minuto${minutesLeft !== 1 ? "s" : ""}`,
        {
          duration: 8000,
        },
      );
      hasShownWarningRef.current = true;
    }
  }, [
    token,
    isAuthenticated,
    isTokenValid,
    getTimeUntilExpiry,
    attemptTokenRefresh,
    handleSessionExpired,
  ]);

  /**
   * Sincroniza estado de autenticação entre abas
   */
  useEffect(() => {
    if (!authChannel) return;

    const handleMessage = (event: MessageEvent) => {
      const { type } = event.data;

      switch (type) {
        case "LOGOUT":
          // Outra aba fez logout, fazer logout aqui também
          logout();
          queryClient.clear();
          window.dispatchEvent(new CustomEvent("session-expired"));
          break;

        case "LOGIN":
          // Outra aba fez login, recarregar a página para atualizar
          window.location.reload();
          break;

        case "TOKEN_REFRESHED":
          // Outra aba renovou o token
          // O Zustand persist já vai sincronizar via localStorage
          break;

        default:
          break;
      }
    };

    authChannel.addEventListener("message", handleMessage);

    return () => {
      authChannel.removeEventListener("message", handleMessage);
    };
  }, [logout]);

  /**
   * Inicia verificação periódica da sessão
   */
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Limpar intervalo se não estiver autenticado
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = undefined;
      }
      return;
    }

    // Verificar imediatamente
    checkSession();

    // Configurar verificação periódica
    checkIntervalRef.current = setInterval(
      checkSession,
      SESSION_CHECK_INTERVAL,
    ) as unknown as number;

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isAuthenticated, token, checkSession]);

  /**
   * Verificar sessão quando a aba ganha foco
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        // Quando o usuário volta para a aba, verificar a sessão
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, checkSession]);

  /**
   * Verificar sessão quando a janela ganha foco
   */
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        checkSession();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, checkSession]);

  /**
   * Detectar mudanças no localStorage (login/logout em outra aba)
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Se o token foi removido em outra aba
      if (
        event.key === "chapterly-user-storage" &&
        !event.newValue &&
        isAuthenticated
      ) {
        console.log("Token removido em outra aba, fazendo logout...");
        logout();
        queryClient.clear();
        window.dispatchEvent(new CustomEvent("session-expired"));
      }

      // Se um novo token foi adicionado em outra aba
      if (
        event.key === "chapterly-user-storage" &&
        event.newValue &&
        !isAuthenticated
      ) {
        console.log("Token adicionado em outra aba, recarregando...");
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isAuthenticated, logout]);

  return {
    checkSession,
    isTokenValid: token ? isTokenValid(token) : false,
    timeUntilExpiry: token ? getTimeUntilExpiry(token) : 0,
  };
}
