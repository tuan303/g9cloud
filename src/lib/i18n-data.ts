import { CATEGORIES, seedNameEn } from '@/data/menu';
import { pick } from '@/i18n';
import type { CategoryId } from '@/types';

/**
 * Tên/mô tả song ngữ cho dữ liệu (món, tuỳ chọn, danh mục, dòng đơn) — theo ngôn ngữ đang chọn,
 * thiếu bản tiếng Anh thì dùng tiếng Việt.
 */
export const itemName = (i: { name: string; nameEn?: string }) => pick(i.name, i.nameEn);
export const itemDescription = (i: { description: string; descriptionEn?: string }) => pick(i.description, i.descriptionEn);
export const groupName = (g: { name: string; nameEn?: string }) => pick(g.name, g.nameEn);
export const choiceName = (c: { name: string; nameEn?: string }) => pick(c.name, c.nameEn);
export const categoryName = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.name ?? id;
/** Tên món trong giỏ / đơn (lưu cả tên tiếng Anh lúc thêm món; đơn cũ chưa có thì tra thực đơn mẫu) */
export const lineName = (l: { itemId?: string; name: string; nameEn?: string }) => pick(l.name, l.nameEn ?? seedNameEn(l.itemId, l.name));
