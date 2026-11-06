import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const ToastContext = createContext(null)

const TONE_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const TONE_STYLES = {
  success: 'border-emerald-200 bg-white text-emerald-700',
  error: 'border-red-200 bg-white text-red-600',
  info: 'border-forest-200 bg-white text-forest-700',
}

function ToastItem({ item, onDismiss }) {
  const Icon = TONE_ICONS[item.tone] || Info

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 4800)
    return () => window.clearTimeout(timer)
  }, [item.id, onDismiss])

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-2xl border p-4 shadow-float',
        TONE_STYLES[item.tone] || TONE_STYLES.info,
      )}
      role="status"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-forest-950">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="rounded-full p-1 text-muted transition-colors hover:bg-cream-100 hover:text-forest-900"
        aria-label="Cerrar notificación"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(({ title, description = '', tone = 'success' }) => {
    counter.current += 1
    const id = counter.current
    setToasts((current) => [...current.slice(-2), { id, title, description, tone }])
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[370px]"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider.')
  }
  return context
}
