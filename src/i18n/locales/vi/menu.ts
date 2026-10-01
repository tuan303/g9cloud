/** Chữ của nhóm "menu" (tiếng Việt — bản gốc) */
export const menu = {
  /** Toast khi thêm món vào giỏ */
  added: 'Đã thêm {name}',
  addedQty: 'Đã thêm {count} × {name}',
  /** "3 món" — số món trong danh mục / kết quả tìm */
  itemCount: '{count} món',
  soldOut: 'Tạm hết',

  page: {
    loadFailedTitle: 'Chưa tải được thực đơn',
    loadFailedBody: 'Kết nối đang chậm hơn thường lệ. Bạn thử tải lại trang nhé.',
    reload: 'Tải lại',
    loadingAria: 'Đang tải thực đơn',
    emptyTitle: 'Thực đơn đang được cập nhật',
    emptyBody: 'Quán đang chuẩn bị món cho hôm nay, bạn quay lại sau ít phút nhé.',
    categoryEmptyTitle: 'Danh mục đang cập nhật',
    categoryEmptyBody: 'Quán đang chuẩn bị món mới cho mục này, bạn xem các danh mục khác nhé.',
  },

  search: {
    aria: 'Tìm món',
    placeholder: 'Tìm món: latte, trà đào, croissant…',
    clear: 'Xoá tìm kiếm',
    resultFor: 'cho “{query}”',
    noResultsTitle: 'Chưa tìm thấy món phù hợp',
    noResultsBody: 'Thử từ khoá khác, ví dụ “latte”, “trà đào” hoặc “bánh”.',
  },

  tabs: {
    aria: 'Danh mục thực đơn',
    /** Đọc sau số đếm trên tab: "5 món" */
    countSr: 'món',
  },

  card: {
    openAria: '{name}, {price}. Xem chi tiết',
    openAriaSoldOut: '{name}, {price}, tạm hết. Xem chi tiết',
    quickAddAria: 'Thêm nhanh {name} vào giỏ',
    quickAddAriaInCart: 'Thêm nhanh {name} vào giỏ (đang có {count})',
  },

  detail: {
    maxChoices: '{group}: chọn tối đa {count} mục',
    chooseRequired: 'Bạn chọn giúp mục “{group}” nhé',
    updated: 'Đã cập nhật {name}',
    soldOutButton: 'Món tạm hết',
    update: 'Cập nhật món',
    addToCart: 'Thêm vào giỏ',
    soldOutNotice: 'Món này đang tạm hết. Bạn chọn món khác hoặc quay lại sau nhé!',
    noteLabel: 'Ghi chú cho quán',
    notePlaceholder: 'VD: ít ngọt hơn, không lấy ống hút…',
    noteHint: '{used}/{max} ký tự',
    quantity: 'Số lượng',
    perServing: '{price} / phần',
    optional: 'Tuỳ chọn',
    optionalMax: 'Tuỳ chọn · tối đa {max}',
    pleaseChoose: 'Vui lòng chọn {groupLower}',
    loyaltyHint: 'Tích {count} cốc vào thẻ tích điểm',
  },

  cartBar: {
    aria: 'Giỏ hàng: {count} món, tạm tính {subtotal}. Đặt hàng bằng QR',
    summary: 'Giỏ hàng · {count} món',
    orderQr: 'Đặt hàng bằng QR',
  },

  hero: {
    greeting: {
      morning: { title: 'Chào buổi sáng', sub: 'Bắt đầu ngày mới với một ly cà phê nhé?' },
      noon: { title: 'Chào buổi trưa', sub: 'Nghỉ trưa với một ly mát lạnh nhé?' },
      afternoon: { title: 'Chào buổi chiều', sub: 'Nắng chiều đẹp, mình thưởng thức gì đây?' },
      evening: { title: 'Chào buổi tối', sub: 'Hôm nay bạn muốn thưởng thức gì?' },
    },
    hoursSr: 'Giờ mở cửa:',
    deliverTo: 'Giao đến: {address}',
    deliveryNoAddress: 'Giao tận nơi · Thêm địa chỉ',
    fulfillmentAria: 'Hình thức nhận món: {value}. Chạm để thay đổi',
  },

  activeOrder: {
    orderSr: 'Đơn',
    view: 'Xem',
    more: 'Còn {count} đơn khác đang xử lý · Xem tất cả',
  },

  fulfillmentSheet: {
    title: 'Hình thức nhận món',
    intro: 'Bạn muốn ghé quầy lấy món hay để quán mang đến tận nơi?',
    confirm: 'Xác nhận',
    addressRequired: 'Bạn nhập giúp nơi giao (lớp hoặc phòng ban) nhé',
    toastDelivery: 'Quán sẽ giao đến {address}',
    toastPickup: 'Bạn sẽ nhận món tại quầy',
    minOrder: 'Giao tận nơi cho đơn từ {amount}.',
    counter: 'Quầy {name} · {location}',
  },
};
