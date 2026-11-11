import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BookingFlow } from './BookingFlow'
import { Brand } from '../ui/brand'
import { Badge } from '../ui/badge'
import { GridPulse } from '../ui/grid-pulse'
import { Button, buttonVariants } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { fetchServices, fetchSettings, isDemoMode } from '../../lib/api'
import {
  BUSINESS_PROFILE,
  DEFAULT_SETTINGS,
} from '../../lib/defaults'
import {
  getErrorMessage,
  buildWhatsAppUrl,
  capitalizeFirst,
} from '../../lib/utils'
import { normalizeTime } from '../../lib/date'

const PUBLIC_FEATURES = [
  {
    icon: CalendarDays,
    title: 'Elige tu ritual',
    description: 'Servicios con duración y precio claros, sin letra pequeña.',
  },
  {
    icon: Clock3,
    title: 'Disponibilidad real',
    description: 'Bloqueamos la agenda según la duración exacta de cada cita.',
  },
  {
    icon: MessageCircle,
    title: 'Confirmación directa',
    description: 'Recibes el resumen preparado para enviar por WhatsApp.',
  },
]

function getWorkingDaysLabel(workingDays = []) {
  const days = [...workingDays].map(Number).sort((a, b) => a - b)
  const isSame = (values) =>
    days.length === values.length && days.every((day) => values.includes(day))

  if (isSame([1, 2, 3, 4, 5, 6])) return 'Lunes a sábado'
  if (isSame([1, 2, 3, 4, 5])) return 'Lunes a viernes'

  const labels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days.map((day) => labels[day]).join(' · ')
}

function HeroVisual({ settings }) {
  return (
    <div className="relative mx-auto w-full max-w-[430px] animate-fade-up [animation-delay:140ms]">
      <div className="aspect-[4/5] overflow-hidden rounded-[3rem] border border-line bg-forest-950 p-6 shadow-card sm:p-8">
        <div className="relative flex h-full flex-col justify-between text-paper-50">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-paper-300/55">
            <span>Serein Studio</span>
            <span>Madrid</span>
          </div>

          <div className="relative mx-auto text-center">
            <span className="mx-auto mb-6 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10">
              <Sparkles className="h-5 w-5 text-paper-300" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <p className="font-display text-[2.5rem] font-light italic leading-[1.08] tracking-tight text-paper-50 sm:text-[3rem]">
              Cuida de ti,
              <br />
              sin complicarte.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper-50 text-forest-900">
                <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-paper-50">Tu próxima cita</p>
                <p className="mt-0.5 text-[10px] text-paper-300/55">
                  {getWorkingDaysLabel(settings.working_days)} · {normalizeTime(settings.open_time)}–
                  {normalizeTime(settings.close_time)}
                </p>
              </div>
              <a
                href="#reservar"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-paper-50 transition-colors hover:bg-white/20"
                aria-label="Ir a reservar"
              >
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-3 shadow-card sm:-left-8">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#128C7E]/10 text-[#128C7E]">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
            Confirmación
          </p>
          <p className="text-[11px] font-semibold text-ink">Directo por WhatsApp</p>
        </div>
      </div>

      <div className="absolute -right-4 top-16 hidden items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2.5 shadow-soft sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-forest-600" aria-hidden="true" />
        <span className="text-[10px] font-semibold text-ink">Agenda en tiempo real</span>
      </div>
    </div>
  )
}

function BookingSkeleton() {
  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_350px]">
      <div className="rounded-[2rem] border border-line bg-white p-6 shadow-card sm:p-7">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-sm" />
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="hidden h-[430px] rounded-[2rem] lg:block" />
    </div>
  )
}

export function BookingPage() {
  const [services, setServices] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let isActive = true
    setLoading(true)
    setError(null)

    Promise.all([fetchServices(), fetchSettings()])
      .then(([servicesData, settingsData]) => {
        if (!isActive) return
        setServices(servicesData)
        setSettings(settingsData)
      })
      .catch((fetchError) => {
        if (!isActive) return
        setError(
          getErrorMessage(
            fetchError,
            'No pudimos cargar la agenda. Inténtalo de nuevo en unos instantes.',
          ),
        )
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [reloadToken])

  const contactUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    `Hola, me gustaría reservar una cita en ${settings.business_name}.`,
  )

  return (
    <div id="top" className="relative overflow-x-clip">
      <a
        href="#reservar"
        className="sr-only z-[60] rounded-full bg-forest-900 px-4 py-2 text-sm text-paper-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar a reservas
      </a>

      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between gap-5 px-5 lg:px-8">
          <a href="#top" aria-label={`${settings.business_name}, inicio`}>
            <Brand name={settings.business_name} />
          </a>

          <nav
            className="hidden items-center gap-7 text-xs font-semibold text-muted lg:flex"
            aria-label="Navegación principal"
          >
            <a href="#como-funciona" className="transition-colors hover:text-forest-900">
              Cómo funciona
            </a>
            <a href="#reservar" className="transition-colors hover:text-forest-900">
              Rituales
            </a>
            <a href="#estudio" className="transition-colors hover:text-forest-900">
              El estudio
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="#/admin"
              className="hidden items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-forest-900 sm:inline-flex"
            >
              Acceso equipo
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href="#reservar"
              className={buttonVariants({ size: 'sm', variant: 'primary' })}
            >
              Reservar
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div
            className="pointer-events-none absolute -left-40 top-16 h-[28rem] w-[28rem] rounded-full bg-bronze-100/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-[22rem] w-[22rem] translate-x-1/3 rounded-full bg-forest-100/50 blur-3xl"
            aria-hidden="true"
          />

          <GridPulse className="opacity-75" cell={26} reach={2.4} ambient={2} maxLit={150} />

          <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-line/80 bg-white/60 py-1.5 pl-2 pr-3.5 backdrop-blur-sm">
                <span className="rounded-full bg-forest-800 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-paper-50">
                  Estudio boutique
                </span>
                <span className="text-[10px] font-semibold text-muted">
                  Belleza & bienestar · Madrid
                </span>
              </div>

              <h1
                data-grid-avoid
                className="mt-6 max-w-2xl text-balance font-display text-[clamp(3rem,7.2vw,5.15rem)] leading-[0.94] tracking-[-0.04em] text-forest-950"
              >
                Un momento para ti,
                <span className="block font-light italic text-bronze-500">
                  perfectamente reservado.
                </span>
              </h1>

              <p
                data-grid-avoid
                className="mt-6 max-w-lg text-pretty text-[15px] leading-relaxed text-muted sm:text-base"
              >
                Cabello, piel y manos en un solo lugar. Elige tu ritual, encuentra el hueco que
                mejor te venga y deja que nosotras nos ocupemos del resto.
              </p>

              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <a
                  href="#reservar"
                  className={buttonVariants({ size: 'lg', variant: 'primary' })}
                >
                  Reservar mi cita
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#128C7E]/10 text-[#128C7E]">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="text-[11px] leading-snug text-muted">
                    Confirmación <span className="font-semibold text-forest-900">por WhatsApp</span>
                    <br />
                    Sin pagos por adelantado
                  </p>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-5 border-t border-line/80 pt-6 text-[11px] font-medium text-muted">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-forest-500" aria-hidden="true" />
                  Agenda actualizada al momento
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-forest-500" aria-hidden="true" />
                  Tus datos, solo para tu cita
                </span>
              </div>
            </div>

            <HeroVisual settings={settings} />
          </div>
        </section>

        <section
          id="como-funciona"
          className="scroll-mt-24 border-y border-line/70 bg-white/45"
        >
          <div className="mx-auto grid max-w-6xl gap-16 px-5 md:grid-cols-3 lg:px-8">
            {PUBLIC_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-5 py-10 md:px-8 md:py-12"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-forest-50/40 text-forest-700">
                    <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={1.7} />
                  </span>
                  <div>
                    <h2 className="mt-1 font-display text-xl leading-tight tracking-tight text-forest-950">
                      {feature.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section
          id="reservar"
          className="scroll-mt-24 px-5 py-16 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-bronze-600">
                  <span className="h-px w-8 bg-bronze-400" aria-hidden="true" />
                  Agenda online
                </p>
                <h2 className="mt-3 text-balance font-display text-4xl tracking-tight text-forest-950 sm:text-5xl">
                  Reserva tu próximo ritual.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Tres pasos sencillos. Elige servicio, fecha y hora; nosotras confirmamos
                  contigo por WhatsApp.
                </p>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Badge variant="neutral" className="py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Agenda en vivo
                </Badge>
                {contactUrl ? (
                  <a
                    href={contactUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 transition-colors hover:text-forest-950"
                  >
                    ¿Prefieres escribirnos?
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-9">
              {loading ? <BookingSkeleton /> : null}

              {!loading && error ? (
                <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-card sm:p-12">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500">
                    <RefreshCw className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-3xl tracking-tight text-forest-950">
                    La agenda está tomando un respiro
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                    {error}
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button onClick={() => setReloadToken((value) => value + 1)}>
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Reintentar
                    </Button>
                    {contactUrl ? (
                      <a
                        href={contactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({ variant: 'outline' })}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Escribir al estudio
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!loading && !error ? (
                <BookingFlow services={services} settings={settings} isDemo={isDemoMode} />
              ) : null}
            </div>
          </div>
        </section>

        <section id="estudio" className="scroll-mt-24 px-5 pb-16 lg:px-8 lg:pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-forest-950 p-7 text-paper-50 shadow-float sm:p-10 lg:p-14">
            <div className="noise pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden="true" />
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-paper-100/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-4 top-10 h-52 w-52 rounded-full bg-bronze-400/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-bronze-300/80">
                  El estudio
                </p>
                <h2 className="mt-4 max-w-xl text-balance font-display text-3xl leading-[1.08] tracking-tight sm:text-4xl">
                  Un espacio pequeño.
                  <span className="block font-light italic text-bronze-200">
                    Una atención sin atajos.
                  </span>
                </h2>
                <p className="mt-5 max-w-lg text-sm leading-relaxed text-paper-200/60">
                  Trabajamos con agenda limitada y tiempos reales. Cada cita incluye una breve
                  consulta y el espacio necesario para que salgas exactamente como querías.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Badge variant="dark" className="py-1.5">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Atención personalizada
                  </Badge>
                  <Badge variant="dark" className="py-1.5">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Sin pagos online
                  </Badge>
                </div>
              </div>

              <div className="grid gap-5 self-end rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-bronze-300" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-paper-200/45">
                      Horario
                    </p>
                    <p className="mt-1 text-sm text-paper-100">
                      {capitalizeFirst(getWorkingDaysLabel(settings.working_days))}
                    </p>
                    <p className="text-xs text-paper-200/55">
                      {normalizeTime(settings.open_time)} — {normalizeTime(settings.close_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-bronze-300" aria-hidden="true" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-paper-200/45">
                      Visítanos
                    </p>
                    <p className="mt-1 text-sm text-paper-100">{BUSINESS_PROFILE.address}</p>
                    <p className="text-xs text-paper-200/55">{BUSINESS_PROFILE.city}</p>
                  </div>
                </div>

                {contactUrl ? (
                  <a
                    href={contactUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-paper-100 transition-colors hover:text-paper-200 sm:col-span-2 lg:col-span-1"
                  >
                    <MessageCircle className="h-4 w-4 text-bronze-300" aria-hidden="true" />
                    Hablemos por WhatsApp
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/80 bg-paper-100/40">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Brand name={settings.business_name} size="sm" />
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted">
                Belleza, cuidado y tiempo para ti. Reserva online y confirma por WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-5 text-xs">
              <div className="space-y-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted/60">
                  Reservas
                </p>
                <a href="#reservar" className="block font-medium text-forest-900 hover:text-bronze-600">
                  Rituales y precios
                </a>
                <a href="#como-funciona" className="block font-medium text-forest-900 hover:text-bronze-600">
                  Cómo funciona
                </a>
              </div>

              <div className="space-y-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted/60">
                  Estudio
                </p>
                <p className="text-forest-900">
                  {BUSINESS_PROFILE.address} · {BUSINESS_PROFILE.city}
                </p>
                <a
                  href="#/admin"
                  className="inline-flex items-center gap-1 font-medium text-forest-900 hover:text-bronze-600"
                >
                  Acceso al panel
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-line/80 pt-5 text-[10px] text-muted/70 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {settings.business_name}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-3">
              {isDemoMode ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-paper-100 px-2.5 py-1 font-semibold text-forest-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-paper-300" aria-hidden="true" />
                  Modo demostración · datos locales
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Conectado a Supabase
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
