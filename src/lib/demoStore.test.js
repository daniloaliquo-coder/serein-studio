import assert from 'node:assert/strict'
import test from 'node:test'

const STORAGE_KEY = 'serein-studio:demo-state:v1'
const BACKUP_KEY = `${STORAGE_KEY}:backup`

function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  }
}

// Cada test carga una instancia nueva del módulo para no compartir `cachedState`.
async function loadDemoStore(tag) {
  return import(`./demoStore.js?${tag}=${Date.now()}`)
}

test('demo store backs up a stale state before resetting it', async () => {
  const stale = {
    version: 0,
    seedDate: '2000-01-01',
    appointments: [
      {
        id: 'appointment-1',
        client_name: 'Ana Torres',
        client_phone: '+34 600 111 222',
        service_id: '11111111-1111-4111-8111-111111111111',
        appointment_date: '2026-05-12',
        start_time: '09:00',
        status: 'confirmed',
        created_at: '2026-05-01T10:00:00.000Z',
      },
    ],
  }

  globalThis.window = { localStorage: createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(stale) }) }
  const store = await loadDemoStore('stale')

  const appointments = store.getDemoAppointments('2026-05-01', '2026-05-31')

  assert.equal(appointments.length, 1, 'la cita guardada sobrevive al reinicio')
  assert.equal(appointments[0].client_name, 'Ana Torres')
  assert.deepEqual(
    JSON.parse(globalThis.window.localStorage.getItem(BACKUP_KEY)),
    stale,
    'el estado anterior queda respaldado tal cual',
  )
  assert.equal(
    JSON.parse(globalThis.window.localStorage.getItem(STORAGE_KEY)).version,
    1,
    'el estado activo se reescribe con la versión actual',
  )

  delete globalThis.window
})

test('demo store seeds a fresh state without writing a backup', async () => {
  globalThis.window = { localStorage: createMemoryStorage() }
  const store = await loadDemoStore('fresh')

  const services = store.getDemoServices()

  assert.ok(services.length > 0, 'siembra servicios de demo')
  assert.equal(globalThis.window.localStorage.getItem(BACKUP_KEY), null)
  assert.ok(globalThis.window.localStorage.getItem(STORAGE_KEY), 'persiste el estado inicial')

  delete globalThis.window
})

test('demo store keeps working when localStorage is blocked', async () => {
  globalThis.window = {
    localStorage: {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    },
  }
  const store = await loadDemoStore('blocked')

  assert.ok(store.getDemoServices().length > 0, 'la demo funciona en memoria')

  delete globalThis.window
})
