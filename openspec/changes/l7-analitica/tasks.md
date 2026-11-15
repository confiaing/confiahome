# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el requisito que cubre.

## 1. Dominio (L7-2)

- [x] 1.1 Pruebas unitarias en rojo de `normalizeEvent`: los ocho nombres; nombre, idioma o dispositivo fuera de lista; campos no previstos descartados; `utm_*` con correo o frase → ausente; ruta desconocida → «other»; procedencia reducida a host; modo solo en eventos de formulario (analytics-events: Lista cerrada; Solo los datos previstos; Valores acotados). Verificación: `npm test` falla por módulo inexistente.
- [x] 1.2 Implementar `src/domain/analytics/events.ts`, `device.ts` y `ports.ts`. Verificación: `npm test` y `npm run lint` en verde.
- [x] 1.3 Pruebas de integración en rojo de `recordEvent` con adaptadores en memoria: guardado; inválido; robot ignorado; límite; limitador que falla (pasa); almacén caído (ignorado y registrado sin contenido); nada de IP ni agente en lo guardado ni en el registro (analytics-events: Punto de recepción; Nada que identifique; La analítica no rompe nada). Verificación: `npm test` falla.
- [x] 1.4 Implementar `record-event.ts` y `adapters/memory/analytics.ts`. Verificación: `npm test` en verde.

## 2. Punto de recepción (L7-2)

- [x] 2.1 Pruebas de integración en rojo de `POST /api/events`: 204; 400; 403; 415; 413; 429; campos extra descartados; `no-store`; robot 204 sin guardar (analytics-events: Punto de recepción protegido). Verificación: `npm test` falla.
- [x] 2.2 Ampliar `container.ts` y escribir `src/app/api/events/route.ts`. Verificación: `npm test`, `typecheck` y `lint` en verde.

## 3. Tabla y contrato (L7-3)

- [x] 3.1 Pruebas de contrato en rojo: columnas exactas; RLS sin políticas; publishable key sin acceso; `check` de listas cerradas; el adaptador guarda una fila (analytics-events: Tabla protegida; Esquema de la tabla). Verificación: `npm run test:contract` falla.
- [x] 3.2 Escribir la migración y `adapters/supabase/event-repository.ts`; añadir el binding `EVENTS_RATE_LIMITER`. Aplicar solo en local. Verificación: `npm run test:contract` en verde.

## 4. Cliente (L7-1, L7-4)

- [x] 4.1 Pruebas en rojo e implementación de `src/lib/attribution.ts`, compartido con el formulario, y de `deviceFor` (analytics-instrumentation: Contexto de cada evento). Verificación: `npm test` en verde, incluidas las pruebas del formulario.
- [x] 4.2 Pruebas de integración en rojo de `track.ts`: contexto completo; `sendBeacon` y respaldo con `fetch`; nunca lanza; no envía con GPC o DNT (Contexto; Respeto de la preferencia; La medición no afecta). Verificación: `npm test` falla; luego en verde.
- [x] 4.3 Pruebas en rojo e implementación de `analytics-tracker.tsx`: `page_view` único; clics en `data-agenda`, `data-cta="contact"` y `data-locale-switch`; avisos de agenda y de formulario (Qué se mide y cuándo). Verificación: `npm test` en verde.
- [x] 4.4 Pruebas en rojo y cambios en `use-contact-form.ts` (iniciado una vez con su modo; enviado solo tras el 201; sin valores de campos), `contact-actions.tsx` y `language-switch.tsx` (Formulario iniciado; Formulario enviado; Envío rechazado). Verificación: `npm test` en verde.
- [x] 4.5 Pruebas en rojo e implementación de `web-analytics.tsx` y su montaje en el layout y en la 404: sin token, nada; con token, script diferido (Visitas con Cloudflare Web Analytics). Verificación: `npm test` en verde.

## 5. El flujo en el navegador

- [x] 5.1 E2E en rojo y ajuste: `page_view` al cargar; cada acción envía su evento con idioma, dispositivo, ruta y `utm_source`; agenda y formulario envían los suyos; cambio de idioma (Qué se mide y cuándo; Contexto). Verificación: `npm run e2e` en verde.
- [x] 5.2 E2E: con GPC no hay peticiones; con `/api/events` fallando todo funciona; sin cookies y sin almacenamiento nuevo; sin JavaScript no se mide y todo funciona; sin token no se pide nada a Cloudflare Insights (Respeto de la preferencia; La medición no afecta; Visitas). Verificación: `npm run e2e` en verde.
- [x] 5.3 JS inicial, LCP y CLS dentro de presupuesto. Verificación: valores anotados aquí.

## 6. Consultas (L7-5)

- [x] 6.1 Escribir `docs/analytics.md` y ejecutar cada consulta contra la base local con eventos de ejemplo (analytics-events: Consultas de conversión). Verificación: salida anotada aquí.

## 7. Cierre del lote

- [x] 7.1 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente, con atención a privacidad, y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 7.2 Puerta de cierre: `lint`, `typecheck`, `test`, `test:contract`, `e2e`, `build:worker`, `measure:js` y, en `preview`, carga de `/es` y un `POST` válido a `/api/events`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 7.3 Actualizar README, BACKLOG, `docs/architecture/`, `docs/setup.md` y `.env.example`. Verificación: enlaces comprobados.
- [x] 7.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Ejecutado el 2026-11-14 sobre el código final del lote.

**Puerta de cierre (7.2)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` · `npm run typecheck` | Sin errores |
| `npm test` | 787 pruebas en 48 archivos, todas en verde |
| `npm run test:contract` (Supabase local) | 42 en verde: columnas exactas, listas cerradas, RLS sin políticas, claves públicas rechazadas, el adaptador guarda, y todo lo que produce el saneado cabe en la base |
| `npm run e2e` | 301 en verde, 21 omitidas (solo aplican en Chromium de escritorio) |
| `npm run build:worker` | 1133,1 KiB de 3072 (L6: 1058,4; la ruta nueva y la medición suman unos 75 KiB); sin secretos; sin Three.js |
| `npm run measure:js` | 163,7 kB de 200 (L6: 162,9) |
| LCP y CLS de `/es`, móvil simulado | 0,76 s y 0,0060 en ambas versiones |
| `preview` (Workers local, memoria) | `/es` 200; `POST /api/events` válido 204; el cambio de idioma conserva `utm_source` |
| `preview` con servicios reales contra Supabase **local** | Evento con campos de más: 204 y fila sin ellos. Evento con ruta desconocida, `utm_medium` con un correo y procedencia con dirección completa: fila con ruta «other», `utm_medium` vacío y solo el host. Nombre fuera de lista 400; robot 204 sin fila; origen ajeno 403. Límite del binding comprobado con el valor anterior (60 de 62 aceptados, 2 con 429) |

`.dev.vars` se cambió a servicios reales locales solo durante esa comprobación y se restauró. La base de producción no se tocó: la migración está aplicada solo en local.

**Consultas (6.1, nivel M).** Las seis consultas de `docs/analytics.md` se ejecutaron contra la base local dentro de una transacción con 131 eventos de ejemplo, deshecha al terminar. Devuelven: embudo del día; conversión por idioma y dispositivo (4 filas); por canal (`directo`, `www.google.com`, `linkedin`); formulario por modo (`classic` 1 de 1, `terminal` 1 de 2); del clic a la reserva (2 → 2 → 1); y tamaño de la tabla.

**Revisión de código (7.1).** Subagente independiente, solo lectura: ningún hallazgo crítico; ningún camino por el que IP, agente, texto del formulario o campos extra lleguen a la base o al registro.

1. *Importante, mitigado.* `/api/events` podía hacer crecer una base que se comparte con el formulario. Límite bajado de 60 a 20 por minuto y consulta de tamaño documentada. **Riesgo aceptado hasta L9:** el límite es por IP y el borrado periódico aún no existe.
2. *Importante, corregido.* El canal se perdía al cambiar de idioma o de página: la reserva caía en «directo». Ahora la llegada se recuerda en memoria y `/api/locale` conserva las etiquetas `utm_*` saneadas.
3. *Importante, mitigado.* Una etiqueta de campaña admitía un código por destinatario. Reducida a 40 caracteres y regla escrita en `docs/analytics.md`. **No se puede impedir del todo:** depende de cómo se armen los enlaces.
4. *Importante, sin verificar.* Los registros de invocación de Workers (`observability`) podrían guardar IP y agente de cada petición. No se puede comprobar en local; queda para L9.
5. Corregidos: los teléfonos Cubot se tomaban por robots; la procedencia con puerto se perdía; las consultas agrupaban en UTC; faltaban avisos de lectura (calendario abierto, modo del formulario, No rastrear frente al script de Cloudflare).
6. Pruebas añadidas: 403, 422 y 429 no emiten «enviado»; navegadores reales no son robots; extremos del saneado contra la base; título engañoso de una E2E corregido.
7. *No cambiado:* al volver con «atrás» desde la caché del navegador no se cuenta una vista nueva.

**Desviaciones de TDD**

- Las pruebas de limitador que falla, robots y almacén caído se escribieron junto con el caso de uso.
- Las E2E leen el cuerpo del evento copiándolo en el navegador antes de `sendBeacon`: Playwright no lo expone. El envío real ocurre y su respuesta se comprueba.

**No verificado**

- El script de Cloudflare Web Analytics en un navegador y que no cree cookies: no hay token; se comprobó que sin token no se pide nada y que con token el HTML lo incluye.
- Los registros de invocación de Workers (punto 4).
- El límite de 20 por minuto en el runtime: se comprobó el mecanismo con el valor anterior.
- `sendBeacon` en Safari y Firefox reales.

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
- En L10, con confirmación del fundador: aplicar la migración a `confiahomeDB` y cargar el token de Web Analytics.
