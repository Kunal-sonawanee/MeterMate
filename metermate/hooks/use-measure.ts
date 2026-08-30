"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Element width, tracked with a ResizeObserver.
 *
 * Charts need real pixel dimensions to place ticks and labels; scaling an SVG
 * with `preserveAspectRatio` would stretch the type along with the marks.
 */
export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    setWidth(element.clientWidth);

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
