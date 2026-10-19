import { avatarColor, initials, cn } from '@/lib/utils';

interface EntityAvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES: Record<NonNullable<EntityAvatarProps['size']>, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-9 text-[13px]',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
};

export function EntityAvatar({
  name,
  src,
  size = 'md',
  className,
}: EntityAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-1 ring-black/5',
        SIZES[size],
        className,
      )}
      style={src ? undefined : { backgroundColor: avatarColor(name) }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}
