import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { supabase } from "../lib/supabase";

function IconoBuscar({
  size = 31,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoInicio({
  size = 31,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconoMensaje({
  size = 31,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      <path
        d="M7.5 9.5h9M7.5 13h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoUsuario({
  size = 31,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.75"
      />

      <path
        d="M4.5 21a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavegacionInferiorGlobal({
  onBuscar,
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    notificacionesPendientes,
    setNotificacionesPendientes,
  ] = useState(0);

  const ruta =
    location.pathname;

  const inicioActivo =
    ruta === "/";

  const buscarActivo =
    ruta === "/publicaciones" ||
    ruta.startsWith(
      "/publicacion/"
    );

  const publicarActivo =
    ruta === "/publicar" ||
    ruta.startsWith(
      "/publicar/"
    ) ||
    ruta ===
      "/nueva-publicacion" ||
    ruta.startsWith(
      "/editar-publicacion/"
    );

  const mensajesActivo =
    ruta.startsWith(
      "/mensajes"
    );

  const cuentaActiva =
    ruta === "/mi-cuenta" ||
    ruta === "/ingresar" ||
    ruta === "/registro" ||
    ruta === "/configuracion" ||
    ruta ===
      "/mis-publicaciones" ||
    ruta ===
      "/mis-propuestas";

  useEffect(() => {
    let activo = true;
    let usuarioId = null;
    let intervalo = null;
    let canal = null;
    let consultaEnCurso = false;

    async function leerCantidad() {
      if (
        !activo ||
        !usuarioId ||
        consultaEnCurso
      ) {
        return;
      }

      consultaEnCurso = true;

      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "notificaciones"
            )
            .select("id")
            .eq(
              "usuario_id",
              usuarioId
            )
            .eq(
              "leida",
              false
            );

        if (error) {
          throw error;
        }

        if (activo) {
          setNotificacionesPendientes(
            Array.isArray(data)
              ? data.length
              : 0
          );
        }
      } catch (error) {
        console.error(
          "Error al leer notificaciones:",
          error
        );

        /*
          Si falla una consulta,
          conservamos el contador
          que ya estaba visible.
        */
      } finally {
        consultaEnCurso = false;
      }
    }

    function iniciarActualizacion() {
      if (
        !activo ||
        !usuarioId
      ) {
        return;
      }

      leerCantidad();

      if (intervalo) {
        window.clearInterval(
          intervalo
        );
      }

      intervalo =
        window.setInterval(
          leerCantidad,
          2000
        );

      if (canal) {
        supabase.removeChannel(
          canal
        );
      }

      canal =
        supabase
          .channel(
            `notificaciones-nav-${usuarioId}-${Date.now()}`
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
            () => {
              leerCantidad();
            }
          )
          .subscribe();
    }

    async function resolverUsuario() {
      try {
        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        usuarioId =
          data?.session?.user?.id ||
          null;

        if (!usuarioId) {
          setNotificacionesPendientes(
            0
          );

          return;
        }

        iniciarActualizacion();
      } catch (error) {
        console.error(
          "Error al obtener sesión para notificaciones:",
          error
        );
      }
    }

    function refrescarAhora() {
      if (usuarioId) {
        leerCantidad();
      } else {
        resolverUsuario();
      }
    }

    function manejarVisibilidad() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refrescarAhora();
      }
    }

    resolverUsuario();

    const {
      data:
        listenerAuth,
    } =
      supabase.auth.onAuthStateChange(
        (
          _evento,
          sesion
        ) => {
          const nuevoUsuarioId =
            sesion?.user?.id ||
            null;

          if (
            nuevoUsuarioId ===
            usuarioId
          ) {
            refrescarAhora();
            return;
          }

          usuarioId =
            nuevoUsuarioId;

          if (!usuarioId) {
            if (intervalo) {
              window.clearInterval(
                intervalo
              );

              intervalo = null;
            }

            if (canal) {
              supabase.removeChannel(
                canal
              );

              canal = null;
            }

            setNotificacionesPendientes(
              0
            );

            return;
          }

          iniciarActualizacion();
        }
      );

    window.addEventListener(
      "focus",
      refrescarAhora
    );

    window.addEventListener(
      "online",
      refrescarAhora
    );

    window.addEventListener(
      "pageshow",
      refrescarAhora
    );

    document.addEventListener(
      "visibilitychange",
      manejarVisibilidad
    );

    return () => {
      activo = false;

      if (intervalo) {
        window.clearInterval(
          intervalo
        );
      }

      if (canal) {
        supabase.removeChannel(
          canal
        );
      }

      listenerAuth
        ?.subscription
        ?.unsubscribe();

      window.removeEventListener(
        "focus",
        refrescarAhora
      );

      window.removeEventListener(
        "online",
        refrescarAhora
      );

      window.removeEventListener(
        "pageshow",
        refrescarAhora
      );

      document.removeEventListener(
        "visibilitychange",
        manejarVisibilidad
      );
    };
  }, []);

  function irInicio() {
    navigate("/");
  }

  function irBuscar() {
    if (onBuscar) {
      onBuscar();
      return;
    }

    navigate("/publicaciones");
  }

  function irPublicar() {
    navigate("/publicar");
  }

  function irMensajes() {
    navigate("/mensajes");
  }

  function irCuenta() {
    navigate("/mi-cuenta");
  }

  return (
    <>
      <style>{`
        :root {
          --sv-petroleo: #075753;
          --sv-crema: #fdfaf7;
          --sv-borde: #eadccc;
          --sv-mostaza: #efa900;
        }

        .sv-nav-global {
          position: fixed;

          left: 50%;
          bottom: 10px;

          transform:
            translateX(-50%);

          width:
            min(
              calc(
                100% - 24px
              ),
              430px
            );

          height: 94px;

          display: grid;

          grid-template-columns:
            repeat(5, 1fr);

          align-items: center;

          padding:
            8px 8px 19px;

          box-sizing:
            border-box;

          border:
            1px solid
            var(--sv-borde);

          border-radius: 20px;

          background:
            rgba(
              255,
              255,
              255,
              0.98
            );

          backdrop-filter:
            blur(14px);

          -webkit-backdrop-filter:
            blur(14px);

          box-shadow:
            0 10px 28px
            rgba(
              38,
              53,
              54,
              0.11
            );

          z-index: 500;
        }

        .sv-nav-global-item {
          position: relative;

          min-width: 0;

          height: 67px;

          display: flex;

          flex-direction:
            column;

          align-items: center;

          justify-content: center;

          gap: 3px;

          padding: 0;

          border: 0;

          background:
            transparent;

          color: #40494a;

          font: inherit;

          font-size: 11px;

          cursor: pointer;

          transform:
            translateY(-8px);
        }

        .sv-nav-global-item svg {
          display: block;

          flex: 0 0 auto;
        }

        .sv-nav-global-item.activo {
          color:
            var(--sv-petroleo);

          font-weight: 800;
        }

        .sv-nav-global-publicar {
          justify-content: center;

          transform:
            translateY(-4px);
        }

        .sv-nav-global-mas {
          width: 62px;
          height: 62px;

          display: grid;

          place-items: center;

          margin-top: -28px;
          margin-bottom: 0;

          border:
            6px solid
            var(--sv-crema);

          border-radius: 50%;

          background:
            var(--sv-petroleo);

          color: #fff;

          font-size: 39px;

          line-height: 1;

          box-shadow:
            0 7px 18px
            rgba(
              7,
              87,
              83,
              0.26
            );
        }

        .sv-nav-notificacion {
          position: absolute;

          top: 3px;
          left: 50%;

          transform:
            translateX(7px);

          min-width: 18px;
          height: 18px;

          display: grid;
          place-items: center;

          padding:
            0 5px;

          box-sizing:
            border-box;

          border:
            2px solid #fff;

          border-radius:
            999px;

          background:
            var(--sv-mostaza);

          color: #fff;

          font-size: 9px;
          line-height: 1;
          font-weight: 900;
        }

        @media (
          max-width: 380px
        ) {
          .sv-nav-global {
            height: 92px;

            padding-bottom: 18px;

            bottom: 8px;
          }
        }
      `}</style>

      <nav
        className="sv-nav-global"
        aria-label="Navegación principal"
      >
        <button
          type="button"
          className={
            inicioActivo
              ? "sv-nav-global-item activo"
              : "sv-nav-global-item"
          }
          onClick={irInicio}
        >
          <IconoInicio />

          <span>
            Inicio
          </span>
        </button>

        <button
          type="button"
          className={
            buscarActivo
              ? "sv-nav-global-item activo"
              : "sv-nav-global-item"
          }
          onClick={irBuscar}
        >
          <IconoBuscar />

          <span>
            Buscar
          </span>
        </button>

        <button
          type="button"
          className={
            publicarActivo
              ? "sv-nav-global-item sv-nav-global-publicar activo"
              : "sv-nav-global-item sv-nav-global-publicar"
          }
          onClick={irPublicar}
        >
          <span className="sv-nav-global-mas">
            +
          </span>

          <span>
            Publicar
          </span>
        </button>

        <button
          type="button"
          className={
            mensajesActivo
              ? "sv-nav-global-item activo"
              : "sv-nav-global-item"
          }
          onClick={irMensajes}
        >
          <IconoMensaje />

          {notificacionesPendientes >
            0 && (
            <span className="sv-nav-notificacion">
              {notificacionesPendientes >
              9
                ? "9+"
                : notificacionesPendientes}
            </span>
          )}

          <span>
            Mensajes
          </span>
        </button>

        <button
          type="button"
          className={
            cuentaActiva
              ? "sv-nav-global-item activo"
              : "sv-nav-global-item"
          }
          onClick={irCuenta}
        >
          <IconoUsuario />

          <span>
            Mi cuenta
          </span>
        </button>
      </nav>
    </>
  );
}

function NavegacionInferior({
  onBuscar,
  global = false,
}) {
  if (!global) {
    return null;
  }

  return (
    <NavegacionInferiorGlobal
      onBuscar={onBuscar}
    />
  );
}

export default NavegacionInferior;