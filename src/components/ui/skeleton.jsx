import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-paper-200/80', className)}
      aria-hidden="true"
      {...props}
    />
  )
}
