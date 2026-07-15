import { describe, expect, it } from "vitest";

import { formatMoney, formatPercentDelta, maskAccount, toMajor, toMinor } from "@/lib/format/money";

/**
 * Intl вставляет неразрывные пробелы (U+00A0) между разрядами и перед знаком
 * валюты. Сравнивать с обычным пробелом бессмысленно — нормализуем.
 */
const normalize = (value: string): string => value.replace(/ | /g, " ");

describe("toMinor / toMajor", () => {
  it("переводит мажорные единицы в минимальные без потери копеек", () => {
    expect(toMinor(1500.5, "KZT")).toBe(150_050);
    expect(toMajor(150_050, "KZT")).toBe(1500.5);
  });

  it("округляет до целого: доли копейки не существует", () => {
    expect(toMinor(0.005, "USD")).toBe(1);
    expect(Number.isInteger(toMinor(10.999, "RUB"))).toBe(true);
  });

  it("переживает классическую ошибку с плавающей точкой", () => {
    // 19.99 * 100 в двоичной арифметике = 1998.9999999999998
    expect(toMinor(19.99, "USD")).toBe(1999);
  });
});

describe("formatMoney", () => {
  it("скрывает копейки, когда они нулевые", () => {
    // 150 000 тиын = 1 500 ₸: на входе всегда минимальные единицы.
    expect(normalize(formatMoney(150_000, "KZT"))).toBe("1 500 ₸");
  });

  it("показывает копейки, когда они есть", () => {
    expect(normalize(formatMoney(150_050, "KZT"))).toBe("1 500,50 ₸");
  });

  it("показывает минус у отрицательного баланса", () => {
    expect(normalize(formatMoney(-20_000, "KZT"))).toContain("-");
  });

  it("форматирует каждую валюту своим знаком", () => {
    expect(normalize(formatMoney(10_000, "USD"))).toContain("$");
    expect(normalize(formatMoney(10_000, "RUB"))).toContain("₽");
  });
});

describe("formatPercentDelta", () => {
  it("всегда ставит знак — иначе непонятно, рост это или падение", () => {
    expect(normalize(formatPercentDelta(0.124))).toBe("+12,4 %");
    expect(normalize(formatPercentDelta(-0.05))).toBe("-5 %");
  });
});

describe("maskAccount", () => {
  it("оставляет только последние четыре знака", () => {
    expect(maskAccount("acc_7712043399")).toBe("•••• 3399");
  });
});
