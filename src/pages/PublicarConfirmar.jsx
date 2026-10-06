import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import PantallaOperativa from "../components/PantallaOperativa";

import { supabase } from "../lib/supabase";

import {
  obtenerBorradorPublicacion,
  borrarBorradorPublicacion,
} from "../utils/borradorPublicacion";

import {
  obtenerUsuarioActual,
} from "../utils/usuario";

import {
  reclamarBorradorPublicacionTemporal,
} from "../utils/subidaFotosPublicacion";


const INTERVALO_CONSULTA_JOB =
  2500;

let contextoAudioPublicacion =
  null;


/*
  ======================================================
  UTILIDADES
  ======================================================
*/

function numeroSeguro(
  valor
) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}


function formatearDinero(
  valor
) {
  return numeroSeguro(
    valor
  ).toLocaleString(
    "es-AR"
  );
}


function formatearFecha(
  fecha
) {
  if (!fecha) {
    return "";
  }

  const partes =
    String(fecha).split(
      "-"
    );

  if (
    partes.length !==
    3
  ) {
    return fecha;
  }

  return (
    `${partes[2]}/` +
    `${partes[1]}/` +
    `${partes[0]}`
  );
}


function textoEntrega(
  valor
) {
  if (
    valor === "EN_MANO"
  ) {
    return "Entrega en mano";
  }

  if (
    valor === "ENVIO"
  ) {
    return "Envío";
  }

  if (
    valor === "RETIRO"
  ) {
    return "Retiro";
  }

  return valor;
}


/*
  ======================================================
  AUDIO / AVISO
  ======================================================
*/

function prepararSonidoPublicacion() {
  try {
    const AudioContexto =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContexto) {
      return;
    }

    if (
      !contextoAudioPublicacion
    ) {
      contextoAudioPublicacion =
        new AudioContexto();
    }

    if (
      contextoAudioPublicacion
        .state ===
      "suspended"
    ) {
      contextoAudioPublicacion
        .resume()
        .catch(
          () => {}
        );
    }
  } catch {
    // Complementario.
  }
}


function emitirSonidoPublicacionLista() {
  try {
    if (
      !contextoAudioPublicacion
    ) {
      return;
    }

    const ahora =
      contextoAudioPublicacion
        .currentTime;

    const ganancia =
      contextoAudioPublicacion
        .createGain();

    ganancia.gain
      .setValueAtTime(
        0.0001,
        ahora
      );

    ganancia.gain
      .exponentialRampToValueAtTime(
        0.12,
        ahora + 0.02
      );

    ganancia.gain
      .exponentialRampToValueAtTime(
        0.0001,
        ahora + 0.42
      );

    ganancia.connect(
      contextoAudioPublicacion
        .destination
    );

    [
      {
        frecuencia:
          659.25,
        inicio:
          0,
        duracion:
          0.16,
      },
      {
        frecuencia:
          880,
        inicio:
          0.18,
        duracion:
          0.22,
      },
    ].forEach(
      ({
        frecuencia,
        inicio,
        duracion,
      }) => {
        const oscilador =
          contextoAudioPublicacion
            .createOscillator();

        oscilador.type =
          "sine";

        oscilador.frequency
          .setValueAtTime(
            frecuencia,
            ahora + inicio
          );

        oscilador.connect(
          ganancia
        );

        oscilador.start(
          ahora + inicio
        );

        oscilador.stop(
          ahora +
          inicio +
          duracion
        );
      }
    );

    if (
      navigator?.vibrate
    ) {
      navigator.vibrate(
        90
      );
    }
  } catch {
    // Complementario.
  }
}


/*
  ======================================================
  JSON SEGURO PARA EL SERVIDOR

  Nunca mandamos File / Blob dentro del JSONB.
  Las imágenes ya están resguardadas en Storage.
  ======================================================
*/

function prepararJsonSeguro(
  valor
) {
  const texto =
    JSON.stringify(
      valor,
      (
        clave,
        contenido
      ) => {
        if (
          typeof Blob !==
            "undefined" &&
          contenido instanceof
            Blob
        ) {
          return undefined;
        }

        if (
          typeof contenido ===
          "function"
        ) {
          return undefined;
        }

        if (
          clave === "url" ||
          clave ===
            "preview"
        ) {
          return undefined;
        }

        return contenido;
      }
    );

  return texto
    ? JSON.parse(
        texto
      )
    : {};
}


function prepararBorradorServidor(
  borrador
) {
  const copia = {
    ...borrador,
  };

  delete copia.fotos;

  return prepararJsonSeguro(
    copia
  );
}


function prepararFotosServidor(
  borrador
) {
  const fotos =
    Array.isArray(
      borrador?.fotos
    )
      ? borrador.fotos
      : [];

  return fotos.map(
    (
      foto,
      indice
    ) => ({
      id:
        foto?.id ||
        null,

      posicion:
        indice + 1,

      rutaOriginal:
        foto?.rutaOriginal ||
        null,

      subidaServidor:
        Boolean(
          foto?.subidaServidor
        ),

      estadoSubida:
        foto?.estadoSubida ||
        null,

      tipo:
        foto?.tipo ||
        foto?.archivo?.type ||
        null,
    })
  );
}


/*
  ======================================================
  JOB SERVER-SIDE
  ======================================================
*/

function obtenerIntentoId(
  borrador
) {
  return String(
    borrador?.borradorId ||
    ""
  ).trim();
}


async function consultarTrabajo(
  intentoId
) {
  if (!intentoId) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "obtener_trabajo_publicacion",
      {
        p_intento_publicacion_id:
          intentoId,
      }
    );

  if (error) {
    throw error;
  }

  if (
    Array.isArray(
      data
    )
  ) {
    return (
      data[0] ||
      null
    );
  }

  return (
    data ||
    null
  );
}


async function crearOObtenerTrabajo(
  borrador
) {
  const intentoId =
    obtenerIntentoId(
      borrador
    );

  if (!intentoId) {
    throw new Error(
      "La publicación no tiene un identificador de intento válido."
    );
  }

  const datosBorrador =
    prepararBorradorServidor(
      borrador
    );

  const fotos =
    prepararFotosServidor(
      borrador
    );

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "crear_o_obtener_trabajo_publicacion",
      {
        p_intento_publicacion_id:
          intentoId,

        p_borrador:
          datosBorrador,

        p_fotos:
          fotos,
      }
    );

  if (error) {
    throw error;
  }

  if (
    Array.isArray(
      data
    )
  ) {
    return (
      data[0] ||
      null
    );
  }

  return (
    data ||
    null
  );
}


async function obtenerPublicacionCreada(
  publicacionId
) {
  if (!publicacionId) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "publicaciones"
      )
      .select(
        "id, numero, titulo"
      )
      .eq(
        "id",
        publicacionId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    data ||
    null
  );
}


/*
  ======================================================
  ESTADO DEL JOB
  ======================================================
*/

function trabajoEstaActivo(
  trabajo
) {
  return (
    trabajo?.estado ===
      "PENDIENTE" ||
    trabajo?.estado ===
      "PROCESANDO"
  );
}


function trabajoPuedeReintentar(
  trabajo
) {
  if (
    trabajo?.estado !==
    "ERROR"
  ) {
    return false;
  }

  const intentos =
    Number(
      trabajo?.intentos ||
      0
    );

  const maxIntentos =
    Number(
      trabajo?.max_intentos ||
      0
    );

  return (
    maxIntentos > 0 &&
    intentos <
      maxIntentos
  );
}


/*
  ======================================================
  COMPONENTE
  ======================================================
*/

function PublicarConfirmar() {
  const navigate =
    useNavigate();

  const timerRef =
    useRef(
      null
    );

  const finalizandoRef =
    useRef(
      false
    );

  const [
    cargando,
    setCargando,
  ] = useState(
    true
  );

  const [
    borrador,
    setBorrador,
  ] = useState(
    null
  );

  const [
    publicando,
    setPublicando,
  ] = useState(
    false
  );

  const [
    mostrarAcceso,
    setMostrarAcceso,
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
    trabajo,
    setTrabajo,
  ] = useState(
    null
  );

  const [
    publicacionCreada,
    setPublicacionCreada,
  ] = useState(
    null
  );


  /*
    ------------------------------------------------------
    DETENER POLLING
    ------------------------------------------------------
  */

  function detenerConsultaEstado() {
    if (
      timerRef.current
    ) {
      window.clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }
  }


  /*
    ------------------------------------------------------
    PUBLICACIÓN TERMINADA
    ------------------------------------------------------
  */

  async function finalizarPublicacion(
    trabajoActual,
    borradorActual
  ) {
    if (
      finalizandoRef.current
    ) {
      return;
    }

    if (
      !trabajoActual
        ?.publicacion_id
    ) {
      return;
    }

    finalizandoRef.current =
      true;

    try {
      detenerConsultaEstado();

      const publicacion =
        await obtenerPublicacionCreada(
          trabajoActual
            .publicacion_id
        );

      if (
        !publicacion?.id ||
        !publicacion?.numero
      ) {
        throw new Error(
          "La publicación fue creada, pero todavía no pudimos recuperar su número."
        );
      }

      await borrarBorradorPublicacion();

      try {
        sessionStorage.setItem(
          "publicacion-destacada-numero",
          String(
            publicacion.numero
          )
        );
      } catch {
        // No bloquea.
      }

      setPublicacionCreada({
        id:
          publicacion.id,

        numero:
          publicacion.numero,

        titulo:
          publicacion.titulo ||
          borradorActual?.titulo ||
          "",
      });

      setTrabajo(
        trabajoActual
      );

      setBorrador(
        null
      );

      setPublicando(
        false
      );

      setError(
        ""
      );

      emitirSonidoPublicacionLista();
    } catch (err) {
      console.error(
        "Error finalizando publicación:",
        err
      );

      setError(
        err?.message ||
        "La publicación terminó, pero no pudimos mostrarla todavía."
      );
    } finally {
      finalizandoRef.current =
        false;
    }
  }


  /*
    ------------------------------------------------------
    CONSULTAR ESTADO
    ------------------------------------------------------
  */

  async function refrescarTrabajo(
    borradorActual
  ) {
    const intentoId =
      obtenerIntentoId(
        borradorActual
      );

    if (!intentoId) {
      return null;
    }

    const actual =
      await consultarTrabajo(
        intentoId
      );

    if (!actual) {
      setTrabajo(
        null
      );

      return null;
    }

    setTrabajo(
      actual
    );

    if (
      actual.estado ===
        "PUBLICADA" &&
      actual.publicacion_id
    ) {
      await finalizarPublicacion(
        actual,
        borradorActual
      );

      return actual;
    }

    if (
      trabajoEstaActivo(
        actual
      ) ||
      trabajoPuedeReintentar(
        actual
      )
    ) {
      setPublicando(
        true
      );

      setError(
        ""
      );
    } else if (
      actual.estado ===
      "ERROR"
    ) {
      setPublicando(
        false
      );

      setError(
        actual.ultimo_error ||
        "No pudimos completar la publicación después de varios intentos."
      );
    }

    return actual;
  }


  /*
    ------------------------------------------------------
    POLLING
    ------------------------------------------------------
  */

  function iniciarConsultaEstado(
    borradorActual
  ) {
    detenerConsultaEstado();

    timerRef.current =
      window.setInterval(
        () => {
          refrescarTrabajo(
            borradorActual
          ).catch(
            (
              err
            ) => {
              console.error(
                "Error consultando estado de publicación:",
                err
              );
            }
          );
        },
        INTERVALO_CONSULTA_JOB
      );
  }


  /*
    ------------------------------------------------------
    CARGA INICIAL
    ------------------------------------------------------
  */

  useEffect(
    () => {
      let activo =
        true;

      async function cargar() {
        try {
          const datos =
            await obtenerBorradorPublicacion();

          if (!activo) {
            return;
          }

          const borradorCompleto =
            Boolean(
              datos?.titulo &&
              datos?.descripcion &&
              datos?.modalidad
            );

          const ubicacionCompleta =
            Boolean(
              datos?.provincia &&
              datos?.localidad &&
              Array.isArray(
                datos?.formasEntrega
              ) &&
              datos.formasEntrega.length >
                0
            );

          if (
            !borradorCompleto
          ) {
            navigate(
              "/publicar/revision",
              {
                replace:
                  true,
              }
            );

            return;
          }

          if (
            !ubicacionCompleta
          ) {
            navigate(
              "/publicar/ubicacion",
              {
                replace:
                  true,
              }
            );

            return;
          }

          setBorrador(
            datos
          );

          /*
            Si ya existe un job para este
            borrador, lo recuperamos.

            NO relanzamos publicación.
          */

          const usuario =
            await obtenerUsuarioActual();

          if (
            usuario &&
            datos?.borradorId
          ) {
            try {
              const existente =
                await refrescarTrabajo(
                  datos
                );

              if (
                existente &&
                (
                  trabajoEstaActivo(
                    existente
                  ) ||
                  trabajoPuedeReintentar(
                    existente
                  )
                )
              ) {
                iniciarConsultaEstado(
                  datos
                );
              }
            } catch (err) {
              console.error(
                "No se pudo consultar trabajo existente:",
                err
              );
            }
          }
        } catch (err) {
          console.error(
            "Error preparando confirmación:",
            err
          );

          if (activo) {
            setError(
              "No pudimos preparar tu publicación."
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

      cargar();

      return () => {
        activo =
          false;

        detenerConsultaEstado();
      };
    },

    [
      navigate,
    ]
  );


  /*
    ------------------------------------------------------
    PREVIEWS LOCALES
    ------------------------------------------------------
  */

  const fotosConUrl =
    useMemo(
      () => {
        const fotos =
          Array.isArray(
            borrador?.fotos
          )
            ? borrador.fotos
            : [];

        return fotos.map(
          (
            foto
          ) => ({
            ...foto,

            url:
              foto?.archivo
                ? URL.createObjectURL(
                    foto.archivo
                  )
                : "",
          })
        );
      },

      [
        borrador,
      ]
    );


  useEffect(
    () => {
      return () => {
        fotosConUrl.forEach(
          (
            foto
          ) => {
            if (
              foto.url
            ) {
              URL.revokeObjectURL(
                foto.url
              );
            }
          }
        );
      };
    },

    [
      fotosConUrl,
    ]
  );


  /*
    ------------------------------------------------------
    DATOS VISUALES
    ------------------------------------------------------
  */

  const esPrecioFijo =
    borrador?.modalidad ===
    "PRECIO_FIJO";

  const ubicacionVisible =
    [
      borrador?.localidad,
      borrador?.barrio,
    ]
      .filter(
        Boolean
      )
      .join(
        " - "
      );


  /*
    ------------------------------------------------------
    PUBLICAR

    Este botón YA NO publica en el navegador.

    Hace:
    1. verifica usuario;
    2. reclama borrador temporal;
    3. crea/obtiene job idempotente;
    4. empieza a consultar servidor.
    ------------------------------------------------------
  */

  async function publicar() {
    if (
      publicando ||
      publicacionCreada ||
      !borrador
    ) {
      return;
    }

    prepararSonidoPublicacion();

    try {
      setPublicando(
        true
      );

      setError(
        ""
      );

      setMostrarAcceso(
        false
      );

      const usuario =
        await obtenerUsuarioActual();

      if (!usuario) {
        setMostrarAcceso(
          true
        );

        setPublicando(
          false
        );

        return;
      }

      /*
        Asocia al usuario el borrador
        que pudo haberse iniciado sin cuenta.
      */

      await reclamarBorradorPublicacionTemporal(
        borrador
      );

      /*
        Idempotente:
        mismo borradorId = mismo job.
      */

      const nuevoTrabajo =
        await crearOObtenerTrabajo(
          borrador
        );

      if (
        !nuevoTrabajo?.id
      ) {
        throw new Error(
          "No pudimos crear el trabajo de publicación."
        );
      }

      setTrabajo(
        nuevoTrabajo
      );

      if (
        nuevoTrabajo.estado ===
          "PUBLICADA" &&
        nuevoTrabajo
          .publicacion_id
      ) {
        await finalizarPublicacion(
          nuevoTrabajo,
          borrador
        );

        return;
      }

      setPublicando(
        true
      );

      iniciarConsultaEstado(
        borrador
      );

      /*
        Primera actualización inmediata,
        sin esperar 2,5 segundos.
      */

      await refrescarTrabajo(
        borrador
      );
    } catch (err) {
      console.error(
        "Error iniciando publicación robusta:",
        err
      );

      setError(
        err?.message ||
        "No pudimos iniciar la publicación. Tu borrador sigue guardado."
      );

      setPublicando(
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
    cargando
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
    PUBLICADA
    ======================================================
  */

  if (
    publicacionCreada
  ) {
    return (
      <>
        <style>{`
          .sv-publicada-card {
            margin-top: 12px;
            padding: 27px 20px;
            border: 1px solid #d9e7d8;
            border-radius: 20px;
            background: #f5faf4;
            text-align: center;
          }

          .sv-publicada-icono {
            width: 68px;
            height: 68px;
            display: grid;
            place-items: center;
            margin: 0 auto 16px;
            border-radius: 50%;
            background: var(--sv-petroleo);
            color: #fff;
            font-size: 31px;
            font-weight: 900;
            box-shadow:
              0 8px 20px
              rgba(7, 87, 83, 0.18);
          }

          .sv-publicada-card h2 {
            margin: 0 0 8px;
            color: var(--sv-petroleo);
            font-size: 24px;
            line-height: 1.1;
          }

          .sv-publicada-card p {
            margin: 0;
            color: #5c5752;
            font-size: 13.5px;
            line-height: 1.45;
          }

          .sv-publicada-numero {
            margin-top: 13px;
            color: var(--sv-petroleo);
            font-size: 12px;
            font-weight: 800;
          }

          .sv-publicada-principal,
          .sv-publicada-secundario {
            width: 100%;
            min-height: 50px;
            margin-top: 13px;
            border-radius: 16px;
            font: inherit;
            font-size: 14px;
            font-weight: 850;
            cursor: pointer;
          }

          .sv-publicada-principal {
            border: 0;
            background: var(--sv-mostaza);
            color: #fff;
            box-shadow:
              0 8px 18px
              rgba(239, 169, 0, 0.2);
          }

          .sv-publicada-secundario {
            border: 1px solid var(--sv-petroleo);
            background: #fff;
            color: var(--sv-petroleo);
          }
        `}</style>

        <PantallaOperativa
          titulo="¡Ya está publicada!"
          subtitulo="Tu objeto ya empezó a circular."
          mostrarVolver={false}
        >
          <section className="sv-publicada-card">
            <div className="sv-publicada-icono">
              ✓
            </div>

            <h2>
              Publicación lista
            </h2>

            <p>
              <strong>
                {
                  publicacionCreada
                    .titulo
                }
              </strong>{" "}
              ya está disponible en Nos Sirve.
            </p>

            <div className="sv-publicada-numero">
              Publicación #
              {
                publicacionCreada
                  .numero
              }
            </div>
          </section>

          <button
            type="button"
            className="sv-publicada-principal"
            onClick={() =>
              navigate(
                `/publicacion/${publicacionCreada.numero}`,
                {
                  replace:
                    true,
                }
              )
            }
          >
            Ver mi publicación
          </button>

          <button
            type="button"
            className="sv-publicada-secundario"
            onClick={() =>
              navigate(
                "/",
                {
                  replace:
                    true,
                }
              )
            }
          >
            Ir al inicio
          </button>
        </PantallaOperativa>
      </>
    );
  }


  if (
    !borrador
  ) {
    return null;
  }


  /*
    ======================================================
    PANTALLA NORMAL
    ======================================================
  */

  return (
    <>
      <style>{`
        .sv-confirmar-aviso {
          margin: 0 0 14px;
          padding: 11px 13px;
          border: 1px solid #d9e7d8;
          border-radius: 14px;
          background: #f5faf4;
          color: var(--sv-petroleo);
          text-align: center;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sv-confirmar-fotos {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          margin-bottom: 14px;
        }

        .sv-confirmar-foto {
          aspect-ratio: 1;
          overflow: hidden;
          border: 1px solid var(--sv-borde);
          border-radius: 11px;
          background: #f3eee7;
        }

        .sv-confirmar-foto img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .sv-confirmar-card {
          padding: 17px;
          border: 1px solid var(--sv-borde);
          border-radius: 18px;
          background: #fff;
        }

        .sv-confirmar-categoria {
          display: inline-block;
          margin-bottom: 8px;
          padding: 5px 9px;
          border-radius: 999px;
          background: #eef5ed;
          color: var(--sv-petroleo);
          font-size: 11px;
          font-weight: 800;
        }

        .sv-confirmar-titulo {
          margin: 0 0 9px;
          color: var(--sv-petroleo);
          font-size: 20px;
          line-height: 1.2;
          font-weight: 850;
        }

        .sv-confirmar-descripcion {
          margin: 0 0 14px;
          color: #514e49;
          font-size: 13px;
          line-height: 1.45;
        }

        .sv-confirmar-separador {
          height: 1px;
          margin: 13px 0;
          background: #eee7df;
        }

        .sv-confirmar-venta {
          color: var(--sv-mostaza);
          font-size: 17px;
          font-weight: 850;
        }

        .sv-confirmar-dato {
          margin-top: 6px;
          color: #5d5853;
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sv-confirmar-dato strong {
          color: var(--sv-petroleo);
        }

        .sv-confirmar-entregas {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .sv-confirmar-entrega {
          padding: 5px 8px;
          border-radius: 999px;
          background: #f2f6f1;
          color: var(--sv-petroleo);
          font-size: 11px;
          font-weight: 750;
        }

        .sv-confirmar-editar {
          width: 100%;
          min-height: 42px;
          margin-top: 12px;
          border: 1px solid var(--sv-petroleo);
          border-radius: 13px;
          background: #fff;
          color: var(--sv-petroleo);
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-confirmar-principal {
          width: 100%;
          min-height: 54px;
          margin-top: 15px;
          border: 0;
          border-radius: 17px;
          background: var(--sv-mostaza);
          color: #fff;
          font: inherit;
          font-size: 16px;
          font-weight: 850;
          cursor: pointer;
          box-shadow:
            0 8px 18px
            rgba(239, 169, 0, 0.2);
        }

        .sv-confirmar-principal:disabled {
          opacity: 0.58;
          cursor: wait;
          box-shadow: none;
        }

        .sv-confirmar-publicando {
          margin-top: 11px;
          padding: 12px 13px;
          border: 1px solid #d9e7d8;
          border-radius: 13px;
          background: #f5faf4;
          color: #655f59;
          text-align: center;
          font-size: 11.5px;
          line-height: 1.4;
        }

        .sv-confirmar-publicando strong {
          display: block;
          margin-bottom: 4px;
          color: var(--sv-petroleo);
          font-size: 12.5px;
        }

        .sv-confirmar-publicando-punto {
          display: inline-block;
          width: 7px;
          height: 7px;
          margin-right: 6px;
          border-radius: 50%;
          background: var(--sv-mostaza);
          vertical-align: 1px;
          animation:
            sv-publicando-pulso
            1.15s
            ease-in-out
            infinite;
        }

        @keyframes sv-publicando-pulso {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.86);
          }

          50% {
            opacity: 1;
            transform: scale(1.18);
          }
        }

        .sv-confirmar-seguir {
          width: 100%;
          min-height: 46px;
          margin-top: 9px;
          border: 1px solid var(--sv-petroleo);
          border-radius: 14px;
          background: #fff;
          color: var(--sv-petroleo);
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
        }

        .sv-confirmar-acceso {
          margin-top: 14px;
          padding: 15px;
          border: 1px solid #d9e6d8;
          border-radius: 17px;
          background: #f7fbf6;
          text-align: center;
        }

        .sv-confirmar-acceso h2 {
          margin: 0 0 5px;
          color: var(--sv-petroleo);
          font-size: 18px;
        }

        .sv-confirmar-acceso p {
          margin: 0 0 12px;
          color: #625d57;
          font-size: 12px;
          line-height: 1.4;
        }

        .sv-confirmar-acceso-botones {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 8px;
        }

        .sv-confirmar-acceso-boton {
          min-height: 43px;
          border-radius: 13px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-confirmar-acceso-boton.crear {
          border: 0;
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-confirmar-acceso-boton.ingresar {
          border: 1px solid var(--sv-petroleo);
          background: #fff;
          color: var(--sv-petroleo);
        }

        .sv-confirmar-error {
          margin-top: 12px;
          padding: 10px 12px;
          border: 1px solid #efcabb;
          border-radius: 13px;
          background: #fff3ee;
          color: #a84422;
          text-align: center;
          font-size: 12px;
          line-height: 1.4;
        }
      `}</style>

      <PantallaOperativa
        titulo="Así va a quedar"
        subtitulo="Revisala una última vez. Si está todo bien, ya podés publicarla."
      >
        <div className="sv-confirmar-aviso">
          ✦ Nada se publica hasta que vos lo confirmes.
        </div>

        {fotosConUrl.length >
          0 && (
          <div className="sv-confirmar-fotos">
            {fotosConUrl.map(
              (
                foto,
                indice
              ) => (
                <div
                  key={
                    foto.id ||
                    indice
                  }
                  className="sv-confirmar-foto"
                >
                  {foto.url && (
                    <img
                      src={
                        foto.url
                      }
                      alt={`Foto ${
                        indice +
                        1
                      }`}
                    />
                  )}
                </div>
              )
            )}
          </div>
        )}

        <article className="sv-confirmar-card">
          {borrador.categoria && (
            <span className="sv-confirmar-categoria">
              {
                borrador.categoria
              }
            </span>
          )}

          <h2 className="sv-confirmar-titulo">
            {
              borrador.titulo
            }
          </h2>

          <p className="sv-confirmar-descripcion">
            {
              borrador.descripcion
            }
          </p>

          <div className="sv-confirmar-separador" />

          <div className="sv-confirmar-venta">
            {esPrecioFijo
              ? `Quiero $${formatearDinero(
                  borrador.precio
                )}`
              : "Recibo propuestas"}
          </div>

          {!esPrecioFijo && (
            <div className="sv-confirmar-dato">
              Valor inicial:{" "}

              <strong>
                $
                {formatearDinero(
                  borrador
                    .valorInicial
                )}
              </strong>

              {borrador.fechaCierre && (
                <>
                  <br />

                  Hasta:{" "}

                  <strong>
                    {formatearFecha(
                      borrador
                        .fechaCierre
                    )}

                    {borrador
                      .horaCierre
                      ? ` · ${borrador.horaCierre} h`
                      : ""}
                  </strong>
                </>
              )}
            </div>
          )}

          <div className="sv-confirmar-separador" />

          <div className="sv-confirmar-dato">
            <strong>
              Ubicación:
            </strong>{" "}

            {
              ubicacionVisible
            }
          </div>

          <div className="sv-confirmar-entregas">
            {borrador
              .formasEntrega
              .map(
                (
                  forma
                ) => (
                  <span
                    key={
                      forma
                    }
                    className="sv-confirmar-entrega"
                  >
                    {textoEntrega(
                      forma
                    )}
                  </span>
                )
              )}
          </div>

          <button
            type="button"
            className="sv-confirmar-editar"
            disabled={
              publicando
            }
            onClick={() =>
              navigate(
                "/publicar/revision"
              )
            }
          >
            Modificar publicación
          </button>

          <button
            type="button"
            className="sv-confirmar-editar"
            disabled={
              publicando
            }
            onClick={() =>
              navigate(
                "/publicar/ubicacion"
              )
            }
          >
            Modificar ubicación o entrega
          </button>
        </article>

        <button
          type="button"
          className="sv-confirmar-principal"
          disabled={
            publicando
          }
          onClick={
            publicar
          }
        >
          {publicando
            ? "Preparando..."
            : "Publicar"}
        </button>

        {publicando && (
          <>
            <div className="sv-confirmar-publicando">
              <strong>
                <span className="sv-confirmar-publicando-punto" />

                {trabajo?.estado ===
                "PROCESANDO"
                  ? "Estamos preparando tu publicación"
                  : "Tu publicación está en la cola"}
              </strong>

              El trabajo ya quedó guardado en el servidor. Podés seguir usando Nos Sirve sin volver a tocar Publicar.
            </div>

            <button
              type="button"
              className="sv-confirmar-seguir"
              onClick={() =>
                navigate(
                  "/"
                )
              }
            >
              Seguir usando Nos Sirve
            </button>
          </>
        )}

        {mostrarAcceso && (
          <section className="sv-confirmar-acceso">
            <h2>
              Ya casi está
            </h2>

            <p>
              Para publicar necesitamos asociar esta publicación a tu cuenta.
              Todo lo que hiciste queda guardado.
            </p>

            <div className="sv-confirmar-acceso-botones">
              <button
                type="button"
                className="sv-confirmar-acceso-boton crear"
                onClick={() =>
                  navigate(
                    "/registro",
                    {
                      state: {
                        volverA:
                          "/publicar/confirmar",
                      },
                    }
                  )
                }
              >
                Crear cuenta
              </button>

              <button
                type="button"
                className="sv-confirmar-acceso-boton ingresar"
                onClick={() =>
                  navigate(
                    "/ingresar",
                    {
                      state: {
                        volverA:
                          "/publicar/confirmar",
                      },
                    }
                  )
                }
              >
                Ingresar
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="sv-confirmar-error">
            {error}
          </div>
        )}
      </PantallaOperativa>
    </>
  );
}


export default PublicarConfirmar;