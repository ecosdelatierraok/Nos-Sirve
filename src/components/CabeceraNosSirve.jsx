import {
  useLayoutEffect,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import Logo from "./Logo";

function IconoFlecha() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19 12H5M11 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoAyuda() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M9.8 9a2.3 2.3 0 1 1 3.8 1.8c-.9.7-1.6 1.1-1.6 2.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function CabeceraNosSirve({
  titulo = "",
  subtitulo = "",
  mostrarVolver = false,
  mostrarAyuda = false,
  onVolver,
  onAyuda,
  izquierda = null,
  derecha = null,
  extraInferior = null,
  className = "",
}) {
  const navigate = useNavigate();
  const [portalesListos, setPortalesListos] = useState(false);

  useLayoutEffect(() => {
    setPortalesListos(true);
  }, []);

  function volver() {
    if (onVolver) {
      onVolver();
      return;
    }

    navigate(-1);
  }

  const tieneContexto = Boolean(
    titulo ||
      subtitulo ||
      extraInferior
  );

  const contextoSimple = Boolean(
    tieneContexto &&
      !subtitulo &&
      ((titulo && !extraInferior) ||
        (!titulo && extraInferior))
  );

  const cabecera = (
    <header className={`ns-cabecera ${className}`.trim()}>
      <div className="ns-cabecera-fila-logo">
        <div className="ns-cabecera-slot ns-cabecera-slot-izquierdo">
          {izquierda ||
            (mostrarVolver ? (
              <button
                type="button"
                className="ns-cabecera-accion"
                aria-label="Volver"
                onClick={volver}
              >
                <IconoFlecha />
              </button>
            ) : null)}
        </div>

        <div className="ns-cabecera-logo">
          <Logo />
        </div>

        <div className="ns-cabecera-slot ns-cabecera-slot-derecho">
          {derecha ||
            (mostrarAyuda ? (
              <button
                type="button"
                className="ns-cabecera-accion"
                aria-label="Ayuda"
                onClick={onAyuda}
              >
                <IconoAyuda />
              </button>
            ) : null)}
        </div>
      </div>
    </header>
  );

  const contexto = tieneContexto ? (
    <div
      className={`ns-cabecera-contexto ${
        contextoSimple
          ? "ns-cabecera-contexto-simple"
          : "ns-cabecera-contexto-extendido"
      }`}
    >
      {titulo ? (
        <h1 className="ns-cabecera-titulo">{titulo}</h1>
      ) : null}

      {subtitulo ? (
        <div className="ns-cabecera-subtitulo">{subtitulo}</div>
      ) : null}

      {extraInferior ? (
        <div className="ns-cabecera-extra">{extraInferior}</div>
      ) : null}
    </div>
  ) : null;

  if (!portalesListos || typeof document === "undefined") {
    return null;
  }

  const hostCabecera = document.getElementById(
    "ns-shell-header-host"
  );
  const hostContexto = document.getElementById(
    "ns-shell-context-host"
  );

  if (!hostCabecera || !hostContexto) {
    return (
      <>
        {cabecera}
        {contexto}
      </>
    );
  }

  return (
    <>
      {createPortal(cabecera, hostCabecera)}
      {contexto
        ? createPortal(contexto, hostContexto)
        : null}
    </>
  );
}

export default CabeceraNosSirve;
