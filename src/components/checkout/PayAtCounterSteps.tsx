import { ScanLine, Store, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = [
  { icon: Store, text: 'Đến quầy Cloud\u00A09' },
  { icon: ScanLine, text: 'Đưa mã cho thu ngân quét' },
  { icon: Wallet, text: 'Thanh toán tiền mặt / chuyển khoản / thẻ' },
];

/** 3 bước thanh toán tại quầy — hiển thị ngay dưới mã QR */
export function PayAtCounterSteps({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Đường nối mảnh giữa các bước */}
      <span aria-hidden className="absolute left-[16.6%] right-[16.6%] top-5 border-t border-dashed border-bronze-300" />
      <ol className="relative grid grid-cols-3 gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s.text} className="relative flex flex-col items-center text-center">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-cream text-bronze-700 ring-1 ring-inset ring-bronze-200">
              <s.icon className="h-[18px] w-[18px]" aria-hidden />
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-gold font-display text-[10px] font-bold text-espresso ring-2 ring-white">
                {i + 1}
              </span>
            </span>
            <span className="mt-2 text-[12px] font-medium leading-snug text-bronze-800">{s.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
