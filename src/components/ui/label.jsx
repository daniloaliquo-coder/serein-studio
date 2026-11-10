import { cn } from '../../lib/utils'

export function Label({ className, children, required = false, ...props }) {
  return (
    <label
      className={cn('mb-2 block text-xs font-semibold tracking-wide text-forest-900', className)}
      {...props}
    >
      {children}
      {required ? <span className="ml-1 text-bronze-500">*</span> : null}
    </label>
  )
}
