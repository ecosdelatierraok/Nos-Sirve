import CabeceraNosSirve from "./CabeceraNosSirve";

function PantallaNosSirve({
  children,
  titulo = "",
  subtitulo = "",
  mostrarVolver = false,
  mostrarAyuda = false,
  onVolver,
  onAyuda,
  izquierda = null,
  derecha = null,
  extraCabecera = null,
  fijarSubtitulo = true,
  centrarContenido = false,
  className = "",
  contenidoClassName = "",
}) {
  const clasesContenido = [
    "ns-pantalla-contenido",
    centrarContenido ? "ns-pantalla-contenido-centrado" : "",
    contenidoClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const subtituloFijo = fijarSubtitulo ? subtitulo : "";
  const subtituloEnScroll = !fijarSubtitulo && subtitulo;

  return (
    <main className="sv-pantalla-fondo">
      <section className={`sv-pantalla-app ns-pantalla ${className}`.trim()}>
        <CabeceraNosSirve
          titulo={titulo}
          subtitulo={subtituloFijo}
          mostrarVolver={mostrarVolver}
          mostrarAyuda={mostrarAyuda}
          onVolver={onVolver}
          onAyuda={onAyuda}
          izquierda={izquierda}
          derecha={derecha}
          extraInferior={extraCabecera}
        />

        <div className={clasesContenido}>
          {subtituloEnScroll ? (
            <div className="ns-pantalla-subtitulo-scroll">
              {subtitulo}
            </div>
          ) : null}

          {children}
        </div>
      </section>
    </main>
  );
}

export default PantallaNosSirve;
