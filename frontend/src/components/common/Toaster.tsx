import { Toaster as SonnerToaster } from 'sonner';
import { useThemeStore } from '../../stores/themeStore';

export function Toaster() {
  const { theme } = useThemeStore();

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={3000}
      toastOptions={{
        classNames: {
          toast:
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          title: 'text-gray-900 dark:text-gray-100',
          description: 'text-gray-600 dark:text-gray-400',
          actionButton: 'bg-primary-orange text-white',
          cancelButton: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
          closeButton: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        },
      }}
    />
  );
}

export default Toaster;
