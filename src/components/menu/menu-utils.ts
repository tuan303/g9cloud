import { useCallback, useLayoutEffect, useRef } from 'react';
import type { MenuItem } from '@/types';

/** Chuẩn hoá để tìm không dấu: "Cà phê SỮA đá" → "ca phe sua da" */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chuỗi đã chuẩn hoá của một món (tên + mô tả, cả tiếng Việt lẫn tiếng Anh) — tính sẵn một lần.
 * Tìm được bằng cả hai ngôn ngữ, bất kể đang chọn ngôn ngữ nào.
 */
export function searchableText(item: Pick<MenuItem, 'name' | 'nameEn' | 'description' | 'descriptionEn'>): string {
  return normalizeText([item.name, item.nameEn, item.description, item.descriptionEn].filter(Boolean).join(' '));
}

/** Mọi từ trong truy vấn (đã chuẩn hoá) đều phải xuất hiện trong chuỗi tìm kiếm */
export function matchesQuery(haystack: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return normalizedQuery.split(' ').every((token) => haystack.includes(token));
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Hiệu ứng "nảy" nhẹ bằng Web Animations API (không cần thêm CSS) */
export function bump(el: Element | null, keyframes: Keyframe[], duration = 380) {
  if (!el || typeof el.animate !== 'function' || prefersReducedMotion()) return;
  el.animate(keyframes, { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/**
 * Hàm có định danh ổn định nhưng luôn gọi phiên bản mới nhất của `fn`.
 * BottomSheet chạy lại effect (khoá cuộn + trả focus) mỗi khi `onClose` đổi định danh → cần ổn định.
 */
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
