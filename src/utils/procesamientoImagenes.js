import * as ort from "onnxruntime-web";

const TAMANO_MODELO = 320;
const TAMANO_SALIDA = 1200;
const MARGEN_RELATIVO = 0.08;

let sesionModelo = null;

async function cederControl() {
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

async function cargarModelo() {
  if (sesionModelo) {
    return sesionModelo;
  }

  const modelUrl =
    import.meta.env.VITE_U2NET_MODEL_URL?.trim() ||
    "/models/u2net.onnx";

  sesionModelo =
    await ort.InferenceSession.create(
      modelUrl,
      {
        executionProviders: ["wasm"],
      }
    );

  return sesionModelo;
}

function cargarImagenDesdeArchivo(
  archivo
) {
  return new Promise(
    (resolve, reject) => {
      const url =
        URL.createObjectURL(
          archivo
        );

      const imagen =
        new Image();

      imagen.onload = () => {
        URL.revokeObjectURL(
          url
        );

        resolve(imagen);
      };

      imagen.onerror = () => {
        URL.revokeObjectURL(
          url
        );

        reject(
          new Error(
            "No se pudo leer la imagen."
          )
        );
      };

      imagen.src = url;
    }
  );
}

function crearCanvas(
  ancho,
  alto
) {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = ancho;
  canvas.height = alto;

  return canvas;
}

function crearCanvasModelo(
  imagen
) {
  const canvas =
    crearCanvas(
      TAMANO_MODELO,
      TAMANO_MODELO
    );

  const contexto =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      }
    );

  contexto.drawImage(
    imagen,
    0,
    0,
    imagen.naturalWidth,
    imagen.naturalHeight,
    0,
    0,
    TAMANO_MODELO,
    TAMANO_MODELO
  );

  return canvas;
}

function crearTensorDesdeCanvas(
  canvas
) {
  const contexto =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      }
    );

  const { data } =
    contexto.getImageData(
      0,
      0,
      TAMANO_MODELO,
      TAMANO_MODELO
    );

  const cantidadPixeles =
    TAMANO_MODELO *
    TAMANO_MODELO;

  const tensor =
    new Float32Array(
      3 *
        cantidadPixeles
    );

  const medias = [
    0.485,
    0.456,
    0.406,
  ];

  const desvios = [
    0.229,
    0.224,
    0.225,
  ];

  for (
    let i = 0;
    i <
    cantidadPixeles;
    i += 1
  ) {
    const indice =
      i * 4;

    const rojo =
      data[indice] /
      255;

    const verde =
      data[
        indice + 1
      ] / 255;

    const azul =
      data[
        indice + 2
      ] / 255;

    tensor[i] =
      (rojo -
        medias[0]) /
      desvios[0];

    tensor[
      cantidadPixeles + i
    ] =
      (verde -
        medias[1]) /
      desvios[1];

    tensor[
      cantidadPixeles *
        2 +
        i
    ] =
      (azul -
        medias[2]) /
      desvios[2];
  }

  return new ort.Tensor(
    "float32",
    tensor,
    [
      1,
      3,
      TAMANO_MODELO,
      TAMANO_MODELO,
    ]
  );
}

function normalizarMascara(
  datos
) {
  let minimo = Infinity;
  let maximo = -Infinity;

  for (
    let i = 0;
    i <
    datos.length;
    i += 1
  ) {
    minimo =
      Math.min(
        minimo,
        datos[i]
      );

    maximo =
      Math.max(
        maximo,
        datos[i]
      );
  }

  const rango =
    maximo -
    minimo;

  const resultado =
    new Float32Array(
      datos.length
    );

  if (rango <= 0) {
    return resultado;
  }

  for (
    let i = 0;
    i <
    datos.length;
    i += 1
  ) {
    resultado[i] =
      (datos[i] -
        minimo) /
      rango;
  }

  return resultado;
}

async function obtenerMascaraAutomatica(
  imagen
) {
  const sesion =
    await cargarModelo();

  const canvas =
    crearCanvasModelo(
      imagen
    );

  const entrada =
    crearTensorDesdeCanvas(
      canvas
    );

  const nombreEntrada =
    sesion.inputNames[0];

  const resultados =
    await sesion.run({
      [nombreEntrada]:
        entrada,
    });

  const nombreSalida =
    sesion.outputNames[0];

  return normalizarMascara(
    resultados[
      nombreSalida
    ].data
  );
}

function suavizarAlpha(
  valor
) {
  if (valor <= 0.03) {
    return 0;
  }

  if (valor >= 0.82) {
    return 1;
  }

  return (
    (valor - 0.03) /
    0.79
  );
}

function crearMascaraCanvas(
  mascara
) {
  const canvas =
    crearCanvas(
      TAMANO_MODELO,
      TAMANO_MODELO
    );

  const contexto =
    canvas.getContext(
      "2d"
    );

  const imagenMascara =
    contexto.createImageData(
      TAMANO_MODELO,
      TAMANO_MODELO
    );

  for (
    let i = 0;
    i <
    mascara.length;
    i += 1
  ) {
    const alpha =
      suavizarAlpha(
        mascara[i]
      );

    const valor =
      Math.round(
        alpha * 255
      );

    const indice =
      i * 4;

    imagenMascara.data[
      indice
    ] = 255;

    imagenMascara.data[
      indice + 1
    ] = 255;

    imagenMascara.data[
      indice + 2
    ] = 255;

    imagenMascara.data[
      indice + 3
    ] = valor;
  }

  contexto.putImageData(
    imagenMascara,
    0,
    0
  );

  return canvas;
}

function obtenerLimitesObjeto(
  mascara
) {
  let minimoX =
    TAMANO_MODELO;

  let minimoY =
    TAMANO_MODELO;

  let maximoX = 0;
  let maximoY = 0;

  let encontrado = false;

  for (
    let y = 0;
    y <
    TAMANO_MODELO;
    y += 1
  ) {
    for (
      let x = 0;
      x <
      TAMANO_MODELO;
      x += 1
    ) {
      const valor =
        mascara[
          y *
            TAMANO_MODELO +
            x
        ];

      if (valor >= 0.08) {
        encontrado = true;

        minimoX =
          Math.min(
            minimoX,
            x
          );

        minimoY =
          Math.min(
            minimoY,
            y
          );

        maximoX =
          Math.max(
            maximoX,
            x
          );

        maximoY =
          Math.max(
            maximoY,
            y
          );
      }
    }
  }

  if (!encontrado) {
    return {
      x: 0,
      y: 0,
      ancho:
        TAMANO_MODELO,
      alto:
        TAMANO_MODELO,
    };
  }

  const margen = 5;

  minimoX =
    Math.max(
      0,
      minimoX -
        margen
    );

  minimoY =
    Math.max(
      0,
      minimoY -
        margen
    );

  maximoX =
    Math.min(
      TAMANO_MODELO -
        1,
      maximoX +
        margen
    );

  maximoY =
    Math.min(
      TAMANO_MODELO -
        1,
      maximoY +
        margen
    );

  return {
    x: minimoX,
    y: minimoY,

    ancho:
      maximoX -
      minimoX +
      1,

    alto:
      maximoY -
      minimoY +
      1,
  };
}

function crearObjetoRecortado(
  imagen,
  mascara
) {
  const canvasOriginal =
    crearCanvas(
      imagen.naturalWidth,
      imagen.naturalHeight
    );

  const contextoOriginal =
    canvasOriginal.getContext(
      "2d"
    );

  contextoOriginal.drawImage(
    imagen,
    0,
    0
  );

  const mascara320 =
    crearMascaraCanvas(
      mascara
    );

  const mascaraGrande =
    crearCanvas(
      imagen.naturalWidth,
      imagen.naturalHeight
    );

  const contextoMascara =
    mascaraGrande.getContext(
      "2d"
    );

  contextoMascara.imageSmoothingEnabled =
    true;

  contextoMascara.imageSmoothingQuality =
    "high";

  contextoMascara.drawImage(
    mascara320,
    0,
    0,
    imagen.naturalWidth,
    imagen.naturalHeight
  );

  contextoOriginal.globalCompositeOperation =
    "destination-in";

  contextoOriginal.drawImage(
    mascaraGrande,
    0,
    0
  );

  contextoOriginal.globalCompositeOperation =
    "source-over";

  return canvasOriginal;
}

function convertirLimitesAOriginal(
  limites,
  imagen
) {
  const escalaX =
    imagen.naturalWidth /
    TAMANO_MODELO;

  const escalaY =
    imagen.naturalHeight /
    TAMANO_MODELO;

  return {
    x:
      limites.x *
      escalaX,

    y:
      limites.y *
      escalaY,

    ancho:
      limites.ancho *
      escalaX,

    alto:
      limites.alto *
      escalaY,
  };
}

function crearSalidaObjetoPrincipal(
  imagen,
  mascara
) {
  const limites320 =
    obtenerLimitesObjeto(
      mascara
    );

  const limites =
    convertirLimitesAOriginal(
      limites320,
      imagen
    );

  const objetoRecortado =
    crearObjetoRecortado(
      imagen,
      mascara
    );

  const salida =
    crearCanvas(
      TAMANO_SALIDA,
      TAMANO_SALIDA
    );

  const contexto =
    salida.getContext(
      "2d"
    );

  contexto.fillStyle =
    "#ffffff";

  contexto.fillRect(
    0,
    0,
    TAMANO_SALIDA,
    TAMANO_SALIDA
  );

  const espacioUtil =
    TAMANO_SALIDA *
    (1 -
      MARGEN_RELATIVO *
        2);

  const escala =
    Math.min(
      espacioUtil /
        limites.ancho,

      espacioUtil /
        limites.alto
    );

  const anchoDestino =
    limites.ancho *
    escala;

  const altoDestino =
    limites.alto *
    escala;

  const destinoX =
    (
      TAMANO_SALIDA -
      anchoDestino
    ) / 2;

  const destinoY =
    (
      TAMANO_SALIDA -
      altoDestino
    ) / 2;

  contexto.imageSmoothingEnabled =
    true;

  contexto.imageSmoothingQuality =
    "high";

  contexto.drawImage(
    objetoRecortado,

    limites.x,
    limites.y,
    limites.ancho,
    limites.alto,

    destinoX,
    destinoY,
    anchoDestino,
    altoDestino
  );

  return salida;
}

function crearSalidaConjuntoSeguro(
  imagen
) {
  const salida =
    crearCanvas(
      TAMANO_SALIDA,
      TAMANO_SALIDA
    );

  const contexto =
    salida.getContext(
      "2d"
    );

  contexto.fillStyle =
    "#ffffff";

  contexto.fillRect(
    0,
    0,
    TAMANO_SALIDA,
    TAMANO_SALIDA
  );

  /*
    Conservamos TODA la foto.

    En modo conjunto no quitamos
    fondo ni intentamos decidir
    qué objetos forman parte.

    La fidelidad tiene prioridad.
  */
  const margen = 0.045;

  const espacioUtil =
    TAMANO_SALIDA *
    (1 - margen * 2);

  const anchoOriginal =
    imagen.naturalWidth;

  const altoOriginal =
    imagen.naturalHeight;

  const escala =
    Math.min(
      espacioUtil /
        anchoOriginal,

      espacioUtil /
        altoOriginal
    );

  const anchoDestino =
    anchoOriginal *
    escala;

  const altoDestino =
    altoOriginal *
    escala;

  const destinoX =
    (
      TAMANO_SALIDA -
      anchoDestino
    ) / 2;

  const destinoY =
    (
      TAMANO_SALIDA -
      altoDestino
    ) / 2;

  contexto.imageSmoothingEnabled =
    true;

  contexto.imageSmoothingQuality =
    "high";

  contexto.drawImage(
    imagen,
    0,
    0,
    anchoOriginal,
    altoOriginal,
    destinoX,
    destinoY,
    anchoDestino,
    altoDestino
  );

  return salida;
}

function canvasABlob(
  canvas
) {
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "No se pudo generar la imagen procesada."
              )
            );

            return;
          }

          resolve(blob);
        },

        "image/webp",
        0.92
      );
    }
  );
}

function crearNombreArchivo(
  archivoOriginal,
  modo
) {
  const nombreBase =
    archivoOriginal.name
      .replace(
        /\.[^/.]+$/,
        ""
      )
      .replace(
        /[^a-zA-Z0-9-_]/g,
        "-"
      );

  return `${nombreBase}-${modo}-nos-sirve.webp`;
}

export async function procesarImagenFondoBlanco(
  archivo,
  opciones = {}
) {
  if (!archivo) {
    throw new Error(
      "No se recibió ninguna imagen."
    );
  }

  if (
    !archivo.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "El archivo seleccionado no es una imagen."
    );
  }

  const modo =
    opciones.modo ===
    "conjunto"
      ? "conjunto"
      : "automatico";

  const imagen =
    await cargarImagenDesdeArchivo(
      archivo
    );

  await cederControl();

  let salida;

  if (
    modo === "conjunto"
  ) {
    /*
      SIN IA DE RECORTE.

      Es rápido, conserva todos
      los objetos y evita halos,
      amputaciones o elementos
      desaparecidos.
    */
    salida =
      crearSalidaConjuntoSeguro(
        imagen
      );
  } else {
    const mascara =
      await obtenerMascaraAutomatica(
        imagen
      );

    await cederControl();

    salida =
      crearSalidaObjetoPrincipal(
        imagen,
        mascara
      );
  }

  const blob =
    await canvasABlob(
      salida
    );

  return new File(
    [blob],
    crearNombreArchivo(
      archivo,
      modo
    ),
    {
      type:
        "image/webp",

      lastModified:
        Date.now(),
    }
  );
}
