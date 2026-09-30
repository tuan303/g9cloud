// Minh hoạ món (SVG) nằm trong src/assets/menu/<key>.svg — Vite gom thành URL khi build.
const illustrations = import.meta.glob('../assets/menu/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(illustrations)) {
  const key = path.split('/').pop()!.replace('.svg', '');
  byKey[key] = url;
}

/** Danh sách minh hoạ có sẵn (dùng cho trình chọn ảnh ở trang quản trị thực đơn) */
export const MENU_ILLUSTRATIONS: { key: string; ref: string; url: string }[] = Object.keys(byKey)
  .sort()
  .map((key) => ({ key, ref: `@menu/${key}`, url: byKey[key] }));

/** "@menu/latte" → URL minh hoạ; URL/data URL giữ nguyên; không có → undefined */
export function resolveMenuImage(image: string | undefined): string | undefined {
  if (!image) return undefined;
  if (image.startsWith('@menu/')) return byKey[image.slice(6)];
  return image;
}
