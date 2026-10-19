import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select…', invalid }: MultiSelectProps) {
  const [search, setSearch] = useState('');
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-9 w-full items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-left text-base focus-ring',
            invalid && 'border-danger',
          )}
        >
          {value.length === 0 ? (
            <span className="text-content-muted">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {value.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-content-secondary"
                >
                  {labelOf(v)}
                  <X
                    className="size-3 cursor-pointer hover:text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(v);
                    }}
                  />
                </span>
              ))}
            </span>
          )}
          <ChevronDown className="ml-auto size-4 shrink-0 text-content-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full border-b border-line bg-transparent px-3 py-2 text-sm text-content outline-none"
        />
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-content-secondary hover:bg-muted"
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded border',
                  value.includes(opt.value)
                    ? 'border-brand-secondary bg-brand-secondary text-white'
                    : 'border-line',
                )}
              >
                {value.includes(opt.value) && <Check className="size-3" />}
              </span>
              {opt.label}
            </button>
          ))}
          {filtered.length === 0 && <p className="py-3 text-center text-xs text-content-muted">No options</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
