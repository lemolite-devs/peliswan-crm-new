import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/8 text-brand-primary dark:bg-brand-secondary/12 dark:text-brand-secondary [&_svg]:size-5">
            {icon}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-content">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-content-muted">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
