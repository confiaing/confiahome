# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el escenario que cubre.

## 1. Esquema de la consulta (L5-1, L5-2)

- [x] 1.1 Pruebas unitarias en rojo de `schema.ts`: con correo; solo con teléfono; sin contacto; correo sin dominio; teléfono corto; nombre de espacios; longitudes máximas; recorte de espacios; consentimiento ausente o falso; idioma y modo no admitidos (contact-submission: Datos de una consulta válida; Consentimiento registrado). Verificación: `npm test` falla por módulo inexistente.
- [x] 1.2 Implementar `src/domain/contact/schema.ts`, `errors.ts` y `consent.ts` con `zod/mini`. Verificación: `npm test` y `npm run lint` en verde.

## 2. Caso de uso con adaptadores en memoria (L5-5, L5-7, L5-8, L5-9)

- [x] 2.1 Definir los puertos en `src/domain/contact/ports.ts` y escribir en rojo las pruebas de integración de `submitContact`: aceptada (una fila, un aviso, fecha y versión del consentimiento); inválida (nada guardado); campo trampa (aceptada sin guardar ni avisar); límite (rechazada); token inválido (rechazada, nada guardado ni avisado); almacén caído (no disponible, sin aviso); aviso fallido (aceptada, guardada, fallo registrado sin datos personales); la fila no contiene IP (contact-submission). Verificación: `npm test` falla.
- [x] 2.2 Implementar los adaptadores en memoria y `submit-contact.ts`. Verificación: `npm test` en verde.
- [x] 2.3 Pruebas en rojo e implementación de `adapters/email/compose.ts`: texto plano, `Reply-To` con correo, sin él con solo teléfono, saltos de línea que no crean cabeceras (contact-submission: Aviso al equipo). Verificación: `npm test` en verde.

## 3. Punto de recepción (L5-5)

- [x] 3.1 Pruebas de integración en rojo del `POST /api/contact`: 201; 422 con errores por campo en ES y EN; 403 por origen ajeno; 415; 413; 400; 405 para `GET`; 403, 429 y 503 según el caso de uso; `Cache-Control: no-store` (contact-submission: Punto de recepción; El servidor falla de forma clara). Verificación: `npm test` falla.
- [x] 3.2 Añadir a los diccionarios los mensajes de error y los textos del formulario; implementar `src/lib/server/http.ts`, ampliar `container.ts` y escribir `src/app/api/contact/route.ts`. Verificación: `npm test`, `typecheck` y `lint` en verde.

## 4. Tabla y contrato (L5-6)

- [x] 4.1 Pruebas de contrato en rojo en `tests/contract/`: con la publishable key no se leen filas ni se insertan; con la secret key, una fila sin correo ni teléfono se rechaza; una fila válida se guarda con estado «new» (contact-submission: Almacén protegido). Verificación: `npm run test:contract` falla porque la tabla no existe.
- [x] 4.2 Escribir la migración y aplicarla en local con `npx supabase db reset`. Verificación: `npm run test:contract` en verde; salida anotada en «Evidencia».
- [x] 4.3 Escribir el ADR-0014 (Supabase por PostgREST sin SDK) y enlazarlo. Verificación: el ADR existe y los enlaces abren.

## 5. Adaptadores reales (L5-5, L5-7, L5-8)

- [x] 5.1 Pruebas unitarias en rojo con dobles: el repositorio de Supabase envía la petición esperada (URL, cabeceras, cuerpo sin IP) y traduce los fallos; el verificador de Turnstile envía secreto y token y entiende ambas respuestas; el avisador entrega el mensaje compuesto al binding; el limitador traduce la respuesta del binding. Verificación: `npm test` falla.
- [x] 5.2 Implementar los cuatro adaptadores reales y conectarlos en `container.ts` para `SERVICES=real`; declarar los bindings en `wrangler.jsonc`. Verificación: `npm test` en verde.
- [x] 5.3 Contrato: el repositorio real guarda y la fila se lee con la secret key; el verificador real acepta y rechaza con las claves de prueba oficiales de Turnstile (contact-submission: Ida y vuelta por el adaptador; El verificador real habla con Turnstile). Verificación: `npm run test:contract` en verde.

## 6. Formulario (L5-1, L5-2, L5-3, L5-4, L5-9, L5-10)

- [x] 6.1 Pruebas de integración en rojo, parametrizadas por modo y con `fetch` simulado: campos etiquetados y casilla sin marcar con enlace a privacidad, en ES y EN; envío con dos errores (junto a su campo, foco al primero, valores conservados, sin petición); corregir quita el error; errores del servidor 422; confirmación en `role="status"` sin plazo; sin doble envío; 503, 429, 403 y fallo de red con el correo como alternativa y valores conservados; axe (contact-form). Verificación: `npm test` falla.
- [x] 6.2 Implementar `use-contact-form.ts`, `contact-form.tsx` y `classic-fields.tsx`. Verificación: sus pruebas en verde para el modo clásico.
- [x] 6.3 Implementar `terminal-fields.tsx` y `typed-command.tsx`. Verificación: las pruebas parametrizadas en verde para ambos modos.
- [x] 6.4 Pruebas en rojo e implementación del control de modo y de `live-json.tsx`: modo inicial terminal; cambiar conserva lo escrito; `aria-pressed`; el JSON muestra `<b>x</b>` como texto; elementos decorativos ocultos (contact-form: Dos modos; Detalles de cada modo). Verificación: `npm test` en verde.
- [x] 6.5 Pruebas en rojo e implementación de `turnstile.tsx`: sin clave no carga nada; con clave carga el script al acercarse y entrega el token; si no carga, error con el correo. Verificación: `npm test` en verde.
- [x] 6.6 Montar el formulario en `closing.tsx` y añadir el CSS de `scripting: none`. Verificación: pruebas de las secciones en verde.

## 7. El flujo en el navegador

- [x] 7.1 E2E en rojo y ajuste: en ES y EN y en cada modo, rellenar nombre, correo y consentimiento lleva a la confirmación; solo con teclado; envío sin contacto muestra el error en ambos modos y el foco va al primer campo (contact-form: Recorrido completo; Solo teclado). Verificación: `npm run e2e` en verde.
- [x] 7.2 E2E: con movimiento reducido el comando aparece completo; sin JavaScript se ve el correo y no el formulario; con el servidor respondiendo 503 se ve el error y se conservan los valores (contact-form). Verificación: `npm run e2e` en verde.
- [x] 7.3 E2E: axe sin infracciones en cada modo —vacío, con errores y enviado— a 375 y 1280 px; controles de 44 px o más; JS inicial, LCP y CLS dentro de presupuesto. Verificación: valores anotados aquí. **Si el JS inicial supera 200 kB, aplicar la partición de design.md D2 y anotarlo.**
- [x] 7.4 Revisión visual frente a la maqueta, ambos modos, a 390 y 1440 px. Verificación: capturas en `docs/brand/img/` y diferencias anotadas aquí.

## 8. Cierre del lote

- [x] 8.1 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente, con atención a seguridad y datos personales, y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 8.2 Puerta de cierre: `npm run lint`, `typecheck`, `test`, `test:contract`, `e2e`, `build:worker`, `measure:js` y, en `preview`, carga de `/es` y un `POST` válido a `/api/contact`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 8.3 Actualizar README, BACKLOG, `docs/architecture/`, `docs/setup.md` (qué falta del fundador para L10) y `.env.example`. Verificación: enlaces comprobados.
- [x] 8.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Ejecutado el 2026-11-14 sobre el código final del lote.

**Puerta de cierre (8.2)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` · `npm run typecheck` | Sin errores |
| `npm test` | 566 pruebas en 39 archivos, todas en verde |
| `npm run test:contract` (Supabase local) | 17 en verde: inserción, restricciones, RLS sin políticas, claves anónimas rechazadas, claves de prueba de Turnstile |
| `npm run e2e` | 246 en verde, 18 omitidas (métricas y tabulador, que solo aplican en Chromium) |
| `npm run build:worker` | 1054,8 KiB de 3072; sin secretos incrustados; sin Three.js |
| `npm run measure:js` | 161,3 kB de 200 (antes del lote: dentro de presupuesto sin partir el formulario; D2 no hizo falta) |
| LCP y CLS de `/es`, móvil simulado | 0,76 s y 0,0060 en ambas versiones |
| `preview` (Workers local, memoria) | `/es` y `/en` 200; `POST` válido 201; lista como cuerpo 400; origen ajeno 403 |
| `preview` con servicios reales contra Supabase **local** | `POST` válido 201 y fila con estado `new` y versión del consentimiento; sin token 403; campo trampa 201 sin fila y `contact.honeypot` en el registro; el binding `send_email` recibió el aviso |

`.dev.vars` se cambió a servicios reales locales solo durante esa comprobación y se restauró (`SERVICES=memory`, sin secretos). La base de producción no se tocó: la migración está aplicada solo en local.

**Revisión visual (7.4).** Capturas en `docs/brand/img/contact-{terminal,classic}[-errors]-{desktop,mobile}.png`. Diferencias con la maqueta: el correo de contacto queda debajo del formulario como alternativa permanente (la maqueta no lo muestra); los errores del modo terminal van bajo su línea en el color de error del tema oscuro.

**Revisión de código (8.1).** Subagente independiente, solo lectura: ningún hallazgo crítico, 2 importantes y 8 menores. Todos corregidos, con prueba:

1. *Importante.* Con verificación antispam activa, enviar antes de tener token producía un 403 «spam» a un visitante legítimo. Ahora el formulario espera el token hasta 15 s y, si no llega, lo dice sin enviar.
2. *Importante.* El campo trampa se llamaba `website` con etiqueta «Website»: un autorrelleno podía rellenarlo y la consulta se descartaba en silencio. Ahora tiene nombre y etiqueta sin significado, marcas para gestores de contraseñas, y cada activación se cuenta en el registro sin datos.
3. Ramas sin prueba: limitador que falla (se deja pasar) y verificador que falla (503).
4. Tras un fallo de red no se pedía token nuevo.
5. Una lista como cuerpo respondía 422 en vez de 400.
6. Caracteres de control (el nulo hacía fallar a Postgres): se retiran antes de validar.
7. Sin tiempo máximo en Turnstile, Supabase y el envío del navegador: 8 s, 8 s y 20 s.
8. Si la fila se guardaba pero la respuesta no se podía leer, el visitante veía un error y podía duplicar: el identificador se genera en el servidor y no se lee la respuesta.
9. `turnstile.tsx`: limpieza al desmontar sin `IntersectionObserver` y script pedido una sola vez.
10. Límite de cuerpo de 10 a 16 kB: un mensaje máximo en escritura multibyte con un token largo no cabía.

Encontrado por mí durante la implementación: antes de hidratar, un envío nativo habría puesto nombre y correo en la URL; el botón sale desactivado en el HTML y el formulario usa `method="post"`. Además, el esquema ahora informa de todos los errores en un intento (antes, con el nombre vacío, callaba la falta de medio de contacto).

**Desviaciones de TDD**

- `turnstile.tsx` se escribió antes que sus pruebas; estas se comprobaron por mutación (cuatro fallaron al romper el componente).
- Las pruebas de limitador y verificador que fallan cubren comportamiento que ya existía: nacieron en verde.
- La prueba de teclado asumía que tras la casilla venía el botón; viene antes el enlace a privacidad. Se corrigió la prueba, no el orden.

**No verificado**

- Envío real del correo: en local el binding `send_email` solo registra la llamada. La entrega a un buzón se comprueba en L10.
- El widget real de Turnstile en un navegador: las pruebas simulan su API; el servidor se probó con las claves de prueba oficiales.
- Si los registros de invocación de Workers (`observability`) incluyen la IP de la petición. El código propio no la registra. Pendiente para L9.
- `destination_address` en el binding `send_email`: limitaría el aviso a un único destinatario. Se fija en L10, cuando exista `NOTIFY_TO`.
- Lectores de pantalla reales y autorrelleno de navegadores y gestores de contraseñas reales.
- El tabulador en Safari: en WebKit simulado no recorre enlaces ni casillas por defecto; el recorrido por teclado se prueba en Chromium.

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
- En L10, con confirmación del fundador: aplicar la migración a `confiahomeDB` y cargar los secretos.
