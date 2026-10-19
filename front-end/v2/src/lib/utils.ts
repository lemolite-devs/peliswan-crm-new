import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Deterministic non-crypto hash for picking avatar colours etc. */
export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const AVATAR_PALETTE = [
  '#0F3D5C',
  '#E87722',
  '#00A878',
  '#7C3AED',
  '#0891B2',
  '#C2410C',
  '#65A30D',
  '#2563EB',
  '#DC2626',
  '#9333EA',
];

export function avatarColor(seed: string): string {
  return AVATAR_PALETTE[hashString(seed) % AVATAR_PALETTE.length] as string;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

/** Short non-crypto id generator for new records created in the browser. */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (out[key] ??= []).push(item);
  }
  return out;
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Defer cleanup — revoking the object URL synchronously after click can
  // cancel the download before the browser has started reading the blob.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 2000);
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
