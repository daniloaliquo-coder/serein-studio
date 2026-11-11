import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  isBefore,
  isSameMonth,
  startOfMonth,
} from 'date-fns'
import {
  AlertCircle,
  CalendarDays,
  CalendarX2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Sun,
  Sunset,
  Timer,
} from 'lucide-react'
import { fetchBookedSlots } from '../../lib/api'
import {
  formatDuration,
  formatGroupDate,
  formatLongDate,
  formatMonthLabel,
  fromDateKey,
  getCalendarDays,
  getMonthBounds,
  isDateInMonth,
  isToday,
  minutesToTime,
  timeToMinutes,
  toDateKey,
} from '../../lib/date'
import {
  getAvailableSlots,
  getDayAvailability,
  getDayRule,
} from '../../lib/availability'
import { cn, getErrorMessage } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const REASON_LABELS = {
  past: 'No disponible',
  horizon: 'Fuera de plazo',
  closed: 'Estudio cerrado',
  full: 'Completo',
}

export function TimeSlotPicker({
  service,
  settings,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)
  const timePanelRef = useRef(null)

  const today = new Date()
  const todayMonth = startOfMonth(today)
  const currentMonth = startOfMonth(monthCursor)
  const canGoPrevious = isBefore(todayMonth, currentMonth)
  const maxDate = addDays(today, Number(settings.booking_horizon_days) || 60)
  const canGoNext = isBefore(currentMonth, startOfMonth(maxDate))

  useEffect(() => {
    let isActive = true
    const { from, to } = getMonthBounds(monthCursor)

    setLoading(true)
    setError(null)

    fetchBookedSlots(from, to)
      .then((data) => {
        if (isActive) setBookedSlots(data)
      })
      .catch((fetchError) => {
        if (isActive) {
          setError(
            getErrorMessage(fetchError, 'No pudimos consultar los horarios disponibles.'),
          )
        }
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [monthCursor, reloadToken])

  const calendarDays = useMemo(() => getCalendarDays(monthCursor), [monthCursor])

  const cells = useMemo(() => {
    return calendarDays.map((day) => {
      const dateKey = toDateKey(day)
      const inCurrentMonth = isDateInMonth(day, monthCursor)
      const rule = getDayRule(dateKey, settings)
      const isChecking = loading || Boolean(error)
      const availability = isChecking
        ? rule
        : getDayAvailability(dateKey, service, settings, bookedSlots)

      return {
        date: day,
        dateKey,
        inCurrentMonth,
        available: inCurrentMonth && availability.available,
        reason: availability.reason,
        today: isToday(day),
        selected: selectedDate === dateKey,
      }
    })
  }, [
    calendarDays,
    monthCursor,
    settings,
    service,
    bookedSlots,
    loading,
    error,
    selectedDate,
  ])

  const slots = useMemo(() => {
    if (!selectedDate || loading || error) return []
    return getAvailableSlots(selectedDate, service, settings, bookedSlots)
  }, [selectedDate, service, settings, bookedSlots, loading, error])

  const morningSlots = slots.filter((slot) => slot.period === 'morning')
  const afternoonSlots = slots.filter((slot) => slot.period === 'afternoon')

  useEffect(() => {
    if (!selectedTime || loading || error) return
    if (!slots.some((slot) => slot.value === selectedTime)) {
      onSelectTime(null)
    }
  }, [selectedTime, slots, loading, error, onSelectTime])

  function changeMonth(amount) {
    const nextMonth = addMonths(monthCursor, amount)
    const canMove = amount < 0 ? canGoPrevious : canGoNext
    if (!canMove) return

    if (selectedDate && !isSameMonth(fromDateKey(selectedDate), nextMonth)) {
      onSelectDate(null)
      onSelectTime(null)
    }

    setMonthCursor(startOfMonth(nextMonth))
  }

  function selectDate(cell) {
    if (!cell.inCurrentMonth || !cell.available) return

    onSelectDate(cell.dateKey)
    onSelectTime(null)
  }

  const selectedEndTime =
    selectedTime && service
      ? minutesToTime(timeToMinutes(selectedTime) + Number(service.duration_min))
      : null

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label-xs font-bold uppercase tracking-label text-bronze-600">
            Paso 02 · Elige el momento
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight text-forest-950 sm:text-4xl">
            Reserva tu hueco
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Los turnos se recalculan en tiempo real según la duración de cada servicio.
          </p>
        </div>
        <Badge variant="bronze" className="w-fit shrink-0 py-1.5">
          <Timer className="h-3 w-3" aria-hidden="true" />
          {formatDuration(service.duration_min)}
        </Badge>
      </div>

      <div className="mt-6 grid gap-7 md:grid-cols-[1.05fr_0.95fr] md:gap-0">
        <div className="min-w-0 md:pr-7">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              disabled={!canGoPrevious}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-forest-800 transition-colors hover:border-forest-200 hover:bg-forest-50 disabled:pointer-events-none disabled:opacity-35"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg capitalize tracking-tight text-forest-950">
                {formatMonthLabel(monthCursor)}
              </h3>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-bronze-500" aria-label="Cargando disponibilidad" />
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              disabled={!canGoNext}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-forest-800 transition-colors hover:border-forest-200 hover:bg-forest-50 disabled:pointer-events-none disabled:opacity-35"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 text-center">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="pb-2 label-xs font-bold uppercase tracking-label text-muted/60"
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((cell) => {
              const disabled = !cell.inCurrentMonth || !cell.available
              const reason = cell.inCurrentMonth
                ? REASON_LABELS[cell.reason] || ''
                : ''

              return (
                <div key={cell.dateKey} className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => selectDate(cell)}
                    disabled={disabled}
                    aria-pressed={cell.selected}
                    aria-current={cell.today ? 'date' : undefined}
                    aria-label={`${formatLongDate(cell.dateKey)}${reason ? `, ${reason}` : ''}`}
                    title={reason || undefined}
                    className={cn(
                      'relative grid h-10 w-10 place-items-center rounded-full text-sm font-medium tabular-nums transition-colors',
                      !cell.inCurrentMonth && 'invisible',
                      cell.selected && cell.inCurrentMonth
                        ? 'bg-forest-800 text-paper-50 shadow-md'
                        : disabled
                          ? 'cursor-not-allowed text-muted/25'
                          : 'text-forest-900 hover:bg-paper-100/80',
                      cell.today && !cell.selected && cell.inCurrentMonth && 'ring-1 ring-paper-300',
                    )}
                  >
                    {cell.date.getDate()}
                    {cell.available && !loading && !error && !cell.selected ? (
                      <span
                        className="absolute bottom-1 h-1 w-1 rounded-full bg-bronze-400"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/80 pt-4 caption text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-bronze-400" aria-hidden="true" />
              Con huecos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-line" aria-hidden="true" />
              Sin disponibilidad
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full ring-1 ring-paper-300" aria-hidden="true" />
              Hoy
            </span>
          </div>
        </div>

        <div
          ref={timePanelRef}
          className="min-h-[21rem] border-t border-line/80 pt-6 md:border-l md:border-t-0 md:pl-7 md:pt-0"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl tracking-tight text-forest-950">
                Horarios
              </h3>
              <p className="mt-1 caption leading-relaxed text-muted">
                {selectedDate
                  ? formatGroupDate(selectedDate)
                  : 'Selecciona un día para ver los turnos libres.'}
              </p>
            </div>
            <Badge variant="neutral" className="mt-1 shrink-0">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {settings.min_notice_min > 0
                ? `${settings.min_notice_min} min de antelación`
                : 'Sin antelación'}
            </Badge>
          </div>

          <div className="mt-5">
            {!selectedDate ? (
              <div className="flex min-h-[15rem] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper-50/60 px-6 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-bronze-500 shadow-sm">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-forest-900">Tu día empieza aquí</p>
                <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-muted">
                  Elige una fecha en el calendario. Verás únicamente los huecos que encajan con
                  la duración de tu servicio.
                </p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-3 gap-2" aria-label="Cargando horarios">
                {Array.from({ length: 9 }).map((_, index) => (
                  <Skeleton key={index} className="h-11 rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-red-700">
                  No pudimos cargar los horarios
                </p>
                <p className="mt-1 text-xs leading-relaxed text-red-600/80">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setReloadToken((value) => value + 1)}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reintentar
                </Button>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex min-h-[15rem] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper-50/60 px-6 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-bronze-500 shadow-sm">
                  <CalendarX2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-forest-900">
                  No quedan turnos este día
                </p>
                <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-muted">
                  Prueba otra fecha: los días con puntos bronce todavía tienen
                  disponibilidad.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {morningSlots.length ? (
                  <div>
                    <p className="mb-2.5 flex items-center gap-1.5 label-xs font-bold uppercase tracking-label text-muted">
                      <Sun className="h-3.5 w-3.5 text-bronze-500" aria-hidden="true" />
                      Mañana
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {morningSlots.map((slot) => (
                        <TimeButton
                          key={slot.value}
                          slot={slot}
                          selected={selectedTime === slot.value}
                          duration={service.duration_min}
                          onSelect={() => onSelectTime(slot.value)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {afternoonSlots.length ? (
                  <div>
                    <p className="mb-2.5 flex items-center gap-1.5 label-xs font-bold uppercase tracking-label text-muted">
                      <Sunset className="h-3.5 w-3.5 text-bronze-500" aria-hidden="true" />
                      Tarde
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {afternoonSlots.map((slot) => (
                        <TimeButton
                          key={slot.value}
                          slot={slot}
                          selected={selectedTime === slot.value}
                          duration={service.duration_min}
                          onSelect={() => onSelectTime(slot.value)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedTime ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-forest-100 bg-forest-50/70 px-3.5 py-3 text-xs text-forest-800">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest-800 text-paper-50">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <p>
                      Tu cita: <strong className="font-semibold">{selectedTime}</strong> —{' '}
                      {selectedEndTime} h
                    </p>
                  </div>
                ) : (
                  <p className="caption leading-relaxed text-muted">
                    Selecciona una hora para continuar.
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="mt-5 flex items-start gap-2 caption leading-relaxed text-muted/75">
            <Timer className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            La agenda bloquea automáticamente el tiempo necesario para cada servicio. Hora local
            del estudio.
          </p>
        </div>
      </div>
    </div>
  )
}

function TimeButton({ slot, selected, duration, onSelect }) {
  const end = minutesToTime(timeToMinutes(slot.value) + Number(duration))

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex h-11 flex-col items-center justify-center rounded-xl border text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/40 focus-visible:ring-offset-1',
        selected
          ? 'border-forest-800 bg-forest-800 text-paper-50 shadow-sm'
          : 'border-line bg-white text-forest-900 hover:border-paper-300 hover:bg-paper-50',
      )}
      title={`${slot.value} – ${end}`}
    >
      {slot.value}
      <span
        className={cn(
          'mt-0.5 label-xs font-medium',
          selected ? 'text-paper-200/70' : 'text-muted/55',
        )}
      >
        hasta {end}
      </span>
    </button>
  )
}
