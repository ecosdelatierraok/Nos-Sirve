import { useNavigate } from "react-router-dom";

function Logo({ maxWidth = "var(--ns-header-logo-width, 252px)", className = "" }) {
  const navigate = useNavigate();

  function irAlInicio() {
    navigate("/");
  }

  return (
    <button
      type="button"
      onClick={irAlInicio}
      aria-label="Ir al inicio de Nos Sirve"
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth,
        margin: "0 auto",
        padding: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <img
        src="/logo-nos-sirve.png"
        alt="Nos Sirve. Lo que ya no usás, a alguien le sirve."
        draggable="false"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          margin: 0,
          padding: 0,
          border: "none",
          objectFit: "contain",
          userSelect: "none",
        }}
      />
    </button>
  );
}

export default Logo;
