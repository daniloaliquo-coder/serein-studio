import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { StatsOverview } from './StatsOverview'
import { AppointmentTable } from './AppointmentTable'
import { ScheduleSettings } from './ScheduleSettings'
import { Brand } from '../ui/brand'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { useToast } from '../ui/toast'
import {
  fetchAppointments,
  fetchSettings,
  updateAppointmentStatus,
  updateSettings,
} from '../../lib/api'
import { DEFAULT_SETTINGS } from '../../lib/defaults'
import {
  addDaysKey,
  formatAdminToday,
  getTodayKey,
  normalizeTime,
} from '../../lib/date'
import {
  capitalizeFirst,
  cn,
  getErrorMessage,
  getInitials,
} from '../../lib/utils'

const NAV_ITEMS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'settings', label: 'Horario', icon: Clock3 },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function getAppointmentsRange() {
  const from = getTodayKey()
  // El calendario público permite reservar con hasta un año de antelación.
  // Cargamos toda la ventana para que ninguna cita futura quede oculta.
  return { from, to: addDaysKey(from, 365) }
}

function MenuButton({ active, icon: Icon, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-bronze-50 text-forest-900 shadow-sm'
          : 'text-paper-300/60 hover:bg-white/[0.055] hover:text-paper-100',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          active ? 'text-forest-700' : 'text-paper-300/40 group-hover:text-paper-100',
        )}
        aria-hidden="true"
      />
      <span className="flex-1 text-left">{label}</span>
      {count > 0 ? (
        <span
          className={cn(
            'grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] font-bold',
            active ? 'bg-forest-800 text-paper-50' : 'bg-white/10 text-paper-100',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-line bg-white p-6 shadow-soft">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="mt-4 h-4 w-44" />
            <Skeleton className="mt-2 h-3 w-64" />
            <Skeleton className="mt-5 h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-line bg-white p-6 shadow-soft">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="mt-4 h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-52" />
            <Skeleton className="mt-5 h-11 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminDashboard({ session, isDemo, onSignOut }) {
  const { toast } = useToast()
  const [view, setView] = useState('agenda')
  const [filter, setFilter] = useState('today')
  const [appointments, setAppointments] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const email = session?.user?.email || ''
  const displayName = email
    ? capitalizeFirst(email.split('@')[0].replace(/[._-]+/g, ' '))
    : 'Sofía'
  const userSubtitle = email || 'Vista de demostración'

  const loadDashboardData = useCallback(async ({ showSkeleton = false } = {}) => {
    const { from, to } = getAppointmentsRange()
    if (showSkeleton) setLoading(true)
    setRefreshing(true)
    setError(null)

    try {
      const [settingsData, appointmentsData] = await Promise.all([
        fetchSettings(),
        fetchAppointments(from, to),
      ])
      setSettings(settingsData)
      setAppointments(appointmentsData)
      setDataReady(true)
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          'No pudimos cargar la agenda. Revisa la conexión e inténtalo de nuevo.',
        ),
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData({ showSkeleton: true })
  }, [loadDashboardData])

  async function handleStatusChange(appointment, status) {
    setUpdatingId(appointment.id)

    try {
      await updateAppointmentStatus(appointment.id, status)
      setAppointments((current) =>
        current.map((item) => (item.id === appointment.id ? { ...item, status } : item)),
      )

      const title =
        status === 'confirmed'
          ? 'Reserva confirmada'
          : status === 'cancelled'
            ? 'Reserva cancelada'
            : 'Reserva reabierta'

      toast({
        title,
        description: `${appointment.client_name} · ${appointment.service?.name || 'Servicio'} · ${normalizeTime(appointment.start_time)}`,
        tone: status === 'cancelled' ? 'info' : 'success',
      })
    } catch (statusError) {
      toast({
        title: 'No se pudo actualizar la reserva',
        description: getErrorMessage(statusError),
        tone: 'error',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSaveSettings(patch) {
    const updated = await updateSettings(patch)
    setSettings(updated)
    toast({
      title: 'Horario actualizado',
      description: 'La disponibilidad pública ya refleja los nuevos ajustes.',
      tone: 'success',
    })
  }

  async function handleSignOut() {
    try {
      await onSignOut()
      toast({
        title: 'Sesión cerrada',
        description: 'Hasta pronto.',
        tone: 'info',
      })
    } catch (signOutError) {
      toast({
        title: 'No pudimos cerrar la sesión',
        description: getErrorMessage(signOutError),
        tone: 'error',
      })
    }
  }

  const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length
  const activeToday = appointments.filter(
    (appointment) =>
      appointment.appointment_date === getTodayKey() && appointment.status !== 'cancelled',
  ).length

  return (
    <div className="min-h-screen bg-paper-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col overflow-hidden bg-forest-950 text-paper-50 lg:flex">
        <div className="noise pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-bronze-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative border-b border-white/10 px-6 py-7">
          <Brand name={settings.business_name} variant="dark" />
          <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.24em] text-paper-200/35">
            Panel de gestión
          </p>
        </div>

        <nav className="relative flex-1 px-3.5 py-6" aria-label="Navegación del panel">
          <p className="px-3 pb-3 text-[8px] font-bold uppercase tracking-[0.26em] text-paper-300/30">
            Gestión
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <MenuButton
                key={item.id}
                active={view === item.id}
                icon={item.icon}
                label={item.label}
                count={item.id === 'agenda' ? pendingCount : 0}
                onClick={() => setView(item.id)}
              />
            ))}
          </div>

          <div className="mt-7 border-t border-white/10 pt-5">
            <a
              href="#/"
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-paper-200/50 transition-colors hover:bg-white/[0.055] hover:text-paper-100"
            >
              <ArrowUpRight
                className="h-4 w-4 text-paper-300/30 group-hover:text-paper-100"
                aria-hidden="true"
              />
              Ver sitio público
            </a>
          </div>
        </nav>

        <div className="relative border-t border-white/10 p-3.5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bronze-300/20 text-[10px] font-bold text-bronze-100">
                {getInitials(displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-paper-100">{displayName}</p>
                <p className="mt-0.5 truncate text-[9px] text-paper-200/35">{userSubtitle}</p>
              </div>
            </div>

            {isDemo ? (
              <Badge variant="dark" className="mt-3 w-full justify-center border-bronze-300/15 bg-bronze-300/10 py-1.5 text-bronze-100">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Modo demostración
              </Badge>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 py-1.5 text-[10px] font-semibold text-paper-300/60 transition-colors hover:bg-white/[0.06] hover:text-paper-100"
              >
                <LogOut className="h-3 w-3" aria-hidden="true" />
                Cerrar sesión
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-[8px] uppercase tracking-[0.2em] text-paper-200/20">
            Serein Console · v1.0
          </p>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-paper-50/85 backdrop-blur-xl">
          <div className="mx-auto flex h-[4.5rem] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <div className="lg:hidden">
                <Brand name={settings.business_name} size="sm" />
              </div>
              <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/55 lg:flex">
                <span>Panel</span>
                <span className="text-line">/</span>
                <span className="text-forest-800">{view === 'agenda' ? 'Agenda' : 'Horario'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5 text-[10px] font-medium text-muted md:inline-flex">
                <CalendarDays className="h-3 w-3 text-forest-500" aria-hidden="true" />
                {formatAdminToday()}
              </span>

              {isDemo ? (
                <Badge variant="demo" dot className="hidden sm:inline-flex">
                  Demo
                </Badge>
              ) : null}

              <a
                href="#/"
                className="hidden h-8 items-center gap-1 rounded-full px-2.5 text-[10px] font-semibold text-muted transition-colors hover:bg-paper-100 hover:text-forest-900 sm:inline-flex"
              >
                Ver sitio
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>

              {!isDemo ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-paper-100 hover:text-forest-900 lg:hidden"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}

              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-forest-800 text-[9px] font-bold text-paper-50"
                title={displayName}
              >
                {getInitials(displayName)}
              </span>
            </div>
          </div>
        </header>

        <div className="sticky top-[4.5rem] z-20 flex gap-1 border-b border-line/80 bg-paper-50/90 px-4 py-2 backdrop-blur-xl lg:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-[11px] font-semibold transition-colors',
                  view === item.id
                    ? 'bg-forest-800 text-paper-50'
                    : 'text-muted hover:bg-paper-200/60 hover:text-forest-900',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
                {item.id === 'agenda' && pendingCount > 0 ? (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-white/15 px-1 text-[8px]">
                    {pendingCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.26em] text-bronze-600">
                <span className="h-px w-6 bg-bronze-400" aria-hidden="true" />
                {getGreeting()}, {displayName.split(' ')[0]}
              </p>
              <h1 className="mt-2 font-display text-4xl tracking-tight text-forest-950 sm:text-[2.75rem]">
                {view === 'agenda' ? 'Agenda del estudio' : 'Horario y disponibilidad'}
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted sm:text-sm">
                {view === 'agenda'
                  ? `${activeToday} cita${activeToday === 1 ? '' : 's'} activa${
                      activeToday === 1 ? '' : 's'
                    } para hoy. Revisa, confirma y mantén el ritmo del estudio.`
                  : 'Configura los días de apertura, los huecos y el WhatsApp que recibe cada reserva.'}
              </p>
            </div>

            {view === 'agenda' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadDashboardData()}
                disabled={refreshing || loading}
                className="w-fit"
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', refreshing ? 'animate-spin' : '')}
                  aria-hidden="true"
                />
                Actualizar agenda
              </Button>
            ) : null}
          </div>

          {!dataReady && !loading && error ? (
            <div className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-soft">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-2xl text-forest-950">
                No pudimos abrir la agenda
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{error}</p>
              <Button className="mt-5" onClick={() => loadDashboardData({ showSkeleton: true })}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          ) : null}

          {dataReady && error ? (
            <div
              className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error} Se muestran los últimos datos cargados.</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadDashboardData()}
                disabled={refreshing}
              >
                Reintentar
              </Button>
            </div>
          ) : null}

          {loading ? (
            view === 'agenda' ? (
              <div className="space-y-7">
                <StatsOverview loading />
                <AppointmentTable
                  appointments={[]}
                  filter={filter}
                  onFilterChange={setFilter}
                  onStatusChange={handleStatusChange}
                  loading
                  settings={settings}
                />
              </div>
            ) : (
              <SettingsSkeleton />
            )
          ) : view === 'agenda' && dataReady ? (
            <div className="space-y-7">
              <StatsOverview appointments={appointments} />
              <AppointmentTable
                appointments={appointments}
                filter={filter}
                onFilterChange={setFilter}
                onStatusChange={handleStatusChange}
                updatingId={updatingId}
                settings={settings}
              />
            </div>
          ) : view === 'settings' && dataReady ? (
            <ScheduleSettings
              settings={settings}
              isDemo={isDemo}
              onSave={handleSaveSettings}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}
