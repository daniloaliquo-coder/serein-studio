import {
  CalendarDays,
  Clock3,
  MessageCircle,
  Sparkles,
  Timer,
} from 'lucide-react'
import { cn, formatCurrency } from '../../lib/utils'
import { formatDuration, formatLongDate } from '../../lib/date'
import { StatusBadge } from '../ui/badge'

export function BookingSummary({ service, dateKey, time, className }) {
  const hasSelection = Boolean(service)

  return (
    <aside
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-white/10 bg-forest-900 p-6 text-cream-50 shadow-float',
        className,
      )}
      aria-label="Resumen de tu reserva"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-cream-100/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-4 top-8 h-32 w-32 rounded-full bg-clay-400/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-cream-200/65">
            Tu reserva
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-cream-200/65">
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            Sin pago online
          </span>
        </div>

        <h3 className="mt-5 font-display text-[1.7rem] leading-tight tracking-tight text-cream-50">
          {service ? service.name : 'Diseña tu momento'}
        </h3>
        <p className="mt-2 min-h-[2.5rem] text-xs leading-relaxed text-cream-200/60">
          {service
            ? service.description
            : 'Elige un servicio, una fecha y una hora. Nosotros nos encargamos del resto.'}
        </p>

        <div className="my-5 h-px bg-white/10" />

        <dl className="space-y-3.5 text-sm">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-clay-300" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-200/45">
                Fecha
              </dt>
              <dd className={cn('mt-0.5 leading-snug', dateKey ? 'text-cream-100' : 'text-cream-200/35')}>
                {dateKey ? formatLongDate(dateKey) : 'Aún sin elegir'}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-clay-300" aria-hidden="true" />
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-200/45">
                Hora
              </dt>
              <dd className={cn('mt-0.5 tabular-nums', time ? 'text-cream-100' : 'text-cream-200/35')}>
                {time || 'Aún sin elegir'}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Timer className="mt-0.5 h-4 w-4 shrink-0 text-clay-300" aria-hidden="true" />
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-200/45">
                Duración
              </dt>
              <dd className={cn('mt-0.5', service ? 'text-cream-100' : 'text-cream-200/35')}>
                {service ? formatDuration(service.duration_min) : 'Según el servicio'}
              </dd>
            </div>
          </div>
        </dl>

        <div className="my-5 h-px bg-white/10" />

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream-200/45">
              Total estimado
            </p>
            <p className={cn('mt-1 font-display text-3xl tabular-nums', hasSelection ? 'text-cream-50' : 'text-cream-200/30')}>
              {hasSelection ? formatCurrency(service.price) : '—'}
            </p>
          </div>
          <StatusBadge status="pending" className="mb-1 border-white/15 bg-white/10 text-cream-100" />
        </div>

        <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-[10px] leading-relaxed text-cream-200/50">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-300" aria-hidden="true" />
          Tu cita queda pendiente hasta que la confirmemos contigo por WhatsApp.
        </p>
      </div>
    </aside>
  )
}
