import { useCallback, useState } from 'react';
import { Database, Eraser, RotateCcw } from 'lucide-react';
import { BACKEND } from '@/config/firebase';
import { repo } from '@/services';
import { useAction } from '@/hooks/useAction';
import { cn } from '@/lib/cn';
import { Button, ConfirmDialog } from '@/components/ui';

/** Công cụ dữ liệu mẫu (kín đáo, cuối trang): xoá đơn mẫu / khôi phục toàn bộ dữ liệu demo */
export function DemoDataTools({ demoCount, className }: { demoCount: number; className?: string }) {
  const [dialog, setDialog] = useState<'clear' | 'reset' | null>(null);
  const [clearDemo, clearing] = useAction(() => repo.clearDemoOrders(), { success: 'Đã xoá dữ liệu mẫu' });
  const cloud = BACKEND === 'firebase';
  const [resetAll, resetting] = useAction(() => repo.resetAll(), { success: cloud ? 'Đã tạo đơn mẫu 7 ngày' : 'Đã khôi phục dữ liệu demo' });
  const busy = clearing || resetting;
  const close = useCallback(() => {
    if (!busy) setDialog(null);
  }, [busy]);

  return (
    <section
      aria-labelledby="demo-tools-title"
      className={cn('rounded-3xl border border-dashed border-bronze-300 bg-bronze-50/70 p-4 md:flex md:items-center md:gap-6 md:p-5', className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-bronze-600 ring-1 ring-bronze-200">
          <Database className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 id="demo-tools-title" className="text-sm font-bold text-espresso">
            Dữ liệu mẫu
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-stone">
            {demoCount ? (
              <>
                Đang có <b className="font-semibold text-bronze-800">{demoCount} đơn mẫu</b> để biểu đồ có số liệu khi demo. Hãy xoá trước khi bán thật.
              </>
            ) : (
              'Không còn đơn mẫu — thống kê chỉ gồm đơn thật.'
            )}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:shrink-0">
        <Button variant="outline" leftIcon={<Eraser aria-hidden className="h-4 w-4" />} disabled={!demoCount || busy} onClick={() => setDialog('clear')}>
          Xoá dữ liệu mẫu
        </Button>
        <Button variant="ghost" leftIcon={<RotateCcw aria-hidden className="h-4 w-4" />} disabled={busy} onClick={() => setDialog('reset')}>
          {cloud ? 'Tạo đơn mẫu để xem thử' : 'Khôi phục dữ liệu demo'}
        </Button>
      </div>

      <ConfirmDialog
        open={dialog === 'clear'}
        tone="danger"
        title="Xoá dữ liệu mẫu?"
        description={`${demoCount} đơn mẫu sẽ bị xoá khỏi danh sách và thống kê. Đơn thật và thực đơn được giữ nguyên.`}
        confirmText="Xoá đơn mẫu"
        cancelText="Giữ lại"
        loading={clearing}
        onConfirm={async () => {
          await clearDemo();
          setDialog(null);
        }}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === 'reset'}
        tone={cloud ? 'primary' : 'danger'}
        title={cloud ? 'Tạo đơn mẫu 7 ngày?' : 'Khôi phục dữ liệu demo?'}
        description={
          cloud ? (
            <>
              Thêm khoảng 150 <b className="font-semibold text-bronze-800">đơn mẫu</b> (đánh dấu “mẫu”) để xem thử biểu đồ. Đơn thật và thực đơn được giữ
              nguyên; có thể xoá đơn mẫu bất cứ lúc nào.
            </>
          ) : (
          <>
            Thực đơn và <b className="font-semibold text-rattan-dark">toàn bộ đơn hàng — kể cả đơn thật</b> sẽ trở về dữ liệu mẫu ban đầu. Món, giá, ảnh đã chỉnh
            sửa cũng bị ghi đè. Không thể hoàn tác.
          </>
          )
        }
        confirmText={cloud ? 'Tạo đơn mẫu' : 'Khôi phục'}
        cancelText="Huỷ"
        loading={resetting}
        onConfirm={async () => {
          await resetAll();
          setDialog(null);
        }}
        onCancel={close}
      />
    </section>
  );
}
