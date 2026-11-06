import { useMemo, useState } from 'react'
import {
  CalendarX2,
  Check,
  Eye,
  History,
  Loader2,
  Phone,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { Badge, StatusBadge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Skeleton } from '../ui/skeleton'
import { ClientHistoryDialog } from './ClientHistoryDialog'
import {
  buildWhatsAppUrl,
  capitalizeFirst,
  cn,
  formatCurrency,
  formatNumber,
  getFirstName,
  getInitials,
} from '../../lib/utils'
import {
  formatCompactDate,
  formatDateTime,
  formatDuration,
  formatGroupDate,
  getTodayKey,
  getTomorrowKey,
  getWeekEndKey,
  minutesToTime,
  normalizeTime,
  timeToMinutes,
} from '../../lib/date'

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: 'tomorrow', label: 'Mañana' },
  { id: 'week', label: 'Esta semana' },
  { id: 'all', label: 'Todas' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'cancelled', label: 'Canceladas' },
]

const AVATAR_TONES = [
  'bg-forest-100 text-forest-800',
  'bg-clay-100 text-clay-700',
  'bg-gold-100 text-gold-600',
  'bg-cream-200 text-forest-700',
]

function avatarTone(name = '') {
  const total = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return AVATAR_TONES[total % AVATAR_TONES.length]
}

function normalizeSearch(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getRelativeLabel(dateKey) {
  if (dateKey === getTodayKey()) return 'Hoy'
  if (dateKey === getTomorrowKey()) return 'Mañana'
  return null
}

function AppointmentActions({ appointment, updatingId, onStatusChange }) {
  if (updatingId === appointment.id) {
    return (
      <div className="flex items-center justify-end pr-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Actualizando reserva" />
      </div>
    )
  }

  if (appointment.status === 'pending') {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Button
          size="sm"
          variant="success"
          onClick={() => onStatusChange(appointment, 'confirmed')}
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Confirmar
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => onStatusChange(appointment, 'cancelled')}
          aria-label={`Cancelar la reserva de ${appointment.client_name}`}
          title="Cancelar reserva"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  if (appointment.status === 'confirmed') {
    return (
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => onStatusChange(appointment, 'cancelled')}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onStatusChange(appointment, 'pending')}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Reabrir
      </Button>
    </div>
  )
}

function LoadingTable() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-10 w-64 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
        <Skeleton className="h-5 w-52" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 border-t border-line/60 pt-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AppointmentTable({
  appointments = [],
  filter,
  onFilterChange,
  onStatusChange,
  updatingId,
  loading,
  settings,
}) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [historyClient, setHistoryClient] = useState(null)

  const today = getTodayKey()
  const tomorrow = getTomorrowKey()
  const weekEnd = getWeekEndKey()

  const counts = useMemo(
    () => ({
      today: appointments.filter((appointment) => appointment.appointment_date === today).length,
      tomorrow: appointments.filter(
        (appointment) => appointment.appointment_date === tomorrow,
      ).length,
      week: appointments.filter(
        (appointment) =>
          appointment.appointment_date >= today && appointment.appointment_date <= weekEnd,
      ).length,
      all: appointments.length,
    }),
    [appointments, today, tomorrow, weekEnd],
  )

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = normalizeSearch(search.trim())

    return appointments
      .filter((appointment) => {
        if (filter === 'today') return appointment.appointment_date === today
        if (filter === 'tomorrow') return appointment.appointment_date === tomorrow
        if (filter === 'all') return appointment.appointment_date >= today
        return appointment.appointment_date >= today && appointment.appointment_date <= weekEnd
      })
      .filter((appointment) => {
        if (statusFilter === 'all') return true
        return appointment.status === statusFilter
      })
      .filter((appointment) => {
        if (!normalizedQuery) return true
        const haystack = normalizeSearch(
          `${appointment.client_name} ${appointment.client_phone} ${appointment.service?.name || ''}`,
        )
        return haystack.includes(normalizedQuery)
      })
  }, [appointments, filter, statusFilter, search, today, tomorrow, weekEnd])

  const groups = useMemo(() => {
    const sorted = [...filteredAppointments].sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return a.appointment_date.localeCompare(b.appointment_date)
      }
      return a.start_time.localeCompare(b.start_time)
    })

    const byDate = new Map()
    for (const appointment of sorted) {
      if (!byDate.has(appointment.appointment_date)) {
        byDate.set(appointment.appointment_date, [])
      }
      byDate.get(appointment.appointment_date).push(appointment)
    }

    return [...byDate.entries()]
  }, [filteredAppointments])

  const selectedAppointment = selectedId
    ? appointments.find((appointment) => appointment.id === selectedId) || null
    : null

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
  }

  function openHistory(appointment) {
    setHistoryClient({
      name: appointment.client_name,
      phone: appointment.client_phone,
    })
    setSelectedId(null)
  }

  if (loading) return <LoadingTable />

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-3 shadow-soft sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-cream-100 p-1 scrollbar-none">
            {PERIODS.map((period) => (
              <button
                key={period.id}
                type="button"
                onClick={() => onFilterChange(period.id)}
                aria-pressed={filter === period.id}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all',
                  filter === period.id
                    ? 'bg-white text-forest-950 shadow-sm'
                    : 'text-muted hover:text-forest-900',
                )}
              >
                {period.label}
                <span
                  className={cn(
                    'grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] tabular-nums',
                    filter === period.id
                      ? 'bg-forest-800 text-cream-50'
                      : 'bg-white/70 text-muted',
                  )}
                >
                  {counts[period.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-56">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/60"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar clienta o servicio…"
                className="h-10 pl-9 text-xs"
                aria-label="Buscar reservas"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar por estado"
              className="h-10 text-xs"
              wrapperClassName="sm:w-44"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-full px-3 text-[10px] font-semibold text-muted transition-colors hover:bg-cream-100 hover:text-forest-900"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-16 text-center shadow-soft">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-cream-100 text-muted">
            <CalendarX2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-display text-2xl tracking-tight text-forest-950">
            No hay reservas con estos filtros
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {hasActiveFilters
              ? 'Prueba con otro estado o limpia la búsqueda para ver toda la agenda.'
              : 'Cuando entre una nueva reserva aparecerá aquí automáticamente.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" className="mt-5" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        groups.map(([dateKey, group]) => {
          const activeGroup = group.filter((appointment) => appointment.status !== 'cancelled')
          const groupRevenue = activeGroup.reduce(
            (total, appointment) => total + Number(appointment.service?.price || 0),
            0,
          )
          const relativeLabel = getRelativeLabel(dateKey)

          return (
            <section
              key={dateKey}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft"
              aria-label={`Reservas del ${formatGroupDate(dateKey)}`}
            >
              <div className="flex flex-col gap-3 border-b border-line/80 bg-cream-50/55 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-display text-xl tracking-tight text-forest-950">
                    {formatGroupDate(dateKey)}
                  </h3>
                  {relativeLabel ? (
                    <Badge variant="clay" dot>
                      {relativeLabel}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[10px] font-medium text-muted">
                  {formatNumber(group.length)} reserva{group.length === 1 ? '' : 's'}
                  <span className="mx-1.5 text-line">/</span>
                  {formatCurrency(groupRevenue)} activos
                </p>
              </div>

              <div className="hidden xl:block">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line/70 text-[9px] font-bold uppercase tracking-[0.16em] text-muted/60">
                      <th className="w-[26%] px-5 py-3 font-bold">Clienta</th>
                      <th className="w-[27%] px-3 py-3 font-bold">Servicio</th>
                      <th className="w-[15%] px-3 py-3 font-bold">Hora</th>
                      <th className="w-[14%] px-3 py-3 font-bold">Estado</th>
                      <th className="w-[18%] px-5 py-3 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {group.map((appointment) => {
                      const start = normalizeTime(appointment.start_time)
                      const end = minutesToTime(
                        timeToMinutes(start) + Number(appointment.service?.duration_min || 0),
                      )

                      return (
                        <tr
                          key={appointment.id}
                          className={cn(
                            'group transition-colors hover:bg-cream-50/50',
                            appointment.status === 'cancelled' && 'bg-stone-50/40',
                          )}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                                  avatarTone(appointment.client_name),
                                )}
                                aria-hidden="true"
                              >
                                {getInitials(appointment.client_name)}
                              </span>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(appointment.id)}
                                  className="block max-w-full truncate text-left text-xs font-semibold text-forest-950 transition-colors hover:text-clay-600"
                                  title="Ver detalle de la reserva"
                                >
                                  {appointment.client_name}
                                </button>
                                <a
                                  href={`tel:${appointment.client_phone.replace(/\s/g, '')}`}
                                  className="mt-0.5 flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-forest-700"
                                >
                                  <Phone className="h-2.5 w-2.5" aria-hidden="true" />
                                  {appointment.client_phone}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <p className="truncate text-xs font-medium text-forest-900">
                              {appointment.service?.name || 'Servicio'}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted">
                              {formatDuration(appointment.service?.duration_min)} ·{' '}
                              {formatCurrency(appointment.service?.price)}
                            </p>
                          </td>
                          <td className="px-3 py-4">
                            <p className="text-xs font-semibold tabular-nums text-forest-900">
                              {start}
                            </p>
                            <p className="mt-0.5 text-[10px] tabular-nums text-muted">hasta {end}</p>
                          </td>
                          <td className="px-3 py-4">
                            <StatusBadge status={appointment.status} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setSelectedId(appointment.id)}
                                aria-label={`Ver detalle de la reserva de ${appointment.client_name}`}
                                title="Ver detalle"
                              >
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                              <AppointmentActions
                                appointment={appointment}
                                updatingId={updatingId}
                                onStatusChange={onStatusChange}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 sm:grid-cols-2 xl:hidden">
                {group.map((appointment) => {
                  const start = normalizeTime(appointment.start_time)
                  const end = minutesToTime(
                    timeToMinutes(start) + Number(appointment.service?.duration_min || 0),
                  )

                  return (
                    <article
                      key={appointment.id}
                      className={cn(
                        'rounded-xl border border-line/80 bg-white p-3.5',
                        appointment.status === 'cancelled' && 'bg-stone-50/45',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-bold',
                              avatarTone(appointment.client_name),
                            )}
                            aria-hidden="true"
                          >
                            {getInitials(appointment.client_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-forest-950">
                              {appointment.client_name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted">
                              {appointment.client_phone}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={appointment.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-cream-50 px-2.5 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium text-forest-900">
                            {appointment.service?.name || 'Servicio'}
                          </p>
                          <p className="text-[9px] text-muted">
                            {formatDuration(appointment.service?.duration_min)} ·{' '}
                            {formatCurrency(appointment.service?.price)}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs font-semibold tabular-nums text-forest-900">
                          {start} <span className="text-[9px] font-normal text-muted">– {end}</span>
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(appointment.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted transition-colors hover:text-forest-900"
                        >
                          <Eye className="h-3 w-3" aria-hidden="true" />
                          Detalle
                        </button>
                        <AppointmentActions
                          appointment={appointment}
                          updatingId={updatingId}
                          onStatusChange={onStatusChange}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })
      )}

      <Dialog
        open={Boolean(selectedAppointment)}
        onClose={() => setSelectedId(null)}
        title="Detalle de la reserva"
        description={
          selectedAppointment
            ? `Referencia SR-${selectedAppointment.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
            : undefined
        }
        footer={
          <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
            Cerrar
          </Button>
        }
      >
        {selectedAppointment ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'grid h-11 w-11 place-items-center rounded-full text-xs font-bold',
                    avatarTone(selectedAppointment.client_name),
                  )}
                  aria-hidden="true"
                >
                  {getInitials(selectedAppointment.client_name)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-forest-950">
                    {selectedAppointment.client_name}
                  </p>
                  <a
                    href={`tel:${selectedAppointment.client_phone.replace(/\s/g, '')}`}
                    className="mt-0.5 flex items-center gap-1 text-[11px] text-muted hover:text-forest-700"
                  >
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    {selectedAppointment.client_phone}
                  </a>
                </div>
              </div>
              <StatusBadge status={selectedAppointment.status} />
            </div>

            <dl className="mt-5 divide-y divide-line/70 overflow-hidden rounded-xl border border-line bg-cream-50/50">
              {[
                ['Servicio', selectedAppointment.service?.name || 'Servicio'],
                [
                  'Fecha',
                  capitalizeFirst(formatGroupDate(selectedAppointment.appointment_date)),
                ],
                [
                  'Hora',
                  `${normalizeTime(selectedAppointment.start_time)} · ${formatDuration(
                    selectedAppointment.service?.duration_min,
                  )}`,
                ],
                ['Precio', formatCurrency(selectedAppointment.service?.price)],
                ['Reservada el', formatDateTime(selectedAppointment.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-5 px-4 py-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted/70">
                    {label}
                  </dt>
                  <dd className="text-right text-xs font-semibold text-forest-950">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openHistory(selectedAppointment)}
              >
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                Ver historial
              </Button>
              <a
                href={buildWhatsAppUrl(
                  selectedAppointment.client_phone,
                  `Hola ${getFirstName(selectedAppointment.client_name)}, te escribimos de ${
                    settings?.business_name || 'el estudio'
                  } sobre tu cita del ${formatCompactDate(
                    selectedAppointment.appointment_date,
                  )} a las ${normalizeTime(selectedAppointment.start_time)}.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[11px] font-semibold text-forest-800 transition-colors hover:bg-forest-50"
              >
                Contactar por WhatsApp
              </a>
              <Badge variant="neutral">{selectedAppointment.client_phone}</Badge>
            </div>

            <div className="mt-5 border-t border-line/80 pt-4">
              <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted/60">
                Actualizar estado
              </p>
              <div className="flex justify-start">
                <AppointmentActions
                  appointment={selectedAppointment}
                  updatingId={updatingId}
                  onStatusChange={onStatusChange}
                />
              </div>
            </div>
          </div>
        ) : null}
      </Dialog>

      {historyClient ? (
        <ClientHistoryDialog
          key={historyClient.phone}
          client={historyClient}
          businessName={settings?.business_name}
          onClose={() => setHistoryClient(null)}
        />
      ) : null}
    </div>
  )
}
