import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Keyboard, Search } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { PendingPaymentList } from '@/components/admin/scan/PendingPaymentList';
import { QrScanner, type ScanSource } from '@/components/admin/scan/QrScanner';
import { ScanResultSheet } from '@/components/admin/scan/ScanResultSheet';
import { useDataReady, useOrder, useOrders } from '@/hooks/data';
import { useAction } from '@/hooks/useAction';
import { useNow } from '@/hooks/useNow';
import { usePageTitle } from '@/hooks/usePageTitle';
import { parseOrderQrPayload } from '@/lib/qr';
import { platform } from '@/platform';
import { repo } from '@/services';
import { toast } from '@/store/ui';
import type { Order } from '@/types';

type LookupSource = ScanSource | 'manual';

/** Chờ một chút rồi mới mở lại camera khi mã không hợp lệ (tránh quét lặp liên tục) */
const RESUME_DELAY_MS = 1_500;
/** Không báo lỗi lặp lại cho cùng một mã sai trong khoảng này */
const REPEAT_MISS_MS = 8_000;

export default function AdminScanPage() {
  usePageTitle('Quét QR');
  const ready = useDataReady();
  const orders = useOrders();
  const now = useNow(15_000);

  const [scanning, setScanning] = useState(() => !platform.canNativeScan);
  const [selected, setSelected] = useState<Order | null>(null);
  const [code, setCode] = useState('');
  const resumeAfterClose = useRef(false);
  const resumeTimer = useRef<number | undefined>(undefined);
  const lastMiss = useRef<{ raw: string; at: number } | null>(null);

  // Luôn hiển thị bản mới nhất của đơn (trạng thái có thể đổi từ thiết bị khác)
  const live = useOrder(selected?.id);
  const sheetOrder = live ?? selected ?? undefined;

  const pending = useMemo(
    () => orders.filter((o) => o.status === 'pending_payment').sort((a, b) => b.createdAt - a.createdAt),
    [orders],
  );

  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  const [find, finding] = useAction(async (raw: string) => ({ order: await repo.findOrderByScan(raw) }));

  const openOrder = useCallback((order: Order, resume: boolean) => {
    window.clearTimeout(resumeTimer.current);
    resumeAfterClose.current = resume;
    setScanning(false);
    setSelected(order);
  }, []);

  const closeSheet = useCallback(() => {
    setSelected(null);
    if (resumeAfterClose.current) setScanning(true);
    resumeAfterClose.current = false;
  }, []);

  const reportMiss = (text: string, source: LookupSource) => {
    const prev = lastMiss.current;
    lastMiss.current = { raw: text, at: Date.now() };
    if (source === 'camera' && prev && prev.raw === text && Date.now() - prev.at < REPEAT_MISS_MS) return;
    const parsed = parseOrderQrPayload(text);
    if (parsed.code) toast(`Không tìm thấy đơn ${parsed.code} hôm nay`, 'error');
    else if (parsed.orderId) toast('Không tìm thấy đơn này', 'error');
    else if (source === 'manual') toast('Mã chưa đúng — nhập dạng C9-027 hoặc 27', 'error');
    else toast('Mã QR này không phải mã đơn Cloud 9', 'error');
  };

  const lookup = async (raw: string, source: LookupSource) => {
    const text = raw.trim();
    if (!text) return;
    const res = await find(text);
    if (res?.order) {
      platform.vibrate(40);
      openOrder(res.order, source === 'camera' || scanning);
      if (source === 'manual') setCode('');
      return;
    }
    if (res) reportMiss(text, source);
    // Không tìm thấy / lỗi → mở lại camera sau giây lát
    if (source === 'camera') {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => setScanning(true), RESUME_DELAY_MS);
    }
  };

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    if (!finding) void lookup(code, 'manual');
  };

  return (
    <div className="px-4 pb-6 pt-5 md:px-6 md:pt-8 lg:px-8">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bronze-600">Quầy thu ngân</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-espresso md:text-3xl">Quét mã &amp; thu tiền</h1>
        <p className="mt-1 max-w-prose text-sm text-stone">Quét mã QR trên điện thoại của khách, kiểm tra đơn rồi xác nhận đã thu tiền.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-5 lg:gap-8">
        <section aria-label="Quét mã đơn" className="space-y-4 md:sticky md:top-6">
          <QrScanner
            active={scanning}
            onActiveChange={setScanning}
            onDetected={(text, source) => void lookup(text, source)}
            busy={finding && !selected}
          />

          <Card className="p-4">
            <form onSubmit={submitManual} className="flex items-end gap-2" role="search" aria-label="Tìm đơn theo mã">
              <div className="min-w-0 flex-1">
                <Input
                  label="Nhập mã đơn"
                  placeholder="VD: C9-027 hoặc 27"
                  icon={<Keyboard className="h-5 w-5" />}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="search"
                />
              </div>
              <Button type="submit" className="h-12 shrink-0 px-5" loading={finding} disabled={!code.trim()} leftIcon={<Search className="h-4 w-4" />}>
                Tìm
              </Button>
            </form>
          </Card>
        </section>

        <section aria-labelledby="pending-payment-title">
          <PendingPaymentList orders={pending} now={now} loading={!ready} onSelect={(o) => openOrder(o, scanning)} />
        </section>
      </div>

      <ScanResultSheet order={sheetOrder} open={selected !== null} onClose={closeSheet} />
    </div>
  );
}
