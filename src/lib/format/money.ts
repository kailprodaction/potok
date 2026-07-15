import type { Currency } from "@/lib/api/types";

/**
 * Деньги приходят целыми в минимальных единицах и такими же живут в рантайме.
 * Плавающая точка появляется только в момент показа пользователю.
 */

const MINOR_UNITS: Record<Currency, number> = {
  KZT: 100,
  RUB: 100,
  USD: 100,
};

const LOCALE = "ru-RU";

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat(LOCALE, options);
  formatterCache.set(key, formatter);
  return formatter;
}

export function toMajor(minor: number, currency: Currency): number {
  return minor / MINOR_UNITS[currency];
}

/** Мажорные единицы → минимальные. Округление до целого: полкопейки не бывает. */
export function toMinor(major: number, currency: Currency): number {
  return Math.round(major * MINOR_UNITS[currency]);
}

export interface FormatMoneyOptions {
  /** Показывать копейки. По умолчанию — только если они ненулевые. */
  withFraction?: boolean;
  /** Явный знак «+» для входящих сумм. */
  signDisplay?: "auto" | "always" | "never";
}

/** «1 500,50 ₸» — полная сумма для карточек, списков и таблиц. */
export function formatMoney(
  minor: number,
  currency: Currency,
  options: FormatMoneyOptions = {},
): string {
  const { withFraction, signDisplay = "auto" } = options;
  const hasFraction = minor % MINOR_UNITS[currency] !== 0;
  const showFraction = withFraction ?? hasFraction;
  const fractionDigits = showFraction ? 2 : 0;

  const formatter = getFormatter(`money:${currency}:${fractionDigits}:${signDisplay}`, {
    style: "currency",
    currency,
    // Без narrowSymbol в ru-RU тенге печатается как «KZT»: CLDR отдаёт знак ₸
    // только казахской локали. Для сервиса про тенге это принципиально.
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: signDisplay === "never" ? "never" : signDisplay,
  });

  return formatter.format(toMajor(minor, currency));
}

/** «1,3 млн ₸» — для крупных чисел в плитках и на осях, где важна ширина. */
export function formatMoneyCompact(minor: number, currency: Currency): string {
  const formatter = getFormatter(`compact:${currency}`, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return formatter.format(toMajor(minor, currency));
}

/** Компактное число без валюты — для делений оси. */
export function formatNumberCompact(minor: number, currency: Currency): string {
  const formatter = getFormatter("compact-number", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return formatter.format(toMajor(minor, currency));
}

/** «+12,4 %» — дельта для плиток. */
export function formatPercentDelta(ratio: number): string {
  const formatter = getFormatter("percent-delta", {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "always",
  });
  return formatter.format(ratio);
}

export function formatPercent(value: number): string {
  const formatter = getFormatter("percent", {
    style: "percent",
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

/**
 * Маскирует номер счёта: показываем только последние 4 знака.
 * Полный номер не нужен ни в одном сценарии интерфейса.
 */
export function maskAccount(id: string): string {
  const tail = id.slice(-4);
  return `•••• ${tail}`;
}
