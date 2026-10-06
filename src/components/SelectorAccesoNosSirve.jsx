function IconoGoogle() {
  return (
    <span
      className="ns-auth-provider-letra ns-auth-provider-google"
      aria-hidden="true"
    >
      G
    </span>
  );
}

function IconoFacebook() {
  return (
    <span
      className="ns-auth-provider-letra ns-auth-provider-facebook"
      aria-hidden="true"
    >
      f
    </span>
  );
}

function IconoEmail() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m4.5 7 7.5 5.4L19.5 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectorAccesoNosSirve({
  modo = "ingresar",
  onEmail,
}) {
  const esRegistro = modo === "registro";
  const verbo = esRegistro ? "Crear cuenta" : "Continuar";

  return (
    <div className="ns-auth-selector" aria-label="Opciones de acceso">
      <button
        type="button"
        className="ns-auth-provider ns-auth-provider-pendiente"
        disabled
        aria-disabled="true"
        title="Se conectará en el bloque de autenticación"
      >
        <IconoGoogle />
        <span>{verbo} con Google</span>
        <small>Próximamente</small>
      </button>

      <button
        type="button"
        className="ns-auth-provider ns-auth-provider-pendiente"
        disabled
        aria-disabled="true"
        title="Se conectará en el bloque de autenticación"
      >
        <IconoFacebook />
        <span>{verbo} con Facebook</span>
        <small>Próximamente</small>
      </button>

      <div className="ns-auth-separador">
        <span />
        <b>o</b>
        <span />
      </div>

      <button
        type="button"
        className="ns-auth-provider ns-auth-provider-email"
        onClick={onEmail}
      >
        <IconoEmail />
        <span>{verbo} con email</span>
      </button>
    </div>
  );
}

export default SelectorAccesoNosSirve;
