import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[] | readonly SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className,
  disabled,
}: SelectFieldProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Build select options from a label record like LEAD_STATUS. */
export function optionsFromLabels(
  record: Record<string, { label: string }>,
): SelectOption[] {
  return Object.entries(record).map(([value, { label }]) => ({
    value,
    label,
  }));
}

export function optionsFromStrings(values: readonly string[]): SelectOption[] {
  return values.map((v) => ({ value: v, label: v }));
}
