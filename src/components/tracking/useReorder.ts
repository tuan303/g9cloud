import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '@/hooks/data';
import { useT } from '@/i18n';
import { lineName } from '@/lib/i18n-data';
import { defaultSelections, toSelectedOptions } from '@/lib/pricing';
import { useCart } from '@/store/cart';
import { toast } from '@/store/ui';
import type { MenuItem, Order, SelectedOption } from '@/types';

/**
 * Dựng lại tuỳ chọn theo thực đơn hiện tại: bỏ lựa chọn không còn tồn tại,
 * bù mặc định cho nhóm bắt buộc, tính lại phụ thu theo giá mới.
 */
function rebuildOptions(item: MenuItem, previous: SelectedOption[]): SelectedOption[] {
  const groups = item.optionGroups ?? [];
  const defaults = defaultSelections(item);
  const selections: Record<string, string[]> = {};
  for (const g of groups) {
    const before = previous.find((o) => o.groupId === g.id)?.choiceIds ?? [];
    let valid = before.filter((id) => g.choices.some((c) => c.id === id));
    if (g.type === 'single') valid = valid.slice(0, 1);
    else if (g.max) valid = valid.slice(0, g.max);
    selections[g.id] = g.required && !valid.length ? (defaults[g.id] ?? []) : valid;
  }
  return toSelectedOptions(groups, selections);
}

/** "Đặt lại": thêm lại các món của đơn cũ vào giỏ (bỏ qua món đã ẩn / hết hàng) rồi mở giỏ hàng */
export function useReorder() {
  const menu = useMenu();
  const add = useCart((s) => s.add);
  const setNote = useCart((s) => s.setNote);
  const navigate = useNavigate();
  const { t } = useT();

  return useCallback(
    (order: Pick<Order, 'items' | 'note'>) => {
      let added = 0;
      const unavailable: string[] = [];
      for (const line of order.items) {
        const item = menu.find((m) => m.id === line.itemId);
        if (!item || !item.available) {
          unavailable.push(lineName(line));
          continue;
        }
        add(item, rebuildOptions(item, line.options), line.quantity, line.note);
        added += line.quantity;
      }

      if (!added) {
        toast(t('orders.reorder.allUnavailable'), 'error');
        navigate('/');
        return;
      }
      if (order.note && !useCart.getState().note.trim()) setNote(order.note);

      if (unavailable.length) {
        const missing = unavailable.length === 1 ? unavailable[0] : t('orders.reorder.missingCount', { count: unavailable.length });
        toast(t('orders.reorder.addedPartial', { count: added, missing }), 'info');
      } else {
        toast(t('orders.reorder.added', { count: added }), 'success');
      }
      navigate('/cart');
    },
    [menu, add, setNote, navigate, t],
  );
}
