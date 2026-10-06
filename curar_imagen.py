from PIL import Image
import sys
from pathlib import Path

TAMANIO_FINAL = 1200
MARGEN = 120
CALIDAD_WEBP = 88


def curar_imagen(entrada, salida):
    entrada = Path(entrada)
    salida = Path(salida)

    imagen = Image.open(entrada).convert("RGBA")

    alfa = imagen.getchannel("A")
    caja_objeto = alfa.getbbox()

    if caja_objeto is None:
        raise ValueError(
            "No se encontró ningún objeto visible en la imagen."
        )

    objeto = imagen.crop(caja_objeto)

    espacio_util = TAMANIO_FINAL - (MARGEN * 2)

    ancho, alto = objeto.size

    escala = min(
        espacio_util / ancho,
        espacio_util / alto,
    )

    nuevo_ancho = max(1, round(ancho * escala))
    nuevo_alto = max(1, round(alto * escala))

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

    lienzo.save(
        salida,
        "WEBP",
        quality=CALIDAD_WEBP,
        method=6,
    )

    print("CURADURIA OK")
    print(f"Entrada: {entrada}")
    print(f"Salida: {salida}")
    print(f"Tamaño final: {TAMANIO_FINAL}x{TAMANIO_FINAL}")
    print(f"Objeto: {nuevo_ancho}x{nuevo_alto}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            "Uso: python curar_imagen.py entrada.png salida.webp"
        )
        sys.exit(1)

    curar_imagen(
        sys.argv[1],
        sys.argv[2],
    )