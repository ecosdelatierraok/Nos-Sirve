const CONTRATOS = [
  { id: "inicio", patron: /^\/$/, contexto: "ticker-buscador" },
  { id: "buscar", patron: /^\/publicaciones\/?$/, contexto: "titulo-buscador-filtros" },
  { id: "detalle", patron: /^\/publicacion(?:\/id)?\/[^/]+\/?$/, contexto: "titulo-publicacion" },
  { id: "publicar-inicio", patron: /^\/publicar\/?$/, contexto: "titulo-subtitulo" },
  { id: "publicar-fotos", patron: /^\/publicar\/fotos\/?$/, contexto: "solo-titulo" },
  { id: "publicar-captura", patron: /^\/publicar\/captura\/?$/, contexto: "titulo-subtitulo" },
  { id: "publicar-analizando", patron: /^\/publicar\/analizando\/?$/, contexto: "titulo-subtitulo" },
  { id: "publicar-valor", patron: /^\/publicar\/valor\/?$/, contexto: "titulo-subtitulo" },
  { id: "publicar-revision", patron: /^\/publicar\/revision\/?$/, contexto: "titulo-subtitulo" },
  { id: "publicar-ubicacion", patron: /^\/publicar\/ubicacion\/?$/, contexto: "titulo-subtitulo" },
  { id: "publicar-confirmar", patron: /^\/publicar\/confirmar\/?$/, contexto: "titulo-subtitulo" },
  { id: "nueva-publicacion", patron: /^\/nueva-publicacion\/?$/, contexto: "titulo-subtitulo" },
  { id: "editar-publicacion", patron: /^\/editar-publicacion\/[^/]+\/?$/, contexto: "titulo-subtitulo" },
  { id: "configuracion", patron: /^\/configuracion\/?$/, contexto: "titulo" },
  { id: "registro", patron: /^\/registro\/?$/, contexto: "titulo" },
  { id: "ingresar", patron: /^\/ingresar\/?$/, contexto: "titulo" },
  { id: "mi-cuenta", patron: /^\/mi-cuenta\/?$/, contexto: "titulo" },
  { id: "mis-publicaciones", patron: /^\/mis-publicaciones\/?$/, contexto: "titulo-subtitulo" },
  { id: "mis-propuestas", patron: /^\/mis-propuestas\/?$/, contexto: "titulo-subtitulo" },
  { id: "mensajes", patron: /^\/mensajes\/?$/, contexto: "titulo-filtros" },
];

export function obtenerContratoPantallaNosSirve(pathname) {
  const ruta = String(pathname || "/");

  return (
    CONTRATOS.find((contrato) =>
      contrato.patron.test(ruta)
    ) || null
  );
}

export function exigirContratoPantallaNosSirve(pathname) {
  const contrato = obtenerContratoPantallaNosSirve(pathname);

  if (!contrato && import.meta.env.DEV) {
    throw new Error(
      `[Nos Sirve] La ruta "${pathname}" no declara contrato de pantalla. ` +
        "Toda ruta funcional nueva debe agregarse a contratoPantallasNosSirve.js " +
        "antes de poder ejecutarse en desarrollo."
    );
  }

  return contrato;
}

export default CONTRATOS;
