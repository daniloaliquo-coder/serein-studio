-- =====================================================================
--  SEREIN STUDIO — Esquema de reservas para Supabase
--  Ejecuta este script completo en: Supabase → SQL Editor → New query
-- =====================================================================

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. SERVICIOS
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  duration_min  integer not null check (duration_min between 15 and 480),
  price         numeric(10, 2) not null check (price >= 0),
  description   text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. CITAS
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id                uuid primary key default gen_random_uuid(),
  client_name       text not null check (char_length(trim(client_name)) between 2 and 120),
  client_phone      text not null check (char_length(trim(client_phone)) between 6 and 30),
  service_id        uuid not null references public.services(id) on delete restrict,
  appointment_date  date not null,
  start_time        time not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at        timestamptz not null default now()
);

create index if not exists appointments_date_idx
  on public.appointments (appointment_date, start_time);

create index if not exists appointments_service_idx
  on public.appointments (service_id);

create index if not exists appointments_status_idx
  on public.appointments (status);

-- ---------------------------------------------------------------------
-- 3. CONFIGURACIÓN DEL HORARIO (tabla auxiliar de una sola fila)
--    Permite que el panel de ajustes afecte a la agenda pública.
-- ---------------------------------------------------------------------
create table if not exists public.business_settings (
  id                  smallint primary key default 1 check (id = 1),
  business_name       text not null default 'Serein Studio',
  whatsapp_number     text not null default '+54 9 261 541 8156',
  open_time           time not null default '09:00',
  close_time          time not null default '19:00',
  slot_interval_min   integer not null default 30 check (slot_interval_min between 10 and 120),
  working_days        smallint[] not null default '{1,2,3,4,5,6}', -- 0 = domingo … 6 = sábado
  closed_dates        date[] not null default '{}',
  booking_horizon_days integer not null default 60 check (booking_horizon_days between 7 and 365),
  min_notice_min      integer not null default 60 check (min_notice_min between 0 and 1440),
  updated_at          timestamptz not null default now()
);

insert into public.business_settings (id)
values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. DATOS INICIALES DE SERVICIOS
--    IDs fijos para que el script pueda ejecutarse más de una vez sin
--    duplicar filas. Puedes editar nombres, precios y duraciones.
-- ---------------------------------------------------------------------
insert into public.services (id, name, duration_min, price, description) values
  (
    '11111111-1111-4111-8111-111111111111',
    'Corte & Estilo',
    45,
    38,
    'Corte personalizado, lavado y peinado con un acabado natural.'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Color & Balayage',
    120,
    115,
    'Coloración dimensional con diagnóstico previo y tratamiento de brillo.'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Ritual Facial',
    60,
    68,
    'Limpieza profunda, hidratación y masaje facial con productos botánicos.'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Manicura Rusa',
    60,
    42,
    'Preparación de cutícula, esmaltado semipermanente y acabado impecable.'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'Masaje Relajante',
    75,
    75,
    'Masaje corporal de cuerpo completo con aceites esenciales.'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Peinado de Evento',
    60,
    55,
    'Peinado editorial para ocasiones especiales, con fijación de larga duración.'
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 5. ANTI-SOLAPAMIENTO
--    Valida en la base de datos que una cita no se cruce con otra,
--    teniendo en cuenta la duración real de cada servicio.
--    SECURITY DEFINER permite consultar las citas aunque el visitante
--    anónimo no tenga permiso de lectura sobre la tabla.
-- ---------------------------------------------------------------------
create or replace function public.enforce_appointment_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration integer;
  v_new_end  time;
begin
  -- Una cita cancelada libera el horario, incluso si su servicio ya no está activo.
  if new.status = 'cancelled' then
    return new;
  end if;

  select duration_min
    into v_duration
    from public.services
   where id = new.service_id
     and is_active = true;

  if v_duration is null then
    raise exception 'El servicio seleccionado no está disponible.'
      using errcode = 'P0001';
  end if;

  -- Serializa las comprobaciones de una misma fecha para evitar que dos
  -- reservas concurrentes pasen el solapamiento a la vez.
  perform pg_advisory_xact_lock(hashtext('appointments:' || new.appointment_date::text)::bigint);

  v_new_end := (new.start_time + make_interval(mins => v_duration))::time;

  if v_new_end <= new.start_time then
    raise exception 'El turno debe terminar antes de la medianoche.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from public.appointments a
      join public.services s on s.id = a.service_id
     where a.appointment_date = new.appointment_date
       and a.status <> 'cancelled'
       and a.id <> new.id
       and new.start_time < (a.start_time + make_interval(mins => s.duration_min))::time
       and v_new_end > a.start_time
  ) then
    raise exception 'El horario seleccionado ya no está disponible.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists appointment_availability_check on public.appointments;

create trigger appointment_availability_check
before insert or update of service_id, appointment_date, start_time, status
on public.appointments
for each row
execute function public.enforce_appointment_availability();

-- ---------------------------------------------------------------------
-- 6. DISPONIBILIDAD PÚBLICA SIN DATOS PERSONALES
--    La vista pública solo recibe fecha, hora y duración. Nunca nombres
--    ni teléfonos de otras clientas.
-- ---------------------------------------------------------------------
create or replace function public.get_booked_slots(p_from date, p_to date)
returns table (
  appointment_date date,
  start_time time,
  duration_min integer
)
language sql
stable
security definer
set search_path = public
as $$
  select a.appointment_date, a.start_time, s.duration_min
    from public.appointments a
    join public.services s on s.id = a.service_id
   where a.status <> 'cancelled'
     and a.appointment_date between p_from and p_to
   order by a.appointment_date, a.start_time;
$$;

revoke all on function public.get_booked_slots(date, date) from public;
grant execute on function public.get_booked_slots(date, date) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. SEGURIDAD / RLS
--    Público: lee servicios, crea citas "pending" y consulta huecos.
--    Autenticado (dueño): gestiona toda la agenda y la configuración.
-- ---------------------------------------------------------------------
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.business_settings enable row level security;

drop policy if exists "services_public_read" on public.services;
drop policy if exists "services_admin_all" on public.services;
drop policy if exists "appointments_public_insert" on public.appointments;
drop policy if exists "appointments_admin_read" on public.appointments;
drop policy if exists "appointments_admin_update" on public.appointments;
drop policy if exists "appointments_admin_delete" on public.appointments;
drop policy if exists "settings_public_read" on public.business_settings;
drop policy if exists "settings_admin_all" on public.business_settings;

create policy "services_public_read"
  on public.services for select
  to anon, authenticated
  using (is_active = true);

create policy "services_admin_all"
  on public.services for all
  to authenticated
  using (true)
  with check (true);

create policy "appointments_public_insert"
  on public.appointments for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and appointment_date >= current_date
  );

create policy "appointments_admin_read"
  on public.appointments for select
  to authenticated
  using (true);

create policy "appointments_admin_update"
  on public.appointments for update
  to authenticated
  using (true)
  with check (true);

create policy "appointments_admin_delete"
  on public.appointments for delete
  to authenticated
  using (true);

create policy "settings_public_read"
  on public.business_settings for select
  to anon, authenticated
  using (true);

create policy "settings_admin_all"
  on public.business_settings for all
  to authenticated
  using (true)
  with check (true);

-- Permisos de tabla. RLS sigue siendo la capa que restringe las filas.
grant usage on schema public to anon, authenticated;

grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;

grant insert on public.appointments to anon, authenticated;
grant select, update, delete on public.appointments to authenticated;

grant select on public.business_settings to anon, authenticated;
grant insert, update, delete on public.business_settings to authenticated;

commit;

-- =====================================================================
--  SIGUIENTE PASO OBLIGATORIO
--  1. Ve a Authentication → Users → Add user y crea el usuario del dueño
--     con email y contraseña (marca "Auto Confirm User").
--  2. Cualquier usuario autenticado de este proyecto puede administrar la
--     agenda. Si tendrás más de un usuario, crea una tabla de roles o usa
--     un custom claim para limitar el acceso al dueño.
-- =====================================================================
