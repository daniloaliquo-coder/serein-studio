import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CURRENCY } from './defaults.js'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-ES').format(Number(value) || 0)
}

export function capitalizeFirst(value = '') {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function getFirstName(name = '') {
  return name.trim().split(/\s+/)[0] || ''
}

export function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '')
}

export function buildWhatsAppUrl(phone, message = '') {
  const digits = digitsOnly(phone)
  if (!digits) return null
  const query = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${query}`
}

export function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function getErrorMessage(error, fallback = 'Algo no salió como esperábamos.') {
  const message = error?.message || ''
  if (!message) return fallback
  if (message.includes('El horario seleccionado ya no está disponible')) {
    return 'Ese horario acaba de ocuparse. Elige otro turno, por favor.'
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
  }
  if (message.includes('Invalid login credentials')) {
    return 'El email o la contraseña no son correctos.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Tu email todavía no está confirmado. Revisa tu bandeja de entrada.'
  }
  return message
}

export function buildAppointmentMessage({ service, dateLabel, time, clientName, clientPhone, reference }) {
  return [
    `Hola, quiero confirmar mi reserva en el estudio.`,
    '',
    `• Servicio: ${service}`,
    `• Fecha: ${dateLabel}`,
    `• Hora: ${time}`,
    `• Nombre: ${clientName}`,
    `• Teléfono: ${clientPhone}`,
    `• Referencia: ${reference}`,
    '',
    '¡Gracias!',
  ].join('\n')
}
