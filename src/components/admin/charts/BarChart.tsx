import { useId, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatCompactPrice } from '@/lib/format';
import { useChartWidth } from './useChartWidth';

export interface BarDatum {
  key: string;
  /** Nhãn trục dưới, VD "T4" hoặc "9h" */
  label: string;
  /** Dòng phụ dưới nhãn, VD "30/09" */
  sublabel?: string;
  value: number;
  /** Mô tả đầy đủ (trình đọc màn hình + tooltip), VD "T4 30/09: 1.245.000đ · 32 đơn" */
  description?: string;
}

export interface BarChartProps {
  data: BarDatum[];
  /** Tiêu đề cho trình đọc màn hình (<title>) */
  title: string;
  /** Mô tả (<desc>) — mặc định liệt kê toàn bộ giá trị */
  description?: string;
  height?: number;
  /** Định dạng nhãn giá trị trên đầu cột (mặc định: tiền rút gọn "1,2tr") */
  formatValue?: (value: number) => string;
  /** Cột tô vàng (mặc định: cột cuối — hôm nay). null = không tô */
  highlightIndex?: number | null;
  /** Cột đang chọn (chạm để xem chi tiết) */
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
  /** Hiện nhãn giá trị: true | 'nonzero' (ẩn nhãn của cột 0) | false */
  showValues?: boolean | 'nonzero';
  emptyLabel?: string;
  className?: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Đường viền cột bo tròn hai góc trên */
function barPath(x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h));
  return `M${r1(x)},${r1(y + h)}V${r1(y + r)}A${r1(r)},${r1(r)} 0 0 1 ${r1(x + r)},${r1(y)}H${r1(x + w - r)}A${r1(r)},${r1(r)} 0 0 1 ${r1(x + w)},${r1(y + r)}V${r1(y + h)}Z`;
}

/**
 * Biểu đồ cột dọc SVG thuần — không thư viện.
 * viewBox khớp chiều rộng thật của khung nên chữ luôn rõ ở 375px.
 */
export function BarChart({
  data,
  title,
  description,
  height = 200,
  formatValue = formatCompactPrice,
  highlightIndex,
  selectedIndex = null,
  onSelect,
  showValues = true,
  emptyLabel = 'Chưa có dữ liệu',
  className,
}: BarChartProps) {
  const [ref, width] = useChartWidth<HTMLDivElement>();
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const n = Math.max(1, data.length);
  const hl = highlightIndex === undefined ? data.length - 1 : highlightIndex;
  const interactive = !!onSelect;
  const hasSub = data.some((d) => d.sublabel);
  const max = Math.max(0, ...data.map((d) => d.value));

  const padX = 2;
  const top = showValues ? 22 : 8;
  const bottom = hasSub ? 38 : 24;
  const plotH = Math.max(20, height - top - bottom);
  const baseY = top + plotH;
  const colW = (width - padX * 2) / n;
  const barW = Math.max(6, Math.min(colW * 0.58, 40));
  const radius = Math.min(8, barW / 2);
  const small = colW < 32;
  // Quá hẹp thì chỉ hiện nhãn trục xen kẽ
  const labelStep = colW < 20 ? 2 : 1;

  const desc =
    description ?? data.map((d) => d.description ?? `${d.label}${d.sublabel ? ` ${d.sublabel}` : ''}: ${formatValue(d.value)}`).join('; ');

  const onKey = (e: KeyboardEvent<SVGGElement>, i: number) => {
    if (!onSelect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(i);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = Math.min(data.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)));
      onSelect(next);
      const sibling = (e.currentTarget.parentNode as Element | null)?.querySelectorAll<SVGGElement>('[data-bar]')[next];
      sibling?.focus();
    }
  };

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <svg
        role={interactive ? 'group' : 'img'}
        aria-labelledby={titleId}
        aria-describedby={descId}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block select-none overflow-visible"
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{desc}</desc>

        {/* Lưới mờ + đường đáy */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={r1(baseY - plotH * f)}
            y2={r1(baseY - plotH * f)}
            className="stroke-bronze-100"
            strokeDasharray="3 5"
            aria-hidden
          />
        ))}
        <line x1={padX} x2={width - padX} y1={baseY + 0.5} y2={baseY + 0.5} className="stroke-bronze-200" aria-hidden />

        {data.map((d, i) => {
          const isHl = i === hl;
          const isSel = i === selectedIndex;
          const cx = padX + colW * i + colW / 2;
          const x = cx - barW / 2;
          const h = max > 0 && d.value > 0 ? Math.max(4, (d.value / max) * plotH) : 3;
          const y = baseY - h;
          const fill =
            d.value <= 0
              ? 'fill-bronze-100'
              : isHl
                ? isSel
                  ? 'fill-gold-dark'
                  : 'fill-gold'
                : isSel
                  ? 'fill-bronze-500'
                  : 'fill-bronze-300';
          const showValue = showValues === true || (showValues === 'nonzero' && d.value > 0);
          const strong = isHl || isSel;
          const label = d.description ?? `${d.label}${d.sublabel ? ` ${d.sublabel}` : ''}: ${formatValue(d.value)}`;

          return (
            <g
              key={d.key}
              data-bar=""
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? (isSel || (selectedIndex === null && i === data.length - 1) ? 0 : -1) : undefined}
              aria-label={interactive ? label : undefined}
              aria-pressed={interactive ? isSel : undefined}
              onClick={interactive ? () => onSelect?.(i) : undefined}
              onKeyDown={interactive ? (e) => onKey(e, i) : undefined}
              className={cn(interactive && 'group cursor-pointer outline-none')}
            >
              <title>{label}</title>
              {/* Vùng chạm cả cột */}
              <rect x={r1(padX + colW * i)} y={0} width={r1(colW)} height={height} fill="transparent" />
              {isSel && (
                <rect
                  x={r1(padX + colW * i + 2)}
                  y={top - 18}
                  width={r1(Math.max(0, colW - 4))}
                  height={plotH + 18 + bottom - 2}
                  rx={10}
                  className="fill-bronze-50"
                  aria-hidden
                />
              )}
              {interactive && (
                <rect
                  x={r1(padX + colW * i + 2)}
                  y={top - 18}
                  width={r1(Math.max(0, colW - 4))}
                  height={plotH + 18 + bottom - 2}
                  rx={10}
                  strokeWidth={2}
                  className="fill-none stroke-gold opacity-0 group-focus-visible:opacity-100"
                  aria-hidden
                />
              )}
              <path d={barPath(x, y, barW, h, radius)} className={cn('transition-colors', fill)} />
              {showValue && max > 0 && (
                <text
                  x={r1(cx)}
                  y={r1(y - 6)}
                  textAnchor="middle"
                  fontSize={small ? 10 : 11}
                  fontWeight={strong ? 700 : 600}
                  className={cn('font-display tabular-nums', strong ? 'fill-espresso' : 'fill-stone')}
                >
                  {formatValue(d.value)}
                </text>
              )}
              {i % labelStep === 0 && (
                <text
                  x={r1(cx)}
                  y={baseY + 15}
                  textAnchor="middle"
                  fontSize={small ? 10 : 11}
                  fontWeight={strong ? 700 : 600}
                  className={cn('font-display', strong ? 'fill-espresso' : 'fill-stone')}
                >
                  {d.label}
                </text>
              )}
              {d.sublabel && i % labelStep === 0 && (
                <text x={r1(cx)} y={baseY + 29} textAnchor="middle" fontSize={10} className={cn(strong ? 'fill-bronze-700' : 'fill-stone')}>
                  {d.sublabel}
                </text>
              )}
            </g>
          );
        })}

        {max <= 0 && (
          <text x={width / 2} y={top + plotH / 2} textAnchor="middle" fontSize={12} className="fill-stone" aria-hidden>
            {emptyLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
