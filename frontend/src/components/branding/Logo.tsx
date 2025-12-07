import { cn } from "@/utils/cn";

interface LogoProps {
  variant?: "icon" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  icon: {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  },
  full: {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12",
  },
};

export function Logo({ variant = "icon", size = "md", className }: LogoProps) {
  if (variant === "icon") {
    return (
      <img
        src="/icon.png"
        alt="Chapterly"
        className={cn(sizeClasses.icon[size], className)}
      />
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Chapterly"
      className={cn(sizeClasses.full[size], className)}
    />
  );
}
