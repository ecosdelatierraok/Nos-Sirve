# Nos Sirve · Contrato global de pantallas · 07

## Regla obligatoria
Toda ruta funcional actual o futura debe declarar contrato en `src/config/contratoPantallasNosSirve.js`. En desarrollo, una ruta nueva que no esté declarada allí falla de forma explícita. La pantalla continúa usando `CabeceraNosSirve`/`PantallaNosSirve` para publicar el bloque contextual dentro de la carcasa global.

La carcasa es siempre:
1. cabecera Nos Sirve;
2. bloque contextual fijo declarado por la ruta;
3. único viewport central con scroll;
4. navegación inferior.

## Matriz vigente
- Inicio: ticker institucional + buscador fijos. Banner, tarjetas y propósito scrollean.
- Buscar: título + buscador + botón de filtros fijos. Los filtros, al abrirse, aparecen en el bloque contextual sin importar la posición de la lista; al comenzar a recorrer la lista hacia abajo se contraen automáticamente. También pueden cerrarse con “Ocultar filtros”.
- Detalle: título/navegación de objeto fijos. Foto y datos scrollean.
- Mensajes: título + filtros fijos. Fecha y mensajes scrollean.
- Mi cuenta: título fijo. Contenido scrollea.
- Publicar / Captura / Analizando / Valor / Revisión / Ubicación / Confirmar: título + subtítulo fijos.
- Publicar Fotos: solo el título queda fijo; el texto explicativo acompaña al contenido. Esta excepción queda pendiente de validación en teléfono real.
- Ingresar / Registro / Configuración / Mis publicaciones / Mis propuestas / Nueva/Editar publicación: usan el mismo contrato global y no pueden crear una carcasa paralela.

## Navegación de detalle
Si una publicación se abre desde Inicio, las flechas recorren el feed activo completo en el mismo orden, no solamente las tres tarjetas visibles del Home. Si se abre desde Buscar, se respeta el conjunto filtrado visible.

## Regla de ancho Inicio / Buscar
Ticker y buscador de Inicio ocupan el mismo ancho útil que banner/tarjetas. Inicio y Buscar comparten la misma grilla vertical para que sus buscadores queden en la misma coordenada estructural.
