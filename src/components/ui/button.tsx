import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  // Фон — accent, а не series-1: под белой подписью краска данных не добирает контраста.
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "border border-hairline bg-surface-1 text-primary hover:bg-surface-2",
  ghost: "text-secondary hover:bg-surface-2 hover:text-primary",
};

/** Высота держит тач-таргет 44px на мобильном — финтех живёт в телефоне. */
const sizes: Record<Size, string> = {
  md: "min-h-[var(--tap-target)] px-4 text-sm",
  sm: "min-h-9 px-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-opacity",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
