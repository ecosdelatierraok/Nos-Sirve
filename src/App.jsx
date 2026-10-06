import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
} from "react";

import LayoutNosSirve from "./components/LayoutNosSirve";

import ConfiguracionAdmin from "./pages/ConfiguracionAdmin";
import Home from "./pages/Home";
import Publicaciones from "./pages/Publicaciones";
import DetallePublicacion from "./pages/DetallePublicacion";
import NuevaPublicacion from "./pages/NuevaPublicacion";

import PublicarInicio from "./pages/PublicarInicio";
import PublicarFotos from "./pages/PublicarFotos";
import PublicarCaptura from "./pages/PublicarCaptura";
import PublicarAnalizando from "./pages/PublicarAnalizando";
import PublicarValor from "./pages/PublicarValor";
import PublicarRevision from "./pages/PublicarRevision";
import PublicarUbicacion from "./pages/PublicarUbicacion";
import PublicarConfirmar from "./pages/PublicarConfirmar";

import Registro from "./pages/Registro";
import Ingresar from "./pages/Ingresar";
import MiCuenta from "./pages/MiCuenta";
import MisPublicaciones from "./pages/MisPublicaciones";
import MisPropuestas from "./pages/MisPropuestas";
import Mensajes from "./pages/Mensajes";

function ScrollToTop() {
  const {
    pathname,
    search,
  } = useLocation();

  useEffect(() => {
    const shell = document.getElementById(
      "ns-shell-scroll"
    );

    if (shell) {
      shell.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [
    pathname,
    search,
  ]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/*
          Regla permanente Nos Sirve:
          toda ruta funcional vive debajo de LayoutNosSirve.
          Las rutas futuras deben agregarse dentro de este Route padre
          para heredar automáticamente fondo, viewport estable,
          scroll único y navegación inferior global.
        */}
        <Route element={<LayoutNosSirve />}>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/publicaciones"
            element={<Publicaciones />}
          />

          <Route
            path="/publicacion/id/:id"
            element={<DetallePublicacion />}
          />

          <Route
            path="/publicacion/:numero"
            element={<DetallePublicacion />}
          />

          <Route
            path="/publicar"
            element={<PublicarInicio />}
          />

          <Route
            path="/publicar/fotos"
            element={<PublicarFotos />}
          />

          <Route
            path="/publicar/captura"
            element={<PublicarCaptura />}
          />

          <Route
            path="/publicar/analizando"
            element={<PublicarAnalizando />}
          />

          <Route
            path="/publicar/valor"
            element={<PublicarValor />}
          />

          <Route
            path="/publicar/revision"
            element={<PublicarRevision />}
          />

          <Route
            path="/publicar/ubicacion"
            element={<PublicarUbicacion />}
          />

          <Route
            path="/publicar/confirmar"
            element={<PublicarConfirmar />}
          />

          <Route
            path="/nueva-publicacion"
            element={<NuevaPublicacion />}
          />

          <Route
            path="/editar-publicacion/:id"
            element={<NuevaPublicacion />}
          />

          <Route
            path="/configuracion"
            element={<ConfiguracionAdmin />}
          />

          <Route
            path="/registro"
            element={<Registro />}
          />

          <Route
            path="/ingresar"
            element={<Ingresar />}
          />

          <Route
            path="/mi-cuenta"
            element={<MiCuenta />}
          />

          <Route
            path="/mis-publicaciones"
            element={<MisPublicaciones />}
          />

          <Route
            path="/mis-propuestas"
            element={<MisPropuestas />}
          />

          <Route
            path="/mensajes"
            element={<Mensajes />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
