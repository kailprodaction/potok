"use client";

import { useMemo, useState } from "react";

import { TableIcon } from "@/components/ui/icons";
import type { Currency, MonthlyIncomePoint } from "@/lib/api/types";
import { niceTicks, pickLabelIndices, scaleLinear } from "@/lib/chart/scale";
import { formatMonthShort } from "@/lib/format/date";
import { formatMoney, formatNumberCompact } from "@/lib/format/money";
import { useMeasure } from "@/lib/hooks/use-measure";

/**
 * Динамика дохода по месяцам.
 *
 * Одна серия — один цвет на все колонки. Красить колонки «темнее там, где
 * больше» было бы двойным кодированием: высота уже сказала это, а свободный
 * канал цвета сгорел бы впустую.
 */

const HEIGHT = 260;
const MARGIN = { top: 24, right: 12, bottom: 28, left: 64 };
const MAX_BAR_WIDTH = 24;
/** Зазор в цвет поверхности — им и разделяются соседние колонки, не обводкой. */
const BAR_GAP = 2;
/** Ширина подписи месяца («июнь») с воздухом. */
const MONTH_LABEL_WIDTH = 34;

/** Скруглён только верх: низ сидит на базовой линии и обязан быть квадратным. */
function columnPath(x: number, y: number, width: number, height: number, radius = 4): string {
  const r = Math.max(Math.min(radius, height, width / 2), 0);
  const bottom = y + height;
  return [
    `M${x},${bottom}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${bottom}`,
    "Z",
  ].join(" ");
}

interface IncomeChartProps {
  data: MonthlyIncomePoint[];
  currency: Currency;
}

export function IncomeChart({ data, currency }: IncomeChartProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const geometry = useMemo(() => {
    const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const ticks = niceTicks(0, Math.max(...data.map((point) => point.income), 1), 4);
    const domain: [number, number] = [0, ticks[ticks.length - 1] ?? 1];
    const y = scaleLinear(domain, [MARGIN.top + plotHeight, MARGIN.top]);

    const band = plotWidth / Math.max(data.length, 1);
    // Колонка не заполняет свою полосу: остаток полосы — это воздух, а не ошибка.
    const barWidth = Math.min(Math.max(band - BAR_GAP * 2, 4), MAX_BAR_WIDTH);

    return {
      plotWidth,
      plotHeight,
      ticks,
      y,
      band,
      barWidth,
      baselineY: MARGIN.top + plotHeight,
      // На узком экране подписывается каждый второй месяц: лучше пропуск, чем
      // каша из наложенных слов. Значение каждой колонки остаётся в подсказке и
      // в таблице, так что ничего не теряется.
      labelIndices: new Set(pickLabelIndices(data.length, band, MONTH_LABEL_WIDTH)),
    };
  }, [data, width]);

  const maxIncome = Math.max(...data.map((point) => point.income));
  const activePoint = activeIndex === null ? null : data[activeIndex];

  const barX = (index: number): number =>
    MARGIN.left + geometry.band * index + (geometry.band - geometry.barWidth) / 2;

  const summary = `Доход по месяцам, ${data.length} точек. Максимум ${formatMoney(
    maxIncome,
    currency,
  )}.`;

  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    const lastIndex = data.length - 1;
    const current = activeIndex ?? 0;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    const delta = moves[event.key];

    if (delta !== undefined) {
      event.preventDefault();
      setActiveIndex(Math.min(Math.max(current + delta, 0), lastIndex));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(lastIndex);
    }
  }

  return (
    <div className="px-5 pb-5 sm:px-6 sm:pb-6">
      <div ref={ref} className="relative w-full">
        {width > 0 ? (
          /*
           * Клавиатура работает как на графике прогноза: фокус берёт весь холст,
           * стрелки ходят по колонкам. Делать фокусируемым каждый прямоугольник
           * нельзя — role="img" объявляет содержимое неделимой картинкой, и
           * фокусируемые потомки внутри неё противоречат этой роли (axe ловит
           * это как nested-interactive). Прямоугольники остались мишенями только
           * для указателя.
           */
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={summary}
            tabIndex={0}
            onFocus={() => setActiveIndex(0)}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={handleKeyDown}
          >
            {geometry.ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={MARGIN.left + geometry.plotWidth}
                  y1={geometry.y(tick)}
                  y2={geometry.y(tick)}
                  stroke={tick === 0 ? "var(--baseline)" : "var(--gridline)"}
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 10}
                  y={geometry.y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-[var(--text-muted)] text-[11px] [font-variant-numeric:tabular-nums]"
                >
                  {formatNumberCompact(tick, currency)}
                </text>
              </g>
            ))}

            {data.map((point, index) => {
              const y = geometry.y(point.income);
              const height = geometry.baselineY - y;
              const isActive = activeIndex === index;

              return (
                <g key={point.month}>
                  <path
                    d={columnPath(barX(index), y, geometry.barWidth, height)}
                    fill="var(--series-1)"
                    opacity={isActive ? 0.82 : 1}
                  />

                  {/* Подписан только максимум: число над каждой колонкой не читают. */}
                  {point.income === maxIncome ? (
                    <text
                      x={barX(index) + geometry.barWidth / 2}
                      y={y - 8}
                      textAnchor="middle"
                      className="fill-[var(--text-secondary)] text-[11px] font-medium [font-variant-numeric:tabular-nums]"
                    >
                      {formatNumberCompact(point.income, currency)}
                    </text>
                  ) : null}

                  {geometry.labelIndices.has(index) ? (
                    <text
                      x={barX(index) + geometry.barWidth / 2}
                      y={HEIGHT - 8}
                      textAnchor="middle"
                      className="fill-[var(--text-muted)] text-[11px]"
                    >
                      {formatMonthShort(point.month)}
                    </text>
                  ) : null}

                  {/* Мишень шире колонки: в 24px попадать пальцем никто не обязан. */}
                  <rect
                    x={MARGIN.left + geometry.band * index}
                    y={MARGIN.top}
                    width={geometry.band}
                    height={geometry.plotHeight}
                    fill="transparent"
                    onPointerEnter={() => setActiveIndex(index)}
                    onPointerLeave={() => setActiveIndex(null)}
                  />
                </g>
              );
            })}
          </svg>
        ) : (
          <div style={{ height: HEIGHT }} />
        )}

        {activePoint && activeIndex !== null ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-[var(--radius-md)] border border-hairline bg-surface-1 px-3 py-2 shadow-[var(--shadow-pop)]"
            style={{
              left: Math.min(Math.max(barX(activeIndex) + geometry.barWidth / 2, 64), Math.max(width - 64, 64)),
              top: 0,
            }}
          >
            <div className="text-sm font-semibold text-primary [font-variant-numeric:tabular-nums]">
              {formatMoney(activePoint.income, currency)}
            </div>
            <div className="text-xs text-secondary">{formatMonthShort(activePoint.month)}</div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowTable((value) => !value)}
          aria-expanded={showTable}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-2 text-xs text-secondary hover:text-primary"
        >
          <TableIcon size={14} />
          {showTable ? "Скрыть таблицу" : "Показать таблицей"}
        </button>
      </div>

      {showTable ? (
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">Доход по месяцам</caption>
          <thead>
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium text-secondary">
                Месяц
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium text-secondary">
                Доход
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.month} className="border-t border-hairline">
                <td className="px-3 py-1.5 text-secondary">{formatMonthShort(point.month)}</td>
                <td className="px-3 py-1.5 text-right text-primary [font-variant-numeric:tabular-nums]">
                  {formatMoney(point.income, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
