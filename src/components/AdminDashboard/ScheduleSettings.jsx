import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CalendarOff,
  Clock3,
  Info,
  MessageCircle,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Timer,
  X,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { cn, digitsOnly, getErrorMessage } from '../../lib/utils'
import {
  formatCompactDate,
  getTodayKey,
  normalizeTime,
  timeToMinutes,
} from '../../lib/date'

const WEEK_DAYS = [
  { value: 1, label: 'Lun', full: 'Lunes' },
  { value: 2, label: 'Mar', full: 'Martes' },
  { value: 3, label: 'Mié', full: 'Miércoles' },
  { value: 4, label: 'Jue', full: 'Jueves' },
  { value: 5, label: 'Vie', full: 'Viernes' },
  { value: 6, label: 'Sáb', full: 'Sábado' },
  { value: 0, label: 'Dom', full: 'Domingo' },
]

const INTERVAL_OPTIONS = [15, 20, 30, 45, 60]

function toForm(settings) {
  return {
    business_name: settings.business_name || '',
    whatsapp_number: settings.whatsapp_number || '',
    open_time: normalizeTime(settings.open_time),
    close_time: normalizeTime(settings.close_time),
    slot_interval_min: String(settings.slot_interval_min ?? 30),
    min_notice_min: String(settings.min_notice_min ?? 60),
    booking_horizon_days: String(settings.booking_horizon_days ?? 60),
    working_days: [...(settings.working_days || [])].map(Number),
    closed_dates: [...(settings.closed_dates || [])],
  }
}

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100 text-forest-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-forest-950">{title}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function ScheduleSettings({ settings, isDemo, onSave }) {
  const [form, setForm] = useState(() => toForm(settings))
  const [closedDateInput, setClosedDateInput] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm(toForm(settings))
  }, [settings])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setFormError('')
  }

  function toggleDay(day) {
    setForm((current) => {
      const selected = current.working_days.includes(day)
      return {
        ...current,
        working_days: selected
          ? current.working_days.filter((value) => value !== day)
          : [...current.working_days, day].sort((a, b) => a - b),
      }
    })
    setErrors((current) => ({ ...current, working_days: '' }))
    setFormError('')
  }

  function addClosedDate() {
    if (!closedDateInput) return

    if (closedDateInput < getTodayKey()) {
      setErrors((current) => ({ ...current, closed_dates: 'Elige una fecha de hoy en adelante.' }))
      return
    }

    if (form.closed_dates.includes(closedDateInput)) {
      setErrors((current) => ({ ...current, closed_dates: 'Esa fecha ya está marcada como cierre.' }))
      return
    }

    setForm((current) => ({
      ...current,
      closed_dates: [...current.closed_dates, closedDateInput].sort(),
    }))
    setClosedDateInput('')
    setErrors((current) => ({ ...current, closed_dates: '' }))
  }

  function removeClosedDate(date) {
    setForm((current) => ({
      ...current,
      closed_dates: current.closed_dates.filter((value) => value !== date),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}

    if (form.business_name.trim().length < 2) {
      nextErrors.business_name = 'Escribe el nombre del estudio.'
    }

    if (digitsOnly(form.whatsapp_number).length < 7) {
      nextErrors.whatsapp_number = 'Incluye el prefijo internacional del número.'
    }

    if (timeToMinutes(form.close_time) <= timeToMinutes(form.open_time)) {
      nextErrors.close_time = 'La hora de cierre debe ser posterior a la de apertura.'
    }

    if (!form.working_days.length) {
      nextErrors.working_days = 'Selecciona al menos un día de apertura.'
    }

    const horizon = Number(form.booking_horizon_days)
    if (!Number.isFinite(horizon) || horizon < 7 || horizon > 365) {
      nextErrors.booking_horizon_days = 'Introduce un plazo entre 7 y 365 días.'
    }

    const notice = Number(form.min_notice_min)
    if (!Number.isFinite(notice) || notice < 0 || notice > 1440) {
      nextErrors.min_notice_min = 'Introduce entre 0 y 1440 minutos.'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setFormError('Hay algunos campos por revisar antes de guardar.')
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      await onSave({
        business_name: form.business_name.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        open_time: form.open_time,
        close_time: form.close_time,
        slot_interval_min: Number(form.slot_interval_min),
        working_days: [...form.working_days].sort((a, b) => a - b),
        closed_dates: [...form.closed_dates].sort(),
        booking_horizon_days: horizon,
        min_notice_min: notice,
      })
    } catch (saveError) {
      setFormError(
        getErrorMessage(saveError, 'No pudimos guardar los ajustes. Inténtalo de nuevo.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const workingDayLabels = WEEK_DAYS.filter((day) =>
    form.working_days.includes(day.value),
  ).map((day) => day.full)

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-forest-100 bg-forest-50/55 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-500" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-forest-800">
            Los cambios se aplican a la disponibilidad pública en cuanto se guardan.
            {isDemo
              ? ' En modo demo se guardan únicamente en este navegador.'
              : ' La agenda y los cierres se sincronizan con Supabase.'}
          </p>
        </div>
        {isDemo ? (
          <Badge variant="demo" className="w-fit shrink-0">
            Datos locales
          </Badge>
        ) : null}
      </div>

      {formError ? (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <SettingsCard
            icon={Sparkles}
            title="Identidad y contacto"
            description="El nombre visible y el número que recibirá la confirmación de cada reserva."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="business-name" required>
                  Nombre del estudio
                </Label>
                <Input
                  id="business-name"
                  value={form.business_name}
                  onChange={(event) => updateField('business_name', event.target.value)}
                  placeholder="Serein Studio"
                  aria-invalid={Boolean(errors.business_name)}
                />
                {errors.business_name ? (
                  <p className="mt-1.5 text-[10px] text-red-600" role="alert">
                    {errors.business_name}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="whatsapp-number" required>
                  WhatsApp del estudio
                </Label>
                <div className="relative">
                  <MessageCircle
                    className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/60"
                    aria-hidden="true"
                  />
                  <Input
                    id="whatsapp-number"
                    type="tel"
                    value={form.whatsapp_number}
                    onChange={(event) => updateField('whatsapp_number', event.target.value)}
                    placeholder="+34 600 123 456"
                    className="pl-9"
                    aria-invalid={Boolean(errors.whatsapp_number)}
                  />
                </div>
                {errors.whatsapp_number ? (
                  <p className="mt-1.5 text-[10px] text-red-600" role="alert">
                    {errors.whatsapp_number}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[10px] text-muted">Incluye el prefijo internacional.</p>
                )}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={CalendarDays}
            title="Días de apertura"
            description="Solo estos días aparecerán disponibles en el calendario público."
          >
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => {
                const selected = form.working_days.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    aria-pressed={selected}
                    aria-label={day.full}
                    className={cn(
                      'grid h-11 min-w-12 place-items-center rounded-xl border px-3 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/40',
                      selected
                        ? 'border-forest-800 bg-forest-800 text-cream-50 shadow-sm'
                        : 'border-line bg-white text-muted hover:border-forest-200 hover:bg-forest-50',
                    )}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
            {errors.working_days ? (
              <p className="mt-2 text-[10px] text-red-600" role="alert">
                {errors.working_days}
              </p>
            ) : (
              <p className="mt-3 text-[10px] leading-relaxed text-muted">
                {workingDayLabels.length
                  ? `Agenda abierta: ${workingDayLabels.join(', ')}.`
                  : 'Selecciona al menos un día para abrir la agenda.'}
              </p>
            )}
          </SettingsCard>

          <SettingsCard
            icon={CalendarOff}
            title="Cierres puntuales"
            description="Vacaciones, festivos o imprevistos. Esos días quedarán bloqueados al instante."
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="closed-date">Fecha de cierre</Label>
                <Input
                  id="closed-date"
                  type="date"
                  min={getTodayKey()}
                  value={closedDateInput}
                  onChange={(event) => {
                    setClosedDateInput(event.target.value)
                    setErrors((current) => ({ ...current, closed_dates: '' }))
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addClosedDate}
                disabled={!closedDateInput}
                className="sm:mb-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Añadir cierre
              </Button>
            </div>

            {errors.closed_dates ? (
              <p className="mt-2 text-[10px] text-red-600" role="alert">
                {errors.closed_dates}
              </p>
            ) : null}

            <div className="mt-4">
              {form.closed_dates.length ? (
                <div className="flex flex-wrap gap-2">
                  {form.closed_dates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1.5 rounded-full border border-clay-200 bg-clay-50 py-1 pl-3 pr-1.5 text-[10px] font-semibold text-clay-700"
                    >
                      {formatCompactDate(date)}
                      <button
                        type="button"
                        onClick={() => removeClosedDate(date)}
                        className="grid h-5 w-5 place-items-center rounded-full text-clay-500 transition-colors hover:bg-clay-100 hover:text-clay-800"
                        aria-label={`Quitar cierre del ${formatCompactDate(date)}`}
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line bg-cream-50/50 px-4 py-5 text-center">
                  <p className="text-[11px] text-muted">
                    No hay cierres programados. La agenda sigue su horario habitual.
                  </p>
                </div>
              )}
            </div>
          </SettingsCard>
        </div>

        <div className="space-y-5">
          <SettingsCard
            icon={Clock3}
            title="Horario de atención"
            description="Define la ventana diaria y cómo se reparten los huecos disponibles."
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="open-time">Apertura</Label>
                <Input
                  id="open-time"
                  type="time"
                  value={form.open_time}
                  onChange={(event) => updateField('open_time', event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="close-time">Cierre</Label>
                <Input
                  id="close-time"
                  type="time"
                  value={form.close_time}
                  onChange={(event) => updateField('close_time', event.target.value)}
                  aria-invalid={Boolean(errors.close_time)}
                />
              </div>
            </div>
            {errors.close_time ? (
              <p className="mt-1.5 text-[10px] text-red-600" role="alert">
                {errors.close_time}
              </p>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <Label htmlFor="slot-interval">Intervalo entre turnos</Label>
                <Select
                  id="slot-interval"
                  value={form.slot_interval_min}
                  onChange={(event) => updateField('slot_interval_min', event.target.value)}
                >
                  {INTERVAL_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      Cada {minutes} minutos
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="min-notice">Antelación mínima</Label>
                <div className="relative">
                  <Input
                    id="min-notice"
                    type="number"
                    min="0"
                    max="1440"
                    step="15"
                    value={form.min_notice_min}
                    onChange={(event) => updateField('min_notice_min', event.target.value)}
                    aria-invalid={Boolean(errors.min_notice_min)}
                    className="pr-14"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted">
                    min
                  </span>
                </div>
                {errors.min_notice_min ? (
                  <p className="mt-1.5 text-[10px] text-red-600" role="alert">
                    {errors.min_notice_min}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[10px] text-muted">
                    Tiempo mínimo para reservar el mismo día.
                  </p>
                )}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Settings2}
            title="Reglas de reserva"
            description="Controla con cuánta antelación pueden reservar tus clientas."
          >
            <Label htmlFor="booking-horizon">Reservas hasta</Label>
            <div className="relative">
              <Input
                id="booking-horizon"
                type="number"
                min="7"
                max="365"
                value={form.booking_horizon_days}
                onChange={(event) => updateField('booking_horizon_days', event.target.value)}
                aria-invalid={Boolean(errors.booking_horizon_days)}
                className="pr-14"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted">
                días
              </span>
            </div>
            {errors.booking_horizon_days ? (
              <p className="mt-1.5 text-[10px] text-red-600" role="alert">
                {errors.booking_horizon_days}
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                El calendario público no mostrará fechas más lejanas.
              </p>
            )}
          </SettingsCard>

          <aside className="relative overflow-hidden rounded-2xl border border-white/10 bg-forest-950 p-5 text-cream-50 shadow-soft">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/10"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-cream-200/50">
                Vista previa pública
              </p>
              <Badge variant="dark" dot className="border-white/10 bg-white/5 text-cream-100">
                Activa
              </Badge>
            </div>
            <p className="relative mt-4 font-display text-3xl tracking-tight text-cream-50">
              {form.open_time || '—'} <span className="text-cream-200/35">—</span>{' '}
              {form.close_time || '—'}
            </p>
            <p className="relative mt-1 text-[11px] leading-relaxed text-cream-200/55">
              {workingDayLabels.length ? workingDayLabels.join(' · ') : 'Sin días de apertura'}
            </p>

            <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-[10px]">
              <div className="flex items-start gap-2 text-cream-200/60">
                <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-300" aria-hidden="true" />
                <span>Huecos cada {form.slot_interval_min} min</span>
              </div>
              <div className="flex items-start gap-2 text-cream-200/60">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-300" aria-hidden="true" />
                <span>{form.booking_horizon_days} días de antelación</span>
              </div>
            </div>

            {form.closed_dates.length ? (
              <p className="relative mt-3 text-[10px] text-cream-200/40">
                {form.closed_dates.length} cierre{form.closed_dates.length === 1 ? '' : 's'}{' '}
                programado{form.closed_dates.length === 1 ? '' : 's'}
              </p>
            ) : null}
          </aside>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[10px] leading-relaxed text-muted">
          <Info className="h-3.5 w-3.5 shrink-0 text-forest-500" aria-hidden="true" />
          Guarda para publicar los cambios en la agenda de tus clientas.
        </p>
        <Button type="submit" isLoading={isSaving} className="sm:min-w-[11rem]">
          {!isSaving ? <Save className="h-4 w-4" aria-hidden="true" /> : null}
          Guardar ajustes
        </Button>
      </div>
    </form>
  )
}
