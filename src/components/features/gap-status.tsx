import { Badge } from "@/components/ui/badge";
import { AlertIcon, CheckIcon, ClockIcon } from "@/components/ui/icons";
import type { Currency, Forecast } from "@/lib/api/types";
import { daysBetween, formatFullDate, type IsoDate } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";

/**
 * Статус кассового разрыва — ради этой строчки продукт и существует.
 *
 * Риск никогда не передаётся одним цветом: иконка, слово и дата говорят то же
 * самое. Цвет здесь — ускоритель чтения, а не носитель смысла.
 */
export function GapStatusBadge({ forecast }: { forecast: Forecast }) {
  if (forecast.gapRisk === "high") {
    return (
      <Badge tone="critical" icon={<AlertIcon size={12} />}>
        Кассовый разрыв
      </Badge>
    );
  }
  if (forecast.gapRisk === "low") {
    return (
      <Badge tone="warning" icon={<ClockIcon size={12} />}>
        Запас на исходе
      </Badge>
    );
  }
  return (
    <Badge tone="good" icon={<CheckIcon size={12} />}>
      Разрыва не ожидается
    </Badge>
  );
}

export function GapStatusMessage({
  forecast,
  currency,
  today,
}: {
  forecast: Forecast;
  currency: Currency;
  today: IsoDate;
}) {
  if (forecast.gapRisk === "high" && forecast.gapDate) {
    const days = daysBetween(today, forecast.gapDate);
    return (
      <p className="text-sm text-secondary">
        Денег перестанет хватать{" "}
        <strong className="font-semibold text-primary">{formatFullDate(forecast.gapDate)}</strong> —
        через {days} дн. Дно прогноза: {formatMoney(forecast.lowestBalance, currency)}.
      </p>
    );
  }

  if (forecast.gapRisk === "low") {
    return (
      <p className="text-sm text-secondary">
        Разрыва нет, но подушка тонкая: минимум за 30 дней —{" "}
        <strong className="font-semibold text-primary">
          {formatMoney(forecast.lowestBalance, currency)}
        </strong>
        .
      </p>
    );
  }

  return (
    <p className="text-sm text-secondary">
      В ближайшие 30 дней баланс не опускается ниже{" "}
      <strong className="font-semibold text-primary">
        {formatMoney(forecast.lowestBalance, currency)}
      </strong>
      .
    </p>
  );
}
