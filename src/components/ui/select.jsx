import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Select = forwardRef(function Select(
  { className, wrapperClassName, children, ...props },
  ref,
) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          'h-11 w-full appearance-none rounded-xl border border-line bg-white px-3.5 pr-9 text-sm text-ink shadow-sm shadow-forest-950/[0.02] transition-colors focus:border-forest-400 focus:outline-none focus:ring-4 focus:ring-forest-500/10 disabled:cursor-not-allowed disabled:bg-cream-100 disabled:opacity-70',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  )
})
