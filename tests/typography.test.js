import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import tailwindConfig from '../tailwind.config.js'

// Guardia tipográfica de la spec 001 (RF-2 y RF-3).
// Falla mientras queden tamaños o espaciados entre letras fuera de la escala.
// Cuando la migración termine, este archivo debe pasar sin cambios.

const APP_DIR = fileURLToPath(new URL('../', import.meta.url))
const SRC_DIR = join(APP_DIR, 'src')
const MIN_FONT_PX = 11

const SIZE_PATTERN = /text-\[(\d+(?:\.\d+)?)(px|rem|em)\]/g
const EXPRESSION_PATTERN = /text-\[(?:clamp|calc)\([^\]]*\)\]/g
const TRACKING_PATTERN = /tracking-\[[^\]]+\]/g

const FILES = readdirSync(SRC_DIR, { recursive: true })
  .filter((name) => String(name).endsWith('.jsx'))
  .map((name) => join(SRC_DIR, String(name)))

function toPixels(size, unit) {
  const value = Number(size)
  if (unit === 'px') return value
  return value * 16
}

function collect(pattern) {
  const hits = []

  for (const file of FILES) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)

    lines.forEach((line, index) => {
      for (const match of line.matchAll(pattern)) {
        hits.push({
          file: relative(APP_DIR, file).replaceAll('\\', '/'),
          line: index + 1,
          value: match[0],
        })
      }
    })
  }

  return hits
}

function describe(hits) {
  return `${hits.length} usos:\n${hits
    .slice(0, 12)
    .map((hit) => `  ${hit.file}:${hit.line}  ${hit.value}`)
    .join('\n')}${hits.length > 12 ? `\n  ... y ${hits.length - 12} más` : ''}`
}

const REQUIRED_LEVELS = [
  'label-xs',
  'label-sm',
  'caption',
  'display-hero',
  'display-xl',
  'display-lg',
  'display-md',
]

test('RF-1: la escala de siete niveles está definida', () => {
  const fontSize = tailwindConfig.theme?.extend?.fontSize ?? {}
  const missing = REQUIRED_LEVELS.filter((level) => !fontSize[level])

  assert.deepEqual(missing, [], `Faltan niveles en la escala: ${missing.join(', ')}`)
})

test('RF-1: cada nivel es legible en sí mismo', () => {
  const fontSize = tailwindConfig.theme?.extend?.fontSize ?? {}

  const unreadable = REQUIRED_LEVELS.filter((level) => {
    const [size] = [].concat(fontSize[level] ?? [])
    const px = String(size).startsWith('clamp(')
      ? Number(String(size).match(/clamp\((\d+(?:\.\d+)?)rem/)[1]) * 16
      : Number(String(size).replace('px', ''))
    return px < MIN_FONT_PX
  })

  assert.deepEqual(unreadable, [], `Niveles bajo ${MIN_FONT_PX}px: ${unreadable.join(', ')}`)
})

test('RF-2: ningún texto por debajo del piso de 11 px', () => {
  const offenders = collect(SIZE_PATTERN).filter((hit) => {
    const [, size, unit] = hit.value.match(/text-\[(\d+(?:\.\d+)?)(px|rem|em)\]/)
    return toPixels(size, unit) < MIN_FONT_PX
  })

  assert.equal(offenders.length, 0, `Hay ${describe(offenders)}`)
})

test('RF-3: sin tamaños ni espaciados entre letras fuera de la escala', () => {
  const offenders = [
    ...collect(SIZE_PATTERN),
    ...collect(EXPRESSION_PATTERN),
    ...collect(TRACKING_PATTERN),
  ]

  assert.equal(offenders.length, 0, `Hay ${describe(offenders)}`)
})
