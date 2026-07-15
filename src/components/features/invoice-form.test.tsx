import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InvoiceForm } from "@/components/features/invoice-form";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("InvoiceForm", () => {
  it("не отправляет счёт с пустым клиентом и показывает ошибку у поля", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<InvoiceForm />, { wrapper });

    await user.type(screen.getByLabelText("Сумма"), "1000");
    await user.click(screen.getByRole("button", { name: "Выставить счёт" }));

    expect(await screen.findByText("Имя клиента — минимум 2 символа")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("отклоняет нулевую сумму: счёт на ноль — это не счёт", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<InvoiceForm />, { wrapper });

    await user.type(screen.getByLabelText("Клиент"), "Kaspi Lab");
    await user.type(screen.getByLabelText("Сумма"), "0");
    await user.click(screen.getByRole("button", { name: "Выставить счёт" }));

    expect(await screen.findByText("Сумма должна быть больше нуля")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("отправляет сумму в мажорных единицах и зовёт onCreated", async () => {
    const user = userEvent.setup();
    const created = {
      id: "inv_9001",
      clientName: "Kaspi Lab",
      amount: 150_050,
      currency: "KZT",
      status: "sent",
      dueDate: "2026-04-01",
      issuedAt: "2026-03-10",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(created), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const onCreated = vi.fn();

    render(<InvoiceForm onCreated={onCreated} />, { wrapper });

    await user.type(screen.getByLabelText("Клиент"), "Kaspi Lab");
    await user.type(screen.getByLabelText("Сумма"), "1500.5");
    await user.click(screen.getByRole("button", { name: "Выставить счёт" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      clientName: "Kaspi Lab",
      amountMajor: 1500.5,
      currency: "KZT",
    });
  });

  it("сажает ошибку сервера на нужное поле", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Проверьте поля счёта", issues: { clientName: ["Такой клиент заблокирован"] } }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<InvoiceForm />, { wrapper });

    await user.type(screen.getByLabelText("Клиент"), "Kaspi Lab");
    await user.type(screen.getByLabelText("Сумма"), "1000");
    await user.click(screen.getByRole("button", { name: "Выставить счёт" }));

    expect(await screen.findByText("Такой клиент заблокирован")).toBeInTheDocument();
  });
});
