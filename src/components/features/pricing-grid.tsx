import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { PLANS } from "@/lib/content/pricing";

export function PricingGrid() {
  return (
    <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <li key={plan.id}>
          <Card
            className={cn(
              "flex h-full flex-col p-6",
              // Рекомендованный тариф выделен рамкой, а не цветом фона: контраст
              // текста остаётся тем же, что и в соседних карточках.
              plan.highlighted && "border-series-1",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-primary">{plan.name}</h3>
              {plan.highlighted ? (
                <span className="rounded-[var(--radius-full)] bg-series-wash px-2 py-1 text-xs font-medium text-accent-text">
                  Популярный
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-secondary">{plan.tagline}</p>

            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="text-[length:var(--text-h1)] font-semibold text-primary">
                {plan.price}
              </span>
              <span className="text-sm text-muted">{plan.period}</span>
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-secondary">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-good-text">
                    <CheckIcon size={14} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link href="/overview" className="mt-6">
              <Button variant={plan.highlighted ? "primary" : "secondary"} className="w-full">
                {plan.cta}
              </Button>
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
