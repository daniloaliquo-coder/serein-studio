import { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react'
import { createAppointment } from '../../lib/api'
import {
  DIAL_CODES,
} from '../../lib/defaults'
import {
  buildAppointmentMessage,
  buildWhatsAppUrl,
  cn,
  createId,
  digitsOnly,
  formatCurrency,
  getErrorMessage,
  getFirstName,
} from '../../lib/utils'
import {
  formatDuration,
  formatLongDate,
  timeToMinutes,
  minutesToTime,
} from '../../lib/date'
import { Badge, StatusBadge } from '../ui/badge'
import { Button, buttonVariants } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start justify-between gap-5 px-5 py-3.5">
      <dt className="flex items-center gap-2 text-xs text-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-right text-xs font-semibold text-forest-950">{children}</dd>
    </div>
  )
}

export function ConfirmationStep({
  service,
  dateKey,
  time,
  settings,
  isDemo,
  onBack,
  onReset,
  onBooked,
}) {
  const [form, setForm] = useState({ name: '', phone: '', dialCode: '+34' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [booking, setBooking] = useState(null)

  const success = Boolean(booking)
  const reference = booking
    ? `SR-${booking.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
    : ''
  const endTime = minutesToTime(timeToMinutes(time) + Number(service.duration_min))

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    const cleanName = form.name.trim()
    const phoneDigits = digitsOnly(form.phone)

    if (cleanName.length < 2) {
      nextErrors.name = 'Escribe tu nombre y apellido.'
    }

    if (phoneDigits.length < 6 || phoneDigits.length > 15) {
      nextErrors.phone = 'Escribe un número de móvil válido.'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const saved = await createAppointment({
        id: createId(),
        client_name: cleanName,
        client_phone: `${form.dialCode} ${phoneDigits}`,
        service_id: service.id,
        appointment_date: dateKey,
        start_time: time,
        status: 'pending',
      })

      const completedBooking = {
        ...saved,
        service: saved.service || service,
        client_phone: saved.client_phone || `${form.dialCode} ${phoneDigits}`,
        client_name: saved.client_name || cleanName,
      }

      setBooking(completedBooking)
      onBooked?.(completedBooking)
    } catch (error) {
      setSubmitError(
        getErrorMessage(
          error,
          'No pudimos guardar tu reserva. Inténtalo de nuevo en unos segundos.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    const whatsappUrl = buildWhatsAppUrl(
      settings.whatsapp_number,
      buildAppointmentMessage({
        service: service.name,
        dateLabel: formatLongDate(dateKey),
        time,
        clientName: booking.client_name,
        clientPhone: booking.client_phone,
        reference,
      }),
    )

    return (
      <div className="animate-fade-up py-2 text-center sm:py-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={1.8} aria-hidden="true" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <Badge variant="pending" dot>
            Pendiente de confirmación
          </Badge>
          <Badge variant="neutral">#{reference}</Badge>
        </div>

        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-tight tracking-tight text-forest-950 sm:text-4xl">
          Reserva recibida, {getFirstName(booking.client_name)}.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Tu cita ha quedado guardada como <strong className="font-semibold text-forest-900">pendiente</strong>.
          Envíanos el mensaje de WhatsApp para que podamos confirmarla y reservar el hueco a tu
          nombre.
        </p>

        <div className="mx-auto mt-7 max-w-xl overflow-hidden rounded-2xl border border-line bg-white text-left shadow-soft">
          <div className="flex items-center justify-between gap-4 border-b border-line/80 bg-forest-950 px-5 py-4 text-paper-50">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-paper-200/55">
                Tu cita
              </p>
              <p className="mt-1 font-display text-xl">{service.name}</p>
            </div>
            <StatusBadge
              status="pending"
              className="border-white/15 bg-white/10 text-paper-100"
            />
          </div>
          <dl className="divide-y divide-line/70">
            <DetailRow icon={CalendarDays} label="Fecha">
              {formatLongDate(dateKey)}
            </DetailRow>
            <DetailRow icon={Clock3} label="Hora">
              {time} — {endTime} h
            </DetailRow>
            <DetailRow icon={Timer} label="Duración">
              {formatDuration(service.duration_min)}
            </DetailRow>
            <DetailRow icon={Check} label="Total">
              {formatCurrency(service.price)}
            </DetailRow>
            <DetailRow icon={Sparkles} label="Referencia">
              {reference}
            </DetailRow>
          </dl>
        </div>

        <div className="mx-auto mt-7 flex max-w-md flex-col items-stretch gap-3">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: 'whatsapp', size: 'xl' }),
                'w-full text-base',
              )}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Confirmar reserva por WhatsApp
            </a>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              El estudio todavía no ha configurado su número de WhatsApp. Contacta
              directamente con recepción para confirmar tu cita.
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-muted">
            Se abrirá WhatsApp con todos los datos de tu reserva ya escritos. Solo tienes que
            pulsar enviar.
          </p>

          <Button type="button" variant="outline" size="lg" onClick={onReset}>
            Reservar otra cita
          </Button>
        </div>

        {isDemo ? (
          <p className="mx-auto mt-6 max-w-md text-[10px] leading-relaxed text-muted/70">
            Modo demostración: esta reserva se ha guardado en el almacenamiento local de este
            navegador. Con Supabase configurado se guardará en la base de datos real.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-bronze-600">
          Paso 03 · Confirma tus datos
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-forest-950 sm:text-4xl">
          Solo queda un detalle
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Déjanos tu nombre y un móvil. Te escribiremos por WhatsApp para confirmar el turno.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-paper-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-800 text-paper-50">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-forest-950">{service.name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {formatLongDate(dateKey)} · {time} h
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-3 sm:border-0 sm:pt-0">
          <Badge variant="neutral">{formatDuration(service.duration_min)}</Badge>
          <span className="font-display text-xl text-forest-950">{formatCurrency(service.price)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="client-name" required>
              Nombre y apellido
            </Label>
            <Input
              id="client-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Ej. Elena García"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'client-name-error' : undefined}
            />
            {errors.name ? (
              <p id="client-name-error" className="mt-1.5 text-[11px] text-red-600" role="alert">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="client-phone" required>
              Teléfono móvil
            </Label>
            <div className="grid grid-cols-[6.5rem_1fr] gap-2">
              <Select
                aria-label="Prefijo internacional"
                value={form.dialCode}
                onChange={(event) => updateField('dialCode', event.target.value)}
              >
                {DIAL_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </Select>
              <Input
                id="client-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="612 345 678"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'client-phone-error' : undefined}
              />
            </div>
            {errors.phone ? (
              <p id="client-phone-error" className="mt-1.5 text-[11px] text-red-600" role="alert">
                {errors.phone}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-forest-50/70 p-3 text-[11px] leading-relaxed text-forest-700">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" aria-hidden="true" />
          Usamos tu teléfono únicamente para gestionar esta cita. Nada de listas de correo ni
          llamadas comerciales.
        </div>

        {submitError ? (
          <div
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p>{submitError}</p>
              <button
                type="button"
                onClick={onBack}
                className="mt-1 font-semibold underline underline-offset-2 hover:text-red-800"
              >
                Elegir otro horario
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line/80 pt-5 sm:flex-row sm:items-center">
          <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Atrás
          </Button>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button type="submit" size="lg" isLoading={isSubmitting} className="min-w-[13rem]">
              {!isSubmitting ? (
                <>
                  <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
                  Solicitar reserva
                </>
              ) : (
                <>
                  <CalendarCheck2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando reserva…
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-muted sm:text-right">
              La cita queda pendiente hasta tu confirmación por WhatsApp.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
