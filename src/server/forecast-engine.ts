import type {
  Forecast,
  ForecastPoint,
  GapRisk,
  Invoice,
  RecurringRule,
} from "@/lib/api/types";
import { addDays, addMonths, type IsoDate } from "@/lib/format/date";

/**
 * Прогнозный движок: проекция баланса вперёд.
 *
 * По архитектуре он живёт на бэкенде — фронт получает готовый ряд точек. Здесь
 * он реализован server-only, чтобы приложение было работающим до появления
 * реального API: контракт на выходе тот же, менять фронт при замене не придётся.
 *
 * Считает по календарным дням: стартовый баланс, затем на каждый день
 * накатываются повторяющиеся правила и ожидаемые оплаты по счетам.
 */

export const FORECAST_HORIZON_DAYS = 30;

/**
 * Порог «низкого» риска: дно кассы ниже месячного объёма расходов, делённого на
 * четыре, — примерно недельная подушка. Разрыва ещё нет, но запаса уже нет тоже.
 */
const LOW_RISK_DIVISOR = 4;

export interface ForecastInput {
  startBalance: number;
  currency: Forecast["currency"];
  today: IsoDate;
  rules: RecurringRule[];
  invoices: Invoice[];
  horizonDays?: number;
}

/** Ожидаемые деньги по счёту: черновики не считаем, оплаченные уже в балансе. */
function isPendingInvoice(invoice: Invoice): boolean {
  return invoice.status === "sent" || invoice.status === "overdue";
}

/**
 * Даты срабатывания правила внутри горизонта.
 *
 * nextDate может лежать в прошлом (правило создано давно) — тогда сначала
 * догоняем до сегодня, иначе первое же списание упало бы не на свой день.
 */
function ruleOccurrences(rule: RecurringRule, from: IsoDate, to: IsoDate): IsoDate[] {
  const step = (date: IsoDate): IsoDate =>
    rule.cadence === "weekly" ? addDays(date, 7) : addMonths(date, 1);

  let cursor = rule.nextDate;
  // Ограничитель: защита от зацикливания, если правило придёт с битой датой.
  let guard = 0;
  while (cursor < from && guard < 1000) {
    cursor = step(cursor);
    guard += 1;
  }

  const dates: IsoDate[] = [];
  while (cursor <= to && guard < 1000) {
    dates.push(cursor);
    cursor = step(cursor);
    guard += 1;
  }
  return dates;
}

/**
 * Просроченный счёт не «прилетает» задним числом: его ждём сегодня, иначе
 * проекция нарисовала бы поступление в прошлом и завысила бы дно.
 */
function expectedPaymentDate(invoice: Invoice, today: IsoDate): IsoDate {
  return invoice.dueDate < today ? today : invoice.dueDate;
}

export function buildForecast(input: ForecastInput): Forecast {
  const { startBalance, currency, today, rules, invoices } = input;
  const horizonDays = input.horizonDays ?? FORECAST_HORIZON_DAYS;
  const lastDay = addDays(today, horizonDays);

  /** Дельта баланса по дням: дата → сумма изменения. */
  const deltas = new Map<IsoDate, number>();
  const add = (date: IsoDate, amount: number): void => {
    deltas.set(date, (deltas.get(date) ?? 0) + amount);
  };

  for (const rule of rules) {
    const sign = rule.direction === "in" ? 1 : -1;
    for (const date of ruleOccurrences(rule, today, lastDay)) {
      add(date, sign * rule.amount);
    }
  }

  for (const invoice of invoices) {
    if (!isPendingInvoice(invoice)) continue;
    const date = expectedPaymentDate(invoice, today);
    if (date <= lastDay) {
      add(date, invoice.amount);
    }
  }

  const points: ForecastPoint[] = [];
  let running = startBalance;
  for (let day = 0; day <= horizonDays; day += 1) {
    const date = addDays(today, day);
    running += deltas.get(date) ?? 0;
    points.push({ date, projectedBalance: running });
  }

  const monthlyOutflow = rules
    .filter((rule) => rule.direction === "out")
    .reduce((sum, rule) => sum + (rule.cadence === "weekly" ? rule.amount * 4 : rule.amount), 0);

  const lowest = points.reduce(
    (min, point) => (point.projectedBalance < min.projectedBalance ? point : min),
    points[0] as ForecastPoint,
  );
  const gapPoint = points.find((point) => point.projectedBalance < 0) ?? null;

  return {
    currency,
    points,
    gapRisk: assessRisk(lowest.projectedBalance, monthlyOutflow),
    gapDate: gapPoint?.date ?? null,
    lowestBalance: lowest.projectedBalance,
  };
}

export function assessRisk(lowestBalance: number, monthlyOutflow: number): GapRisk {
  if (lowestBalance < 0) return "high";
  if (lowestBalance < monthlyOutflow / LOW_RISK_DIVISOR) return "low";
  return "none";
}

/** Резерв на налоги: сколько откладываем с поступления по заданному проценту. */
export function accrueTax(incomeMinor: number, percent: number): number {
  return Math.round((incomeMinor * percent) / 100);
}
