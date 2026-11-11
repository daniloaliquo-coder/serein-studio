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
            ? 'border-white/15 bg-paper-100 text-forest-950'
            : 'border-forest-800/10 bg-forest-800 text-paper-50',
        )}
        aria-hidden="true"
      >
        {initial}
      </span>
      <span className="leading-none">
        <span
          className={cn(
            'block font-display font-medium tracking-eyebrow uppercase',
            isSmall ? 'text-lg' : 'text-xl',
            isDark ? 'text-paper-50' : 'text-forest-950',
          )}
        >
          {primary}
        </span>
        <span
          className={cn(
            'mt-1 block text-label-xs font-semibold uppercase tracking-label',
            isDark ? 'text-paper-300/70' : 'text-muted',
          )}
        >
          {secondary}
        </span>
      </span>
    </div>
  )
}
