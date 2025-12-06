import type { Tag } from '@/types';
import { cn } from '@/utils/cn';

interface TagBadgeProps {
  tag: Tag;
  className?: string;
  onRemove?: () => void;
}

export function TagBadge({ tag, className, onRemove }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        'transition-colors duration-200',
        className
      )}
      style={{
        backgroundColor: `${tag.cor}20`,
        color: tag.cor,
        borderWidth: '1px',
        borderColor: `${tag.cor}40`,
      }}
    >
      {tag.nome}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label={`Remover tag ${tag.nome}`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
