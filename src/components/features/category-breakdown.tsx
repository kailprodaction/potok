import { CATEGORY_LABELS, type CategoryBreakdownItem, type Currency } from "@/lib/api/types";
import { formatMoney, formatPercent } from "@/lib/format/money";

/**
 * Разбивка расходов по категориям.
 *
 * Серверный компонент: каждая полоса подписана суммой и долей, поэтому
 * подсказка по наведению ничего бы не добавила — а значит, и клиентский JS
 * здесь не нужен вовсе.
 *
 * Категории номинальные, порядок задаёт величина, поэтому цвет один на все
 * полосы: длина уже кодирует размер, красить её ещё и оттенком нечем.
 */
export function CategoryBreakdown({
  items,
  currency,
}: {
  items: CategoryBreakdownItem[];
  currency: Currency;
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const max = Math.max(...items.map((item) => item.amount), 1);

  if (total === 0) {
    return (
      <p className="px-5 pb-5 text-sm text-secondary sm:px-6 sm:pb-6">
        За период расходов не было.
      </p>
    );
  }

  return (
    <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const share = item.amount / total;
          return (
            <li key={item.category} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
              <span className="text-sm text-primary">{CATEGORY_LABELS[item.category]}</span>
              <span className="text-sm text-secondary [font-variant-numeric:tabular-nums]">
                {formatMoney(item.amount, currency)}
                <span className="ml-2 text-muted">{formatPercent(share)}</span>
              </span>
              <div className="col-span-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-series-1"
                  style={{ width: `${(item.amount / max) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm">
        <span className="text-secondary">Всего за 30 дней</span>
        <span className="font-semibold text-primary [font-variant-numeric:tabular-nums]">
          {formatMoney(total, currency)}
        </span>
      </div>
    </div>
  );
}
