import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, UtensilsCrossed } from 'lucide-react';
import { useMenu } from '@/hooks/data';
import { cn } from '@/lib/cn';

const tile =
  'group relative flex min-h-[112px] flex-col justify-between gap-3 rounded-3xl p-4 transition active:scale-[.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream';

/** Lối tắt theo mockup: Quản lý thực đơn · Xem đơn hàng */
export function QuickActions({ activeCount, className }: { activeCount: number; className?: string }) {
  const menu = useMenu();
  const soldOut = menu.filter((m) => !m.available).length;

  return (
    <nav aria-label="Lối tắt quản trị" className={cn('grid grid-cols-2 gap-3', className)}>
      <Link to="/admin/menu" className={cn(tile, 'bg-espresso text-cream shadow-lift hover:bg-espresso-700')}>
        <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold text-espresso">
          <UtensilsCrossed className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-display text-[15px] font-bold leading-tight">Quản lý thực đơn</span>
          <span className="mt-1 block text-xs text-cream/75">
            {menu.length} món{soldOut ? ` · ${soldOut} tạm hết` : ''}
          </span>
        </span>
        <ArrowRight aria-hidden className="absolute right-4 top-4 h-4 w-4 text-cream/60 transition group-hover:translate-x-0.5 group-hover:text-gold" />
      </Link>
      <Link to="/admin/orders" className={cn(tile, 'bg-white text-espresso shadow-card ring-1 ring-bronze-200/60 hover:ring-bronze-300')}>
        <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bronze-100 text-bronze-700">
          <ClipboardList className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-display text-[15px] font-bold leading-tight">Xem đơn hàng</span>
          <span className="mt-1 block text-xs text-stone">{activeCount ? `${activeCount} đơn đang xử lý` : 'Cập nhật trạng thái đơn'}</span>
        </span>
        <ArrowRight aria-hidden className="absolute right-4 top-4 h-4 w-4 text-stone-light transition group-hover:translate-x-0.5 group-hover:text-espresso" />
      </Link>
    </nav>
  );
}
