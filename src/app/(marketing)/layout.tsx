import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-plane">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-base font-semibold text-primary">
            Поток
          </Link>

          <nav aria-label="Основная навигация" className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/pricing"
              className="inline-flex min-h-[var(--tap-target)] items-center rounded-[var(--radius-md)] px-3 text-sm text-secondary hover:text-primary"
            >
              Тарифы
            </Link>
            <Link href="/overview">
              <Button size="sm">Открыть дашборд</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="border-t border-hairline bg-surface-1">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Поток</span>
          <span className="text-muted">
            Демонстрационный проект. Данные в дашборде — вымышленные.
          </span>
        </div>
      </footer>
    </div>
  );
}
