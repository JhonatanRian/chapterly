import type { User } from '@/types';
import { cn } from '@/utils/cn';
import { useMemo } from 'react';

interface AvatarProps {
  user?: User | null;
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({ user, src, alt, size = 'md', className }: AvatarProps) {
  const initials = useMemo(() => {
    if (user) {
      const first = user.first_name?.[0] || '';
      const last = user.last_name?.[0] || '';
      if (first && last) return `${first}${last}`.toUpperCase();
      return user.username?.[0]?.toUpperCase() || '?';
    }
    if (alt) {
      return alt[0]?.toUpperCase() || '?';
    }
    return '?';
  }, [user, alt]);

  const displayName = useMemo(() => {
    if (user) {
      if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
      }
      return user.username;
    }
    return alt || 'User';
  }, [user, alt]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        'bg-gradient-to-br from-indigo-500 to-purple-600',
        'text-white font-semibold',
        sizeClasses[size],
        className
      )}
      title={displayName}
    >
      {src ? (
        <img
          src={src}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
