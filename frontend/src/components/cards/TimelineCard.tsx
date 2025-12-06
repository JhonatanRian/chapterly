import type { IdeaListItem } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/formatDate";
import { StatusBadge } from "../common/StatusBadge";
import { Avatar } from "../common/Avatar";

interface TimelineCardProps {
  idea: IdeaListItem;
  onClick?: () => void;
  className?: string;
  showDate?: boolean;
}

export function TimelineCard({
  idea,
  onClick,
  className,
  showDate = true,
}: TimelineCardProps) {
  const isUpcoming =
    idea.data_agendada && new Date(idea.data_agendada) > new Date();
  const isPast = idea.status === "concluido";

  return (
    <article
      onClick={onClick}
      className={cn(
        "relative flex gap-4 p-4 rounded-lg",
        "bg-white dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "transition-all duration-200",
        onClick &&
          "cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600",
        isPast && "opacity-75",
        className,
      )}
    >
      {/* Left side - Date indicator */}
      {showDate && idea.data_agendada && (
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <span className="text-xs font-medium uppercase">
            {formatDate(idea.data_agendada, "short").split(" ")[0]}
          </span>
          <span className="text-2xl font-bold leading-none">
            {new Date(idea.data_agendada).getDate()}
          </span>
        </div>
      )}

      {/* Center - Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {idea.titulo}
          </h3>
          <StatusBadge status={idea.status} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {idea.descricao}
        </p>

        {/* Footer info */}
        <div className="flex items-center gap-4 text-sm">
          {/* Presenter */}
          {idea.apresentador ? (
            <div className="flex items-center gap-2">
              <Avatar user={idea.apresentador} size="xs" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {idea.apresentador.first_name && idea.apresentador.last_name
                  ? `${idea.apresentador.first_name} ${idea.apresentador.last_name}`
                  : idea.apresentador.username}
              </span>
            </div>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-xs font-medium">
                Aguardando apresentador
              </span>
            </span>
          )}

          {/* Vote count */}
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            <span className="text-xs">{idea.vote_count}</span>
          </div>

          {/* Time indicator for upcoming */}
          {isUpcoming && idea.data_agendada && (
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatDate(idea.data_agendada, "relative")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Image thumbnail (if available) */}
      {idea.imagem && (
        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
          <img
            src={idea.imagem}
            alt={idea.titulo}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </article>
  );
}
