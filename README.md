# Cloud 9 · Bakery Cafe: ứng dụng gọi món

Ứng dụng gọi món cho quán **Cloud 9 Bakery · Cafe**:

- Thiết kế **ưu tiên điện thoại**.
- Màu sắc lấy từ chính không gian quán.
- Dữ liệu trên **Firebase (Cloud Firestore)**, đồng bộ thời gian thực giữa điện thoại khách và máy quầy (xem [docs/FIREBASE.md](docs/FIREBASE.md)).
- Kiến trúc sẵn sàng đưa lên **Zalo Mini App** ở giai đoạn 2 (xem [docs/ZALO_MINI_APP.md](docs/ZALO_MINI_APP.md)).

## Chạy thử

Cần Node.js 18 trở lên.

```bash
npm install
npm run dev
```

- Mở `http://localhost:5173`. Trên điện thoại cùng mạng Wi‑Fi, mở địa chỉ `Network` mà lệnh trên in ra.
- Mặc định app dùng **Firebase** (project `g9cloud-22931`), nên mọi thiết bị thấy cùng dữ liệu. Muốn chạy thử không cần mạng thì dùng `npm run dev:demo` (dữ liệu lưu trên trình duyệt, có sẵn đơn mẫu).
- Trang quản trị: `http://localhost:5173/#/admin`, **PIN mặc định `9999`**.
- **Thử luồng thời gian thực**: mở app khách ở một tab và trang quản trị ở tab khác (cùng trình duyệt).
  1. Đặt món bên tab khách.
  2. Xác nhận thu tiền hoặc quét mã QR bên tab quản trị.
  3. Tab khách nhận thông báo ngay.
  - Nếu chỉ có một thiết bị, dùng nút “Giả lập thu ngân quét mã” trên màn hình thanh toán.
- Camera để quét QR chỉ hoạt động qua `https` hoặc `localhost`. Nếu mở bằng địa chỉ LAN, dùng ô nhập mã đơn.

Các lệnh khác:

| Lệnh | Tác dụng |
|---|---|
| `npm run build` | Kiểm tra kiểu và build bản web vào `dist/` (host tĩnh ở đâu cũng được) |
| `npm run build:single` rồi `node scripts/make-preview.mjs` | Build **một file HTML duy nhất** đã nhúng sẵn mọi thứ (`dist-single/`), dùng để gửi bản xem thử |
| `npm run preview` | Xem thử bản build |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run dev:demo` | Chạy chế độ demo, không dùng Firebase |
| `npm run deploy` | Build rồi đưa lên Firebase Hosting (cần `firebase login`) |

## Chức năng

**Khách hàng** (theo tài liệu mockup của quán):

1. **Đăng nhập**: một chạm bằng **Microsoft 365 của trường (SSO)**, hoặc chế độ khách. Cấu hình SSO xem [docs/M365_SSO.md](docs/M365_SSO.md). Hồ sơ tối giản gồm tên, số điện thoại và mã học sinh/nhân viên. Khách chọn **nhận tại quầy** hoặc **giao tận nơi** (ghi lớp/phòng).
2. **Thực đơn**: tab Cà phê / Nước uống / Bánh ngọt, tìm kiếm không dấu, thẻ món có ảnh, tên và giá. Mỗi món có tuỳ chọn size, nóng/đá, độ ngọt, lượng đá, topping và ghi chú. Nút **“Đặt hàng bằng QR”** màu xanh lá.
3. **Giỏ hàng**: sửa món, đổi số lượng, chọn hình thức nhận, thông tin người nhận, ghi chú.
4. **Thanh toán QR**: tóm tắt đơn, mã QR lớn ở giữa màn hình, hướng dẫn *“Quét tại quầy POS để thanh toán”* và đồng hồ hết hạn. Khi thu ngân quét xong, màn hình hiện ✅ **“Đơn hàng đã nhận”**.
5. **Theo dõi đơn**: thanh tiến trình *Đã nhận → Đang chuẩn bị → Sẵn sàng / Đang giao → Hoàn thành*. Mỗi lần đổi trạng thái có thông báo thời gian thực (banner trượt xuống và mục Thông báo).
6. **Lịch sử đơn**, **Thông báo**, **Tài khoản** (sửa hồ sơ, nhận món mặc định, thông tin quán).

**Quản trị**, dùng trên điện thoại hoặc máy tính bảng tại quầy:

- **Tổng quan**:
  - Chỉ số trong ngày.
  - Danh sách **thanh toán QR thời gian thực**.
  - Biểu đồ cột doanh thu 7 ngày.
  - Biểu đồ tròn cơ cấu doanh thu theo danh mục.
  - Món bán chạy, lượng đơn theo giờ.
- **Đơn hàng**: lọc theo trạng thái, **nút chuyển trạng thái**, huỷ đơn kèm lý do, báo khi có đơn mới.
- **Quét QR**: quét bằng camera (hoặc nhập mã), rồi xác nhận đã thu tiền.
- **Thực đơn**: thêm/sửa/xoá món, bật/tắt “hết hàng”, chọn minh hoạ hoặc tải ảnh món, bật tuỳ chọn.

## Cấu trúc

```
src/
  config/app.ts          ← THÔNG TIN QUÁN: giờ mở cửa, phí giao, PIN, VietQR… (sửa ở đây)
  data/menu.ts           ← thực đơn mẫu (thay bằng thực đơn thật)
  config/firebase.ts     ← cấu hình Firebase + chọn backend (firebase / local)
  services/              ← lớp dữ liệu: FirestoreRepository (mặc định), LocalRepository (demo), order-logic (quy tắc đơn hàng)
  platform/              ← adapter nền tảng: web / Zalo (lưu trữ, quét QR, hồ sơ…)
  store/                 ← trạng thái: phiên đăng nhập, giỏ hàng, thông báo, dữ liệu
  components/ui/         ← bộ UI theo nhận diện Cloud 9
  pages/customer|admin/  ← các màn hình
  assets/                ← logo, ảnh quán (WebP), minh hoạ món (SVG)
firestore.rules          ← quy tắc bảo mật Firestore (triển khai sau khi bật Authentication)
firebase.json            ← cấu hình Firebase Hosting + Rules
docs/
  FIREBASE.md            ← trạng thái kết nối, các bước bật bảo mật, deploy
  M365_SSO.md            ← đăng nhập SSO bằng Microsoft 365 của trường (Entra ID + Firebase)
  ARCHITECTURE.md        ← kiến trúc & quy ước code
  BRAND.md               ← bảng màu trích từ ảnh quán, logo, font
  ZALO_MINI_APP.md       ← hướng dẫn đưa lên Zalo Mini App
```

## Giới hạn của bản thử nghiệm

- **Firestore đang ở test mode (mở hoàn toàn)** và Firebase Authentication chưa bật. Làm theo [docs/FIREBASE.md › Bật bảo mật](docs/FIREBASE.md#2-bật-bảo-mật-nên-làm-trước-khi-dùng-thật) trước khi dùng thật.
- Đăng nhập **Microsoft 365** cần quản trị M365 của trường đăng ký app trên Entra ID và bật nhà cung cấp Microsoft trong Firebase ([docs/M365_SSO.md](docs/M365_SSO.md)). Bản xem thử offline chỉ mô phỏng bước này.
- PIN quản trị `9999` chỉ là tạm thời. Sau khi bật Authentication, chuyển sang tài khoản nhân viên Firebase (`admin.auth = 'firebase'`).
- Thực đơn, giá và 7 ngày đơn hàng mẫu (để biểu đồ có số liệu) là **dữ liệu demo**. Có thể xoá ở trang Tổng quan.

## Thông tin quán cần cung cấp

Sửa trong `src/config/app.ts` và `src/data/menu.ts`, hoặc gửi cho người phát triển:

1. **Thực đơn thật**: tên món, giá, size và giá chênh, tuỳ chọn (đường, đá, topping), món đặc trưng/bán chạy. Kèm **ảnh chụp món**, ảnh vuông nền sạch là tốt nhất.
2. **Email trường**:
   - Tên miền email (ví dụ `@tentruong.edu.vn`) để chỉ chấp nhận email trường.
   - Trường dùng Google Workspace hay Microsoft 365, để làm đăng nhập một chạm (SSO).
3. **Thông tin quán**: giờ mở cửa, vị trí quầy, hotline.
4. **Giao tận nơi**:
   - Phạm vi giao (lớp, phòng ban, toà nhà).
   - Phí giao, đơn tối thiểu.
   - Khung giờ giao (ví dụ chỉ giờ ra chơi).
5. **Thanh toán**:
   - Tại quầy nhận tiền mặt / chuyển khoản / thẻ?
   - Có muốn hiện **mã VietQR** chuyển khoản ngay trong app không? Nếu có, cần ngân hàng, số tài khoản, tên tài khoản.
   - Quầy đang dùng phần mềm POS nào (KiotViet, Sapo, iPOS…) để tích hợp.
6. **Nhân viên**: số người, vai trò (thu ngân / pha chế / quản lý), mã PIN hoặc tài khoản.
7. **Máy chủ**: trường có server/hosting sẵn không, hay dùng dịch vụ đám mây (Supabase / Firebase).
8. **Zalo (giai đoạn 2)**: đã có Zalo Official Account chưa, pháp nhân đứng tên (trường hay hộ kinh doanh của quán).
9. **Nhận diện**: logo dạng vector (SVG/AI) và font thương hiệu, nếu có.
