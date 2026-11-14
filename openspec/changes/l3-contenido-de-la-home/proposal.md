# Proposal

Lote **L3 — Contenido de la home** de [BACKLOG.md](../../../BACKLOG.md). Historias: L3-1 a L3-8.

## Why

La home sigue mostrando «Sitio en construcción». Falta lo que el visitante viene a leer: qué hace Confia.ing, para quién y cómo empezar. Las anclas de la cabecera apuntan a secciones que todavía no existen.

## What Changes

- **Hero** con antetítulo, título, texto, dos acciones distinguibles (agendar y consultar), nota de conversación exploratoria y los tres pilares.
- **«Dónde empezamos»**, en banda salvia: cuatro fricciones y, en tarjeta mantequilla, cuatro preguntas.
- **«Cómo lo hacemos realidad»**, sobre crema: las cinco etapas como lista legible, cada una con qué hacemos, qué recibes y el paso siguiente. Es la base que el lote L4 convierte en recorrido interactivo.
- **«Lo que ofrecemos»**, en banda coral claro: «Transformación de IA» en tarjeta índigo dominante y los otros cuatro servicios subordinados, en el orden del PRD.
- **«Por qué confiar»**, sobre crema: las cuatro evidencias del equipo con su nota de atribución, los tres principios y el mensaje de seguridad.
- **Cierre**, en banda índigo claro: frase, las dos acciones y dos bloques de contacto: consulta (con `hola@confia.ing`) y agenda (enlace directo al calendario).
- **Textos en español e inglés** en los diccionarios; el inglés se redacta de forma natural y se entrega en un documento para tu revisión.
- **Guardas de contenido:** pruebas que impiden palabras de certificación, «diagnóstico» junto a la llamada de 30 minutos, cifras de impacto y textos sin traducir.
- Se retira la página provisional.

## Capabilities

### New Capabilities

- `home-page`: secciones de la home, su orden, jerarquía, acciones y ritmo visual.
- `content-claims`: límites de lo que el sitio puede afirmar, en ambos idiomas.

### Modified Capabilities

Ninguna.

## Fuera de alcance

- Recorrido interactivo, escena 3D y versión ligera (L4). El hero y el cierre no llevan ilustración hasta entonces.
- Formulario (L5) y calendario dentro de la página (L6): aquí, los bloques de contacto sin JavaScript.
- Eventos de analítica de las acciones (L7).
- SEO completo, datos estructurados e imagen para redes (L8).
- Nombres del equipo, clientes, casos, precios y plazos de respuesta: decididos como «no» en la Fase 1.

## ADR que aplican

- [ADR-0001](../../../docs/architecture/adr/0001-nextjs-sobre-cloudflare-workers.md): secciones de servidor; este lote no añade JavaScript de cliente.
- [ADR-0004](../../../docs/architecture/adr/0004-internacionalizacion.md): todo texto en diccionarios.
- [ADR-0007](../../../docs/architecture/adr/0007-tokens-de-diseno.md): temas por banda.
- [ADR-0009](../../../docs/architecture/adr/0009-escena-3d-y-version-ligera.md): el contenido de las etapas existe en el HTML antes que la escena.
- Sin ADR nuevo: no hay decisiones con alternativas de arquitectura.

## Impact

- **Código nuevo:** secciones en `src/components/sections/`, `Band` y utilidades de título en `src/components/ui/`, claves `home` en los diccionarios.
- **Código modificado:** `[locale]/page.tsx`; se eliminan `home-placeholder.tsx` y sus claves.
- **Pruebas:** las de L1 que usaban la página provisional pasan a usar el hero.
- **Presupuestos:** más HTML y CSS, mismo JavaScript. Se miden LCP, CLS y JS inicial.
- **Documento nuevo:** `docs/content/home.md`, con el texto ES y EN lado a lado para revisión.
- Sin dependencias nuevas.
