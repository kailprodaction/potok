import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

/** Ключи кэша в одном месте — инвалидация не разъезжается по компонентам. */
export const queryKeys = {
  overview: ["overview"] as const,
  invoices: ["invoices"] as const,
  analytics: ["analytics"] as const,
};

/**
 * Баланс живой: фоновая ревалидация держит цифры свежими без ручного обновления,
 * но не чаще, чем это имеет смысл для денег — раз в минуту.
 */
export const overviewQuery = () =>
  queryOptions({
    queryKey: queryKeys.overview,
    queryFn: api.getOverview,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

export const invoicesQuery = () =>
  queryOptions({
    queryKey: queryKeys.invoices,
    queryFn: api.getInvoices,
    staleTime: 30_000,
  });

export const analyticsQuery = () =>
  queryOptions({
    queryKey: queryKeys.analytics,
    queryFn: api.getAnalytics,
    staleTime: 5 * 60_000,
  });
