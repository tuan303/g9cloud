import { useEffect, useState } from 'react';
import { ConfirmDialog, Input } from '@/components/ui';
import { useAction } from '@/hooks/useAction';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { repo } from '@/services';
import type { Order } from '@/types';

const QUICK_REASONS = ['Hết món', 'Khách yêu cầu', 'Không liên hệ được'];

/** Hộp thoại huỷ đơn (phía quán) — chọn nhanh lý do hoặc tự nhập */
export function CancelOrderDialog({
  order,
  open,
  onClose,
  onCancelled,
}: {
  order: Pick<Order, 'id' | 'code' | 'total' | 'paymentStatus'>;
  open: boolean;
  onClose: () => void;
  onCancelled?: (order: Order) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const [cancel, loading] = useAction((id: string, text: string) => repo.cancelOrder(id, text.trim() || undefined, 'staff'), {
    success: `Đã huỷ đơn ${order.code}`,
  });

  const submit = async () => {
    if (loading) return;
    const res = await cancel(order.id, reason);
    if (!res) return;
    onClose();
    onCancelled?.(res);
  };

  return (
    <ConfirmDialog
      open={open}
      title={`Huỷ đơn ${order.code}?`}
      tone="danger"
      confirmText="Huỷ đơn"
      cancelText="Giữ đơn"
      loading={loading}
      onConfirm={() => void submit()}
      onCancel={onClose}
      description={
        order.paymentStatus === 'paid' ? (
          <span>
            Khách đã trả <strong className="font-semibold text-rattan-dark">{formatPrice(order.total)}</strong> — nhớ hoàn tiền cho khách
            sau khi huỷ.
          </span>
        ) : (
          'Khách sẽ nhận được thông báo đơn đã bị huỷ.'
        )
      }
    >
      <fieldset className="mt-4">
        <legend className="px-1 text-sm font-medium text-bronze-800">Lý do huỷ</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_REASONS.map((r) => {
            const active = reason === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={active}
                onClick={() => setReason(active ? '' : r)}
                className={cn(
                  'h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-inset transition active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  active ? 'bg-espresso text-cream ring-espresso' : 'bg-white text-bronze-700 ring-bronze-200 hover:ring-bronze-300',
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <Input
            aria-label="Lý do khác"
            placeholder="Hoặc nhập lý do khác…"
            value={reason}
            maxLength={120}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            autoComplete="off"
          />
        </div>
      </fieldset>
    </ConfirmDialog>
  );
}
