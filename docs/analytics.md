# Analítica: qué se mide y cómo consultarlo

La home mide sin cookies, sin banner y sin datos personales ([ADR-0005](architecture/adr/0005-analitica-sin-cookies.md)).

- **Visitas y duración:** Cloudflare Web Analytics, en su panel.
- **Conversión:** la tabla `analytics_events` de Supabase. Se consulta con SQL (panel de Supabase → SQL Editor).

## Qué guarda cada fila

| Columna | Valores |
|---|---|
| `created_at` | Fecha y hora del evento |
| `name` | `page_view`, `cta_schedule_click`, `cta_contact_click`, `calendar_opened`, `meeting_scheduled`, `form_started`, `form_submitted`, `language_switched` |
| `locale` | `es`, `en` |
| `device` | `mobile` (menos de 768 px), `tablet` (menos de 1100 px), `desktop` |
| `path` | Página del sitio (`/es`, `/en/privacy`…) u `other` |
| `referrer_host` | Sitio externo de procedencia, solo el nombre de host |
| `utm_source`, `utm_medium`, `utm_campaign` | Etiquetas de campaña de la dirección |
| `form_mode` | `terminal` o `classic`, solo en los eventos del formulario |

No hay IP, agente de usuario, identificador de visitante ni nada escrito por el visitante.

## Cómo leer los números

- **No hay recorridos por persona.** Sin identificador no se puede saber que quien reservó es quien vio la página. Las conversiones son proporciones entre eventos del mismo día o segmento.
- **Quien activa «No rastrear»** (Global Privacy Control o Do Not Track) no envía eventos propios ni carga el contador de visitas de Cloudflare: esa visita no se cuenta en ningún sitio, que es lo que promete la política de privacidad. Los robots conocidos se descartan.
- **El canal es el de la página en la que ocurre el evento.** Las etiquetas de campaña sobreviven al cambio de idioma, pero se pierden al pasar a otra página del sitio (por ejemplo, ir a Privacidad y volver): lo que ocurra después cuenta como «directo». No se guardan en el navegador para evitarlo: sería almacenar algo sobre la visita.
- **«Calendario abierto» cuenta la petición**, no que el calendario llegara a verse: si Calendly está bloqueado en ese navegador, también suma.
- **Días y fechas en hora de Colombia.** Las consultas agrupan por día de `America/Bogota`; cámbialo si el negocio pasa a otra zona.
- **Un mismo visitante puede sumar varias vistas** si recarga o cambia de página.
- **`meeting_scheduled` es el dato más fiable**: lo emite Calendly al confirmar la reserva. Las reservas hechas desde el enlace directo, en otra pestaña, no se cuentan aquí; sí aparecen en Calendly.

## Enlaces de campaña: una regla

Las etiquetas `utm_source`, `utm_medium` y `utm_campaign` se guardan tal cual, si son letras, números y `. _ ~ -` (hasta 40 caracteres). **Nunca pongas en ellas un valor por destinatario** —un código de contacto, un teléfono, un nombre—: quedaría guardado un identificador de persona, que es justo lo que esta analítica evita. Usa nombres de canal y de campaña: `utm_source=linkedin&utm_campaign=lanzamiento`.

## Consultas

### 1. Embudo diario

```sql
select
  (created_at at time zone 'America/Bogota')::date as dia,
  count(*) filter (where name = 'page_view') as vistas,
  count(*) filter (where name = 'cta_schedule_click') as clic_agendar,
  count(*) filter (where name = 'calendar_opened') as calendario_abierto,
  count(*) filter (where name = 'meeting_scheduled') as reuniones,
  count(*) filter (where name = 'cta_contact_click') as clic_consultar,
  count(*) filter (where name = 'form_started') as formulario_iniciado,
  count(*) filter (where name = 'form_submitted') as consultas
from analytics_events
where created_at >= (current_date - 30)
group by 1
order by 1 desc;
```

### 2. Conversión por idioma y dispositivo

Reuniones y consultas por cada cien vistas de la home.

```sql
select
  locale as idioma,
  device as dispositivo,
  count(*) filter (where name = 'page_view' and path in ('/es', '/en')) as vistas,
  count(*) filter (where name = 'meeting_scheduled') as reuniones,
  count(*) filter (where name = 'form_submitted') as consultas,
  round(100.0 * count(*) filter (where name in ('meeting_scheduled', 'form_submitted'))
    / nullif(count(*) filter (where name = 'page_view' and path in ('/es', '/en')), 0), 1) as conversion_pct
from analytics_events
where created_at >= (current_date - 30)
group by 1, 2
order by vistas desc;
```

### 3. Conversión por canal

El canal es la etiqueta de campaña si la hay; si no, el sitio de procedencia; si no, «directo».

```sql
select
  coalesce(utm_source, referrer_host, 'directo') as canal,
  count(*) filter (where name = 'page_view' and path in ('/es', '/en')) as vistas,
  count(*) filter (where name = 'meeting_scheduled') as reuniones,
  count(*) filter (where name = 'form_submitted') as consultas,
  round(100.0 * count(*) filter (where name in ('meeting_scheduled', 'form_submitted'))
    / nullif(count(*) filter (where name = 'page_view' and path in ('/es', '/en')), 0), 1) as conversion_pct
from analytics_events
where created_at >= (current_date - 30)
group by 1
order by vistas desc;
```

### 4. Formulario por modo

Cuántos de los que empiezan a escribir terminan enviando, en cada modo. El modo de «iniciado» es el que estaba activo al empezar; el de «enviado», el activo al enviar. Quien empieza en un modo y envía en el otro suma un iniciado en el primero y un enviado en el segundo: por eso un modo puede pasar del 100 %. Mira los dos modos juntos.

```sql
select
  form_mode as modo,
  count(*) filter (where name = 'form_started') as iniciados,
  count(*) filter (where name = 'form_submitted') as enviados,
  round(100.0 * count(*) filter (where name = 'form_submitted')
    / nullif(count(*) filter (where name = 'form_started'), 0), 1) as finalizacion_pct
from analytics_events
where name in ('form_started', 'form_submitted')
  and created_at >= (current_date - 30)
group by 1
order by 1;
```

### 5. Agenda: del clic a la reserva

```sql
select
  count(*) filter (where name = 'cta_schedule_click') as clic_agendar,
  count(*) filter (where name = 'calendar_opened') as calendario_abierto,
  count(*) filter (where name = 'meeting_scheduled') as reuniones,
  round(100.0 * count(*) filter (where name = 'meeting_scheduled')
    / nullif(count(*) filter (where name = 'calendar_opened'), 0), 1) as reserva_pct
from analytics_events
where created_at >= (current_date - 30);
```

## Retención y tamaño

Los eventos se conservan 13 meses. El borrado periódico llega con el lote L9.

La tabla comparte base con las consultas del formulario. Cada origen puede guardar como mucho 20 eventos por minuto, pero el límite es por IP: un abuso desde muchas direcciones podría hacerla crecer. Para vigilarla:

```sql
select count(*) as filas, pg_size_pretty(pg_total_relation_size('analytics_events')) as tamano
from analytics_events;
```
