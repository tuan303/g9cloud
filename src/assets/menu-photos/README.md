# Ảnh chụp thật của món

Thư mục này chứa ảnh món đã tối ưu (`<mã món>.webp`, 720×720) do `npm run photos` tạo ra.
Có ảnh của món nào thì app dùng ảnh đó thay cho hình minh hoạ trong `src/assets/menu/`.

1. Chụp từng món (nên chụp từ trên chéo xuống, nền gọn, đủ sáng; ảnh sẽ được cắt vuông).
2. Bỏ ảnh vào thư mục `Ảnh món` nằm cạnh thư mục `cloud9-app`, đặt tên tệp theo tên món
   (VD `Cà phê sữa đá.jpg`, `Croissant bơ Pháp.heic`) hoặc mã món (`ca-phe-sua.jpg`).
3. Chạy `npm run photos`, rồi build / deploy lại.

> Hiện đang dùng **ảnh demo** từ kho ảnh miễn phí (xem [CREDITS.md](CREDITS.md)). Ảnh thật của quán chạy `npm run photos` sẽ ghi đè đúng tên tệp.
