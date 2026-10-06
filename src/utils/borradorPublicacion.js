const DB_NAME =
  "segunda-vuelta";

const DB_VERSION =
  1;

const STORE_BORRADOR =
  "borrador-publicacion";

const BORRADOR_ID =
  "publicacion-actual";

const MAX_FOTOS =
  5;


/*
  ======================================================
  IDENTIFICADORES
  ======================================================
*/

function generarUuid() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
      .replace(
        /[xy]/g,
        (caracter) => {
          const aleatorio =
            Math.floor(
              Math.random() * 16
            );

          const valor =
            caracter === "x"
              ? aleatorio
              : (
                  aleatorio &
                  0x3
                ) |
                0x8;

          return valor.toString(
            16
          );
        }
      )
  );
}

function fechaIso() {
  return new Date()
    .toISOString();
}


/*
  ======================================================
  INDEXED DB
  ======================================================
*/

function abrirBase() {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onupgradeneeded =
        () => {
          const db =
            request.result;

          if (
            !db.objectStoreNames
              .contains(
                STORE_BORRADOR
              )
          ) {
            db.createObjectStore(
              STORE_BORRADOR,
              {
                keyPath:
                  "id",
              }
            );
          }
        };

      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };

      request.onerror =
        () => {
          reject(
            request.error
          );
        };
    }
  );
}

function transaccionPromesa(
  transaccion
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      transaccion.oncomplete =
        () =>
          resolve();

      transaccion.onerror =
        () => {
          reject(
            transaccion.error
          );
        };

      transaccion.onabort =
        () => {
          reject(
            transaccion.error
          );
        };
    }
  );
}

function requestPromesa(
  request
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };

      request.onerror =
        () => {
          reject(
            request.error
          );
        };
    }
  );
}

async function leerBorradorCrudo() {
  const db =
    await abrirBase();

  try {
    const transaccion =
      db.transaction(
        STORE_BORRADOR,
        "readonly"
      );

    const store =
      transaccion.objectStore(
        STORE_BORRADOR
      );

    const resultado =
      await requestPromesa(
        store.get(
          BORRADOR_ID
        )
      );

    await transaccionPromesa(
      transaccion
    );

    return (
      resultado ||
      null
    );
  } finally {
    db.close();
  }
}

async function escribirBorradorCrudo(
  datos
) {
  const db =
    await abrirBase();

  try {
    const transaccion =
      db.transaction(
        STORE_BORRADOR,
        "readwrite"
      );

    transaccion
      .objectStore(
        STORE_BORRADOR
      )
      .put(
        datos
      );

    await transaccionPromesa(
      transaccion
    );

    return datos;
  } finally {
    db.close();
  }
}


/*
  ======================================================
  NORMALIZACIÓN / MIGRACIÓN
  ======================================================
*/

function crearBorradorBase() {
  const ahora =
    fechaIso();

  return {
    id:
      BORRADOR_ID,

    borradorId:
      generarUuid(),

    creadoEn:
      ahora,

    actualizadoEn:
      ahora,

    fotos:
      [],
  };
}

function normalizarFoto(
  foto
) {
  if (!foto) {
    return null;
  }

  return {
    ...foto,

    id:
      foto.id ||
      generarUuid(),

    subidaServidor:
      Boolean(
        foto.subidaServidor
      ),

    estadoSubida:
      foto.estadoSubida ||
      "LOCAL",

    rutaOriginal:
      foto.rutaOriginal ||
      null,

    rutaPublica:
      foto.rutaPublica ||
      null,

    ultimoErrorSubida:
      foto.ultimoErrorSubida ||
      null,
  };
}

function normalizarBorrador(
  borrador
) {
  if (!borrador) {
    return null;
  }

  const fotos =
    Array.isArray(
      borrador.fotos
    )
      ? borrador.fotos
          .map(
            normalizarFoto
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            MAX_FOTOS
          )
      : [];

  return {
    ...borrador,

    id:
      BORRADOR_ID,

    borradorId:
      borrador.borradorId ||
      generarUuid(),

    creadoEn:
      borrador.creadoEn ||
      fechaIso(),

    actualizadoEn:
      borrador.actualizadoEn ||
      fechaIso(),

    fotos,
  };
}


/*
  ======================================================
  MUTACIÓN ATÓMICA

  Todas las escrituras pasan por UNA transacción
  readwrite de IndexedDB. Así una subida en segundo plano
  no puede pisar una foto que acaba de entrar, ni una foto
  nueva puede borrar el estado de subida de otra.
  ======================================================
*/

async function mutarBorradorAtomico(
  mutador
) {
  const db =
    await abrirBase();

  try {
    const transaccion =
      db.transaction(
        STORE_BORRADOR,
        "readwrite"
      );

    const store =
      transaccion.objectStore(
        STORE_BORRADOR
      );

    const crudo =
      await requestPromesa(
        store.get(
          BORRADOR_ID
        )
      );

    const actual =
      crudo
        ? normalizarBorrador(
            crudo
          )
        : crearBorradorBase();

    const proximoCrudo =
      mutador(
        actual
      );

    if (
      proximoCrudo ===
      null
    ) {
      store.delete(
        BORRADOR_ID
      );

      await transaccionPromesa(
        transaccion
      );

      return null;
    }

    const proximo =
      normalizarBorrador({
        ...proximoCrudo,

        id:
          BORRADOR_ID,

        borradorId:
          proximoCrudo?.borradorId ||
          actual.borradorId,

        creadoEn:
          proximoCrudo?.creadoEn ||
          actual.creadoEn,

        actualizadoEn:
          fechaIso(),
      });

    store.put(
      proximo
    );

    await transaccionPromesa(
      transaccion
    );

    return proximo;
  } finally {
    db.close();
  }
}


/*
  ======================================================
  BORRADOR
  ======================================================
*/

export async function obtenerBorradorPublicacion() {
  const crudo =
    await leerBorradorCrudo();

  if (!crudo) {
    return null;
  }

  const normalizado =
    normalizarBorrador(
      crudo
    );

  const necesitaMigracion =
    !crudo.borradorId ||
    !Array.isArray(
      crudo.fotos
    ) ||
    crudo.fotos.some(
      (foto) =>
        !foto?.id ||
        foto.estadoSubida ===
          undefined
    );

  if (
    necesitaMigracion
  ) {
    await escribirBorradorCrudo(
      normalizado
    );
  }

  return normalizado;
}

export async function guardarBorradorPublicacion(
  cambios = {}
) {
  return mutarBorradorAtomico(
    (actual) => ({
      ...actual,
      ...cambios,

      id:
        BORRADOR_ID,

      borradorId:
        actual.borradorId,

      creadoEn:
        actual.creadoEn,
    })
  );
}


/*
  ======================================================
  FOTOS
  ======================================================
*/

export async function guardarFotosBorrador(
  archivos = []
) {
  const fotosNuevas =
    Array.from(
      archivos
    )
      .filter(
        (archivo) =>
          archivo instanceof
          Blob
      )
      .slice(
        0,
        MAX_FOTOS
      );

  return mutarBorradorAtomico(
    (actual) => {
      const fotosActuales =
        Array.isArray(
          actual.fotos
        )
          ? actual.fotos
          : [];

      const disponibles =
        Math.max(
          0,
          MAX_FOTOS -
            fotosActuales.length
        );

      const fotosParaAgregar =
        fotosNuevas.slice(
          0,
          disponibles
        );

      const ahora =
        fechaIso();

      const fotosPreparadas =
        fotosParaAgregar.map(
          (
            archivo,
            indice
          ) => ({
            id:
              generarUuid(),

            archivo,

            nombre:
              archivo.name ||
              `foto-${Date.now()}-${indice + 1}.jpg`,

            tipo:
              archivo.type ||
              "image/jpeg",

            tamanio:
              archivo.size ||
              0,

            creadaEn:
              ahora,

            subidaServidor:
              false,

            estadoSubida:
              "LOCAL",

            rutaOriginal:
              null,

            rutaPublica:
              null,

            ultimoErrorSubida:
              null,
          })
        );

      return {
        ...actual,

        fotos: [
          ...fotosActuales,
          ...fotosPreparadas,
        ].slice(
          0,
          MAX_FOTOS
        ),
      };
    }
  );
}

export async function actualizarFotoBorrador(
  fotoId,
  cambios = {}
) {
  return mutarBorradorAtomico(
    (actual) => {
      const fotos =
        Array.isArray(
          actual.fotos
        )
          ? actual.fotos
          : [];

      return {
        ...actual,

        fotos:
          fotos.map(
            (foto) =>
              foto.id ===
              fotoId
                ? {
                    ...foto,
                    ...cambios,

                    id:
                      foto.id,
                  }
                : foto
          ),
      };
    }
  );
}

export async function eliminarFotoBorrador(
  fotoId
) {
  return mutarBorradorAtomico(
    (actual) => {
      const fotos =
        Array.isArray(
          actual.fotos
        )
          ? actual.fotos
          : [];

      return {
        ...actual,

        fotos:
          fotos.filter(
            (foto) =>
              foto.id !==
              fotoId
          ),
      };
    }
  );
}

export async function reemplazarFotosBorrador(
  fotos = []
) {
  return mutarBorradorAtomico(
    (actual) => ({
      ...actual,

      fotos:
        Array.isArray(
          fotos
        )
          ? fotos
              .map(
                normalizarFoto
              )
              .filter(
                Boolean
              )
              .slice(
                0,
                MAX_FOTOS
              )
          : [],
    })
  );
}


/*
  ======================================================
  BORRADO DEFINITIVO
  ======================================================
*/

export async function borrarBorradorPublicacion() {
  return mutarBorradorAtomico(
    () =>
      null
  );
}