import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousActiveElement = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    window.setTimeout(() => closeButtonRef.current?.focus(), 30)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus()
      }
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-forest-950/45 backdrop-blur-[3px]"
        aria-label="Cerrar ventana"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative z-10 max-h-[92vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-3xl border border-white/70 bg-cream-50 shadow-float',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-5 border-b border-line/80 px-6 py-5">
          <div>
            <h2 id={titleId} className="font-display text-2xl tracking-tight text-forest-950">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-cream-200 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/30"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line/80 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
