# Tokens de diseño

## Purpose

Define la paleta, los roles de color y los temas por banda de la interfaz, y garantiza que cambiarlos se hace en un solo archivo y que toda combinación permitida de texto y fondo es legible.

## ADDED Requirements

### Requirement: Paleta cerrada de quince colores
El archivo de tokens MUST declarar como primitivos exactamente los quince colores de la paleta elegida, con sus valores, y no MUST contener ningún otro valor de color.

#### Scenario: Los primitivos son los quince de la paleta (U · L1-1)
- **GIVEN** `src/styles/tokens.css`
- **WHEN** se leen sus primitivos
- **THEN** son exactamente los 15 colores de `docs/brand/README.md`, con el mismo HEX
- **AND** ningún otro valor de color aparece en el archivo

#### Scenario: La paleta de Tailwind está desactivada (U)
- **GIVEN** el archivo de tokens
- **WHEN** se inspecciona el bloque de tema de Tailwind
- **THEN** la paleta por defecto está anulada, de modo que una clase como `bg-red-500` no genera estilos

### Requirement: Roles semánticos como única interfaz de color
Los componentes MUST consumir color solo a través de roles semánticos (`--color-*` y `--scene-*`). Cada rol MUST resolverse a un primitivo de la paleta en todos los temas.

#### Scenario: Cada rol apunta a un primitivo (U)
- **GIVEN** los roles declarados en el tema base y en cada tema por banda
- **WHEN** se resuelve su valor
- **THEN** cada uno termina en uno de los quince primitivos

#### Scenario: Un cambio de rol se refleja sin tocar el componente (I · L1-1)
- **GIVEN** un botón primario renderizado dentro de `.theme-dark`
- **WHEN** se cambia el valor de `--color-primary`
- **THEN** el fondo del botón pasa a referirse al nuevo valor sin modificar el código del componente

### Requirement: Temas por banda
El sistema MUST ofrecer el tema base y los temas `theme-dark`, `theme-fresh`, `theme-coral`, `theme-warm` y `theme-calm`, cada uno con los fondos del diseño finalista, y un tema anidado MUST prevalecer sobre el que lo contiene.

#### Scenario: Cada tema tiene el fondo acordado (U)
- **GIVEN** los temas declarados
- **WHEN** se resuelve `--color-background` en cada uno
- **THEN** es crema en el base, índigo 900 en `theme-dark`, salvia en `theme-fresh`, coral 300 en `theme-coral`, mantequilla en `theme-warm` e índigo 100 en `theme-calm`

#### Scenario: Todos los temas definen todos los roles de color (U)
- **GIVEN** la lista de roles `--color-*` del tema base
- **WHEN** se compara con cada tema por banda
- **THEN** cada tema asigna un valor a cada rol, de modo que un tema anidado no hereda roles del que lo contiene

#### Scenario: Una utilidad puede más que el tema (E)
- **GIVEN** un elemento con un tema y una utilidad de fondo en el mismo elemento
- **WHEN** se renderiza en un navegador
- **THEN** su fondo es el de la utilidad
- **AND** un tema claro anidado en el oscuro muestra fondo y texto del tema claro

### Requirement: Contraste AA en las parejas permitidas
Cada pareja de texto y fondo declarada como permitida en un tema MUST alcanzar un contraste de al menos 4,5:1 para texto normal y de al menos 3:1 para texto grande, anillo de foco y bordes de controles.

#### Scenario: Todas las parejas permitidas cumplen (U · L1-2)
- **GIVEN** la lista de parejas permitidas de cada tema
- **WHEN** se calcula su contraste con la fórmula de WCAG 2.1
- **THEN** las de texto normal son ≥ 4,5:1
- **AND** las de texto grande, foco y borde de control son ≥ 3:1

#### Scenario: Una pareja que no cumple hace fallar la suite (U)
- **GIVEN** una pareja de prueba con coral 500 como fondo y blanco como texto
- **WHEN** se evalúa con el mismo verificador
- **THEN** el resultado es «no cumple» y nombra el tema, los dos roles y el contraste obtenido

#### Scenario: La lista de parejas cubre todos los temas (U)
- **GIVEN** la lista de parejas permitidas
- **WHEN** se agrupa por tema
- **THEN** cada uno de los seis temas tiene al menos texto, texto atenuado, enlace, foco y texto sobre acción principal
