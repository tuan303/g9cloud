import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, FlaskConical, Info, Mail, MessageCircle, ShieldCheck, Store, UserRound } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui';
import { FulfillmentPicker } from '@/components/customer/FulfillmentPicker';
import {
  Avatar,
  EMPTY_PROFILE,
  GUEST_NAME,
  LOGIN_RULES,
  MethodButton,
  ProfileFields,
  StepHeader,
  WelcomeHero,
  callName,
  focusFirstInvalid,
  formatPhoneDisplay,
  redirectTarget,
  toProfileData,
  useProfileForm,
} from '@/components/onboarding';
import { useAction } from '@/hooks/useAction';
import { usePageTitle } from '@/hooks/usePageTitle';
import { platform, type PlatformProfile } from '@/platform';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import type { AuthProvider, FulfillmentType } from '@/types';

type Stage = 'method' | 'profile' | 'fulfillment';

const { pickup, delivery } = APP_CONFIG.fulfillment;
/** Bước 2 chỉ cần khi có “Giao tận nơi” (phải hỏi địa chỉ); chỉ nhận tại quầy thì bỏ qua */
const HAS_FULFILLMENT_STEP = delivery.enabled;
const STEP_LABELS = HAS_FULFILLMENT_STEP ? ['Đăng nhập', 'Nhận món'] : ['Đăng nhập'];
const IS_ZALO = platform.name === 'zalo';

const PROFILE_COPY: Record<AuthProvider, { title: string; description: string }> = {
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
};

function initialFulfillment(saved: FulfillmentType): FulfillmentType {
  if (saved === 'delivery' ? delivery.enabled : pickup.enabled) return saved;
  return pickup.enabled ? 'pickup' : 'delivery';
}

export default function WelcomePage() {
  usePageTitle('Đăng nhập');
  const navigate = useNavigate();
  const location = useLocation();
  const from = redirectTarget(location.state);

  const user = useSession((s) => s.user);
  const login = useSession((s) => s.login);
  const saveFulfillment = useSession((s) => s.setFulfillment);
  const savedFulfillment = useSession((s) => s.fulfillment);
  const savedAddress = useSession((s) => s.deliveryAddress);

  const [stage, setStage] = useState<Stage>('method');
  const [method, setMethod] = useState<AuthProvider>('school_email');
  const [zaloProfile, setZaloProfile] = useState<PlatformProfile | null>(null);
  const form = useProfileForm(EMPTY_PROFILE);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>(() => initialFulfillment(savedFulfillment));
  const [address, setAddress] = useState(savedAddress);
  const [addressError, setAddressError] = useState<string>();

  const sheetRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStage = useRef(stage);

  // Sang bước mới: cuộn lên đầu và đưa tiêu điểm về tiêu đề để trình đọc màn hình đọc bước mới
  useEffect(() => {
    if (prevStage.current === stage) return;
    prevStage.current = stage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  }, [stage]);

  const [fetchZaloProfile, zaloLoading] = useAction(async () => {
    const profile = await platform.getProfile();
    if (!profile) throw new Error('Chưa lấy được thông tin Zalo. Bạn thử lại hoặc chọn cách khác nhé.');
    return profile;
  });

  // Đã đăng nhập → vào thẳng app (đặt sau các hook)
  if (user) return <Navigate to={from} replace />;

  const rules = LOGIN_RULES[method];

  const choose = (m: AuthProvider) => {
    setMethod(m);
    form.resetErrors();
    setStage('profile');
  };

  const chooseZalo = async () => {
    const profile = await fetchZaloProfile();
    if (!profile) return;
    setZaloProfile(profile);
    form.setValues((v) => ({ ...v, name: v.name.trim() ? v.name : profile.name }));
    choose('zalo');
  };

  const finish = () => {
    const addr = address.trim();
    if (fulfillment === 'delivery' && !addr) {
      setAddressError('Vui lòng nhập nơi giao, VD: Lớp 8A1 – Tầng 3');
      focusFirstInvalid(sheetRef.current);
      return;
    }
    const data = toProfileData(form.values, rules);
    let name: string;
    switch (method) {
      case 'school_email':
        // id cố định theo email → đăng nhập lại vẫn thấy lịch sử đơn cũ
        name = login({
          id: `school_${data.email}`,
          name: data.name,
          email: data.email,
          phone: data.phone,
          studentId: data.studentId,
          isGuest: false,
          authProvider: 'school_email',
        }).name;
        break;
      case 'zalo':
        if (!zaloProfile) {
          setStage('method');
          return;
        }
        name = login({
          id: `zalo_${zaloProfile.id}`,
          name: data.name,
          phone: data.phone,
          studentId: data.studentId,
          avatar: zaloProfile.avatar,
          isGuest: false,
          authProvider: 'zalo',
        }).name;
        break;
      case 'guest':
        name = login({ name: data.name || GUEST_NAME, phone: data.phone, isGuest: true, authProvider: 'guest' }).name;
        break;
    }
    saveFulfillment(fulfillment, fulfillment === 'delivery' ? addr : undefined);
    toast(`Chào mừng ${callName(name)} đến với Cloud 9!`, 'success');
    navigate(from, { replace: true });
  };

  const submitProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.validate(rules)) {
      focusFirstInvalid(e.currentTarget);
      return;
    }
    if (HAS_FULFILLMENT_STEP) setStage('fulfillment');
    else finish();
  };

  const submitFulfillment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    finish();
  };

  const heading = 'mt-5 font-display text-[22px] font-extrabold leading-tight tracking-tight text-espresso outline-none';
  const lead = 'mt-1 text-sm leading-relaxed text-stone';

  // Tóm tắt người đang đăng nhập (hiện ở bước 2)
  const draft = toProfileData(form.values, rules);
  const whoName = draft.name || GUEST_NAME;
  const whoDetail =
    method === 'school_email'
      ? draft.email
      : [method === 'zalo' ? 'Tài khoản Zalo' : 'Khách', draft.phone && formatPhoneDisplay(draft.phone)].filter(Boolean).join(' · ');

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <WelcomeHero compact={stage !== 'method'} />

      <div
        ref={sheetRef}
        className="safe-bottom relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[32px] bg-cream shadow-[0_-12px_32px_rgba(28,22,14,0.28)]"
      >
        <div key={stage} className="flex flex-1 flex-col px-5 pt-6 motion-safe:animate-fade-in">
          {/* ───────── Bước 1a: chọn cách đăng nhập ───────── */}
          {stage === 'method' && (
            <>
              <StepHeader step={1} labels={STEP_LABELS} />
              <h2 ref={headingRef} tabIndex={-1} className={heading}>
                Chọn cách đăng nhập
              </h2>
              <p className={lead}>Chưa đến một phút là xong.</p>

              <div className="mt-5 space-y-3">
                <MethodButton
                  icon={<Mail className="h-5 w-5" />}
                  title="Đăng nhập bằng email trường"
                  description="Lưu lịch sử đơn, gọi lại món quen"
                  onClick={() => choose('school_email')}
                />
                {IS_ZALO && (
                  <MethodButton
                    tone="zalo"
                    icon={<MessageCircle className="h-5 w-5" />}
                    title="Đăng nhập bằng Zalo"
                    description="Dùng tên và ảnh đại diện Zalo của bạn"
                    loading={zaloLoading}
                    onClick={chooseZalo}
                  />
                )}
                {APP_CONFIG.auth.allowGuest && (
                  <>
                    <div aria-hidden className="flex items-center gap-3 px-2 text-xs font-medium text-stone">
                      <span className="h-px flex-1 bg-bronze-200" />
                      hoặc
                      <span className="h-px flex-1 bg-bronze-200" />
                    </div>
                    <MethodButton
                      tone="outline"
                      icon={<UserRound className="h-5 w-5" />}
                      title="Tiếp tục với tư cách khách"
                      description="Gọi món ngay, không cần tài khoản"
                      onClick={() => choose('guest')}
                    />
                  </>
                )}
              </div>

              <p className="mt-6 flex gap-2.5 px-1 text-xs leading-relaxed text-stone">
                <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-leaf" aria-hidden />
                Cloud 9 chỉ dùng tên và số điện thoại để xử lý đơn và báo bạn khi món sẵn sàng.
              </p>

              <div className="mt-auto flex justify-center pb-1 pt-6">
                <Link
                  to="/admin/login"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-bronze-700 transition hover:bg-bronze-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Store className="h-4 w-4" aria-hidden />
                  Nhân viên quán? Vào trang quản trị
                </Link>
              </div>
            </>
          )}

          {/* ───────── Bước 1b: thông tin cá nhân ───────── */}
          {stage === 'profile' && (
            <>
              <StepHeader step={1} labels={STEP_LABELS} onBack={() => setStage('method')} />
              <h2 ref={headingRef} tabIndex={-1} className={heading}>
                {PROFILE_COPY[method].title}
              </h2>
              <p className={lead}>{PROFILE_COPY[method].description}</p>

              {method === 'zalo' && zaloProfile && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-bronze-200/50">
                  <Avatar name={zaloProfile.name} src={zaloProfile.avatar} className="h-10 w-10 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-espresso">{zaloProfile.name}</p>
                    <p className="text-xs text-leaf-dark">Đã kết nối với Zalo</p>
                  </div>
                  <BadgeCheck className="h-5 w-5 shrink-0 text-leaf" aria-hidden />
                </div>
              )}

              {method === 'guest' && (
                <div className="mt-4 flex gap-2.5 rounded-2xl bg-gold-soft/70 p-3.5 text-[13px] leading-snug text-bronze-800 ring-1 ring-inset ring-gold/40">
                  <Info className="mt-px h-4 w-4 shrink-0 text-rattan" aria-hidden />
                  <p>Tên và số điện thoại chưa bắt buộc lúc này, nhưng sẽ cần khi thanh toán để quán gọi bạn ra nhận món.</p>
                </div>
              )}

              <form noValidate onSubmit={submitProfile} className="mt-5 flex flex-1 flex-col">
                <ProfileFields
                  form={form}
                  rules={rules}
                  phoneHint={method === 'guest' ? 'Không bắt buộc · cần khi thanh toán' : undefined}
                />
                {method === 'school_email' && (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-bronze-100/70 px-3 py-2 text-xs text-bronze-700">
                    <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Bản thử nghiệm: chưa gửi mã xác thực
                  </p>
                )}
                <div className="mt-auto pb-2 pt-6">
                  <Button type="submit" size="lg" block rightIcon={<ArrowRight className="h-5 w-5" aria-hidden />}>
                    {HAS_FULFILLMENT_STEP ? 'Tiếp tục' : 'Bắt đầu gọi món'}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* ───────── Bước 2: hình thức nhận món ───────── */}
          {stage === 'fulfillment' && (
            <>
              <StepHeader step={2} labels={STEP_LABELS} onBack={() => setStage('profile')} />
              <h2 ref={headingRef} tabIndex={-1} className={heading}>
                Bạn muốn nhận món thế nào?
              </h2>
              <p className={lead}>Chọn cách quen thuộc của bạn — khi đặt từng đơn vẫn đổi được.</p>

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-2.5 pl-3 shadow-card ring-1 ring-bronze-200/50">
                <Avatar
                  name={whoName}
                  src={method === 'zalo' ? zaloProfile?.avatar : undefined}
                  className="h-10 w-10 text-sm ring-2 ring-gold ring-offset-2 ring-offset-white"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-espresso">{whoName}</p>
                  {whoDetail && <p className="truncate text-xs text-stone">{whoDetail}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setStage('profile')}
                  aria-label="Sửa thông tin đăng nhập"
                  className="min-h-11 shrink-0 rounded-full px-3.5 text-sm font-semibold text-bronze-700 transition hover:bg-bronze-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  Sửa
                </button>
              </div>

              <form noValidate onSubmit={submitFulfillment} className="mt-5 flex flex-1 flex-col">
                <FulfillmentPicker
                  value={fulfillment}
                  onChange={(v) => {
                    setFulfillment(v);
                    setAddressError(undefined);
                  }}
                  address={address}
                  onAddressChange={(v) => {
                    setAddress(v);
                    setAddressError(undefined);
                  }}
                  addressError={addressError}
                />
                <div className="mt-auto pb-2 pt-6">
                  <Button type="submit" size="lg" block rightIcon={<ArrowRight className="h-5 w-5" aria-hidden />}>
                    Bắt đầu gọi món
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
