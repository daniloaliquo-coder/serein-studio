import { differenceInCalendarDays, startOfDay } from 'date-fns'
import {
  fromDateKey,
  getNowMinutes,
  normalizeTime,
  timeToMinutes,
  toDateKey,
} from './date.js'

export function intervalsOverlap(startA, durationA, startB, durationB) {
  return startA < startB + durationB && startA + durationA > startB
}

export function getDayRule(dateKey, settings, now = new Date()) {
  if (!dateKey || !settings) {
    return { available: false, reason: 'closed' }
  }

  const date = fromDateKey(dateKey)
  const today = startOfDay(now)

  if (startOfDay(date) < today) {
    return { available: false, reason: 'past' }
  }

  const offset = differenceInCalendarDays(startOfDay(date), today)
  const horizon = Number(settings.booking_horizon_days) || 60

  if (offset > horizon) {
    return { available: false, reason: 'horizon' }
  }

  const workingDays = (settings.working_days || []).map(Number)
  if (!workingDays.includes(date.getDay())) {
    return { available: false, reason: 'closed' }
  }

  if ((settings.closed_dates || []).includes(dateKey)) {
    return { available: false, reason: 'closed' }
  }

  return { available: true, reason: null }
}

export function getBookedSlotsForDate(bookedSlots = [], dateKey) {
  return bookedSlots
    .filter((slot) => String(slot.appointment_date).slice(0, 10) === dateKey)
    .map((slot) => ({
      start: timeToMinutes(slot.start_time),
      duration: Number(slot.duration_min) || 0,
    }))
}

export function getAvailableSlots(
  dateKey,
  service,
  settings,
  bookedSlots = [],
  now = new Date(),
) {
  if (!service || !settings) return []

  const rule = getDayRule(dateKey, settings, now)
  if (!rule.available) return []

  const open = timeToMinutes(normalizeTime(settings.open_time))
  const close = timeToMinutes(normalizeTime(settings.close_time))
  const interval = Number(settings.slot_interval_min) || 30
  const duration = Number(service.duration_min) || 0
  const notice = Number(settings.min_notice_min) || 0

  if (duration <= 0 || close <= open) return []

  const isToday = dateKey === toDateKey(now)
  const earliestStart = isToday ? getNowMinutes(now) + notice : 0
  const busy = getBookedSlotsForDate(bookedSlots, dateKey)

  const slots = []

  for (let start = open; start + duration <= close; start += interval) {
    if (start < earliestStart) continue

    const overlaps = busy.some((slot) =>
      intervalsOverlap(start, duration, slot.start, slot.duration),
    )

    if (!overlaps) {
      slots.push({
        value: normalizeTime(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`),
        period: start < 13 * 60 ? 'morning' : 'afternoon',
      })
    }
  }

  return slots
}

export function getDayAvailability(dateKey, service, settings, bookedSlots, now = new Date()) {
  const rule = getDayRule(dateKey, settings, now)
  if (!rule.available) return rule

  const slots = getAvailableSlots(dateKey, service, settings, bookedSlots, now)
  if (!slots.length) {
    return { available: false, reason: 'full' }
  }

  return { available: true, reason: null, slots }
}
