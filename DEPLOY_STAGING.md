# NOS SIRVE · DEPLOY DE STAGING HTTPS

## Objetivo único
Obtener una URL HTTPS de prueba para QA real en Samsung, sin convertir este deploy en producción definitiva.

## Antes del deploy
- Confirmar rotación/migración de credencial según `SEGURIDAD_ROTACION_CLAVES.md`.
- Ejecutar `_PRECHECK_STAGING.ps1`.
- Ejecutar `npm ci` y `npm run build` en la PC de Gabi.
- No retirar `public/models/u2net.onnx`: el frontend actual lo carga directamente.

## Vercel
Variables públicas requeridas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`.vercelignore` excluye backend, funciones, documentación y temporales del upload del frontend, pero conserva `public/models/u2net.onnx`.

Antes de publicar, usar el dry-run del CLI (`vercel deploy --dry`) si se trabaja por CLI para verificar el manifiesto y confirmar que el modelo está incluido.

## QA Samsung obligatorio
1. Abrir la URL HTTPS.
2. Publicar > Fotos.
3. Probar cámara interna con 5 fotos seguidas.
4. Repetir con 1 foto y 3 fotos.
5. Probar galería y permisos.
6. Probar cancelar y reentrar.
7. Verificar teclado y safe-area.
8. Volver atrás / refresh.
9. Confirmar persistencia del borrador y orden de fotos.
10. Completar publicación y verificar ID correcto.
11. Repetir el flujo completo por segunda vez.

Si falla: causa raíz o rollback. No parche sobre incidente.
