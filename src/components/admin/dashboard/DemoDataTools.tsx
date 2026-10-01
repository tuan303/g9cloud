import { useCallback, useState } from 'react';
import { Database, Eraser, RotateCcw } from 'lucide-react';
import { BACKEND } from '@/config/firebase';
import { useT } from '@/i18n';
import { repo } from '@/services';
import { useAction } from '@/hooks/useAction';
import { cn } from '@/lib/cn';
import { Button, ConfirmDialog } from '@/components/ui';
import { Rich } from './Rich';

/** Công cụ dữ liệu mẫu (kín đáo, cuối trang): xoá đơn mẫu / khôi phục toàn bộ dữ liệu demo */
export function DemoDataTools({ demoCount, className }: { demoCount: number; className?: string }) {
  const { t } = useT();
  const [dialog, setDialog] = useState<'clear' | 'reset' | null>(null);
  const [clearDemo, clearing] = useAction(() => repo.clearDemoOrders(), { success: t('adminDashboard.demo.cleared') });
  const cloud = BACKEND === 'firebase';
  const [resetAll, resetting] = useAction(() => repo.resetAll(), {
    success: cloud ? t('adminDashboard.demo.seeded') : t('adminDashboard.demo.restored'),
  });
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
            {t('adminDashboard.demo.title')}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-stone">
            {demoCount ? (
              <Rich text={t('adminDashboard.demo.has', { count: demoCount })} className="font-semibold text-bronze-800" />
            ) : (
              t('adminDashboard.demo.none')
            )}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:shrink-0">
        <Button variant="outline" leftIcon={<Eraser aria-hidden className="h-4 w-4" />} disabled={!demoCount || busy} onClick={() => setDialog('clear')}>
          {t('adminDashboard.demo.clear')}
        </Button>
        <Button variant="ghost" leftIcon={<RotateCcw aria-hidden className="h-4 w-4" />} disabled={busy} onClick={() => setDialog('reset')}>
          {cloud ? t('adminDashboard.demo.seed') : t('adminDashboard.demo.restore')}
        </Button>
      </div>

      <ConfirmDialog
        open={dialog === 'clear'}
        tone="danger"
        title={t('adminDashboard.demo.clearTitle')}
        description={t('adminDashboard.demo.clearBody', { count: demoCount })}
        confirmText={t('adminDashboard.demo.clearConfirm')}
        cancelText={t('adminDashboard.demo.keep')}
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
        title={cloud ? t('adminDashboard.demo.seedTitle') : t('adminDashboard.demo.restoreTitle')}
        description={
          cloud ? (
            <Rich text={t('adminDashboard.demo.seedBody')} className="font-semibold text-bronze-800" />
          ) : (
            <Rich text={t('adminDashboard.demo.restoreBody')} className="font-semibold text-rattan-dark" />
          )
        }
        confirmText={cloud ? t('adminDashboard.demo.seedConfirm') : t('adminDashboard.demo.restoreConfirm')}
        cancelText={t('common.cancel')}
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
