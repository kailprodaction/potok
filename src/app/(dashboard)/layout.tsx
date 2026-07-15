import Link from "next/link";
import type { ReactNode } from "react";

import { DashboardNav } from "@/components/features/dashboard-nav";
import { maskAccount } from "@/lib/format/money";
import { db } from "@/server/store";

/**
 * Каркас продукта.
 *
 * В реальном приложении здесь же проверяется сессия до отдачи HTML: серверный
 * layout — последняя точка, где можно не отдать разметку неавторизованному
 * пользователю, вместо того чтобы прятать её на клиенте.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const account = db.getAccount();

  return (
    <div className="min-h-dvh bg-plane">
      <header className="border-b border-hairline bg-surface-1">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-semibold text-primary">
              Поток
            </Link>
            <div className="hidden sm:block">
              <DashboardNav />
            </div>
          </div>

          {/* Номер счёта маскирован: показывать его целиком незачем ни в одном сценарии. */}
          <span className="text-xs text-muted [font-variant-numeric:tabular-nums]">
            {maskAccount(account.id)}
          </span>
        </div>
      </header>

      {/* Отступ снизу — под нижнюю навигацию на телефоне, иначе она накроет контент. */}
      <main id="main" className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:pb-10">
        {children}
      </main>

      <div className="sm:hidden">
        <DashboardNav />
      </div>
    </div>
  );
}
