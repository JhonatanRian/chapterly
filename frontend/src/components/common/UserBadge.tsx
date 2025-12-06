import type { User } from '@/types';
import { cn } from '@/utils/cn';
import { Avatar } from './Avatar';

interface UserBadgeProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showEmail?: boolean;
  className?: string;
  onClick?: () => void;
}

const containerSizes = {
  xs: 'gap-1.5',
  sm: 'gap-2',
  md: 'gap-2.5',
  lg: 'gap-3',
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function UserBadge({
  user,
  size = 'sm',
  showEmail = false,
  className,
  onClick,
}: UserBadgeProps) {
  const displayName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username;

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center',
        containerSizes[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      type={onClick ? 'button' : undefined}
    >
      <Avatar user={user} size={size} />
      <div className="flex flex-col items-start min-w-0">
        <span
          className={cn(
            'font-medium text-gray-900 dark:text-gray-100 truncate',
            textSizes[size]
          )}
        >
          {displayName}
        </span>
        {showEmail && user.email && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </span>
        )}
      </div>
    </Component>
  );
}
