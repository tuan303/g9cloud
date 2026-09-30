import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'gold' | 'leaf' | 'outline' | 'ghost' | 'danger' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  // Nâu espresso — hành động chính
  primary: 'bg-espresso text-cream hover:bg-espresso-700 shadow-card',
  // Vàng nắng — nhấn mạnh
  gold: 'bg-gold text-espresso hover:bg-gold-light shadow-glow',
  // Xanh lá — nút đặt hàng/thanh toán QR (theo mockup)
  leaf: 'bg-leaf text-white hover:bg-leaf-dark shadow-card',
  outline: 'bg-white/70 text-espresso ring-1 ring-inset ring-bronze-300 hover:bg-white',
  ghost: 'bg-transparent text-bronze-700 hover:bg-bronze-100',
  danger: 'bg-white text-rattan-dark ring-1 ring-inset ring-rattan/40 hover:bg-rattan-soft',
  // Nút sáng trên nền tối
  light: 'bg-cream text-espresso hover:bg-white shadow-card',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-4 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, loading, leftIcon, rightIcon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition active:scale-[.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // aria-label bắt buộc
  tone?: 'default' | 'dark' | 'glass' | 'onDark';
  size?: 'sm' | 'md';
}

/** Nút tròn chỉ có icon (quay lại, đóng, tuỳ chọn...) */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tone = 'default', size = 'md', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        size === 'md' ? 'h-11 w-11' : 'h-9 w-9',
        tone === 'default' && 'text-espresso hover:bg-bronze-100',
        tone === 'dark' && 'bg-espresso text-cream hover:bg-espresso-700',
        tone === 'glass' && 'bg-black/30 text-white backdrop-blur-md hover:bg-black/40',
        tone === 'onDark' && 'text-cream hover:bg-white/10',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
