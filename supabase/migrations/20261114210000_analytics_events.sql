-- Eventos anónimos de la home (lote L7, ADR-0005).
--
-- Cada fila dice que algo ocurrió —una vista, un clic, una reserva, un envío— y en qué
-- contexto: idioma, tipo de dispositivo, página, sitio de procedencia y campaña. Nada más.
-- No existe columna para la IP, el agente de usuario, un identificador de visitante o de
-- sesión, ni para texto escrito por el visitante: no se guardan.
--
-- Las listas cerradas y los formatos se repiten aquí como restricciones: aunque el
-- servidor fallara al sanear, la base no admitiría texto libre.

create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),

  name text not null check (
    name in (
      'page_view', 'cta_schedule_click', 'cta_contact_click', 'calendar_opened',
      'meeting_scheduled', 'form_started', 'form_submitted', 'language_switched'
    )
  ),
  locale text not null check (locale in ('es', 'en')),
  device text not null check (device in ('mobile', 'tablet', 'desktop')),

  -- Una página del sitio, o 'other'.
  path text not null check (path = 'other' or path ~ '^/[a-z0-9/-]{1,80}$'),

  -- De dónde llegó la visita: solo el nombre de host y etiquetas de campaña.
  referrer_host text check (char_length(referrer_host) <= 255 and referrer_host ~ '^[a-z0-9.-]+\.[a-z]{2,63}$'),
  utm_source text check (utm_source ~ '^[A-Za-z0-9._~-]{1,40}$'),
  utm_medium text check (utm_medium ~ '^[A-Za-z0-9._~-]{1,40}$'),
  utm_campaign text check (utm_campaign ~ '^[A-Za-z0-9._~-]{1,40}$'),

  form_mode text check (form_mode in ('terminal', 'classic')),

  -- El modo es de los eventos del formulario, y solo de ellos.
  constraint analytics_events_form_mode check ((name in ('form_started', 'form_submitted')) = (form_mode is not null))
);

comment on table public.analytics_events is
  'Eventos anónimos de la home. Sin IP, agente, identificador de visitante ni texto libre.';

create index analytics_events_created_at_name_idx on public.analytics_events (created_at desc, name);

alter table public.analytics_events enable row level security;

-- Sin políticas, RLS ya lo cierra todo; además se retiran los permisos de los roles públicos.
revoke all on table public.analytics_events from anon, authenticated;
-- `delete` es para el borrado periódico de eventos antiguos (L9). No hay `update`: un evento no se corrige.
grant select, insert, delete on table public.analytics_events to service_role;
