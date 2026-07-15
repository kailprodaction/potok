import { describe, expect, it } from "vitest";

import { addDays, addMonths, daysBetween, formatRelativeDays, monthKey } from "@/lib/format/date";

describe("addDays", () => {
  it("переходит через границу месяца", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("умеет назад", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("знает про високосный год", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("addMonths", () => {
  it("не перепрыгивает через февраль с 31-го числа", () => {
    // Наивная реализация дала бы 3 марта — и списание встало бы не в свой месяц.
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("в високосный год упирается в 29-е", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });

  it("обычный сдвиг сохраняет число", () => {
    expect(addMonths("2026-03-15", 1)).toBe("2026-04-15");
  });

  it("переходит через год", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });
});

describe("daysBetween", () => {
  it("считает календарные дни", () => {
    expect(daysBetween("2026-03-10", "2026-03-20")).toBe(10);
    expect(daysBetween("2026-03-20", "2026-03-10")).toBe(-10);
  });
});

describe("monthKey", () => {
  it("режет дату до месяца", () => {
    expect(monthKey("2026-03-15")).toBe("2026-03");
  });
});

describe("formatRelativeDays", () => {
  it("склоняет дни по-русски", () => {
    expect(formatRelativeDays("2026-03-11", "2026-03-10")).toBe("завтра");
    expect(formatRelativeDays("2026-03-12", "2026-03-10")).toBe("через 2 дня");
    expect(formatRelativeDays("2026-03-15", "2026-03-10")).toBe("через 5 дней");
    expect(formatRelativeDays("2026-03-21", "2026-03-10")).toBe("через 11 дней");
    expect(formatRelativeDays("2026-03-31", "2026-03-10")).toBe("через 21 день");
  });

  it("различает прошлое и будущее", () => {
    expect(formatRelativeDays("2026-03-10", "2026-03-10")).toBe("сегодня");
    expect(formatRelativeDays("2026-03-05", "2026-03-10")).toBe("5 дней назад");
  });
});
