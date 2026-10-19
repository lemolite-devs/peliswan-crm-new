import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border font-medium [&_svg]:size-3',
  {
    variants: {
      tone: {
        hot: 'border-transparent bg-hot-bg text-hot',
        warm: 'border-transparent bg-warm-bg text-warm',
        cold: 'border-transparent bg-cold-bg text-cold',
        followup: 'border-transparent bg-followup-bg text-followup',
        neutral: 'border-transparent bg-irrelevant-bg text-content-secondary',
        success: 'border-transparent bg-followup-bg text-success',
        danger: 'border-transparent bg-hot-bg text-danger',
        info: 'border-transparent bg-cold-bg text-info',
        brand: 'border-transparent bg-brand-primary/10 text-brand-primary dark:text-brand-secondary',
        outline: 'border-line bg-transparent text-content-secondary',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2 py-0.5 text-[11px]',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  uppercase?: boolean;
}

export function Badge({
  className,
  tone,
  size,
  uppercase,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants({ tone, size }),
        uppercase && 'uppercase tracking-[0.05em]',
        className,
      )}
      {...props}
    />
  );
}
