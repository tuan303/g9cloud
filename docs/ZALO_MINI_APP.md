# Đưa Cloud 9 lên Zalo Mini App (giai đoạn 2)

> **Trạng thái:** giai đoạn 1 là bản web/PWA chạy trên điện thoại. Mã nguồn đã tách sẵn lớp nền tảng (`src/platform`); giai đoạn 2 chỉ cần thêm adapter Zalo và cấu hình build như hướng dẫn dưới đây.

Ứng dụng đã được thiết kế sẵn để chuyển sang Zalo Mini App mà không phải viết lại giao diện:

- Mọi API nền tảng đi qua `src/platform`: lưu trữ, quét QR, hồ sơ người dùng, rung, chia sẻ, tiêu đề.
- Giai đoạn 2: thêm `zalo.ts` (gọi `zmp-sdk`, đã có bản nháp ở mục 5) và chọn adapter **lúc build** qua alias `@/platform/current` theo `--mode zalo`, để bản web không kéo theo `zmp-sdk`.
- Các thư viện đều khớp với template chính thức *zaui-coffee*: React 18, react-router-dom 6, Vite 5, Tailwind 3.
- Bản build hiện khoảng 1,7 MB (gồm ảnh và font; JS nén còn ~150 KB). Giới hạn của Zalo là 10 MB cho toàn app và 3 MB cho mỗi file.

> Thông tin dưới đây được đối chiếu với tài liệu chính thức (`docs.zaloplatforms.com`, trước đây là `mini.zalo.me`), mã nguồn `zmp-sdk@2.53.0`, `zmp-vite-plugin@1.1.6` và template `zaui-coffee` vào ngày 30/09/2026.

## 1. Những khác biệt quan trọng khi chạy trong Zalo

| Vấn đề | Trên web | Trên Zalo Mini App | Đã xử lý trong code |
|---|---|---|---|
| Lưu trữ | `localStorage` | **Không có `localStorage`/`sessionStorage`/cookie**. Phải dùng `nativeStorage` (đồng bộ, chỉ nhận chuỗi, tối đa 5 MB, cần được **duyệt quyền Native Storage** trên Mini App Center) | ✅ `platform.storage`: mọi store và repo đều đi qua lớp này |
| Điều hướng | `createHashRouter` | Dùng Memory router (`ZMPRouter` của zmp-ui cũng hỗ trợ chế độ này) | Đổi 1 dòng trong `App.tsx` |
| Quét QR (thu ngân) | Camera + jsQR | `scanQRCode()` gốc của Zalo | ✅ Giao diện đã hỗ trợ qua `platform.canNativeScan` |
| Đăng nhập | Email trường / khách | Chính sách Zalo **cấm đăng nhập bằng tài khoản mạng xã hội khác Zalo**. Đăng nhập tài khoản riêng chỉ được phép với **app nội bộ** (ví dụ trường học) mở qua QR, deeplink hoặc lối tắt; nếu không, app bị ẩn khỏi tìm kiếm | ⚠️ Xem mục 3 |
| Số điện thoại | Nhập tay | `getPhoneNumber()` chỉ trả **token dùng 1 lần, hết hạn sau 2 phút**. Máy chủ đổi token lấy số thật qua `graph.zalo.me/v2.0/me/info`. API này cần được duyệt quyền | ⚠️ Cần backend |
| Thanh toán | Quét QR tại quầy POS | Thanh toán tại quầy vẫn dùng được. Nếu thu tiền **ngay trong app** thì bắt buộc dùng **Checkout SDK** (`createOrder` cần chữ ký `mac` tạo trên máy chủ) | ✅ Mặc định là trả tại quầy |
| Thông báo đẩy | Banner trong app + Notification API | Gửi từ **máy chủ** qua Official Account (người dùng phải theo dõi OA) hoặc **ZNS** (mẫu tin được duyệt, gửi theo số điện thoại) | ⚠️ Cần backend + OA |
| Gọi API | Bất kỳ | Chỉ HTTPS. Header CORS phải cho phép `https://h5.zdn.vn` (kể cả request OPTIONS). Gửi token qua header, không dùng cookie | ⚠️ Cần backend |
| Build | ES2019 | ES2015 (không dùng top-level await), file JS đặt tên `*.module.js`, thư mục ra `www/`. Plugin `zmp-vite-plugin` tự làm các việc này | Thêm ở giai đoạn 2 |

## 2. Các bước triển khai

1. **Chuẩn bị tài khoản** (phía quán/trường):
   - Tạo **Zalo Official Account** cho Cloud 9 và nộp giấy tờ xác thực doanh nghiệp/cá nhân.
   - Tạo Mini App trên [Mini App Center](https://mini.zalo.me) và liên kết với OA.
   - Trong app phải hiển thị tên đơn vị phát triển, mã số doanh nghiệp (hoặc CCCD nếu là cá nhân), địa chỉ và số điện thoại (Thoả thuận nhà phát triển §5.5a).
2. **Cài công cụ**:
   ```bash
   npm i -g zmp-cli
   zmp login
   ```
3. **Khởi tạo cấu hình**: trong thư mục dự án, chạy `zmp init` và chọn *deploy only*. Lệnh này tạo `.env` chứa App ID và `app-config.json` (tiêu đề, màu thanh trên, thanh trạng thái…). React phải mount vào phần tử `#app` vì Zalo dùng `index.html` riêng; `main.tsx` đã hỗ trợ sẵn.
4. **Build và chạy thử**:
   - Cài `zmp-sdk` và `zmp-vite-plugin`, bật plugin khi `mode === 'zalo'`, rồi chạy `vite build --mode zalo` để build ra `www/`.
   - `zmp start` rồi mở trên điện thoại (`zmp start -D` để chạy trên máy thật).
5. **Deploy**: `zmp deploy -o www`. Quy trình là Testing → Gửi duyệt → Được duyệt → Publish.
   - Giới hạn deploy: 300 lần/tháng cho bản Development và 60 lần/tháng cho bản Testing.
6. **Xin quyền API** trên Mini App Center: Native Storage, `getPhoneNumber`, `getUserInfo`, và `scanQRCode` nếu cần.

## 3. Đăng nhập: khuyến nghị

- **Bản Zalo**: dùng **“Đăng nhập bằng Zalo”** (`getUserInfo` lấy tên và avatar, `getPhoneNumber` lấy số điện thoại qua máy chủ). Nút này đã có sẵn trên màn hình chào khi chạy trong Zalo.
- **Đăng nhập bằng email trường** chỉ nên giữ nếu Mini App được đăng ký là **app nội bộ của trường** và mở qua mã QR hoặc lối tắt. Nếu muốn giữ, cần xác nhận với Zalo khi đăng ký.
- **Bản web/PWA** (ví dụ mở từ cổng thông tin trường): giữ đăng nhập bằng email trường. Nên làm SSO Google Workspace hoặc Microsoft 365 tuỳ hệ thống email của trường.

## 4. Backend cần có cho production

Bản hiện tại dùng `LocalRepository`: dữ liệu nằm trên thiết bị và chỉ đồng bộ giữa các tab cùng trình duyệt, **đủ để demo**. Để chạy thật với nhiều khách và máy thu ngân, cần một backend thời gian thực, ví dụ Supabase (Postgres + Realtime), Firebase Firestore hoặc API riêng + WebSocket. Backend cần làm những việc sau:

- Lưu thực đơn và đơn hàng, cấp mã đơn theo ngày (`C9-027`), đẩy thay đổi trạng thái theo thời gian thực. Chỉ cần viết lớp cài đặt `DataRepository` (`src/services/repository.ts`) rồi đổi export trong `src/services/index.ts`.
- Xác thực nhân viên (thay PIN cục bộ) và phân quyền: thu ngân, barista, quản lý.
- Đổi token số điện thoại Zalo, gửi thông báo OA/ZNS khi đơn **Sẵn sàng** hoặc **Đang giao**.
- (Tuỳ chọn) Tạo chữ ký `mac` cho Checkout SDK nếu muốn khách thanh toán ngay trong app.
- (Tuỳ chọn) Tích hợp phần mềm POS đang dùng tại quầy, nếu có API.

## 5. Bản nháp adapter Zalo (`src/platform/zalo.ts`)

Đối chiếu chữ ký với `zmp-sdk@2.53.0`. Khi làm giai đoạn 2, chép vào `src/platform/zalo.ts` và cài `npm i zmp-sdk`.

```ts
/**
 * Adapter Zalo Mini App — chỉ được đóng gói khi build với `--mode zalo`
 * (vite.config.ts trỏ alias `@/platform/current` về file này).
 * Chữ ký API đối chiếu với zmp-sdk 2.53.0.
 */
import {
  getUserInfo,
  nativeStorage,
  openPhone,
  openShareSheet,
  scanQRCode,
  setNavigationBarTitle,
  vibrate,
} from 'zmp-sdk/apis';
import { memoryStorage, safeStorage } from './storage';
import type { PlatformAdapter } from './types';

// nativeStorage cần được duyệt quyền trên Mini App Center; nếu chưa, rơi về bộ nhớ tạm trong phiên.
const storage = safeStorage(() => ({
  getItem: (k: string) => nativeStorage.getItem(k) ?? null,
  setItem: (k: string, v: string) => nativeStorage.setItem(k, v),
  removeItem: (k: string) => nativeStorage.removeItem(k),
}));

export const zaloPlatform: PlatformAdapter = {
  name: 'zalo',
  storage: storage ?? memoryStorage(),
  canNativeScan: true,

  async scanQRCode() {
    try {
      const { content } = await scanQRCode();
      return content || null;
    } catch {
      return null; // người dùng huỷ hoặc thiếu quyền camera
    }
  },

  async getProfile() {
    try {
      const { userInfo } = await getUserInfo({ autoRequestPermission: true, avatarType: 'normal' });
      return { id: userInfo.id, name: userInfo.name, avatar: userInfo.avatar };
    } catch {
      return null; // từ chối cấp quyền (-1401)
    }
  },

  setTitle(title) {
    void setNavigationBarTitle({ title: title || 'Cloud 9' }).catch(() => undefined);
  },

  vibrate(pattern) {
    const ms = Array.isArray(pattern) ? pattern.reduce((s, n) => s + n, 0) : pattern;
    void vibrate({ type: 'oneShot', milliseconds: Math.min(ms, 1000) }).catch(() => undefined);
  },

  // Trong Zalo, thông báo khi app đóng phải gửi từ máy chủ qua OA/ZNS (xem docs/ZALO_MINI_APP.md).
  async requestNotificationPermission() {
    return false;
  },
  async systemNotify() {},

  async share({ title, text }) {
    try {
      const r = await openShareSheet({
        type: 'zmp_deep_link',
        data: { title, description: text ?? '', thumbnail: '' },
      });
      return r.status !== 0;
    } catch {
      return false;
    }
  },

  call(phone) {
    void openPhone({ phoneNumber: phone }).catch(() => undefined);
  },
};

export { zaloPlatform as currentPlatform };
```
