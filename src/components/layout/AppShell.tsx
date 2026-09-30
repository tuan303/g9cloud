import type { ReactNode } from 'react';
import interior from '@/assets/photos/interior-wall.webp';
import { cn } from '@/lib/cn';

/**
 * Khung ứng dụng khách: trên điện thoại chiếm toàn màn hình; trên màn hình lớn hiển thị
 * như một khung điện thoại ở giữa, phía sau là ảnh không gian quán làm mờ.
 */
export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative min-h-dvh">
      <div
        aria-hidden
        className="fixed inset-0 hidden bg-cover bg-center opacity-40 blur-sm md:block"
        style={{ backgroundImage: `url(${interior})` }}
      />
      <div aria-hidden className="fixed inset-0 hidden bg-espresso-900/60 md:block" />
      <div className={cn('relative mx-auto min-h-dvh w-full max-w-md bg-cream md:shadow-[0_0_60px_rgba(0,0,0,.45)]', className)}>
        {children}
      </div>
    </div>
  );
}
