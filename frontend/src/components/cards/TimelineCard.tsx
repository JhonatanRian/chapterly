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
  highlighted?: boolean;
}

export function TimelineCard({
  idea,
  onClick,
  className,
  showDate = true,
  highlighted = false,
}: TimelineCardProps) {
  const isUpcoming =
    idea.data_agendada && new Date(idea.data_agendada) > new Date();
  const isPast = idea.status === "concluido";

  // Check if presentation is today
  const isToday = idea.data_agendada
    ? new Date(idea.data_agendada).toDateString() === new Date().toDateString()
    : false;

  return (
    <article
      onClick={onClick}
      className={cn(
        "relative flex gap-4 p-4 rounded-lg",
        "transition-all duration-200",
        // Highlighted variant (today or next presentation)
        highlighted
          ? [
              "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50",
              "dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30",
              "border-2 border-indigo-400 dark:border-indigo-500",
              "shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30",
              onClick &&
                "cursor-pointer hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-400",
            ]
          : [
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              onClick &&
                "cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600",
            ],
        isPast && "opacity-75",
        className,
      )}
    >
      {/* Highlight badge for today or next presentation */}
      {highlighted && (
        <div className="absolute -top-2 -right-2 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
              "shadow-lg",
              isToday
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
            )}
          >
            {isToday ? (
              <>
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Hoje
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                Próxima
              </>
            )}
          </span>
        </div>
      )}
      {/* Left side - Date indicator */}
      {showDate && idea.data_agendada && (
        <div
          className={cn(
            "flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-lg text-white",
            highlighted
              ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-lg"
              : "bg-gradient-to-br from-indigo-500 to-purple-600",
          )}
        >
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
