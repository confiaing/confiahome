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

Se abre el navegador; inicia sesión con la cuenta dueña de `confiahomeDB` y autoriza. Luego Claude enlaza el proyecto con `npx supabase link --project-ref nojdfpoqmrjpxkaqskyv`; te pedirá la **contraseña de la base de datos** (la que definiste al crear el proyecto; se puede restablecer en *Project Settings → Database*). Escríbela tú en la terminal.

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

## 6. Cloudflare Web Analytics

1. Panel de Cloudflare → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Hostname: `confia.ing`. Elige la instalación manual con fragmento de JavaScript (no la automática, para que el script quede declarado en nuestra política de seguridad).
3. Del fragmento, copia solo el valor de `token` y pégalo en `.env.prod` → `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`.

## 7. Correo de avisos

1. Panel de Cloudflare → dominio `confia.ing` → **Email** → **Email Routing** → **Destination addresses**.
2. Confirma que el buzón de Gmail aparece como **Verified**.
3. Escribe esa dirección en `.env.prod` → `NOTIFY_TO`.

Los avisos llegan a hola@confia.ing y quedan respaldados en ese buzón. Respondes al visitante desde Gmail como hola@confia.ing: el aviso lleva su correo en `Reply-To`, así que basta con pulsar Responder.

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
