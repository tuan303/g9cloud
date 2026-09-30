import type { CartLine, MenuItem, OptionGroup, SelectedOption } from '@/types';

/** Lựa chọn mặc định cho từng nhóm tuỳ chọn của món */
export function defaultSelections(item: MenuItem): Record<string, string[]> {
  const sel: Record<string, string[]> = {};
  for (const g of item.optionGroups ?? []) {
    if (g.defaultChoiceIds?.length) sel[g.id] = [...g.defaultChoiceIds];
    else if (g.type === 'single' && g.required && g.choices[0]) sel[g.id] = [g.choices[0].id];
    else sel[g.id] = [];
  }
  return sel;
}

/** Chuyển bản đồ lựa chọn thành SelectedOption[] (bỏ nhóm rỗng) */
export function toSelectedOptions(groups: OptionGroup[] | undefined, selections: Record<string, string[]>): SelectedOption[] {
  const out: SelectedOption[] = [];
  for (const g of groups ?? []) {
    const ids = selections[g.id] ?? [];
    if (!ids.length) continue;
    const choices = g.choices.filter((c) => ids.includes(c.id));
    out.push({
      groupId: g.id,
      groupName: g.name,
      choiceIds: choices.map((c) => c.id),
      // Dùng nhãn tóm tắt (VD "50% đường"); bỏ lựa chọn có summary rỗng
      choiceNames: choices.map((c) => c.summary ?? c.name).filter(Boolean),
      priceDelta: choices.reduce((s, c) => s + c.priceDelta, 0),
    });
  }
  return out;
}

export function unitPrice(item: Pick<MenuItem, 'price'>, options: SelectedOption[]): number {
  return item.price + options.reduce((s, o) => s + o.priceDelta, 0);
}

/** Kiểm tra nhóm bắt buộc đã chọn đủ chưa. Trả về tên nhóm còn thiếu, hoặc null. */
export function missingRequiredGroup(groups: OptionGroup[] | undefined, selections: Record<string, string[]>): string | null {
  for (const g of groups ?? []) {
    if (g.required && !(selections[g.id]?.length)) return g.name;
  }
  return null;
}

/** "Uống đá · Size L · 70% đường · Thêm shot espresso" */
export function optionsSummary(options: SelectedOption[]): string {
  return options.flatMap((o) => o.choiceNames).join(' · ');
}

/** Khoá so sánh 2 dòng giỏ hàng có cùng món + tuỳ chọn + ghi chú để gộp số lượng */
export function lineSignature(line: Pick<CartLine, 'itemId' | 'options' | 'note'>): string {
  const opts = line.options
    .map((o) => `${o.groupId}:${[...o.choiceIds].sort().join(',')}`)
    .sort()
    .join('|');
  return `${line.itemId}#${opts}#${(line.note ?? '').trim().toLowerCase()}`;
}

/** Ảnh lưu trong dòng giỏ/đơn: ảnh tải lên (data URL, rất nặng) được thay bằng tham chiếu "@item/<id>" */
export function lineImageRef(item: Pick<MenuItem, 'id' | 'image'>): string {
  return item.image.startsWith('data:') ? `@item/${item.id}` : item.image;
}

/**
 * Tính lại một dòng theo thực đơn HIỆN TẠI (giá, tên, tuỳ chọn còn tồn tại).
 * Trả về null nếu món không còn hoặc thiếu nhóm tuỳ chọn bắt buộc (khách phải chọn lại).
 */
export function rebuildLine<L extends CartLine>(line: L, item: MenuItem): L | null {
  const sel: Record<string, string[]> = {};
  for (const o of line.options) {
    const g = item.optionGroups?.find((x) => x.id === o.groupId);
    if (!g) continue;
    sel[g.id] = o.choiceIds.filter((id) => g.choices.some((c) => c.id === id));
  }
  // nhóm bắt buộc mới được thêm vào món → dùng lựa chọn mặc định
  const defaults = defaultSelections(item);
  for (const g of item.optionGroups ?? []) {
    if (g.required && !(sel[g.id]?.length)) sel[g.id] = defaults[g.id] ?? [];
  }
  if (missingRequiredGroup(item.optionGroups, sel)) return null;
  const options = toSelectedOptions(item.optionGroups, sel);
  return {
    ...line,
    name: item.name,
    categoryId: item.categoryId,
    image: lineImageRef(item),
    basePrice: item.price,
    options,
    unitPrice: unitPrice(item, options),
  };
}

export function cartTotals(lines: CartLine[], deliveryFee = 0) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  return { subtotal, itemCount, deliveryFee, total: subtotal + deliveryFee };
}
