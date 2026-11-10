import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-forest-800 text-paper-50 shadow-sm hover:bg-forest-900 hover:shadow-md active:translate-y-px',
        clay:
          'bg-bronze-500 text-white shadow-sm hover:bg-bronze-600 hover:shadow-md active:translate-y-px',
        outline:
          'border border-line bg-white text-forest-900 hover:border-forest-200 hover:bg-forest-50',
        ghost: 'text-forest-700 hover:bg-forest-50 hover:text-forest-900',
        soft: 'bg-paper-100 text-forest-800 hover:bg-paper-200',
        success:
          'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:translate-y-px',
        danger:
          'border border-red-200 bg-white text-red-600 hover:bg-red-50',
        whatsapp:
          'bg-[#128C7E] text-white shadow-sm hover:bg-[#0B6B60] active:translate-y-px',
        dark: 'bg-forest-950 text-paper-50 hover:bg-forest-900',
        link: 'h-auto rounded-none p-0 text-forest-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        default: 'h-11 px-5',
        lg: 'h-12 px-6 text-sm',
        xl: 'h-14 px-7 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export const Button = forwardRef(function Button(
  {
    className,
    variant,
    size,
    isLoading = false,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
})
