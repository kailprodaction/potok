"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ширина контейнера для отзывчивого SVG.
 *
 * Альтернатива — viewBox с preserveAspectRatio="none", но она растягивает
 * штрихи и текст вместе с холстом: линия в 2px превращается в 3.7px, шрифт
 * плывёт. Поэтому считаем реальные пиксели и рисуем в них.
 */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
