/** Chữ của nhóm "cart" (tiếng Việt — bản gốc) */
export const cart = {
  title: 'Giỏ hàng',
  itemCount: '{count} món',
  clearAria: 'Xoá toàn bộ giỏ hàng',
  empty: {
    title: 'Giỏ hàng đang trống',
    body: 'Chọn vài món ngon ở Cloud 9 rồi quay lại đây nhé.',
    cta: 'Xem thực đơn',
  },
  sections: {
    items: 'Món đã chọn',
    fulfillment: 'Hình thức nhận',
    recipient: 'Thông tin người nhận',
    note: 'Ghi chú đơn hàng',
    payment: 'Thanh toán',
  },
  unavailable: {
    title: '{count} món vừa tạm hết',
    body: 'Quán vừa cập nhật thực đơn. Xoá các món này để tiếp tục đặt hàng.',
    removeAll: 'Xoá hết',
    block: '{count} món đã hết — xoá khỏi giỏ để tiếp tục',
    toast: 'Vui lòng xoá món đã hết trước khi đặt',
  },
  addMore: 'Thêm món khác',
  minOrder: {
    short: 'Thêm {amount} nữa để được giao tận nơi',
    hint: 'Giao tận nơi áp dụng cho đơn từ {min} — thêm {amount} nữa nhé.',
  },
  form: {
    name: 'Tên người nhận',
    namePlaceholder: 'VD: Nguyễn Minh Anh',
    phone: 'Số điện thoại',
    phonePlaceholder: 'VD: 0912 345 678',
    phoneHint: 'Quán liên hệ số này khi cần xác nhận đơn',
    notePlaceholder: 'VD: Lấy thêm ống hút giấy, gọi mình khi món xong…',
    noteHint: 'Muốn dặn riêng từng món? Chạm vào món trong giỏ để sửa.',
  },
  errors: {
    address: 'Vui lòng nhập nơi giao (lớp / phòng ban)',
    name: 'Vui lòng nhập tên người nhận',
    phone: 'Vui lòng nhập số điện thoại',
    phoneInvalid: 'Số điện thoại chưa đúng (VD: 0912 345 678)',
  },
  submit: 'Tạo mã QR đặt hàng',
  clearConfirm: {
    title: 'Xoá toàn bộ giỏ hàng?',
    body: 'Tất cả món và ghi chú trong giỏ sẽ bị xoá.',
    confirm: 'Xoá hết',
    cancel: 'Giữ lại',
  },
  steps: {
    aria: 'Các bước đặt món',
    cart: 'Giỏ hàng',
    scan: 'Quét mã QR',
    collect: 'Nhận món',
  },
  line: {
    edit: 'Sửa {name}',
    unavailable: 'Món tạm hết',
    remove: 'Xoá',
    perItem: '{price} / món',
  },
  pending: {
    title: 'Đơn {code} đang chờ thanh toán',
    body: 'Mở lại mã QR để thu ngân quét tại quầy',
  },
};
