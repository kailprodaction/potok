import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "neutral" | "good" | "warning" | "critical";

const tones: Record<Tone, string> = {
  neutral: "border-hairline bg-surface-2 text-secondary",
  good: "border-transparent bg-good-wash text-good-text",
  warning: "border-transparent bg-warning-wash text-primary",
  critical: "border-transparent bg-critical-wash text-critical-text",
};

/**
 * Статус никогда не передаётся одним цветом: рядом всегда иконка и текст.
 *
 * Надпись носит текстовый шаг статуса, а не сам --status-*: на тёмной
 * поверхности красный шаг метки даёт 3.62:1 и как текст не проходит. Контраст
 * проверен против воша, а не против чистой поверхности, — читается-то текст
 * именно на воше.
 */
export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="grid place-items-center">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
