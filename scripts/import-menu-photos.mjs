#!/usr/bin/env node
/**
 * Nhập ảnh chụp thật của món vào app.
 *
 *   npm run photos                      # đọc thư mục "../Ảnh món" (cạnh thư mục cloud9-app)
 *   npm run photos -- "/đường/dẫn/ảnh"  # hoặc thư mục khác
 *
 * Tên tệp = tên món tiếng Việt ("Cà phê sữa đá.jpg"), tên tiếng Anh ("Iced Milk Coffee.heic")
 * hoặc mã món ("ca-phe-sua.png"). Mỗi ảnh được xoay đúng chiều, cắt vuông giữ phần nổi bật,
 * thu về 720px và nén WebP → src/assets/menu-photos/<mã>.webp. App tự dùng ảnh thật thay cho
 * hình minh hoạ cùng mã (kể cả món đã lưu trên Firestore) sau khi build lại.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = path.resolve(process.argv[2] ?? path.join(ROOT, '..', 'Ảnh món'));
const OUTPUT = path.join(ROOT, 'src/assets/menu-photos');
const SIZE = 720;
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.tif', '.tiff']);

/** "Cà phê sữa đá (L)" → "ca-phe-sua-da-l" */
const fold = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Danh sách món lấy thẳng từ thực đơn mẫu (mỗi món một dòng item({ id, …, name, nameEn, …, image }))
const menuSrc = fs.readFileSync(path.join(ROOT, 'src/data/menu.ts'), 'utf8');
const items = [...menuSrc.matchAll(/item\(\{ id: '([^']+)'.*?name: '([^']+)', nameEn: '([^']+)'.*?image: '@menu\/([^']+)'/g)].map(
  ([, id, name, nameEn, key]) => ({ id, name, nameEn, key }),
);
if (!items.length) {
  console.error('Không đọc được danh sách món trong src/data/menu.ts');
  process.exit(1);
}
const lookup = new Map();
for (const it of items) for (const label of [it.id, it.key, it.name, it.nameEn]) lookup.set(fold(label), it);

if (!fs.existsSync(INPUT)) {
  fs.mkdirSync(INPUT, { recursive: true });
  console.log(`Đã tạo thư mục ${INPUT} — bỏ ảnh món vào đây rồi chạy lại.`);
  process.exit(0);
}
fs.mkdirSync(OUTPUT, { recursive: true });

/** Ảnh HEIC của iPhone: sharp bản dựng sẵn không đọc được → chuyển sang JPEG bằng sips (macOS) */
function readable(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext !== '.heic' && ext !== '.heif') return file;
  if (process.platform !== 'darwin') throw new Error('Ảnh HEIC cần chuyển sang JPG trước (hoặc chạy trên máy Mac)');
  const tmp = path.join(os.tmpdir(), `c9-${Date.now()}-${path.basename(file, ext)}.jpg`);
  execFileSync('sips', ['-s', 'format', 'jpeg', file, '--out', tmp], { stdio: 'ignore' });
  return tmp;
}

const done = new Map();
const unknown = [];
for (const name of fs.readdirSync(INPUT).sort()) {
  const ext = path.extname(name).toLowerCase();
  if (!EXTS.has(ext) || name.startsWith('.')) continue;
  const item = lookup.get(fold(path.basename(name, path.extname(name))));
  if (!item) {
    unknown.push(name);
    continue;
  }
  const out = path.join(OUTPUT, `${item.key}.webp`);
  await sharp(readable(path.join(INPUT, name)))
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: 78, effort: 5 })
    .toFile(out);
  done.set(item.key, `${name} → ${path.relative(ROOT, out)} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
}

console.log(`\nĐã nhập ${done.size} ảnh:`);
for (const line of done.values()) console.log('  ✓', line);
if (unknown.length) {
  console.log(`\nKhông nhận ra ${unknown.length} tệp (đặt tên theo tên món hoặc mã món):`);
  for (const n of unknown) console.log('  ?', n);
}
const have = new Set(fs.readdirSync(OUTPUT).map((f) => f.replace(/\.[^.]+$/, '')));
const missing = items.filter((it) => !have.has(it.key));
if (missing.length) {
  console.log(`\nCòn ${missing.length} món dùng hình minh hoạ:`);
  for (const it of missing) console.log(`  · ${it.name} (${it.id})`);
}
console.log('\nBuild lại app (npm run build) để dùng ảnh mới.');
