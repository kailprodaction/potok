type ClassValue = string | false | null | undefined;

/** Склейка классов без зависимости: falsy-значения отсеиваются. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
