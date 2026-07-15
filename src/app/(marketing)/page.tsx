import type { Metadata } from "next";
import Link from "next/link";

import { PricingGrid } from "@/components/features/pricing-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertIcon, ChartIcon, ClockIcon, ReceiptIcon, RepeatIcon, WalletIcon } from "@/components/ui/icons";

/**
 * Лендинг: статическая генерация с инкрементальной ревалидацией.
 *
 * Ни одного клиентского компонента — на страницу не уезжает ничего, кроме
 * рантайма навигации. Это самый быстрый первый экран, который вообще возможен,
 * и ровно то, что нужно странице, живущей на органическом трафике.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Поток — видеть деньги наперёд",
  description:
    "Прогноз баланса на 30 дней для фрилансеров и малого бизнеса: кассовый разрыв виден заранее, резерв на налоги откладывается сам, счета под контролем.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    Icon: ChartIcon,
    title: "Прогноз баланса на 30 дней",
    text: "Повторяющиеся платежи, выставленные счета и регулярные клиенты складываются в одну линию — сколько денег будет и когда.",
  },
  {
    Icon: AlertIcon,
    title: "Кассовый разрыв заранее",
    text: "Поток подсвечивает день, когда денег перестанет хватать, пока до него ещё три недели и что-то можно сделать.",
  },
  {
    Icon: WalletIcon,
    title: "Резерв на налоги",
    text: "Задайте процент — и с каждого поступления он откладывается сам. В конце квартала не придётся искать деньги.",
  },
  {
    Icon: ReceiptIcon,
    title: "Счета",
    text: "Выставляйте счета и следите за статусами. Новый счёт сразу попадает в прогноз как будущие деньги.",
  },
  {
    Icon: RepeatIcon,
    title: "Повторяющиеся правила",
    text: "Аренда, подписки, ретейнеры. Один раз описали — дальше прогноз строится сам.",
  },
  {
    Icon: ClockIcon,
    title: "Мультивалютность",
    text: "₸, ₽ и $ в одном месте, с корректным форматированием сумм и дат.",
  },
];

const STEPS = [
  {
    title: "Подключите деньги",
    text: "Добавьте баланс, регулярные доходы и расходы. Это пять минут и делается один раз.",
  },
  {
    title: "Получите линию вперёд",
    text: "Поток строит проекцию на 30 дней и отмечает день, когда деньги заканчиваются.",
  },
  {
    title: "Реагируйте заранее",
    text: "Выставьте счёт раньше, сдвиньте расход, отложите налог — и посмотрите, как линия выправится.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Раньше я узнавал о кассовом разрыве в день аренды. Теперь вижу его за две недели и просто выставляю счёт раньше.",
    author: "Ильяс",
    role: "продуктовый дизайнер, фрилансер",
  },
  {
    quote:
      "Резерв на налоги закрыл мою главную боль. Десять процентов уходят сами, и в конце квартала нет паники.",
    author: "Мария",
    role: "владелица студии, 4 человека",
  },
  {
    quote:
      "Банк показывает прошлое. Поток показывает, доживу ли я до оплаты по большому проекту.",
    author: "Данияр",
    role: "разработчик на аутсорсе",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-accent-text">
            Для фрилансеров и микробизнеса
          </p>
          <h1 className="mt-3 text-[length:var(--text-display)] font-semibold leading-[1.1] text-primary">
            Видеть деньги наперёд
          </h1>
          <p className="mt-5 text-lg text-secondary">
            Банковское приложение показывает, сколько денег сейчас. Поток показывает, сколько будет
            через месяц — и предупреждает о кассовом разрыве до того, как он станет проблемой.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/overview">
              <Button className="w-full sm:w-auto">Посмотреть дашборд</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" className="w-full sm:w-auto">
                Тарифы
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted">
            Без карты. Демо открыто — внутри живой прогноз на вымышленных данных.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="problem-heading"
        className="border-y border-hairline bg-surface-1"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2
            id="problem-heading"
            className="max-w-2xl text-[length:var(--text-h2)] font-semibold text-primary"
          >
            Деньги приходят проектами, а расходы — по расписанию
          </h2>
          <p className="mt-4 max-w-2xl text-secondary">
            Аренда, подписки и подрядчики списываются каждый месяц в один и тот же день. Оплата по
            счёту приходит когда придёт. Разрыв между этими двумя графиками и есть та самая
            ситуация, когда «деньги вроде были».
          </p>

          <dl className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-secondary">Средняя задержка оплаты счёта</dt>
              <dd className="mt-1 text-[length:var(--text-h2)] font-semibold text-primary">18 дней</dd>
            </div>
            <div>
              <dt className="text-sm text-secondary">Фрилансеров сталкивались с разрывом</dt>
              <dd className="mt-1 text-[length:var(--text-h2)] font-semibold text-primary">61 %</dd>
            </div>
            <div>
              <dt className="text-sm text-secondary">Горизонт прогноза Потока</dt>
              <dd className="mt-1 text-[length:var(--text-h2)] font-semibold text-primary">30 дней</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 id="features-heading" className="text-[length:var(--text-h2)] font-semibold text-primary">
          Что умеет Поток
        </h2>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }) => (
            <li key={title}>
              <Card className="h-full p-5">
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-series-wash text-accent-text"
                >
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm text-secondary">{text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="steps-heading"
        className="border-y border-hairline bg-surface-1"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 id="steps-heading" className="text-[length:var(--text-h2)] font-semibold text-primary">
            Как это работает
          </h2>

          <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="font-semibold text-primary">{step.title}</h3>
                <p className="text-sm text-secondary">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="testimonials-heading"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <h2 id="testimonials-heading" className="text-[length:var(--text-h2)] font-semibold text-primary">
          Кому это уже помогло
        </h2>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <li key={item.author}>
              <Card className="h-full p-5">
                <blockquote className="text-sm text-primary">«{item.quote}»</blockquote>
                <footer className="mt-4 text-sm text-secondary">
                  <span className="font-medium text-primary">{item.author}</span>
                  <span className="block text-muted">{item.role}</span>
                </footer>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="pricing-heading"
        className="border-t border-hairline bg-surface-1"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 id="pricing-heading" className="text-[length:var(--text-h2)] font-semibold text-primary">
            Тарифы
          </h2>
          <p className="mt-2 text-secondary">Начните бесплатно, платите, когда прогноз начнёт окупаться.</p>

          <div className="mt-8">
            <PricingGrid />
          </div>
        </div>
      </section>
    </>
  );
}
