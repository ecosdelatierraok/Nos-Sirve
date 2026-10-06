import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import heic2any from "heic2any";

import { useLocation, useNavigate } from "react-router-dom";

import PantallaOperativa from "../components/PantallaOperativa";

import {
  borrarBorradorPublicacion,
  guardarFotosBorrador,
  obtenerBorradorPublicacion,
} from "../utils/borradorPublicacion";

import {
  subirFotosPendientesPublicacion,
} from "../utils/subidaFotosPublicacion";


const MAX_FOTOS = 5;

const MAX_LADO = 2560;

const MAX_LADO_CAPTURA = 4096;

const CALIDAD_WEBP = 0.94;

const CALIDAD_CAPTURA = 0.99;

const RELACION_SENSOR_PREFERIDA = 4 / 3;


/*
  ======================================================
  ICONOS
  ======================================================
*/

function IconoCamara() {
  return (
    <svg
      width="25"
      height="25"
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


/*
  ======================================================
  GUÍA VISUAL
  ======================================================
*/

function MiniObjeto({
  tipo,
}) {
  if (
    tipo === "frente"
  ) {
    return (
      <div className="sv-miniobjeto frente">
        <div className="sv-mini-puerta" />
        <div className="sv-mini-linea" />
      </div>
    );
  }

  if (
    tipo === "angulo"
  ) {
    return (
      <div className="sv-miniobjeto angulo">
        <div className="sv-mini-cara-a" />
        <div className="sv-mini-cara-b" />
      </div>
    );
  }

  if (
    tipo === "trasera"
  ) {
    return (
      <div className="sv-miniobjeto trasera">
        <div className="sv-mini-rejilla r1" />
        <div className="sv-mini-rejilla r2" />
        <div className="sv-mini-rejilla r3" />
        <div className="sv-mini-rejilla r4" />
      </div>
    );
  }

  if (
    tipo === "detalle"
  ) {
    return (
      <div className="sv-miniobjeto detalle">
        <span />
      </div>
    );
  }

  return (
    <div className="sv-miniobjeto etiqueta">
      <div className="sv-etiqueta-linea larga" />
      <div className="sv-etiqueta-linea" />
      <div className="sv-etiqueta-linea corta" />
      <div className="sv-etiqueta-codigo" />
    </div>
  );
}


const GUIA = [
  {
    numero: 1,
    tipo: "frente",
    titulo: "De frente",
    texto:
      "Sacá una foto clara del frente del objeto.",
  },

  {
    numero: 2,
    tipo: "angulo",
    titulo: "De otro ángulo",
    texto:
      "Mostralo desde otro costado.",
  },

  {
    numero: 3,
    tipo: "trasera",
    titulo:
      "Parte trasera o inferior",
    texto:
      "Si tiene algo importante atrás o abajo, mostralo.",
  },

  {
    numero: 4,
    tipo: "detalle",
    titulo:
      "Detalles, marcas o defectos",
    texto:
      "Mostrá rayones, golpes o detalles relevantes.",
  },

  {
    numero: 5,
    tipo: "etiqueta",
    titulo:
      "Etiqueta, modelo o características",
    texto:
      "Si tiene etiqueta, modelo o datos visibles, mostralos.",
  },
];


/*
  ======================================================
  ARCHIVOS / IMÁGENES
  ======================================================
*/

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


function cargarImagenDesdeArchivo(
  archivo
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const url =
        URL.createObjectURL(
          archivo
        );

      const imagen =
        new Image();

      imagen.onload =
        () => {
          URL.revokeObjectURL(
            url
          );

          resolve(
            imagen
          );
        };

      imagen.onerror =
        () => {
          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "No pudimos leer una de las fotos."
            )
          );
        };

      imagen.src =
        url;
    }
  );
}


function canvasAWebp(
  canvas,
  calidad =
    CALIDAD_WEBP
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (
          blob
        ) => {
          if (!blob) {
            reject(
              new Error(
                "No pudimos preparar una de las fotos."
              )
            );

            return;
          }

          resolve(
            blob
          );
        },

        "image/webp",

        calidad
      );
    }
  );
}


async function convertirAWebp(
  archivo,
  indice
) {
  if (
    !esArchivoImagenAceptable(
      archivo
    )
  ) {
    throw new Error(
      "Uno de los archivos elegidos no es una imagen compatible."
    );
  }

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
    Calidad máxima: preservamos el archivo original.
    Solo HEIC/HEIF se convierte porque el worker debe poder leerlo.
    JPEG/PNG/WebP no se redimensionan ni se recomprimen aquí.
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


/*
  ======================================================
  BORRADOR
  ======================================================
*/

function obtenerRutaContinuacion(
  borrador
) {
  const fotos =
    Array.isArray(
      borrador?.fotos
    )
      ? borrador.fotos
      : [];

  const tieneUbicacion =
    Boolean(
      borrador?.provincia &&
      borrador?.localidad
    );

  const tieneEntrega =
    Array.isArray(
      borrador
        ?.formasEntrega
    ) &&
    borrador
      .formasEntrega
      .length > 0;

  if (
    borrador?.titulo &&
    borrador?.descripcion &&
    borrador?.modalidad &&
    tieneUbicacion &&
    tieneEntrega
  ) {
    return (
      "/publicar/confirmar"
    );
  }

  if (
    borrador?.titulo &&
    borrador?.descripcion &&
    borrador?.modalidad
  ) {
    return (
      "/publicar/revision"
    );
  }

  if (
    borrador?.analisisIA &&
    !borrador?.modalidad
  ) {
    return (
      "/publicar/valor"
    );
  }

  if (
    borrador?.analisisIA
  ) {
    return (
      "/publicar/revision"
    );
  }

  if (
    fotos.length > 0
  ) {
    return (
      "/publicar/captura"
    );
  }

  return null;
}


/*
  ======================================================
  PANTALLA
  ======================================================
*/

function PublicarFotos() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const videoRef =
    useRef(
      null
    );

  const streamRef =
    useRef(
      null
    );

  const reactivandoCamaraRef =
    useRef(
      false
    );

  const camaraDebeEstarActivaRef =
    useRef(
      false
    );

  const inputCamaraRef =
    useRef(
      null
    );

  const inputGaleriaRef =
    useRef(
      null
    );

  const continuarCaptura =
    location.state?.continuarCaptura ===
    true;

  const volverARevision =
    location.state?.volverARevision ===
    true;

  const [
    cantidadFotosExistentes,
    setCantidadFotosExistentes,
  ] = useState(
    Number(
      location.state?.cantidadExistente ||
      0
    )
  );

  const [
    cargandoBorrador,
    setCargandoBorrador,
  ] = useState(
    true
  );

  const [
    borradorPendiente,
    setBorradorPendiente,
  ] = useState(
    null
  );

  const [
    guardando,
    setGuardando,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState(
    ""
  );

  const [
    camaraAbierta,
    setCamaraAbierta,
  ] = useState(
    false
  );

  const [
    iniciandoCamara,
    setIniciandoCamara,
  ] = useState(
    false
  );

  const [
    capturando,
    setCapturando,
  ] = useState(
    false
  );

  const [
    fotosCamara,
    setFotosCamara,
  ] = useState(
    []
  );

  const [
    cuadriculaActiva,
    setCuadriculaActiva,
  ] = useState(
    true
  );

  const [
    linternaDisponible,
    setLinternaDisponible,
  ] = useState(
    false
  );

  const [
    linternaActiva,
    setLinternaActiva,
  ] = useState(
    false
  );


  /*
    ======================================================
    RESGUARDO ROBUSTO EN SERVIDOR
    ======================================================
  */

  async function resguardarFotosServidor(
    borrador
  ) {
    if (
      !borrador?.borradorId ||
      !Array.isArray(
        borrador?.fotos
      ) ||
      borrador.fotos.length ===
        0
    ) {
      throw new Error(
        "No encontramos fotos para guardar."
      );
    }

    const cantidadEsperada =
      Math.min(
        MAX_FOTOS,
        borrador.fotos.length
      );

    /*
      La cola real vive en subidaFotosPublicacion.js.
      Cada llamada entra en esa cola y vuelve a leer IndexedDB.
      No deduplicamos acá: si entró una foto nueva mientras otra
      subía, se programa otra pasada y no se pierde.
    */
    await subirFotosPendientesPublicacion(
      borrador
    );

    const actualizado =
      await obtenerBorradorPublicacion();

    const fotosActualizadas =
      Array.isArray(
        actualizado?.fotos
      )
        ? actualizado.fotos.slice(
            0,
            MAX_FOTOS
          )
        : [];

    const seguras =
      fotosActualizadas.filter(
        (foto) =>
          foto?.subidaServidor ===
            true &&
          foto?.estadoSubida ===
            "SUBIDA"
      ).length;

    if (
      seguras <
      cantidadEsperada
    ) {
      throw new Error(
        `No avanzamos porque faltan fotos por resguardar: ${seguras}/${cantidadEsperada}.`
      );
    }

    return actualizado;
  }


  function iniciarResguardoServidor(
    borrador
  ) {
    if (
      !borrador?.borradorId ||
      !Array.isArray(
        borrador?.fotos
      ) ||
      borrador.fotos.length ===
        0
    ) {
      return;
    }

    resguardarFotosServidor(
      borrador
    ).catch(
      (
        err
      ) => {
        console.error(
          "No se pudo completar el resguardo temprano de fotos:",
          err
        );
      }
    );
  }


  async function guardarFotosYResguardar(
    fotos
  ) {
    const actualizado =
      await guardarFotosBorrador(
        fotos
      );

    /*
      Primero queda seguro en IndexedDB.
      La subida al servidor sigue en segundo plano y es reanudable.
      Así la interfaz nunca queda clavada esperando red.
    */
    iniciarResguardoServidor(
      actualizado
    );

    return actualizado;
  }


  /*
    ------------------------------------------------------
    PREVIEWS TEMPORALES DE LAS CAPTURAS
    ------------------------------------------------------
  */

  const previewsCamara =
    useMemo(
      () =>
        fotosCamara.map(
          (
            archivo
          ) => ({
            archivo,

            url:
              URL
                .createObjectURL(
                  archivo
                ),
          })
        ),

      [
        fotosCamara,
      ]
    );


  useEffect(
    () => {
      return () => {
        previewsCamara.forEach(
          (
            item
          ) => {
            URL.revokeObjectURL(
              item.url
            );
          }
        );
      };
    },

    [
      previewsCamara,
    ]
  );


  /*
    ------------------------------------------------------
    BORRADOR EXISTENTE
    ------------------------------------------------------
  */

  useEffect(
    () => {
      let activo =
        true;

      async function revisarBorrador() {
        try {
          const borrador =
            await obtenerBorradorPublicacion();

          if (!activo) {
            return;
          }

          const fotosExistentes =
            Array.isArray(
              borrador?.fotos
            )
              ? borrador.fotos.slice(
                  0,
                  MAX_FOTOS
                )
              : [];

          if (
            fotosExistentes.length >
            0
          ) {
            iniciarResguardoServidor(
              borrador
            );
          }

          if (
            continuarCaptura
          ) {
            setCantidadFotosExistentes(
              fotosExistentes.length
            );

            setBorradorPendiente(
              null
            );

            if (
              fotosExistentes.length >=
              MAX_FOTOS
            ) {
              navigate(
                "/publicar/captura",
                {
                  replace:
                    true,
                }
              );

              return;
            }

            setCargandoBorrador(
              false
            );

            /*
              Abrimos NUESTRA cámara continua después
              de recuperar el borrador existente.
            */
            setTimeout(
              () => {
                if (
                  activo
                ) {
                  iniciarCamara();
                }
              },
              0
            );

            return;
          }

          const ruta =
            obtenerRutaContinuacion(
              borrador
            );

          if (ruta) {
            setBorradorPendiente({
              ...borrador,

              rutaContinuacion:
                ruta,
            });
          }
        } catch (err) {
          console.error(
            "Error revisando borrador pendiente:",
            err
          );
        } finally {
          if (
            activo &&
            !continuarCaptura
          ) {
            setCargandoBorrador(
              false
            );
          }
        }
      }

      revisarBorrador();

      return () => {
        activo =
          false;
      };
    },

    [
      continuarCaptura,
      navigate,
    ]
  );


  /*
    ------------------------------------------------------
    APAGADO SEGURO DE CÁMARA
    ------------------------------------------------------
  */

  function detenerCamara() {
    const stream =
      streamRef.current;

    if (stream) {
      stream
        .getTracks()
        .forEach(
          (
            track
          ) => {
            try {
              track.stop();
            } catch {
              // No bloquea.
            }
          }
        );
    }

    streamRef.current =
      null;

    if (
      videoRef.current
    ) {
      videoRef.current.srcObject =
        null;
    }
  }


  useEffect(
    () => {
      return () => {
        detenerCamara();
      };
    },

    []
  );


  /*
    ------------------------------------------------------
    CONTINUAR / NUEVA
    ------------------------------------------------------
  */

  async function continuarPublicacion() {
    if (
      !borradorPendiente
        ?.rutaContinuacion ||
      guardando
    ) {
      return;
    }

    try {
      setGuardando(
        true
      );

      setError(
        ""
      );

      iniciarResguardoServidor(
        borradorPendiente
      );

      navigate(
        borradorPendiente
          .rutaContinuacion
      );
    } catch (err) {
      console.error(
        "No pudimos asegurar las fotos antes de continuar:",
        err
      );

      setError(
        err?.message ||
        "No pudimos guardar todas las fotos. Probá nuevamente."
      );
    } finally {
      setGuardando(
        false
      );
    }
  }


  async function empezarNueva() {
    try {
      setGuardando(
        true
      );

      setError(
        ""
      );

      detenerCamara();

      setCamaraAbierta(
        false
      );

      setFotosCamara(
        []
      );

      await borrarBorradorPublicacion();

      setBorradorPendiente(
        null
      );
    } catch (err) {
      console.error(
        "Error al borrar borrador:",
        err
      );

      setError(
        "No pudimos empezar una publicación nueva."
      );
    } finally {
      setGuardando(
        false
      );
    }
  }


  /*
    ======================================================
    CÁMARA CONTINUA
    ======================================================
  */

  function obtenerTrackVideo() {
    const stream =
      streamRef.current;

    if (!stream) {
      return null;
    }

    return (
      stream
        .getVideoTracks()
        ?.[0] ||
      null
    );
  }


  function obtenerMaximoCapacidad(
    capacidad,
    fallback
  ) {
    const maximo =
      Number(
        capacidad?.max
      );

    if (
      Number.isFinite(
        maximo
      ) &&
      maximo > 0
    ) {
      return maximo;
    }

    return fallback;
  }


  function obtenerMinimoCapacidad(
    capacidad,
    fallback
  ) {
    const minimo =
      Number(
        capacidad?.min
      );

    if (
      Number.isFinite(
        minimo
      )
    ) {
      return minimo;
    }

    return fallback;
  }


  function capacidadIncluye(
    capacidad,
    valor
  ) {
    return (
      Array.isArray(
        capacidad
      ) &&
      capacidad.includes(
        valor
      )
    );
  }


  async function optimizarTrackParaCaptura() {
    const track =
      obtenerTrackVideo();

    if (!track) {
      return;
    }

    try {
      const capacidades =
        track.getCapabilities
          ? track.getCapabilities()
          : {};

      const anchoMaximo =
        obtenerMaximoCapacidad(
          capacidades?.width,
          4096
        );

      const altoMaximo =
        obtenerMaximoCapacidad(
          capacidades?.height,
          3072
        );

      const restricciones = {
        width: {
          ideal:
            anchoMaximo,
        },

        height: {
          ideal:
            altoMaximo,
        },

        aspectRatio: {
          ideal:
            RELACION_SENSOR_PREFERIDA,
        },

        advanced: [],
      };

      if (
        Array.isArray(
          capacidades?.resizeMode
        ) &&
        capacidades.resizeMode.includes(
          "none"
        )
      ) {
        restricciones.resizeMode = {
          ideal:
            "none",
        };
      }

      if (
        capacidades?.zoom
      ) {
        const zoomMinimo =
          obtenerMinimoCapacidad(
            capacidades.zoom,
            1
          );

        const zoomMaximo =
          obtenerMaximoCapacidad(
            capacidades.zoom,
            1
          );

        const zoomPrincipal =
          Math.min(
            zoomMaximo,
            Math.max(
              zoomMinimo,
              1
            )
          );

        restricciones.advanced.push({
          zoom:
            zoomPrincipal,
        });
      }

      const continuos = {};

      if (
        capacidadIncluye(
          capacidades?.focusMode,
          "continuous"
        )
      ) {
        continuos.focusMode =
          "continuous";
      }

      if (
        capacidadIncluye(
          capacidades?.exposureMode,
          "continuous"
        )
      ) {
        continuos.exposureMode =
          "continuous";
      }

      if (
        capacidadIncluye(
          capacidades?.whiteBalanceMode,
          "continuous"
        )
      ) {
        continuos.whiteBalanceMode =
          "continuous";
      }

      if (
        Object.keys(
          continuos
        ).length
      ) {
        restricciones.advanced.push(
          continuos
        );
      }

      if (
        restricciones.advanced.length ===
        0
      ) {
        delete restricciones.advanced;
      }

      await track.applyConstraints(
        restricciones
      );

      const ajustes =
        track.getSettings
          ? track.getSettings()
          : {};

      console.info(
        "[Nos Sirve] Cámara preparada:",
        {
          label:
            track.label || "",
          width:
            ajustes?.width,
          height:
            ajustes?.height,
          aspectRatio:
            ajustes?.aspectRatio,
          zoom:
            ajustes?.zoom,
          focusMode:
            ajustes?.focusMode,
          exposureMode:
            ajustes?.exposureMode,
          whiteBalanceMode:
            ajustes?.whiteBalanceMode,
          resizeMode:
            ajustes?.resizeMode,
          deviceId:
            ajustes?.deviceId,
        }
      );
    } catch (err) {
      console.warn(
        "No pudimos aplicar todas las optimizaciones de cámara; conservamos la mejor configuración disponible.",
        err
      );
    }
  }


  async function abrirStreamCamaraPrincipal() {
    const baseVideo = {
      width: {
        ideal:
          4096,
      },

      height: {
        ideal:
          3072,
      },

      aspectRatio: {
        ideal:
          RELACION_SENSOR_PREFERIDA,
      },

      resizeMode:
        "none",
    };

    try {
      return await navigator
        .mediaDevices
        .getUserMedia({
          audio:
            false,

          video: {
            ...baseVideo,

            facingMode: {
              exact:
                "environment",
            },
          },
        });
    } catch (errorExacto) {
      console.warn(
        "El navegador no aceptó facingMode exact; usamos cámara trasera preferida.",
        errorExacto
      );

      return await navigator
        .mediaDevices
        .getUserMedia({
          audio:
            false,

          video: {
            ...baseVideo,

            facingMode: {
              ideal:
                "environment",
            },
          },
        });
    }
  }


  async function registrarCamarasDisponibles() {
    try {
      const dispositivos =
        await navigator
          .mediaDevices
          .enumerateDevices();

      const camaras =
        dispositivos
          .filter(
            (
              dispositivo
            ) =>
              dispositivo.kind ===
              "videoinput"
          )
          .map(
            (
              dispositivo
            ) => ({
              label:
                dispositivo.label,
              deviceId:
                dispositivo.deviceId,
              groupId:
                dispositivo.groupId,
            })
          );

      console.info(
        "[Nos Sirve] Cámaras detectadas:",
        camaras
      );
    } catch (err) {
      console.warn(
        "No pudimos enumerar las cámaras disponibles.",
        err
      );
    }
  }


  async function actualizarCapacidadesCamara() {
    const track =
      obtenerTrackVideo();

    if (!track) {
      setLinternaDisponible(
        false
      );

      setLinternaActiva(
        false
      );

      return;
    }

    try {
      const capacidades =
        track
          .getCapabilities
          ? track.getCapabilities()
          : {};

      setLinternaDisponible(
        Boolean(
          capacidades?.torch
        )
      );

      if (
        !capacidades?.torch
      ) {
        setLinternaActiva(
          false
        );
      }
    } catch {
      setLinternaDisponible(
        false
      );

      setLinternaActiva(
        false
      );
    }
  }


  async function alternarLinterna() {
    const track =
      obtenerTrackVideo();

    if (
      !track ||
      !linternaDisponible
    ) {
      return;
    }

    const siguiente =
      !linternaActiva;

    try {
      await track.applyConstraints({
        advanced: [
          {
            torch:
              siguiente,
          },
        ],
      });

      setLinternaActiva(
        siguiente
      );
    } catch (err) {
      console.error(
        "No se pudo cambiar la linterna:",
        err
      );

      setLinternaActiva(
        false
      );

      setError(
        "Este teléfono no permitió controlar la linterna desde Nos Sirve."
      );
    }
  }


  async function crearCapturaCuadradaDesdeArchivo(
    archivo,
    numeroFoto
  ) {
    const imagen =
      await cargarImagenDesdeArchivo(
        archivo
      );

    const anchoOriginal =
      imagen.naturalWidth ||
      imagen.width;

    const altoOriginal =
      imagen.naturalHeight ||
      imagen.height;

    if (
      !anchoOriginal ||
      !altoOriginal
    ) {
      throw new Error(
        "No pudimos leer la foto tomada."
      );
    }

    const ladoFuente =
      Math.min(
        anchoOriginal,
        altoOriginal
      );

    const origenX =
      (
        anchoOriginal -
        ladoFuente
      ) / 2;

    const origenY =
      (
        altoOriginal -
        ladoFuente
      ) / 2;

    const ladoSalida =
      Math.max(
        1,

        Math.min(
          MAX_LADO_CAPTURA,
          ladoFuente
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      ladoSalida;

    canvas.height =
      ladoSalida;

    const contexto =
      canvas.getContext(
        "2d",
        {
          alpha:
            false,
        }
      );

    if (!contexto) {
      throw new Error(
        "No pudimos preparar la fotografía."
      );
    }

    contexto.imageSmoothingEnabled =
      ladoSalida !==
      ladoFuente;

    contexto.imageSmoothingQuality =
      "high";

    contexto.drawImage(
      imagen,

      origenX,
      origenY,
      ladoFuente,
      ladoFuente,

      0,
      0,
      ladoSalida,
      ladoSalida
    );

    const blob =
      await canvasAWebp(
        canvas,
        CALIDAD_CAPTURA
      );

    console.info(
      "[Nos Sirve] Captura interna:",
      {
        origen:
          `${anchoOriginal}x${altoOriginal}`,

        recorte:
          `${ladoFuente}x${ladoFuente}`,

        salida:
          `${ladoSalida}x${ladoSalida}`,

        bytesOrigen:
          archivo?.size || 0,

        bytesSalida:
          blob?.size || 0,
      }
    );

    return new File(
      [
        blob,
      ],

      `foto-${Date.now()}-${numeroFoto}.webp`,

      {
        type:
          "image/webp",

        lastModified:
          Date.now(),
      }
    );
  }


  async function capturarAltaCalidad(
    numeroFoto
  ) {
    const track =
      obtenerTrackVideo();

    if (
      track &&
      typeof globalThis.ImageCapture ===
        "function"
    ) {
      try {
        const capturador =
          new globalThis.ImageCapture(
            track
          );

        let ajustesFoto =
          undefined;

        try {
          const capacidadesFoto =
            capturador
              .getPhotoCapabilities
              ? await capturador.getPhotoCapabilities()
              : null;

          const anchoFotoMaximo =
            obtenerMaximoCapacidad(
              capacidadesFoto?.imageWidth,
              0
            );

          const altoFotoMaximo =
            obtenerMaximoCapacidad(
              capacidadesFoto?.imageHeight,
              0
            );

          if (
            anchoFotoMaximo > 0 &&
            altoFotoMaximo > 0
          ) {
            ajustesFoto = {
              imageWidth:
                anchoFotoMaximo,

              imageHeight:
                altoFotoMaximo,
            };
          }
        } catch (err) {
          console.warn(
            "No pudimos leer las capacidades de foto fija; usamos la mejor captura disponible.",
            err
          );
        }

        const blob =
          ajustesFoto
            ? await capturador.takePhoto(
                ajustesFoto
              )
            : await capturador.takePhoto();

        if (
          blob &&
          blob.size > 0
        ) {
          const tipoOriginal =
            String(
              blob.type ||
              "image/jpeg"
            ).toLowerCase();

          let extension =
            "jpg";

          if (
            tipoOriginal.includes(
              "png"
            )
          ) {
            extension =
              "png";
          } else if (
            tipoOriginal.includes(
              "webp"
            )
          ) {
            extension =
              "webp";
          } else if (
            tipoOriginal.includes(
              "heic"
            )
          ) {
            extension =
              "heic";
          } else if (
            tipoOriginal.includes(
              "heif"
            )
          ) {
            extension =
              "heif";
          }

          const archivoOriginal =
            new File(
              [
                blob,
              ],

              `captura-original-${Date.now()}-${numeroFoto}.${extension}`,

              {
                type:
                  blob.type ||
                  "image/jpeg",

                lastModified:
                  Date.now(),
              }
            );

          console.info(
            "[Nos Sirve] Foto fija original preservada:",
            {
              tipo:
                archivoOriginal.type,

              bytes:
                archivoOriginal.size,

              nombre:
                archivoOriginal.name,

              ajustesTrack:
                track.getSettings
                  ? track.getSettings()
                  : {},
            }
          );

          /*
            IMPORTANTE:
            Si ImageCapture entrega una foto fija real,
            NO la pasamos por canvas, NO la recortamos
            y NO la recomprimimos.

            Así conservamos:
            - resolución original;
            - perfil/color que entrega la cámara;
            - detalle fino;
            - rango tonal;
            - archivo fuente para que MAGIA haga después
              enderezado, recorte, fondo y WebP final.

            El cuadrado de la interfaz queda como guía visual.
            La curaduría trabaja sobre el original completo.
          */
          return archivoOriginal;
        }
      } catch (err) {
        console.warn(
          "ImageCapture no estuvo disponible; usamos captura del video.",
          err
        );
      }
    }

    const video =
      videoRef.current;

    if (
      !video ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      throw new Error(
        "La cámara todavía se está preparando."
      );
    }

    const anchoVideo =
      video.videoWidth;

    const altoVideo =
      video.videoHeight;

    const escala =
      Math.min(
        1,

        MAX_LADO_CAPTURA /
          Math.max(
            anchoVideo,
            altoVideo
          )
      );

    const anchoSalida =
      Math.max(
        1,

        Math.round(
          anchoVideo *
            escala
        )
      );

    const altoSalida =
      Math.max(
        1,

        Math.round(
          altoVideo *
            escala
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      anchoSalida;

    canvas.height =
      altoSalida;

    const contexto =
      canvas.getContext(
        "2d",
        {
          alpha:
            false,
        }
      );

    if (!contexto) {
      throw new Error(
        "No pudimos preparar la fotografía."
      );
    }

    contexto.imageSmoothingEnabled =
      escala !== 1;

    contexto.imageSmoothingQuality =
      "high";

    contexto.drawImage(
      video,
      0,
      0,
      anchoVideo,
      altoVideo,
      0,
      0,
      anchoSalida,
      altoSalida
    );

    const blob =
      await canvasAWebp(
        canvas,
        CALIDAD_CAPTURA
      );

    console.info(
      "[Nos Sirve] Captura fallback desde video:",
      {
        origen:
          `${anchoVideo}x${altoVideo}`,

        salida:
          `${anchoSalida}x${altoSalida}`,

        bytesSalida:
          blob?.size || 0,
      }
    );

    return new File(
      [
        blob,
      ],

      `foto-${Date.now()}-${numeroFoto}.webp`,

      {
        type:
          "image/webp",

        lastModified:
          Date.now(),
      }
    );
  }


  function camaraVisibleYViva() {
    const video =
      videoRef.current;

    const track =
      obtenerTrackVideo();

    return Boolean(
      document.visibilityState ===
        "visible" &&
      video &&
      !video.paused &&
      video.readyState >=
        2 &&
      track &&
      track.readyState ===
        "live" &&
      !track.muted
    );
  }


  async function conectarStreamAVideo(
    stream
  ) {
    streamRef.current =
      stream;

    setCamaraAbierta(
      true
    );

    await new Promise(
      (resolve) => {
        requestAnimationFrame(
          resolve
        );
      }
    );

    const video =
      videoRef.current;

    if (!video) {
      throw new Error(
        "No pudimos iniciar la cámara."
      );
    }

    video.srcObject =
      stream;

    await optimizarTrackParaCaptura();

    await video.play();

    await actualizarCapacidadesCamara();
  }


  async function reactivarCamaraVisible() {
    if (
      !camaraDebeEstarActivaRef.current ||
      document.visibilityState !==
        "visible" ||
      reactivandoCamaraRef.current ||
      guardando ||
      capturando
    ) {
      return;
    }

    reactivandoCamaraRef.current =
      true;

    try {
      detenerCamara();

      const stream =
        await abrirStreamCamaraPrincipal();

      await conectarStreamAVideo(
        stream
      );
    } catch (err) {
      console.error(
        "No pudimos reactivar la cámara al volver a la app:",
        err
      );

      setError(
        "La cámara se pausó mientras estabas fuera. Tocá acá o volvé a abrirla para continuar."
      );
    } finally {
      reactivandoCamaraRef.current =
        false;
    }
  }


  async function asegurarCamaraListaParaCaptura() {
    if (
      camaraVisibleYViva()
    ) {
      return;
    }

    await reactivarCamaraVisible();

    if (
      !camaraVisibleYViva()
    ) {
      throw new Error(
        "La cámara todavía no está lista. Esperá un instante y probá otra vez."
      );
    }
  }


  useEffect(
    () => {
      function alVolver() {
        if (
          document.visibilityState ===
          "visible"
        ) {
          reactivarCamaraVisible();
        }
      }

      document.addEventListener(
        "visibilitychange",
        alVolver
      );

      window.addEventListener(
        "focus",
        alVolver
      );

      window.addEventListener(
        "pageshow",
        alVolver
      );

      return () => {
        document.removeEventListener(
          "visibilitychange",
          alVolver
        );

        window.removeEventListener(
          "focus",
          alVolver
        );

        window.removeEventListener(
          "pageshow",
          alVolver
        );
      };
    }
  );


  async function iniciarCamara() {
    if (
      guardando ||
      (
        borradorPendiente &&
        !continuarCaptura
      ) ||
      iniciandoCamara
    ) {
      return;
    }

    setError(
      ""
    );

    setIniciandoCamara(
      true
    );

    if (
      !continuarCaptura
    ) {
      setFotosCamara(
        []
      );
    }

    setLinternaDisponible(
      false
    );

    setLinternaActiva(
      false
    );

    try {
      if (
        !navigator
          ?.mediaDevices
          ?.getUserMedia
      ) {
        throw new Error(
          "CAMARA_INTERNA_NO_DISPONIBLE"
        );
      }

      detenerCamara();

      camaraDebeEstarActivaRef.current =
        true;

      const stream =
        await abrirStreamCamaraPrincipal();

      await registrarCamarasDisponibles();

      await conectarStreamAVideo(
        stream
      );
    } catch (err) {
      console.error(
        "No se pudo abrir cámara interna:",
        err
      );

      detenerCamara();

      setCamaraAbierta(
        false
      );

      setLinternaDisponible(
        false
      );

      setLinternaActiva(
        false
      );

      camaraDebeEstarActivaRef.current =
        false;

      inputCamaraRef
        .current
        ?.click();
    } finally {
      setIniciandoCamara(
        false
      );
    }
  }


  function cerrarCamara() {
    if (
      capturando ||
      guardando
    ) {
      return;
    }

    camaraDebeEstarActivaRef.current =
      false;

    detenerCamara();

    setCamaraAbierta(
      false
    );

    setFotosCamara(
      []
    );

    setLinternaDisponible(
      false
    );

    setLinternaActiva(
      false
    );

    if (
      continuarCaptura
    ) {
      navigate(
        "/publicar/captura",
        {
          replace:
            true,
        }
      );
    }
  }


  async function capturarFoto() {
    const totalActual =
      Math.min(
        MAX_FOTOS,
        cantidadFotosExistentes +
        fotosCamara.length
      );

    if (
      capturando ||
      guardando ||
      totalActual >=
        MAX_FOTOS
    ) {
      return;
    }

    setCapturando(
      true
    );

    setError(
      ""
    );

    try {
      await asegurarCamaraListaParaCaptura();

      const numeroFoto =
        cantidadFotosExistentes +
        fotosCamara.length +
        1;

      const archivo =
        await capturarAltaCalidad(
          numeroFoto
        );

      const siguientes = [
        ...fotosCamara,
        archivo,
      ].slice(
        0,
        MAX_FOTOS
      );

      setFotosCamara(
        siguientes
      );

      if (
        cantidadFotosExistentes +
        siguientes.length >=
        MAX_FOTOS
      ) {
        await finalizarFotosCamara(
          siguientes
        );
      }
    } catch (err) {
      console.error(
        "Error capturando foto:",
        err
      );

      setError(
        err?.message ||
        "No pudimos sacar la foto. Probá de nuevo."
      );
    } finally {
      setCapturando(
        false
      );
    }
  }


  function descartarUltimaFoto() {
    if (
      capturando ||
      guardando ||
      fotosCamara.length ===
        0
    ) {
      return;
    }

    setFotosCamara(
      (
        actuales
      ) =>
        actuales.slice(
          0,
          -1
        )
    );
  }


  async function finalizarFotosCamara(
    fotos =
      fotosCamara
  ) {
    if (
      guardando ||
      !Array.isArray(
        fotos
      ) ||
      fotos.length === 0
    ) {
      return;
    }

    try {
      setGuardando(
        true
      );

      setError(
        ""
      );

      await guardarFotosYResguardar(
        fotos
      );

      const borradorActualizado =
        await obtenerBorradorPublicacion();

      const totalGuardado =
        Array.isArray(
          borradorActualizado?.fotos
        )
          ? Math.min(
              MAX_FOTOS,
              borradorActualizado.fotos.length
            )
          : cantidadFotosExistentes +
            fotos.length;

      setCantidadFotosExistentes(
        totalGuardado
      );

      camaraDebeEstarActivaRef.current =
        false;

      detenerCamara();

      setCamaraAbierta(
        false
      );

      setFotosCamara(
        []
      );

      navigate(
        volverARevision
          ? "/publicar/captura"
          : "/publicar/captura",
        {
          replace:
            continuarCaptura,
        }
      );
    } catch (err) {
      console.error(
        "Error guardando capturas:",
        err
      );

      setError(
        err?.message ||
        "No pudimos guardar las fotos. Probá de nuevo."
      );
    } finally {
      setGuardando(
        false
      );
    }
  }


  /*
    ======================================================
    GALERÍA / CÁMARA NATIVA FALLBACK
    ======================================================
  */

  function abrirGaleria() {
    if (
      guardando ||
      borradorPendiente
    ) {
      return;
    }

    inputGaleriaRef
      .current
      ?.click();
  }


  async function recibirFotos(
    event
  ) {
    const input =
      event.target;

    const elegidas =
      Array.from(
        input.files ||
        []
      );

    input.value =
      "";

    if (
      elegidas.length ===
      0
    ) {
      return;
    }

    setError(
      ""
    );

    setGuardando(
      true
    );

    try {
      const borrador =
        await obtenerBorradorPublicacion();

      const fotosActuales =
        Array.isArray(
          borrador?.fotos
        )
          ? borrador.fotos
          : [];

      const disponibles =
        Math.max(
          0,

          MAX_FOTOS -
            fotosActuales.length
        );

      if (
        disponibles ===
        0
      ) {
        await resguardarFotosServidor(
          borrador
        );

        navigate(
          "/publicar/captura"
        );

        return;
      }

      const seleccionadas =
        elegidas.slice(
          0,
          disponibles
        );

      const fotosWebp =
        [];

      for (
        let indice = 0;
        indice <
        seleccionadas.length;
        indice += 1
      ) {
        try {
          const webp =
            await convertirAWebp(
              seleccionadas[
                indice
              ],

              indice
            );

          fotosWebp.push(
            webp
          );
        } catch (err) {
          const nombre =
            seleccionadas[
              indice
            ]?.name ||
            `foto ${indice + 1}`;

          throw new Error(
            `${
              err?.message ||
              "No pudimos preparar una de las fotos."
            } (${nombre})`
          );
        }
      }

      await guardarFotosYResguardar(
        fotosWebp
      );

      navigate(
        "/publicar/captura"
      );
    } catch (err) {
      console.error(
        "Error al preparar las fotos:",
        err
      );

      setError(
        err?.message ||
        "No pudimos guardar las fotos. Probá de nuevo."
      );
    } finally {
      setGuardando(
        false
      );
    }
  }


  /*
    ======================================================
    CARGANDO
    ======================================================
  */

  if (
    cargandoBorrador
  ) {
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
        Revisando tu publicación...
      </main>
    );
  }


  /*
    ======================================================
    CÁMARA ABIERTA
    ======================================================
  */

  if (
    camaraAbierta
  ) {
    return (
      <>
        <style>{`
          .sv-camara-pantalla {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #111;
            color: #fff;
          }

          .sv-camara-cabecera {
            min-height: 70px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding:
              max(12px, env(safe-area-inset-top))
              17px
              10px;
            background: #111;
          }

          .sv-camara-titulo {
            font-size: 15px;
            font-weight: 850;
            text-align: center;
          }

          .sv-camara-contador {
            color: #f4be32;
            font-size: 13px;
            font-weight: 850;
          }

          .sv-camara-cerrar {
            min-width: 66px;
            min-height: 38px;
            border: 1px solid rgba(255,255,255,.4);
            border-radius: 12px;
            background: transparent;
            color: #fff;
            font: inherit;
            font-size: 12px;
            font-weight: 800;
          }

          .sv-camara-cuerpo {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }

          .sv-camara-centro {
            flex: 1;
            min-height: 0;
            display: grid;
            place-items: center;
            padding: 8px 12px 8px;
          }

          .sv-camara-area {
            position: relative;
            width: min(
              calc(100vw - 24px),
              520px
            );
            max-height: 100%;
            aspect-ratio: 1 / 1;
            overflow: hidden;
            border-radius: 18px;
            background: #000;
          }

          .sv-camara-video {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            object-position: center;
            background: #000;
          }

          .sv-camara-oscuro {
            position: absolute;
            inset: 0;
            pointer-events: none;
            box-shadow:
              inset 0 0 0 1px
              rgba(255,255,255,.1);
          }

          .sv-camara-marco {
            position: absolute;
            inset: 0;
            border: 2px solid rgba(255,255,255,.94);
            border-radius: 18px;
            pointer-events: none;
          }

          .sv-camara-cuadricula {
            position: absolute;
            inset: 0;
            border-radius: 18px;
            pointer-events: none;
            overflow: hidden;
          }

          .sv-camara-cuadricula::before,
          .sv-camara-cuadricula::after {
            content: "";
            position: absolute;
            inset: 0;
          }

          .sv-camara-cuadricula::before {
            background:
              linear-gradient(
                to right,
                transparent 33.16%,
                rgba(255,255,255,.62) 33.16%,
                rgba(255,255,255,.62) 33.5%,
                transparent 33.5%,
                transparent 66.5%,
                rgba(255,255,255,.62) 66.5%,
                rgba(255,255,255,.62) 66.84%,
                transparent 66.84%
              );
          }

          .sv-camara-cuadricula::after {
            background:
              linear-gradient(
                to bottom,
                transparent 33.16%,
                rgba(255,255,255,.62) 33.16%,
                rgba(255,255,255,.62) 33.5%,
                transparent 33.5%,
                transparent 66.5%,
                rgba(255,255,255,.62) 66.5%,
                rgba(255,255,255,.62) 66.84%,
                transparent 66.84%
              );
          }

          .sv-camara-panel {
            flex: 0 0 auto;
            background: #111;
          }

          .sv-camara-orientacion {
            margin: 2px 16px 4px;
            color: rgba(255,255,255,.84);
            text-align: center;
            font-size: 12px;
            line-height: 1.3;
          }

          .sv-camara-orientacion strong {
            color: #fff;
          }

          .sv-camara-miniaturas {
            min-height: 58px;
            display: flex;
            justify-content: center;
            gap: 6px;
            padding: 5px 12px 4px;
            background: #111;
          }

          .sv-camara-miniatura {
            width: 48px;
            height: 48px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,.35);
            border-radius: 8px;
            background: #222;
          }

          .sv-camara-miniatura img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }

          .sv-camara-miniatura-existente {
            display: grid;
            place-items: center;
            color: #8fd3b8;
            font-size: 20px;
            font-weight: 900;
          }

          .sv-camara-error {
            padding: 6px 14px 0;
            color: #ffd3c4;
            text-align: center;
            font-size: 12px;
          }

          .sv-camara-controles {
            padding:
              6px
              15px
              max(14px, env(safe-area-inset-bottom));
            background: #111;
          }

          .sv-camara-herramientas {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 7px;
            margin-bottom: 8px;
          }

          .sv-camara-herramienta {
            min-height: 38px;
            border: 1px solid rgba(255,255,255,.28);
            border-radius: 11px;
            background: rgba(255,255,255,.06);
            color: #fff;
            font: inherit;
            font-size: 11px;
            font-weight: 800;
          }

          .sv-camara-herramienta.activa {
            border-color: #f4be32;
            color: #f4be32;
          }

          .sv-camara-herramienta:disabled {
            opacity: .38;
          }

          .sv-camara-disparador-fila {
            display: grid;
            place-items: center;
          }

          .sv-camara-disparador {
            width: 72px;
            height: 72px;
            border: 6px solid #fff;
            border-radius: 50%;
            background: #f4be32;
            box-shadow:
              0 0 0 2px
              rgba(255,255,255,.35);
            cursor: pointer;
          }

          .sv-camara-disparador:disabled {
            opacity: .55;
          }

          .sv-camara-listo {
            width: 100%;
            min-height: 46px;
            margin-top: 8px;
            border: 0;
            border-radius: 15px;
            background: var(--sv-mostaza);
            color: #fff;
            font: inherit;
            font-size: 14px;
            font-weight: 900;
          }

          .sv-camara-listo:disabled {
            opacity: .45;
          }

          @media (orientation: landscape) {
            .sv-camara-pantalla {
              overflow: hidden;
            }

            .sv-camara-cabecera {
              min-height: 56px;
              padding:
                max(8px, env(safe-area-inset-top))
                max(14px, env(safe-area-inset-right))
                6px
                max(14px, env(safe-area-inset-left));
            }

            .sv-camara-cuerpo {
              display: grid;
              grid-template-columns:
                minmax(0, 1fr)
                minmax(220px, 280px);
              gap: 8px;
              padding:
                0
                max(10px, env(safe-area-inset-right))
                max(8px, env(safe-area-inset-bottom))
                max(10px, env(safe-area-inset-left));
            }

            .sv-camara-centro {
              padding: 0;
            }

            .sv-camara-area {
              width: min(
                72dvh,
                520px,
                calc(100vw - 300px)
              );
              max-width: 100%;
              max-height: calc(100dvh - 68px);
              aspect-ratio: 1 / 1;
            }

            .sv-camara-panel {
              min-height: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
              border-radius: 16px;
              background: #151515;
            }

            .sv-camara-orientacion {
              margin: 8px 12px 4px;
            }

            .sv-camara-miniaturas {
              min-height: 50px;
              flex-wrap: wrap;
              align-content: center;
              padding: 4px 8px;
              background: transparent;
            }

            .sv-camara-miniatura {
              width: 42px;
              height: 42px;
            }

            .sv-camara-controles {
              padding:
                6px
                10px
                10px;
              background: transparent;
            }

            .sv-camara-herramientas {
              grid-template-columns: 1fr;
            }

            .sv-camara-herramienta {
              min-height: 34px;
            }

            .sv-camara-disparador {
              width: 66px;
              height: 66px;
            }

            .sv-camara-listo {
              min-height: 42px;
            }
          }
        `}</style>

        <main className="sv-camara-pantalla">
          <header className="sv-camara-cabecera">
            <button
              type="button"
              className="sv-camara-cerrar"
              onClick={
                cerrarCamara
              }
              disabled={
                capturando ||
                guardando
              }
            >
              Salir
            </button>

            <div className="sv-camara-titulo">
              Fotos del objeto
            </div>

            <div className="sv-camara-contador">
              {Math.min(
                MAX_FOTOS,
                cantidadFotosExistentes +
                fotosCamara.length
              )}
              {" / "}
              {MAX_FOTOS}
            </div>
          </header>

          <div className="sv-camara-cuerpo">
            <section className="sv-camara-centro">
              <div className="sv-camara-area">
                <video
                  ref={
                    videoRef
                  }
                  className="sv-camara-video"
                  autoPlay
                  playsInline
                  muted
                />

                <div className="sv-camara-oscuro" />

                <div className="sv-camara-marco" />

                {cuadriculaActiva && (
                  <div className="sv-camara-cuadricula" />
                )}
              </div>
            </section>

            <aside className="sv-camara-panel">
              <div className="sv-camara-orientacion">
                Tratá de que el objeto quede completo y centrado dentro del cuadro.
                {" "}
                <strong>
                  La app guarda el original completo y usa la cámara principal en 1x.
                </strong>
                {" "}
                Para mejores resultados, sostené el teléfono en vertical.
              </div>

              <div className="sv-camara-miniaturas">
                {Array.from({
                  length:
                    cantidadFotosExistentes,
                }).map(
                  (
                    _,
                    indice
                  ) => (
                    <div
                      className="sv-camara-miniatura sv-camara-miniatura-existente"
                      key={`existente-${indice}`}
                      aria-label={`Foto ya guardada ${indice + 1}`}
                    >
                      <span>
                        ✓
                      </span>
                    </div>
                  )
                )}

                {previewsCamara.map(
                  (
                    item,
                    indice
                  ) => (
                    <div
                      className="sv-camara-miniatura"
                      key={`${item.archivo.name}-${indice}`}
                    >
                      <img
                        src={
                          item.url
                        }
                        alt={`Foto ${cantidadFotosExistentes + indice + 1}`}
                      />
                    </div>
                  )
                )}
              </div>

              {error && (
                <div className="sv-camara-error">
                  {error}
                </div>
              )}

              <footer className="sv-camara-controles">
                <div className="sv-camara-herramientas">
                  <button
                    type="button"
                    className={`sv-camara-herramienta ${
                      cuadriculaActiva
                        ? "activa"
                        : ""
                    }`}
                    onClick={() =>
                      setCuadriculaActiva(
                        (
                          actual
                        ) =>
                          !actual
                      )
                    }
                    disabled={
                      capturando ||
                      guardando
                    }
                  >
                    Cuadrícula
                    {cuadriculaActiva
                      ? " · ON"
                      : " · OFF"}
                  </button>

                  <button
                    type="button"
                    className="sv-camara-herramienta"
                    onClick={
                      descartarUltimaFoto
                    }
                    disabled={
                      capturando ||
                      guardando ||
                      fotosCamara.length ===
                        0
                    }
                  >
                    Descartar última
                  </button>

                  <button
                    type="button"
                    className={`sv-camara-herramienta ${
                      linternaActiva
                        ? "activa"
                        : ""
                    }`}
                    onClick={
                      alternarLinterna
                    }
                    disabled={
                      capturando ||
                      guardando ||
                      !linternaDisponible
                    }
                  >
                    {linternaDisponible
                      ? (
                        linternaActiva
                          ? "Linterna · ON"
                          : "Linterna · OFF"
                      )
                      : "Sin linterna"}
                  </button>
                </div>

                <div className="sv-camara-disparador-fila">
                  <button
                    type="button"
                    className="sv-camara-disparador"
                    aria-label="Sacar foto"
                    onClick={
                      capturarFoto
                    }
                    disabled={
                      capturando ||
                      guardando ||
                      cantidadFotosExistentes +
                        fotosCamara.length >=
                        MAX_FOTOS
                    }
                  />
                </div>

                <button
                  type="button"
                  className="sv-camara-listo"
                  disabled={
                    fotosCamara.length ===
                      0 ||
                    capturando ||
                    guardando
                  }
                  onClick={() =>
                    finalizarFotosCamara()
                  }
                >
                  {guardando
                    ? "Guardando fotos..."
                    : continuarCaptura
                      ? `Listo · ${
                          Math.min(
                            MAX_FOTOS,
                            cantidadFotosExistentes +
                            fotosCamara.length
                          )
                        } / ${MAX_FOTOS}`
                      : `Listo · usar ${
                          fotosCamara.length
                        } ${
                          fotosCamara.length ===
                          1
                            ? "foto"
                            : "fotos"
                        }`}
                </button>
              </footer>
            </aside>
          </div>
        </main>
      </>
    );
  }


  /*
    ======================================================
    PANTALLA NORMAL
    ======================================================
  */

  return (
    <>
      <style>{`
        .sv-borrador-pendiente {
          margin-bottom: 18px;
          padding: 18px;
          border: 1px solid #d7e6d6;
          border-radius: 18px;
          background: #f3f9f2;
        }

        .sv-borrador-pendiente h2 {
          margin: 0 0 6px;
          color: var(--sv-petroleo);
          font-size: 20px;
          line-height: 1.2;
        }

        .sv-borrador-pendiente p {
          margin: 0;
          color: #5d5a55;
          font-size: 13px;
          line-height: 1.4;
        }

        .sv-borrador-nombre {
          margin-top: 8px !important;
          color: var(--sv-petroleo) !important;
          font-weight: 850;
        }

        .sv-borrador-acciones {
          display: grid;
          gap: 9px;
          margin-top: 15px;
        }

        .sv-borrador-continuar,
        .sv-borrador-nueva {
          width: 100%;
          min-height: 50px;
          border-radius: 16px;
          font: inherit;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
        }

        .sv-borrador-continuar {
          border: 0;
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-borrador-nueva {
          border: 1.4px solid var(--sv-petroleo);
          background: transparent;
          color: var(--sv-petroleo);
        }

        .sv-guia {
          display: grid;
          gap: 8px;
        }

        .sv-guia-card {
          min-height: 88px;
          display: grid;
          grid-template-columns: 87px 1fr;
          overflow: hidden;
          border: 1px solid var(--sv-borde);
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 5px 15px
            rgba(38, 53, 54, 0.025);
        }

        .sv-guia-visual {
          display: grid;
          place-items: center;
          border-right: 1px solid #eee4d9;
          background:
            linear-gradient(
              145deg,
              #fbfaf7 0%,
              #f4f1ec 100%
            );
        }

        .sv-guia-contenido {
          display: grid;
          grid-template-columns: 31px 1fr;
          gap: 9px;
          align-items: center;
          padding: 10px 12px;
        }

        .sv-guia-numero {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          align-self: start;
          margin-top: 1px;
          border-radius: 50%;
          background: var(--sv-petroleo);
          color: #fff;
          font-size: 13px;
          font-weight: 850;
        }

        .sv-guia-texto h2 {
          margin: 0 0 3px;
          color: var(--sv-petroleo);
          font-size: 15.5px;
          line-height: 1.18;
          font-weight: 850;
        }

        .sv-guia-texto p {
          margin: 0;
          color: #4f504e;
          font-size: 13.2px;
          line-height: 1.28;
        }

        .sv-miniobjeto {
          position: relative;
          box-sizing: border-box;
          color: #525957;
        }

        .sv-miniobjeto.frente {
          width: 43px;
          height: 58px;
          border: 2px solid #59605e;
          border-radius: 4px;
          background: #f7f7f5;
        }

        .sv-mini-puerta {
          position: absolute;
          left: 5px;
          top: 8px;
          width: 3px;
          height: 17px;
          border-radius: 4px;
          background: #59605e;
        }

        .sv-mini-linea {
          position: absolute;
          left: 0;
          right: 0;
          top: 25px;
          height: 1.5px;
          background: #59605e;
        }

        .sv-miniobjeto.angulo {
          width: 48px;
          height: 58px;
          transform:
            perspective(100px)
            rotateY(-8deg);
        }

        .sv-mini-cara-a {
          position: absolute;
          left: 5px;
          top: 2px;
          width: 30px;
          height: 53px;
          border: 2px solid #59605e;
          border-radius: 4px 0 0 4px;
          background: #fafaf8;
        }

        .sv-mini-cara-b {
          position: absolute;
          right: 2px;
          top: 5px;
          width: 15px;
          height: 48px;
          border: 2px solid #59605e;
          border-left: 0;
          border-radius: 0 4px 4px 0;
          background: #eeeeeb;
          transform: skewY(12deg);
        }

        .sv-miniobjeto.trasera {
          width: 44px;
          height: 58px;
          border: 2px solid #59605e;
          border-radius: 4px;
          background: #f3f3f1;
        }

        .sv-mini-rejilla {
          position: absolute;
          left: 6px;
          right: 6px;
          height: 4px;
          border-radius: 4px;
          background: #737977;
        }

        .sv-mini-rejilla.r1 {
          top: 12px;
        }

        .sv-mini-rejilla.r2 {
          top: 21px;
        }

        .sv-mini-rejilla.r3 {
          top: 30px;
        }

        .sv-mini-rejilla.r4 {
          top: 39px;
        }

        .sv-miniobjeto.detalle {
          width: 52px;
          height: 52px;
          overflow: hidden;
          border-radius: 9px;
          background:
            linear-gradient(
              135deg,
              #dedfdd 0%,
              #f1f1ef 100%
            );
        }

        .sv-miniobjeto.detalle::before {
          content: "";
          position: absolute;
          top: -6px;
          right: -8px;
          width: 42px;
          height: 42px;
          border: 2px solid #676d6b;
          border-radius: 8px;
        }

        .sv-miniobjeto.detalle span {
          position: absolute;
          left: 22px;
          top: 23px;
          width: 16px;
          height: 2px;
          background: #686d6b;
          transform: rotate(-47deg);
        }

        .sv-miniobjeto.detalle span::after {
          content: "";
          position: absolute;
          left: 6px;
          top: -4px;
          width: 8px;
          height: 2px;
          background: #686d6b;
          transform: rotate(75deg);
        }

        .sv-miniobjeto.etiqueta {
          width: 52px;
          height: 46px;
          padding: 7px 6px;
          border: 2px solid #5c6360;
          border-radius: 7px;
          background: #f7f7f5;
        }

        .sv-etiqueta-linea {
          width: 27px;
          height: 2px;
          margin-bottom: 4px;
          border-radius: 2px;
          background: #68706d;
        }

        .sv-etiqueta-linea.larga {
          width: 36px;
        }

        .sv-etiqueta-linea.corta {
          width: 19px;
        }

        .sv-etiqueta-codigo {
          position: absolute;
          right: 6px;
          bottom: 6px;
          width: 13px;
          height: 10px;
          background:
            repeating-linear-gradient(
              90deg,
              #5c6360 0,
              #5c6360 1px,
              transparent 1px,
              transparent 3px
            );
        }

        .sv-acciones {
          margin-top: 16px;
        }

        .sv-accion-principal,
        .sv-accion-secundaria {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          font: inherit;
          font-weight: 850;
          cursor: pointer;
        }

        .sv-accion-principal {
          min-height: 54px;
          padding: 11px 18px;
          border: 0;
          border-radius: 18px;
          background: var(--sv-petroleo);
          color: #fff;
          font-size: 16.5px;
          box-shadow:
            0 9px 19px
            rgba(7, 87, 83, 0.14);
        }

        .sv-accion-secundaria {
          min-height: 50px;
          margin-top: 9px;
          padding: 10px 18px;
          border: 1.4px solid var(--sv-petroleo);
          border-radius: 18px;
          background: transparent;
          color: var(--sv-petroleo);
          font-size: 15.5px;
        }

        .sv-accion-principal:disabled,
        .sv-accion-secundaria:disabled {
          opacity: 0.58;
          cursor: wait;
        }

        .sv-estado-fotos {
          margin-top: 12px;
          padding: 11px 13px;
          border-radius: 14px;
          text-align: center;
          font-size: 12.8px;
          line-height: 1.35;
        }

        .sv-estado-fotos.error {
          border: 1px solid #efcabb;
          background: #fff3ee;
          color: #a84422;
        }

        .sv-recomendacion {
          margin: 12px 5px 0;
          color: #68635e;
          text-align: center;
          font-size: 12.7px;
          line-height: 1.35;
        }

        .sv-recomendacion strong {
          color: var(--sv-petroleo);
        }

        .sv-input-oculto {
          display: none;
        }

        @media (
          max-width: 380px
        ) {
          .sv-guia-card {
            grid-template-columns:
              78px 1fr;
          }

          .sv-guia-texto h2 {
            font-size: 14.5px;
          }
        }
      `}</style>

      <PantallaOperativa
        titulo="Mostranos bien el objeto"
        fijarSubtitulo={false}
        subtitulo={
          borradorPendiente
            ? "Tenés una publicación sin terminar."
            : (
              <>
                Podés cargar hasta 5 fotos.
                <br />
                Cuanto mejor se vea, mejor podemos ayudarte.
              </>
            )
        }
        mostrarAyuda={
          !borradorPendiente
        }
      >
        {borradorPendiente ? (
          <section className="sv-borrador-pendiente">
            <h2>
              Tenés una publicación pendiente
            </h2>

            <p>
              Podés seguir exactamente desde donde la dejaste.
            </p>

            {(borradorPendiente.titulo ||
              borradorPendiente
                ?.analisisIA
                ?.tituloSugerido) && (
              <p className="sv-borrador-nombre">
                {borradorPendiente.titulo ||
                  borradorPendiente
                    ?.analisisIA
                    ?.tituloSugerido}
              </p>
            )}

            <div className="sv-borrador-acciones">
              <button
                type="button"
                className="sv-borrador-continuar"
                onClick={
                  continuarPublicacion
                }
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando fotos..."
                  : "Continuar publicación"}
              </button>

              <button
                type="button"
                className="sv-borrador-nueva"
                onClick={
                  empezarNueva
                }
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Preparando..."
                  : "Empezar una nueva"}
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="sv-guia">
              {GUIA.map(
                (
                  item
                ) => (
                  <article
                    className="sv-guia-card"
                    key={
                      item.numero
                    }
                  >
                    <div className="sv-guia-visual">
                      <MiniObjeto
                        tipo={
                          item.tipo
                        }
                      />
                    </div>

                    <div className="sv-guia-contenido">
                      <span className="sv-guia-numero">
                        {
                          item.numero
                        }
                      </span>

                      <div className="sv-guia-texto">
                        <h2>
                          {
                            item.titulo
                          }
                        </h2>

                        <p>
                          {
                            item.texto
                          }
                        </p>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>

            <div className="sv-acciones">
              <button
                type="button"
                className="sv-accion-principal"
                onClick={
                  iniciarCamara
                }
                disabled={
                  guardando ||
                  iniciandoCamara
                }
              >
                <IconoCamara />

                {iniciandoCamara
                  ? "Abriendo cámara..."
                  : "Sacar fotos"}
              </button>

              <button
                type="button"
                className="sv-accion-secundaria"
                onClick={
                  abrirGaleria
                }
                disabled={
                  guardando ||
                  iniciandoCamara
                }
              >
                <IconoGaleria />

                Elegir fotos de mi galería
              </button>

              <input
                ref={
                  inputCamaraRef
                }
                className="sv-input-oculto"
                type="file"
                accept="image/*,.heic,.heif"
                capture="environment"
                onChange={
                  recibirFotos
                }
              />

              <input
                ref={
                  inputGaleriaRef
                }
                className="sv-input-oculto"
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={
                  recibirFotos
                }
              />
            </div>

            <p className="sv-recomendacion">
              Podés avanzar con{" "}
              <strong>
                1 foto
              </strong>
              , pero te recomendamos al menos{" "}
              <strong>
                3
              </strong>
              .
            </p>
          </>
        )}

        {error && (
          <div className="sv-estado-fotos error">
            {error}
          </div>
        )}
      </PantallaOperativa>
    </>
  );
}


export default PublicarFotos;