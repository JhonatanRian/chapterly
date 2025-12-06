import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../stores/themeStore";
import { cn } from "../../utils/cn";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  const handleClick = () => {
    console.log("🔘 ThemeToggle clicado!");
    console.log("📊 Tema atual:", theme);
    console.log("📊 isDark:", isDark);
    console.log(
      "📊 Classes HTML antes:",
      document.documentElement.classList.toString(),
    );

    toggleTheme();

    // Log após toggle (com delay para pegar estado atualizado)
    setTimeout(() => {
      console.log(
        "📊 Classes HTML depois:",
        document.documentElement.classList.toString(),
      );
      console.log("📊 Novo tema:", useThemeStore.getState().theme);
    }, 100);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2",
        className,
      )}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      <div className="relative h-6 w-6">
        {/* Ícone Sol */}
        <Sun
          className={cn(
            "absolute inset-0 h-6 w-6 transition-all duration-300",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100",
            "text-yellow-500",
          )}
        />

        {/* Ícone Lua */}
        <Moon
          className={cn(
            "absolute inset-0 h-6 w-6 transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
            "text-blue-500",
          )}
        />
      </div>
    </button>
  );
}

export default ThemeToggle;
