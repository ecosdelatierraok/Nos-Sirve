import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import heic2any from "heic2any";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import PantallaOperativa from "../components/PantallaOperativa";

import {
  obtenerBorradorPublicacion,
  guardarBorradorPublicacion,
  guardarFotosBorrador,
  eliminarFotoBorrador,
} from "../utils/borradorPublicacion";

const MAX_FOTOS = 5;
const MAX_LADO = 2560;
const CALIDAD_WEBP = 0.94;

function IconoCamara() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="13"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconoGaleria() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="9"
        cy="9"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m5 17 4.2-4.2 3 3L15 13l4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoPapelera() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoMoverIzquierda() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19 12H5M10 7l-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoMoverDerecha() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoPortada() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m12 3 2.1 5.2L20 9l-4.5 3.8L17 19l-5-3.2L7 19l1.5-6.2L4 9l5.9-.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function esHeicHeif(
  archivo
) {
  const tipo =
    String(
      archivo?.type ||
      ""
    ).toLowerCase();

  const nombre =
    String(
      archivo?.name ||
      ""
    ).toLowerCase();

  return (
    tipo ===
      "image/heic" ||
    tipo ===
      "image/heif" ||
    tipo ===
      "image/heic-sequence" ||
    tipo ===
      "image/heif-sequence" ||
    nombre.endsWith(
      ".heic"
    ) ||
    nombre.endsWith(
      ".heif"
    )
  );
}

function esArchivoImagenAceptable(
  archivo
) {
  const tipo =
    String(
      archivo?.type ||
      ""
    ).toLowerCase();

  const nombre =
    String(
      archivo?.name ||
      ""
    ).toLowerCase();

  if (
    tipo.startsWith(
      "image/"
    )
  ) {
    return true;
  }

  return (
    nombre.endsWith(
      ".jpg"
    ) ||
    nombre.endsWith(
      ".jpeg"
    ) ||
    nombre.endsWith(
      ".png"
    ) ||
    nombre.endsWith(
      ".webp"
    ) ||
    nombre.endsWith(
      ".heic"
    ) ||
    nombre.endsWith(
      ".heif"
    )
  );
}

async function convertirHeicAArchivoCompatible(
  archivo,
  indice
) {
  try {
    const convertido =
      await heic2any({
        blob:
          archivo,

        toType:
          "image/jpeg",

        quality:
          0.96,
      });

    const blob =
      Array.isArray(
        convertido
      )
        ? convertido[0]
        : convertido;

    if (!blob) {
      throw new Error(
        "La conversión HEIC/HEIF no devolvió una imagen."
      );
    }

    const nombreBase =
      (
        archivo?.name ||
        `foto-${indice + 1}`
      ).replace(
        /\.[^.]+$/,
        ""
      );

    return new File(
      [
        blob,
      ],

      `${nombreBase}.jpg`,

      {
        type:
          "image/jpeg",

        lastModified:
          archivo?.lastModified ||
          Date.now(),
      }
    );
  } catch (err) {
    console.error(
      "No pudimos convertir una foto HEIC/HEIF:",
      err
    );

    throw new Error(
      "No pudimos preparar una foto HEIC/HEIF del teléfono. Probá elegirla de nuevo."
    );
  }
}

function validarArchivoImagen(
  archivo
) {
  if (!archivo) {
    throw new Error(
      "La cámara no devolvió ninguna foto."
    );
  }

  if (
    !archivo.size ||
    archivo.size <= 0
  ) {
    throw new Error(
      "La cámara devolvió una foto vacía. Sacala nuevamente."
    );
  }

  if (
    !esArchivoImagenAceptable(
      archivo
    )
  ) {
    throw new Error(
      "El archivo recibido no parece ser una imagen compatible."
    );
  }

  return archivo;
}

function cargarImagenDesdeArchivo(
  archivo
) {
  return new Promise(
    (resolve, reject) => {
      const url =
        URL.createObjectURL(
          archivo
        );

      const imagen =
        new Image();

      imagen.onload = () => {
        URL.revokeObjectURL(
          url
        );

        resolve(imagen);
      };

      imagen.onerror = () => {
        URL.revokeObjectURL(
          url
        );

        reject(
          new Error(
            "El teléfono entregó la foto, pero no pudimos leerla. Probá sacarla nuevamente."
          )
        );
      };

      imagen.src = url;
    }
  );
}

function canvasAWebp(canvas) {
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No pudimos preparar la foto."
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

async function convertirAWebp(
  archivo,
  indice
) {
  validarArchivoImagen(
    archivo
  );

  const archivoCompatible =
    esHeicHeif(
      archivo
    )
      ? await convertirHeicAArchivoCompatible(
          archivo,
          indice
        )
      : archivo;

  /*
    Conservamos el original para no perder detalle, color ni rango tonal.
    HEIC/HEIF se convierte a JPEG compatible; el resto queda intacto.
  */
  await cargarImagenDesdeArchivo(
    archivoCompatible
  );

  if (
    archivoCompatible instanceof
    File
  ) {
    return archivoCompatible;
  }

  return new File(
    [
      archivoCompatible,
    ],
    `foto-original-${Date.now()}-${indice + 1}.jpg`,
    {
      type:
        archivoCompatible.type ||
        "image/jpeg",

      lastModified:
        Date.now(),
    }
  );
}

async function calcularHuellaArchivo(
  archivo
) {
  if (!archivo) {
    return "";
  }

  const buffer =
    await archivo.arrayBuffer();

  const resumen =
    await crypto.subtle.digest(
      "SHA-256",
      buffer
    );

  return Array.from(
    new Uint8Array(
      resumen
    )
  )
    .map(
      (byte) =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}

async function quitarFotosDuplicadas(
  fotos
) {
  const unicas = [];
  const huellas =
    new Set();

  for (const foto of fotos) {
    if (!foto?.archivo) {
      unicas.push(foto);
      continue;
    }

    try {
      const huella =
        await calcularHuellaArchivo(
          foto.archivo
        );

      if (
        !huella ||
        !huellas.has(
          huella
        )
      ) {
        if (huella) {
          huellas.add(
            huella
          );
        }

        unicas.push(
          foto
        );
      }
    } catch {
      unicas.push(
        foto
      );
    }
  }

  return unicas;
}

function PublicarCaptura() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const inputGaleriaRef =
    useRef(null);

  const procesandoFotoRef =
    useRef(false);

  const [
    fotos,
    setFotos,
  ] = useState([]);

  const [
    fotoSeleccionada,
    setFotoSeleccionada,
  ] = useState(0);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    aviso,
    setAviso,
  ] = useState("");

  const [
    solicitudIA,
    setSolicitudIA,
  ] = useState(null);

  const [
    fotoPedidaCompletada,
    setFotoPedidaCompletada,
  ] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarBorrador() {
      try {
        const borrador =
          await obtenerBorradorPublicacion();

        if (!activo) {
          return;
        }

        const existentes =
          Array.isArray(
            borrador?.fotos
          )
            ? borrador.fotos
            : [];

        const sinDuplicados =
          await quitarFotosDuplicadas(
            existentes
          );

        if (!activo) {
          return;
        }

        if (
          sinDuplicados.length !==
          existentes.length
        ) {
          await guardarBorradorPublicacion({
            fotos:
              sinDuplicados,
          });

          setAviso(
            "Quitamos una foto repetida que ya estaba cargada."
          );
        }

        setFotos(
          sinDuplicados
        );

        setFotoSeleccionada(
          0
        );

        const desdeNavegacion =
          location.state?.origen ===
          "recomendacion_ia"
            ? {
                accion:
                  location.state
                    ?.accion,

                recomendacion:
                  location.state
                    ?.recomendacion ||
                  "",

                ayudaEtiqueta:
                  location.state
                    ?.ayudaEtiqueta ||
                  "",
              }
            : null;

        const decisionGuardada =
          borrador
            ?.decisionFotoSugeridaIA;

        let solicitud =
          desdeNavegacion;

        if (
          !solicitud &&
          (
            decisionGuardada?.decision ===
              "AGREGAR" ||
            decisionGuardada?.decision ===
              "REEMPLAZAR"
          )
        ) {
          solicitud = {
            accion:
              decisionGuardada
                .decision,

            recomendacion:
              decisionGuardada
                .recomendacion ||
              "",

            ayudaEtiqueta:
              decisionGuardada
                .ayudaEtiqueta ||
              "",
          };
        }

        if (
          solicitud?.accion ===
            "AGREGAR" &&
          sinDuplicados.length >=
            MAX_FOTOS
        ) {
          solicitud = {
            ...solicitud,
            accion:
              "REEMPLAZAR",
          };
        }

        setSolicitudIA(
          solicitud
        );

        if (
          sinDuplicados.length ===
          0
        ) {
          navigate(
            "/publicar/fotos",
            {
              replace: true,
            }
          );
        }
      } catch (err) {
        console.error(
          "Error al cargar borrador:",
          err
        );

        if (activo) {
          setError(
            "No pudimos recuperar las fotos."
          );
        }
      } finally {
        if (activo) {
          setCargando(
            false
          );
        }
      }
    }

    cargarBorrador();

    return () => {
      activo = false;
    };
  }, [
    navigate,
    location.state,
  ]);

  const fotosConUrl =
    useMemo(() => {
      return fotos.map(
        (foto) => ({
          ...foto,

          url:
            foto?.archivo
              ? URL.createObjectURL(
                  foto.archivo
                )
              : "",
        })
      );
    }, [fotos]);

  useEffect(() => {
    return () => {
      fotosConUrl.forEach(
        (foto) => {
          if (foto.url) {
            URL.revokeObjectURL(
              foto.url
            );
          }
        }
      );
    };
  }, [fotosConUrl]);

  const cantidad =
    fotos.length;

  const indiceSeguro =
    cantidad === 0
      ? 0
      : Math.min(
          fotoSeleccionada,
          cantidad - 1
        );

  const fotoActiva =
    fotosConUrl[
      indiceSeguro
    ];

  const reemplazandoFotoIA =
    Boolean(
      solicitudIA &&
      solicitudIA.accion ===
        "REEMPLAZAR" &&
      !fotoPedidaCompletada
    );

  const agregandoFotoIA =
    Boolean(
      solicitudIA &&
      solicitudIA.accion ===
        "AGREGAR" &&
      !fotoPedidaCompletada
    );

  const atendiendoSolicitudIA =
    reemplazandoFotoIA ||
    agregandoFotoIA;

  const puedeAbrirSelector =
    !guardando &&
    !procesandoFotoRef.current &&
    (
      reemplazandoFotoIA ||
      cantidad < MAX_FOTOS
    );

  const textoSolicitudIA =
    solicitudIA?.recomendacion ||
    solicitudIA?.ayudaEtiqueta ||
    "Sumá una foto que muestre mejor ese detalle.";

  function abrirCamara() {
    if (
      !puedeAbrirSelector
    ) {
      return;
    }

    setError("");
    setAviso("");

    /*
      Volvemos siempre a NUESTRA cámara continua.
      No abrimos el input nativo de una sola foto.

      PublicarFotos recibe esta señal y debe:
      - conservar las fotos ya cargadas;
      - abrir la cámara interna;
      - permitir completar hasta 5 fotos;
      - volver a esta pantalla al finalizar.
    */
    navigate(
      "/publicar/fotos",
      {
        state: {
          continuarCaptura:
            true,

          volverARevision:
            true,

          cantidadExistente:
            cantidad,
        },
      }
    );
  }

  function abrirGaleria() {
    if (
      !puedeAbrirSelector
    ) {
      return;
    }

    setError("");
    setAviso("");

    if (
      inputGaleriaRef.current
    ) {
      inputGaleriaRef.current.value =
        "";

      inputGaleriaRef.current.click();
    }
  }

  async function verificarFotosGuardadas(
    cantidadEsperadaMinima
  ) {
    const comprobacion =
      await obtenerBorradorPublicacion();

    const guardadas =
      Array.isArray(
        comprobacion?.fotos
      )
        ? comprobacion.fotos
        : [];

    if (
      guardadas.length <
      cantidadEsperadaMinima
    ) {
      throw new Error(
        "La foto se procesó, pero no llegó a quedar guardada. Probá sacarla nuevamente."
      );
    }

    return guardadas;
  }

  async function marcarFotoPedidaCompletada(
    accionOriginal
  ) {
    const registro = {
      decision:
        "COMPLETADA",

      accionOriginal,

      recomendacion:
        solicitudIA?.recomendacion ||
        null,

      ayudaEtiqueta:
        solicitudIA?.ayudaEtiqueta ||
        null,

      cantidadFotos:
        accionOriginal ===
        "AGREGAR"
          ? Math.min(
              MAX_FOTOS,
              cantidad + 1
            )
          : cantidad,

      fecha:
        new Date().toISOString(),
    };

    await guardarBorradorPublicacion({
      decisionFotoSugeridaIA:
        registro,
    });

    setFotoPedidaCompletada(
      true
    );

    setAviso(
      accionOriginal ===
      "REEMPLAZAR"
        ? "Listo. Reemplazamos la foto y conservamos su lugar en la publicación."
        : "Listo. Ya tenemos esa foto. Si querés, podés seguir sumando fotos."
    );
  }

  async function recibirFotoParaReemplazar(
    archivo
  ) {
    validarArchivoImagen(
      archivo
    );

    const nueva =
      await convertirAWebp(
        archivo,
        indiceSeguro
      );

    let huellaNueva = "";

    try {
      huellaNueva =
        await calcularHuellaArchivo(
          nueva
        );
    } catch {
      huellaNueva = "";
    }

    if (huellaNueva) {
      for (
        let indice = 0;
        indice <
        fotos.length;
        indice += 1
      ) {
        if (
          indice ===
          indiceSeguro
        ) {
          continue;
        }

        const existente =
          fotos[indice];

        if (
          !existente?.archivo
        ) {
          continue;
        }

        try {
          const huella =
            await calcularHuellaArchivo(
              existente.archivo
            );

          if (
            huella ===
            huellaNueva
          ) {
            setAviso(
              "Esa foto ya está cargada. Elegí otra."
            );

            return false;
          }
        } catch {
          // Conservamos el flujo.
        }
      }
    }

    const anterior =
      fotos[
        indiceSeguro
      ];

    if (!anterior) {
      throw new Error(
        "No encontramos la foto que querías reemplazar."
      );
    }

    const reemplazo = {
      ...anterior,

      archivo:
        nueva,

      tipo:
        nueva.type,

      nombre:
        nueva.name,

      reemplazadaEn:
        new Date().toISOString(),
    };

    const nuevas =
      [...fotos];

    nuevas[
      indiceSeguro
    ] =
      reemplazo;

    await guardarBorradorPublicacion({
      fotos:
        nuevas,
    });

    const comprobadas =
      await verificarFotosGuardadas(
        nuevas.length
      );

    setFotos(
      comprobadas
    );

    await marcarFotoPedidaCompletada(
      "REEMPLAZAR"
    );

    return true;
  }

  async function recibirFotoPedidaParaAgregar(
    archivo
  ) {
    validarArchivoImagen(
      archivo
    );

    const preparada =
      await convertirAWebp(
        archivo,
        cantidad
      );

    let huellaNueva = "";

    try {
      huellaNueva =
        await calcularHuellaArchivo(
          preparada
        );
    } catch {
      huellaNueva = "";
    }

    if (huellaNueva) {
      for (
        const existente of fotos
      ) {
        if (
          !existente?.archivo
        ) {
          continue;
        }

        try {
          const huella =
            await calcularHuellaArchivo(
              existente.archivo
            );

          if (
            huella ===
            huellaNueva
          ) {
            setAviso(
              "Esa foto ya está cargada."
            );

            return false;
          }
        } catch {
          // Conservamos el flujo.
        }
      }
    }

    const cantidadAnterior =
      fotos.length;

    const actualizado =
      await guardarFotosBorrador(
        [
          preparada,
        ]
      );

    const nuevas =
      Array.isArray(
        actualizado?.fotos
      )
        ? actualizado.fotos
        : [];

    if (
      nuevas.length <=
      cantidadAnterior
    ) {
      throw new Error(
        "La foto se recibió, pero no llegó a guardarse. Probá sacarla nuevamente."
      );
    }

    const comprobadas =
      await verificarFotosGuardadas(
        cantidadAnterior + 1
      );

    setFotos(
      comprobadas
    );

    setFotoSeleccionada(
      comprobadas.length - 1
    );

    await marcarFotoPedidaCompletada(
      "AGREGAR"
    );

    return true;
  }

  async function recibirFotos(
    event
  ) {
    const input =
      event.target;

    const archivos =
      Array.from(
        input.files || []
      );

    input.value = "";

    if (
      archivos.length === 0
    ) {
      return;
    }

    if (
      procesandoFotoRef.current
    ) {
      return;
    }

    procesandoFotoRef.current =
      true;

    setError("");
    setAviso(
      archivos.length === 1
        ? "Guardando la foto..."
        : "Guardando las fotos..."
    );

    setGuardando(true);

    try {
      archivos.forEach(
        validarArchivoImagen
      );

      if (
        reemplazandoFotoIA
      ) {
        const guardada =
          await recibirFotoParaReemplazar(
            archivos[0]
          );

        if (
          guardada
        ) {
          setAviso(
            "✓ Foto guardada correctamente."
          );
        }

        return;
      }

      if (
        agregandoFotoIA
      ) {
        const guardada =
          await recibirFotoPedidaParaAgregar(
            archivos[0]
          );

        if (
          guardada
        ) {
          setAviso(
            "✓ Foto guardada correctamente."
          );
        }

        return;
      }

      const disponibles =
        MAX_FOTOS -
        fotos.length;

      if (
        disponibles <= 0
      ) {
        setAviso(
          "Ya tenés cargadas las 5 fotos."
        );

        return;
      }

      const seleccionadas =
        archivos.slice(
          0,
          disponibles
        );

      const huellasExistentes =
        new Set();

      for (
        const foto of fotos
      ) {
        if (!foto?.archivo) {
          continue;
        }

        try {
          const huella =
            await calcularHuellaArchivo(
              foto.archivo
            );

          if (huella) {
            huellasExistentes.add(
              huella
            );
          }
        } catch {
          // Conservamos la foto.
        }
      }

      const preparadas = [];
      let duplicadas = 0;

      for (
        let indice = 0;
        indice <
        seleccionadas.length;
        indice += 1
      ) {
        const foto =
          await convertirAWebp(
            seleccionadas[
              indice
            ],
            indice
          );

        let huella = "";

        try {
          huella =
            await calcularHuellaArchivo(
              foto
            );
        } catch {
          huella = "";
        }

        if (
          huella &&
          huellasExistentes.has(
            huella
          )
        ) {
          duplicadas += 1;
          continue;
        }

        if (huella) {
          huellasExistentes.add(
            huella
          );
        }

        preparadas.push(
          foto
        );
      }

      if (
        preparadas.length ===
        0
      ) {
        if (
          duplicadas > 0
        ) {
          setAviso(
            duplicadas === 1
              ? "Esa foto ya está cargada."
              : "Esas fotos ya están cargadas."
          );
        } else {
          setError(
            "La cámara no entregó una foto utilizable. Probá sacarla nuevamente."
          );

          setAviso("");
        }

        return;
      }

      const cantidadAnterior =
        fotos.length;

      const actualizado =
        await guardarFotosBorrador(
          preparadas
        );

      const nuevasCrudas =
        Array.isArray(
          actualizado?.fotos
        )
          ? actualizado.fotos
          : [];

      const nuevas =
        await quitarFotosDuplicadas(
          nuevasCrudas
        );

      if (
        nuevas.length !==
        nuevasCrudas.length
      ) {
        await guardarBorradorPublicacion({
          fotos:
            nuevas,
        });
      }

      if (
        nuevas.length <=
          cantidadAnterior &&
        duplicadas === 0
      ) {
        throw new Error(
          "La foto se recibió, pero no quedó guardada. Probá sacarla nuevamente."
        );
      }

      const cantidadEsperada =
        Math.min(
          MAX_FOTOS,
          cantidadAnterior +
            preparadas.length
        );

      const comprobadas =
        await verificarFotosGuardadas(
          Math.min(
            cantidadEsperada,
            nuevas.length
          )
        );

      setFotos(
        comprobadas
      );

      if (
        comprobadas.length >
        cantidadAnterior
      ) {
        setFotoSeleccionada(
          Math.min(
            cantidadAnterior,
            comprobadas.length -
              1
          )
        );
      }

      if (
        duplicadas > 0
      ) {
        setAviso(
          duplicadas === 1
            ? "✓ Foto guardada. Otra ya estaba cargada y no la repetimos."
            : "✓ Fotos guardadas. Algunas ya estaban cargadas y no las repetimos."
        );
      } else {
        setAviso(
          preparadas.length === 1
            ? "✓ Foto guardada correctamente."
            : "✓ Fotos guardadas correctamente."
        );
      }
    } catch (err) {
      console.error(
        "Error al agregar fotos:",
        err
      );

      setAviso("");

      setError(
        err?.message ||
        (
          reemplazandoFotoIA
            ? "No pudimos reemplazar esa foto. Probá otra vez."
            : "No pudimos agregar esa foto. Probá otra vez."
        )
      );
    } finally {
      procesandoFotoRef.current =
        false;

      setGuardando(
        false
      );
    }
  }

  async function eliminarFoto(
    id
  ) {
    if (
      guardando ||
      procesandoFotoRef.current
    ) {
      return;
    }

    try {
      setError("");
      setAviso("");
      setGuardando(
        true
      );

      const actualizado =
        await eliminarFotoBorrador(
          id
        );

      const nuevas =
        Array.isArray(
          actualizado?.fotos
        )
          ? actualizado.fotos
          : [];

      setFotos(
        nuevas
      );

      setFotoSeleccionada(
        (indiceActual) =>
          Math.max(
            0,
            Math.min(
              indiceActual,
              nuevas.length - 1
            )
          )
      );

      if (
        nuevas.length === 0
      ) {
        navigate(
          "/publicar/fotos",
          {
            replace: true,
          }
        );
      }
    } catch (err) {
      console.error(
        "Error al eliminar foto:",
        err
      );

      setError(
        "No pudimos eliminar la foto."
      );
    } finally {
      setGuardando(
        false
      );
    }
  }

  async function guardarNuevoOrden(
    nuevasFotos,
    nuevoIndice
  ) {
    if (
      procesandoFotoRef.current
    ) {
      return;
    }

    setError("");
    setAviso("");
    setGuardando(true);

    try {
      await guardarBorradorPublicacion({
        fotos:
          nuevasFotos,
      });

      setFotos(
        nuevasFotos
      );

      setFotoSeleccionada(
        nuevoIndice
      );
    } catch (err) {
      console.error(
        "Error al ordenar fotos:",
        err
      );

      setError(
        "No pudimos guardar el nuevo orden de las fotos."
      );
    } finally {
      setGuardando(
        false
      );
    }
  }

  async function moverFoto(
    direccion
  ) {
    if (
      guardando ||
      procesandoFotoRef.current ||
      cantidad < 2
    ) {
      return;
    }

    const desde =
      indiceSeguro;

    const hacia =
      desde +
      direccion;

    if (
      hacia < 0 ||
      hacia >= cantidad
    ) {
      return;
    }

    const nuevas =
      [...fotos];

    const temporal =
      nuevas[desde];

    nuevas[desde] =
      nuevas[hacia];

    nuevas[hacia] =
      temporal;

    await guardarNuevoOrden(
      nuevas,
      hacia
    );
  }

  async function usarComoPortada() {
    if (
      guardando ||
      procesandoFotoRef.current ||
      indiceSeguro === 0
    ) {
      return;
    }

    const nuevas =
      [...fotos];

    const [
      seleccionada,
    ] =
      nuevas.splice(
        indiceSeguro,
        1
      );

    nuevas.unshift(
      seleccionada
    );

    await guardarNuevoOrden(
      nuevas,
      0
    );
  }

  function analizarObjeto() {
    if (
      guardando ||
      procesandoFotoRef.current
    ) {
      return;
    }

    if (
      atendiendoSolicitudIA &&
      !fotoPedidaCompletada
    ) {
      return;
    }

    navigate(
      "/publicar/analizando",
      {
        replace:
          fotoPedidaCompletada,
      }
    );
  }

  if (cargando) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          display:
            "grid",

          placeItems:
            "center",

          background:
            "#f8f5f1",

          color:
            "#075753",

          fontWeight:
            800,
        }}
      >
        Recuperando tus fotos...
      </main>
    );
  }

  const mensajeSiguiente =
    cantidad === 1
      ? "Podés sumar otra foto desde un ángulo diferente."
      : cantidad === 2
        ? "Si hay algún detalle importante, podés mostrarlo en otra foto."
        : cantidad === 3
          ? "Ya podemos analizar el objeto. Si querés, podés sumar hasta 2 fotos más."
          : cantidad === 4
            ? "Podés sumar una foto más si muestra algún detalle importante."
            : "Listo. Ya tenemos suficientes fotos para analizar el objeto.";

  const textoBotonCamara =
    guardando
      ? "Guardando..."
      : reemplazandoFotoIA
        ? "Sacar reemplazo"
        : agregandoFotoIA
          ? "Sacar esta foto"
          : "Seguir sacando fotos";

  const textoBotonGaleria =
    guardando
      ? "Guardando..."
      : reemplazandoFotoIA
        ? "Elegir reemplazo"
        : agregandoFotoIA
          ? "Elegir esta foto"
          : "Galería";

  return (
    <>
      <style>{`
        .sv-solicitud-ia {
          margin-bottom: 15px;
          padding: 14px 15px;
          border: 1px solid rgba(239, 169, 0, 0.48);
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #fff8e8,
              #fffdf8
            );
        }

        .sv-solicitud-ia-eyebrow {
          margin: 0 0 5px;
          color: var(--sv-mostaza);
          font-size: 11px;
          line-height: 1.2;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.35px;
        }

        .sv-solicitud-ia-titulo {
          margin: 0 0 6px;
          color: var(--sv-petroleo);
          font-size: 17px;
          line-height: 1.2;
          font-weight: 850;
        }

        .sv-solicitud-ia-texto {
          margin: 0;
          color: #5f554a;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sv-solicitud-ia-aclaracion {
          margin: 9px 0 0;
          color: var(--sv-petroleo);
          font-size: 11.8px;
          line-height: 1.35;
          font-weight: 750;
        }

        .sv-solicitud-completada {
          margin-bottom: 15px;
          padding: 12px 14px;
          border: 1px solid #d8e8d7;
          border-radius: 15px;
          background: #f3f9f2;
          color: var(--sv-petroleo);
          text-align: center;
          font-size: 12.5px;
          line-height: 1.35;
          font-weight: 750;
        }

        .sv-foto-principal {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          border-radius: 20px;
          background: #f4efe8;
          border: 1px solid var(--sv-borde);
          box-shadow:
            0 10px 28px
            rgba(38, 53, 54, 0.06);
        }

        .sv-foto-principal img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #f4efe8;
        }

        .sv-etiqueta-portada {
          position: absolute;
          top: 11px;
          left: 11px;
          min-height: 27px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          box-sizing: border-box;
          border-radius: 999px;
          background: rgba(7, 87, 83, 0.92);
          color: #fff;
          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: 0.25px;
          box-shadow:
            0 5px 15px
            rgba(0, 0, 0, 0.09);
        }

        .sv-eliminar-principal {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          padding: 0;
          border:
            1px solid
            rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          background:
            rgba(255, 255, 255, 0.92);
          color: var(--sv-coral);
          cursor: pointer;
          box-shadow:
            0 5px 15px
            rgba(0, 0, 0, 0.09);
        }

        .sv-fotos-miniaturas {
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          gap: 7px;
          margin-top: 10px;
        }

        .sv-miniatura {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          padding: 0;
          border: 1px solid var(--sv-borde);
          border-radius: 12px;
          background: #f3eee7;
          cursor: pointer;
        }

        .sv-miniatura.seleccionada {
          border: 2px solid var(--sv-petroleo);
          box-shadow:
            0 0 0 2px
            rgba(7, 87, 83, 0.08);
        }

        .sv-miniatura img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .sv-miniatura-vacia {
          display: grid;
          place-items: center;
          color: #b0a69e;
          font-size: 16px;
          cursor: default;
        }

        .sv-mini-portada {
          position: absolute;
          left: 4px;
          bottom: 4px;
          padding: 2px 5px;
          border-radius: 999px;
          background: var(--sv-petroleo);
          color: #fff;
          font-size: 7.5px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 0.2px;
        }

        .sv-orden-fotos {
          margin-top: 10px;
          padding: 11px 10px;
          border: 1px solid #e5ddd4;
          border-radius: 15px;
          background:
            rgba(255, 255, 255, 0.54);
        }

        .sv-orden-titulo {
          margin: 0 0 9px;
          color: #68625c;
          text-align: center;
          font-size: 11.5px;
          line-height: 1.35;
        }

        .sv-orden-acciones {
          display: grid;
          grid-template-columns:
            42px 1fr 42px;
          gap: 7px;
        }

        .sv-orden-boton {
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 8px;
          border: 1px solid var(--sv-petroleo);
          border-radius: 12px;
          background: #fff;
          color: var(--sv-petroleo);
          font: inherit;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-orden-boton.portada {
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-orden-boton:disabled {
          opacity: 0.32;
          cursor: not-allowed;
        }

        .sv-ayuda-siguiente {
          margin-top: 15px;
          padding: 13px 15px;
          display: flex;
          gap: 10px;
          align-items: center;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #f2f7f0 0%,
              #fafbf8 100%
            );
          border: 1px solid #dfeadd;
          color: var(--sv-petroleo);
          font-size: 13.5px;
          line-height: 1.35;
          font-weight: 750;
        }

        .sv-destello {
          flex: 0 0 auto;
          color: var(--sv-mostaza);
          font-size: 24px;
        }

        .sv-aviso {
          margin-top: 11px;
          padding: 10px 12px;
          border: 1px solid #dce8da;
          border-radius: 13px;
          background: #f5faf4;
          color: var(--sv-petroleo);
          text-align: center;
          font-size: 12px;
          line-height: 1.35;
        }

        .sv-captura-acciones {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          margin-top: 15px;
        }

        .sv-captura-boton {
          min-height: 49px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 16px;
          font: inherit;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-captura-boton.camara {
          border: 0;
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-captura-boton.galeria {
          border:
            1.4px solid
            var(--sv-petroleo);
          background: transparent;
          color: var(--sv-petroleo);
        }

        .sv-captura-boton:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sv-captura-error {
          margin-top: 12px;
          padding: 10px 12px;
          border: 1px solid #efcabb;
          border-radius: 13px;
          background: #fff3ee;
          color: #a84422;
          text-align: center;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sv-continuar {
          width: 100%;
          min-height: 52px;
          margin-top: 13px;
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

        .sv-continuar:disabled {
          opacity: 0.46;
          cursor: not-allowed;
          box-shadow: none;
        }

        .sv-input-oculto {
          display: none;
        }
      `}</style>

      <PantallaOperativa
        titulo="Revisá y ordená tus fotos"
        subtitulo={
          reemplazandoFotoIA
            ? "Elegí la foto que querés reemplazar."
            : "La primera será la portada de tu publicación."
        }
      >
        {solicitudIA &&
          !fotoPedidaCompletada && (
            <section className="sv-solicitud-ia">
              <p className="sv-solicitud-ia-eyebrow">
                ✦ Nos ayudaría ver esto
              </p>

              <h2 className="sv-solicitud-ia-titulo">
                {reemplazandoFotoIA
                  ? "Reemplazá una foto"
                  : "Sumá una foto"}
              </h2>

              <p className="sv-solicitud-ia-texto">
                {
                  textoSolicitudIA
                }
              </p>

              <p className="sv-solicitud-ia-aclaracion">
                {reemplazandoFotoIA
                  ? "Tocá abajo la foto que querés sacar de la publicación y después hacé o elegí la nueva."
                  : "Podés sacarla ahora o elegirla de tu galería."}
              </p>
            </section>
          )}

        {fotoPedidaCompletada && (
          <div className="sv-solicitud-completada">
            ✓ Listo. Ya tenemos esa foto para completar el análisis.
          </div>
        )}

        {fotoActiva && (
          <div className="sv-foto-principal">
            <img
              src={
                fotoActiva.url
              }
              alt={`Foto ${
                indiceSeguro +
                1
              } del objeto`}
            />

            {indiceSeguro ===
              0 && (
              <div className="sv-etiqueta-portada">
                <IconoPortada />
                PORTADA
              </div>
            )}

            <button
              type="button"
              className="sv-eliminar-principal"
              aria-label="Eliminar foto"
              disabled={
                guardando
              }
              onClick={() =>
                eliminarFoto(
                  fotoActiva.id
                )
              }
            >
              <IconoPapelera />
            </button>
          </div>
        )}

        <div className="sv-fotos-miniaturas">
          {Array.from({
            length:
              MAX_FOTOS,
          }).map(
            (_, indice) => {
              const foto =
                fotosConUrl[
                  indice
                ];

              if (!foto) {
                return (
                  <div
                    key={
                      indice
                    }
                    className="sv-miniatura sv-miniatura-vacia"
                  >
                    {indice +
                      1}
                  </div>
                );
              }

              return (
                <button
                  key={
                    foto.id
                  }
                  type="button"
                  className={
                    indice ===
                    indiceSeguro
                      ? "sv-miniatura seleccionada"
                      : "sv-miniatura"
                  }
                  aria-label={`Ver foto ${
                    indice +
                    1
                  }`}
                  disabled={
                    guardando
                  }
                  onClick={() =>
                    setFotoSeleccionada(
                      indice
                    )
                  }
                >
                  <img
                    src={
                      foto.url
                    }
                    alt={`Foto ${
                      indice +
                      1
                    }`}
                  />

                  {indice ===
                    0 && (
                    <span className="sv-mini-portada">
                      PORTADA
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>

        {cantidad > 1 &&
          !reemplazandoFotoIA && (
            <div className="sv-orden-fotos">
              <p className="sv-orden-titulo">
                Tocá una foto para seleccionarla y acomodala
                en el orden que quieras.
              </p>

              <div className="sv-orden-acciones">
                <button
                  type="button"
                  className="sv-orden-boton"
                  aria-label="Mover foto hacia la izquierda"
                  title="Mover hacia la izquierda"
                  disabled={
                    guardando ||
                    indiceSeguro ===
                      0
                  }
                  onClick={() =>
                    moverFoto(
                      -1
                    )
                  }
                >
                  <IconoMoverIzquierda />
                </button>

                <button
                  type="button"
                  className="sv-orden-boton portada"
                  disabled={
                    guardando ||
                    indiceSeguro ===
                      0
                  }
                  onClick={
                    usarComoPortada
                  }
                >
                  <IconoPortada />

                  {indiceSeguro ===
                  0
                    ? "Esta es la portada"
                    : "Usar como portada"}
                </button>

                <button
                  type="button"
                  className="sv-orden-boton"
                  aria-label="Mover foto hacia la derecha"
                  title="Mover hacia la derecha"
                  disabled={
                    guardando ||
                    indiceSeguro ===
                      cantidad -
                        1
                  }
                  onClick={() =>
                    moverFoto(
                      1
                    )
                  }
                >
                  <IconoMoverDerecha />
                </button>
              </div>
            </div>
          )}

        {!atendiendoSolicitudIA &&
          cantidad < MAX_FOTOS && (
            <div className="sv-ayuda-siguiente">
              <span className="sv-destello">
                ✦
              </span>

              <span>
                {
                  mensajeSiguiente
                }
              </span>
            </div>
          )}

        {aviso && (
          <div className="sv-aviso">
            {aviso}
          </div>
        )}

        <div className="sv-captura-acciones">
          <button
            type="button"
            className="sv-captura-boton camara"
            disabled={
              !puedeAbrirSelector
            }
            onClick={
              abrirCamara
            }
          >
            <IconoCamara />
            {
              textoBotonCamara
            }
          </button>

          <button
            type="button"
            className="sv-captura-boton galeria"
            disabled={
              !puedeAbrirSelector
            }
            onClick={
              abrirGaleria
            }
          >
            <IconoGaleria />
            {
              textoBotonGaleria
            }
          </button>
        </div>

        <input
          ref={
            inputGaleriaRef
          }
          className="sv-input-oculto"
          type="file"
          accept="image/*,.heic,.heif"
          multiple={
            !atendiendoSolicitudIA
          }
          onClick={(
            event
          ) => {
            event.currentTarget.value =
              "";
          }}
          onChange={
            recibirFotos
          }
        />

        {error && (
          <div className="sv-captura-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="sv-continuar"
          disabled={
            guardando ||
            (
              atendiendoSolicitudIA &&
              !fotoPedidaCompletada
            )
          }
          onClick={
            analizarObjeto
          }
        >
          {guardando
            ? "Guardando la foto..."
            : fotoPedidaCompletada
              ? "Analizar con estas fotos"
              : atendiendoSolicitudIA
                ? "Primero agregá la foto"
                : cantidad >= 3
                  ? "Listo, analizar mi objeto"
                  : "Continuar con estas fotos"}
        </button>
      </PantallaOperativa>
    </>
  );
}

export default PublicarCaptura;