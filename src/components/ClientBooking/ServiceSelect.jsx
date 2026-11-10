import {
  Check,
  Clock3,
  Crown,
  Droplets,
  Hand,
  Leaf,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { cn, formatCurrency } from '../../lib/utils'
import { formatDuration } from '../../lib/date'

function ServiceIcon({ name }) {
  const normalized = name.toLowerCase()
  let Icon = Sparkles

  if (normalized.includes('corte')) Icon = Scissors
  else if (normalized.includes('color') || normalized.includes('balayage')) Icon = Droplets
  else if (normalized.includes('facial') || normalized.includes('ritual')) Icon = Sparkles
  else if (normalized.includes('manicura') || normalized.includes('uña')) Icon = Hand
  else if (normalized.includes('masaje')) Icon = Leaf
  else if (normalized.includes('peinado')) Icon = Crown

  return <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.7} />
}

export function ServiceSelect({ services, selectedId, onSelect }) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-tight text-forest-700">
            Elige tu ritual
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            ¿Qué necesitas hoy?
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Cada servicio incluye una breve consulta para adaptar el ritual a tu cabello, piel
            y ritmo.
          </p>
        </div>
        <Badge variant="neutral" className="w-fit shrink-0 py-1.5">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          {services.length} rituales disponibles
        </Badge>
      </div>

      {services.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-paper-50 px-6 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-bronze-500 shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">
            Estamos actualizando la carta de servicios
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
            Vuelve en unos minutos o escríbenos directamente para encontrar el hueco que
            necesitas.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const isSelected = selectedId === service.id

          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(service)}
              className={cn(
                'group relative flex min-h-[14rem] flex-col rounded-[2rem] border p-5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-500/40 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-bronze-600 bg-bronze-50 ring-1 ring-bronze-600/15'
                  : 'border-line bg-white hover:-translate-y-1 hover:border-bronze-200 hover:shadow-card',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors',
                    isSelected
                      ? 'bg-bronze-600 text-white'
                      : 'bg-paper-100 text-forest-700 group-hover:bg-bronze-50 group-hover:text-bronze-700',
                  )}
                >
                  <ServiceIcon name={service.name} />
                </span>
              </div>

              <div className="mt-4 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-xl leading-tight tracking-tight text-ink">
                    {service.name}
                  </h3>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-forest-900">
                    {formatCurrency(service.price)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {service.description}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDuration(service.duration_min)}
                  </span>
                  <span
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-full border transition-colors',
                      isSelected
                        ? 'border-bronze-600 bg-bronze-600 text-white'
                        : 'border-line text-transparent group-hover:border-bronze-300',
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-5 flex items-center gap-2 text-[11px] text-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-forest-500" aria-hidden="true" />
        Precios finales. No se solicita ningún pago online para reservar.
      </p>
    </div>
  )
}
