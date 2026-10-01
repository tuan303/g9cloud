# Nhận diện Cloud 9 trong ứng dụng

Màu của app được lấy mẫu trực tiếp từ 4 ảnh không gian quán (`view1–4.jpg`) bằng cách đo màu trung bình từng vùng và gom cụm màu (k-means). Ý tưởng chung là **“Golden hour ở Cloud 9”**: tường vữa nâu đồng, nắng chiều vàng rọi qua cửa sổ, ghế mây đan màu cam đất và chậu cây xanh.

## Bảng màu

| Tên | Mã màu | Lấy từ đâu trong ảnh | Dùng trong app |
|---|---|---|---|
| **Espresso** | `#2A2218` | Góc tường khuất nắng (`#2B2317`), mặt quầy inox tối | Nền tối (hero, admin), chữ chính, nút chính |
| **Bronze** | `#86694A` (dải 50→900) | Tường vữa nâu đồng (`#533B20` → `#A6804F`) | Viền, nền phụ, chữ phụ ấm |
| **Gold** | `#D9AE63` | Vệt nắng trên tường (`#E0B869`, `#CBA872`) | Điểm nhấn, tab đang chọn, số liệu nổi bật, tiêu điểm (focus) |
| **Cream / Latte** | `#F6F2EA` / `#E8D9BE` | Trần và tường sáng (`#F6F3EC`), vùng tường bắt nắng (`#E7D6B8`) | Nền sáng, thẻ |
| **Rattan** | `#8C4F2E` | Ghế mây đan (`#884B2D`, `#643522`) | Badge số lượng, trạng thái “Đang chuẩn bị”, cảnh báo nhẹ |
| **Leaf** | `#5E7A2E` | Chậu cây xanh (`#514A0B` → `#C1AA1F`, đã chỉnh bớt ánh vàng của nắng) | **Nút “Đặt hàng bằng QR”**, thanh toán, trạng thái thành công/sẵn sàng (đúng như mockup muốn nút QR màu xanh) |
| **Stone** | `#6F6254` | Sàn gạch xám ấm (`#7E7062`) | Chữ mờ, icon phụ |

Độ tương phản đã kiểm tra: chữ cream trên espresso ≈ 14:1, chữ trắng trên leaf ≈ 4.8:1 (đạt AA), chữ stone trên cream ≈ 5:1.

## Logo

- `src/assets/brand/logo.png` được tách từ `logo.jpg`: nền trong suốt, đã cắt sát. Component `<Logo>` dùng file này làm **mặt nạ (mask)**, nên logo tự đổi màu theo màu chữ, ví dụ `text-cream` trên nền tối hoặc `text-espresso` trên nền sáng. Cách này giống chữ nổi trắng trên tường nâu ở quán.
- Icon app (`public/icon-*.png`) là logo màu kem trên nền espresso.
- **Nên có**: logo dạng vector (SVG/AI) để hiển thị sắc nét ở mọi kích thước, và biểu tượng vuông riêng (ví dụ chữ “9”) cho avatar Zalo OA.

## Chữ

- **Montserrat** (tiêu đề, giá, số liệu): kiểu chữ hình học đậm, gần với chữ trong logo CLOUD9.
- **Be Vietnam Pro** (nội dung): hiển thị dấu tiếng Việt rất tốt.
- Font được đóng gói sẵn trong app (chỉ gồm bộ ký tự Latin và tiếng Việt), không tải từ CDN.
- Nếu quán có font thương hiệu chính thức, gửi file để thay.

## Hình ảnh

- Ảnh không gian quán được nén sang WebP, mỗi ảnh khoảng 50–100 KB, lưu trong `src/assets/photos/`:
  - `espresso-bar`: làm hero màn hình đăng nhập
  - `interior-wall`: làm nền desktop
  - `counter`: dùng ở trang giới thiệu quán
- Ảnh món hiện là **minh hoạ vector** vẽ riêng theo cùng bảng màu (`src/assets/menu/*.svg`). Có hai cách dùng **ảnh chụp món thật**:
  1. Bỏ ảnh vào thư mục `Ảnh món` (cạnh `cloud9-app`), đặt tên tệp theo tên món (VD `Cà phê sữa đá.jpg`, nhận cả HEIC của iPhone), chạy `npm run photos` rồi build lại. Ảnh được cắt vuông 720px, nén WebP vào `src/assets/menu-photos/` và tự thay minh hoạ cùng mã — kể cả món đã lưu trên Firestore.
  2. Nhân viên chụp / tải ảnh cho từng món ở trang Quản trị › Thực đơn (lưu ngay vào món, không cần build).
