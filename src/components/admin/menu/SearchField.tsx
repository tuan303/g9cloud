import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Ô tìm kiếm có nút xoá nhanh (Esc cũng xoá) */
export function SearchField({
  value,
  onChange,
  placeholder = 'Tìm món…',
  label = 'Tìm món',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-bronze-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.stopPropagation();
            onChange('');
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          'h-11 w-full appearance-none rounded-2xl bg-white pl-11 pr-11 text-base text-espresso shadow-card ring-1 ring-inset ring-bronze-200',
          'placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-gold',
          '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Xoá từ khoá"
          onClick={() => onChange('')}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl text-stone transition hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
