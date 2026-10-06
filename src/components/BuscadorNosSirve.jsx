function IconoBuscar() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
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

function FilaBuscador({
  inputRef,
  value,
  onChange,
  placeholder = "¿Qué estás buscando?",
  ariaLabel = "Buscar objetos",
  accionDerecha = null,
}) {
  return (
    <div className="ns-buscador-fila">
      <label className="ns-buscador-campo">
        <IconoBuscar />

        <input
          ref={inputRef}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          enterKeyHint="search"
          onChange={onChange}
        />
      </label>

      {accionDerecha ? (
        <div className="ns-buscador-accion">
          {accionDerecha}
        </div>
      ) : null}
    </div>
  );
}

function BuscadorNosSirve({
  as = "div",
  onSubmit,
  inputRef,
  value,
  onChange,
  placeholder,
  ariaLabel,
  accionDerecha = null,
  className = "",
}) {
  const clases = [
    "ns-buscador-bloque",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const contenido = (
    <FilaBuscador
      inputRef={inputRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      accionDerecha={accionDerecha}
    />
  );

  if (as === "form") {
    return (
      <form
        className={clases}
        onSubmit={onSubmit}
      >
        {contenido}
      </form>
    );
  }

  return (
    <div className={clases}>
      {contenido}
    </div>
  );
}

export default BuscadorNosSirve;
