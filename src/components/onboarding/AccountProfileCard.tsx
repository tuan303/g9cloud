import { Link } from 'react-router-dom';
import { ChevronRight, GraduationCap, IdCard, MessageCircle, Pencil, Phone, ReceiptText, UserRound, type LucideIcon } from 'lucide-react';
import interiorUrl from '@/assets/photos/interior-wall-sm.webp';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui';
import type { AuthProvider, CustomerInfo } from '@/types';
import { Avatar } from './Avatar';
import { GUEST_NAME, formatPhoneDisplay } from './helpers';

const PROVIDER: Record<AuthProvider, { label: string; icon: LucideIcon }> = {
  school_email: { label: 'Email trường', icon: GraduationCap },
  zalo: { label: 'Zalo', icon: MessageCircle },
  guest: { label: 'Khách', icon: UserRound },
};

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-inset ring-white/10">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-cream/65">
        <Icon className="h-3.5 w-3.5 text-gold" aria-hidden />
        {label}
      </dt>
      <dd className={cn('mt-1 truncate', value ? 'font-display text-[15px] font-bold tabular-nums' : 'text-sm text-cream/65')}>
        {value || 'Chưa có'}
      </dd>
    </div>
  );
}

/** Thẻ hồ sơ tối màu (espresso + vệt nắng vàng) ở đầu trang Tài khoản */
export function AccountProfileCard({
  user,
  onEdit,
  orderCount,
  activeCount,
  loading,
}: {
  user: CustomerInfo;
  onEdit: () => void;
  orderCount: number;
  activeCount: number;
  loading: boolean;
}) {
  const unnamed = user.isGuest && (!user.name.trim() || user.name === GUEST_NAME);
  const provider = PROVIDER[user.authProvider];
  const ProviderIcon = provider.icon;

  return (
    <section aria-label="Thông tin tài khoản" className="relative overflow-hidden rounded-[28px] bg-espresso text-cream shadow-lift">
      <img src={interiorUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-espresso-900/30 via-espresso/85 to-espresso-900" />
      <div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold/25 blur-3xl" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <Avatar
            name={user.name}
            src={user.avatar}
            className="h-16 w-16 text-xl ring-2 ring-gold ring-offset-[3px] ring-offset-espresso"
          />
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              'inline-flex h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-semibold text-cream ring-1 ring-inset ring-white/15',
              'backdrop-blur transition hover:bg-white/15 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            )}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Chỉnh sửa
          </button>
        </div>

        <h2 className="mt-4 break-words font-display text-[22px] font-extrabold leading-tight tracking-tight">
          {unnamed ? 'Xin chào bạn!' : user.name}
        </h2>
        <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {user.email && <span className="min-w-0 max-w-full truncate text-sm text-cream/75">{user.email}</span>}
          {user.isGuest ? (
            <Badge className="bg-gold text-espresso">
              <UserRound className="h-3 w-3" aria-hidden />
              Khách
            </Badge>
          ) : (
            <Badge className="bg-white/10 text-gold-light ring-1 ring-inset ring-white/10">
              <ProviderIcon className="h-3 w-3" aria-hidden />
              {provider.label}
            </Badge>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2">
          <InfoTile icon={Phone} label="Điện thoại" value={user.phone ? formatPhoneDisplay(user.phone) : undefined} />
          <InfoTile icon={IdCard} label="Mã HS / NV" value={user.studentId} />
        </dl>

        <div className="mt-4 border-t border-white/10 pt-2">
          <Link
            to={orderCount ? '/orders' : '/'}
            aria-busy={loading || undefined}
            className="-mx-2 flex min-h-12 items-center gap-3 rounded-2xl px-2 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ReceiptText className="h-5 w-5 shrink-0 text-gold" aria-hidden />
            <span className="min-w-0 flex-1 text-sm text-cream/80">
              {loading ? (
                <span className="block h-4 w-40 animate-pulse rounded-full bg-white/10" aria-label="Đang tải đơn hàng" />
              ) : orderCount ? (
                <>
                  <b className="font-display text-base text-cream">{orderCount}</b> đơn đã đặt
                  {activeCount > 0 && (
                    <>
                      {' · '}
                      <b className="font-display text-base text-gold">{activeCount}</b> đang xử lý
                    </>
                  )}
                </>
              ) : (
                'Chưa có đơn nào — gọi món ngay'
              )}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-cream/60" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
