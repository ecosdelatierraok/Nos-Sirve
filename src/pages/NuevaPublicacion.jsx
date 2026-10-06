import PantallaNosSirve from "../components/PantallaNosSirve";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  editarPublicacion,
  guardarPublicacion,
  obtenerPublicaciones,
} from "../utils/publicacionesStorage";

import { supabase } from "../lib/supabase";
import { procesarImagenFondoBlanco } from "../utils/procesamientoImagenes";

import "../App.css";

const BUCKET_IMAGENES = "publicaciones";
const MAX_FOTOS = 5;
const MAX_LADO_IMAGEN = 1200;
const CALIDAD_WEBP = 0.82;
const API_GEOREF = "https://apis.datos.gob.ar/georef/api";

function IconoCamara() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5 6.5 10 4.5h4l1.5 2H18a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3h2.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="13"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function IconoGaleria() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="9"
        cy="9"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m5.5 17 4.2-4.2 2.8 2.8 2.3-2.3 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoLuz() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 18h6M10 21h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M8.2 14.6C6.85 13.45 6 11.73 6 9.8A6 6 0 0 1 18 9.8c0 1.93-.85 3.65-2.2 4.8-.8.69-1.3 1.42-1.3 2.4h-5c0-.98-.5-1.71-1.3-2.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoObjeto() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m12 3 7 4-7 4-7-4 7-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M5 7v9l7 4 7-4V7M12 11v9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoUbicacion() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="11"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function Campo({
  label,
  children,
}) {
  return (
    <label className="campo-form">
      <span>{label}</span>
      {children}
    </label>
  );
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-AR");
}

function formatearPesosInput(valor) {
  const limpio =
    String(valor || "").replace(
      /\D/g,
      ""
    );

  if (!limpio) {
    return "";
  }

  return Number(
    limpio
  ).toLocaleString(
    "es-AR"
  );
}

function limpiarPrefijoBarrio(texto) {
  return String(texto || "")
    .replace(
      /^\s*barrio\s+/i,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function limpiarBarrioMientrasEscribe(texto) {
  return String(texto || "")
    .replace(
      /^\s*barrio(?:\s+|$)/i,
      ""
    )
    .replace(
      / {2,}/g,
      " "
    );
}

function capitalizarConConectores(
  texto,
  quitarBarrio = false
) {
  const conectores =
    new Set([
      "a",
      "ante",
      "bajo",
      "con",
      "contra",
      "de",
      "del",
      "desde",
      "durante",
      "en",
      "entre",
      "hacia",
      "hasta",
      "para",
      "por",
      "según",
      "sin",
      "sobre",
      "tras",
      "y",
      "e",
      "o",
      "u",
      "la",
      "las",
      "el",
      "los",
      "un",
      "una",
      "unos",
      "unas",
      "al",
    ]);

  const limpio =
    quitarBarrio
      ? limpiarPrefijoBarrio(
          texto
        )
      : String(
          texto || ""
        ).trim();

  return limpio
    .replace(
      /\s+/g,
      " "
    )
    .toLocaleLowerCase(
      "es-AR"
    )
    .split(
      " "
    )
    .filter(
      Boolean
    )
    .map(
      (
        palabra,
        indice
      ) => {
        if (
          indice > 0 &&
          conectores.has(
            palabra
          )
        ) {
          return palabra;
        }

        return (
          palabra
            .charAt(0)
            .toLocaleUpperCase(
              "es-AR"
            ) +
          palabra.slice(1)
        );
      }
    )
    .join(
      " "
    );
}

function distanciaLevenshtein(
  a,
  b
) {
  const x =
    normalizarTexto(
      a
    );

  const y =
    normalizarTexto(
      b
    );

  const matriz =
    Array.from(
      {
        length:
          x.length + 1,
      },
      () =>
        Array(
          y.length + 1
        ).fill(
          0
        )
    );

  for (
    let i = 0;
    i <= x.length;
    i += 1
  ) {
    matriz[i][0] = i;
  }

  for (
    let j = 0;
    j <= y.length;
    j += 1
  ) {
    matriz[0][j] = j;
  }

  for (
    let i = 1;
    i <= x.length;
    i += 1
  ) {
    for (
      let j = 1;
      j <= y.length;
      j += 1
    ) {
      const costo =
        x[i - 1] ===
        y[j - 1]
          ? 0
          : 1;

      matriz[i][j] =
        Math.min(
          matriz[i - 1][j] + 1,
          matriz[i][j - 1] + 1,
          matriz[i - 1][j - 1] +
            costo
        );
    }
  }

  return matriz[
    x.length
  ][y.length];
}

async function pedirJson(
  url
) {
  const respuesta =
    await fetch(
      url
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      "No se pudo consultar el servicio de ubicaciones."
    );
  }

  return respuesta.json();
}

function AutocompleteCampo({
  label,
  value,
  onChange,
  onSelect,
  opciones,
  disabled = false,
  placeholder = "",
  minChars = 2,
  inputRef = null,
  onAfterSelect = null,
}) {
  const [
    abierto,
    setAbierto,
  ] =
    useState(
      false
    );

  const [
    indiceActivo,
    setIndiceActivo,
  ] =
    useState(
      -1
    );

  const consulta =
    normalizarTexto(
      value
    );

  const coincidencias =
    consulta.length >=
    minChars
      ? opciones
          .filter(
            (
              opcion
            ) =>
              normalizarTexto(
                opcion.nombre
              ).includes(
                consulta
              )
          )
          .sort(
            (
              a,
              b
            ) => {
              const aNorm =
                normalizarTexto(
                  a.nombre
                );

              const bNorm =
                normalizarTexto(
                  b.nombre
                );

              const aEmpieza =
                aNorm.startsWith(
                  consulta
                )
                  ? 0
                  : 1;

              const bEmpieza =
                bNorm.startsWith(
                  consulta
                )
                  ? 0
                  : 1;

              if (
                aEmpieza !==
                bEmpieza
              ) {
                return (
                  aEmpieza -
                  bEmpieza
                );
              }

              return a.nombre.localeCompare(
                b.nombre,
                "es"
              );
            }
          )
          .slice(
            0,
            8
          )
      : [];

  function elegir(
    opcion
  ) {
    onSelect(
      opcion
    );

    setAbierto(
      false
    );

    setIndiceActivo(
      -1
    );

    requestAnimationFrame(
      () =>
        onAfterSelect?.()
    );
  }

  function manejarTecla(
    event
  ) {
    if (
      event.key ===
        "ArrowDown" &&
      coincidencias.length
    ) {
      event.preventDefault();

      setAbierto(
        true
      );

      setIndiceActivo(
        (
          actual
        ) =>
          Math.min(
            actual < 0
              ? 0
              : actual + 1,
            coincidencias.length -
              1
          )
      );

      return;
    }

    if (
      event.key ===
        "ArrowUp" &&
      coincidencias.length
    ) {
      event.preventDefault();

      setAbierto(
        true
      );

      setIndiceActivo(
        (
          actual
        ) =>
          Math.max(
            actual < 0
              ? coincidencias.length -
                1
              : actual - 1,
            0
          )
      );

      return;
    }

    if (
      event.key ===
      "Enter"
    ) {
      event.preventDefault();

      if (
        coincidencias.length
      ) {
        elegir(
          coincidencias[
            indiceActivo >=
            0
              ? indiceActivo
              : 0
          ]
        );
      } else {
        onAfterSelect?.();
      }

      return;
    }

    if (
      event.key ===
      "Escape"
    ) {
      setAbierto(
        false
      );

      setIndiceActivo(
        -1
      );
    }
  }

  return (
    <div
      className="campo-form"
      style={{
        position:
          "relative",
      }}
    >
      <span>
        {label}
      </span>

      <input
        ref={
          inputRef
        }
        value={
          value
        }
        disabled={
          disabled
        }
        placeholder={
          placeholder
        }
        autoComplete="off"
        onFocus={() =>
          setAbierto(
            true
          )
        }
        onChange={(
          event
        ) => {
          onChange(
            event.target.value
          );

          setAbierto(
            true
          );

          setIndiceActivo(
            -1
          );
        }}
        onKeyDown={
          manejarTecla
        }
        onBlur={() =>
          setTimeout(
            () =>
              setAbierto(
                false
              ),
            140
          )
        }
      />

      {abierto &&
        !disabled &&
        consulta.length >=
          minChars && (
        <div
          style={{
            position:
              "absolute",

            zIndex:
              40,

            top:
              "58px",

            left:
              0,

            right:
              0,

            background:
              "#fff",

            border:
              "1px solid var(--beige)",

            borderRadius:
              "12px",

            overflow:
              "hidden",

            boxShadow:
              "0 10px 26px rgba(0,0,0,.10)",
          }}
        >
          {coincidencias.length >
          0 ? (
            coincidencias.map(
              (
                opcion,
                index
              ) => (
                <button
                  key={
                    opcion.id
                  }
                  type="button"
                  onMouseDown={(
                    event
                  ) => {
                    event.preventDefault();

                    elegir(
                      opcion
                    );
                  }}
                  style={{
                    display:
                      "block",

                    width:
                      "100%",

                    padding:
                      "11px 13px",

                    border:
                      "none",

                    borderBottom:
                      index <
                      coincidencias.length -
                        1
                        ? "1px solid var(--beige)"
                        : "none",

                    background:
                      index ===
                      indiceActivo
                        ? "rgba(82,169,164,.12)"
                        : "#fff",

                    textAlign:
                      "left",

                    cursor:
                      "pointer",

                    color:
                      "var(--marron)",

                    fontSize:
                      "14px",
                  }}
                >
                  <strong>
                    {
                      opcion.nombre
                    }
                  </strong>
                </button>
              )
            )
          ) : (
            <div
              style={{
                padding:
                  "11px 13px",

                color:
                  "var(--texto-suave)",

                fontSize:
                  "13px",
              }}
            >
              No encontramos coincidencias.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function esImagenNueva(
  imagen
) {
  return (
    imagen &&
    typeof imagen ===
      "object" &&
    imagen.tipo ===
      "NUEVA" &&
    imagen.blob instanceof
      Blob
  );
}

function obtenerVistaPrevia(
  imagen
) {
  if (
    typeof imagen ===
    "string"
  ) {
    return imagen;
  }

  return esImagenNueva(
    imagen
  )
    ? imagen.preview
    : "";
}

function cargarImagenDesdeFuente(
  fuente
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const img =
        new Image();

      img.onload =
        () =>
          resolve(
            img
          );

      img.onerror =
        () =>
          reject(
            new Error(
              "El navegador no pudo abrir esta imagen."
            )
          );

      img.src =
        fuente;
    }
  );
}

function canvasABlobWebP(
  canvas
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (
          blob
        ) => {
          if (
            !blob
          ) {
            reject(
              new Error(
                "No se pudo convertir la imagen a WebP."
              )
            );

            return;
          }

          resolve(
            blob
          );
        },

        "image/webp",

        CALIDAD_WEBP
      );
    }
  );
}

async function convertirFuenteAWebP(
  fuente
) {
  let urlTemporal =
    null;

  try {
    if (
      fuente instanceof
      Blob
    ) {
      urlTemporal =
        URL.createObjectURL(
          fuente
        );
    }

    const img =
      await cargarImagenDesdeFuente(
        urlTemporal ||
          fuente
      );

    let ancho =
      img.naturalWidth ||
      img.width;

    let alto =
      img.naturalHeight ||
      img.height;

    if (
      !ancho ||
      !alto
    ) {
      throw new Error(
        "La imagen no tiene dimensiones válidas."
      );
    }

    const ladoMayor =
      Math.max(
        ancho,
        alto
      );

    if (
      ladoMayor >
      MAX_LADO_IMAGEN
    ) {
      const proporcion =
        MAX_LADO_IMAGEN /
        ladoMayor;

      ancho =
        Math.round(
          ancho *
            proporcion
        );

      alto =
        Math.round(
          alto *
            proporcion
        );
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      ancho;

    canvas.height =
      alto;

    const ctx =
      canvas.getContext(
        "2d"
      );

    if (
      !ctx
    ) {
      throw new Error(
        "No se pudo preparar la imagen."
      );
    }

    ctx.imageSmoothingEnabled =
      true;

    ctx.imageSmoothingQuality =
      "high";

    ctx.drawImage(
      img,
      0,
      0,
      ancho,
      alto
    );

    return await canvasABlobWebP(
      canvas
    );
  } finally {
    if (
      urlTemporal
    ) {
      URL.revokeObjectURL(
        urlTemporal
      );
    }
  }
}

function generarRutaImagen({
  numeroPublicacion,
  indice,
  tipo,
}) {
  const numeroSeguro =
    Number(
      numeroPublicacion
    ) ||
    "sin-numero";

  const aleatorio =
    Math.random()
      .toString(
        36
      )
      .slice(
        2,
        10
      );

  return (
    `publicacion-${numeroSeguro}/` +
    `${tipo}/` +
    `${Date.now()}-${indice}-${aleatorio}.webp`
  );
}

async function subirWebPStorage({
  blob,
  numeroPublicacion,
  indice,
  tipo,
}) {
  const ruta =
    generarRutaImagen({
      numeroPublicacion,
      indice,
      tipo,
    });

  const {
    error,
  } =
    await supabase.storage
      .from(
        BUCKET_IMAGENES
      )
      .upload(
        ruta,
        blob,
        {
          contentType:
            "image/webp",

          cacheControl:
            "31536000",

          upsert:
            false,
        }
      );

  if (
    error
  ) {
    throw error;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        BUCKET_IMAGENES
      )
      .getPublicUrl(
        ruta
      );

  if (
    !data?.publicUrl
  ) {
    throw new Error(
      "No se pudo obtener la URL pública de la imagen."
    );
  }

  return data.publicUrl;
}

async function prepararImagenParaGuardar({
  imagen,
  numeroPublicacion,
  indice,
}) {
  if (
    esImagenNueva(
      imagen
    )
  ) {
    if (
      imagen.original instanceof
      Blob
    ) {
      const originalWebP =
        await convertirFuenteAWebP(
          imagen.original
        );

      await subirWebPStorage({
        blob:
          originalWebP,

        numeroPublicacion,

        indice,

        tipo:
          "originales",
      });
    }

    return subirWebPStorage({
      blob:
        imagen.blob,

      numeroPublicacion,

      indice,

      tipo:
        "procesadas",
    });
  }

  if (
    typeof imagen !==
    "string"
  ) {
    throw new Error(
      "Formato de imagen no reconocido."
    );
  }

  const limpia =
    imagen.trim();

  if (
    !limpia
  ) {
    throw new Error(
      "La imagen está vacía."
    );
  }

  if (
    limpia.startsWith(
      "http://"
    ) ||
    limpia.startsWith(
      "https://"
    )
  ) {
    return limpia;
  }

  if (
    limpia.startsWith(
      "data:image"
    )
  ) {
    const blobWebP =
      await convertirFuenteAWebP(
        limpia
      );

    return subirWebPStorage({
      blob:
        blobWebP,

      numeroPublicacion,

      indice,

      tipo:
        "procesadas",
    });
  }

  return limpia;
}

function NuevaPublicacion() {
  const {
    id,
  } =
    useParams();

  const navigate =
    useNavigate();

  const inputCamaraRef =
    useRef(
      null
    );

  const inputGaleriaRef =
    useRef(
      null
    );

  const tituloRef =
    useRef(
      null
    );

  const provinciaRef =
    useRef(
      null
    );

  const localidadRef =
    useRef(
      null
    );

  const barrioRef =
    useRef(
      null
    );

  const valorRef =
    useRef(
      null
    );

  const descripcionRef =
    useRef(
      null
    );

  const fechaRef =
    useRef(
      null
    );

  const horaRef =
    useRef(
      null
    );

  const [
    modalidad,
    setModalidad,
  ] =
    useState(
      "RECIBE_PROPUESTAS"
    );

  const [
    numero,
    setNumero,
  ] =
    useState(
      ""
    );

  const [
    titulo,
    setTitulo,
  ] =
    useState(
      ""
    );

  const [
    provincia,
    setProvincia,
  ] =
    useState(
      ""
    );

  const [
    provinciaId,
    setProvinciaId,
  ] =
    useState(
      ""
    );

  const [
    localidad,
    setLocalidad,
  ] =
    useState(
      ""
    );

  const [
    localidadId,
    setLocalidadId,
  ] =
    useState(
      ""
    );

  const [
    barrio,
    setBarrio,
  ] =
    useState(
      ""
    );

  const [
    latitud,
    setLatitud,
  ] =
    useState(
      null
    );

  const [
    longitud,
    setLongitud,
  ] =
    useState(
      null
    );

  const [
    valorInicial,
    setValorInicial,
  ] =
    useState(
      ""
    );

  const [
    descripcion,
    setDescripcion,
  ] =
    useState(
      ""
    );

  const [
    fechaLimite,
    setFechaLimite,
  ] =
    useState(
      ""
    );

  const [
    horaLimite,
    setHoraLimite,
  ] =
    useState(
      "18:00"
    );

  const [
    frase,
    setFrase,
  ] =
    useState(
      ""
    );

  const [
    imagenes,
    setImagenes,
  ] =
    useState(
      []
    );

  const [
    modoFotos,
    setModoFotos,
  ] =
    useState(
      "automatico"
    );

  const [
    provincias,
    setProvincias,
  ] =
    useState(
      []
    );

  const [
    localidades,
    setLocalidades,
  ] =
    useState(
      []
    );

  const [
    barriosConocidos,
    setBarriosConocidos,
  ] =
    useState(
      []
    );

  const [
    sugerenciasBarrio,
    setSugerenciasBarrio,
  ] =
    useState(
      []
    );

  const [
    sugerenciaBarrio,
    setSugerenciaBarrio,
  ] =
    useState(
      ""
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true
    );

  const [
    guardando,
    setGuardando,
  ] =
    useState(
      false
    );

  const [
    procesandoFotos,
    setProcesandoFotos,
  ] =
    useState(
      false
    );

  const [
    ubicando,
    setUbicando,
  ] =
    useState(
      false
    );

  const [
    mensajeUbicacion,
    setMensajeUbicacion,
  ] =
    useState(
      ""
    );

  async function cargarProvincias() {
    const data =
      await pedirJson(
        `${API_GEOREF}/provincias?campos=id,nombre&max=100`
      );

    const lista =
      Array.isArray(
        data?.provincias
      )
        ? data.provincias
        : [];

    lista.sort(
      (
        a,
        b
      ) =>
        a.nombre.localeCompare(
          b.nombre,
          "es"
        )
    );

    setProvincias(
      lista
    );
  }

  async function cargarLocalidades(
    provinciaActual
  ) {
    if (
      !provinciaActual
    ) {
      setLocalidades(
        []
      );

      return [];
    }

    const params =
      new URLSearchParams({
        provincia:
          provinciaActual,

        campos:
          "id,nombre",

        max:
          "5000",
      });

    const data =
      await pedirJson(
        `${API_GEOREF}/localidades?${params.toString()}`
      );

    const lista =
      Array.isArray(
        data?.localidades
      )
        ? data.localidades
        : [];

    const vistas =
      new Set();

    const unicas =
      lista.filter(
        (
          item
        ) => {
          const clave =
            normalizarTexto(
              item.nombre
            );

          if (
            vistas.has(
              clave
            )
          ) {
            return false;
          }

          vistas.add(
            clave
          );

          return true;
        }
      );

    unicas.sort(
      (
        a,
        b
      ) =>
        a.nombre.localeCompare(
          b.nombre,
          "es"
        )
    );

    setLocalidades(
      unicas
    );

    return unicas;
  }

  useEffect(
    () => {
      cargarProvincias()
        .catch(
          console.error
        );
    },
    []
  );

  useEffect(
    () => {
      async function iniciar() {
        try {
          const publicaciones =
            await obtenerPublicaciones({
              incluirArchivadas:
                true,
            });

          const vistos =
            new Set();

          const barrios =
            publicaciones
              .filter(
                (
                  p
                ) =>
                  p.barrio?.trim()
              )
              .map(
                (
                  p
                ) => ({
                  nombre:
                    capitalizarConConectores(
                      p.barrio,
                      true
                    ),

                  localidad:
                    p.localidad ||
                    "",

                  provincia:
                    p.provincia ||
                    "",
                })
              )
              .filter(
                (
                  item
                ) => {
                  const clave =
                    `${normalizarTexto(
                      item.nombre
                    )}|${normalizarTexto(
                      item.localidad
                    )}|${normalizarTexto(
                      item.provincia
                    )}`;

                  if (
                    vistos.has(
                      clave
                    )
                  ) {
                    return false;
                  }

                  vistos.add(
                    clave
                  );

                  return true;
                }
              );

          setBarriosConocidos(
            barrios
          );

          if (
            id
          ) {
            const encontrada =
              publicaciones.find(
                (
                  p
                ) =>
                  p.id ===
                  Number(
                    id
                  )
              );

            if (
              encontrada
            ) {
              setModalidad(
                encontrada.modalidad ||
                  "RECIBE_PROPUESTAS"
              );

              setNumero(
                encontrada.numero ||
                  ""
              );

              setTitulo(
                encontrada.titulo ||
                  ""
              );

              setProvincia(
                encontrada.provincia ||
                  ""
              );

              setProvinciaId(
                encontrada.provinciaId ||
                  ""
              );

              setLocalidad(
                encontrada.localidad ||
                  ""
              );

              setLocalidadId(
                encontrada.localidadId ||
                  ""
              );

              setBarrio(
                encontrada.barrio ||
                  ""
              );

              setLatitud(
                encontrada.latitud ??
                  null
              );

              setLongitud(
                encontrada.longitud ??
                  null
              );

              setValorInicial(
                encontrada.valorInicial ||
                  ""
              );

              setDescripcion(
                encontrada.descripcion ||
                  ""
              );

              setFrase(
                encontrada.frase ||
                  ""
              );

              setFechaLimite(
                encontrada.fechaLimite ||
                  ""
              );

              setHoraLimite(
                encontrada.horaLimite ||
                  "18:00"
              );

              setImagenes(
                encontrada.imagenes?.length
                  ? encontrada.imagenes
                  : encontrada.imagen
                    ? [
                        encontrada.imagen,
                      ]
                    : []
              );

              if (
                encontrada.provinciaId
              ) {
                await cargarLocalidades(
                  encontrada.provinciaId
                );
              }
            }
          } else {
            const numeros =
              publicaciones
                .map(
                  (
                    p
                  ) =>
                    Number(
                      p.numero
                    )
                )
                .filter(
                  (
                    n
                  ) =>
                    !Number.isNaN(
                      n
                    )
                );

            setNumero(
              numeros.length
                ? Math.max(
                    ...numeros
                  ) + 1
                : 1
            );
          }
        } catch (
          error
        ) {
          console.error(
            error
          );

          alert(
            "No se pudieron cargar los datos de la publicación."
          );
        } finally {
          setCargando(
            false
          );
        }
      }

      iniciar();
    },
    [
      id,
    ]
  );

  function limpiarBarrioPorCambioUbicacion() {
    setBarrio(
      ""
    );

    setSugerenciasBarrio(
      []
    );

    setSugerenciaBarrio(
      ""
    );
  }

  function cambiarProvincia(
    valor
  ) {
    setProvincia(
      valor
    );

    setProvinciaId(
      ""
    );

    setLocalidad(
      ""
    );

    setLocalidadId(
      ""
    );

    setLocalidades(
      []
    );

    limpiarBarrioPorCambioUbicacion();

    setMensajeUbicacion(
      ""
    );
  }

  async function seleccionarProvincia(
    opcion
  ) {
    setProvincia(
      opcion.nombre
    );

    setProvinciaId(
      opcion.id
    );

    setLocalidad(
      ""
    );

    setLocalidadId(
      ""
    );

    limpiarBarrioPorCambioUbicacion();

    await cargarLocalidades(
      opcion.id
    );
  }

  function cambiarLocalidad(
    valor
  ) {
    setLocalidad(
      valor
    );

    setLocalidadId(
      ""
    );

    limpiarBarrioPorCambioUbicacion();

    setMensajeUbicacion(
      ""
    );
  }

  function seleccionarLocalidad(
    opcion
  ) {
    setLocalidad(
      opcion.nombre
    );

    setLocalidadId(
      opcion.id
    );

    limpiarBarrioPorCambioUbicacion();
  }

  async function usarMiUbicacion() {
    if (
      !navigator.geolocation
    ) {
      setMensajeUbicacion(
        "Este dispositivo no permite compartir ubicación."
      );

      return;
    }

    setUbicando(
      true
    );

    setMensajeUbicacion(
      ""
    );

    limpiarBarrioPorCambioUbicacion();

    navigator.geolocation.getCurrentPosition(
      async (
        posicion
      ) => {
        try {
          const lat =
            posicion.coords.latitude;

          const lon =
            posicion.coords.longitude;

          setLatitud(
            lat
          );

          setLongitud(
            lon
          );

          const data =
            await pedirJson(
              `${API_GEOREF}/ubicacion?lat=${lat}&lon=${lon}`
            );

          const ubicacion =
            data?.ubicacion ||
            {};

          const provinciaApi =
            ubicacion?.provincia;

          const localidadApi =
            ubicacion?.localidad ||
            ubicacion?.localidad_censal ||
            ubicacion?.municipio;

          if (
            !provinciaApi?.nombre
          ) {
            throw new Error(
              "Sin provincia"
            );
          }

          setProvincia(
            provinciaApi.nombre
          );

          setProvinciaId(
            provinciaApi.id ||
              ""
          );

          const lista =
            provinciaApi.id
              ? await cargarLocalidades(
                  provinciaApi.id
                )
              : [];

          if (
            localidadApi?.nombre
          ) {
            setLocalidad(
              localidadApi.nombre
            );

            const exacta =
              lista.find(
                (
                  item
                ) =>
                  normalizarTexto(
                    item.nombre
                  ) ===
                  normalizarTexto(
                    localidadApi.nombre
                  )
              );

            setLocalidadId(
              exacta?.id ||
              localidadApi.id ||
              ""
            );

            setMensajeUbicacion(
              "Revisala antes de publicar."
            );
          } else {
            setLocalidad(
              ""
            );

            setLocalidadId(
              ""
            );

            setMensajeUbicacion(
              "Elegí la localidad manualmente y revisala antes de publicar."
            );
          }
        } catch (
          error
        ) {
          console.error(
            error
          );

          setMensajeUbicacion(
            "No pudimos identificar el lugar automáticamente. Elegilo manualmente."
          );
        } finally {
          setUbicando(
            false
          );
        }
      },

      () => {
        setUbicando(
          false
        );

        setMensajeUbicacion(
          "No pudimos acceder a tu ubicación. Podés completarla manualmente."
        );
      },

      {
        enableHighAccuracy:
          true,

        timeout:
          12000,

        maximumAge:
          0,
      }
    );
  }

  function barriosRelevantes() {
    const loc =
      normalizarTexto(
        localidad
      );

    const prov =
      normalizarTexto(
        provincia
      );

    const locales =
      barriosConocidos.filter(
        (
          item
        ) =>
          loc &&
          normalizarTexto(
            item.localidad
          ) === loc &&
          (
            !prov ||
            !item.provincia ||
            normalizarTexto(
              item.provincia
            ) === prov
          )
      );

    return locales.length
      ? locales
      : barriosConocidos;
  }

  function cambiarBarrio(
    valor
  ) {
    const limpio =
      limpiarBarrioMientrasEscribe(
        valor
      );

    setBarrio(
      limpio
    );

    setSugerenciaBarrio(
      ""
    );

    if (
      limpio.length <
      2
    ) {
      setSugerenciasBarrio(
        []
      );

      return;
    }

    const consulta =
      normalizarTexto(
        limpio
      );

    const relevantes =
      barriosRelevantes();

    const coincidencias =
      relevantes
        .filter(
          (
            item
          ) =>
            normalizarTexto(
              item.nombre
            ).includes(
              consulta
            )
        )
        .sort(
          (
            a,
            b
          ) => {
            const aa =
              normalizarTexto(
                a.nombre
              ).startsWith(
                consulta
              )
                ? 0
                : 1;

            const bb =
              normalizarTexto(
                b.nombre
              ).startsWith(
                consulta
              )
                ? 0
                : 1;

            return (
              aa -
              bb ||
              a.nombre.localeCompare(
                b.nombre,
                "es"
              )
            );
          }
        )
        .slice(
          0,
          6
        );

    setSugerenciasBarrio(
      coincidencias
    );

    const exacta =
      relevantes.find(
        (
          item
        ) =>
          normalizarTexto(
            item.nombre
          ) ===
          consulta
      );

    if (
      exacta
    ) {
      return;
    }

    let mejor =
      null;

    let distancia =
      Infinity;

    relevantes.forEach(
      (
        item
      ) => {
        const d =
          distanciaLevenshtein(
            limpio,
            item.nombre
          );

        if (
          d <
          distancia
        ) {
          distancia =
            d;

          mejor =
            item;
        }
      }
    );

    const limite =
      Math.max(
        1,
        Math.floor(
          consulta.length *
            0.22
        )
      );

    if (
      mejor &&
      distancia <=
        limite
    ) {
      setSugerenciaBarrio(
        mejor.nombre
      );
    }
  }

  function cerrarBarrio() {
    const limpio =
      limpiarPrefijoBarrio(
        barrio
      );

    if (
      !limpio
    ) {
      return setBarrio(
        ""
      );
    }

    const exacta =
      barriosRelevantes()
        .find(
          (
            item
          ) =>
            normalizarTexto(
              item.nombre
            ) ===
            normalizarTexto(
              limpio
            )
        );

    setBarrio(
      exacta?.nombre ||
      capitalizarConConectores(
        limpio,
        true
      )
    );

    setTimeout(
      () =>
        setSugerenciasBarrio(
          []
        ),
      160
    );
  }

  async function procesarArchivo(
    archivo
  ) {
    if (
      !archivo.type.startsWith(
        "image/"
      )
    ) {
      throw new Error(
        "El archivo seleccionado no es una imagen."
      );
    }

    const procesado =
      await procesarImagenFondoBlanco(
        archivo,
        {
          modo:
            modoFotos,
        }
      );

    return {
      tipo:
        "NUEVA",

      blob:
        procesado,

      preview:
        URL.createObjectURL(
          procesado
        ),

      original:
        archivo,

      previewOriginal:
        URL.createObjectURL(
          archivo
        ),

      nombreOriginal:
        archivo.name,

      modo:
        modoFotos,
    };
  }

  async function cargarArchivos(
    recibidos
  ) {
    const archivos =
      Array.from(
        recibidos ||
        []
      );

    if (
      !archivos.length
    ) {
      return;
    }

    const disponibles =
      Math.max(
        0,
        MAX_FOTOS -
          imagenes.length
      );

    if (
      !disponibles
    ) {
      return alert(
        "Ya alcanzaste el máximo de 5 fotos."
      );
    }

    try {
      setProcesandoFotos(
        true
      );

      const nuevas =
        [];

      for (
        const archivo of
        archivos.slice(
          0,
          disponibles
        )
      ) {
        nuevas.push(
          await procesarArchivo(
            archivo
          )
        );
      }

      setImagenes(
        (
          actuales
        ) => [
          ...actuales,
          ...nuevas,
        ]
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        "No se pudieron procesar una o más imágenes. Probá nuevamente."
      );
    } finally {
      setProcesandoFotos(
        false
      );
    }
  }

  function eliminarImagen(
    indice
  ) {
    setImagenes(
      (
        actuales
      ) => {
        const eliminar =
          actuales[
            indice
          ];

        if (
          esImagenNueva(
            eliminar
          )
        ) {
          if (
            eliminar.preview
          ) {
            URL.revokeObjectURL(
              eliminar.preview
            );
          }

          if (
            eliminar.previewOriginal
          ) {
            URL.revokeObjectURL(
              eliminar.previewOriginal
            );
          }
        }

        return actuales.filter(
          (
            _,
            index
          ) =>
            index !==
            indice
        );
      }
    );
  }

  async function publicar(
    event
  ) {
    event.preventDefault();

    if (
      !titulo.trim() ||
      !valorInicial ||
      !imagenes.length
    ) {
      return alert(
        "Falta título, valor o al menos una imagen."
      );
    }

    if (
      !provinciaId ||
      !provincia.trim()
    ) {
      return alert(
        "Elegí una provincia válida."
      );
    }

    if (
      !localidadId ||
      !localidad.trim()
    ) {
      return alert(
        "Elegí una localidad / ciudad / comuna válida."
      );
    }

    if (
      modalidad ===
        "RECIBE_PROPUESTAS" &&
      (
        !fechaLimite ||
        !horaLimite
      )
    ) {
      return alert(
        "Falta la fecha u hora límite para recibir propuestas."
      );
    }

    try {
      setGuardando(
        true
      );

      const urls =
        [];

      for (
        let index = 0;
        index <
        imagenes.length;
        index += 1
      ) {
        urls.push(
          await prepararImagenParaGuardar({
            imagen:
              imagenes[
                index
              ],

            numeroPublicacion:
              numero,

            indice:
              index + 1,
          })
        );
      }

      const datos =
        {
          modalidad,

          numero:
            Number(
              numero
            ),

          titulo:
            capitalizarConConectores(
              titulo
            ),

          provincia:
            provincia.trim(),

          provinciaId:
            provinciaId.trim(),

          localidad:
            localidad.trim(),

          localidadId:
            localidadId.trim(),

          barrio:
            capitalizarConConectores(
              barrio,
              true
            ),

          latitud,

          longitud,

          valorInicial:
            Number(
              valorInicial
            ),

          descripcion:
            descripcion.trim(),

          fechaLimite:
            modalidad ===
            "RECIBE_PROPUESTAS"
              ? fechaLimite
              : "",

          horaLimite:
            modalidad ===
            "RECIBE_PROPUESTAS"
              ? horaLimite
              : "",

          frase:
            frase.trim(),

          imagen:
            urls[0],

          imagenes:
            urls,
        };

      if (
        id
      ) {
        await editarPublicacion(
          id,
          datos
        );
      } else {
        await guardarPublicacion(
          datos
        );
      }

      sessionStorage.setItem(
        "publicacion-destacada-numero",
        String(
          datos.numero
        )
      );

      navigate(
        "/publicaciones"
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      alert(
        `No se pudo guardar la publicación.${
          error?.message
            ? `\n\n${error.message}`
            : ""
        }`
      );
    } finally {
      setGuardando(
        false
      );
    }
  }

  if (
    cargando
  ) {
    return (
      <PantallaNosSirve
        titulo="Cargando..."
        centrarContenido
      >
        <div className="ns-auth-panel">
          Preparando tu publicación...
        </div>
      </PantallaNosSirve>
    );
  }

  return (
    <PantallaNosSirve
      titulo={
        id
          ? "Editar publicación"
          : "Nueva publicación"
      }
      mostrarVolver
    >

        <form
          className="formulario-panel"
          onSubmit={
            publicar
          }
        >
          <Campo label="Modalidad">
            <select
              value={
                modalidad
              }
              onChange={(
                event
              ) =>
                setModalidad(
                  event.target.value
                )
              }
            >
              <option value="RECIBE_PROPUESTAS">
                Recibo propuestas
              </option>

              <option value="PRECIO_FIJO">
                Quiero $...
              </option>
            </select>
          </Campo>

          <Campo label="Número de publicación">
            <input
              type="number"
              value={
                numero
              }
              readOnly
              disabled
            />
          </Campo>

          <Campo label="Título del producto">
            <input
              ref={
                tituloRef
              }
              placeholder="Ej.: Cámara Canon EOS 4000D"
              value={
                titulo
              }
              onChange={(
                event
              ) =>
                setTitulo(
                  event.target.value
                )
              }
              onBlur={() =>
                setTitulo(
                  capitalizarConConectores(
                    titulo
                  )
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  setTitulo(
                    capitalizarConConectores(
                      titulo
                    )
                  );

                  provinciaRef.current?.focus();
                }
              }}
            />
          </Campo>

          <div
            style={{
              marginBottom:
                "16px",
            }}
          >
            <button
              type="button"
              className="boton-secundario"
              onClick={
                usarMiUbicacion
              }
              disabled={
                ubicando ||
                guardando
              }
              style={{
                width:
                  "100%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "8px",
              }}
            >
              <IconoUbicacion />

              {ubicando
                ? "Buscando ubicación..."
                : "Usar mi ubicación"}
            </button>

            {mensajeUbicacion ? (
              <p
                style={{
                  margin:
                    "8px 0 0",

                  fontSize:
                    "13px",

                  color:
                    "var(--texto-suave)",

                  lineHeight:
                    1.45,
                }}
              >
                {
                  mensajeUbicacion
                }
              </p>
            ) : null}
          </div>

          <AutocompleteCampo
            label="Provincia"
            value={
              provincia
            }
            opciones={
              provincias
            }
            placeholder="Ej.: Córdoba"
            onChange={
              cambiarProvincia
            }
            onSelect={
              seleccionarProvincia
            }
            inputRef={
              provinciaRef
            }
            onAfterSelect={() =>
              localidadRef.current?.focus()
            }
          />

          <AutocompleteCampo
            label="Localidad / ciudad / comuna"
            value={
              localidad
            }
            opciones={
              localidades
            }
            disabled={
              !provinciaId
            }
            placeholder={
              provinciaId
                ? "Ej.: Cosquín"
                : "Primero elegí la provincia"
            }
            onChange={
              cambiarLocalidad
            }
            onSelect={
              seleccionarLocalidad
            }
            inputRef={
              localidadRef
            }
            onAfterSelect={() =>
              barrioRef.current?.focus()
            }
          />

          <div
            className="campo-form"
            style={{
              position:
                "relative",
            }}
          >
            <span>
              Barrio / zona
            </span>

            <input
              ref={
                barrioRef
              }
              placeholder="Ej.: Alto Mieres, General Paz, María de los Ángeles"
              value={
                barrio
              }
              autoComplete="off"
              onChange={(
                event
              ) =>
                cambiarBarrio(
                  event.target.value
                )
              }
              onBlur={
                cerrarBarrio
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  cerrarBarrio();

                  valorRef.current?.focus();
                }
              }}
            />

            {sugerenciasBarrio.length >
              0 && (
              <div
                style={{
                  position:
                    "absolute",

                  zIndex:
                    30,

                  top:
                    "58px",

                  left:
                    0,

                  right:
                    0,

                  background:
                    "#fff",

                  border:
                    "1px solid var(--beige)",

                  borderRadius:
                    "12px",

                  overflow:
                    "hidden",

                  boxShadow:
                    "0 10px 26px rgba(0,0,0,.10)",
                }}
              >
                {sugerenciasBarrio.map(
                  (
                    item,
                    index
                  ) => (
                    <button
                      key={`${item.nombre}-${index}`}
                      type="button"
                      onMouseDown={(
                        event
                      ) => {
                        event.preventDefault();

                        setBarrio(
                          item.nombre
                        );

                        setSugerenciasBarrio(
                          []
                        );

                        setSugerenciaBarrio(
                          ""
                        );

                        valorRef.current?.focus();
                      }}
                      style={{
                        display:
                          "block",

                        width:
                          "100%",

                        padding:
                          "11px 13px",

                        border:
                          "none",

                        borderBottom:
                          index <
                          sugerenciasBarrio.length -
                            1
                            ? "1px solid var(--beige)"
                            : "none",

                        background:
                          "#fff",

                        textAlign:
                          "left",

                        cursor:
                          "pointer",

                        color:
                          "var(--marron)",
                      }}
                    >
                      <strong>
                        {
                          item.nombre
                        }
                      </strong>
                    </button>
                  )
                )}
              </div>
            )}

            {sugerenciaBarrio ? (
              <button
                type="button"
                onMouseDown={(
                  event
                ) => {
                  event.preventDefault();

                  setBarrio(
                    sugerenciaBarrio
                  );

                  setSugerenciaBarrio(
                    ""
                  );

                  setSugerenciasBarrio(
                    []
                  );

                  valorRef.current?.focus();
                }}
                style={{
                  marginTop:
                    "7px",

                  padding:
                    0,

                  border:
                    "none",

                  background:
                    "transparent",

                  color:
                    "var(--petroleo)",

                  cursor:
                    "pointer",

                  fontSize:
                    "13px",

                  fontWeight:
                    700,
                }}
              >
                ¿Quisiste decir “{sugerenciaBarrio}”?
              </button>
            ) : null}
          </div>

          <Campo
            label={
              modalidad ===
              "PRECIO_FIJO"
                ? "Precio"
                : "Valor inicial"
            }
          >
            <div
              style={{
                position:
                  "relative",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position:
                    "absolute",

                  left:
                    "14px",

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  color:
                    "var(--petroleo)",

                  fontWeight:
                    700,
                }}
              >
                $
              </span>

              <input
                ref={
                  valorRef
                }
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                value={
                  formatearPesosInput(
                    valorInicial
                  )
                }
                onChange={(
                  event
                ) =>
                  setValorInicial(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    descripcionRef.current?.focus();
                  }
                }}
                style={{
                  paddingLeft:
                    "34px",
                }}
              />
            </div>
          </Campo>

          <Campo label="Descripción / características">
            <div
              style={{
                border:
                  "1px solid var(--beige)",

                borderRadius:
                  "14px",

                background:
                  "#fff",

                overflow:
                  "hidden",
              }}
            >
              <textarea
                ref={
                  descripcionRef
                }
                rows={6}
                spellCheck="true"
                placeholder="Contanos qué es, marca o modelo si corresponde, medidas, estado real, funcionamiento, detalles de uso, qué incluye y cualquier dato que ayude a decidir."
                value={
                  descripcion
                }
                onChange={(
                  event
                ) =>
                  setDescripcion(
                    event.target.value
                  )
                }
                style={{
                  border:
                    "none",

                  borderRadius:
                    0,

                  margin:
                    0,

                  boxShadow:
                    "none",
                }}
              />

              {!descripcion.trim() && (
                <small
                  style={{
                    display:
                      "block",

                    padding:
                      "0 14px 12px",

                    color:
                      "var(--texto-suave)",

                    lineHeight:
                      1.4,
                  }}
                >
                  Escribilo como te salga. La IA le dará forma y después podrás revisarlo.
                </small>
              )}
            </div>
          </Campo>

          {modalidad ===
            "RECIBE_PROPUESTAS" && (
            <>
              <Campo
                label="Fecha límite para recibir propuestas"
              >
                <input
                  ref={
                    fechaRef
                  }
                  type="date"
                  value={
                    fechaLimite
                  }
                  onChange={(
                    event
                  ) =>
                    setFechaLimite(
                      event.target.value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      horaRef.current?.focus();
                    }
                  }}
                />
              </Campo>

              <Campo
                label="Hora límite"
              >
                <input
                  ref={
                    horaRef
                  }
                  type="time"
                  value={
                    horaLimite
                  }
                  onChange={(
                    event
                  ) =>
                    setHoraLimite(
                      event.target.value
                    )
                  }
                />
              </Campo>
            </>
          )}

          <div
            style={{
              marginTop:
                "4px",

              padding:
                "16px",

              border:
                "1px solid var(--beige)",

              borderRadius:
                "16px",

              background:
                "var(--crema-claro)",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "7px",

                fontWeight:
                  700,

                marginBottom:
                  "10px",

                color:
                  "var(--marron)",
              }}
            >
              <IconoLuz />

              Antes de sacar las fotos
            </div>

            <div
              style={{
                background:
                  "#fff",

                border:
                  "1px solid var(--beige)",

                borderRadius:
                  "14px",

                padding:
                  "14px",

                marginBottom:
                  "18px",

                textAlign:
                  "center",

                color:
                  "var(--texto-suave)",

                fontSize:
                  "14px",

                lineHeight:
                  1.6,
              }}
            >
              <div>
                Buscá buena luz.
              </div>

              <div>
                Si podés, usá un fondo claro y simple.
              </div>

              <div>
                Evitá que aparezcan cosas que no forman parte de la publicación.
              </div>

              <div>
                Tratá de mostrar completo el objeto.
              </div>

              <div>
                Si vendés un conjunto, procurá que todos sus elementos se vean claramente.
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "7px",

                fontWeight:
                  700,

                marginBottom:
                  "6px",

                color:
                  "var(--marron)",
              }}
            >
              <IconoObjeto />

              Preparación de las fotos
            </div>

            <p
              style={{
                margin:
                  "0 0 14px",

                fontSize:
                  "14px",

                color:
                  "var(--texto-suave)",
              }}
            >
              Elegí el modo antes de sacar o seleccionar las fotos.
            </p>

            {[
              [
                "automatico",
                "Objeto principal",
                "Para una cama, una silla, un electrodoméstico o un objeto protagonista.",
              ],

              [
                "conjunto",
                "Varios objetos / conjunto",
                "Para juegos, conjuntos o varios objetos que se venden juntos.",
              ],
            ].map(
              ([
                valor,
                nombre,
                ayuda,
              ]) => (
                <label
                  key={
                    valor
                  }
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "flex-start",

                    gap:
                      "10px",

                    padding:
                      "12px",

                    marginBottom:
                      "8px",

                    borderRadius:
                      "14px",

                    cursor:
                      "pointer",

                    border:
                      modoFotos ===
                      valor
                        ? "2px solid var(--petroleo)"
                        : "1px solid var(--beige)",

                    background:
                      modoFotos ===
                      valor
                        ? "rgba(82,169,164,.10)"
                        : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name="modo-fotos"
                    value={
                      valor
                    }
                    checked={
                      modoFotos ===
                      valor
                    }
                    onChange={() =>
                      setModoFotos(
                        valor
                      )
                    }
                  />

                  <span>
                    <strong>
                      {
                        nombre
                      }
                    </strong>

                    <small
                      style={{
                        display:
                          "block",

                        marginTop:
                          "4px",

                        color:
                          "var(--texto-suave)",

                        lineHeight:
                          1.4,
                      }}
                    >
                      {
                        ayuda
                      }
                    </small>
                  </span>
                </label>
              )
            )}
          </div>

          <div
            style={{
              marginTop:
                "4px",
            }}
          >
            <div
              style={{
                fontWeight:
                  700,

                marginBottom:
                  "10px",

                color:
                  "var(--marron)",
              }}
            >
              Fotos
            </div>

            <input
              ref={
                inputCamaraRef
              }
              type="file"
              accept="image/*"
              capture="environment"
              style={{
                display:
                  "none",
              }}
              onChange={async (
                event
              ) => {
                await cargarArchivos(
                  event.target.files
                );

                event.target.value =
                  "";
              }}
            />

            <input
              ref={
                inputGaleriaRef
              }
              type="file"
              accept="image/*"
              multiple
              style={{
                display:
                  "none",
              }}
              onChange={async (
                event
              ) => {
                await cargarArchivos(
                  event.target.files
                );

                event.target.value =
                  "";
              }}
            />

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap:
                  "10px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  inputCamaraRef.current?.click()
                }
                disabled={
                  procesandoFotos ||
                  guardando ||
                  imagenes.length >=
                    MAX_FOTOS
                }
                className="boton-secundario"
                style={{
                  minHeight:
                    "74px",
                }}
              >
                <IconoCamara />

                <span>
                  Sacar foto
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  inputGaleriaRef.current?.click()
                }
                disabled={
                  procesandoFotos ||
                  guardando ||
                  imagenes.length >=
                    MAX_FOTOS
                }
                className="boton-secundario"
                style={{
                  minHeight:
                    "74px",
                }}
              >
                <IconoGaleria />

                <span>
                  Elegir de galería
                </span>
              </button>
            </div>

            <p
              style={{
                textAlign:
                  "center",

                color:
                  "var(--texto-suave)",

                fontSize:
                  "13px",
              }}
            >
              Hasta 5 fotos por publicación.
            </p>
          </div>

          {procesandoFotos && (
            <p
              style={{
                textAlign:
                  "center",

                color:
                  "var(--petroleo)",

                fontWeight:
                  600,
              }}
            >
              Preparando la foto...
            </p>
          )}

          {imagenes.map(
            (
              imagen,
              index
            ) => (
              <div
                key={`${obtenerVistaPrevia(
                  imagen
                )}-${index}`}
                style={{
                  marginBottom:
                    "18px",
                }}
              >
                <img
                  src={
                    obtenerVistaPrevia(
                      imagen
                    )
                  }
                  alt={`Vista previa ${
                    index + 1
                  }`}
                  className="preview-imagen"
                />

                {esImagenNueva(
                  imagen
                ) && (
                  <details
                    style={{
                      margin:
                        "6px 0 12px",

                      padding:
                        "10px 12px",

                      border:
                        "1px solid var(--beige)",

                      borderRadius:
                        "12px",

                      background:
                        "#fff",
                    }}
                  >
                    <summary
                      style={{
                        cursor:
                          "pointer",

                        color:
                          "var(--petroleo)",

                        fontWeight:
                          700,
                      }}
                    >
                      Ver foto original
                    </summary>

                    <img
                      src={
                        imagen.previewOriginal
                      }
                      alt={`Foto original ${
                        index + 1
                      }`}
                      style={{
                        width:
                          "100%",

                        maxHeight:
                          "320px",

                        objectFit:
                          "contain",

                        marginTop:
                          "12px",

                        borderRadius:
                          "12px",
                      }}
                    />
                  </details>
                )}

                <button
                  className="boton-secundario"
                  type="button"
                  onClick={() =>
                    eliminarImagen(
                      index
                    )
                  }
                >
                  Eliminar foto
                </button>
              </div>
            )
          )}

          <Campo
            label="Frase de cierre (generada por IA)"
          >
            <textarea
              rows={4}
              value={
                frase
              }
              onChange={(
                event
              ) =>
                setFrase(
                  event.target.value
                )
              }
            />
          </Campo>

          <button
            className="boton-principal"
            type="submit"
            disabled={
              guardando ||
              procesandoFotos
            }
          >
            {guardando
              ? "Subiendo fotos y guardando..."
              : id
                ? "Guardar cambios"
                : "Publicar"}
          </button>
        </form>

        <Link
          to="/publicaciones"
          className="boton-secundario"
        >
          ← Volver a las publicaciones
        </Link>
    </PantallaNosSirve>
  );
}

export default NuevaPublicacion;