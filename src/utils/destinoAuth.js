// Solo rutas internas conocidas; nunca interpretar URLs externas como retornos.
export function destinoAuthSeguro(valor, fallback = "/") {
  if (typeof valor !== "string" || /[\\\s]/.test(valor) || [...valor].some((letra) => letra.charCodeAt(0) < 32)) return fallback;
  const ruta = valor.split(/[?#]/, 1)[0];
  if (!/^\/(?:publicaciones|mi-cuenta|mis-publicaciones|mis-propuestas|mensajes|publicar(?:\/(?:fotos|captura|analizando|valor|revision|ubicacion|confirmar))?|publicacion\/(?:id\/)?[\w-]+|nueva-publicacion|editar-publicacion\/[\w-]+)?$/.test(ruta)) return fallback;
  return valor;
}

const CLAVE_CONTEXTO = "nos-sirve-contexto-registro";
const DURACION_CONTEXTO = 24 * 60 * 60 * 1000;

export function borrarContextoAuth() {
  try {
    localStorage.removeItem(CLAVE_CONTEXTO);
  } catch {
    // No impide el ingreso si el navegador restringe el almacenamiento.
  }
}

export function guardarContextoAuth(destino) {
  const volverA = destinoAuthSeguro(destino, "");
  if (!volverA) return;
  try {
    localStorage.setItem(CLAVE_CONTEXTO, JSON.stringify({ volverA, guardadoEn: Date.now() }));
  } catch {
    // El retorno recibido por el router sigue disponible en esta pestaña.
  }
}

export function leerContextoAuth() {
  try {
    const guardado = localStorage.getItem(CLAVE_CONTEXTO);
    if (!guardado) return null;
    const datos = JSON.parse(guardado);
    const volverA = destinoAuthSeguro(datos?.volverA, "");
    const antiguedad = Date.now() - datos?.guardadoEn;
    if (!volverA || typeof datos?.guardadoEn !== "number" ||
        !Number.isFinite(antiguedad) || antiguedad < 0 || antiguedad > DURACION_CONTEXTO) {
      borrarContextoAuth();
      return null;
    }
    return { volverA };
  } catch {
    borrarContextoAuth();
    return null;
  }
}
