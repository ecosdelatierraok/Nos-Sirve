from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from rembg import remove, new_session
from PIL import Image
import io

app = FastAPI(
    title="Nos Sirve - Curaduría de Imágenes",
    version="1.0"
)

MODELO = "u2net"
TAMANIO_FINAL = 1200
MARGEN = 120
CALIDAD_WEBP = 88

session = new_session(MODELO)


def crear_imagen_curada(datos_originales: bytes) -> bytes:
    datos_sin_fondo = remove(
        datos_originales,
        session=session,
    )

    imagen = Image.open(
        io.BytesIO(datos_sin_fondo)
    ).convert("RGBA")

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

    salida = io.BytesIO()

    lienzo.save(
        salida,
        format="WEBP",
        quality=CALIDAD_WEBP,
        method=6,
    )

    return salida.getvalue()


@app.get("/health")
def health():
    return {
        "ok": True,
        "servicio": "curaduria-nos-sirve",
        "modelo": MODELO,
        "salida": "1200x1200 WebP fondo blanco",
    }


@app.post("/curar")
async def curar_imagen(
    archivo: UploadFile = File(...)
):
    if not archivo.content_type:
        raise HTTPException(
            status_code=400,
            detail="Archivo inválido.",
        )

    if not archivo.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser una imagen.",
        )

    try:
        datos_originales = await archivo.read()

        resultado = crear_imagen_curada(
            datos_originales
        )

        return Response(
            content=resultado,
            media_type="image/webp",
            headers={
                "Content-Disposition":
                    'inline; filename="imagen-curada.webp"'
            },
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )