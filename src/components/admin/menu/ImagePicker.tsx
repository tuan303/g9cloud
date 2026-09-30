import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Check, ChevronDown, ImageOff, Loader2, TriangleAlert, Upload } from 'lucide-react';
import { CATEGORIES } from '@/data/menu';
import { cn } from '@/lib/cn';
import { MENU_ILLUSTRATIONS } from '@/lib/images';
import { toast } from '@/store/ui';
import { MenuImage } from '@/components/ui';
import type { CategoryId } from '@/types';
import { dataUrlBytes, formatBytes, IMAGE_MAX_SIDE, IMAGE_WARN_BYTES, resizeImageFile } from './image-resize';
import { ILLUSTRATION_META } from './menu-form';

const COLLAPSED_COUNT = 8;

const softBtn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition active:scale-[.97] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50';

/**
 * Chọn ảnh món: (a) minh hoạ có sẵn → "@menu/<key>", (b) tải ảnh / chụp ảnh → nén còn ≤640px, JPEG → data URL.
 */
export function ImagePicker({
  value,
  onChange,
  categoryId,
  itemName,
  busy,
  onBusyChange,
}: {
  value: string;
  onChange: (image: string) => void;
  categoryId: CategoryId;
  itemName: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [dimensions, setDimensions] = useState<{ image: string; width: number; height: number } | null>(null);
  // Chỉ hiện nút "Chụp ảnh" trên thiết bị cảm ứng (máy tính sẽ bỏ qua thuộc tính capture)
  const [canCapture] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches);

  // Minh hoạ cùng danh mục lên trước, còn lại theo thứ tự chữ cái
  const illustrations = useMemo(() => {
    const rank = (ref: string) => (ILLUSTRATION_META.get(ref)?.categoryId === categoryId ? 0 : 1);
    return [...MENU_ILLUSTRATIONS].sort((a, b) => rank(a.ref) - rank(b.ref));
  }, [categoryId]);
  const [showAll, setShowAll] = useState(() => illustrations.findIndex((il) => il.ref === value) >= COLLAPSED_COUNT);
  const visible = showAll ? illustrations : illustrations.slice(0, COLLAPSED_COUNT);
  const hiddenCount = illustrations.length - visible.length;

  const isIllustration = value.startsWith('@menu/');
  const isDataUrl = value.startsWith('data:');
  const bytes = isDataUrl ? dataUrlBytes(value) : 0;
  const heavy = bytes > IMAGE_WARN_BYTES;
  const category = CATEGORIES.find((c) => c.id === categoryId);

  let title = 'Chưa có ảnh';
  let detail = `Khách sẽ thấy biểu tượng ${category?.emoji ?? '☕'} mặc định.`;
  if (isIllustration) {
    title = 'Minh hoạ có sẵn';
    detail = ILLUSTRATION_META.get(value)?.name ?? 'Nét vẽ nhẹ, sắc nét trên mọi màn hình.';
  } else if (isDataUrl) {
    title = 'Ảnh tải lên';
    const dims = dimensions?.image === value ? `${dimensions.width}×${dimensions.height} · ` : '';
    detail = `${dims}${formatBytes(bytes)} · đã tối ưu`;
  } else if (value) {
    title = 'Ảnh từ đường dẫn';
    detail = 'Ảnh được tải từ máy chủ bên ngoài.';
  }

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng một tệp
    if (!file) return;
    onBusyChange(true);
    try {
      const out = await resizeImageFile(file);
      setDimensions({ image: out.dataUrl, width: out.width, height: out.height });
      onChange(out.dataUrl);
    } catch (err) {
      toast((err as Error)?.message || 'Không xử lý được ảnh', 'error');
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-3 shadow-card ring-1 ring-bronze-200/50">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            {/* key: MenuImage giữ trạng thái lỗi nội bộ → dựng lại khi đổi ảnh */}
            <MenuImage key={value} image={value} alt={itemName || 'Ảnh món'} categoryId={categoryId} className="h-24 w-24" />
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-espresso-900/45 text-cream">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="font-display text-[15px] font-bold text-espresso">{busy ? 'Đang xử lý ảnh…' : title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-stone">
              {busy ? `Đang thu nhỏ về tối đa ${IMAGE_MAX_SIDE}px` : detail}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => uploadRef.current?.click()}
            className={cn(softBtn, 'flex-1 bg-espresso text-cream shadow-card hover:bg-espresso-700')}
          >
            <Upload className="h-4 w-4" aria-hidden />
            Tải ảnh lên
          </button>
          {canCapture && (
            <button
              type="button"
              disabled={busy}
              onClick={() => captureRef.current?.click()}
              className={cn(softBtn, 'flex-1 bg-bronze-50 text-espresso ring-1 ring-inset ring-bronze-200 hover:bg-bronze-100')}
            >
              <Camera className="h-4 w-4" aria-hidden />
              Chụp ảnh
            </button>
          )}
          {value && (
            <button
              type="button"
              disabled={busy}
              aria-label="Bỏ ảnh"
              title="Bỏ ảnh"
              onClick={() => onChange('')}
              className={cn(softBtn, 'w-11 shrink-0 px-0 text-rattan-dark ring-1 ring-inset ring-rattan/30 hover:bg-rattan-soft')}
            >
              <ImageOff className="h-4 w-4" />
            </button>
          )}
        </div>

        <input ref={uploadRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={handleFile} />
        <input
          ref={captureRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={handleFile}
        />

        {heavy && (
          <p role="status" className="mt-3 flex items-start gap-2 rounded-2xl bg-rattan-soft px-3 py-2.5 text-xs leading-snug text-rattan-dark">
            <TriangleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden />
            <span>
              Ảnh khá nặng ({formatBytes(bytes)}). Bản demo lưu ảnh trong bộ nhớ trình duyệt nên có thể bị đầy — nên chọn ảnh
              đơn giản hơn hoặc dùng minh hoạ có sẵn.
            </span>
          </p>
        )}
      </div>

      {illustrations.length > 0 && (
        <div>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bronze-600">Hoặc chọn minh hoạ</p>
            <span className="text-xs text-stone">{illustrations.length} mẫu</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
            {visible.map((il) => {
              const selected = value === il.ref;
              const name = ILLUSTRATION_META.get(il.ref)?.name ?? il.key;
              return (
                <button
                  key={il.ref}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Minh hoạ ${name}`}
                  title={name}
                  disabled={busy}
                  onClick={() => onChange(il.ref)}
                  className={cn(
                    'relative aspect-square rounded-2xl p-1.5 transition active:scale-95 disabled:opacity-50',
                    'bg-[radial-gradient(circle_at_30%_25%,#FBF6EC_0%,#EFE3CC_55%,#E2CFAE_100%)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
                    selected ? 'shadow-glow ring-2 ring-gold ring-offset-2 ring-offset-cream' : 'ring-1 ring-inset ring-bronze-200/70 hover:ring-bronze-300',
                  )}
                >
                  <img src={il.url} alt="" loading="lazy" draggable={false} className="h-full w-full object-contain" />
                  {selected && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-espresso ring-2 ring-cream">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {(hiddenCount > 0 || showAll) && illustrations.length > COLLAPSED_COUNT && (
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-bronze-700 transition hover:bg-bronze-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {showAll ? 'Thu gọn' : `Xem thêm ${hiddenCount} minh hoạ`}
              <ChevronDown className={cn('h-4 w-4 transition-transform', showAll && 'rotate-180')} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
