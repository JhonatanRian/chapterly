import { cn } from "@/utils/cn";

interface HypeDisplayProps {
  percentage: number | string;
  count?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function HypeDisplay({
  percentage,
  count,
  size = "md",
  showLabel = false,
  animated = true,
  className,
}: HypeDisplayProps) {
  const percentageNum =
    typeof percentage === "string" ? parseInt(percentage, 10) : percentage;
  const isMax = percentageNum === 100;

  const sizeClasses = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const fireEmoji = "🔥";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Fire emoji with animation when at 100% */}
      <span
        className={cn(
          "inline-flex items-center justify-center",
          sizeClasses[size],
          isMax && animated && "animate-flame-flicker",
        )}
      >
        {fireEmoji}
      </span>

      {/* Percentage or Count Display */}
      <div className="flex flex-col items-start">
        <div
          className={cn(
            "font-bold bg-gradient-to-r from-red-500 via-rose-500 to-pink-500",
            "bg-clip-text text-transparent",
            sizeClasses[size],
          )}
        >
          {percentageNum}% Hypado
        </div>
        {percentageNum === undefined && (
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {count} {count === 1 ? "voto" : "votos"}
          </div>
        )}
        {showLabel && (
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Hypado
          </div>
        )}
      </div>

      {/* CSS Animation Styles */}
      <style>{`
        @keyframes flame-flicker {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: scale(1.15) rotate(-2deg);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.2) rotate(2deg);
            opacity: 1;
          }
          75% {
            transform: scale(1.12) rotate(-1deg);
            opacity: 0.98;
          }
        }

        .animate-flame-flicker {
          animation: flame-flicker 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
