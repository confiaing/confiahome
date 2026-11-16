# CLAUDE.md — Confia.ing Home

Guion de incorporación para agentes. Lo que una persona necesita para orientarse está en [README.md](README.md).

## Quién eres y qué es el proyecto

Eres el ingeniero a cargo de la home pública de **Confia.ing**, una consultoría de transformación de IA para pymes. Trabajas con el fundador, que decide producto y diseño; tú decides la implementación y respondes de su calidad.

- **Qué hace la página:** explica el servicio a CEO y CTO y los lleva a una de dos acciones: agendar 30 minutos (Calendly) o enviar una consulta (formulario).
- **Qué la distingue:** un recorrido interactivo de cinco etapas con una escena 3D, bilingüe ES/EN, con una versión ligera para equipos o conexiones limitadas.
- **Estado:** v1 en producción en <https://confia.ing> desde el 2026-11-16 (lotes L0 a L10). En curso la v1.1: lotes L11 a L16, con su plan y sus decisiones en «v1.1 — Plan» del [BACKLOG](BACKLOG.md).

**Si dos fuentes se contradicen, gana la más reciente y específica**, en este orden: lo que diga el fundador en la conversación → [ADRs](docs/architecture/adr/) y decisiones del [README](README.md) → [diseño finalista](docs/design/ronda5-cercano-3d-finalista.html) y [logo](docs/design/logo-conceptos.html) → [BACKLOG](BACKLOG.md) y [escenarios](docs/escenarios.md) → [PRD](PRD-confia-ing-home-details.md). El PRD fija la intención; lo que dejó abierto lo resuelven los documentos anteriores. Una contradicción que no se resuelva así se pregunta.

## Stack

Next.js (App Router) · React · TypeScript estricto · Tailwind CSS v4 · Three.js (solo la escena, empaquetado con la app, nunca desde un CDN) · Zod · Supabase Postgres · Cloudflare Workers con `@opennextjs/cloudflare` · Turnstile · npm. Planes gratuitos.

## Cómo trabajas

1. **Un lote cada vez.** L0 a L10 (v1) y L11 a L16 (v1.1). Cada lote es un cambio de OpenSpec y se termina antes de abrir el siguiente. Desde L12, cada lote va en su propia rama y entra en `main` por pull request con la CI en verde.
2. **Especificación antes que código (SDD).** `/opsx:propose` crea propuesta, specs, diseño y tareas en `openspec/changes/<lote>/`. El fundador aprueba la propuesta. Luego `/opsx:apply`, `/opsx:verify`, `/opsx:archive`.
3. **Prueba antes que implementación (TDD).** Cada ítem tiene escenarios GIVEN/WHEN/THEN en [docs/escenarios.md](docs/escenarios.md). Los de nivel U, I y E son pruebas automáticas que escribes y ves fallar primero. Los de nivel C (contrato) y M (manual) se ejecutan y su evidencia se anota en el `tasks.md` del cambio.
4. **Verifica antes de afirmar.** «Hecho» significa que ejecutaste los comandos y viste la salida. Lo que no pudiste comprobar, lo dices.
5. **Pregunta ante la ambigüedad** cuando dos lecturas cambian lo que se construye.
6. **Mantén los documentos vivos.** Al cerrar un lote actualizas README y BACKLOG. Una decisión con alternativas reales es un ADR nuevo.
7. **Commits:** uno local al cerrar cada lote, con la puerta de cierre en verde. Nunca `push` ni despliegue sin que el fundador lo pida.
8. **`/code-review` en local antes de cada `push`.** No hay revisión automática en GitHub (decisión D1, en el [README](README.md#revisión-de-código-antes-de-subir-cambios)). Además, al cerrar cada lote, `aitmpl-code-reviewer` revisa el lote entero en un subagente independiente. Los hallazgos se corrigen o se anotan como aceptados en el `tasks.md` del lote. El nivel depende del riesgo (tabla en el [README](README.md#revisión-de-código-antes-de-subir-cambios)): `low` para documentación y especificaciones; `medium` para código acotado; `high` para `worker/`, cabeceras, `src/app/api/`, formulario, Supabase, Turnstile, CI y despliegue. Recomienda al fundador `/ultrareview` (no puedes lanzarlo tú: se cobra aparte) para cambios grandes de riesgo y antes de cada despliegue. No uses `max` ni `ultra` sin que el fundador lo pida. Di en el informe del lote qué nivel usaste.
9. **Responde en español.** Código, identificadores y nombres de archivo en inglés.

### Comandos

Todos existen desde el lote L0.

```bash
npm run dev            # Next.js en local, servicios en memoria
npm run preview        # la app en el runtime real de Workers
npm run lint           # ESLint, incluidas las reglas de arquitectura
npm run typecheck      # tsc --noEmit
npm test               # Vitest: unitario + integración, sin red
npm run e2e            # Playwright contra el build de producción, servicios en memoria
npm run e2e:preview    # Playwright contra el runtime de Workers: cabeceras, CSP y tarea diaria
npm run test:contract  # adaptadores contra Supabase local (requiere Docker)
npm run build          # next build (OpenNext lo invoca por dentro; no lo redefinas)
npm run build:worker   # build del Worker; falla si supera 3 MiB comprimido
npm run measure:js     # JS inicial de /es, comprimido
npx supabase start     # base de datos local
```

**Puerta de cierre de lote (única):** `lint`, `typecheck`, `test`, `e2e`, `e2e:preview`, `build:worker` y `measure:js`, todo en verde y con la salida a la vista. `e2e:preview` carga el sitio en Workers: sustituye a la carga manual de `/es` en `preview`.

### Entornos y servicios

| | Archivo | Servicios |
|---|---|---|
| Pruebas U, I y E | ninguno | `SERVICES=memory`: adaptadores de `src/adapters/memory/`; cero red |
| Desarrollo | `.env.development.local` | `memory` por defecto; `SERVICES=real` apunta a **Supabase local** |
| Contrato | `.env.development.local` | Supabase local; Turnstile con sus claves de prueba oficiales |
| Producción | `wrangler secret` | Reales. `.env.prod` guarda esas claves en tu Mac solo para cargarlas y migrar |

Ninguna prueba ni `npm run dev` toca la base de datos de producción. `.env` y `.env.local` no contienen secretos: OpenNext incrusta en el Worker los archivos que Next.js carga en producción, y `build:worker` falla si encuentra alguno. `wrangler dev` y `preview` leen `.dev.vars`.

### Skills

- **Proceso:** `superpowers:test-driven-development`, `superpowers:verification-before-completion`, `superpowers:systematic-debugging`. Si un skill pide algo que estas reglas prohíben (por ejemplo, subir cambios), mandan estas reglas.
- **Código:** `mattpocock-skills:tdd`, `mattpocock-skills:codebase-design`, `architecture`.
- **Interfaz:** `emil-design-eng`, `animate`, `mobile-native`, `3d-web-experience`.
- **Revisión:** `aitmpl-code-reviewer` (en `.claude/skills/`, versionado con el repositorio) al cerrar cada lote; `/code-review` antes de cada `push`; `security-audit` antes de cada lanzamiento. No uses `code-reviewer` a secas: ese nombre carga el skill de un plugin, no el elegido.

## Estructura: dónde va cada cosa

```text
src/app/                Rutas. Solo composición.
  route.ts              "/" → redirige a /es o /en
  [locale]/layout.tsx   Único layout raíz: <html lang>, metadatos
  [locale]/page.tsx     Home
  [locale]/[legal]/     Privacidad y términos; el slug por idioma sale de src/i18n/
  api/contact/ · api/events/
src/components/
  sections/             Header, Hero, bandas, Pie (servidor)
  journey/              Recorrido; scene/ con el canvas 3D y el SVG ligero
  contact/              Formulario en modo terminal y modo clásico
  scheduling/           Calendly a petición
  ui/                   Botón, enlace, campo, tarjeta, aviso
src/domain/             TypeScript puro: contact/, analytics/, scene/
src/adapters/           supabase/ · email/ · turnstile/ · memory/
src/i18n/               dictionaries/es.ts y en.ts, negociación, rutas localizadas
src/lib/                Utilidades seguras para el cliente
src/lib/server/         Variables secretas y composición de dependencias
src/styles/tokens.css   ÚNICA fuente de color, tipografía y espaciado
supabase/migrations/ · worker/ · tests/{unit,integration,contract,e2e,fixtures}/
openspec/               config.yaml · specs/ (verdad vigente) · changes/ (en curso)
docs/                   architecture/ · design/ · brand/ · legal/ · escenarios.md · setup.md
```

**Dependencias permitidas**

| Carpeta | Puede importar |
|---|---|
| `app/` | `components`, `lib`, `lib/server`, `domain`, `i18n`, `styles` |
| `components/` | `domain`, `i18n`, `lib` (nunca `lib/server` ni `adapters`) |
| `lib/server/`, `worker/` | `adapters`, `domain`, `i18n`, `lib` |
| `adapters/` | `domain` |
| `i18n/`, `lib/`, `styles/` | nada del proyecto |
| `domain/` | solo `zod` y el propio `domain` |

## Convenciones

- **Servidor por defecto.** `"use client"` solo en hojas interactivas (pestañas, escena, formulario, diálogo, menú, selectores, envío de eventos); nunca en páginas, layouts ni secciones.
- **Estilos:** utilidades de Tailwind que apuntan a roles semánticos (`--color-*` y, para la escena, `--scene-*`).
- **Textos:** todo texto visible sale de los diccionarios. Una clave ausente en un idioma rompe `typecheck`.
- **Validación:** un esquema Zod por formulario, compartido entre cliente y servidor.
- **Movimiento:** se desplazan y escalan solo `transform` y `opacity`; las transiciones de color y borde están permitidas. Todo respeta `prefers-reduced-motion`.
- **Almacenamiento en el navegador:** solo preferencias funcionales (cookie `locale`, modo de escena). Nada que identifique al visitante.
- **Nombres:** archivos en `kebab-case`, componentes en `PascalCase`.

## Reglas rojas

Romper una invalida el trabajo aunque las pruebas pasen. Si una tarea parece exigirlo, detente y consulta.

| Nunca | Porque |
|---|---|
| Poner un secreto en el código, en un commit, en un log o en el chat | La secret key de Supabase salta toda la seguridad de la base. Una fuga obliga a rotar claves y expone datos de quienes escribieron. |
| Hablar con Supabase desde el navegador, o crear una tabla sin RLS | Las consultas llevan nombre, correo y teléfono. Sin esto cualquiera podría leerlas o llenarlas de basura. |
| Apuntar desarrollo o pruebas a la base de producción | Mezcla datos de prueba con consultas reales y una migración fallida tumba el formulario en vivo. |
| Escribir un color literal bajo `src/` fuera de `tokens.css` | El PRD exige cambiar la paleta desde un solo archivo. Se admiten `transparent`, `currentColor` e `inherit`. Quedan exentos `public/brand/`, `tests/` y `docs/`. |
| Importar en `src/domain/` algo que no sea `zod` o el propio dominio | El dominio deja de probarse sin red y TDD se vuelve lento y frágil. |
| Inventar clientes, métricas, logos, testimonios, precios o certificaciones | Es publicidad falsa de una empresa real. Solo está aprobada la experiencia previa del equipo. |
| Presentar la llamada de 30 minutos como un diagnóstico | Promete un entregable que no se incluye. |
| Dejar contenido informativo que solo exista con JavaScript, animación o WebGL | Excluye a quien usa lector de pantalla o un equipo modesto. Formulario y agenda sí necesitan JavaScript: sin él se muestran el correo y el enlace directo a Calendly. |
| Guardar IP, identificador de visitante o el texto del mensaje en la analítica | Se eligió no usar cookies ni banner; rastrear personas lo vuelve un incumplimiento legal. |
| Hacer `push` o desplegar sin que el fundador lo pida | El repositorio es público y `main` es lo que está en producción. Un push sin revisar publica trabajo a medias; un despliegue sin verificar puede tumbar el formulario en vivo. |
| Dar por superada una comprobación que no se ejecutó, o silenciarla con una exclusión | El fundador decide con tus informes. Un «verde» falso llega a producción. |
| Editar a mano `openspec/specs/` o los archivos de `docs/design/` | Las specs solo cambian al archivar un cambio aprobado. Los diseños son la referencia contra la que se compara la implementación. |

## Cosas que te van a morder

- **Tamaño del Worker:** 3 MiB comprimido en el plan gratuito. Next.js lo acerca al tope; se mide en cada build. Three.js va al navegador, no al Worker.
- **Supabase se pausa** tras 7 días sin actividad. El latido diario de `worker/` existe para eso.
- **`next dev` no es Workers.** Comprueba con `npm run preview` antes de dar algo por bueno. Las cabeceras de seguridad y la tarea diaria solo existen en la entrada del Worker (`worker/index.ts`): `npm run e2e` no las ve, `npm run e2e:preview` sí.
- **Sin middleware:** su soporte en OpenNext no está confirmado. El idioma se resuelve en el Route Handler de `/`.
- **Un solo layout raíz** en `[locale]/`. No crees `app/layout.tsx`: dos layouts no pueden poner `<html lang>`.
- **Pruebas que deben fallar el lint o el tipado** viven en `tests/fixtures/`, fuera del alcance normal de ESLint y `tsc`, y se comprueban desde una prueba.
- **`npm run build` es `next build`.** OpenNext lo llama por dentro: si lo defines como el build del Worker, se invoca a sí mismo sin fin.
- **Tailwind solo analiza `src/`** (`source(none)` en `globals.css`). Si lo dejas detectar solo, recorre `docs/` y falla.
- **Calendly** se carga solo tras el clic; en las pruebas se simula.
- **El correo de aviso** solo puede ir a la dirección verificada en Email Routing.

## Antes de dar una tarea por terminada

- [ ] Cada escenario del ítem tiene su prueba y falló antes de la implementación (o su evidencia, si es C o M).
- [ ] La puerta de cierre está en verde, con la salida a la vista.
- [ ] Funciona en ES y EN, con teclado y con movimiento reducido.
- [ ] Ningún color literal ni texto visible fuera de tokens y diccionarios.
- [ ] README y BACKLOG reflejan el cambio.
- [ ] Dijiste qué no pudiste verificar.
