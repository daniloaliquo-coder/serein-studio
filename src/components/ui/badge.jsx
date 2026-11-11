import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { STATUS_META } from '../../lib/defaults'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'border-forest-200 bg-forest-50 text-forest-700',
        neutral: 'border-line bg-white text-muted',
        pending: 'border-amber-200 bg-amber-50 text-amber-700',
        confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        cancelled: 'border-stone-200 bg-stone-100 text-stone-500',
        clay: 'border-bronze-200 bg-bronze-50 text-bronze-700',
        demo: 'border-bronze-200 bg-bronze-50 text-bronze-700',
        dark: 'border-white/15 bg-white/10 text-paper-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Badge({ className, variant, dot = false, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function StatusBadge({ status, className, dot = true }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  return (
    <Badge variant={meta.badgeTone} dot={dot} className={className}>
      {meta.label}
    </Badge>
  )
}
