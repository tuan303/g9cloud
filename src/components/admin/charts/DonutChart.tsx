import { useId } from 'react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** Tỷ trọng % đã làm tròn (hiển thị ở chú giải) */
  share: number;
  /** Lớp Tailwind `stroke-*` cho cung tròn */
  strokeClass: string;
  /** Lớp Tailwind `bg-*` cho chấm chú giải */
  dotClass: string;
  /** Dòng phụ ở chú giải, VD "124 phần" */
  note?: string;
}

/**
 * Biểu đồ tròn (donut) SVG thuần + chú giải có % và số tiền.
 * Tổng hiển thị ở giữa vòng.
 */
export function DonutChart({
  slices,
  title,
  description,
  centerValue,
  centerLabel,
  size = 148,
  thickness = 20,
  formatAmount = formatPrice,
  emptyLabel = 'Chưa có doanh thu',
  className,
}: {
  slices: DonutSlice[];
  title: string;
  description?: string;
  centerValue: string;
  centerLabel?: string;
  size?: number;
  thickness?: number;
  formatAmount?: (v: number) => string;
  emptyLabel?: string;
  className?: string;
}) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const c = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const visible = slices.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = visible.map((s) => {
    const full = (s.value / total) * circ;
    const len = Math.max(0.5, full - gap);
    const arc = { ...s, len, start: offset + gap / 2 };
    offset += full;
    return arc;
  });

  const desc = description ?? (total > 0 ? slices.map((s) => `${s.label}: ${s.share}% (${formatAmount(s.value)})`).join('; ') : emptyLabel);

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-5 gap-y-4', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg role="img" aria-labelledby={titleId} aria-describedby={descId} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          <title id={titleId}>{title}</title>
          <desc id={descId}>{desc}</desc>
          <circle cx={c} cy={c} r={r} fill="none" strokeWidth={thickness} className="stroke-bronze-100" />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              strokeWidth={thickness}
              strokeDasharray={`${a.len} ${circ - a.len}`}
              strokeDashoffset={-a.start}
              transform={`rotate(-90 ${c} ${c})`}
              className={cn('transition-[stroke-dasharray] duration-500', a.strokeClass)}
            >
              <title>{`${a.label}: ${a.share}% · ${formatAmount(a.value)}`}</title>
            </circle>
          ))}
        </svg>
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-lg font-extrabold leading-none tabular-nums text-espresso">{total > 0 ? centerValue : '0đ'}</span>
          {centerLabel && <span className="mt-1 text-[11px] font-medium text-stone">{centerLabel}</span>}
        </div>
      </div>

      <ul className="min-w-[150px] flex-1 space-y-1" aria-label={`Chú giải: ${title}`}>
        {slices.map((s) => (
          <li key={s.key} className="flex items-start gap-2.5 rounded-2xl px-1 py-1.5">
            <span aria-hidden className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', s.dotClass, s.value <= 0 && 'opacity-40')} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-espresso">{s.label}</span>
              <span className="block text-xs tabular-nums text-stone">
                {formatAmount(s.value)}
                {s.note && <span className="text-stone"> · {s.note}</span>}
              </span>
            </span>
            <span className="font-display text-[15px] font-bold tabular-nums text-espresso">{s.share}%</span>
          </li>
        ))}
        {total <= 0 && <li className="px-1 text-xs text-stone">{emptyLabel}</li>}
      </ul>
    </div>
  );
}
