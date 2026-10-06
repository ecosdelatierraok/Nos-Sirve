# Cierre de base local — 30/09/2026

## Cambios seguros
- Retiradas funciones locales sin referencias: IconoBuscar en Home y Publicaciones, y llevarFiltroAlInicio en Mensajes.
- Retirada inicialización redundante de valorOperacion: ambas ramas asignan su valor antes de usarlo.
- Retirados cinco módulos fuera del grafo de imports, sin carga dinámica ni referencias externas en este proyecto: BotonPrincipal.jsx, ModalPersonaInteresada.jsx, data/publicaciones.js, estadoPublicacion.js y publicarBorrador.js. Retirado hero.png sin referencias. Recuperables en el respaldo completo del 30/09.
- Sin cambios de marca adicionales: index.html, manifest, iconos y package.json ya usan Nos Sirve. Nombres del package-lock consistentes. Assets estáticos e imports revisados sin faltantes; rutas conservadas.

## Validación
- Build OK; conserva advertencia de bundle superior a 500 kB. Los nombres/hash de los assets del build coinciden con los anteriores a esta limpieza.
- Lint: 32 errores y 5 advertencias, frente a 38 y 5 iniciales. Detalle por archivo/línea/regla en LINT_BASE_LIMPIA_30-09-2026.json. No se deshabilitaron reglas.
- Cámara sin cambios: hashes SHA-256 de PublicarFotos.jsx, PublicarCaptura.jsx y NuevaPublicacion.jsx coinciden con el respaldo. QA cámara 1/3/5 por HTTPS Preview confirmado por Gabi.
- Sin deploy, consultas remotas ni cambios en Production, Supabase, Vercel, GitHub o la carpeta original.

## Pendientes que no se corrigen automáticamente
- Reglas de efectos, refs, dependencias y pureza en CabeceraNosSirve, DetallePublicacion, Mensajes, Publicaciones y páginas de publicación: requieren revisar ciclos de estado y comportamiento, no agregar dependencias a ciegas.
- Avisos en PublicarFotos/PublicarCaptura/NuevaPublicacion y subidaFotosPublicacion: conservados por la restricción de cámara y su flujo de fotos.
- _funcionamientoViejo en PublicarRevision excluye una propiedad al crear respuestasLimpias: no eliminar esa exclusión para silenciar lint.
- La copia local no tiene VITE_SUPABASE_URL ni VITE_SUPABASE_PUBLISHABLE_KEY efectivas. No se copiaron valores ni se eligió otro backend. VITE_U2NET_MODEL_URL es opcional localmente por el fallback existente /models/u2net.onnx. No se modificaron archivos de entorno.

## Restos de marca y clasificación
- A (visible/metadata activa): ninguno encontrado de Segunda Vuelta.
- C (dependencias): IndexedDB segunda-vuelta en borradorPublicacion.js; prefijo anterior construido en migrarMarcaStorage.js para recuperar datos; rama segunda-vuelta en .github/workflows/curadoria-worker.yml; proyecto segunda-vuelta en .vercel/project.json; servicio segunda-vuelta-curadoria en render.yaml; funciones y rutas segunda-vuelta-ia, segunda-vuelta-ia-worker y segunda-vuelta-publicador en supabase/. Se conservan sin renombrar para no romper datos o integraciones.
- B (histórico): MIGRACION_NOS_SIRVE.md, IMPLEMENTACION_STAGING_SEGURO_01.md, SEGURIDAD_ROTACION_CLAVES.md, STAGING_PRECHECK.md y MANIFEST_SHA256.txt. Son evidencia histórica; el manifiesto antiguo no describe el estado final. Los prototipos se conservan como referencia histórica fuera del build. Se mantienen recursos alternativos de marca/modelo como material de diseño y recuperación, sin confundirlos con imports activos.
- D: seis archivos sin uso retirados en este cierre, además de la limpieza anterior ya terminada.

## Snapshot
Destino solicitado: D:\NosSirve_BASE_LIMPIA_01. Copia completa, incluyendo archivos ocultos, dependencias, dist y configuración local. No es un paquete para publicar o subir a GitHub. El manifiesto _SNAPSHOT_SHA256.csv del destino registra rutas, tamaños y hashes; la fuente se vuelve a comparar después de copiar para comprobar que no cambió durante el snapshot.

Estado: limpieza segura completada y build correcto; no equivale a lint aprobado ni a arranque local verificado hasta resolver los pendientes indicados.