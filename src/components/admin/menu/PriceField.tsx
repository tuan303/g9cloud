import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatDigits, PRICE_MAX_DIGITS } from './menu-form';

/**
 * Ô nhập giá VND: hiển thị dấu phân cách hàng nghìn ("35.000"), giữ nguyên vị trí con trỏ khi gõ giữa chừng.
 * `value` / `onChange` làm việc với chuỗi chỉ gồm chữ số.
 */
export const PriceField = forwardRef<
  HTMLInputElement,
  {
    label: string;
    value: string;
    onChange: (digits: string) => void;
    error?: string;
    hint?: string;
    required?: boolean;
    placeholder?: string;
  }
>(function PriceField({ label, value, onChange, error, hint, required, placeholder = '0' }, ref) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  // Số chữ số đứng trước con trỏ — dùng để đặt lại con trỏ sau khi định dạng
  const caretDigits = useRef<number | null>(null);
  const [tick, setTick] = useState(0);
  const display = formatDigits(value);

  useLayoutEffect(() => {
    const el = inputRef.current;
    const n = caretDigits.current;
    caretDigits.current = null;
    if (!el || n === null || document.activeElement !== el) return;
    let pos = 0;
    let seen = 0;
    while (pos < display.length && seen < n) {
      if (/\d/.test(display[pos])) seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
  }, [display, tick]);

  const describedBy = error || hint ? `${id}-desc` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block px-1 text-sm font-medium text-bronze-800">
        {label} {required && <span className="text-rattan">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="next"
          required={required}
          placeholder={placeholder}
          value={display}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const raw = e.target.value;
            const caret = e.target.selectionStart ?? raw.length;
            const all = raw.replace(/\D/g, '');
            const leadingZeros = /^0+(?=\d)/.exec(all)?.[0].length ?? 0;
            const next = all.slice(leadingZeros, leadingZeros + PRICE_MAX_DIGITS);
            const before = raw.slice(0, caret).replace(/\D/g, '').length - leadingZeros;
            caretDigits.current = Math.min(Math.max(0, before), next.length);
            setTick((t) => t + 1);
            onChange(next);
          }}
          className={cn(
            'h-12 w-full rounded-2xl bg-white pl-4 pr-16 font-display text-base font-semibold tabular-nums tracking-wide text-espresso',
            'ring-1 ring-inset placeholder:font-sans placeholder:font-normal placeholder:text-stone-light',
            'transition focus:outline-none focus:ring-2',
            error ? 'ring-rattan focus:ring-rattan' : 'ring-bronze-200 focus:ring-gold',
          )}
        />
        <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-display text-sm font-bold text-bronze-500">
          VND
        </span>
      </div>
      {(error || hint) && (
        <p id={describedBy} className={cn('px-1 text-xs', error ? 'text-rattan-dark' : 'text-stone')}>
          {error || hint}
        </p>
      )}
    </div>
  );
});
