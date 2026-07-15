"use client";

import { useMemo, useState } from "react";

import { TableIcon } from "@/components/ui/icons";
import type { Forecast } from "@/lib/api/types";
import { niceTicks, pickLabelIndices, scaleLinear } from "@/lib/chart/scale";
import { formatDayMonth, formatFullDate } from "@/lib/format/date";
import { formatMoney, formatNumberCompact } from "@/lib/format/money";
import { useMeasure } from "@/lib/hooks/use-measure";

/**
 * График прогноза баланса — тяжёлый клиентский «остров», грузится через
 * dynamic import. Одна серия, поэтому легенда не нужна: заголовок карточки уже
 * говорит, что нарисовано. Значение конца ряда подписано прямо на графике,
 * остальные достаются осью, подсказкой и таблицей.
 */

/** Высота включает полосу подписей оси X: иначе карточка ловит внутренний скролл. */
const HEIGHT = 280;
/**
 * Левое поле рассчитано на самую широкую подпись оси — а она отрицательная
 * («-500 тыс.»), потому что прогноз обязан уметь уходить в минус. При узком поле
 * SVG срезает ровно первый символ, то есть минус: график тогда рисует провал, а
 * ось подписывает его как плюс.
 */
const MARGIN = { top: 24, right: 68, bottom: 28, left: 72 };

/** Ширина, которую занимает подпись даты («22 июл») плюс воздух вокруг неё. */
const DATE_LABEL_WIDTH = 52;

/** Ниже этой ширины поле под подпись конца ряда не окупается — см. NARROW_MARGIN. */
const NARROW_WIDTH = 520;

/**
 * На узком экране правое поле в 68px под подпись «1,2 млн» съедает четверть
 * холста. Подпись там и не нужна: ровно это число стоит крупным шрифтом в плитке
 * «Прогноз через 30 дней» прямо над графиком, а на самом графике значение
 * достаётся перекрестьем и таблицей. Отдаём пиксели данным — но не меньше
 * половины подписи даты, иначе крайняя дата вылезет за холст.
 */
const NARROW_MARGIN_RIGHT = DATE_LABEL_WIDTH / 2;

interface ForecastChartProps {
  forecast: Forecast;
}

export function ForecastChart({ forecast }: ForecastChartProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { points, currency, gapDate } = forecast;

  const narrow = width > 0 && width < NARROW_WIDTH;

  const geometry = useMemo(() => {
    const marginRight = narrow ? NARROW_MARGIN_RIGHT : MARGIN.right;
    const plotWidth = Math.max(width - MARGIN.left - marginRight, 0);
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const values = points.map((point) => point.projectedBalance);
    const ticks = niceTicks(Math.min(0, ...values), Math.max(...values), 4);
    const domain: [number, number] = [ticks[0] ?? 0, ticks[ticks.length - 1] ?? 1];

    const x = scaleLinear([0, Math.max(points.length - 1, 1)], [MARGIN.left, MARGIN.left + plotWidth]);
    const y = scaleLinear(domain, [MARGIN.top + plotHeight, MARGIN.top]);

    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.projectedBalance)}`)
      .join(" ");

    // Заливка идёт до нуля, а не до низа холста: провал под ноль читается как провал.
    const zeroY = y(Math.max(domain[0], 0));
    const area = `${line} L${x(points.length - 1)},${zeroY} L${x(0)},${zeroY} Z`;

    return {
      plotWidth,
      plotHeight,
      ticks,
      x,
      y,
      line,
      area,
      zeroY,
      domain,
      labelIndices: pickLabelIndices(
        points.length,
        plotWidth / Math.max(points.length - 1, 1),
        DATE_LABEL_WIDTH,
        true,
      ),
    };
  }, [points, width, narrow]);

  const lastIndex = points.length - 1;
  const lastPoint = points[lastIndex];
  const gapIndex = gapDate ? points.findIndex((point) => point.date === gapDate) : -1;
  const activePoint = activeIndex === null ? null : points[activeIndex];

  const summary = `Прогноз баланса на ${lastIndex} дней: с ${formatMoney(
    points[0]?.projectedBalance ?? 0,
    currency,
  )} до ${formatMoney(lastPoint?.projectedBalance ?? 0, currency)}. ${
    gapDate ? `Кассовый разрыв ${formatFullDate(gapDate)}.` : "Кассового разрыва не ожидается."
  }`;

  function handlePointer(event: React.PointerEvent<SVGSVGElement>) {
    if (geometry.plotWidth <= 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - bounds.left - MARGIN.left;
    const step = geometry.plotWidth / Math.max(lastIndex, 1);
    const index = Math.round(offset / step);
    setActiveIndex(Math.min(Math.max(index, 0), lastIndex));
  }

  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    const current = activeIndex ?? lastIndex;
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
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={summary}
            tabIndex={0}
            className="touch-pan-y"
            onPointerMove={handlePointer}
            onPointerLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(lastIndex)}
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
                  stroke="var(--gridline)"
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

            {/* Ноль — не просто деление: это граница, за которой деньги кончились. */}
            {geometry.domain[0] < 0 ? (
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + geometry.plotWidth}
                y1={geometry.zeroY}
                y2={geometry.zeroY}
                stroke="var(--baseline)"
                strokeWidth={1}
              />
            ) : null}

            <path d={geometry.area} fill="var(--series-1-wash)" />
            <path
              d={geometry.line}
              fill="none"
              stroke="var(--series-1)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {geometry.labelIndices.map((index) => {
              const point = points[index];
              if (!point) return null;
              return (
                /*
                 * Все подписи центрированы по своей точке — включая крайние.
                 * Прижимать первую якорем «start» соблазнительно ради ровного
                 * края, но тогда она растёт вправо на всю ширину, а не на
                 * половину, и наезжает на соседнюю: расчёт расстояний считает
                 * подписи центрированными, и якорь обязан этому соответствовать.
                 * Поля слева и справа рассчитаны так, чтобы крайние помещались.
                 */
                <text
                  key={point.date}
                  x={geometry.x(index)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-[var(--text-muted)] text-[11px]"
                >
                  {formatDayMonth(point.date)}
                </text>
              );
            })}

            {gapIndex >= 0 && points[gapIndex] ? (
              <g>
                <circle
                  cx={geometry.x(gapIndex)}
                  cy={geometry.y(points[gapIndex].projectedBalance)}
                  r={5}
                  fill="var(--status-critical)"
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
                <text
                  x={geometry.x(gapIndex)}
                  y={geometry.y(points[gapIndex].projectedBalance) + 22}
                  textAnchor="middle"
                  className="fill-[var(--status-critical)] text-[11px] font-medium"
                >
                  разрыв
                </text>
              </g>
            ) : null}

            {activePoint ? (
              <g>
                <line
                  x1={geometry.x(activeIndex ?? 0)}
                  x2={geometry.x(activeIndex ?? 0)}
                  y1={MARGIN.top}
                  y2={MARGIN.top + geometry.plotHeight}
                  stroke="var(--baseline)"
                  strokeWidth={1}
                />
                <circle
                  cx={geometry.x(activeIndex ?? 0)}
                  cy={geometry.y(activePoint.projectedBalance)}
                  r={4}
                  fill="var(--series-1)"
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
              </g>
            ) : null}

            {lastPoint ? (
              <>
                <circle
                  cx={geometry.x(lastIndex)}
                  cy={geometry.y(lastPoint.projectedBalance)}
                  r={4}
                  fill="var(--series-1)"
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
                {narrow ? null : (
                  <text
                    x={geometry.x(lastIndex) + 10}
                    y={geometry.y(lastPoint.projectedBalance)}
                    dominantBaseline="middle"
                    className="fill-[var(--text-secondary)] text-[11px] font-medium"
                  >
                    {formatNumberCompact(lastPoint.projectedBalance, currency)}
                  </text>
                )}
              </>
            ) : null}
          </svg>
        ) : (
          <div style={{ height: HEIGHT }} />
        )}

        {activePoint ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-[var(--radius-md)] border border-hairline bg-surface-1 px-3 py-2 shadow-[var(--shadow-pop)]"
            style={{
              left: Math.min(
                Math.max(geometry.x(activeIndex ?? 0), 72),
                Math.max(width - 72, 72),
              ),
              top: 0,
            }}
          >
            <div className="text-sm font-semibold text-primary [font-variant-numeric:tabular-nums]">
              {formatMoney(activePoint.projectedBalance, currency)}
            </div>
            <div className="text-xs text-secondary">{formatFullDate(activePoint.date)}</div>
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
        <div className="mt-2 max-h-64 overflow-auto rounded-[var(--radius-md)] border border-hairline">
          <table className="w-full text-sm">
            <caption className="sr-only">Прогноз баланса по дням</caption>
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium text-secondary">
                  Дата
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium text-secondary">
                  Прогноз баланса
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date} className="border-t border-hairline">
                  <td className="px-3 py-1.5 text-secondary">{formatFullDate(point.date)}</td>
                  <td className="px-3 py-1.5 text-right text-primary [font-variant-numeric:tabular-nums]">
                    {formatMoney(point.projectedBalance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
