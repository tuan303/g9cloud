import { lineName } from '@/lib/i18n-data';
import { defaultSelections, missingRequiredGroup, toSelectedOptions } from '@/lib/pricing';
import type { CartLine, MenuItem, SelectedOption } from '@/types';

export interface ReorderEntry {
  item: MenuItem;
  options: SelectedOption[];
  quantity: number;
  note?: string;
}

/**
 * Chuẩn bị "đặt lại" các dòng của một đơn cũ theo thực đơn hiện tại:
 * bỏ món đã hết / đã xoá, giữ tuỳ chọn còn tồn tại, bổ sung mặc định cho nhóm bắt buộc,
 * tính lại giá theo thực đơn mới (qua toSelectedOptions).
 */
export function planReorder(lines: Pick<CartLine, 'itemId' | 'name' | 'nameEn' | 'options' | 'quantity' | 'note'>[], menu: MenuItem[]) {
  const byId = new Map(menu.map((m) => [m.id, m]));
  const entries: ReorderEntry[] = [];
  const skipped: string[] = [];

  for (const line of lines) {
    const item = byId.get(line.itemId);
    if (!item || !item.available) {
      skipped.push(lineName(line));
      continue;
    }
    const defaults = defaultSelections(item);
    const selections: Record<string, string[]> = {};
    for (const g of item.optionGroups ?? []) {
      const prev = line.options.find((o) => o.groupId === g.id);
      // Nhóm không có trong dòng cũ = khách đã bỏ chọn hết (nhóm rỗng không được lưu)
      const kept = prev ? prev.choiceIds.filter((id) => g.choices.some((c) => c.id === id)) : [];
      selections[g.id] = kept.length ? kept : g.required ? (defaults[g.id] ?? []) : [];
    }
    if (missingRequiredGroup(item.optionGroups, selections)) {
      skipped.push(lineName(line));
      continue;
    }
    entries.push({ item, options: toSelectedOptions(item.optionGroups, selections), quantity: line.quantity, note: line.note });
  }

  return { entries, skipped };
}
