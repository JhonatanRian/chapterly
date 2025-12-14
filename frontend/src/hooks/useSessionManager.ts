import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
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

// Páginas públicas onde o session manager não deve rodar
const PUBLIC_ROUTES = ["/login", "/register"];

// BroadcastChannel para sincronizar entre abas
const authChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("auth_channel")
    : null;

export function useSessionManager() {
  const location = useLocation();
  const { token, refreshAccessToken, logout, isAuthenticated } = useAuthStore();
  const checkIntervalRef = useRef<number | undefined>(undefined);
  const hasShownWarningRef = useRef(false);
  const isRefreshingRef = useRef(false);

  /**
   * Verifica se estamos em uma rota pública
   */
  const isPublicRoute = useCallback(() => {
    return PUBLIC_ROUTES.some((route) => location.pathname.startsWith(route));
  }, [location.pathname]);

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
   * Trata sessão expirada - SIMPLIFICADO para evitar loops
   */
  const handleSessionExpired = useCallback(() => {
    console.log("🔴 Sessão expirada detectada");

    // Limpar cache do React Query
    queryClient.clear();

    // Fazer logout (que vai limpar tudo e notificar outras abas)
    logout();

    // Disparar evento customizado para o modal aparecer
    window.dispatchEvent(new CustomEvent("session-expired"));
  }, [logout]);

  /**
   * Verifica o estado da sessão
   */
  const checkSession = useCallback(() => {
    // CRÍTICO: Não verificar se estiver em rota pública
    if (isPublicRoute()) {
      return;
    }

    // Não verificar se não estiver autenticado
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
    isPublicRoute,
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
          // Outra aba fez logout - apenas se estiver autenticado
          if (isAuthenticated) {
            console.log("🔄 Logout detectado em outra aba");
            logout();
            queryClient.clear();
          }
          break;

        case "LOGIN":
          // Outra aba fez login - apenas se NÃO estiver autenticado
          if (!isAuthenticated) {
            console.log("🔄 Login detectado em outra aba - recarregando");
            window.location.reload();
          }
          break;

        case "TOKEN_REFRESHED":
          // Outra aba renovou o token
          // O Zustand persist já vai sincronizar via localStorage
          console.log("🔄 Token renovado em outra aba");
          break;

        default:
          break;
      }
    };

    authChannel.addEventListener("message", handleMessage);

    return () => {
      authChannel.removeEventListener("message", handleMessage);
    };
  }, [logout, isAuthenticated]);

  /**
   * Inicia verificação periódica da sessão
   */
  useEffect(() => {
    // CRÍTICO: Limpar intervalo e sair se estiver em rota pública
    if (isPublicRoute()) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = undefined;
      }
      return;
    }

    // Limpar intervalo se não estiver autenticado
    if (!isAuthenticated || !token) {
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
  }, [isAuthenticated, token, checkSession, isPublicRoute]);

  /**
   * Verificar sessão quando a aba ganha foco
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Não verificar em rotas públicas
      if (isPublicRoute()) return;

      if (document.visibilityState === "visible" && isAuthenticated) {
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, checkSession, isPublicRoute]);

  /**
   * Verificar sessão quando a janela ganha foco
   */
  useEffect(() => {
    const handleFocus = () => {
      // Não verificar em rotas públicas
      if (isPublicRoute()) return;

      if (isAuthenticated) {
        checkSession();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, checkSession, isPublicRoute]);

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
        console.log("🔄 Token removido em outra aba, fazendo logout...");
        logout();
        queryClient.clear();
      }

      // Se um novo token foi adicionado em outra aba
      if (
        event.key === "chapterly-user-storage" &&
        event.newValue &&
        !isAuthenticated
      ) {
        console.log("🔄 Token adicionado em outra aba, recarregando...");
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isAuthenticated, logout]);

  /**
   * Limpar flags quando mudar de rota
   */
  useEffect(() => {
    // Reset warning flag ao mudar de página
    hasShownWarningRef.current = false;
  }, [location.pathname]);

  return {
    checkSession,
    isTokenValid: token ? isTokenValid(token) : false,
    timeUntilExpiry: token ? getTimeUntilExpiry(token) : 0,
  };
}
