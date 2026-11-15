# Proposal

Lote **L6 — Agenda (Flujo A)** de [BACKLOG.md](../../../BACKLOG.md). Historias: L6-1 a L6-4.

## Why

«Agenda 30 minutos» es la acción principal de la página y hoy saca al visitante a otra pestaña. El PRD pide un calendario integrado: reservar sin salir de la home, con una salida clara si el calendario no carga y una confirmación que diga qué ocurrirá en la conversación.

## What Changes

- **Calendario dentro del bloque «Agenda»** del cierre. Al pulsar cualquier acción de agenda (cabecera, hero, cierre), la página lleva al bloque, mueve el foco a su título y carga allí el calendario de Calendly.
- **Nada de Calendly antes del clic:** ni script, ni marco, ni conexión previa. Antes de cargarlo se avisa de que el calendario es de Calendly.
- **Alternativa si no carga:** pasado un tiempo de espera, un mensaje con el enlace directo a Calendly y un acceso al formulario de consulta.
- **Confirmación con próximos pasos** cuando Calendly comunica la reserva: qué pasará en la conversación, sin presentarla como diagnóstico ni prometer plazos.
- **Sin JavaScript** las acciones siguen siendo el enlace directo a Calendly, como hoy.
- **Accesible:** estados anunciados, foco gestionado, marco con título, movimiento reducido.

## Dos puntos que cambian lo escrito en el backlog

1. **Bloque, no diálogo.** L6-4 habla de un diálogo; el diseño finalista carga el calendario dentro de la tarjeta «Agenda» y todas las acciones llevan a ella. Manda el diseño (CLAUDE.md). L6-4 pasa a ser «accesibilidad del bloque»: no hay foco atrapado ni Escape porque no hay nada que cerrar.
2. **Idioma del calendario.** Calendly fija el idioma en el evento y el plan admite uno solo. Hoy ese evento está en inglés (comprobado). El calendario es uno; cuando su idioma no coincide con el de la página, una línea lo avisa. L6-1 deja de exigir «en el idioma activo».

## Capabilities

### New Capabilities

- `scheduling`: reserva de la conversación de 30 minutos desde la home: carga a petición, alternativa, confirmación y accesibilidad.

### Modified Capabilities

Ninguna.

## Fuera de alcance

- Eventos de analítica «calendario abierto» y «reunión agendada» (L7); el componente deja el punto de enganche.
- Política de seguridad de contenido con los orígenes de Calendly (L9) y mención de Calendly en la política de privacidad (L8).
- Datos de la reserva: no se guarda nada en nuestra base.

## ADR que aplican

- [ADR-0004](../../../docs/architecture/adr/0004-internacionalizacion.md), [ADR-0008](../../../docs/architecture/adr/0008-estrategia-de-pruebas.md).
- **ADR nuevo, 0015:** la agenda se carga en su bloque con el widget oficial de Calendly, a petición.

## Impact

- **Código nuevo:** `src/components/scheduling/`, `src/lib/calendly.ts`.
- **Código modificado:** `closing.tsx`, `public-env.ts`, diccionarios, `.env.example`, `globals.css`.
- **Terceros:** `assets.calendly.com` y `calendly.com`, solo tras el clic. En las pruebas se simulan.
- Sin dependencias nuevas.
- **Del fundador:** revisar el texto de «próximos pasos» en ambos idiomas.
