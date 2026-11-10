import {
  CalendarCheck2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { formatCurrency, cn } from '../../lib/utils'
import { getTodayKey, getWeekEndKey } from '../../lib/date'

function calculateMetrics(appointments) {
  const today = getTodayKey()
  const weekEnd = getWeekEndKey()
  const active = appointments.filter((appointment) => appointment.status !== 'cancelled')
  const activeToday = active.filter((appointment) => appointment.appointment_date === today)
  const confirmedToday = activeToday.filter((appointment) => appointment.status === 'confirmed')
  const pendingToday = activeToday.filter((appointment) => appointment.status === 'pending')
  const cancelledToday = appointments.filter(
    (appointment) =>
      appointment.appointment_date === today && appointment.status === 'cancelled',
  )

  const revenueToday = activeToday.reduce(
    (total, appointment) => total + Number(appointment.service?.price || 0),
    0,
  )
  const confirmedRevenue = confirmedToday.reduce(
    (total, appointment) => total + Number(appointment.service?.price || 0),
    0,
  )

  const weekActive = active.filter(
    (appointment) =>
      appointment.appointment_date >= today && appointment.appointment_date <= weekEnd,
  )

  const demandByService = new Map()
  for (const appointment of weekActive) {
    if (!appointment.service) continue
    const current = demandByService.get(appointment.service.id) || {
      name: appointment.service.name,
      count: 0,
      revenue: 0,
    }
    current.count += 1
    current.revenue += Number(appointment.service.price || 0)
    demandByService.set(appointment.service.id, current)
  }

  const topService = [...demandByService.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return b.revenue - a.revenue
  })[0] || null

  return {
    totalToday: activeToday.length,
    confirmedToday: confirmedToday.length,
    pendingToday: pendingToday.length,
    cancelledToday: cancelledToday.length,
    revenueToday,
    confirmedRevenue,
    topService,
  }
}

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-10 w-28" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  )
}

export function StatsOverview({ appointments = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>
    )
  }

  const metrics = calculateMetrics(appointments)
  const confirmedRatio = metrics.totalToday
    ? Math.round((metrics.confirmedToday / metrics.totalToday) * 100)
    : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article className="relative overflow-hidden rounded-2xl bg-forest-950 p-5 text-paper-50 shadow-soft">
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-white/10"
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-paper-200/55">
              Turnos hoy
            </p>
            <p className="mt-4 font-display text-4xl leading-none tabular-nums text-paper-50">
              {metrics.totalToday}
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-paper-300">
            <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center justify-between text-[10px] text-paper-200/55">
            <span>
              <strong className="font-semibold text-paper-100">{metrics.confirmedToday}</strong>{' '}
              confirmados
            </span>
            <span>
              <strong className="font-semibold text-paper-100">{metrics.pendingToday}</strong>{' '}
              pendientes
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-paper-300 transition-transform duration-500"
              style={{ width: `${confirmedRatio}%` }}
            />
          </div>
          {metrics.cancelledToday > 0 ? (
            <p className="mt-2.5 text-[9px] text-paper-200/35">
              {metrics.cancelledToday} cancelada{metrics.cancelledToday === 1 ? '' : 's'} hoy
            </p>
          ) : (
            <p className="mt-2.5 text-[9px] text-paper-200/35">Sin cancelaciones hoy</p>
          )}
        </div>
      </article>

      <article className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted/65">
              Ingresos estimados
            </p>
            <p className="mt-4 font-display text-4xl leading-none tabular-nums text-forest-950">
              {formatCurrency(metrics.revenueToday)}
            </p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-forest-50 text-forest-700">
            <Wallet className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-line/80 pt-3 text-[10px] text-muted">
          <span>Hoy · confirmadas + pendientes</span>
          <span className="font-semibold text-forest-700">
            {formatCurrency(metrics.confirmedRevenue)} confirmado
          </span>
        </div>
      </article>

      <article className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-white via-white to-paper-200/70 p-5 shadow-soft sm:col-span-2 xl:col-span-1">
        <div
          className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-paper-200/50 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted/65">
              Servicio más demandado
            </p>
            <p className="mt-4 truncate font-display text-2xl leading-tight tracking-tight text-forest-950">
              {metrics.topService?.name || 'Aún sin datos'}
            </p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-100 text-forest-800">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div className="relative mt-5 flex items-center justify-between border-t border-paper-200/80 pt-3 text-[10px] text-muted">
          <span>Esta semana</span>
          <span className={cn('font-semibold', metrics.topService ? 'text-forest-800' : 'text-muted/60')}>
            {metrics.topService
              ? `${metrics.topService.count} reserva${metrics.topService.count === 1 ? '' : 's'}`
              : 'Sin reservas todavía'}
          </span>
        </div>
      </article>
    </div>
  )
}
