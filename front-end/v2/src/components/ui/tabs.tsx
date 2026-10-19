import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex items-center gap-1 overflow-x-auto border-b border-line',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative -mb-px whitespace-nowrap border-b-2 border-transparent px-3.5 py-2.5 text-base font-medium text-content-muted transition-colors hover:text-content-secondary focus-ring data-[state=active]:border-brand-secondary data-[state=active]:text-content',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

/** Pill-style segmented control (e.g. Kanban / Table view toggle). */
export const SegmentTabs = TabsPrimitive.Root;

export const SegmentList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-0.5 rounded-md border border-line bg-muted p-0.5',
      className,
    )}
    {...props}
  />
));
SegmentList.displayName = 'SegmentList';

export const SegmentTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium text-content-muted transition-colors hover:text-content focus-ring data-[state=active]:bg-surface data-[state=active]:text-content data-[state=active]:shadow-sm [&_svg]:size-3.5',
      className,
    )}
    {...props}
  />
));
SegmentTrigger.displayName = 'SegmentTrigger';
