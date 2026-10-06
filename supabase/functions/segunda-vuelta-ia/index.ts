const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY");

const GEMINI_MODELOS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

type Accion =
  | "descripcion"
  | "frase"
  | "analizar_objeto";

type ImagenEntrada = {
  url?: string;
  mimeType?: string;
  data?: string;
};

type Payload = {
  accion?: Accion;

  titulo?: string;
  descripcion?: string;

  modalidad?: string;
  valor?: number | string;

  provincia?: string;
  localidad?: string;
  barrio?: string;

  imagenes?: ImagenEntrada[];
};

type ParteGemini = {
  text?: string;
  thought?: boolean;
};

type DatosEspecificos = Record<
  string,
  string | string[]
>;

type AnalisisObjeto = {
  objeto: string;

  categoria: string;

  marca: string | null;

  modelo: string | null;

  datosEspecificos:
    DatosEspecificos;

  tituloBloqueInformativo:
    string;

  detallesObservables:
    string[];

  estadoAparente:
    string | null;

  tituloSugerido:
    string;

  descripcionSugerida:
    string;

  precioReferencia:
    null;

  consultaMercadoSugerida:
    string | null;

  siguienteFotoSugerida:
    string | null;

  ayudaEtiqueta:
    string | null;

  confianza:
    | "alta"
    | "media"
    | "baja";
};

class ErrorGeminiTemporal
  extends Error {
  status: number;

  codigo: string;

  retryAfterSeconds:
    number | null;

  constructor({
    mensaje,
    status,
    codigo,
    retryAfterSeconds = null,
  }: {
    mensaje: string;

    status: number;

    codigo: string;

    retryAfterSeconds?: number | null;
  }) {
    super(mensaje);

    this.name =
      "ErrorGeminiTemporal";

    this.status =
      status;

    this.codigo =
      codigo;

    this.retryAfterSeconds =
      retryAfterSeconds;
  }
}

function responder(
  body: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        ...corsHeaders,

        "Content-Type":
          "application/json; charset=utf-8",
      },
    }
  );
}

function limitarTexto(
  valor: unknown,
  maximo: number
) {
  return String(
    valor ?? ""
  )
    .trim()
    .slice(
      0,
      maximo
    );
}

function construirUbicacion(
  payload: Payload
) {
  return [
    limitarTexto(
      payload.barrio,
      120
    ),

    limitarTexto(
      payload.localidad,
      120
    ),

    limitarTexto(
      payload.provincia,
      120
    ),
  ]
    .filter(Boolean)
    .join(", ");
}

function pareceRespuestaInterna(
  texto: string
) {
  const limpio =
    texto
      .trim()
      .toLocaleLowerCase(
        "es-AR"
      );

  const patrones = [
    "might be inventing",
    "explicitly stated",
    "stick strictly",
    "the user",
    "the prompt",
    "i should",
    "i need to",
    "we need to",
    "note:",
    "(note:",
    "nota:",
    "(nota:",
    "no se incluyó ninguna información",
    "no se incluyo ninguna informacion",
    "según las instrucciones",
    "segun las instrucciones",
    "no debo inventar",
    "debo evitar",
    "la respuesta debe",
  ];

  return patrones.some(
    (patron) =>
      limpio.includes(
        patron
      )
  );
}

function limpiarSalida(
  texto: string
) {
  return texto
    .trim()
    .replace(
      /^["'“”]+|["'“”]+$/g,
      ""
    )
    .trim();
}

function limpiarJsonGemini(
  texto: string
) {
  return texto
    .trim()
    .replace(
      /^```json\s*/i,
      ""
    )
    .replace(
      /^```\s*/i,
      ""
    )
    .replace(
      /\s*```$/i,
      ""
    )
    .trim();
}

function normalizarClaveDinamica(
  valor: unknown
) {
  return String(
    valor ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLocaleLowerCase(
      "es-AR"
    )
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .slice(
      0,
      50
    );
}

function obtenerRetryAfterSeconds(
  data: any
) {
  const detalles =
    Array.isArray(
      data?.error?.details
    )
      ? data.error.details
      : [];

  for (
    const detalle
    of detalles
  ) {
    const retryDelay =
      detalle?.retryDelay;

    if (
      typeof retryDelay ===
      "string"
    ) {
      const match =
        retryDelay.match(
          /(\d+(?:\.\d+)?)s/i
        );

      if (match) {
        const segundos =
          Math.ceil(
            Number(
              match[1]
            )
          );

        if (
          Number.isFinite(
            segundos
          ) &&
          segundos > 0
        ) {
          return segundos;
        }
      }
    }
  }

  const mensaje =
    String(
      data?.error?.message ||
      ""
    );

  const matchMensaje =
    mensaje.match(
      /retry in\s+(\d+(?:\.\d+)?)s/i
    );

  if (
    matchMensaje
  ) {
    const segundos =
      Math.ceil(
        Number(
          matchMensaje[1]
        )
      );

    if (
      Number.isFinite(
        segundos
      ) &&
      segundos > 0
    ) {
      return segundos;
    }
  }

  return null;
}

async function urlAInlineData(
  url: string
) {
  const respuesta =
    await fetch(url);

  if (
    !respuesta.ok
  ) {
    throw new Error(
      "No se pudo leer una de las imágenes."
    );
  }

  const tipo =
    respuesta.headers.get(
      "content-type"
    ) ||
    "image/webp";

  if (
    !tipo.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Uno de los archivos recibidos no es una imagen."
    );
  }

  const buffer =
    await respuesta.arrayBuffer();

  if (
    buffer.byteLength >
    5 * 1024 * 1024
  ) {
    throw new Error(
      "Una de las imágenes es demasiado grande."
    );
  }

  const bytes =
    new Uint8Array(
      buffer
    );

  let binario =
    "";

  const bloque =
    8192;

  for (
    let i = 0;
    i < bytes.length;
    i += bloque
  ) {
    binario +=
      String.fromCharCode(
        ...bytes.subarray(
          i,
          i + bloque
        )
      );
  }

  return {
    inlineData: {
      mimeType:
        tipo,

      data:
        btoa(
          binario
        ),
    },
  };
}

async function prepararImagenes(
  imagenes:
    ImagenEntrada[] = []
) {
  const partes:
    Record<
      string,
      unknown
    >[] = [];

  for (
    const imagen
    of imagenes.slice(
      0,
      5
    )
  ) {
    try {
      if (
        imagen.data &&
        imagen.mimeType
          ?.startsWith(
            "image/"
          )
      ) {
        partes.push({
          inlineData: {
            mimeType:
              imagen.mimeType,

            data:
              imagen.data,
          },
        });

        continue;
      }

      if (
        imagen.url &&
        /^https?:\/\//i.test(
          imagen.url
        )
      ) {
        partes.push(
          await urlAInlineData(
            imagen.url
          )
        );
      }
    } catch (error) {
      console.error(
        "Imagen omitida:",
        error
      );
    }
  }

  return partes;
}

function promptDescripcion(
  payload: Payload
) {
  const titulo =
    limitarTexto(
      payload.titulo,
      180
    );

  const descripcion =
    limitarTexto(
      payload.descripcion,
      3000
    );

  return `
Sos el asistente de redacción de Nos Sirve,
una plataforma argentina dedicada
exclusivamente a objetos usados.

Tu tarea es mejorar solamente
la FORMA del texto
que escribió la persona.

NO completes hechos.

NO inventes información.

Corregí:

- ortografía;
- puntuación;
- mayúsculas;
- concordancia;
- abreviaturas;
- orden;
- claridad.

PRINCIPIO:

MEJORÁ LA FORMA.
NO CAMBIES EL CONTENIDO.

No inventes:

- marca;
- modelo;
- medidas;
- materiales;
- color;
- estado;
- funcionamiento;
- accesorios;
- antigüedad;
- defectos;
- procedencia;
- mantenimiento;
- cualidades.

No conviertas una afirmación
en otra más fuerte.

Evitá usar "pero"
para compensar defectos
con virtudes.

Usá español natural
de Argentina.

No agregues:

- precio;
- ubicación;
- publicidad;
- frases comerciales;
- emojis.

La respuesta se copiará
directamente al campo público.

No expliques nada.

Entregá ÚNICAMENTE
el texto final publicable.

Título:
${titulo || "No informado"}

Texto original:
${descripcion}
`.trim();
}

function promptFrase(
  payload: Payload
) {
  const titulo =
    limitarTexto(
      payload.titulo,
      180
    );

  const descripcion =
    limitarTexto(
      payload.descripcion,
      3000
    );

  const ubicacion =
    construirUbicacion(
      payload
    );

  const modalidad =
    payload.modalidad ===
    "PRECIO_FIJO"
      ? "Precio fijo"
      : "Recibe propuestas";

  const valor =
    limitarTexto(
      payload.valor,
      80
    );

  return `
Sos el asistente creativo
de Nos Sirve,
una plataforma argentina
de objetos usados.

Generá UNA frase breve
de cierre.

Debe ser:

- humana;
- cálida;
- breve;
- específica;
- respetuosa de la realidad.

Podés invitar
a darle una segunda oportunidad.

No inventes:

- características;
- estado;
- calidad;
- funcionamiento;
- urgencia;
- antigüedad;
- historia pasada;
- procedencia.

Evitá lenguaje de:

- remate;
- subasta;
- puja;
- ganador.

No incluyas:

- hashtags;
- precio;
- ubicación;
- comillas;
- menciones a IA.

No expliques nada.

Entregá ÚNICAMENTE
la frase final.

Título:
${titulo || "No informado"}

Descripción:
${descripcion || "No informada"}

Modalidad:
${modalidad}

Valor:
${valor || "No informado"}

Ubicación:
${ubicacion || "No informada"}

Si recibís imágenes,
usá solamente información
claramente visible.

Si algo es ambiguo,
no lo afirmes.
`.trim();
}

function promptAnalizarObjeto(
  cantidadFotos: number
) {
  const reglaFotos =
    cantidadFotos >= 5
      ? `
La persona YA CARGÓ
EL MÁXIMO DE 5 FOTOS.

No pidas una sexta foto.

Si falta una vista
verdaderamente importante,
podés sugerir reemplazar
una de las actuales.

Si ya hay suficiente información:

"siguienteFotoSugerida": null
`
      : `
La persona cargó
${cantidadFotos}
de un máximo de 5 fotos.

Si una nueva foto
aportaría información
verdaderamente importante,
podés sugerirla.

No pidas fotos innecesarias.
`;

  return `
Sos MAGIA,
la asistencia inteligente
de Nos Sirve,
una plataforma argentina
dedicada exclusivamente
a objetos usados.

Recibiste ${cantidadFotos}
${cantidadFotos === 1
  ? "fotografía"
  : "fotografías"}
del mismo objeto.

Tu trabajo NO consiste
en aplicar una plantilla rígida.

Tu trabajo consiste en
ENTENDER QUÉ OBJETO ES
y decidir qué información
es realmente útil
para publicarlo bien.

========================================
PRINCIPIO GENERAL
========================================

Pensá en este orden:

1. ¿Qué objeto estoy viendo?

2. ¿Qué categoría general
   le corresponde?

3. ¿Puedo identificar
   marca, modelo, edición,
   versión u otra identidad
   relevante?

4. ¿Qué datos son realmente
   importantes para una persona
   que quisiera evaluar
   ESTE tipo de objeto?

5. ¿Cuáles de esos datos
   puedo afirmar con seguridad?

6. ¿Qué información adicional
   ayudaría a entenderlo
   sin repetir los datos
   estructurados?

7. ¿Qué título debería tener
   ese bloque de información?

8. ¿Qué consulta sería adecuada
   para investigar después
   su precio real de mercado?

No trabajes
producto por producto
con reglas rígidas.

Adaptate al objeto.

========================================
NO INVENTAR
========================================

Una foto demuestra principalmente
APARIENCIA.

No demuestra automáticamente:

- funcionamiento;
- composición interna;
- procedencia;
- historia;
- autenticidad;
- antigüedad;
- especificaciones técnicas;
- duración;
- rendimiento.

No inventes esos datos.

Si algo no puede determinarse
con suficiente seguridad,
no lo afirmes.

========================================
DATOS RELEVANTES DINÁMICOS
========================================

Usá "datosEspecificos"
como una ficha dinámica.

Elegí hasta 6 datos
que realmente sean útiles
para ESE objeto.

NO existe una lista obligatoria.

Los nombres de las claves
deben ser cortos,
claros
y escritos en snake_case.

Ejemplos posibles:

"autor"

"editorial"

"isbn"

"rodado"

"cantidad_de_cambios"

"capacidad"

"material"

"medidas"

"tipo"

"marca"

"modelo"

"potencia"

"talle"

"edicion"

"serie"

"personaje"

"compatibilidad"

"incluye"

"tipo_de_uso"

"conservacion_termica"

Estos son sólo ejemplos.

NO significa que debas
usar esos campos.

Vos decidís
qué datos importan
según el objeto.

Ejemplo libro:

{
  "autor": "Eckhart Tolle",
  "editorial": "Gaia Ediciones",
  "isbn": "9789873797255",
  "idioma": "Español"
}

Ejemplo bicicleta:

{
  "rodado": "29",
  "tipo": "Mountain Bike",
  "cantidad_de_cambios": "21"
}

Ejemplo termo:

{
  "capacidad": "1 litro",
  "material": "Acero inoxidable"
}

IMPORTANTE:

No completes un dato técnico
solamente porque
"normalmente ese modelo lo tiene".

Para especificaciones técnicas,
necesitás evidencia suficiente.

========================================
MARCA Y MODELO
========================================

Los campos generales
"marca"
y
"modelo"
se mantienen
por compatibilidad.

Informalos solamente
si tenés suficiente certeza.

Si no:
null.

Si corresponden
y también son relevantes
para la ficha,
podés incluirlos además
dentro de datosEspecificos.

========================================
BLOQUE INFORMATIVO DINÁMICO
========================================

Además de datosEspecificos,
devolvé:

"tituloBloqueInformativo"

y

"descripcionSugerida"

El título NO es fijo.

Elegí el título
que tenga más sentido
para el objeto.

Puede ser, por ejemplo:

"Reseña"

"Características"

"Descripción"

"Información útil"

"Detalles"

"Sobre este objeto"

"Ficha del producto"

Estos son ejemplos,
no opciones obligatorias.

Elegí el más natural.

========================================
CONTENIDO DEL BLOQUE
========================================

descripcionSugerida
debe aportar algo útil
que NO esté ya resuelto
por datosEspecificos.

NO repitas
como párrafo
los mismos campos
que acabás de devolver.

Para un libro
claramente identificado,
puede ser una reseña breve
sobre de qué trata.

Para un objeto técnico,
puede explicar
qué tipo de producto es
o cuáles son sus características
relevantes conocidas
sin inventar especificaciones.

Para un mueble,
puede explicar
tipo, formato o uso
cuando corresponda.

Para una pieza decorativa,
puede ser una breve descripción.

Para un objeto simple,
puede bastar
una descripción breve.

Usá criterio.

La extensión normal
debe ser de 2 a 5 oraciones.

No vendas.

No exageres.

No uses frases comerciales.

No incluyas:

- precio;
- ubicación;
- modalidad.

========================================
CONOCIMIENTO GENERAL
========================================

Podés usar conocimiento general
solamente cuando el objeto
esté identificado
con suficiente confianza
y ese conocimiento aporte
contexto descriptivo.

Ejemplo:

si identificás claramente
una obra literaria conocida,
podés explicar brevemente
de qué trata.

NO uses conocimiento general
para inventar:

- estado;
- desgaste;
- funcionamiento;
- accesorios presentes;
- especificaciones técnicas dudosas;
- composición;
- medidas;
- potencia;
- capacidad;
- versión.

========================================
ESTADO APARENTE
========================================

estadoAparente
debe basarse solamente
en lo visible.

Ejemplos:

"Se observan algunas marcas de uso."

"Se distinguen marcas en algunos bordes."

"No se observan roturas evidentes en estas fotos."

Nunca escribas:

"Está impecable."

"Está como nuevo."

"Funciona perfectamente."

"Está en perfecto estado."

========================================
DETALLES OBSERVABLES
========================================

detallesObservables
debe contener
hechos concretos visibles.

No repitas innecesariamente
datosEspecificos.

Ejemplo:

[
  "Se observa la parte frontal.",
  "Se observa una etiqueta.",
  "Se distinguen marcas en un lateral."
]

========================================
TÍTULO PUBLICACIÓN
========================================

tituloSugerido
debe ser:

- corto;
- claro;
- reconocible;
- útil para búsqueda.

Priorizá
la identidad real del objeto.

No agregues:

- hermoso;
- espectacular;
- oportunidad;
- impecable.

========================================
PRECIO
========================================

NO ESTIMES PRECIOS.

NO USES PRECIOS
DE TU MEMORIA.

NO INVENTES RANGOS.

Nos Sirve
va a investigar el mercado
mediante una función separada
con información web actual.

Por ahora devolvé SIEMPRE:

"precioReferencia": null

========================================
CONSULTA PARA MERCADO
========================================

Prepará:

"consultaMercadoSugerida"

Debe ser una consulta
breve y específica
para que otra función
pueda buscar después
precios actuales
en Argentina.

Usá solamente
la identificación
que tengas con seguridad.

Incluí cuando corresponda:

- tipo de objeto;
- marca;
- modelo;
- edición;
- capacidad;
- rodado;
- versión;
- autor/título;
- palabra "usado";
- palabra "Argentina".

Ejemplo:

"Taladro Bosch GSB 13 RE usado Argentina"

Ejemplo:

"El Silencio Habla Eckhart Tolle usado Argentina"

Ejemplo:

"Bicicleta mountain bike rodado 29 usada Argentina"

No pongas
características dudosas.

Si la identificación
es demasiado incierta:

"consultaMercadoSugerida": null

========================================
SIGUIENTE FOTO
========================================

${reglaFotos}

Pensá especialmente
si una próxima foto
podría mejorar
la identificación.

Ejemplos:

"Mostranos la etiqueta de marca y modelo."

"Sumá una foto de la contratapa."

"Mostranos la placa técnica."

"Mostranos de cerca esa marca de uso."

Si no hace falta:
null.

========================================
AYUDA PARA IDENTIFICACIÓN
========================================

Usá ayudaEtiqueta
si podés orientar
a la persona
para encontrar:

- etiqueta;
- placa;
- ISBN;
- modelo;
- número de serie;
- identificación.

Debe ser breve
y práctica.

No inventes
dónde se encuentra
una etiqueta
si no lo sabés
razonablemente.

========================================
CATEGORÍA
========================================

Usá una categoría
humana y amplia.

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

No fuerces una categoría
si no corresponde.

========================================
CONFIANZA
========================================

"alta":
identificación clara.

"media":
identificación probable
con alguna ambigüedad.

"baja":
identificación insegura.

========================================
CONTROL FINAL
========================================

Antes de responder,
revisá silenciosamente:

¿Estoy describiendo
lo que realmente sé
o estoy completando?

Si estás completando
un dato técnico,
sacalo.

¿Los datosEspecificos
son realmente
los más útiles
para este objeto?

Si no,
reemplazalos.

¿La descripción
repite los campos?

Si sí,
reescribila.

¿El título del bloque
es natural
para este objeto?

Si no,
cambialo.

¿Estoy inventando
un precio?

Si sí,
eliminalo.

precioReferencia
debe ser null.

========================================
RESPUESTA
========================================

Respondé ÚNICAMENTE
con JSON válido.

Usá exactamente
esta estructura:

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

datosEspecificos
puede contener
entre 0 y 6 campos.

No agregues texto
antes ni después.
`.trim();
}

async function pedirAGemini({
  modelo,
  prompt,
  imagenes,
  generationConfig,
}: {
  modelo: string;

  prompt: string;

  imagenes:
    Record<
      string,
      unknown
    >[];

  generationConfig:
    Record<
      string,
      unknown
    >;
}) {
  const partes = [
    {
      text:
        prompt,
    },

    ...imagenes,
  ];

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

              parts:
                partes,
            },
          ],

          generationConfig,
        }),
    }
  );
}

async function extraerTextoRespuestaGemini(
  respuesta: Response
) {
  let data:
    any = null;

  try {
    data =
      await respuesta.json();
  } catch {
    data =
      null;
  }

  return data;
}

async function ejecutarGemini({
  prompt,
  imagenes = [],
  json = false,
}: {
  prompt: string;

  imagenes?: Record<
    string,
    unknown
  >[];

  json?: boolean;
}) {
  if (
    !GEMINI_API_KEY
  ) {
    throw new Error(
      "Falta configurar GEMINI_API_KEY."
    );
  }

  const generationConfig:
    Record<
      string,
      unknown
    > = {
      maxOutputTokens:
        json
          ? 2200
          : 500,

      thinkingConfig: {
        thinkingLevel:
          "MINIMAL",

        includeThoughts:
          false,
      },
    };

  if (
    json
  ) {
    generationConfig.responseMimeType =
      "application/json";
  }

  let ultimoStatus =
    503;

  let ultimoCodigo =
    "GEMINI_UNAVAILABLE";

  let ultimoMensaje =
    "La asistencia está ocupada en este momento. Tus fotos están guardadas.";

  let ultimoRetry:
    number | null =
      null;

  for (
    let indiceModelo = 0;
    indiceModelo <
      GEMINI_MODELOS.length;
    indiceModelo += 1
  ) {
    const modelo =
      GEMINI_MODELOS[
        indiceModelo
      ];

    const hayOtroModelo =
      indiceModelo <
      GEMINI_MODELOS.length -
        1;

    console.log(
      `Gemini: intentando con ${modelo}`
    );

    try {
      const respuesta =
        await pedirAGemini({
          modelo,
          prompt,
          imagenes,
          generationConfig,
        });

      const data =
        await extraerTextoRespuestaGemini(
          respuesta
        );

      if (
        !respuesta.ok
      ) {
        console.error(
          `Error Gemini ${modelo}:`,
          data
        );

        ultimoStatus =
          respuesta.status;

        ultimoRetry =
          obtenerRetryAfterSeconds(
            data
          );

        ultimoCodigo =
          respuesta.status ===
          429
            ? "GEMINI_RATE_LIMIT"
            : "GEMINI_UNAVAILABLE";

        ultimoMensaje =
          data?.error?.message ||
          "Gemini no pudo completar la solicitud.";

        if (
          hayOtroModelo
        ) {
          console.log(
            `${modelo} falló. Pasando automáticamente al modelo alternativo.`
          );

          continue;
        }

        break;
      }

      const partesRespuesta:
        ParteGemini[] =
          data?.candidates?.[0]
            ?.content?.parts ||
          [];

      const texto =
        partesRespuesta
          .filter(
            (
              parte
            ) =>
              Boolean(
                parte?.text
              ) &&
              parte.thought !==
                true
          )
          .map(
            (
              parte
            ) =>
              parte.text ||
              ""
          )
          .join("");

      const limpio =
        limpiarSalida(
          texto
        );

      if (
        !limpio
      ) {
        ultimoMensaje =
          "La IA devolvió una respuesta vacía.";

        if (
          hayOtroModelo
        ) {
          console.log(
            `${modelo} devolvió una respuesta vacía. Probando automáticamente el alternativo.`
          );

          continue;
        }

        break;
      }

      if (
        pareceRespuestaInterna(
          limpio
        )
      ) {
        ultimoMensaje =
          "La IA devolvió una respuesta no publicable.";

        if (
          hayOtroModelo
        ) {
          console.log(
            `${modelo} devolvió contenido no publicable. Probando automáticamente el alternativo.`
          );

          continue;
        }

        break;
      }

      if (
        json
      ) {
        try {
          JSON.parse(
            limpiarJsonGemini(
              limpio
            )
          );
        } catch {
          ultimoMensaje =
            "La IA devolvió un análisis que no pudimos interpretar.";

          if (
            hayOtroModelo
          ) {
            console.log(
              `${modelo} devolvió JSON inválido. Probando automáticamente el alternativo.`
            );

            continue;
          }

          break;
        }
      }

      console.log(
        `Gemini: respuesta correcta con ${modelo}`
      );

      return limpio;
    } catch (error) {
      console.error(
        `Fallo de conexión con ${modelo}:`,
        error
      );

      ultimoStatus =
        503;

      ultimoCodigo =
        "GEMINI_UNAVAILABLE";

      ultimoMensaje =
        error instanceof
        Error
          ? error.message
          : "No pudimos comunicarnos con Gemini.";

      ultimoRetry =
        null;

      if (
        hayOtroModelo
      ) {
        console.log(
          `${modelo} no respondió. Probando automáticamente el modelo alternativo.`
        );

        continue;
      }
    }
  }

  let mensajeUsuario =
    "La IA no pudo completar el análisis en este momento. Tus fotos siguen guardadas.";

  if (
    ultimoStatus ===
    429
  ) {
    mensajeUsuario =
      "La asistencia está recibiendo muchas solicitudes en este momento. Tus fotos siguen guardadas.";

    if (
      ultimoRetry
    ) {
      mensajeUsuario +=
        ` Podés intentar nuevamente en aproximadamente ${ultimoRetry} segundos.`;
    }
  }

  console.error(
    "Todos los modelos Gemini fallaron:",
    {
      status:
        ultimoStatus,

      codigo:
        ultimoCodigo,

      mensaje:
        ultimoMensaje,
    }
  );

  throw new ErrorGeminiTemporal({
    mensaje:
      mensajeUsuario,

    status:
      ultimoStatus,

    codigo:
      ultimoCodigo,

    retryAfterSeconds:
      ultimoRetry,
  });
}

function validarDatosEspecificos(
  valor: unknown
): DatosEspecificos {
  if (
    !valor ||
    typeof valor !==
      "object" ||
    Array.isArray(
      valor
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
    DatosEspecificos =
      {};

  const clavesBloqueadas =
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
      entrada
    )
  ) {
    if (
      cantidad >= 6
    ) {
      break;
    }

    const clave =
      normalizarClaveDinamica(
        claveOriginal
      );

    if (
      !clave ||
      clavesBloqueadas.has(
        clave
      )
    ) {
      continue;
    }

    if (
      Array.isArray(
        dato
      )
    ) {
      const lista =
        dato
          .map(
            (
              item
            ) =>
              limitarTexto(
                item,
                160
              )
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            8
          );

      if (
        lista.length >
        0
      ) {
        salida[
          clave
        ] =
          lista;

        cantidad += 1;
      }

      continue;
    }

    const texto =
      limitarTexto(
        dato,
        300
      );

    if (
      texto
    ) {
      salida[
        clave
      ] =
        texto;

      cantidad += 1;
    }
  }

  return salida;
}

function validarAnalisisObjeto(
  valor: unknown
): AnalisisObjeto {
  if (
    !valor ||
    typeof valor !==
      "object"
  ) {
    throw new Error(
      "La IA devolvió un análisis inválido."
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
      160
    );

  const categoria =
    limitarTexto(
      datos.categoria,
      120
    );

  const tituloSugerido =
    limitarTexto(
      datos.tituloSugerido,
      180
    );

  const descripcionSugerida =
    limitarTexto(
      datos.descripcionSugerida,
      3000
    );

  const tituloBloqueInformativo =
    limitarTexto(
      datos.tituloBloqueInformativo,
      80
    ) ||
    "Descripción";

  if (
    !objeto ||
    !categoria ||
    !tituloSugerido ||
    !descripcionSugerida
  ) {
    throw new Error(
      "El análisis quedó incompleto. Probá nuevamente."
    );
  }

  const detallesObservables =
    Array.isArray(
      datos.detallesObservables
    )
      ? datos.detallesObservables
          .map(
            (
              detalle
            ) =>
              limitarTexto(
                detalle,
                300
              )
          )
          .filter(
            Boolean
          )
          .slice(
            0,
            12
          )
      : [];

  const confianzaRaw =
    limitarTexto(
      datos.confianza,
      20
    );

  const confianza:
    "alta" |
    "media" |
    "baja" =
      confianzaRaw ===
        "alta" ||
      confianzaRaw ===
        "media" ||
      confianzaRaw ===
        "baja"
        ? confianzaRaw
        : "baja";

  const marca =
    datos.marca
      ? limitarTexto(
          datos.marca,
          120
        )
      : null;

  const modelo =
    datos.modelo
      ? limitarTexto(
          datos.modelo,
          160
        )
      : null;

  const datosEspecificos =
    validarDatosEspecificos(
      datos.datosEspecificos
    );

  return {
    objeto,

    categoria,

    marca,

    modelo,

    datosEspecificos,

    tituloBloqueInformativo,

    detallesObservables,

    estadoAparente:
      datos.estadoAparente
        ? limitarTexto(
            datos.estadoAparente,
            500
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
            300
          )
        : null,

    siguienteFotoSugerida:
      datos.siguienteFotoSugerida
        ? limitarTexto(
            datos.siguienteFotoSugerida,
            300
          )
        : null,

    ayudaEtiqueta:
      datos.ayudaEtiqueta
        ? limitarTexto(
            datos.ayudaEtiqueta,
            300
          )
        : null,

    confianza,
  };
}

Deno.serve(
  async (
    req
  ) => {
    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        }
      );
    }

    if (
      req.method !==
      "POST"
    ) {
      return responder(
        {
          error:
            "Método no permitido.",
        },
        405
      );
    }

    try {
      const payload:
        Payload =
          await req.json();

      if (
        payload.accion !==
          "descripcion" &&
        payload.accion !==
          "frase" &&
        payload.accion !==
          "analizar_objeto"
      ) {
        return responder(
          {
            error:
              "Acción inválida.",
          },
          400
        );
      }

      if (
        payload.accion ===
        "descripcion"
      ) {
        const descripcion =
          limitarTexto(
            payload.descripcion,
            3000
          );

        if (
          descripcion.length <
          3
        ) {
          return responder(
            {
              error:
                "Escribí primero una descripción.",
            },
            400
          );
        }

        const texto =
          await ejecutarGemini({
            prompt:
              promptDescripcion(
                payload
              ),
          });

        return responder({
          ok: true,

          accion:
            "descripcion",

          texto,
        });
      }

      if (
        payload.accion ===
        "frase"
      ) {
        const imagenes =
          await prepararImagenes(
            payload.imagenes
          );

        const texto =
          await ejecutarGemini({
            prompt:
              promptFrase(
                payload
              ),

            imagenes,
          });

        return responder({
          ok: true,

          accion:
            "frase",

          texto,
        });
      }

      const imagenes =
        await prepararImagenes(
          payload.imagenes
        );

      if (
        imagenes.length ===
        0
      ) {
        return responder(
          {
            error:
              "Necesitamos al menos una foto para analizar el objeto.",
          },
          400
        );
      }

      const texto =
        await ejecutarGemini({
          prompt:
            promptAnalizarObjeto(
              imagenes.length
            ),

          imagenes,

          json:
            true,
        });

      let jsonAnalisis:
        unknown;

      try {
        jsonAnalisis =
          JSON.parse(
            limpiarJsonGemini(
              texto
            )
          );
      } catch (
        error
      ) {
        console.error(
          "JSON inválido de Gemini:",
          texto,
          error
        );

        throw new Error(
          "No pudimos interpretar el análisis del objeto. Probá nuevamente."
        );
      }

      const analisis =
        validarAnalisisObjeto(
          jsonAnalisis
        );

      return responder({
        ok: true,

        accion:
          "analizar_objeto",

        analisis,
      });
    } catch (
      error
    ) {
      console.error(
        error
      );

      if (
        error instanceof
        ErrorGeminiTemporal
      ) {
        return responder({
          ok: false,

          error:
            error.message,

          codigo:
            error.codigo,

          retryAfterSeconds:
            error.retryAfterSeconds,
        });
      }

      return responder(
        {
          ok: false,

          error:
            error instanceof
            Error
              ? error.message
              : "Ocurrió un error inesperado.",
        },
        503
      );
    }
  }
);