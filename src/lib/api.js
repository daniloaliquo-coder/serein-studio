import { supabase } from './supabaseClient'
import { isSupabaseConfigured } from './supabaseClient'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
} from './defaults'
import { normalizeTime } from './date'
import { createId } from './utils'
import {
  createDemoAppointment,
  getDemoAppointments,
  getDemoBookedSlots,
  getDemoClientHistory,
  getDemoServices,
  getDemoSettings,
  updateDemoAppointmentStatus,
  updateDemoSettings,
} from './demoStore'

export const isDemoMode = !isSupabaseConfigured

function normalizeService(service) {
  if (!service) return null
  return {
    ...service,
    duration_min: Number(service.duration_min) || 0,
    price: Number(service.price) || 0,
  }
}

function normalizeAppointment(appointment) {
  const rawService = Array.isArray(appointment.service)
    ? appointment.service[0]
    : appointment.service

  return {
    ...appointment,
    appointment_date: String(appointment.appointment_date).slice(0, 10),
    start_time: normalizeTime(appointment.start_time),
    service: normalizeService(rawService),
  }
}

export async function fetchServices() {
  if (isDemoMode) return getDemoServices()

  const { data, error } = await supabase
    .from('services')
    .select('id, name, duration_min, price, description, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizeService)
}

export async function fetchSettings() {
  if (isDemoMode) return getDemoSettings()

  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return normalizeSettings(data || DEFAULT_SETTINGS)
}

export async function fetchBookedSlots(from, to) {
  if (isDemoMode) return getDemoBookedSlots(from, to)

  const { data, error } = await supabase.rpc('get_booked_slots', {
    p_from: from,
    p_to: to,
  })

  if (error) throw error
  return (data || []).map((slot) => ({
    appointment_date: String(slot.appointment_date).slice(0, 10),
    start_time: normalizeTime(slot.start_time),
    duration_min: Number(slot.duration_min) || 0,
  }))
}

export async function fetchAppointments(from, to) {
  if (isDemoMode) return getDemoAppointments(from, to)

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
        id,
        client_name,
        client_phone,
        service_id,
        appointment_date,
        start_time,
        status,
        created_at,
        service:services (id, name, duration_min, price)
      `,
    )
    .gte('appointment_date', from)
    .lte('appointment_date', to)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizeAppointment)
}

export async function fetchClientHistory(clientPhone, { limit = 200 } = {}) {
  const phone = String(clientPhone || '').trim()
  if (!phone) return { appointments: [], total: 0 }

  if (isDemoMode) return getDemoClientHistory(phone, { limit })

  const { data, error, count } = await supabase
    .from('appointments')
    .select(
      `
        id,
        client_name,
        client_phone,
        service_id,
        appointment_date,
        start_time,
        status,
        created_at,
        service:services (id, name, duration_min, price)
      `,
      { count: 'exact' },
    )
    .eq('client_phone', phone)
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(limit)

  if (error) throw error

  const appointments = (data || []).map(normalizeAppointment)

  return {
    appointments,
    total: Number(count) || appointments.length,
  }
}

export async function createAppointment(payload) {
  const normalized = {
    id: payload.id || createId(),
    client_name: String(payload.client_name || '').trim(),
    client_phone: String(payload.client_phone || '').trim(),
    service_id: payload.service_id,
    appointment_date: String(payload.appointment_date).slice(0, 10),
    start_time: normalizeTime(payload.start_time),
    status: 'pending',
  }

  if (isDemoMode) return createDemoAppointment(normalized)

  const { error } = await supabase.from('appointments').insert(normalized)

  if (error) throw error
  return normalized
}

export async function updateAppointmentStatus(id, status) {
  if (isDemoMode) return updateDemoAppointmentStatus(id, status)

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    throw new Error('Estado de reserva no válido.')
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single()

  if (error) throw error
  return data
}

export async function updateSettings(patch) {
  if (isDemoMode) return updateDemoSettings(patch)

  const payload = {
    id: 1,
    ...patch,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('business_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error
  return normalizeSettings(data)
}
