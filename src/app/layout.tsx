import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/app/providers";

import "./globals.css";

/**
 * Шрифт самохостится на билде и подключается через CSS-переменную: без запроса
 * к стороннему домену (его бы всё равно срезал CSP) и без подмены шрифта на
 * лету — display: swap с системным фолбэком не двигает макет.
 *
 * Кириллица здесь не опция: весь интерфейс русскоязычный.
 */
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://potok.finance"),
  title: {
    default: "Поток — видеть деньги наперёд",
    template: "%s · Поток",
  },
  description:
    "Прогноз баланса на 30 дней вперёд для фрилансеров и малого бизнеса. Поток заранее показывает кассовый разрыв, откладывает резерв на налоги и ведёт счета.",
  applicationName: "Поток",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Поток",
    title: "Поток — видеть деньги наперёд",
    description:
      "Не «сколько денег сейчас», а «сколько будет через месяц». Прогноз баланса, кассовые разрывы заранее, резерв на налоги и инвойсы.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <a href="#main" className="skip-link">
          Перейти к содержимому
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
