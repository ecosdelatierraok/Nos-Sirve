import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import CabeceraNosSirve from "../components/CabeceraNosSirve";
import BuscadorNosSirve from "../components/BuscadorNosSirve";

import {
  obtenerPublicaciones,
} from "../utils/publicacionesStorage";

import "../App.css";

const LINK_INSTAGRAM =
  "https://www.instagram.com/gabiaguz?igsh=MXRydnVqY3ppcDM3Yg==";

const CLAVE_FAVORITOS =
  "nos-sirve-favoritos";

const CLAVE_ONBOARDING =
  "nos-sirve-onboarding-v1-visto";



function IconoCorazon({
  activo = false,
  size = 27,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={
        activo
          ? "currentColor"
          : "none"
      }
      aria-hidden="true"
    >
      <path
        d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.5 1-1a5.5 5.5 0 0 0 0-7.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoUbicacion({
  size = 15,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconoCampana({
  size = 31,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M10 21h4"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />

      <path
        d="M10.2 17.2v.7a1.8 1.8 0 0 0 3.6 0v-.7"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoChevron({
  abierto = false,
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transform:
          abierto
            ? "rotate(180deg)"
            : "rotate(0deg)",
        transition:
          "transform .2s ease",
      }}
    >
      <path
        d="m7 9 5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function obtenerFavoritosGuardados() {
  try {
    const guardados =
      localStorage.getItem(
        CLAVE_FAVORITOS
      );

    if (!guardados) {
      return new Set();
    }

    const lista =
      JSON.parse(
        guardados
      );

    if (
      !Array.isArray(
        lista
      )
    ) {
      return new Set();
    }

    return new Set(
      lista.map(
        (valor) =>
          String(valor)
      )
    );
  } catch {
    return new Set();
  }
}

function obtenerPrimeraImagen(
  publicacion
) {
  if (
    Array.isArray(
      publicacion?.imagenes
    ) &&
    publicacion.imagenes.length >
      0
  ) {
    const primera =
      publicacion.imagenes[0];

    if (
      typeof primera ===
      "string"
    ) {
      return primera;
    }

    if (primera?.url) {
      return primera.url;
    }

    if (primera?.publica) {
      return primera.publica;
    }
  }

  return (
    publicacion?.imagen ||
    ""
  );
}

function obtenerUbicacion(
  publicacion
) {
  const partes = [
    publicacion?.barrio,
    publicacion?.localidad,
    publicacion?.provincia,
  ]
    .map(
      (valor) =>
        String(
          valor || ""
        ).trim()
    )
    .filter(Boolean);

  if (
    partes.length > 0
  ) {
    return partes.join(
      " - "
    );
  }

  return "Ubicación a coordinar";
}

function esPrecioFijo(
  publicacion
) {
  return (
    publicacion?.modalidad ===
      "PRECIO_FIJO" ||
    publicacion?.modalidad ===
      "QUIERO_X"
  );
}

function obtenerValor(
  publicacion
) {
  return (
    publicacion?.valorInicial ??
    publicacion?.precio ??
    publicacion?.valor ??
    publicacion?.base ??
    publicacion?.oferta_actual ??
    0
  );
}

function obtenerFechaHora(
  publicacion
) {
  const posibles =
    publicacion?.fecha_cierre ||
    publicacion?.cierre ||
    publicacion?.fechaCierre ||
    publicacion?.fecha_fin ||
    publicacion?.fechaFin ||
    publicacion?.fecha_hora_cierre ||
    publicacion?.fechaHoraCierre ||
    null;

  if (!posibles) {
    return {
      fecha: "",
      hora: "",
    };
  }

  const valor =
    new Date(posibles);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return {
      fecha: "",
      hora: "",
    };
  }

  return {
    fecha:
      valor.toLocaleDateString(
        "es-AR",
        {
          day: "2-digit",
          month: "2-digit",
        }
      ),

    hora:
      valor.toLocaleTimeString(
        "es-AR",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      ),
  };
}

function Home() {
  const navigate =
    useNavigate();

  const buscadorRef =
    useRef(null);

  const [
    publicaciones,
    setPublicaciones,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    favoritos,
    setFavoritos,
  ] = useState(
    obtenerFavoritosGuardados
  );

  const [
    ideaAbierta,
    setIdeaAbierta,
  ] = useState(false);

  const [
    inspiracionAbierta,
    setInspiracionAbierta,
  ] = useState(false);

  const [
    filosofiaAbierta,
    setFilosofiaAbierta,
  ] = useState(false);

  const [
    tickerActivo,
    setTickerActivo,
  ] = useState(0);

  const [
    onboardingAbierto,
    setOnboardingAbierto,
  ] = useState(() => {
    try {
      return (
        localStorage.getItem(
          CLAVE_ONBOARDING
        ) !== "SI"
      );
    } catch {
      return true;
    }
  });

  const [
    pasoOnboarding,
    setPasoOnboarding,
  ] = useState(0);

  const pasosOnboarding = [
    {
      titulo:
        "Nos Sirve",
      texto:
        "Comprá y vendé objetos usados de forma simple y segura.",
      detalle:
        "",
      clase:
        "general",
    },
    {
      titulo:
        "Quiero",
      texto:
        "La persona que publica fija un precio.",
      detalle:
        "Si te sirve, tocás “Lo compro” y seguís con la operación.",
      clase:
        "quiero",
    },
    {
      titulo:
        "Recibo propuestas",
      texto:
        "La persona que publica escucha propuestas.",
      detalle:
        "Vos proponés un importe y, al cerrar la recepción de propuestas, quien publica elige con quién concretar la operación.",
      clase:
        "propuestas",
    },
    {
      titulo:
        "Publicar es fácil",
      texto:
        "Sacás fotos y MAGIA te ayuda a preparar la publicación.",
      detalle:
        "Título, descripción, categoría y otros datos útiles, sin complicarte.",
      clase:
        "publicar",
    },
    {
      titulo:
        "Recorré con el dedo",
      texto:
        "Si hay más fotos, vas a ver flechas y puntos para saberlo enseguida.",
      detalle:
        "Deslizá sobre las fotos para recorrerlas y, cuando estés viendo publicaciones, deslizá hacia los costados para pasar a la anterior o a la siguiente.",
      clase:
        "general",
    },
  ];

  const frasesTicker = [
    "Comunidad · Economía circular · Mercado consciente",
    "Comprá y vendé objetos usados de forma simple y segura",
  ];

  useEffect(() => {
    async function cargarInicio() {
      try {
        setCargando(true);

        const resultado =
          await obtenerPublicaciones();

        setPublicaciones(
          Array.isArray(
            resultado
          )
            ? resultado
            : []
        );
      } catch (error) {
        console.error(
          "Error al cargar el inicio:",
          error
        );

        setPublicaciones(
          []
        );
      } finally {
        setCargando(false);
      }
    }

    cargarInicio();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CLAVE_FAVORITOS,
        JSON.stringify(
          Array.from(
            favoritos
          )
        )
      );
    } catch {
      // Si el navegador no permite
      // guardar favoritos,
      // la pantalla sigue funcionando.
    }
  }, [
    favoritos,
  ]);

  const publicacionesActivas =
    useMemo(() => {
      return publicaciones
        .filter(
          (publicacion) =>
            publicacion.estado ===
            "ACTIVO"
        )
        .sort(
          (a, b) => {
            const numeroA =
              numeroSeguro(
                a.numero ??
                  a.id
              );

            const numeroB =
              numeroSeguro(
                b.numero ??
                  b.id
              );

            return (
              numeroB -
              numeroA
            );
          }
        );
    }, [
      publicaciones,
    ]);

  const destacadas =
    useMemo(() => {
      return publicacionesActivas.slice(
        0,
        3
      );
    }, [
      publicacionesActivas,
    ]);

  function alternarFavorito(
    id
  ) {
    setFavoritos(
      (actuales) => {
        const nuevos =
          new Set(
            actuales
          );

        if (
          nuevos.has(id)
        ) {
          nuevos.delete(
            id
          );
        } else {
          nuevos.add(
            id
          );
        }

        return nuevos;
      }
    );
  }

  function abrirPublicacion(
    publicacion
  ) {
    const numero =
      publicacion?.numero ??
      publicacion?.id;

    if (!numero) {
      return;
    }

    try {
      const numeros =
        publicacionesActivas
          .map(
            (item) =>
              item?.numero ??
              item?.id
          )
          .filter(Boolean)
          .map(
            (valor) =>
              Number(valor)
          )
          .filter(
            (valor) =>
              Number.isFinite(
                valor
              )
          );

      sessionStorage.setItem(
        "origen-detalle-publicacion",
        "inicio"
      );

      sessionStorage.setItem(
        "contexto-detalle-publicacion",
        JSON.stringify({
          origen: "inicio",
          numeroActual:
            Number(numero),
          numeros,
          scroll:
            window.scrollY,
        })
      );
    } catch {
      // La navegación sigue funcionando aunque no podamos guardar contexto.
    }

    navigate(
      `/publicacion/${numero}`
    );
  }

  function abrirPublicar() {
    navigate(
      "/publicar"
    );
  }

  function irABuscar(
    event
  ) {
    event?.preventDefault();

    const consulta =
      busqueda.trim();

    if (consulta) {
      sessionStorage.setItem(
        "busqueda-publicaciones",
        consulta
      );
    } else {
      sessionStorage.removeItem(
        "busqueda-publicaciones"
      );
    }

    navigate(
      "/publicaciones"
    );
  }

  function cerrarOnboarding() {
    try {
      localStorage.setItem(
        CLAVE_ONBOARDING,
        "SI"
      );
    } catch {
      // El onboarding puede cerrarse
      // aunque el navegador no permita
      // persistir el estado.
    }

    setOnboardingAbierto(
      false
    );
  }

  function avanzarOnboarding() {
    if (
      pasoOnboarding >=
      pasosOnboarding.length -
        1
    ) {
      cerrarOnboarding();
      return;
    }

    setPasoOnboarding(
      (actual) =>
        actual + 1
    );
  }

  function retrocederOnboarding() {
    setPasoOnboarding(
      (actual) =>
        Math.max(
          0,
          actual - 1
        )
    );
  }


  return (
    <>
      <style>{`
        :root {
          --sv-petroleo: #075753;
          --sv-mostaza: #efa900;
          --sv-coral: #f15a24;
          --sv-crema: #fdfaf7;
          --sv-borde: #eadccc;
          --sv-texto: #263536;
          --sv-muted: #746960;
        }

        body {
          background: #f8f5f1;
        }

        .sv-header {
          position: sticky;
          top: 0;
          z-index: 200;
          height: 112px;
          margin: 0 -14px 4px;
          padding: 0 14px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            rgba(
              253,
              250,
              247,
              0.98
            );
          backdrop-filter:
            blur(14px);
          -webkit-backdrop-filter:
            blur(14px);
          border-radius:
            21px 21px 0 0;
        }

        .sv-logo-home {
          width: var(--ns-header-logo-width);
          max-width:
            calc(
              100% - 78px
            );
          height: var(--ns-header-logo-height);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          overflow: hidden;
        }


        .sv-home-identidad {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 2px;
          display: grid;
          text-align: center;
        }

        .sv-home-ticker {
          position: relative;
          width: 100%;
          height: 16px;
          overflow: hidden;
          color: var(--sv-petroleo);
          font-size: 12px;
          line-height: 16px;
          font-weight: 850;
          white-space: nowrap;
        }

        .sv-home-ticker-frase {
          position: absolute;
          top: 0;
          left: 100%;
          width: max-content;
          min-width: max-content;
          will-change: left, transform;
          animation:
            sv-home-ticker-cruzar
            8.5s
            linear
            1
            forwards;
        }

        @keyframes sv-home-ticker-cruzar {
          from {
            left: 100%;
            transform: translateX(0);
          }

          to {
            left: 0;
            transform: translateX(-100%);
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .sv-home-ticker-frase {
            position: static;
            animation: none;
          }
        }

        .sv-onboarding-capa {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 18px;
          box-sizing: border-box;
          background:
            rgba(
              19,
              35,
              35,
              0.26
            );
          backdrop-filter:
            blur(5px);
          -webkit-backdrop-filter:
            blur(5px);
        }

        .sv-onboarding-card {
          width: min(
            360px,
            calc(100vw - 36px)
          );
          padding: 22px 20px 18px;
          box-sizing: border-box;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 24px;
          background:
            rgba(
              253,
              250,
              247,
              0.98
            );
          box-shadow:
            0 24px 70px
            rgba(
              23,
              31,
              29,
              0.24
            );
          text-align: center;
        }

        .sv-onboarding-kicker {
          margin: 0 0 8px;
          color:
            var(--sv-muted);
          font-size: 11px;
          line-height: 1;
          font-weight: 850;
          letter-spacing:
            0.6px;
          text-transform:
            uppercase;
        }

        .sv-onboarding-titulo {
          margin: 0;
          color:
            var(--sv-petroleo);
          font-size: 28px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing:
            -0.6px;
        }

        .sv-onboarding-titulo.quiero {
          color:
            var(--sv-coral);
        }

        .sv-onboarding-titulo.propuestas {
          color:
            var(--sv-mostaza);
        }

        .sv-onboarding-texto {
          margin:
            14px 0 0;
          color:
            var(--sv-texto);
          font-size: 16px;
          line-height: 1.35;
          font-weight: 850;
        }

        .sv-onboarding-detalle {
          margin:
            9px 0 0;
          color:
            #625b55;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 650;
        }

        .sv-onboarding-puntos {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin: 18px 0 16px;
        }

        .sv-onboarding-punto {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background:
            #d9d1c9;
        }

        .sv-onboarding-punto.activo {
          width: 20px;
          background:
            var(--sv-petroleo);
        }

        .sv-onboarding-acciones {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 9px;
        }

        .sv-onboarding-boton {
          min-height: 40px;
          padding:
            9px 14px;
          border-radius: 13px;
          border: 1px solid
            var(--sv-borde);
          background: #fff;
          color:
            var(--sv-petroleo);
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
        }

        .sv-onboarding-boton.principal {
          border-color:
            var(--sv-petroleo);
          background:
            var(--sv-petroleo);
          color: #fff;
        }

        .sv-onboarding-boton.saltar {
          border-color:
            transparent;
          background:
            transparent;
          color:
            var(--sv-muted);
          padding-left: 4px;
          padding-right: 4px;
        }

        .sv-onboarding-placeholder {
          min-width: 58px;
        }

        .sv-campana {
          position: absolute;
          top: 24px;
          right: 17px;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          background:
            transparent;
          color: #354448;
          opacity: 0.52;
          cursor: default;
        }

        .sv-campana svg {
          width: 29px;
          height: 29px;
        }

        .sv-buscador-form {
          margin:
            0 0 10px;
        }

        .sv-buscador {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding:
            0 14px;
          box-sizing:
            border-box;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 16px;
          background: #fff;
          color:
            var(--sv-petroleo);
          box-shadow:
            0 6px 18px
            rgba(
              40,
              32,
              25,
              0.035
            );
        }

        .sv-buscador input {
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background:
            transparent;
          font: inherit;
          font-size: 15px;
          color:
            var(--sv-texto);
        }

        .sv-banner {
          position: relative;
          height: 184px;
          overflow: hidden;
          margin-bottom: 15px;
          border-radius: 20px;
          background: #075753;
          color: #fff;
          box-shadow:
            0 12px 27px
            rgba(
              7,
              87,
              83,
              0.15
            );
          isolation: isolate;
        }

        .sv-banner-ilustracion {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 0;
          pointer-events: none;
        }

        .sv-banner-accion {
          position: absolute;
          z-index: 2;
          left: 18px;
          bottom: 14px;
        }

        .sv-banner-publicar {
          min-height: 38px;
          padding:
            8px 18px;
          border: none;
          border-radius: 13px;
          background:
            var(--sv-mostaza);
          color: #fff;
          font: inherit;
          font-size: 13.5px;
          font-weight: 850;
          cursor: pointer;
        }

        .sv-seccion-encabezado {
          display: grid;
          grid-template-columns:
            1fr auto;
          align-items: center;
          gap: 8px;
          margin:
            -2px 1px 9px;
        }

        .sv-seccion-encabezado h2 {
          min-width: 0;
          margin: 0;
          color:
            var(--sv-petroleo);
          font-size: 14px;
          line-height: 1.2;
          font-weight: 850;
          letter-spacing:
            -0.25px;
          white-space: nowrap;
        }

        .sv-ver-todas {
          min-height: 30px;
          padding: 6px 10px;
          border: 1px solid
            var(--sv-mostaza);
          border-radius: 999px;
          background:
            rgba(
              239,
              169,
              0,
              0.12
            );
          color:
            var(--sv-petroleo);
          font: inherit;
          font-size: 11.5px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
          transition:
            transform .18s ease,
            background .18s ease;
        }

        .sv-ver-todas:hover {
          background:
            rgba(
              239,
              169,
              0,
              0.2
            );
        }

        .sv-ver-todas:active {
          transform:
            scale(0.97);
        }

        .sv-lista-wrap {
          min-height: 428px;
        }

        .sv-lista {
          display: grid;
          gap: 10px;
        }

        .sv-estado-lista {
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 18px;
          box-sizing: border-box;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 18px;
          background: #fff;
          color:
            var(--sv-muted);
          text-align: center;
          font-size: 13px;
          line-height: 1.45;
        }

        .sv-card {
          display: grid;
          grid-template-columns:
            122px minmax(0, 1fr);
          gap: 10px;
          min-height: 136px;
          height: auto;
          padding: 7px;
          box-sizing:
            border-box;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 18px;
          background: #fff;
          cursor: pointer;
          outline: none;
        }

        .sv-card:focus-visible {
          box-shadow:
            0 0 0 3px
            rgba(
              7,
              87,
              83,
              0.16
            );
        }

        .sv-card-imagen-wrap {
          width: 122px;
          height: 122px;
          align-self: center;
          overflow: hidden;
          border-radius: 15px;
          background: #ffffff;
        }

        .sv-card-imagen {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
          background: #ffffff;
        }

        .sv-card-sin-imagen {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          font-size: 34px;
          background:
            #f3eee7;
        }

        .sv-card-info {
          position: relative;
          min-width: 0;
          min-height: 122px;
          padding:
            5px 32px
            5px 0;
          box-sizing:
            border-box;
          display: flex;
          flex-direction:
            column;
          justify-content:
            center;
        }

        .sv-card-numero {
          margin:
            0 0 3px;
          color:
            var(--sv-muted);
          font-size: 10px;
          line-height: 1;
          font-weight: 800;
        }

        .sv-card-titulo {
          margin:
            0 0 5px;
          color:
            var(--sv-petroleo);
          font-size: 15px;
          line-height: 1.08;
          font-weight: 850;
          display:
            -webkit-box;
          overflow: hidden;
          -webkit-line-clamp: 2;
          -webkit-box-orient:
            vertical;
        }

        .sv-card-modalidad {
          margin:
            0 0 4px;
          font-size: 14px;
          line-height: 1.15;
          font-weight: 850;
        }

        .sv-card-quiero {
          color:
            var(--sv-coral);
        }

        .sv-card-propuestas {
          color:
            var(--sv-mostaza);
        }

        .sv-card-linea {
          margin:
            1px 0 0;
          color: #5c554f;
          font-size: 11px;
          line-height: 1.2;
        }

        .sv-card-ubicacion {
          display: flex;
          align-items:
            flex-start;
          gap: 4px;
          margin-top: 6px;
          color:
            var(--sv-petroleo);
          font-size: 10.8px;
          line-height: 1.18;
        }

        .sv-card-ubicacion svg {
          flex: 0 0 auto;
          margin-top: 0.5px;
        }

        .sv-card-ubicacion span {
          min-width: 0;
          color: #4f4a46;
          overflow-wrap: normal;
          word-break: normal;
        }

        .sv-favorito {
          position: absolute;
          top: 2px;
          right: 0;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          background:
            transparent;
          color:
            var(--sv-petroleo);
          cursor: pointer;
        }

        .sv-proposito {
          margin-top: 20px;
          display: grid;
          gap: 10px;
        }

        .sv-acordeon {
          width: 100%;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 18px;
          background: #fff;
          overflow: hidden;
        }

        .sv-acordeon-boton {
          width: 100%;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            22px;
          align-items: center;
          gap: 14px;
          padding:
            16px 17px;
          box-sizing:
            border-box;
          border: 0;
          background:
            transparent;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .sv-acordeon-textos {
          min-width: 0;
          width: 100%;
          display: grid;
          gap: 5px;
        }

        .sv-acordeon-kicker {
          display: block;
          width: 100%;
          color:
            var(--sv-mostaza);
          font-size: 10px;
          font-weight: 850;
          text-transform:
            uppercase;
          letter-spacing:
            0.8px;
        }

        .sv-acordeon-titulo {
          display: block;
          width: 100%;
          color:
            var(--sv-petroleo);
          font-size: 17px;
          line-height: 1.18;
          font-weight: 850;
          text-align: justify;
          text-align-last: left;
        }

        .sv-acordeon-contenido {
          width: 100%;
          padding:
            2px 17px
            18px;
          box-sizing:
            border-box;
        }

        .sv-acordeon-contenido p {
          width: 100%;
          margin: 0;
          color: #544d48;
          font-size: 13px;
          line-height: 1.55;
          text-align: justify;
          text-align-last: left;
          hyphens: auto;
          -webkit-hyphens: auto;
        }

        .sv-footer {
          margin-top: 18px;
          padding:
            2px 4px 0;
          text-align: center;
          color: #7a6e65;
          font-size: 10.5px;
        }

        .sv-footer a {
          display: inline-block;
          margin-top: 5px;
          color:
            var(--sv-petroleo);
          font-weight: 800;
          text-decoration: none;
        }

        @media (
          max-width: 430px
        ) {
          .sv-header {
            height: 112px;
            margin-left: -14px;
            margin-right: -14px;
            margin-bottom: 2px;
            padding-left: 14px;
            padding-right: 14px;
          }

          .sv-logo-home {
            width: var(--ns-header-logo-width);
            height: var(--ns-header-logo-height);
          }


          .sv-home-identidad {
            left: 12px;
            right: 12px;
            bottom: 1px;
            gap: 3px;
          }

          .sv-home-ticker {
            font-size: 11.5px;
          }

          .sv-onboarding-card {
            width:
              calc(
                100vw - 30px
              );
            padding:
              20px 17px 16px;
          }

          .sv-onboarding-titulo {
            font-size: 26px;
          }

          .sv-onboarding-texto {
            font-size: 15px;
          }

          .sv-campana {
            top: 19px;
            right: 13px;
            width: 38px;
            height: 38px;
          }

          .sv-buscador {
            height: 42px;
          }

          .sv-banner {
            height: 172px;
          }

          .sv-banner-accion {
            left: 15px;
            bottom: 12px;
          }

          .sv-seccion-encabezado h2 {
            font-size: 13.5px;
            letter-spacing:
              -0.35px;
          }

          .sv-ver-todas {
            font-size: 11px;
          }

          .sv-card {
            grid-template-columns:
              118px minmax(0, 1fr);
            min-height: 132px;
            gap: 9px;
          }

          .sv-card-imagen-wrap {
            width: 118px;
            height: 118px;
          }

          .sv-card-info {
            min-height: 118px;
            padding-right: 29px;
          }

          .sv-card-ubicacion {
            font-size: 10.5px;
          }

          .sv-acordeon-boton {
            padding:
              15px 14px;
            gap: 10px;
          }

          .sv-acordeon-contenido {
            padding:
              2px 14px
              17px;
          }

          .sv-acordeon-kicker {
            font-size: 9.5px;
          }

          .sv-acordeon-titulo {
            font-size: 16px;
          }

          .sv-acordeon-contenido p {
            font-size: 13px;
            line-height: 1.55;
          }
        }

        @media (
          min-width: 700px
        ) {
          .sv-lista-wrap {
            min-height: 455px;
          }

          .sv-card {
            min-height: 145px;
          }
        }
      `}</style>

      {onboardingAbierto && (
        <div
          className="sv-onboarding-capa"
          role="dialog"
          aria-modal="true"
          aria-label="Cómo funciona Nos Sirve"
        >
          <div className="sv-onboarding-card">
            <p className="sv-onboarding-kicker">
              Cómo funciona
            </p>

            <h2
              className={`sv-onboarding-titulo ${
                pasosOnboarding[
                  pasoOnboarding
                ].clase
              }`}
            >
              {
                pasosOnboarding[
                  pasoOnboarding
                ].titulo
              }
            </h2>

            <p className="sv-onboarding-texto">
              {
                pasosOnboarding[
                  pasoOnboarding
                ].texto
              }
            </p>

            {pasosOnboarding[
              pasoOnboarding
            ].detalle && (
              <p className="sv-onboarding-detalle">
                {
                  pasosOnboarding[
                    pasoOnboarding
                  ].detalle
                }
              </p>
            )}

            <div
              className="sv-onboarding-puntos"
              aria-hidden="true"
            >
              {pasosOnboarding.map(
                (
                  paso,
                  indice
                ) => (
                  <span
                    key={
                      paso.titulo
                    }
                    className={`sv-onboarding-punto${
                      indice ===
                      pasoOnboarding
                        ? " activo"
                        : ""
                    }`}
                  />
                )
              )}
            </div>

            <div className="sv-onboarding-acciones">
              {pasoOnboarding >
              0 ? (
                <button
                  type="button"
                  className="sv-onboarding-boton"
                  onClick={
                    retrocederOnboarding
                  }
                >
                  Atrás
                </button>
              ) : (
                <button
                  type="button"
                  className="sv-onboarding-boton saltar"
                  onClick={
                    cerrarOnboarding
                  }
                >
                  Saltar
                </button>
              )}

              <span className="sv-onboarding-placeholder" />

              <button
                type="button"
                className="sv-onboarding-boton principal"
                onClick={
                  avanzarOnboarding
                }
              >
                {pasoOnboarding ===
                pasosOnboarding.length -
                  1
                  ? "Empezar"
                  : "Siguiente"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="sv-pantalla-fondo">
        <section className="sv-pantalla-app">
          <CabeceraNosSirve
            derecha={
              <button
                className="sv-campana"
                type="button"
                aria-label="Notificaciones próximamente"
                title="Notificaciones próximamente"
                disabled
              >
                <IconoCampana />
              </button>
            }
            extraInferior={
              <div className="ns-home-contexto-fijo">
                <div className="sv-home-identidad">
                  <div className="sv-home-ticker">
                    <span
                      key={tickerActivo}
                      className="sv-home-ticker-frase"
                      onAnimationEnd={() =>
                        setTickerActivo(
                          (actual) =>
                            (actual + 1) % frasesTicker.length
                        )
                      }
                    >
                      {frasesTicker[tickerActivo]}
                    </span>
                  </div>
                </div>

                <BuscadorNosSirve
                  as="form"
                  className="ns-buscador-home"
                  onSubmit={irABuscar}
                  inputRef={buscadorRef}
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value
                    )
                  }
                />
              </div>
            }
          />

          <section className="sv-banner">
            <img
              className="sv-banner-ilustracion"
              src="/banner-publica-facil.png"
              alt=""
              aria-hidden="true"
            />

            <div className="sv-banner-accion">
              <button
                className="sv-banner-publicar"
                type="button"
                onClick={
                  abrirPublicar
                }
              >
                Publicar ahora
              </button>
            </div>
          </section>

          <section>
            <div className="sv-seccion-encabezado">
              <h2>
                Objetos que aún sirven
              </h2>

              <button
                type="button"
                className="sv-ver-todas"
                onClick={() =>
                  navigate(
                    "/publicaciones"
                  )
                }
              >
                Ver todos ›
              </button>
            </div>

            <div className="sv-lista-wrap">
              {cargando && (
                <div className="sv-estado-lista">
                  Cargando objetos...
                </div>
              )}

              {!cargando &&
                destacadas.length ===
                  0 && (
                  <div className="sv-estado-lista">
                    Todavía no hay objetos activos para mostrar.
                  </div>
                )}

              {!cargando &&
                destacadas.length >
                  0 && (
                  <div className="sv-lista">
                    {destacadas.map(
                      (
                        publicacion
                      ) => {
                        const idFavorito =
                          String(
                            publicacion.id ??
                              publicacion.numero
                          );

                        const imagen =
                          obtenerPrimeraImagen(
                            publicacion
                          );

                        const fijo =
                          esPrecioFijo(
                            publicacion
                          );

                        const valor =
                          obtenerValor(
                            publicacion
                          );

                        const {
                          fecha,
                          hora,
                        } =
                          obtenerFechaHora(
                            publicacion
                          );

                        const favoritoActivo =
                          favoritos.has(
                            idFavorito
                          );

                        return (
                          <article
                            key={
                              publicacion.id ??
                              publicacion.numero
                            }
                            className="sv-card"
                            role="link"
                            tabIndex={0}
                            aria-label={`Abrir publicación ${publicacion.numero ?? ""} ${publicacion.titulo || ""}`}
                            onClick={() =>
                              abrirPublicacion(
                                publicacion
                              )
                            }
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                event.key ===
                                  "Enter" ||
                                event.key ===
                                  " "
                              ) {
                                event.preventDefault();

                                abrirPublicacion(
                                  publicacion
                                );
                              }
                            }}
                          >
                            <div className="sv-card-imagen-wrap">
                              {imagen ? (
                                <img
                                  className="sv-card-imagen"
                                  src={
                                    imagen
                                  }
                                  alt={
                                    publicacion.titulo ||
                                    "Objeto publicado"
                                  }
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="sv-card-sin-imagen">
                                  ♻
                                </div>
                              )}
                            </div>

                            <div className="sv-card-info">
                              <button
                                className="sv-favorito"
                                type="button"
                                aria-label={
                                  favoritoActivo
                                    ? "Quitar de favoritos"
                                    : "Agregar a favoritos"
                                }
                                aria-pressed={
                                  favoritoActivo
                                }
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  alternarFavorito(
                                    idFavorito
                                  );
                                }}
                              >
                                <IconoCorazon
                                  activo={
                                    favoritoActivo
                                  }
                                />
                              </button>

                              <div className="sv-card-numero">
                                #{publicacion.numero ?? publicacion.id}
                              </div>

                              <h3 className="sv-card-titulo">
                                {publicacion.titulo ||
                                  "Objeto usado"}
                              </h3>

                              {fijo ? (
                                <p className="sv-card-modalidad sv-card-quiero">
                                  Quiero $
                                  {formatearDinero(
                                    valor
                                  )}
                                </p>
                              ) : (
                                <>
                                  <p className="sv-card-modalidad sv-card-propuestas">
                                    Recibo propuestas
                                  </p>

                                  {valor >
                                    0 && (
                                    <p className="sv-card-linea">
                                      Valor inicial $
                                      {formatearDinero(
                                        valor
                                      )}
                                    </p>
                                  )}

                                  {(fecha ||
                                    hora) && (
                                    <p className="sv-card-linea">
                                      Hasta{" "}
                                      {fecha}
                                      {fecha &&
                                      hora
                                        ? " - "
                                        : ""}
                                      {hora}
                                    </p>
                                  )}
                                </>
                              )}

                              <div className="sv-card-ubicacion">
                                <IconoUbicacion />

                                <span>
                                  {obtenerUbicacion(
                                    publicacion
                                  )}
                                </span>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
            </div>
          </section>

          <section className="sv-proposito">
            <div className="sv-acordeon">
              <button
                type="button"
                className="sv-acordeon-boton"
                aria-expanded={
                  ideaAbierta
                }
                aria-controls="sv-idea-contenido"
                onClick={() =>
                  setIdeaAbierta(
                    (
                      actual
                    ) =>
                      !actual
                  )
                }
              >
                <span className="sv-acordeon-textos">
                  <span className="sv-acordeon-kicker">
                    La idea detrás de Nos Sirve
                  </span>

                  <span className="sv-acordeon-titulo">
                    Que las cosas sigan moviéndose
                  </span>
                </span>

                <IconoChevron
                  abierto={
                    ideaAbierta
                  }
                />
              </button>

              {ideaAbierta && (
                <div
                  id="sv-idea-contenido"
                  className="sv-acordeon-contenido"
                >
                  <p>
                    Nos Sirve nace para que los objetos que todavía pueden ser útiles no queden quietos cuando ya no los usamos. Porque muchas veces tenemos algo guardado mientras otra persona podría estar buscándolo. Mover las cosas nos sirve a todos: libera espacio, evita descarte innecesario y permite que un objeto empiece otra etapa en otras manos.
                  </p>
                </div>
              )}
            </div>

            <div className="sv-acordeon">
              <button
                type="button"
                className="sv-acordeon-boton"
                aria-expanded={
                  inspiracionAbierta
                }
                aria-controls="sv-inspiracion-contenido"
                onClick={() =>
                  setInspiracionAbierta(
                    (
                      actual
                    ) =>
                      !actual
                  )
                }
              >
                <span className="sv-acordeon-textos">
                  <span className="sv-acordeon-kicker">
                    Una idea simple que inspira Nos Sirve
                  </span>

                  <span className="sv-acordeon-titulo">
                    Lo que puede seguir circulando
                  </span>
                </span>

                <IconoChevron
                  abierto={
                    inspiracionAbierta
                  }
                />
              </button>

              {inspiracionAbierta && (
                <div
                  id="sv-inspiracion-contenido"
                  className="sv-acordeon-contenido"
                >
                  <p>
                    Que no te falte a vos lo que me sobra a mí. Que no me falte a mí lo que te sobra a vos.
                  </p>
                </div>
              )}
            </div>

            <div className="sv-acordeon">
              <button
                type="button"
                className="sv-acordeon-boton"
                aria-expanded={
                  filosofiaAbierta
                }
                aria-controls="sv-filosofia-contenido"
                onClick={() =>
                  setFilosofiaAbierta(
                    (
                      actual
                    ) =>
                      !actual
                  )
                }
              >
                <span className="sv-acordeon-textos">
                  <span className="sv-acordeon-kicker">
                    Filosofía de Nos Sirve
                  </span>

                  <span className="sv-acordeon-titulo">
                    Facilitar el encuentro
                  </span>
                </span>

                <IconoChevron
                  abierto={
                    filosofiaAbierta
                  }
                />
              </button>

              {filosofiaAbierta && (
                <div
                  id="sv-filosofia-contenido"
                  className="sv-acordeon-contenido"
                >
                  <p>
                    Desde esa filosofía nace Nos Sirve: facilitar el encuentro, ayudar a encontrar un precio posible y hacer que las cosas vuelvan a circular. La tecnología acompaña; las personas y los objetos son los protagonistas.
                  </p>
                </div>
              )}
            </div>
          </section>

          <footer className="sv-footer">
            <div>
              Nos Sirve V1 © 2026 · Córdoba, Argentina
            </div>

            <a
              href={
                LINK_INSTAGRAM
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Diseñado por Ecos de la Tierra | @gabiaguz
            </a>
          </footer>

        </section>
      </main>
    </>
  );
}

export default Home;