# Arquitectura visual Nos Sirve

## Regla permanente
Toda pantalla funcional actual o futura debe declararse como hija de `LayoutNosSirve` en `App.jsx` y debe construir su cabecera mediante `PantallaNosSirve`, `PantallaOperativa` o `CabeceraNosSirve`.

`LayoutNosSirve` divide físicamente el viewport en cuatro franjas, sin superposición:

1. **Cabecera Nos Sirve**: logo y acciones laterales.
2. **Contexto fijo de la pantalla**: solo lo que la tarea necesita mantener visible (título, buscador, filtros, título del objeto, etc.).
3. **Contenido con scroll**: es el único sector que se desplaza.
4. **Navegación inferior**: Inicio · Buscar · Publicar · Mensajes · Mi cuenta.

No crear `position: fixed` o `sticky` nuevos para simular otra cabecera o navegación. No crear otro scroll de `body`. No montar una segunda `NavegacionInferior` dentro de una página.

## Adaptación al dispositivo
La carcasa usa `100dvh` y las áreas seguras del dispositivo. El contenido nunca debe verse detrás del logo ni detrás de la navegación. Al final del contenido debe conservarse el aire inferior definido por el shell.

## Contexto fijo por tipo de pantalla
El corte fijo no tiene por qué tener la misma altura en todas las tareas. Lo común es la cabecera y la navegación; la franja contextual se compone con lo estrictamente necesario.

- **Inicio**: ticker institucional + buscador fijos. Banner y resto scrollean.
- **Buscar / Objetos que aún sirven**: título + buscador + botón de filtros fijos. Resultados scrollean.
- **Mensajes**: título + filtros fijos. Fecha y mensajes scrollean.
- **Mi cuenta**: título fijo. Perfil/opciones scrollean.
- **Mostranos bien el objeto**: solo el título fijo. Texto explicativo e instrucciones scrollean.
- **Detalle**: título/navegación del objeto fijos. Foto y resto scrollean.

Para una pantalla nueva, elegir deliberadamente qué pertenece a la franja contextual. Si no necesita nada fijo debajo del logo, dejar esa franja vacía.

## Buscadores Inicio / Buscar
Inicio y Buscar comparten la misma grilla vertical para que sus barras de búsqueda queden exactamente en la misma coordenada. El primer renglón contextual tiene la misma altura; en Inicio contiene el ticker y en Buscar contiene el título.

## Ticker y título de publicación
El ticker institucional de Inicio y el título superior de Detalle comparten tamaño, peso y color tipográfico. Inicio no muestra flechas ni número de publicación; Detalle conserva sus controles propios.

## Subtítulos
`PantallaNosSirve` permite decidir si un subtítulo pertenece a la franja fija (`fijarSubtitulo=true`) o al contenido desplazable (`fijarSubtitulo=false`). Usar esta segunda opción cuando el texto explicativo debe leerse como parte del recorrido.

## Autenticación
La UI de Google/Facebook/email está preparada, pero los proveedores Google y Facebook todavía no están conectados. La integración funcional se hace en el bloque específico de Auth.
