# Tasks

Cada tarea de implementación va precedida por su prueba en rojo. Entre paréntesis, el requisito de la spec `scheduling` que cubre.

## 1. Protocolo y configuración (L6-1, L6-3)

- [x] 1.1 Pruebas unitarias en rojo de `src/lib/calendly.ts`: `calendlySignal` reconoce los cuatro mensajes solo desde `https://calendly.com` e ignora datos con otra forma; `embedUrl` rechaza lo que no sea `https://calendly.com/…` (Confirmación: Mensajes de otro origen; Idioma del calendario: Dirección no válida). Verificación: `npm test` falla por módulo inexistente.
- [x] 1.2 Implementar `src/lib/calendly.ts`. Verificación: `npm test` y `npm run lint` en verde.
- [x] 1.3 Pruebas en rojo e implementación de `NEXT_PUBLIC_CALENDLY_LOCALE` en `public-env.ts` (Idioma del calendario: configurable). Verificación: `npm test` y `typecheck` en verde.

## 2. Textos (L6-2, L6-3)

- [x] 2.1 Ampliar las comprobaciones de contenido para cubrir `agenda.*` (sin diagnóstico como entregable, cifras, plazos ni garantías) y verlas fallar con un texto de prueba (Confirmación: El texto no promete lo que no se incluye). Verificación: la prueba detecta el texto de prueba.
- [x] 2.2 Añadir a `es.ts` y `en.ts` las claves `agenda.*` de design.md D7 y regenerar `docs/content/home.md`. Verificación: `typecheck` y `npm test` en verde.

## 3. Carga del widget (L6-1, L6-2)

- [x] 3.1 Pruebas de integración en rojo de `calendly-loader.ts`: inserta el script una sola vez; resuelve con el API; rechaza si el script falla; reutiliza el script presente (El calendario se carga solo a petición; Alternativa). Verificación: `npm test` falla.
- [x] 3.2 Implementar `src/components/scheduling/calendly-loader.ts`. Verificación: `npm test` en verde.

## 4. Bloque de agenda (L6-1 a L6-4)

- [x] 4.1 Pruebas de integración en rojo de `AgendaPanel`, con el API de Calendly simulado y en ES y EN: en reposo no hay script ni marco y se nombra a Calendly; el botón carga el calendario; un clic en un `a[data-agenda]` externo lo carga, lleva el foco al título y no navega; con tecla modificadora no se intercepta; se carga una sola vez; marco con título (El calendario se carga solo a petición; Aviso del tercero; Accesibilidad). Verificación: `npm test` falla.
- [x] 4.2 Implementar `agenda-panel.tsx` hasta el estado `ready`. Verificación: esas pruebas en verde.
- [x] 4.3 Pruebas en rojo e implementación de la alternativa: plazo de 20 s con temporizadores simulados; fallo del script sin esperar; calendario que llega tarde; reintento; enlaces a Calendly y a `#consulta`; anunciado como alerta (Alternativa si el calendario no carga; Estados anunciados). Verificación: `npm test` en verde.
- [x] 4.4 Pruebas en rojo e implementación de la confirmación: `calendly.event_scheduled` desde Calendly la muestra con foco y `role="status"`; desde otro origen, no; eventos `confia:agenda-opened` y `confia:agenda-scheduled` emitidos una vez y sin datos (Confirmación con próximos pasos). Verificación: `npm test` en verde.
- [x] 4.5 Pruebas en rojo e implementación del aviso de idioma: visible cuando el idioma del calendario no coincide con el activo, ausente cuando coincide; una dirección no válida muestra la alternativa (Idioma del calendario). Verificación: `npm test` en verde; las pruebas existentes de cabecera, hero y cierre siguen en verde.
- [x] 4.6 Montar `AgendaPanel` en `closing.tsx`, añadir el CSS de `scripting: none` y axe en los cuatro estados. Verificación: `npm test`, `typecheck` y `lint` en verde.

## 5. El flujo en el navegador

- [x] 5.1 E2E en rojo y ajuste: al cargar y recorrer `/es` y `/en` no hay ninguna petición a Calendly; cada acción de agenda (cabecera, hero, cierre, botón del bloque) deja la página en la misma pestaña y carga el calendario servido por un `widget.js` simulado; foco en el título con teclado (El calendario se carga solo a petición; Accesibilidad: Foco al abrir). Verificación: `npm run e2e` en verde.
- [x] 5.2 E2E: Calendly bloqueado muestra la alternativa con sus dos enlaces; el mensaje de reserva muestra la confirmación en cada idioma; sin JavaScript las acciones son enlaces a Calendly y no hay botón; con movimiento reducido no hay desplazamiento animado (Alternativa; Confirmación; Agenda sin JavaScript; Movimiento reducido). Verificación: `npm run e2e` en verde.
- [x] 5.3 E2E: axe en reposo, cargando, no disponible y reserva completada, a 375 y 1280 px; sin desplazamiento horizontal; JS inicial, LCP y CLS dentro de presupuesto. Verificación: valores anotados aquí.
- [x] 5.4 Comprobación manual (M) contra el Calendly real en el navegador, en `/es` y `/en`: el calendario carga dentro del bloque, llega el mensaje de «visto» y el marco tiene título. **Sin completar ninguna reserva.** Capturas a 390 y 1440 px en `docs/brand/img/`. Verificación: resultado y capturas anotados aquí; lo no comprobado (el mensaje real de reserva completada), dicho.

## 6. Cierre del lote

- [x] 6.1 Escribir el ADR-0015 y actualizar L6-1 y L6-4 en BACKLOG y los escenarios de L6 en `docs/escenarios.md` (bloque en lugar de diálogo). Verificación: enlaces comprobados.
- [x] 6.2 Revisión de código con `fullstack-dev-skills:code-reviewer` en un subagente independiente y corrección de los hallazgos. Verificación: hallazgos y resolución anotados aquí.
- [x] 6.3 Puerta de cierre: `lint`, `typecheck`, `test`, `e2e`, `build:worker`, `measure:js` y carga de `/es` en `preview`. Verificación: todo en verde; cifras anotadas aquí.
- [x] 6.4 Actualizar README, BACKLOG, `docs/architecture/`, `docs/brand/README.md`, `docs/setup.md` (idioma del evento) y `.env.example`. Verificación: enlaces comprobados.
- [x] 6.5 Commit local del lote, sin `push`. Verificación: `git status` limpio y `git log -1` muestra el commit.

## Evidencia

Ejecutado el 2026-11-14 sobre el código final del lote.

**Puerta de cierre (6.3)**

| Comprobación | Resultado |
|---|---|
| `npm run lint` · `npm run typecheck` | Sin errores |
| `npm test` | 639 pruebas en 42 archivos, todas en verde |
| `npm run e2e` | 278 en verde, 20 omitidas (métricas, tabulador y cabecera en móvil, que solo aplican en Chromium de escritorio) |
| `npm run build:worker` | 1058,4 KiB de 3072; sin secretos incrustados; sin Three.js |
| `npm run measure:js` | 162,9 kB de 200 (L5: 161,3) |
| LCP y CLS de `/es`, móvil simulado | 0,76 s y 0,0060 (ligera) · 0,74 s y 0,0060 (completa) |
| `preview` (Workers local) | `/es` y `/en` 200; el HTML trae el bloque de agenda, sin ningún marco |

**Comprobación manual contra el Calendly real (5.4, nivel M).** `node scripts/capture-agenda-shots.ts` contra el build de producción, en `/es` y `/en`, a 1440 y 390 px:

- Peticiones a Calendly antes del clic: 0 en los cuatro casos.
- Tras el clic, el bloque pasa a «listo» en 2,9 a 4,9 s. Hosts pedidos: `assets.calendly.com`, `calendly.com`, `dfp.calendly.com`.
- El marco lleva nuestro título en el idioma de la página (Calendly le pone uno propio en inglés, que se sustituye).
- Capturas: `docs/brand/img/agenda-{idle,ready}-{desktop,mobile}.png`. Dentro del marco, Calendly muestra su aviso de cookies.
- **Reserva real de prueba**, autorizada por el fundador y con el correo que indicó, desde una página de sonda local con el mismo widget: `calendly.date_and_time_selected` al elegir horario y `calendly.event_scheduled` al confirmar, ambos desde `https://calendly.com`. El fundador confirmó que la invitación llegó y que la cita queda aceptada sola; reprogramar o cancelar es manual. La cita de prueba (30 de noviembre de 2026, 09:30) queda por cancelar por su parte.
- El calendario está en inglés también con el navegador en español: el idioma lo fija el evento.

**Revisión de código (6.2).** Subagente independiente, solo lectura: ningún hallazgo crítico, 3 importantes, 5 menores y 3 plausibles.

1. *Importante, corregido.* Al pulsar «Ver horarios aquí» o «Intentar de nuevo» el control desaparecía y el foco se perdía. Ahora pasa al título del bloque.
2. *Importante, corregido.* Con el script bloqueado quedaba reservado el hueco del calendario, vacío, bajo el aviso. Ahora solo se reserva si hay marco.
3. *Importante, corregido.* La prueba de reintento no podía fallar por duplicación. Añadida la del caso real: plazo vencido con el marco creado, reintento, un solo marco.
4. Corregido: un script que ni carga ni falla se da por perdido a los 15 s, para que el reintento lo pida de nuevo.
5. Corregido: una dirección no válida ya no emite `confia:agenda-opened`.
6. Corregido: además del origen se exige que el emisor del mensaje sea el marco del bloque.
7. Corregido: el Calendly simulado de E2E ya no da estilos al marco (ocultaba un fallo de tamaño) y hay una prueba con respuesta lenta que cubre «cargando» en navegador, con axe.
8. Corregido: nombres y criterio de «listo» alineados entre design.md y el código.
9. Corregido: el desplazamiento al bloque se hace después de pintar su nueva altura; E2E exige que el marco quede a la vista.
10. Corregido: el botón y la frase «se abre aquí» solo se muestran con el componente activo (`data-hydrated`), no solo con `scripting: none`.
11. *No cambiado:* la confirmación se inserta en una región viva y además recibe el foco; algún lector de pantalla puede leerla dos veces. Se prefiere a que el foco quede dentro del marco de Calendly. Sin lector de pantalla real para comprobarlo.

**Desviaciones de TDD**

- Las guardas de contenido ya cubrían `agenda.*` (2.1): la prueba nueva nació en verde y se comprobó con textos de prueba que sí infringen.
- `data-hydrated` se añadió al escribir las E2E, sin prueba unitaria propia; lo ejercitan todas las E2E de la agenda.

**No verificado**

- Lectores de pantalla reales, y el doble anuncio del punto 11.
- El widget real en Safari y Firefox: la comprobación manual se hizo en Chromium.
- El tabulador en WebKit simulado no recorre enlaces: el recorrido por teclado se prueba en Chromium.
- Qué cookies pone Calendly al cargarse: se ve su aviso, no se inventarió. Pendiente para la política de privacidad (L8) y la CSP (L9).

## Workflow follow-up

- `/opsx:verify` del cambio.
- `/opsx:archive` cuando el fundador lo apruebe.
