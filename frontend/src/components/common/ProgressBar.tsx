import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "danger";
  animated?: boolean;
}

export function ProgressBar({
  progress,
  className,
  showLabel = false,
  size = "md",
  variant = "primary",
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    primary: "bg-indigo-600 dark:bg-indigo-500",
    success: "bg-green-600 dark:bg-green-500",
    warning: "bg-amber-600 dark:bg-amber-500",
    danger: "bg-red-600 dark:bg-red-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progresso
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}

      <div
        className={cn(
          "w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden",
          sizeClasses[size],
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            variantClasses[variant],
            animated && "relative overflow-hidden",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
        >
          {animated && clampedProgress < 100 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Indeterminate progress bar (loading sem progresso definido)
 */
export function IndeterminateProgressBar({
  className,
  size = "md",
  variant = "primary",
}: Omit<ProgressBarProps, "progress" | "animated" | "showLabel">) {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    primary: "bg-indigo-600 dark:bg-indigo-500",
    success: "bg-green-600 dark:bg-green-500",
    warning: "bg-amber-600 dark:bg-amber-500",
    danger: "bg-red-600 dark:bg-red-500",
  };

  return (
    <div
      className={cn(
        "w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden",
        sizeClasses[size],
        className,
      )}
    >
      <motion.div
        className={cn("h-full rounded-full w-1/3", variantClasses[variant])}
        animate={{
          x: ["-100%", "400%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

/**
 * Circular progress bar
 */
export function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 8,
  variant = "primary",
  showLabel = true,
  className,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  variant?: "primary" | "success" | "warning" | "danger";
  showLabel?: boolean;
  className?: string;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;

  const variantColors = {
    primary: "#6366f1",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        />
      </svg>

      {showLabel && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {Math.round(clampedProgress)}%
          </span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Step progress bar (para wizards/formulários multi-etapa)
 */
export function StepProgress({
  steps,
  currentStep,
  className,
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* Line connector */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    className="h-full bg-indigo-600 dark:bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}

              {/* Step circle */}
              <motion.div
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isCompleted &&
                    "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500",
                  isCurrent &&
                    "bg-white dark:bg-gray-800 border-indigo-600 dark:border-indigo-500",
                  isUpcoming &&
                    "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isCurrent
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>

              {/* Step label */}
              <motion.span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[100px]",
                  isCurrent
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400",
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {step}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
