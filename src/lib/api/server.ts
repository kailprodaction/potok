import "server-only";

import {
  analyticsSchema,
  invoiceSchema,
  overviewSchema,
  type Analytics,
  type Invoice,
  type Overview,
} from "@/lib/api/types";
import { z } from "zod";
import { FORECAST_HORIZON_DAYS, buildForecast } from "@/server/forecast-engine";
import { db, today } from "@/server/store";

/**
 * Доступ к данным для серверных компонентов.
 *
 * Серверный компонент не ходит HTTP-запросом в собственный роут-хендлер: это
 * лишний сетевой круг внутри одного процесса. Хендлеры в /api существуют для
 * клиентских островов и внешних потребителей, RSC читает данные отсюда.
 *
 * Ответы прогоняются через ту же Zod-схему, что и на клиенте: контракт
 * проверяется в одном месте, и подмена заглушки на реальный API не пройдёт
 * молча, если форма данных разъедется.
 */

export async function getOverview(): Promise<Overview> {
  const account = db.getAccount();

  const forecast = buildForecast({
    startBalance: account.balance,
    currency: account.currency,
    today: today(),
    rules: db.getRules(),
    invoices: db.listInvoices(),
    horizonDays: FORECAST_HORIZON_DAYS,
  });

  return overviewSchema.parse({
    account,
    forecast,
    upcoming: db.getUpcoming(14),
    expensesByCategory: db.getExpensesByCategory(),
    taxReserve: db.getTaxReserve(),
  } satisfies Overview);
}

export async function getInvoices(): Promise<Invoice[]> {
  return z.array(invoiceSchema).parse(db.listInvoices());
}

export async function getAnalytics(): Promise<Analytics> {
  return analyticsSchema.parse(db.getAnalytics());
}
