import { z } from "zod";

/**
 * Контракт, который потребляет фронт. Схема БД живёт на бэкенде — здесь только
 * форма ответов API.
 *
 * Все суммы — целые в минимальных единицах валюты (тиын/копейки/центы).
 * Дробных денег в рантайме не существует: форматирование в человеческий вид —
 * задача слоя format, а не транспорта.
 */

export const currencySchema = z.enum(["KZT", "RUB", "USD"]);
export type Currency = z.infer<typeof currencySchema>;

export const directionSchema = z.enum(["in", "out"]);
export type Direction = z.infer<typeof directionSchema>;

export const cadenceSchema = z.enum(["weekly", "monthly"]);
export type Cadence = z.infer<typeof cadenceSchema>;

export const invoiceStatusSchema = z.enum(["draft", "sent", "paid", "overdue"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const gapRiskSchema = z.enum(["none", "low", "high"]);
export type GapRisk = z.infer<typeof gapRiskSchema>;

/** Сумма в минимальных единицах: целая и неотрицательная. */
const minorAmount = z.number().int().nonnegative();

/** Дата без времени, ISO: YYYY-MM-DD. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ожидается дата в формате YYYY-MM-DD");

export const categorySchema = z.enum([
  "client",
  "rent",
  "software",
  "contractors",
  "taxes",
  "marketing",
  "other",
]);
export type Category = z.infer<typeof categorySchema>;

export const accountSchema = z.object({
  id: z.string(),
  /** Может уйти в минус, поэтому не nonnegative. */
  balance: z.number().int(),
  currency: currencySchema,
});
export type Account = z.infer<typeof accountSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  amount: minorAmount,
  direction: directionSchema,
  category: categorySchema,
  date: isoDate,
  recurring: z.boolean(),
  title: z.string(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const recurringRuleSchema = z.object({
  id: z.string(),
  amount: minorAmount,
  direction: directionSchema,
  category: categorySchema,
  cadence: cadenceSchema,
  nextDate: isoDate,
  title: z.string(),
});
export type RecurringRule = z.infer<typeof recurringRuleSchema>;

export const invoiceSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  amount: minorAmount,
  currency: currencySchema,
  status: invoiceStatusSchema,
  dueDate: isoDate,
  issuedAt: isoDate,
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const forecastPointSchema = z.object({
  date: isoDate,
  projectedBalance: z.number().int(),
});
export type ForecastPoint = z.infer<typeof forecastPointSchema>;

export const forecastSchema = z.object({
  currency: currencySchema,
  points: z.array(forecastPointSchema).min(1),
  gapRisk: gapRiskSchema,
  /** Первый день, когда проекция уходит в минус. null — разрыва нет. */
  gapDate: isoDate.nullable(),
  /** Минимум проекции за горизонт — «дно» кассы. */
  lowestBalance: z.number().int(),
});
export type Forecast = z.infer<typeof forecastSchema>;

export const taxReserveSchema = z.object({
  percent: z.number().min(0).max(100),
  accrued: minorAmount,
  currency: currencySchema,
});
export type TaxReserve = z.infer<typeof taxReserveSchema>;

export const categoryBreakdownItemSchema = z.object({
  category: categorySchema,
  amount: minorAmount,
});
export type CategoryBreakdownItem = z.infer<typeof categoryBreakdownItemSchema>;

export const monthlyIncomePointSchema = z.object({
  /** Месяц в ISO: YYYY-MM. */
  month: z.string().regex(/^\d{4}-\d{2}$/),
  income: minorAmount,
});
export type MonthlyIncomePoint = z.infer<typeof monthlyIncomePointSchema>;

export const analyticsSchema = z.object({
  currency: currencySchema,
  monthlyIncome: z.array(monthlyIncomePointSchema),
  expensesByCategory: z.array(categoryBreakdownItemSchema),
});
export type Analytics = z.infer<typeof analyticsSchema>;

export const overviewSchema = z.object({
  account: accountSchema,
  forecast: forecastSchema,
  upcoming: z.array(transactionSchema),
  expensesByCategory: z.array(categoryBreakdownItemSchema),
  taxReserve: taxReserveSchema,
});
export type Overview = z.infer<typeof overviewSchema>;

/** Тело запроса на создание счёта. Тот же Zod — и в форме, и на роут-хендлере. */
export const createInvoiceInputSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, "Имя клиента — минимум 2 символа")
    .max(80, "Не длиннее 80 символов"),
  /** Мажорные единицы: пользователь вводит «1500.50», не «150050». */
  amountMajor: z
    .number({ invalid_type_error: "Введите сумму" })
    .positive("Сумма должна быть больше нуля")
    .max(1_000_000_000, "Слишком большая сумма"),
  currency: currencySchema,
  dueDate: isoDate.refine((value) => !Number.isNaN(Date.parse(value)), "Некорректная дата"),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

export const CATEGORY_LABELS: Record<Category, string> = {
  client: "Клиенты",
  rent: "Аренда",
  software: "Подписки и софт",
  contractors: "Подрядчики",
  taxes: "Налоги",
  marketing: "Маркетинг",
  other: "Прочее",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Черновик",
  sent: "Отправлен",
  paid: "Оплачен",
  overdue: "Просрочен",
};
