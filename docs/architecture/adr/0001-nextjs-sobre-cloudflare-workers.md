# ADR-0001: Next.js sobre Cloudflare Workers con OpenNext

**Estado:** Aceptada · **Fecha:** 2026-11-13 · **Decide:** fundador de Confia.ing

## Contexto

La home es bilingüe, debe rendir bien en móvil y conexiones lentas (PRD §10), tiene dos piezas interactivas (recorrido y formulario) y necesita código de servidor mínimo para guardar consultas sin exponer secretos. Debe desplegarse en Cloudflare gratis.

## Decisión

Next.js (App Router) desplegado en Cloudflare Workers mediante `@opennextjs/cloudflare`.

## Opciones consideradas

| Dimensión | A. Astro + Worker | B. Next.js + OpenNext (elegida) | C. Astro estático |
|---|---|---|---|
| Complejidad | Baja | Alta: capa de adaptación entre Next.js y Workers | Muy baja |
| JS enviado al navegador | Mínimo | Mayor: runtime de React en todas las páginas | Mínimo |
| Seguridad del formulario | Buena | Buena | Débil |
| Crecimiento a portal de cliente | Requiere ampliar | Preparado | Requiere rehacer |
| Ecosistema de UI y animación | Bueno | El más amplio | Bueno |

Claude recomendó A por rendimiento y simplicidad. El usuario eligió B.

## Consecuencias

- **Más fácil:** crecer hacia funciones de aplicación (cuentas, portal); reutilizar el ecosistema React en diseño y animación.
- **Más difícil:** mantener el rendimiento móvil y no superar el tamaño máximo del Worker en el plan gratuito; depurar diferencias entre `next dev` y el runtime de Workers.
- **Mitigaciones obligatorias:**
  - Páginas pre-generadas (`generateStaticParams`) y Server Components por defecto; `"use client"` solo en hojas interactivas (pestañas, escena, formulario, diálogo, menú, selectores, envío de eventos); nunca en páginas, layouts ni secciones.
  - Presupuesto de rendimiento verificado en E2E: LCP < 2,5 s en móvil simulado y JS inicial acotado.
  - Tamaño del Worker medido en cada build.
  - Prueba con `opennextjs-cloudflare preview` antes de cada despliegue.
  - No se usa middleware/`proxy.ts`: su soporte en OpenNext no está confirmado; la detección de idioma vive en un Route Handler ([ADR-0004](0004-internacionalizacion.md)).
- **A revisar:** si el tamaño del Worker o el rendimiento no caben en el plan gratuito, volver a la opción A reutilizando dominio, adaptadores y componentes React.
