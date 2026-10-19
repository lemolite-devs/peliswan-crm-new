import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-content-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Two-column responsive grid for form fields. */
export function FormGrid({
  children,
  cols = 2,
  className,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section divider inside a form. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-content">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-content-muted">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
