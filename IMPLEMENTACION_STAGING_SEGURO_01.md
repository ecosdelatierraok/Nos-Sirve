# NOS SIRVE · IMPLEMENTACIÓN STAGING SEGURO 01

## Alcance ejecutado
- Se trabajó sobre una copia derivada del snapshot, nunca sobre el original de Gabi.
- Se eliminó del paquete de staging el `.env` real del worker.
- Se eliminaron `supabase/.temp`, caches Python y artefactos regenerables.
- Se conserva `public/models/u2net.onnx` porque el frontend lo usa en runtime.
- Se mantiene el legado técnico `segunda-vuelta` / `SV_*` cuando sigue teniendo dependencias activas.
- Las Edge Functions ahora prefieren las nuevas Supabase Secret API Keys y mantienen fallback temporal a legacy hasta la verificación.
- El worker Python prefiere `SUPABASE_SECRET_KEY` y mantiene fallback temporal a `SUPABASE_SERVICE_ROLE_KEY`.
- Render y GitHub Actions quedan preparados para recibir `SUPABASE_SECRET_KEY` como secreto externo.
- `.vercelignore` queda limitado al frontend para no subir backend/temporales a Vercel.
- Se agregó precheck estructural y documentación de rotación/deploy.

## No se cambió
- UX visual.
- Flujo de fotos/cámara.
- Auth de usuarios.
- Precio aproximado.
- SAM/segmentación.
- Pagos/envíos/roles.
- Nombres técnicos históricos que no pertenecen al bloque de seguridad.

## Verificaciones realizadas en el entorno de Magia
- El `.env` sensible no está en el paquete de staging.
- `u2net.onnx` está presente.
- Sintaxis Python del worker: OK.
- Chequeo TypeScript: sin errores de sintaxis detectados; el verificador local solo reporta los módulos remotos de Deno y el global `Deno`, esperables fuera de Supabase/Deno.
- Build Vite no pudo ejecutarse en este entorno porque el contenedor no tiene acceso DNS al registry de npm. Debe ejecutarse en `D:\SegundaVuelta`/copia de staging antes del deploy.
