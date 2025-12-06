import {
  format,
  formatDistanceToNow,
  isPast,
  isFuture,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data no formato brasileiro
 * @param date - Data a ser formatada
 * @param formatString - Formato desejado. Pode ser:
 *   - "relative": tempo relativo (ex: "há 2 horas", "em 3 dias")
 *   - "short": formato curto (ex: "25/01/2025")
 *   - "full": formato completo (ex: "25 de janeiro de 2025 às 14:30")
 *   - Qualquer formato válido do date-fns (ex: "dd/MM/yyyy HH:mm")
 * @returns Data formatada
 *
 * @example
 * formatDate(date, "relative") // "há 2 horas"
 * formatDate(date, "short") // "25/01/2025"
 * formatDate(date, "full") // "25 de janeiro de 2025 às 14:30"
 * formatDate(date, "dd/MM/yyyy HH:mm") // "25/01/2025 14:30"
 */
export function formatDate(
  date: string | Date,
  formatString: string = "dd/MM/yyyy",
): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Handle special format shortcuts
  if (formatString === "relative") {
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
  }

  if (formatString === "short") {
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  }

  if (formatString === "full") {
    return format(dateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  }

  return format(dateObj, formatString, { locale: ptBR });
}

/**
 * Formata data e hora no formato brasileiro
 * @param date - Data a ser formatada
 * @returns Data e hora formatada
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/**
 * Retorna o tempo relativo (ex: "há 2 horas", "em 3 dias")
 * @param date - Data a ser formatada
 * @returns Tempo relativo
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
}

/**
 * Verifica se a data é passada
 * @param date - Data a ser verificada
 * @returns true se a data é passada
 */
export function isDatePast(date: string | Date): boolean {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isPast(dateObj);
}

/**
 * Verifica se a data é futura
 * @param date - Data a ser verificada
 * @returns true se a data é futura
 */
export function isDateFuture(date: string | Date): boolean {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isFuture(dateObj);
}

/**
 * Verifica se a data é hoje
 * @param date - Data a ser verificada
 * @returns true se a data é hoje
 */
export function isDateToday(date: string | Date): boolean {
  if (!date) return false;
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return isToday(dateObj);
}

/**
 * Formata data para o formato ISO (para enviar à API)
 * @param date - Data a ser formatada
 * @returns Data no formato ISO
 */
export function formatToISO(date: Date): string {
  return date.toISOString();
}

/**
 * Retorna uma descrição amigável da data agendada
 * @param date - Data a ser descrita
 * @returns Descrição amigável
 */
export function getScheduledDateLabel(date: string | Date | null): string {
  if (!date) return "Não agendado";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `Hoje às ${format(dateObj, "HH:mm")}`;
  }

  if (isPast(dateObj)) {
    return `Realizado em ${formatDate(dateObj)}`;
  }

  return formatDateTime(dateObj);
}

/**
 * Calcula tempo restante até uma data
 * @param date - Data futura
 * @returns Objeto com dias, horas, minutos e segundos restantes
 */
export function getTimeRemaining(date: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const total = dateObj.getTime() - Date.now();

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
  };
}
