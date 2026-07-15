import { describe, expect, it } from "vitest";

import type { Invoice, RecurringRule } from "@/lib/api/types";
import { accrueTax, assessRisk, buildForecast } from "@/server/forecast-engine";

const TODAY = "2026-03-10";

function rule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: "rule_1",
    amount: 10_000,
    direction: "out",
    category: "rent",
    cadence: "monthly",
    nextDate: "2026-03-15",
    title: "Аренда",
    ...overrides,
  };
}

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv_1",
    clientName: "Клиент",
    amount: 50_000,
    currency: "KZT",
    status: "sent",
    dueDate: "2026-03-20",
    issuedAt: "2026-03-01",
    ...overrides,
  };
}

const base = {
  startBalance: 100_000,
  currency: "KZT" as const,
  today: TODAY,
  rules: [],
  invoices: [],
};

describe("buildForecast", () => {
  it("возвращает точку на каждый день горизонта включительно", () => {
    const forecast = buildForecast({ ...base, horizonDays: 30 });

    expect(forecast.points).toHaveLength(31);
    expect(forecast.points[0]?.date).toBe(TODAY);
    expect(forecast.points[30]?.date).toBe("2026-04-09");
  });

  it("без движений держит баланс ровной линией", () => {
    const forecast = buildForecast({ ...base, horizonDays: 5 });

    expect(forecast.points.every((point) => point.projectedBalance === 100_000)).toBe(true);
    expect(forecast.gapRisk).toBe("none");
    expect(forecast.gapDate).toBeNull();
  });

  it("вычитает расход в день срабатывания правила, а не раньше", () => {
    const forecast = buildForecast({
      ...base,
      horizonDays: 10,
      rules: [rule({ amount: 30_000, nextDate: "2026-03-15" })],
    });

    const before = forecast.points.find((point) => point.date === "2026-03-14");
    const after = forecast.points.find((point) => point.date === "2026-03-15");

    expect(before?.projectedBalance).toBe(100_000);
    expect(after?.projectedBalance).toBe(70_000);
  });

  it("накатывает еженедельное правило на каждую неделю горизонта", () => {
    const forecast = buildForecast({
      ...base,
      horizonDays: 21,
      rules: [rule({ amount: 5_000, cadence: "weekly", nextDate: "2026-03-11" })],
    });

    // Горизонт кончается 31 марта: попадают 11, 18 и 25 марта — три списания.
    expect(forecast.points[forecast.points.length - 1]?.projectedBalance).toBe(85_000);
  });

  it("догоняет правило с датой в прошлом до горизонта, не списывая задним числом", () => {
    const forecast = buildForecast({
      ...base,
      horizonDays: 30,
      rules: [rule({ amount: 20_000, cadence: "monthly", nextDate: "2026-01-15" })],
    });

    expect(forecast.points[0]?.projectedBalance).toBe(100_000);
    const onDue = forecast.points.find((point) => point.date === "2026-03-15");
    expect(onDue?.projectedBalance).toBe(80_000);
  });

  it("добавляет ожидаемую оплату по выставленному счёту", () => {
    const forecast = buildForecast({
      ...base,
      horizonDays: 30,
      invoices: [invoice({ amount: 50_000, dueDate: "2026-03-20" })],
    });

    const onDue = forecast.points.find((point) => point.date === "2026-03-20");
    expect(onDue?.projectedBalance).toBe(150_000);
  });

  it("не считает деньгами черновики и уже оплаченные счета", () => {
    const forecast = buildForecast({
      ...base,
      horizonDays: 30,
      invoices: [
        invoice({ id: "draft", status: "draft" }),
        invoice({ id: "paid", status: "paid" }),
      ],
    });

    expect(forecast.points.every((point) => point.projectedBalance === 100_000)).toBe(true);
  });

  it("ждёт просроченный счёт сегодня, а не в прошедшую дату оплаты", () => {
    const forecast = buildForecast({
      ...base,
      horizonDays: 30,
      invoices: [invoice({ status: "overdue", amount: 40_000, dueDate: "2026-03-01" })],
    });

    expect(forecast.points[0]?.projectedBalance).toBe(140_000);
  });

  it("находит день кассового разрыва и помечает высокий риск", () => {
    const forecast = buildForecast({
      ...base,
      startBalance: 10_000,
      horizonDays: 30,
      rules: [rule({ amount: 30_000, nextDate: "2026-03-15" })],
    });

    expect(forecast.gapRisk).toBe("high");
    expect(forecast.gapDate).toBe("2026-03-15");
    expect(forecast.lowestBalance).toBe(-20_000);
  });

  it("не выдумывает разрыв, если счёт закрывает дыру до неё", () => {
    const forecast = buildForecast({
      ...base,
      startBalance: 10_000,
      horizonDays: 30,
      rules: [rule({ amount: 30_000, nextDate: "2026-03-20" })],
      invoices: [invoice({ amount: 50_000, dueDate: "2026-03-12" })],
    });

    expect(forecast.gapDate).toBeNull();
    expect(forecast.gapRisk).toBe("none");
  });
});

describe("assessRisk", () => {
  it("минус на дне — всегда высокий риск", () => {
    expect(assessRisk(-1, 100_000)).toBe("high");
  });

  it("тонкая подушка — низкий риск", () => {
    // Дно 20 000 при месячных расходах 100 000 — меньше четверти.
    expect(assessRisk(20_000, 100_000)).toBe("low");
  });

  it("запас больше недельного расхода — риска нет", () => {
    expect(assessRisk(50_000, 100_000)).toBe("none");
  });
});

describe("accrueTax", () => {
  it("считает процент от поступления в целых минимальных единицах", () => {
    expect(accrueTax(100_000, 10)).toBe(10_000);
  });

  it("округляет до целого, а не оставляет доли копейки", () => {
    expect(accrueTax(333, 10)).toBe(33);
    expect(Number.isInteger(accrueTax(12_345, 7))).toBe(true);
  });
});
