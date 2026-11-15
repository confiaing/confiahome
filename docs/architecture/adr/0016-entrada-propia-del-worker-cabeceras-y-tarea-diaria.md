# ADR-0016: Entrada propia del Worker para las cabeceras de seguridad y la tarea diaria

**Estado:** Aceptada · **Fecha:** 2026-11-14 · **Decide:** fundador de Confia.ing (propuesta del lote L9)

## Contexto

Antes de exponer el sitio hacían falta dos cosas que Next.js no resuelve en este despliegue:

1. **Cabeceras de seguridad con una política de contenido estricta.** El backlog pide una CSP sin `'unsafe-inline'` para scripts. Next.js escribe scripts dentro del HTML (los datos con los que React se activa en el navegador), así que hay que autorizarlos uno a uno. Las páginas son estáticas, generadas al construir, y el proyecto no usa middleware.
2. **Una tarea programada:** el proyecto gratuito de Supabase se pausa tras una semana sin actividad, y la política de privacidad promete borrar las consultas a los 24 meses y los eventos a los 13.

Hasta ahora `wrangler.jsonc` apuntaba directamente a la entrada que genera OpenNext, que solo atiende peticiones.

## Decisión

1. **`worker/index.ts` es la entrada del Worker.** Importa la de OpenNext (`.open-next/worker.js`), reexporta las clases que esta exige y añade:
   - en `fetch`, las cabeceras de seguridad de cada respuesta;
   - en `scheduled`, la tarea diaria.
2. **CSP con un código de un solo uso por respuesta, puesto en el Worker.** Para cada respuesta HTML se genera un código aleatorio de 128 bits; `HTMLRewriter` lo añade como `nonce` a cada `<script>` de la página mientras se envía, y la política solo deja ejecutar scripts del propio sitio, con ese código o de un tercero declarado (Calendly, Turnstile, Cloudflare Insights). Sin `'unsafe-inline'`, sin `'unsafe-eval'`, y con `style-src 'self'`.
3. **Los archivos estáticos**, que Cloudflare sirve sin pasar por el Worker, reciben sus cabeceras desde `public/_headers`.
4. **Tarea diaria** (`triggers.crons`, 08:17 UTC): una consulta mínima a la tabla de eventos anónimos y el borrado por fecha de las dos tablas, con los mismos plazos que declara la política.
5. **Registros:** se conservan los propios y se desactivan los automáticos de cada petición (`observability.logs.invocation_logs: false`), que pueden guardar la IP y el agente del visitante.

## Opciones consideradas para la CSP

Se hizo una prueba de concepto antes de decidir.

| Opción | Resultado |
|---|---|
| **Código por respuesta puesto por el Worker (elegida)** | Cero infracciones en Chromium y WebKit, en las dos versiones de la escena, con formulario, agenda, páginas legales y 404. Las páginas siguen siendo estáticas |
| Huella (hash) de cada script, calculada al construir | **No fiable.** El HTML del build tiene 44 scripts en línea en la home; el que sirve el Worker, 7: Next.js vuelve a trocear los datos al servir la página. Las huellas no coinciden y la página no se activa |
| Código por respuesta generado por Next.js | Obliga a renderizar cada visita en el Worker: más lento y más consumo del plan gratuito |
| `'unsafe-inline'` | Incumple el requisito; la política dejaría de frenar una inyección de script |

`headers()` de `next.config.ts` se descartó para las cabeceras: no puede poner un valor distinto en cada respuesta.

## Consecuencias

- **Límite aceptado:** el Worker pone el código a todo script que venga en el HTML, así que la política no frena un script que ya estuviera dentro del HTML servido. Dos cosas lo sostienen hoy:
  - Las páginas son estáticas y no renderizan nada escrito por un visitante.
  - Next.js sí copia la ruta y los parámetros de la dirección pedida en uno de sus scripts de datos. Lo hace codificado (sin `<`, comillas ni barras crudas) y dentro de una cadena; comprobado con direcciones hostiles en `tests/preview/security.spec.ts`. Que eso siga siendo seguro depende del escapado de Next.js: un fallo ahí sería explotable con o sin esta política.

  **Si una página llega a renderizar contenido de usuarios, o esa prueba falla tras actualizar Next.js, esta decisión se revisa.** La política sí frena lo que se inserte en el navegador, los manejadores en línea y cualquier origen no declarado; hay una prueba de cada caso.
- Sin `upgrade-insecure-requests`: la página no pide nada por HTTP y HSTS ya obliga a HTTPS; con la directiva, WebKit dejaba de cargar los scripts del sitio servido en local.
- HSTS de un año, **sin subdominios ni precarga** hasta que el fundador confirme que todo el dominio va por HTTPS.
- Añadir un tercero (otro proveedor de vídeo, de mapas, de analítica) exige declararlo en `src/lib/server/security/headers.ts`; si no, el navegador lo bloquea.
- Las cabeceras y la tarea diaria solo existen en el runtime de Workers. `npm run e2e` (contra `next start`) no las ve: se prueban con `npm run e2e:preview`, que pasa a formar parte de la puerta de cierre.
- La tarea diaria lee del entorno solo la dirección y la clave de Supabase, sin la validación completa del servidor: no depende de que estén el antispam o el correo, y la entrada del Worker no crece.
- El borrado es irreversible. Solo borra por fecha de creación, se niega a actuar sin una fecha válida y pasada, y se prueba únicamente contra la base local. La copia de cada consulta que llega al buzón de correo no la puede borrar el sitio.
- La entrada depende de cómo exporta OpenNext la suya (`default.fetch` y tres clases). Una versión nueva de OpenNext puede cambiarlo; lo detectarían el build y las pruebas contra `preview`.
