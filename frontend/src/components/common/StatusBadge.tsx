import type { IdeaStatus } from "@/types";
import { cn } from "@/utils/cn";

interface StatusBadgeProps {
  status: IdeaStatus;
  className?: string;
}

const statusConfig: Record<
  IdeaStatus,
  {
    label: string;
    className: string;
  }
> = {
  pendente: {
    label: "Pendente",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  agendado: {
    label: "Agendado",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  concluido: {
    label: "Concluído",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelado: {
    label: "Cancelado",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

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
