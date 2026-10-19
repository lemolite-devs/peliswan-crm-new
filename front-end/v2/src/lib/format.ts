import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

/** 16 Oct 2026 */
export function formatDate(value?: string | null): string {
  const d = toDate(value);
  return d ? format(d, 'dd MMM yyyy') : '—';
}

/** 16 Oct 2026, 10:42 am */
export function formatDateTime(value?: string | null): string {
  const d = toDate(value);
  return d ? format(d, 'dd MMM yyyy, h:mm a') : '—';
}

/** "3 hours ago" */
export function formatRelative(value?: string | null): string {
  const d = toDate(value);
  return d ? `${formatDistanceToNowStrict(d)} ago` : '—';
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
}
