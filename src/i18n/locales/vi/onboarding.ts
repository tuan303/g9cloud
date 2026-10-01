/** Chữ của nhóm "onboarding" (tiếng Việt — bản gốc): màn hình chào / đăng nhập + trang Tài khoản */
export const onboarding = {
  /** Tên hiển thị khi khách chưa nhập tên */
  guestName: 'Khách',
  /** Cách gọi thân mật khi chưa biết tên (VD "Chào mừng bạn…") */
  callNameFallback: 'bạn',

  hero: {
    aria: 'Chào mừng đến Cloud 9',
    morning: 'Chào buổi sáng',
    noon: 'Chào buổi trưa',
    afternoon: 'Chào buổi chiều',
    evening: 'Chào buổi tối',
    title: 'Hôm nay mình uống gì nhỉ?',
    subtitle: 'Cà phê & bánh nướng mỗi ngày — gọi món nhanh, nhận món ngay tại trường.',
  },

  steps: {
    signIn: 'Đăng nhập',
    fulfillment: 'Nhận món',
    back: 'Quay lại bước trước',
    progress: 'Bước {step}/{total}',
    progressAria: 'Bước {step} trên {total}: {label}',
  },

  welcome: {
    pageTitle: 'Đăng nhập',
    methodTitle: 'Chọn cách đăng nhập',
    methodLead: 'Chưa đến một phút là xong.',
    microsoftTitle: 'Đăng nhập bằng Microsoft 365',
    microsoftDesc: 'Dùng tài khoản email trường · lưu lịch sử đơn trên mọi máy',
    zaloTitle: 'Đăng nhập bằng Zalo',
    zaloDesc: 'Dùng tên và ảnh đại diện Zalo của bạn',
    or: 'hoặc',
    guestTitle: 'Tiếp tục với tư cách khách',
    guestDesc: 'Gọi món ngay, không cần tài khoản',
    privacy: 'Cloud 9 chỉ dùng tên và số điện thoại để xử lý đơn và báo bạn khi món sẵn sàng.',
    staffLink: 'Nhân viên quán? Vào trang quản trị',
    zaloError: 'Chưa lấy được thông tin Zalo. Bạn thử lại hoặc chọn cách khác nhé.',
    profile: {
      microsoft: {
        title: 'Xác nhận thông tin',
        description: 'Đã đăng nhập bằng tài khoản Microsoft 365 của trường. Thêm số điện thoại để quán liên hệ khi cần.',
      },
      school_email: {
        title: 'Đăng nhập bằng email trường',
        description: 'Lần sau đăng nhập lại bằng cùng email là xem được các đơn đã đặt.',
      },
      zalo: {
        title: 'Xác nhận thông tin',
        description: 'Kiểm tra lại tên và thêm số điện thoại để quán liên hệ khi cần.',
      },
      guest: {
        title: 'Tiếp tục với tư cách khách',
        description: 'Gọi món ngay, không cần tài khoản.',
      },
    },
    verified: 'Đã xác thực · {email}',
    zaloConnected: 'Đã kết nối với Zalo',
    zaloAccount: 'Tài khoản Zalo',
    guestNote: 'Tên và số điện thoại chưa bắt buộc lúc này, nhưng sẽ cần khi thanh toán để quán gọi bạn ra nhận món.',
    guestPhoneHint: 'Không bắt buộc · cần khi thanh toán',
    demoNote: 'Bản xem thử offline: mô phỏng đăng nhập Microsoft 365 bằng email',
    continue: 'Tiếp tục',
    start: 'Bắt đầu gọi món',
    fulfillmentTitle: 'Bạn muốn nhận món thế nào?',
    fulfillmentLead: 'Chọn cách quen thuộc của bạn — khi đặt từng đơn vẫn đổi được.',
    editAria: 'Sửa thông tin đăng nhập',
    addressRequired: 'Vui lòng nhập nơi giao, VD: Lớp 8A1 – Tầng 3',
    welcomeToast: 'Chào mừng {name} đến với Cloud 9!',
  },

  /** Các ô hồ sơ (màn hình chào + bảng chỉnh sửa) */
  fields: {
    emailLabel: 'Email trường',
    emailReadonlyHint: 'Email dùng để đăng nhập nên không đổi được',
    emailDomainHint: 'Chỉ nhận email trường ({domains})',
    emailPlaceholderUser: 'ten.ban',
    emailPlaceholderDomain: 'truong.edu.vn',
    nameLabel: 'Họ và tên',
    namePlaceholder: 'VD: Nguyễn Minh An',
    phoneLabel: 'Số điện thoại',
    phoneHint: 'Để quán gọi bạn khi món sẵn sàng',
    studentIdLabel: 'Mã học sinh / nhân viên',
    studentIdPlaceholder: 'VD: HS2025-0123',
  },

  /** Lỗi kiểm tra ô hồ sơ */
  validation: {
    emailRequired: 'Vui lòng nhập email trường',
    emailInvalid: 'Email chưa đúng định dạng',
    emailDomain: 'Vui lòng dùng email trường ({domains})',
    nameRequired: 'Vui lòng nhập họ và tên',
    nameTooShort: 'Tên cần ít nhất 2 ký tự',
    nameTooLong: 'Tên tối đa 60 ký tự',
    phoneRequired: 'Vui lòng nhập số điện thoại',
    phoneInvalid: 'Số điện thoại chưa đúng, VD: 0912 345 678',
    idTooLong: 'Mã tối đa 20 ký tự',
    idChars: 'Mã chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch',
  },

  edit: {
    title: 'Chỉnh sửa thông tin',
    save: 'Lưu thay đổi',
    saved: 'Đã cập nhật thông tin',
    guestPhoneHint: 'Không bắt buộc · quán sẽ gọi số này khi món sẵn sàng',
  },

  /** Thẻ hồ sơ ở đầu trang Tài khoản */
  profileCard: {
    aria: 'Thông tin tài khoản',
    edit: 'Chỉnh sửa',
    hello: 'Xin chào bạn!',
    provider: {
      microsoft: 'Microsoft 365',
      school_email: 'Email trường',
      zalo: 'Zalo',
      guest: 'Khách',
    },
    phone: 'Điện thoại',
    studentId: 'Mã HS / NV',
    empty: 'Chưa có',
    loadingOrders: 'Đang tải đơn hàng',
    ordersPlaced: 'đơn đã đặt',
    ordersActive: 'đang xử lý',
    noOrders: 'Chưa có đơn nào — gọi món ngay',
  },

  notifications: {
    granted: {
      title: 'Thông báo đã bật',
      description: 'Cloud 9 sẽ báo ngay khi món sẵn sàng hoặc đang được giao.',
    },
    default: {
      title: 'Báo khi món xong',
      description: 'Nhận thông báo cả khi bạn đang mở ứng dụng khác.',
    },
    unknown: {
      title: 'Báo khi món xong',
      description: 'Nhận thông báo khi món sẵn sàng hoặc đang được giao.',
    },
    dismissed: {
      title: 'Bạn chưa cho phép',
      description: 'Chạm “Bật thông báo” rồi chọn Cho phép khi được hỏi nhé.',
    },
    denied: {
      title: 'Thông báo đang bị chặn',
      description: 'Hãy cho phép thông báo cho Cloud 9 trong phần cài đặt, rồi thử lại.',
    },
    unsupported: {
      title: 'Thiết bị chưa hỗ trợ',
      description: 'Bạn vẫn nhận thông báo trong ứng dụng khi đang mở Cloud 9.',
    },
    on: 'Đang bật',
    enable: 'Bật thông báo',
    enabledToast: 'Đã bật thông báo',
  },

  about: {
    photoAlt: 'Quầy bánh và pha chế của Cloud 9 trong nắng chiều',
    blurb: 'Một ly cà phê ngon, một chiếc bánh vừa ra lò — vậy là “trên chín tầng mây” rồi.',
    hours: 'Giờ mở cửa',
    location: 'Vị trí',
    hotline: 'Hotline',
    callAria: 'Gọi hotline {phone}',
  },

  account: {
    upgradedToast: 'Đã chuyển sang tài khoản Microsoft 365',
    loggedOutToast: 'Đã đăng xuất. Hẹn gặp lại bạn!',
    addressError: 'Nhập nơi giao để quán mang món đến đúng chỗ',
    /** Thẻ mời khách nâng cấp tài khoản — chỉ hiện khi tắt tích điểm (bình thường thẻ tích điểm đảm nhận) */
    upgradeTitle: 'Đăng nhập Microsoft 365 của trường để lưu lịch sử đơn',
    upgradeBody: 'Dùng tài khoản email trường — xem lại đơn cũ trên mọi thiết bị, gọi lại món quen chỉ với vài chạm.',
    upgradeCta: 'Đăng nhập ngay',
    activeNote: 'Bạn còn {count} đơn đang xử lý ({codes}) — nhớ mã đơn để nhận món nhé.',
    fulfillmentTitle: 'Nhận món mặc định',
    autoSaved: 'Tự động lưu',
    fulfillmentHint: 'Áp dụng sẵn cho đơn mới — bạn vẫn đổi được trong giỏ hàng.',
    languageTitle: 'Ngôn ngữ / Language',
    languageLabel: 'Ngôn ngữ hiển thị',
    languageHint: 'Áp dụng cho toàn bộ ứng dụng',
    notificationsTitle: 'Thông báo',
    aboutTitle: 'Về Cloud 9',
    staffTitle: 'Dành cho nhân viên quán',
    adminTitle: 'Trang quản trị quán',
    adminDesc: 'Nhận đơn, quét QR thu tiền, cập nhật thực đơn',
    logout: 'Đăng xuất',
    version: 'Cloud 9 · Phiên bản {version} · Bản thử nghiệm',
    logoutConfirm: {
      title: 'Đăng xuất khỏi Cloud 9?',
      confirm: 'Đăng xuất',
      cancel: 'Ở lại',
      cartKept: 'Giỏ hàng của bạn vẫn được giữ nguyên.',
      guest: 'Đơn đặt với tư cách khách sẽ không xem lại được sau khi đăng xuất.',
      member: 'Đăng nhập lại bằng cùng tài khoản để xem lịch sử đơn.',
    },
    upgradeConfirm: {
      title: 'Chuyển sang tài khoản Microsoft 365?',
      confirm: 'Tiếp tục',
      body: 'Đơn đang xử lý được đặt với tư cách khách nên sẽ không hiện trong tài khoản mới.',
    },
  },
};
