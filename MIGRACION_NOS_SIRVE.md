# NOS SIRVE · MIGRACIÓN 02

## Hecho en esta entrega

- Marca visible migrada de **Segunda Vuelta** a **Nos Sirve**.
- `index.html` actualizado: título, descripción y metadatos.
- `manifest.webmanifest` actualizado a **Nos Sirve**.
- Logo visible reconstruido usando el símbolo actual + texto **NOS SIRVE**, sin depender de los PNG viejos con el nombre anterior.
- Los PNG viejos del logo de Segunda Vuelta se retiran en el bloque local seguro 03, después de comprobar que no tienen referencias activas.
- Textos visibles de Home, registro, publicación, confirmación y mensajes principales actualizados.
- Prompts visibles de las funciones de IA actualizados a **Nos Sirve**.
- Nombre generado de imágenes curadas actualizado a `nos-sirve`.
- Categorías: utilitario renombrado de `categoriasSegundaVuelta` a `categoriasNosSirve`.
- Claves nuevas de localStorage/sessionStorage pasan a `nos-sirve`.
- Se agregó migración automática de claves antiguas para no perder favoritos, onboarding, borradores y contexto de navegación.
- Se agregó **scroll global al inicio de cada ruta** para evitar entrar a mitad de una pantalla.
- Se corrigió el contexto de navegación desde **Inicio** para poder recorrer publicaciones anterior/siguiente también desde allí.
- Carrusel de fotos: flechas solo si hay más de una foto, indicadores por puntos y ayuda más clara para deslizar/ampliar.
- Visor: si hay una sola foto no muestra flechas inútiles.
- Onboarding: agregado un paso que explica cómo recorrer fotos y publicaciones con el dedo.

## Compatibilidad técnica preservada a propósito

Hay identificadores internos que conservan el nombre viejo porque hoy están ligados a infraestructura ya desplegada o a datos existentes:

- nombres de Edge Functions de Supabase;
- nombre del servicio de Render;
- rama/configuración de Git;
- nombre de la base IndexedDB usada por borradores.

No son visibles para las personas usuarias. Cambiarlos sin una migración coordinada puede romper producción o hacer perder borradores. Deben renombrarse en una etapa de infraestructura controlada.

## Pendientes ya definidos

1. Implementar **precio aproximado/orientativo** antes de volver al pulido de imágenes.
2. Regla **18+ para operar** y diseño completo de fecha de nacimiento / validación / KYC.
3. Personalizar los demás correos de Supabase: recuperación de contraseña, cambio de email, OTP/magic link si se usa, etc.
4. Definir correo humano oficial de Nos Sirve separado de `no-reply@nossirve.com`.
5. Auditoría legal/producto final: términos, privacidad, datos personales, pagos, reclamos, objetos prohibidos y seguridad.
6. Volver al bloque de curaduría/pulido de imágenes después del precio aproximado.

## Control al desplegar

- Abrir `https://nossirve.com` y verificar que el navegador muestre **Nos Sirve**.
- Probar registro y confirmación de correo.
- Probar Home → detalle → publicación anterior/siguiente.
- Probar carrusel con 1 foto y con varias fotos.
- Probar Publicar → análisis → revisión y confirmar que la revisión abre arriba.
- Probar que título, descripción, categoría y demás sugerencias puedan revisarse/cambiarse en el paso correspondiente.


## BLOQUE LOCAL SEGURO 03 - 23/09/2026

- Se unifica la escala visual del logo y títulos principales mediante tokens CSS compartidos.
- Inicio, Buscar/Publicaciones, Mensajes, Mi cuenta y las pantallas basadas en `PantallaOperativa` pasan a usar la misma fuente de verdad para tamaño de logo y título.
- `Objetos que pueden seguir circulando` pasa a `Objetos que aún sirven`.
- Se retiran del proyecto activo los logos legados de Segunda Vuelta y el utilitario de categorías legado sin imports activos.
- La documentación/prototipo histórico de Remate Express se archiva fuera del código activo.
- No se tocan en este bloque: IndexedDB `segunda-vuelta`, Edge Functions de Supabase, Render, Git/GitHub, Vercel ni variables `SV_*`.
- La migración de esos identificadores requiere la fase coordinada de infraestructura.
