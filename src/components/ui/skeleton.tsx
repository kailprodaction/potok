import { cn } from "@/lib/cn";

/**
 * Скелетон занимает ровно ту же высоту, что и контент, который заменяет, —
 * иначе при загрузке макет прыгает и CLS уезжает из зелёной зоны.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-surface-2", className)}
    />
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="px-5 pb-5 sm:px-6 sm:pb-6" role="status" aria-label="Загружается график">
      <div
        style={{ height }}
        className="w-full animate-pulse rounded-[var(--radius-md)] bg-surface-2"
      />
    </div>
  );
}
