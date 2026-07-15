"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const controlClass =
  "min-h-[var(--tap-target)] w-full rounded-[var(--radius-md)] border border-hairline bg-surface-1 px-3 text-primary " +
  "placeholder:text-muted aria-[invalid=true]:border-critical";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { controlId: string; describedBy: string | undefined }) => ReactNode;
}

/**
 * Обёртка поля: связывает label, подсказку и ошибку с контролом.
 *
 * Ошибка живёт в aria-live: скринридер узнаёт о ней в момент появления, а не
 * когда пользователь случайно доедет до неё табом.
 */
export function Field({ label, hint, error, children }: FieldShellProps) {
  const controlId = useId();
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-sm font-medium text-primary">
        {label}
      </label>
      {children({ controlId, describedBy })}
      {hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      <p id={errorId} role="alert" className="min-h-4 text-xs text-critical-text">
        {error}
      </p>
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClass, className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(controlClass, "pr-8", className)} {...props}>
        {children}
      </select>
    );
  },
);
