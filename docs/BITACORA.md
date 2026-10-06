# Bitácora Remate Express Core

---

# 02/07/2026

- Git instalado.
- Git configurado.
- Primer commit realizado.
- Proyecto publicado en GitHub.
- Definimos que la PWA será el lugar donde viven los remates.
- WhatsApp será la puerta de entrada y canal de avisos.
- Quien ofrece el objeto realiza la carga inicial.
- La Curadora revisa, mejora y activa cada remate.
- Se define la comisión del 10% sobre el valor final adjudicado.
- Nace oficialmente el concepto **Remate Express Core**.

---

# 03/07/2026

- Instalación de Node.js.
- Configuración del entorno de desarrollo.
- Instalación de React + Vite.
- Nace oficialmente la aplicación Remate Express Core.
- Comienza el desarrollo de la PWA.

---

# 05/07/2026

## Navegación

- Implementación de React Router.
- Home (/).
- Remates (/remates).
- La aplicación deja de ser un conjunto de pantallas independientes y pasa a funcionar como una PWA.

## Desarrollo

- Creación de remates.
- Almacenamiento local.
- Visualización del listado.
- Carga de imágenes.
- Formulario principal.

## Decisión de producto

- La frase de neuroventa será personalizada para cada objeto.
- Más adelante se generarán automáticamente las publicaciones de WhatsApp.

---

# 06/07/2026

## Funcionalidades

- Registro de ofertante.
- Publicación de remates.
- Sistema de ofertas.
- Historial de ofertas.
- Carga de imágenes.
- Visualización completa.
- Edición.
- Eliminación.
- Acceso oculto de Curadora mediante doble clic.
- Protección de pantallas administrativas.
- URL utilizando número de remate.
- Fecha y hora en formato argentino.
- Incremento mínimo configurable.
- Renovación automática de remates sin ofertas.
- Corrección del título del navegador.
- Etiquetas visibles en formularios.

---

# 08/07/2026

## Estados del remate

Se implementan los tres estados oficiales:

- ACTIVO
- FINALIZADO
- ARCHIVADO

## Nuevas funciones

- Finalización manual.
- Bloqueo automático de ofertas.
- Determinación del ganador.
- Datos personales visibles únicamente para la Curadora.
- Sincronización de oferta actual con Supabase.
- Unificación visual mediante estadoRemate.js.

---

# 11/07/2026

# 🎉 Cierre de desarrollo de Remate Express V1

## Arquitectura

- Migración completa a Supabase.
- Eliminación del almacenamiento local como fuente principal.
- Sincronización de remates y ofertas.
- Limpieza general del proyecto.

## Administración

- Edición completa de remates.
- Historial de objetos.
- Archivado manual.
- Nueva oportunidad para objetos archivados.
- Eliminación automática del historial de ofertas al republicar.
- Conservación inteligente del scroll y filtros.
- Restauración automática del filtro correspondiente luego de cada acción.

## Experiencia del usuario

- Home completamente renovada.
- Secciones informativas:
  - ¿Cómo funciona?
  - Quiero rematar.
  - Comunidad.
  - Compartir Remate Express.
- Acceso oculto para Curadora.
- Contador dinámico de remates activos.
- Animaciones suaves en toda la aplicación.
- Diseño responsive mejorado.

## Remates

- Galería con múltiples imágenes.
- Navegación entre fotografías mediante botones y toque sobre la imagen.
- Contador de fotografías.
- Contador de ofertas.
- Compartir un remate individual.
- Compartir la aplicación.
- Compartir la comunidad de WhatsApp.
- Neuroventa integrada en cada remate.
- Indicadores visuales de estado.
- Mejor experiencia para remates sin ofertas.
- Mejor experiencia para remates con ofertas.

## Identidad

- Nueva estética definitiva V1.
- Paleta institucional.
- Pie de página oficial.

Remate Express V1 © 2026 · Córdoba, Argentina

Un proyecto creado por @Gabiaguz

---

# Próximo objetivo

## V1.1

- Publicación de remates por los usuarios.
- Aprobación por parte de la Curadora.
- Notificaciones automáticas.
- Mensajes automáticos para adjudicatarios.
- Mensajes automáticos para la Curadora.
- Automatización completa del flujo.
- Mejoras visuales continuas.
## 2026-09-24 · Contrato global 07
- Se convierte el contrato visual en obligación técnica de desarrollo por ruta.
- Inicio: ticker y buscador comparten ancho útil del banner y quedan fijos.
- Buscar: título/buscador/botón permanecen fijos; filtros se montan en contexto fijo, reaparecen en cualquier punto de la lista y se contraen al comenzar a recorrer resultados.
- Detalle abierto desde Inicio recorre el feed activo completo y no solo las tres tarjetas destacadas.
- Se mantiene intacto el flujo funcional de publicación corregido en 06 y no se modifica Propongo/Lo compro.
