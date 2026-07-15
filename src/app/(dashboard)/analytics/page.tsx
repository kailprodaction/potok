import type { Metadata } from "next";
import { Suspense } from "react";

import { CategoryBreakdown } from "@/components/features/category-breakdown";
import { IncomeChartIsland } from "@/components/features/chart-islands";
import { StatTile } from "@/components/features/stat-tile";
import { Card, CardHeader } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { getAnalytics } from "@/lib/api/server";
import { formatMoney, formatPercentDelta } from "@/lib/format/money";

export const metadata: Metadata = {
  title: "Аналитика",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();
  const { monthlyIncome, expensesByCategory, currency } = analytics;

  const current = monthlyIncome[monthlyIncome.length - 1]?.income ?? 0;
  const previous = monthlyIncome[monthlyIncome.length - 2]?.income ?? 0;
  const delta = previous === 0 ? 0 : (current - previous) / previous;

  const average =
    monthlyIncome.length === 0
      ? 0
      : Math.round(
          monthlyIncome.reduce((sum, point) => sum + point.income, 0) / monthlyIncome.length,
        );

  const topCategory = expensesByCategory[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[length:var(--text-h1)] font-semibold text-primary">Аналитика</h1>
        <p className="text-sm text-secondary">Динамика дохода и структура расходов.</p>
      </div>

      <Card as="section">
        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3 sm:p-6">
          <StatTile
            label="Доход в этом месяце"
            value={formatMoney(current, currency)}
            delta={{
              text: formatPercentDelta(delta),
              direction: delta >= 0 ? "up" : "down",
              isGood: delta >= 0,
              period: "к прошлому месяцу",
            }}
          />
          <StatTile label="Средний доход за 6 месяцев" value={formatMoney(average, currency)} />
          <StatTile
            label="Крупнейшая статья расходов"
            value={topCategory ? formatMoney(topCategory.amount, currency) : "—"}
          />
        </div>
      </Card>

      <Card as="section">
        <CardHeader title="Доход по месяцам" description="Последние 6 месяцев" />
        <Suspense fallback={<ChartSkeleton height={260} />}>
          <IncomeChartIsland data={monthlyIncome} currency={currency} />
        </Suspense>
      </Card>

      <Card as="section">
        <CardHeader title="Топ категорий расходов" description="За последние 30 дней" />
        <CategoryBreakdown items={expensesByCategory} currency={currency} />
      </Card>
    </div>
  );
}
