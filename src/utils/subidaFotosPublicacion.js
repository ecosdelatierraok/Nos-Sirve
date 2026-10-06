import { supabase } from "../lib/supabase";

import {
  actualizarFotoBorrador,
  obtenerBorradorPublicacion,
} from "./borradorPublicacion";


const BUCKET =
  "borradores-publicacion";

const MAX_FOTOS =
  5;

const MAX_REINTENTOS =
  6;

const MAX_PASADAS =
  12;

const TIMEOUT_RPC_MS =
  20000;

const TIMEOUT_UPLOAD_MS =
  45000;


/*
  ======================================================
  COLA LOCAL POR BORRADOR

  Si llegan varias órdenes de subida casi juntas
  para el mismo borrador, NO descartamos ninguna.

  Se ejecutan en orden y cada ejecución vuelve
  a leer el borrador actualizado.

  Esto es especialmente importante en celular,
  donde las fotos pueden ir entrando una por una.
  ======================================================
*/

const colasPorBorrador =
  new Map();


/*
  ======================================================
  UTILIDADES
  ======================================================
*/

function conTimeout(
  promesa,
  milisegundos,
  mensaje
) {
  let temporizador =
    null;

  const limite =
    new Promise(
      (
        _,
        reject
      ) => {
        temporizador =
          globalThis.setTimeout(
            () => {
              const error =
                new Error(
                  mensaje ||
                  "La operación tardó demasiado."
                );

              error.status =
                408;

              reject(
                error
              );
            },
            milisegundos
          );
      }
    );

  return Promise.race([
    promesa,
    limite,
  ]).finally(
    () => {
      if (
        temporizador !==
        null
      ) {
        globalThis.clearTimeout(
          temporizador
        );
      }
    }
  );
}


function esperar(
  milisegundos
) {
  return new Promise(
    (resolve) => {
      globalThis.setTimeout(
        resolve,
        milisegundos
      );
    }
  );
}


function extensionSegunMime(
  tipo
) {
  const mime =
    String(
      tipo || ""
    ).toLowerCase();

  if (
    mime.includes(
      "png"
    )
  ) {
    return "png";
  }

  if (
    mime.includes(
      "webp"
    )
  ) {
    return "webp";
  }

  if (
    mime.includes(
      "heic"
    )
  ) {
    return "heic";
  }

  if (
    mime.includes(
      "heif"
    )
  ) {
    return "heif";
  }

  return "jpg";
}


function esErrorTransitorio(
  error
) {
  const mensaje =
    String(
      error?.message ||
      ""
    ).toLowerCase();

  const codigo =
    Number(
      error?.status ||
      error?.statusCode ||
      0
    );

  return (
    codigo === 0 ||
    codigo === 408 ||
    codigo === 425 ||
    codigo === 429 ||
    codigo === 500 ||
    codigo === 502 ||
    codigo === 503 ||
    codigo === 504 ||
    mensaje.includes(
      "failed to fetch"
    ) ||
    mensaje.includes(
      "network"
    ) ||
    mensaje.includes(
      "timeout"
    ) ||
    mensaje.includes(
      "timed out"
    ) ||
    mensaje.includes(
      "connection"
    ) ||
    mensaje.includes(
      "load failed"
    )
  );
}


function esArchivoYaExistente(
  error
) {
  const mensaje =
    String(
      error?.message ||
      ""
    ).toLowerCase();

  const codigo =
    Number(
      error?.status ||
      error?.statusCode ||
      0
    );

  return (
    codigo === 409 ||
    mensaje.includes(
      "already exists"
    ) ||
    mensaje.includes(
      "duplicate"
    ) ||
    mensaje.includes(
      "resource already exists"
    )
  );
}


function esConflictoUnico(
  error
) {
  const mensaje =
    String(
      error?.message ||
      ""
    ).toLowerCase();

  const codigo =
    String(
      error?.code ||
      ""
    ).toLowerCase();

  return (
    codigo === "23505" ||
    mensaje.includes(
      "duplicate key"
    ) ||
    mensaje.includes(
      "unique constraint"
    )
  );
}


async function ejecutarConReintentos(
  operacion
) {
  let ultimoError =
    null;

  for (
    let intento = 1;
    intento <=
    MAX_REINTENTOS;
    intento += 1
  ) {
    try {
      return await operacion(
        intento
      );
    } catch (error) {
      ultimoError =
        error;

      if (
        !esErrorTransitorio(
          error
        ) ||
        intento ===
          MAX_REINTENTOS
      ) {
        throw error;
      }

      const demora =
        Math.min(
          8000,

          600 *
            2 **
              (
                intento -
                1
              )
        );

      await esperar(
        demora
      );
    }
  }

  throw ultimoError;
}


/*
  ======================================================
  NORMALIZACIÓN ROBUSTA DE RPC
  ======================================================
*/

function normalizarFilaRpc(
  valor
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  if (
    typeof valor ===
    "string"
  ) {
    try {
      return normalizarFilaRpc(
        JSON.parse(
          valor
        )
      );
    } catch {
      return null;
    }
  }

  if (
    Array.isArray(
      valor
    )
  ) {
    for (
      const elemento of
      valor
    ) {
      const fila =
        normalizarFilaRpc(
          elemento
        );

      if (
        fila?.id
      ) {
        return fila;
      }
    }

    return null;
  }

  if (
    typeof valor ===
    "object"
  ) {
    if (
      valor.id
    ) {
      return valor;
    }

    const valores =
      Object.values(
        valor
      );

    for (
      const contenido of
      valores
    ) {
      if (
        contenido ===
        valor
      ) {
        continue;
      }

      const fila =
        normalizarFilaRpc(
          contenido
        );

      if (
        fila?.id
      ) {
        return fila;
      }
    }
  }

  return null;
}


async function ejecutarRpcFila(
  nombre,
  parametros
) {
  const respuesta =
    await ejecutarConReintentos(
      async () => {
        const resultado =
          await conTimeout(
            supabase.rpc(
              nombre,
              parametros
            ),
            TIMEOUT_RPC_MS,
            `La operación ${nombre} tardó demasiado.`
          );

        if (
          resultado.error
        ) {
          throw resultado.error;
        }

        return resultado;
      }
    );

  return normalizarFilaRpc(
    respuesta?.data
  );
}


/*
  ======================================================
  SESIÓN
  ======================================================
*/

async function obtenerUsuarioOpcional() {
  try {
    const {
      data,
      error,
    } =
      await supabase.auth
        .getSession();

    if (error) {
      return null;
    }

    return (
      data?.session?.user ||
      null
    );
  } catch {
    return null;
  }
}


/*
  ======================================================
  BORRADOR TEMPORAL SERVIDOR
  ======================================================
*/

async function obtenerBorradorTemporalServidor(
  tokenPublico
) {
  return ejecutarRpcFila(
    "obtener_borrador_publicacion_temporal",
    {
      p_token_publico:
        tokenPublico,
    }
  );
}


async function crearBorradorTemporalServidor(
  tokenPublico
) {
  try {
    return await ejecutarRpcFila(
      "crear_borrador_publicacion_temporal",
      {
        p_token_publico:
          tokenPublico,

        p_datos:
          {},
      }
    );
  } catch (error) {
    if (
      esConflictoUnico(
        error
      )
    ) {
      const existente =
        await obtenerBorradorTemporalServidor(
          tokenPublico
        );

      if (existente) {
        return existente;
      }
    }

    throw error;
  }
}


export async function asegurarBorradorTemporalServidor(
  borradorRecibido =
    null
) {
  const borrador =
    borradorRecibido ||
    await obtenerBorradorPublicacion();

  if (!borrador) {
    throw new Error(
      "No encontramos la publicación que estabas preparando."
    );
  }

  if (
    !borrador.borradorId
  ) {
    throw new Error(
      "La publicación no tiene un identificador válido."
    );
  }

  const tokenPublico =
    borrador.borradorId;

  let temporal =
    await obtenerBorradorTemporalServidor(
      tokenPublico
    );

  if (!temporal) {
    temporal =
      await crearBorradorTemporalServidor(
        tokenPublico
      );
  }

  if (
    !temporal?.id
  ) {
    throw new Error(
      "No pudimos asegurar el borrador en el servidor."
    );
  }

  const usuario =
    await obtenerUsuarioOpcional();

  if (
    usuario?.id
  ) {
    temporal =
      await reclamarBorradorPublicacionTemporal(
        borrador
      );
  }

  return {
    tokenPublico,

    borradorTemporalId:
      temporal.id,

    estado:
      temporal.estado ||
      null,

    reclamadoPor:
      temporal.reclamado_por ||
      null,
  };
}


export async function reclamarBorradorPublicacionTemporal(
  borradorRecibido =
    null
) {
  const borrador =
    borradorRecibido ||
    await obtenerBorradorPublicacion();

  if (
    !borrador?.borradorId
  ) {
    throw new Error(
      "No encontramos un borrador válido para asociar a tu cuenta."
    );
  }

  const {
    data: {
      user,
    },

    error:
      errorUsuario,
  } =
    await supabase.auth
      .getUser();

  if (
    errorUsuario ||
    !user?.id
  ) {
    throw new Error(
      "Tenés que ingresar a tu cuenta para continuar."
    );
  }

  const temporal =
    await ejecutarRpcFila(
      "reclamar_borrador_publicacion_temporal",
      {
        p_token_publico:
          borrador.borradorId,
      }
    );

  if (
    !temporal?.id
  ) {
    throw new Error(
      "No pudimos asociar el borrador a tu cuenta."
    );
  }

  return temporal;
}


/*
  ======================================================
  STORAGE
  ======================================================
*/

function generarRutaOriginal({
  tokenPublico,
  foto,
  posicion,
}) {
  const extension =
    extensionSegunMime(
      foto?.archivo?.type ||
      foto?.tipo
    );

  return (
    `${tokenPublico}/` +
    `originales/` +
    `foto-${posicion}-${foto.id}.${extension}`
  );
}


function rutaPerteneceAPosicion(
  ruta,
  tokenPublico,
  posicion
) {
  if (
    !ruta ||
    !tokenPublico ||
    !Number.isInteger(
      Number(posicion)
    )
  ) {
    return false;
  }

  const prefijoEsperado =
    `${tokenPublico}/originales/foto-${Number(posicion)}-`;

  return String(
    ruta
  ).startsWith(
    prefijoEsperado
  );
}


async function subirOriginal({
  ruta,
  archivo,
}) {
  await ejecutarConReintentos(
    async () => {
      const {
        error,
      } =
        await conTimeout(
          supabase.storage
            .from(
              BUCKET
            )
            .upload(
              ruta,
              archivo,
              {
                contentType:
                  archivo.type ||
                  "application/octet-stream",

                cacheControl:
                  "31536000",

                upsert:
                  false,
              }
            ),
          TIMEOUT_UPLOAD_MS,
          "La subida de una foto tardó demasiado."
        );

      if (
        error &&
        !esArchivoYaExistente(
          error
        )
      ) {
        throw error;
      }
    }
  );
}


/*
  ======================================================
  REGISTRO SERVIDOR
  ======================================================
*/

async function registrarOriginal({
  tokenPublico,
  posicion,
  ruta,
  archivo,
}) {
  await ejecutarConReintentos(
    async () => {
      const {
        error,
      } =
        await conTimeout(
          supabase.rpc(
            "registrar_archivo_borrador_temporal",
            {
              p_token_publico:
                tokenPublico,

              p_posicion:
                posicion,

              p_ruta:
                ruta,

              p_mime_type:
                archivo.type ||
                null,

              p_bytes:
                Number(
                  archivo.size ||
                  0
                ),
            }
          ),
          TIMEOUT_RPC_MS,
          "El registro de la foto tardó demasiado."
        );

      if (error) {
        throw error;
      }
    }
  );
}


/*
  ======================================================
  UNA FOTO
  ======================================================
*/

async function subirUnaFoto({
  tokenPublico,
  foto,
  posicion,
}) {
  if (
    !foto?.id ||
    !(
      foto?.archivo instanceof
      Blob
    )
  ) {
    throw new Error(
      `La foto ${posicion} no está disponible para subir.`
    );
  }

  /*
    Si localmente figura SUBIDA, no confiamos
    ciegamente.

    La ruta no solo debe pertenecer al borrador:
    también debe corresponder a la POSICIÓN actual.
    Esto es clave cuando la persona reordena fotos
    o cambia la portada: la posición puede cambiar
    aunque la foto siga siendo la misma.

    Si la ruta quedó asociada a otra posición,
    la tratamos como pendiente y la volvemos a
    registrar bajo la ruta correcta.
  */

  if (
    foto.subidaServidor &&
    rutaPerteneceAPosicion(
      foto.rutaOriginal,
      tokenPublico,
      posicion
    )
  ) {
    await registrarOriginal({
      tokenPublico,

      posicion,

      ruta:
        foto.rutaOriginal,

      archivo:
        foto.archivo,
    });

    return {
      fotoId:
        foto.id,

      posicion,

      rutaOriginal:
        foto.rutaOriginal,

      bucket:
        BUCKET,

      yaEstaba:
        true,
    };
  }

  await actualizarFotoBorrador(
    foto.id,
    {
      estadoSubida:
        "SUBIENDO",

      ultimoErrorSubida:
        null,
    }
  );

  const ruta =
    generarRutaOriginal({
      tokenPublico,
      foto,
      posicion,
    });

  try {
    await subirOriginal({
      ruta,

      archivo:
        foto.archivo,
    });

    await registrarOriginal({
      tokenPublico,
      posicion,
      ruta,

      archivo:
        foto.archivo,
    });

    await actualizarFotoBorrador(
      foto.id,
      {
        subidaServidor:
          true,

        estadoSubida:
          "SUBIDA",

        rutaOriginal:
          ruta,

        ultimoErrorSubida:
          null,
      }
    );

    return {
      fotoId:
        foto.id,

      posicion,

      rutaOriginal:
        ruta,

      bucket:
        BUCKET,

      yaEstaba:
        false,
    };
  } catch (error) {
    await actualizarFotoBorrador(
      foto.id,
      {
        subidaServidor:
          false,

        estadoSubida:
          "ERROR",

        ultimoErrorSubida:
          error?.message ||
          "No pudimos guardar esta foto.",
      }
    );

    throw error;
  }
}


/*
  ======================================================
  VERIFICACIÓN LOCAL
  ======================================================
*/

function fotoEstaSegura(
  foto,
  tokenPublico,
  posicion
) {
  return Boolean(
    foto?.subidaServidor &&
    foto?.estadoSubida ===
      "SUBIDA" &&
    rutaPerteneceAPosicion(
      foto?.rutaOriginal,
      tokenPublico,
      posicion
    )
  );
}


/*
  ======================================================
  PROCESAR BORRADOR HASTA QUEDAR ESTABLE
  ======================================================
*/

async function procesarBorradorHastaEstable(
  borradorInicial
) {
  const borradorId =
    borradorInicial?.borradorId;

  if (
    !borradorId
  ) {
    throw new Error(
      "La publicación no tiene un identificador válido."
    );
  }

  let temporal =
    null;

  let ultimaCantidad =
    -1;

  let pasadasEstables =
    0;

  let resultadosFinales =
    [];

  for (
    let pasada = 1;
    pasada <=
    MAX_PASADAS;
    pasada += 1
  ) {
    const borradorActual =
      await obtenerBorradorPublicacion();

    if (
      !borradorActual ||
      borradorActual.borradorId !==
        borradorId
    ) {
      throw new Error(
        "El borrador cambió mientras guardábamos las fotos."
      );
    }

    const fotos =
      Array.isArray(
        borradorActual.fotos
      )
        ? borradorActual.fotos.slice(
            0,
            MAX_FOTOS
          )
        : [];

    if (
      fotos.length ===
      0
    ) {
      throw new Error(
        "La publicación necesita al menos una foto."
      );
    }

    if (!temporal) {
      temporal =
        await asegurarBorradorTemporalServidor(
          borradorActual
        );
    }

    const tokenPublico =
      temporal.tokenPublico;

    const resultados =
      [];

    for (
      let indice = 0;
      indice <
      fotos.length;
      indice += 1
    ) {
      const foto =
        fotos[
          indice
        ];

      const resultado =
        await subirUnaFoto({
          tokenPublico,

          foto,

          posicion:
            indice + 1,
        });

      resultados.push(
        resultado
      );
    }

    resultadosFinales =
      resultados;

    const verificacion =
      await obtenerBorradorPublicacion();

    if (
      !verificacion ||
      verificacion.borradorId !==
        borradorId
    ) {
      throw new Error(
        "El borrador cambió durante la verificación."
      );
    }

    const fotosVerificadas =
      Array.isArray(
        verificacion.fotos
      )
        ? verificacion.fotos.slice(
            0,
            MAX_FOTOS
          )
        : [];

    const seguras =
      fotosVerificadas.filter(
        (
          foto,
          indice
        ) =>
          fotoEstaSegura(
            foto,
            tokenPublico,
            indice + 1
          )
      ).length;

    const cantidadActual =
      fotosVerificadas.length;

    const completas =
      cantidadActual > 0 &&
      seguras ===
        cantidadActual;

    if (
      completas &&
      cantidadActual ===
        ultimaCantidad
    ) {
      pasadasEstables +=
        1;
    } else {
      pasadasEstables =
        0;
    }

    ultimaCantidad =
      cantidadActual;

    if (
      completas &&
      pasadasEstables >=
        1
    ) {
      return {
        ok:
          true,

        borradorId,

        tokenPublico,

        borradorTemporalId:
          temporal.borradorTemporalId,

        estado:
          temporal.estado,

        cantidad:
          cantidadActual,

        fotos:
          resultadosFinales,
      };
    }

    await esperar(
      350
    );
  }

  const final =
    await obtenerBorradorPublicacion();

  const fotosFinales =
    Array.isArray(
      final?.fotos
    )
      ? final.fotos.slice(
          0,
          MAX_FOTOS
        )
      : [];

  const tokenPublico =
    temporal?.tokenPublico ||
    borradorId;

  const seguras =
    fotosFinales.filter(
      (
        foto,
        indice
      ) =>
        fotoEstaSegura(
          foto,
          tokenPublico,
          indice + 1
        )
    ).length;

  throw new Error(
    `No pudimos terminar de resguardar todas las fotos: ${seguras}/${fotosFinales.length}.`
  );
}


/*
  ======================================================
  TODAS LAS FOTOS DEL BORRADOR
  ======================================================
*/

export async function subirFotosPendientesPublicacion(
  borradorRecibido =
    null
) {
  const borrador =
    borradorRecibido ||
    await obtenerBorradorPublicacion();

  if (!borrador) {
    throw new Error(
      "No encontramos la publicación que estabas preparando."
    );
  }

  if (
    !borrador.borradorId
  ) {
    throw new Error(
      "La publicación no tiene un identificador válido."
    );
  }

  const borradorId =
    borrador.borradorId;

  const anterior =
    colasPorBorrador.get(
      borradorId
    ) ||
    Promise.resolve();

  const actual =
    anterior
      .catch(
        () => {
          // La siguiente ejecución continúa.
        }
      )
      .then(
        async () => {
          const masReciente =
            await obtenerBorradorPublicacion();

          const base =
            (
              masReciente?.borradorId ===
              borradorId
            )
              ? masReciente
              : borrador;

          return procesarBorradorHastaEstable(
            base
          );
        }
      );

  colasPorBorrador.set(
    borradorId,
    actual
  );

  try {
    return await actual;
  } finally {
    if (
      colasPorBorrador.get(
        borradorId
      ) ===
      actual
    ) {
      colasPorBorrador.delete(
        borradorId
      );
    }
  }
}


/*
  ======================================================
  ESTADO LOCAL
  ======================================================
*/

export async function obtenerEstadoSubidaFotos() {
  const borrador =
    await obtenerBorradorPublicacion();

  const fotos =
    Array.isArray(
      borrador?.fotos
    )
      ? borrador.fotos.slice(
          0,
          MAX_FOTOS
        )
      : [];

  const tokenPublico =
    borrador?.borradorId ||
    null;

  const total =
    fotos.length;

  const subidas =
    fotos.filter(
      (
        foto,
        indice
      ) =>
        fotoEstaSegura(
          foto,
          tokenPublico,
          indice + 1
        )
    ).length;

  const conError =
    fotos.filter(
      (
        foto
      ) =>
        foto?.estadoSubida ===
        "ERROR"
    ).length;

  const subiendo =
    fotos.filter(
      (
        foto
      ) =>
        foto?.estadoSubida ===
        "SUBIENDO"
    ).length;

  return {
    total,

    subidas,

    conError,

    subiendo,

    completas:
      total > 0 &&
      subidas ===
        total,
  };
}