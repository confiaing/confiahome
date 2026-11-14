# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, la spec y el escenario que cubre.

## 1. Tokens de diseño (L1-1)

- [x] 1.1 Escribir `tests/support/tokens.ts` (lee `tokens.css` y devuelve primitivos, roles y temas) y la prueba unitaria en rojo: los primitivos son los 15 de la paleta y no hay otro valor de color (design-tokens: Los primitivos son los quince). Verificación: `npm test` falla porque `tokens.css` no existe.
- [x] 1.2 Crear `src/styles/tokens.css` con los 15 primitivos e importarlo desde `globals.css`. Verificación: `npm test` en verde.
- [x] 1.3 Prueba en rojo: la paleta de Tailwind está anulada, cada rol `--color-*` y `--scene-*` resuelve a un primitivo y existen `--font-display`, `--font-body` y `--font-mono` con respaldo (design-tokens: Paleta de Tailwind desactivada, Cada rol apunta a un primitivo; typography: Variables tipográficas). Verificación: `npm test` falla.
- [x] 1.4 Añadir el bloque `@theme static`, los roles de escena, radios y medidas. Verificación: `npm test` en verde.
- [x] 1.5 Prueba en rojo: cada tema tiene el fondo acordado y define todos los roles `--color-*` (design-tokens: Cada tema tiene el fondo acordado, Todos los temas definen todos los roles). Verificación: `npm test` falla.
- [x] 1.6 Añadir `.theme-light`, `.theme-dark`, `.theme-fresh`, `.theme-coral`, `.theme-warm` y `.theme-calm` con los valores del finalista. Verificación: `npm test` y `npm run build` en verde.

## 2. Contraste (L1-2)

- [x] 2.1 Prueba unitaria en rojo de `tests/support/contrast.ts`: negro sobre blanco da 21:1, blanco sobre coral 500 no cumple y el informe nombra tema, roles y contraste (design-tokens: Una pareja que no cumple). Verificación: `npm test` falla.
- [x] 2.2 Implementar luminancia, razón de contraste y el verificador. Verificación: `npm test` en verde.
- [x] 2.3 Escribir `tests/support/contrast-pairs.ts` con las parejas permitidas de los seis temas y la prueba que las evalúa y comprueba la cobertura mínima por tema (design-tokens: Todas las parejas permitidas cumplen, La lista cubre todos los temas). Verificación: `npm test` en verde. **Si una pareja del finalista no cumple, detener y consultar al fundador; no cambiar la paleta.**
- [x] 2.4 Anotar en este archivo la tabla de contrastes obtenida por tema. Verificación: tabla presente en «Evidencia».

## 3. Tipografías (L1-3)

- [x] 3.1 Instalar los paquetes de Fontsource como dependencias de desarrollo y copiar a `src/styles/fonts/` los `.woff2` (subconjunto `latin`) y las tres licencias OFL; eliminar `public/fonts/`. Prueba unitaria: hay una licencia por familia (typography: Licencia junto a cada familia). Verificación: `npm test` en verde; pesos de los archivos anotados aquí.
- [x] 3.2 E2E en rojo: ninguna petición a `fonts.googleapis.com` ni `fonts.gstatic.com`, fuentes desde el propio origen, familia calculada de título, párrafo y etiqueta, y `document.fonts.check` con «Capacitación · Diagnóstico · ¿Dónde?» (typography: Ninguna petición a terceros, Cada papel tiene su familia, Acentos y signos). Verificación: `npm run e2e` falla.
- [x] 3.3 Implementar `src/styles/fonts.ts` con `next/font/local`, aplicar las variables en `layout.tsx` y los estilos base de `body` y títulos en `globals.css`; dar al marcador de L0 un título, un párrafo y una etiqueta con cada familia. Verificación: `npm run e2e` en verde.
- [x] 3.4 E2E en rojo y ajuste: como máximo dos precargas de fuente y CLS < 0,1 con la red limitada (typography: Solo se precargan las del primer pantallazo, Desplazamiento acumulado). Verificación: `npm run e2e` en verde; CLS anotado aquí.
- [x] 3.5 Escribir el ADR-0011 (archivos de fuentes y de marca en el repositorio) y enlazarlo en `docs/architecture/README.md`. Verificación: el ADR existe y el enlace abre.

## 4. Componentes base (L1-5)

- [x] 4.1 Prueba unitaria en rojo e implementación de `src/lib/cx.ts`. Verificación: `npm test` en verde.
- [x] 4.2 Pruebas de integración en rojo de `Button` y `ButtonLink`: variantes, activación con Enter y Espacio, deshabilitado que no dispara, enlace con `href`, clase de foco visible, axe (ui-components: Botón con variantes y estados). Verificación: `npm test` falla.
- [x] 4.3 Implementar `button.tsx` y el anillo de foco global en `globals.css`. Verificación: `npm test` y `npm run lint` en verde.
- [x] 4.4 Pruebas en rojo e implementación de `TextLink`: subrayado, enlace externo con `rel` y aviso oculto (ui-components: Enlace de texto). Verificación: `npm test` en verde.
- [x] 4.5 Pruebas en rojo de `Field`: etiqueta asociada, ayuda en la descripción, error con `aria-invalid` y `aria-describedby`, sin error, obligatorio, variante de texto largo, axe (ui-components: Campo de formulario). Verificación: `npm test` falla.
- [x] 4.6 Implementar `field.tsx`. Verificación: `npm test` en verde.
- [x] 4.7 Pruebas en rojo e implementación de `Checkbox`: se marca con Espacio, etiqueta con enlace, error asociado, axe (ui-components: Casilla). Verificación: `npm test` en verde.
- [x] 4.8 Pruebas en rojo e implementación de `Card` y `Notice`: tema propio, `role="alert"` y `role="status"`, icono oculto, axe (ui-components: Tarjeta, Aviso). Verificación: `npm test` en verde.
- [x] 4.9 Prueba de integración: un botón primario dentro de `.theme-dark` toma su fondo de `--color-primary` y los textos de cada componente son los recibidos en ES y EN (design-tokens: Un cambio de rol se refleja; ui-components: Textos en ambos idiomas). Verificación: `npm test` en verde.

## 5. Logo y archivos de marca (L1-4, L1-8)

- [x] 5.1 Pruebas de integración en rojo de `Logo`: cinco tramos y punto, nombre con «IA» resaltada, variante de símbolo, un solo nombre accesible, colores por rol, axe dentro de un enlace (brand-identity: Logo con el concepto elegido, Nombre accesible, El logo sigue el tema). Verificación: `npm test` falla.
- [x] 5.2 Implementar `src/lib/brand-geometry.ts` y `src/components/ui/logo.tsx`. Verificación: `npm test` y `npm run lint` en verde.
- [x] 5.3 Prueba unitaria en rojo: `public/brand/` contiene los nueve archivos, los SVG no tienen `<text>` ni referencias externas y sus colores son de la paleta (brand-identity: Archivos presentes, Archivos autónomos). Verificación: `npm test` falla.
- [x] 5.4 Instalar `fontkit` y `sharp` como dependencias de desarrollo e implementar `scripts/build-brand-assets.ts` y el script `brand:build`; generar los archivos y `public/favicon.ico`. Verificación: `npm test` en verde.
- [x] 5.5 Prueba unitaria: regenerar los SVG en una carpeta temporal da un resultado idéntico al guardado (brand-identity: Los archivos se regeneran sin diferencias). Verificación: `npm test` en verde.
- [x] 5.6 Comparar a la vista el nombre trazado de `logo.svg` con el componente renderizado, a 24 px y a 96 px. Verificación: capturas guardadas en `docs/brand/img/` y resultado anotado aquí. **Si difieren, aplicar la alternativa de design.md D4 y anotarlo.**
- [x] 5.7 E2E en rojo e implementación: iconos declarados en `metadata.icons`, icono SVG, icono Apple y `/favicon.ico` responden 200 en `/es` y `/en` (brand-identity: Icono declarado y disponible). Verificación: `npm run e2e` en verde.

## 6. Página provisional y comprobaciones en navegador (design.md D6)

- [x] 6.1 Actualizar la prueba de integración del marcador de L0 y luego `home-placeholder.tsx`: logo, título, nota, `ButtonLink` y etiqueta, en ES y EN, sin infracciones de axe. Verificación: `npm test` en verde.
- [x] 6.2 E2E en rojo y ajuste: el botón muestra anillo de foco al tabular y, con movimiento reducido, no se desplaza al pulsarlo (ui-components: Foco visible por teclado, Movimiento reducido). Verificación: `npm run e2e` en verde en Chromium y WebKit móvil.
- [x] 6.3 Revisar el favicon a 16 px sobre fondo claro y oscuro (brand-identity: Legible a 16 px, nivel M). Verificación: captura en `docs/brand/img/` y resultado anotado aquí.

## 7. Guía de marca (L1-6)

- [x] 7.1 Prueba unitaria en rojo: la tabla de paleta de `docs/brand/README.md` coincide en nombres y HEX con `tokens.css` (brand-identity: La guía coincide con los tokens). Verificación: `npm test` pasa con la ficha actual o señala la diferencia.
- [x] 7.2 Completar `docs/brand/README.md`: RGB junto a HEX, tabla de contrastes, tipografías con licencia y archivos, versiones del logo con usos permitidos y zona de respeto, y capturas de la página provisional en móvil (390 px) y escritorio (1440 px). Verificación: revisión contra el escenario L1-6 (nivel M), anotada aquí.

## 8. Cierre del lote

- [x] 8.1 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 8.2 Puerta de cierre: `npm run lint`, `typecheck`, `test`, `e2e`, `build:worker`, `measure:js` y carga de `/es` en `preview`. Verificación: todo en verde; cifras de JS inicial y tamaño del Worker anotadas aquí (ui-components: Sin JavaScript añadido).
- [x] 8.3 Actualizar README (fase y tabla de documentos), BACKLOG (L1 hecho) y `docs/architecture/estructura.md`. Verificación: enlaces comprobados.
- [x] 8.4 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Todo ejecutado el 2026-11-14.

**Puerta de cierre (8.2)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npm run typecheck` | 0 errores |
| `npm test` | 165 pruebas en 20 archivos, en verde |
| `npm run e2e` | 28 en verde, 2 omitidas (CLS y `:active`, solo Chromium) |
| `npm run build:worker` | 849,3 KiB de 3072 KiB (margen 72,4 %); sin secretos incrustados |
| `npm run measure:js` | 134,8 kB de 200 kB (67 %): igual que en L0, el lote no añade JS |
| `preview` (runtime de Workers) | `/es` y `/en` 200 con `lang` correcto; iconos, `/favicon.ico`, `logo.svg` y las dos fuentes precargadas responden 200 |

**Contraste (2.3, 2.4).** La primera ejecución falló en una pareja: tema oscuro, borde de control (índigo 300) sobre superficie (índigo 700), 2,80:1. Se detuvo y se consultó; el fundador eligió índigo 100 (8,1:1). Tabla final en `docs/brand/README.md`, sección «Contraste por tema». La pareja más ajustada es el borde de control en tema base: 3,96:1 (mínimo 3).

**Tipografías (3.1, 3.4).** Fraunces normal 67,3 kB, Fraunces cursiva 81,5 kB, Figtree 20,2 kB, DM Mono 14,8 y 15,0 kB. Dos precargas (Fraunces normal y Figtree). CLS en móvil simulado (Pixel 7, CPU ×4, 1,6 Mbps, 150 ms): 0,0053.

**Paleta de Tailwind anulada (1.3).** Además de la prueba, la revisión compiló clases de sonda: `bg-red-500`, `bg-white`, `text-black` y `bg-indigo-900` no generan estilos.

**Logo en archivo frente a logo en vivo (5.6).** `docs/brand/img/logo-live-vs-file.png`, a 24 y 96 px, en claro y oscuro: coinciden. No hizo falta la alternativa de D4.

**Favicon a 16 px (6.3, nivel M).** `docs/brand/img/favicon-sizes.png`: arco y punto se distinguen sobre claro y sobre oscuro.

**Guía de marca (7.2, nivel M).** Revisada contra el escenario L1-6: paleta con HEX, RGB y roles; contraste por tema; tipografías con archivo y licencia; versiones y usos del logo; capturas en 390 y 1440 px.

**Revisión de código (8.1).** Subagente independiente con `code-reviewer`. Sin hallazgos críticos; 10 importantes y 26 menores.

- Corregidos: temas fuera de capa (1); sin prueba de temas en navegador (2); `id` y `aria-describedby` externos en `Field` y `Checkbox` (4); estilos `aria-disabled` sin comportamiento, retirados (5); punto del nombre distinto del concepto (7); roles de escena incompletos por tema (9); `--color-background-alt` (10); pruebas débiles de variables tipográficas, licencias, colores de las versiones oscuras, foco en WebKit y CLS en móvil (14, 16, 19, 20); `TextLink` con tipo que exige el aviso (21); casilla a 24 px (23); enlaces subrayados por defecto (30); `globals.css` sin colores (31); colores de los archivos desde los roles (35).
- Documentados como limitación o decisión en `design.md`: 3, 6, 11, 12, 13, 22, 24, 25, 26, 28, 29.
- Pendiente de decisión del fundador: añadir `styles/` a la tabla de dependencias de CLAUDE.md (34).

**Desviaciones de TDD**

- La prueba de la guía (7.1) y las de fuentes (3.1) pasaron a la primera: la ficha ya coincidía con la paleta y los archivos ya estaban copiados.
- La prueba E2E de temas en navegador se escribió después de corregir la capa de los temas; no se vio en rojo.
- La tarea 4.9 («textos en ES y EN») se cubre en la página provisional; los componentes no contienen texto propio.

**No verificado**

- El anuncio real de `Notice` con un lector de pantalla.
- El contraste de la marca de la casilla nativa en cada navegador.
- Los iconos en un iPhone real (solo en WebKit simulado).

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
