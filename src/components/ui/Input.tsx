import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full rounded-2xl bg-white px-4 text-base text-espresso placeholder:text-stone-light ring-1 ring-inset ring-bronze-200 ' +
  'transition focus:outline-none focus:ring-2 focus:ring-gold';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(function Input(
  { label, hint, error, icon, className, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block px-1 text-sm font-medium text-bronze-800">
          {label} {required && <span className="text-rattan">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bronze-400">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${inputId}-desc` : undefined}
          className={cn(base, 'h-12', icon && 'pl-11', error && 'ring-rattan focus:ring-rattan', className)}
          {...rest}
        />
      </div>
      {(error || hint) && (
        <p id={`${inputId}-desc`} className={cn('px-1 text-xs', error ? 'text-rattan-dark' : 'text-stone')}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(function TextArea(
  { label, hint, error, className, id, required, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block px-1 text-sm font-medium text-bronze-800">
          {label} {required && <span className="text-rattan">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={!!error || undefined}
        className={cn(base, 'resize-none py-3', error && 'ring-rattan', className)}
        {...rest}
      />
      {(error || hint) && <p className={cn('px-1 text-xs', error ? 'text-rattan-dark' : 'text-stone')}>{error || hint}</p>}
    </div>
  );
});
