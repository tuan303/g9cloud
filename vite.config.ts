import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

/**
 * - `vite build`                  → bản web thường (dist/), host tĩnh ở đâu cũng được.
 * - `vite build --mode single`    → MỘT file HTML duy nhất (dist-single/index.html) đã nhúng sẵn JS, CSS,
 *                                   font, ảnh — dùng để gửi bản xem thử / chạy offline.
 * base: './' để chạy được trong WebView / Zalo Mini App (đường dẫn tương đối).
 */
const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [react(), ...(single ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
    resolve: {
      alias: [
        // Bản xem thử một file chạy offline (VITE_BACKEND=local): thay Firebase bằng stub để không nhúng SDK
        ...(single
          ? [
              { find: '@/services/firestore-repository', replacement: src('services/stubs/firestore-repository.stub.ts') },
              { find: '@/services/firebase', replacement: src('services/stubs/firebase.stub.ts') },
            ]
          : []),
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      ],
    },
    server: { port: 5173 },
    build: {
      target: 'es2020', // Firebase SDK 12 dùng BigInt (ES2020)
      outDir: single ? 'dist-single' : 'dist',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      chunkSizeWarningLimit: single ? 5000 : 900,
      rollupOptions: single
        ? undefined
        : {
            output: {
              // Tách thư viện thành gói riêng — trình duyệt giữ cache khi chỉ mã app thay đổi
              manualChunks(id: string) {
                if (/node_modules\/(firebase|@firebase|re2js)\//.test(id)) return 'firebase';
                if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) return 'react';
                return undefined;
              },
            },
          },
    },
  };
});
