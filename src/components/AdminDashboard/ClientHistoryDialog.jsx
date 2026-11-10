import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  ChevronDown,
  History,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'
import { fetchClientHistory } from '../../lib/api'
import {
  buildWhatsAppUrl,
  cn,
  formatNumber,
  getErrorMessage,
  getFirstName,
} from '../../lib/utils'
import {
  formatCompactDate,
  formatDateTime,
  getTodayKey,
  normalizeTime,
} from '../../lib/date'
import { Badge, StatusBadge } from '../ui/badge'
import { Button, buttonVariants } from '../ui/button'
import { Dialog } from '../ui/dialog'
import { Skeleton } from '../ui/skeleton'

const PAGE_SIZE = 15

function getReference(id = '') {
  return `SR-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
}

function SummaryTile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line/70 bg-white px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted/60">
        {label}
      </p>
      <p className="mt-1.5 font-display text-xl leading-none text-forest-950">{value}</p>
      {hint ? <p className="mt-1 truncate text-[9px] text-muted">{hint}</p> : null}
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[4.6rem] rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[4.75rem] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function HistoryRow({ appointment, clientName }) {
  const cancelled = appointment.status === 'cancelled'
  const serviceName = appointment.service?.name || 'Servicio'
  const createdAt = formatDateTime(appointment.created_at)

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl border border-line/70 bg-white p-3',
        cancelled && 'border-stone-200/80 bg-stone-50/60',
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
          cancelled ? 'bg-stone-100 text-stone-500' : 'bg-paper-50 text-forest-700',
        )}
        aria-hidden="true"
      >
        <CalendarDays className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <p className="text-xs font-semibold text-forest-950">
            {formatCompactDate(appointment.appointment_date)}
            <span className="mx-1.5 text-line">·</span>
            <span className="tabular-nums">{normalizeTime(appointment.start_time)} h</span>
          </p>
          <StatusBadge status={appointment.status} />
        </div>

        <p
          className={cn(
            'mt-1 truncate text-[11px] font-medium',
            cancelled ? 'text-muted' : 'text-forest-900',
          )}
        >
          {serviceName}
        </p>

        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[9px] text-muted">
          <span>Ref. {getReference(appointment.id)}</span>
          {createdAt ? (
            <>
              <span className="text-line">·</span>
              <span>Reservada el {createdAt}</span>
            </>
          ) : null}
          {appointment.client_name && appointment.client_name !== clientName ? (
            <>
              <span className="text-line">·</span>
              <span>{appointment.client_name}</span>
            </>
          ) : null}
        </p>
      </div>
    </li>
  )
}

function SectionHeader({ icon: Icon, label, count }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-forest-500" aria-hidden="true" />
        <h3 className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted/70">
          {label}
        </h3>
      </div>
      <Badge variant="neutral">{formatNumber(count)}</Badge>
    </div>
  )
}

export function ClientHistoryDialog({ client, businessName, onClose }) {
  const phone = client?.phone || ''
  const name = client?.name || ''
  const [appointments, setAppointments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [reloadToken, setReloadToken] = useState(0)
  const [today] = useState(() => getTodayKey())

  useEffect(() => {
    if (!phone) return undefined

    let isActive = true

    fetchClientHistory(phone)
      .then((result) => {
        if (!isActive) return
        setAppointments(result.appointments)
        setTotal(result.total)
        setError(null)
      })
      .catch((loadError) => {
        if (!isActive) return
        setError(
          getErrorMessage(
            loadError,
            'No pudimos cargar el historial. Revisa la conexión e inténtalo de nuevo.',
          ),
        )
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [phone, reloadToken])

  const { upcoming, past } = useMemo(() => {
    const future = appointments
      .filter(
        (appointment) =>
          appointment.appointment_date >= today && appointment.status !== 'cancelled',
      )
      .sort((a, b) => {
        if (a.appointment_date !== b.appointment_date) {
          return a.appointment_date.localeCompare(b.appointment_date)
        }
        return a.start_time.localeCompare(b.start_time)
      })

    const previous = appointments
      .filter(
        (appointment) =>
          !(appointment.appointment_date >= today && appointment.status !== 'cancelled'),
      )
      .sort((a, b) => {
        if (a.appointment_date !== b.appointment_date) {
          return b.appointment_date.localeCompare(a.appointment_date)
        }
        return b.start_time.localeCompare(a.start_time)
      })

    return { upcoming: future, past: previous }
  }, [appointments, today])

  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === 'confirmed',
  ).length
  const cancelledCount = appointments.filter(
    (appointment) => appointment.status === 'cancelled',
  ).length
  const activeCount = appointments.filter(
    (appointment) => appointment.status !== 'cancelled',
  ).length
  const nextAppointment = upcoming[0] || null
  const visibleUpcoming = upcoming.slice(0, visibleCount)
  const remainingSlots = Math.max(visibleCount - visibleUpcoming.length, 0)
  const visiblePast = past.slice(0, remainingSlots)
  const hiddenLoadedCount = Math.max(appointments.length - visibleCount, 0)
  const truncated = total > appointments.length
  const allCancelled =
    !loading &&
    !error &&
    total > 0 &&
    appointments.length === total &&
    activeCount === 0
  const hasHistory = appointments.length > 0

  function handleRetry() {
    setLoading(true)
    setError(null)
    setVisibleCount(PAGE_SIZE)
    setReloadToken((token) => token + 1)
  }

  const whatsappUrl = buildWhatsAppUrl(
    phone,
    `${name ? `Hola ${getFirstName(name)}` : 'Hola'}, te escribimos de ${
      businessName || 'el estudio'
    } para ayudarte con tus reservas.`,
  )

  const description = loading
    ? 'Cargando reservas…'
    : error
      ? 'No se pudo cargar el historial'
      : `${formatNumber(total)} reserva${total === 1 ? '' : 's'} · ${phone}`

  return (
    <Dialog
      open
      onClose={onClose}
      title={name ? `Historial de ${name}` : 'Historial de clienta'}
      description={description}
      className="max-w-2xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Contactar por WhatsApp
            </a>
          ) : (
            <span />
          )}
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {loading ? <HistorySkeleton /> : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-7 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-xl text-forest-950">
            No pudimos abrir el historial
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-amber-800">
            {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleRetry}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      ) : null}

      {!loading && !error && !hasHistory ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-paper-100 text-muted">
            <CalendarX2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-xl text-forest-950">
            Sin reservas registradas
          </h3>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
            No encontramos citas asociadas a {phone}. Si crees que es un error, revisa el
            teléfono de la reserva.
          </p>
        </div>
      ) : null}

      {!loading && !error && hasHistory ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryTile label="Reservas" value={formatNumber(total)} />
            <SummaryTile label="Confirmadas" value={formatNumber(confirmedCount)} />
            <SummaryTile label="Canceladas" value={formatNumber(cancelledCount)} />
            <SummaryTile
              label="Próxima cita"
              value={nextAppointment ? formatCompactDate(nextAppointment.appointment_date) : '—'}
              hint={nextAppointment ? `${normalizeTime(nextAppointment.start_time)} h` : 'Sin citas activas'}
            />
          </div>

          {allCancelled ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-[11px] leading-relaxed text-stone-600">
              <History className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <p>
                Esta clienta no tiene citas activas. Se muestran las canceladas para conservar
                el historial.
              </p>
            </div>
          ) : null}

          {upcoming.length > 0 ? (
            <section aria-labelledby="client-history-upcoming">
              <div id="client-history-upcoming">
                <SectionHeader
                  icon={CalendarClock}
                  label="Próximas"
                  count={upcoming.length}
                />
              </div>
              <ul className="mt-2.5 space-y-2">
                {visibleUpcoming.map((appointment) => (
                  <HistoryRow
                    key={appointment.id}
                    appointment={appointment}
                    clientName={name}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {upcoming.length === 0 && past.length > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-paper-50/70 px-3.5 py-3 text-[11px] text-muted">
              <CalendarClock className="h-3.5 w-3.5 text-forest-500" aria-hidden="true" />
              No hay próximas citas.
            </div>
          ) : null}

          {visiblePast.length > 0 ? (
            <section aria-labelledby="client-history-past">
              <div id="client-history-past">
                <SectionHeader icon={History} label="Anteriores" count={past.length} />
              </div>
              <ul className="mt-2.5 space-y-2">
                {visiblePast.map((appointment) => (
                  <HistoryRow
                    key={appointment.id}
                    appointment={appointment}
                    clientName={name}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {hiddenLoadedCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              Ver más reservas
              <span className="text-muted">({formatNumber(hiddenLoadedCount)})</span>
            </Button>
          ) : null}

          {truncated ? (
            <p className="text-center text-[10px] leading-relaxed text-muted">
              Mostrando las {formatNumber(appointments.length)} reservas más recientes de{' '}
              {formatNumber(total)}.
            </p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  )
}
