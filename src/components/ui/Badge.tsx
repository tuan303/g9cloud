import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { STATUS_META } from '@/lib/order-status';
import type { MenuTag, OrderStatus } from '@/types';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge className={cn(meta.badgeClass, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass, status === 'pending_payment' && 'animate-pulse')} />
      {meta.label}
    </Badge>
  );
}

const TAG_META: Record<MenuTag, { label: string; className: string }> = {
  bestseller: { label: 'Bán chạy', className: 'bg-gold text-espresso' },
  new: { label: 'Mới', className: 'bg-leaf text-white' },
  signature: { label: 'Đặc trưng', className: 'bg-rattan text-white' },
};

export function TagBadge({ tag, className }: { tag: MenuTag; className?: string }) {
  const m = TAG_META[tag];
  return <Badge className={cn('px-2 py-[1px] text-[10px] uppercase tracking-wide', m.className, className)}>{m.label}</Badge>;
}
