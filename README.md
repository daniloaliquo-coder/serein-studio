# Serein Studio — Plataforma de reservas

Aplicación completa de reservas para un estudio de belleza y bienestar. Incluye una
experiencia pública de reserva en tres pasos y un panel privado para gestionar la agenda,
las reservas y el horario del negocio.

La interfaz está en español, con una estética boutique y componentes propios al estilo
Shadcn UI.

---

## 1. Stack

- **React 19** + **Vite 8**
- **Tailwind CSS 3**
- **Lucide React** para iconografía
- **date-fns** para fechas y calendario
- **Supabase** (PostgreSQL + RLS + Auth + RPC)
- **Oxlint** para análisis estático

---

## 2. Puesta en marcha rápida

Requisitos: **Node.js `^20.19.0` o `>=22.12.0`** y npm.

```bash
cd plataforma-reservas
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`).

- Reservas públicas: `http://localhost:5173/#/`
- Panel de administración: `http://localhost:5173/#/admin`

> Sin variables de entorno de Supabase, la app arranca automáticamente en **modo
> demostración** con datos locales y no pide login. Es la forma más rápida de probar
> todo el flujo.

### Comandos disponibles

```bash
npm run dev       # servidor de desarrollo con HMR
npm run build     # build de producción en dist/
npm run preview   # previsualiza el build de producción
npm run lint      # análisis estático con Oxlint
```

### Instalación desde cero

Si necesitas reconstruir el proyecto en otro directorio:

```bash
npm create vite@latest plataforma-reservas -- --template react
cd plataforma-reservas
npm install
npm install @supabase/supabase-js lucide-react date-fns clsx tailwind-merge class-variance-authority
npm install -D tailwindcss@3 postcss autoprefixer
```

Después copia la configuración de Tailwind, PostCSS, `index.html`, `src/` y
`supabase/schema.sql` de este proyecto.

---

## 3. Configurar Supabase (producción)

### 3.1 Crear el proyecto y las tablas

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor → New query**.
3. Pega el contenido completo de [`supabase/schema.sql`](./supabase/schema.sql).
4. Pulsa **Run**.

El script crea:

| Tabla | Uso |
| --- | --- |
| `services` | Catálogo de servicios con precio, duración y estado. |
| `appointments` | Reservas con cliente, teléfono, servicio, fecha, hora y estado. |
| `business_settings` | Fila única con horario, días de apertura, cierres y WhatsApp. |

También instala:

- Índices para fecha, servicio y estado.
- RLS para que el público solo pueda leer servicios activos y crear citas `pending`.
- La función `get_booked_slots(from, to)`, que expone únicamente fecha, hora y duración
  de las citas ocupadas (nunca nombres ni teléfonos).
- Un trigger anti-solapamiento que tiene en cuenta la duración de cada servicio y
  serializa las comprobaciones por fecha para evitar dobles reservas concurrentes.

### 3.2 Crear el usuario del estudio

1. Ve a **Authentication → Users → Add user**.
2. Escribe el email y la contraseña del dueño o del equipo.
3. Marca **Auto Confirm User**.
4. Guarda.

Con el esquema incluido, **cualquier usuario autenticado del proyecto puede administrar
la agenda**. Para un estudio con un solo dueño, desactiva los registros públicos en
**Authentication → Providers → Email** y crea únicamente los usuarios del equipo. Si
necesitas roles más finos, añade un custom claim o una tabla de roles y ajusta las
políticas RLS de `appointments`, `services` y `business_settings`.

### 3.3 Variables de entorno

Crea un archivo `.env.local` en `plataforma-reservas/` (nunca lo subas al repositorio):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

Puedes partir de [`.env.example`](./.env.example):

```bash
cp .env.example .env.local
```

Opcionales:

```env
VITE_BUSINESS_WHATSAPP=34600000000
VITE_CURRENCY=EUR
```

- `VITE_BUSINESS_WHATSAPP` solo se usa como número inicial en modo demo. En Supabase,
  el número real se configura desde **Panel → Horario → WhatsApp del estudio**.
- `VITE_CURRENCY` acepta códigos ISO como `EUR`, `USD`, `MXN`, `COP` o `ARS`.

Después de crear o modificar `.env.local`, reinicia el servidor de desarrollo.

> La `anon key` es pública por diseño; la seguridad real la aportan las políticas RLS.
> **Nunca** pongas la `service_role key` en una variable `VITE_*` ni en el frontend.

---

## 4. Flujo público

1. **Servicio**: tarjetas con precio, duración y descripción.
2. **Fecha y hora**: calendario mensual con días cerrados, festivos, plazo máximo,
   antelación mínima y huecos calculados según la duración del servicio. Las citas
   existentes bloquean automáticamente los turnos que se solapan.
3. **Datos**: nombre y teléfono con prefijo internacional. La reserva se guarda como
   `pending`.
4. **Confirmación**: se muestra la referencia de la cita y un botón
   **“Confirmar reserva por WhatsApp”** con el mensaje ya redactado para el número del
   estudio.

La reserva no se considera confirmada hasta que el estudio la acepta desde el panel.

---

## 5. Panel de administración

Ruta: `#/admin`.

- Acceso con Supabase Auth (email + contraseña). En modo demo se entra directamente.
- KPIs del día: turnos, confirmados/pendientes/cancelados e ingresos estimados.
- Servicio más demandado de la semana.
- Agenda agrupada por día con filtros **Hoy**, **Mañana**, **Esta semana** y **Todas**.
- Búsqueda por clienta, teléfono o servicio, y filtro por estado.
- Acciones de un clic:
  - Pendiente → **Confirmar**.
  - Pendiente/confirmada → **Cancelar**.
  - Cancelada → **Reabrir**.
- Modal de detalle con contacto directo por WhatsApp.
- Configuración persistente de:
  - Nombre y WhatsApp del estudio.
  - Días de apertura y horario diario.
  - Intervalo entre turnos.
  - Antelación mínima para reservas del mismo día.
  - Plazo máximo de reserva.
  - Cierres puntuales.

Los cambios de horario afectan inmediatamente al calendario público.

---

## 6. Estructura del proyecto

```text
plataforma-reservas/
├─ supabase/
│  └─ schema.sql                 # Esquema completo, RLS, RPC y trigger
├─ src/
│  ├─ components/
│  │  ├─ ClientBooking/
│  │  │  ├─ BookingPage.jsx      # Landing + carga de datos
│  │  │  ├─ BookingFlow.jsx      # Wizard de 3 pasos
│  │  │  ├─ ServiceSelect.jsx
│  │  │  ├─ TimeSlotPicker.jsx   # Calendario y disponibilidad
│  │  │  ├─ BookingSummary.jsx
│  │  │  └─ ConfirmationStep.jsx # Formulario + éxito WhatsApp
│  │  ├─ AdminDashboard/
│  │  │  ├─ AdminLogin.jsx
│  │  │  ├─ AdminDashboard.jsx
│  │  │  ├─ StatsOverview.jsx
│  │  │  ├─ AppointmentTable.jsx
│  │  │  └─ ScheduleSettings.jsx
│  │  └─ ui/                     # Button, Badge, Input, Select, Dialog, Toast…
│  ├─ hooks/
│  │  └─ useAdminAuth.js
│  ├─ lib/
│  │  ├─ api.js                  # Capa de datos Supabase / demo
│  │  ├─ availability.js         # Motor de huecos y solapamientos
│  │  ├─ date.js
│  │  ├─ defaults.js
│  │  ├─ demoStore.js            # Persistencia local para la demo
│  │  ├─ supabaseClient.js
│  │  └─ utils.js
│  ├─ App.jsx                    # Router por hash + control de acceso
│  ├─ index.css
│  └─ main.jsx
├─ .env.example
├─ tailwind.config.js
└─ package.json
```

---

## 7. Decisiones de diseño importantes

### Modo demo automático

Si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`, la app usa un almacén en
`localStorage` con servicios, citas y ajustes de ejemplo relativos a la fecha actual.
Esto permite probar todo sin backend y mantiene una etiqueta visible de “Modo
demostración”. Con las variables configuradas, la misma interfaz usa Supabase sin
cambios de código.

### Routing por hash

Se usa `#/` y `#/admin` en lugar de rutas de servidor. Así el build estático funciona
en Vercel, Netlify, GitHub Pages o cualquier hosting sin configurar rewrites. Los
enlaces internos de sección (`#reservar`, `#como-funciona`, etc.) conviven con el router.

### Disponibilidad calculada, no almacenada

No se guardan “slots” en la base de datos. La disponibilidad se deriva de:

- Horario de apertura y cierre.
- Intervalo entre turnos.
- Duración exacta del servicio.
- Citas no canceladas (fecha, hora y duración).
- Días de apertura, cierres y plazo máximo.
- Antelación mínima para el día actual.

Esto evita estados inconsistentes y hace que cualquier cambio de horario se refleje al
instante. La comprobación de solapamiento también existe en un trigger de PostgreSQL,
por lo que no se puede saltar manipulando el frontend.

### Privacidad de las clientas

El público no tiene permiso `SELECT` sobre `appointments`. Para el calendario se usa la
función `get_booked_slots`, que devuelve solo fecha, hora y duración. Nombres y teléfonos
quedan reservados a usuarios autenticados.

### Configuración global del negocio

Además de las dos tablas requeridas, se añadió `business_settings` (una sola fila). Esto
permite que el horario, los cierres y el WhatsApp se configuren desde el panel y se
compartan entre todos los visitantes, en lugar de quedar hardcodeados en el frontend.

### Auth para el panel

Se usa Supabase Auth con email y contraseña. Las políticas RLS distinguen entre `anon`
y `authenticated`: el público crea reservas pendientes; el equipo autenticado lee,
actualiza y elimina. En modo demo el login se omite para no bloquear la evaluación.

### Confirmación por WhatsApp

El botón final genera un enlace `https://wa.me/<numero>?text=...` con servicio, fecha,
hora, nombre, teléfono y referencia. No se envía nada automáticamente: la clienta pulsa
enviar y el estudio confirma manualmente. Esto encaja con el flujo `pending` y evita
dependencias de pago o mensajería en el MVP.

### UI

Paleta crema, verde bosque y terracota; tipografías Fraunces (display) y Manrope
(interfaz). Los componentes de `ui/` son primitivas propias inspiradas en Shadcn
(variantes con `class-variance-authority`, `clsx` + `tailwind-merge`), sin dependencias
pesadas de una librería de componentes.

---

## 8. Modelo de datos resumido

### `services`

`id`, `name`, `duration_min`, `price`, `description`, `is_active`, `created_at`.

### `appointments`

`id`, `client_name`, `client_phone`, `service_id → services.id`, `appointment_date`,
`start_time`, `status` (`pending` | `confirmed` | `cancelled`), `created_at`.

### `business_settings`

`id = 1`, `business_name`, `whatsapp_number`, `open_time`, `close_time`,
`slot_interval_min`, `working_days[]`, `closed_dates[]`, `booking_horizon_days`,
`min_notice_min`, `updated_at`.

---

## 9. Despliegue

1. `npm run build`.
2. Sube `dist/` al hosting estático.
3. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el panel del hosting.
4. Vuelve a desplegar tras cambiar variables de entorno.

Al usar rutas por hash no hace falta configurar redirecciones del servidor.

---

## 10. Alcance y siguientes pasos

Incluido en esta versión:

- Reserva pública completa y persistencia real en Supabase.
- Panel de agenda, KPIs, filtros y acciones de estado.
- Configuración de horario y cierres.
- Auth, RLS y anti-solapamiento en base de datos.

Ideas para una siguiente iteración:

- Emails transaccionales o recordatorios automáticos.
- Reagendado por parte de la clienta.
- Servicios con profesionales/asignaciones.
- Roles y permisos granulares por usuario.
- Historial y exportación de citas.
- Analítica histórica más allá de la semana actual.
