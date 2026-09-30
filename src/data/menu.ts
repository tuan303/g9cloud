import type { Category, MenuItem, OptionGroup } from '@/types';

/**
 * THỰC ĐƠN MẪU — tên món & giá là giá trị tạm để demo.
 * TODO: thay bằng thực đơn + giá thật của Cloud 9 (xem README.md).
 */

export const CATEGORIES: Category[] = [
  { id: 'coffee', name: 'Cà phê', nameEn: 'Coffee', emoji: '☕' },
  { id: 'drinks', name: 'Nước uống', nameEn: 'Drinks', emoji: '🧋' },
  { id: 'desserts', name: 'Bánh ngọt', nameEn: 'Desserts', emoji: '🍰' },
];

// ───────── Nhóm tuỳ chọn dùng chung ─────────

const size: OptionGroup = {
  id: 'size',
  name: 'Kích cỡ',
  type: 'single',
  required: true,
  choices: [
    { id: 'M', name: 'Vừa (M)', priceDelta: 0, summary: 'Size M' },
    { id: 'L', name: 'Lớn (L)', priceDelta: 7000, summary: 'Size L' },
  ],
  defaultChoiceIds: ['M'],
};

const temperature: OptionGroup = {
  id: 'temp',
  name: 'Nóng / Đá',
  type: 'single',
  required: true,
  choices: [
    { id: 'iced', name: 'Đá', priceDelta: 0, summary: 'Uống đá' },
    { id: 'hot', name: 'Nóng', priceDelta: 0, summary: 'Uống nóng' },
  ],
  defaultChoiceIds: ['iced'],
};

const sugar: OptionGroup = {
  id: 'sugar',
  name: 'Độ ngọt',
  type: 'single',
  required: true,
  choices: [
    { id: '100', name: '100%', priceDelta: 0, summary: '100% đường' },
    { id: '70', name: '70%', priceDelta: 0, summary: '70% đường' },
    { id: '50', name: '50%', priceDelta: 0, summary: '50% đường' },
    { id: '30', name: '30%', priceDelta: 0, summary: '30% đường' },
  ],
  defaultChoiceIds: ['100'],
};

const ice: OptionGroup = {
  id: 'ice',
  name: 'Lượng đá',
  type: 'single',
  required: true,
  choices: [
    { id: 'normal', name: 'Bình thường', priceDelta: 0, summary: 'Đá bình thường' },
    { id: 'less', name: 'Ít đá', priceDelta: 0 },
    { id: 'none', name: 'Không đá', priceDelta: 0 },
  ],
  defaultChoiceIds: ['normal'],
};

const coffeeExtras: OptionGroup = {
  id: 'extras',
  name: 'Thêm',
  type: 'multi',
  max: 2,
  choices: [
    { id: 'shot', name: 'Thêm shot espresso', priceDelta: 10000 },
    { id: 'saltcream', name: 'Kem muối', priceDelta: 8000 },
  ],
};

const teaExtras: OptionGroup = {
  id: 'extras',
  name: 'Topping',
  type: 'multi',
  max: 2,
  choices: [
    { id: 'peach', name: 'Thạch đào', priceDelta: 7000 },
    { id: 'aloe', name: 'Nha đam', priceDelta: 7000 },
  ],
};

const warmUp: OptionGroup = {
  id: 'warm',
  name: 'Hâm nóng',
  type: 'single',
  required: true,
  choices: [
    { id: 'no', name: 'Không', priceDelta: 0, summary: '' },
    { id: 'yes', name: 'Hâm nóng', priceDelta: 0 },
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
  item({ id: 'ca-phe-den', categoryId: 'coffee', name: 'Cà phê đen đá', nameEn: 'Iced Black Coffee', description: 'Robusta rang mộc pha phin, đậm vị, hậu ngọt.', price: 20000, image: '@menu/ca-phe-den', optionGroups: [size, sugar, ice] }),
  item({ id: 'ca-phe-sua', categoryId: 'coffee', name: 'Cà phê sữa đá', nameEn: 'Iced Milk Coffee', description: 'Cà phê phin hoà quyện sữa đặc — vị Sài Gòn quen thuộc.', price: 25000, image: '@menu/ca-phe-sua', tags: ['bestseller'], optionGroups: [size, sugar, ice, coffeeExtras] }),
  item({ id: 'bac-xiu', categoryId: 'coffee', name: 'Bạc xỉu', nameEn: 'Bac Xiu', description: 'Nhiều sữa, ít cà phê, béo nhẹ dễ uống.', price: 29000, image: '@menu/bac-xiu', optionGroups: [size, sugar, ice] }),
  item({ id: 'ca-phe-muoi', categoryId: 'coffee', name: 'Cà phê muối', nameEn: 'Salted Cream Coffee', description: 'Lớp kem muối mằn mặn trên nền cà phê đậm.', price: 32000, image: '@menu/ca-phe-muoi', tags: ['signature'], optionGroups: [size, sugar, ice] }),
  item({ id: 'americano', categoryId: 'coffee', name: 'Americano', description: 'Espresso pha loãng, thanh và thơm.', price: 30000, image: '@menu/americano', optionGroups: [temperature, size, coffeeExtras] }),
  item({ id: 'latte', categoryId: 'coffee', name: 'Latte', nameEn: 'Café Latte', description: 'Espresso cùng sữa tươi đánh mịn.', price: 39000, image: '@menu/latte', tags: ['bestseller'], optionGroups: [temperature, size, sugar, coffeeExtras] }),
  item({ id: 'cappuccino', categoryId: 'coffee', name: 'Cappuccino', description: 'Espresso, sữa nóng và lớp bọt sữa dày.', price: 39000, image: '@menu/cappuccino', optionGroups: [temperature, size, sugar] }),
  item({ id: 'caramel-macchiato', categoryId: 'coffee', name: 'Caramel Macchiato', description: 'Sữa tươi, espresso và sốt caramel.', price: 45000, image: '@menu/caramel-macchiato', tags: ['new'], optionGroups: [temperature, size, sugar] }),

  // Nước uống
  item({ id: 'tra-dao', categoryId: 'drinks', name: 'Trà đào cam sả', nameEn: 'Peach Orange Lemongrass Tea', description: 'Trà đen ủ lạnh, đào miếng, cam tươi và sả thơm.', price: 35000, image: '@menu/tra-dao', tags: ['bestseller'], optionGroups: [size, sugar, ice, teaExtras] }),
  item({ id: 'tra-vai', categoryId: 'drinks', name: 'Trà vải nhiệt đới', nameEn: 'Lychee Tea', description: 'Trà xanh nhài với vải thiều ngọt mát.', price: 35000, image: '@menu/tra-vai', optionGroups: [size, sugar, ice, teaExtras] }),
  item({ id: 'matcha-latte', categoryId: 'drinks', name: 'Matcha latte', description: 'Matcha Nhật đánh cùng sữa tươi.', price: 39000, image: '@menu/matcha-latte', tags: ['new'], optionGroups: [temperature, size, sugar] }),
  item({ id: 'cacao', categoryId: 'drinks', name: 'Cacao sữa', nameEn: 'Cocoa Milk', description: 'Cacao nguyên chất, sữa tươi, vị socola đậm.', price: 32000, image: '@menu/cacao', optionGroups: [temperature, size, sugar] }),
  item({ id: 'nuoc-cam', categoryId: 'drinks', name: 'Nước cam tươi', nameEn: 'Fresh Orange Juice', description: 'Cam vắt tươi mỗi ngày, giàu vitamin C.', price: 30000, image: '@menu/nuoc-cam', optionGroups: [size, sugar, ice] }),
  item({ id: 'sua-chua-viet-quat', categoryId: 'drinks', name: 'Sữa chua việt quất', nameEn: 'Blueberry Yogurt', description: 'Sữa chua sánh mịn cùng mứt việt quất.', price: 35000, image: '@menu/sua-chua-viet-quat', optionGroups: [size, ice] }),
  item({ id: 'soda-chanh', categoryId: 'drinks', name: 'Soda chanh bạc hà', nameEn: 'Lime Mint Soda', description: 'Soda mát lạnh, chanh tươi và lá bạc hà.', price: 29000, image: '@menu/soda-chanh', optionGroups: [size, sugar, ice] }),

  // Bánh ngọt
  item({ id: 'croissant', categoryId: 'desserts', name: 'Croissant bơ Pháp', nameEn: 'Butter Croissant', description: 'Vỏ giòn nhiều lớp, thơm bơ, nướng mới mỗi sáng.', price: 28000, image: '@menu/croissant', tags: ['bestseller'], optionGroups: [warmUp] }),
  item({ id: 'banh-mi-hoa-cuc', categoryId: 'desserts', name: 'Bánh mì hoa cúc', nameEn: 'Brioche', description: 'Mềm xốp, thơm bơ và mật ong (1 phần).', price: 25000, image: '@menu/banh-mi-hoa-cuc', optionGroups: [warmUp] }),
  item({ id: 'tiramisu', categoryId: 'desserts', name: 'Tiramisu', description: 'Mascarpone, bánh ladyfinger thấm cà phê, bột cacao.', price: 45000, image: '@menu/tiramisu', tags: ['signature'] }),
  item({ id: 'cheesecake', categoryId: 'desserts', name: 'Cheesecake việt quất', nameEn: 'Blueberry Cheesecake', description: 'Phô mai nướng béo mịn, sốt việt quất.', price: 45000, image: '@menu/cheesecake' }),
  item({ id: 'bong-lan-trung-muoi', categoryId: 'desserts', name: 'Bông lan trứng muối', nameEn: 'Salted Egg Sponge Cake', description: 'Bông lan mềm, sốt bơ, chà bông và trứng muối.', price: 35000, image: '@menu/bong-lan-trung-muoi', tags: ['bestseller'] }),
  item({ id: 'cookie', categoryId: 'desserts', name: 'Cookie socola chip', nameEn: 'Chocolate Chip Cookie', description: 'Giòn rìa, dẻo tâm, nhiều socola.', price: 18000, image: '@menu/cookie' }),
  item({ id: 'muffin', categoryId: 'desserts', name: 'Muffin chuối óc chó', nameEn: 'Banana Walnut Muffin', description: 'Chuối chín, hạt óc chó, ít ngọt.', price: 25000, image: '@menu/muffin', optionGroups: [warmUp] }),
  item({ id: 'banh-su-kem', categoryId: 'desserts', name: 'Bánh su kem (3 cái)', nameEn: 'Cream Puffs', description: 'Vỏ su mỏng, nhân kem vani mát lạnh.', price: 25000, image: '@menu/banh-su-kem', tags: ['new'] }),
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

/** Danh sách khoá minh hoạ — mỗi khoá tương ứng file src/assets/menu/<key>.svg */
export const MENU_ILLUSTRATION_KEYS = SEED_MENU.map((m) => m.image.replace('@menu/', ''));
