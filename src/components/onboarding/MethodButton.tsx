import type { ReactNode } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'primary' | 'outline' | 'zalo' | 'microsoft';

const TONES: Record<Tone, { root: string; tile: string; sub: string }> = {
  primary: {
    root: 'bg-espresso text-cream shadow-lift hover:bg-espresso-700',
    tile: 'bg-gold text-espresso',
    sub: 'text-cream/70',
  },
  outline: {
    root: 'bg-white/70 text-espresso ring-1 ring-inset ring-bronze-300 hover:bg-white',
    tile: 'bg-bronze-100 text-bronze-700',
    sub: 'text-stone',
  },
  // Nút chính (nền espresso) với ô trắng chứa logo Microsoft
  microsoft: {
    root: 'bg-espresso text-cream shadow-lift hover:bg-espresso-700',
    tile: 'bg-white',
    sub: 'text-cream/70',
  },
  // Màu nhận diện Zalo — chỉ hiện khi chạy trong Zalo Mini App
  zalo: {
    root: 'bg-[#0068FF] text-white shadow-card hover:bg-[#005AE0]',
    tile: 'bg-white/15 text-white',
    sub: 'text-white/80',
  },
};

/** Nút lớn chọn cách đăng nhập: ô icon + tiêu đề + mô tả + mũi tên */
export function MethodButton({
  icon,
  title,
  description,
  tone = 'primary',
  loading,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: Tone;
  loading?: boolean;
  onClick: () => void;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className={cn(
        'group flex min-h-[72px] w-full items-center gap-3 rounded-3xl p-3 pr-3.5 text-left transition active:scale-[.985]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        'disabled:pointer-events-none disabled:opacity-70',
        t.root,
      )}
    >
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', t.tile)}>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-bold leading-snug">{title}</span>
        <span className={cn('mt-0.5 block text-[13px] leading-snug', t.sub)}>{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}
