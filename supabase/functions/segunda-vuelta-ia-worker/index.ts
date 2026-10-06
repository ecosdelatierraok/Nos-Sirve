import {
  createClient,
} from "npm:@supabase/supabase-js@2";

const BATCH_SIZE = 3;

const BUCKET_TEMPORAL =
  "borradores-publicacion";

const GEMINI_MODELOS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];


function texto(
  valor: unknown,
) {
  return String(
    valor ?? "",
  ).trim();
}


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


function limitarTexto(
  valor: unknown,
  maximo: number,
) {
  return texto(
    valor,
  ).slice(
    0,
    maximo,
  );
}


function limpiarJsonGemini(
  valor: string,
) {
  return valor
    .trim()
    .replace(
      /^```json\s*/i,
      "",
    )
    .replace(
      /^```\s*/i,
      "",
    )
    .replace(
      /\s*```$/i,
      "",
    )
    .trim();
}


function normalizarClaveDinamica(
  valor: unknown,
) {
  return String(
    valor ?? "",
  )
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase(
      "es-AR",
    )
    .replace(
      /[^a-z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    )
    .slice(
      0,
      50,
    );
}


const SUPABASE_URL =
  texto(
    Deno.env.get(
      "SUPABASE_URL",
    ),
  )
    .replace(
      /\/rest\/v1\/?$/i,
      "",
    )
    .replace(
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


const GEMINI_API_KEY =
  texto(
    Deno.env.get(
      "GEMINI_API_KEY",
    ),
  );


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


if (
  !GEMINI_API_KEY
) {
  throw new Error(
    "Falta GEMINI_API_KEY.",
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
  const apiKey =
    texto(
      request.headers.get(
        "apikey",
      ),
    );

  if (
    !apiKey
  ) {
    return false;
  }

  /*
    Caso 1:
    si el secreto recibido coincide exactamente
    con la clave administrativa disponible en el
    entorno de la Edge Function, autorizamos
    sin hacer ninguna llamada extra.
  */
  if (
    apiKey ===
      SUPABASE_ADMIN_KEY
  ) {
    return true;
  }

  /*
    Caso 2:
    Supabase también admite las nuevas claves
    sb_secret_*. Esas claves pueden no coincidir
    literalmente con la clave administrativa activa.

    Para validarlas de forma segura NO miramos
    solamente el prefijo. Probamos una operación
    administrativa mínima contra Auth.

    Una publishable/anon key no puede completar
    esta operación; una secret/service key válida sí.
  */
  try {
    const clienteVerificacion =
      createClient(
        SUPABASE_URL,
        apiKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        },
      );

    const {
      error,
    } =
      await clienteVerificacion
        .auth
        .admin
        .listUsers({
          page:
            1,

          perPage:
            1,
        });

    if (
      error
    ) {
      console.error(
        "MAGIA worker: apikey rechazada:",
        error.message,
      );

      return false;
    }

    return true;
  } catch (
    error
  ) {
    console.error(
      "MAGIA worker: error validando apikey:",
      error,
    );

    return false;
  }
}


/*
  ======================================================
  DATOS ESPECÍFICOS
  ======================================================
*/

function validarDatosEspecificos(
  valor: unknown,
) {
  if (
    !valor ||
    typeof valor !==
      "object" ||
    Array.isArray(
      valor,
    )
  ) {
    return {};
  }

  const entrada =
    valor as Record<
      string,
      unknown
    >;

  const salida:
    Record<
      string,
      string | string[]
    > =
      {};

  const bloqueadas =
    new Set([
      "__proto__",
      "prototype",
      "constructor",
    ]);

  let cantidad =
    0;

  for (
    const [
      claveOriginal,
      dato,
    ]
    of Object.entries(
      entrada,
    )
  ) {
    if (
      cantidad >= 6
    ) {
      break;
    }

    const clave =
      normalizarClaveDinamica(
        claveOriginal,
      );

    if (
      !clave ||
      bloqueadas.has(
        clave,
      )
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
            (
              item,
            ) =>
              limitarTexto(
                item,
                160,
              ),
          )
          .filter(
            Boolean,
          )
          .slice(
            0,
            8,
          );

      if (
        lista.length > 0
      ) {
        salida[
          clave
        ] =
          lista;

        cantidad +=
          1;
      }

      continue;
    }

    const valorTexto =
      limitarTexto(
        dato,
        300,
      );

    if (
      valorTexto
    ) {
      salida[
        clave
      ] =
        valorTexto;

      cantidad +=
        1;
    }
  }

  return salida;
}


function validarAnalisisObjeto(
  valor: unknown,
) {
  if (
    !valor ||
    typeof valor !==
      "object" ||
    Array.isArray(
      valor,
    )
  ) {
    throw new Error(
      "La IA devolvió un análisis inválido.",
    );
  }

  const datos =
    valor as Record<
      string,
      unknown
    >;

  const objeto =
    limitarTexto(
      datos.objeto,
      160,
    );

  const categoria =
    limitarTexto(
      datos.categoria,
      120,
    );

  const tituloSugerido =
    limitarTexto(
      datos.tituloSugerido,
      180,
    );

  const descripcionSugerida =
    limitarTexto(
      datos.descripcionSugerida,
      3000,
    );

  if (
    !objeto ||
    !categoria ||
    !tituloSugerido ||
    !descripcionSugerida
  ) {
    throw new Error(
      "El análisis quedó incompleto.",
    );
  }

  const confianzaCruda =
    limitarTexto(
      datos.confianza,
      20,
    );

  const confianza =
    (
      confianzaCruda ===
        "alta" ||
      confianzaCruda ===
        "media" ||
      confianzaCruda ===
        "baja"
    )
      ? confianzaCruda
      : "baja";

  const detallesObservables =
    Array.isArray(
      datos.detallesObservables,
    )
      ? datos.detallesObservables
          .map(
            (
              detalle,
            ) =>
              limitarTexto(
                detalle,
                300,
              ),
          )
          .filter(
            Boolean,
          )
          .slice(
            0,
            12,
          )
      : [];

  return {
    objeto,

    categoria,

    marca:
      datos.marca
        ? limitarTexto(
            datos.marca,
            120,
          )
        : null,

    modelo:
      datos.modelo
        ? limitarTexto(
            datos.modelo,
            160,
          )
        : null,

    datosEspecificos:
      validarDatosEspecificos(
        datos.datosEspecificos,
      ),

    tituloBloqueInformativo:
      limitarTexto(
        datos.tituloBloqueInformativo,
        80,
      ) ||
      "Descripción",

    detallesObservables,

    estadoAparente:
      datos.estadoAparente
        ? limitarTexto(
            datos.estadoAparente,
            500,
          )
        : null,

    tituloSugerido,

    descripcionSugerida,

    precioReferencia:
      null,

    consultaMercadoSugerida:
      datos.consultaMercadoSugerida
        ? limitarTexto(
            datos.consultaMercadoSugerida,
            300,
          )
        : null,

    siguienteFotoSugerida:
      datos.siguienteFotoSugerida
        ? limitarTexto(
            datos.siguienteFotoSugerida,
            300,
          )
        : null,

    ayudaEtiqueta:
      datos.ayudaEtiqueta
        ? limitarTexto(
            datos.ayudaEtiqueta,
            300,
          )
        : null,

    confianza,
  };
}


/*
  ======================================================
  FOTOS DEL BORRADOR
  ======================================================
*/

async function obtenerArchivos(
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
          "borrador_temporal_id",
          "posicion",
          "tipo",
          "bucket",
          "ruta",
          "mime_type",
          "bytes",
          "estado",
        ].join(
          ",",
        ),
      )
      .eq(
        "borrador_temporal_id",
        borradorTemporalId,
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

  const filas =
    data ||
    [];

  /*
    Para entender el objeto preferimos SIEMPRE
    los originales.

    Las procesadas sirven como respaldo si por
    algún motivo no encontramos el original.

    Esto también evita que una mala eliminación
    de fondo cambie lo que MAGIA cree que se vende.
  */

  const elegidas:
    any[] =
      [];

  for (
    let posicion = 1;
    posicion <= 5;
    posicion += 1
  ) {
    const candidatas =
      filas.filter(
        (
          archivo,
        ) =>
          Number(
            archivo.posicion,
          ) ===
          posicion,
      );

    const original =
      candidatas.find(
        (
          archivo,
        ) =>
          texto(
            archivo.tipo,
          ).toUpperCase() ===
          "ORIGINAL",
      );

    const procesada =
      candidatas.find(
        (
          archivo,
        ) =>
          texto(
            archivo.tipo,
          ).toUpperCase() ===
            "PROCESADA" &&
          texto(
            archivo.estado,
          ).toUpperCase() ===
            "LISTO",
      );

    const elegida =
      original ||
      procesada;

    if (
      elegida
    ) {
      elegidas.push(
        elegida,
      );
    }
  }

  if (
    elegidas.length === 0
  ) {
    throw new Error(
      "Todavía no encontramos fotos del objeto en el servidor.",
    );
  }

  return elegidas;
}


function bytesABase64(
  bytes: Uint8Array,
) {
  let binario =
    "";

  const bloque =
    8192;

  for (
    let indice = 0;
    indice <
      bytes.length;
    indice += bloque
  ) {
    binario +=
      String.fromCharCode(
        ...bytes.subarray(
          indice,
          indice +
            bloque,
        ),
      );
  }

  return btoa(
    binario,
  );
}


async function prepararImagenesGemini(
  borradorTemporalId: string,
) {
  const archivos =
    await obtenerArchivos(
      borradorTemporalId,
    );

  const imagenes:
    Record<
      string,
      unknown
    >[] =
      [];

  for (
    const archivo
    of archivos.slice(
      0,
      5,
    )
  ) {
    const bucket =
      texto(
        archivo.bucket,
      ) ||
      BUCKET_TEMPORAL;

    const ruta =
      texto(
        archivo.ruta,
      );

    if (
      !ruta
    ) {
      continue;
    }

    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          bucket,
        )
        .download(
          ruta,
        );

    if (
      error
    ) {
      throw error;
    }

    if (
      !data ||
      data.size <= 0
    ) {
      throw new Error(
        `La foto ${archivo.posicion} está vacía.`,
      );
    }

    /*
      Evitamos que una foto gigantesca bloquee
      todo el worker.

      Las fotos normales del celular quedan
      ampliamente dentro de este límite.
    */
    if (
      data.size >
      15 * 1024 * 1024
    ) {
      throw new Error(
        `La foto ${archivo.posicion} es demasiado pesada para analizar.`,
      );
    }

    const buffer =
      await data.arrayBuffer();

    const base64 =
      bytesABase64(
        new Uint8Array(
          buffer,
        ),
      );

    imagenes.push({
      inlineData: {
        mimeType:
          texto(
            archivo.mime_type,
          ) ||
          data.type ||
          "image/jpeg",

        data:
          base64,
      },
    });
  }

  if (
    imagenes.length === 0
  ) {
    throw new Error(
      "No pudimos preparar ninguna foto para MAGIA.",
    );
  }

  return imagenes;
}


/*
  ======================================================
  PROMPT MAGIA

  REGLA NUEVA IMPORTANTE:
  EL OBJETO PRINCIPAL SE DETERMINA ENTRE TODAS
  LAS FOTOS, NO MIRANDO UNA FOTO AISLADA.
  ======================================================
*/

function promptAnalizarObjeto(
  cantidadFotos: number,
) {
  const reglaFoto =
    cantidadFotos >= 5
      ? `
La persona ya cargó el máximo de 5 fotos.

No pidas una sexta foto.

Si falta una vista verdaderamente importante,
podés sugerir reemplazar una de las actuales.

Si ya hay suficiente información:
"siguienteFotoSugerida": null
`
      : `
La persona cargó ${cantidadFotos}
de un máximo de 5 fotos.

Si otra foto aportaría información
realmente importante, podés sugerirla.

No pidas fotos innecesarias.
`;

  return `
Sos MAGIA, la asistencia inteligente
de Nos Sirve, una plataforma argentina
dedicada exclusivamente a objetos usados.

Recibiste ${cantidadFotos}
${cantidadFotos === 1
  ? "fotografía"
  : "fotografías"}
correspondientes a UNA MISMA PUBLICACIÓN.

Tu trabajo es entender qué objeto
está intentando vender la persona.

========================================
OBJETO PRINCIPAL ENTRE VARIAS FOTOS
========================================

ESTA REGLA ES PRIORITARIA.

No analices cada foto como si fuera
una publicación distinta.

Miralas como un conjunto.

El objeto principal suele ser el elemento
que:

- se repite en varias fotos;
- ocupa el centro de atención;
- aparece desde distintos ángulos;
- recibe primeros planos o detalles;
- mantiene identidad visual entre imágenes.

Los elementos que aparecen accidentalmente
en una sola foto deben tratarse como
CONTEXTO O FONDO, salvo evidencia clara
de que también forman parte del objeto vendido.

Ejemplos de elementos incidentales:

- autos;
- paredes;
- pisos;
- plantas;
- muebles del ambiente;
- personas;
- mascotas;
- otros objetos cercanos.

Ejemplo concreto:

si un sillón aparece en cuatro o cinco fotos
y un auto aparece solamente detrás del sillón
en una de ellas, EL PRODUCTO ES EL SILLÓN.

El auto es fondo.

Nunca cambies el objeto principal
solo porque un elemento incidental
sea grande o visualmente llamativo
en una foto aislada.

Antes de identificar el producto,
compará TODAS las imágenes
y buscá continuidad entre ellas.

========================================
PRINCIPIO GENERAL
========================================

Pensá en este orden:

1. ¿Qué elemento se repite y constituye
   claramente el objeto de la publicación?

2. ¿Qué objeto es?

3. ¿Qué categoría general le corresponde?

4. ¿Puedo identificar marca, modelo,
   edición, versión u otra identidad relevante?

5. ¿Qué datos son realmente útiles
   para una persona que quisiera evaluar
   ESTE tipo de objeto?

6. ¿Cuáles puedo afirmar con seguridad?

7. ¿Qué información adicional aporta valor
   sin repetir datos estructurados?

8. ¿Qué consulta permitiría investigar luego
   el precio actual de mercado?

========================================
NO INVENTAR
========================================

Una foto demuestra principalmente apariencia.

No demuestra automáticamente:

- funcionamiento;
- composición interna;
- procedencia;
- historia;
- autenticidad;
- antigüedad;
- especificaciones técnicas;
- rendimiento.

Si algo no puede determinarse
con suficiente seguridad,
no lo afirmes.

========================================
DATOS ESPECÍFICOS
========================================

Usá "datosEspecificos"
como ficha dinámica.

Elegí hasta 6 datos que sean
realmente útiles para ESE objeto.

No existe una lista obligatoria.

Las claves deben ser cortas,
claras y en snake_case.

Ejemplos posibles:

"autor"
"editorial"
"isbn"
"marca"
"modelo"
"material"
"medidas"
"tipo"
"capacidad"
"rodado"
"talle"
"edicion"
"incluye"

Son ejemplos, no campos obligatorios.

No completes características
solamente porque ese tipo de producto
normalmente las tenga.

========================================
MARCA Y MODELO
========================================

Informalos únicamente
si hay suficiente certeza.

Si no:
null.

========================================
DESCRIPCIÓN
========================================

"descripcionSugerida"
debe aportar información útil
sin repetir mecánicamente
los datosEspecificos.

Para un libro claramente identificado,
puede explicar brevemente de qué trata.

Para un mueble,
puede describir tipo, formato
y uso visible.

Para objetos técnicos,
explicá lo que realmente pueda
identificarse sin inventar.

Extensión normal:
2 a 5 oraciones.

No incluyas:

- precio;
- ubicación;
- modalidad.

========================================
ESTADO APARENTE
========================================

Basate solamente en lo visible.

Ejemplos correctos:

"Se observan algunas marcas de uso."

"No se observan roturas evidentes
en estas fotografías."

Nunca afirmes:

"Está impecable."

"Está como nuevo."

"Funciona perfectamente."

========================================
DETALLES OBSERVABLES
========================================

Deben ser hechos concretos visibles.

No confundas objetos del fondo
con características del producto.

========================================
TÍTULO
========================================

Debe ser:

- corto;
- claro;
- reconocible;
- útil para búsqueda.

Priorizá la identidad real del objeto.

No agregues:

- hermoso;
- espectacular;
- oportunidad;
- impecable.

========================================
PRECIO
========================================

NO ESTIMES PRECIOS.

NO USES PRECIOS DE MEMORIA.

Devolvé siempre:

"precioReferencia": null

========================================
CONSULTA PARA MERCADO
========================================

"consultaMercadoSugerida"
debe ser una búsqueda breve
para investigar precios actuales
de objetos usados en Argentina.

Usá únicamente datos identificados
con suficiente seguridad.

Ejemplos:

"Taladro Bosch GSB 13 RE usado Argentina"

"Bicicleta mountain bike rodado 29 usada Argentina"

Si la identificación es demasiado incierta:
null.

========================================
SIGUIENTE FOTO
========================================

${reglaFoto}

Sugerí otra foto solamente
si realmente mejora la identificación
o permite mostrar un dato importante.

========================================
AYUDA DE IDENTIFICACIÓN
========================================

Usá "ayudaEtiqueta"
cuando tenga sentido orientar
a la persona para buscar:

- etiqueta;
- placa;
- ISBN;
- modelo;
- número de serie.

Debe ser breve y práctica.

========================================
CATEGORÍA
========================================

Usá una categoría humana y amplia.

Ejemplos:

Libros
Electrodomésticos
Tecnología
Muebles
Hogar
Herramientas
Indumentaria
Bicicletas
Decoración
Coleccionables
Otros

========================================
CONFIANZA
========================================

"alta":
identificación clara.

"media":
probable con alguna ambigüedad.

"baja":
insegura.

========================================
CONTROL FINAL
========================================

Antes de responder, revisá silenciosamente:

¿Identifiqué el objeto usando
el conjunto completo de fotos?

¿Confundí algo del fondo
con el producto?

¿El objeto que elegí
es el que se repite?

¿Estoy inventando algún dato?

¿Estoy repitiendo la ficha
dentro de la descripción?

¿Estoy inventando precio?

Si alguna respuesta indica un error,
corregilo antes de devolver el JSON.

========================================
RESPUESTA
========================================

Respondé ÚNICAMENTE JSON válido.

Usá exactamente esta estructura:

{
  "objeto": "",
  "categoria": "",
  "marca": null,
  "modelo": null,
  "datosEspecificos": {},
  "tituloBloqueInformativo": "",
  "detallesObservables": [],
  "estadoAparente": null,
  "tituloSugerido": "",
  "descripcionSugerida": "",
  "precioReferencia": null,
  "consultaMercadoSugerida": null,
  "siguienteFotoSugerida": null,
  "ayudaEtiqueta": null,
  "confianza": "alta"
}

No agregues texto antes ni después.
`.trim();
}


/*
  ======================================================
  GEMINI
  ======================================================
*/

async function llamarGemini({
  modelo,
  prompt,
  imagenes,
}: {
  modelo: string;

  prompt: string;

  imagenes:
    Record<
      string,
      unknown
    >[];
}) {
  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({
          contents: [
            {
              role:
                "user",

              parts: [
                {
                  text:
                    prompt,
                },

                ...imagenes,
              ],
            },
          ],

          generationConfig: {
            maxOutputTokens:
              2200,

            responseMimeType:
              "application/json",

            thinkingConfig: {
              thinkingLevel:
                "MINIMAL",

              includeThoughts:
                false,
            },
          },
        }),
    },
  );
}


async function analizarConGemini(
  imagenes:
    Record<
      string,
      unknown
    >[],
) {
  let ultimoError:
    Error | null =
      null;

  for (
    const modelo
    of GEMINI_MODELOS
  ) {
    try {
      console.log(
        `MAGIA worker: intentando ${modelo}`,
      );

      const respuesta =
        await llamarGemini({
          modelo,

          prompt:
            promptAnalizarObjeto(
              imagenes.length,
            ),

          imagenes,
        });

      let data:
        any = null;

      try {
        data =
          await respuesta.json();
      } catch {
        data =
          null;
      }

      if (
        !respuesta.ok
      ) {
        throw new Error(
          data?.error?.message ||
          `Gemini respondió HTTP ${respuesta.status}.`,
        );
      }

      const partes =
        data?.candidates?.[0]
          ?.content?.parts ||
        [];

      const contenido =
        partes
          .filter(
            (
              parte: any,
            ) =>
              Boolean(
                parte?.text,
              ) &&
              parte?.thought !==
                true,
          )
          .map(
            (
              parte: any,
            ) =>
              parte.text,
          )
          .join(
            "",
          )
          .trim();

      if (
        !contenido
      ) {
        throw new Error(
          "Gemini devolvió una respuesta vacía.",
        );
      }

      const limpio =
        limpiarJsonGemini(
          contenido,
        );

      let interpretado:
        unknown;

      try {
        interpretado =
          JSON.parse(
            limpio,
          );
      } catch {
        throw new Error(
          "Gemini devolvió un JSON inválido.",
        );
      }

      const analisis =
        validarAnalisisObjeto(
          interpretado,
        );

      console.log(
        `MAGIA worker: análisis correcto con ${modelo}`,
      );

      return analisis;
    } catch (
      error
    ) {
      ultimoError =
        error instanceof
          Error
          ? error
          : new Error(
              String(
                error,
              ),
            );

      console.error(
        `MAGIA worker: falló ${modelo}:`,
        ultimoError,
      );
    }
  }

  throw (
    ultimoError ||
    new Error(
      "Todos los modelos de MAGIA fallaron.",
    )
  );
}


/*
  ======================================================
  COLA
  ======================================================
*/

async function tomarTrabajos() {
  const workerId =
    `magia-ia-${crypto.randomUUID()}`;

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "tomar_trabajos_analisis_ia",
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
      data ||
      [],
  };
}


async function marcarCompletado(
  trabajoId: string,
  resultado: unknown,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "marcar_trabajo_analisis_completado",
      {
        p_trabajo_id:
          trabajoId,

        p_resultado:
          resultado,
      },
    );

  if (
    error
  ) {
    throw error;
  }
}


async function marcarError(
  trabajoId: string,
  mensaje: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "marcar_trabajo_analisis_error",
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
      "MAGIA worker: no se pudo registrar ERROR:",
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

  const borradorTemporalId =
    texto(
      trabajo?.borrador_id,
    );

  if (
    !trabajoId ||
    !borradorTemporalId
  ) {
    throw new Error(
      "El trabajo de análisis está incompleto.",
    );
  }

  const imagenes =
    await prepararImagenesGemini(
      borradorTemporalId,
    );

  const analisis =
    await analizarConGemini(
      imagenes,
    );

  await marcarCompletado(
    trabajoId,
    analisis,
  );

  return {
    trabajoId,

    cantidadFotos:
      imagenes.length,

    objeto:
      analisis.objeto,
  };
}


/*
  ======================================================
  ENDPOINT WORKER
  ======================================================
*/

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
        trabajos.length === 0
      ) {
        return json({
          ok:
            true,

          workerId,

          tomados:
            0,

          completados:
            0,

          errores:
            0,

          mensaje:
            "No hay análisis pendientes.",
        });
      }

      const resultados:
        any[] =
          [];

      let completados =
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

          completados +=
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
              error instanceof
                Error
                ? `${error.name}: ${error.message}`
                : texto(
                    error,
                  )
            ).slice(
              0,
              4000,
            );

          console.error(
            `MAGIA worker ERROR ${trabajoId}:`,
            error,
          );

          if (
            trabajoId
          ) {
            await marcarError(
              trabajoId,
              mensaje,
            );
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

        completados,

        errores,

        resultados,
      });
    } catch (
      error
    ) {
      console.error(
        "MAGIA worker ERROR FATAL:",
        error,
      );

      return json(
        {
          ok:
            false,

          error:
            error instanceof
              Error
              ? `${error.name}: ${error.message}`
              : texto(
                  error,
                ),
        },
        500,
      );
    }
  },
);