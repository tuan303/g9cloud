import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl bg-white shadow-card ring-1 ring-bronze-200/50', className)} {...rest} />;
}

/** Tiêu đề nhóm nội dung: "Tóm tắt đơn hàng" + hành động bên phải */
export function SectionTitle({ title, action, className }: { title: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2.5 flex items-center justify-between px-1', className)}>
      <h2 className="font-display text-[15px] font-bold tracking-tight text-espresso">{title}</h2>
      {action}
    </div>
  );
}
