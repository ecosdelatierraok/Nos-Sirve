import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import PantallaNosSirve from "../components/PantallaNosSirve";
import SelectorAccesoNosSirve from "../components/SelectorAccesoNosSirve";

import {
  ingresarUsuario,
  obtenerUsuarioActual,
} from "../utils/usuario";

import "../App.css";
import { destinoAuthSeguro, leerContextoAuth, guardarContextoAuth, borrarContextoAuth } from "../utils/destinoAuth";
import { supabase } from "../lib/supabase";

const CLAVE_YA_INGRESO =
  "nos-sirve-ya-ingreso";

function yaIngresoAntes() {
  try {
    return (
      localStorage.getItem(
        CLAVE_YA_INGRESO
      ) === "SI"
    );
  } catch {
    return false;
  }
}

function marcarIngresoRealizado() {
  try {
    localStorage.setItem(
      CLAVE_YA_INGRESO,
      "SI"
    );
  } catch {
    // No bloquea el ingreso.
  }
}

function IconoEmail() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="14"
        rx="2"
      />

      <path d="m4.5 7 7.5 5.4L19.5 7" />
    </svg>
  );
}

function IconoCandado() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />

      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />

      <path d="M12 14.2v2.6" />
    </svg>
  );
}

function IconoOjo({
  cerrado = false,
}) {
  if (cerrado) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />

        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />

        <path d="M9.8 5.2A10.2 10.2 0 0 1 12 5c5.5 0 9 7 9 7" />

        <path d="M6.3 6.4C4.2 7.9 3 10 3 12c0 0 3.5 7 9 7 1.2 0 2.3-.3 3.3-.7" />
      </svg>
    );
  }

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function Ingresar() {
  const envioEnCurso = useRef(false);
  const activoRef = useRef(false);
  const navegandoRef = useRef(false);
  const revisionSesionRef = useRef(0);
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    contextoGuardado,
  ] = useState(
    () =>
      leerContextoAuth()
  );

  const volverARecibido =
    typeof location.state
      ?.volverA === "string"
      ? location.state.volverA
      : "";

  const destinoDespuesDeIngresar =
    destinoAuthSeguro(volverARecibido, "") ||
    contextoGuardado?.volverA ||
    "/";

  const completarIngreso = useCallback(() => {
    if (!activoRef.current || navegandoRef.current) return;
    navegandoRef.current = true;
    marcarIngresoRealizado();
    borrarContextoAuth();
    navigate(destinoDespuesDeIngresar, { replace: true });
  }, [destinoDespuesDeIngresar, navigate]);

  useEffect(() => {
    guardarContextoAuth(volverARecibido);
  }, [volverARecibido]);

  useEffect(() => {
    activoRef.current = true;
    let activo = true;
    let revision = 0;
    let temporizador;
    async function continuarSesion() {
      if (envioEnCurso.current || navegandoRef.current) return;
      const actual = ++revision;
      try {
        const usuario = await obtenerUsuarioActual();
        if (!activo || actual !== revision || envioEnCurso.current || !usuario) return;
        completarIngreso();
      } catch {
        // El formulario sigue disponible si la verificación de sesión falla.
      }
    }
    temporizador = setTimeout(() => void continuarSesion(), 0);
    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      revision += 1;
      clearTimeout(temporizador);
      if (evento === "SIGNED_OUT") revisionSesionRef.current += 1;
      if (sesion && (evento === "SIGNED_IN" || evento === "INITIAL_SESSION" || evento === "TOKEN_REFRESHED")) {
        temporizador = setTimeout(() => void continuarSesion(), 0);
      }
    });
    return () => {
      activo = false;
      activoRef.current = false;
      revisionSesionRef.current += 1;
      revision += 1;
      clearTimeout(temporizador);
      data.subscription.unsubscribe();
    };
  }, [completarIngreso]);

  const vieneDePublicar =
    destinoDespuesDeIngresar.startsWith(
      "/publicar"
    );

  const vieneDePublicacion =
    destinoDespuesDeIngresar.startsWith(
      "/publicacion/"
    );

  const [
    navegadorConIngresoPrevio,
  ] = useState(
    yaIngresoAntes
  );

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    ingresando,
    setIngresando,
  ] = useState(false);

  const [
    metodoAcceso,
    setMetodoAcceso,
  ] = useState("selector");

  async function ingresar(
    event
  ) {
    event.preventDefault();
    if (envioEnCurso.current || navegandoRef.current) return;

    if (
      !email.trim() ||
      !password
    ) {
      alert(
        "Ingresá tu email y contraseña."
      );

      return;
    }

    try {
      envioEnCurso.current = true;
      setIngresando(true);
      const revisionActual = revisionSesionRef.current;

      const resultado =
        await ingresarUsuario({
          email,
          password,
        });

      if (!activoRef.current) return;

      if (!resultado.ok) {
        alert(
          resultado.mensaje
        );

        return;
      }

      if (revisionActual !== revisionSesionRef.current) return;
      completarIngreso();
    } catch (error) {
      if (!activoRef.current) return;
      console.error(
        "Error al ingresar:",
        error
      );

      alert(
        "No se pudo iniciar sesión."
      );
    } finally {
      envioEnCurso.current = false;
      if (activoRef.current) setIngresando(false);
    }
  }

  const campo = {
    width: "100%",
    minHeight: "58px",
    border:
      "1px solid #ddd4c7",
    borderRadius: "16px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    padding: "0 15px",
    gap: "12px",
    boxSizing: "border-box",
  };

  const input = {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "16px",
    color: "#263536",
    fontFamily: "inherit",
  };

  const icono = {
    width: "27px",
    height: "27px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    color: "#2d4146",
  };

  const mensajePrincipal =
    vieneDePublicar
      ? "Ingresá para seguir con tu publicación."
      : vieneDePublicacion
        ? "Ingresá para continuar donde estabas."
        : navegadorConIngresoPrevio
          ? "Qué bueno volver a encontrarnos."
          : "Ingresá a tu cuenta o creá una nueva para continuar.";

  return (
    <>
      <PantallaNosSirve
        titulo="Ingresar"
        centrarContenido
      >
        <div className="ns-auth-panel">

          <p
            style={{
              margin:
                "0 0 22px",
              fontSize: "16px",
              lineHeight: 1.45,
              color:
                "#6d6258",
            }}
          >
            {mensajePrincipal}
          </p>

          {(vieneDePublicar ||
            vieneDePublicacion) && (
            <div
              style={{
                margin:
                  "0 0 18px",
                padding:
                  "12px 14px",
                border:
                  "1px solid #d9e7d8",
                borderRadius:
                  "14px",
                background:
                  "#f5faf4",
                color:
                  "#075753",
                fontSize:
                  "13px",
                lineHeight:
                  1.4,
                textAlign:
                  "center",
              }}
            >
              {vieneDePublicar
                ? "✦ Tu publicación quedó guardada. Después de ingresar, seguimos desde donde estabas."
                : "✦ Después de ingresar volvemos a la publicación donde estabas."}
            </div>
          )}

          {metodoAcceso === "selector" ? (
            <SelectorAccesoNosSirve
              modo="ingresar"
              onEmail={() =>
                setMetodoAcceso("email")
              }
            />
          ) : (
            <>
              <button
                type="button"
                className="ns-auth-volver-metodos"
                onClick={() =>
                  setMetodoAcceso("selector")
                }
              >
                ← Otras formas de ingresar
              </button>

          <form
            onSubmit={
              ingresar
            }
            style={{
              display: "grid",
              gap: "12px",
              width: "100%",
            }}
          >
            <div style={campo}>
              <span
                style={icono}
              >
                <IconoEmail />
              </span>

              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                disabled={
                  ingresando
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                style={input}
              />
            </div>

            <div style={campo}>
              <span
                style={icono}
              >
                <IconoCandado />
              </span>

              <input
                type={
                  mostrarPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                placeholder="Contraseña"
                value={
                  password
                }
                disabled={
                  ingresando
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
                style={input}
              />

              <button
                type="button"
                onClick={() =>
                  setMostrarPassword(
                    (valor) =>
                      !valor
                  )
                }
                aria-label="Mostrar u ocultar contraseña"
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  padding: "6px",
                  cursor:
                    "pointer",
                  color:
                    "#2d4146",
                  display:
                    "grid",
                  placeItems:
                    "center",
                }}
              >
                <IconoOjo
                  cerrado={
                    mostrarPassword
                  }
                />
              </button>
            </div>

            <div
              style={{
                textAlign:
                  "right",
                paddingRight:
                  "3px",
              }}
            >
              <button
                type="button"
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  padding: 0,
                  color:
                    "#0d605b",
                  fontSize:
                    "13px",
                  fontWeight:
                    650,
                  cursor:
                    "pointer",
                }}
                onClick={() =>
                  alert(
                    "La recuperación de contraseña se habilitará en el siguiente bloque de autenticación."
                  )
                }
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={
                ingresando
              }
              style={{
                position:
                  "relative",
                width: "100%",
                minHeight:
                  "56px",
                border: "none",
                borderRadius:
                  "16px",
                background:
                  "#075e59",
                color:
                  "#ffffff",
                fontWeight:
                  700,
                fontSize:
                  "17px",
                cursor:
                  ingresando
                    ? "default"
                    : "pointer",
                boxShadow:
                  "0 8px 20px rgba(7, 94, 89, 0.18)",
                marginTop:
                  "5px",
              }}
            >
              {ingresando
                ? "Ingresando..."
                : "Ingresar"}

              {!ingresando && (
                <span
                  aria-hidden="true"
                  style={{
                    position:
                      "absolute",
                    right:
                      "18px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color:
                      "#f2aa00",
                    fontSize:
                      "18px",
                  }}
                >
                  ✦ ✧
                </span>
              )}
            </button>
          </form>
            </>
          )}

          {metodoAcceso === "email" && (
            <>
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "15px",
              margin:
                "27px 0 20px",
            }}
          >
            <div
              style={{
                height: "1px",
                background:
                  "#d8cdbc",
                flex: 1,
              }}
            />

            <div
              style={{
                fontSize:
                  "15px",
                letterSpacing:
                  "5px",
              }}
            >
              <span
                style={{
                  color:
                    "#0d7770",
                }}
              >
                ●
              </span>

              <span
                style={{
                  color:
                    "#ef9f00",
                }}
              >
                ◆
              </span>

              <span
                style={{
                  color:
                    "#f2613c",
                }}
              >
                ●
              </span>
            </div>

            <div
              style={{
                height: "1px",
                background:
                  "#d8cdbc",
                flex: 1,
              }}
            />
          </div>

            </>
          )}

          <div
            style={{
              textAlign:
                "center",
              fontSize:
                "15px",
              color:
                "#364246",
            }}
          >
            ¿Todavía no tenés cuenta?{" "}

            <Link
              to="/registro"
              state={{
                volverA:
                  destinoDespuesDeIngresar,
              }}
              style={{
                color:
                  "#0d605b",
                fontWeight:
                  700,
                textDecoration:
                  "none",
              }}
            >
              Crear cuenta
            </Link>
          </div>

          <div
            style={{
              textAlign:
                "center",
              marginTop:
                "22px",
            }}
          >
            {(vieneDePublicar ||
              vieneDePublicacion) ? (
              <button
                type="button"
                onClick={() =>
                  navigate(-1)
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  padding: 0,
                  color:
                    "#667174",
                  fontSize:
                    "14px",
                  cursor:
                    "pointer",
                }}
              >
                ← Volver
              </button>
            ) : (
              <Link
                to="/"
                style={{
                  color:
                    "#667174",
                  fontSize:
                    "14px",
                  textDecoration:
                    "none",
                }}
              >
                ← Volver al inicio
              </Link>
            )}
          </div>
        </div>
      </PantallaNosSirve>

    </>
  );
}

export default Ingresar;
