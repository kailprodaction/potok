import type { Metadata } from "next";

import { InvoiceForm } from "@/components/features/invoice-form";
import { InvoiceList } from "@/components/features/invoice-list";
import { Card, CardHeader } from "@/components/ui/card";
import { getInvoices } from "@/lib/api/server";
import { formatMoney } from "@/lib/format/money";
import { today } from "@/server/store";

export const metadata: Metadata = {
  title: "Счета",
};

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const now = today();

  const awaiting = invoices.filter(
    (invoice) => invoice.status === "sent" || invoice.status === "overdue",
  );
  const awaitingTotal = awaiting.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueCount = invoices.filter((invoice) => invoice.status === "overdue").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[length:var(--text-h1)] font-semibold text-primary">Счета</h1>
        <p className="text-sm text-secondary">
          {awaiting.length > 0
            ? `Ждём оплаты на ${formatMoney(awaitingTotal, "KZT")}${
                overdueCount > 0 ? `, из них просрочено счетов: ${overdueCount}` : ""
              }`
            : "Неоплаченных счетов нет"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <Card as="section">
          <CardHeader title="Все счета" description="Сначала просроченные и неоплаченные" />
          <div className="pb-2">
            <InvoiceList initialInvoices={invoices} today={now} />
          </div>
        </Card>

        <Card as="section" className="h-fit">
          <CardHeader
            title="Новый счёт"
            description="Появится в прогнозе сразу после создания"
          />
          <InvoiceForm />
        </Card>
      </div>
    </div>
  );
}
