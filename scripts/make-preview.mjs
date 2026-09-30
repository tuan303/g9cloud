// Chuyển dist-single/index.html (một file đã nhúng mọi tài nguyên) thành trang xem thử dạng Artifact:
// bỏ khung <html>/<head>/<body> (nền tảng tự bọc), bỏ font .woff dự phòng (đã có .woff2) cho nhẹ.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('dist-single/index.html', 'utf8');
const pick = (re) => [...src.matchAll(re)].map((m) => m[0]);
const styles = pick(/<style[^>]*>[\s\S]*?<\/style>/g);
const scripts = pick(/<script[^>]*>[\s\S]*?<\/script>/g);
const body = (src.match(/<body[^>]*>([\s\S]*?)<\/body>/) ?? [])[1] ?? '<div id="root"></div>';
const bodyNoScripts = body.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').trim();

const stripWoff = (css) => css.replace(/,\s*url\(data:font\/woff;base64,[^)]+\)\s*format\(["']woff["']\)/g, '');

const out = [
  '<title>Cloud 9 Gọi Món</title>',
  '<meta name="theme-color" content="#2A2218">',
  ...styles.map(stripWoff),
  bodyNoScripts,
  ...scripts.map((s) => s.replace(' crossorigin', '')),
].join('\n');

writeFileSync('dist-single/cloud9-preview.html', out);
console.log(`cloud9-preview.html: ${(out.length / 1024).toFixed(0)} KB (styles ${styles.length}, scripts ${scripts.length})`);
