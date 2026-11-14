-- Consultas recibidas por el formulario de la home (lote L5, ADR-0002).
--
-- Contienen datos personales (nombre, correo, teléfono). Solo el servidor las lee y las
-- escribe, con la secret key. La seguridad por filas está activada y NO hay ninguna
-- política: con la clave pública no se puede leer ni insertar nada.
--
-- No existe columna para la dirección IP: no se guarda (ADR-0006).

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null check (char_length(name) between 1 and 120),
  company text check (char_length(company) <= 160),
  email text check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 32),
  message text check (char_length(message) <= 2000),
  locale text not null check (locale in ('es', 'en')),

  -- Cuándo se aceptó el aviso de privacidad y qué versión del aviso era.
  consent_at timestamptz not null,
  consent_version text not null check (char_length(consent_version) between 1 and 40),

  -- De dónde llegó la visita. No identifica a la persona.
  utm_source text check (char_length(utm_source) <= 120),
  utm_medium text check (char_length(utm_medium) <= 120),
  utm_campaign text check (char_length(utm_campaign) <= 120),
  referrer_host text check (char_length(referrer_host) <= 255),

  -- Seguimiento del equipo.
  status text not null default 'new' check (status in ('new', 'answered', 'archived')),

  -- La misma regla que el formulario: correo o teléfono, al menos uno.
  constraint contact_requests_contact_required check (email is not null or phone is not null)
);

comment on table public.contact_requests is
  'Consultas del formulario de la home. Datos personales: acceso solo desde el servidor.';

create index contact_requests_created_at_idx on public.contact_requests (created_at desc);

alter table public.contact_requests enable row level security;

-- Sin políticas, RLS ya lo cierra todo; además se retiran los permisos de los roles públicos.
revoke all on table public.contact_requests from anon, authenticated;
grant select, insert, update, delete on table public.contact_requests to service_role;
