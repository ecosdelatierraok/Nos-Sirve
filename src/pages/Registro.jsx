import {
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
  registrarUsuario,
} from "../utils/usuario";

import "../App.css";
import { destinoAuthSeguro, leerContextoAuth, guardarContextoAuth, borrarContextoAuth } from "../utils/destinoAuth";

const CLAVE_YA_INGRESO =
  "nos-sirve-ya-ingreso";

const CLAVE_BORRADOR_REGISTRO =
  "nos-sirve-borrador-registro";

const DURACION_BORRADOR_REGISTRO =
  24 * 60 * 60 * 1000;

function borradorRegistroVacio() {
  return {
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    aceptaTerminos: false,
  };
}

function borrarBorradorRegistro() {
  try {
    localStorage.removeItem(
      CLAVE_BORRADOR_REGISTRO
    );
  } catch {
    // No bloquea el registro.
  }
}

function leerBorradorRegistro() {
  try {
    const guardado =
      localStorage.getItem(
        CLAVE_BORRADOR_REGISTRO
      );

    if (!guardado) {
      return borradorRegistroVacio();
    }

    const datos =
      JSON.parse(
        guardado
      );

    const actualizadoEn =
      Number(
        datos?.actualizadoEn
      );

    const vencido =
      !Number.isFinite(
        actualizadoEn
      ) ||
      Date.now() -
        actualizadoEn >
        DURACION_BORRADOR_REGISTRO;

    if (vencido) {
      borrarBorradorRegistro();

      return borradorRegistroVacio();
    }

    return {
      nombre:
        String(
          datos?.nombre ||
          ""
        ),

      apellido:
        String(
          datos?.apellido ||
          ""
        ),

      telefono:
        String(
          datos?.telefono ||
          ""
        ),

      email:
        String(
          datos?.email ||
          ""
        ),

      aceptaTerminos:
        Boolean(
          datos?.aceptaTerminos
        ),
    };
  } catch {
    borrarBorradorRegistro();

    return borradorRegistroVacio();
  }
}

function guardarBorradorRegistro({
  nombre,
  apellido,
  telefono,
  email,
  aceptaTerminos,
}) {
  try {
    localStorage.setItem(
      CLAVE_BORRADOR_REGISTRO,
      JSON.stringify({
        nombre:
          String(
            nombre ||
            ""
          ),

        apellido:
          String(
            apellido ||
            ""
          ),

        telefono:
          String(
            telefono ||
            ""
          ),

        email:
          String(
            email ||
            ""
          ),

        aceptaTerminos:
          Boolean(
            aceptaTerminos
          ),

        actualizadoEn:
          Date.now(),
      })
    );
  } catch {
    // No bloquea el registro.
  }
}

function marcarIngresoRealizado() {
  try {
    localStorage.setItem(
      CLAVE_YA_INGRESO,
      "SI"
    );
  } catch {
    // No bloquea el registro.
  }
}

function IconoUsuario() {
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
      <circle
        cx="12"
        cy="8"
        r="3.4"
      />

      <path d="M5.5 19c.8-3.7 3.1-5.6 6.5-5.6s5.7 1.9 6.5 5.6" />
    </svg>
  );
}

function IconoTelefono() {
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
      <path d="M7.2 3.8 9.5 7c.4.6.3 1.3-.2 1.8l-1.1 1c1.1 2.4 3 4.3 5.4 5.4l1-1.1c.5-.5 1.2-.6 1.8-.2l3.2 2.3c.6.4.8 1.2.5 1.9l-.8 1.7c-.3.7-1 1.1-1.8 1-7.1-.9-12.7-6.5-13.6-13.6-.1-.8.3-1.5 1-1.8l1.7-.8c.7-.3 1.5-.1 1.9.5Z" />
    </svg>
  );
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

        <path d="M9.8 5.2A10.2 10.2 0 0 1 12 5c5.5 0 9 7 9 7a15.5 15.5 0 0 1-2.2 3" />

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

function IconoEscudo() {
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
      <path d="M12 3 19 6v5c0 4.5-2.7 7.8-7 10-4.3-2.2-7-5.5-7-10V6l7-3Z" />

      <path d="m9.2 12 1.8 1.8 3.8-4" />
    </svg>
  );
}

function Registro() {
  const envioEnCurso = useRef(false);
  const activoRef = useRef(false);

  useEffect(() => {
    activoRef.current = true;
    return () => { activoRef.current = false; };
  }, []);
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    borradorInicial,
  ] = useState(
    () =>
      leerBorradorRegistro()
  );

  const volverARecibido =
    typeof location.state?.volverA ===
    "string"
      ? location.state.volverA
      : "";

  const [
    contextoInicial,
  ] = useState(
    () =>
      leerContextoAuth()
  );

  const destinoDespuesDeRegistro =
    destinoAuthSeguro(volverARecibido, "") ||
    contextoInicial?.volverA ||
    "/mi-cuenta";

  const vieneDePublicar =
    destinoDespuesDeRegistro.startsWith(
      "/publicar"
    );

  const vieneDePublicacion =
    destinoDespuesDeRegistro.startsWith(
      "/publicacion/"
    );

  const [
    nombre,
    setNombre,
  ] = useState(
    borradorInicial.nombre
  );

  const [
    apellido,
    setApellido,
  ] = useState(
    borradorInicial.apellido
  );

  const [
    telefono,
    setTelefono,
  ] = useState(
    borradorInicial.telefono
  );

  const [
    email,
    setEmail,
  ] = useState(
    borradorInicial.email
  );

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    repetirPassword,
    setRepetirPassword,
  ] = useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    aceptaTerminos,
    setAceptaTerminos,
  ] = useState(
    borradorInicial.aceptaTerminos
  );

  const [
    registrando,
    setRegistrando,
  ] = useState(false);

  const [
    metodoAcceso,
    setMetodoAcceso,
  ] = useState("selector");

  useEffect(() => {
    guardarContextoAuth(volverARecibido);
  }, [volverARecibido]);

  useEffect(() => {
    guardarBorradorRegistro({
      nombre,
      apellido,
      telefono,
      email,
      aceptaTerminos,
    });
  }, [
    nombre,
    apellido,
    telefono,
    email,
    aceptaTerminos,
  ]);

  async function crearCuenta(
    event
  ) {
    event.preventDefault();
    if (envioEnCurso.current) return;

    if (
      !nombre.trim() ||
      !apellido.trim() ||
      !telefono.trim() ||
      !email.trim() ||
      !password ||
      !repetirPassword
    ) {
      alert(
        "Completá todos los datos para crear tu cuenta."
      );

      return;
    }

    if (
      password !==
      repetirPassword
    ) {
      alert(
        "Las contraseñas no coinciden."
      );

      return;
    }

    if (!aceptaTerminos) {
      alert(
        "Para crear tu cuenta necesitás aceptar los Términos y Condiciones y la Política de Privacidad."
      );

      return;
    }

    try {
      envioEnCurso.current = true;
      setRegistrando(true);
      guardarContextoAuth(destinoDespuesDeRegistro);

      const resultado =
        await registrarUsuario({
          nombre:
            nombre.trim(),

          apellido:
            apellido.trim(),

          telefono:
            telefono.trim(),

          email:
            email.trim(),

          password,
        });

      if (!activoRef.current) return;

      if (!resultado.ok) {
        alert(
          resultado.mensaje
        );

        return;
      }

      borrarBorradorRegistro();

      if (
        resultado.requiereConfirmacion
      ) {
        alert(
          vieneDePublicar
            ? "Cuenta creada. Revisá tu email para confirmarla. Tu publicación quedó guardada y, después de ingresar, seguimos desde donde estabas."
            : vieneDePublicacion
              ? "Cuenta creada. Revisá tu email para confirmarla. Después de ingresar volvemos a la publicación donde estabas."
              : "Cuenta creada. Revisá tu email para confirmarla y después ingresá a Nos Sirve."
        );

        navigate(
          "/ingresar",
          {
            replace: true,

            state: {
              volverA:
                destinoDespuesDeRegistro,
            },
          }
        );

        return;
      }

      marcarIngresoRealizado();

      borrarContextoAuth();

      navigate(
        destinoDespuesDeRegistro,
        {
          replace: true,
        }
      );
    } catch (error) {
      if (!activoRef.current) return;
      console.error(
        "Error al crear cuenta:",
        error
      );

      alert(
        "No se pudo crear la cuenta."
      );
    } finally {
      envioEnCurso.current = false;
      if (activoRef.current) setRegistrando(false);
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

  return (
    <PantallaNosSirve
      titulo="Crear cuenta"
      centrarContenido={metodoAcceso === "selector"}
    >
      <div
          style={{
            width: "100%",
            maxWidth: "390px",
            margin:
              metodoAcceso === "selector"
                ? "0 auto"
                : "16px auto 0",
            paddingBottom: "28px",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              margin:
                "0 0 22px",
              fontSize: "16px",
              lineHeight: 1.45,
              color: "#6d6258",
              textAlign: "center",
            }}
          >
            {vieneDePublicar ? (
              <>
                Un último paso para
                <br />
                publicar tu objeto.
              </>
            ) : vieneDePublicacion ? (
              <>
                Creá tu cuenta para
                <br />
                continuar con tu propuesta.
              </>
            ) : (
              <>
                Sumate a la comunidad y dale
                <br />
                una nueva oportunidad a tus objetos.
              </>
            )}
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
                lineHeight: 1.4,
                textAlign:
                  "center",
              }}
            >
              {vieneDePublicar
                ? "✦ Todo lo que preparaste está guardado. Después de crear tu cuenta seguimos con tu publicación."
                : "✦ Después de crear tu cuenta volvemos a la publicación donde estabas."}
            </div>
          )}

          {metodoAcceso === "selector" ? (
            <SelectorAccesoNosSirve
              modo="registro"
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
                ← Otras formas de crear tu cuenta
              </button>

          <form
            onSubmit={
              crearCuenta
            }
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            <div style={campo}>
              <span style={icono}>
                <IconoUsuario />
              </span>

              <input
                type="text"
                placeholder="Nombre"
                autoComplete="given-name"
                value={nombre}
                disabled={
                  registrando
                }
                onChange={(
                  event
                ) =>
                  setNombre(
                    event.target.value
                  )
                }
                style={input}
              />
            </div>

            <div style={campo}>
              <span style={icono}>
                <IconoUsuario />
              </span>

              <input
                type="text"
                placeholder="Apellido"
                autoComplete="family-name"
                value={apellido}
                disabled={
                  registrando
                }
                onChange={(
                  event
                ) =>
                  setApellido(
                    event.target.value
                  )
                }
                style={input}
              />
            </div>

            <div style={campo}>
              <span style={icono}>
                <IconoTelefono />
              </span>

              <input
                type="tel"
                inputMode="tel"
                placeholder="Teléfono"
                autoComplete="tel"
                value={telefono}
                disabled={
                  registrando
                }
                onChange={(
                  event
                ) =>
                  setTelefono(
                    event.target.value
                  )
                }
                style={input}
              />
            </div>

            <div style={campo}>
              <span style={icono}>
                <IconoEmail />
              </span>

              <input
                type="email"
                inputMode="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                disabled={
                  registrando
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                style={input}
              />
            </div>

            <div style={campo}>
              <span style={icono}>
                <IconoCandado />
              </span>

              <input
                type={
                  mostrarPassword
                    ? "text"
                    : "password"
                }
                placeholder="Contraseña"
                autoComplete="new-password"
                value={password}
                disabled={
                  registrando
                }
                onChange={(
                  event
                ) =>
                  setPassword(
                    event.target.value
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

            <div style={campo}>
              <span style={icono}>
                <IconoCandado />
              </span>

              <input
                type={
                  mostrarPassword
                    ? "text"
                    : "password"
                }
                placeholder="Repetir contraseña"
                autoComplete="new-password"
                value={
                  repetirPassword
                }
                disabled={
                  registrando
                }
                onChange={(
                  event
                ) =>
                  setRepetirPassword(
                    event.target.value
                  )
                }
                style={input}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "12px",
                padding:
                  "13px 16px",
                borderRadius:
                  "15px",
                background:
                  "#edf2ee",
                fontSize:
                  "14px",
                lineHeight: 1.4,
                color:
                  "#465154",
                marginTop:
                  "2px",
              }}
            >
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius:
                    "50%",
                  display: "grid",
                  placeItems:
                    "center",
                  background:
                    "#dcebe7",
                  color:
                    "#0d605b",
                  flexShrink: 0,
                }}
              >
                <IconoEscudo />
              </span>

              <span>
                Tus datos adicionales se pedirán solo cuando sean necesarios para una operación.
              </span>
            </div>

            <label
              style={{
                display: "flex",
                alignItems:
                  "flex-start",
                gap: "12px",
                padding:
                  "5px 6px",
                fontSize:
                  "14px",
                lineHeight: 1.45,
                color:
                  "#3e4a4d",
              }}
            >
              <input
                type="checkbox"
                checked={
                  aceptaTerminos
                }
                disabled={
                  registrando
                }
                onChange={(
                  event
                ) =>
                  setAceptaTerminos(
                    event.target.checked
                  )
                }
                style={{
                  width: "22px",
                  height: "22px",
                  marginTop:
                    "1px",
                  flexShrink: 0,
                  accentColor:
                    "#0d605b",
                }}
              />

              <span>
                Acepto los{" "}
                <strong
                  style={{
                    color:
                      "#0d605b",
                  }}
                >
                  términos y condiciones
                </strong>{" "}
                y la{" "}
                <strong
                  style={{
                    color:
                      "#0d605b",
                  }}
                >
                  política de privacidad
                </strong>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={
                registrando
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
                fontWeight: 700,
                fontSize:
                  "17px",
                cursor:
                  registrando
                    ? "default"
                    : "pointer",
                boxShadow:
                  "0 8px 20px rgba(7, 94, 89, 0.18)",
                marginTop:
                  "5px",
              }}
            >
              {registrando
                ? "Creando cuenta..."
                : "Crear cuenta"}

              {!registrando && (
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
              paddingBottom:
                "8px",
            }}
          >
            ¿Ya tenés cuenta?{" "}

            <Link
              to="/ingresar"
              state={{
                volverA:
                  destinoDespuesDeRegistro,
              }}
              style={{
                color:
                  "#0d605b",
                fontWeight: 700,
                textDecoration:
                  "none",
              }}
            >
              Ingresar
            </Link>
          </div>

          {(vieneDePublicar ||
            vieneDePublicacion) && (
            <div
              style={{
                textAlign:
                  "center",
                marginTop:
                  "22px",
              }}
            >
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
            </div>
          )}
        </div>

    </PantallaNosSirve>
  );
}

export default Registro;
