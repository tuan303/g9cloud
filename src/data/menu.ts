import { pick } from '@/i18n';
import type { Category, CategoryId, MenuItem, OptionGroup, SelectedOption } from '@/types';

/**
 * THỰC ĐƠN MẪU — tên món & giá là giá trị tạm để demo.
 * TODO: thay bằng thực đơn + giá thật của Cloud 9 (xem README.md).
 */

const category = (id: CategoryId, nameVi: string, nameEn: string, emoji: string): Category => ({
  id,
  nameEn,
  emoji,
  // `name` tự đổi theo ngôn ngữ đang chọn
  get name() {
    return pick(nameVi, nameEn);
  },
});

export const CATEGORIES: Category[] = [
  category('coffee', 'Cà phê', 'Coffee', '☕'),
  category('drinks', 'Nước uống', 'Drinks', '🧋'),
  category('desserts', 'Bánh ngọt', 'Desserts', '🍰'),
];

// ───────── Nhóm tuỳ chọn dùng chung ─────────

const size: OptionGroup = {
  id: 'size',
  name: 'Kích cỡ',
  nameEn: 'Size',
  type: 'single',
  required: true,
  choices: [
    { id: 'M', name: 'Vừa (M)', nameEn: 'Regular (M)', priceDelta: 0, summary: 'Size M', summaryEn: 'Size M' },
    { id: 'L', name: 'Lớn (L)', nameEn: 'Large (L)', priceDelta: 7000, summary: 'Size L', summaryEn: 'Size L' },
  ],
  defaultChoiceIds: ['M'],
};

const temperature: OptionGroup = {
  id: 'temp',
  name: 'Nóng / Đá',
  nameEn: 'Hot / Iced',
  type: 'single',
  required: true,
  choices: [
    { id: 'iced', name: 'Đá', nameEn: 'Iced', priceDelta: 0, summary: 'Uống đá', summaryEn: 'Iced' },
    { id: 'hot', name: 'Nóng', nameEn: 'Hot', priceDelta: 0, summary: 'Uống nóng', summaryEn: 'Hot' },
  ],
  defaultChoiceIds: ['iced'],
};

const sugar: OptionGroup = {
  id: 'sugar',
  name: 'Độ ngọt',
  nameEn: 'Sweetness',
  type: 'single',
  required: true,
  choices: [
    { id: '100', name: '100%', priceDelta: 0, summary: '100% đường', summaryEn: '100% sugar' },
    { id: '70', name: '70%', priceDelta: 0, summary: '70% đường', summaryEn: '70% sugar' },
    { id: '50', name: '50%', priceDelta: 0, summary: '50% đường', summaryEn: '50% sugar' },
    { id: '30', name: '30%', priceDelta: 0, summary: '30% đường', summaryEn: '30% sugar' },
  ],
  defaultChoiceIds: ['100'],
};

const ice: OptionGroup = {
  id: 'ice',
  name: 'Lượng đá',
  nameEn: 'Ice',
  type: 'single',
  required: true,
  choices: [
    { id: 'normal', name: 'Bình thường', nameEn: 'Regular', priceDelta: 0, summary: 'Đá bình thường', summaryEn: 'Regular ice' },
    { id: 'less', name: 'Ít đá', nameEn: 'Less ice', priceDelta: 0 },
    { id: 'none', name: 'Không đá', nameEn: 'No ice', priceDelta: 0 },
  ],
  defaultChoiceIds: ['normal'],
};

const coffeeExtras: OptionGroup = {
  id: 'extras',
  name: 'Thêm',
  nameEn: 'Extras',
  type: 'multi',
  max: 2,
  choices: [
    { id: 'shot', name: 'Thêm shot espresso', nameEn: 'Extra espresso shot', priceDelta: 10000 },
    { id: 'saltcream', name: 'Kem muối', nameEn: 'Salted cream', priceDelta: 8000 },
  ],
};

const teaExtras: OptionGroup = {
  id: 'extras',
  name: 'Topping',
  nameEn: 'Toppings',
  type: 'multi',
  max: 2,
  choices: [
    { id: 'peach', name: 'Thạch đào', nameEn: 'Peach jelly', priceDelta: 7000 },
    { id: 'aloe', name: 'Nha đam', nameEn: 'Aloe vera', priceDelta: 7000 },
  ],
};

const warmUp: OptionGroup = {
  id: 'warm',
  name: 'Hâm nóng',
  nameEn: 'Warm up',
  type: 'single',
  required: true,
  choices: [
    { id: 'no', name: 'Không', nameEn: 'No', priceDelta: 0, summary: '', summaryEn: '' },
    { id: 'yes', name: 'Hâm nóng', nameEn: 'Warmed', priceDelta: 0 },
  ],
  defaultChoiceIds: ['no'],
};

// ───────── Món ─────────

let order = 0;
const item = (i: Omit<MenuItem, 'sortOrder' | 'available'> & { available?: boolean }): MenuItem => ({
  available: true,
  sortOrder: order++,
  ...i,
});

export const SEED_MENU: MenuItem[] = [
  // Cà phê
  item({ id: 'ca-phe-den', categoryId: 'coffee', name: 'Cà phê đen đá', nameEn: 'Iced Black Coffee', description: 'Robusta rang mộc pha phin, đậm vị, hậu ngọt.', descriptionEn: 'Phin-brewed robusta — bold, with a sweet finish.', price: 20000, image: '@menu/ca-phe-den', optionGroups: [size, sugar, ice] }),
  item({ id: 'ca-phe-sua', categoryId: 'coffee', name: 'Cà phê sữa đá', nameEn: 'Iced Milk Coffee', description: 'Cà phê phin hoà quyện sữa đặc — vị Sài Gòn quen thuộc.', descriptionEn: 'Phin coffee with condensed milk — a Saigon classic.', price: 25000, image: '@menu/ca-phe-sua', tags: ['bestseller'], optionGroups: [size, sugar, ice, coffeeExtras] }),
  item({ id: 'bac-xiu', categoryId: 'coffee', name: 'Bạc xỉu', nameEn: 'Bac Xiu (Milky Coffee)', description: 'Nhiều sữa, ít cà phê, béo nhẹ dễ uống.', descriptionEn: 'More milk, less coffee — creamy and smooth.', price: 29000, image: '@menu/bac-xiu', optionGroups: [size, sugar, ice] }),
  item({ id: 'ca-phe-muoi', categoryId: 'coffee', name: 'Cà phê muối', nameEn: 'Salted Cream Coffee', description: 'Lớp kem muối mằn mặn trên nền cà phê đậm.', descriptionEn: 'A layer of lightly salted cream over strong coffee.', price: 32000, image: '@menu/ca-phe-muoi', tags: ['signature'], optionGroups: [size, sugar, ice] }),
  item({ id: 'americano', categoryId: 'coffee', name: 'Americano', nameEn: 'Americano', description: 'Espresso pha loãng, thanh và thơm.', descriptionEn: 'Espresso lengthened with water — clean and aromatic.', price: 30000, image: '@menu/americano', optionGroups: [temperature, size, coffeeExtras] }),
  item({ id: 'latte', categoryId: 'coffee', name: 'Latte', nameEn: 'Café Latte', description: 'Espresso cùng sữa tươi đánh mịn.', descriptionEn: 'Espresso with silky steamed milk.', price: 39000, image: '@menu/latte', tags: ['bestseller'], optionGroups: [temperature, size, sugar, coffeeExtras] }),
  item({ id: 'cappuccino', categoryId: 'coffee', name: 'Cappuccino', nameEn: 'Cappuccino', description: 'Espresso, sữa nóng và lớp bọt sữa dày.', descriptionEn: 'Espresso, hot milk and a thick milk foam.', price: 39000, image: '@menu/cappuccino', optionGroups: [temperature, size, sugar] }),
  item({ id: 'caramel-macchiato', categoryId: 'coffee', name: 'Caramel Macchiato', nameEn: 'Caramel Macchiato', description: 'Sữa tươi, espresso và sốt caramel.', descriptionEn: 'Fresh milk, espresso and caramel sauce.', price: 45000, image: '@menu/caramel-macchiato', tags: ['new'], optionGroups: [temperature, size, sugar] }),

  // Nước uống
  item({ id: 'tra-dao', categoryId: 'drinks', name: 'Trà đào cam sả', nameEn: 'Peach Orange Lemongrass Tea', description: 'Trà đen ủ lạnh, đào miếng, cam tươi và sả thơm.', descriptionEn: 'Cold-brewed black tea with peach, fresh orange and lemongrass.', price: 35000, image: '@menu/tra-dao', tags: ['bestseller'], optionGroups: [size, sugar, ice, teaExtras] }),
  item({ id: 'tra-vai', categoryId: 'drinks', name: 'Trà vải nhiệt đới', nameEn: 'Lychee Tea', description: 'Trà xanh nhài với vải thiều ngọt mát.', descriptionEn: 'Jasmine green tea with sweet lychees.', price: 35000, image: '@menu/tra-vai', optionGroups: [size, sugar, ice, teaExtras] }),
  item({ id: 'matcha-latte', categoryId: 'drinks', name: 'Matcha latte', nameEn: 'Matcha Latte', description: 'Matcha Nhật đánh cùng sữa tươi.', descriptionEn: 'Japanese matcha whisked with fresh milk.', price: 39000, image: '@menu/matcha-latte', tags: ['new'], optionGroups: [temperature, size, sugar] }),
  item({ id: 'cacao', categoryId: 'drinks', name: 'Cacao sữa', nameEn: 'Cocoa Milk', description: 'Cacao nguyên chất, sữa tươi, vị socola đậm.', descriptionEn: 'Pure cocoa and fresh milk — rich and chocolatey.', price: 32000, image: '@menu/cacao', optionGroups: [temperature, size, sugar] }),
  item({ id: 'nuoc-cam', categoryId: 'drinks', name: 'Nước cam tươi', nameEn: 'Fresh Orange Juice', description: 'Cam vắt tươi mỗi ngày, giàu vitamin C.', descriptionEn: 'Freshly squeezed oranges every day, full of vitamin C.', price: 30000, image: '@menu/nuoc-cam', optionGroups: [size, sugar, ice] }),
  item({ id: 'sua-chua-viet-quat', categoryId: 'drinks', name: 'Sữa chua việt quất', nameEn: 'Blueberry Yogurt', description: 'Sữa chua sánh mịn cùng mứt việt quất.', descriptionEn: 'Smooth yogurt with blueberry jam.', price: 35000, image: '@menu/sua-chua-viet-quat', optionGroups: [size, ice] }),
  item({ id: 'soda-chanh', categoryId: 'drinks', name: 'Soda chanh bạc hà', nameEn: 'Lime Mint Soda', description: 'Soda mát lạnh, chanh tươi và lá bạc hà.', descriptionEn: 'Chilled soda with fresh lime and mint.', price: 29000, image: '@menu/soda-chanh', optionGroups: [size, sugar, ice] }),

  // Bánh ngọt
  item({ id: 'croissant', categoryId: 'desserts', name: 'Croissant bơ Pháp', nameEn: 'Butter Croissant', description: 'Vỏ giòn nhiều lớp, thơm bơ, nướng mới mỗi sáng.', descriptionEn: 'Flaky, buttery layers, baked fresh every morning.', price: 28000, image: '@menu/croissant', tags: ['bestseller'], optionGroups: [warmUp] }),
  item({ id: 'banh-mi-hoa-cuc', categoryId: 'desserts', name: 'Bánh mì hoa cúc', nameEn: 'Brioche', description: 'Mềm xốp, thơm bơ và mật ong (1 phần).', descriptionEn: 'Soft and fluffy with butter and honey (one portion).', price: 25000, image: '@menu/banh-mi-hoa-cuc', optionGroups: [warmUp] }),
  item({ id: 'tiramisu', categoryId: 'desserts', name: 'Tiramisu', nameEn: 'Tiramisu', description: 'Mascarpone, bánh ladyfinger thấm cà phê, bột cacao.', descriptionEn: 'Mascarpone, coffee-soaked ladyfingers and cocoa.', price: 45000, image: '@menu/tiramisu', tags: ['signature'] }),
  item({ id: 'cheesecake', categoryId: 'desserts', name: 'Cheesecake việt quất', nameEn: 'Blueberry Cheesecake', description: 'Phô mai nướng béo mịn, sốt việt quất.', descriptionEn: 'Creamy baked cheesecake with blueberry sauce.', price: 45000, image: '@menu/cheesecake' }),
  item({ id: 'bong-lan-trung-muoi', categoryId: 'desserts', name: 'Bông lan trứng muối', nameEn: 'Salted Egg Sponge Cake', description: 'Bông lan mềm, sốt bơ, chà bông và trứng muối.', descriptionEn: 'Soft sponge, butter sauce, pork floss and salted egg.', price: 35000, image: '@menu/bong-lan-trung-muoi', tags: ['bestseller'] }),
  item({ id: 'cookie', categoryId: 'desserts', name: 'Cookie socola chip', nameEn: 'Chocolate Chip Cookie', description: 'Giòn rìa, dẻo tâm, nhiều socola.', descriptionEn: 'Crisp edges, chewy centre, lots of chocolate.', price: 18000, image: '@menu/cookie' }),
  item({ id: 'muffin', categoryId: 'desserts', name: 'Muffin chuối óc chó', nameEn: 'Banana Walnut Muffin', description: 'Chuối chín, hạt óc chó, ít ngọt.', descriptionEn: 'Ripe banana and walnuts, lightly sweet.', price: 25000, image: '@menu/muffin', optionGroups: [warmUp] }),
  item({ id: 'banh-su-kem', categoryId: 'desserts', name: 'Bánh su kem (3 cái)', nameEn: 'Cream Puffs (3 pcs)', description: 'Vỏ su mỏng, nhân kem vani mát lạnh.', descriptionEn: 'Thin choux shells filled with chilled vanilla cream.', price: 25000, image: '@menu/banh-su-kem', tags: ['new'] }),
];

/** Các nhóm tuỳ chọn mẫu — trang quản trị thực đơn dùng để bật/tắt tuỳ chọn cho món */
export const OPTION_PRESETS: { key: string; label: string; group: OptionGroup }[] = [
  { key: 'size', label: 'Kích cỡ M / L (+7.000đ)', group: size },
  { key: 'temp', label: 'Nóng / Đá', group: temperature },
  { key: 'sugar', label: 'Độ ngọt', group: sugar },
  { key: 'ice', label: 'Lượng đá', group: ice },
  { key: 'coffeeExtras', label: 'Thêm: shot espresso, kem muối', group: coffeeExtras },
  { key: 'teaExtras', label: 'Topping: thạch đào, nha đam', group: teaExtras },
  { key: 'warm', label: 'Hâm nóng (bánh)', group: warmUp },
];

// ───────────── Bổ sung tiếng Anh cho thực đơn đã lưu trước khi có song ngữ ─────────────

const PRESET_GROUPS = OPTION_PRESETS.map((p) => p.group);
const SEED_BY_ID = new Map(SEED_MENU.map((m) => [m.id, m]));

/**
 * Nhóm mẫu tương ứng: cùng mã và có các lựa chọn đang dùng (nhóm "extras" của cà phê và của trà
 * trùng mã nhưng khác lựa chọn). every = phải có đủ mọi lựa chọn.
 */
function refGroup(id: string, choiceIds: string[], seedGroups: OptionGroup[] = [], every = false): OptionGroup | undefined {
  const has = (x: OptionGroup, c: string) => x.choices.some((rc) => rc.id === c);
  const fits = (x: OptionGroup) => x.id === id && (every ? choiceIds.every((c) => has(x, c)) : choiceIds.some((c) => has(x, c)));
  const found = seedGroups.find(fits) ?? PRESET_GROUPS.find(fits);
  if (found || every) return found;
  return seedGroups.find((x) => x.id === id) ?? PRESET_GROUPS.find((x) => x.id === id);
}

/**
 * Điền giá trị tiếng Anh CHƯA TỪNG CÓ khi chữ tiếng Việt vẫn đúng như bản mẫu (quán đã sửa thì giữ nguyên).
 * '' = nhân viên cố ý xoá bản tiếng Anh → giữ '' (giao diện tiếng Anh hiện chữ tiếng Việt), không điền lại.
 */
const fillEn = (en: string | undefined, vi: string | undefined, seedVi: string | undefined, seedEn: string | undefined) =>
  en ?? (seedEn && (vi ?? '').trim() === (seedVi ?? '').trim() ? seedEn : undefined);

/** Nhóm tuỳ chọn: lấy bản dịch từ món mẫu cùng mã, nếu không có thì từ nhóm tuỳ chọn mẫu cùng mã */
export function withSeedEnglishGroup(g: OptionGroup, seedGroups: OptionGroup[] = []): OptionGroup {
  const ref = refGroup(g.id, g.choices.map((c) => c.id), seedGroups);
  if (!ref) return g;
  return {
    ...g,
    nameEn: fillEn(g.nameEn, g.name, ref.name, ref.nameEn),
    choices: g.choices.map((c) => {
      const rc = ref.choices.find((x) => x.id === c.id);
      if (!rc) return c;
      const out = { ...c, nameEn: fillEn(c.nameEn, c.name, rc.name, rc.nameEn) };
      if (c.summary !== undefined || rc.summaryEn !== undefined) out.summaryEn = fillEn(c.summaryEn, c.summary, rc.summary, rc.summaryEn);
      return out;
    }),
  };
}

/**
 * Thực đơn tạo trước khi có song ngữ (Firestore / máy khách) thiếu tên, mô tả, tuỳ chọn tiếng Anh.
 * Bổ sung ngay lúc đọc từ món mẫu cùng mã — chỉ khi chữ tiếng Việt chưa bị quán sửa.
 */
export function withSeedEnglish(item: MenuItem): MenuItem {
  const seed = SEED_MENU.find((s) => s.id === item.id);
  const groups = item.optionGroups?.map((g) => withSeedEnglishGroup(g, seed?.optionGroups));
  if (!seed) return groups ? { ...item, optionGroups: groups } : item;
  return {
    ...item,
    nameEn: fillEn(item.nameEn, item.name, seed.name, seed.nameEn),
    descriptionEn: fillEn(item.descriptionEn, item.description, seed.description, seed.descriptionEn),
    ...(groups ? { optionGroups: groups } : {}),
  };
}

/**
 * Dòng đơn đã lưu không có tên tiếng Anh (đơn tạo trước khi có song ngữ / từ thực đơn chưa bổ sung):
 * lấy tên tiếng Anh của món mẫu cùng mã khi tên tiếng Việt vẫn đúng như bản mẫu.
 */
export function seedNameEn(itemId: string | undefined, name: string): string | undefined {
  const seed = itemId ? SEED_BY_ID.get(itemId) : undefined;
  return fillEn(undefined, name, seed?.name, seed?.nameEn);
}

/** Nhãn tuỳ chọn tiếng Anh cho dòng đơn đã lưu, cùng quy tắc với toSelectedOptions (undefined nếu không khớp bản mẫu) */
export function seedChoiceNamesEn(o: SelectedOption, itemId?: string): string[] | undefined {
  const seed = itemId ? SEED_BY_ID.get(itemId) : undefined;
  const ref = refGroup(o.groupId, o.choiceIds, seed?.optionGroups, true);
  if (!ref) return undefined;
  const picked = ref.choices.filter((c) => o.choiceIds.includes(c.id));
  if (picked.map((c) => c.summary ?? c.name).filter(Boolean).join('|') !== o.choiceNames.join('|')) return undefined;
  return picked.map((c) => c.summaryEn ?? (c.summary === '' ? '' : (c.nameEn ?? c.summary ?? c.name))).filter(Boolean);
}

/** Danh sách khoá minh hoạ — mỗi khoá tương ứng file src/assets/menu/<key>.svg */
export const MENU_ILLUSTRATION_KEYS = SEED_MENU.map((m) => m.image.replace('@menu/', ''));
