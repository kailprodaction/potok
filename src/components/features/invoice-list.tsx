"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { AlertIcon, CheckIcon, ClockIcon } from "@/components/ui/icons";
import { invoicesQuery } from "@/lib/api/queries";
import { INVOICE_STATUS_LABELS, type Invoice, type InvoiceStatus } from "@/lib/api/types";
import { formatFullDate, formatRelativeDays, type IsoDate } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";

/**
 * Список счетов.
 *
 * Первый рендер приезжает с сервера через initialData: пользователь видит счета
 * в HTML, без скелетона и без запроса из браузера. Дальше список живёт своей
 * жизнью — обновляется после создания счёта и по фоновой ревалидации.
 */

const STATUS_TONE: Record<InvoiceStatus, "neutral" | "good" | "warning" | "critical"> = {
  draft: "neutral",
  sent: "neutral",
  paid: "good",
  overdue: "critical",
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const icon =
    status === "paid" ? (
      <CheckIcon size={12} />
    ) : status === "overdue" ? (
      <AlertIcon size={12} />
    ) : (
      <ClockIcon size={12} />
    );

  return (
    <Badge tone={STATUS_TONE[status]} icon={icon}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}

export function InvoiceList({
  initialInvoices,
  today,
}: {
  initialInvoices: Invoice[];
  today: IsoDate;
}) {
  const { data: invoices, isFetching } = useQuery({
    ...invoicesQuery(),
    initialData: initialInvoices,
  });

  if (invoices.length === 0) {
    return <p className="px-5 pb-5 text-sm text-secondary sm:px-6 sm:pb-6">Счетов пока нет.</p>;
  }

  return (
    // Перезагрузка не подменяет список скелетоном: кадр держится, макет не прыгает.
    <ul className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {invoices.map((invoice) => (
        <li
          key={invoice.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline px-5 py-4 sm:px-6"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-primary">{invoice.clientName}</div>
            <div className="text-xs text-muted">
              Оплатить до {formatFullDate(invoice.dueDate)}
              {invoice.status === "overdue" ? ` · ${formatRelativeDays(invoice.dueDate, today)}` : null}
            </div>
          </div>

          <StatusBadge status={invoice.status} />

          <span className="w-full text-right text-sm font-semibold text-primary [font-variant-numeric:tabular-nums] sm:w-auto">
            {formatMoney(invoice.amount, invoice.currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}
