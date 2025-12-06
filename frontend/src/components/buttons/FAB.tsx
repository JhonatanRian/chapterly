import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface FABProps {
  onClick: () => void;
  icon?: ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

export function FAB({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  size = 'md',
  className,
  ariaLabel,
}: FABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed z-40 group',
        'flex items-center justify-center gap-2',
        'bg-gradient-to-br from-indigo-600 to-purple-600',
        'hover:from-indigo-700 hover:to-purple-700',
        'text-white font-medium',
        'rounded-full shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        positionClasses[position],
        label ? 'px-6' : sizeClasses[size],
        className
      )}
      aria-label={ariaLabel || label || 'Floating action button'}
    >
      {icon || (
        <svg
          className="w-6 h-6"
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
      )}
      {label && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}
