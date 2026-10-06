import PantallaNosSirve from "../components/PantallaNosSirve";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  cambiarClaveAdmin,
  esAdmin,
} from "../utils/admin";

import "../App.css";

function ConfiguracionAdmin() {
  const [
    claveActual,
    setClaveActual,
  ] = useState("");

  const [
    nuevaClave,
    setNuevaClave,
  ] = useState("");

  const [
    repetirClave,
    setRepetirClave,
  ] = useState("");

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    habilitarClaveActual,
    setHabilitarClaveActual,
  ] = useState(false);

  if (!esAdmin()) {
    return (
      <PantallaNosSirve
        titulo="Acceso restringido"
        centrarContenido
      >
        <div className="ns-auth-panel">
          <p>
            Esta sección es solo para
            Administración.
          </p>

          <Link
            to="/"
            className="boton-secundario"
          >
            ← Volver al inicio
          </Link>
        </div>
      </PantallaNosSirve>
    );
  }

  async function guardar(event) {
    event.preventDefault();

    if (guardando) {
      return;
    }

    if (!claveActual) {
      alert(
        "Ingresá tu contraseña actual."
      );

      return;
    }

    if (
      !nuevaClave ||
      nuevaClave.length < 6
    ) {
      alert(
        "La nueva contraseña debe tener al menos 6 caracteres."
      );

      return;
    }

    if (
      nuevaClave !==
      repetirClave
    ) {
      alert(
        "Las nuevas contraseñas no coinciden."
      );

      return;
    }

    if (
      claveActual ===
      nuevaClave
    ) {
      alert(
        "La nueva contraseña debe ser diferente de la actual."
      );

      return;
    }

    try {
      setGuardando(true);

      const resultado =
        await cambiarClaveAdmin(
          claveActual,
          nuevaClave
        );

      if (!resultado.ok) {
        alert(
          resultado.mensaje ||
            "No se pudo actualizar la contraseña."
        );

        return;
      }

      alert(
        "Contraseña de Administración actualizada correctamente."
      );

      setClaveActual("");
      setNuevaClave("");
      setRepetirClave("");
      setHabilitarClaveActual(false);
    } catch (error) {
      console.error(
        "Error al cambiar la contraseña:",
        error
      );

      alert(
        "No se pudo actualizar la contraseña."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <PantallaNosSirve
      titulo="Configuración"
      mostrarVolver
    >

        <form
          className="formulario-panel"
          onSubmit={guardar}
          autoComplete="off"
        >
          <h2>
            Contraseña de Administración
          </h2>

          <p className="texto-ayuda">
            Para cambiarla, ingresá primero
            tu contraseña actual.
          </p>

          <input
            type="password"
            name="clave-actual-nos-sirve"
            placeholder="Contraseña actual"
            autoComplete="off"
            value={claveActual}
            disabled={guardando}
            readOnly={!habilitarClaveActual}
            onFocus={() =>
              setHabilitarClaveActual(true)
            }
            onChange={(event) =>
              setClaveActual(
                event.target.value
              )
            }
          />

          <input
            type="password"
            name="nueva-clave-nos-sirve"
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            value={nuevaClave}
            disabled={guardando}
            onChange={(event) =>
              setNuevaClave(
                event.target.value
              )
            }
          />

          <input
            type="password"
            name="repetir-nueva-clave-nos-sirve"
            placeholder="Repetir nueva contraseña"
            autoComplete="new-password"
            value={repetirClave}
            disabled={guardando}
            onChange={(event) =>
              setRepetirClave(
                event.target.value
              )
            }
          />

          <button
            className="boton-principal"
            type="submit"
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : "Cambiar contraseña"}
          </button>
        </form>

        <Link
          to="/publicaciones"
          className="boton-secundario"
        >
          ← Volver
        </Link>
    </PantallaNosSirve>
  );
}

export default ConfiguracionAdmin;
