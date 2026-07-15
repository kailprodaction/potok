import { ArrowDownIcon, ArrowUpIcon, RepeatIcon } from "@/components/ui/icons";
import type { Currency, Transaction } from "@/lib/api/types";
import { formatDayMonth, formatRelativeDays, type IsoDate } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";

/**
 * Ближайшие поступления и списания.
 *
 * Направление денег не передаётся одним цветом: рядом со стрелкой стоит знак
 * суммы, а знак читается и в монохроме, и при любом типе дальтонизма.
 */
export function UpcomingList({
  items,
  currency,
  today,
}: {
  items: Transaction[];
  currency: Currency;
  today: IsoDate;
}) {
  if (items.length === 0) {
    return (
      <p className="px-5 pb-5 text-sm text-secondary sm:px-6 sm:pb-6">
        В ближайшие две недели движений не запланировано.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const isIncome = item.direction === "in";
        const Icon = isIncome ? ArrowUpIcon : ArrowDownIcon;

        return (
          <li
            key={item.id}
            className="flex items-center gap-3 border-t border-hairline px-5 py-3 first:border-t-0 sm:px-6"
          >
            <span
              aria-hidden="true"
              className={
                isIncome
                  ? "grid size-8 shrink-0 place-items-center rounded-full bg-good-wash text-good-text"
                  : "grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-secondary"
              }
            >
              <Icon size={14} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm text-primary">{item.title}</span>
                {item.recurring ? (
                  <span title="Повторяется каждый месяц" className="shrink-0 text-muted">
                    <RepeatIcon size={12} />
                    <span className="sr-only">повторяющийся платёж</span>
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-muted">
                {formatDayMonth(item.date)} · {formatRelativeDays(item.date, today)}
              </span>
            </div>

            <span
              className={
                isIncome
                  ? "shrink-0 text-sm font-medium text-good-text [font-variant-numeric:tabular-nums]"
                  : "shrink-0 text-sm font-medium text-primary [font-variant-numeric:tabular-nums]"
              }
            >
              {isIncome ? "+" : "−"}
              {formatMoney(item.amount, currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
