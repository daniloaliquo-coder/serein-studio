export const CURRENCY = import.meta.env.VITE_CURRENCY?.trim() || 'EUR'
export const DEFAULT_DIAL_CODE = '+34'

export const BUSINESS_PROFILE = {
  tagline: 'Estudio de belleza & bienestar',
  address: 'Calle de la Luna, 14',
  city: '28004 Madrid',
  email: 'hola@sereinstudio.com',
  instagram: '@serein.studio',
}

export const DEFAULT_SETTINGS = {
  id: 1,
  business_name: import.meta.env.VITE_BUSINESS_NAME?.trim() || 'Serein Studio',
  whatsapp_number: import.meta.env.VITE_BUSINESS_WHATSAPP?.trim() || '+54 9 261 541 8156',
  open_time: '09:00',
  close_time: '19:00',
  slot_interval_min: 30,
  working_days: [1, 2, 3, 4, 5, 6],
  closed_dates: [],
  booking_horizon_days: 60,
  min_notice_min: 60,
}

export const DEMO_SERVICES = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Corte & Estilo',
    duration_min: 45,
    price: 38,
    description: 'Corte personalizado, lavado y peinado con un acabado natural.',
    is_active: true,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Color & Balayage',
    duration_min: 120,
    price: 115,
    description: 'Coloración dimensional con diagnóstico previo y tratamiento de brillo.',
    is_active: true,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Ritual Facial',
    duration_min: 60,
    price: 68,
    description: 'Limpieza profunda, hidratación y masaje facial con productos botánicos.',
    is_active: true,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Manicura Rusa',
    duration_min: 60,
    price: 42,
    description: 'Preparación de cutícula, esmaltado semipermanente y acabado impecable.',
    is_active: true,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Masaje Relajante',
    duration_min: 75,
    price: 75,
    description: 'Masaje corporal de cuerpo completo con aceites esenciales.',
    is_active: true,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Peinado de Evento',
    duration_min: 60,
    price: 55,
    description: 'Peinado editorial para ocasiones especiales, con fijación de larga duración.',
    is_active: true,
  },
]

export const STATUS_META = {
  pending: {
    label: 'Pendiente',
    badgeTone: 'pending',
    description: 'Esperando confirmación por WhatsApp',
  },
  confirmed: {
    label: 'Confirmada',
    badgeTone: 'confirmed',
    description: 'Cita confirmada con la clienta',
  },
  cancelled: {
    label: 'Cancelada',
    badgeTone: 'cancelled',
    description: 'Horario liberado de nuevo',
  },
}

export const DIAL_CODES = [
  { code: '+34', label: 'España', flag: '🇪🇸' },
  { code: '+52', label: 'México', flag: '🇲🇽' },
  { code: '+54', label: 'Argentina', flag: '🇦🇷' },
  { code: '+56', label: 'Chile', flag: '🇨🇱' },
  { code: '+57', label: 'Colombia', flag: '🇨🇴' },
  { code: '+51', label: 'Perú', flag: '🇵🇪' },
  { code: '+1', label: 'EE. UU.', flag: '🇺🇸' },
]

function normalizeTimeString(value, fallback = '09:00') {
  if (typeof value !== 'string') return fallback
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return fallback
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

export function normalizeSettings(raw) {
  const merged = { ...DEFAULT_SETTINGS, ...(raw || {}) }
  const workingDays = Array.isArray(merged.working_days)
    ? [...new Set(merged.working_days.map(Number))].filter((day) => day >= 0 && day <= 6)
    : DEFAULT_SETTINGS.working_days

  return {
    ...merged,
    id: 1,
    business_name: String(merged.business_name || DEFAULT_SETTINGS.business_name).trim(),
    whatsapp_number: String(merged.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number).trim(),
    open_time: normalizeTimeString(merged.open_time, DEFAULT_SETTINGS.open_time),
    close_time: normalizeTimeString(merged.close_time, DEFAULT_SETTINGS.close_time),
    slot_interval_min: Number(merged.slot_interval_min) || DEFAULT_SETTINGS.slot_interval_min,
    working_days: workingDays.length ? workingDays.sort((a, b) => a - b) : DEFAULT_SETTINGS.working_days,
    closed_dates: Array.isArray(merged.closed_dates)
      ? [...new Set(merged.closed_dates.map((date) => String(date).slice(0, 10)))].sort()
      : [],
    booking_horizon_days:
      Number(merged.booking_horizon_days) || DEFAULT_SETTINGS.booking_horizon_days,
    min_notice_min: Number.isFinite(Number(merged.min_notice_min))
      ? Number(merged.min_notice_min)
      : DEFAULT_SETTINGS.min_notice_min,
  }
}
