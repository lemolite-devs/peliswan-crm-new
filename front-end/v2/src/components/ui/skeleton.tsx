import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton h-4 w-full', className)} {...props} />;
}

/** A table-shaped loading placeholder. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}
