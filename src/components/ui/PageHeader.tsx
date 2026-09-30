import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

/**
 * Thanh tiêu đề dính trên cùng. `back`:
 *  - true  → quay lại trang trước (hoặc `fallback` nếu mở trực tiếp)
 *  - string → điều hướng tới đường dẫn đó
 */
export function PageHeader({
  title,
  subtitle,
  back,
  fallback = '/',
  right,
  tone = 'light',
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  back?: boolean | string;
  fallback?: string;
  right?: ReactNode;
  tone?: 'light' | 'dark' | 'transparent';
  className?: string;
}) {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof back === 'string') navigate(back);
    else if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
  return (
    <header
      className={cn(
        'safe-top sticky top-0 z-30',
        tone === 'light' && 'border-b border-bronze-200/60 bg-cream/90 backdrop-blur-md',
        tone === 'dark' && 'bg-espresso text-cream',
        tone === 'transparent' && 'bg-transparent',
        className,
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        <div className="flex w-12 justify-start">
          {back && (
            <IconButton label="Quay lại" onClick={goBack} tone={tone === 'transparent' ? 'glass' : tone === 'dark' ? 'onDark' : 'default'}>
              <ArrowLeft className="h-5 w-5" />
            </IconButton>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center">
          {title && <h1 className="truncate font-display text-[17px] font-bold tracking-tight">{title}</h1>}
          {subtitle && <p className={cn('truncate text-xs', tone === 'dark' ? 'text-cream/70' : 'text-stone')}>{subtitle}</p>}
        </div>
        <div className="flex min-w-12 justify-end">{right}</div>
      </div>
    </header>
  );
}
