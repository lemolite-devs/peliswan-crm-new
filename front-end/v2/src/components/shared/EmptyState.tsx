import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10' : 'py-16',
        className,
      )}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-primary/5 text-brand-primary dark:bg-brand-secondary/10 dark:text-brand-secondary">
        <Icon className="size-7" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-base font-semibold text-content">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-content-muted">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
