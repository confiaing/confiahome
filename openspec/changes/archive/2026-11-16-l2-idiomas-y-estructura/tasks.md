# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el escenario que cubre.

## 1. Negociación y tabla de rutas (L2-1)

- [x] 1.1 Pruebas unitarias en rojo de `negotiate.ts`: pesos, variante regional, cabecera vacía, comodín, mal formada, `q=0`, cookie válida, cookie no admitida (locale-routing: Negociación del idioma del navegador; La raíz lleva al idioma del visitante). Verificación: `npm test` falla por módulo inexistente.
- [x] 1.2 Implementar `src/i18n/negotiate.ts`. Verificación: `npm test` y `npm run lint` en verde.
- [x] 1.3 Pruebas unitarias en rojo de `routes.ts`: `pathFor`, `matchRoute`, `equivalentPath` en ambos sentidos y con ruta desconocida, `legalRouteFor` con cruces, `LEGAL_PARAMS` (locale-routing: Página equivalente; legal-pages: Slug e idioma no se cruzan). Verificación: `npm test` falla.
- [x] 1.4 Implementar `src/i18n/routes.ts`. Verificación: `npm test` en verde.

## 2. Redirección de la raíz y cambio de idioma (L2-1, L2-2)

- [x] 2.1 Pruebas de integración en rojo del `GET` de `/`: los cinco casos de redirección, estado 307 y cabeceras de caché (locale-routing: La raíz lleva al idioma del visitante). Verificación: `npm test` falla.
- [x] 2.2 Implementar `src/app/route.ts`. Verificación: `npm test` en verde.
- [x] 2.3 Pruebas de integración en rojo del `GET` de `/api/locale`: destino equivalente, atributos de la cookie, origen externo, idioma no admitido, `Secure` solo por HTTPS (locale-routing: Cambio manual; No redirige fuera del sitio; Cookie de preferencia). Verificación: `npm test` falla.
- [x] 2.4 Implementar `src/app/api/locale/route.ts`. Verificación: `npm test` en verde.
- [x] 2.5 Comprobar ambos handlers en el runtime de Workers con `npm run preview` y `curl`: `/` con y sin cookie, `/api/locale?to=en` con `Referer`, y que `/es` sigue respondiendo 200. Verificación: salida anotada en «Evidencia». **Si falla, detener el lote y consultar.**
- [x] 2.6 Escribir el ADR-0012 (cambio de idioma por un punto del servidor) y enlazarlo en README y en `docs/architecture/README.md`. Verificación: el ADR existe y los enlaces abren.

## 3. Diccionarios (L2-3)

- [x] 3.1 Crear `tests/fixtures/types/` con un diccionario al que le falta una clave y otro al que le sobra, y la prueba unitaria en rojo que los compila con la API de TypeScript y espera el nombre de la clave (translations: Clave ausente, Clave sobrante). Verificación: `npm test` falla.
- [x] 3.2 Implementar `dictionaries/es.ts`, `types.ts`, `en.ts` e `index.ts` con las claves del lote. Verificación: `npm test` y `npm run typecheck` en verde.
- [x] 3.3 Prueba unitaria: los diccionarios reales tienen las mismas claves y ningún texto vacío (translations: Los diccionarios reales están completos). Verificación: `npm test` en verde.
- [x] 3.4 Actualizar la prueba de la página provisional y pasar sus textos al diccionario (translations: Página provisional en ambos idiomas). Verificación: `npm test` en verde.

## 4. Selector de idioma y acción de agenda (L2-2, L2-4)

- [x] 4.1 Pruebas de integración en rojo de `LanguageSwitch`: idioma activo con `aria-current`, el otro como enlace a `/api/locale` con `hreflang`, `lang` y `rel="nofollow"`, nombre accesible del grupo, axe (locale-routing: El idioma activo está señalado; translations: Opción del otro idioma). Verificación: `npm test` falla.
- [x] 4.2 Implementar `components/ui/language-switch.tsx`. Verificación: `npm test` en verde.
- [x] 4.3 Pruebas en rojo e implementación de `AgendaLink`: enlace a la URL del calendario, nueva pestaña, `rel`, aviso, `data-agenda` (site-navigation: La acción de agenda funciona sin JavaScript). Verificación: `npm test` en verde.

## 5. Cabecera y menú (L2-4)

- [x] 5.1 Pruebas de integración en rojo de `NavDisclosure`: `aria-expanded` y `aria-controls`, abrir y cerrar con clic, Enter y Espacio, Escape devuelve el foco al botón, se cierra al elegir un enlace (site-navigation: Menú desplegable). Verificación: `npm test` falla.
- [x] 5.2 Implementar `components/ui/nav-disclosure.tsx` (cliente). Verificación: `npm test` y `npm run lint` en verde.
- [x] 5.3 Pruebas en rojo de `SkipLink` y `SiteHeader`: logo a la home del idioma, navegación con nombre accesible, anclas absolutas a la home, agenda, textos en ES y EN, axe (site-navigation: Cabecera; Las anclas funcionan desde una página legal). Verificación: `npm test` falla.
- [x] 5.4 Implementar `skip-link.tsx` y `site-header.tsx`, con el bloque `<noscript>`. Verificación: `npm test` en verde.

## 6. Pie (L2-5)

- [x] 6.1 Pruebas de integración en rojo de `SiteFooter`: correo como texto y enlace, legales del idioma activo en ES y EN, selector, derechos, tema oscuro, axe (site-navigation: Pie). Verificación: `npm test` falla.
- [x] 6.2 Implementar `site-footer.tsx`. Verificación: `npm test` en verde.

## 7. Marco, metadatos y páginas (L2-4, L2-6, L2-7)

- [x] 7.1 Pruebas unitarias en rojo e implementación de `src/i18n/metadata.ts`: canónica y alternos de home y legales, `x-default` (locale-routing: Metadatos por idioma). Verificación: `npm test` en verde.
- [x] 7.2 E2E en rojo del marco: primer Tab en el enlace de salto y Enter lleva al contenido; regiones únicas; menú en 375 px (Escape, foco, enlaces no enfocables cerrado); agenda alcanzable en 375 y 1280 px; alternos y canónica (site-navigation; locale-routing: Metadatos). Verificación: `npm run e2e` falla.
- [x] 7.3 Componer el marco en `[locale]/layout.tsx` y `<main id="contenido">` en la página provisional; `generateMetadata` en la home. Verificación: `npm run e2e` en verde para lo anterior.
- [x] 7.4 E2E en rojo de páginas legales y 404: las cuatro rutas legales con título y aviso, `noindex`, cruces 404; 404 en ES y EN con enlace a su home, un solo idioma anunciado, ruta profunda, `/fr` bilingüe (legal-pages; not-found-page). Verificación: `npm run e2e` falla.
- [x] 7.5 Implementar `[locale]/[legal]/page.tsx` y `legal-placeholder.tsx`. Verificación: sus E2E en verde.
- [x] 7.6 Implementar `[locale]/[...rest]/page.tsx`, `[locale]/not-found.tsx` y la regla CSS que oculta el idioma que no corresponde. Verificación: sus E2E en verde. **Si Next.js no sirve `not-found.tsx` al rechazar un parámetro, aplicar la alternativa de design.md y anotarlo.**
- [x] 7.7 Activar `experimental.globalNotFound` e implementar `global-not-found.tsx`. Verificación: E2E de `/fr` en verde y `npm run build:worker` sin errores. **Si no funciona con OpenNext, retirar, anotar la limitación y consultar.**

## 8. Recorridos completos (L2-2)

- [x] 8.1 E2E en rojo y ajuste: de `/es/privacidad` elegir EN lleva a `/en/privacy` con cookie `locale=en`; volver a `/` lleva a `/en`; entrada directa a `/en` con cookie `es` no redirige; lo mismo con JavaScript desactivado (locale-routing: Cambio manual; La URL manda). Verificación: `npm run e2e` en verde en Chromium y WebKit móvil.
- [x] 8.2 E2E: sin JavaScript en 375 px las anclas, el selector y la agenda están visibles; con movimiento reducido el menú no se desplaza; axe sin infracciones en `/es` y `/en`, 375 y 1280 px, menú cerrado y abierto; ninguna frase española en `/en` y `/en/privacy` (site-navigation; translations). Verificación: `npm run e2e` en verde.
- [x] 8.3 E2E: CLS < 0,1 en móvil simulado con el marco (site-navigation: Presupuestos). Verificación: valor anotado en «Evidencia».

## 9. Cierre del lote

- [x] 9.1 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 9.2 Puerta de cierre: `npm run lint`, `typecheck`, `test`, `e2e`, `build:worker`, `measure:js` y carga de `/`, `/es` y `/en/privacy` en `preview`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 9.3 Rehacer las capturas de `docs/brand/img/` con el marco, y actualizar README, BACKLOG y `docs/architecture/` (rutas y componentes). Verificación: enlaces comprobados.
- [x] 9.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Todo ejecutado el 2026-11-14.

**Puerta de cierre (9.2)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npm run typecheck` | 0 errores |
| `npm test` | 253 pruebas en 26 archivos, en verde |
| `npm run e2e` | 105 en verde, 3 omitidas (CLS ×2 y `:active`, solo Chromium) |
| `npm run build:worker` | 965,7 KiB de 3072 KiB (margen 68,6 %); sin secretos incrustados. Sube 116 KiB respecto a L1 por las dos rutas dinámicas |
| `npm run measure:js` | 135,7 kB de 200 kB (68 %): +0,9 kB por el menú, el primer componente de cliente |
| CLS (8.3) | 0,0053 en móvil simulado (Pixel 7, CPU ×4, 1,6 Mbps, 150 ms) |

**Runtime de Workers (2.5 y 9.2).** `opennextjs-cloudflare preview` y `curl`:

| Petición | Respuesta |
|---|---|
| `/?utm_source=x` con `Accept-Language: en-US` | 307 → `/en?utm_source=x`, `private, no-store` |
| `/` con cookie `locale=en` y `Accept-Language: es` | 307 → `/en` |
| `/` con `Accept-Language: fr-FR` | 307 → `/es` |
| `/api/locale?to=en` con `Referer` de `/es/privacidad` | 307 → `/en/privacy`; `Set-Cookie: locale=en; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly` (sin `Secure` por ser `localhost`) |
| `/api/locale?to=fr` | 307 → `/`, sin cookie |
| `/api/locale?to=en` con `Referer` de otro sitio | 307 → `/en` |
| `/es`, `/en/privacy`, `/es/terminos` | 200, con `<html lang>` correcto y cabecera |
| `/en/no-existe`, `/es/privacy`, `/fr`, `/es/a/b` | 404, HTML completo con los dos mensajes |
| Alternos de `/en/privacy` | Canónica y `hreflang` con `https://confia.ing` |

**No comprobado en Workers:** la cabecera `Secure` de la cookie con el dominio real; se verá en el despliegue (L10).

**Alternativas aplicadas (7.6 y 7.7).** `globalNotFound` funciona con OpenNext. La 404 por idioma no: llegaba vacía en el HTML. Se sustituyó por una única 404 bilingüe; detalle en design.md, «Cambios durante la implementación».

**Revisión de código (9.1).** Subagente independiente con `code-reviewer`: 1 hallazgo crítico, 7 importantes y 15 menores.

- **Crítico, corregido:** la 404 bajo `/es` y `/en` solo existía con JavaScript. Mis E2E miraban el DOM ya hidratado; ahora hay pruebas sobre el HTML servido y con los scripts desactivados.
- Corregidos: `/` perdía la consulta de la URL (I3); `Secure` dependía de `request.url` (I4); menú con `<noscript><style>` y sin cierre al salir el foco (I6, I7); pesos de `Accept-Language` en mayúscula o mal escritos (M3); cookie repetida (M4); canónica con `localhost` en producción (M9); `noindex` duplicado y 404 sin axe (M10); aviso de borrador como región viva (M11); lista de frases españolas escrita a mano (M15).
- Documentados: dependencia de la `Referrer-Policy` (I5, ADR-0012 y BACKLOG L9-5); diferencias con design.md (I2); `HEAD` y fijación del idioma desde otro sitio (M2); año del pie (M8); anclas en español (M13).
- Sin cambio: confianza en la cabecera `Host` (M1; el destino sigue saliendo de la tabla de rutas); 500 con URL mal codificada (M6; es de Next.js, se revisará en L9).

**Desviaciones de TDD**

- Las pruebas de pesos mal escritos, cookie repetida, consulta de la URL, `Secure` y cierre del menú por foco se escribieron junto con su corrección tras la revisión; no se vieron en rojo por separado.
- La prueba E2E «sin animación» del menú pasa por construcción: no hay animación que quitar.

**No verificado**

- El selector de idioma y el menú con VoiceOver o NVDA.
- El comportamiento con JavaScript activado pero sin cargar.
- El cambio de idioma en un navegador que no envía `Referer`.

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
