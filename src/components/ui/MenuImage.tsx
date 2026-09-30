import { useState } from 'react';
import { cn } from '@/lib/cn';
import { resolveMenuImage } from '@/lib/images';
import { useDataStore } from '@/store/data';
import type { CategoryId } from '@/types';

const FALLBACK: Record<CategoryId, string> = { coffee: '☕', drinks: '🧋', desserts: '🍰' };

/** Ảnh món trên nền gradient ấm; tự rơi về emoji nếu thiếu ảnh */
export function MenuImage({
  image,
  alt,
  categoryId,
  className,
  rounded = 'rounded-2xl',
}: {
  image?: string;
  alt: string;
  categoryId?: CategoryId;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  // "@item/<id>": ảnh tải lên của món — lấy từ thực đơn hiện tại (không chép ảnh nặng vào từng đơn)
  const itemId = image?.startsWith('@item/') ? image.slice(6) : undefined;
  const itemImage = useDataStore((s) => (itemId ? s.menu.find((m) => m.id === itemId)?.image : undefined));
  const effective = itemId ? itemImage : image;
  const src = resolveMenuImage(effective);
  const isIllustration = !!effective?.startsWith('@menu/');
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        'bg-[radial-gradient(circle_at_30%_25%,#FBF6EC_0%,#EFE3CC_55%,#E2CFAE_100%)]',
        rounded,
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className={cn('h-full w-full', isIllustration ? 'object-contain p-[8%]' : 'object-cover')}
        />
      ) : (
        <span className="text-4xl" aria-hidden>
          {FALLBACK[categoryId ?? 'coffee']}
        </span>
      )}
    </div>
  );
}
