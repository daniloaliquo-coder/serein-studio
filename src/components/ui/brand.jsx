import { cn } from '../../lib/utils'

export function Brand({ name = 'Serein Studio', variant = 'light', size = 'default', className }) {
  const parts = String(name).trim().split(/\s+/)
  const primary = parts[0] || 'Serein'
  const secondary = parts.slice(1).join(' ') || 'Studio'
  const initial = primary.charAt(0).toUpperCase()

  const isDark = variant === 'dark'
  const isSmall = size === 'sm'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-full border font-display shadow-sm',
          isSmall ? 'h-9 w-9 text-base' : 'h-11 w-11 text-xl',
          isDark
            ? 'border-white/15 bg-cream-100 text-forest-950'
            : 'border-forest-800/10 bg-forest-800 text-cream-50',
        )}
        aria-hidden="true"
      >
        {initial}
      </span>
      <span className="leading-none">
        <span
          className={cn(
            'block font-display font-medium tracking-[0.16em] uppercase',
            isSmall ? 'text-lg' : 'text-xl',
            isDark ? 'text-cream-50' : 'text-forest-950',
          )}
        >
          {primary}
        </span>
        <span
          className={cn(
            'mt-1 block text-[8px] font-semibold uppercase tracking-[0.38em]',
            isDark ? 'text-cream-300/70' : 'text-muted',
          )}
        >
          {secondary}
        </span>
      </span>
    </div>
  )
}
