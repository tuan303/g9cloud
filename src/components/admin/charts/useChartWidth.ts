import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Đo chiều rộng thật của khung biểu đồ để viewBox SVG khớp 1:1 với pixel —
 * chữ luôn đúng cỡ (không bị phóng/thu theo tỉ lệ) từ 320px tới màn hình lớn.
 */
export function useChartWidth<T extends HTMLElement>(fallback = 320) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth((prev) => (prev === w ? prev : w));
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}
