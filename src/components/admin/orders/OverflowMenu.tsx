import { useEffect, useId, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface OverflowMenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: 'default' | 'danger';
}

/** Nút “⋯” mở danh sách thao tác phụ (mở lên trên — đặt ở chân thẻ) */
export function OverflowMenu({ label, items, className }: { label: string; items: OverflowMenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-14 w-12 items-center justify-center rounded-2xl bg-bronze-100 text-bronze-700 transition active:scale-95',
          'hover:bg-bronze-200 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          open && 'bg-bronze-200 text-espresso',
        )}
      >
        <EllipsisVertical className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute bottom-full right-0 z-30 mb-2 w-52 origin-bottom-right animate-pop-in rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-bronze-200"
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, tone }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSelect();
              }}
              className={cn(
                'flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold transition focus-visible:outline-none',
                tone === 'danger'
                  ? 'text-rattan-dark hover:bg-rattan-soft focus-visible:bg-rattan-soft'
                  : 'text-espresso hover:bg-bronze-100 focus-visible:bg-bronze-100',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
