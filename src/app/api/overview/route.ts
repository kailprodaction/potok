import { NextResponse } from "next/server";

import type { Overview } from "@/lib/api/types";
import { FORECAST_HORIZON_DAYS, buildForecast } from "@/server/forecast-engine";
import { db, today } from "@/server/store";

/**
 * BFF-прокси дашборда. Когда появится реальный API, тело хендлера станет
 * прокинутым fetch с серверным токеном — контракт наружу не изменится.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const account = db.getAccount();

  const forecast = buildForecast({
    startBalance: account.balance,
    currency: account.currency,
    today: today(),
    rules: db.getRules(),
    invoices: db.listInvoices(),
    horizonDays: FORECAST_HORIZON_DAYS,
  });

  const overview: Overview = {
    account,
    forecast,
    upcoming: db.getUpcoming(14),
    expensesByCategory: db.getExpensesByCategory(),
    taxReserve: db.getTaxReserve(),
  };

  return NextResponse.json(overview);
}
