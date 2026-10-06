# NOS SIRVE · STAGING SEGURO 01

Este paquete deriva del snapshot técnico del 24/09/2026. No modifica lógica funcional.

## Puertas obligatorias antes de publicar

1. Rotar/reemplazar la credencial backend expuesta de Supabase en todos sus consumidores reales.
2. No guardar ni pegar secretos dentro del proyecto. Usar variables de entorno de cada servicio.
3. Configurar en Vercel únicamente las variables públicas del frontend:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
4. Mantener `public/models/u2net.onnx`: el frontend lo carga desde `/models/u2net.onnx`.
5. Para este staging no renombrar ni retirar identificadores históricos `segunda-vuelta` / `SV_*`.
6. Ejecutar build y precheck antes del deploy.

## QA móvil posterior al HTTPS

- Cámara interna de Nos Sirve: 5 fotos seguidas.
- Repetir con 1 y 3 fotos.
- Galería, cancelar/reentrar, permisos.
- Teclado y safe-area.
- Volver atrás y refresh.
- Borrador/posición de fotos.
- Publicación completa e ID correcto.
- Repetir el flujo completo una segunda vez.
