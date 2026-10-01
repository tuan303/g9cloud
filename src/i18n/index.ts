import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/store/persist-storage';
import { vi } from './locales/vi';
import { en } from './locales/en';
import type { MessageKey, Plural } from './types';

/**
 * Song ngữ Tiếng Việt / English.
 *  - Giao diện: const { t } = useT();  t('cart.title')  ·  t('cart.items', { count: 3 })
 *  - Ngoài React (store, service, toast): translate('errors.cartEmpty')
 *  - Dữ liệu song ngữ (món, tuỳ chọn, cấu hình): pick(vi, en) — tự rơi về tiếng Việt khi thiếu bản dịch
 * Thêm chữ mới: khai báo ở locales/vi/<nhóm>.ts rồi locales/en/<nhóm>.ts (TypeScript báo lỗi nếu thiếu).
 */

export type Locale = 'vi' | 'en';
export type { MessageKey } from './types';

export const LOCALES: { value: Locale; label: string; short: string }[] = [
  { value: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { value: 'en', label: 'English', short: 'EN' },
];

const MESSAGES = { vi, en } as const;

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'vi';
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  const first = (langs.find(Boolean) ?? 'vi').toLowerCase();
  return first.startsWith('vi') ? 'vi' : first.startsWith('en') ? 'en' : 'vi';
}

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'c9.locale.v1', storage: persistStorage },
  ),
);

/** Ngôn ngữ hiện tại (dùng ngoài React) */
export const getLocale = (): Locale => useLocale.getState().locale;

// Đồng bộ thuộc tính lang của trang (trình đọc màn hình, gạch chân chính tả...)
if (typeof document !== 'undefined') {
  document.documentElement.lang = getLocale();
  useLocale.subscribe((s) => (document.documentElement.lang = s.locale));
}

export type Vars = Record<string, string | number | undefined>;

function lookup(locale: Locale, key: string): string | Plural | undefined {
  let node: unknown = MESSAGES[locale];
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) node = (node as Record<string, unknown>)[part];
    else return undefined;
  }
  return node as string | Plural | undefined;
}

function format(template: string | Plural, vars: Vars | undefined, locale: Locale): string {
  let text: string;
  if (typeof template === 'string') text = template;
  else {
    const n = Number(vars?.count ?? 0);
    text = new Intl.PluralRules(locale).select(n) === 'one' ? template.one : template.other;
  }
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (vars[name] === undefined ? m : String(vars[name])));
}

/** Dịch một khoá theo ngôn ngữ chỉ định (thiếu bản dịch → tiếng Việt → chính khoá) */
export function translateIn(locale: Locale, key: MessageKey, vars?: Vars): string {
  const msg = lookup(locale, key) ?? lookup('vi', key);
  if (msg === undefined) {
    if (import.meta.env.DEV) console.warn('[i18n] thiếu khoá', key);
    return key;
  }
  return format(msg, vars, locale);
}

/** Dịch theo ngôn ngữ hiện tại — dùng được ở mọi nơi (store, service, toast) */
export function translate(key: MessageKey, vars?: Vars): string {
  return translateIn(getLocale(), key, vars);
}

/** Hook cho component: tự vẽ lại khi đổi ngôn ngữ */
export function useT() {
  const locale = useLocale((s) => s.locale);
  const t = useCallback((key: MessageKey, vars?: Vars) => translateIn(locale, key, vars), [locale]);
  return { t, locale };
}

/** Chọn bản dịch của dữ liệu song ngữ (VD tên món / nameEn) theo ngôn ngữ hiện tại */
export function pick(viText: string, enText?: string | null, locale: Locale = getLocale()): string {
  return locale === 'en' && enText ? enText : viText;
}
