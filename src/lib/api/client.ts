import { z } from "zod";

import {
  analyticsSchema,
  invoiceSchema,
  overviewSchema,
  taxReserveSchema,
  type Analytics,
  type CreateInvoiceInput,
  type Invoice,
  type Overview,
  type TaxReserve,
} from "@/lib/api/types";

/** Ошибка API с разобранными ошибками по полям — форма показывает их у инпутов. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[] | undefined>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[] | undefined> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const errorBodySchema = z.object({
  error: z.string().optional(),
  issues: z.record(z.array(z.string()).optional()).optional(),
});

/**
 * Единственная точка выхода в сеть на клиенте.
 *
 * Ответ всегда проходит через Zod: «типизированный клиент», который просто
 * кастует `as T`, врёт — он обещает тип, но не проверяет его. Для интерфейса,
 * где на экране деньги, разница между «обещал» и «проверил» принципиальная.
 */
async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = errorBodySchema.safeParse(await response.json().catch(() => ({})));
    const message = body.success && body.data.error ? body.data.error : "Не удалось загрузить данные";
    const issues = body.success ? body.data.issues ?? {} : {};
    throw new ApiError(message, response.status, issues);
  }

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ApiError("Сервер вернул неожиданный формат данных", 500);
  }
  return parsed.data;
}

export const api = {
  getOverview: (): Promise<Overview> => request("/api/overview", overviewSchema),

  getInvoices: (): Promise<Invoice[]> => request("/api/invoices", z.array(invoiceSchema)),

  getAnalytics: (): Promise<Analytics> => request("/api/analytics", analyticsSchema),

  createInvoice: (input: CreateInvoiceInput): Promise<Invoice> =>
    request("/api/invoices", invoiceSchema, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  setTaxPercent: (percent: number): Promise<TaxReserve> =>
    request("/api/tax-reserve", taxReserveSchema, {
      method: "PATCH",
      body: JSON.stringify({ percent }),
    }),
};
