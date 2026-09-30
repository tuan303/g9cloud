import logoUrl from '@/assets/brand/logo.png';
import { cn } from '@/lib/cn';

/**
 * Logo CLOUD9 · BAKERY · CAFE — dùng làm mặt nạ (mask) nên đổi màu theo `color` của CSS.
 * VD: <Logo className="h-8 text-cream" />
 */
export function Logo({ className, title = 'Cloud 9 Bakery · Cafe' }: { className?: string; title?: string }) {
  return (
    <span
      role="img"
      aria-label={title}
      className={cn('inline-block aspect-[491/173] bg-current', !/(^|\s)!?h-/.test(className ?? '') && 'h-8', className)}
      style={{
        WebkitMaskImage: `url(${logoUrl})`,
        maskImage: `url(${logoUrl})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}
