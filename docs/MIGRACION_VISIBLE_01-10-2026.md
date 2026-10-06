# Migración visible a NOS SIRVE — 01/10/2026

## Cambios confirmados
- GitHub: repositorio 1288388121 renombrado de ecosdelatierraok/SegundaVuelta a ecosdelatierraok/Nos-Sirve; descripción NOS SIRVE actualizada. Misma rama segunda-vuelta, sin commits ni reescritura.
- Vercel: proyecto prj_zYHrjt9iJ1iM1bANx3AHsBtig9vc renombrado de segunda-vuelta a nos-sirve. Se actualizó únicamente projectName en .vercel/project.json; projectId y orgId conservados.
- Staging no tiene .git: no hay remote local que actualizar en esta copia. La configuración del original D:\SegundaVuelta no se modificó; conserva el remote antiguo, para el que GitHub ofrece redirección. Actualizarlo queda fuera de esta copia autorizada.
- Branding, metadata, PWA y assets activos locales ya decían Nos Sirve. No se modificó código de cámara. Los hashes de PublicarFotos, PublicarCaptura y NuevaPublicacion coinciden con el respaldo anterior.
- Build final OK. Preview dpl_7LNc92XJNBWLZrRQx7N4aAuH9hLL sigue READY en el mismo project ID. La URL HTTPS sigue respondiendo; el acceso anónimo devuelve la protección de Vercel, no el HTML de la app. Se conserva la prueba Samsung 1/3/5 confirmada por Gabi.

## Puerta pendiente antes de Production
VITE_U2NET_MODEL_URL solo tiene ámbito Preview. El modelo de 175.997.641 bytes está excluido del upload por .vercelignore. Por tanto, desplegar normalmente a Production usaría el fallback /models/u2net.onnx, sin ese archivo en el upload. Se solicitó autorización para añadir Production al ámbito de la variable existente, conservando Preview y su valor. No se ejecutó deploy ni promoción mientras esa puerta permanezca pendiente. No se alteraron variables.

## Accesos pendientes
- Supabase: el navegador disponible redirige al login. No se dispone de sesión administrativa existente para cambiar el nombre. No se crearon credenciales ni se tocó el backend. Ref conservada: ltaaizlgcktskrjurntp.
- Render: dashboard redirige al login. Nombre remoto no verificado ni cambiado; render.yaml conserva segunda-vuelta-curadoria para no alterar el servicio identificado por el blueprint.

## Clasificación final de restos
- VISIBLE pendiente: nombre del proyecto Supabase; nombre de servicio Render si coincide con el blueprint; marca de la Production anterior hasta el deploy autorizado.
- LEGACY TÉCNICO NECESARIO: rama segunda-vuelta (checkout explícito del worker), IndexedDB segunda-vuelta (borradores locales), prefijo antiguo en migrarMarcaStorage (migración de datos del navegador), nombres y rutas de las tres Edge Functions (endpoints/configuración de funciones), nombre del worker Render (blueprint), alias segundavuelta-app.vercel.app y URLs de deployments anteriores (enlaces e historial). No se alteró el identificador del equipo Vercel ni su slug porque cambiarlo excede el rename del proyecto y afecta URLs.
- HISTÓRICO: documentos de migraciones anteriores, manifiestos, estados previos y backups. No son marca visible del frontend activo y se conservan por trazabilidad.
- El nombre genérico del workflow Curadoria Worker no contiene la marca antigua. No se creó un commit remoto solo para cambiar su etiqueta, evitando activar integraciones de despliegue ajenas a la publicación única solicitada.

## Rollback preparado, no ejecutado
- Production anterior: dpl_BTUhdS68mDzB5BMJWV1tbpwR5ybF, asociado a nossirve.com al inicio. No borrar ese deployment. Si una futura publicación falla, usar el rollback de Vercel a ese ID; no cambiar DNS.
- Vercel: PATCH del mismo project ID con name=segunda-vuelta y restaurar projectName local si fuera necesario. Dominios y variables conservan sus IDs.
- GitHub: PATCH /repositories/1288388121 con name=SegundaVuelta y description=null restaura el nombre y descripción anteriores, siempre que el nombre siga libre. No crear otro repositorio con el nombre anterior.
- Estado previo sanitizado en MIGRACION_VISIBLE_ESTADO_PREVIO_01-10-2026.json, GITHUB_ESTADO_PREVIO_01-10-2026.json, VERCEL_DOMINIOS_PREVIOS_01-10-2026.json y VERCEL_VARIABLES_PREVIAS_01-10-2026.json. No contienen valores de variables ni credenciales.

## Referencias oficiales consultadas
- https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository
- https://vercel.com/kb/guide/how-do-i-change-the-name-of-my-vercel-project
- https://vercel.com/docs/deployments/promote-preview-to-production