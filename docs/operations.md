# Operación del sitio

Para quien atiende `confia.ing`. Los pasos de cuentas y accesos están en [docs/setup.md](setup.md). Ningún valor secreto va en el chat ni en git.

## Desplegar

Desde la máquina con sesión de `wrangler` y con `.env.prod` ([ADR-0017](architecture/adr/0017-integracion-continua-y-despliegue.md)):

```bash
npm run release:check   # comprueba el entorno de producción; no muestra valores
npm run release         # repite la comprobación y construye el Worker (build:worker)
npx wrangler deploy     # despliega ese build
npm run verify:site -- https://confia.ing
```

`verify:site` es de solo lectura: revisa respuestas, cabeceras, `robots`, `sitemap` y `llms.txt`, y que una consulta sin token se rechace.

**Nunca uses `opennextjs-cloudflare deploy`**: reconstruye sin las comprobaciones de `release`.

## Volver atrás

```bash
npx wrangler rollback
```

Vuelve a la versión anterior del Worker. Las tablas de Supabase no se borran: quedan como están.

## Secretos

Se cargan en el Worker con `wrangler secret put`; no están en `wrangler.jsonc`:

| Secreto | Para qué |
|---|---|
| `SUPABASE_SECRET_KEY` | Guardar consultas y eventos |
| `TURNSTILE_SECRET_KEY` | Verificar el antispam |
| `SUPABASE_URL` | Dirección de la base |
| `NOTIFY_TO` | Buzón verificado que recibe el aviso |

```bash
npx wrangler secret put SUPABASE_SECRET_KEY
```

Para rotar uno:

1. Genera el valor nuevo en el proveedor (Supabase o Turnstile; pasos 3 y 5 de [setup.md](setup.md)).
2. Cárgalo con `npx wrangler secret put <NOMBRE>`.
3. Verifica con `npm run verify:site -- https://confia.ing` y una consulta de prueba.

## Leer y responder consultas

- **En Supabase:** panel del proyecto, tabla `contact_requests`.
- **Por correo:** cada consulta genera un aviso a `NOTIFY_TO` (hola@confia.ing). Responde desde ese buzón: el correo del visitante va en `Reply-To` ([setup.md](setup.md), sección 7).

## Atender una petición de supresión de datos

1. Borra la fila de la persona en `contact_requests` (panel de Supabase).
2. Borra su correo del buzón de avisos: el sitio no puede hacerlo.
3. Confirma a la persona.

Los eventos de analítica son anónimos y no se asocian a nadie. Más en [docs/legal/README.md](legal/README.md).

## Analítica

Qué se mide y cómo consultarlo: [docs/analytics.md](analytics.md).

## Tarea diaria

El Worker ejecuta cada día a las 08:17 UTC (`triggers.crons` en `wrangler.jsonc`) una consulta mínima a la base, contra la pausa de Supabase, y borra por fecha las consultas con más de 24 meses y los eventos con más de 13 ([ADR-0016](architecture/adr/0016-entrada-propia-del-worker-cabeceras-y-tarea-diaria.md)).

Para comprobarla, mira los registros del Worker (panel de Cloudflare, o `npx wrangler tail` en vivo) y busca `maintenance.done`: indica `heartbeat`, `contactsPurged` y `eventsPurged`. Un `-1` significa que ese borrado falló. También existen `maintenance.heartbeat-failed` y `maintenance.not-started` (configuración incompleta).

## Si el formulario falla

1. **Registros del Worker:** busca los códigos `contact.*`:
   - `contact.limiter-failed`: el límite de frecuencia.
   - `contact.verify-failed`: Turnstile.
   - `contact.save-failed`: la base.
   - `contact.notify-failed`: el correo. La consulta ya está guardada.
2. **Supabase:** el plan gratuito se pausa tras 7 días sin actividad. Si está pausado, reactívalo desde el panel; la tarea diaria existe para evitarlo.
3. **Turnstile:** el widget debe permitir `confia.ing`, y la site key debe estar en el build (`release:check` lo comprueba).
4. **Límite de frecuencia:** 5 consultas por minuto y origen. Un visitante que prueba varias veces seguidas puede toparse con él.
5. Si nada de esto lo explica, vuelve atrás con `npx wrangler rollback`.

## Textos legales

La política y los términos están como borrador hasta tener los datos del responsable y la revisión de un abogado. Cómo pasarlos a vigentes: [docs/legal/README.md](legal/README.md).
