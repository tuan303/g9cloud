import { OPTION_PRESETS, SEED_MENU } from '@/data/menu';
import { getLocale, translate, type MessageKey } from '@/i18n';
import { formatPrice } from '@/lib/format';
import { choiceName } from '@/lib/i18n-data';
import type { CategoryId, MenuItem, MenuTag, OptionGroup } from '@/types';

// ───────── Giới hạn & hằng số ─────────

export const PRICE_MAX = 10_000_000;
export const PRICE_MAX_DIGITS = 8;
export const NAME_MAX = 60;
export const NAME_EN_MAX = 60;
export const DESCRIPTION_MAX = 160;
export const DESCRIPTION_EN_MAX = 160;
export const TAG_ORDER: MenuTag[] = ['bestseller', 'new', 'signature'];

/** Nhóm tuỳ chọn gợi ý sẵn khi thêm món mới (chỉ áp dụng khi quản trị chưa tự chỉnh) */
const DEFAULT_PRESETS: Record<CategoryId, string[]> = {
  coffee: ['size', 'sugar', 'ice'],
  drinks: ['size', 'sugar', 'ice'],
  desserts: ['warm'],
};

// ───────── Tìm kiếm không dấu ─────────

/** "Cà phê Sữa" → "ca phe sua" */
export function foldText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0111\u0110]/g, 'd') // đ / Đ
    .toLowerCase();
}

export function queryTokens(query: string): string[] {
  return foldText(query).split(/\s+/).filter(Boolean);
}

/** Chỉ tìm theo tên (Việt + Anh) để kết quả dễ đoán */
export function searchableText(item: MenuItem): string {
  return foldText(`${item.name} ${item.nameEn ?? ''}`);
}

// ───────── Giá ─────────

const thousands = { vi: new Intl.NumberFormat('vi-VN'), en: new Intl.NumberFormat('en-US') };

/** "35000" → "35.000" (tiếng Anh: "35,000") — chuỗi chỉ gồm chữ số */
export function formatDigits(digits: string): string {
  return digits ? thousands[getLocale()].format(Number(digits)) : '';
}

// ───────── Minh hoạ có sẵn ─────────

/** Tên món mẫu (Việt + Anh — hiển thị qua itemName) + danh mục cho từng minh hoạ "@menu/<key>" (để gắn nhãn & sắp theo danh mục) */
export const ILLUSTRATION_META: Map<string, { name: string; nameEn?: string; categoryId: CategoryId }> = new Map(
  SEED_MENU.filter((m) => m.image.startsWith('@menu/')).map((m) => [m.image, { name: m.name, nameEn: m.nameEn, categoryId: m.categoryId }]),
);

// ───────── Nhóm tuỳ chọn ─────────

export interface OptionEntry {
  key: string;
  group: OptionGroup;
  /** Nhóm có sẵn trên món nhưng không thuộc mẫu (giữ nguyên khi lưu nếu còn được chọn) */
  custom: boolean;
}

const customKey = (index: number) => `custom:${index}`;

/**
 * Đối chiếu optionGroups của món với OPTION_PRESETS.
 * - So theo group.id; nếu nhiều mẫu trùng id (VD "extras": Thêm cà phê / Topping trà) thì chọn mẫu có
 *   nhiều choice id trùng nhất, hoà thì lấy mẫu đứng trước → kết quả luôn xác định.
 * - Nhóm không khớp mẫu nào được giữ lại dạng "tuỳ chỉnh" để không mất dữ liệu.
 */
export function matchOptionPresets(groups: OptionGroup[] = []): { presetKeys: string[]; customGroups: OptionGroup[] } {
  const matched = new Set<string>();
  const customGroups: OptionGroup[] = [];
  for (const group of groups) {
    const candidates = OPTION_PRESETS.filter((p) => p.group.id === group.id && !matched.has(p.key));
    let match = candidates.length === 1 ? candidates[0] : undefined;
    if (candidates.length > 1) {
      const ids = new Set(group.choices.map((c) => c.id));
      let best = 0;
      for (const p of candidates) {
        const score = p.group.choices.filter((c) => ids.has(c.id)).length;
        if (score > best) {
          best = score;
          match = p;
        }
      }
    }
    if (match) matched.add(match.key);
    else customGroups.push(group);
  }
  return { presetKeys: OPTION_PRESETS.filter((p) => matched.has(p.key)).map((p) => p.key), customGroups };
}

/** Danh sách lựa chọn hiển thị: mẫu (theo thứ tự OPTION_PRESETS) rồi đến nhóm tuỳ chỉnh */
export function buildOptionEntries(customGroups: OptionGroup[]): OptionEntry[] {
  return [
    ...OPTION_PRESETS.map((p) => ({ key: p.key, group: p.group, custom: false })),
    ...customGroups.map((group, i) => ({ key: customKey(i), group, custom: true })),
  ];
}

export function defaultPresetKeys(categoryId: CategoryId): string[] {
  return DEFAULT_PRESETS[categoryId].filter((k) => OPTION_PRESETS.some((p) => p.key === k));
}

/** Bật một nhóm → tự bỏ các nhóm khác trùng group.id (một món không thể có hai nhóm cùng id) */
export function toggleOptionKey(selected: string[], key: string, entries: OptionEntry[]): string[] {
  if (selected.includes(key)) return selected.filter((k) => k !== key);
  const groupId = entries.find((e) => e.key === key)?.group.id;
  const rest = selected.filter((k) => entries.find((e) => e.key === k)?.group.id !== groupId);
  return [...rest, key];
}

/** "Chọn 1 · bắt buộc" / "Tối đa 2" (theo ngôn ngữ đang chọn) */
export function optionRuleLabel(group: OptionGroup): string {
  if (group.type === 'single') return translate(group.required ? 'adminMenu.options.singleRequired' : 'adminMenu.options.single');
  return group.max ? translate('adminMenu.options.maxCount', { count: group.max }) : translate('adminMenu.options.multi');
}

/** "Vừa (M) · Lớn (L) +7.000đ" (tên lựa chọn theo ngôn ngữ đang chọn) */
export function optionChoicesSummary(group: OptionGroup): string {
  return group.choices
    .map((c) => (c.priceDelta ? `${choiceName(c)} +${formatPrice(c.priceDelta)}` : choiceName(c)))
    .join(' · ');
}

/** Khoá bản dịch cho nhãn từng nhóm tuỳ chọn mẫu (OPTION_PRESETS[i].label chỉ có tiếng Việt) */
const PRESET_LABEL_KEYS: Record<string, MessageKey> = {
  size: 'adminMenu.presets.size',
  temp: 'adminMenu.presets.temp',
  sugar: 'adminMenu.presets.sugar',
  ice: 'adminMenu.presets.ice',
  coffeeExtras: 'adminMenu.presets.coffeeExtras',
  teaExtras: 'adminMenu.presets.teaExtras',
  warm: 'adminMenu.presets.warm',
};

/** Nhãn của nhóm tuỳ chọn mẫu theo ngôn ngữ đang chọn, VD "Kích cỡ M / L (+7.000đ)"; mẫu chưa có bản dịch → nhãn gốc */
export function presetLabel(key: string): string | undefined {
  const preset = OPTION_PRESETS.find((p) => p.key === key);
  if (!preset) return undefined;
  const msg = PRESET_LABEL_KEYS[key];
  if (!msg) return preset.label;
  const surcharge = Math.max(0, ...preset.group.choices.map((c) => c.priceDelta));
  return translate(msg, { price: formatPrice(surcharge) });
}

// ───────── Biểu mẫu ─────────

export interface MenuForm {
  name: string;
  nameEn: string;
  categoryId: CategoryId;
  /** Chỉ gồm chữ số (VD "35000"); rỗng = chưa nhập */
  price: string;
  description: string;
  /** Mô tả tiếng Anh (không bắt buộc) */
  descriptionEn: string;
  tags: MenuTag[];
  image: string;
  /** Khoá OptionEntry đang chọn */
  options: string[];
  available: boolean;
}

export type MenuFormErrors = Partial<Record<'name' | 'price', string>>;

export function createInitialForm(item: MenuItem | null, defaultCategory: CategoryId): { form: MenuForm; customGroups: OptionGroup[] } {
  if (!item) {
    return {
      form: {
        name: '',
        nameEn: '',
        categoryId: defaultCategory,
        price: '',
        description: '',
        descriptionEn: '',
        tags: [],
        image: '',
        options: defaultPresetKeys(defaultCategory),
        available: true,
      },
      customGroups: [],
    };
  }
  const { presetKeys, customGroups } = matchOptionPresets(item.optionGroups);
  return {
    form: {
      name: item.name,
      nameEn: item.nameEn ?? '',
      categoryId: item.categoryId,
      price: String(Math.max(0, Math.round(item.price || 0))),
      description: item.description ?? '',
      descriptionEn: item.descriptionEn ?? '',
      tags: TAG_ORDER.filter((t) => item.tags?.includes(t)),
      image: item.image ?? '',
      options: [...presetKeys, ...customGroups.map((_, i) => customKey(i))],
      available: item.available,
    },
    customGroups,
  };
}

export function validateMenuForm(form: MenuForm): MenuFormErrors {
  const errors: MenuFormErrors = {};
  const name = form.name.trim();
  if (!name) errors.name = translate('adminMenu.validation.nameRequired');
  else if (name.length > NAME_MAX) errors.name = translate('adminMenu.validation.nameTooLong', { max: NAME_MAX });
  if (!form.price) errors.price = translate('adminMenu.validation.priceRequired');
  else if (Number(form.price) > PRICE_MAX) errors.price = translate('adminMenu.validation.priceTooHigh', { price: formatPrice(PRICE_MAX) });
  return errors;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function isSameForm(a: MenuForm, b: MenuForm): boolean {
  return (
    a.name === b.name &&
    a.nameEn === b.nameEn &&
    a.categoryId === b.categoryId &&
    a.price === b.price &&
    a.description === b.description &&
    a.descriptionEn === b.descriptionEn &&
    a.image === b.image &&
    a.available === b.available &&
    sameSet(a.tags, b.tags) &&
    sameSet(a.options, b.options)
  );
}

const keyOfGroup = (g: OptionGroup) => g.id + '|' + g.choices.map((c) => c.id).join(',');

/**
 * Biểu mẫu → MenuItem để gửi repo.saveMenuItem.
 * Món mới: id '' (repo tự cấp id + sortOrder). Món cũ: giữ id, sortOrder và các trường khác.
 */
export function toMenuItem(form: MenuForm, initial: MenuItem | null, entries: OptionEntry[]): MenuItem {
  const selected = entries.filter((e) => form.options.includes(e.key)).map((e) => e.group);
  // Giữ thứ tự nhóm tuỳ chọn cũ của món (khách quen với thứ tự này); nhóm mới thêm vào cuối
  const oldOrder = (initial?.optionGroups ?? []).map((g) => keyOfGroup(g));
  const keyOf = keyOfGroup;
  const rank = (g: OptionGroup) => {
    const i = oldOrder.indexOf(keyOf(g));
    return i === -1 ? oldOrder.length + selected.indexOf(g) : i;
  };
  const optionGroups = [...selected].sort((a, b) => rank(a) - rank(b));
  const tags = TAG_ORDER.filter((t) => form.tags.includes(t));
  const nameEn = form.nameEn.trim().replace(/\s+/g, ' ');
  const descriptionEn = form.descriptionEn.trim();
  return {
    ...(initial ?? {}),
    id: initial?.id ?? '',
    categoryId: form.categoryId,
    name: form.name.trim().replace(/\s+/g, ' '),
    // Xoá bản tiếng Anh đang có → lưu '' (đánh dấu "không dùng tiếng Anh", app không tự điền lại bản mẫu)
    nameEn: nameEn || (initial?.nameEn ? '' : undefined),
    description: form.description.trim(),
    descriptionEn: descriptionEn || (initial?.descriptionEn ? '' : undefined),
    price: Number(form.price),
    image: form.image,
    available: form.available,
    tags: tags.length ? tags : undefined,
    optionGroups: optionGroups.length ? optionGroups : undefined,
    sortOrder: initial?.sortOrder ?? 0,
  };
}
