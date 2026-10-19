import { cn } from '@/lib/utils';

interface LogoProps {
  showWordmark?: boolean;
  className?: string;
  size?: 'md' | 'lg';
  /** Light text for use on the dark brand panel. */
  inverted?: boolean;
}

/** Brand mark + wordmark. Swap the SVG for the Peliswan logo when ready. */
export function Logo({ showWordmark = true, className, size = 'md', inverted }: LogoProps) {
  const lg = size === 'lg';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 512 512" className={cn('shrink-0', lg ? 'size-10' : 'size-8')} aria-hidden="true">
        <defs>
          <linearGradient id="peliswanTile" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#134668" />
            <stop offset="1" stopColor="#0C3149" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="118" fill="url(#peliswanTile)" />
        <g transform="translate(111,111) scale(2.9)" fill="none">
          <rect x="24" y="58" width="13" height="22" rx="4" fill="#2B6088" />
          <rect x="43.5" y="44" width="13" height="36" rx="4" fill="#2B6088" />
          <rect x="63" y="30" width="13" height="50" rx="4" fill="#F47719" />
          <path d="M26 50 L46 40 L69 22" stroke="#F47719" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="69" cy="22" r="6.5" fill="#F47719" />
        </g>
      </svg>
      {showWordmark && (
        <div className="leading-tight">
          <div
            className={cn(
              'font-display',
              inverted ? 'text-white' : 'text-content',
              lg ? 'text-lg font-extrabold' : 'text-base font-bold',
            )}
          >
            Peli<span className="text-brand-secondary">swan</span>
          </div>
          <div
            className={cn(
              'font-medium uppercase tracking-wider',
              inverted ? 'text-white/60' : 'text-content-muted',
              lg ? 'text-[11px]' : 'text-[10px]',
            )}
          >
            Sales CRM
          </div>
        </div>
      )}
    </div>
  );
}
