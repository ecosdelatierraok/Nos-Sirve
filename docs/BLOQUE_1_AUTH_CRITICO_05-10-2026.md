# NOS SIRVE · BLOQUE 1A · Auth crítico

Fecha: 05-10-2026 (America/Buenos_Aires).
Estado: REQUIERE INTERVENCIÓN. No se cierra el Bloque 1A.

## Estado inicial y saneamiento previo

Proyecto local único: `D:\NosSirve_STAGING_01\NosSirve`.
El saneamiento previo revirtió las modificaciones de administración, eliminó `useAdmin.js` y restauró `signOut()` sin scope explícito.
Se conservaron provisionalmente los cambios de `usuario.js`, `Ingresar.jsx`, `Registro.jsx`, `MiCuenta.jsx` y `destinoAuth.js`.

En esta continuación no se modificó código ni configuración. El único archivo creado es este informe; se verificó previamente que no existía. No se incorporaron secretos.

## Bloqueo de identidad del proyecto remoto

- Ref autorizada en la especificación: `ltaaizlgcktskjurntp`.
- Host observado en `VITE_SUPABASE_URL` de `.env.local`: `ltaaizlgcktskrjurntp.supabase.co`.
- Diferencia: la configuración local incluye una `r` adicional después de `ktsk`.
- El cliente `src/lib/supabase.js` utiliza esa variable directamente.
- No se corrigió ni se asumió cuál ref es válida.

Se abrió el dashboard de la ref autorizada. Redirigió al formulario de inicio de sesión; no mostró configuración del proyecto. Una consulta prevista a `/auth/v1/settings` se abortó en el procesamiento local de la URL, antes de ejecutar `fetch`. No se envió la clave pública a ningún endpoint ni se consultó el proyecto con ref discrepante.

Confirm Email, Site URL, Redirect URLs y configuración remota email/password: NO VERIFICADOS.
Site URL esperada: `https://nossirve.com`.
No se infiere que Confirm Email esté activo o inactivo ni que sean necesarios cambios remotos.

## Revisión de cambios provisionales

Clasificación: A = necesario para los criterios; B = útil no indispensable; C = fuera de alcance; D = riesgo o insuficiencia pendiente.

| Archivo / cambio | Clasificación | Evaluación |
| --- | --- | --- |
| usuario.js: comprobar usuario/sesión en respuestas de registro/login | B / D | Evita dar éxito a respuestas incompletas, pero no comprueba `email_confirmed_at`. No acredita A–B. |
| usuario.js: capturar fallo de conexión en login | B | Mejora el error comunicado al usuario. |
| usuario.js: no sincronizar rol tras registro sin sesión | B | Evita una consulta innecesaria; no reemplaza la confirmación de email. No se modifica administración. |
| usuario.js: comprobar error de logout antes de continuar | A | Necesario para no informar cierre exitoso si falla. Se conserva el scope anterior. |
| usuario.js: opción estricto en consultas de usuario/perfil | B | Distingue errores operativos de ausencia de sesión para MiCuenta. |
| Ingresar.jsx: validar retorno y contexto | A | Vinculado al retorno seguro y continuidad del criterio E. |
| Ingresar.jsx: bloqueo de envíos simultáneos | B | Previene solicitudes duplicadas. |
| Ingresar.jsx: continuar sesión con getUser y eventos Auth | A / D | Vinculado a B–C. Actualmente basta con que exista usuario; falta comprobación explícita de email confirmado. La continuación automática elimina el contexto antes de acreditar que se recuperó el destino/borrador. |
| Registro.jsx: validar retorno/contexto | A | Vinculado a E. |
| Registro.jsx: bloqueo de envíos simultáneos | B | Previene duplicados. |
| MiCuenta.jsx: escuchar eventos y descartar respuestas antiguas | A | Vinculado a C–D; falta QA de cambios de sesión y otras pestañas. |
| MiCuenta.jsx: errores/reintento de perfil y bloqueo de logout simultáneo | B | Útil para distinguir fallos y evitar envíos repetidos. |
| destinoAuth.js: lista de rutas internas válidas | A / D | Protege el retorno; requiere comprobar que cubre todos los destinos realmente usados y no pierde contexto. |

No se identificaron cambios C entre estos cinco archivos que deban revertirse automáticamente. Los D requieren corrección o validación posterior; no se corrigieron por la discrepancia de proyecto.

## Flujo observado en código

- `signUp`: envía email, contraseña y datos de perfil. `requiereConfirmacion` depende de que falte sesión, no de evidencia de confirmación del email.
- `signInWithPassword`: muestra mensaje específico ante `email_not_confirmed`; si Supabase devuelve usuario y sesión sin error, el código acepta el ingreso sin comprobar el campo de confirmación.
- `getUser`: se utiliza para usuario/perfil y otras operaciones; `obtenerUsuarioActual` devuelve cualquier usuario recibido sin validar email confirmado.
- `getSession`: se utiliza en distintas pantallas para detectar sesión, incluyendo PublicarInicio, Mensajes y navegación. Su presencia por sí sola no acredita email confirmado.
- `onAuthStateChange`: existe en ingreso y cuenta; difiere llamadas a Auth fuera del callback. Deben probarse refresh, cambio de cuenta y logout entre pestañas.
- Logout: mantiene `supabase.auth.signOut()`; MiCuenta navega solo después del éxito. No hay limpieza global de localStorage ni de IndexedDB en esa función.
- Recuperación: el botón de ingreso muestra un aviso de funcionalidad futura. No se encontró `resetPasswordForEmail` ni manejo de `PASSWORD_RECOVERY` en `src`. No se implementó una función nueva.
- `emailRedirectTo`: se forma con `window.location.origin + '/ingresar'`. Desde `https://nossirve.com` apunta a `https://nossirve.com/ingresar`; falta comprobar su admisión en Redirect URLs y el Site URL de fallback. No se detectó un localhost fijo en esa función.
- Guards: App no contiene un guard global de email confirmado. No se encontraron comprobaciones `email_confirmed_at`/`confirmed_at` en `src`.
- Estado tras logout: DetallePublicacion conserva una promesa de sesión en `sesionCacheRef`; queda pendiente verificar su invalidación y la exigencia de nueva autenticación para acciones protegidas. No se tocó ese archivo.
- `nos-sirve-ya-ingreso`: personaliza el texto de ingreso; no establece una sesión Supabase.
- Borrador: el de publicación utiliza IndexedDB; el formulario de registro guarda datos y contexto en localStorage. El registro elimina su propio borrador al completarse y conserva el retorno durante confirmación. No se detectó borrado explícito del borrador de publicación en los cinco archivos Auth. La preservación end-to-end sigue pendiente.

## Interpretación con documentación oficial consultada

Supabase indica que Confirm Email exige confirmar antes del primer ingreso y que deshabilitarlo confirma implícitamente los emails. Por eso una comprobación frontend de un campo de confirmación no sustituye verificar esa configuración: [General configuration](https://supabase.com/docs/guides/auth/general-configuration).

Site URL define el destino predeterminado; las URLs de retorno deben ser admitidas por la configuración. Debe comprobarse el dominio productivo y la ruta de ingreso: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

Referencia del flujo email/contraseña y recuperación: [Password-based Auth](https://supabase.com/docs/guides/auth/passwords).

## QA ejecutado y pendiente

Ejecutado: revisión estática de Auth, búsquedas de guard/confirmación/recuperación, lectura del host configurado sin mostrar claves y comprobación de los hashes del estado saneado. No hubo pruebas con cuentas, envío de emails ni escrituras remotas.

Los nueve hashes consultados coinciden con el estado saneado registrado en la conversación. No se modificaron administración, cámara, U2NET, publicación, OAuth, pagos o precio en esta continuación.

Build: NO EJECUTADO. Las correcciones no se iniciaron ni quedaron acreditadas como consistentes; se detuvo el trabajo por la discrepancia de proyecto. No se solicitó ejecución fuera del sandbox en esta continuación.

QA automático funcional: NO EJECUTADO. No se confunde revisión estática o hashes con una prueba end-to-end.

QA manual pendiente:

1. A: cuenta nueva sin confirmar, login rechazado y acciones protegidas bloqueadas.
2. B: confirmar por correo, retornar al dominio correcto, login permitido.
3. C: refresh, cerrar y volver, expiración y fallos de conexión sin estado engañoso.
4. D: logout, volver atrás y otra pestaña; acciones protegidas requieren autenticación.
5. E: borrador con fotos y contexto antes de Auth; atravesar registro/confirmación/login y comprobar que se conserva.

## Hallazgos fuera de alcance

“El estado/interfaz de administración depende de localStorage.
Debe verificarse en bloque de Seguridad si los privilegios reales están
protegidos por backend/RLS/RPC y no solo por interfaz.”

No se investigaron ni modificaron privilegios remotos, RLS o RPC en este bloque.

## Rollback y siguiente paso

Respaldo disponible: `D:\NosSirve_STAGING_01\RESPALDO_BLOQUE_1A_PRE_REENCADRE_05-10-2026`, con manifiesto SHA-256. Es un checkpoint ANTERIOR al saneamiento: restaurarlo completo reintroduciría cambios de administración fuera de alcance. Consultar `docs/BLOQUE_1A_SANEAMIENTO_05-10-2026.md` para reconstruir el estado saneado. En esta continuación no hay cambios de código que revertir.

Siguiente paso exacto: el usuario debe confirmar la ref correcta y autorizar explícitamente la inspección si corresponde a la ref discrepante. Después, habilitar acceso autenticado al dashboard para leer Confirm Email, Site URL, Redirect URLs y email/password. Si Confirm Email está inactivo o las URLs requieren ajuste, detenerse sin modificarlos, según la especificación.

Production deploy: NO REALIZADO. Cambios remotos: NINGUNO. Implementación detenida.
