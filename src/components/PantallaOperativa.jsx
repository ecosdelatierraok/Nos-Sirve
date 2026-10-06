import PantallaNosSirve from "./PantallaNosSirve";

function PantallaOperativa({
  children,
  titulo,
  subtitulo,
  mostrarVolver = true,
  mostrarAyuda = false,
  onVolver,
  onAyuda,
  fijarSubtitulo = true,
  className = "",
}) {
  return (
    <PantallaNosSirve
      titulo={titulo}
      subtitulo={subtitulo}
      mostrarVolver={mostrarVolver}
      mostrarAyuda={mostrarAyuda}
      onVolver={onVolver}
      onAyuda={onAyuda}
      fijarSubtitulo={fijarSubtitulo}
      className={className}
    >
      {children}
    </PantallaNosSirve>
  );
}

export default PantallaOperativa;
