/** Chữ dùng chung toàn app (tiếng Việt — bản gốc) */
export const common = {
  appName: 'Cloud 9',
  tagline: 'Bakery · Cafe',
  loading: 'Đang tải',
  close: 'Đóng',
  back: 'Quay lại',
  cancel: 'Huỷ',
  confirm: 'Đồng ý',
  later: 'Để sau',
  save: 'Lưu',
  edit: 'Sửa',
  delete: 'Xoá',
  retry: 'Thử lại',
  free: 'Miễn phí',
  required: 'Bắt buộc',
  optional: 'Không bắt buộc',
  genericError: 'Đã có lỗi xảy ra',
  reloadApp: 'Tải lại ứng dụng',
  backToMenu: 'Về thực đơn',
};

export const lang = {
  label: 'Ngôn ngữ',
  switchTo: 'Chuyển ngôn ngữ',
};

export const nav = {
  main: 'Điều hướng chính',
  menu: 'Thực đơn',
  orders: 'Đơn hàng',
  notifications: 'Thông báo',
  account: 'Tài khoản',
  admin: 'Điều hướng quản trị',
  adminBadge: 'Admin',
  adminArea: 'Quản trị quán',
  dashboard: 'Tổng quan',
  adminOrders: 'Đơn hàng',
  scan: 'Quét QR',
  adminMenu: 'Thực đơn',
  customerApp: 'Xem app khách',
  lock: 'Khoá màn hình',
  lockAria: 'Khoá màn hình quản trị',
  checkingAccess: 'Đang kiểm tra quyền',
};

export const ui = {
  closeNotification: 'Đóng thông báo',
  hideWarning: 'Ẩn cảnh báo',
  decrease: 'Giảm số lượng',
  increase: 'Tăng số lượng',
  removeItem: 'Xoá món',
  removeNamed: 'Xoá {name} khỏi giỏ',
  decreaseNamed: 'Giảm số lượng {name}',
  increaseNamed: 'Tăng số lượng {name}',
  tagBestseller: 'Bán chạy',
  tagNew: 'Mới',
  tagSignature: 'Đặc trưng',
};

export const notFound = {
  errorTitle: 'Ối, có lỗi xảy ra',
  errorBody: 'Vui lòng tải lại ứng dụng.',
  title: 'Không tìm thấy trang',
  body: 'Trang bạn tìm không tồn tại hoặc đã được chuyển.',
};

export const connection = {
  lost: 'Mất kết nối máy chủ.',
  denied: 'Không truy cập được dữ liệu.',
  notReady: 'Máy chủ chưa sẵn sàng.',
  busy: 'Máy chủ đang quá tải.',
  autoRetry: 'App sẽ tự kết nối lại.',
};

export const fulfillment = {
  aria: 'Hình thức nhận món',
  pickup: 'Nhận tại quầy',
  pickupDesc: 'Lấy tại quầy hoặc dùng tại quán',
  delivery: 'Giao tận nơi',
  deliveryDesc: 'Giao đến lớp học / phòng ban trong trường',
  deliverTo: 'Giao đến',
  addressPlaceholder: 'VD: Lớp 8A1 – Tầng 3, Toà B',
  freeDelivery: 'Miễn phí giao trong trường',
  deliveryFee: 'Phí giao: {fee}',
};

export const totals = {
  subtotal: 'Tạm tính',
  deliveryFee: 'Phí giao hàng',
  discount: 'Giảm giá',
  loyaltyReward: 'Cốc miễn phí (tích điểm)',
  total: 'Tổng cộng',
};

export const status = {
  pending_payment: { label: 'Chờ thanh toán', description: 'Đưa mã QR cho thu ngân quét tại quầy để thanh toán' },
  received: { label: 'Đã nhận đơn', description: 'Quán đã nhận đơn và thanh toán của bạn' },
  preparing: { label: 'Đang chuẩn bị', description: 'Barista đang pha chế món của bạn' },
  ready: { label: 'Sẵn sàng', description: 'Món đã xong — mời bạn đến quầy nhận' },
  delivering: { label: 'Đang giao', description: 'Nhân viên đang mang món đến cho bạn' },
  completed: { label: 'Hoàn thành', description: 'Chúc bạn ngon miệng!' },
  cancelled: { label: 'Đã huỷ', description: 'Đơn hàng đã bị huỷ' },
  stepDelivered: 'Đã giao',
  paidAtPos: 'Đã thanh toán tại POS',
  stepPickedUp: 'Đã nhận món',
  action: {
    confirmPayment: 'Xác nhận đã thanh toán',
    startPreparing: 'Bắt đầu pha chế',
    startDelivery: 'Bắt đầu giao',
    markReady: 'Báo món sẵn sàng',
    pickedUp: 'Khách đã nhận',
    delivered: 'Đã giao xong',
  },
};

export const notify = {
  received: { title: 'Đơn hàng đã nhận ✅', body: 'Đơn {code} đã được thanh toán. Quán sẽ bắt đầu chuẩn bị ngay!' },
  preparing: { title: 'Đang chuẩn bị ☕', body: 'Barista đang pha chế đơn {code} của bạn.' },
  ready: { title: 'Đơn hàng sẵn sàng 🛍️', body: 'Đơn {code} đã xong — mời bạn đến quầy nhận món.' },
  delivering: { title: 'Đang giao hàng 🚚', body: 'Đơn {code} đang được mang đến {address}.' },
  deliveringDefault: 'cho bạn',
  completed: { title: 'Hoàn thành 🎉', body: 'Cảm ơn bạn đã chọn Cloud 9! Chúc bạn ngon miệng.' },
  cancelled: { title: 'Đơn hàng đã huỷ', body: 'Đơn {code} đã bị huỷ.', bodyReason: 'Đơn {code} đã bị huỷ: {reason}' },
  reward: { title: 'Bạn có cốc miễn phí 🎁', body: 'Đủ {cups} cốc rồi! Dùng ngay ở bước đặt hàng nhé.' },
};

export const errors = {
  cartEmpty: 'Giỏ hàng trống',
  addressRequired: 'Vui lòng nhập địa chỉ giao hàng',
  soldOut: 'Món đã hết: {items}',
  optionsChanged: '{name}: tuỳ chọn đã thay đổi, vui lòng chọn lại món',
  priceChanged: 'Giá món vừa thay đổi — vui lòng kiểm tra lại giỏ hàng',
  orderNotFound: 'Không tìm thấy đơn hàng',
  itemNotFound: 'Không tìm thấy món',
  orderCancelled: 'Đơn đã bị huỷ',
  orderCompleted: 'Đơn đã hoàn thành',
  orderFinished: 'Đơn đã kết thúc, không thể cập nhật',
  notPaid: 'Đơn chưa thanh toán',
  noGoingBack: 'Không thể lùi trạng thái đơn',
  paidContactCounter: 'Đơn đã thanh toán — vui lòng liên hệ quầy để huỷ',
  priceMismatch: 'Đơn {code} có giá không khớp thực đơn ({detail}). Không thu tiền — hãy huỷ và đặt lại.',
  duplicateCode: 'Có {count} đơn trùng mã {code} — vui lòng quét mã QR trên máy khách',
  nameRequired: 'Tên món không được để trống',
  invalidPrice: 'Giá không hợp lệ',
  storageFull: 'Bộ nhớ thiết bị đã đầy — hãy dùng ảnh nhỏ hơn.',
  loyaltyNotEnough: 'Khách chưa đủ {cups} cốc để đổi cốc miễn phí — không thu theo giá giảm.',
  loyaltyGuest: 'Khách vãng lai không dùng được cốc miễn phí.',
  priceDetail: {
    quantity: '{name}: số lượng / thành tiền không hợp lệ',
    price: '{name}: giá khác thực đơn',
    subtotal: 'tạm tính không khớp các món',
    total: 'tổng tiền không khớp',
    fee: 'phí giao không đúng',
  },
  reasonCustomer: 'Khách huỷ đơn',
  reasonStaff: 'Quán huỷ đơn',
  reasonExpired: 'Hết hạn thanh toán',
  pricesUpdated: 'Giá một số món trong giỏ vừa được quán cập nhật',
  sessionExpired: 'Phiên đăng nhập Microsoft 365 đã hết — vui lòng đăng nhập lại.',
  ssoSetup: 'Đăng nhập Microsoft 365 đang được quán thiết lập. Bạn có thể tiếp tục với tư cách khách.',
  firebase: {
    permission: 'Không có quyền truy cập dữ liệu — kiểm tra đăng nhập nhân viên hoặc Firestore Security Rules.',
    unavailable: 'Mất kết nối máy chủ — kiểm tra mạng rồi thử lại.',
    notReady: 'Firestore chưa sẵn sàng (có thể thiếu chỉ mục hoặc chưa tạo cơ sở dữ liệu).',
    badCredentials: 'Email hoặc mật khẩu không đúng.',
    tooMany: 'Thử sai quá nhiều lần — vui lòng đợi một lát.',
    offline: 'Không có kết nối mạng.',
    providerOff: 'Phương thức đăng nhập này chưa được bật trong Firebase Authentication (xem docs/M365_SSO.md).',
    popupClosed: 'Bạn đã đóng cửa sổ đăng nhập.',
    popupBlocked: 'Trình duyệt chặn cửa sổ đăng nhập — đang chuyển sang trang đăng nhập Microsoft…',
    unauthorizedDomain: 'Tên miền của app chưa được thêm vào Firebase › Authentication › Authorized domains.',
    accountExists: 'Email này đã được đăng ký bằng cách khác — liên hệ quản trị quán.',
    microsoftRejected: 'Microsoft 365 từ chối đăng nhập: {code}',
    signInFailed: 'Đăng nhập không thành công — vui lòng thử lại.',
    notSchool: 'Tài khoản {email} không thuộc trường. Vui lòng dùng email trường.',
    thisAccount: 'này',
  },
};

export const time = {
  justNow: 'vừa xong',
  minutesAgo: '{count} phút trước',
  hoursAgo: '{count} giờ trước',
  yesterday: 'hôm qua',
  weekdaysShort: 'CN,T2,T3,T4,T5,T6,T7',
  weekdaysLong: 'Chủ nhật,Thứ Hai,Thứ Ba,Thứ Tư,Thứ Năm,Thứ Sáu,Thứ Bảy',
};

export const loyalty = {
  title: 'Thẻ tích điểm',
  rule: 'Mua {cups} cốc nước tặng 1 cốc miễn phí',
  progress: '{stamps}/{cups} cốc',
  toNext: 'Còn {count} cốc nữa để nhận 1 cốc miễn phí',
  rewardsAvailable: 'Bạn có {count} cốc miễn phí',
  rewardReady: 'Đã đủ {cups} cốc — bạn có cốc miễn phí!',
  totalCups: 'Đã mua {count} cốc',
  guestTitle: 'Tích điểm đổi cốc miễn phí',
  guestBody: 'Đăng nhập Microsoft 365 của trường để tích điểm: mua {cups} cốc tặng 1 cốc.',
  guestCta: 'Đăng nhập để tích điểm',
  stampAria: 'Đã tích {stamps} trên {cups} cốc',
  chip: '{stamps}/{cups}',
  chipAria: 'Tích điểm: {stamps} trên {cups} cốc',
  useReward: 'Dùng 1 cốc miễn phí',
  useRewardHint: 'Áp dụng cho {name} (−{amount})',
  noEligible: 'Thêm một món nước để dùng cốc miễn phí',
  earned: '+{count} cốc tích điểm',
  redeemed: 'Đã dùng 1 cốc miễn phí',
  redeemBadge: 'Đổi cốc miễn phí',
  customerStamps: 'Khách đang có {count} cốc ({rewards} cốc miễn phí)',
  pendingNote: 'Cốc miễn phí đang chờ thanh toán ở đơn {codes}',
};
