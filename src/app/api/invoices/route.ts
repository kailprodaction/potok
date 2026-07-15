import { NextResponse } from "next/server";

import { createInvoiceInputSchema, type Invoice } from "@/lib/api/types";
import { toMinor } from "@/lib/format/money";
import { db } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const invoices: Invoice[] = db.listInvoices();
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  /**
   * Та же схема, что валидирует форму на клиенте. Клиентская валидация — это
   * UX; доверять ей нельзя, поэтому проверка повторяется на сервере.
   */
  const parsed = createInvoiceInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля счёта", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { clientName, amountMajor, currency, dueDate } = parsed.data;
  const invoice = db.addInvoice({
    clientName,
    amount: toMinor(amountMajor, currency),
    currency,
    dueDate,
  });

  return NextResponse.json(invoice, { status: 201 });
}
