# Guía de accesos y configuración

Pasos que solo tú puedes hacer (inician sesión en tus cuentas). Hazlos antes de empezar la Fase 4. Los valores de producción van en `.env.prod`, nunca en el chat ni en git. El desarrollo usa `.env.development.local`, que no apunta a producción.

| # | Paso | Dónde queda el resultado | Necesario para |
|---|---|---|---|
| 1 | Docker Desktop abierto | — | Base de datos local |
| 2 | `supabase login` | Sesión de la CLI | Aplicar migraciones |
| 3 | Secret key de Supabase | `.env.prod` → `SUPABASE_SECRET_KEY` | Guardar consultas en producción |
| 4 | `wrangler login` | Sesión de la CLI | Desplegar |
| 5 | Widget de Turnstile | `.env.prod` → 2 claves | Antispam |
| 6 | Sitio de Web Analytics | `.env.prod` → token | Visitas |
| 7 | Dirección de destino verificada | `.env.prod` → `NOTIFY_TO` | Aviso por correo |

## 1. Docker Desktop

Docker ya está instalado en esta Mac, pero no está en ejecución. Ábrelo desde Aplicaciones y espera a que el icono de la barra indique que está activo. La base de datos de desarrollo corre ahí (ADR-0002).

## 2. Supabase: iniciar sesión en la CLI

Claude instala la CLI como dependencia del proyecto al iniciar la Fase 4. Después ejecutas:

```bash
npx supabase login
```

Se abre el navegador; inicia sesión con la cuenta dueña de `confiahomeDB` y autoriza. Luego Claude enlaza el proyecto con `npx supabase link --project-ref nojdfpoqmrjpxkaqskyv`. Con la CLI 3.x no pide la contraseña de la base de datos: usa la sesión de `supabase login` y crea un rol de acceso temporal. (Hecho el 2026-11-14.)

## 3. Supabase: secret key

1. Entra a <https://supabase.com/dashboard/project/nojdfpoqmrjpxkaqskyv/settings/api-keys>.
2. En **Secret keys**, crea una clave nueva (nombre sugerido: `confiahome-worker`) o copia la existente. Empieza por `sb_secret_`.
3. Abre `.env.prod` en la raíz del proyecto y pégala en `SUPABASE_SECRET_KEY=`. (La que ya habías puesto en `.env` se movió ahí el 2026-11-14.)

Esta clave salta todas las reglas de seguridad de la base de datos. No la pegues en el chat.

## 4. Cloudflare: iniciar sesión en Wrangler

```bash
npx wrangler login
```

Autoriza en el navegador con la cuenta dueña del dominio `confia.ing`. Para comprobarlo:

```bash
npx wrangler whoami
```

## 5. Cloudflare Turnstile

1. Panel de Cloudflare → **Turnstile** → **Add widget**.
2. Nombre: `confia.ing home`. Hostnames: `confia.ing` y `localhost`.
3. Modo: **Managed**.
4. Copia en `.env.prod`:
   - **Site key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - **Secret key** → `TURNSTILE_SECRET_KEY`

Mientras tanto, `.env.development.local` trae las claves de prueba oficiales, que siempre aprueban; sirven para desarrollar.

La site key se incrusta en la página **al construir**: tiene que estar en el entorno del comando de build de producción (L10). Sin ella el formulario no muestra la verificación y, con los servicios reales, el servidor rechaza los envíos.

## 6. Cloudflare Web Analytics

1. Panel de Cloudflare → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Hostname: `confia.ing`. Elige la instalación manual con fragmento de JavaScript (no la automática, para que el script quede declarado en nuestra política de seguridad).
3. Del fragmento, copia solo el valor de `token` y pégalo en `.env.prod` → `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`.

El token se incrusta en la página al construir. Sin él no se carga el script de Cloudflare; los eventos propios (clics, reservas, consultas) funcionan igual y se guardan en Supabase.

## 7. Correo de avisos

1. Panel de Cloudflare → dominio `confia.ing` → **Email** → **Email Routing** → **Destination addresses**.
2. Confirma que el buzón de Gmail aparece como **Verified**.
3. Escribe esa dirección en `.env.prod` → `NOTIFY_TO`.

Los avisos llegan a hola@confia.ing y quedan respaldados en ese buzón. Respondes al visitante desde Gmail como hola@confia.ing: el aviso lleva su correo en `Reply-To`, así que basta con pulsar Responder.

## 8. Calendly: idioma del evento

El plan actual admite un solo tipo de evento y Calendly fija en él el idioma de la página de reserva. Hoy está en inglés, así que en `/es` el bloque de agenda avisa: «El calendario se muestra en inglés».

Para tenerlo en español: en Calendly, menú de tres puntos del evento → **Change invitee language** → Spanish. Después, pon `NEXT_PUBLIC_CALENDLY_LOCALE=es` en el entorno del build; el aviso pasará a mostrarse en `/en`.

## 9. Textos legales: datos del responsable y revisión

La política de privacidad y los términos están publicados como borradores, con aviso y sin indexar. Para pasarlos a vigentes hacen falta dos cosas tuyas ([docs/legal/README.md](legal/README.md)):

1. Los datos de quien trata los datos: razón social o nombre, número de identificación y domicilio.
2. La revisión de un abogado, en español y en inglés. La lista de puntos abiertos para esa revisión está en la guía.

No conviene pasarlos a vigentes antes de cerrar el lote L9, que añade el borrado automático que la política promete.

## Qué queda pendiente para el lanzamiento (L10)

El formulario de consulta (L5) está hecho y probado contra la base local y las claves de prueba. Para que funcione en producción faltan, con tu confirmación:

| Qué | Cómo |
|---|---|
| Crear las tablas `contact_requests` y `analytics_events` en `confiahomeDB` | `npx supabase db push` (migraciones `20261114170000` y `20261114210000`) |
| Textos legales vigentes | Datos del responsable en `src/i18n/legal/status.ts`, revisión legal y `LEGAL_STATUS = "in-force"` |
| Token de Web Analytics en el build | `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` en el entorno al construir |
| Cargar los secretos en el Worker | `wrangler secret put` para `SUPABASE_SECRET_KEY` y `TURNSTILE_SECRET_KEY`; `SUPABASE_URL`, `NOTIFY_FROM`, `NOTIFY_TO` y `SERVICES=real` como variables |
| Site key de Turnstile en el build | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` en el entorno al construir |
| Remitente y destino del aviso | `NOTIFY_FROM` debe ser una dirección de `confia.ing`; `NOTIFY_TO`, la verificada en el paso 7 |

## Comprobación

Cuando termines, avisa a Claude. Verificará cada acceso sin mostrar los valores:

```bash
npx supabase projects list
```

```bash
npx wrangler whoami
```

## Producción

Al desplegar, los secretos se cargan en el Worker (Claude prepara los comandos; tú pegas los valores):

```bash
npx wrangler secret put SUPABASE_SECRET_KEY
```

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```
