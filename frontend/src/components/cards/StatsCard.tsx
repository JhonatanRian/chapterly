import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  description,
  className,
  onClick,
}: StatsCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'relative p-6 rounded-lg',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600',
        className
      )}
      type={onClick ? 'button' : undefined}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
        </div>
        {icon && (
          <div className="flex-shrink-0 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>

      {/* Trend and description */}
      <div className="flex items-center gap-2 text-sm">
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium',
              trend.isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            {trend.isPositive ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            )}
            <span>{Math.abs(trend.value)}%</span>
          </span>
        )}
        {description && (
          <span className="text-gray-500 dark:text-gray-400">{description}</span>
        )}
      </div>
    </Component>
  );
}
