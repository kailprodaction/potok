"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChartIcon, ReceiptIcon, WalletIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * Навигация дашборда.
 *
 * На телефоне она внизу и под большим пальцем, на десктопе — сверху. Это не
 * «адаптив потом»: финтехом пользуются с телефона, поэтому мобильная раскладка
 * здесь основная, а не ужатая десктопная.
 */

const LINKS = [
  { href: "/overview", label: "Обзор", Icon: WalletIcon },
  { href: "/invoices", label: "Счета", Icon: ReceiptIcon },
  { href: "/analytics", label: "Аналитика", Icon: ChartIcon },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Разделы дашборда"
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface-1",
        "pb-[env(safe-area-inset-bottom)]",
        "sm:static sm:border-t-0 sm:bg-transparent sm:pb-0",
      )}
    >
      <ul className="flex sm:gap-1">
        {LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1 sm:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[var(--tap-target)] flex-col items-center justify-center gap-1 text-xs",
                  "sm:flex-row sm:gap-2 sm:rounded-[var(--radius-md)] sm:px-3 sm:text-sm",
                  active ? "text-accent-text sm:bg-surface-2 sm:text-primary" : "text-secondary hover:text-primary",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
