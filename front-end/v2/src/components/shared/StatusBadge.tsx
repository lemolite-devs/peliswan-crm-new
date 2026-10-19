import { Badge } from '@/components/ui/badge';
import { STATUS_TONE, type BadgeTone } from '@/modules/leads/constants';

const DOT_COLOR: Record<BadgeTone, string> = {
  hot: 'bg-hot',
  warm: 'bg-warm',
  cold: 'bg-cold',
  followup: 'bg-followup',
  neutral: 'bg-content-muted',
  success: 'bg-success',
  danger: 'bg-danger',
  info: 'bg-info',
  brand: 'bg-brand-primary',
};

interface StatusBadgeProps {
  label?: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

/** Pill badge. Pass a lead status as `label` and the tone is picked for you. */
export function StatusBadge({ label, tone, size = 'md', dot, className }: StatusBadgeProps) {
  const resolvedTone: BadgeTone = tone ?? (label ? STATUS_TONE[label] : undefined) ?? 'neutral';
  return (
    <Badge tone={resolvedTone} size={size} uppercase className={className}>
      {dot && <span className={`size-1.5 rounded-full ${DOT_COLOR[resolvedTone]}`} />}
      {label || '—'}
    </Badge>
  );
}
