import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { capitalizeFirst } from './utils'

export function toDateKey(date = new Date()) {
  return format(date, 'yyyy-MM-dd')
}

export function fromDateKey(dateKey) {
  if (!dateKey) return null
  const [year, month, day] = String(dateKey).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return parseISO(dateKey)
  return new Date(year, month - 1, day, 12, 0, 0)
}

export function getTodayKey() {
  return toDateKey(new Date())
}

export function getTomorrowKey() {
  return toDateKey(addDays(new Date(), 1))
}

export function addDaysKey(dateKey, amount) {
  return toDateKey(addDays(fromDateKey(dateKey), amount))
}

export function getWeekEndKey(date = new Date()) {
  return toDateKey(endOfWeek(date, { weekStartsOn: 1 }))
}

export function getMonthBounds(monthDate) {
  return {
    from: toDateKey(startOfMonth(monthDate)),
    to: toDateKey(endOfMonth(monthDate)),
  }
}

export function getCalendarDays(monthDate) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end: addDays(start, 41) })
}

export function isDateInMonth(date, monthDate) {
  return isSameMonth(date, monthDate)
}

export function isToday(date) {
  return isSameDay(date, new Date())
}

export function isPastDateKey(dateKey) {
  return differenceInCalendarDays(fromDateKey(dateKey), startOfDay(new Date())) < 0
}

export function daysFromToday(dateKey) {
  return differenceInCalendarDays(fromDateKey(dateKey), startOfDay(new Date()))
}

export function formatLongDate(dateKey, { includeYear = true } = {}) {
  const date = fromDateKey(dateKey)
  if (!date) return ''
  const pattern = includeYear ? "EEEE, d 'de' MMMM 'de' yyyy" : "EEEE, d 'de' MMMM"
  return capitalizeFirst(format(date, pattern, { locale: es }))
}

export function formatGroupDate(dateKey) {
  const date = fromDateKey(dateKey)
  if (!date) return ''
  return capitalizeFirst(format(date, "EEEE, d 'de' MMMM", { locale: es }))
}

export function formatShortDate(dateKey) {
  const date = fromDateKey(dateKey)
  if (!date) return ''
  return format(date, "d 'de' MMM", { locale: es })
}

export function formatCompactDate(dateKey) {
  const date = fromDateKey(dateKey)
  if (!date) return ''
  return format(date, "d MMM yyyy", { locale: es })
}

export function formatMonthLabel(monthDate) {
  return capitalizeFirst(format(monthDate, "MMMM 'de' yyyy", { locale: es }))
}

export function formatAdminToday(date = new Date()) {
  return capitalizeFirst(format(date, "EEEE, d 'de' MMMM", { locale: es }))
}

export function formatWeekdayShort(date) {
  return format(date, 'EEEEE', { locale: es })
}

export function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return capitalizeFirst(format(date, "d MMM yyyy, HH:mm", { locale: es }))
}

export function normalizeTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export function timeToMinutes(value) {
  if (!value) return 0
  const [hours = 0, minutes = 0] = String(value).split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function formatDuration(minutes) {
  const total = Number(minutes) || 0
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export function getNowMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes()
}

export function startOfToday(date = new Date()) {
  return startOfDay(date)
}

export function addMonth(date, amount) {
  return addMonths(date, amount)
}
