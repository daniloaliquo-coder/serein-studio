import {
  DEFAULT_SETTINGS,
  DEMO_SERVICES,
  normalizeSettings,
} from './defaults'
import {
  addDaysKey,
  fromDateKey,
  getTodayKey,
  normalizeTime,
} from './date'
import { getAvailableSlots } from './availability'
import { createId, digitsOnly } from './utils'

const STORAGE_KEY = 'serein-studio:demo-state:v1'
const BACKUP_KEY = `${STORAGE_KEY}:backup`
const STORE_VERSION = 1

let cachedState = null

const DEMO_SEEDS = [
  { offset: 0, time: '09:00', service: 1, client: 'Lucía Ferrer', phone: '+34 612 345 678', status: 'confirmed' },
  { offset: 0, time: '11:30', service: 0, client: 'Marta Ruiz', phone: '+34 623 456 789', status: 'pending' },
  { offset: 0, time: '12:30', service: 3, client: 'Claudia Ríos', phone: '+34 634 567 890', status: 'confirmed' },
  { offset: 0, time: '14:00', service: 2, client: 'Valeria Soto', phone: '+34 645 678 901', status: 'confirmed' },
  { offset: 0, time: '16:00', service: 4, client: 'Nerea Vidal', phone: '+34 656 789 012', status: 'pending' },
  { offset: 0, time: '17:30', service: 5, client: 'Paula Méndez', phone: '+34 667 890 123', status: 'cancelled' },
  { offset: 1, time: '09:30', service: 2, client: 'Inés Navarro', phone: '+34 678 901 234', status: 'confirmed' },
  { offset: 1, time: '11:00', service: 0, client: 'Sara Molina', phone: '+34 689 012 345', status: 'confirmed' },
  { offset: 1, time: '13:00', service: 1, client: 'Alba Castro', phone: '+34 690 123 456', status: 'pending' },
  { offset: 1, time: '16:00', service: 3, client: 'Elena Gil', phone: '+34 601 234 567', status: 'confirmed' },
  { offset: 2, time: '10:00', service: 2, client: 'Rocío León', phone: '+34 611 222 333', status: 'pending' },
  { offset: 2, time: '12:00', service: 4, client: 'Julia Prado', phone: '+34 622 333 444', status: 'confirmed' },
  { offset: 2, time: '15:30', service: 5, client: 'Marina Ortiz', phone: '+34 633 444 555', status: 'confirmed' },
  { offset: 4, time: '10:30', service: 0, client: 'Candela Vera', phone: '+34 644 555 666', status: 'confirmed' },
  { offset: 4, time: '12:00', service: 3, client: 'Noa Campos', phone: '+34 655 666 777', status: 'pending' },
  { offset: 4, time: '17:00', service: 2, client: 'Irene Salas', phone: '+34 666 777 888', status: 'confirmed' },
]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState))
  } catch {
    // Si el navegador bloquea localStorage, la demo sigue funcionando en memoria.
  }
}

// Copia de seguridad del estado anterior, tomada justo antes de reiniciarlo.
// La usa el modo demo para no perder citas si el reinicio falla o cambia de formato.
function backupState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) window.localStorage.setItem(BACKUP_KEY, raw)
  } catch {
    // Sin espacio o almacenamiento bloqueado: el estado actual sigue en su clave.
  }
}

function shouldSeedDate(dateKey, settings) {
  const day = fromDateKey(dateKey).getDay()
  return (
    settings.working_days.includes(day) &&
    !settings.closed_dates.includes(dateKey)
  )
}

function buildSeedAppointments(settings) {
  const today = getTodayKey()
  const baseTime = Date.now() - 1000 * 60 * 60 * 18

  return DEMO_SEEDS.flatMap((seed, index) => {
    const appointmentDate = addDaysKey(today, seed.offset)
    if (!shouldSeedDate(appointmentDate, settings)) return []

    return [
      {
        id: createId(),
        client_name: seed.client,
        client_phone: seed.phone,
        service_id: DEMO_SERVICES[seed.service].id,
        appointment_date: appointmentDate,
        start_time: seed.time,
        status: seed.status,
        created_at: new Date(baseTime + index * 1000 * 60 * 37).toISOString(),
      },
    ]
  })
}

function normalizeAppointment(raw) {
  if (!raw?.id || !raw?.appointment_date || !raw?.start_time) return null
  return {
    id: raw.id,
    client_name: String(raw.client_name || '').trim(),
    client_phone: String(raw.client_phone || '').trim(),
    service_id: raw.service_id,
    appointment_date: String(raw.appointment_date).slice(0, 10),
    start_time: normalizeTime(raw.start_time),
    status: ['pending', 'confirmed', 'cancelled'].includes(raw.status)
      ? raw.status
      : 'pending',
    created_at: raw.created_at || new Date().toISOString(),
  }
}

function createInitialState(existing) {
  const settings = normalizeSettings(existing?.settings || DEFAULT_SETTINGS)
  const appointments = Array.isArray(existing?.appointments)
    ? existing.appointments
    : buildSeedAppointments(settings)

  return {
    version: STORE_VERSION,
    seedDate: getTodayKey(),
    services: clone(DEMO_SERVICES),
    settings,
    appointments: appointments.map(normalizeAppointment).filter(Boolean),
  }
}

function getState() {
  if (cachedState) return cachedState

  const existing = readStorage()
  const today = getTodayKey()

  if (
    existing?.version === STORE_VERSION &&
    existing?.seedDate === today &&
    Array.isArray(existing.appointments)
  ) {
    cachedState = {
      version: STORE_VERSION,
      seedDate: today,
      services: Array.isArray(existing.services) && existing.services.length
        ? existing.services
        : clone(DEMO_SERVICES),
      settings: normalizeSettings(existing.settings),
      appointments: existing.appointments.map(normalizeAppointment).filter(Boolean),
    }
  } else {
    if (existing) backupState()
    cachedState = createInitialState(existing)
    persistState()
  }

  return cachedState
}

function saveState(state) {
  cachedState = state
  persistState()
  return state
}

function findService(state, serviceId) {
  return state.services.find((service) => service.id === serviceId)
}

function decorateAppointment(state, appointment) {
  return {
    ...appointment,
    service: findService(state, appointment.service_id) || null,
  }
}

function toBookedSlots(state, from, to) {
  return state.appointments
    .filter(
      (appointment) =>
        appointment.status !== 'cancelled' &&
        appointment.appointment_date >= from &&
        appointment.appointment_date <= to,
    )
    .map((appointment) => {
      const service = findService(state, appointment.service_id)
      return {
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        duration_min: service?.duration_min || 0,
      }
    })
}

export function getDemoServices() {
  const state = getState()
  return clone(state.services.filter((service) => service.is_active !== false))
}

export function getDemoSettings() {
  return clone(getState().settings)
}

export function getDemoBookedSlots(from, to) {
  return toBookedSlots(getState(), from, to)
}

export function getDemoAppointments(from, to) {
  const state = getState()
  return clone(
    state.appointments
      .filter(
        (appointment) =>
          appointment.appointment_date >= from &&
          appointment.appointment_date <= to,
      )
      .sort((a, b) => {
        if (a.appointment_date !== b.appointment_date) {
          return a.appointment_date.localeCompare(b.appointment_date)
        }
        return a.start_time.localeCompare(b.start_time)
      })
      .map((appointment) => decorateAppointment(state, appointment)),
  )
}

export function getDemoClientHistory(clientPhone, { limit = 200 } = {}) {
  const state = getState()
  const target = digitsOnly(clientPhone)
  if (!target) return { appointments: [], total: 0 }

  const matches = state.appointments
    .filter((appointment) => digitsOnly(appointment.client_phone) === target)
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return b.appointment_date.localeCompare(a.appointment_date)
      }
      return b.start_time.localeCompare(a.start_time)
    })

  return {
    appointments: clone(
      matches.slice(0, limit).map((appointment) => decorateAppointment(state, appointment)),
    ),
    total: matches.length,
  }
}

export function createDemoAppointment(payload) {
  const state = getState()
  const service = findService(state, payload.service_id)

  if (!service || service.is_active === false) {
    throw new Error('El servicio seleccionado no está disponible.')
  }

  const clientName = String(payload.client_name || '').trim()
  const clientPhone = String(payload.client_phone || '').trim()

  if (clientName.length < 2) {
    throw new Error('Escribe tu nombre completo.')
  }

  if (clientPhone.replace(/\D/g, '').length < 6) {
    throw new Error('Escribe un teléfono móvil válido.')
  }

  const dateKey = String(payload.appointment_date).slice(0, 10)
  const startTime = normalizeTime(payload.start_time)
  const availableSlots = getAvailableSlots(
    dateKey,
    service,
    state.settings,
    toBookedSlots(state, dateKey, dateKey),
    new Date(),
  )

  if (!availableSlots.some((slot) => slot.value === startTime)) {
    throw new Error('El horario seleccionado ya no está disponible.')
  }

  const appointment = {
    id: payload.id || createId(),
    client_name: clientName,
    client_phone: clientPhone,
    service_id: service.id,
    appointment_date: dateKey,
    start_time: startTime,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  saveState({
    ...state,
    appointments: [...state.appointments, appointment],
  })

  return clone(decorateAppointment(state, appointment))
}

export function updateDemoAppointmentStatus(id, status) {
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    throw new Error('Estado de reserva no válido.')
  }

  const state = getState()
  const current = state.appointments.find((appointment) => appointment.id === id)

  if (!current) {
    throw new Error('No encontramos esa reserva.')
  }

  if (status !== 'cancelled' && current.status === 'cancelled') {
    const service = findService(state, current.service_id)
    const slots = getAvailableSlots(
      current.appointment_date,
      service,
      state.settings,
      toBookedSlots(state, current.appointment_date, current.appointment_date),
    )

    if (!slots.some((slot) => slot.value === current.start_time)) {
      throw new Error('El horario seleccionado ya no está disponible.')
    }
  }

  const appointment = { ...current, status }
  saveState({
    ...state,
    appointments: state.appointments.map((item) =>
      item.id === id ? appointment : item,
    ),
  })

  return clone(decorateAppointment(state, appointment))
}

export function updateDemoSettings(patch) {
  const state = getState()
  const settings = normalizeSettings({ ...state.settings, ...patch })
  saveState({ ...state, settings })
  return clone(settings)
}
