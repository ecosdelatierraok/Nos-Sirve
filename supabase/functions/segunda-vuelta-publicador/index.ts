import {
  createClient,
} from "npm:@supabase/supabase-js@2";

import {
  createSupabaseContext,
} from "npm:@supabase/server";


const BATCH_SIZE = 5;

const BUCKET_TEMPORAL =
  "borradores-publicacion";

const BUCKET_PUBLICO =
  "publicaciones";


function json(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(
      body,
      null,
      2,
    ),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}


function texto(
  valor: unknown,
) {
  return String(
    valor ?? "",
  ).trim();
}


function numeroPositivo(
  valor: unknown,
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}


function numeroOpcional(
  valor: unknown,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}


function cantidadFotosEsperadas(
  trabajo: any,
) {
  const fotos =
    trabajo?.fotos;

  if (
    Array.isArray(
      fotos,
    )
  ) {
    const cantidad =
      fotos.filter(
        Boolean,
      ).length;

    if (
      cantidad >= 1 &&
      cantidad <= 5
    ) {
      return cantidad;
    }
  }

  return null;
}


function sanitizarDatosEspecificos(
  valor: unknown,
) {
  if (
    !valor ||
    typeof valor !== "object" ||
    Array.isArray(valor)
  ) {
    return {};
  }

  const resultado: Record<
    string,
    string | string[]
  > = {};

  for (
    const [
      claveOriginal,
      dato,
    ] of Object.entries(
      valor as Record<
        string,
        unknown
      >,
    )
  ) {
    const clave =
      texto(
        claveOriginal,
      );

    if (!clave) {
      continue;
    }

    if (
      dato === null ||
      dato === undefined
    ) {
      continue;
    }

    if (
      Array.isArray(
        dato,
      )
    ) {
      const lista =
        dato
          .map(
            (item) =>
              texto(item),
          )
          .filter(
            Boolean,
          );

      if (
        lista.length > 0
      ) {
        resultado[
          clave
        ] = lista;
      }

      continue;
    }

    const valorTexto =
      texto(
        dato,
      );

    if (
      valorTexto
    ) {
      resultado[
        clave
      ] =
        valorTexto;
    }
  }

  return resultado;
}


function armarFechaCierre(
  fecha: unknown,
  hora: unknown,
) {
  const fechaTexto =
    texto(fecha);

  const horaTexto =
    texto(hora);

  if (
    !fechaTexto ||
    !horaTexto
  ) {
    return null;
  }

  return (
    `${fechaTexto}` +
    `T${horaTexto}:00-03:00`
  );
}


function fechaCierreEsFutura(
  fechaCierre: string | null,
) {
  if (
    !fechaCierre
  ) {
    return false;
  }

  const tiempo =
    new Date(
      fechaCierre,
    ).getTime();

  return (
    Number.isFinite(
      tiempo,
    ) &&
    tiempo >
      Date.now()
  );
}


function esErrorExistente(
  error: any,
) {
  const mensaje =
    texto(
      error?.message,
    ).toLowerCase();

  const codigo =
    Number(
      error?.statusCode ||
      error?.status ||
      0,
    );

  return (
    codigo === 409 ||
    mensaje.includes(
      "already exists",
    ) ||
    mensaje.includes(
      "resource already exists",
    ) ||
    mensaje.includes(
      "duplicate",
    )
  );
}


function esViolacionUnica(
  error: any,
) {
  return (
    texto(
      error?.code,
    ) === "23505"
  );
}


const SUPABASE_URL =
  texto(
    Deno.env.get(
      "SUPABASE_URL",
    ),
  ).replace(
    /\/rest\/v1\/?$/i,
    "",
  ).replace(
    /\/+$/,
    "",
  );

function obtenerClaveSupabaseAdmin() {
  const clavesNuevas =
    texto(
      Deno.env.get(
        "SUPABASE_SECRET_KEYS",
      ),
    );

  if (clavesNuevas) {
    try {
      const mapa =
        JSON.parse(
          clavesNuevas,
        );

      const claveDefault =
        texto(
          mapa?.default,
        );

      if (claveDefault) {
        return claveDefault;
      }
    } catch (error) {
      console.error(
        "No se pudo leer SUPABASE_SECRET_KEYS:",
        error,
      );
    }
  }

  // Compatibilidad temporal mientras se retira la clave legacy.
  return texto(
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
  );
}


const SUPABASE_ADMIN_KEY =
  obtenerClaveSupabaseAdmin();


if (
  !SUPABASE_URL
) {
  throw new Error(
    "Falta SUPABASE_URL.",
  );
}

if (
  !SUPABASE_ADMIN_KEY
) {
  throw new Error(
    "Falta SUPABASE_SECRET_KEYS/default o SUPABASE_SERVICE_ROLE_KEY.",
  );
}


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_ADMIN_KEY,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    },
  );


async function autenticarServidor(
  request: Request,
) {
  const {
    data,
    error,
  } =
    await createSupabaseContext(
      request,
      {
        auth:
          "secret",
      },
    );

  if (
    error ||
    !data
  ) {
    return false;
  }

  return true;
}


async function obtenerPublicacionExistente(
  usuarioId: string,
  intentoId: string,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "publicaciones",
      )
      .select(
        "id, numero, titulo, estado, intento_publicacion_id",
      )
      .eq(
        "creado_por",
        usuarioId,
      )
      .eq(
        "intento_publicacion_id",
        intentoId,
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return (
    data ||
    null
  );
}


async function obtenerBorradorTemporal(
  intentoId: string,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "borradores_publicacion_temporales",
      )
      .select(
        [
          "id",
          "token_publico",
          "estado",
          "creado_por",
          "reclamado_por",
          "expira_at",
        ].join(","),
      )
      .eq(
        "token_publico",
        intentoId,
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return (
    data ||
    null
  );
}


async function obtenerImagenesProcesadas(
  borradorTemporalId: string,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "archivos_borrador_temporal",
      )
      .select(
        [
          "id",
          "posicion",
          "tipo",
          "bucket",
          "ruta",
          "mime_type",
          "bytes",
          "estado",
        ].join(","),
      )
      .eq(
        "borrador_temporal_id",
        borradorTemporalId,
      )
      .eq(
        "tipo",
        "PROCESADA",
      )
      .eq(
        "estado",
        "LISTO",
      )
      .order(
        "posicion",
        {
          ascending:
            true,
        },
      );

  if (
    error
  ) {
    throw error;
  }

  return (
    data ||
    []
  );
}


function rutaPublicaFinal({
  usuarioId,
  intentoId,
  posicion,
}: {
  usuarioId: string;
  intentoId: string;
  posicion: number;
}) {
  return (
    `${usuarioId}/` +
    `intento-${intentoId}/` +
    `procesadas/` +
    `foto-${posicion}.webp`
  );
}


async function copiarImagenAPublica({
  rutaOrigen,
  rutaDestino,
}: {
  rutaOrigen: string;
  rutaDestino: string;
}) {
  const {
    data: datos,
    error:
      errorDescarga,
  } =
    await supabase.storage
      .from(
        BUCKET_TEMPORAL,
      )
      .download(
        rutaOrigen,
      );

  if (
    errorDescarga
  ) {
    throw errorDescarga;
  }

  if (
    !datos ||
    datos.size <= 0
  ) {
    throw new Error(
      `La imagen procesada está vacía: ${rutaOrigen}`,
    );
  }

  const {
    error:
      errorSubida,
  } =
    await supabase.storage
      .from(
        BUCKET_PUBLICO,
      )
      .upload(
        rutaDestino,
        datos,
        {
          contentType:
            "image/webp",

          cacheControl:
            "31536000",

          upsert:
            false,
        },
      );

  if (
    errorSubida &&
    !esErrorExistente(
      errorSubida,
    )
  ) {
    throw errorSubida;
  }

  const {
    data:
      datosPublicos,
  } =
    supabase.storage
      .from(
        BUCKET_PUBLICO,
      )
      .getPublicUrl(
        rutaDestino,
      );

  if (
    !datosPublicos?.publicUrl
  ) {
    throw new Error(
      `No se pudo obtener la URL pública de ${rutaDestino}`,
    );
  }

  return (
    datosPublicos.publicUrl
  );
}


async function prepararImagenesPublicas({
  usuarioId,
  intentoId,
  borradorTemporalId,
  cantidadEsperada,
}: {
  usuarioId: string;
  intentoId: string;
  borradorTemporalId: string;
  cantidadEsperada: number | null;
}) {
  const procesadas =
    await obtenerImagenesProcesadas(
      borradorTemporalId,
    );

  if (
    procesadas.length === 0
  ) {
    throw new Error(
      "El borrador no tiene imágenes procesadas listas.",
    );
  }

  if (
    procesadas.length > 5
  ) {
    throw new Error(
      "El borrador tiene más de cinco imágenes procesadas.",
    );
  }

  if (
    cantidadEsperada !== null &&
    procesadas.length !==
      cantidadEsperada
  ) {
    throw new Error(
      `Imágenes incompletas: ${procesadas.length}/${cantidadEsperada} procesadas.`,
    );
  }

  if (
    cantidadEsperada !== null
  ) {
    const posiciones =
      new Set(
        procesadas.map(
          (archivo) =>
            Number(
              archivo.posicion,
            ),
        ),
      );

    for (
      let posicion = 1;
      posicion <=
        cantidadEsperada;
      posicion += 1
    ) {
      if (
        !posiciones.has(
          posicion,
        )
      ) {
        throw new Error(
          `Falta la imagen procesada en posición ${posicion}.`,
        );
      }
    }
  }

  const urls: string[] =
    [];

  for (
    const archivo
    of procesadas
  ) {
    const posicion =
      Number(
        archivo.posicion,
      );

    if (
      !Number.isInteger(
        posicion,
      ) ||
      posicion < 1 ||
      posicion > 5
    ) {
      throw new Error(
        "Una imagen procesada tiene una posición inválida.",
      );
    }

    const rutaOrigen =
      texto(
        archivo.ruta,
      );

    if (
      !rutaOrigen
    ) {
      throw new Error(
        "Una imagen procesada no tiene ruta.",
      );
    }

    const rutaDestino =
      rutaPublicaFinal({
        usuarioId,
        intentoId,
        posicion,
      });

    const url =
      await copiarImagenAPublica({
        rutaOrigen,
        rutaDestino,
      });

    urls.push(
      url,
    );
  }

  return urls;
}


function prepararPublicacion({
  trabajo,
  urls,
}: {
  trabajo: any;
  urls: string[];
}) {
  const borrador =
    trabajo?.borrador &&
    typeof trabajo.borrador ===
      "object"
      ? trabajo.borrador
      : {};

  const modalidad =
    borrador.modalidad ===
      "PRECIO_FIJO"
      ? "PRECIO_FIJO"
      : "RECIBE_PROPUESTAS";

  const titulo =
    texto(
      borrador.titulo,
    );

  const descripcion =
    texto(
      borrador.descripcion,
    );

  const categoria =
    texto(
      borrador.categoria,
    );

  const provincia =
    texto(
      borrador.provincia,
    );

  const localidad =
    texto(
      borrador.localidad,
    );

  if (
    !titulo
  ) {
    throw new Error(
      "Falta el título de la publicación.",
    );
  }

  if (
    !descripcion
  ) {
    throw new Error(
      "Falta la descripción de la publicación.",
    );
  }

  if (
    !categoria
  ) {
    throw new Error(
      "Falta la categoría.",
    );
  }

  if (
    !provincia ||
    !localidad
  ) {
    throw new Error(
      "Falta completar la ubicación.",
    );
  }

  const formasEntrega =
    Array.isArray(
      borrador.formasEntrega,
    )
      ? borrador.formasEntrega
          .map(
            (forma: unknown) =>
              texto(forma),
          )
          .filter(
            Boolean,
          )
      : [];

  if (
    formasEntrega.length === 0
  ) {
    throw new Error(
      "Elegí al menos una forma de entrega.",
    );
  }

  const valor =
    modalidad ===
      "PRECIO_FIJO"
      ? numeroPositivo(
          borrador.precio,
        )
      : numeroPositivo(
          borrador.valorInicial,
        );

  if (
    valor === null
  ) {
    throw new Error(
      modalidad ===
        "PRECIO_FIJO"
        ? "El precio no es válido."
        : "El valor inicial no es válido.",
    );
  }

  const fechaCierre =
    modalidad ===
      "RECIBE_PROPUESTAS"
      ? armarFechaCierre(
          borrador.fechaCierre,
          borrador.horaCierre,
        )
      : null;

  if (
    modalidad ===
      "RECIBE_PROPUESTAS" &&
    !fechaCierre
  ) {
    throw new Error(
      "Falta la fecha u hora límite para recibir propuestas.",
    );
  }

  if (
    modalidad ===
      "RECIBE_PROPUESTAS" &&
    !fechaCierreEsFutura(
      fechaCierre,
    )
  ) {
    throw new Error(
      "La fecha y hora límite para recibir propuestas debe ser futura.",
    );
  }

  if (
    !Array.isArray(
      urls,
    ) ||
    urls.length === 0
  ) {
    throw new Error(
      "La publicación necesita al menos una imagen.",
    );
  }

  const funcionamiento =
    texto(
      borrador
        ?.respuestasInteligentes
        ?.funcionamiento,
    );

  const datosEspecificos =
    sanitizarDatosEspecificos(
      borrador
        ?.datosEspecificos ||
      borrador
        ?.analisisIA
        ?.datosEspecificos,
    );

  return {
    creado_por:
      trabajo.creado_por,

    intento_publicacion_id:
      trabajo.intento_publicacion_id,

    modalidad,

    titulo,

    descripcion,

    categoria,

    marca:
      texto(
        borrador.marca,
      ),

    modelo:
      texto(
        borrador.modelo,
      ),

    datos_especificos:
      datosEspecificos,

    estado_aparente:
      texto(
        borrador.estadoAparente,
      ),

    funcionamiento,

    formas_entrega:
      formasEntrega,

    barrio:
      texto(
        borrador.barrio,
      ),

    provincia,

    provincia_id:
      texto(
        borrador.provinciaId,
      ),

    localidad,

    localidad_id:
      texto(
        borrador.localidadId,
      ),

    latitud:
      numeroOpcional(
        borrador.latitud,
      ),

    longitud:
      numeroOpcional(
        borrador.longitud,
      ),

    base:
      valor,

    incremento:
      0,

    oferta_actual:
      null,

    fecha_cierre:
      fechaCierre,

    fecha_finalizacion:
      null,

    imagen:
      urls[0],

    imagenes:
      urls,

    frase:
      texto(
        borrador.frase ||
        borrador.fraseCierre,
      ),

    activo:
      true,

    estado:
      "ACTIVO",
  };
}


async function crearPublicacionIdempotente({
  trabajo,
  urls,
}: {
  trabajo: any;
  urls: string[];
}) {
  const usuarioId =
    texto(
      trabajo.creado_por,
    );

  const intentoId =
    texto(
      trabajo.intento_publicacion_id,
    );

  const existenteAntes =
    await obtenerPublicacionExistente(
      usuarioId,
      intentoId,
    );

  if (
    existenteAntes
  ) {
    return existenteAntes;
  }

  const datos =
    prepararPublicacion({
      trabajo,
      urls,
    });

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "publicaciones",
      )
      .insert(
        datos,
      )
      .select(
        "id, numero, titulo, estado, intento_publicacion_id",
      )
      .single();

  if (
    !error &&
    data
  ) {
    return data;
  }

  if (
    error
  ) {
    const recuperada =
      await obtenerPublicacionExistente(
        usuarioId,
        intentoId,
      );

    if (
      recuperada
    ) {
      return recuperada;
    }

    if (
      esViolacionUnica(
        error,
      )
    ) {
      throw new Error(
        "Se detectó una colisión de publicación que no pudo recuperarse.",
      );
    }

    throw error;
  }

  throw new Error(
    "No recibimos confirmación de la publicación creada.",
  );
}


async function marcarTrabajoPublicado({
  trabajoId,
  publicacionId,
}: {
  trabajoId: string;
  publicacionId: number;
}) {
  const {
    error,
  } =
    await supabase.rpc(
      "marcar_trabajo_publicado",
      {
        p_trabajo_id:
          trabajoId,

        p_publicacion_id:
          publicacionId,
      },
    );

  if (
    error
  ) {
    throw error;
  }
}


async function marcarTrabajoError({
  trabajoId,
  mensaje,
}: {
  trabajoId: string;
  mensaje: string;
}) {
  const {
    error,
  } =
    await supabase.rpc(
      "marcar_trabajo_error",
      {
        p_trabajo_id:
          trabajoId,

        p_error:
          mensaje.slice(
            0,
            4000,
          ),
      },
    );

  if (
    error
  ) {
    console.error(
      "No se pudo marcar trabajo ERROR:",
      error,
    );
  }
}


async function marcarBorradorPublicado(
  borradorTemporalId: string,
) {
  const {
    error,
  } =
    await supabase
      .from(
        "borradores_publicacion_temporales",
      )
      .update({
        estado:
          "PUBLICADO",

        publicado_at:
          new Date()
            .toISOString(),

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        borradorTemporalId,
      );

  if (
    error
  ) {
    console.error(
      "No se pudo marcar borrador PUBLICADO:",
      error,
    );
  }
}


async function procesarTrabajo(
  trabajo: any,
) {
  const trabajoId =
    texto(
      trabajo?.id,
    );

  const usuarioId =
    texto(
      trabajo?.creado_por,
    );

  const intentoId =
    texto(
      trabajo
        ?.intento_publicacion_id,
    );

  if (
    !trabajoId ||
    !usuarioId ||
    !intentoId
  ) {
    throw new Error(
      "El trabajo de publicación está incompleto.",
    );
  }

  const existente =
    await obtenerPublicacionExistente(
      usuarioId,
      intentoId,
    );

  if (
    existente?.id
  ) {
    await marcarTrabajoPublicado({
      trabajoId,

      publicacionId:
        Number(
          existente.id,
        ),
    });

    return {
      trabajoId,

      publicacionId:
        existente.id,

      numero:
        existente.numero,

      recuperada:
        true,
    };
  }

  const borradorTemporal =
    await obtenerBorradorTemporal(
      intentoId,
    );

  if (
    !borradorTemporal?.id
  ) {
    throw new Error(
      "No existe el borrador temporal asociado al trabajo.",
    );
  }

  if (
    borradorTemporal
      .reclamado_por !==
      usuarioId
  ) {
    throw new Error(
      "El borrador temporal no pertenece al usuario del trabajo.",
    );
  }

  if (
    borradorTemporal.estado !==
      "RECLAMADO" &&
    borradorTemporal.estado !==
      "PUBLICADO"
  ) {
    throw new Error(
      `Estado de borrador temporal no válido: ${borradorTemporal.estado}`,
    );
  }

  const cantidadEsperada =
    cantidadFotosEsperadas(
      trabajo,
    );

  const urls =
    await prepararImagenesPublicas({
      usuarioId,

      intentoId,

      borradorTemporalId:
        borradorTemporal.id,

      cantidadEsperada,
    });

  const publicacion =
    await crearPublicacionIdempotente({
      trabajo,
      urls,
    });

  if (
    !publicacion?.id ||
    !publicacion?.numero
  ) {
    throw new Error(
      "La publicación creada no tiene identificación completa.",
    );
  }

  await marcarTrabajoPublicado({
    trabajoId,

    publicacionId:
      Number(
        publicacion.id,
      ),
  });

  await marcarBorradorPublicado(
    borradorTemporal.id,
  );

  return {
    trabajoId,

    publicacionId:
      publicacion.id,

    numero:
      publicacion.numero,

    recuperada:
      false,
  };
}


async function tomarTrabajos() {
  const workerId =
    `publicador-edge-${crypto.randomUUID()}`;

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "tomar_trabajos_publicacion_listos",
      {
        p_worker_id:
          workerId,

        p_limite:
          BATCH_SIZE,
      },
    );

  if (
    error
  ) {
    throw error;
  }

  return {
    workerId,

    trabajos:
      data || [],
  };
}


Deno.serve(
  async (
    request,
  ) => {
    if (
      request.method !==
        "POST"
    ) {
      return json(
        {
          ok:
            false,

          error:
            "Método no permitido.",
        },
        405,
      );
    }

    const autorizado =
      await autenticarServidor(
        request,
      );

    if (
      !autorizado
    ) {
      return json(
        {
          ok:
            false,

          error:
            "No autorizado.",
        },
        401,
      );
    }

    try {
      const {
        workerId,
        trabajos,
      } =
        await tomarTrabajos();

      if (
        trabajos.length ===
        0
      ) {
        return json({
          ok:
            true,

          workerId,

          tomados:
            0,

          publicados:
            0,

          errores:
            0,

          mensaje:
            "No hay publicaciones listas pendientes.",
        });
      }

      const resultados: any[] =
        [];

      let publicados =
        0;

      let errores =
        0;

      for (
        const trabajo
        of trabajos
      ) {
        const trabajoId =
          texto(
            trabajo?.id,
          );

        try {
          const resultado =
            await procesarTrabajo(
              trabajo,
            );

          publicados +=
            1;

          resultados.push({
            ok:
              true,

            ...resultado,
          });
        } catch (
          error
        ) {
          errores +=
            1;

          const mensaje =
            (
              error instanceof Error
                ? `${error.name}: ${error.message}`
                : texto(error)
            ).slice(
              0,
              4000,
            );

          console.error(
            `ERROR trabajo ${trabajoId}:`,
            error,
          );

          if (
            trabajoId
          ) {
            await marcarTrabajoError({
              trabajoId,

              mensaje,
            });
          }

          resultados.push({
            ok:
              false,

            trabajoId,

            error:
              mensaje,
          });
        }
      }

      return json({
        ok:
          errores === 0,

        workerId,

        tomados:
          trabajos.length,

        publicados,

        errores,

        resultados,
      });
    } catch (
      error
    ) {
      console.error(
        "ERROR FATAL PUBLICADOR:",
        error,
      );

      return json(
        {
          ok:
            false,

          error:
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : texto(error),
        },
        500,
      );
    }
  },
);