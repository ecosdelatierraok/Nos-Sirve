# NOS SIRVE · ROTACIÓN SEGURA DE CREDENCIAL SUPABASE

## Objetivo
Retirar de circulación la credencial backend que apareció en el snapshot sin cortar MAGIA, curaduría ni publicación.

## Regla
No pegar claves en chats, ZIPs ni código. Las claves viven únicamente en los gestores de secretos de cada servicio.

## Secuencia aprobada

1. En Supabase, crear/confirmar una **Secret API Key nueva** (`sb_secret_...`).
2. Confirmar que las Edge Functions hospedadas reciben `SUPABASE_SECRET_KEYS` (Supabase lo inyecta como mapa JSON de claves nuevas).
3. Desplegar estas Edge Functions preparadas para leer primero `SUPABASE_SECRET_KEYS['default']` y usar la legacy solo como fallback temporal:
   - `segunda-vuelta-ia-worker`
   - `segunda-vuelta-publicador`
4. En Render, configurar `SUPABASE_SECRET_KEY` con la nueva Secret API Key. No guardar el valor en `render.yaml`.
5. En GitHub Actions, crear/actualizar el secret `SUPABASE_SECRET_KEY`. El workflow de staging ya espera ese nombre.
6. Verificar:
   - Edge Functions responden normalmente.
   - Worker de curaduría inicia y procesa sin error de autenticación.
   - Publicación y MAGIA siguen funcionando.
7. Recién cuando todos los consumidores nuevos estén verificados, desactivar la **legacy service_role** expuesta.
8. No rotar el JWT signing secret como parte de este bloque: no hace falta para migrar a Secret API Keys y puede cortar sesiones.

## Frontend
Vercel solo necesita variables públicas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Nunca debe recibir una Secret API Key ni una Service Role.
