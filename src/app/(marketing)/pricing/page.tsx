import type { Metadata } from "next";

import { PricingGrid } from "@/components/features/pricing-grid";
import { Card } from "@/components/ui/card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Тарифы",
  description:
    "Free, Pro и Business: прогноз баланса, резерв на налоги, счета и аналитика. Начните бесплатно, без карты.",
  alternates: { canonical: "/pricing" },
};

const FAQ = [
  {
    question: "Откуда Поток берёт данные?",
    answer:
      "Из ваших операций, повторяющихся правил и выставленных счетов. Прогноз — производная от них: движок складывает будущие поступления и списания по дням.",
  },
  {
    question: "Насколько точен прогноз?",
    answer:
      "Регулярные платежи предсказуемы почти идеально. Счета — настолько, насколько предсказуемы ваши клиенты: просроченный счёт Поток считает ожидаемым сегодня, а не задним числом.",
  },
  {
    question: "Что будет с данными, если я перестану платить?",
    answer:
      "Аккаунт переходит на Free. Данные остаются, ограничивается только объём операций и часть функций.",
  },
  {
    question: "Можно ли работать в нескольких валютах?",
    answer: "Да, на тарифе Business: ₸, ₽ и $ с корректным форматированием сумм и дат.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-[length:var(--text-h1)] font-semibold text-primary">Тарифы</h1>
      <p className="mt-2 max-w-2xl text-secondary">
        Прогноз доступен на всех тарифах, включая бесплатный: ценность продукта не должна быть за
        платной стеной.
      </p>

      <div className="mt-10">
        <PricingGrid />
      </div>

      <section aria-labelledby="faq-heading" className="mt-16">
        <h2 id="faq-heading" className="text-[length:var(--text-h2)] font-semibold text-primary">
          Частые вопросы
        </h2>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FAQ.map((item) => (
            <Card key={item.question} className="p-5">
              <dt className="font-medium text-primary">{item.question}</dt>
              <dd className="mt-2 text-sm text-secondary">{item.answer}</dd>
            </Card>
          ))}
        </dl>
      </section>
    </div>
  );
}
