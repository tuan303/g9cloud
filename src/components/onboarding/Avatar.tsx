import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { GUEST_NAME } from './helpers';

/** Ảnh đại diện: ảnh (Zalo) → chữ viết tắt → icon (khách chưa có tên) */
export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const hasName = !!name.trim() && name.trim() !== GUEST_NAME;
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-bronze-700 font-display font-extrabold text-gold-light',
        className,
      )}
    >
      {src && !failed ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : hasName ? (
        initials(name)
      ) : (
        <UserRound className="h-1/2 w-1/2" />
      )}
    </span>
  );
}
