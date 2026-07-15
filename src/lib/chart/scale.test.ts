import { describe, expect, it } from "vitest";

import { niceTicks, pickLabelIndices, scaleLinear } from "@/lib/chart/scale";

describe("niceTicks", () => {
  it("округляет деления до человеческих чисел", () => {
    expect(niceTicks(0, 1_410_000, 4)).toEqual([0, 500_000, 1_000_000, 1_500_000]);
  });

  it("включает ноль в диапазон, когда данные уходят в минус", () => {
    const ticks = niceTicks(-78_000, 1_207_000, 4);

    expect(ticks).toContain(0);
    expect(ticks[0]).toBeLessThan(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(1_207_000);
  });

  it("не накапливает хвосты плавающей точки", () => {
    for (const tick of niceTicks(0, 3, 4)) {
      expect(Number.isFinite(tick)).toBe(true);
      expect(Math.abs(tick - Number(tick.toFixed(6)))).toBeLessThan(1e-9);
    }
  });

  it("переживает плоский ряд без падения", () => {
    expect(niceTicks(100, 100, 4).length).toBeGreaterThan(0);
  });
});

describe("scaleLinear", () => {
  it("отображает домен в диапазон", () => {
    const scale = scaleLinear([0, 100], [0, 200]);

    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(100);
    expect(scale(100)).toBe(200);
  });

  it("умеет перевёрнутый диапазон — ось Y растёт вверх, а пиксели вниз", () => {
    const scale = scaleLinear([0, 100], [200, 0]);
    expect(scale(100)).toBe(0);
  });

  it("не делит на ноль на вырожденном домене", () => {
    expect(Number.isFinite(scaleLinear([5, 5], [0, 100])(5))).toBe(true);
  });
});

describe("pickLabelIndices", () => {
  it("на широком графике подписывает каждую точку", () => {
    expect(pickLabelIndices(6, 100, 34)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("на узком — прореживает, чтобы подписи не наезжали", () => {
    // Полоса 20px, подпись 34px: влезает каждая вторая.
    expect(pickLabelIndices(6, 20, 34)).toEqual([0, 2, 4]);
  });

  it("выдержанного расстояния между подписями хватает на их ширину", () => {
    const spacing = 6;
    const labelWidth = 52;
    const indices = pickLabelIndices(31, spacing, labelWidth, true);

    for (let i = 1; i < indices.length; i += 1) {
      const gap = ((indices[i] as number) - (indices[i - 1] as number)) * spacing;
      expect(gap).toBeGreaterThanOrEqual(labelWidth);
    }
  });

  it("конец горизонта подписан всегда, даже если шаг до него не дотянулся", () => {
    const indices = pickLabelIndices(31, 6, 52, true);
    expect(indices[indices.length - 1]).toBe(30);
  });

  it("предпоследняя подпись уступает место последней, если жмётся к ней", () => {
    // stride=9 дал бы 0,9,18,27, а 27 и 30 разделяют лишь 3*6=18px < 52px.
    expect(pickLabelIndices(31, 6, 52, true)).not.toContain(27);
  });

  it("не падает на вырожденных входах", () => {
    expect(pickLabelIndices(1, 10, 34)).toEqual([0]);
    expect(pickLabelIndices(0, 10, 34)).toEqual([]);
    expect(pickLabelIndices(5, 0, 34)).toEqual([0]);
  });
});
