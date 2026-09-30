import { useMemo } from 'react';
import { Check, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { optionChoicesSummary, optionRuleLabel, type OptionEntry } from './menu-form';

/** Danh sách nhóm tuỳ chọn dạng checkbox (Kích cỡ, Độ ngọt, Lượng đá, Topping...) */
export function OptionPicker({
  entries,
  selected,
  onToggle,
}: {
  entries: OptionEntry[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  // Các nhóm dùng chung group.id (VD "Thêm" và "Topping") chỉ chọn được một
  const sharedNotes = useMemo(() => {
    const byId = new Map<string, string[]>();
    for (const e of entries) byId.set(e.group.id, [...(byId.get(e.group.id) ?? []), e.group.name]);
    return [...byId.values()].filter((names) => names.length > 1);
  }, [entries]);

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const on = selected.includes(entry.key);
        const { group } = entry;
        return (
          <label
            key={entry.key}
            className={cn(
              'flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-inset transition active:scale-[.99]',
              on ? 'bg-gold-soft/50 ring-gold' : 'bg-white ring-bronze-200/70 hover:ring-bronze-300',
            )}
          >
            <input type="checkbox" className="peer sr-only" checked={on} onChange={() => onToggle(entry.key)} />
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2',
                on ? 'bg-espresso text-cream ring-espresso' : 'bg-white ring-bronze-300',
              )}
            >
              {on && <Check className="h-4 w-4" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[15px] font-semibold text-espresso">{group.name}</span>
                <span className="rounded-full bg-bronze-100 px-2 py-[1px] text-[10px] font-semibold uppercase tracking-wide text-bronze-700">
                  {optionRuleLabel(group)}
                </span>
                {entry.custom && (
                  <span className="rounded-full bg-rattan-soft px-2 py-[1px] text-[10px] font-semibold uppercase tracking-wide text-rattan-dark">
                    Riêng của món
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-stone">{optionChoicesSummary(group)}</span>
            </span>
          </label>
        );
      })}
      {sharedNotes.map((names) => (
        <p key={names.join('|')} className="flex items-start gap-1.5 px-1 pt-1 text-xs leading-snug text-stone">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-bronze-400" aria-hidden />
          {names.map((n) => `“${n}”`).join(' và ')} dùng chung một vị trí — mỗi món chỉ chọn được một nhóm.
        </p>
      ))}
    </div>
  );
}
