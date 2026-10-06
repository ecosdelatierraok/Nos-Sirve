import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import CabeceraNosSirve from "../components/CabeceraNosSirve";

import { supabase } from "../lib/supabase";

import "../App.css";


function claveDia(fecha) {
  const valor =
    new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "";
  }

  return valor.toLocaleDateString(
    "en-CA",
    {
      timeZone:
        "America/Argentina/Cordoba",
    }
  );
}

function etiquetaDia(fecha) {
  const valor =
    new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "";
  }

  const hoy =
    new Date();

  const ayer =
    new Date();

  ayer.setDate(
    hoy.getDate() - 1
  );

  const clave =
    claveDia(valor);

  if (
    clave ===
    claveDia(hoy)
  ) {
    return "Hoy";
  }

  if (
    clave ===
    claveDia(ayer)
  ) {
    return "Ayer";
  }

  return valor.toLocaleDateString(
    "es-AR",
    {
      timeZone:
        "America/Argentina/Cordoba",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function ordenarNotificaciones(
  lista
) {
  return [...lista].sort(
    (a, b) => {
      const diaA =
        claveDia(
          a.created_at
        );

      const diaB =
        claveDia(
          b.created_at
        );

      if (
        diaA !== diaB
      ) {
        return diaA < diaB
          ? 1
          : -1;
      }

      if (
        Boolean(a.leida) !==
        Boolean(b.leida)
      ) {
        return a.leida
          ? 1
          : -1;
      }

      return (
        new Date(
          a.created_at ||
          0
        ).getTime() -
        new Date(
          b.created_at ||
          0
        ).getTime()
      );
    }
  );
}


function categoriaNotificacion(
  notificacion
) {
  const tipo =
    String(
      notificacion?.tipo ||
      ""
    ).toUpperCase();

  if (
    tipo ===
    "NUEVA_PREGUNTA"
  ) {
    return "preguntas";
  }

  if (
    tipo ===
    "PREGUNTA_RESPONDIDA"
  ) {
    return "respuestas";
  }

  if (
    tipo.includes(
      "VENTA"
    ) ||
    tipo.includes(
      "VENDEDOR"
    )
  ) {
    return "ventas";
  }

  if (
    tipo.includes(
      "COMPRA"
    ) ||
    tipo.includes(
      "COMPRADOR"
    )
  ) {
    return "compras";
  }

  return "otros";
}

function etiquetaTipoNotificacion(
  notificacion
) {
  const categoria =
    categoriaNotificacion(
      notificacion
    );

  if (
    categoria ===
    "preguntas"
  ) {
    return "Pregunta";
  }

  if (
    categoria ===
    "respuestas"
  ) {
    return "Respuesta";
  }

  if (
    categoria ===
    "ventas"
  ) {
    return "Venta";
  }

  if (
    categoria ===
    "compras"
  ) {
    return "Compra";
  }

  return "Mensaje";
}

function Mensajes() {
  const navigate =
    useNavigate();

  const [
    notificaciones,
    setNotificaciones,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    filtroActivo,
    setFiltroActivo,
  ] = useState("todo");

  const [
    carruselVisible,
    setCarruselVisible,
  ] = useState(false);

  const carruselFiltrosRef =
    useRef(null);

  const animacionInicialHechaRef =
    useRef(false);

  const animacionFrameRef =
    useRef(null);

  const normalizandoCarruselRef =
    useRef(false);

  const animandoCarruselRef =
    useRef(false);

  const usuarioInteractuandoCarruselRef =
    useRef(false);

  const temporizadorNormalizacionRef =
    useRef(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    let activo = true;
    let canal = null;

    async function iniciar() {
      try {
        const {
          data,
        } =
          await supabase.auth.getSession();

        const usuarioId =
          data?.session?.user?.id ||
          null;

        if (!usuarioId) {
          navigate(
            "/ingresar",
            {
              state: {
                volverA:
                  "/mensajes",
              },
            }
          );

          return;
        }

        async function cargar() {
          const {
            data:
              registros,
            error,
          } =
            await supabase
              .from(
                "notificaciones"
              )
              .select(`
                id,
                tipo,
                titulo,
                mensaje,
                publicacion_id,
                pregunta_id,
                leida,
                created_at
              `)
              .eq(
                "usuario_id",
                usuarioId
              )
              .order(
                "created_at",
                {
                  ascending: true,
                }
              );

          if (error) {
            throw error;
          }

          const lista =
            Array.isArray(
              registros
            )
              ? registros
              : [];

          const publicacionIds = [
            ...new Set(
              lista
                .map(
                  (item) =>
                    Number(
                      item.publicacion_id
                    )
                )
                .filter(
                  (valor) =>
                    Number.isFinite(
                      valor
                    )
                )
            ),
          ];

          const preguntaIds = [
            ...new Set(
              lista
                .map(
                  (item) =>
                    Number(
                      item.pregunta_id
                    )
                )
                .filter(
                  (valor) =>
                    Number.isFinite(
                      valor
                    )
                )
            ),
          ];

          let mapaPublicaciones =
            {};

          let mapaPreguntas =
            {};

          let mapaNombres =
            {};

          let mapaNombresPublicantes =
            {};

          if (
            publicacionIds.length > 0
          ) {
            const {
              data:
                publicaciones,
              error:
                errorPublicaciones,
            } =
              await supabase
                .from(
                  "publicaciones"
                )
                .select(
                  "id, numero, titulo, modalidad, creado_por"
                )
                .in(
                  "id",
                  publicacionIds
                );

            if (
              errorPublicaciones
            ) {
              throw errorPublicaciones;
            }

            mapaPublicaciones =
              Object.fromEntries(
                (
                  Array.isArray(
                    publicaciones
                  )
                    ? publicaciones
                    : []
                ).map(
                  (publicacion) => [
                    String(
                      publicacion.id
                    ),
                    publicacion,
                  ]
                )
              );

            const creadoresIds = [
              ...new Set(
                (
                  Array.isArray(
                    publicaciones
                  )
                    ? publicaciones
                    : []
                )
                  .map(
                    (publicacion) =>
                      String(
                        publicacion?.creado_por ||
                        ""
                      )
                  )
                  .filter(Boolean)
              ),
            ];

            if (
              creadoresIds.length > 0
            ) {
              const resultadosPublicantes =
                await Promise.all(
                  creadoresIds.map(
                    async (
                      creadorId
                    ) => {
                      const {
                        data:
                          nombreData,
                        error:
                          errorNombre,
                      } =
                        await supabase
                          .rpc(
                            "obtener_nombre_publicante",
                            {
                              p_usuario_id:
                                creadorId,
                            }
                          );

                      if (
                        errorNombre
                      ) {
                        console.error(
                          "No se pudo obtener nombre de publicante:",
                          errorNombre
                        );

                        return [
                          creadorId,
                          "",
                        ];
                      }

                      const registro =
                        Array.isArray(
                          nombreData
                        )
                          ? nombreData[0]
                          : nombreData;

                      return [
                        creadorId,
                        String(
                          registro?.nombre ||
                          ""
                        )
                          .trim()
                          .split(
                            /\s+/
                          )[0] ||
                        "",
                      ];
                    }
                  )
                );

              mapaNombresPublicantes =
                Object.fromEntries(
                  resultadosPublicantes
                );
            }
          }

          if (
            preguntaIds.length > 0
          ) {
            const {
              data:
                preguntas,
              error:
                errorPreguntas,
            } =
              await supabase
                .from(
                  "preguntas_publicacion"
                )
                .select(
                  "id, publicacion_id, pregunta"
                )
                .in(
                  "id",
                  preguntaIds
                );

            if (
              errorPreguntas
            ) {
              throw errorPreguntas;
            }

            mapaPreguntas =
              Object.fromEntries(
                (
                  Array.isArray(
                    preguntas
                  )
                    ? preguntas
                    : []
                ).map(
                  (pregunta) => [
                    String(
                      pregunta.id
                    ),
                    pregunta,
                  ]
                )
              );

            const idsPublicacionesConPregunta = [
              ...new Set(
                Object.values(
                  mapaPreguntas
                )
                  .map(
                    (pregunta) =>
                      Number(
                        pregunta
                          ?.publicacion_id
                      )
                  )
                  .filter(
                    (valor) =>
                      Number.isFinite(
                        valor
                      )
                  )
              ),
            ];

            if (
              idsPublicacionesConPregunta.length >
              0
            ) {
              const resultados =
                await Promise.all(
                  idsPublicacionesConPregunta.map(
                    async (
                      publicacionId
                    ) => {
                      const {
                        data:
                          nombres,
                        error:
                          errorNombres,
                      } =
                        await supabase
                          .rpc(
                            "obtener_nombres_preguntantes_publicacion",
                            {
                              p_publicacion_id:
                                publicacionId,
                            }
                          );

                      if (
                        errorNombres
                      ) {
                        console.error(
                          "No se pudieron cargar nombres públicos:",
                          errorNombres
                        );

                        return [];
                      }

                      return Array.isArray(
                        nombres
                      )
                        ? nombres
                        : [];
                    }
                  )
                );

              mapaNombres =
                Object.fromEntries(
                  resultados
                    .flat()
                    .map(
                      (registro) => [
                        String(
                          registro
                            ?.pregunta_id
                        ),
                        String(
                          registro
                            ?.nombre ||
                          ""
                        )
                          .trim()
                          .split(
                            /\s+/
                          )[0] ||
                        "",
                      ]
                    )
                );
            }
          }

          const enriquecidas =
            lista
              .map(
                (notificacion) => {
                  const pregunta =
                    mapaPreguntas[
                      String(
                        notificacion.pregunta_id
                      )
                    ] ||
                    null;

                  return {
                    ...notificacion,

                    publicacion:
                      mapaPublicaciones[
                        String(
                          notificacion.publicacion_id
                        )
                      ] ||
                      null,

                    preguntaTexto:
                      String(
                        pregunta?.pregunta ||
                        ""
                      ).trim(),

                    nombrePregunta:
                      String(
                        mapaNombres[
                          String(
                            notificacion.pregunta_id
                          )
                        ] ||
                        ""
                      )
                        .trim()
                        .split(/\s+/)[0] ||
                      "",

                    nombrePublicante:
                      String(
                        mapaNombresPublicantes[
                          String(
                            mapaPublicaciones[
                              String(
                                notificacion.publicacion_id
                              )
                            ]?.creado_por ||
                            ""
                          )
                        ] ||
                        ""
                      )
                        .trim()
                        .split(/\s+/)[0] ||
                      "",
                  };
                }
              )
              ;

          if (activo) {
            setNotificaciones(
              ordenarNotificaciones(
                enriquecidas
              )
            );
          }
        }

        await cargar();

        canal =
          supabase
            .channel(
              `mensajes-${usuarioId}`
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table:
                  "notificaciones",
                filter:
                  `usuario_id=eq.${usuarioId}`,
              },
              cargar
            )
            .subscribe();
      } catch (error) {
        console.error(
          "Error al cargar notificaciones:",
          error
        );
      } finally {
        if (activo) {
          setCargando(
            false
          );
        }
      }
    }

    iniciar();

    return () => {
      activo = false;

      if (canal) {
        supabase.removeChannel(
          canal
        );
      }
    };
  }, [
    navigate,
  ]);


  const notificacionesFiltradas =
    filtroActivo ===
    "todo"
      ? notificaciones
      : notificaciones.filter(
          (notificacion) =>
            categoriaNotificacion(
              notificacion
            ) ===
            filtroActivo
        );

  const filtros = [
    {
      id: "todo",
      etiqueta: "Todo",
    },
    {
      id: "preguntas",
      etiqueta: "Preguntas",
    },
    {
      id: "respuestas",
      etiqueta: "Respuestas",
    },
    {
      id: "ventas",
      etiqueta: "Ventas",
    },
    {
      id: "compras",
      etiqueta: "Compras",
    },
  ];

  const cantidadNoLeidaPorFiltro =
    Object.fromEntries(
      filtros.map(
        (filtro) => {
          const cantidad =
            notificaciones.filter(
              (notificacion) => {
                if (
                  notificacion.leida
                ) {
                  return false;
                }

                if (
                  filtro.id ===
                  "todo"
                ) {
                  return true;
                }

                return (
                  categoriaNotificacion(
                    notificacion
                  ) ===
                  filtro.id
                );
              }
            ).length;

          return [
            filtro.id,
            cantidad,
          ];
        }
      )
    );

  const filtrosCarrusel = [
    {
      id: "preguntas",
      etiqueta: "Preguntas",
    },
    {
      id: "respuestas",
      etiqueta: "Respuestas",
    },
    {
      id: "ventas",
      etiqueta: "Ventas",
    },
    {
      id: "compras",
      etiqueta: "Compras",
    },
    {
      id: "todo",
      etiqueta: "Todo",
    },
  ];

  const filtroConMasPendientes =
    filtrosCarrusel
      .filter(
        (filtro) =>
          filtro.id !==
          "todo"
      )
      .reduce(
        (
          mejor,
          filtro
        ) => {
          const indice =
            filtrosCarrusel.findIndex(
              (item) =>
                item.id ===
                filtro.id
            );

          const cantidad =
            cantidadNoLeidaPorFiltro[
              filtro.id
            ] ||
            0;

          if (
            cantidad >
            mejor.cantidad
          ) {
            return {
              id: filtro.id,
              cantidad,
              indice,
            };
          }

          return mejor;
        },
        {
          id: "preguntas",
          cantidad: -1,
          indice: 0,
        }
      );

  const COPIAS_CARRUSEL =
    7;

  const COPIA_CENTRAL =
    Math.floor(
      COPIAS_CARRUSEL / 2
    );

  const filtrosRepetidos =
    Array.from(
      {
        length:
          COPIAS_CARRUSEL,
      },
      (
        _,
        copia
      ) =>
        filtrosCarrusel.map(
          (
            filtro,
            indice
          ) => ({
            ...filtro,
            copia,
            indice,
          })
        )
    ).flat();

  function obtenerElementosCarrusel() {
    const contenedor =
      carruselFiltrosRef.current;

    if (!contenedor) {
      return [];
    }

    return Array.from(
      contenedor.querySelectorAll(
        "[data-filtro-carrusel]"
      )
    );
  }

  function obtenerDatosCarrusel() {
    const elementos =
      obtenerElementosCarrusel();

    const cantidad =
      filtrosCarrusel.length;

    if (
      cantidad === 0 ||
      elementos.length <
        cantidad *
        COPIAS_CARRUSEL
    ) {
      return null;
    }

    const inicioCentro =
      elementos[
        cantidad *
        COPIA_CENTRAL
      ]?.offsetLeft;

    const inicioSiguiente =
      elementos[
        cantidad *
        (
          COPIA_CENTRAL +
          1
        )
      ]?.offsetLeft;

    if (
      !Number.isFinite(
        inicioCentro
      ) ||
      !Number.isFinite(
        inicioSiguiente
      )
    ) {
      return null;
    }

    const anchoCiclo =
      inicioSiguiente -
      inicioCentro;

    if (
      !Number.isFinite(
        anchoCiclo
      ) ||
      anchoCiclo <= 0
    ) {
      return null;
    }

    return {
      elementos,
      cantidad,
      inicioCentro,
      inicioSiguiente,
      anchoCiclo,
    };
  }

  function cancelarAnimacionCarrusel() {
    if (
      animacionFrameRef.current
    ) {
      cancelAnimationFrame(
        animacionFrameRef.current
      );

      animacionFrameRef.current =
        null;
    }

    animandoCarruselRef.current =
      false;
  }

  function posicionFiltroEnCopia(
    filtroId,
    copia =
      COPIA_CENTRAL
  ) {
    const datos =
      obtenerDatosCarrusel();

    if (!datos) {
      return null;
    }

    const indice =
      filtrosCarrusel.findIndex(
        (item) =>
          item.id ===
          filtroId
      );

    if (indice < 0) {
      return null;
    }

    const elemento =
      datos.elementos[
        datos.cantidad *
          copia +
        indice
      ];

    return Number.isFinite(
      elemento?.offsetLeft
    )
      ? elemento.offsetLeft
      : null;
  }

  function normalizarCarrusel(
    forzar = false
  ) {
    const contenedor =
      carruselFiltrosRef.current;

    const datos =
      obtenerDatosCarrusel();

    if (
      !contenedor ||
      !datos ||
      normalizandoCarruselRef.current ||
      animandoCarruselRef.current ||
      (
        usuarioInteractuandoCarruselRef.current &&
        !forzar
      )
    ) {
      return;
    }

    const izquierda =
      contenedor.scrollLeft;

    const limiteIzquierdo =
      datos.inicioCentro -
      datos.anchoCiclo *
      1.5;

    const limiteDerecho =
      datos.inicioCentro +
      datos.anchoCiclo *
      1.5;

    let nuevaPosicion =
      izquierda;

    while (
      nuevaPosicion <
      limiteIzquierdo
    ) {
      nuevaPosicion +=
        datos.anchoCiclo;
    }

    while (
      nuevaPosicion >
      limiteDerecho
    ) {
      nuevaPosicion -=
        datos.anchoCiclo;
    }

    if (
      Math.abs(
        nuevaPosicion -
        izquierda
      ) < 1
    ) {
      return;
    }

    normalizandoCarruselRef.current =
      true;

    contenedor.scrollLeft =
      nuevaPosicion;

    requestAnimationFrame(
      () => {
        normalizandoCarruselRef.current =
          false;
      }
    );
  }

  function programarNormalizacionCarrusel() {
    if (
      temporizadorNormalizacionRef.current
    ) {
      window.clearTimeout(
        temporizadorNormalizacionRef.current
      );
    }

    temporizadorNormalizacionRef.current =
      window.setTimeout(
        () => {
          usuarioInteractuandoCarruselRef.current =
            false;

          normalizarCarrusel(
            true
          );
        },
        120
      );
  }

  function manejarInicioInteraccionCarrusel() {
    usuarioInteractuandoCarruselRef.current =
      true;

    cancelarAnimacionCarrusel();
  }

  function manejarScrollCarrusel() {
    if (
      animandoCarruselRef.current
    ) {
      return;
    }

    programarNormalizacionCarrusel();
  }

  function animarCarruselHasta(
    destino,
    duracion = 1500
  ) {
    const contenedor =
      carruselFiltrosRef.current;

    if (
      !contenedor ||
      !Number.isFinite(
        destino
      )
    ) {
      return;
    }

    cancelarAnimacionCarrusel();

    const desde =
      contenedor.scrollLeft;

    const distancia =
      destino -
      desde;

    const comienzo =
      performance.now();

    animandoCarruselRef.current =
      true;

    const easeInOutQuint =
      (t) =>
        t < 0.5
          ? 16 *
            t *
            t *
            t *
            t *
            t
          : 1 -
            Math.pow(
              -2 * t + 2,
              5
            ) /
            2;

    function paso(ahora) {
      if (
        !animandoCarruselRef.current
      ) {
        return;
      }

      const progreso =
        Math.min(
          1,
          (
            ahora -
            comienzo
          ) /
          duracion
        );

      contenedor.scrollLeft =
        desde +
        distancia *
          easeInOutQuint(
            progreso
          );

      if (
        progreso < 1
      ) {
        animacionFrameRef.current =
          requestAnimationFrame(
            paso
          );

        return;
      }

      animacionFrameRef.current =
        null;
      animandoCarruselRef.current =
        false;
    }

    animacionFrameRef.current =
      requestAnimationFrame(
        paso
      );
  }

  

  useEffect(() => {
    if (
      cargando ||
      animacionInicialHechaRef.current
    ) {
      return undefined;
    }

    const contenedor =
      carruselFiltrosRef.current;

    const datos =
      obtenerDatosCarrusel();

    if (
      !contenedor ||
      !datos
    ) {
      return undefined;
    }

    const filtroDestino =
      filtroConMasPendientes.cantidad >
      0
        ? filtroConMasPendientes.id
        : "preguntas";

    const inicio =
      posicionFiltroEnCopia(
        "preguntas",
        COPIA_CENTRAL
      );

    const destino =
      posicionFiltroEnCopia(
        filtroDestino,
        COPIA_CENTRAL +
        1
      );

    if (
      !Number.isFinite(
        inicio
      ) ||
      !Number.isFinite(
        destino
      )
    ) {
      return undefined;
    }

    animacionInicialHechaRef.current =
      true;

    setCarruselVisible(
      false
    );

    setFiltroActivo(
      filtroDestino
    );

    contenedor.scrollLeft =
      inicio;

    let framePreparacion =
      null;

    let frameMostrar =
      null;

    const temporizadorInicio =
      window.setTimeout(
        () => {
          framePreparacion =
            requestAnimationFrame(
              () => {
                frameMostrar =
                  requestAnimationFrame(
                    () => {
                      setCarruselVisible(
                        true
                      );

                      animarCarruselHasta(
                        destino,
                        1550
                      );
                    }
                  );
              }
            );
        },
        70
      );

    return () => {
      window.clearTimeout(
        temporizadorInicio
      );

      if (
        framePreparacion
      ) {
        cancelAnimationFrame(
          framePreparacion
        );
      }

      if (
        frameMostrar
      ) {
        cancelAnimationFrame(
          frameMostrar
        );
      }

      cancelarAnimacionCarrusel();

      if (
        temporizadorNormalizacionRef.current
      ) {
        window.clearTimeout(
          temporizadorNormalizacionRef.current
        );
      }
    };
  }, [
    cargando,
    filtroConMasPendientes.id,
    filtroConMasPendientes.cantidad,
  ]);

  function moverFiltroSiempreAIzquierda(
    filtroId
  ) {
    const contenedor =
      carruselFiltrosRef.current;

    const datos =
      obtenerDatosCarrusel();

    if (
      !contenedor ||
      !datos
    ) {
      return;
    }

    cancelarAnimacionCarrusel();

    const candidatos =
      datos.elementos
        .filter(
          (elemento) =>
            elemento.getAttribute(
              "data-filtro-carrusel"
            ) ===
            filtroId
        )
        .map(
          (elemento) =>
            elemento.offsetLeft
        )
        .filter(
          (posicion) =>
            Number.isFinite(
              posicion
            )
        )
        .sort(
          (a, b) =>
            a - b
        );

    if (
      candidatos.length === 0
    ) {
      return;
    }

    const actual =
      contenedor.scrollLeft;

    let destino =
      candidatos.find(
        (posicion) =>
          posicion >
          actual + 8
      );

    if (
      !Number.isFinite(
        destino
      )
    ) {
      const nuevaBase =
        actual -
        datos.anchoCiclo;

      contenedor.scrollLeft =
        nuevaBase;

      destino =
        candidatos.find(
          (posicion) =>
            posicion >
            nuevaBase + 8
        );
    }

    if (
      !Number.isFinite(
        destino
      )
    ) {
      return;
    }

    animarCarruselHasta(
      destino,
      420
    );
  }

  function cambiarFiltro(
    filtro
  ) {
    setFiltroActivo(
      filtro
    );

    moverFiltroSiempreAIzquierda(
      filtro
    );

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }

  function nombrePersonaNotificacion(
    notificacion
  ) {
    const categoria =
      categoriaNotificacion(
        notificacion
      );

    if (
      categoria ===
      "preguntas"
    ) {
      return (
        notificacion
          ?.nombrePregunta ||
        ""
      );
    }

    if (
      categoria ===
      "respuestas" ||
      categoria ===
      "compras"
    ) {
      return (
        notificacion
          ?.nombrePublicante ||
        ""
      );
    }

    return (
      notificacion
        ?.nombreRelacionado ||
      ""
    );
  }

  async function abrirNotificacion(
    notificacion
  ) {
    try {
      if (
        !notificacion.leida
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "notificaciones"
            )
            .update({
              leida: true,
            })
            .eq(
              "id",
              notificacion.id
            );

        if (error) {
          throw error;
        }

        setNotificaciones(
          (actuales) =>
            ordenarNotificaciones(
              actuales.map(
                (item) =>
                  item.id ===
                  notificacion.id
                    ? {
                        ...item,
                        leida: true,
                      }
                    : item
              )
            )
        );
      }

      if (
        notificacion.publicacion_id
      ) {
        navigate(
          `/publicacion/id/${notificacion.publicacion_id}?pregunta=${notificacion.pregunta_id || ""}`
        );
      }
    } catch (error) {
      console.error(
        "Error al abrir notificación:",
        error
      );
    }
  }

  return (
    <>
      <style>{`
        .sv-mensajes-superior {
          position: sticky;
          top: 0;
          z-index: 180;
          margin: 0 -14px;
          padding: 0 14px 8px;
          box-sizing: border-box;
          background: rgba(253,250,247,0.98);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 21px 21px 0 0;
        }

        .sv-mensajes-header {
          text-align: center;
        }

        .sv-mensajes-logo {
          width: var(--ns-header-logo-width);
          height: var(--ns-header-logo-height);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }



        .sv-mensajes-header h1 {
          margin: -2px 0 2px;
          color: #075753;
          font-size: var(--ns-header-title-size);
          line-height: var(--ns-header-title-line-height);
          letter-spacing: var(--ns-header-title-tracking);
          font-weight: var(--ns-header-title-weight);
          text-align: center;
        }

        .sv-mensajes-filtros {
          position: relative;
          display: flex;
          gap: 8px;
          min-height: 38px;
          margin: 9px 0 0;
          padding-bottom: 2px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: none;
          touch-action: pan-x;
          scroll-behavior: auto;
          transition: opacity 120ms ease;
        }

        .sv-mensajes-filtros.oculto {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .sv-mensajes-filtros.visible {
          opacity: 1;
          visibility: visible;
        }

        .sv-mensajes-filtros::-webkit-scrollbar {
          display: none;
        }

        .sv-mensajes-filtro {
          flex: 0 0 auto;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #d8cec3;
          border-radius: 999px;
          background: #fff;
          color: #075753;
          font: inherit;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          white-space: nowrap;
        }

        .sv-mensajes-filtro.activo {
          border-color: #075753;
          background: #075753;
          color: #fff;
        }

        .sv-mensajes-filtro-contador {
          min-width: 18px;
          height: 18px;
          display: inline-grid;
          place-items: center;
          padding: 0 5px;
          box-sizing: border-box;
          border-radius: 999px;
          background: #f1ece6;
          color: #075753;
          font-size: 10px;
          font-weight: 900;
        }

        .sv-mensajes-filtro.activo
        .sv-mensajes-filtro-contador {
          background: rgba(255,255,255,0.18);
          color: #fff;
        }

        @media (min-width: 700px) {
          .sv-mensajes-logo {
            width: 268px;
            height: 90px;
          }


          .sv-mensajes-header h1 {
            font-size: 30px;
          }
        }

        .sv-mensajes-lista {
          display: grid;
          gap: 10px;
          margin-top: 5px;
        }

        .sv-mensajes-dia {
          margin: 0 2px 4px;
          color: #075753;
          font-size: 11px;
          line-height: 1.2;
          font-weight: 800;
          text-transform: none;
          letter-spacing: 0;
        }

        .sv-mensajes-dia:first-child {
          margin-top: 0;
        }

        .sv-mensaje-item {
          width: 100%;
          padding: 14px;
          box-sizing: border-box;

          border: 1px solid #eadccc;
          border-radius: 16px;

          background: #fff;

          text-align: left;
          cursor: pointer;
        }

        .sv-mensaje-item.no-leido.propuestas {
          border-color: #efa900;
        }

        .sv-mensaje-item.no-leido.quiero {
          border-color: #f15a24;
        }

        .sv-mensaje-titulo {
          margin: 0 0 5px;

          color: #075753;

          font-size: 14px;
          font-weight: 900;
        }

        .sv-mensaje-publicacion {
          margin: 0;

          color: #59514b;

          font-size: 13px;
          line-height: 1.4;
          font-weight: 800;
        }

        .sv-mensaje-pregunta-texto {
          margin: 6px 0 0;

          color: #263536;

          font-size: 12.5px;
          line-height: 1.4;
          font-weight: 700;
        }

        .sv-mensaje-pregunta-de {
          margin: 6px 0 0;

          color: #746960;

          font-size: 12px;
          line-height: 1.35;
        }

        .sv-mensaje-nuevo {
          display: inline-block;
          margin-top: 8px;

          font-size: 11px;
          font-weight: 900;
        }

        .sv-mensaje-item.propuestas
        .sv-mensaje-nuevo {
          color: #efa900;
        }

        .sv-mensaje-item.quiero
        .sv-mensaje-nuevo {
          color: #f15a24;
        }

        .sv-mensajes-vacio {
          margin-top: 28px;

          color: #746960;

          text-align: center;

          font-size: 13px;
        }
      `}</style>

      <main className="sv-pantalla-fondo">
        <section className="sv-pantalla-app">
          <CabeceraNosSirve
            titulo="Mensajes"
            extraInferior={
              <div
                ref={carruselFiltrosRef}
                className={`sv-mensajes-filtros ${
                  carruselVisible
                    ? "visible"
                    : "oculto"
                }`}
                aria-label="Filtrar mensajes"
                onPointerDown={
                  manejarInicioInteraccionCarrusel
                }
                onTouchStart={
                  manejarInicioInteraccionCarrusel
                }
                onWheel={
                  manejarInicioInteraccionCarrusel
                }
                onScroll={
                  manejarScrollCarrusel
                }
                onPointerUp={
                  programarNormalizacionCarrusel
                }
                onTouchEnd={
                  programarNormalizacionCarrusel
                }
              >
                {filtrosRepetidos.map(
                  (
                    filtro,
                    posicion
                  ) => {
                    const cantidad =
                      cantidadNoLeidaPorFiltro[
                        filtro.id
                      ] ||
                      0;

                    return (
                      <button
                        key={
                          `${filtro.copia}-${filtro.indice}-${filtro.id}-${posicion}`
                        }
                        data-filtro-carrusel={
                          filtro.id
                        }
                        type="button"
                        className={`sv-mensajes-filtro${
                          filtroActivo ===
                          filtro.id
                            ? " activo"
                            : ""
                        }`}
                        onClick={() =>
                          cambiarFiltro(
                            filtro.id
                          )
                        }
                      >
                        <span>
                          {filtro.etiqueta}
                        </span>

                        {cantidad > 0 && (
                          <span className="sv-mensajes-filtro-contador">
                            {cantidad}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            }
          />

          {cargando ? (
            <div className="sv-mensajes-vacio">
              Cargando...
            </div>
          ) : notificacionesFiltradas.length >
            0 ? (
            <div className="sv-mensajes-lista">
              {notificacionesFiltradas.map(
                (
                  notificacion,
                  indice
                ) => {
                  const diaActual =
                    claveDia(
                      notificacion.created_at
                    );

                  const diaAnterior =
                    indice > 0
                      ? claveDia(
                          notificacionesFiltradas[
                            indice - 1
                          ]?.created_at
                        )
                      : null;

                  const mostrarDia =
                    indice === 0 ||
                    diaActual !==
                      diaAnterior;
                  const modalidad =
                    notificacion
                      ?.publicacion
                      ?.modalidad;

                  const claseModalidad =
                    modalidad ===
                    "RECIBE_PROPUESTAS"
                      ? "propuestas"
                      : "quiero";

                  const numero =
                    notificacion
                      ?.publicacion
                      ?.numero;

                  const titulo =
                    notificacion
                      ?.publicacion
                      ?.titulo ||
                    "Publicación";

                  return (
                    <div
                      key={
                        notificacion.id
                      }
                    >
                      {mostrarDia && (
                        <div className="sv-mensajes-dia">
                          {
                            etiquetaDia(
                              notificacion.created_at
                            )
                          }
                        </div>
                      )}

                    <button
                      type="button"
                      className={`sv-mensaje-item ${claseModalidad}${
                        notificacion.leida
                          ? ""
                          : " no-leido"
                      }`}
                      onClick={() =>
                        abrirNotificacion(
                          notificacion
                        )
                      }
                    >
                      <div className="sv-mensaje-titulo">
                        {
                          etiquetaTipoNotificacion(
                            notificacion
                          )
                        }
                      </div>

                      <p className="sv-mensaje-publicacion">
                        {numero
                          ? `#${numero} · ${titulo}`
                          : titulo}
                      </p>

                      {notificacion.preguntaTexto && (
                        <p className="sv-mensaje-pregunta-texto">
                          {notificacion.preguntaTexto}
                        </p>
                      )}

                      {nombrePersonaNotificacion(
                        notificacion
                      ) && (
                        <p className="sv-mensaje-pregunta-de">
                          {categoriaNotificacion(
                            notificacion
                          ) ===
                          "ventas"
                            ? "Con "
                            : "De "}
                          <strong>
                            {nombrePersonaNotificacion(
                              notificacion
                            )}
                          </strong>
                        </p>
                      )}

                      {!notificacion.leida && (
                        <span className="sv-mensaje-nuevo">
                          Nuevo
                        </span>
                      )}
                    </button>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="sv-mensajes-vacio">
              {filtroActivo ===
              "todo"
                ? "No tenés mensajes por ahora."
                : "No hay mensajes en esta categoría."}
            </div>
          )}

        </section>
      </main>
    </>
  );
}

export default Mensajes;
