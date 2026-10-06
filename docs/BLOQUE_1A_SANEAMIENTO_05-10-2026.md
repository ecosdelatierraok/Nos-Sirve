# NOS SIRVE · BLOQUE 1A · Saneamiento de alcance

Fecha: 05-10-2026 (America/Buenos_Aires).

## Checkpoint previo a la reversión

Respaldo: `D:\NosSirve_STAGING_01\RESPALDO_BLOQUE_1A_PRE_REENCADRE_05-10-2026`.

Se copiaron exclusivamente los 10 archivos indicados por el usuario, conservando sus rutas relativas. `MANIFEST_SHA256.txt` contiene sus hashes. Las 10 copias se verificaron contra los archivos de trabajo antes de revertir. Después de la reversión, los 10 hashes del respaldo siguen coincidiendo con el manifiesto. No se copiaron secretos ni archivos de entorno.

## Reversión realizada

Se invirtieron exclusivamente las ediciones de esta sesión en:

- `src/utils/admin.js`
- `src/App.jsx`
- `src/pages/ConfiguracionAdmin.jsx`
- `src/pages/DetallePublicacion.jsx`

Se eliminó exclusivamente el archivo nuevo `src/hooks/useAdmin.js`. Su contenido permanece en el checkpoint. No quedan referencias a `useAdmin`, `observarAdmin`, `suscribirAdmin` o `consultarAdmin` en `src`.

En `src/utils/usuario.js` se sustituyó únicamente `await supabase.auth.signOut({ scope: "local" });` por `await supabase.auth.signOut();`. Todo el resto coincide con el checkpoint.

La reconstrucción se realizó con los hunks y las lecturas del registro de herramientas de esta sesión, sin utilizar copias históricas. Se verificó el contenido completo resultante contra esa reconstrucción. No existe un hash tomado inmediatamente antes de las ediciones originales; la verificación del estado anterior se apoya en el registro de ediciones, no en un hash previo.

## Cambios Auth conservados provisionalmente

- `src/pages/Ingresar.jsx`: idéntico al checkpoint por SHA-256.
- `src/pages/Registro.jsx`: idéntico al checkpoint por SHA-256.
- `src/pages/MiCuenta.jsx`: idéntico al checkpoint por SHA-256.
- `src/utils/destinoAuth.js`: idéntico al checkpoint por SHA-256.
- `src/utils/usuario.js`: conserva todos los cambios Auth salvo el alcance del logout restaurado.

Estos cambios siguen pendientes de validación contra los criterios A–E del Bloque 1A. Este saneamiento no acredita que la implementación Auth cumpla dichos criterios.

## Hallazgo pendiente para el cierre del Bloque 1A

HALLAZGO FUERA DE ALCANCE:

“El estado/interfaz de administración depende de localStorage.
Debe verificarse en bloque de Seguridad si los privilegios reales están
protegidos por backend/RLS/RPC y no solo por interfaz.”

No se solucionó el mecanismo de administración en este saneamiento.

## Hashes posteriores de los archivos revertidos

```text
941317ED8187837D7636A691CC9DB7A6784890ECD47E5C143B8F9C060DD50272  src/utils/admin.js
CA919038F81540C9EECF96990C43941D094A4FC7E081D3A0901178FBF2E8FD77  src/App.jsx
A0EE5694584B3F241D1E9A938C8C1A02E346CE1AD0227AA170621FC92BFDA019  src/pages/ConfiguracionAdmin.jsx
1E382A0037E31C5582B3E10390E6E4EEF084F9C5127B76D64A57566BDD4A9689  src/pages/DetallePublicacion.jsx
FF54C70268BE3C19D418F15B26F9116E23A6C4267F7DFC2E6C307A819D523568  src/utils/usuario.js
```

## Estado de esta ejecución

- Archivos no recuperables con certeza de contenido: ninguno.
- Cambios remotos: ninguno.
- Build: no ejecutado en este saneamiento.
- Implementación Auth adicional: ninguna.
- Git: no agregado.
- Estado: saneado; detenido a la espera de nueva aprobación.
