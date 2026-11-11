import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

/**
 * Una retícula fina que toma color al paso del puntero y lo suelta un momento
 * después, con unas pocas celdas que se encienden solas.
 *
 * El espectro va del bronce de la marca, arriba, al verde bosque, abajo: un
 * barrido revela una franja coherente de color en vez de confeti.
 *
 * Colócala dentro de un contenedor posicionado, por debajo del contenido. Es
 * solo decoración: oculta a la tecnología de asistencia, transparente al
 * puntero, dibujada en un único canvas que duerme cuando no hay nada encendido,
 * en pausa fuera de pantalla y quieta para quien pide menos movimiento.
 */

/** Tono arriba (bronce) y cuánto gira hacia abajo (verde bosque). */
const HUE_TOP = 38
const HUE_SPAN = -104
/** Saturación en los extremos (bronce y bosque) y en el centro del barrido. */
const SATURATION = 40
const SATURATION_MID = 22
/**
 * Cada celda toma una de estas luminosidades, para que un barrido se lea como
 * una carta de tintas y no como un color plano. Sobre fondo claro usa la escala
 * clara; sobre fondo oscuro arranca más profunda para no caer en el gris.
 */
const TINTS_LIGHT = [74, 66, 58, 50, 42]
const TINTS_DARK = [64, 57, 50, 43, 36]
/** Lo tenue que llega una celda justo detrás de una línea de texto. */
const FAINT = 0.13
/** Cuántas celdas hacen falta para volver a plena intensidad. */
const FADE = 2.2
/** Aire que se deja alrededor de cada línea de texto, en px. */
const PAD = 5
const FADE_IN = 160
const FADE_OUT = 750

const easeOut = (t) => 1 - (1 - t) ** 2
const easeIn = (t) => t * t

export function GridPulse({
  /** Tamaño de celda en px. Las líneas y las celdas encendidas lo comparten. */
  cell = 24,
  /** A qué distancia del puntero una celda todavía puede encenderse, en celdas. */
  reach = 2.6,
  /** Cuántas celdas se encienden solas en cada latido, para que la retícula viva. */
  ambient = 2,
  /** Un techo, para que un barrido rápido no encienda todo el campo a la vez. */
  maxLit = 180,
  /** Elementos cuyas líneas de texto la luz respeta, buscados dentro del padre. */
  avoid = '[data-grid-avoid]',
  className,
  style,
  ...props
}) {
  const box = useRef(null)
  const layer = useRef(null)

  useEffect(() => {
    const el = box.current
    const surface = layer.current
    const ctx = surface?.getContext('2d')
    if (!el || !surface || !ctx) return undefined

    let cols = 1
    let rows = 1
    let width = 0
    let height = 0
    let clear = []
    let tints = TINTS_LIGHT
    const cells = new Map()

    // Fondo claro u oscuro, leído del color de texto que hereda la retícula,
    // para que siga a cualquier tema. Se resuelve con un píxel, porque los
    // colores calculados pueden venir en oklch.
    const probe = document.createElement('canvas').getContext('2d', {
      willReadFrequently: true,
    })
    const readTheme = () => {
      if (!probe) return
      probe.clearRect(0, 0, 1, 1)
      probe.fillStyle = getComputedStyle(el).color
      probe.fillRect(0, 0, 1, 1)
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
      const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5
      tints = light ? TINTS_DARK : TINTS_LIGHT
    }

    // Protege las líneas de texto, no las cajas que las contienen: un párrafo
    // ajustado a una medida conserva ese ancho también en su última línea
    // corta, y la caja dejaría una banda de celdas apagadas donde no hay nada
    // que leer.
    const measureText = () => {
      const bounds = el.getBoundingClientRect()
      const scope = el.parentElement ?? document
      clear = [...scope.querySelectorAll(avoid)].flatMap((node) => {
        const range = document.createRange()
        range.selectNodeContents(node)
        const lines = [...range.getClientRects()].filter(
          (r) => r.width > 0 && r.height > 0,
        )
        const boxes = lines.length > 0 ? lines : [node.getBoundingClientRect()]
        return boxes.map(
          (r) =>
            new DOMRect(
              r.left - bounds.left - PAD,
              r.top - bounds.top - PAD,
              r.width + PAD * 2,
              r.height + PAD * 2,
            ),
        )
      })
    }

    const measure = () => {
      width = el.clientWidth
      height = el.clientHeight
      cols = Math.max(1, Math.ceil(width / cell))
      rows = Math.max(1, Math.ceil(height / cell))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      surface.width = Math.round(width * dpr)
      surface.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      readTheme()
      measureText()
      wake()
    }

    /**
     * Cuánto puede brillar una celda, según su distancia a la línea de texto
     * más cercana. Las celdas detrás de las palabras bajan, no se apagan: un
     * agujero en la retícula se lee como un fallo, un bajón de brillo como
     * profundidad.
     */
    const brightness = (col, row) => {
      const x = col * cell + cell / 2
      const y = row * cell + cell / 2
      let nearest = Number.POSITIVE_INFINITY
      for (const r of clear) {
        const dx = Math.max(r.left - x, 0, x - r.right)
        const dy = Math.max(r.top - y, 0, y - r.bottom)
        nearest = Math.min(nearest, Math.hypot(dx, dy))
        if (nearest === 0) break
      }
      if (nearest === Number.POSITIVE_INFINITY) return 1
      return FAINT + (1 - FAINT) * Math.min(1, nearest / (FADE * cell))
    }

    const ink = (row) => {
      const t = rows > 1 ? Math.min(1, row / (rows - 1)) : 0
      const hue = (((HUE_TOP - t * HUE_SPAN) % 360) + 360) % 360
      // Los extremos llevan la tinta de la marca; el tramo intermedio se apaga
      // hacia un oliva neutro, para que el barrido no cruce un verde ácido.
      const sat = SATURATION_MID + (SATURATION - SATURATION_MID) * Math.abs(2 * t - 1)
      const tint = tints[Math.floor(Math.random() * tints.length)]
      return `hsl(${Math.round(hue)} ${Math.round(sat)}% ${tint}%)`
    }

    // Sin movimiento no hay barrido, pero la retícula conserva su tinta: un
    // campo estático de color, pintado una vez y quieto. Quien pide menos
    // movimiento pierde la animación, no la pieza.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const paint = () => {
        width = el.clientWidth
        height = el.clientHeight
        cols = Math.max(1, Math.ceil(width / cell))
        rows = Math.max(1, Math.ceil(height / cell))
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        surface.width = Math.round(width * dpr)
        surface.height = Math.round(height * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        readTheme()
        measureText()
        ctx.clearRect(0, 0, width, height)
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (Math.random() > 0.06) continue
            ctx.globalAlpha = 0.34 * brightness(col, row)
            ctx.fillStyle = ink(row)
            ctx.fillRect(col * cell + 1, row * cell + 1, cell - 1, cell - 1)
          }
        }
        ctx.globalAlpha = 1
      }
      paint()
      const settle = new ResizeObserver(paint)
      settle.observe(el)
      // Las líneas de texto se mueven cuando llegan las tipografías web.
      document.fonts?.ready.then(paint).catch(() => {})
      return () => settle.disconnect()
    }

    // Un solo bucle dibuja todas las celdas; solo corre mientras algo está
    // encendido.
    let frame = 0
    const draw = (now) => {
      frame = 0
      ctx.clearRect(0, 0, width, height)
      for (const [key, c] of cells) {
        let alpha
        if (now < c.until) {
          alpha = easeOut(Math.min(1, (now - c.born) / FADE_IN))
        } else {
          const t = (now - c.until) / FADE_OUT
          if (t >= 1) {
            cells.delete(key)
            continue
          }
          alpha = 1 - easeIn(t)
        }
        ctx.globalAlpha = alpha * c.dim
        ctx.fillStyle = c.colour
        // Con un margen de una línea, la retícula sigue viéndose entre celdas.
        ctx.fillRect(c.col * cell + 1, c.row * cell + 1, cell - 1, cell - 1)
      }
      ctx.globalAlpha = 1
      if (cells.size > 0) frame = requestAnimationFrame(draw)
    }
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw)
    }

    /** Enciende una celda, salvo que esté fuera de la retícula o ya encendida. */
    const light = (col, row, hold) => {
      if (col < 0 || row < 0 || col >= cols || row >= rows) return
      if (cells.size >= maxLit) return
      const key = `${col},${row}`
      const now = performance.now()
      const lit = cells.get(key)
      if (lit && now < lit.until) return
      // Una celda atrapada de nuevo mientras se apaga retoma desde donde
      // estaba, en vez de parpadear.
      let born = now
      if (lit) {
        const faded = 1 - easeIn(Math.min(1, (now - lit.until) / FADE_OUT))
        born = now - (1 - Math.sqrt(1 - faded)) * FADE_IN
      }
      cells.set(key, {
        col,
        row,
        colour: lit?.colour ?? ink(row),
        dim: brightness(col, row),
        born,
        until: now + hold,
      })
      wake()
    }

    // El puntero pinta. Las celdas más lejos se encienden menos veces, así el
    // borde del rastro se rompe en vez de moverse como un bloque.
    let pending = 0
    let at = null
    const paint = () => {
      pending = 0
      if (!at) return
      const cx = Math.floor(at.x / cell)
      const cy = Math.floor(at.y / cell)
      const span = Math.ceil(reach)
      for (let dy = -span; dy <= span; dy++) {
        for (let dx = -span; dx <= span; dx++) {
          const away = Math.hypot(dx, dy)
          if (away > reach) continue
          if (Math.random() > 1 - away / (reach + 0.6)) continue
          light(cx + dx, cy + dy, 260 + Math.random() * 900)
        }
      }
    }
    // Se escucha en la ventana, porque la retícula va bajo el contenido y nunca
    // recibe el puntero directamente.
    const onMove = (event) => {
      const bounds = el.getBoundingClientRect()
      at = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      if (!pending) pending = requestAnimationFrame(paint)
    }

    // Unas pocas celdas se encienden solas, para que la retícula viva al llegar
    // y también en una pantalla sin puntero. En pausa fuera de la vista.
    let visible = true
    let beat = 0
    const drift = () => {
      beat = window.setTimeout(drift, 1400 + Math.random() * 1800)
      if (!visible || document.hidden) return
      for (let i = 0; i < ambient; i++) {
        light(
          Math.floor(Math.random() * cols),
          Math.floor(Math.random() * rows),
          900 + Math.random() * 1600,
        )
      }
    }
    beat = window.setTimeout(drift, 500)

    const sight = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
    })
    sight.observe(el)
    const resize = new ResizeObserver(measure)
    resize.observe(el)
    // Texto añadido, quitado o reescrito mueve las líneas que hay que respetar.
    let recheck = 0
    const copy = new MutationObserver(() => {
      if (!recheck) {
        recheck = requestAnimationFrame(() => {
          recheck = 0
          measureText()
        })
      }
    })
    copy.observe(el.parentElement ?? document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    const theme = new MutationObserver(readTheme)
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    })
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', readTheme)
    measure()
    // Las líneas de texto se mueven cuando llegan las tipografías web.
    document.fonts?.ready.then(measureText).catch(() => {})
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      sight.disconnect()
      resize.disconnect()
      copy.disconnect()
      cancelAnimationFrame(recheck)
      theme.disconnect()
      scheme.removeEventListener('change', readTheme)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(pending)
      clearTimeout(beat)
      window.removeEventListener('pointermove', onMove)
    }
  }, [cell, reach, ambient, maxLit, avoid])

  return (
    <div
      ref={box}
      aria-hidden="true"
      data-slot="grid-pulse"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        // Se desvanece por abajo, para que lo que sigue pueda subir por encima.
        '[mask-image:linear-gradient(to_bottom,#000_92%,transparent)]',
        className,
      )}
      style={{
        '--grid-pulse-cell': `${cell}px`,
        // Las líneas, apenas visibles, para que las celdas conserven su tinta.
        // Se puede sobrescribir con --grid-pulse-line.
        '--grid-pulse-line': 'rgba(15, 27, 21, 0.06)',
        backgroundImage:
          'linear-gradient(to right, var(--grid-pulse-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-pulse-line) 1px, transparent 1px)',
        backgroundSize: 'var(--grid-pulse-cell) var(--grid-pulse-cell)',
        ...style,
      }}
      {...props}
    >
      <canvas ref={layer} className="absolute inset-0 size-full" />
    </div>
  )
}
