import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryBreakdown } from "@/components/features/category-breakdown";

const items = [
  { category: "rent" as const, amount: 18_000_000 },
  { category: "contractors" as const, amount: 6_000_000 },
];

describe("CategoryBreakdown", () => {
  it("подписывает каждую категорию суммой и долей — значения не спрятаны в подсказку", () => {
    render(<CategoryBreakdown items={items} currency="KZT" />);

    expect(screen.getByText("Аренда")).toBeInTheDocument();
    expect(screen.getByText("75 %")).toBeInTheDocument();
    expect(screen.getByText("25 %")).toBeInTheDocument();
  });

  it("не делит на ноль на пустых данных", () => {
    render(<CategoryBreakdown items={[]} currency="KZT" />);
    expect(screen.getByText("За период расходов не было.")).toBeInTheDocument();
  });
});
