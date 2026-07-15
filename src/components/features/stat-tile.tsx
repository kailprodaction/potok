import type { ReactNode } from "react";

import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface StatTileProps {
  label: string;
  value: string;
  /** Знаковая дельта против названного периода. Без периода число ничего не значит. */
  delta?: { text: string; direction: "up" | "down"; isGood: boolean; period: string };
  hint?: ReactNode;
  /** Главная цифра экрана — крупнее остальных. Ровно одна на вид. */
  hero?: boolean;
}

/**
 * Плитка показателя. Одно число — это не график: одна колонка в столбчатой
 * диаграмме сообщила бы ровно то же самое, только заняв в двадцать раз больше
 * места и потребовав осей.
 *
 * Крупные числа идут пропорциональными цифрами: tabular-nums уравнивает ширину
 * по «0» и на большом кегле число выглядит разреженным.
 */
export function StatTile({ label, value, delta, hint, hero = false }: StatTileProps) {
  const DeltaIcon = delta?.direction === "up" ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-secondary">{label}</span>
      <span
        className={cn(
          "font-semibold text-primary",
          hero ? "text-[length:var(--text-hero-figure)] leading-tight" : "text-2xl",
        )}
      >
        {value}
      </span>
      {delta ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm",
            delta.isGood ? "text-good-text" : "text-critical-text",
          )}
        >
          <DeltaIcon size={14} />
          <span>{delta.text}</span>
          <span className="text-muted">{delta.period}</span>
        </span>
      ) : null}
      {hint ? <span className="text-sm text-secondary">{hint}</span> : null}
    </div>
  );
}
