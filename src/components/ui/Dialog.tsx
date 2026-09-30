import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { trapTab } from '@/lib/focus-trap';
import { Button } from './Button';

/** Hộp thoại xác nhận ở giữa màn hình */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Đồng ý',
  cancelText = 'Để sau',
  tone = 'primary',
  loading,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger' | 'leaf';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;
  const confirmRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus({ preventScroll: true });
    // Bắt ở pha capture và chặn lan truyền: Esc chỉ đóng hộp thoại, không đóng bảng trượt phía dưới
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cancelRef.current();
      }
      trapTab(e, boxRef.current);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 animate-fade-in bg-espresso-900/55" onClick={onCancel} />
      <div ref={boxRef} role="alertdialog" aria-modal="true" aria-label={title} className="relative w-full max-w-sm animate-pop-in rounded-3xl bg-cream p-6 shadow-lift">
        <h2 className="font-display text-lg font-bold text-espresso">{title}</h2>
        {description && <div className="mt-2 text-sm text-stone">{description}</div>}
        {children}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" block onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            ref={confirmRef}
            variant={tone === 'danger' ? 'primary' : tone}
            className={cn(tone === 'danger' && 'bg-rattan-dark hover:bg-rattan')}
            block
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
