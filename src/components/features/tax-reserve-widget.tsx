"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";

import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queries";
import type { Overview, TaxReserve } from "@/lib/api/types";
import { formatMoney, formatPercent } from "@/lib/format/money";

/**
 * Резерв на налоги.
 *
 * Процент пересчитывается на клиенте оптимистично: пользователь тянет ползунок
 * и сразу видит числа, а ответ сервера лишь подтверждает их. Ждать round-trip,
 * чтобы показать умножение на 0.1, — значит заставить интерфейс мигать на
 * ровном месте.
 */

const PERCENT_OPTIONS = [0, 5, 10, 15, 20, 25, 30];

interface TaxReserveWidgetProps {
  reserve: TaxReserve;
  /** Ближайшее поступление — на нём показываем, как правило сработает. */
  nextIncome: number | null;
}

export function TaxReserveWidget({ reserve, nextIncome }: TaxReserveWidgetProps) {
  const queryClient = useQueryClient();
  const selectId = useId();

  const mutation = useMutation({
    mutationFn: api.setTaxPercent,
    onMutate: async (percent: number) => {
      // Летящий рефетч перезапишет оптимистичное значение — тормозим его.
      await queryClient.cancelQueries({ queryKey: queryKeys.overview });
      const previous = queryClient.getQueryData<Overview>(queryKeys.overview);

      queryClient.setQueryData<Overview>(queryKeys.overview, (current) =>
        current ? { ...current, taxReserve: { ...current.taxReserve, percent } } : current,
      );

      return { previous };
    },
    onError: (_error, _percent, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.overview, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });

  const percent = reserve.percent;
  const setAside = nextIncome === null ? null : Math.round((nextIncome * percent) / 100);
  const net = nextIncome === null || setAside === null ? null : nextIncome - setAside;

  return (
    <div className="flex flex-col gap-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
      <div>
        <div className="text-2xl font-semibold text-primary">
          {formatMoney(reserve.accrued, reserve.currency)}
        </div>
        <p className="mt-1 text-sm text-secondary">отложено с начала года</p>
      </div>

      {/* Шкала: заполнение и трек — шаги одной шкалы, состояние читается по всей полосе. */}
      <div
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Доля поступлений в резерв"
        className="h-2 w-full overflow-hidden rounded-full bg-series-track"
      >
        <div className="h-full rounded-full bg-series-1" style={{ width: `${percent}%` }} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-primary">
          Откладывать с каждого поступления
        </label>
        <select
          id={selectId}
          value={percent}
          disabled={mutation.isPending}
          onChange={(event) => mutation.mutate(Number(event.target.value))}
          className="min-h-[var(--tap-target)] w-full rounded-[var(--radius-md)] border border-hairline bg-surface-1 px-3 text-primary"
        >
          {PERCENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatPercent(option / 100)}
            </option>
          ))}
        </select>
      </div>

      {nextIncome !== null && setAside !== null && net !== null ? (
        <dl className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-surface-2 p-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-secondary">Ближайшее поступление</dt>
            <dd className="text-primary [font-variant-numeric:tabular-nums]">
              {formatMoney(nextIncome, reserve.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-secondary">В резерв</dt>
            <dd className="text-primary [font-variant-numeric:tabular-nums]">
              {formatMoney(setAside, reserve.currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-hairline pt-2">
            <dt className="font-medium text-primary">Останется чистыми</dt>
            <dd className="font-semibold text-primary [font-variant-numeric:tabular-nums]">
              {formatMoney(net, reserve.currency)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-secondary">Ближайших поступлений в горизонте нет.</p>
      )}

      {mutation.isError ? (
        <p role="alert" className="text-sm text-critical-text">
          Не удалось сохранить процент. Попробуйте ещё раз.
        </p>
      ) : null}
    </div>
  );
}
