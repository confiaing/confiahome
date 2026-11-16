# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el escenario que cubre.

## 1. Textos y guardas (L3-5, L3-7)

- [x] 1.1 Pruebas unitarias en rojo e implementación de `src/lib/emphasis.ts`: texto sin marcas, una marca, varias, marca sin cerrar, asterisco suelto. Verificación: `npm test` en verde.
- [x] 1.2 Escribir `tests/unit/content-claims.test.ts` en rojo: certificación y garantía, diagnóstico en las acciones de agenda, negación en la primera etapa, cifras, sectores en «Dónde empezamos», copias sin traducir (content-claims: todos los requisitos de nivel U). Verificación: `npm test` falla porque faltan las claves `home`.
- [x] 1.3 Añadir `home` a `es.ts` con el texto de `docs/design/contenido-base.md`. Verificación: `npm run typecheck` falla en `en.ts` nombrando `home`.
- [x] 1.4 Redactar `home` en `en.ts` y `tests/support/untranslated.ts`. Verificación: `npm test` y `npm run typecheck` en verde.
- [x] 1.5 Comprobar que cada guarda falla con un texto prohibido de prueba (una frase por guarda, dentro de la propia prueba). Verificación: `npm test` en verde con esos casos.
- [x] 1.6 Generar `docs/content/home.md` con ES y EN lado a lado, por sección. Verificación: el documento contiene todas las claves de `home`.

## 2. Piezas comunes (L3-8)

- [x] 2.1 Pruebas de integración en rojo de `Emphasized`, `SectionHeading` y `Band`: `<em>` en los tramos marcados, antetítulo y título con el nivel indicado, tema, `id` y nombre accesible de la región. Verificación: `npm test` falla.
- [x] 2.2 Implementar `emphasized.tsx`, `section-heading.tsx` y `band.tsx`. Verificación: `npm test` y `npm run lint` en verde.
- [x] 2.3 Pruebas en rojo e implementación de `ContactActions`: acción principal a Calendly con aviso de nueva pestaña, secundaria a `#consulta`, estilos distintos, textos en ES y EN. Verificación: `npm test` en verde.

## 3. Hero y página (L3-1)

- [x] 3.1 Adaptar `tests/e2e/brand.spec.ts` para que localice título, texto y acción por rol, sin depender de la página provisional. Verificación: `npm run e2e` sigue en verde.
- [x] 3.2 Pruebas de integración en rojo del hero: un `h1`, dos CTA distintos, nota exploratoria sin «diagnóstico», tres pilares, ES y EN, axe (home-page: Hero). Verificación: `npm test` falla.
- [x] 3.3 Implementar `hero.tsx` y componerlo en `[locale]/page.tsx`; eliminar `home-placeholder.tsx`, su prueba y las claves `placeholder`. Verificación: `npm test`, `typecheck` y `e2e` en verde.

## 4. Dónde empezamos (L3-2)

- [x] 4.1 Pruebas de integración en rojo: región con su título, cuatro fricciones y cuatro preguntas en listas ordenadas, tema salvia y tarjeta mantequilla, ES y EN, axe (home-page: Dónde empezamos). Verificación: `npm test` falla.
- [x] 4.2 Implementar `where-we-start.tsx` con `id="donde-empezamos"`. Verificación: `npm test` en verde.

## 5. Cómo lo hacemos realidad (L3, base de L4)

- [x] 5.1 Pruebas de integración en rojo: lista ordenada de cinco etapas en orden, tres apartados etiquetados por etapa, la primera con «30 minutos» y la negación de diagnóstico, ES y EN, axe (home-page: Las cinco etapas). Verificación: `npm test` falla.
- [x] 5.2 Implementar `journey-overview.tsx` con `id="como"`. Verificación: `npm test` en verde.

## 6. Lo que ofrecemos (L3-3)

- [x] 6.1 Pruebas de integración en rojo: servicio principal en tarjeta propia de tema oscuro y antes que los demás, cuatro servicios en el orden del PRD, niveles de encabezado, ES y EN, axe (home-page: Servicios con jerarquía). Verificación: `npm test` falla.
- [x] 6.2 Implementar `offer.tsx`. Verificación: `npm test` en verde.

## 7. Por qué confiar (L3-4, L3-5)

- [x] 7.1 Pruebas de integración en rojo: cuatro evidencias, nota de atribución después de la lista, tres principios, mensaje de seguridad sin palabras de certificación, ES y EN, axe (home-page: Credibilidad; content-claims: Mensaje de seguridad, Nota junto a las evidencias). Verificación: `npm test` falla.
- [x] 7.2 Implementar `trust.tsx`. Verificación: `npm test` en verde.

## 8. Cierre (L3-6)

- [x] 8.1 Pruebas de integración en rojo: mismas acciones y destinos que el hero, bloque `#consulta` con el correo como texto y enlace, bloque `#agenda` con enlace directo, tema índigo claro, ES y EN, axe (home-page: Cierre). Verificación: `npm test` falla.
- [x] 8.2 Implementar `closing.tsx`. Verificación: `npm test` en verde.
- [x] 8.3 Prueba de integración de la página completa: seis regiones en orden, un `h1`, sin saltos de nivel de encabezado, ES y EN (home-page: Orden y títulos). Verificación: `npm test` en verde.

## 9. La home en el navegador (L3-8)

- [x] 9.1 E2E en rojo y ajuste: fondos de las secciones en orden, bandas que no tocan los bordes y con radio a 375 y 1280 px, tarjetas mantequilla e índigo (home-page: Ritmo de secciones). Verificación: `npm run e2e` en verde.
- [x] 9.2 E2E: la tarjeta del servicio principal tiene más área y mayor título que las demás (home-page: Dominio visual medido). Verificación: `npm run e2e` en verde.
- [x] 9.3 E2E: las anclas de la cabecera y la acción de consulta dejan su destino visible bajo la cabecera; sin JavaScript el hero está completo y los destinos son los esperados; el HTML servido contiene las cinco etapas (home-page: Anclas; Hero sin JavaScript; Presente en el HTML servido). Verificación: `npm run e2e` en verde.
- [x] 9.4 E2E: sin desbordamiento horizontal a 375 px en ES y EN; acciones de 44 px o más; axe sin infracciones en `/es` y `/en` a 375 y 1280 px; movimiento reducido (home-page: La home se lee en móvil). Verificación: `npm run e2e` en verde en Chromium y WebKit móvil.
- [x] 9.5 E2E: LCP < 2,5 s y CLS < 0,1 en móvil simulado. Verificación: valores anotados en «Evidencia».
- [x] 9.6 Revisión visual frente a la maqueta con capturas a 390 y 1440 px de cada sección. Verificación: capturas en `docs/brand/img/` y diferencias anotadas aquí.

## 10. Cierre del lote

- [x] 10.1 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 10.2 Puerta de cierre: `npm run lint`, `typecheck`, `test`, `e2e`, `build:worker`, `measure:js` y carga de `/es` y `/en` en `preview`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 10.3 Actualizar README, BACKLOG y `docs/architecture/`. Anotar L3-7 (M) como pendiente de la revisión del fundador. Verificación: enlaces comprobados.
- [x] 10.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Ejecutado el 2026-11-14. El trabajo se pausó a las 16:35 a petición del fundador y se reanudó a las 17:01.

**Puerta de cierre (10.2)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npm run typecheck` | 0 errores |
| `npm test` | 322 pruebas en 28 archivos, en verde |
| `npm run e2e` | 149 en verde, 5 omitidas (métricas y puntero, solo Chromium) |
| `npm run build:worker` | 971,4 KiB de 3072 KiB (margen 68,4 %); sin secretos incrustados |
| `npm run measure:js` | 135,7 kB de 200 kB (68 %): igual que en L2, el lote no añade JavaScript |
| `preview` (runtime de Workers) | `/es` y `/en` responden 200 con su `lang`, un `h1`, seis secciones y las cinco etapas en el HTML |

**Rendimiento (9.5).** Móvil simulado (Pixel 7, CPU ×4, 1,6 Mbps, 150 ms): LCP 0,73 s y CLS 0,0055. La primera medición dio CLS 0,118, por encima del límite: el título del hero ocupaba una línea más con la fuente de respaldo. Se corrigió con un respaldo propio de Fraunces; detalle y mediciones en design.md.

**Revisión visual (9.6).** Capturas por sección a 1440 y 390 px en `docs/brand/img/home-*.png`. Diferencias con la maqueta: sin ilustración en hero y cierre (L4), etapas en rejilla en lugar de recorrido (L4), «Por qué confiar» sobre crema en lugar de blanco, y bloques de contacto en lugar de formulario y calendario (L5 y L6).

**Revisión de código (10.1).** Subagente independiente con `code-reviewer`. Ningún hallazgo crítico: los textos no rompen ninguna regla roja y el español reproduce `contenido-base.md` literalmente. Seis hallazgos importantes y dieciséis menores.

- Corregidos:
  - Guardas de contenido fáciles de esquivar (1): ahora cubren sellos y normas, otros verbos de garantía, clientes y prueba social, cifras con letra, plazos, y atan cada número admitido a su sitio; la regla de diagnóstico se extiende a todas las claves que nombran la llamada y la de sectores a toda la sección. 36 casos de texto prohibido y 10 de texto legítimo.
  - Cursiva sintetizada en preguntas, «siguiente paso», segundo principio y correo (2): usaban la fuente recta inclinada. La regla va ahora fuera de las capas.
  - Anclas con doble compensación de la cabecera (3).
  - Servicios en una columna a exactamente 1099 px (4): los puntos de corte propios pasan a ser tokens en rem (`nav`, `wide`); mezclados con píxeles, Tailwind los ordenaba mal.
  - Inglés (5): 16 frases reescritas («with them», «development lifecycle», nota de atribución, «small and mid-sized businesses», entre otras).
  - Listas con `role="list"` para Safari (7); letra mínima de 13 px en etiquetas (9); servicios subordinados en lista (12); correo en `src/lib/contact.ts` (14); guarda de asteriscos (15); pruebas reforzadas: desbordamiento por elemento y a 320 px, `/en`, flecha con movimiento reducido, fuente cursiva real, rejilla en cada salto (16 a 20).
- Documentados o pendientes de decisión del fundador:
  - `home.closing.inquiryText` («Escríbenos y cuéntanos qué proceso tienes en mente:») es texto nuevo, no está en `contenido-base.md` (6).
  - El borde de las tarjetas de fricción sobre salvia contrasta 2,6:1, como en la maqueta; el texto sí cumple (8).
  - El enlace del bloque de agenda dice «Agenda 30 minutos» y las acciones «Agenda una conversación de 30 minutos»: mismo destino, dos nombres (13).
  - El CLS medido corresponde a un equipo con Times New Roman; en Android el respaldo no se ajusta (21).

**Escenario L3-7 (M): pendiente del fundador.** La redacción inglesa está en `docs/content/home.md`, lado a lado con el español.

**Desviaciones de TDD**

- Los textos ES y EN se añadieron a la vez: no se vio fallar `typecheck` por la clave ausente en inglés (tarea 1.3).
- Las pruebas añadidas tras la revisión (guardas ampliadas, rejilla, cursiva, anclas) se escribieron junto con su corrección. La de cursiva sí se vio en rojo: destapó que la regla perdía frente a la utilidad del mismo elemento.

**No verificado**

- Lectores de pantalla reales (VoiceOver, NVDA).
- El salto de diseño en un Android real.
- La naturalidad del inglés por un hablante nativo.

## Workflow follow-up

- Revisión de `docs/content/home.md` por el fundador (L3-7).
- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
