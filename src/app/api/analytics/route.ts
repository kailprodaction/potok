import { NextResponse } from "next/server";

import type { Analytics } from "@/lib/api/types";
import { db } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const analytics: Analytics = db.getAnalytics();
  return NextResponse.json(analytics);
}
