from rembg import remove, new_session
from PIL import Image
from pathlib import Path
import sys
import io

TAMANIO_FINAL = 1200
MARGEN = 120
CALIDAD_WEBP = 88
MODELO = "u2net"


def preparar_objeto_sin_fondo(ruta_entrada):
    session = new_session(MODELO)

    with open(ruta_entrada, "rb") as archivo:
        datos_entrada = archivo.read()

    datos_salida = remove(
        datos_entrada,
        session=session,
    )

    imagen = Image.open(
        io.BytesIO(datos_salida)
    ).convert("RGBA")

    return imagen


def componer_en_blanco(imagen):
    alfa = imagen.getchannel("A")
    caja_objeto = alfa.getbbox()

    if caja_objeto is None:
        raise ValueError(
            "No se encontró ningún objeto visible."
        )

    objeto = imagen.crop(caja_objeto)

    espacio_util = TAMANIO_FINAL - (MARGEN * 2)

    ancho, alto = objeto.size

    escala = min(
        espacio_util / ancho,
        espacio_util / alto,
    )

    nuevo_ancho = max(
        1,
        round(ancho * escala),
    )

    nuevo_alto = max(
        1,
        round(alto * escala),
    )

    objeto = objeto.resize(
        (nuevo_ancho, nuevo_alto),
        Image.Resampling.LANCZOS,
    )

    lienzo = Image.new(
        "RGB",
        (TAMANIO_FINAL, TAMANIO_FINAL),
        "white",
    )

    x = (TAMANIO_FINAL - nuevo_ancho) // 2
    y = (TAMANIO_FINAL - nuevo_alto) // 2

    lienzo.paste(
        objeto,
        (x, y),
        objeto,
    )

    return lienzo, nuevo_ancho, nuevo_alto


def procesar_imagen(entrada, salida):
    entrada = Path(entrada)
    salida = Path(salida)

    if not entrada.exists():
        raise FileNotFoundError(
            f"No existe la imagen de entrada: {entrada}"
        )

    print("1/3 Quitando fondo...")

    sin_fondo = preparar_objeto_sin_fondo(
        entrada
    )

    print("2/3 Armando lienzo 1200x1200...")

    final, ancho_objeto, alto_objeto = (
        componer_en_blanco(
            sin_fondo
        )
    )

    print("3/3 Guardando WebP...")

    final.save(
        salida,
        "WEBP",
        quality=CALIDAD_WEBP,
        method=6,
    )

    print("")
    print("CURADURIA COMPLETA OK")
    print(f"Modelo: {MODELO}")
    print(f"Entrada: {entrada}")
    print(f"Salida: {salida}")
    print(
        f"Tamaño final: {TAMANIO_FINAL}x{TAMANIO_FINAL}"
    )
    print(
        f"Objeto final: {ancho_objeto}x{alto_objeto}"
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            "Uso: python procesar_imagen.py entrada salida.webp"
        )
        sys.exit(1)

    procesar_imagen(
        sys.argv[1],
        sys.argv[2],
    )