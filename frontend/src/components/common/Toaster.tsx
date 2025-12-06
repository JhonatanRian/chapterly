import { Toaster as SonnerToaster } from "sonner";
import { useThemeStore } from "../../stores/themeStore";

export function Toaster() {
  const { theme } = useThemeStore();

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg backdrop-blur-sm",
          title: "text-gray-900 dark:text-gray-100 font-semibold",
          description: "text-gray-600 dark:text-gray-400 text-sm",
          actionButton:
            "bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors",
          cancelButton:
            "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium px-4 py-2 rounded-lg transition-colors",
          closeButton:
            "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 transition-colors",
          success:
            "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
          error:
            "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20",
          warning:
            "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20",
          info: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
        },
        style: {
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
        },
      }}
    />
  );
}

export default Toaster;
