import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import PantallaNosSirve from "../components/PantallaNosSirve";
import { supabase } from "../lib/supabase";

import "../App.css";

function IconoUbicacion() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        flexShrink: 0,
      }}
    >
      <path
        d="M12 21C12 21 18 15.75 18 10.5C18 7.18629 15.3137 4.5 12 4.5C8.68629 4.5 6 7.18629 6 10.5C6 15.75 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10.5"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function obtenerImagen(
  publicacion
) {
  if (
    Array.isArray(
      publicacion.imagenes
    ) &&
    publicacion.imagenes
      .length > 0
  ) {
    return publicacion
      .imagenes[0];
  }

  return (
    publicacion.imagen ||
    ""
  );
}

function formatearDinero(
  valor
) {
  const numero =
    Number(
      valor || 0
    );

  return new Intl.NumberFormat(
    "es-AR",
    {
      style:
        "currency",

      currency:
        "ARS",

      maximumFractionDigits:
        0,
    }
  ).format(
    numero
  );
}

function etiquetaModalidad(
  modalidad
) {
  if (
    modalidad ===
    "PRECIO_FIJO"
  ) {
    return "Quiero este valor";
  }

  if (
    modalidad ===
    "RECIBE_PROPUESTAS"
  ) {
    return "Recibo propuestas";
  }

  return "Publicación";
}

function MisPublicaciones() {
  const navigate =
    useNavigate();

  const [
    publicaciones,
    setPublicaciones,
  ] =
    useState([]);

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    pestana,
    setPestana,
  ] =
    useState(
      "ACTIVAS"
    );

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(
          true
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
          navigate(
            "/ingresar"
          );

          return;
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
              `
              id,
              numero,
              titulo,
              barrio,
              base,
              estado,
              modalidad,
              imagen,
              imagenes,
              fecha_cierre,
              creado_por
              `
            )
            .eq(
              "creado_por",
              user.id
            )
            .order(
              "numero",
              {
                ascending:
                  false,
              }
            );

        if (error) {
          throw error;
        }

        setPublicaciones(
          data || []
        );
      } catch (error) {
        console.error(
          "Error al cargar Mis publicaciones:",
          error
        );

        setPublicaciones(
          []
        );
      } finally {
        setCargando(
          false
        );
      }
    }

    cargar();
  }, [navigate]);

  const activas =
    useMemo(
      () =>
        publicaciones.filter(
          (
            publicacion
          ) =>
            publicacion.estado ===
            "ACTIVO"
        ),

      [publicaciones]
    );

  const cerradas =
    useMemo(
      () =>
        publicaciones.filter(
          (
            publicacion
          ) =>
            publicacion.estado !==
            "ACTIVO"
        ),

      [publicaciones]
    );

  const visibles =
    pestana ===
    "ACTIVAS"
      ? activas
      : cerradas;

  return (
    <PantallaNosSirve
      titulo="Mis publicaciones"
      subtitulo="Todo lo que pusiste en circulación, en un solo lugar."
      mostrarVolver
    >

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1fr 1fr",

            background:
              "#eee8df",

            borderRadius:
              "15px",

            padding:
              "4px",

            marginBottom:
              "22px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setPestana(
                "ACTIVAS"
              )
            }
            style={{
              minHeight:
                "46px",

              border:
                "none",

              borderRadius:
                "12px",

              background:
                pestana ===
                "ACTIVAS"
                  ? "#075e59"
                  : "transparent",

              color:
                pestana ===
                "ACTIVAS"
                  ? "#ffffff"
                  : "#586263",

              fontSize:
                "15px",

              fontWeight:
                700,

              cursor:
                "pointer",
            }}
          >
            Activas ·{" "}
            {activas.length}
          </button>

          <button
            type="button"
            onClick={() =>
              setPestana(
                "CERRADAS"
              )
            }
            style={{
              minHeight:
                "46px",

              border:
                "none",

              borderRadius:
                "12px",

              background:
                pestana ===
                "CERRADAS"
                  ? "#075e59"
                  : "transparent",

              color:
                pestana ===
                "CERRADAS"
                  ? "#ffffff"
                  : "#586263",

              fontSize:
                "15px",

              fontWeight:
                700,

              cursor:
                "pointer",
            }}
          >
            Cerradas ·{" "}
            {cerradas.length}
          </button>
        </div>

        {cargando ? (
          <div
            style={{
              textAlign:
                "center",

              padding:
                "40px 10px",

              color:
                "#6d7475",
            }}
          >
            Cargando tus publicaciones...
          </div>
        ) : visibles.length ===
          0 ? (
          <div
            style={{
              background:
                "#ffffff",

              border:
                "1px solid #e4dacd",

              borderRadius:
                "20px",

              padding:
                "28px 20px",

              textAlign:
                "center",
            }}
          >
            <div
              style={{
                fontSize:
                  "30px",

                marginBottom:
                  "10px",
              }}
            >
              ♻
            </div>

            <h2
              style={{
                margin:
                  "0 0 8px",

                color:
                  "#123f3b",

                fontSize:
                  "20px",
              }}
            >
              {pestana ===
              "ACTIVAS"
                ? "No tenés publicaciones activas"
                : "Todavía no tenés publicaciones cerradas"}
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  "#687172",

                lineHeight:
                  1.5,

                fontSize:
                  "14px",
              }}
            >
              {pestana ===
              "ACTIVAS"
                ? "Cuando tengas una publicación aprobada, aparecerá acá."
                : "Cuando una publicación termine su ciclo, quedará guardada acá."}
            </p>
          </div>
        ) : (
          <div
            style={{
              display:
                "grid",

              gap:
                "14px",
            }}
          >
            {visibles.map(
              (
                publicacion
              ) => {
                const imagen =
                  obtenerImagen(
                    publicacion
                  );

                return (
                  <article
                    key={
                      publicacion.id
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
                            "190px",

                          background:
                            "#f7f4ef",
                        }}
                      >
                        <img
                          src={
                            imagen
                          }
                          alt={
                            publicacion.titulo
                          }
                          style={{
                            display:
                              "block",

                            width:
                              "100%",

                            height:
                              "100%",

                            objectFit:
                              "contain",
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

                          alignItems:
                            "center",

                          justifyContent:
                            "space-between",

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
                            publicacion.numero
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
                              publicacion.estado ===
                              "ACTIVO"
                                ? "#e5f3ef"
                                : "#f0ece6",

                            color:
                              publicacion.estado ===
                              "ACTIVO"
                                ? "#0d605b"
                                : "#6a625c",
                          }}
                        >
                          {publicacion.estado ===
                          "ACTIVO"
                            ? "Activa"
                            : "Cerrada"}
                        </span>
                      </div>

                      <h2
                        style={{
                          margin:
                            "0 0 7px",

                          color:
                            "#123f3b",

                          fontSize:
                            "21px",

                          lineHeight:
                            1.2,
                        }}
                      >
                        {
                          publicacion.titulo
                        }
                      </h2>

                      {publicacion.barrio && (
                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              "6px",

                            margin:
                              "0 0 10px",

                            color:
                              "#0d605b",

                            fontSize:
                              "14px",
                          }}
                        >
                          <IconoUbicacion />

                          <span
                            style={{
                              color:
                                "#697273",
                            }}
                          >
                            {
                              publicacion.barrio
                            }
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "flex-end",

                          gap:
                            "10px",

                          marginBottom:
                            "15px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color:
                                "#7a7470",

                              fontSize:
                                "12px",

                              marginBottom:
                                "3px",
                            }}
                          >
                            {etiquetaModalidad(
                              publicacion.modalidad
                            )}
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
                              publicacion.base
                            )}
                          </strong>
                        </div>
                      </div>

                      <Link
                        to={`/publicacion/${publicacion.numero}`}
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
                        }}
                      >
                        Ver publicación
                      </Link>

                      {publicacion.estado !==
                        "ACTIVO" && (
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              "Volver a publicar estará disponible en el próximo bloque. Siempre pasará nuevamente por revisión antes de publicarse."
                            )
                          }
                          style={{
                            minHeight:
                              "46px",

                            width:
                              "100%",

                            marginTop:
                              "9px",

                            borderRadius:
                              "14px",

                            border:
                              "1px solid #0d605b",

                            background:
                              "transparent",

                            color:
                              "#0d605b",

                            fontWeight:
                              700,

                            fontSize:
                              "14px",

                            cursor:
                              "pointer",
                          }}
                        >
                          Volver a publicar
                        </button>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

        <div
          style={{
            marginTop:
              "26px",

            textAlign:
              "center",
          }}
        >
          <Link
            to="/mi-cuenta"
            style={{
              color:
                "#0d605b",

              textDecoration:
                "none",

              fontWeight:
                700,

              fontSize:
                "14px",
            }}
          >
            ← Volver a Mi cuenta
          </Link>
        </div>
    </PantallaNosSirve>
  );
}

export default MisPublicaciones;