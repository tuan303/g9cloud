import type { vi } from './locales/vi';

/** Chuỗi số nhiều (tiếng Anh): { one: '1 item', other: '{count} items' } */
export interface Plural {
  one: string;
  other: string;
}

type Leaf = string | Plural;

/** Cấu trúc bản dịch: mọi ngôn ngữ phải có đủ khoá giống tiếng Việt */
export type MessageShape<T> = {
  [K in keyof T]: T[K] extends Leaf ? Leaf : MessageShape<T[K]>;
};

type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Leaf ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Mọi khoá hợp lệ, VD 'cart.title' */
export type MessageKey = Paths<typeof vi>;
