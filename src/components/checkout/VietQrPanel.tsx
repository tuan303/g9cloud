import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { buildVietQrPayload, toTransferMemo } from '@/lib/vietqr';
import type { AppConfig } from '@/config/app';
import type { Order } from '@/types';
import { QR_RESPONSIVE_CLASS, QrCode, QrFrame } from './QrCode';

type VietQrConfig = NonNullable<AppConfig['payment']['vietqr']>;

/** Mã VietQR chuyển khoản (có sẵn số tiền + nội dung) và thông tin tài khoản của quán */
export function VietQrPanel({ order, bank }: { order: Order; bank: VietQrConfig }) {
  const memoSource = `Cloud9 ${order.code}`;
  const memo = toTransferMemo(memoSource);
  const payload = useMemo(
    () => buildVietQrPayload({ bankBin: bank.bankBin, accountNo: bank.accountNo, amount: order.total, memo: memoSource }),
    [bank.bankBin, bank.accountNo, order.total, memoSource],
  );

  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: 'Ngân hàng', value: bank.bankName },
    { label: 'Số tài khoản', value: bank.accountNo, strong: true },
    { label: 'Chủ tài khoản', value: bank.accountName },
    { label: 'Số tiền', value: formatPrice(order.total), strong: true },
    { label: 'Nội dung', value: memo, strong: true },
  ];

  return (
    <div className="flex flex-col items-center">
      <QrFrame>
        <QrCode
          value={payload}
          level="M"
          margin={1}
          className={QR_RESPONSIVE_CLASS}
          label={`Mã VietQR chuyển khoản ${formatPrice(order.total)} cho đơn ${order.code}`}
        />
      </QrFrame>
      <p className="mt-4 text-center font-display text-[17px] font-bold text-espresso">Chuyển khoản VietQR</p>
      <p className="mt-0.5 text-center text-[13px] text-stone">Quét bằng app ngân hàng — số tiền và nội dung đã điền sẵn.</p>

      <dl className="mt-4 w-full divide-y divide-bronze-100 rounded-2xl bg-cream/80 px-4 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="shrink-0 text-stone">{r.label}</dt>
            <dd className={r.strong ? 'break-all text-right font-display font-bold tabular-nums text-espresso' : 'text-right font-medium text-espresso'}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 flex items-start gap-2 text-left text-xs leading-snug text-stone">
        <Info className="mt-px h-4 w-4 shrink-0 text-bronze-400" aria-hidden />
        Thu ngân sẽ xác nhận khi tiền về tài khoản quán — màn hình này tự chuyển sang “Đơn hàng đã nhận”.
      </p>
    </div>
  );
}
