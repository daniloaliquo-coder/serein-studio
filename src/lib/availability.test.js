import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAvailableSlots,
  getBookedSlotsForDate,
  getDayAvailability,
  getDayRule,
  intervalsOverlap,
} from './availability.js'

// Fixture fijo: martes 12 de mayo de 2026, medianoche local.
// Los date keys del archivo son locales, así que el test no depende del día real.
const NOW = new Date(2026, 4, 12, 0, 0, 0)
const TUESDAY = '2026-05-12'
const WEDNESDAY = '2026-05-13'

const SETTINGS = {
  open_time: '09:00',
  close_time: '18:00',
  slot_interval_min: 30,
  working_days: [1, 2, 3, 4, 5, 6],
  closed_dates: [],
  booking_horizon_days: 60,
  min_notice_min: 0,
}

const SERVICE = { duration_min: 60 }

test('intervalsOverlap detects every partial overlap', () => {
  assert.equal(intervalsOverlap(600, 60, 630, 60), true, 'overlap at the end')
  assert.equal(intervalsOverlap(660, 60, 600, 90), true, 'overlap at the start')
  assert.equal(intervalsOverlap(600, 120, 630, 15), true, 'containment')
  assert.equal(intervalsOverlap(600, 60, 660, 60), false, 'touching intervals do not overlap')
  assert.equal(intervalsOverlap(600, 0, 600, 60), false, 'zero duration never overlaps')
})

test('getDayRule rejects past, far and non working days', () => {
  assert.deepEqual(getDayRule('2026-05-11', SETTINGS, NOW), { available: false, reason: 'past' })
  assert.deepEqual(getDayRule('2026-05-17', SETTINGS, NOW), { available: false, reason: 'closed' })
  assert.deepEqual(
    getDayRule(TUESDAY, { ...SETTINGS, closed_dates: [TUESDAY] }, NOW),
    { available: false, reason: 'closed' },
  )
  assert.deepEqual(getDayRule('2026-08-01', SETTINGS, NOW), { available: false, reason: 'horizon' })
  assert.deepEqual(getDayRule('', SETTINGS, NOW), { available: false, reason: 'closed' })
  assert.deepEqual(getDayRule(WEDNESDAY, SETTINGS, NOW), { available: true, reason: null })
})

test('getBookedSlotsForDate filters by date and normalizes duration', () => {
  const booked = [
    { appointment_date: TUESDAY, start_time: '09:00', duration_min: '90' },
    { appointment_date: WEDNESDAY, start_time: '10:00', duration_min: 45 },
    { appointment_date: TUESDAY, start_time: '15:30', duration_min: null },
  ]

  assert.deepEqual(getBookedSlotsForDate(booked, TUESDAY), [
    { start: 540, duration: 90 },
    { start: 930, duration: 0 },
  ])
  assert.deepEqual(getBookedSlotsForDate(booked, '2026-05-14'), [])
})

test('getAvailableSlots fills the day with the configured interval', () => {
  const slots = getAvailableSlots(TUESDAY, SERVICE, SETTINGS, [], NOW)

  assert.equal(slots.length, 17)
  assert.equal(slots[0].value, '09:00')
  assert.equal(slots.at(-1).value, '17:00')
  assert.equal(slots.find((slot) => slot.value === '12:30').period, 'morning')
  assert.equal(slots.find((slot) => slot.value === '13:00').period, 'afternoon')
})

test('getAvailableSlots blocks every start that overlaps a long appointment', () => {
  const booked = [{ appointment_date: TUESDAY, start_time: '10:00', duration_min: 90 }]
  const values = getAvailableSlots(TUESDAY, SERVICE, SETTINGS, booked, NOW).map((slot) => slot.value)

  assert.equal(values.includes('09:00'), true, 'ends exactly when the booking starts')
  for (const blocked of ['09:30', '10:00', '10:30', '11:00']) {
    assert.equal(values.includes(blocked), false, `${blocked} must be blocked`)
  }
  assert.equal(values.includes('11:30'), true, 'starts exactly when the booking ends')
  assert.equal(values.includes('12:30'), true, 'later slot is unaffected')
})

test('getAvailableSlots applies the minimum notice only to today', () => {
  const settings = { ...SETTINGS, min_notice_min: 60 }
  const now = new Date(2026, 4, 12, 10, 0, 0)

  assert.equal(getAvailableSlots(TUESDAY, SERVICE, settings, [], now)[0].value, '11:00')
  assert.equal(getAvailableSlots(WEDNESDAY, SERVICE, settings, [], now)[0].value, '09:00')
})

test('getAvailableSlots never exceeds the closing time', () => {
  const values = getAvailableSlots(TUESDAY, SERVICE, SETTINGS, [], NOW).map((slot) => slot.value)
  assert.equal(values.includes('17:30'), false)
})

test('getAvailableSlots returns nothing without service or settings', () => {
  assert.deepEqual(getAvailableSlots(TUESDAY, null, SETTINGS, [], NOW), [])
  assert.deepEqual(getAvailableSlots(TUESDAY, SERVICE, null, [], NOW), [])
  assert.deepEqual(getAvailableSlots(TUESDAY, { duration_min: 0 }, SETTINGS, [], NOW), [])
})

test('getDayAvailability reports a full day when every slot is taken', () => {
  const shortDay = { ...SETTINGS, close_time: '10:00' }

  assert.deepEqual(getDayAvailability(TUESDAY, SERVICE, shortDay, [], NOW).slots, [
    { value: '09:00', period: 'morning' },
  ])

  const booked = [{ appointment_date: TUESDAY, start_time: '09:00', duration_min: 60 }]
  assert.deepEqual(getDayAvailability(TUESDAY, SERVICE, shortDay, booked, NOW), {
    available: false,
    reason: 'full',
  })
})

test('getDayAvailability returns the day rule when the studio is closed', () => {
  assert.deepEqual(getDayAvailability('2026-05-11', SERVICE, SETTINGS, [], NOW), {
    available: false,
    reason: 'past',
  })
})
