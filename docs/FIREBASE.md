# Firebase: kết nối và bảo mật

App đã kết nối với project **`g9cloud-22931`**. Dữ liệu thực đơn và đơn hàng nằm trên **Cloud Firestore** và đồng bộ theo thời gian thực giữa mọi thiết bị: điện thoại khách, máy thu ngân, máy pha chế.

## Trạng thái hiện tại (30/09/2026)

| Mục | Trạng thái | Việc cần làm |
|---|---|---|
| Cloud Firestore | ✅ Đã tạo. Đã có thực đơn mẫu (23 món). Đã thử đặt đơn → thu ngân xác nhận → khách nhận thông báo thời gian thực (đơn thử đã được xoá) | — |
| Security Rules | ⚠️ **Đang ở chế độ thử nghiệm (test mode)**: bất kỳ ai có cấu hình web đều đọc, ghi và xoá được toàn bộ dữ liệu. Test mode còn **tự hết hạn** sau 30 ngày kể từ lúc tạo, khi đó app ngừng hoạt động | Làm các bước ở mục 2 |
| Authentication | ❌ Chưa bật (`CONFIGURATION_NOT_FOUND`) | Làm mục 2, bước 1 |
| Đăng nhập nhân viên | Đang dùng PIN `9999` trên máy (`APP_CONFIG.admin.auth = 'pin'`) | Chuyển sang tài khoản Firebase (mục 2) |

Khi chưa bật Authentication, app vẫn chạy: khách đặt hàng bình thường, đơn được lọc theo mã khách. Chỉ nên dùng như vậy để thử nghiệm.

## 1. Cấu trúc dữ liệu

| Collection | Nội dung | Ai được đọc / ghi (sau khi áp dụng `firestore.rules`) |
|---|---|---|
| `menu/{itemId}` | Món: tên, giá, ảnh, tuỳ chọn, còn/hết | Ai cũng đọc được; chỉ nhân viên ghi |
| `orders/{orderId}` | Đơn hàng: món, tổng tiền, trạng thái, lịch sử trạng thái, `customerUid` | Khách đọc đơn của mình, tạo đơn mới và **chỉ được huỷ** đơn chưa thanh toán; nhân viên đọc/ghi tất cả |
| `counters/{yyyy-mm-dd}` | `{ seq }`: bộ đếm để đánh mã đơn C9-001, C9-002… theo ngày (dùng transaction nên không bị trùng) | Mỗi lần chỉ được tăng đúng 1 |
| `staff/{uid}` | Danh sách nhân viên, ví dụ `{ name: "Thu ngân 1", role: "staff" }` | Chỉ tạo trong Console |
| `meta/menuSeed` | Đánh dấu đã khởi tạo thực đơn mẫu (chỉ một lần — xoá hết món mẫu sẽ không bị thêm lại) | Nhân viên |

**Chống sửa giá:** giá được tính trên máy khách lúc đặt, nên khi thu ngân bấm “Xác nhận đã thu”, app **đối chiếu lại từng món với thực đơn**. Nếu giá, số lượng hoặc tổng không khớp (và không phải do quán vừa đổi giá), app **từ chối xác nhận** và báo thu ngân huỷ đơn. Security Rules cũng chặn đơn sai cấu trúc hoặc tổng tiền không nhất quán. Muốn chặn hoàn toàn từ máy chủ thì chuyển việc tạo đơn sang Cloud Functions (giai đoạn sau).

## 2. Bật bảo mật: nên làm trước khi dùng thật

1. **Bật Authentication**: Firebase Console › Build › Authentication › *Get started*, rồi bật:
   - **Anonymous**: mỗi điện thoại khách có một tài khoản ẩn danh, dùng để chỉ cho xem đơn của chính mình.
   - **Email/Password**: tài khoản cho nhân viên.
2. **Tạo tài khoản nhân viên**: Authentication › Users › *Add user* (email + mật khẩu). Sau đó sao chép **User UID**.
3. **Cấp quyền nhân viên**: Firestore › *Start collection* `staff`:
   - Document ID = **User UID** vừa sao chép.
   - Thêm trường `name` (string) và `role` = `staff` hoặc `admin`.
   - Làm tương tự cho từng nhân viên.
4. **Chuyển app sang đăng nhập Firebase**: trong `src/config/app.ts` đổi `admin.auth: 'pin'` thành `admin.auth: 'firebase'`. Trang quản trị sẽ đòi email + mật khẩu thay cho PIN.
5. **Áp dụng Security Rules**, chọn một trong hai cách:
   - Console › Firestore › **Rules**, dán nội dung file [`firestore.rules`](../firestore.rules), bấm *Publish*.
   - Hoặc dùng dòng lệnh:
     ```bash
     npm i -g firebase-tools
     firebase login
     firebase deploy --only firestore:rules
     ```
6. **Giới hạn API key** (khuyến nghị): Google Cloud Console › APIs & Services › Credentials › *Browser key*. Thêm *Website restrictions* cho tên miền chạy app (ví dụ `g9cloud-22931.web.app`, `localhost`).

> Thứ tự quan trọng: làm bước 1–4 **trước** bước 5. Nếu áp dụng rules khi app vẫn dùng PIN, trang quản trị sẽ không ghi được dữ liệu.

## 3. Đưa app lên mạng (Firebase Hosting)

File `firebase.json` và `.firebaserc` đã cấu hình sẵn:

```bash
npm run build
firebase deploy
```

App sẽ chạy tại `https://g9cloud-22931.web.app`. Có https nên camera quét QR và thông báo hệ thống đều hoạt động.

## 4. Chạy thử không cần Firebase

`npm run dev:demo` hoặc bản `build:single` dùng dữ liệu lưu trên trình duyệt (`VITE_BACKEND=local`), có sẵn 7 ngày đơn mẫu. Bản xem thử gửi qua link cũng là chế độ này.

## 5. Ghi chú kỹ thuật

- **Cấu hình Firebase** nằm trong `src/config/firebase.ts`, có thể ghi đè bằng biến `VITE_FIREBASE_*` (xem `.env.example`).
  - API key của Firebase **không phải mật khẩu**: Google thiết kế để nó nằm trong mã phía trình duyệt.
  - Bảo mật thật nằm ở Security Rules và Authentication.
- **Hai phiên đăng nhập riêng**: phiên khách (ẩn danh) và phiên nhân viên (app Firebase tên `staff`). Nhờ vậy dùng chung một máy vẫn không lẫn quyền.
- **Nhân viên** tải đơn của 8 ngày gần nhất (đủ cho thống kê 7 ngày). **Khách** chỉ tải đơn của mình.
- **Truy vấn** chỉ dùng chỉ mục một trường, không cần tạo composite index.
- **Ảnh món tải lên** hiện lưu ngay trong tài liệu món (tối đa ~250 KB/ảnh, Firestore cho tối đa 1 MB/tài liệu). Khi có nhiều ảnh thật nên chuyển sang **Firebase Storage**.
- **Thông báo khi app đang đóng** (push) cần Cloud Functions + FCM, hoặc ZNS cho bản Zalo. Hiện thông báo hoạt động khi app đang mở hoặc chạy nền trên trình duyệt.
