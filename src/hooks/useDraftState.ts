import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { getLocale } from '@/i18n';

/**
 * Root đổi `key` theo ngôn ngữ, nên đổi VI/EN sẽ dựng lại cả trang và xoá mọi state đang nhập dở.
 * useDraftState giữ giá trị trong bộ nhớ qua lần dựng lại đó (không lưu xuống máy),
 * và xoá khi rời trang thật sự (unmount mà ngôn ngữ không đổi). key = null → như useState thường.
 */
const drafts = new Map<string, unknown>();

export function useDraftState<T>(key: string | null, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (key && drafts.has(key)) return drafts.get(key) as T;
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    if (key) drafts.set(key, value);
  }, [key, value]);

  useEffect(() => {
    if (!key) return;
    const locale = getLocale();
    return () => {
      if (getLocale() === locale) drafts.delete(key);
    };
  }, [key]);

  return [value, setValue];
}
