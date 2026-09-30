import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { trapTab } from '@/lib/focus-trap';
import { IconButton } from './Button';

let openCount = 0;
function lockScroll() {
  if (openCount++ === 0) document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  if (--openCount <= 0) {
    openCount = 0;
    document.body.style.overflow = '';
  }
}

/**
 * Bảng trượt từ dưới lên (chi tiết món, chọn hình thức nhận, xác nhận...).
 * Luôn căn giữa theo khung mobile (max-w-md) để khớp bố cục trên desktop.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  bodyClassName,
  hideHandle,
  dismissible = true,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  hideHandle?: boolean;
  dismissible?: boolean;
  /** Nhãn cho trình đọc màn hình khi không có `title` dạng chuỗi */
  ariaLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Giữ onClose/dismissible mới nhất trong ref để hiệu ứng mở chỉ chạy lại khi `open` đổi
  // (tránh cướp focus khỏi ô nhập mỗi lần component cha render lại).
  const latest = useRef({ onClose, dismissible });
  latest.current = { onClose, dismissible };

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && latest.current.dismissible) latest.current.onClose();
      // Hộp thoại xác nhận mở chồng lên (z cao hơn) tự giữ focus của nó
      if (!document.querySelector('[role="alertdialog"]')) trapTab(e, panelRef.current);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      unlockScroll();
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-espresso-900/55 backdrop-blur-[2px]" onClick={dismissible ? onClose : undefined} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
        tabIndex={-1}
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-md animate-slide-up flex-col',
          'rounded-t-[28px] bg-cream shadow-lift outline-none',
          className,
        )}
      >
        {!hideHandle && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-bronze-200" aria-hidden />}
        {title !== undefined && (
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-1 pt-3">
            <h2 className="font-display text-lg font-bold text-espresso">{title}</h2>
            {dismissible && (
              <IconButton label="Đóng" size="sm" onClick={onClose} className="-mr-1 bg-bronze-100">
                <X className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-2', bodyClassName)}>{children}</div>
        {footer && <div className="safe-bottom shrink-0 border-t border-bronze-200/70 bg-cream/95 px-5 pt-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
