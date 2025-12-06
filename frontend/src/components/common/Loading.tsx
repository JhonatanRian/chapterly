import { cn } from '../../utils/cn';

interface LoadingProps {
  variant?: 'spinner' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (variant === 'spinner') {
    const content = (
      <div className="flex flex-col items-center justify-center gap-3">
        <svg
          className={cn(
            'animate-spin text-primary-orange',
            sizes[size],
            className
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
          {content}
        </div>
      );
    }

    return content;
  }

  // Skeleton variant
  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700"></div>
    </div>
  );
}

// Skeleton variants for specific components
export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 h-48 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-2 h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-4 h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-8 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-2 h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      ))}
    </div>
  );
}

export default Loading;
