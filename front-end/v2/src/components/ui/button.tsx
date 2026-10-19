import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-colors focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-primary text-white hover:bg-brand-hover shadow-sm',
        secondary:
          'bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-sm',
        outline:
          'border border-line bg-surface text-content hover:bg-muted',
        ghost: 'text-content-secondary hover:bg-muted hover:text-content',
        danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
        success: 'bg-success text-white hover:bg-success/90 shadow-sm',
        link: 'text-brand-secondary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm [&_svg]:size-4',
        md: 'h-9 px-4 [&_svg]:size-4',
        lg: 'h-10 px-5 [&_svg]:size-5',
        icon: 'h-9 w-9 [&_svg]:size-4',
        'icon-sm': 'h-8 w-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
