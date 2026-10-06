# Nos Sirve — Corrección robusta de rutas de fotos (06)

## Causa confirmada

La RPC `registrar_archivo_borrador_temporal` exige que la ruta de cada foto empiece por:

`<token_publico>/originales/foto-<posicion>`

El cliente generaba correctamente esa ruta al subir, pero al reordenar fotos o cambiar la portada podía reutilizar una `rutaOriginal` anterior que pertenecía al mismo borrador pero a otra posición.

Ejemplo:

- una foto fue subida en posición 3 como `.../foto-3-<id>.jpg`;
- luego la persona la mueve a posición 1;
- el cliente la consideraba segura porque solo verificaba `.../<token>/originales/`;
- al registrarla como posición 1 enviaba todavía `.../foto-3-...`;
- Supabase respondía `RUTA_NO_PERTENECE_AL_BORRADOR`.

## Corrección

La validación local ahora comprueba borrador **y posición actual**. Si una foto cambió de posición, deja de reutilizar la ruta antigua y se resguarda nuevamente bajo la ruta correcta.

La verificación final y el estado de subida usan la misma regla, evitando falsos positivos de “SUBIDA”.

Los códigos técnicos de esta familia ya no se muestran crudos a la persona usuaria; se conserva el error técnico en consola para diagnóstico.

## Qué no se modificó

- RPC de Supabase.
- Worker de curaduría.
- MAGIA / Gemini.
- Bucket o políticas de Storage.
- Datos de publicaciones existentes.

La validación del servidor se mantiene intacta: la corrección está en el cliente que generaba/reutilizaba rutas inconsistentes después de un reordenamiento.
