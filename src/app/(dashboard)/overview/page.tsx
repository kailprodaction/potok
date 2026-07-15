import type { Metadata } from "next";
import { Suspense } from "react";

import { CategoryBreakdown } from "@/components/features/category-breakdown";
import { ForecastChartIsland } from "@/components/features/chart-islands";
import { GapStatusBadge, GapStatusMessage } from "@/components/features/gap-status";
import { StatTile } from "@/components/features/stat-tile";
import { TaxReserveWidget } from "@/components/features/tax-reserve-widget";
import { UpcomingList } from "@/components/features/upcoming-list";
import { Card, CardHeader } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { getOverview } from "@/lib/api/server";
import { formatMoney } from "@/lib/format/money";
import { today } from "@/server/store";

export const metadata: Metadata = {
  title: "Обзор",
};

/** Баланс — живые данные, кэшировать страницу нельзя. */
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const overview = await getOverview();
  const { account, forecast, upcoming, expensesByCategory, taxReserve } = overview;
  const now = today();

  const points = forecast.points;
  const projected = points[points.length - 1]?.projectedBalance ?? account.balance;
  const change = projected - account.balance;
  const nextIncome = upcoming.find((item) => item.direction === "in")?.amount ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[length:var(--text-h1)] font-semibold text-primary">Обзор</h1>
        <p className="text-sm text-secondary">
          Прогноз строится по повторяющимся платежам и выставленным счетам.
        </p>
      </div>

      {/*
        Метрики рисуются сразу на сервере: цифры — это то, ради чего пользователь
        открыл дашборд, и они не должны ждать загрузки графика.
      */}
      <Card as="section">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StatTile
              hero
              label="Баланс сейчас"
              value={formatMoney(account.balance, account.currency)}
            />
            <GapStatusBadge forecast={forecast} />
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-hairline pt-5 sm:grid-cols-2">
            <StatTile
              label="Прогноз через 30 дней"
              value={formatMoney(projected, forecast.currency)}
              delta={{
                text: formatMoney(Math.abs(change), forecast.currency),
                direction: change >= 0 ? "up" : "down",
                isGood: change >= 0,
                period: "за 30 дней",
              }}
            />
            <StatTile
              label="Дно прогноза"
              value={formatMoney(forecast.lowestBalance, forecast.currency)}
              hint={<GapStatusMessage forecast={forecast} currency={forecast.currency} today={now} />}
            />
          </div>
        </div>
      </Card>

      <Card as="section">
        <CardHeader
          title="Прогноз баланса"
          description="30 дней вперёд, с учётом счетов и регулярных платежей"
        />
        {/* Скелетон занимает высоту графика — первый экран не дёргается. */}
        <Suspense fallback={<ChartSkeleton height={280} />}>
          <ForecastChartIsland forecast={forecast} />
        </Suspense>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card as="section">
          <CardHeader title="Ближайшие движения" description="Следующие 14 дней" />
          <div className="pb-2">
            <UpcomingList items={upcoming} currency={account.currency} today={now} />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card as="section">
            <CardHeader title="Резерв на налоги" description="Откладывается с каждого поступления" />
            <TaxReserveWidget reserve={taxReserve} nextIncome={nextIncome} />
          </Card>

          <Card as="section">
            <CardHeader title="Расходы по категориям" description="За последние 30 дней" />
            <CategoryBreakdown items={expensesByCategory} currency={account.currency} />
          </Card>
        </div>
      </div>
    </div>
  );
}
