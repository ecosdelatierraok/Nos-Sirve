import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import CabeceraNosSirve from "../components/CabeceraNosSirve";
import BuscadorNosSirve from "../components/BuscadorNosSirve";
import TarjetaPublicacion from "../components/TarjetaPublicacion";

import {
  obtenerPublicaciones,
} from "../utils/publicacionesStorage";

import {
  obtenerCantidadPropuestasPorPublicacion,
} from "../utils/propuestasStorage";

import "../App.css";

const CATEGORIAS_NOS_SIRVE = [
  "Electrodomésticos",
  "Tecnología",
  "Hogar",
  "Muebles",
  "Herramientas",
  "Jardín y exterior",
  "Libros",
  "Ropa",
  "Calzado",
  "Accesorios",
  "Deportes",
  "Bicicletas",
  "Juguetes y juegos",
  "Bebés y niños",
  "Mascotas",
  "Instrumentos musicales",
  "Arte y decoración",
  "Coleccionables",
  "Repuestos y accesorios",
  "Otros",
];

const CLAVE_BUSQUEDA =
  "busqueda-publicaciones";

const CLAVE_CATEGORIA =
  "filtro-categoria-publicaciones";

const CLAVE_UBICACION =
  "filtro-ubicacion-publicaciones";

const CLAVE_BARRIO_ANTIGUA =
  "filtro-barrio-publicaciones";

const CLAVE_MODALIDAD =
  "filtro-modalidad-publicaciones";

const CLAVE_PRECIO_MINIMO =
  "filtro-precio-minimo-publicaciones";

const CLAVE_PRECIO_MAXIMO =
  "filtro-precio-maximo-publicaciones";

const CLAVE_ORDEN =
  "orden-publicaciones";

const CLAVE_FILTROS_ABIERTOS =
  "filtros-abiertos-publicaciones";

const CLAVE_SCROLL =
  "scroll-publicaciones";

const CLAVE_ORIGEN_DETALLE =
  "origen-detalle-publicacion";

const CLAVE_CONTEXTO_DETALLE =
  "contexto-detalle-publicacion";



function IconoFiltro({
  size = 23,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="17"
        cy="6"
        r="1.4"
        fill="currentColor"
      />

      <circle
        cx="9"
        cy="12"
        r="1.4"
        fill="currentColor"
      />

      <circle
        cx="14"
        cy="18"
        r="1.4"
        fill="currentColor"
      />
    </svg>
  );
}

function normalizarTexto(
  valor
) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleLowerCase("es");
}

function limpiarBarrio(
  valor
) {
  return String(valor || "")
    .trim()
    .replace(
      /^barrio\s+/i,
      ""
    );
}

function obtenerUbicacionFiltro(
  publicacion
) {
  const localidad =
    String(
      publicacion?.localidad ||
        ""
    ).trim();

  const provincia =
    String(
      publicacion?.provincia ||
        ""
    ).trim();

  if (localidad) {
    if (
      provincia &&
      !normalizarTexto(
        localidad
      ).includes(
        normalizarTexto(
          provincia
        )
      )
    ) {
      return `${localidad} - ${provincia}`;
    }

    return localidad;
  }

  const barrio =
    limpiarBarrio(
      publicacion?.barrio
    );

  if (barrio) {
    return barrio;
  }

  return "";
}

function obtenerValorPublicacion(
  publicacion
) {
  const posibles = [
    publicacion?.valorInicial,
    publicacion?.precio,
    publicacion?.valor,
    publicacion?.base,
    publicacion?.oferta_actual,
  ];

  for (
    const valor
    of posibles
  ) {
    const numero =
      Number(valor);

    if (
      Number.isFinite(
        numero
      ) &&
      numero >= 0
    ) {
      return numero;
    }
  }

  return 0;
}

function esModalidadQuiero(
  publicacion
) {
  return (
    publicacion?.modalidad ===
      "PRECIO_FIJO" ||
    publicacion?.modalidad ===
      "QUIERO_X"
  );
}

function coincideBusqueda(
  publicacion,
  busqueda
) {
  const consulta =
    normalizarTexto(
      busqueda
    );

  if (!consulta) {
    return true;
  }

  const texto =
    [
      publicacion?.titulo,
      publicacion?.descripcion,
      publicacion?.categoria,
      publicacion?.barrio,
      publicacion?.localidad,
      publicacion?.provincia,
      obtenerUbicacionFiltro(
        publicacion
      ),
      publicacion?.numero,
    ]
      .filter(Boolean)
      .join(" ");

  return normalizarTexto(
    texto
  ).includes(
    consulta
  );
}

function guardarOEliminar(
  clave,
  valor,
  valorVacio
) {
  try {
    if (
      valor === valorVacio ||
      valor === "" ||
      valor === null ||
      valor === undefined
    ) {
      sessionStorage.removeItem(
        clave
      );

      return;
    }

    sessionStorage.setItem(
      clave,
      String(valor)
    );
  } catch {
    // La pantalla puede funcionar
    // aunque sessionStorage no esté disponible.
  }
}

function Publicaciones() {
  const buscadorRef =
    useRef(null);

  const scrollAperturaFiltrosRef =
    useRef(0);

  const [
    publicaciones,
    setPublicaciones,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    cantidadesPropuestas,
    setCantidadesPropuestas,
  ] = useState({});

  const [
    busqueda,
    setBusqueda,
  ] = useState(() => {
    return (
      sessionStorage.getItem(
        CLAVE_BUSQUEDA
      ) || ""
    );
  });

  const [
    mostrarFiltros,
    setMostrarFiltros,
  ] = useState(() => {
    return (
      sessionStorage.getItem(
        CLAVE_FILTROS_ABIERTOS
      ) === "SI"
    );
  });

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] = useState(
    sessionStorage.getItem(
      CLAVE_CATEGORIA
    ) || "TODAS"
  );

  const [
    ubicacionSeleccionada,
    setUbicacionSeleccionada,
  ] = useState(
    sessionStorage.getItem(
      CLAVE_UBICACION
    ) ||
      sessionStorage.getItem(
        CLAVE_BARRIO_ANTIGUA
      ) ||
      "TODOS"
  );

  const [
    modalidadSeleccionada,
    setModalidadSeleccionada,
  ] = useState(
    sessionStorage.getItem(
      CLAVE_MODALIDAD
    ) || "TODAS"
  );

  const [
    precioMinimo,
    setPrecioMinimo,
  ] = useState(
    sessionStorage.getItem(
      CLAVE_PRECIO_MINIMO
    ) || ""
  );

  const [
    precioMaximo,
    setPrecioMaximo,
  ] = useState(
    sessionStorage.getItem(
      CLAVE_PRECIO_MAXIMO
    ) || ""
  );

  const [
    orden,
    setOrden,
  ] = useState(
    sessionStorage.getItem(
      CLAVE_ORDEN
    ) || "MAS_RECIENTES"
  );

  useEffect(() => {
    async function cargarPublicaciones() {
      setCargando(true);

      try {
        const [
          datos,
          cantidades,
        ] =
          await Promise.all([
            obtenerPublicaciones(),
            obtenerCantidadPropuestasPorPublicacion(),
          ]);

        setPublicaciones(
          Array.isArray(datos)
            ? datos
            : []
        );

        setCantidadesPropuestas(
          cantidades || {}
        );
      } catch (error) {
        console.error(
          "Error al cargar las publicaciones:",
          error
        );

        setPublicaciones([]);

        setCantidadesPropuestas(
          {}
        );
      } finally {
        setCargando(false);
      }
    }

    cargarPublicaciones();
  }, []);

  useEffect(() => {
    guardarOEliminar(
      CLAVE_BUSQUEDA,
      busqueda,
      ""
    );
  }, [
    busqueda,
  ]);

  useEffect(() => {
    guardarOEliminar(
      CLAVE_CATEGORIA,
      categoriaSeleccionada,
      "TODAS"
    );
  }, [
    categoriaSeleccionada,
  ]);

  useEffect(() => {
    guardarOEliminar(
      CLAVE_UBICACION,
      ubicacionSeleccionada,
      "TODOS"
    );
  }, [
    ubicacionSeleccionada,
  ]);

  useEffect(() => {
    guardarOEliminar(
      CLAVE_MODALIDAD,
      modalidadSeleccionada,
      "TODAS"
    );
  }, [
    modalidadSeleccionada,
  ]);

  useEffect(() => {
    guardarOEliminar(
      CLAVE_PRECIO_MINIMO,
      precioMinimo,
      ""
    );
  }, [
    precioMinimo,
  ]);

  useEffect(() => {
    guardarOEliminar(
      CLAVE_PRECIO_MAXIMO,
      precioMaximo,
      ""
    );
  }, [
    precioMaximo,
  ]);

  useEffect(() => {
    guardarOEliminar(
      CLAVE_ORDEN,
      orden,
      "MAS_RECIENTES"
    );
  }, [
    orden,
  ]);

  useEffect(() => {
    try {
      if (mostrarFiltros) {
        sessionStorage.setItem(
          CLAVE_FILTROS_ABIERTOS,
          "SI"
        );
      } else {
        sessionStorage.removeItem(
          CLAVE_FILTROS_ABIERTOS
        );
      }
    } catch {
      // Sin efecto si no hay sessionStorage.
    }
  }, [
    mostrarFiltros,
  ]);

  useEffect(() => {
    if (!mostrarFiltros) {
      return undefined;
    }

    const shell = document.getElementById(
      "ns-shell-scroll"
    );

    if (!shell) {
      return undefined;
    }

    const origenScroll =
      scrollAperturaFiltrosRef.current;

    function contraerAlRecorrer() {
      if (
        shell.scrollTop >
        origenScroll + 12
      ) {
        setMostrarFiltros(false);
      }
    }

    shell.addEventListener(
      "scroll",
      contraerAlRecorrer,
      { passive: true }
    );

    return () => {
      shell.removeEventListener(
        "scroll",
        contraerAlRecorrer
      );
    };
  }, [mostrarFiltros]);

  function alternarFiltros() {
    const shell = document.getElementById(
      "ns-shell-scroll"
    );

    if (!mostrarFiltros) {
      scrollAperturaFiltrosRef.current =
        shell?.scrollTop || 0;
    }

    setMostrarFiltros(
      (actual) => !actual
    );
  }


  const publicacionesActivas =
    useMemo(() => {
      return publicaciones.filter(
        (publicacion) =>
          publicacion.estado ===
          "ACTIVO"
      );
    }, [publicaciones]);

  const publicacionesPorBusqueda =
    useMemo(() => {
      return publicacionesActivas.filter(
        (publicacion) =>
          coincideBusqueda(
            publicacion,
            busqueda
          )
      );
    }, [
      publicacionesActivas,
      busqueda,
    ]);

  const categoriasDisponibles =
    useMemo(() => {
      let base = [
        ...publicacionesPorBusqueda,
      ];

      if (
        ubicacionSeleccionada !==
        "TODOS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              normalizarTexto(
                obtenerUbicacionFiltro(
                  publicacion
                )
              ) ===
              normalizarTexto(
                ubicacionSeleccionada
              )
          );
      }

      if (
        modalidadSeleccionada ===
        "PRECIO_FIJO"
      ) {
        base =
          base.filter(
            esModalidadQuiero
          );
      }

      if (
        modalidadSeleccionada ===
        "RECIBE_PROPUESTAS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              publicacion.modalidad ===
              "RECIBE_PROPUESTAS"
          );
      }

      const existentes =
        new Set(
          base
            .map(
              (publicacion) =>
                normalizarTexto(
                  publicacion.categoria
                )
            )
            .filter(Boolean)
        );

      return CATEGORIAS_NOS_SIRVE.filter(
        (categoria) =>
          existentes.has(
            normalizarTexto(
              categoria
            )
          )
      );
    }, [
      publicacionesPorBusqueda,
      ubicacionSeleccionada,
      modalidadSeleccionada,
    ]);

  const ubicacionesDisponibles =
    useMemo(() => {
      let base = [
        ...publicacionesPorBusqueda,
      ];

      if (
        categoriaSeleccionada !==
        "TODAS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              normalizarTexto(
                publicacion.categoria
              ) ===
              normalizarTexto(
                categoriaSeleccionada
              )
          );
      }

      if (
        modalidadSeleccionada ===
        "PRECIO_FIJO"
      ) {
        base =
          base.filter(
            esModalidadQuiero
          );
      }

      if (
        modalidadSeleccionada ===
        "RECIBE_PROPUESTAS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              publicacion.modalidad ===
              "RECIBE_PROPUESTAS"
          );
      }

      const mapa =
        new Map();

      base.forEach(
        (publicacion) => {
          const ubicacion =
            obtenerUbicacionFiltro(
              publicacion
            );

          if (!ubicacion) {
            return;
          }

          const clave =
            normalizarTexto(
              ubicacion
            );

          if (
            !mapa.has(
              clave
            )
          ) {
            mapa.set(
              clave,
              ubicacion
            );
          }
        }
      );

      return Array.from(
        mapa.values()
      ).sort(
        (a, b) =>
          a.localeCompare(
            b,
            "es",
            {
              sensitivity:
                "base",
            }
          )
      );
    }, [
      publicacionesPorBusqueda,
      categoriaSeleccionada,
      modalidadSeleccionada,
    ]);

  const modalidadesDisponibles =
    useMemo(() => {
      let base = [
        ...publicacionesPorBusqueda,
      ];

      if (
        categoriaSeleccionada !==
        "TODAS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              normalizarTexto(
                publicacion.categoria
              ) ===
              normalizarTexto(
                categoriaSeleccionada
              )
          );
      }

      if (
        ubicacionSeleccionada !==
        "TODOS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              normalizarTexto(
                obtenerUbicacionFiltro(
                  publicacion
                )
              ) ===
              normalizarTexto(
                ubicacionSeleccionada
              )
          );
      }

      return {
        quiero:
          base.some(
            esModalidadQuiero
          ),

        propuestas:
          base.some(
            (publicacion) =>
              publicacion.modalidad ===
              "RECIBE_PROPUESTAS"
          ),
      };
    }, [
      publicacionesPorBusqueda,
      categoriaSeleccionada,
      ubicacionSeleccionada,
    ]);

  const rangoPrecio =
    useMemo(() => {
      let base = [
        ...publicacionesPorBusqueda,
      ];

      if (
        categoriaSeleccionada !==
        "TODAS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              normalizarTexto(
                publicacion.categoria
              ) ===
              normalizarTexto(
                categoriaSeleccionada
              )
          );
      }

      if (
        ubicacionSeleccionada !==
        "TODOS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              normalizarTexto(
                obtenerUbicacionFiltro(
                  publicacion
                )
              ) ===
              normalizarTexto(
                ubicacionSeleccionada
              )
          );
      }

      if (
        modalidadSeleccionada ===
        "PRECIO_FIJO"
      ) {
        base =
          base.filter(
            esModalidadQuiero
          );
      }

      if (
        modalidadSeleccionada ===
        "RECIBE_PROPUESTAS"
      ) {
        base =
          base.filter(
            (publicacion) =>
              publicacion.modalidad ===
              "RECIBE_PROPUESTAS"
          );
      }

      const valores =
        base
          .map(
            obtenerValorPublicacion
          )
          .filter(
            (valor) =>
              Number.isFinite(
                valor
              ) &&
              valor >= 0
          );

      if (
        valores.length ===
        0
      ) {
        return {
          minimo: 0,
          maximo: 0,
        };
      }

      return {
        minimo:
          Math.min(
            ...valores
          ),

        maximo:
          Math.max(
            ...valores
          ),
      };
    }, [
      publicacionesPorBusqueda,
      categoriaSeleccionada,
      ubicacionSeleccionada,
      modalidadSeleccionada,
    ]);

  useEffect(() => {
    if (
      categoriaSeleccionada ===
      "TODAS"
    ) {
      return;
    }

    const existe =
      categoriasDisponibles.some(
        (categoria) =>
          normalizarTexto(
            categoria
          ) ===
          normalizarTexto(
            categoriaSeleccionada
          )
      );

    if (!existe) {
      setCategoriaSeleccionada(
        "TODAS"
      );
    }
  }, [
    categoriaSeleccionada,
    categoriasDisponibles,
  ]);

  useEffect(() => {
    if (
      ubicacionSeleccionada ===
      "TODOS"
    ) {
      return;
    }

    const existe =
      ubicacionesDisponibles.some(
        (ubicacion) =>
          normalizarTexto(
            ubicacion
          ) ===
          normalizarTexto(
            ubicacionSeleccionada
          )
      );

    if (!existe) {
      setUbicacionSeleccionada(
        "TODOS"
      );

      sessionStorage.removeItem(
        CLAVE_BARRIO_ANTIGUA
      );
    }
  }, [
    ubicacionSeleccionada,
    ubicacionesDisponibles,
  ]);

  useEffect(() => {
    if (
      modalidadSeleccionada ===
      "TODAS"
    ) {
      return;
    }

    if (
      modalidadSeleccionada ===
        "PRECIO_FIJO" &&
      !modalidadesDisponibles.quiero
    ) {
      setModalidadSeleccionada(
        "TODAS"
      );
    }

    if (
      modalidadSeleccionada ===
        "RECIBE_PROPUESTAS" &&
      !modalidadesDisponibles.propuestas
    ) {
      setModalidadSeleccionada(
        "TODAS"
      );
    }
  }, [
    modalidadSeleccionada,
    modalidadesDisponibles,
  ]);

  const publicacionesVisibles =
    useMemo(() => {
      let filtradas = [
        ...publicacionesPorBusqueda,
      ];

      if (
        categoriaSeleccionada !==
        "TODAS"
      ) {
        filtradas =
          filtradas.filter(
            (publicacion) =>
              normalizarTexto(
                publicacion.categoria
              ) ===
              normalizarTexto(
                categoriaSeleccionada
              )
          );
      }

      if (
        ubicacionSeleccionada !==
        "TODOS"
      ) {
        filtradas =
          filtradas.filter(
            (publicacion) =>
              normalizarTexto(
                obtenerUbicacionFiltro(
                  publicacion
                )
              ) ===
              normalizarTexto(
                ubicacionSeleccionada
              )
          );
      }

      if (
        modalidadSeleccionada ===
        "PRECIO_FIJO"
      ) {
        filtradas =
          filtradas.filter(
            esModalidadQuiero
          );
      }

      if (
        modalidadSeleccionada ===
        "RECIBE_PROPUESTAS"
      ) {
        filtradas =
          filtradas.filter(
            (publicacion) =>
              publicacion.modalidad ===
              "RECIBE_PROPUESTAS"
          );
      }

      const minimo =
        Number(
          precioMinimo
        );

      if (
        precioMinimo !== "" &&
        Number.isFinite(
          minimo
        )
      ) {
        filtradas =
          filtradas.filter(
            (publicacion) =>
              obtenerValorPublicacion(
                publicacion
              ) >= minimo
          );
      }

      const maximo =
        Number(
          precioMaximo
        );

      if (
        precioMaximo !== "" &&
        Number.isFinite(
          maximo
        )
      ) {
        filtradas =
          filtradas.filter(
            (publicacion) =>
              obtenerValorPublicacion(
                publicacion
              ) <= maximo
          );
      }

      return filtradas.sort(
        (a, b) => {
          if (
            orden ===
            "MAS_PROPUESTAS"
          ) {
            const propuestasA =
              cantidadesPropuestas[
                a.id
              ] || 0;

            const propuestasB =
              cantidadesPropuestas[
                b.id
              ] || 0;

            if (
              propuestasB !==
              propuestasA
            ) {
              return (
                propuestasB -
                propuestasA
              );
            }
          }

          if (
            orden ===
            "MENOR_VALOR"
          ) {
            return (
              obtenerValorPublicacion(
                a
              ) -
              obtenerValorPublicacion(
                b
              )
            );
          }

          if (
            orden ===
            "MAYOR_VALOR"
          ) {
            return (
              obtenerValorPublicacion(
                b
              ) -
              obtenerValorPublicacion(
                a
              )
            );
          }

          return (
            Number(
              b.numero || 0
            ) -
            Number(
              a.numero || 0
            )
          );
        }
      );
    }, [
      publicacionesPorBusqueda,
      cantidadesPropuestas,
      categoriaSeleccionada,
      ubicacionSeleccionada,
      modalidadSeleccionada,
      precioMinimo,
      precioMaximo,
      orden,
    ]);

  useEffect(() => {
    if (
      cargando
    ) {
      return;
    }

    const temporizador =
      window.setTimeout(
        () => {
          const numeroDestacado =
            sessionStorage.getItem(
              "publicacion-destacada-numero"
            );

          if (
            numeroDestacado
          ) {
            const tarjeta =
              document.getElementById(
                `publicacion-${numeroDestacado}`
              );

            if (tarjeta) {
              tarjeta.scrollIntoView({
                behavior: "auto",
                block: "center",
              });
            }

            sessionStorage.removeItem(
              "publicacion-destacada-numero"
            );

            return;
          }

          const scroll =
            sessionStorage.getItem(
              CLAVE_SCROLL
            );

          if (
            scroll !== null &&
            scroll !== ""
          ) {
            const posicion =
              Number(scroll);

            if (
              Number.isFinite(
                posicion
              )
            ) {
              window.scrollTo({
                top: posicion,
                behavior: "auto",
              });
            }

            sessionStorage.removeItem(
              CLAVE_SCROLL
            );
          }
        },
        80
      );

    return () =>
      window.clearTimeout(
        temporizador
      );
  }, [
    cargando,
    publicacionesVisibles,
  ]);

  function limpiarFiltros() {
    setBusqueda("");

    setCategoriaSeleccionada(
      "TODAS"
    );

    setUbicacionSeleccionada(
      "TODOS"
    );

    setModalidadSeleccionada(
      "TODAS"
    );

    setPrecioMinimo("");

    setPrecioMaximo("");

    setOrden(
      "MAS_RECIENTES"
    );

    sessionStorage.removeItem(
      CLAVE_BUSQUEDA
    );

    sessionStorage.removeItem(
      CLAVE_CATEGORIA
    );

    sessionStorage.removeItem(
      CLAVE_UBICACION
    );

    sessionStorage.removeItem(
      CLAVE_BARRIO_ANTIGUA
    );

    sessionStorage.removeItem(
      CLAVE_MODALIDAD
    );

    sessionStorage.removeItem(
      CLAVE_PRECIO_MINIMO
    );

    sessionStorage.removeItem(
      CLAVE_PRECIO_MAXIMO
    );

    sessionStorage.removeItem(
      CLAVE_ORDEN
    );
  }


  function guardarContextoDetalle(
    publicacion
  ) {
    const numeroActual =
      publicacion?.numero ??
      publicacion?.id;

    if (!numeroActual) {
      return;
    }

    const numeros =
      publicacionesVisibles
        .map(
          (item) =>
            item?.numero ??
            item?.id
        )
        .filter(Boolean);

    try {
      sessionStorage.setItem(
        CLAVE_SCROLL,
        String(
          window.scrollY
        )
      );

      sessionStorage.setItem(
        CLAVE_ORIGEN_DETALLE,
        "publicaciones"
      );

      sessionStorage.setItem(
        CLAVE_CONTEXTO_DETALLE,
        JSON.stringify({
          origen:
            "publicaciones",

          numeroActual:
            Number(
              numeroActual
            ),

          numeros:
            numeros.map(
              (numero) =>
                Number(numero)
            ),

          scroll:
            window.scrollY,
        })
      );
    } catch {
      // La navegación sigue funcionando
      // aunque no podamos guardar contexto.
    }
  }

  const cantidadFiltrosActivos =
    useMemo(() => {
      let cantidad = 0;

      if (
        categoriaSeleccionada !==
        "TODAS"
      ) {
        cantidad += 1;
      }

      if (
        ubicacionSeleccionada !==
        "TODOS"
      ) {
        cantidad += 1;
      }

      if (
        modalidadSeleccionada !==
        "TODAS"
      ) {
        cantidad += 1;
      }

      if (
        precioMinimo !== ""
      ) {
        cantidad += 1;
      }

      if (
        precioMaximo !== ""
      ) {
        cantidad += 1;
      }

      if (
        orden !==
        "MAS_RECIENTES"
      ) {
        cantidad += 1;
      }

      return cantidad;
    }, [
      categoriaSeleccionada,
      ubicacionSeleccionada,
      modalidadSeleccionada,
      precioMinimo,
      precioMaximo,
      orden,
    ]);

  const hostContextoFiltros =
    typeof document !== "undefined"
      ? document.getElementById(
          "ns-shell-context-host"
        )
      : null;

  return (
    <>
      <style>{`
        :root {
          --sv-petroleo: #075753;
          --sv-crema: #fdfaf7;
          --sv-fondo: #f8f5f1;
          --sv-borde: #eadccc;
          --sv-texto: #263536;
          --sv-suave: #746960;
          --sv-mostaza: #efa900;
        }

        body {
          background: var(--sv-fondo);
        }

        .sv-publicaciones-header {
          position: sticky;
          top: 0;
          z-index: 180;
          margin: 0 -14px;
          padding: 0 14px 7px;
          box-sizing: border-box;
          background:
            rgba(
              253,
              250,
              247,
              0.98
            );
          backdrop-filter:
            blur(14px);
          -webkit-backdrop-filter:
            blur(14px);
          border-radius:
            21px 21px 0 0;
          text-align: center;
        }

        .sv-publicaciones-logo {
          width: var(--ns-header-logo-width);
          height: var(--ns-header-logo-height);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }



        .sv-publicaciones-header h1 {
          margin:
            -2px 0 2px;
          color:
            var(--sv-petroleo);
          font-size: var(--ns-header-title-size);
          line-height: var(--ns-header-title-line-height);
          letter-spacing:
            var(--ns-header-title-tracking);
          font-weight: var(--ns-header-title-weight);
        }

        .sv-publicaciones-busqueda {
          display: flex;
          gap: 8px;
          margin:
            9px 0 8px;
        }

        .sv-publicaciones-buscador {
          flex: 1;
          min-width: 0;
          height: 43px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding:
            0 13px;
          box-sizing:
            border-box;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 15px;
          background: #fff;
          color:
            var(--sv-petroleo);
        }

        .sv-publicaciones-buscador input {
          width: 100%;
          min-width: 0;
          padding: 0;
          border: 0;
          outline: 0;
          background:
            transparent;
          color:
            var(--sv-texto);
          font: inherit;
          font-size: 14px;
        }

        .sv-publicaciones-filtro-wrap {
          position: relative;
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
        }

        .sv-publicaciones-filtro-boton {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          padding: 0;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 15px;
          background: #fff;
          color:
            var(--sv-petroleo);
          cursor: pointer;
        }

        .sv-publicaciones-filtro-boton.abierto {
          border-color:
            var(--sv-petroleo);
          background:
            #f1f7f5;
        }

        .sv-publicaciones-filtro-contador {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          box-sizing: border-box;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background:
            var(--sv-mostaza);
          color: #fff;
          font-size: 10px;
          font-weight: 850;
          line-height: 1;
          pointer-events: none;
        }

        .sv-publicaciones-filtros {
          display: grid;
          gap: 8px;
          margin-bottom: 12px;
          padding: 10px;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 16px;
          background: #fff;
        }

        .sv-publicaciones-campo {
          display: grid;
          grid-template-columns:
            84px 1fr;
          align-items: center;
          gap: 8px;
          min-width: 0;
          text-align: left;
        }

        .sv-publicaciones-campo span {
          color:
            var(--sv-texto);
          font-size: 11px;
          font-weight: 800;
        }

        .sv-publicaciones-campo select,
        .sv-publicaciones-campo input {
          width: 100%;
          min-width: 0;
          height: 36px;
          padding:
            0 9px;
          box-sizing:
            border-box;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 11px;
          background: #fff;
          color:
            var(--sv-texto);
          font: inherit;
          font-size: 12px;
          outline: none;
        }

        .sv-publicaciones-precio {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 7px;
        }

        .sv-publicaciones-acciones {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 8px;
          margin-top: 2px;
        }

        .sv-publicaciones-accion {
          min-height: 36px;
          padding:
            7px 8px;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 11px;
          background: #fff;
          color:
            var(--sv-petroleo);
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-publicaciones-ocultar {
          background:
            var(--sv-petroleo);
          border-color:
            var(--sv-petroleo);
          color: #fff;
        }

        .sv-publicaciones-resumen {
          margin:
            1px 1px 10px;
          color:
            var(--sv-suave);
          font-size: 11.5px;
          line-height: 1.3;
        }

        .sv-publicaciones-resumen strong {
          color:
            var(--sv-petroleo);
        }

        .sv-publicaciones-resultados {
          display: grid;
          gap: 12px;
          min-height: 120px;
        }

        .sv-publicaciones-vacio,
        .sv-publicaciones-cargando {
          padding:
            28px 18px;
          border:
            1px solid
            var(--sv-borde);
          border-radius: 18px;
          background: #fff;
          text-align: center;
          color:
            var(--sv-suave);
          font-size: 14px;
          line-height: 1.4;
        }

        @media (
          min-width: 700px
        ) {
          .sv-publicaciones-logo {
            width: 268px;
            height: 90px;
          }


          .sv-publicaciones-header h1 {
            font-size: 30px;
          }

          .sv-publicaciones-filtros {
            grid-template-columns:
              1fr 1fr;
          }

          .sv-publicaciones-campo {
            display: flex;
            flex-direction:
              column;
            align-items:
              stretch;
          }

          .sv-publicaciones-precio {
            width: 100%;
          }

          .sv-publicaciones-acciones {
            grid-column:
              1 / -1;
          }
        }
      `}</style>

      <main className="sv-pantalla-fondo">
        <section className="sv-pantalla-app">
          <CabeceraNosSirve
            titulo="Objetos que aún sirven"
            extraInferior={
              <BuscadorNosSirve
                className="ns-buscador-publicaciones"
                inputRef={buscadorRef}
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value
                  )
                }
                accionDerecha={
                  <div className="sv-publicaciones-filtro-wrap">
                    <button
                      type="button"
                      className={`sv-publicaciones-filtro-boton${
                        mostrarFiltros
                          ? " abierto"
                          : ""
                      }`}
                      aria-label={
                        mostrarFiltros
                          ? "Ocultar filtros"
                          : "Mostrar filtros"
                      }
                      aria-expanded={mostrarFiltros}
                      aria-controls="sv-publicaciones-panel-filtros"
                      onClick={
                        alternarFiltros
                      }
                    >
                      <IconoFiltro />
                    </button>

                    {cantidadFiltrosActivos > 0 && (
                      <span className="sv-publicaciones-filtro-contador">
                        {cantidadFiltrosActivos}
                      </span>
                    )}
                  </div>
                }
              />
            }
          />

          {mostrarFiltros && hostContextoFiltros
            ? createPortal(
            <div
              id="sv-publicaciones-panel-filtros"
              className="sv-publicaciones-filtros"
            >
              <label className="sv-publicaciones-campo">
                <span>
                  Categoría
                </span>

                <select
                  value={
                    categoriaSeleccionada
                  }
                  onChange={(event) =>
                    setCategoriaSeleccionada(
                      event.target.value
                    )
                  }
                >
                  <option value="TODAS">
                    Todas las categorías
                  </option>

                  {categoriasDisponibles.map(
                    (categoria) => (
                      <option
                        key={
                          categoria
                        }
                        value={
                          categoria
                        }
                      >
                        {categoria}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="sv-publicaciones-campo">
                <span>
                  Ubicación
                </span>

                <select
                  value={
                    ubicacionSeleccionada
                  }
                  onChange={(event) =>
                    setUbicacionSeleccionada(
                      event.target.value
                    )
                  }
                >
                  <option value="TODOS">
                    Todas las ubicaciones
                  </option>

                  {ubicacionesDisponibles.map(
                    (ubicacion) => (
                      <option
                        key={
                          ubicacion
                        }
                        value={
                          ubicacion
                        }
                      >
                        {ubicacion}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="sv-publicaciones-campo">
                <span>
                  Modalidad
                </span>

                <select
                  value={
                    modalidadSeleccionada
                  }
                  onChange={(event) =>
                    setModalidadSeleccionada(
                      event.target.value
                    )
                  }
                >
                  <option value="TODAS">
                    Todas
                  </option>

                  {modalidadesDisponibles.quiero && (
                    <option value="PRECIO_FIJO">
                      Quiero
                    </option>
                  )}

                  {modalidadesDisponibles.propuestas && (
                    <option value="RECIBE_PROPUESTAS">
                      Recibo propuestas
                    </option>
                  )}
                </select>
              </label>

              <div className="sv-publicaciones-campo">
                <span>
                  Precio
                </span>

                <div className="sv-publicaciones-precio">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    aria-label="Precio mínimo"
                    placeholder={
                      rangoPrecio.minimo
                        ? `$${rangoPrecio.minimo.toLocaleString(
                            "es-AR"
                          )}`
                        : "Desde"
                    }
                    value={
                      precioMinimo
                    }
                    onChange={(event) =>
                      setPrecioMinimo(
                        event.target.value
                      )
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    aria-label="Precio máximo"
                    placeholder={
                      rangoPrecio.maximo
                        ? `$${rangoPrecio.maximo.toLocaleString(
                            "es-AR"
                          )}`
                        : "Hasta"
                    }
                    value={
                      precioMaximo
                    }
                    onChange={(event) =>
                      setPrecioMaximo(
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>

              <label className="sv-publicaciones-campo">
                <span>
                  Ordenar
                </span>

                <select
                  value={
                    orden
                  }
                  onChange={(event) =>
                    setOrden(
                      event.target.value
                    )
                  }
                >
                  <option value="MAS_RECIENTES">
                    Más recientes
                  </option>

                  <option value="MAS_PROPUESTAS">
                    Más propuestas
                  </option>

                  <option value="MENOR_VALOR">
                    Menor valor
                  </option>

                  <option value="MAYOR_VALOR">
                    Mayor valor
                  </option>
                </select>
              </label>

              <div className="sv-publicaciones-acciones">
                <button
                  type="button"
                  className="sv-publicaciones-accion"
                  onClick={
                    limpiarFiltros
                  }
                >
                  Limpiar filtros
                </button>

                <button
                  type="button"
                  className="sv-publicaciones-accion sv-publicaciones-ocultar"
                  onClick={() =>
                    setMostrarFiltros(
                      false
                    )
                  }
                >
                  Ocultar filtros
                </button>
              </div>
            </div>,
            hostContextoFiltros
          )
            : null}

          {!cargando && (
            <div className="sv-publicaciones-resumen">
              <strong>
                {
                  publicacionesVisibles.length
                }
              </strong>{" "}
              {publicacionesVisibles.length ===
              1
                ? "objeto encontrado"
                : "objetos encontrados"}
            </div>
          )}

          <div className="sv-publicaciones-resultados">
            {cargando && (
              <div className="sv-publicaciones-cargando">
                Cargando objetos...
              </div>
            )}

            {!cargando &&
              publicacionesVisibles.length ===
                0 && (
                <div className="sv-publicaciones-vacio">
                  No encontramos objetos con esos filtros.
                </div>
              )}

            {!cargando &&
              publicacionesVisibles.map(
                (publicacion) => (
                  <div
                    key={
                      publicacion.id ??
                      publicacion.numero
                    }
                    id={`publicacion-${publicacion.numero}`}
                    onClickCapture={() =>
                      guardarContextoDetalle(
                        publicacion
                      )
                    }
                    onKeyDownCapture={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        guardarContextoDetalle(
                          publicacion
                        );
                      }
                    }}
                  >
                    <TarjetaPublicacion
                      publicacion={
                        publicacion
                      }
                      cantidadPropuestas={
                        cantidadesPropuestas[
                          publicacion.id
                        ] || 0
                      }
                    />
                  </div>
                )
              )}
          </div>
        </section>
      </main>

    </>
  );
}

export default Publicaciones;