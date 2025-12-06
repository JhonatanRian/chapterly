import { jwtDecode } from "jwt-decode";
import { STORAGE_KEYS } from "./constants";

interface JWTPayload {
  exp: number;
  user_id: number;
  [key: string]: any;
}

/**
 * Valida se um token JWT está bem formado e não expirado
 */
export function isTokenValid(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  try {
    const decoded = jwtDecode<JWTPayload>(token);

    // Verificar se tem expiração
    if (!decoded.exp) {
      return false;
    }

    // Verificar se não expirou
    const now = Date.now();
    const expiryTime = decoded.exp * 1000; // exp está em segundos

    return expiryTime > now;
  } catch (error) {
    // Token malformado ou inválido
    console.error("Token inválido:", error);
    return false;
  }
}

/**
 * Limpa tokens corrompidos ou expirados do localStorage
 * Deve ser chamado na inicialização do app
 */
export function cleanInvalidTokens(): void {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    let needsCleaning = false;

    // Verificar access token
    if (accessToken && !isTokenValid(accessToken)) {
      console.warn("Access token inválido ou expirado. Removendo...");
      needsCleaning = true;
    }

    // Verificar refresh token
    if (refreshToken && !isTokenValid(refreshToken)) {
      console.warn("Refresh token inválido ou expirado. Removendo...");
      needsCleaning = true;
    }

    // Se algum token estiver inválido, limpar tudo
    if (needsCleaning) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      console.log("Tokens inválidos removidos. Por favor, faça login novamente.");
    }
  } catch (error) {
    console.error("Erro ao validar tokens:", error);
    // Em caso de erro, limpar tudo para segurança
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

/**
 * Obtém informações do token decodificado (se válido)
 */
export function getTokenInfo(token: string): JWTPayload | null {
  if (!isTokenValid(token)) {
    return null;
  }

  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Calcula quanto tempo falta para o token expirar (em milissegundos)
 */
export function getTimeUntilExpiry(token: string): number {
  const info = getTokenInfo(token);
  if (!info?.exp) {
    return 0;
  }

  const expiryTime = info.exp * 1000;
  const now = Date.now();
  return Math.max(0, expiryTime - now);
}

/**
 * Verifica se o token expira em breve (menos de X minutos)
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdMinutes: number = 5
): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(token);
  const threshold = thresholdMinutes * 60 * 1000;
  return timeUntilExpiry > 0 && timeUntilExpiry < threshold;
}
