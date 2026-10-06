import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import PantallaOperativa from "../components/PantallaOperativa";

import {
  obtenerBorradorPublicacion,
  guardarBorradorPublicacion,
} from "../utils/borradorPublicacion";

const API_GEOREF =
  "https://apis.datos.gob.ar/georef/api";

const OPCIONES_ENTREGA = [
  {
    id: "EN_MANO",
    titulo: "Entrega en mano",
    texto:
      "Se encuentran y coordinan la entrega personalmente.",
  },
  {
    id: "ENVIO",
    titulo: "Envío",
    texto:
      "El objeto puede enviarse a otra localidad.",
  },
  {
    id: "RETIRO",
    titulo: "Retiro",
    texto:
      "La persona compradora puede retirarlo en una zona a coordinar.",
  },
];

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .trim();
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
  texto
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
    limpiarPrefijoBarrio(
      texto
    );

  return limpio
    .replace(
      /\s+/g,
      " "
    )
    .toLocaleLowerCase(
      "es-AR"
    )
    .split(" ")
    .filter(Boolean)
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
    .join(" ");
}

async function pedirJson(url) {
  const respuesta =
    await fetch(url);

  if (!respuesta.ok) {
    throw new Error(
      "No pudimos consultar las ubicaciones."
    );
  }

  return respuesta.json();
}

function ordenarPorNombre(lista) {
  return [...lista].sort(
    (a, b) =>
      String(
        a?.nombre || ""
      ).localeCompare(
        String(
          b?.nombre || ""
        ),
        "es"
      )
  );
}

function AutocompleteUbicacion({
  label,
  value,
  opciones,
  onChange,
  onSelect,
  placeholder = "",
  disabled = false,
  inputRef = null,
  onAfterSelect = null,
}) {
  const [
    abierto,
    setAbierto,
  ] = useState(false);

  const [
    indiceActivo,
    setIndiceActivo,
  ] = useState(-1);

  const consulta =
    normalizarTexto(
      value
    );

  const coincidencias =
    consulta.length >= 1
      ? opciones
          .filter(
            (opcion) =>
              normalizarTexto(
                opcion.nombre
              ).includes(
                consulta
              )
          )
          .sort(
            (a, b) => {
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

    setAbierto(false);
    setIndiceActivo(-1);

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

      setAbierto(true);

      setIndiceActivo(
        (actual) =>
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

      setAbierto(true);

      setIndiceActivo(
        (actual) =>
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
            indiceActivo >= 0
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
      setAbierto(false);
      setIndiceActivo(-1);
    }
  }

  return (
    <div className="sv-ubicacion-campo sv-autocomplete">
      <label className="sv-ubicacion-label">
        {label}
      </label>

      <input
        ref={inputRef}
        type="text"
        className="sv-ubicacion-input"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() =>
          setAbierto(true)
        }
        onChange={(
          event
        ) => {
          onChange(
            event.target.value
          );

          setAbierto(true);
          setIndiceActivo(-1);
        }}
        onKeyDown={
          manejarTecla
        }
        onBlur={() =>
          setTimeout(
            () =>
              setAbierto(false),
            140
          )
        }
      />

      {abierto &&
        !disabled &&
        consulta.length >= 1 && (
          <div className="sv-autocomplete-lista">
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
                    className={
                      index ===
                      indiceActivo
                        ? "sv-autocomplete-opcion activa"
                        : "sv-autocomplete-opcion"
                    }
                    onMouseDown={(
                      event
                    ) => {
                      event.preventDefault();

                      elegir(
                        opcion
                      );
                    }}
                  >
                    {
                      opcion.nombre
                    }
                  </button>
                )
              )
            ) : (
              <div className="sv-autocomplete-vacio">
                No encontramos coincidencias.
              </div>
            )}
          </div>
        )}
    </div>
  );
}

function PublicarUbicacion() {
  const navigate =
    useNavigate();

  const provinciaRef =
    useRef(null);

  const localidadRef =
    useRef(null);

  const barrioRef =
    useRef(null);

  const entregaRef =
    useRef(null);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    ubicando,
    setUbicando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensajeUbicacion,
    setMensajeUbicacion,
  ] = useState("");

  const [
    provincias,
    setProvincias,
  ] = useState([]);

  const [
    localidades,
    setLocalidades,
  ] = useState([]);

  const [
    provincia,
    setProvincia,
  ] = useState("");

  const [
    provinciaId,
    setProvinciaId,
  ] = useState("");

  const [
    localidad,
    setLocalidad,
  ] = useState("");

  const [
    localidadId,
    setLocalidadId,
  ] = useState("");

  const [
    barrio,
    setBarrio,
  ] = useState("");

  const [
    latitud,
    setLatitud,
  ] = useState(null);

  const [
    longitud,
    setLongitud,
  ] = useState(null);

  const [
    entregas,
    setEntregas,
  ] = useState([]);

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      try {
        const [
          borrador,
          respuestaProvincias,
        ] =
          await Promise.all([
            obtenerBorradorPublicacion(),

            pedirJson(
              `${API_GEOREF}/provincias?campos=id,nombre&max=100`
            ),
          ]);

        if (!activo) {
          return;
        }

        if (
          !borrador?.modalidad
        ) {
          navigate(
            "/publicar/valor",
            {
              replace: true,
            }
          );

          return;
        }

        const listaProvincias =
          ordenarPorNombre(
            Array.isArray(
              respuestaProvincias
                ?.provincias
            )
              ? respuestaProvincias.provincias
              : []
          );

        setProvincias(
          listaProvincias
        );

        setProvincia(
          borrador?.provincia ||
          ""
        );

        setProvinciaId(
          borrador?.provinciaId ||
          ""
        );

        setLocalidad(
          borrador?.localidad ||
          ""
        );

        setLocalidadId(
          borrador?.localidadId ||
          ""
        );

        setBarrio(
          borrador?.barrio ||
          ""
        );

        setLatitud(
          borrador?.latitud ??
          null
        );

        setLongitud(
          borrador?.longitud ??
          null
        );

        setEntregas(
          Array.isArray(
            borrador?.formasEntrega
          )
            ? borrador.formasEntrega
            : []
        );

        if (
          borrador?.provinciaId
        ) {
          await cargarLocalidades(
            borrador.provinciaId,
            false
          );
        }
      } catch (err) {
        console.error(
          "Error preparando ubicación:",
          err
        );

        if (activo) {
          setError(
            "No pudimos preparar este paso. Probá nuevamente."
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [navigate]);

  async function cargarLocalidades(
    idProvincia,
    limpiarSeleccion = true
  ) {
    if (!idProvincia) {
      setLocalidades([]);

      return [];
    }

    const params =
      new URLSearchParams({
        provincia:
          idProvincia,

        campos:
          "id,nombre",

        max:
          "5000",
      });

    const data =
      await pedirJson(
        `${API_GEOREF}/localidades?${params.toString()}`
      );

    const listaOriginal =
      Array.isArray(
        data?.localidades
      )
        ? data.localidades
        : [];

    const nombresVistos =
      new Set();

    const lista =
      ordenarPorNombre(
        listaOriginal.filter(
          (item) => {
            const clave =
              normalizarTexto(
                item?.nombre
              );

            if (
              !clave ||
              nombresVistos.has(
                clave
              )
            ) {
              return false;
            }

            nombresVistos.add(
              clave
            );

            return true;
          }
        )
      );

    setLocalidades(
      lista
    );

    if (
      limpiarSeleccion
    ) {
      setLocalidad("");
      setLocalidadId("");
      setBarrio("");
    }

    return lista;
  }

  function cambiarProvinciaTexto(
    valor
  ) {
    setProvincia(valor);

    setProvinciaId("");

    setLocalidad("");
    setLocalidadId("");

    setLocalidades([]);

    setBarrio("");

    setLatitud(null);
    setLongitud(null);

    setMensajeUbicacion("");
    setError("");
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

    setLocalidad("");
    setLocalidadId("");

    setBarrio("");

    setLatitud(null);
    setLongitud(null);

    setMensajeUbicacion("");
    setError("");

    try {
      await cargarLocalidades(
        opcion.id,
        false
      );
    } catch (err) {
      console.error(
        "Error cargando localidades:",
        err
      );

      setError(
        "No pudimos cargar las localidades de esa provincia."
      );
    }
  }

  function cambiarLocalidadTexto(
    valor
  ) {
    setLocalidad(valor);

    setLocalidadId("");

    setBarrio("");

    setMensajeUbicacion("");
    setError("");
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

    setBarrio("");
    setError("");
  }

  function cerrarBarrio() {
    const limpio =
      limpiarPrefijoBarrio(
        barrio
      );

    if (!limpio) {
      setBarrio("");

      return;
    }

    setBarrio(
      capitalizarConConectores(
        limpio
      )
    );
  }

  function cambiarBarrio(
    valor
  ) {
    setBarrio(
      limpiarBarrioMientrasEscribe(
        valor
      )
    );
  }

  async function usarMiUbicacion() {
    if (
      !navigator.geolocation
    ) {
      setMensajeUbicacion(
        "Este dispositivo no permite compartir la ubicación."
      );

      return;
    }

    setUbicando(true);
    setError("");

    setBarrio("");

    setMensajeUbicacion(
      "Buscando tu zona..."
    );

    navigator.geolocation.getCurrentPosition(
      async (posicion) => {
        try {
          const lat =
            posicion.coords.latitude;

          const lon =
            posicion.coords.longitude;

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
              "Provincia no identificada."
            );
          }

          setLatitud(lat);
          setLongitud(lon);

          setProvincia(
            provinciaApi.nombre
          );

          setProvinciaId(
            provinciaApi.id ||
            ""
          );

          setBarrio("");

          const lista =
            provinciaApi.id
              ? await cargarLocalidades(
                  provinciaApi.id,
                  false
                )
              : [];

          if (
            localidadApi?.nombre
          ) {
            const exacta =
              lista.find(
                (item) =>
                  normalizarTexto(
                    item.nombre
                  ) ===
                  normalizarTexto(
                    localidadApi.nombre
                  )
              );

            setLocalidad(
              exacta?.nombre ||
              localidadApi.nombre
            );

            setLocalidadId(
              exacta?.id ||
              localidadApi.id ||
              ""
            );

            setMensajeUbicacion(
              "Listo. Revisá que la localidad sea correcta."
            );
          } else {
            setLocalidad("");
            setLocalidadId("");

            setMensajeUbicacion(
              "Encontramos la provincia. Escribí la localidad para completar."
            );
          }
        } catch (err) {
          console.error(
            "Error usando ubicación:",
            err
          );

          setMensajeUbicacion(
            "No pudimos identificar el lugar automáticamente. Podés completarlo manualmente."
          );
        } finally {
          setUbicando(false);
        }
      },

      () => {
        setUbicando(false);

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

  function alternarEntrega(
    id
  ) {
    setError("");

    setEntregas(
      (actuales) => {
        if (
          actuales.includes(
            id
          )
        ) {
          return actuales.filter(
            (item) =>
              item !== id
          );
        }

        return [
          ...actuales,
          id,
        ];
      }
    );
  }

  const ubicacionVisible =
    useMemo(() => {
      if (
        !localidad.trim()
      ) {
        return "";
      }

      const barrioVisible =
        barrio.trim()
          ? capitalizarConConectores(
              barrio
            )
          : "";

      return [
        localidad.trim(),
        barrioVisible,
      ]
        .filter(Boolean)
        .join(" - ");
    }, [
      localidad,
      barrio,
    ]);

  const puedeContinuar =
    useMemo(
      () =>
        Boolean(
          provinciaId &&
          provincia &&
          localidadId &&
          localidad &&
          entregas.length > 0
        ),
      [
        provinciaId,
        provincia,
        localidadId,
        localidad,
        entregas,
      ]
    );

  async function guardarPaso() {
    if (
      guardando ||
      !puedeContinuar
    ) {
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const barrioLimpio =
        barrio
          ? capitalizarConConectores(
              barrio
            )
          : "";

      setBarrio(
        barrioLimpio
      );

      await guardarBorradorPublicacion({
        provincia:
          provincia.trim(),

        provinciaId:
          String(
            provinciaId
          ),

        localidad:
          localidad.trim(),

        localidadId:
          String(
            localidadId
          ),

        barrio:
          barrioLimpio,

        latitud,

        longitud,

        formasEntrega:
          entregas,

        ubicacionConfiguradaEn:
          new Date().toISOString(),
      });

      navigate(
        "/publicar/confirmar"
      );
    } catch (err) {
      console.error(
        "Error guardando ubicación:",
        err
      );

      setError(
        "No pudimos guardar la ubicación y la entrega. Probá nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main
        style={{
          minHeight:
            "100vh",

          display:
            "grid",

          placeItems:
            "center",

          background:
            "#f8f5f1",

          color:
            "#075753",

          fontWeight:
            800,
        }}
      >
        Preparando ubicación...
      </main>
    );
  }

  return (
    <>
      <style>{`
        .sv-ubicacion-bloque {
          margin-top: 12px;

          padding: 16px;

          border:
            1px solid
            var(--sv-borde);

          border-radius: 17px;

          background:
            rgba(
              255,
              255,
              255,
              0.74
            );
        }

        .sv-ubicacion-bloque:first-child {
          margin-top: 0;
        }

        .sv-ubicacion-titulo {
          margin:
            0 0 5px;

          color:
            var(--sv-petroleo);

          font-size: 16px;

          font-weight: 850;
        }

        .sv-ubicacion-ayuda {
          margin:
            0 0 14px;

          color: #67615c;

          font-size: 12px;

          line-height: 1.4;
        }

        .sv-usar-ubicacion {
          width: 100%;

          min-height: 46px;

          margin-bottom: 13px;

          border:
            1px solid
            var(--sv-petroleo);

          border-radius: 14px;

          background: #fff;

          color:
            var(--sv-petroleo);

          font: inherit;

          font-size: 13px;

          font-weight: 800;

          cursor: pointer;
        }

        .sv-usar-ubicacion:disabled {
          opacity: 0.6;

          cursor: wait;
        }

        .sv-mensaje-ubicacion {
          margin:
            -4px 0 13px;

          padding:
            9px 11px;

          border-radius: 12px;

          background:
            #f5f2ed;

          color: #635d57;

          font-size: 11.5px;

          line-height: 1.35;
        }

        .sv-ubicacion-campo {
          position: relative;

          margin-top: 11px;
        }

        .sv-ubicacion-campo:first-of-type {
          margin-top: 0;
        }

        .sv-ubicacion-label {
          display: block;

          margin-bottom: 5px;

          color:
            var(--sv-petroleo);

          font-size: 11.8px;

          font-weight: 800;
        }

        .sv-ubicacion-input {
          width: 100%;

          min-height: 46px;

          box-sizing:
            border-box;

          padding:
            10px 12px;

          border:
            1px solid
            #ded6cc;

          border-radius: 13px;

          background: #fff;

          color:
            var(--sv-texto);

          font: inherit;

          font-size: 13px;

          outline: none;
        }

        .sv-ubicacion-input:focus {
          border-color:
            var(--sv-petroleo);

          box-shadow:
            0 0 0 2px
            rgba(
              7,
              87,
              83,
              0.07
            );
        }

        .sv-ubicacion-input:disabled {
          opacity: 0.55;

          background:
            #f4f1ed;
        }

        .sv-autocomplete-lista {
          position: absolute;

          z-index: 100;

          top:
            calc(100% + 5px);

          left: 0;
          right: 0;

          max-height: 250px;

          overflow-y: auto;

          border:
            1px solid
            var(--sv-borde);

          border-radius: 13px;

          background: #fff;

          box-shadow:
            0 12px 28px
            rgba(
              38,
              53,
              54,
              0.13
            );
        }

        .sv-autocomplete-opcion {
          width: 100%;

          display: block;

          padding:
            11px 12px;

          border: 0;

          border-bottom:
            1px solid
            #eee7df;

          background: #fff;

          color:
            var(--sv-texto);

          text-align: left;

          font: inherit;

          font-size: 13px;

          cursor: pointer;
        }

        .sv-autocomplete-opcion:last-child {
          border-bottom: 0;
        }

        .sv-autocomplete-opcion:hover,
        .sv-autocomplete-opcion.activa {
          background:
            #eef6ee;

          color:
            var(--sv-petroleo);
        }

        .sv-autocomplete-vacio {
          padding:
            11px 12px;

          color: #756e67;

          font-size: 12px;
        }

        .sv-entregas {
          display: grid;

          gap: 8px;
        }

        .sv-entrega {
          width: 100%;

          min-height: 77px;

          display: flex;

          align-items: center;

          gap: 11px;

          padding:
            12px 13px;

          box-sizing:
            border-box;

          border:
            1px solid
            var(--sv-borde);

          border-radius: 15px;

          background: #fff;

          color:
            var(--sv-petroleo);

          text-align: left;

          font: inherit;

          cursor: pointer;
        }

        .sv-entrega.seleccionada {
          border-color:
            var(--sv-petroleo);

          background:
            #f2f8f1;
        }

        .sv-entrega-check {
          width: 24px;
          height: 24px;

          flex: 0 0 auto;

          display: grid;

          place-items: center;

          border:
            1px solid
            #cfc6bc;

          border-radius: 8px;

          background: #fff;

          color: #fff;

          font-size: 15px;

          font-weight: 900;
        }

        .sv-entrega.seleccionada
        .sv-entrega-check {
          border-color:
            var(--sv-petroleo);

          background:
            var(--sv-petroleo);
        }

        .sv-entrega-contenido {
          min-width: 0;
        }

        .sv-entrega-titulo {
          display: block;

          margin-bottom: 2px;

          font-size: 13.5px;

          font-weight: 850;
        }

        .sv-entrega-texto {
          display: block;

          color: #6b655f;

          font-size: 11.5px;

          line-height: 1.35;
        }

        .sv-privacidad {
          margin-top: 11px;

          padding:
            10px 12px;

          border-radius: 13px;

          background:
            #f5f2ed;

          color: #655f59;

          font-size: 11.5px;

          line-height: 1.4;
        }

        .sv-privacidad strong {
          color:
            var(--sv-petroleo);
        }

        .sv-ubicacion-error {
          margin-top: 12px;

          padding:
            10px 12px;

          border:
            1px solid
            #efcabb;

          border-radius: 13px;

          background:
            #fff3ee;

          color: #a84422;

          text-align: center;

          font-size: 12px;
        }

        .sv-ubicacion-continuar {
          width: 100%;

          min-height: 52px;

          margin-top: 15px;

          border: 0;

          border-radius: 17px;

          background:
            var(--sv-mostaza);

          color: #fff;

          font: inherit;

          font-size: 15px;

          font-weight: 850;

          cursor: pointer;

          box-shadow:
            0 8px 18px
            rgba(
              239,
              169,
              0,
              0.2
            );
        }

        .sv-ubicacion-continuar:disabled {
          opacity: 0.42;

          cursor:
            not-allowed;

          box-shadow: none;
        }
      `}</style>

      <PantallaOperativa
        titulo="¿Dónde está el objeto?"
        subtitulo="Decinos desde qué zona se entrega y cómo puede llegar a su próximo hogar."
      >
        <section className="sv-ubicacion-bloque">
          <h2 className="sv-ubicacion-titulo">
            Ubicación
          </h2>

          <p className="sv-ubicacion-ayuda">
            Solo mostramos la zona general.
            No necesitás publicar tu dirección.
          </p>

          <button
            type="button"
            className="sv-usar-ubicacion"
            disabled={
              ubicando
            }
            onClick={
              usarMiUbicacion
            }
          >
            {ubicando
              ? "Buscando ubicación..."
              : "⌖ Usar mi ubicación"}
          </button>

          {mensajeUbicacion && (
            <div className="sv-mensaje-ubicacion">
              {mensajeUbicacion}
            </div>
          )}

          <AutocompleteUbicacion
            label="Provincia"
            value={provincia}
            opciones={provincias}
            placeholder="Ej.: Córdoba"
            onChange={
              cambiarProvinciaTexto
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

          <AutocompleteUbicacion
            label="Localidad / ciudad / comuna"
            value={localidad}
            opciones={localidades}
            disabled={
              !provinciaId
            }
            placeholder={
              provinciaId
                ? "Ej.: Villa Ciudad de América"
                : "Primero elegí la provincia"
            }
            onChange={
              cambiarLocalidadTexto
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

          <div className="sv-ubicacion-campo">
            <label className="sv-ubicacion-label">
              Barrio / zona{" "}
              <span
                style={{
                  fontWeight: 500,
                  color: "#827971",
                }}
              >
                (opcional)
              </span>
            </label>

            <input
              ref={barrioRef}
              type="text"
              className="sv-ubicacion-input"
              value={barrio}
              maxLength={90}
              placeholder="Ej.: Alto Mieres, Centro, Dique Los Molinos"
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

                  entregaRef.current?.focus();
                }
              }}
            />
          </div>

          {ubicacionVisible && (
            <div className="sv-privacidad">
              🔒 En la publicación solo se muestra:{" "}
              <strong>
                {ubicacionVisible}
              </strong>
            </div>
          )}
        </section>

        <section className="sv-ubicacion-bloque">
          <h2 className="sv-ubicacion-titulo">
            ¿Cómo lo entregás?
          </h2>

          <p className="sv-ubicacion-ayuda">
            Podés elegir más de una opción.
          </p>

          <div className="sv-entregas">
            {OPCIONES_ENTREGA.map(
              (
                opcion,
                indice
              ) => {
                const seleccionada =
                  entregas.includes(
                    opcion.id
                  );

                return (
                  <button
                    key={
                      opcion.id
                    }
                    ref={
                      indice === 0
                        ? entregaRef
                        : null
                    }
                    type="button"
                    className={
                      seleccionada
                        ? "sv-entrega seleccionada"
                        : "sv-entrega"
                    }
                    onClick={() =>
                      alternarEntrega(
                        opcion.id
                      )
                    }
                  >
                    <span className="sv-entrega-check">
                      {seleccionada
                        ? "✓"
                        : ""}
                    </span>

                    <span className="sv-entrega-contenido">
                      <span className="sv-entrega-titulo">
                        {opcion.titulo}
                      </span>

                      <span className="sv-entrega-texto">
                        {opcion.texto}
                      </span>
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {error && (
          <div className="sv-ubicacion-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="sv-ubicacion-continuar"
          disabled={
            !puedeContinuar ||
            guardando
          }
          onClick={
            guardarPaso
          }
        >
          {guardando
            ? "Guardando..."
            : "Guardar y continuar"}
        </button>
      </PantallaOperativa>
    </>
  );
}

export default PublicarUbicacion;