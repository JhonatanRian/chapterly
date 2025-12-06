import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Button } from "../buttons/Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className || ""}`}
    >
      {/* Icon/Illustration */}
      {icon ? (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            type: "spring",
            stiffness: 200,
          }}
          className="inline-block mb-6"
        >
          {icon}
        </motion.div>
      ) : (
        <motion.svg
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            type: "spring",
            stiffness: 200,
          }}
          className="w-24 h-24 mx-auto mb-6 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </motion.svg>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "primary"}
              className="min-w-[140px]"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="secondary"
              className="min-w-[140px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * EmptyState específico para lista de temas vazia
 */
export function NoIdeasEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-16 h-16"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      }
      title="Nenhum tema encontrado"
      description="Comece compartilhando seu primeiro tema para a próxima apresentação!"
      action={{
        label: "Novo Tema",
        onClick: onCreate,
        variant: "primary",
      }}
    />
  );
}

/**
 * EmptyState para busca sem resultados
 */
export function NoSearchResultsEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-24 h-24 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="Nenhum resultado encontrado"
      description="Tente ajustar os filtros ou buscar por outros termos."
      action={{
        label: "Limpar Filtros",
        onClick: onClearFilters,
        variant: "secondary",
      }}
    />
  );
}

/**
 * EmptyState para nenhuma apresentação agendada
 */
export function NoPresentationsEmptyState({
  onVolunteer,
}: {
  onVolunteer: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-24 h-24 text-amber-400 dark:text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      }
      title="Nenhuma apresentação"
      description="Voluntarie-se para apresentar um tema e compartilhe seu conhecimento!"
      action={{
        label: "Ver Temas Disponíveis",
        onClick: onVolunteer,
        variant: "primary",
      }}
    />
  );
}

/**
 * EmptyState para timeline vazia
 */
export function NoTimelineEmptyState({
  onViewIdeas,
}: {
  onViewIdeas: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-24 h-24 text-blue-400 dark:text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      title="Nenhuma atividade agendada"
      description="Não há apresentações agendadas no momento. Verifique os temas disponíveis!"
      action={{
        label: "Ver Todos os Temas",
        onClick: onViewIdeas,
        variant: "primary",
      }}
    />
  );
}

/**
 * EmptyState para comentários vazios
 */
export function NoCommentsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg
          className="w-20 h-20 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      }
      title="Sem comentários ainda"
      description="Seja o primeiro a comentar e dar seu feedback sobre este tema!"
      className="py-12"
    />
  );
}

/**
 * EmptyState para erro genérico
 */
export function ErrorEmptyState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-24 h-24 text-red-400 dark:text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      }
      title="Algo deu errado"
      description={
        message || "Não foi possível carregar os dados. Tente novamente."
      }
      action={
        onRetry
          ? {
              label: "Tentar Novamente",
              onClick: onRetry,
              variant: "primary",
            }
          : undefined
      }
    />
  );
}
