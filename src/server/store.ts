import "server-only";

import type {
  Account,
  Analytics,
  Category,
  CategoryBreakdownItem,
  Invoice,
  MonthlyIncomePoint,
  RecurringRule,
  TaxReserve,
  Transaction,
} from "@/lib/api/types";
import { addDays, addMonths, monthKey, toIsoDate, type IsoDate } from "@/lib/format/date";

/**
 * Хранилище-заглушка вместо реального backend-API.
 *
 * Живёт в памяти процесса: при перезапуске сервера данные возвращаются к
 * исходным, а на нескольких инстансах не шарятся. Для витрины это осознанно —
 * контракт совпадает с тем, что отдаёт настоящий API, поэтому замена
 * затрагивает только этот файл и роут-хендлеры, но не UI.
 *
 * Даты считаются относительно «сегодня», чтобы дашборд не протухал.
 */

/** Мажорные тенге → тиыны. Всё внутри — целые минимальные единицы. */
const kzt = (major: number): number => major * 100;

export function today(): IsoDate {
  return toIsoDate(new Date());
}

const account: Account = {
  id: "acc_7712043399",
  balance: kzt(96_000),
  currency: "KZT",
};

/**
 * Сценарий подобран так, чтобы витрина показывала главную ценность продукта.
 *
 * Баланс сегодня — 96 000 ₸, плюс сегодня же ждём просроченный счёт на 180 000:
 * банковское приложение покажет «276 000 ₸, всё хорошо». Но через 5 дней аренда,
 * через 9 — подрядчик, и на девятый день баланс уходит в минус на 78 000 ₸ —
 * за два дня до того, как придёт оплата по счёту Kaspi Lab.
 *
 * Ровно этот разрыв Поток и обязан подсветить заранее.
 */
function recurringRules(from: IsoDate): RecurringRule[] {
  return [
    {
      id: "rule_software",
      amount: kzt(24_000),
      direction: "out",
      category: "software",
      cadence: "monthly",
      nextDate: addDays(from, 3),
      title: "Подписки: Figma, Adobe, хостинг",
    },
    {
      id: "rule_rent",
      amount: kzt(180_000),
      direction: "out",
      category: "rent",
      cadence: "monthly",
      nextDate: addDays(from, 5),
      title: "Аренда студии",
    },
    {
      id: "rule_contractors",
      amount: kzt(150_000),
      direction: "out",
      category: "contractors",
      cadence: "monthly",
      nextDate: addDays(from, 9),
      title: "Подрядчик: вёрстка",
    },
    {
      id: "rule_retainer",
      amount: kzt(450_000),
      direction: "in",
      category: "client",
      cadence: "monthly",
      nextDate: addDays(from, 18),
      title: "Ретейнер: Kaspi Lab",
    },
    {
      id: "rule_taxes",
      amount: kzt(95_000),
      direction: "out",
      category: "taxes",
      cadence: "monthly",
      nextDate: addDays(from, 20),
      title: "Налог с оборота",
    },
  ];
}

function seedInvoices(from: IsoDate): Invoice[] {
  return [
    {
      id: "inv_2041",
      clientName: "Kaspi Lab",
      amount: kzt(320_000),
      currency: "KZT",
      status: "sent",
      dueDate: addDays(from, 11),
      issuedAt: addDays(from, -4),
    },
    {
      id: "inv_2042",
      clientName: "Chocofood",
      amount: kzt(610_000),
      currency: "KZT",
      status: "sent",
      dueDate: addDays(from, 26),
      issuedAt: addDays(from, -1),
    },
    {
      id: "inv_2039",
      clientName: "Halyk Digital",
      amount: kzt(180_000),
      currency: "KZT",
      status: "overdue",
      dueDate: addDays(from, -6),
      issuedAt: addDays(from, -36),
    },
    {
      id: "inv_2038",
      clientName: "Beeline KZ",
      amount: kzt(540_000),
      currency: "KZT",
      status: "paid",
      dueDate: addDays(from, -12),
      issuedAt: addDays(from, -42),
    },
    {
      id: "inv_2037",
      clientName: "Freedom Broker",
      amount: kzt(275_000),
      currency: "KZT",
      status: "paid",
      dueDate: addDays(from, -25),
      issuedAt: addDays(from, -55),
    },
    {
      id: "inv_2043",
      clientName: "Kolesa Group",
      amount: kzt(390_000),
      currency: "KZT",
      status: "draft",
      dueDate: addDays(from, 30),
      issuedAt: from,
    },
  ];
}

const taxReserve: TaxReserve = {
  percent: 10,
  accrued: kzt(184_500),
  currency: "KZT",
};

/** История поступлений за 6 месяцев — основа графика динамики дохода. */
const INCOME_HISTORY: number[] = [
  980_000, 1_240_000, 760_000, 1_410_000, 1_150_000, 1_320_000,
];

const EXPENSE_HISTORY: Array<{ category: Category; amount: number; dayOffset: number; title: string }> = [
  { category: "rent", amount: 180_000, dayOffset: -25, title: "Аренда студии" },
  { category: "contractors", amount: 150_000, dayOffset: -21, title: "Подрядчик: вёрстка" },
  { category: "taxes", amount: 95_000, dayOffset: -19, title: "Налог с оборота" },
  { category: "software", amount: 24_000, dayOffset: -27, title: "Подписки: Figma, Adobe, хостинг" },
  { category: "marketing", amount: 60_000, dayOffset: -14, title: "Реклама в Instagram" },
  { category: "contractors", amount: 85_000, dayOffset: -9, title: "Подрядчик: иллюстрации" },
  { category: "other", amount: 32_000, dayOffset: -6, title: "Коворкинг и связь" },
  { category: "software", amount: 18_000, dayOffset: -3, title: "Notion, Linear" },
];

/**
 * Модуль-синглтон: счета мутируются POST-хендлером, поэтому список создаётся
 * один раз на процесс, а не на каждый запрос.
 */
let invoices: Invoice[] | null = null;
let invoiceCounter = 2043;

function getInvoices(): Invoice[] {
  invoices ??= seedInvoices(today());
  return invoices;
}

export const db = {
  getAccount(): Account {
    return { ...account };
  },

  getRules(): RecurringRule[] {
    return recurringRules(today());
  },

  listInvoices(): Invoice[] {
    const order: Record<Invoice["status"], number> = { overdue: 0, sent: 1, draft: 2, paid: 3 };
    return [...getInvoices()].sort(
      (a, b) => order[a.status] - order[b.status] || a.dueDate.localeCompare(b.dueDate),
    );
  },

  addInvoice(input: Omit<Invoice, "id" | "issuedAt" | "status">): Invoice {
    invoiceCounter += 1;
    const invoice: Invoice = {
      ...input,
      id: `inv_${invoiceCounter}`,
      status: "sent",
      issuedAt: today(),
    };
    getInvoices().unshift(invoice);
    return invoice;
  },

  getTaxReserve(): TaxReserve {
    return { ...taxReserve };
  },

  setTaxPercent(percent: number): TaxReserve {
    taxReserve.percent = percent;
    return { ...taxReserve };
  },

  /** Ближайшие движения: правила и ожидаемые оплаты в пределах горизонта. */
  getUpcoming(days: number): Transaction[] {
    const from = today();
    const to = addDays(from, days);

    const fromRules: Transaction[] = recurringRules(from)
      .filter((rule) => rule.nextDate <= to)
      .map((rule) => ({
        id: `up_${rule.id}`,
        amount: rule.amount,
        direction: rule.direction,
        category: rule.category,
        date: rule.nextDate,
        recurring: true,
        title: rule.title,
      }));

    const fromInvoices: Transaction[] = getInvoices()
      .filter((invoice) => invoice.status === "sent" && invoice.dueDate <= to)
      .map((invoice) => ({
        id: `up_${invoice.id}`,
        amount: invoice.amount,
        direction: "in" as const,
        category: "client" as const,
        date: invoice.dueDate,
        recurring: false,
        title: `Счёт ${invoice.clientName}`,
      }));

    return [...fromRules, ...fromInvoices].sort((a, b) => a.date.localeCompare(b.date));
  },

  getExpensesByCategory(): CategoryBreakdownItem[] {
    const totals = new Map<Category, number>();
    for (const item of EXPENSE_HISTORY) {
      totals.set(item.category, (totals.get(item.category) ?? 0) + kzt(item.amount));
    }
    return [...totals.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  },

  getAnalytics(): Analytics {
    const current = today();
    const monthlyIncome: MonthlyIncomePoint[] = INCOME_HISTORY.map((income, index) => ({
      month: monthKey(addMonths(current, index - (INCOME_HISTORY.length - 1))),
      income: kzt(income),
    }));

    return {
      currency: "KZT",
      monthlyIncome,
      expensesByCategory: db.getExpensesByCategory(),
    };
  },
};
