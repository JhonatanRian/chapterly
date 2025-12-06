import type { IdeaPriority } from "@/types";
import { cn } from "@/utils/cn";

interface PriorityBadgeProps {
  priority: IdeaPriority;
  className?: string;
}

const priorityConfig: Record<
  IdeaPriority,
  {
    label: string;
    className: string;
  }
> = {
  baixa: {
    label: "Baixa",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  media: {
    label: "Média",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  alta: {
    label: "Alta",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
