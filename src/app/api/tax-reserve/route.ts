import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/server/store";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  percent: z.number().min(0).max(100),
});

export async function GET() {
  return NextResponse.json(db.getTaxReserve());
}

export async function PATCH(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Процент должен быть от 0 до 100" }, { status: 422 });
  }

  return NextResponse.json(db.setTaxPercent(parsed.data.percent));
}
