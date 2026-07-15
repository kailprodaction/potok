"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queries";
import {
  createInvoiceInputSchema,
  type CreateInvoiceInput,
  type Currency,
  type Invoice,
} from "@/lib/api/types";
import { addDays, toIsoDate } from "@/lib/format/date";

/**
 * Создание счёта.
 *
 * Схема валидации — та же, что проверяет тело запроса на сервере: одно описание
 * правил, а не два расходящихся.
 *
 * После успеха инвалидируется не только список счетов, но и прогноз: новый счёт
 * — это будущие деньги, и проекция баланса обязана их учесть немедленно.
 */

const CURRENCIES: Array<{ value: Currency; label: string }> = [
  { value: "KZT", label: "₸ Тенге" },
  { value: "RUB", label: "₽ Рубль" },
  { value: "USD", label: "$ Доллар" },
];

export function InvoiceForm({ onCreated }: { onCreated?: (invoice: Invoice) => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceInputSchema),
    defaultValues: {
      clientName: "",
      currency: "KZT",
      dueDate: addDays(toIsoDate(new Date()), 14),
    },
  });

  const mutation = useMutation({
    mutationFn: api.createInvoice,
    onSuccess: (invoice) => {
      queryClient.setQueryData<Invoice[]>(queryKeys.invoices, (current) =>
        current ? [invoice, ...current] : [invoice],
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      void queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      reset();
      onCreated?.(invoice);
    },
    onError: (error) => {
      // Ошибки сервера по полям садятся на свои инпуты, а не в общий текст сверху.
      if (error instanceof ApiError) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages?.[0];
          if (message && field in createInvoiceInputSchema.shape) {
            setError(field as keyof CreateInvoiceInput, { message });
          }
        }
      }
    },
  });

  const pending = isSubmitting || mutation.isPending;

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutateAsync(values).catch(() => undefined))}
      className="flex flex-col gap-2 px-5 pb-5 sm:px-6 sm:pb-6"
    >
      <Field label="Клиент" error={errors.clientName?.message}>
        {({ controlId, describedBy }) => (
          <Input
            id={controlId}
            aria-describedby={describedBy}
            aria-invalid={Boolean(errors.clientName)}
            autoComplete="organization"
            placeholder="Kaspi Lab"
            {...register("clientName")}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <Field label="Сумма" error={errors.amountMajor?.message}>
          {({ controlId, describedBy }) => (
            <Input
              id={controlId}
              aria-describedby={describedBy}
              aria-invalid={Boolean(errors.amountMajor)}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="320000"
              {...register("amountMajor", { valueAsNumber: true })}
            />
          )}
        </Field>

        <Field label="Валюта" error={errors.currency?.message}>
          {({ controlId, describedBy }) => (
            <Select id={controlId} aria-describedby={describedBy} {...register("currency")}>
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Оплатить до" error={errors.dueDate?.message}>
        {({ controlId, describedBy }) => (
          <Input
            id={controlId}
            aria-describedby={describedBy}
            aria-invalid={Boolean(errors.dueDate)}
            type="date"
            {...register("dueDate")}
          />
        )}
      </Field>

      {mutation.isError && !(mutation.error instanceof ApiError && Object.keys(mutation.error.fieldErrors).length) ? (
        <p role="alert" className="text-sm text-critical-text">
          {mutation.error instanceof ApiError ? mutation.error.message : "Не удалось создать счёт"}
        </p>
      ) : null}

      {/* disabled на время отправки — единственная защита от двойного счёта. */}
      <Button type="submit" disabled={pending} className="mt-1 w-full sm:w-auto sm:self-start">
        {pending ? "Создаём…" : "Выставить счёт"}
      </Button>
    </form>
  );
}
