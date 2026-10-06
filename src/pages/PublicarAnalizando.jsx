import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import PantallaOperativa from "../components/PantallaOperativa";

import { supabase } from "../lib/supabase";

import {
  obtenerBorradorPublicacion,
  guardarBorradorPublicacion,
} from "../utils/borradorPublicacion";

import {
  subirFotosPendientesPublicacion,
} from "../utils/subidaFotosPublicacion";

const ESTADOS = [
  "Mirando tu objeto",
  "Identificando qué es",
  "Leyendo los detalles",
  "Preparando tu publicación",
];

const OPCIONES_FUNCIONAMIENTO = [
  {
    valor: "SI",
    texto: "Sí",
  },
  {
    valor: "NO",
    texto: "No",
  },
  {
    valor: "NO_APLICA",
    texto: "No aplica",
  },
];


function mensajeErrorVisible(
  error
) {
  const mensaje = String(
    error?.message ||
    ""
  ).trim();

  const codigosInternos = [
    "RUTA_NO_PERTENECE_AL_BORRADOR",
    "BORRADOR_TEMPORAL_INVALIDO",
    "POSICION_INVALIDA",
    "RUTA_INVALIDA",
  ];

  if (
    codigosInternos.some(
      (codigo) =>
        mensaje.includes(
          codigo
        )
    )
  ) {
    return (
      "No pudimos terminar de guardar las fotos. " +
      "Tus fotos siguen guardadas. Volvé a las fotos e intentá nuevamente."
    );
  }

  return (
    mensaje ||
    "No pudimos analizar el objeto. Tus fotos siguen guardadas."
  );
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function numeroSeguro(valor) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}

function formatearDinero(valor) {
  return numeroSeguro(
    valor
  ).toLocaleString(
    "es-AR"
  );
}

function limpiarDatosEspecificos(
  datos
) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    return {};
  }

  const resultado = {};

  Object.entries(
    datos
  ).forEach(
    ([
      clave,
      valor,
    ]) => {
      const claveLimpia =
        String(
          clave || ""
        ).trim();

      if (!claveLimpia) {
        return;
      }

      if (
        valor === null ||
        valor === undefined
      ) {
        return;
      }

      if (
        Array.isArray(
          valor
        )
      ) {
        const lista =
          valor
            .map(
              (item) =>
                String(
                  item || ""
                ).trim()
            )
            .filter(Boolean);

        if (
          lista.length >
          0
        ) {
          resultado[
            claveLimpia
          ] = lista;
        }

        return;
      }

      const texto =
        String(
          valor
        ).trim();

      if (texto) {
        resultado[
          claveLimpia
        ] = texto;
      }
    }
  );

  return resultado;
}

function normalizarPrecioReferencia(
  valor
) {
  if (
    !valor ||
    typeof valor !== "object" ||
    Array.isArray(valor)
  ) {
    return null;
  }

  const minimo =
    numeroSeguro(
      valor.minimo
    );

  const promedio =
    numeroSeguro(
      valor.promedio
    );

  const maximo =
    numeroSeguro(
      valor.maximo
    );

  if (
    minimo <= 0 &&
    promedio <= 0 &&
    maximo <= 0
  ) {
    return null;
  }

  return {
    minimo:
      minimo > 0
        ? minimo
        : null,

    promedio:
      promedio > 0
        ? promedio
        : null,

    maximo:
      maximo > 0
        ? maximo
        : null,

    moneda:
      String(
        valor.moneda ||
        "ARS"
      ).trim(),

    confianza:
      String(
        valor.confianza ||
        ""
      ).trim(),

    tipoReferencia:
      String(
        valor.tipoReferencia ||
        valor.tipo_referencia ||
        ""
      ).trim(),

    aclaracion:
      String(
        valor.aclaracion ||
        ""
      ).trim(),
  };
}

function etiquetaDato(
  clave
) {
  const mapa = {
    autor:
      "Autor",

    editorial:
      "Editorial",

    marca:
      "Marca",

    modelo:
      "Modelo",

    color:
      "Color",

    material:
      "Material",

    medidas:
      "Medidas",

    talle:
      "Talle",

    capacidad:
      "Capacidad",

    año:
      "Año",

    anio:
      "Año",

    edición:
      "Edición",

    edicion:
      "Edición",

    isbn:
      "ISBN",

    incluye:
      "Incluye",
  };

  if (
    mapa[clave]
  ) {
    return mapa[
      clave
    ];
  }

  const limpio =
    String(
      clave || ""
    )
      .replace(
        /_/g,
        " "
      )
      .trim();

  if (!limpio) {
    return "";
  }

  return (
    limpio
      .charAt(0)
      .toUpperCase() +
    limpio.slice(1)
  );
}

function requierePreguntaFuncionamiento(
  analisis
) {
  if (!analisis) {
    return false;
  }

  const texto =
    normalizarTexto(
      [
        analisis.objeto,
        analisis.categoria,
        analisis.tituloSugerido,
      ]
        .filter(Boolean)
        .join(" ")
    );

  const palabras = [
    "electrodomest",
    "tecnologia",
    "herramient",
    "maquina",
    "motor",
    "electrico",
    "electronico",
    "bicicleta",
    "moto",
    "vehiculo",
    "computadora",
    "notebook",
    "celular",
    "telefono",
    "tablet",
    "televisor",
    "tv",
    "radio",
    "audio",
    "parlante",
    "auricular",
    "impresora",
    "camara",
    "heladera",
    "freezer",
    "lavarropa",
    "lavavajilla",
    "microondas",
    "horno",
    "aspiradora",
    "ventilador",
    "calefactor",
    "estufa",
    "aire acondicionado",
    "licuadora",
    "batidora",
    "procesadora",
    "cafetera",
    "tostadora",
    "plancha",
    "taladro",
    "amoladora",
    "sierra",
    "compresor",
    "bomba",
  ];

  return palabras.some(
    (palabra) =>
      texto.includes(
        palabra
      )
  );
}

function esSugerenciaEtiqueta(
  recomendacion,
  ayuda
) {
  const texto =
    normalizarTexto(
      `${recomendacion || ""} ${ayuda || ""}`
    );

  const palabras = [
    "etiqueta",
    "placa",
    "chapa",
    "serie",
    "modelo",
    "identificacion",
    "datos tecnicos",
  ];

  return palabras.some(
    (palabra) =>
      texto.includes(
        palabra
      )
  );
}

function obtenerFechaValida(
  valor
) {
  if (!valor) {
    return 0;
  }

  const fecha =
    new Date(valor);

  const tiempo =
    fecha.getTime();

  return Number.isNaN(
    tiempo
  )
    ? 0
    : tiempo;
}

function obtenerMomentoUltimaFoto(
  fotos
) {
  let ultimoMomento =
    0;

  for (
    const foto
    of fotos
  ) {
    const candidatos = [
      foto?.reemplazadaEn,
      foto?.agregadaEn,
      foto?.creadaEn,
      foto?.fecha,
    ];

    for (
      const candidato
      of candidatos
    ) {
      const momento =
        obtenerFechaValida(
          candidato
        );

      if (
        momento >
        ultimoMomento
      ) {
        ultimoMomento =
          momento;
      }
    }

    const lastModified =
      Number(
        foto?.archivo
          ?.lastModified ||
        0
      );

    if (
      Number.isFinite(
        lastModified
      ) &&
      lastModified >
        ultimoMomento
    ) {
      ultimoMomento =
        lastModified;
    }
  }

  return ultimoMomento;
}

function necesitaReanalizar(
  borrador,
  fotos
) {
  if (
    !borrador?.analisisIA
  ) {
    return true;
  }

  const momentoAnalisis =
    obtenerFechaValida(
      borrador?.analizadoEn
    );

  if (!momentoAnalisis) {
    return true;
  }

  const momentoUltimaFoto =
    obtenerMomentoUltimaFoto(
      fotos
    );

  if (
    momentoUltimaFoto >
    momentoAnalisis
  ) {
    return true;
  }

  const decision =
    borrador
      ?.decisionFotoSugeridaIA;

  if (
    decision?.decision ===
    "COMPLETADA"
  ) {
    const momentoDecision =
      obtenerFechaValida(
        decision?.fecha
      );

    if (
      momentoDecision >
      momentoAnalisis
    ) {
      return true;
    }
  }

  return false;
}

function IconoDestello() {
  return (
    <svg
      className="sv-icono-destello"
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2l1.6 4.8L18.5 8.5l-4.9 1.7L12 15l-1.6-4.8L5.5 8.5l4.9-1.7L12 2Z"
        fill="currentColor"
      />

      <path
        d="M19 13l.8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
      const elemento of valor
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

    for (
      const contenido of
      Object.values(
        valor
      )
    ) {
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

function construirVersionFotos(
  resultadoSubida
) {
  const fotos =
    Array.isArray(
      resultadoSubida?.fotos
    )
      ? resultadoSubida.fotos
      : [];

  if (
    fotos.length === 0
  ) {
    throw new Error(
      "No pudimos confirmar las fotos guardadas en el servidor."
    );
  }

  const partes =
    fotos
      .slice()
      .sort(
        (a, b) =>
          Number(
            a?.posicion ||
            0
          ) -
          Number(
            b?.posicion ||
            0
          )
      )
      .map(
        (foto) =>
          [
            Number(
              foto?.posicion ||
              0
            ),
            String(
              foto?.fotoId ||
              ""
            ),
            String(
              foto?.rutaOriginal ||
              ""
            ),
          ].join(
            ":"
          )
      );

  return `fotos-v1|${partes.join("|")}`;
}

async function crearTrabajoAnalisis({
  tokenPublico,
  versionFotos,
}) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "crear_trabajo_analisis_ia_v2",
      {
        p_token_publico:
          tokenPublico,

        p_version_fotos:
          versionFotos,
      }
    );

  if (
    error
  ) {
    throw error;
  }

  const trabajo =
    normalizarFilaRpc(
      data
    );

  if (
    !trabajo?.id
  ) {
    throw new Error(
      "No pudimos iniciar el análisis del objeto."
    );
  }

  return trabajo;
}

async function obtenerTrabajoAnalisis({
  tokenPublico,
  versionFotos,
}) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "obtener_trabajo_analisis_ia_v2",
      {
        p_token_publico:
          tokenPublico,

        p_version_fotos:
          versionFotos,
      }
    );

  if (
    error
  ) {
    throw error;
  }

  return normalizarFilaRpc(
    data
  );
}

function PublicarAnalizando() {
  const navigate =
    useNavigate();

  const ejecucionActualRef =
    useRef(null);

  const borradorRef =
    useRef(null);

  const [
    estadoActivo,
    setEstadoActivo,
  ] = useState(0);

  const [
    estadosCompletos,
    setEstadosCompletos,
  ] = useState([]);

  const [
    cantidadFotos,
    setCantidadFotos,
  ] = useState(0);

  const [
    analisis,
    setAnalisis,
  ] = useState(null);

  const [
    funcionamiento,
    setFuncionamiento,
  ] = useState("");

  const [
    guardandoRespuesta,
    setGuardandoRespuesta,
  ] = useState(false);

  const [
    respuestaGuardada,
    setRespuestaGuardada,
  ] = useState(false);

  const [
    gestionandoFotoSugerida,
    setGestionandoFotoSugerida,
  ] = useState(false);

  const [
    recomendacionResuelta,
    setRecomendacionResuelta,
  ] = useState(false);

  const [
    mensajeRecomendacionResuelta,
    setMensajeRecomendacionResuelta,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    terminado,
    setTerminado,
  ] = useState(false);

  useEffect(() => {
    const idEjecucion =
      Symbol(
        "analisis"
      );

    ejecucionActualRef.current =
      idEjecucion;

    function sigueVigente() {
      return (
        ejecucionActualRef.current ===
        idEjecucion
      );
    }

    function restaurarDecision(
      borrador,
      resultado
    ) {
      const decisionAnterior =
        borrador
          ?.decisionFotoSugeridaIA;

      const decisionYaResuelta =
        [
          "NO_DISPONIBLE",
          "SEGUIR_ASI",
          "COMPLETADA",
        ].includes(
          decisionAnterior
            ?.decision
        );

      const mismaRecomendacion =
        normalizarTexto(
          decisionAnterior
            ?.recomendacion
        ) ===
        normalizarTexto(
          resultado
            ?.siguienteFotoSugerida
        );

      const mismaAyuda =
        normalizarTexto(
          decisionAnterior
            ?.ayudaEtiqueta
        ) ===
        normalizarTexto(
          resultado
            ?.ayudaEtiqueta
        );

      if (
        decisionYaResuelta &&
        (
          mismaRecomendacion ||
          mismaAyuda
        )
      ) {
        setRecomendacionResuelta(
          true
        );

        if (
          decisionAnterior
            ?.decision ===
          "COMPLETADA"
        ) {
          setMensajeRecomendacionResuelta(
            "Listo. Ya incorporamos la foto que agregaste."
          );
        } else if (
          decisionAnterior
            ?.decision ===
          "NO_DISPONIBLE"
        ) {
          setMensajeRecomendacionResuelta(
            "Perfecto. Seguimos con la información que ya tenemos."
          );
        } else {
          setMensajeRecomendacionResuelta(
            "Listo. Seguimos con estas fotos."
          );
        }
      }
    }

    async function analizar() {
      try {
        setError(
          ""
        );

        setTerminado(
          false
        );

        setEstadoActivo(
          0
        );

        setEstadosCompletos(
          []
        );

        setRecomendacionResuelta(
          false
        );

        setMensajeRecomendacionResuelta(
          ""
        );

        const borrador =
          await obtenerBorradorPublicacion();

        borradorRef.current =
          borrador ||
          {};

        if (
          !sigueVigente()
        ) {
          return;
        }

        const respuestaAnterior =
          borrador
            ?.respuestasInteligentes
            ?.funcionamiento ||
          "";

        if (
          respuestaAnterior
        ) {
          setFuncionamiento(
            respuestaAnterior
          );

          setRespuestaGuardada(
            true
          );
        }

        const fotos =
          Array.isArray(
            borrador?.fotos
          )
            ? borrador.fotos
            : [];

        if (
          fotos.length ===
          0
        ) {
          navigate(
            "/publicar/fotos",
            {
              replace:
                true,
            }
          );

          return;
        }

        setCantidadFotos(
          fotos.length
        );

        const hayQueReanalizar =
          necesitaReanalizar(
            borrador,
            fotos
          );

        if (
          !hayQueReanalizar &&
          borrador?.analisisIA
        ) {
          const resultado =
            borrador.analisisIA;

          setAnalisis(
            resultado
          );

          setEstadosCompletos([
            0,
            1,
            2,
            3,
          ]);

          setEstadoActivo(
            3
          );

          restaurarDecision(
            borrador,
            resultado
          );

          setTerminado(
            true
          );

          return;
        }

        /*
          Antes de pedir análisis,
          garantizamos que TODAS las fotos
          estén realmente guardadas en el servidor.

          Así MAGIA nunca analiza una foto parcial
          solamente porque la subida todavía seguía
          en segundo plano.
        */
        const subida =
          await subirFotosPendientesPublicacion(
            borrador
          );

        if (
          !sigueVigente()
        ) {
          return;
        }

        if (
          !subida?.ok ||
          !subida?.tokenPublico ||
          Number(
            subida?.cantidad ||
            0
          ) !==
            fotos.length
        ) {
          throw new Error(
            "Todavía no pudimos resguardar todas las fotos para analizarlas."
          );
        }

        const versionFotos =
          construirVersionFotos(
            subida
          );

        setEstadosCompletos([
          0,
        ]);

        setEstadoActivo(
          1
        );

        let trabajo =
          await crearTrabajoAnalisis({
            tokenPublico:
              subida.tokenPublico,

            versionFotos,
          });

        if (
          !sigueVigente()
        ) {
          return;
        }

        let erroresConsultaConsecutivos =
          0;

        while (
          sigueVigente()
        ) {
          const estadoTrabajo =
            String(
              trabajo?.estado ||
              ""
            ).toUpperCase();

          if (
            estadoTrabajo ===
            "COMPLETADO"
          ) {
            break;
          }

          if (
            estadoTrabajo ===
            "PROCESANDO"
          ) {
            setEstadosCompletos([
              0,
              1,
            ]);

            setEstadoActivo(
              2
            );
          } else {
            setEstadosCompletos([
              0,
            ]);

            setEstadoActivo(
              1
            );
          }

          if (
            estadoTrabajo ===
              "ERROR" &&
            Number(
              trabajo?.intentos ||
              0
            ) >= 6
          ) {
            throw new Error(
              trabajo?.error ||
              "MAGIA no pudo completar el análisis después de varios intentos."
            );
          }

          await esperar(
            1600
          );

          if (
            !sigueVigente()
          ) {
            return;
          }

          try {
            const actualizado =
              await obtenerTrabajoAnalisis({
                tokenPublico:
                  subida.tokenPublico,

                versionFotos,
              });

            if (
              actualizado?.id
            ) {
              trabajo =
                actualizado;
            }

            erroresConsultaConsecutivos =
              0;
          } catch (
            errorConsulta
          ) {
            console.error(
              "Error consultando trabajo de análisis:",
              errorConsulta
            );

            erroresConsultaConsecutivos +=
              1;

            /*
              Una caída momentánea de red
              NO cancela el trabajo del servidor.

              Esperamos y seguimos consultando.
            */
            await esperar(
              Math.min(
                8000,
                1000 *
                  2 **
                    Math.min(
                      erroresConsultaConsecutivos,
                      3
                    )
              )
            );
          }
        }

        if (
          !sigueVigente()
        ) {
          return;
        }

        const resultado =
          trabajo?.resultado;

        if (
          !resultado ||
          typeof resultado !==
            "object"
        ) {
          throw new Error(
            "MAGIA terminó el trabajo, pero no recibimos el análisis."
          );
        }

        setEstadosCompletos([
          0,
          1,
          2,
        ]);

        setEstadoActivo(
          3
        );


        if (
          !resultado.objeto ||
          !resultado.tituloSugerido ||
          !resultado.descripcionSugerida
        ) {
          throw new Error(
            "El análisis quedó incompleto. Probá nuevamente."
          );
        }

        const datosEspecificos =
          limpiarDatosEspecificos(
            resultado
              ?.datosEspecificos
          );

        const precioReferencia =
          normalizarPrecioReferencia(
            resultado
              ?.precioReferencia
          );

        setEstadosCompletos([
          0,
          1,
          2,
        ]);

        setEstadoActivo(
          3
        );

        const ahora =
          new Date().toISOString();

        await guardarBorradorPublicacion({
          analisisIA:
            resultado,

          objeto:
            resultado.objeto,

          categoria:
            resultado.categoria,

          marca:
            resultado.marca,

          modelo:
            resultado.modelo,

          titulo:
            resultado.tituloSugerido,

          descripcion:
            resultado.descripcionSugerida,

          estadoAparente:
            resultado.estadoAparente,

          detallesObservables:
            resultado.detallesObservables,

          datosEspecificos,

          precioReferencia,

          siguienteFotoSugerida:
            resultado.siguienteFotoSugerida,

          ayudaEtiqueta:
            resultado.ayudaEtiqueta,

          confianzaIA:
            resultado.confianza,

          analizadoEn:
            ahora,
        });

        if (
          !sigueVigente()
        ) {
          return;
        }

        borradorRef.current = {
          ...(borradorRef.current ||
            {}),

          analisisIA:
            resultado,

          objeto:
            resultado.objeto,

          categoria:
            resultado.categoria,

          marca:
            resultado.marca,

          modelo:
            resultado.modelo,

          titulo:
            resultado.tituloSugerido,

          descripcion:
            resultado.descripcionSugerida,

          estadoAparente:
            resultado.estadoAparente,

          detallesObservables:
            resultado.detallesObservables,

          datosEspecificos,

          precioReferencia,

          siguienteFotoSugerida:
            resultado.siguienteFotoSugerida,

          ayudaEtiqueta:
            resultado.ayudaEtiqueta,

          confianzaIA:
            resultado.confianza,

          analizadoEn:
            ahora,
        };

        restaurarDecision(
          borrador,
          resultado
        );

        setAnalisis({
          ...resultado,

          datosEspecificos,

          precioReferencia,
        });

        setEstadosCompletos([
          0,
          1,
          2,
          3,
        ]);

        setTerminado(
          true
        );
      } catch (err) {
        console.error(
          "Error analizando objeto:",
          err
        );

        if (
          !sigueVigente()
        ) {
          return;
        }

        setError(
          mensajeErrorVisible(
            err
          )
        );
      }
    }

    analizar();

    return () => {
      if (
        ejecucionActualRef.current ===
        idEjecucion
      ) {
        ejecucionActualRef.current =
          null;
      }
    };
  }, [
    navigate,
  ]);

  async function responderFuncionamiento(
    valor
  ) {
    if (
      guardandoRespuesta
    ) {
      return;
    }

    try {
      setGuardandoRespuesta(
        true
      );

      setRespuestaGuardada(
        false
      );

      setFuncionamiento(
        valor
      );

      const respuestasActuales =
        borradorRef.current
          ?.respuestasInteligentes ||
        {};

      const respuestasNuevas = {
        ...respuestasActuales,

        funcionamiento:
          valor,
      };

      await guardarBorradorPublicacion({
        respuestasInteligentes:
          respuestasNuevas,
      });

      borradorRef.current = {
        ...(borradorRef.current ||
          {}),

        respuestasInteligentes:
          respuestasNuevas,
      };

      setRespuestaGuardada(
        true
      );
    } catch (err) {
      console.error(
        "Error guardando respuesta:",
        err
      );

      setError(
        "No pudimos guardar tu respuesta. Probá nuevamente."
      );
    } finally {
      setGuardandoRespuesta(
        false
      );
    }
  }

  async function guardarDecisionFotoSugerida(
    decision
  ) {
    if (
      gestionandoFotoSugerida
    ) {
      return;
    }

    try {
      setGestionandoFotoSugerida(
        true
      );

      setError(
        ""
      );

      const decisionNueva = {
        decision,

        recomendacion:
          analisis
            ?.siguienteFotoSugerida ||
          null,

        ayudaEtiqueta:
          analisis
            ?.ayudaEtiqueta ||
          null,

        cantidadFotos,

        fecha:
          new Date().toISOString(),
      };

      await guardarBorradorPublicacion({
        decisionFotoSugeridaIA:
          decisionNueva,
      });

      borradorRef.current = {
        ...(borradorRef.current ||
          {}),

        decisionFotoSugeridaIA:
          decisionNueva,
      };

      if (
        decision ===
          "AGREGAR" ||
        decision ===
          "REEMPLAZAR"
      ) {
        navigate(
          "/publicar/captura",
          {
            state: {
              origen:
                "recomendacion_ia",

              accion:
                decision,

              recomendacion:
                analisis
                  ?.siguienteFotoSugerida ||
                "",

              ayudaEtiqueta:
                analisis
                  ?.ayudaEtiqueta ||
                "",
            },
          }
        );

        return;
      }

      if (
        decision ===
        "NO_DISPONIBLE"
      ) {
        setMensajeRecomendacionResuelta(
          "Perfecto. Seguimos con la información que ya tenemos."
        );
      } else {
        setMensajeRecomendacionResuelta(
          "Listo. Seguimos con estas fotos."
        );
      }

      setRecomendacionResuelta(
        true
      );
    } catch (err) {
      console.error(
        "Error guardando decisión sobre foto:",
        err
      );

      setError(
        "No pudimos guardar esa decisión. Probá nuevamente."
      );
    } finally {
      setGestionandoFotoSugerida(
        false
      );
    }
  }

  function volverAFotos() {
    navigate(
      "/publicar/captura"
    );
  }

  function reintentar() {
    window.location.reload();
  }

  function continuarAValor() {
    navigate(
      "/publicar/valor"
    );
  }

  const mostrarPreguntaFuncionamiento =
    terminado &&
    analisis &&
    requierePreguntaFuncionamiento(
      analisis
    );

  const recomendacionFoto =
    analisis
      ?.siguienteFotoSugerida ||
    "";

  const ayudaEtiqueta =
    analisis
      ?.ayudaEtiqueta ||
    "";

  const mostrarRecomendacion =
    Boolean(
      recomendacionFoto ||
      ayudaEtiqueta
    );

  const recomendacionesDistintas =
    normalizarTexto(
      recomendacionFoto
    ) !==
    normalizarTexto(
      ayudaEtiqueta
    );

  const tieneCupoParaOtraFoto =
    cantidadFotos <
    5;

  const sugerenciaEsEtiqueta =
    esSugerenciaEtiqueta(
      recomendacionFoto,
      ayudaEtiqueta
    );

  const textoAccionPrincipal =
    tieneCupoParaOtraFoto
      ? "Agregar esta foto"
      : "Reemplazar una foto";

  const decisionAccionPrincipal =
    tieneCupoParaOtraFoto
      ? "AGREGAR"
      : "REEMPLAZAR";

  const textoNoDisponible =
    sugerenciaEsEtiqueta
      ? "No tiene / no la encuentro"
      : "No puedo mostrarlo";

  const recomendacionLista =
    !mostrarRecomendacion ||
    recomendacionResuelta;

  const funcionamientoListo =
    !mostrarPreguntaFuncionamiento ||
    Boolean(
      funcionamiento
    );

  const puedeContinuar =
    terminado &&
    analisis &&
    recomendacionLista &&
    funcionamientoListo;

  const tituloPantalla =
    terminado
      ? "Bien, mirá lo que preparamos"
      : "Estamos mirando tu objeto";

  const subtituloPantalla =
    terminado
      ? (
        <>
          Esto sale de lo que pudimos observar en tus fotos.
          <br />
          Después vas a poder revisar y cambiar todo.
        </>
      )
      : (
        <>
          Vamos a usar lo que muestran tus fotos para ayudarte a armar la publicación.
          <br />
          Si necesitás salir, podés hacerlo: MAGIA sigue trabajando en el servidor.
        </>
      );

  const datosEspecificos =
    limpiarDatosEspecificos(
      analisis
        ?.datosEspecificos
    );

  const entradasDatosEspecificos =
    Object.entries(
      datosEspecificos
    );

  const precioReferencia =
    normalizarPrecioReferencia(
      analisis
        ?.precioReferencia
    );

  return (
    <>
      <style>{`
        .sv-analisis-contenido {
          width: 100%;
        }

        .sv-analisis-icono {
          position: relative;
          width: 68px;
          height: 68px;
          margin: 3px auto 17px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            linear-gradient(
              145deg,
              #edf6ed,
              #f9fbf7
            );
          color: var(--sv-mostaza);
          border: 1px solid #dce9da;
          box-shadow:
            0 10px 26px
            rgba(7, 87, 83, 0.07);
        }

        .sv-analisis-icono.cargando {
          animation:
            sv-respiro-carga
            2.4s
            ease-in-out
            infinite;
        }

        .sv-analisis-icono.cargando
        .sv-icono-destello {
          transform-origin: center;
          transform-box: fill-box;
          animation:
            sv-giro-destello
            1.9s
            linear
            infinite;
        }

        .sv-analisis-icono.cargando::before {
          content: "";
          position: absolute;
          width: 5px;
          height: 5px;
          top: 7px;
          left: 50%;
          border-radius: 50%;
          background: var(--sv-mostaza);
          box-shadow:
            0 0 9px
            rgba(239, 169, 0, 0.38);
          transform-origin: 0 26px;
          animation:
            sv-orbita-punto
            2.4s
            linear
            infinite;
        }

        @keyframes sv-giro-destello {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes sv-orbita-punto {
          from {
            transform:
              translateX(-2.5px)
              rotate(0deg);
          }

          to {
            transform:
              translateX(-2.5px)
              rotate(360deg);
          }
        }

        @keyframes sv-respiro-carga {
          0%,
          100% {
            box-shadow:
              0 10px 26px
              rgba(7, 87, 83, 0.07);
            transform: scale(1);
          }

          50% {
            box-shadow:
              0 12px 30px
              rgba(7, 87, 83, 0.12);
            transform: scale(1.025);
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .sv-analisis-icono.cargando,
          .sv-analisis-icono.cargando
          .sv-icono-destello,
          .sv-analisis-icono.cargando::before {
            animation: none;
          }
        }

        .sv-estados {
          width: 100%;
          display: grid;
          gap: 8px;
        }

        .sv-estado {
          min-height: 48px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-sizing: border-box;
          padding: 9px 13px;
          border: 1px solid #ebe3da;
          border-radius: 15px;
          background:
            rgba(
              255,
              255,
              255,
              0.65
            );
          color: #8a837c;
          font-size: 14px;
          font-weight: 700;
        }

        .sv-estado.activo {
          border-color: #cfdfd0;
          background:
            linear-gradient(
              135deg,
              #f0f7ef,
              #f9fbf7
            );
          color: var(--sv-petroleo);
        }

        .sv-estado.completo {
          border-color: #d9e7d8;
          background: #f8fbf7;
          color: var(--sv-petroleo);
        }

        .sv-estado-punto {
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid #ded7cf;
          background: #fff;
          color: #aaa198;
          font-size: 11px;
          font-weight: 850;
        }

        .sv-estado.activo
        .sv-estado-punto,
        .sv-estado.completo
        .sv-estado-punto {
          border-color: var(--sv-petroleo);
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-fotos-cantidad {
          margin: 17px 0 0;
          text-align: center;
          color: #786f68;
          font-size: 12.5px;
        }

        .sv-fotos-cantidad strong {
          color: var(--sv-petroleo);
        }

        .sv-analisis-aviso {
          margin-top: 14px;
          padding: 11px 14px;
          border-radius: 14px;
          background: #f5f2ed;
          color: #665f59;
          text-align: center;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sv-analisis-error {
          margin-top: 16px;
          padding: 14px;
          border: 1px solid #efcabb;
          border-radius: 15px;
          background: #fff3ee;
          color: #a84422;
          text-align: center;
          font-size: 13px;
          line-height: 1.4;
        }

        .sv-error-aclaracion {
          display: block;
          margin-top: 4px;
          color: #7e665b;
          font-size: 11.5px;
        }

        .sv-error-acciones {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .sv-error-boton {
          min-height: 40px;
          border-radius: 12px;
          font: inherit;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-error-boton.reintentar {
          border: 0;
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-error-boton.volver {
          border: 1px solid var(--sv-petroleo);
          background: transparent;
          color: var(--sv-petroleo);
        }

        .sv-resultado {
          padding: 18px;
          border: 1px solid #d9e6d8;
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              #f7fbf6,
              #fffdfa
            );
        }

        .sv-resultado-eyebrow {
          margin: 0 0 5px;
          color: var(--sv-mostaza);
          font-size: 12px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .sv-resultado h2 {
          margin: 0 0 13px;
          color: var(--sv-petroleo);
          font-size: 21px;
          line-height: 1.15;
        }

        .sv-resultado-fila {
          margin-top: 10px;
        }

        .sv-resultado-fila strong {
          display: block;
          margin-bottom: 3px;
          color: var(--sv-petroleo);
          font-size: 12px;
        }

        .sv-resultado-fila p {
          margin: 0;
          color: #514e49;
          font-size: 13px;
          line-height: 1.4;
        }

        .sv-resultado-etiquetas {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
        }

        .sv-resultado-etiqueta {
          padding: 5px 9px;
          border-radius: 999px;
          background: #eef5ed;
          color: var(--sv-petroleo);
          font-size: 11.5px;
          font-weight: 750;
        }

        .sv-datos-especificos {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 8px;
          margin-top: 13px;
        }

        .sv-dato-especifico {
          min-width: 0;
          padding: 9px 10px;
          border: 1px solid #e2e8df;
          border-radius: 12px;
          background: rgba(255,255,255,0.68);
        }

        .sv-dato-especifico strong {
          display: block;
          margin-bottom: 3px;
          color: var(--sv-petroleo);
          font-size: 10.5px;
        }

        .sv-dato-especifico span {
          display: block;
          color: #514e49;
          font-size: 12px;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .sv-precio-referencia {
          margin-top: 14px;
          padding: 13px;
          border: 1px solid rgba(239,169,0,0.35);
          border-radius: 14px;
          background: #fffaf0;
        }

        .sv-precio-referencia-titulo {
          margin: 0 0 9px;
          color: var(--sv-petroleo);
          font-size: 12px;
          font-weight: 850;
        }

        .sv-precio-referencia-valores {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 6px;
        }

        .sv-precio-referencia-dato {
          padding: 8px 6px;
          border-radius: 10px;
          background: #fff;
          text-align: center;
        }

        .sv-precio-referencia-dato span {
          display: block;
          color: #746b63;
          font-size: 9.5px;
        }

        .sv-precio-referencia-dato strong {
          display: block;
          margin-top: 2px;
          color: var(--sv-petroleo);
          font-size: 12px;
        }

        .sv-precio-referencia-aclaracion {
          margin: 8px 0 0;
          color: #756a5e;
          font-size: 10.5px;
          line-height: 1.35;
        }

        .sv-resultado-recomendacion {
          margin-top: 13px;
          padding: 12px;
          border:
            1px solid
            rgba(239, 169, 0, 0.42);
          border-radius: 14px;
          background: #fff9e9;
          color: #655635;
          font-size: 12px;
          line-height: 1.4;
        }

        .sv-recomendacion-linea {
          margin: 0;
        }

        .sv-recomendacion-linea
        + .sv-recomendacion-linea {
          margin-top: 7px;
          padding-top: 7px;
          border-top:
            1px solid
            rgba(239, 169, 0, 0.22);
        }

        .sv-recomendacion-pregunta {
          margin: 11px 0 0;
          color: var(--sv-petroleo);
          font-size: 12px;
          font-weight: 800;
        }

        .sv-recomendacion-acciones {
          display: grid;
          gap: 7px;
          margin-top: 10px;
        }

        .sv-recomendacion-boton {
          width: 100%;
          min-height: 41px;
          padding: 8px 11px;
          border-radius: 12px;
          font: inherit;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-recomendacion-boton.principal {
          border: 1px solid var(--sv-petroleo);
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-recomendacion-boton.secundario {
          border: 1px solid #d7c9b5;
          background: #fff;
          color: var(--sv-petroleo);
        }

        .sv-recomendacion-boton.terciario {
          border: 1px solid transparent;
          background: transparent;
          color: #6d6359;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .sv-recomendacion-boton:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .sv-recomendacion-resuelta {
          margin-top: 13px;
          padding: 10px 12px;
          border: 1px solid #d9e7d8;
          border-radius: 13px;
          background: #f5faf4;
          color: var(--sv-petroleo);
          text-align: center;
          font-size: 11.8px;
          line-height: 1.35;
          font-weight: 700;
        }

        .sv-pregunta {
          margin-top: 14px;
          padding: 17px;
          border: 1px solid #d9e6d8;
          border-radius: 18px;
          background: #fffdfa;
        }

        .sv-pregunta-arriba {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: var(--sv-mostaza);
          font-size: 11.5px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.35px;
        }

        .sv-pregunta-titulo {
          margin: 0;
          color: var(--sv-petroleo);
          font-size: 20px;
          line-height: 1.15;
          font-weight: 850;
        }

        .sv-pregunta-ayuda {
          margin: 6px 0 14px;
          color: #69635d;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sv-pregunta-opciones {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 8px;
        }

        .sv-pregunta-opcion {
          min-height: 43px;
          padding: 8px;
          border: 1px solid #d9d2c9;
          border-radius: 13px;
          background: #fff;
          color: var(--sv-petroleo);
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-pregunta-opcion.seleccionada {
          border-color: var(--sv-petroleo);
          background: var(--sv-petroleo);
          color: #fff;
          box-shadow:
            0 7px 18px
            rgba(7, 87, 83, 0.14);
        }

        .sv-pregunta-opcion:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        .sv-respuesta-guardada {
          margin: 10px 0 0;
          color: var(--sv-petroleo);
          text-align: center;
          font-size: 11.5px;
          font-weight: 700;
        }

        .sv-analisis-continuar {
          width: 100%;
          min-height: 52px;
          margin-top: 15px;
          border: 0;
          border-radius: 17px;
          background: var(--sv-mostaza);
          color: #fff;
          font: inherit;
          font-size: 15.5px;
          font-weight: 850;
          cursor: pointer;
          box-shadow:
            0 8px 18px
            rgba(239, 169, 0, 0.2);
        }

        @media (
          max-width: 390px
        ) {
          .sv-datos-especificos {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>

      <PantallaOperativa
        titulo={
          tituloPantalla
        }
        subtitulo={
          subtituloPantalla
        }
        mostrarVolver={
          false
        }
      >
        <div className="sv-analisis-contenido">
          {!terminado && (
            <>
              <div className="sv-analisis-icono cargando">
                <IconoDestello />
              </div>

              <div className="sv-estados">
                {ESTADOS.map(
                  (
                    estado,
                    indice
                  ) => {
                    const completo =
                      estadosCompletos.includes(
                        indice
                      );

                    const activo =
                      indice ===
                        estadoActivo &&
                      !completo;

                    let clase =
                      "sv-estado";

                    if (
                      completo
                    ) {
                      clase +=
                        " completo";
                    } else if (
                      activo
                    ) {
                      clase +=
                        " activo";
                    }

                    return (
                      <div
                        key={
                          estado
                        }
                        className={
                          clase
                        }
                      >
                        <span className="sv-estado-punto">
                          {completo ? (
                            <IconoCheck />
                          ) : (
                            indice +
                            1
                          )}
                        </span>

                        <span>
                          {estado}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>

              <p className="sv-fotos-cantidad">
                Trabajando con{" "}
                <strong>
                  {cantidadFotos}{" "}
                  {cantidadFotos ===
                  1
                    ? "foto"
                    : "fotos"}
                </strong>
              </p>

              <div className="sv-analisis-aviso">
                No vamos a inventar información que
                no podamos sostener con tus fotos.
              </div>
            </>
          )}

          {error && (
            <div className="sv-analisis-error">
              {error}

              <span className="sv-error-aclaracion">
                Tus fotos siguen guardadas.
              </span>

              <div className="sv-error-acciones">
                <button
                  type="button"
                  className="sv-error-boton volver"
                  onClick={
                    volverAFotos
                  }
                >
                  Volver a las fotos
                </button>

                <button
                  type="button"
                  className="sv-error-boton reintentar"
                  onClick={
                    reintentar
                  }
                >
                  Intentar otra vez
                </button>
              </div>
            </div>
          )}

          {terminado &&
            analisis && (
              <>
                <div className="sv-resultado">
                  <p className="sv-resultado-eyebrow">
                    Objeto identificado
                  </p>

                  <h2>
                    {analisis.objeto}
                  </h2>

                  <div className="sv-resultado-etiquetas">
                    {analisis.categoria && (
                      <span className="sv-resultado-etiqueta">
                        {analisis.categoria}
                      </span>
                    )}

                    {analisis.marca && (
                      <span className="sv-resultado-etiqueta">
                        {analisis.marca}
                      </span>
                    )}

                    {analisis.modelo && (
                      <span className="sv-resultado-etiqueta">
                        {analisis.modelo}
                      </span>
                    )}
                  </div>

                  {entradasDatosEspecificos.length >
                    0 && (
                    <div className="sv-datos-especificos">
                      {entradasDatosEspecificos.map(
                        ([
                          clave,
                          valor,
                        ]) => (
                          <div
                            key={
                              clave
                            }
                            className="sv-dato-especifico"
                          >
                            <strong>
                              {etiquetaDato(
                                clave
                              )}
                            </strong>

                            <span>
                              {Array.isArray(
                                valor
                              )
                                ? valor.join(
                                    " · "
                                  )
                                : valor}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="sv-resultado-fila">
                    <strong>
                      Título sugerido
                    </strong>

                    <p>
                      {analisis.tituloSugerido}
                    </p>
                  </div>

                  <div className="sv-resultado-fila">
                    <strong>
                      Descripción
                    </strong>

                    <p>
                      {analisis.descripcionSugerida}
                    </p>
                  </div>

                  {analisis.estadoAparente && (
                    <div className="sv-resultado-fila">
                      <strong>
                        Lo que se ve
                      </strong>

                      <p>
                        {analisis.estadoAparente}
                      </p>
                    </div>
                  )}

                  {precioReferencia && (
                    <div className="sv-precio-referencia">
                      <p className="sv-precio-referencia-titulo">
                        Referencia de precio
                      </p>

                      <div className="sv-precio-referencia-valores">
                        <div className="sv-precio-referencia-dato">
                          <span>
                            Más bajo
                          </span>

                          <strong>
                            {precioReferencia.minimo
                              ? `$${formatearDinero(
                                  precioReferencia.minimo
                                )}`
                              : "—"}
                          </strong>
                        </div>

                        <div className="sv-precio-referencia-dato">
                          <span>
                            Promedio
                          </span>

                          <strong>
                            {precioReferencia.promedio
                              ? `$${formatearDinero(
                                  precioReferencia.promedio
                                )}`
                              : "—"}
                          </strong>
                        </div>

                        <div className="sv-precio-referencia-dato">
                          <span>
                            Más alto
                          </span>

                          <strong>
                            {precioReferencia.maximo
                              ? `$${formatearDinero(
                                  precioReferencia.maximo
                                )}`
                              : "—"}
                          </strong>
                        </div>
                      </div>

                      <p className="sv-precio-referencia-aclaracion">
                        Es una orientación. Vos elegís cuánto querés pedir o desde qué valor recibir propuestas.
                      </p>
                    </div>
                  )}

                  {mostrarRecomendacion &&
                    !recomendacionResuelta && (
                      <div className="sv-resultado-recomendacion">
                        {recomendacionFoto && (
                          <p className="sv-recomendacion-linea">
                            ✦{" "}
                            {recomendacionFoto}
                          </p>
                        )}

                        {ayudaEtiqueta &&
                          (
                            !recomendacionFoto ||
                            recomendacionesDistintas
                          ) && (
                            <p className="sv-recomendacion-linea">
                              💡{" "}
                              {ayudaEtiqueta}
                            </p>
                          )}

                        <p className="sv-recomendacion-pregunta">
                          ¿Qué querés hacer?
                        </p>

                        <div className="sv-recomendacion-acciones">
                          <button
                            type="button"
                            className="sv-recomendacion-boton principal"
                            disabled={
                              gestionandoFotoSugerida
                            }
                            onClick={() =>
                              guardarDecisionFotoSugerida(
                                decisionAccionPrincipal
                              )
                            }
                          >
                            {textoAccionPrincipal}
                          </button>

                          <button
                            type="button"
                            className="sv-recomendacion-boton secundario"
                            disabled={
                              gestionandoFotoSugerida
                            }
                            onClick={() =>
                              guardarDecisionFotoSugerida(
                                "NO_DISPONIBLE"
                              )
                            }
                          >
                            {textoNoDisponible}
                          </button>

                          <button
                            type="button"
                            className="sv-recomendacion-boton terciario"
                            disabled={
                              gestionandoFotoSugerida
                            }
                            onClick={() =>
                              guardarDecisionFotoSugerida(
                                "SEGUIR_ASI"
                              )
                            }
                          >
                            Seguir así
                          </button>
                        </div>
                      </div>
                    )}

                  {recomendacionResuelta &&
                    mensajeRecomendacionResuelta && (
                      <div className="sv-recomendacion-resuelta">
                        ✓{" "}
                        {mensajeRecomendacionResuelta}
                      </div>
                    )}
                </div>

                {mostrarPreguntaFuncionamiento && (
                  <section className="sv-pregunta">
                    <div className="sv-pregunta-arriba">
                      ✦ Un dato más
                    </div>

                    <h2 className="sv-pregunta-titulo">
                      ¿Funciona?
                    </h2>

                    <p className="sv-pregunta-ayuda">
                      Si es algo que realmente puede probarse encendido,
                      andando o realizando una función mecánica o eléctrica,
                      marcá Sí o No. Si no corresponde evaluar funcionamiento,
                      elegí No aplica.
                    </p>

                    <div className="sv-pregunta-opciones">
                      {OPCIONES_FUNCIONAMIENTO.map(
                        (
                          opcion
                        ) => (
                          <button
                            key={
                              opcion.valor
                            }
                            type="button"
                            disabled={
                              guardandoRespuesta
                            }
                            className={
                              funcionamiento ===
                              opcion.valor
                                ? "sv-pregunta-opcion seleccionada"
                                : "sv-pregunta-opcion"
                            }
                            onClick={() =>
                              responderFuncionamiento(
                                opcion.valor
                              )
                            }
                          >
                            {opcion.texto}
                          </button>
                        )
                      )}
                    </div>

                    {respuestaGuardada && (
                      <p className="sv-respuesta-guardada">
                        ✓ Listo, lo tenemos en cuenta.
                      </p>
                    )}
                  </section>
                )}

                {puedeContinuar && (
                  <button
                    type="button"
                    className="sv-analisis-continuar"
                    onClick={
                      continuarAValor
                    }
                  >
                    Continuar
                  </button>
                )}
              </>
            )}
        </div>
      </PantallaOperativa>
    </>
  );
}

export default PublicarAnalizando;