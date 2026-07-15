/**
 * Даты — только ISO-строки YYYY-MM-DD и арифметика в UTC.
 *
 * Локальные Date-конструкторы здесь запрещены осознанно: прогноз строится по
 * календарным дням, и сдвиг часового пояса легко превращает «сегодня» в «вчера»,
 * а вместе с этим — платёж не в тот день.
 */

export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(iso: IsoDate): Date {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    throw new Error(`Некорректная дата: ${iso}`);
  }
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/**
 * Прибавляет месяцы, не «перепрыгивая» через месяц: 31 января + 1 месяц = 28/29
 * февраля, а не 2/3 марта. Ровно так ведут себя реальные списания по подписке.
 */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const date = parseIsoDate(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDayOfMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDayOfMonth));
  return toIsoDate(date);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return a < b;
}

export function monthKey(iso: IsoDate): string {
  return iso.slice(0, 7);
}

const dayMonthFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const fullFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "short",
  timeZone: "UTC",
});

/** «7 мар» — для осей и списков. */
export function formatDayMonth(iso: IsoDate): string {
  return dayMonthFormatter.format(parseIsoDate(iso)).replace(".", "");
}

/** «7 марта 2026» — для карточек и подписей. */
export function formatFullDate(iso: IsoDate): string {
  return fullFormatter.format(parseIsoDate(iso));
}

/** «мар» из ключа месяца YYYY-MM. */
export function formatMonthShort(month: string): string {
  return monthFormatter.format(parseIsoDate(`${month}-01`)).replace(".", "");
}

/** «через 3 дня», «сегодня», «5 дней назад» — относительно опорной даты. */
export function formatRelativeDays(iso: IsoDate, today: IsoDate): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "сегодня";
  if (diff === 1) return "завтра";
  if (diff === -1) return "вчера";
  const abs = Math.abs(diff);
  const plural = pluralizeDays(abs);
  return diff > 0 ? `через ${abs} ${plural}` : `${abs} ${plural} назад`;
}

function pluralizeDays(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}
