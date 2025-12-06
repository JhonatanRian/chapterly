import { useRef } from "react";
import type { IdeaListItem } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/formatDate";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { TagBadge } from "../common/TagBadge";
import { UserBadge } from "../common/UserBadge";
import { useConfetti } from "@/hooks/useConfetti";

interface IdeaCardProps {
  idea: IdeaListItem;
  onClick?: () => void;
  onVote?: (ideaId: number) => void;
  onVolunteer?: (ideaId: number) => void;
  isVoting?: boolean;
  className?: string;
}

export function IdeaCard({
  idea,
  onClick,
  onVote,
  onVolunteer,
  isVoting = false,
  className,
}: IdeaCardProps) {
  const voteButtonRef = useRef<HTMLButtonElement>(null);
  const { fireExplosion } = useConfetti();

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote?.(idea.id);

    // Disparar explosão de confetti se hypou
    if (!idea.has_voted && voteButtonRef.current) {
      fireExplosion(voteButtonRef.current);
    }
  };

  const handleVolunteer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVolunteer?.(idea.id);
  };

  return (
    <article
      onClick={onClick}
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md",
        "border border-gray-200 dark:border-gray-700",
        "transition-all duration-200",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Image */}
      {idea.imagem && (
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
          <img
            src={idea.imagem}
            alt={idea.titulo}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Header with badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={idea.status} />
            <PriorityBadge priority={idea.prioridade} />
          </div>

          {/* Vote button (Hype) */}
          {onVote && (
            <button
              ref={voteButtonRef}
              onClick={handleVote}
              disabled={isVoting}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                "transition-all duration-200 shadow-sm hover:shadow-md",
                idea.has_voted
                  ? "bg-orange-500 text-white dark:bg-orange-600 shadow-orange-500/30"
                  : "bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 hover:shadow-orange-500/30",
                isVoting && "opacity-50 cursor-not-allowed",
              )}
              aria-label={idea.has_voted ? "Remover hype" : "Hypar"}
            >
              🔥
              <span>{idea.vote_count}</span>
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
          {idea.titulo}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {idea.descricao}
        </p>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {idea.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {idea.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{idea.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Author */}
          <UserBadge user={idea.autor} size="xs" />

          {/* Date or Presenter */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {idea.apresentador ? (
              <div className="flex items-center gap-1">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{idea.apresentador.username}</span>
              </div>
            ) : idea.data_agendada ? (
              <div className="flex items-center gap-1">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatDate(idea.data_agendada, "short")}</span>
              </div>
            ) : (
              <span>{formatDate(idea.created_at, "relative")}</span>
            )}
          </div>
        </div>

        {/* Volunteer button */}
        {idea.precisa_apresentador && !idea.apresentador && onVolunteer && (
          <button
            onClick={handleVolunteer}
            className={cn(
              "mt-3 w-full px-4 py-2 rounded-lg text-sm font-medium",
              "bg-indigo-600 text-white hover:bg-indigo-700",
              "dark:bg-indigo-500 dark:hover:bg-indigo-600",
              "transition-colors duration-200",
              "flex items-center justify-center gap-2",
            )}
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Voluntariar-se para apresentar</span>
          </button>
        )}
      </div>
    </article>
  );
}
