import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './persist-storage';
import type { CartLine, MenuItem, SelectedOption } from '@/types';
import { uid } from '@/lib/id';
import { lineImageRef, lineSignature, rebuildLine, unitPrice } from '@/lib/pricing';

interface CartState {
  lines: CartLine[];
  note: string;
  add: (item: MenuItem, options: SelectedOption[], quantity: number, note?: string) => void;
  /** Thay thế một dòng (khi sửa tuỳ chọn từ giỏ hàng) */
  replace: (lineId: string, item: MenuItem, options: SelectedOption[], quantity: number, note?: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  setNote: (note: string) => void;
  clear: () => void;
  /** Đồng bộ giỏ với thực đơn mới (giá/tên/tuỳ chọn). Trả về true nếu có dòng thay đổi giá. */
  reprice: (menu: MenuItem[]) => boolean;
}

function makeLine(item: MenuItem, options: SelectedOption[], quantity: number, note?: string): CartLine {
  return {
    lineId: uid('line'),
    itemId: item.id,
    categoryId: item.categoryId,
    name: item.name,
    nameEn: item.nameEn,
    image: lineImageRef(item),
    basePrice: item.price,
    unitPrice: unitPrice(item, options),
    quantity,
    options,
    note: note?.trim() || undefined,
  };
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      note: '',
      add: (item, options, quantity, note) =>
        set((s) => {
          const line = makeLine(item, options, quantity, note);
          const sig = lineSignature(line);
          const existing = s.lines.find((l) => lineSignature(l) === sig);
          if (existing) {
            return {
              // lấy giá/tuỳ chọn mới nhất, giữ lineId + cộng dồn số lượng
              lines: s.lines.map((l) =>
                l === existing ? { ...line, lineId: l.lineId, quantity: Math.min(99, l.quantity + quantity) } : l,
              ),
            };
          }
          return { lines: [...s.lines, line] };
        }),
      replace: (lineId, item, options, quantity, note) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.lineId === lineId ? { ...makeLine(item, options, quantity, note), lineId } : l)),
        })),
      setQuantity: (lineId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.lineId !== lineId)
              : s.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.min(99, quantity) } : l)),
        })),
      remove: (lineId) => set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) })),
      setNote: (note) => set({ note }),
      clear: () => set({ lines: [], note: '' }),
      reprice: (menu) => {
        let priceChanged = false;
        const lines = get().lines.map((l) => {
          const item = menu.find((m) => m.id === l.itemId);
          if (!item) return l; // món bị xoá: giữ nguyên để trang giỏ hàng cảnh báo
          const next = rebuildLine(l, item);
          if (!next) return l;
          if (next.unitPrice !== l.unitPrice) priceChanged = true;
          return next;
        });
        if (JSON.stringify(lines) !== JSON.stringify(get().lines)) set({ lines });
        return priceChanged;
      },
    }),
    { name: 'c9.cart.v1', storage: persistStorage },
  ),
);

/** Selector tiện dụng */
export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectCartSubtotal = (s: CartState) => s.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
