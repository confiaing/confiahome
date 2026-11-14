# Estructura de ficheros

Dónde va cada cosa. La mayoría de carpetas ya existe (con `.gitkeep`); el resto, y todos los archivos de configuración y código, se crean en la Fase 4.

```text
confia.ing-home/
├── README.md                     Documento vivo del proyecto
├── CLAUDE.md                     Guía de trabajo para agentes (Fase 4)
├── BACKLOG.md                    Backlog inicial (Fase 3)
├── PRD-confia-ing-home-details.md
├── .env.example                  Variables documentadas; .env real ignorado por git
├── package.json · tsconfig.json · next.config.ts
├── open-next.config.ts · wrangler.jsonc      Despliegue en Cloudflare Workers
├── vitest.config.ts · playwright.config.ts · eslint.config.mjs
│
├── docs/
│   ├── architecture/             C4, componentes, esta página
│   │   └── adr/                  Una decisión por archivo, numeradas
│   ├── brand/                    Guía de marca digital, fuentes del logo
│   ├── design/                   Propuestas visuales, diseño finalista y logo (no se editan)
│   └── legal/                    Borradores de privacidad y términos para revisión
│
├── openspec/                     Desarrollo guiado por especificaciones
│   ├── config.yaml               Contexto y reglas del proyecto
│   ├── specs/                    Verdad actual: una carpeta por capacidad
│   └── changes/                  Propuestas en curso; se archivan al terminar
│
├── supabase/
│   └── migrations/               SQL versionado: tablas, restricciones, RLS
│
├── worker/                       Código propio del Worker fuera de Next.js
│   └── scheduled.ts              Latido diario hacia Supabase
│
├── public/
│   └── brand/                    Logo, favicon, imagen para redes (generados: npm run brand:build)
│
├── src/
│   ├── app/                      Rutas de Next.js. Solo composición, sin lógica
│   │   ├── route.ts              "/" → redirige a /es o /en
│   │   ├── robots.ts · sitemap.ts
│   │   ├── global-not-found.tsx  Única página 404: bilingüe y completa en el HTML
│   │   ├── [locale]/
│   │   │   ├── layout.tsx        ÚNICO layout raíz: <html lang>, enlace de salto, cabecera y pie
│   │   │   ├── page.tsx          Home
│   │   │   └── [legal]/          /es/privacidad · /en/privacy · /es/terminos · /en/terms
│   │   │                         (pares válidos generados desde src/i18n/; el resto, 404)
│   │   └── api/
│   │       ├── locale/route.ts   GET: guarda el idioma elegido y lleva a la página equivalente
│   │       ├── contact/route.ts  POST: consulta
│   │       └── events/route.ts   POST: evento analítico
│   │
│   ├── components/
│   │   ├── sections/             Header, Hero, Dónde empezamos, Pilares,
│   │   │                         Credibilidad, Cierre, Pie
│   │   ├── journey/              Recorrido de 5 etapas; scene/ con el canvas 3D y el SVG ligero
│   │   ├── contact/              Formulario en modo terminal y modo clásico
│   │   ├── scheduling/           Calendly a petición
│   │   └── ui/                   Botón, enlace, campo, casilla, tarjeta, aviso, logo,
│   │                             selector de idioma, enlace de agenda, menú plegable
│   │
│   ├── domain/                   TypeScript puro. No importa Next, Supabase ni Cloudflare
│   │   ├── contact/              Esquema, caso de uso, puertos
│   │   ├── analytics/            Lista de eventos, normalización, puertos
│   │   └── scene/                Modelo del camino y reglas de modo completo/ligero
│   │
│   ├── adapters/                 Único lugar que toca servicios externos
│   │   ├── supabase/ · email/ · turnstile/ · ratelimit/
│   │   └── memory/               Implementaciones en memoria para pruebas y local
│   │
│   ├── i18n/
│   │   ├── dictionaries/         es.ts, en.ts con un tipo común
│   │   └── …                     Negociación de idioma, rutas localizadas
│   │
│   ├── lib/                      Utilidades seguras para el cliente
│   │   └── server/               Variables secretas, cabeceras y composición de dependencias
│   └── styles/
│       ├── tokens.css            ÚNICA fuente de color, tipografía y espaciado
│       ├── fonts.ts              Declaración de las tipografías (next/font/local)
│       ├── fonts/                Archivos .woff2 y licencias SIL OFL
│       └── globals.css
│
└── tests/
    ├── unit/                     Lógica pura
    ├── integration/              Handlers y componentes (nivel principal)
    ├── contract/                 Adaptadores contra Supabase local
    ├── fixtures/                 Archivos que deben fallar lint o tipado
    └── e2e/                      Playwright: flujos A y B
```

## Reglas de dependencia

| Carpeta | Puede importar |
|---|---|
| `app/` | `components`, `lib`, `lib/server`, `domain`, `i18n` |
| `components/` | `domain`, `i18n`, `lib` (nunca `lib/server` ni `adapters`) |
| `lib/server/`, `worker/` | `adapters`, `domain`, `i18n`, `lib` |
| `adapters/` | `domain` |
| `i18n/`, `lib/` | nada del proyecto |
| `domain/` | solo `zod` y el propio `domain` |

- `lib/server/` conecta adaptadores con casos de uso; los Route Handlers piden ahí sus dependencias.
- Ningún color literal bajo `src/` fuera de `styles/tokens.css`.
