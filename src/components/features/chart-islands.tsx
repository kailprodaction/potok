"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { ChartSkeleton } from "@/components/ui/skeleton";
import type { ForecastChart } from "@/components/features/forecast-chart";
import type { IncomeChart } from "@/components/features/income-chart";

/**
 * «Острова» интерактива: графики грузятся отдельным чанком и не тянут свой вес
 * в общий бандл.
 *
 * ssr: false здесь не лень, а честность — график меряет ширину контейнера через
 * ResizeObserver, которого на сервере нет. Серверный рендер выдал бы пустой холст
 * нужной высоты и тут же перерисовал его на клиенте: работа вдвойне ради
 * разметки, которую никто не увидит. Вместо этого место держит скелетон той же
 * высоты — макет не прыгает.
 */

const LazyForecastChart = dynamic(
  () => import("@/components/features/forecast-chart").then((module) => module.ForecastChart),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> },
);

const LazyIncomeChart = dynamic(
  () => import("@/components/features/income-chart").then((module) => module.IncomeChart),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> },
);

export function ForecastChartIsland(props: ComponentProps<typeof ForecastChart>) {
  return <LazyForecastChart {...props} />;
}

export function IncomeChartIsland(props: ComponentProps<typeof IncomeChart>) {
  return <LazyIncomeChart {...props} />;
}
