import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PantallaNosSirve from "../components/PantallaNosSirve";
import { supabase } from "../lib/supabase";

import "../App.css";

function obtenerImagen(propuesta) {
  if (
    Array.isArray(propuesta.imagenes) &&
    propuesta.imagenes.length > 0
  ) {
    return propuesta.imagenes[0];
  }

  return propuesta.imagen || "";
}

function formatearDinero(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function formatearFechaHora(fecha) {
  if (!fecha) {
    return "";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "";
  }

  return valor.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function obtenerMensajeEstado(propuesta) {
  const estaActiva =
    propuesta.estado === "ACTIVO";

  const miMonto =
    Number(propuesta.mi_monto || 0);

  const mayorImporte =
    Number(propuesta.mejor_monto || 0);

  const esMayorImporte =
    miMonto >= mayorImporte;

  if (estaActiva) {
    if (esMayorImporte) {
      return {
        texto:
          "Actualmente, tu propuesta es la de mayor importe.",
        fondo: "#e7f4f0",
        color: "#0d605b",
      };
    }

    return {
      texto: "Tu propuesta sigue activa.",
      fondo: "#f7f3ed",
      color: "#626c6d",
    };
  }

  const estadoDecision =
    propuesta.estado_decision || null;

  const propuestaElegidaId =
    propuesta.propuesta_elegida_id || null;

  const estadoConfirmacion =
    propuesta.estado_confirmacion_comprador ||
    null;

  const estadoResultado =
    propuesta.estado_resultado || null;

  const fueElegida =
    propuestaElegidaId &&
    Number(propuestaElegidaId) ===
      Number(propuesta.propuesta_id);

  if (
    estadoResultado ===
    "RECHAZADA_COMPRADOR"
  ) {
    return {
      texto:
        "Rechazaste el acuerdo. La publicación quedó cerrada sin acuerdo.",
      fondo: "#fff4e8",
      color: "#8a5b21",
    };
  }

  if (
    estadoDecision === "ACEPTADA" &&
    fueElegida &&
    estadoConfirmacion === "PENDIENTE"
  ) {
    return {
      texto:
        "Tu propuesta fue elegida. Falta que confirmes si seguís adelante con el acuerdo.",
      fondo: "#e7f4f0",
      color: "#0d605b",
    };
  }

  if (
    estadoDecision === "ACEPTADA" &&
    fueElegida &&
    estadoConfirmacion === "CONFIRMADA"
  ) {
    return {
      texto:
        "Tu propuesta fue elegida y el acuerdo fue confirmado.",
      fondo: "#e7f4f0",
      color: "#0d605b",
    };
  }

  if (
    estadoDecision === "ACEPTADA" &&
    !fueElegida
  ) {
    return {
      texto:
        "Quien publicó eligió otra propuesta.",
      fondo: "#f7f3ed",
      color: "#626c6d",
    };
  }

  if (
    estadoDecision === "PENDIENTE"
  ) {
    return {
      texto:
        "La recepción de propuestas terminó. Quien publicó todavía está tomando una decisión.",
      fondo: "#fffaf0",
      color: "#675f4d",
    };
  }

  if (
    estadoDecision === "SIN_ACUERDO"
  ) {
    return {
      texto:
        "La publicación quedó cerrada sin acuerdo.",
      fondo: "#f7f3ed",
      color: "#626c6d",
    };
  }

  return {
    texto:
      "La recepción de propuestas terminó.",
    fondo: "#f7f3ed",
    color: "#626c6d",
  };
}

function MisPropuestas() {
  const navigate = useNavigate();

  const [propuestas, setPropuestas] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [pestana, setPestana] =
    useState("ACTIVAS");

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);

        const {
          data: { user },
          error: errorUsuario,
        } = await supabase.auth.getUser();

        if (
          errorUsuario ||
          !user?.id
        ) {
          navigate("/ingresar");
          return;
        }

        const {
          data,
          error,
        } = await supabase.rpc(
          "obtener_mis_propuestas"
        );

        if (error) {
          throw error;
        }

        const propuestasBase =
          data || [];

        if (
          propuestasBase.length === 0
        ) {
          setPropuestas([]);
          return;
        }

        const publicacionesIds = [
          ...new Set(
            propuestasBase
              .map(
                (propuesta) =>
                  propuesta.publicacion_id
              )
              .filter(Boolean)
          ),
        ];

        const propuestasIds = [
          ...new Set(
            propuestasBase
              .map(
                (propuesta) =>
                  propuesta.propuesta_id
              )
              .filter(Boolean)
          ),
        ];

        const [
          resultadoPublicaciones,
          resultadoPropuestas,
        ] = await Promise.all([
          supabase
            .from("publicaciones")
            .select(`
              id,
              estado_decision,
              propuesta_elegida_id,
              estado_confirmacion_comprador
            `)
            .in(
              "id",
              publicacionesIds
            ),

          supabase
            .from("propuestas")
            .select(`
              id,
              estado_resultado
            `)
            .in(
              "id",
              propuestasIds
            ),
        ]);

        if (
          resultadoPublicaciones.error
        ) {
          console.error(
            "Error al cargar estados de publicaciones:",
            resultadoPublicaciones.error
          );
        }

        if (
          resultadoPropuestas.error
        ) {
          console.error(
            "Error al cargar estados de propuestas:",
            resultadoPropuestas.error
          );
        }

        const publicacionesPorId =
          new Map(
            (
              resultadoPublicaciones.data ||
              []
            ).map(
              (publicacion) => [
                Number(
                  publicacion.id
                ),
                publicacion,
              ]
            )
          );

        const propuestasPorId =
          new Map(
            (
              resultadoPropuestas.data ||
              []
            ).map(
              (propuesta) => [
                Number(
                  propuesta.id
                ),
                propuesta,
              ]
            )
          );

        const completas =
          propuestasBase.map(
            (propuesta) => {
              const datosPublicacion =
                publicacionesPorId.get(
                  Number(
                    propuesta.publicacion_id
                  )
                ) || {};

              const datosPropuesta =
                propuestasPorId.get(
                  Number(
                    propuesta.propuesta_id
                  )
                ) || {};

              return {
                ...propuesta,
                ...datosPublicacion,
                estado_resultado:
                  datosPropuesta.estado_resultado ||
                  null,
              };
            }
          );

        setPropuestas(
          completas
        );
      } catch (error) {
        console.error(
          "Error al cargar Mis propuestas:",
          error
        );

        setPropuestas([]);
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [navigate]);

  const activas = useMemo(
    () =>
      propuestas.filter(
        (propuesta) =>
          propuesta.estado === "ACTIVO"
      ),
    [propuestas]
  );

  const cerradas = useMemo(
    () =>
      propuestas.filter(
        (propuesta) =>
          propuesta.estado !== "ACTIVO"
      ),
    [propuestas]
  );

  const visibles =
    pestana === "ACTIVAS"
      ? activas
      : cerradas;

  return (
    <PantallaNosSirve
      titulo="Mis propuestas"
      subtitulo="Seguí desde acá las propuestas que hiciste."
      mostrarVolver
    >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            background: "#eee8df",
            borderRadius: "15px",
            padding: "4px",
            marginBottom: "22px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setPestana("ACTIVAS")
            }
            style={{
              minHeight: "46px",
              border: "none",
              borderRadius: "12px",
              background:
                pestana === "ACTIVAS"
                  ? "#075e59"
                  : "transparent",
              color:
                pestana === "ACTIVAS"
                  ? "#ffffff"
                  : "#586263",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Activas · {activas.length}
          </button>

          <button
            type="button"
            onClick={() =>
              setPestana("CERRADAS")
            }
            style={{
              minHeight: "46px",
              border: "none",
              borderRadius: "12px",
              background:
                pestana === "CERRADAS"
                  ? "#075e59"
                  : "transparent",
              color:
                pestana === "CERRADAS"
                  ? "#ffffff"
                  : "#586263",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cerradas · {cerradas.length}
          </button>
        </div>

        {cargando ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 10px",
              color: "#6d7475",
            }}
          >
            Cargando tus propuestas...
          </div>
        ) : visibles.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border:
                "1px solid #e4dacd",
              borderRadius: "20px",
              padding: "28px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "30px",
                marginBottom: "10px",
              }}
            >
              ✨
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                color: "#123f3b",
                fontSize: "20px",
              }}
            >
              {pestana === "ACTIVAS"
                ? "Todavía no tenés propuestas activas"
                : "Todavía no tenés propuestas cerradas"}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#687172",
                lineHeight: 1.5,
                fontSize: "14px",
              }}
            >
              Cuando hagas una propuesta con tu cuenta,
              aparecerá acá.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {visibles.map(
              (propuesta) => {
                const imagen =
                  obtenerImagen(
                    propuesta
                  );

                const miMonto =
                  Number(
                    propuesta.mi_monto ||
                      0
                  );

                const mayorImporte =
                  Number(
                    propuesta.mejor_monto ||
                      0
                  );

                const estadoVisual =
                  obtenerMensajeEstado(
                    propuesta
                  );

                return (
                  <article
                    key={
                      propuesta.propuesta_id
                    }
                    style={{
                      background:
                        "#ffffff",
                      border:
                        "1px solid #e3d8ca",
                      borderRadius:
                        "20px",
                      overflow:
                        "hidden",
                      boxShadow:
                        "0 6px 18px rgba(23,79,74,0.05)",
                    }}
                  >
                    {imagen && (
                      <div
                        style={{
                          width:
                            "100%",
                          height:
                            "180px",
                          background:
                            "#f7f4ef",
                        }}
                      >
                        <img
                          src={imagen}
                          alt={
                            propuesta.titulo
                          }
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            objectFit:
                              "contain",
                            display:
                              "block",
                          }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        padding:
                          "17px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap:
                            "10px",
                          marginBottom:
                            "8px",
                        }}
                      >
                        <span
                          style={{
                            color:
                              "#0d605b",
                            fontSize:
                              "13px",
                            fontWeight:
                              750,
                          }}
                        >
                          #
                          {
                            propuesta.numero
                          }
                        </span>

                        <span
                          style={{
                            borderRadius:
                              "999px",
                            padding:
                              "6px 10px",
                            fontSize:
                              "12px",
                            fontWeight:
                              700,
                            background:
                              propuesta.estado ===
                              "ACTIVO"
                                ? "#e5f3ef"
                                : "#f0ece6",
                            color:
                              propuesta.estado ===
                              "ACTIVO"
                                ? "#0d605b"
                                : "#6a625c",
                          }}
                        >
                          {propuesta.estado ===
                          "ACTIVO"
                            ? "Activa"
                            : "Cerrada"}
                        </span>
                      </div>

                      <h2
                        style={{
                          margin:
                            "0 0 14px",
                          color:
                            "#123f3b",
                          fontSize:
                            "21px",
                          lineHeight:
                            1.2,
                        }}
                      >
                        {
                          propuesta.titulo
                        }
                      </h2>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap:
                            "9px",
                          marginBottom:
                            "10px",
                        }}
                      >
                        <div
                          style={{
                            background:
                              "#f7f3ed",
                            borderRadius:
                              "14px",
                            padding:
                              "13px",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#77716b",
                              fontSize:
                                "12px",
                              marginBottom:
                                "4px",
                            }}
                          >
                            Tu última propuesta
                          </div>

                          <strong
                            style={{
                              color:
                                "#0d5551",
                              fontSize:
                                "20px",
                            }}
                          >
                            {formatearDinero(
                              miMonto
                            )}
                          </strong>
                        </div>

                        <div
                          style={{
                            background:
                              "#f7f3ed",
                            borderRadius:
                              "14px",
                            padding:
                              "13px",
                          }}
                        >
                          <div
                            style={{
                              color:
                                "#77716b",
                              fontSize:
                                "12px",
                              marginBottom:
                                "4px",
                            }}
                          >
                            Mayor importe propuesto
                          </div>

                          <strong
                            style={{
                              color:
                                "#0d5551",
                              fontSize:
                                "20px",
                            }}
                          >
                            {formatearDinero(
                              mayorImporte
                            )}
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          padding:
                            "12px 14px",
                          borderRadius:
                            "13px",
                          marginBottom:
                            "8px",
                          background:
                            estadoVisual.fondo,
                          color:
                            estadoVisual.color,
                          fontSize:
                            "14px",
                          fontWeight:
                            700,
                          lineHeight:
                            1.4,
                        }}
                      >
                        {
                          estadoVisual.texto
                        }
                      </div>

                      <p
                        style={{
                          margin:
                            "0 0 14px",
                          color:
                            "#747b7b",
                          fontSize:
                            "12px",
                          lineHeight:
                            1.45,
                        }}
                      >
                        El importe es solo uno de los criterios posibles y la elección final depende de quien publicó.
                      </p>

                      {propuesta.fecha && (
                        <div
                          style={{
                            marginBottom:
                              "14px",
                            color:
                              "#7a8181",
                            fontSize:
                              "12px",
                          }}
                        >
                          Última propuesta:{" "}
                          {formatearFechaHora(
                            propuesta.fecha
                          )}
                        </div>
                      )}

                      <Link
                        to={`/publicacion/${propuesta.numero}?desde=mis-propuestas`}
                        style={{
                          minHeight:
                            "48px",
                          width:
                            "100%",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          borderRadius:
                            "14px",
                          background:
                            "#075e59",
                          color:
                            "#ffffff",
                          textDecoration:
                            "none",
                          fontWeight:
                            700,
                          fontSize:
                            "15px",
                          textAlign:
                            "center",
                          padding:
                            "0 12px",
                          boxSizing:
                            "border-box",
                        }}
                      >
                        {propuesta.estado ===
                        "ACTIVO"
                          ? "Ver publicación y proponer nuevamente"
                          : "Ver publicación"}
                      </Link>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

        <div
          style={{
            marginTop: "26px",
            textAlign: "center",
          }}
        >
          <Link
            to="/mi-cuenta"
            style={{
              color: "#0d605b",
              textDecoration:
                "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            ← Volver a Mi cuenta
          </Link>
        </div>
    </PantallaNosSirve>
  );
}

export default MisPropuestas;