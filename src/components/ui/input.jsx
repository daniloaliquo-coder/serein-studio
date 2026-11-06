import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink shadow-sm shadow-forest-950/[0.02] transition-colors placeholder:text-muted/60 focus:border-forest-400 focus:outline-none focus:ring-4 focus:ring-forest-500/10 disabled:cursor-not-allowed disabled:bg-cream-100 disabled:opacity-70',
        'aria-[invalid=true]:border-red-300 aria-[invalid=true]:focus:border-red-400 aria-[invalid=true]:focus:ring-red-500/10',
        className,
      )}
      {...props}
    />
  )
})
