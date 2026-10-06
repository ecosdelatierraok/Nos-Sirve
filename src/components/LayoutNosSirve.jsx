import {
  Outlet,
  useLocation,
} from "react-router-dom";

import NavegacionInferior from "./NavegacionInferior";

import {
  exigirContratoPantallaNosSirve,
} from "../config/contratoPantallasNosSirve";

/**
 * Carcasa estructural global de Nos Sirve.
 *
 * REGLA PERMANENTE PARA RUTAS ACTUALES Y FUTURAS
 * ------------------------------------------------
 * Toda ruta funcional vive dentro de este layout. La pantalla se divide en
 * cuatro franjas reales, ninguna superpuesta:
 *   1) cabecera Nos Sirve;
 *   2) contexto fijo propio de la pantalla (título, buscador, filtros, etc.);
 *   3) único viewport con scroll;
 *   4) navegación inferior.
 *
 * CabeceraNosSirve publica sus dos primeras franjas en los hosts de este
 * layout. De esta manera el contenido nunca puede pasar visualmente ni por
 * detrás del logo ni por detrás de la navegación.
 */
function LayoutNosSirve() {
  const location = useLocation();

  const contrato =
    exigirContratoPantallaNosSirve(
      location.pathname
    );

  return (
    <div className="ns-shell-global">
      <div
        className="ns-shell-frame"
        data-ns-contrato={
          contrato?.id || "sin-contrato"
        }
        data-ns-contexto={
          contrato?.contexto || "sin-contexto"
        }
      >
        <div
          id="ns-shell-header-host"
          className="ns-shell-header-host"
          aria-live="off"
        />

        <div
          id="ns-shell-context-host"
          className="ns-shell-context-host"
          aria-live="off"
        />

        <div
          id="ns-shell-scroll"
          className="ns-shell-scroll"
        >
          <Outlet />
        </div>

        <div className="ns-shell-nav-host">
          <NavegacionInferior global />
        </div>
      </div>
    </div>
  );
}

export default LayoutNosSirve;
