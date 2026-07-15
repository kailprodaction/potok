import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Секция получает заголовок — карточка становится <section> с aria-меткой. */
  as?: "div" | "section" | "article";
}

export function Card({ children, className, as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-lg)] border border-hairline bg-surface-1 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** id заголовка — чтобы карточку можно было связать с aria-labelledby. */
  titleId?: string;
}

export function CardHeader({ title, description, action, titleId }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="min-w-0">
        <h2 id={titleId} className="text-base font-semibold text-primary">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-5 sm:px-6 sm:py-6", className)}>{children}</div>;
}
