import { cn } from '@/utils/cn';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  minDate?: string;
  required?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  error,
  disabled = false,
  className,
  label = 'Data e Hora',
  minDate,
  required = false,
}: DateTimePickerProps) {
  // Format value for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatForInput = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Parse input value to ISO string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (!inputValue) {
      onChange('');
      return;
    }
    try {
      const date = new Date(inputValue);
      onChange(date.toISOString());
    } catch {
      onChange('');
    }
  };

  const inputValue = formatForInput(value);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="datetime-local"
          value={inputValue}
          onChange={handleChange}
          disabled={disabled}
          min={minDate ? formatForInput(minDate) : undefined}
          required={required}
          className={cn(
            'w-full px-4 py-2 rounded-lg border transition-colors',
            'bg-white dark:bg-gray-700',
            'text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500',
            error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-600',
            !disabled && 'hover:border-gray-400 dark:hover:border-gray-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Helper text */}
      {!error && value && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(value).toLocaleString('pt-BR', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}
        </p>
      )}
    </div>
  );
}
