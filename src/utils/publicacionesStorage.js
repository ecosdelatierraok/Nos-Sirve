import { supabase } from "../lib/supabase";

const TABLA_PUBLICACIONES =
  "publicaciones";

const BUCKET_IMAGENES =
  "publicaciones";

const MAX_FOTOS = 5;

const MAX_LADO_IMAGEN = 1200;

const CALIDAD_WEBP = 0.82;

const FORMAS_ENTREGA_VALIDAS =
  new Set([
    "EN_MANO",
    "ENVIO",
    "RETIRO",
  ]);

function sanitizarTexto(valor) {
  const texto =
    String(valor ?? "");

  return new TextDecoder().decode(
    new TextEncoder().encode(
      texto
    )
  );
}

function sanitizarImagenes(
  imagenes
) {
  if (
    !Array.isArray(
      imagenes
    )
  ) {
    return [];
  }

  return imagenes
    .filter(
      (imagen) =>
        typeof imagen ===
          "string" &&
        imagen.trim() !== ""
    )
    .slice(
      0,
      MAX_FOTOS
    )
    .map(
      (imagen) =>
        sanitizarTexto(
          imagen
        )
    );
}

function sanitizarFormasEntrega(
  formas
) {
  if (!Array.isArray(formas)) {
    return [];
  }

  return [
    ...new Set(
      formas.filter(
        (forma) =>
          FORMAS_ENTREGA_VALIDAS.has(
            forma
          )
      )
    ),
  ];
}

function sanitizarDatosEspecificos(
  valor
) {
  if (
    !valor ||
    typeof valor !==
      "object" ||
    Array.isArray(valor)
  ) {
    return {};
  }

  const resultado =
    {};

  Object.entries(
    valor
  ).forEach(
    ([
      claveOriginal,
      dato,
    ]) => {
      const clave =
        String(
          claveOriginal ||
          ""
        ).trim();

      if (!clave) {
        return;
      }

      if (
        dato === null ||
        dato === undefined
      ) {
        return;
      }

      if (
        Array.isArray(
          dato
        )
      ) {
        const lista =
          dato
            .map(
              (item) =>
                String(
                  item ??
                  ""
                ).trim()
            )
            .filter(
              Boolean
            );

        if (
          lista.length >
          0
        ) {
          resultado[
            clave
          ] =
            lista;
        }

        return;
      }

      if (
        typeof dato ===
        "object"
      ) {
        return;
      }

      const texto =
        String(
          dato
        ).trim();

      if (texto) {
        resultado[
          clave
        ] =
          texto;
      }
    }
  );

  return resultado;
}

function armarFechaLimite(
  fecha,
  hora
) {
  if (
    !fecha ||
    !hora
  ) {
    return null;
  }

  return `${fecha}T${hora}:00-03:00`;
}

function fechaParaInput(
  fechaLimite
) {
  if (
    !fechaLimite
  ) {
    return "";
  }

  return new Date(
    fechaLimite
  ).toLocaleDateString(
    "en-CA",
    {
      timeZone:
        "America/Argentina/Cordoba",
    }
  );
}

function horaParaInput(
  fechaLimite
) {
  if (
    !fechaLimite
  ) {
    return "18:00";
  }

  return new Date(
    fechaLimite
  ).toLocaleTimeString(
    "es-AR",
    {
      timeZone:
        "America/Argentina/Cordoba",

      hour: "2-digit",

      minute:
        "2-digit",

      hour12: false,
    }
  );
}

function restarSieteDias(
  fecha
) {
  const resultado =
    new Date(
      fecha
    );

  resultado.setDate(
    resultado.getDate() -
      7
  );

  return resultado.toISOString();
}

async function cerrarPublicacionesVencidas() {
  const ahora =
    new Date().toISOString();

  const {
    data:
      publicacionesVencidas,

    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .select("id")
      .eq(
        "estado",
        "ACTIVO"
      )
      .eq(
        "modalidad",
        "RECIBE_PROPUESTAS"
      )
      .not(
        "fecha_cierre",
        "is",
        null
      )
      .lte(
        "fecha_cierre",
        ahora
      );

  if (error) {
    console.error(
      "Error al buscar publicaciones cuya recepción terminó:",
      error
    );

    return;
  }

  if (
    !publicacionesVencidas ||
    publicacionesVencidas.length ===
      0
  ) {
    return;
  }

  const ids =
    publicacionesVencidas.map(
      (publicacion) =>
        publicacion.id
    );

  const {
    error:
      errorCierre,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update({
        activo: false,

        estado:
          "FINALIZADO",

        fecha_finalizacion:
          ahora,
      })
      .in(
        "id",
        ids
      );

  if (
    errorCierre
  ) {
    console.error(
      "Error al cerrar la recepción de propuestas:",
      errorCierre
    );
  }
}

async function completarFechasDeCierre() {
  const ahora =
    new Date().toISOString();

  const {
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update({
        fecha_finalizacion:
          ahora,
      })
      .eq(
        "estado",
        "FINALIZADO"
      )
      .is(
        "fecha_finalizacion",
        null
      );

  if (error) {
    console.error(
      "Error al completar fechas de cierre:",
      error
    );
  }
}

async function archivarPublicacionesAntiguas() {
  const limite =
    restarSieteDias(
      new Date()
    );

  const {
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update({
        activo: false,

        estado:
          "ARCHIVADO",
      })
      .eq(
        "estado",
        "FINALIZADO"
      )
      .not(
        "fecha_finalizacion",
        "is",
        null
      )
      .lte(
        "fecha_finalizacion",
        limite
      );

  if (error) {
    console.error(
      "Error al archivar publicaciones antiguas:",
      error
    );
  }
}

async function procesarEstadosAutomaticos() {
  await cerrarPublicacionesVencidas();

  await completarFechasDeCierre();

  await archivarPublicacionesAntiguas();
}

/*
  ======================================================
  IMÁGENES
  ======================================================
*/

function esImagenBase64(
  valor
) {
  return (
    typeof valor ===
      "string" &&
    valor.startsWith(
      "data:image"
    )
  );
}

function esUrlImagen(
  valor
) {
  return (
    typeof valor ===
      "string" &&
    (
      valor.startsWith(
        "http://"
      ) ||
      valor.startsWith(
        "https://"
      )
    )
  );
}

function cargarImagenDesdeFuente(
  fuente
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const imagen =
        new Image();

      imagen.onload =
        () => {
          resolve(
            imagen
          );
        };

      imagen.onerror =
        () => {
          reject(
            new Error(
              "No se pudo abrir la imagen."
            )
          );
        };

      imagen.src =
        fuente;
    }
  );
}

function canvasABlobWebP(
  canvas
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo convertir la imagen a WebP."
              )
            );

            return;
          }

          resolve(blob);
        },

        "image/webp",

        CALIDAD_WEBP
      );
    }
  );
}

async function convertirFuenteAWebP(
  fuente
) {
  let urlTemporal =
    null;

  try {
    if (
      fuente instanceof
      Blob
    ) {
      urlTemporal =
        URL.createObjectURL(
          fuente
        );
    }

    const imagen =
      await cargarImagenDesdeFuente(
        urlTemporal ||
          fuente
      );

    let ancho =
      imagen.naturalWidth ||
      imagen.width;

    let alto =
      imagen.naturalHeight ||
      imagen.height;

    if (
      !ancho ||
      !alto
    ) {
      throw new Error(
        "La imagen no tiene dimensiones válidas."
      );
    }

    const ladoMayor =
      Math.max(
        ancho,
        alto
      );

    if (
      ladoMayor >
      MAX_LADO_IMAGEN
    ) {
      const proporcion =
        MAX_LADO_IMAGEN /
        ladoMayor;

      ancho =
        Math.round(
          ancho *
            proporcion
        );

      alto =
        Math.round(
          alto *
            proporcion
        );
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      ancho;

    canvas.height =
      alto;

    const contexto =
      canvas.getContext(
        "2d"
      );

    if (!contexto) {
      throw new Error(
        "No se pudo preparar la imagen."
      );
    }

    contexto.imageSmoothingEnabled =
      true;

    contexto.imageSmoothingQuality =
      "high";

    contexto.drawImage(
      imagen,
      0,
      0,
      ancho,
      alto
    );

    return await canvasABlobWebP(
      canvas
    );
  } finally {
    if (urlTemporal) {
      URL.revokeObjectURL(
        urlTemporal
      );
    }
  }
}

function extensionDesdeMime(
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
      "gif"
    )
  ) {
    return "gif";
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

function generarRutaImagen({
  numero,
  indice,
  tipo,
  extension,
}) {
  const aleatorio =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `publicacion-${numero}/` +
    `${tipo}/` +
    `${Date.now()}-${indice}-${aleatorio}.${extension}`
  );
}

async function subirBlobStorage({
  blob,
  numero,
  indice,
  tipo,
  extension,
  contentType,
}) {
  const ruta =
    generarRutaImagen({
      numero,
      indice,
      tipo,
      extension,
    });

  const {
    error:
      errorSubida,
  } =
    await supabase.storage
      .from(
        BUCKET_IMAGENES
      )
      .upload(
        ruta,
        blob,
        {
          contentType:
            contentType ||
            blob.type ||
            "application/octet-stream",

          cacheControl:
            "31536000",

          upsert: false,
        }
      );

  if (
    errorSubida
  ) {
    throw errorSubida;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        BUCKET_IMAGENES
      )
      .getPublicUrl(
        ruta
      );

  if (
    !data?.publicUrl
  ) {
    throw new Error(
      "No se pudo obtener la URL pública de la imagen."
    );
  }

  return {
    ruta,
    url:
      data.publicUrl,
  };
}

async function borrarRutasStorage(
  rutas
) {
  const limpias =
    Array.isArray(rutas)
      ? rutas.filter(Boolean)
      : [];

  if (
    limpias.length === 0
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase.storage
      .from(
        BUCKET_IMAGENES
      )
      .remove(
        limpias
      );

  if (error) {
    console.error(
      "No se pudieron limpiar algunas imágenes subidas:",
      error
    );
  }
}

/*
  Guarda una foto del flujo nuevo.

  - original: se conserva sin modificar.
  - procesada: WebP, máximo 1200 px.
*/
async function prepararFotoBorrador({
  foto,
  numero,
  indice,
}) {
  const archivo =
    foto?.archivo;

  if (
    !(archivo instanceof Blob)
  ) {
    throw new Error(
      `La foto ${indice} no tiene un archivo válido.`
    );
  }

  const rutasSubidas =
    [];

  try {
    const extensionOriginal =
      extensionDesdeMime(
        archivo.type
      );

    const original =
      await subirBlobStorage({
        blob:
          archivo,

        numero,

        indice,

        tipo:
          "originales",

        extension:
          extensionOriginal,

        contentType:
          archivo.type ||
          "image/jpeg",
      });

    rutasSubidas.push(
      original.ruta
    );

    const webp =
      await convertirFuenteAWebP(
        archivo
      );

    const procesada =
      await subirBlobStorage({
        blob: webp,

        numero,

        indice,

        tipo:
          "procesadas",

        extension:
          "webp",

        contentType:
          "image/webp",
      });

    rutasSubidas.push(
      procesada.ruta
    );

    return {
      url:
        procesada.url,

      rutas:
        rutasSubidas,
    };
  } catch (error) {
    await borrarRutasStorage(
      rutasSubidas
    );

    throw error;
  }
}

/*
  ======================================================
  MIGRACIÓN HISTÓRICA
  ======================================================
*/

function generarRutaImagenMigrada({
  numero,
  indice,
}) {
  const numeroSeguro =
    Number(numero) ||
    "sin-numero";

  const fecha =
    Date.now();

  const aleatorio =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return (
    `publicacion-${numeroSeguro}/` +
    `migrada-${fecha}-${indice}-${aleatorio}.webp`
  );
}

async function subirWebPMigrado({
  blob,
  numero,
  indice,
}) {
  const ruta =
    generarRutaImagenMigrada({
      numero,
      indice,
    });

  const {
    error:
      errorSubida,
  } =
    await supabase.storage
      .from(
        BUCKET_IMAGENES
      )
      .upload(
        ruta,
        blob,
        {
          contentType:
            "image/webp",

          cacheControl:
            "31536000",

          upsert: false,
        }
      );

  if (
    errorSubida
  ) {
    throw errorSubida;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        BUCKET_IMAGENES
      )
      .getPublicUrl(
        ruta
      );

  if (
    !data?.publicUrl
  ) {
    throw new Error(
      "No se pudo obtener la URL pública de la imagen migrada."
    );
  }

  return data.publicUrl;
}

function obtenerImagenesRegistro(
  registro
) {
  const imagenesGuardadas =
    Array.isArray(
      registro.imagenes
    )
      ? registro.imagenes
          .filter(Boolean)
          .slice(
            0,
            MAX_FOTOS
          )
      : [];

  if (
    imagenesGuardadas.length >
    0
  ) {
    return imagenesGuardadas;
  }

  if (
    registro.imagen
  ) {
    return [
      registro.imagen,
    ];
  }

  return [];
}

async function migrarImagenIndividual({
  imagen,
  numero,
  indice,
}) {
  if (
    esUrlImagen(imagen)
  ) {
    return imagen;
  }

  if (
    !esImagenBase64(
      imagen
    )
  ) {
    throw new Error(
      "La imagen histórica no tiene un formato reconocido."
    );
  }

  const blobWebP =
    await convertirFuenteAWebP(
      imagen
    );

  return await subirWebPMigrado({
    blob:
      blobWebP,

    numero,

    indice,
  });
}

async function migrarRegistroImagenes(
  registro
) {
  const imagenesOriginales =
    obtenerImagenesRegistro(
      registro
    );

  if (
    imagenesOriginales.length ===
    0
  ) {
    return {
      estado:
        "SIN_IMAGENES",

      numero:
        registro.numero,

      id:
        registro.id,

      cantidad: 0,
    };
  }

  const necesitaMigracion =
    imagenesOriginales.some(
      esImagenBase64
    );

  if (
    !necesitaMigracion
  ) {
    return {
      estado:
        "YA_MIGRADA",

      numero:
        registro.numero,

      id:
        registro.id,

      cantidad:
        imagenesOriginales.length,
    };
  }

  const nuevasImagenes =
    [];

  for (
    let indice = 0;
    indice <
    imagenesOriginales.length;
    indice += 1
  ) {
    const nuevaImagen =
      await migrarImagenIndividual({
        imagen:
          imagenesOriginales[
            indice
          ],

        numero:
          registro.numero,

        indice:
          indice + 1,
      });

    nuevasImagenes.push(
      nuevaImagen
    );
  }

  const {
    error:
      errorActualizacion,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update({
        imagen:
          nuevasImagenes[0] ||
          "",

        imagenes:
          nuevasImagenes,
      })
      .eq(
        "id",
        registro.id
      );

  if (
    errorActualizacion
  ) {
    throw errorActualizacion;
  }

  return {
    estado:
      "MIGRADA",

    numero:
      registro.numero,

    id:
      registro.id,

    cantidad:
      nuevasImagenes.length,
  };
}

export async function migrarImagenesHistoricasAStorage(
  opciones = {}
) {
  const {
    numero = null,
  } =
    opciones;

  let consulta =
    supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .select(
        "id, numero, imagen, imagenes"
      )
      .order(
        "numero",
        {
          ascending: true,
        }
      );

  if (
    numero !== null &&
    numero !== undefined
  ) {
    consulta =
      consulta.eq(
        "numero",
        Number(numero)
      );
  }

  const {
    data:
      registros,

    error:
      errorConsulta,
  } =
    await consulta;

  if (
    errorConsulta
  ) {
    throw errorConsulta;
  }

  const resultados =
    [];

  for (
    const registro of
    registros || []
  ) {
    try {
      console.log(
        `Migrando imágenes de publicación #${registro.numero}...`
      );

      const resultado =
        await migrarRegistroImagenes(
          registro
        );

      resultados.push(
        resultado
      );

      console.log(
        `Publicación #${registro.numero}: ${resultado.estado}`
      );
    } catch (error) {
      console.error(
        `Error migrando publicación #${registro.numero}:`,
        error
      );

      resultados.push({
        estado:
          "ERROR",

        numero:
          registro.numero,

        id:
          registro.id,

        cantidad: 0,

        error:
          error?.message ||
          String(error),
      });
    }
  }

  const resumen = {
    total:
      resultados.length,

    migradas:
      resultados.filter(
        (resultado) =>
          resultado.estado ===
          "MIGRADA"
      ).length,

    yaMigradas:
      resultados.filter(
        (resultado) =>
          resultado.estado ===
          "YA_MIGRADA"
      ).length,

    sinImagenes:
      resultados.filter(
        (resultado) =>
          resultado.estado ===
          "SIN_IMAGENES"
      ).length,

    errores:
      resultados.filter(
        (resultado) =>
          resultado.estado ===
          "ERROR"
      ).length,

    resultados,
  };

  console.log(
    "Resumen de migración de imágenes:",
    resumen
  );

  return resumen;
}

export function formatearFechaLimite(
  publicacion
) {
  if (
    !publicacion.fecha_cierre
  ) {
    return "Pendiente";
  }

  const fecha =
    new Date(
      publicacion.fecha_cierre
    );

  const dia =
    fecha.toLocaleDateString(
      "es-AR",
      {
        timeZone:
          "America/Argentina/Cordoba",

        day: "2-digit",
      }
    );

  const mes =
    fecha.toLocaleDateString(
      "es-AR",
      {
        timeZone:
          "America/Argentina/Cordoba",

        month: "2-digit",
      }
    );

  const anio =
    fecha.toLocaleDateString(
      "es-AR",
      {
        timeZone:
          "America/Argentina/Cordoba",

        year: "numeric",
      }
    );

  const hora =
    fecha.toLocaleTimeString(
      "es-AR",
      {
        timeZone:
          "America/Argentina/Cordoba",

        hour: "2-digit",

        minute:
          "2-digit",

        hour12: false,
      }
    );

  return `${dia}/${mes}/${anio} - ${hora} hs`;
}

function adaptarPublicacion(
  registro,
  nombresPublicantes =
    new Map()
) {
  const imagenesGuardadas =
    Array.isArray(
      registro.imagenes
    )
      ? registro.imagenes.filter(
          Boolean
        )
      : [];

  const imagenPrincipal =
    imagenesGuardadas[0] ||
    registro.imagen ||
    "";

  const imagenes =
    imagenesGuardadas.length >
    0
      ? imagenesGuardadas
      : imagenPrincipal
        ? [
            imagenPrincipal,
          ]
        : [];

  return {
    id:
      registro.id,

    creadoPor:
      registro.creado_por ||
      null,

    creado_por:
      registro.creado_por ||
      null,

    numero:
      registro.numero,

    modalidad:
      registro.modalidad ||
      "RECIBE_PROPUESTAS",

    titulo:
      registro.titulo ||
      "",

    descripcion:
      registro.descripcion ||
      "",

    categoria:
      registro.categoria ||
      "",

    marca:
      registro.marca ||
      "",

    modelo:
      registro.modelo ||
      "",

    datosEspecificos:
      sanitizarDatosEspecificos(
        registro.datos_especificos
      ),

    datos_especificos:
      sanitizarDatosEspecificos(
        registro.datos_especificos
      ),

    estadoAparente:
      registro.estado_aparente ||
      "",

    estado_aparente:
      registro.estado_aparente ||
      "",

    funcionamiento:
      registro.funcionamiento ||
      "",

    formasEntrega:
      Array.isArray(
        registro.formas_entrega
      )
        ? registro.formas_entrega
        : [],

    formas_entrega:
      Array.isArray(
        registro.formas_entrega
      )
        ? registro.formas_entrega
        : [],

    nombrePublicante:
      nombresPublicantes.get(
        registro.creado_por
      ) ||
      "",

    publicadoPor:
      nombresPublicantes.get(
        registro.creado_por
      ) ||
      "",

    barrio:
      registro.barrio ||
      "",

    provincia:
      registro.provincia ||
      "",

    provinciaId:
      registro.provincia_id ||
      "",

    localidad:
      registro.localidad ||
      "",

    localidadId:
      registro.localidad_id ||
      "",

    latitud:
      registro.latitud ===
        null ||
      registro.latitud ===
        undefined
        ? null
        : Number(
            registro.latitud
          ),

    longitud:
      registro.longitud ===
        null ||
      registro.longitud ===
        undefined
        ? null
        : Number(
            registro.longitud
          ),

    valorInicial:
      Number(
        registro.base ||
        0
      ),

    mejorPropuesta:
      Number(
        registro.oferta_actual ||
        registro.base ||
        0
      ),

    cierre:
      formatearFechaLimite(
        registro
      ),

    fechaLimite:
      fechaParaInput(
        registro.fecha_cierre
      ),

    horaLimite:
      horaParaInput(
        registro.fecha_cierre
      ),

    imagen:
      imagenPrincipal,

    imagenes,

    estado:
      registro.estado ||
      (
        registro.activo
          ? "ACTIVO"
          : "FINALIZADO"
      ),

    activo:
      Boolean(
        registro.activo
      ),

    fecha_cierre:
      registro.fecha_cierre ||
      null,

    fecha_finalizacion:
      registro.fecha_finalizacion ||
      null,

    oferta_actual:
      registro.oferta_actual ===
        null ||
      registro.oferta_actual ===
        undefined
        ? null
        : Number(
            registro.oferta_actual
          ),

    fechaCierre:
      registro.fecha_finalizacion ||
      null,

    frase:
      registro.frase ||
      "",

    base:
      Number(
        registro.base ||
        0
      ),

    oferta:
      Number(
        registro.oferta_actual ||
        registro.base ||
        0
      ),

    fechaCierreInput:
      fechaParaInput(
        registro.fecha_cierre
      ),

    horaCierre:
      horaParaInput(
        registro.fecha_cierre
      ),
  };
}

export async function obtenerPublicaciones(
  opciones = {}
) {
  const {
    incluirArchivadas =
      false,
  } =
    opciones;

  await procesarEstadosAutomaticos();

  let consulta =
    supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .select("*");

  if (
    !incluirArchivadas
  ) {
    consulta =
      consulta.neq(
        "estado",
        "ARCHIVADO"
      );
  }

  const {
    data,
    error,
  } =
    await consulta.order(
      "numero",
      {
        ascending: true,
      }
    );

  if (error) {
    console.error(
      "Error al obtener publicaciones:",
      error
    );

    return [];
  }

  const registros =
    data || [];

  const idsPublicantes = [
    ...new Set(
      registros
        .map(
          (registro) =>
            registro.creado_por
        )
        .filter(
          Boolean
        )
    ),
  ];

  const nombresPublicantes =
    new Map();

  if (
    idsPublicantes.length >
    0
  ) {
    const {
      data:
        perfilesPublicantes,

      error:
        errorPerfiles,
    } =
      await supabase
        .from(
          "perfiles"
        )
        .select(
          "id, nombre"
        )
        .in(
          "id",
          idsPublicantes
        );

    if (errorPerfiles) {
      console.error(
        "Error al obtener nombres de quienes publicaron:",
        errorPerfiles
      );
    } else {
      (
        perfilesPublicantes ||
        []
      ).forEach(
        (perfil) => {
          const nombre =
            String(
              perfil?.nombre ||
              ""
            ).trim();

          if (
            perfil?.id &&
            nombre
          ) {
            nombresPublicantes.set(
              perfil.id,
              nombre
            );
          }
        }
      );
    }
  }

  return registros.map(
    (registro) =>
      adaptarPublicacion(
        registro,
        nombresPublicantes
      )
  );
}

/*
  ======================================================
  PRÓXIMO NÚMERO
  ======================================================
*/

export async function obtenerSiguienteNumeroPublicacion() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .select("numero")
      .not(
        "numero",
        "is",
        null
      )
      .order(
        "numero",
        {
          ascending: false,
        }
      )
      .limit(1);

  if (error) {
    throw error;
  }

  const mayor =
    Number(
      data?.[0]?.numero ||
      0
    );

  return mayor + 1;
}

/*
  ======================================================
  GUARDADO HISTÓRICO
  ======================================================
*/

export async function guardarPublicacion(
  publicacion
) {
  const modalidad =
    publicacion.modalidad ||
    "RECIBE_PROPUESTAS";

  const fechaLimite =
    modalidad ===
    "RECIBE_PROPUESTAS"
      ? armarFechaLimite(
          publicacion.fechaLimite ||
            publicacion.fechaCierre,

          publicacion.horaLimite ||
            publicacion.horaCierre
        )
      : null;

  const imagenes =
    sanitizarImagenes(
      publicacion.imagenes
    );

  const imagenPrincipal =
    imagenes[0] ||
    sanitizarTexto(
      publicacion.imagen
    );

  const valorInicial =
    Number(
      publicacion.valorInicial ??
      publicacion.base ??
      0
    );

  const {
    data: {
      user,
    },

    error:
      errorUsuario,
  } =
    await supabase.auth.getUser();

  if (
    errorUsuario ||
    !user?.id
  ) {
    throw new Error(
      "Tenés que iniciar sesión para crear una publicación."
    );
  }

  const datosParaGuardar =
    {
      creado_por:
        user.id,

      modalidad,

      numero:
        Number(
          publicacion.numero
        ),

      titulo:
        sanitizarTexto(
          publicacion.titulo
        ),

      descripcion:
        sanitizarTexto(
          publicacion.descripcion
        ),

      categoria:
        sanitizarTexto(
          publicacion.categoria
        ),

      marca:
        sanitizarTexto(
          publicacion.marca
        ),

      modelo:
        sanitizarTexto(
          publicacion.modelo
        ),

      datos_especificos:
        sanitizarDatosEspecificos(
          publicacion
            .datosEspecificos ||
          publicacion
            .datos_especificos
        ),

      estado_aparente:
        sanitizarTexto(
          publicacion.estadoAparente
        ),

      funcionamiento:
        sanitizarTexto(
          publicacion.funcionamiento
        ),

      formas_entrega:
        sanitizarFormasEntrega(
          publicacion.formasEntrega
        ),

      barrio:
        sanitizarTexto(
          publicacion.barrio
        ),

      provincia:
        sanitizarTexto(
          publicacion.provincia
        ),

      provincia_id:
        sanitizarTexto(
          publicacion.provinciaId
        ),

      localidad:
        sanitizarTexto(
          publicacion.localidad
        ),

      localidad_id:
        sanitizarTexto(
          publicacion.localidadId
        ),

      latitud:
        publicacion.latitud ===
          null ||
        publicacion.latitud ===
          undefined ||
        publicacion.latitud ===
          ""
          ? null
          : Number(
              publicacion.latitud
            ),

      longitud:
        publicacion.longitud ===
          null ||
        publicacion.longitud ===
          undefined ||
        publicacion.longitud ===
          ""
          ? null
          : Number(
              publicacion.longitud
            ),

      base:
        valorInicial,

      incremento: 0,

      oferta_actual:
        valorInicial,

      fecha_cierre:
        fechaLimite,

      fecha_finalizacion:
        null,

      imagen:
        imagenPrincipal,

      imagenes,

      frase:
        sanitizarTexto(
          publicacion.frase
        ),

      activo: true,

      estado:
        "ACTIVO",
    };

  const {
    data,
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .insert([
        datosParaGuardar,
      ])
      .select(
        "id, numero"
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
  ======================================================
  GUARDADO NUEVO FLUJO NOS SIRVE
  ======================================================
*/

export async function guardarPublicacionDesdeBorrador(
  borrador
) {
  if (!borrador) {
    throw new Error(
      "No encontramos el borrador de la publicación."
    );
  }

  const {
    data: {
      user,
    },

    error:
      errorUsuario,
  } =
    await supabase.auth.getUser();

  if (
    errorUsuario ||
    !user?.id
  ) {
    throw new Error(
      "Tenés que iniciar sesión para publicar."
    );
  }

  const titulo =
    sanitizarTexto(
      borrador.titulo
    ).trim();

  const descripcion =
    sanitizarTexto(
      borrador.descripcion
    ).trim();

  const categoria =
    sanitizarTexto(
      borrador.categoria
    ).trim();

  const modalidad =
    borrador.modalidad ||
    "RECIBE_PROPUESTAS";

  const provincia =
    sanitizarTexto(
      borrador.provincia
    ).trim();

  const provinciaId =
    sanitizarTexto(
      borrador.provinciaId
    ).trim();

  const localidad =
    sanitizarTexto(
      borrador.localidad
    ).trim();

  const localidadId =
    sanitizarTexto(
      borrador.localidadId
    ).trim();

  const formasEntrega =
    sanitizarFormasEntrega(
      borrador.formasEntrega
    );

  const fotos =
    Array.isArray(
      borrador.fotos
    )
      ? borrador.fotos
          .filter(
            (foto) =>
              foto?.archivo instanceof
              Blob
          )
          .slice(
            0,
            MAX_FOTOS
          )
      : [];

  if (!titulo) {
    throw new Error(
      "Falta el título de la publicación."
    );
  }

  if (!descripcion) {
    throw new Error(
      "Falta la descripción de la publicación."
    );
  }

  if (!categoria) {
    throw new Error(
      "Falta la categoría de la publicación."
    );
  }

  if (
    !provincia ||
    !provinciaId
  ) {
    throw new Error(
      "Falta una provincia válida."
    );
  }

  if (
    !localidad ||
    !localidadId
  ) {
    throw new Error(
      "Falta una localidad válida."
    );
  }

  if (
    formasEntrega.length ===
    0
  ) {
    throw new Error(
      "Elegí al menos una forma de entrega."
    );
  }

  if (
    fotos.length ===
    0
  ) {
    throw new Error(
      "La publicación necesita al menos una foto."
    );
  }

  let valorOperacion;

  if (
    modalidad ===
    "PRECIO_FIJO"
  ) {
    valorOperacion =
      Number(
        borrador.precio ||
        0
      );

    if (
      !Number.isFinite(
        valorOperacion
      ) ||
      valorOperacion <= 0
    ) {
      throw new Error(
        "El precio no es válido."
      );
    }
  } else {
    valorOperacion =
      Number(
        borrador.valorInicial ||
        0
      );

    if (
      !Number.isFinite(
        valorOperacion
      ) ||
      valorOperacion <= 0
    ) {
      throw new Error(
        "El valor inicial no es válido."
      );
    }

    if (
      !borrador.fechaCierre ||
      !borrador.horaCierre
    ) {
      throw new Error(
        "Falta la fecha u hora límite para recibir propuestas."
      );
    }
  }

  const fechaLimite =
    modalidad ===
    "RECIBE_PROPUESTAS"
      ? armarFechaLimite(
          borrador.fechaCierre,
          borrador.horaCierre
        )
      : null;

  /*
    Calculamos el próximo número
    justo antes de subir las fotos.
  */
  const numero =
    await obtenerSiguienteNumeroPublicacion();

  const urls =
    [];

  const rutasSubidas =
    [];

  try {
    for (
      let indice = 0;
      indice <
      fotos.length;
      indice += 1
    ) {
      const resultado =
        await prepararFotoBorrador({
          foto:
            fotos[indice],

          numero,

          indice:
            indice + 1,
        });

      urls.push(
        resultado.url
      );

      rutasSubidas.push(
        ...resultado.rutas
      );
    }

    const funcionamiento =
      sanitizarTexto(
        borrador
          ?.respuestasInteligentes
          ?.funcionamiento ||
        ""
      );

    const datosParaGuardar =
      {
        creado_por:
          user.id,

        modalidad,

        numero,

        titulo,

        descripcion,

        categoria,

        marca:
          sanitizarTexto(
            borrador.marca
          ).trim(),

        modelo:
          sanitizarTexto(
            borrador.modelo
          ).trim(),

        datos_especificos:
          sanitizarDatosEspecificos(
            borrador
              ?.datosEspecificos ||
            borrador
              ?.analisisIA
              ?.datosEspecificos
          ),

        estado_aparente:
          sanitizarTexto(
            borrador.estadoAparente
          ).trim(),

        funcionamiento,

        formas_entrega:
          formasEntrega,

        barrio:
          sanitizarTexto(
            borrador.barrio
          ).trim(),

        provincia,

        provincia_id:
          provinciaId,

        localidad,

        localidad_id:
          localidadId,

        latitud:
          borrador.latitud ===
            null ||
          borrador.latitud ===
            undefined ||
          borrador.latitud ===
            ""
            ? null
            : Number(
                borrador.latitud
              ),

        longitud:
          borrador.longitud ===
            null ||
          borrador.longitud ===
            undefined ||
          borrador.longitud ===
            ""
            ? null
            : Number(
                borrador.longitud
              ),

        base:
          valorOperacion,

        incremento: 0,

        oferta_actual:
          valorOperacion,

        fecha_cierre:
          fechaLimite,

        fecha_finalizacion:
          null,

        imagen:
          urls[0] ||
          "",

        imagenes:
          urls,

        frase:
          sanitizarTexto(
            borrador.frase ||
            borrador
              ?.analisisIA
              ?.frase ||
            ""
          ).trim(),

        activo: true,

        estado:
          "ACTIVO",
      };

    const {
      data,
      error,
    } =
      await supabase
        .from(
          TABLA_PUBLICACIONES
        )
        .insert([
          datosParaGuardar,
        ])
        .select(
          "id, numero, titulo"
        )
        .single();

    if (error) {
      throw error;
    }

    return {
      id:
        data.id,

      numero:
        data.numero,

      titulo:
        data.titulo,

      imagen:
        urls[0] ||
        "",

      imagenes:
        urls,
    };
  } catch (error) {
    /*
      Si falla el alta después
      de haber subido archivos,
      no dejamos basura en Storage.
    */
    await borrarRutasStorage(
      rutasSubidas
    );

    throw error;
  }
}

export async function editarPublicacion(
  id,
  publicacionEditada
) {
  const modalidad =
    publicacionEditada.modalidad ||
    "RECIBE_PROPUESTAS";

  const fechaLimite =
    modalidad ===
    "RECIBE_PROPUESTAS"
      ? armarFechaLimite(
          publicacionEditada.fechaLimite ||
            publicacionEditada.fechaCierre,

          publicacionEditada.horaLimite ||
            publicacionEditada.horaCierre
        )
      : null;

  const imagenes =
    sanitizarImagenes(
      publicacionEditada.imagenes
    );

  const imagenPrincipal =
    imagenes[0] ||
    sanitizarTexto(
      publicacionEditada.imagen
    );

  const valorInicial =
    Number(
      publicacionEditada.valorInicial ??
      publicacionEditada.base ??
      0
    );

  const cambios =
    {
      modalidad,

      numero:
        Number(
          publicacionEditada.numero
        ),

      titulo:
        sanitizarTexto(
          publicacionEditada.titulo
        ),

      descripcion:
        sanitizarTexto(
          publicacionEditada.descripcion
        ),

      barrio:
        sanitizarTexto(
          publicacionEditada.barrio
        ),

      provincia:
        sanitizarTexto(
          publicacionEditada.provincia
        ),

      provincia_id:
        sanitizarTexto(
          publicacionEditada.provinciaId
        ),

      localidad:
        sanitizarTexto(
          publicacionEditada.localidad
        ),

      localidad_id:
        sanitizarTexto(
          publicacionEditada.localidadId
        ),

      latitud:
        publicacionEditada.latitud ===
          null ||
        publicacionEditada.latitud ===
          undefined ||
        publicacionEditada.latitud ===
          ""
          ? null
          : Number(
              publicacionEditada.latitud
            ),

      longitud:
        publicacionEditada.longitud ===
          null ||
        publicacionEditada.longitud ===
          undefined ||
        publicacionEditada.longitud ===
          ""
          ? null
          : Number(
              publicacionEditada.longitud
            ),

      base:
        valorInicial,

      incremento: 0,

      fecha_cierre:
        fechaLimite,

      imagen:
        imagenPrincipal,

      imagenes,

      frase:
        sanitizarTexto(
          publicacionEditada.frase
        ),
    };

  /*
    Los nuevos datos se agregan
    solamente cuando vienen informados,
    para conservar compatibilidad
    con el formulario histórico.
  */
  if (
    "categoria" in
    publicacionEditada
  ) {
    cambios.categoria =
      sanitizarTexto(
        publicacionEditada.categoria
      );
  }

  if (
    "marca" in
    publicacionEditada
  ) {
    cambios.marca =
      sanitizarTexto(
        publicacionEditada.marca
      );
  }

  if (
    "modelo" in
    publicacionEditada
  ) {
    cambios.modelo =
      sanitizarTexto(
        publicacionEditada.modelo
      );
  }

  if (
    "datosEspecificos" in
      publicacionEditada ||
    "datos_especificos" in
      publicacionEditada
  ) {
    cambios.datos_especificos =
      sanitizarDatosEspecificos(
        publicacionEditada
          .datosEspecificos ||
        publicacionEditada
          .datos_especificos
      );
  }

  if (
    "estadoAparente" in
    publicacionEditada
  ) {
    cambios.estado_aparente =
      sanitizarTexto(
        publicacionEditada.estadoAparente
      );
  }

  if (
    "funcionamiento" in
    publicacionEditada
  ) {
    cambios.funcionamiento =
      sanitizarTexto(
        publicacionEditada.funcionamiento
      );
  }

  if (
    "formasEntrega" in
    publicacionEditada
  ) {
    cambios.formas_entrega =
      sanitizarFormasEntrega(
        publicacionEditada.formasEntrega
      );
  }

  const {
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update(
        cambios
      )
      .eq(
        "id",
        Number(id)
      );

  if (error) {
    throw error;
  }
}

export async function actualizarMejorPropuesta(
  id,
  monto
) {
  const {
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update({
        oferta_actual:
          Number(monto),
      })
      .eq(
        "id",
        Number(id)
      );

  if (error) {
    throw error;
  }
}

export async function eliminarPublicacion(
  id
) {
  const {
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .delete()
      .eq(
        "id",
        Number(id)
      );

  if (error) {
    throw error;
  }
}

export async function cerrarRecepcionPropuestas(
  id
) {
  const {
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update({
        activo: false,

        estado:
          "FINALIZADO",

        fecha_finalizacion:
          new Date().toISOString(),
      })
      .eq(
        "id",
        Number(id)
      );

  if (error) {
    throw error;
  }
}

export async function archivarPublicacion(
  id
) {
  const {
    error,
  } =
    await supabase
      .from(
        TABLA_PUBLICACIONES
      )
      .update({
        activo: false,

        estado:
          "ARCHIVADO",
      })
      .eq(
        "id",
        Number(id)
      );

  if (error) {
    throw error;
  }
}

export async function migrarPublicacionesLocalesASupabase() {
  alert(
    "La migración local ya fue realizada. No hace falta volver a migrar."
  );
}