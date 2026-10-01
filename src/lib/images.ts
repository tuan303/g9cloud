// Minh hoạ món (SVG) nằm trong src/assets/menu/<key>.svg — Vite gom thành URL khi build.
const illustrations = import.meta.glob('../assets/menu/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// Ảnh chụp thật của món: src/assets/menu-photos/<key>.webp (tạo bằng `npm run photos`).
// Có ảnh thật thì dùng thay cho minh hoạ cùng khoá — kể cả món đã lưu trên Firestore với "@menu/<key>".
const photos = import.meta.glob('../assets/menu-photos/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const fileKey = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '');

const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(illustrations)) byKey[fileKey(path)] = url;

const photoByKey: Record<string, string> = {};
for (const [path, url] of Object.entries(photos)) photoByKey[fileKey(path)] = url;

/** Danh sách ảnh có sẵn theo món (ảnh thật nếu có, không thì minh hoạ) — trình chọn ảnh ở trang quản trị thực đơn */
export const MENU_ILLUSTRATIONS: { key: string; ref: string; url: string; photo: boolean }[] = Object.keys(byKey)
  .sort()
  .map((key) => ({ key, ref: `@menu/${key}`, url: photoByKey[key] ?? byKey[key], photo: !!photoByKey[key] }));

/** "@menu/latte" → URL ảnh thật (nếu có) hoặc minh hoạ; URL/data URL giữ nguyên; không có → undefined */
export function resolveMenuImage(image: string | undefined): string | undefined {
  if (!image) return undefined;
  if (image.startsWith('@menu/')) {
    const key = image.slice(6);
    return photoByKey[key] ?? byKey[key];
  }
  return image;
}

/** Ảnh là hình minh hoạ vẽ (cần nền + khoảng đệm) hay ảnh chụp (phủ kín khung) */
export function isIllustrationRef(image: string | undefined): boolean {
  return !!image?.startsWith('@menu/') && !photoByKey[image.slice(6)];
}
