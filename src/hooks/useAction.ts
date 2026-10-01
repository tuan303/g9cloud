import { translate } from '@/i18n';
import { useCallback, useState } from 'react';
import { toast } from '@/store/ui';

/**
 * Bọc một hành động bất đồng bộ (gọi repo): quản lý trạng thái loading và hiện toast lỗi.
 * const [run, loading] = useAction(async () => repo.confirmPayment(id), { success: 'Đã xác nhận' })
 */
export function useAction<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  opts: { success?: string; error?: string } = {},
) {
  const [loading, setLoading] = useState(false);
  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setLoading(true);
      try {
        const r = await fn(...args);
        if (opts.success) toast(opts.success, 'success');
        return r;
      } catch (err) {
        toast((err as Error)?.message || opts.error || translate('common.genericError'), 'error');
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, opts.success, opts.error],
  );
  return [run, loading] as const;
}
