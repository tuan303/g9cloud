# Đăng nhập SSO bằng Microsoft 365 của trường

Khách (học sinh, giáo viên, nhân viên) bấm **“Đăng nhập bằng Microsoft 365”**, chọn tài khoản email trường trong cửa sổ Microsoft, rồi quay lại app:

- Tên và email được điền sẵn; email không sửa được.
- Khách chỉ cần thêm số điện thoại.
- Lịch sử đơn gắn với tài khoản Microsoft nên xem được trên mọi thiết bị.
- Đơn đặt khi còn là **khách** không chuyển sang tài khoản Microsoft, để người dùng chung máy không thấy đơn của nhau. Nếu còn đơn đang xử lý, app nhắc khách nhớ mã đơn.

**Máy dùng chung** (máy tính lớp học, máy tính bảng):
- Mỗi lần đăng xuất, app tạo một phiên khách mới.
- Nếu người vừa đăng xuất dùng Microsoft 365, lần đăng nhập Microsoft kế tiếp trên máy đó **bắt buộc nhập lại mật khẩu**. Người sau không thể chọn tài khoản của người trước trong danh sách tài khoản của Microsoft.

Trang quản trị cũng có nút **Microsoft 365** cho nhân viên khi dùng chế độ `admin.auth = 'firebase'`. Quyền nhân viên vẫn kiểm tra bằng tài liệu `staff/{uid}`.

Luồng hoạt động: app ↔ **Firebase Authentication** (nhà cung cấp *Microsoft*) ↔ **Microsoft Entra ID** (Azure AD) của trường. App không bao giờ thấy mật khẩu.

## Việc cần làm (quản trị M365 của trường, khoảng 15 phút)

### Bước 1: Bật Firebase Authentication

Firebase Console › project **g9cloud-22931** › Build › **Authentication** › *Get started*. Trong tab **Sign-in method**, bật **Anonymous**. Khách chưa đăng nhập và chế độ khách vẫn cần phương thức này.

### Bước 2: Đăng ký app trên Microsoft Entra ID

1. Vào https://entra.microsoft.com bằng tài khoản quản trị của trường, chọn **Identity › Applications › App registrations › New registration**, rồi điền:
   - **Name**: `Cloud 9 Cafe`
   - **Supported account types**: *Accounts in this organizational directory only* (**Single tenant**). Chỉ tài khoản của trường đăng nhập được.
   - **Redirect URI**: chọn *Web*, nhập `https://g9cloud-22931.firebaseapp.com/__/auth/handler`
   - Sau khi tạo xong, vào **Authentication › Add URI** và thêm `https://g9cloud-22931.web.app/__/auth/handler`. App chạy trên `web.app` dùng chính tên miền này để đăng nhập, tránh bị trình duyệt chặn cookie bên thứ ba.
2. Bấm **Register**. Ở trang **Overview**, sao chép:
   - **Application (client) ID**
   - **Directory (tenant) ID**
3. **Certificates & secrets › New client secret**: đặt mô tả `firebase`, chọn thời hạn (ví dụ 24 tháng), rồi sao chép cột **Value** ngay, vì giá trị này chỉ hiện một lần.
4. (Khuyến nghị) **API permissions**: mặc định đã có *Microsoft Graph › User.Read*. Bấm **Grant admin consent for …** để học sinh không phải tự đồng ý cấp quyền lần đầu.

### Bước 3: Bật nhà cung cấp Microsoft trong Firebase

Firebase Console › Authentication › Sign-in method › **Add new provider › Microsoft**:
- Bật **Enable**.
- **Application ID** = *Application (client) ID* ở bước 2.
- **Application secret** = *Value* của client secret ở bước 2.
- Kiểm tra *redirect URI* Firebase hiển thị khớp với URI đã nhập ở bước 2, rồi bấm **Save**.

Trong tab **Settings › Authorized domains**:
- `localhost`, `g9cloud-22931.firebaseapp.com` và `g9cloud-22931.web.app` đã có sẵn.
- Nếu chạy app trên tên miền khác (ví dụ `cafe.tentruong.edu.vn`), thêm tên miền đó vào đây.

### Bước 4: Điền tenant của trường vào app

Trong `src/config/app.ts`:

```ts
auth: {
  schoolEmailDomains: ['tentruong.edu.vn'],   // tên miền email trường (kiểm tra thêm phía app)
  microsoft: {
    enabled: true,
    tenant: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // Directory (tenant) ID ở bước 2
  },
},
```

Sau đó build và deploy lại: `npm run deploy`.

## Kiểm tra

1. Mở app, bấm **Đăng nhập bằng Microsoft 365**, rồi chọn tài khoản email trường. Tên và email sẽ được điền sẵn.
2. Thử một tài khoản Microsoft cá nhân (`@outlook.com`, `@gmail.com`) hoặc tài khoản trường khác: Microsoft sẽ từ chối (lỗi AADSTS50020). Đây là kết quả mong muốn.
3. Đăng xuất ở trang Tài khoản sẽ thoát tài khoản Microsoft khỏi app và tạo phiên khách mới. Phiên Microsoft trên trình duyệt vẫn còn, nhưng lần đăng nhập Microsoft kế tiếp trên máy đó sẽ **bắt buộc nhập lại mật khẩu**.

## Lỗi thường gặp

| Lỗi | Nguyên nhân / cách xử lý |
|---|---|
| “Phương thức đăng nhập này chưa được bật…” | Chưa làm bước 1 hoặc bước 3 |
| `AADSTS50011` (redirect URI mismatch) | Entra phải có đủ cả hai Redirect URI: `https://g9cloud-22931.firebaseapp.com/__/auth/handler` và `https://g9cloud-22931.web.app/__/auth/handler`, cộng với tên miền riêng nếu có |
| `AADSTS700016` (application not found) | Sai *Application ID*, hoặc sai tenant trong `app.ts` |
| `AADSTS50020` (user not in tenant) | Tài khoản không thuộc trường. Đây là hành vi đúng |
| `AADSTS7000215` (invalid client secret) | Nhập nhầm *Secret ID* thay vì *Value*, hoặc secret đã hết hạn. Tạo secret mới rồi dán lại vào Firebase |
| “Tên miền của app chưa được thêm…” | Thêm tên miền vào Firebase › Authentication › Authorized domains |
| Cửa sổ đăng nhập không hiện (popup bị chặn) | App tự chuyển sang trang đăng nhập Microsoft rồi quay lại. Nếu vẫn lỗi, cho phép popup cho trang này |

> **Nhắc hạn:** client secret hết hạn theo thời hạn đã chọn ở bước 2. Đặt lịch tạo secret mới trước ngày hết hạn, nếu không đăng nhập Microsoft sẽ ngừng hoạt động.

## Ghi chú

- **Tên miền riêng** (ví dụ `cafe.tentruong.edu.vn` trỏ về Firebase Hosting), cần làm 3 việc:
  1. Đặt `VITE_FIREBASE_AUTH_DOMAIN=cafe.tentruong.edu.vn` khi build.
  2. Thêm `https://cafe.tentruong.edu.vn/__/auth/handler` vào Redirect URIs trên Entra.
  3. Thêm tên miền vào Firebase › Authorized domains.

- **Bản xem thử offline** (link Artifact / `npm run dev:demo`) không có Firebase, nên nút Microsoft 365 **mô phỏng** bằng ô nhập email.
- **Zalo Mini App (giai đoạn 2):** chính sách Zalo chỉ cho đăng nhập bằng tài khoản ngoài Zalo với **app nội bộ** (mở qua QR/lối tắt). Nếu đăng ký app Zalo công khai, dùng “Đăng nhập bằng Zalo” thay cho Microsoft 365. Xem [ZALO_MINI_APP.md](ZALO_MINI_APP.md).
- **Firestore Security Rules không cần sửa**: tài khoản Microsoft cũng là một `request.auth.uid`, đơn vẫn lọc theo `customerUid`.
