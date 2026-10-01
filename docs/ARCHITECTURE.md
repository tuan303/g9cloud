# Kiến trúc & quy ước — Cloud 9 App

Tài liệu cho lập trình viên (và các agent xây dựng giao diện). Đọc hết trước khi sửa code.

## Tổng quan

- **Stack**: React 18 + TypeScript (strict) + Vite 5 + Tailwind CSS 3 + React Router 6 (hash router) + Zustand 4.
- **Thư viện có sẵn** (KHÔNG thêm package mới): `react`, `react-router-dom@6`, `zustand`, `qrcode` (tạo mã QR), `jsqr` (đọc QR từ camera), `lucide-react@1.49` (icon), `clsx`.
  - Tên icon lucide phải tồn tại — kiểm tra: `grep -c "declare const TênIcon:" node_modules/lucide-react/dist/lucide-react.d.ts`.
- **Mobile-first**: giao diện khách nằm trong khung `max-w-md` (AppShell). Trang quản trị responsive (tab dưới trên điện thoại, sidebar từ `md:`).
- **Hướng tới Zalo Mini App**: mọi API nền tảng đi qua `src/platform` (`platform.scanQRCode()`, `platform.vibrate()`, ...). Không gọi `navigator.*`/`zmp-sdk` trực tiếp trong trang.
- Kiểm tra kiểu: `npx tsc --noEmit` (chạy từ thư mục gốc dự án). Alias `@/` = `src/`.

## Luồng nghiệp vụ (theo tài liệu mockup của quán)

1. **Đăng nhập** (`/welcome`): nút lớn “Đăng nhập bằng Microsoft 365” (SSO qua Firebase Auth, `signInCustomerWithMicrosoft` trong `services/firebase.ts`; bản offline mô phỏng bằng ô email) + “Tiếp tục với tư cách khách”. Hồ sơ tối giản: Tên, Số điện thoại (tuỳ chọn Mã HS/NV). Chọn **Nhận tại quầy** hoặc **Giao tận nơi** (nếu giao thì nhập địa chỉ: lớp/phòng).
2. **Thực đơn** (`/`): tab danh mục Cà phê / Nước uống / Bánh ngọt; thẻ món = ảnh + tên + giá; nút **“Đặt hàng bằng QR”** màu xanh lá (leaf).
3. **Giỏ hàng** (`/cart`) → tạo đơn (`repo.createOrder`) → **Thanh toán QR** (`/order/:id/pay`): tóm tắt đơn (món, SL, tổng), mã QR lớn ở giữa, hướng dẫn “Quét tại quầy POS để thanh toán”. Khi thu ngân quét & xác nhận → đơn chuyển `received` → hiện “✅ Đơn hàng đã nhận”.
4. **Trạng thái đơn** (`/order/:id`): Đã nhận → Đang chuẩn bị → Sẵn sàng (nhận tại quầy) / Đang giao (giao tận nơi) → Hoàn thành. Thông báo thời gian thực: “Đơn hàng sẵn sàng”, “Đang giao hàng” (banner trượt xuống + mục Thông báo).
5. **Quản trị** (`/admin`, PIN mặc định `9999`): theo dõi thanh toán QR thời gian thực, quét QR / xác nhận thu tiền, cập nhật trạng thái đơn (nút chuyển trạng thái), quản lý thực đơn (thêm/sửa/xoá/hết hàng), thống kê doanh thu (biểu đồ cột, biểu đồ tròn).

## Dữ liệu

- `src/types/index.ts` — toàn bộ kiểu: `MenuItem`, `OptionGroup`, `CartLine`, `Order`, `OrderStatus`, `CustomerInfo`, `AppNotification`...
- `src/services` — `repo` (interface `DataRepository`): `listMenu, saveMenuItem, deleteMenuItem, setItemAvailability, listOrders, getOrder, findOrderByScan, createOrder, confirmPayment, updateOrderStatus, cancelOrder, subscribe, clearDemoOrders, resetAll` (+ tuỳ chọn `whenReady`, `setViewer`). Các hàm ném `RepoError` (message tiếng Việt) khi lỗi.
  - `FirestoreRepository` (mặc định, `VITE_BACKEND=firebase`): Cloud Firestore thời gian thực (onSnapshot), đánh mã đơn theo ngày bằng transaction trên `counters/{ngày}`, khách chỉ tải đơn của mình, nhân viên tải đơn 8 ngày gần nhất. Xem docs/FIREBASE.md.
  - `LocalRepository` (`VITE_BACKEND=local`, dùng cho bản xem thử): localStorage + đồng bộ giữa các tab (BroadcastChannel).
  - `order-logic.ts`: quy tắc nghiệp vụ dùng chung (dựng đơn, xác nhận thanh toán, chuyển trạng thái, huỷ, hết hạn).
  - `firebase.ts`: khởi tạo 2 app Firebase — phiên khách (ẩn danh) và phiên nhân viên (email/mật khẩu, app tên `staff`).
- `src/store/data.ts` — `useDataStore` (menu + orders), tự làm mới khi repo phát sự kiện. **Đọc dữ liệu qua hook** trong `src/hooks/data.ts`: `useMenu()`, `useMenuByCategory(cat)`, `useOrders()`, `useOrder(id)`, `useMyOrders()`, `useMyActiveOrders()`, `useDataReady()`.
- **Ghi dữ liệu**: gọi `repo.*` (không sửa store trực tiếp). Bọc bằng `useAction` (`src/hooks/useAction.ts`) để có loading + toast lỗi.
- `src/store/session.ts` — `useSession`: `user`, `fulfillment`, `deliveryAddress`, `adminUnlocked`, `login()`, `updateProfile()`, `logout()`, `setFulfillment()`, `setDeliveryAddress()`, `unlockAdmin()`, `lockAdmin()`.
- `src/store/cart.ts` — `useCart`: `lines`, `note`, `add(item, options, qty, note)`, `replace(lineId, item, options, qty, note)`, `setQuantity`, `remove`, `setNote`, `clear`; selector `selectCartCount`, `selectCartSubtotal`.
- `src/store/notifications.ts` — `useNotifications`: `items`, `push`, `markRead`, `markAllRead`, `clear`; `selectUnreadCount`.
- `src/store/ui.ts` — `toast(message, tone)` (tone: default|success|error|info), `useUi().showBanner({title, body, href, icon})`.
- `src/store/order-watcher.ts` — đã tự tạo thông báo + banner khi trạng thái đơn của khách thay đổi (trang không cần tự làm; bỏ qua thay đổi do chính khách thực hiện).
- `src/store/cross-tab.ts` — nạp lại phiên/giỏ/thông báo khi tab khác ghi (tránh ghi đè giữa tab khách và tab quản trị). Giỏ hàng tự tính lại giá khi thực đơn đổi (`useCart.reprice`, gọi trong `store/data.ts`).
- Lưu trữ của zustand đi qua `store/persist-storage.ts` (lỗi ghi chỉ cảnh báo, không làm hỏng thao tác).

## Tiện ích (`src/lib`)

- `format.ts`: `formatPrice(35000) → "35.000đ"`, `formatCompactPrice`, `formatTime`, `formatDateTime`, `formatDayMonth`, `formatWeekday`, `formatRelative`, `startOfDay`, `isSameDay`, `normalizePhone`, `isValidVnPhone`, `isValidEmail`, `initials`.
- `pricing.ts`: `defaultSelections(item)`, `toSelectedOptions(groups, selections)`, `unitPrice(item, options)`, `missingRequiredGroup`, `optionsSummary(options)`, `cartTotals(lines, fee)`, `rebuildLine(line, item)` (tính lại dòng theo thực đơn hiện tại — dùng khi tạo đơn và khi thực đơn đổi), `lineImageRef(item)` (ảnh tải lên được lưu trong dòng dưới dạng `@item/<id>`, `MenuImage` tự tra từ thực đơn).
- `order-status.ts`: `STATUS_META[status]` (label, description, badgeClass, dotClass), `statusSteps(fulfillment)`, `stepLabel`, `nextStatus(order)`, `nextActionLabel(order)`, `ACTIVE_STATUSES`, `isActiveOrder`, `notificationFor(order)`.
- `qr.ts`: `buildOrderQrPayload(order)` → `"C9ORDER:<id>:<code>"`, `parseOrderQrPayload(raw)`.
- `vietqr.ts`: `buildVietQrPayload({bankBin, accountNo, amount, memo})` (chỉ dùng khi `APP_CONFIG.payment.vietqr` khác null).
- `images.ts`: `resolveMenuImage(image)`, `MENU_ILLUSTRATIONS` (danh sách minh hoạ SVG có sẵn).
- `cn.ts`: `cn(...)` = clsx.
- Hooks: `useNow(ms)`, `useAction(fn, {success})`, `usePageTitle(title)`.

## Cấu hình — `src/config/app.ts`

`APP_CONFIG.shop` (tên, giờ mở cửa, vị trí, hotline), `auth.schoolEmailDomains` (rỗng = chấp nhận mọi email), `fulfillment.pickup/delivery` (label, mô tả, phí, đơn tối thiểu, placeholder địa chỉ), `payment.qrExpiryMinutes`, `payment.vietqr`, `admin.pin`, `demo.seedOrders`, `demo.showPaymentSimulator`.

## UI kit — `@/components/ui`

| Component | Ghi chú |
|---|---|
| `Button` | `variant`: primary (espresso) · gold · **leaf (nút QR/thanh toán/thành công)** · outline · ghost · danger · light; `size`: sm/md/lg; `block`, `loading`, `leftIcon`, `rightIcon` |
| `IconButton` | bắt buộc `label` (aria); `tone`: default/dark/glass; `size` sm/md |
| `Card`, `SectionTitle` | thẻ trắng bo `rounded-3xl`; tiêu đề nhóm |
| `Input`, `TextArea` | `label`, `hint`, `error`, `required`, `icon` |
| `Segmented` | tab viên thuốc: `options[{value,label,icon,badge}]`, `value`, `onChange`, `tone` light/dark, `size` |
| `Badge`, `StatusBadge status=`, `TagBadge tag=` | nhãn trạng thái đơn / nhãn món (Bán chạy, Mới, Đặc trưng) |
| `QuantityStepper` | `value`, `onChange`, `min`, `max`, `size`, `onRemove` (nút trừ thành thùng rác ở min) |
| `EmptyState` | `icon`, `title`, `description`, `action` |
| `Skeleton` | khung chờ |
| `Logo` | logo CLOUD9 dạng mask — màu theo `text-*`, VD `<Logo className="h-8 text-cream" />` |
| `MenuImage` | ảnh món (URL/data URL/`@menu/key`) trên nền gradient ấm, có fallback emoji |
| `BottomSheet` | `open`, `onClose`, `title`, `footer`, `dismissible` — bảng trượt từ dưới, căn theo khung mobile |
| `ConfirmDialog` | `open`, `title`, `description`, `confirmText`, `tone` primary/danger/leaf, `loading`, `onConfirm`, `onCancel` |
| `PageHeader` | `title`, `subtitle`, `back` (true/đường dẫn), `right`, `tone` light/dark/transparent — thanh dính trên cùng, có safe-area |
| `Toaster` | đã gắn ở gốc app |

Component dùng chung khác: `@/components/order/OrderItemsList` (`OrderItemsList`, `OrderTotals`), `@/components/customer/FulfillmentPicker`, `@/components/menu/ItemDetailSheet` (props cố định: `item, open, onClose, editLine?`).

## Nhận diện thương hiệu (trích từ ảnh không gian quán)

Chủ đề: **“Golden hour ở Cloud 9”** — tường vữa nâu đồng, nắng chiều vàng hắt qua cửa sổ, ghế mây đan cam đất, chậu cây xanh, logo chữ trắng/đen hình học.

| Token Tailwind | Hex | Nguồn / dùng cho |
|---|---|---|
| `espresso` (`-900/-800/-700/-600`) | `#2A2218` | tường nâu đậm (vùng tối) — nền tối, chữ chính, nút chính |
| `bronze-50…900` | `#86694A` (500) | tường vữa nâu đồng — viền, nền phụ, chữ phụ ấm |
| `gold` (`light/soft/dark`) | `#D9AE63` | nắng vàng trên tường — điểm nhấn, chỉ báo đang chọn, số liệu nổi bật |
| `cream` (`dark`), `latte` | `#F6F2EA`, `#E8D9BE` | nền sáng, thẻ |
| `rattan` (`light/soft/dark`) | `#8C4F2E` | ghế mây — nhãn, badge số lượng, cảnh báo nhẹ, trạng thái “Đang chuẩn bị” |
| `leaf` (`light/soft/dark`) | `#5E7A2E` | chậu cây — **nút đặt hàng/thanh toán QR**, trạng thái thành công/sẵn sàng |
| `stone` (`light/soft`), `charcoal` | `#6F6254` | sàn đá, inox — chữ mờ, icon phụ |

- Font: `font-sans` = Be Vietnam Pro (nội dung), `font-display` = Montserrat (tiêu đề, giá, số liệu — gần với chữ logo).
- Bo góc lớn (`rounded-2xl`/`rounded-3xl`), bóng `shadow-card`/`shadow-lift`/`shadow-glow`; vùng chạm ≥ 44px.
- Ảnh thật trong `src/assets/photos/` (mỗi ảnh có bản `-sm` nhỏ hơn): `interior-wall` (tường logo + ghế mây + nắng), `espresso-bar` (máy espresso + logo nổi trên tường vữa — hợp làm hero tối), `corridor-plant` (hành lang + chậu cây, ảnh dọc), `counter` (quầy bánh + tủ kính). Import: `import heroUrl from '@/assets/photos/espresso-bar.webp'`.
- Ảnh tối làm nền phải có lớp phủ gradient `from-espresso-900/…` để chữ cream đủ tương phản.
- Tiếng Việt có dấu đầy đủ, giọng thân thiện, ngắn gọn. Tiền tệ luôn dùng `formatPrice`.

## Quy ước code

- Trang: `export default function TenPage()` trong `src/pages/...`; gọi `usePageTitle('...')`.
- Trang khách có tab bar đã được `CustomerLayout` chừa chỗ (`pb-tabbar`). Phần tử cố định phía dưới (thanh giỏ hàng) dùng `fixed inset-x-0 mx-auto max-w-md bottom-tabbar` để nằm trên tab bar. Trang không có tab bar (giỏ hàng, thanh toán, trạng thái đơn) tự thêm footer `fixed bottom-0 ... safe-bottom`.
- Luôn xử lý: đang tải (`useDataReady`), không tìm thấy, danh sách rỗng, lỗi (toast).
- Accessibility: `aria-label` cho nút icon, `role`/`aria-selected` cho tab, tương phản đủ.

## Song ngữ Tiếng Việt / English (i18n) — BẮT BUỘC cho mọi chữ hiển thị

- Thư viện tự viết trong `src/i18n` (không dùng package ngoài). Ngôn ngữ lưu ở `useLocale` (persist `c9.locale.v1`), mặc định theo ngôn ngữ trình duyệt.
- Trong component: `const { t, locale } = useT();` rồi `t('cart.title')`, có biến: `t('cart.items', { count: 3 })` (chuỗi có `{count}`). Ngoài React (store, service, toast): `translate('errors.cartEmpty')`.
- **Khai báo chữ**: tiếng Việt (bản gốc) ở `src/i18n/locales/vi/<nhóm>.ts`, tiếng Anh ở `src/i18n/locales/en/<nhóm>.ts` cùng cấu trúc (kiểu `MessageShape` — TypeScript báo lỗi nếu thiếu/thừa khoá). Khoá có dạng `<nhóm>.<khoá>` hoặc lồng nhau `<nhóm>.<phần>.<khoá>`.
- **Số nhiều tiếng Anh**: trong file en dùng `{ one: '1 item', other: '{count} items' }` (biến phải tên `count`); file vi để chuỗi thường.
- Nhóm dùng chung đã có (xem `locales/vi/core.ts`): `common`, `lang`, `nav`, `ui`, `notFound`, `connection`, `fulfillment`, `totals`, `status`, `notify`, `errors`, `time`, `loyalty`. Dùng lại khoá có sẵn (VD `common.cancel`, `common.save`, `totals.total`) thay vì tạo trùng.
- **Dữ liệu song ngữ** (món, tuỳ chọn, danh mục, dòng đơn): dùng `itemName(item)`, `itemDescription(item)`, `groupName(g)`, `choiceName(c)`, `categoryName(id)`, `lineName(line)` trong `src/lib/i18n-data.ts`; `CATEGORIES[i].name` tự đổi theo ngôn ngữ; `optionsSummary()` tự dịch. Thông tin quán: `pick(APP_CONFIG.shop.openingHours, APP_CONFIG.shop.openingHoursEn)` (`pick` từ `@/i18n`).
- Định dạng đã tự theo ngôn ngữ: `formatPrice`, `formatCompactPrice`, `formatWeekday`, `formatWeekdayLong`, `formatRelative`; `STATUS_META[s].label/description`, `stepLabel`, `nextActionLabel`, `notificationFor` cũng tự dịch.
- Đổi ngôn ngữ sẽ vẽ lại toàn bộ trang (Root dùng `key={locale}`), nên không cần lo chữ bị “kẹt”.
- Nút chọn ngôn ngữ: `<LanguageSwitch tone="light|dark" />` từ `@/components/ui`.
- Tiếng Anh: tự nhiên, ngắn gọn, thân thiện (café trong trường quốc tế); giữ tên riêng (Cloud 9, Microsoft 365, Bạc xỉu có nameEn sẵn…). `aria-label`, `title`, placeholder, toast, thông báo lỗi đều phải dịch.
- Ghi chú/comment trong code vẫn viết tiếng Việt như cũ.

## Tích điểm: mua 20 cốc tặng 1 cốc

- Cấu hình `APP_CONFIG.loyalty` (`cupsPerReward: 20`, danh mục tính “cốc”: cà phê + nước uống). Chỉ khách có tài khoản (Microsoft 365 / email demo) tích điểm; khách vãng lai không.
- Thẻ `LoyaltyAccount { stamps, totalCups, rewardsRedeemed }` lưu ở `loyalty/{customer.id}` (Firestore) / `c9.loyalty.v1` (local). **Chỉ thu ngân** cập nhật thẻ, trong cùng giao dịch xác nhận thanh toán (`applyLoyaltyOnPayment`): cộng số cốc nước của đơn (cốc miễn phí không tính), trừ 20 nếu đơn đổi thưởng (không đủ điểm → báo lỗi, không thu). Huỷ đơn đã thanh toán → hoàn điểm (`reverseLoyalty`).
- Đổi thưởng: khách bật “Dùng 1 cốc miễn phí” ở giỏ → `repo.createOrder({ ..., redeemReward: true })` → `order.discount` = giá 1 cốc nước đắt nhất (`rewardDiscount`), `order.loyaltyRedeem = true`. Sau khi thanh toán, `order.loyaltyEarned` = số cốc được cộng.
- Giao diện: `useLoyalty()` (`src/hooks/loyalty.ts`) → `{ enabled, member, stamps, progress, toNext, rewardsAvailable (đã trừ đơn đổi thưởng đang chờ), cupsPerReward, totalCups, pendingRedeemCodes }`; `useRewardLine(lines)` → dòng sẽ được miễn phí. Component `<LoyaltyCard variant="full|compact" onSignIn? signingIn? />` ở `@/components/loyalty/LoyaltyCard`. `repo.getLoyalty(customerId)` cho thu ngân xem điểm của khách.
- `OrderTotals` nhận `discount` + `loyaltyRedeem` để ghi “Cốc miễn phí (tích điểm)”.
- Hết hạn thanh toán: dùng `isExpiryCancel(order)` và `expiredReason()` từ `@/services/order-logic` (không so chuỗi tiếng Việt cố định).
