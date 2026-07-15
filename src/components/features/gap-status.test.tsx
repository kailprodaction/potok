import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GapStatusBadge } from "@/components/features/gap-status";
import type { Forecast } from "@/lib/api/types";

function forecast(overrides: Partial<Forecast> = {}): Forecast {
  return {
    currency: "KZT",
    points: [{ date: "2026-03-10", projectedBalance: 100_000 }],
    gapRisk: "none",
    gapDate: null,
    lowestBalance: 100_000,
    ...overrides,
  };
}

/**
 * Смысл этих проверок — не «отрисовался ли бейдж», а то, что статус читается
 * без цвета: текстом. Пользователь с дальтонизмом и скринридер получают ровно
 * ту же информацию, что и все остальные.
 */
describe("GapStatusBadge", () => {
  it("называет кассовый разрыв словами", () => {
    render(<GapStatusBadge forecast={forecast({ gapRisk: "high", gapDate: "2026-03-19" })} />);
    expect(screen.getByText("Кассовый разрыв")).toBeInTheDocument();
  });

  it("отличает тонкую подушку от разрыва", () => {
    render(<GapStatusBadge forecast={forecast({ gapRisk: "low" })} />);
    expect(screen.getByText("Запас на исходе")).toBeInTheDocument();
  });

  it("сообщает, что разрыва нет", () => {
    render(<GapStatusBadge forecast={forecast()} />);
    expect(screen.getByText("Разрыва не ожидается")).toBeInTheDocument();
  });
});
