import heroUrl from '@/assets/photos/espresso-bar.webp';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/ui';
import { greetingFor } from './helpers';

/**
 * Ảnh quầy espresso thật (logo 3D trên tường vữa nằm trọn ở nửa trên) + lớp phủ espresso và vệt nắng vàng.
 * Khối chữ đặt ở dưới, trên nền tối, để không chồng lên logo trong ảnh.
 * `compact` thu gọn ảnh khi người dùng đang điền form để chừa chỗ cho bàn phím.
 */
export function WelcomeHero({ compact }: { compact: boolean }) {
  const greeting = greetingFor(new Date().getHours());
  return (
    <section
      aria-label="Chào mừng đến Cloud 9"
      className={cn(
        'relative shrink-0 overflow-hidden bg-espresso-900 transition-[height] duration-500 ease-out motion-reduce:transition-none',
        compact ? 'h-[max(26dvh,190px)]' : 'h-[max(46dvh,330px)]',
      )}
    >
      <img
        src={heroUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover object-center"
      />
      {/* Lớp phủ: hơi tối ở trên (thanh trạng thái), trong ở giữa (thấy logo tường), đậm dần ở dưới (cho chữ cream) */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-espresso-900/60 to-transparent" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-espresso-900 via-espresso-900/75 via-45% to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(90%_55%_at_80%_20%,rgba(217,174,99,0.22),transparent_70%)]"
      />

      <div className="safe-top relative flex h-full flex-col px-6">
        {/* Logo nhỏ như thanh thương hiệu — logo 3D trên tường trong ảnh là “nhân vật chính” */}
        <div className="flex h-14 shrink-0 items-center">
          <Logo className="h-7 text-cream" />
        </div>
        <div className={cn('mt-auto [text-shadow:0_1px_12px_rgba(28,22,14,0.75)]', compact ? 'pb-12' : 'pb-14')}>
          <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-gold">{greeting}</p>
          {!compact && (
            <div className="motion-safe:animate-fade-in">
              <h1 className="mt-1.5 font-display text-[27px] font-extrabold leading-[1.15] tracking-tight text-cream text-balance">
                Hôm nay mình uống gì nhỉ?
              </h1>
              <p className="mt-2 max-w-[21rem] text-[15px] leading-relaxed text-cream/85">
                Cà phê &amp; bánh nướng mỗi ngày — gọi món nhanh, nhận món ngay tại trường.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
