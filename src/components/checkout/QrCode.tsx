import { useMemo, type ReactNode } from 'react';
import { create as createQr, type QRCodeErrorCorrectionLevel } from 'qrcode';
import { QrCode as QrIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Kích thước mã QR co giãn: tối đa 240px, thu nhỏ trên màn hình hẹp (≤ 360px) để không tràn khung */
export const QR_RESPONSIVE_CLASS = 'h-auto w-[min(240px,calc(100vw-128px))]';

/**
 * Mã QR dạng SVG, vẽ trực tiếp từ ma trận của thư viện `qrcode`:
 * sắc nét ở mọi mật độ điểm ảnh, không cần canvas. Giữ ô vuông chuẩn
 * (không bo góc, không logo đè lên) để máy POS / app ngân hàng quét nhanh.
 */
export function QrCode({
  value,
  size = 240,
  level = 'Q',
  margin = 0,
  dark = '#2A2218',
  light = '#FFFFFF',
  label = 'Mã QR',
  className,
}: {
  value: string;
  /** Kích thước hiển thị (px) */
  size?: number;
  level?: QRCodeErrorCorrectionLevel;
  /** Vùng trắng quanh mã, tính theo số module */
  margin?: number;
  dark?: string;
  light?: string;
  label?: string;
  className?: string;
}) {
  const qr = useMemo(() => {
    try {
      const { modules } = createQr(value, { errorCorrectionLevel: level });
      const n = modules.size;
      // Gộp các module tối liền nhau trên cùng hàng thành một đoạn → path gọn, không có khe hở
      let d = '';
      for (let r = 0; r < n; r++) {
        let c = 0;
        while (c < n) {
          if (!modules.data[r * n + c]) {
            c++;
            continue;
          }
          const start = c;
          while (c < n && modules.data[r * n + c]) c++;
          d += `M${start + margin} ${r + margin}h${c - start}v1h-${c - start}z`;
        }
      }
      return { dim: n + margin * 2, d };
    } catch {
      return null;
    }
  }, [value, level, margin]);

  if (!qr) {
    return (
      <div
        role="img"
        aria-label="Không tạo được mã QR"
        style={{ width: size, height: size }}
        className={cn('flex flex-col items-center justify-center gap-2 rounded-2xl bg-bronze-50 text-center text-xs text-stone', className)}
      >
        <QrIcon className="h-8 w-8 text-bronze-300" aria-hidden />
        Không tạo được mã QR
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${qr.dim} ${qr.dim}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className={cn('block', className)}
    >
      <rect width={qr.dim} height={qr.dim} fill={light} />
      <path d={qr.d} fill={dark} />
    </svg>
  );
}

/** Khung trắng cho mã QR với 4 góc nhấn vàng nắng — gợi khung ngắm của máy quét */
export function QrFrame({ children, className, dimmed }: { children: ReactNode; className?: string; dimmed?: boolean }) {
  const corner = 'pointer-events-none absolute h-8 w-8 border-gold';
  return (
    <div className={cn('relative inline-flex p-3', className)}>
      <span aria-hidden className={cn(corner, 'left-0 top-0 rounded-tl-[22px] border-l-[3px] border-t-[3px]')} />
      <span aria-hidden className={cn(corner, 'right-0 top-0 rounded-tr-[22px] border-r-[3px] border-t-[3px]')} />
      <span aria-hidden className={cn(corner, 'bottom-0 left-0 rounded-bl-[22px] border-b-[3px] border-l-[3px]')} />
      <span aria-hidden className={cn(corner, 'bottom-0 right-0 rounded-br-[22px] border-b-[3px] border-r-[3px]')} />
      <div className={cn('rounded-2xl bg-white p-3 ring-1 ring-bronze-100 transition', dimmed && 'opacity-20 blur-[2px]')}>{children}</div>
    </div>
  );
}
