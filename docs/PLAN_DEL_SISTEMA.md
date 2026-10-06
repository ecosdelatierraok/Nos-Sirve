# Remate Express 1.0

## Objetivo principal

Crear una PWA donde vivan todos los remates vigentes, para no tener que republicarlos todos los días en WhatsApp.

WhatsApp será la puerta de entrada y canal de comunicación.
La PWA será el lugar donde se ven los remates y se ofertan.

---

## Roles

- Curadora de la comunidad: Gabi.
- Quien ofrece el objeto.
- Ofertante.
- Quien le da un nuevo hogar.

---

## Lenguaje Remate Express

No usamos "venta".
Usamos "remate".

No usamos "administrador".
Usamos "curadora".

No usamos "comprador".
Usamos "quien le da un nuevo hogar".

No usamos "vendedor".
Usamos "quien ofrece el objeto".

No usamos "producto".
Usamos "objeto".

---

## Pantalla principal

Debe mostrar:

- Logo Remate Express.
- Remates vigentes.
- Tarjetas de cada remate.

Cada tarjeta debe mostrar:

- Foto principal.
- Número de remate.
- Título.
- Ubicación.
- Base de remate.
- Oferta más alta.
- Tiempo restante.
- Botón Ver remate.

---

## Ficha del remate

Debe mostrar:

- Fotos.
- Número de remate.
- Ubicación.
- Título.
- Descripción.
- Estado o detalles.
- Base de remate.
- Incremento mínimo.
- Oferta más alta vigente.
- Tiempo restante.
- Botón Ofertar.
- Mensaje final / neuroventa.

---

## Oferta

La persona debe ver:

- Oferta más alta vigente.
- Próxima oferta sugerida.
- Campo para ingresar oferta.
- Botón Confirmar oferta.

Regla:

La oferta debe ser mayor a la oferta más alta vigente.
Si no lo es, el sistema no la acepta.

---

## Cierre del remate

Si hay ofertas:
- Gana automáticamente la mayor oferta al cierre.

Si no hay ofertas:
- El remate se reactiva automáticamente 24 horas más.

La reactivación es infinita hasta que Gabi lo cierre manualmente.

---

## Notificaciones

Cuando un remate finaliza con ganador:

- El sistema marca el remate como finalizado.
- Muestra quién ganó.
- Genera pendiente para que Gabi coordine.
- Idealmente avisa a la persona ganadora.

---

## Comisión

La comisión de Remate Express es el 10% del valor final adjudicado.

Ejemplo:

Precio final: $30.000
Remate Express: $3.000
Quien ofrece el objeto: $27.000
---

# Modelo del Remate

Cada remate tendrá la siguiente información:

## Identificación

- Número de remate
- Estado (Activo / Finalizado / Adjudicado / Cancelado)

## Publicación

- Título
- Descripción
- Mensaje final (neuroventa)
- Ubicación
- Fotos

## Valores

- Base de remate
- Incremento mínimo
- Oferta más alta vigente

## Fechas

- Fecha y hora de inicio
- Fecha y hora de cierre

## Participación

- Historial de ofertas
- Ganador (si existe)

## Administración

- Quien ofrece el objeto
- Comisión Remate Express
- Observaciones internas de la Curadora