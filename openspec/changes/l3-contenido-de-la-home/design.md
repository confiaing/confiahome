# Design

## Context

Motivación y alcance: ver [proposal.md](proposal.md). Requisitos: ver `specs/`.

Estado de partida, comprobado en el código:

- `[locale]/page.tsx` pinta `HomePlaceholder`. El layout ya aporta enlace de salto, cabecera y pie.
- Componentes disponibles: `ButtonLink`, `AgendaLink`, `TextLink`, `Card` (con `theme`), `Logo`.
- Temas por clase en la capa base (`theme-fresh`, `theme-coral`, `theme-warm`, `theme-dark`, `theme-calm`); `--radius-band` ya existe en los tokens.
- Diccionarios con las claves de L2; la prueba de paridad recorre todas las hojas, también dentro de listas.
- La cabecera enlaza a `#donde-empezamos` y `#como`.
- Las pruebas E2E de L1 (`brand.spec.ts`) localizan el título, el párrafo y el primer enlace de `main#contenido`.

Referencias: texto en `docs/design/contenido-base.md`; forma en `docs/design/ronda5-cercano-3d-finalista.html` (`.hero`, `.start`, `.journey`, `.offer`, `.trust`, `.closing`, `.band`, `.panel`).

## Goals / Non-Goals

**Goals:**

- Cero JavaScript de cliente nuevo: todo son componentes de servidor.
- Que el lote L4 pueda añadir pestañas y escena sin reescribir el contenido de las etapas.
- Que una frase prohibida no pueda llegar a producción sin romper una prueba.

**Non-Goals:**

- Animaciones de entrada o de desplazamiento.
- Ilustraciones del hero y del cierre: son las posiciones de la escena (L4).
- Encabezado fijo de «Dónde empezamos» al desplazarse y otros comportamientos `sticky` de la maqueta que dependen de la escena.

## Decisions

### D1 — Textos: clave `home` en los diccionarios

`es.ts` y `en.ts` ganan `home`, con una subclave por sección: `hero`, `start`, `journey`, `offer`, `trust`, `closing`. Las listas (fricciones, preguntas, etapas, servicios, evidencias, principios, pilares) son arrays; la prueba de paridad ya compara su longitud porque recorre índices.

- **Énfasis dentro de un título** (la cursiva de «resultados», «juntos», «con él»): se marca en el texto con asteriscos, `"…generar *resultados* en tu empresa."`, y `src/lib/emphasis.ts` lo parte en tramos. El componente `Emphasized` pinta los tramos marcados con `<em>`. Así el traductor decide qué palabra se enfatiza en cada idioma.
- Se eliminan las claves `placeholder`.

*Alternativa:* partir cada título en tres claves (`antes`, `énfasis`, `después`). Descartada: obliga al inglés a seguir el orden de palabras del español.
*Alternativa:* HTML dentro del diccionario. Descartada: exige insertar HTML sin escapar.

*Nivel de prueba:* unitario (`emphasis`, paridad, guardas de contenido).

### D2 — Guardas de contenido

`tests/unit/content-claims.test.ts` recorre todas las hojas de ambos diccionarios:

| Guarda | Regla |
|---|---|
| Certificación y garantía | Ninguna hoja coincide con las familias `certific*`, `cumpl*` / `compl(y|iant|iance)`, `garant*` / `guarante*`, `homolog*`, `acredit*` / `accredit*` |
| Diagnóstico y llamada | Las claves de las acciones de agenda y su nota no contienen `diagn[oó]stic*` ni `assessment`; la primera etapa sí, y precedida de negación |
| Cifras | Ninguna hoja contiene `%`, símbolos de moneda ni `\d+x`; los números presentes pertenecen a una lista cerrada |
| Sectores en «Dónde empezamos» | Las fricciones y preguntas no contienen una lista de términos de sector (salud, banca, retail…) |
| Copias | Ninguna hoja de `en` es idéntica a la de `es`, salvo las claves de `tests/support/untranslated.ts` |

La palabra «cumplimiento» no aparece en los textos: el mensaje de seguridad habla de «requisitos normativos». Si un texto futuro la necesita en sentido negativo, la guarda se ajusta de forma explícita.

### D3 — Componentes

Todos de servidor. Cada sección recibe su trozo de diccionario.

| Archivo | Contenido |
|---|---|
| `components/ui/band.tsx` | `Band`: `<section>` con tema, margen lateral, `--radius-band` y recorte. Recibe `theme`, `id`, `labelledBy` |
| `components/ui/section-heading.tsx` | Antetítulo en DM Mono y título de sección con `Emphasized` |
| `components/ui/emphasized.tsx` | Tramos de texto, los marcados en `<em>` |
| `components/sections/hero.tsx` | `h1`, texto, las dos acciones, nota, pilares |
| `components/sections/where-we-start.tsx` | Banda salvia: encabezado, fricciones (`<ol>`), tarjeta mantequilla con preguntas (`<ol>`) |
| `components/sections/journey-overview.tsx` | `<ol>` de cinco etapas; cada una, un `<article>` con título, etiqueta de etapa y `<dl>` de tres apartados |
| `components/sections/offer.tsx` | Banda coral: tarjeta índigo del servicio principal y cuatro tarjetas |
| `components/sections/trust.tsx` | Evidencias (`<ul>`), nota, principios, mensaje de seguridad |
| `components/sections/closing.tsx` | Banda índigo claro: título, acciones, bloque `#consulta` y bloque `#agenda` |
| `components/sections/contact-actions.tsx` | Las dos acciones, compartidas por hero y cierre para que no puedan divergir |

`[locale]/page.tsx` compone `<main id="contenido">` con las seis secciones.

**Identificadores de ancla:** `donde-empezamos`, `como`, `consulta` y `agenda`, los de la maqueta, iguales en ambos idiomas. Cada destino lleva `scroll-margin-top` para quedar bajo la cabecera fija.

**Encabezados:** `h1` en el hero; `h2` por sección; `h3` en fricciones, etapas, servicios y bloques de contacto. La tarjeta de preguntas y «Tres principios» usan `h3`.

**Numeración** de fricciones, preguntas y etapas: contadores CSS, como en la maqueta; el número no se repite en el texto.

*Nivel de prueba:* integración por sección (estructura, textos de ambos idiomas, axe); E2E para lo que depende del CSS real.

### D4 — La sección de etapas como base de L4

`journey-overview.tsx` pinta las cinco etapas apiladas, con el estilo de `.panel` de la maqueta. No lleva pestañas, escena ni atributos ARIA de pestaña. L4 envolverá esta misma lista: los paneles ya son los `<article>` y el contenido no se duplica.

Con esto el escenario de L4-3 («las cinco etapas están en el HTML inicial») queda cumplido aquí; L4 lo conserva.

*Alternativa:* dejar solo el título de la sección hasta L4. Descartada: la home no explicaría «cómo empezar» y el ancla `#como` llevaría a una sección vacía.

### D5 — Bloques de contacto sin JavaScript

En el cierre, dos `Card` de tema claro sobre la banda índigo claro:

- `#consulta`: título, una línea que invita a escribir y `hola@confia.ing` como `TextLink` de correo. L5 pone el formulario encima y conserva esta línea como alternativa.
- `#agenda`: título, la nota de conversación exploratoria y `AgendaLink`. L6 lo sustituye por el calendario a petición.

La acción principal de hero y cierre es `AgendaLink` (enlace directo, `data-agenda`). La secundaria es un `ButtonLink` a `#consulta`.

### D6 — Ritmo y formas

- `Band` aplica `margin-inline: clamp(8px, 1.6vw, 24px)` y `border-radius: var(--radius-band)`.
- Orden de fondos: hero crema · banda salvia · crema · banda coral · crema · banda índigo claro · pie índigo.
- **«Por qué confiar» va sobre crema.** En la hoja de estilos de la maqueta esa sección usa blanco; la regla que diste al revisarla («una sección crema, la siguiente de color») y la ficha de marca dicen crema. Se sigue la regla; cambiarlo es una clase.
- Rejillas: una columna en móvil; fricciones a dos columnas desde 768 px; servicios subordinados a dos columnas desde 640 px y cuatro desde 1100 px; cierre con consulta y agenda lado a lado desde 1024 px.
- La tarjeta del servicio principal lleva el motivo decorativo de peldaños de la maqueta como SVG en línea, `aria-hidden`, con colores por rol.

### D7 — Pruebas de navegador

`tests/e2e/home.spec.ts`:

- Fondos calculados de cada sección en orden y forma de las bandas (márgenes y radio) a 375 y 1280 px.
- Áreas y tamaños de letra de las tarjetas de servicios.
- Anclas de la cabecera y acción de consulta: el destino queda bajo la cabecera.
- Sin JavaScript: hero completo, destinos de las acciones, `hola@confia.ing` visible.
- HTML servido con los nombres de las cinco etapas.
- Sin desbordamiento horizontal a 375 px en ES y EN.
- LCP con `PerformanceObserver` en Chromium (Pixel 7, CPU ×4, 1,6 Mbps, 150 ms), CLS y axe.

`brand.spec.ts` deja de depender de la página provisional: usa el `h1`, el texto y la acción secundaria del hero.

### Dependencias

- `components/sections` importa `components/ui`, `i18n` (tipos) y `lib`. `lib/emphasis.ts` no importa nada. Sin cambios en la tabla de CLAUDE.md.
- Ningún `"use client"` nuevo.

## Risks / Trade-offs

- **El inglés lo redacto yo** → Se entrega `docs/content/home.md` con ES y EN lado a lado; el escenario L3-7 (M) queda pendiente de tu revisión y así se anota. No bloquea el lote: corregir una frase es editar `en.ts`.
- **Las guardas por palabras dan falsos positivos o negativos** → Son una red, no una revisión editorial. Lista de excepciones explícita y revisión humana del documento de contenido.
- **Títulos largos en inglés o en 375 px desbordan** → Prueba de desbordamiento en ambos idiomas; tamaños con `clamp` y `text-balance`.
- **El hero queda sin imagen hasta L4** → Aceptado. El LCP será el título, que es texto.
- **`brand.spec.ts` cambia de superficie** → Sus pruebas se adaptan en la primera tarea, antes de retirar la página provisional, para no perder cobertura.
- **«Sector salud» aparece en la credibilidad** → Es evidencia del PRD §7 y no contradice la regla de no nombrar sectores objetivo, que aplica a «Dónde empezamos». La guarda de sectores se limita a esa sección.

## Migration Plan

Nada desplegado. Para revertir, revertir el commit del lote.

## Cambios durante la implementación

Lo construido difiere de lo escrito arriba en estos puntos. Donde hay contradicción, vale esta sección.

| Punto | Previsto | Construido | Motivo |
|---|---|---|---|
| D3 · `Band` | `components/ui/band.tsx` | `components/ui/section.tsx`: `Section`, que es banda cuando recibe `theme` | Las secciones sobre crema y las bandas comparten región, relleno y ancho; un solo componente evita dos formas de hacer lo mismo. |
| D3 · Composición | En `[locale]/page.tsx` | `components/sections/home-content.tsx`, que la página usa | Permite probar la página completa (orden, encabezados) sin Next.js. |
| D3 · Estilos de texto | — | `components/ui/typography.ts` con las clases de título, antetítulo y entrada | Se repetían en seis secciones. |
| D1 · Acciones | En `hero` y `closing` | Clave `home.actions`, compartida | Hero y cierre no pueden divergir ni en el texto. |
| D5 · Flecha de la acción principal | — | `AgendaLink` gana la opción `arrow` | La maqueta la lleva en hero y cierre, no en la cabecera. |
| D6 · Etapas | Apiladas | Rejilla de una, dos o tres columnas según el ancho | Apiladas ocupaban cinco pantallas en escritorio; L4 las reordena de todos modos. |
| **Fuentes · respaldo de Fraunces** | El de `next/font` | Uno propio en `globals.css` (`Fraunces Fallback` al 95 % y su cursiva al 87,5 %) | Con el respaldo de `next/font` el título del hero ocupaba una línea más hasta que llegaba Fraunces y la página saltaba: CLS 0,118, por encima del límite. Medido: el respaldo generado salía un 36 % más ancho que Fraunces en títulos. Con el propio, CLS 0,0055. |
| D7 · Prueba de fuentes de L1 | Dos precargas | Igual; se probó precargar también la cursiva y no corregía el salto | El problema era el ancho del respaldo, no el momento de llegada. |

| D2 · Guardas | Cinco reglas | Ocho, con claves ampliadas y números atados a su sitio; más una guarda de asteriscos | La revisión mostró que la mayoría de variantes fáciles pasaban. |
| D3 · Hero | Usa `Band`/`Section` | `<section>` propia | Su relleno es distinto y su título es el `h1`. |
| D3 · Anclas | `scroll-margin-top` en cada destino | Solo `scroll-padding-top` global; las tarjetas de contacto añaden 4 px | Se sumaban y dejaban ver una franja de la sección anterior. |
| D6 · Puntos de corte | 900 y 1100 px con valores arbitrarios | Tokens `--breakpoint-nav` y `--breakpoint-wide`, en rem | Tailwind emite las consultas en px antes que las de rem: un valor arbitrario en px perdía frente a `sm:` o `lg:`. |
| Cursiva de títulos | Regla en la capa base para `em` e `i` | Fuera de las capas, también para `.italic` | En la capa base perdía frente a la utilidad `font-display` del mismo elemento y el navegador inclinaba la recta. |
| Correo de contacto | Literal en cada componente | `src/lib/contact.ts` | Estaba copiado en tres sitios. |

**Medición del respaldo (Chromium, 100 px, mismo texto y espaciado):** Fraunces 500 con tamaño óptico 144, 3625 px; Times New Roman, 3819 px (razón 0,949); respaldo de `next/font`, 4919 px. Cursiva: Fraunces 1316 px; Times New Roman cursiva, 1505 px (razón 0,875).

**Limitaciones aceptadas**

- El respaldo está ajustado a los títulos grandes. En títulos de tarjeta, donde Fraunces usa otro tamaño óptico, la coincidencia es peor, pero el texto es corto y no cambia de líneas.
- Donde no hay Times New Roman (Android), el respaldo es la serif del sistema sin ajustar; el salto puede ser mayor que el medido en la prueba, que corre en Chromium de escritorio emulando un móvil.
- A 1280 × 720 las acciones del hero quedan justo en el borde inferior de la ventana: el título ocupa cuatro líneas, como en la maqueta. Con la escena de L4 a la derecha el reparto cambia.
- El hero y el cierre no llevan ilustración hasta L4.
