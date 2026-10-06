import CabeceraNosSirve from "../components/CabeceraNosSirve";

import { supabase } from "../lib/supabase";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { esAdmin } from "../utils/admin";

import {
  obtenerPublicaciones,
  cerrarRecepcionPropuestas,
} from "../utils/publicacionesStorage";

import {
  obtenerPropuestas,
  guardarPropuesta,
  obtenerResumenPropuestas,
  suscribirseAPropuestas,
} from "../utils/propuestasStorage";

import { obtenerPerfilActual } from "../utils/usuario";

import "../App.css";

const CLAVE_AYUDA_SWIPE =
  "nos-sirve-detalle-swipe-visto";

const DURACION_BORRADOR_PROPUESTA =
  24 * 60 * 60 * 1000;

const CLAVE_RETORNO_PROPUESTA =
  "nos-sirve-retorno-propuesta";

const DURACION_RETORNO_PROPUESTA =
  30 * 60 * 1000;

const DURACION_BORRADOR_PREGUNTA =
  24 * 60 * 60 * 1000;

function claveBorradorPregunta(publicacion) {
  const identificador =
    publicacion?.id ||
    publicacion?.numero ||
    null;

  if (!identificador) {
    return null;
  }

  return `nos-sirve-borrador-pregunta-${identificador}`;
}

function guardarBorradorPregunta(
  publicacion,
  pregunta
) {
  const clave =
    claveBorradorPregunta(
      publicacion
    );

  if (!clave) {
    return;
  }

  try {
    const valor =
      String(
        pregunta ?? ""
      );

    if (!valor) {
      localStorage.removeItem(
        clave
      );

      return;
    }

    localStorage.setItem(
      clave,
      JSON.stringify({
        pregunta:
          valor,

        actualizadoEn:
          Date.now(),
      })
    );
  } catch {
    // No bloquea el flujo.
  }
}

function leerBorradorPregunta(
  publicacion
) {
  const clave =
    claveBorradorPregunta(
      publicacion
    );

  if (!clave) {
    return "";
  }

  try {
    const guardado =
      localStorage.getItem(
        clave
      );

    if (!guardado) {
      return "";
    }

    const datos =
      JSON.parse(
        guardado
      );

    const actualizadoEn =
      Number(
        datos?.actualizadoEn
      );

    const vencido =
      !Number.isFinite(
        actualizadoEn
      ) ||
      Date.now() -
        actualizadoEn >
        DURACION_BORRADOR_PREGUNTA;

    if (vencido) {
      localStorage.removeItem(
        clave
      );

      return "";
    }

    return String(
      datos?.pregunta ??
      ""
    );
  } catch {
    try {
      localStorage.removeItem(
        clave
      );
    } catch {
      // No bloquea el flujo.
    }

    return "";
  }
}

function borrarBorradorPregunta(
  publicacion
) {
  const clave =
    claveBorradorPregunta(
      publicacion
    );

  if (!clave) {
    return;
  }

  try {
    localStorage.removeItem(
      clave
    );
  } catch {
    // No bloquea el flujo.
  }
}

function guardarRetornoPropuesta(
  publicacion
) {
  const publicacionId =
    Number(
      publicacion?.id
    );

  if (
    !Number.isFinite(
      publicacionId
    ) ||
    publicacionId <= 0
  ) {
    return;
  }

  try {
    sessionStorage.setItem(
      CLAVE_RETORNO_PROPUESTA,
      JSON.stringify({
        publicacionId,
        creadoEn:
          Date.now(),
      })
    );
  } catch {
    // No bloquea el flujo.
  }
}

function leerRetornoPropuesta() {
  try {
    const guardado =
      sessionStorage.getItem(
        CLAVE_RETORNO_PROPUESTA
      );

    if (!guardado) {
      return null;
    }

    const datos =
      JSON.parse(
        guardado
      );

    const creadoEn =
      Number(
        datos?.creadoEn
      );

    const publicacionId =
      Number(
        datos?.publicacionId
      );

    const vencido =
      !Number.isFinite(
        creadoEn
      ) ||
      Date.now() -
        creadoEn >
        DURACION_RETORNO_PROPUESTA;

    if (
      vencido ||
      !Number.isFinite(
        publicacionId
      )
    ) {
      sessionStorage.removeItem(
        CLAVE_RETORNO_PROPUESTA
      );

      return null;
    }

    return {
      publicacionId,
    };
  } catch {
    try {
      sessionStorage.removeItem(
        CLAVE_RETORNO_PROPUESTA
      );
    } catch {
      // No bloquea el flujo.
    }

    return null;
  }
}

function borrarRetornoPropuesta() {
  try {
    sessionStorage.removeItem(
      CLAVE_RETORNO_PROPUESTA
    );
  } catch {
    // No bloquea el flujo.
  }
}

function claveBorradorPropuesta(publicacion) {
  const identificador =
    publicacion?.id ||
    publicacion?.numero ||
    null;

  if (!identificador) {
    return null;
  }

  return `nos-sirve-borrador-propuesta-${identificador}`;
}

function limpiarBorradorPropuestaAnterior(
  clave
) {
  try {
    sessionStorage.removeItem(
      clave
    );
  } catch {
    // No bloquea el flujo.
  }
}

function guardarBorradorPropuesta(
  publicacion,
  monto
) {
  const clave =
    claveBorradorPropuesta(
      publicacion
    );

  if (!clave) {
    return;
  }

  try {
    limpiarBorradorPropuestaAnterior(
      clave
    );

    const valor =
      String(monto ?? "");

    if (!valor) {
      localStorage.removeItem(
        clave
      );

      return;
    }

    localStorage.setItem(
      clave,
      JSON.stringify({
        publicacionId:
          publicacion?.id ||
          null,

        numero:
          publicacion?.numero ||
          null,

        monto:
          valor,

        actualizadoEn:
          Date.now(),
      })
    );
  } catch {
    // No bloquea el flujo.
  }
}

function leerBorradorPropuesta(
  publicacion
) {
  const clave =
    claveBorradorPropuesta(
      publicacion
    );

  if (!clave) {
    return "";
  }

  try {
    limpiarBorradorPropuestaAnterior(
      clave
    );

    const guardado =
      localStorage.getItem(
        clave
      );

    if (!guardado) {
      return "";
    }

    const datos =
      JSON.parse(
        guardado
      );

    const actualizadoEn =
      Number(
        datos?.actualizadoEn
      );

    const vencido =
      !Number.isFinite(
        actualizadoEn
      ) ||
      Date.now() -
        actualizadoEn >
        DURACION_BORRADOR_PROPUESTA;

    if (vencido) {
      localStorage.removeItem(
        clave
      );

      return "";
    }

    return String(
      datos?.monto ??
      ""
    );
  } catch {
    try {
      localStorage.removeItem(
        clave
      );
    } catch {
      // No bloquea el flujo.
    }

    return "";
  }
}

function borrarBorradorPropuesta(
  publicacion
) {
  const clave =
    claveBorradorPropuesta(
      publicacion
    );

  if (!clave) {
    return;
  }

  try {
    localStorage.removeItem(
      clave
    );

    limpiarBorradorPropuestaAnterior(
      clave
    );
  } catch {
    // No bloquea el flujo.
  }
}

function esFuenteImagen(valor) {
  return (
    typeof valor === "string" &&
    (
      valor.startsWith("data:image") ||
      valor.startsWith("http://") ||
      valor.startsWith("https://")
    )
  );
}

function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString("es-AR");
}

function primerNombre(valor) {
  return String(valor || "")
    .trim()
    .split(/\s+/)[0] || "";
}

function esCategoriaLibro(categoria) {
  return String(categoria || "")
    .trim()
    .toLowerCase()
    .includes("libro");
}

function formatearFormaEntrega(forma) {
  const etiquetas = {
    EN_MANO: "En mano",
    ENVIO: "Envío",
    RETIRO: "Retiro",
    "Entrega en mano": "En mano",
    "En mano": "En mano",
    Envío: "Envío",
    Retiro: "Retiro",
  };

  return etiquetas[forma] || String(forma || "").trim();
}

function etiquetaDatoEspecifico(clave) {
  const etiquetas = {
    autor: "Autor",
    editorial: "Editorial",
    isbn: "ISBN",
    idioma: "Idioma",
    marca: "Marca",
    modelo: "Modelo",
    color: "Color",
    material: "Material",
    medidas: "Medidas",
    talle: "Talle",
    capacidad: "Capacidad",
    anio: "Año",
    edicion: "Edición",
    incluye: "Incluye",
    tipo: "Tipo",
    serie: "Serie",
    personaje: "Personaje",
    potencia: "Potencia",
    tamano: "Tamaño",
  };

  if (etiquetas[clave]) {
    return etiquetas[clave];
  }

  const texto = String(clave || "")
    .replace(/_/g, " ")
    .trim();

  if (!texto) {
    return "Dato";
  }

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}

function textoDatoEspecifico(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) =>
        String(item || "").trim()
      )
      .filter(Boolean)
      .join(", ");
  }

  if (
    valor &&
    typeof valor === "object"
  ) {
    return Object.values(valor)
      .map((item) =>
        String(item || "").trim()
      )
      .filter(Boolean)
      .join(", ");
  }

  return String(valor ?? "").trim();
}

function obtenerDatosEspecificosVisibles(
  publicacion
) {
  const origen =
    publicacion?.datos_especificos ||
    publicacion?.datosEspecificos ||
    {};

  if (
    !origen ||
    typeof origen !== "object" ||
    Array.isArray(origen)
  ) {
    return [];
  }

  const prioridad = [
    "autor",
    "editorial",
    "isbn",
    "idioma",
    "marca",
    "modelo",
    "edicion",
    "anio",
    "color",
    "material",
    "medidas",
    "tamano",
    "talle",
    "capacidad",
    "potencia",
    "incluye",
    "tipo",
    "serie",
    "personaje",
  ];

  return Object.entries(origen)
    .map(([clave, valor]) => ({
      clave,
      valor:
        textoDatoEspecifico(valor),
    }))
    .filter((item) =>
      Boolean(item.valor)
    )
    .sort((a, b) => {
      const indiceA =
        prioridad.indexOf(a.clave);

      const indiceB =
        prioridad.indexOf(b.clave);

      const ordenA =
        indiceA === -1
          ? 999
          : indiceA;

      const ordenB =
        indiceB === -1
          ? 999
          : indiceB;

      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }

      return etiquetaDatoEspecifico(
        a.clave
      ).localeCompare(
        etiquetaDatoEspecifico(
          b.clave
        ),
        "es"
      );
    });
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

  for (const valor of posibles) {
    const numero = Number(valor);

    if (
      Number.isFinite(numero) &&
      numero >= 0
    ) {
      return numero;
    }
  }

  return 0;
}

function obtenerFechaCierrePublicacion(
  publicacion
) {
  return (
    publicacion?.fechaCierre ||
    publicacion?.fecha_cierre ||
    publicacion?.cierre ||
    publicacion?.fecha_fin ||
    publicacion?.fechaFin ||
    null
  );
}

function leerContextoDetalle() {
  try {
    const guardado =
      sessionStorage.getItem(
        "contexto-detalle-publicacion"
      );

    if (!guardado) {
      return null;
    }

    const contexto =
      JSON.parse(guardado);

    if (
      !contexto ||
      typeof contexto !== "object"
    ) {
      return null;
    }

    return contexto;
  } catch {
    return null;
  }
}

function formatearFechaHora(fecha) {
  if (!fecha) {
    return "";
  }

  const valor =
    new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "";
  }

  return valor.toLocaleString(
    "es-AR",
    {
      timeZone:
        "America/Argentina/Cordoba",

      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

function obtenerFechaHoraMinima() {
  const ahora = new Date();

  ahora.setSeconds(0, 0);

  const desplazamiento =
    ahora.getTimezoneOffset() *
    60000;

  return new Date(
    ahora.getTime() -
    desplazamiento
  )
    .toISOString()
    .slice(0, 16);
}

function IconoUbicacion({
  size = 19,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function IconoReloj({
  size = 19,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoPropuesta({
  size = 20,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 5h14v10H9l-4 4V5Z" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

function IconoFlecha({
  direccion = "derecha",
}) {
  const esIzquierda =
    direccion === "izquierda";

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {esIzquierda ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

function DetallePublicacion() {
  const {
    id,
    numero,
  } = useParams();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const parametros =
    new URLSearchParams(
      location.search
    );

  const origen =
    parametros.get("desde");

  const preguntaObjetivo =
    parametros.get("pregunta");

  const vieneDeMisPropuestas =
    origen === "mis-propuestas";

  const contextoDetalle =
    leerContextoDetalle();

  const origenGuardado =
    sessionStorage.getItem(
      "origen-detalle-publicacion"
    );

  const origenDetalle =
    vieneDeMisPropuestas
      ? "mis-propuestas"
      : contextoDetalle?.origen ||
        origenGuardado ||
        "publicaciones";

  const [
    publicacion,
    setPublicacion,
  ] = useState(null);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    monto,
    setMonto,
  ] = useState("");

  const [
    propuestas,
    setPropuestas,
  ] = useState([]);

  const [
    resumenPropuestas,
    setResumenPropuestas,
  ] = useState({
    cantidad: 0,
    menorImporte: 0,
    mayorImporte: 0,
  });

  const [
    preguntas,
    setPreguntas,
  ] = useState([]);

  const [
    nombresPreguntantes,
    setNombresPreguntantes,
  ] = useState({});

  const [
    preguntasAbiertas,
    setPreguntasAbiertas,
  ] = useState(false);

  const [
    nuevaPregunta,
    setNuevaPregunta,
  ] = useState("");

  const [
    enviandoPregunta,
    setEnviandoPregunta,
  ] = useState(false);

  const [
    respuestaPreguntaId,
    setRespuestaPreguntaId,
  ] = useState(null);

  const [
    respuestaPreguntaTexto,
    setRespuestaPreguntaTexto,
  ] = useState("");

  const [
    enviandoRespuestaPregunta,
    setEnviandoRespuestaPregunta,
  ] = useState(false);

  const [
    perfilActual,
    setPerfilActual,
  ] = useState(null);

  const [
    usuarioActualId,
    setUsuarioActualId,
  ] = useState(null);

  const [
    nombrePublicanteDirecto,
    setNombrePublicanteDirecto,
  ] = useState("");

  const [
    cerrando,
    setCerrando,
  ] = useState(false);

  const [
    enviandoPropuesta,
    setEnviandoPropuesta,
  ] = useState(false);

  const [
    posicionandoRetornoPropuesta,
    setPosicionandoRetornoPropuesta,
  ] = useState(() =>
    Boolean(
      leerRetornoPropuesta()
    )
  );

  const [
    procesandoDecision,
    setProcesandoDecision,
  ] = useState(false);

  const [
    procesandoRespuestaComprador,
    setProcesandoRespuestaComprador,
  ] = useState(false);

  const [
    procesandoCoordinacion,
    setProcesandoCoordinacion,
  ] = useState(false);

  const [
    modalidadEntrega,
    setModalidadEntrega,
  ] = useState("");

  const [
    fechaEntrega,
    setFechaEntrega,
  ] = useState("");

  const [
    notaEntrega,
    setNotaEntrega,
  ] = useState("");

  const [
    indiceImagen,
    setIndiceImagen,
  ] = useState(0);

  const [
    visorImagenAbierto,
    setVisorImagenAbierto,
  ] = useState(false);

  const [
    zoomVisor,
    setZoomVisor,
  ] = useState(1);

  const [
    desplazamientoVisor,
    setDesplazamientoVisor,
  ] = useState({
    x: 0,
    y: 0,
  });

  const [
    mostrarAyudaSwipe,
    setMostrarAyudaSwipe,
  ] = useState(() => {
    try {
      return (
        localStorage.getItem(
          CLAVE_AYUDA_SWIPE
        ) !== "1"
      );
    } catch {
      return true;
    }
  });

  const inicioDeslizamientoImagen =
    useRef(null);

  const ignorarClickImagenRef =
    useRef(false);

  const inicioDeslizamientoPublicacion =
    useRef(null);

  const gestoVisorRef =
    useRef(null);

  const ignorarClickVisorRef =
    useRef(false);

  const publicacionesCacheRef =
    useRef(null);

  const sesionCacheRef =
    useRef(null);

  const adminActivo =
    esAdmin();

  const fechaHoraMinima =
    obtenerFechaHoraMinima();

  async function obtenerSesion() {
    if (
      sesionCacheRef.current
    ) {
      return await sesionCacheRef.current;
    }

    sesionCacheRef.current =
      Promise.all([
        obtenerPerfilActual(),
        supabase.auth.getUser(),
      ])
        .then(
          ([
            perfil,
            resultadoUsuario,
          ]) => ({
            perfil:
              perfil ||
              null,

            usuarioId:
              resultadoUsuario
                ?.data
                ?.user
                ?.id ||
              null,
          })
        )
        .catch((error) => {
          console.error(
            "Error al cargar sesión:",
            error
          );

          return {
            perfil: null,
            usuarioId: null,
          };
        });

    return await sesionCacheRef.current;
  }

  async function obtenerListaPublicaciones(
    forzar = false
  ) {
    if (
      !forzar &&
      Array.isArray(
        publicacionesCacheRef.current
      )
    ) {
      return publicacionesCacheRef.current;
    }

    const publicaciones =
      await obtenerPublicaciones();

    const lista =
      Array.isArray(publicaciones)
        ? publicaciones
        : [];

    publicacionesCacheRef.current =
      lista;

    return lista;
  }

  async function obtenerNombrePublicanteDirecto(
    publicacionEncontrada
  ) {
    const existente =
      String(
        publicacionEncontrada?.nombrePublicante ||
        publicacionEncontrada?.publicadoPor ||
        ""
      ).trim();

    if (existente) {
      setNombrePublicanteDirecto(
        primerNombre(
          existente
        )
      );

      return;
    }

    const creadorId =
      publicacionEncontrada?.creadoPor ||
      publicacionEncontrada?.creado_por ||
      null;

    if (!creadorId) {
      setNombrePublicanteDirecto("");
      return;
    }

    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "obtener_nombre_publicante",
          {
            p_usuario_id:
              creadorId,
          }
        );

      if (error) {
        console.error(
          "No se pudo obtener el nombre de quien publicó:",
          error
        );

        setNombrePublicanteDirecto("");
        return;
      }

      const registro =
        Array.isArray(data)
          ? data[0]
          : data;

      setNombrePublicanteDirecto(
        primerNombre(
          registro?.nombre ||
          ""
        )
      );
    } catch (error) {
      console.error(
        "Error al obtener el nombre de quien publicó:",
        error
      );

      setNombrePublicanteDirecto("");
    }
  }

  async function obtenerDatosDecision(
    publicacionId
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from("publicaciones")
        .select(`
          datos_especificos,
          estado_decision,
          motivo_sin_acuerdo,
          propuesta_elegida_id,
          fecha_inicio_decision,
          fecha_limite_decision,
          fecha_decision,
          estado_confirmacion_comprador,
          fecha_limite_confirmacion_comprador,
          fecha_confirmacion_comprador,
          fecha_limite_coordinacion,
          fecha_coordinacion,
          modalidad_entrega_acordada,
          fecha_entrega_acordada,
          nota_entrega_acordada,
          coordinacion_registrada_por
        `)
        .eq(
          "id",
          Number(publicacionId)
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Error al cargar el estado de decisión:",
        error
      );

      return {};
    }

    return data || {};
  }

  async function cargarPublicacion({
    forzarLista = false,
  } = {}) {
    try {
      const publicaciones =
        await obtenerListaPublicaciones(
          forzarLista
        );

      const encontrada =
        id
          ? publicaciones.find(
              (item) =>
                String(item.id) ===
                String(id)
            )
          : publicaciones.find(
              (item) =>
                String(item.numero) ===
                String(numero)
            );

      if (!encontrada) {
        setPublicacion(null);
        setNombrePublicanteDirecto("");
        return null;
      }

      if (
        !publicacion ||
        String(publicacion.id) !==
          String(encontrada.id)
      ) {
        setPublicacion(encontrada);
      }

      const datosDecision =
        await obtenerDatosDecision(
          encontrada.id
        );

      const completa = {
        ...encontrada,
        ...datosDecision,
      };

      setPublicacion(completa);

      await obtenerNombrePublicanteDirecto(
        completa
      );

      return completa;
    } catch (error) {
      console.error(
        "Error al cargar la publicación:",
        error
      );

      setPublicacion(null);
      setNombrePublicanteDirecto("");

      return null;
    }
  }

  async function cargarPropuestas(
    publicacionId
  ) {
    try {
      const [
        datos,
        resumen,
      ] =
        await Promise.all([
          obtenerPropuestas(
            publicacionId
          ),

          obtenerResumenPropuestas(
            publicacionId
          ),
        ]);

      setPropuestas(
        Array.isArray(datos)
          ? datos
          : []
      );

      setResumenPropuestas({
        cantidad:
          Number(
            resumen?.cantidad ||
            0
          ),

        menorImporte:
          Number(
            resumen?.menorImporte ||
            0
          ),

        mayorImporte:
          Number(
            resumen?.mayorImporte ||
            0
          ),
      });
    } catch (error) {
      console.error(
        "Error al cargar las propuestas:",
        error
      );

      setPropuestas([]);

      setResumenPropuestas({
        cantidad: 0,
        menorImporte: 0,
        mayorImporte: 0,
      });
    }
  }

  async function cargarPreguntas(
    publicacionId
  ) {
    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "preguntas_publicacion"
          )
          .select(`
            id,
            publicacion_id,
            usuario_pregunta_id,
            pregunta,
            respuesta,
            estado,
            created_at,
            respondida_at
          `)
          .eq(
            "publicacion_id",
            Number(
              publicacionId
            )
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

      if (error) {
        throw error;
      }

      const listaPreguntas =
        Array.isArray(data)
          ? data
          : [];

      const listaOrdenada =
        [...listaPreguntas].sort(
          (a, b) => {
            const aRespondida =
              Boolean(
                String(
                  a?.respuesta ||
                  ""
                ).trim()
              );

            const bRespondida =
              Boolean(
                String(
                  b?.respuesta ||
                  ""
                ).trim()
              );

            if (
              aRespondida !==
              bRespondida
            ) {
              return aRespondida
                ? 1
                : -1;
            }

            return (
              new Date(
                a?.created_at ||
                0
              ).getTime() -
              new Date(
                b?.created_at ||
                0
              ).getTime()
            );
          }
        );

      setPreguntas(
        listaOrdenada
      );

      const {
        data:
          nombresPublicos,
        error:
          errorNombres,
      } =
        await supabase.rpc(
          "obtener_nombres_preguntantes_publicacion",
          {
            p_publicacion_id:
              Number(
                publicacionId
              ),
          }
        );

      if (errorNombres) {
        throw errorNombres;
      }

      const mapaNombres =
        Object.fromEntries(
          (
            Array.isArray(
              nombresPublicos
            )
              ? nombresPublicos
              : []
          ).map(
            (registro) => [
              String(
                registro.pregunta_id
              ),

              primerNombre(
                registro.nombre ||
                ""
              ),
            ]
          )
        );

      setNombresPreguntantes(
        mapaNombres
      );
    } catch (error) {
      console.error(
        "Error al cargar preguntas:",
        error
      );

      setPreguntas([]);
      setNombresPreguntantes({});
    }
  }

  async function iniciarDecisionSiCorresponde(
    publicacionEncontrada,
    usuarioId
  ) {
    if (
      !publicacionEncontrada ||
      !usuarioId
    ) {
      return publicacionEncontrada;
    }

    const creador =
      publicacionEncontrada.creadoPor ||
      publicacionEncontrada.creado_por ||
      null;

    const esDueno =
      creador === usuarioId;

    const estaCerrada =
      publicacionEncontrada.estado ===
        "FINALIZADO" ||
      publicacionEncontrada.estado ===
        "ARCHIVADO";

    const recibePropuestasLocal =
      publicacionEncontrada.modalidad ===
        "RECIBE_PROPUESTAS" ||
      !publicacionEncontrada.modalidad;

    if (
      !esDueno ||
      !estaCerrada ||
      !recibePropuestasLocal ||
      publicacionEncontrada.estado_decision
    ) {
      return publicacionEncontrada;
    }

    const { error } =
      await supabase.rpc(
        "iniciar_decision_publicacion",
        {
          p_publicacion_id:
            Number(
              publicacionEncontrada.id
            ),
        }
      );

    if (error) {
      console.error(
        "Error al iniciar el plazo de decisión:",
        error
      );

      return publicacionEncontrada;
    }

    publicacionesCacheRef.current =
      null;

    return await cargarPublicacion({
      forzarLista: true,
    });
  }

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      const vistaPreviaCorrecta =
        Boolean(
          publicacion &&
          (
            id
              ? String(publicacion.id) ===
                String(id)
              : String(publicacion.numero) ===
                String(numero)
          )
        );

      if (!vistaPreviaCorrecta) {
        setCargando(true);
      }

      try {
        const [
          publicacionEncontrada,
          sesion,
        ] =
          await Promise.all([
            cargarPublicacion(),
            obtenerSesion(),
          ]);

        if (cancelado) {
          return;
        }

        setPerfilActual(
          sesion.perfil
        );

        setUsuarioActualId(
          sesion.usuarioId
        );

        let publicacionLista =
          publicacionEncontrada;

        if (publicacionEncontrada) {
          publicacionLista =
            await iniciarDecisionSiCorresponde(
              publicacionEncontrada,
              sesion.usuarioId
            );

          if (cancelado) {
            return;
          }

          const publicacionIdActual =
            publicacionLista?.id ||
            publicacionEncontrada.id;

          await Promise.all([
            cargarPropuestas(
              publicacionIdActual
            ),

            cargarPreguntas(
              publicacionIdActual
            ),
          ]);
        } else {
          setPropuestas([]);

          setResumenPropuestas({
            cantidad: 0,
            menorImporte: 0,
            mayorImporte: 0,
          });
        }

        if (cancelado) {
          return;
        }

        const publicacionParaBorrador =
          publicacionLista ||
          publicacionEncontrada;

        const montoGuardado =
          publicacionParaBorrador
            ? leerBorradorPropuesta(
                publicacionParaBorrador
              )
            : "";

        setMonto(
          montoGuardado
        );

        const preguntaGuardada =
          publicacionParaBorrador
            ? leerBorradorPregunta(
                publicacionParaBorrador
              )
            : "";

        setNuevaPregunta(
          preguntaGuardada
        );

        if (
          preguntaGuardada.trim()
        ) {
          setPreguntasAbiertas(
            true
          );
        }

        setIndiceImagen(0);
        setVisorImagenAbierto(false);
        setZoomVisor(1);

        setDesplazamientoVisor({
          x: 0,
          y: 0,
        });
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    iniciar();

    return () => {
      cancelado = true;
    };
  }, [
    id,
    numero,
  ]);

  useEffect(() => {
    const publicacionId =
      Number(
        publicacion?.id
      );

    if (
      !Number.isFinite(
        publicacionId
      ) ||
      publicacionId <= 0
    ) {
      return undefined;
    }

    const cancelar =
      suscribirseAPropuestas(
        publicacionId,
        (
          propuestasActualizadas
        ) => {
          setPropuestas(
            Array.isArray(
              propuestasActualizadas
            )
              ? propuestasActualizadas
              : []
          );
        },
        {
          onResumen:
            (
              resumenActualizado
            ) => {
              setResumenPropuestas({
                cantidad:
                  Number(
                    resumenActualizado?.cantidad ||
                    0
                  ),

                menorImporte:
                  Number(
                    resumenActualizado?.menorImporte ||
                    0
                  ),

                mayorImporte:
                  Number(
                    resumenActualizado?.mayorImporte ||
                    0
                  ),
              });
            },
        }
      );

    return () => {
      cancelar?.();
    };
  }, [
    publicacion?.id,
  ]);

  useEffect(() => {
    if (!publicacion) {
      return undefined;
    }

    function rehidratarBorradores() {
      const montoGuardado =
        leerBorradorPropuesta(
          publicacion
        );

      setMonto(
        montoGuardado
      );

      const preguntaGuardada =
        leerBorradorPregunta(
          publicacion
        );

      setNuevaPregunta(
        preguntaGuardada
      );

      if (
        preguntaGuardada.trim()
      ) {
        setPreguntasAbiertas(
          true
        );
      }
    }

    function manejarVisibilidad() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        rehidratarBorradores();
      }
    }

    function manejarPageShow() {
      rehidratarBorradores();
    }

    function manejarFocus() {
      rehidratarBorradores();
    }

    window.addEventListener(
      "pageshow",
      manejarPageShow
    );

    window.addEventListener(
      "focus",
      manejarFocus
    );

    document.addEventListener(
      "visibilitychange",
      manejarVisibilidad
    );

    rehidratarBorradores();

    return () => {
      window.removeEventListener(
        "pageshow",
        manejarPageShow
      );

      window.removeEventListener(
        "focus",
        manejarFocus
      );

      document.removeEventListener(
        "visibilitychange",
        manejarVisibilidad
      );
    };
  }, [
    publicacion?.id,
    publicacion?.numero,
  ]);

  useEffect(() => {
    if (
      !publicacion?.id ||
      !usuarioActualId
    ) {
      return undefined;
    }

    const retorno =
      leerRetornoPropuesta();

    if (
      !retorno ||
      Number(
        retorno.publicacionId
      ) !==
        Number(
          publicacion.id
        )
    ) {
      setPosicionandoRetornoPropuesta(
        false
      );

      return undefined;
    }

    let frame1 = null;
    let frame2 = null;

    frame1 =
      requestAnimationFrame(
        () => {
          const formulario =
            document.getElementById(
              "sv-propuesta-formulario"
            );

          if (!formulario) {
            setPosicionandoRetornoPropuesta(
              false
            );

            return;
          }

          formulario.scrollIntoView({
            behavior: "auto",
            block: "center",
          });

          frame2 =
            requestAnimationFrame(
              () => {
                const campo =
                  formulario.querySelector(
                    'input[type="number"]'
                  );

                campo?.focus({
                  preventScroll: true,
                });

                borrarRetornoPropuesta();

                setPosicionandoRetornoPropuesta(
                  false
                );
              }
            );
        }
      );

    return () => {
      if (frame1) {
        cancelAnimationFrame(
          frame1
        );
      }

      if (frame2) {
        cancelAnimationFrame(
          frame2
        );
      }
    };
  }, [
    publicacion?.id,
    usuarioActualId,
  ]);

  useEffect(() => {
    if (
      !preguntaObjetivo ||
      preguntas.length === 0
    ) {
      return undefined;
    }

    const preguntaEncontrada =
      preguntas.find(
        (pregunta) =>
          String(
            pregunta.id
          ) ===
          String(
            preguntaObjetivo
          )
      );

    if (!preguntaEncontrada) {
      return undefined;
    }

    setPreguntasAbiertas(
      true
    );

    const creador =
      publicacion?.creadoPor ||
      publicacion?.creado_por ||
      null;

    const esDueno =
      Boolean(
        usuarioActualId &&
        creador &&
        usuarioActualId ===
          creador
      );

    if (
      esDueno &&
      !preguntaEncontrada.respuesta
    ) {
      setRespuestaPreguntaId(
        preguntaEncontrada.id
      );

      setRespuestaPreguntaTexto(
        ""
      );
    }

    const temporizador =
      window.setTimeout(
        () => {
          const elemento =
            document.getElementById(
              `pregunta-${preguntaEncontrada.id}`
            );

          if (!elemento) {
            return;
          }

          elemento.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          if (
            esDueno &&
            !preguntaEncontrada.respuesta
          ) {
            const campo =
              elemento.querySelector(
                "textarea"
              );

            campo?.focus();
          }
        },
        120
      );

    return () => {
      window.clearTimeout(
        temporizador
      );
    };
  }, [
    preguntaObjetivo,
    preguntas,
    publicacion?.id,
    publicacion?.creadoPor,
    publicacion?.creado_por,
    usuarioActualId,
  ]);

  useEffect(() => {
    if (!visorImagenAbierto) {
      return undefined;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function manejarTecla(event) {
      if (event.key === "Escape") {
        setVisorImagenAbierto(false);
        setZoomVisor(1);

        setDesplazamientoVisor({
          x: 0,
          y: 0,
        });
      }
    }

    window.addEventListener(
      "keydown",
      manejarTecla
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        manejarTecla
      );
    };
  }, [
    visorImagenAbierto,
  ]);

  if (
    cargando &&
    !publicacion
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8f5f1",
          color: "#075753",
        }}
      >
        Cargando publicación...
      </main>
    );
  }

  if (!publicacion) {
    return (
      <main className="sv-pantalla-fondo">
        <section className="sv-pantalla-app sv-detalle-app">
          <CabeceraNosSirve
            className="sv-detalle-header"
          />

          <div className="sv-detalle-no-encontrada">
            <h1>
              Publicación no encontrada
            </h1>

            <Link
              to={
                vieneDeMisPropuestas
                  ? "/mis-propuestas"
                  : "/publicaciones"
              }
            >
              Volver
            </Link>
          </div>

        </section>
      </main>
    );
  }

  const publicacionCerrada =
    publicacion.estado ===
    "FINALIZADO";

  const publicacionArchivada =
    publicacion.estado ===
    "ARCHIVADO";

  const recepcionCerrada =
    publicacionCerrada ||
    publicacionArchivada;

  const recibePropuestas =
    publicacion.modalidad ===
      "RECIBE_PROPUESTAS" ||
    !publicacion.modalidad;

  const esPrecioFijo =
    !recibePropuestas;

  const creadorPublicacion =
    publicacion.creadoPor ||
    publicacion.creado_por ||
    null;

  const esPropietario =
    Boolean(
      usuarioActualId &&
      creadorPublicacion &&
      usuarioActualId ===
        creadorPublicacion
    );

  const puedeGestionarPropuestas =
    esPropietario ||
    adminActivo;

  const estadoDecision =
    publicacion.estado_decision ||
    null;

  const motivoSinAcuerdo =
    publicacion.motivo_sin_acuerdo ||
    null;

  const propuestaElegidaId =
    publicacion.propuesta_elegida_id ||
    null;

  const estadoConfirmacionComprador =
    publicacion.estado_confirmacion_comprador ||
    null;

  const decisionPendiente =
    estadoDecision ===
    "PENDIENTE";

  const decisionAceptada =
    estadoDecision ===
    "ACEPTADA";

  const decisionSinAcuerdo =
    estadoDecision ===
    "SIN_ACUERDO";

  const confirmacionPendiente =
    decisionAceptada &&
    estadoConfirmacionComprador ===
      "PENDIENTE";

  const confirmacionConfirmada =
    decisionAceptada &&
    estadoConfirmacionComprador ===
      "CONFIRMADA";

  const entregaCoordinada =
    Boolean(
      publicacion.fecha_coordinacion
    );

  const ubicacionVisible =
    [
      publicacion.localidad,
      publicacion.barrio,
    ]
      .map((valor) =>
        String(valor || "").trim()
      )
      .filter(Boolean)
      .join(" - ") ||
    String(
      publicacion.provincia ||
      ""
    ).trim() ||
    "Ubicación a confirmar";

  const identidadPropuesta =
    perfilActual
      ? {
          nombre:
            `${perfilActual.nombre || ""} ${perfilActual.apellido || ""}`
              .trim(),

          telefono:
            perfilActual.telefono ||
            "",
        }
      : null;

  const imagenes =
    Array.isArray(
      publicacion.imagenes
    ) &&
    publicacion.imagenes.length > 0
      ? publicacion.imagenes
      : publicacion.imagen
        ? [publicacion.imagen]
        : [];

  const imagenActual =
    imagenes[indiceImagen] ||
    "";

  const cantidadPropuestasResumen =
    Number(
      resumenPropuestas?.cantidad ||
      0
    );

  const mayorImportePropuesto =
    cantidadPropuestasResumen > 0
      ? Number(
          resumenPropuestas?.mayorImporte ||
          0
        )
      : 0;

  const menorImportePropuesto =
    cantidadPropuestasResumen > 0
      ? Number(
          resumenPropuestas?.menorImporte ||
          0
        )
      : 0;

  const propuestasDelUsuario =
    propuestas.filter(
      (propuesta) => {
        const usuarioPropuestaId =
          propuesta.usuario_id ||
          propuesta.usuarioId ||
          propuesta.creado_por ||
          propuesta.creadoPor ||
          null;

        return Boolean(
          usuarioActualId &&
          usuarioPropuestaId &&
          usuarioActualId ===
            usuarioPropuestaId
        );
      }
    );

  const propuestaPropiaActual =
    propuestasDelUsuario.length > 0
      ? propuestasDelUsuario.reduce(
          (
            mayor,
            propuesta
          ) =>
            Number(
              propuesta.monto
            ) >
            Number(
              mayor.monto
            )
              ? propuesta
              : mayor
        )
      : null;

  const propuestaElegida =
    propuestas.find(
      (propuesta) =>
        Number(
          propuesta.id
        ) ===
        Number(
          propuestaElegidaId
        )
    ) ||
    null;

  const propuestaPropiaFueElegida =
    Boolean(
      propuestaPropiaActual &&
      propuestaElegidaId &&
      Number(
        propuestaPropiaActual.id
      ) ===
        Number(
          propuestaElegidaId
        )
    );

  const puedeRegistrarCoordinacion =
    confirmacionConfirmada &&
    !entregaCoordinada &&
    (
      esPropietario ||
      propuestaPropiaFueElegida
    );

  const textoLimiteDecision =
    formatearFechaHora(
      publicacion.fecha_limite_decision
    );

  const textoLimiteConfirmacion =
    formatearFechaHora(
      publicacion.fecha_limite_confirmacion_comprador
    );

  const textoLimiteCoordinacion =
    formatearFechaHora(
      publicacion.fecha_limite_coordinacion
    );

  const textoFechaEntrega =
    formatearFechaHora(
      publicacion.fecha_entrega_acordada
    );

  const textoCierreReal =
    formatearFechaHora(
      obtenerFechaCierrePublicacion(
        publicacion
      )
    );

  const valorPublicacion =
    obtenerValorPublicacion(
      publicacion
    );

  const datosEspecificosVisibles =
    obtenerDatosEspecificosVisibles(
      publicacion
    );

  const esLibro =
    esCategoriaLibro(
      publicacion.categoria
    );

  const marcaVisible =
    textoDatoEspecifico(
      publicacion.marca
    );

  const modeloVisible =
    textoDatoEspecifico(
      publicacion.modelo
    );

  const tieneMarcaEnDatos =
    datosEspecificosVisibles.some(
      (item) =>
        item.clave === "marca"
    );

  const tieneModeloEnDatos =
    datosEspecificosVisibles.some(
      (item) =>
        item.clave === "modelo"
    );

  const clavesLibro =
    new Set([
      "autor",
      "editorial",
      "isbn",
      "idioma",
    ]);

  const datosObjetoVisibles =
    esLibro
      ? datosEspecificosVisibles.filter(
          (item) =>
            clavesLibro.has(
              item.clave
            )
        )
      : [
          ...datosEspecificosVisibles,

          ...(
            marcaVisible &&
            !tieneMarcaEnDatos
              ? [
                  {
                    clave: "marca",
                    valor: marcaVisible,
                  },
                ]
              : []
          ),

          ...(
            modeloVisible &&
            !tieneModeloEnDatos
              ? [
                  {
                    clave: "modelo",
                    valor: modeloVisible,
                  },
                ]
              : []
          ),
        ];

  const nombrePublicante =
    primerNombre(
      nombrePublicanteDirecto ||
      publicacion.nombrePublicante ||
      publicacion.publicadoPor ||
      ""
    );

  const tituloPublicacion =
    String(
      publicacion.titulo ||
      "Objeto publicado"
    ).trim();

  const tituloEsLargo =
    tituloPublicacion.length >
    30;

  const formasEntregaVisibles =
    Array.isArray(
      publicacion.formasEntrega
    )
      ? publicacion.formasEntrega
          .map(
            formatearFormaEntrega
          )
          .filter(Boolean)
      : [];

  const funcionamientoVisible =
    publicacion.funcionamiento ===
    "SI"
      ? "Sí"
      : publicacion.funcionamiento ===
          "NO"
        ? "No"
        : publicacion.funcionamiento ===
            "NO_SE"
          ? "El vendedor no pudo comprobarlo"
          : "";

  const preguntasOrdenadas =
    [...preguntas].sort(
      (a, b) => {
        const aRespondida =
          Boolean(
            a.respuesta
          );

        const bRespondida =
          Boolean(
            b.respuesta
          );

        if (
          aRespondida !==
          bRespondida
        ) {
          return aRespondida
            ? 1
            : -1;
        }

        return (
          new Date(
            a.created_at ||
            0
          ).getTime() -
          new Date(
            b.created_at ||
            0
          ).getTime()
        );
      }
    );

  const montoNumerico =
    Number(monto);

  const montoValido =
    Number.isFinite(
      montoNumerico
    ) &&
    montoNumerico >= 1000 &&
    montoNumerico % 500 === 0;

  const numerosContexto =
    Array.isArray(
      contextoDetalle?.numeros
    )
      ? contextoDetalle.numeros
          .map(
            (valor) =>
              Number(valor)
          )
          .filter(
            (valor) =>
              Number.isFinite(
                valor
              )
          )
      : [];

  const numeroActual =
    Number(
      publicacion.numero
    );

  const indicePublicacionActual =
    numerosContexto.findIndex(
      (valor) =>
        valor === numeroActual
    );

  const numeroAnterior =
    indicePublicacionActual > 0
      ? numerosContexto[
          indicePublicacionActual - 1
        ]
      : null;

  const numeroSiguiente =
    indicePublicacionActual >= 0 &&
    indicePublicacionActual <
      numerosContexto.length - 1
      ? numerosContexto[
          indicePublicacionActual + 1
        ]
      : null;

  const puedeRecorrerPublicaciones =
    (
      origenDetalle ===
        "publicaciones" ||
      origenDetalle ===
        "mis-publicaciones" ||
      origenDetalle ===
        "inicio"
    ) &&
    numerosContexto.length > 1 &&
    indicePublicacionActual >= 0;

  function marcarSwipeVisto() {
    if (!mostrarAyudaSwipe) {
      return;
    }

    setMostrarAyudaSwipe(false);

    try {
      localStorage.setItem(
        CLAVE_AYUDA_SWIPE,
        "1"
      );
    } catch {
      // No bloquea la navegación.
    }
  }

  function obtenerVistaPrevia(
    numeroDestino
  ) {
    const lista =
      publicacionesCacheRef.current;

    if (!Array.isArray(lista)) {
      return null;
    }

    return (
      lista.find(
        (item) =>
          Number(item.numero) ===
          Number(numeroDestino)
      ) ||
      null
    );
  }

  function navegarAPublicacion(
    numeroDestino
  ) {
    if (!numeroDestino) {
      return;
    }

    const vistaPrevia =
      obtenerVistaPrevia(
        numeroDestino
      );

    if (vistaPrevia) {
      setPublicacion(
        vistaPrevia
      );

      setNombrePublicanteDirecto(
        primerNombre(
          vistaPrevia.nombrePublicante ||
          vistaPrevia.publicadoPor ||
          ""
        )
      );

      setIndiceImagen(0);

      setMonto(
        leerBorradorPropuesta(
          vistaPrevia
        )
      );

      setPropuestas([]);
      setPreguntas([]);

      setNuevaPregunta(
        leerBorradorPregunta(
          vistaPrevia
        )
      );
    }

    marcarSwipeVisto();

    navigate(
      `/publicacion/${numeroDestino}`,
      {
        replace: true,
      }
    );
  }

  function volverAlOrigen() {
    if (
      origenDetalle ===
      "mis-publicaciones"
    ) {
      navigate(
        "/mis-publicaciones"
      );

      return;
    }

    if (
      origenDetalle ===
      "mis-propuestas"
    ) {
      navigate(
        "/mis-propuestas"
      );

      return;
    }

    if (
      origenDetalle ===
      "inicio"
    ) {
      navigate("/");
      return;
    }

    navigate(
      "/publicaciones"
    );
  }

  function textoVolverOrigen() {
    if (
      origenDetalle ===
      "mis-publicaciones"
    ) {
      return "← Volver a Mis publicaciones";
    }

    if (
      origenDetalle ===
      "mis-propuestas"
    ) {
      return "← Volver a Mis propuestas";
    }

    if (
      origenDetalle ===
      "inicio"
    ) {
      return "← Volver al inicio";
    }

    return "← Volver a publicaciones";
  }

  function mostrarImagenAnterior() {
    if (
      imagenes.length <= 1
    ) {
      return;
    }

    setIndiceImagen(
      (indiceActual) =>
        indiceActual === 0
          ? imagenes.length - 1
          : indiceActual - 1
    );

    setZoomVisor(1);

    setDesplazamientoVisor({
      x: 0,
      y: 0,
    });
  }

  function mostrarImagenSiguiente() {
    if (
      imagenes.length <= 1
    ) {
      return;
    }

    setIndiceImagen(
      (indiceActual) =>
        indiceActual ===
        imagenes.length - 1
          ? 0
          : indiceActual + 1
    );

    setZoomVisor(1);

    setDesplazamientoVisor({
      x: 0,
      y: 0,
    });
  }

  function abrirVisorImagen() {
    if (!imagenActual) {
      return;
    }

    setZoomVisor(1);

    setDesplazamientoVisor({
      x: 0,
      y: 0,
    });

    setVisorImagenAbierto(
      true
    );
  }

  function cerrarVisorImagen() {
    setVisorImagenAbierto(
      false
    );

    setZoomVisor(1);

    setDesplazamientoVisor({
      x: 0,
      y: 0,
    });

    gestoVisorRef.current =
      null;

    ignorarClickVisorRef.current =
      false;
  }

  function manejarClickVisorImagen() {
    if (
      ignorarClickVisorRef.current
    ) {
      ignorarClickVisorRef.current =
        false;

      return;
    }

    if (zoomVisor <= 1.01) {
      cerrarVisorImagen();
    }
  }

  function distanciaEntreToques(
    toqueA,
    toqueB
  ) {
    const deltaX =
      toqueA.clientX -
      toqueB.clientX;

    const deltaY =
      toqueA.clientY -
      toqueB.clientY;

    return Math.hypot(
      deltaX,
      deltaY
    );
  }

  function iniciarGestoVisor(
    event
  ) {
    event.stopPropagation();

    const toques =
      event.touches;

    if (
      toques.length === 2
    ) {
      event.preventDefault();

      ignorarClickVisorRef.current =
        true;

      gestoVisorRef.current = {
        tipo: "pinch",

        distanciaInicial:
          distanciaEntreToques(
            toques[0],
            toques[1]
          ),

        zoomInicial:
          zoomVisor,

        xInicial:
          desplazamientoVisor.x,

        yInicial:
          desplazamientoVisor.y,
      };

      return;
    }

    if (
      toques.length !== 1
    ) {
      gestoVisorRef.current =
        null;

      return;
    }

    ignorarClickVisorRef.current =
      false;

    if (
      zoomVisor > 1.01
    ) {
      gestoVisorRef.current = {
        tipo: "pan",

        xToqueInicial:
          toques[0].clientX,

        yToqueInicial:
          toques[0].clientY,

        xInicial:
          desplazamientoVisor.x,

        yInicial:
          desplazamientoVisor.y,
      };

      return;
    }

    gestoVisorRef.current = {
      tipo: "swipe",

      xInicial:
        toques[0].clientX,

      yInicial:
        toques[0].clientY,

      xActual:
        toques[0].clientX,

      yActual:
        toques[0].clientY,
    };
  }

  function moverGestoVisor(
    event
  ) {
    event.stopPropagation();

    const gesto =
      gestoVisorRef.current;

    if (!gesto) {
      return;
    }

    if (
      gesto.tipo ===
        "pinch" &&
      event.touches.length === 2
    ) {
      event.preventDefault();

      const distanciaActual =
        distanciaEntreToques(
          event.touches[0],
          event.touches[1]
        );

      if (
        !gesto.distanciaInicial
      ) {
        return;
      }

      const nuevoZoom =
        Math.min(
          5,
          Math.max(
            1,
            gesto.zoomInicial *
              (
                distanciaActual /
                gesto.distanciaInicial
              )
          )
        );

      setZoomVisor(
        nuevoZoom
      );

      if (
        nuevoZoom <= 1.01
      ) {
        setDesplazamientoVisor({
          x: 0,
          y: 0,
        });
      }

      return;
    }

    if (
      gesto.tipo === "pan" &&
      event.touches.length === 1 &&
      zoomVisor > 1
    ) {
      event.preventDefault();

      ignorarClickVisorRef.current =
        true;

      const deltaX =
        event.touches[0].clientX -
        gesto.xToqueInicial;

      const deltaY =
        event.touches[0].clientY -
        gesto.yToqueInicial;

      setDesplazamientoVisor({
        x:
          gesto.xInicial +
          deltaX,

        y:
          gesto.yInicial +
          deltaY,
      });

      return;
    }

    if (
      gesto.tipo === "swipe" &&
      event.touches.length === 1 &&
      zoomVisor <= 1.01
    ) {
      event.preventDefault();

      gesto.xActual =
        event.touches[0].clientX;

      gesto.yActual =
        event.touches[0].clientY;
    }
  }

  function finalizarGestoVisor(
    event
  ) {
    event.stopPropagation();

    const gesto =
      gestoVisorRef.current;

    if (!gesto) {
      return;
    }

    if (
      event.touches.length > 0
    ) {
      return;
    }

    gestoVisorRef.current =
      null;

    if (
      gesto.tipo === "swipe" &&
      zoomVisor <= 1.01
    ) {
      const toqueFinal =
        event.changedTouches?.[0];

      const xFinal =
        toqueFinal?.clientX ??
        gesto.xActual;

      const yFinal =
        toqueFinal?.clientY ??
        gesto.yActual;

      const diferenciaX =
        gesto.xInicial -
        xFinal;

      const diferenciaY =
        gesto.yInicial -
        yFinal;

      const movimientoHorizontal =
        Math.abs(
          diferenciaX
        );

      const movimientoVertical =
        Math.abs(
          diferenciaY
        );

      if (
        movimientoHorizontal >= 45 &&
        movimientoHorizontal >
          movimientoVertical *
            1.15
      ) {
        ignorarClickVisorRef.current =
          true;

        if (
          diferenciaX > 0
        ) {
          mostrarImagenSiguiente();
        } else {
          mostrarImagenAnterior();
        }

        return;
      }
    }

    if (
      zoomVisor <= 1.01
    ) {
      setZoomVisor(1);

      setDesplazamientoVisor({
        x: 0,
        y: 0,
      });
    }
  }

  function reiniciarZoomVisor() {
    setZoomVisor(1);

    setDesplazamientoVisor({
      x: 0,
      y: 0,
    });

    gestoVisorRef.current =
      null;

    ignorarClickVisorRef.current =
      false;
  }

  function iniciarDeslizamientoImagen(
    event
  ) {
    if (
      event.touches?.length !== 1
    ) {
      inicioDeslizamientoImagen.current =
        null;

      return;
    }

    event.stopPropagation();

    ignorarClickImagenRef.current =
      false;

    inicioDeslizamientoImagen.current = {
      x:
        event.touches[0].clientX,

      y:
        event.touches[0].clientY,
    };
  }

  function finalizarDeslizamientoImagen(
    event
  ) {
    event.stopPropagation();

    const inicio =
      inicioDeslizamientoImagen.current;

    inicioDeslizamientoImagen.current =
      null;

    if (!inicio) {
      return;
    }

    const toqueFinal =
      event.changedTouches?.[0];

    if (!toqueFinal) {
      return;
    }

    const diferenciaX =
      inicio.x -
      toqueFinal.clientX;

    const diferenciaY =
      inicio.y -
      toqueFinal.clientY;

    const movimientoHorizontal =
      Math.abs(
        diferenciaX
      );

    const movimientoVertical =
      Math.abs(
        diferenciaY
      );

    if (
      movimientoHorizontal > 45 &&
      movimientoHorizontal >
        movimientoVertical *
          1.2
    ) {
      ignorarClickImagenRef.current =
        true;

      if (
        diferenciaX > 0
      ) {
        mostrarImagenSiguiente();
      } else {
        mostrarImagenAnterior();
      }

      return;
    }
  }

  function manejarClickImagen() {
    if (
      ignorarClickImagenRef.current
    ) {
      ignorarClickImagenRef.current =
        false;

      return;
    }

    abrirVisorImagen();
  }

  function esZonaInteractiva(
    elemento
  ) {
    if (
      !elemento ||
      typeof elemento.closest !==
        "function"
    ) {
      return false;
    }

    return Boolean(
      elemento.closest(
        "button, a, input, textarea, select, label"
      )
    );
  }

  function iniciarDeslizamientoPublicacion(
    event
  ) {
    if (
      !puedeRecorrerPublicaciones ||
      esZonaInteractiva(
        event.target
      ) ||
      event.touches?.length !== 1
    ) {
      inicioDeslizamientoPublicacion.current =
        null;

      return;
    }

    const toque =
      event.touches[0];

    const margenSistema = 28;

    const anchoVentana =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      0;

    if (
      toque.clientX <=
        margenSistema ||
      (
        anchoVentana > 0 &&
        toque.clientX >=
          anchoVentana -
          margenSistema
      )
    ) {
      inicioDeslizamientoPublicacion.current =
        null;

      return;
    }

    inicioDeslizamientoPublicacion.current = {
      x:
        toque.clientX,

      y:
        toque.clientY,
    };
  }

  function finalizarDeslizamientoPublicacion(
    event
  ) {
    if (
      !puedeRecorrerPublicaciones ||
      !inicioDeslizamientoPublicacion.current
    ) {
      inicioDeslizamientoPublicacion.current =
        null;

      return;
    }

    const toqueFinal =
      event.changedTouches?.[0];

    if (!toqueFinal) {
      inicioDeslizamientoPublicacion.current =
        null;

      return;
    }

    const inicio =
      inicioDeslizamientoPublicacion.current;

    inicioDeslizamientoPublicacion.current =
      null;

    const diferenciaX =
      inicio.x -
      toqueFinal.clientX;

    const diferenciaY =
      inicio.y -
      toqueFinal.clientY;

    const movimientoHorizontal =
      Math.abs(
        diferenciaX
      );

    const movimientoVertical =
      Math.abs(
        diferenciaY
      );

    if (
      movimientoHorizontal < 55 ||
      movimientoHorizontal <=
        movimientoVertical *
          1.2
    ) {
      return;
    }

    if (
      diferenciaX > 0 &&
      numeroSiguiente
    ) {
      navegarAPublicacion(
        numeroSiguiente
      );

      return;
    }

    if (
      diferenciaX < 0 &&
      numeroAnterior
    ) {
      navegarAPublicacion(
        numeroAnterior
      );
    }
  }

  async function refrescarTodo() {
    publicacionesCacheRef.current =
      null;

    const publicacionActualizada =
      await cargarPublicacion({
        forzarLista: true,
      });

    if (
      publicacionActualizada
    ) {
      await Promise.all([
        cargarPropuestas(
          publicacionActualizada.id
        ),

        cargarPreguntas(
          publicacionActualizada.id
        ),
      ]);
    }
  }

  async function enviarPregunta(
    event
  ) {
    event.preventDefault();

    const preguntaLimpia =
      nuevaPregunta.trim();

    guardarBorradorPregunta(
      publicacion,
      nuevaPregunta
    );

    if (
      preguntaLimpia.length < 2
    ) {
      alert(
        "Escribí tu pregunta."
      );

      return;
    }

    if (
      preguntaLimpia.length > 500
    ) {
      alert(
        "La pregunta es demasiado larga."
      );

      return;
    }

    if (esPropietario) {
      return;
    }

    if (!usuarioActualId) {
      navigate(
        "/ingresar",
        {
          state: {
            volverA:
              `${location.pathname}${location.search}`,
          },
        }
      );

      return;
    }

    try {
      setEnviandoPregunta(
        true
      );

      const {
        error,
      } =
        await supabase
          .from(
            "preguntas_publicacion"
          )
          .insert({
            publicacion_id:
              Number(
                publicacion.id
              ),

            usuario_pregunta_id:
              usuarioActualId,

            pregunta:
              preguntaLimpia,
          });

      if (error) {
        throw error;
      }

      borrarBorradorPregunta(
        publicacion
      );

      setNuevaPregunta("");

      await cargarPreguntas(
        publicacion.id
      );

      setPreguntasAbiertas(
        true
      );
    } catch (error) {
      console.error(
        "Error al enviar pregunta:",
        error
      );

      alert(
        "No se pudo enviar la pregunta."
      );
    } finally {
      setEnviandoPregunta(
        false
      );
    }
  }

  async function responderPregunta(
    preguntaId
  ) {
    const respuestaLimpia =
      respuestaPreguntaTexto.trim();

    if (
      !esPropietario ||
      !preguntaId
    ) {
      return;
    }

    if (
      respuestaLimpia.length < 1
    ) {
      alert(
        "Escribí una respuesta."
      );

      return;
    }

    if (
      respuestaLimpia.length > 1000
    ) {
      alert(
        "La respuesta es demasiado larga."
      );

      return;
    }

    try {
      setEnviandoRespuestaPregunta(
        true
      );

      const {
        error,
      } =
        await supabase.rpc(
          "responder_pregunta_publicacion",
          {
            p_pregunta_id:
              Number(
                preguntaId
              ),

            p_respuesta:
              respuestaLimpia,
          }
        );

      if (error) {
        throw error;
      }

      if (usuarioActualId) {
        const {
          error:
            errorNotificacion,
        } =
          await supabase
            .from(
              "notificaciones"
            )
            .update({
              leida: true,
            })
            .eq(
              "usuario_id",
              usuarioActualId
            )
            .eq(
              "pregunta_id",
              Number(
                preguntaId
              )
            )
            .eq(
              "tipo",
              "NUEVA_PREGUNTA"
            );

        if (
          errorNotificacion
        ) {
          console.error(
            "No se pudo marcar la notificación como leída:",
            errorNotificacion
          );
        }
      }

      setRespuestaPreguntaId(
        null
      );

      setRespuestaPreguntaTexto(
        ""
      );

      await cargarPreguntas(
        publicacion.id
      );
    } catch (error) {
      console.error(
        "Error al responder pregunta:",
        error
      );

      alert(
        error?.message ||
        "No se pudo guardar la respuesta."
      );
    } finally {
      setEnviandoRespuestaPregunta(
        false
      );
    }
  }

  async function registrarPropuesta(
    event
  ) {
    event.preventDefault();

    guardarBorradorPropuesta(
      publicacion,
      monto
    );

    if (
      recepcionCerrada
    ) {
      alert(
        "La recepción de propuestas ya está cerrada."
      );

      return;
    }

    if (
      esPropietario
    ) {
      alert(
        "No podés hacer una propuesta sobre tu propia publicación."
      );

      return;
    }

    if (
      !usuarioActualId ||
      !perfilActual ||
      !identidadPropuesta
    ) {
      guardarRetornoPropuesta(
        publicacion
      );

      navigate(
        "/ingresar",
        {
          state: {
            volverA:
              `${location.pathname}${location.search}`,
          },
        }
      );

      return;
    }

    if (!montoValido) {
      alert(
        "Ingresá un importe desde $1.000, en múltiplos de $500."
      );

      return;
    }

    try {
      setEnviandoPropuesta(
        true
      );

      await guardarPropuesta({
        publicacionId:
          publicacion.id,

        nombre:
          identidadPropuesta.nombre,

        telefono:
          identidadPropuesta.telefono,

        monto:
          montoNumerico,
      });

      borrarBorradorPropuesta(
        publicacion
      );

      await refrescarTodo();

      setMonto("");
    } catch (error) {
      console.error(
        "Error al registrar la propuesta:",
        error
      );

      const mensaje =
        error?.message ||
        "";

      if (
        mensaje.includes(
          "propia publicación"
        )
      ) {
        alert(
          "No podés hacer una propuesta sobre tu propia publicación."
        );

        return;
      }

      if (
        mensaje.includes(
          "iniciar sesión"
        )
      ) {
        navigate(
          "/ingresar",
          {
            state: {
              volverA:
                `${location.pathname}${location.search}`,
            },
          }
        );

        return;
      }

      alert(
        error?.message ||
        "No se pudo registrar la propuesta. Intentá nuevamente."
      );
    } finally {
      setEnviandoPropuesta(
        false
      );
    }
  }

  function manejarCompraDirecta() {
    if (
      recepcionCerrada
    ) {
      return;
    }

    if (
      esPropietario
    ) {
      return;
    }

    if (
      !usuarioActualId
    ) {
      navigate(
        "/ingresar",
        {
          state: {
            volverA:
              `${location.pathname}${location.search}`,
          },
        }
      );

      return;
    }

    alert(
      "El flujo de pago protegido se conectará a este botón."
    );
  }

  async function manejarCerrarRecepcion() {
    const confirmar =
      window.confirm(
        "¿Querés finalizar la recepción ahora?\n\nDespués del cierre no se podrán recibir nuevas propuestas."
      );

    if (!confirmar) {
      return;
    }

    try {
      setCerrando(true);

      await cerrarRecepcionPropuestas(
        publicacion.id
      );

      if (esPropietario) {
        const {
          error:
            errorDecision,
        } =
          await supabase.rpc(
            "iniciar_decision_publicacion",
            {
              p_publicacion_id:
                Number(
                  publicacion.id
                ),
            }
          );

        if (errorDecision) {
          throw errorDecision;
        }
      }

      await refrescarTodo();
    } catch (error) {
      console.error(
        "Error al cerrar la recepción de propuestas:",
        error
      );

      alert(
        error?.message ||
        "No se pudo cerrar la recepción de propuestas."
      );
    } finally {
      setCerrando(false);
    }
  }

  async function manejarAceptarPropuesta(
    propuesta
  ) {
    if (!esPropietario) {
      return;
    }

    const confirmar =
      window.confirm(
        `¿Querés aceptar la propuesta de ${propuesta.nombre || "esta persona"} por $${formatearDinero(propuesta.monto)}?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setProcesandoDecision(
        true
      );

      const { error } =
        await supabase.rpc(
          "aceptar_propuesta_publicacion",
          {
            p_publicacion_id:
              Number(
                publicacion.id
              ),

            p_propuesta_id:
              Number(
                propuesta.id
              ),
          }
        );

      if (error) {
        throw error;
      }

      await refrescarTodo();

      alert(
        "Propuesta elegida. Ahora la persona tendrá 24 horas para confirmar."
      );
    } catch (error) {
      console.error(
        "Error al aceptar la propuesta:",
        error
      );

      alert(
        error?.message ||
        "No se pudo aceptar la propuesta."
      );
    } finally {
      setProcesandoDecision(
        false
      );
    }
  }

  async function manejarNoAceptarNinguna() {
    if (!esPropietario) {
      return;
    }

    const confirmar =
      window.confirm(
        "¿Seguro que no querés aceptar ninguna de las propuestas recibidas?\n\nLa publicación quedará cerrada sin acuerdo."
      );

    if (!confirmar) {
      return;
    }

    try {
      setProcesandoDecision(
        true
      );

      const { error } =
        await supabase.rpc(
          "no_aceptar_ninguna_propuesta",
          {
            p_publicacion_id:
              Number(
                publicacion.id
              ),
          }
        );

      if (error) {
        throw error;
      }

      await refrescarTodo();

      alert(
        "La publicación quedó cerrada sin acuerdo."
      );
    } catch (error) {
      console.error(
        "Error al cerrar sin acuerdo:",
        error
      );

      alert(
        error?.message ||
        "No se pudo registrar la decisión."
      );
    } finally {
      setProcesandoDecision(
        false
      );
    }
  }

  async function manejarRespuestaComprador(
    respuesta
  ) {
    if (
      !propuestaPropiaFueElegida ||
      !confirmacionPendiente
    ) {
      return;
    }

    const esConfirmacion =
      respuesta === "CONFIRMAR";

    const confirmar =
      window.confirm(
        esConfirmacion
          ? "¿Querés confirmar el acuerdo?\n\nSi confirmás, tendrán 48 horas para coordinar cómo y cuándo realizar la entrega."
          : "¿Seguro que querés rechazar el acuerdo?\n\nQuien publicó podrá elegir otra propuesta disponible."
      );

    if (!confirmar) {
      return;
    }

    try {
      setProcesandoRespuestaComprador(
        true
      );

      const { error } =
        await supabase.rpc(
          "responder_propuesta_elegida",
          {
            p_publicacion_id:
              Number(
                publicacion.id
              ),

            p_respuesta:
              respuesta,
          }
        );

      if (error) {
        throw error;
      }

      await refrescarTodo();

      alert(
        esConfirmacion
          ? "Acuerdo confirmado. Ahora tienen 48 horas para coordinar la entrega."
          : "Rechazaste el acuerdo."
      );
    } catch (error) {
      console.error(
        "Error al responder la propuesta elegida:",
        error
      );

      alert(
        error?.message ||
        "No se pudo registrar tu respuesta."
      );
    } finally {
      setProcesandoRespuestaComprador(
        false
      );
    }
  }

  async function manejarRegistrarCoordinacion(
    event
  ) {
    event.preventDefault();

    if (
      !modalidadEntrega ||
      !fechaEntrega
    ) {
      alert(
        "Completá la modalidad y la fecha de entrega."
      );

      return;
    }

    const fechaSeleccionada =
      new Date(fechaEntrega);

    if (
      Number.isNaN(
        fechaSeleccionada.getTime()
      ) ||
      fechaSeleccionada.getTime() <=
        Date.now()
    ) {
      alert(
        "La fecha de entrega debe ser futura."
      );

      return;
    }

    try {
      setProcesandoCoordinacion(
        true
      );

      const { error } =
        await supabase.rpc(
          "registrar_coordinacion_entrega",
          {
            p_publicacion_id:
              Number(
                publicacion.id
              ),

            p_modalidad_entrega:
              modalidadEntrega,

            p_fecha_entrega:
              fechaSeleccionada.toISOString(),

            p_nota:
              notaEntrega ||
              null,
          }
        );

      if (error) {
        throw error;
      }

      await refrescarTodo();

      setModalidadEntrega("");
      setFechaEntrega("");
      setNotaEntrega("");

      alert(
        "La entrega quedó coordinada."
      );
    } catch (error) {
      console.error(
        "Error al registrar la coordinación:",
        error
      );

      alert(
        error?.message ||
        "No se pudo registrar la coordinación."
      );
    } finally {
      setProcesandoCoordinacion(
        false
      );
    }
  }

  const mensajeSinAcuerdoPropietario =
    motivoSinAcuerdo ===
    "PUBLICANTE_NO_ACEPTA"
      ? "Cerraste la publicación sin acuerdo."
      : motivoSinAcuerdo ===
          "COMPRADOR_RECHAZA_SIN_ALTERNATIVAS"
        ? "Cerrada sin acuerdo. La persona seleccionada decidió no continuar. Podés volver a publicar."
        : "La publicación quedó cerrada sin acuerdo.";

  const mensajeSinAcuerdoProponente =
    motivoSinAcuerdo ===
      "COMPRADOR_RECHAZA_SIN_ALTERNATIVAS" &&
    propuestaPropiaActual?.estado_resultado ===
      "RECHAZADA_COMPRADOR"
      ? "Rechazaste el acuerdo."
      : "La publicación cerró sin acuerdo.";

  return (
    <>
      <style>{`
        :root {
          --sv-petroleo: #075753;
          --sv-mostaza: #efa900;
          --sv-coral: #f15a24;
          --sv-crema: #fdfaf7;
          --sv-borde: #eadccc;
          --sv-texto: #263536;
          --sv-muted: #746960;
        }

        body {
          background: #f8f5f1;
        }

        .sv-detalle-header {
          margin-bottom: 14px;
        }

        .sv-detalle-titulo-fijo {
          display: grid;
          grid-template-columns: 40px minmax(0,1fr) 40px;
          align-items: center;
          gap: 5px;
          margin-top: -2px;
        }

        .sv-detalle-titulo-centro {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          overflow: hidden;
          text-align: center;
          white-space: nowrap;
        }

        .sv-detalle-numero {
          flex: 0 0 auto;
          font-size: 15px;
          line-height: 40px;
          font-weight: 900;
        }

        .sv-detalle-numero.propuestas {
          color: var(--sv-mostaza);
        }

        .sv-detalle-numero.quiero {
          color: var(--sv-coral);
        }

        .sv-detalle-titulo-ventana {
          min-width: 0;
          flex: 1 1 auto;
          overflow: hidden;
          white-space: nowrap;
        }

        .sv-detalle-titulo-texto {
          display: block;
          min-width: 0;
          overflow: hidden;
          color: var(--sv-petroleo);
          font-size: 15px;
          line-height: 40px;
          font-weight: 850;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .sv-detalle-titulo-marquee {
          display: flex;
          width: max-content;
          align-items: center;
          gap: 28px;
          color: var(--sv-petroleo);
          font-size: 15px;
          line-height: 40px;
          font-weight: 850;
          white-space: nowrap;
          animation:
            sv-marquee-titulo
            9s
            linear
            infinite;
        }

        .sv-detalle-titulo-marquee span {
          display: block;
          flex: 0 0 auto;
        }

        @keyframes sv-marquee-titulo {
          0%,
          15% {
            transform: translateX(0);
          }

          85%,
          100% {
            transform:
              translateX(
                calc(-50% - 14px)
              );
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .sv-detalle-titulo-marquee {
            animation: none;
          }

          .sv-detalle-titulo-marquee
          span:nth-child(2) {
            display: none;
          }
        }

        .sv-detalle-flecha {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--sv-petroleo);
          cursor: pointer;
        }

        .sv-detalle-flecha:hover:not(:disabled) {
          background: rgba(7,87,83,0.07);
        }

        .sv-detalle-flecha:disabled {
          opacity: 0.18;
          cursor: default;
        }

        .sv-detalle-ayuda-swipe {
          display: none;
          margin: 7px 4px 0;
          color: var(--sv-muted);
          text-align: center;
          font-size: 10px;
          line-height: 1.25;
        }

        @media (pointer: coarse) {
          .sv-detalle-ayuda-swipe {
            display: block;
          }
        }

        .sv-detalle-contenido {
          text-align: left;
          touch-action: pan-y;
        }

        .sv-detalle-imagen-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border: 1px solid #e3d8ca;
          border-radius: 18px;
          background: #ffffff;
        }

        .sv-detalle-imagen {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
          background: #ffffff;
          user-select: none;
          -webkit-user-drag: none;
          cursor: zoom-in;
        }

        .sv-detalle-imagen-ayuda {
          position: absolute;
          right: 10px;
          bottom: 10px;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(7,87,83,0.88);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          pointer-events: none;
        }

        .sv-visor-imagen {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background: rgba(15,18,18,0.96);
          color: #fff;
          overscroll-behavior: contain;
        }

        .sv-visor-barra {
          position: relative;
          z-index: 3;
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 14px;
          box-sizing: border-box;
        }

        .sv-visor-cerrar,
        .sv-visor-reset {
          min-height: 40px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,0.28);
          border-radius: 999px;
          background: rgba(255,255,255,0.09);
          color: #fff;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-visor-area {
          position: relative;
          min-height: 0;
          overflow: hidden;
          display: grid;
          place-items: center;
          touch-action: none;
        }

        .sv-visor-foto {
          display: block;
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          transform-origin: center;
          user-select: none;
          -webkit-user-drag: none;
          will-change: transform;
          cursor: pointer;
        }

        .sv-visor-pie {
          position: relative;
          z-index: 3;
          min-height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: 10px 14px 18px;
          box-sizing: border-box;
        }

        .sv-visor-flecha {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 23px;
          cursor: pointer;
        }

        .sv-visor-flecha:disabled {
          opacity: 0.25;
        }

        .sv-visor-contador {
          min-width: 94px;
          text-align: center;
          font-size: 12px;
          font-weight: 750;
        }

        .sv-visor-zoom {
          font-size: 11px;
          opacity: 0.82;
          text-align: center;
        }

        .sv-detalle-fotos {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin: 8px 0 2px;
        }

        .sv-detalle-foto-boton {
          width: 34px;
          height: 32px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: var(--sv-petroleo);
          font-size: 18px;
          cursor: pointer;
        }

        .sv-detalle-foto-contador {
          min-width: 94px;
          color: var(--sv-muted);
          text-align: center;
          font-size: 11px;
          font-weight: 750;
        }

        .sv-detalle-foto-puntos {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 94px;
        }

        .sv-detalle-foto-punto {
          width: 8px;
          height: 8px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: #d6cec4;
          cursor: pointer;
          transition:
            width 0.18s ease,
            background 0.18s ease,
            transform 0.18s ease;
        }

        .sv-detalle-foto-punto.activo {
          width: 22px;
          background: var(--sv-petroleo);
        }

        .sv-detalle-foto-punto:focus-visible {
          outline: 2px solid var(--sv-petroleo);
          outline-offset: 2px;
        }

        .sv-detalle-estado {
          width: fit-content;
          margin: 12px 0 0;
          padding: 5px 10px;
          border-radius: 999px;
          background: #f0ebe5;
          color: #645d56;
          font-size: 11px;
          font-weight: 800;
        }

        .sv-detalle-meta {
          display: grid;
          gap: 8px;
          margin-top: 16px;
        }

        .sv-detalle-linea {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          color: #4f4a46;
          font-size: 13px;
          line-height: 1.35;
        }

        .sv-detalle-linea svg {
          flex: 0 0 auto;
          margin-top: 0.5px;
          color: var(--sv-petroleo);
        }

        .sv-detalle-linea-cierre {
          color: #efa900;
          font-weight: 800;
        }

        .sv-detalle-linea-cierre svg {
          color: #efa900;
        }

        .sv-detalle-datos {
          margin: 16px 0 0;
          padding: 16px;
          border: 1px solid var(--sv-borde);
          border-radius: 18px;
          background: #fff;
        }

        .sv-detalle-datos h2 {
          margin: 0 0 12px;
          color: var(--sv-petroleo);
          font-size: 17px;
          line-height: 1.2;
        }

        .sv-detalle-datos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 12px;
        }

        .sv-detalle-dato {
          min-width: 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee5dc;
        }

        .sv-detalle-dato.clave-larga {
          grid-column: 1 / -1;
        }

        .sv-detalle-dato-etiqueta {
          display: block;
          margin-bottom: 3px;
          color: var(--sv-muted);
          font-size: 10.5px;
          line-height: 1.2;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .sv-detalle-dato-valor {
          display: block;
          overflow-wrap: anywhere;
          color: var(--sv-texto);
          font-size: 13px;
          line-height: 1.35;
          font-weight: 700;
        }

        .sv-detalle-observado {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee5dc;
          color: #59514b;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-line;
        }

        .sv-detalle-observado strong {
          color: var(--sv-petroleo);
        }

        .sv-detalle-app .panel-informativo,
        .sv-detalle-app .formulario-panel {
          margin: 14px 0 0;
          padding: 16px;
          border: 1px solid var(--sv-borde);
          border-radius: 18px;
          background: #fff;
          box-shadow: none;
        }

        .sv-detalle-app .panel-informativo h2,
        .sv-detalle-app .formulario-panel h2 {
          margin: 0 0 10px;
          color: var(--sv-petroleo);
          font-size: 17px;
          line-height: 1.2;
        }

        .sv-detalle-app .panel-informativo p,
        .sv-detalle-app .formulario-panel p {
          color: #59514b;
          font-size: 13px;
          line-height: 1.5;
        }

        .sv-detalle-app .formulario-panel h2 {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sv-detalle-app .formulario-panel h2 svg {
          color: var(--sv-petroleo);
        }

        .sv-detalle-app .formulario-panel input,
        .sv-detalle-app .formulario-panel select,
        .sv-detalle-app .formulario-panel textarea {
          width: 100%;
          min-height: 44px;
          margin-top: 8px;
          padding: 10px 12px;
          box-sizing: border-box;
          border: 1px solid #dccfc2;
          border-radius: 13px;
          outline: none;
          background: #fff;
          color: var(--sv-texto);
          font: inherit;
          font-size: 14px;
        }

        .sv-detalle-app .formulario-panel textarea {
          min-height: 88px;
          resize: vertical;
        }

        .sv-detalle-app .formulario-panel input:focus,
        .sv-detalle-app .formulario-panel select:focus,
        .sv-detalle-app .formulario-panel textarea:focus {
          border-color: var(--sv-petroleo);
          box-shadow: 0 0 0 3px rgba(7,87,83,0.08);
        }

        .sv-detalle-app .boton-principal,
        .sv-detalle-app .boton-secundario {
          min-height: 46px;
          width: 100%;
          margin-top: 12px;
          padding: 10px 15px;
          box-sizing: border-box;
          border-radius: 14px;
          font: inherit;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
        }

        .sv-detalle-app .boton-principal {
          border: 1px solid var(--sv-petroleo);
          background: var(--sv-petroleo);
          color: #fff;
        }

        .sv-detalle-app .boton-secundario {
          border: 1px solid #d6c8ba;
          background: #fff;
          color: var(--sv-petroleo);
        }

        .sv-detalle-app button:disabled {
          cursor: default;
        }

        .sv-operacion-fija {
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(128px,0.85fr);
          gap: 10px;
          align-items: stretch;
          margin-top: 14px;
        }

        .sv-operacion-valor {
          min-width: 0;
          padding: 12px 14px;
          border: 1px solid var(--sv-borde);
          border-radius: 16px;
          background: #fff;
        }

        .sv-operacion-etiqueta {
          display: block;
          margin-bottom: 3px;
          color: var(--sv-muted);
          font-size: 11px;
          font-weight: 800;
        }

        .sv-operacion-importe {
          display: block;
          color: var(--sv-petroleo);
          font-size: 24px;
          line-height: 1.05;
          font-weight: 900;
        }

        .sv-boton-compra {
          width: 100%;
          height: 100%;
          min-height: 60px;
          padding: 10px 14px;
          border: 2px solid var(--sv-coral);
          border-radius: 16px;
          background: var(--sv-petroleo);
          color: #fff;
          font: inherit;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: none;
        }

        .sv-boton-compra:disabled {
          border-color: #d6c8ba;
          background: #e7ded6;
          color: #81776f;
        }

        .sv-propuestas-resumen {
          margin-top: 14px;
          padding: 14px;
          border: 1px solid var(--sv-borde);
          border-radius: 18px;
          background: #fff;
        }

        .sv-propuestas-valores {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 8px;
        }

        .sv-propuestas-celda {
          min-width: 0;
          padding: 10px 7px;
          border: 1px solid #eee2d5;
          border-radius: 13px;
          background: #fdfaf7;
          text-align: center;
        }

        .sv-propuestas-celda span {
          display: block;
          min-height: 26px;
          color: var(--sv-muted);
          font-size: 9.5px;
          line-height: 1.2;
          font-weight: 800;
          text-transform: uppercase;
        }

        .sv-propuestas-celda strong {
          display: block;
          color: var(--sv-petroleo);
          font-size: 17px;
          line-height: 1.15;
          font-weight: 900;
        }

        .sv-propuestas-aclaracion {
          margin: 10px 2px 0;
          color: var(--sv-muted);
          font-size: 11px;
          line-height: 1.4;
          text-align: center;
        }

        .sv-propuesta-compacta {
          margin-top: 12px;
          padding: 13px;
          border: 1px solid var(--sv-borde);
          border-radius: 18px;
          background: #fff;
        }

        .sv-propuesta-titulo {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 10px;
          color: var(--sv-petroleo);
          font-size: 14px;
          font-weight: 900;
        }

        .sv-propuesta-titulo svg {
          flex: 0 0 auto;
        }

        .sv-propuesta-fila {
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(132px,0.9fr);
          gap: 9px;
          align-items: stretch;
        }

        .sv-propuesta-fila input {
          width: 100%;
          min-width: 0;
          min-height: 48px;
          padding: 10px 12px;
          box-sizing: border-box;
          border: 1px solid #dccfc2;
          border-radius: 14px;
          outline: none;
          background: #fff;
          color: var(--sv-texto);
          font: inherit;
          font-size: 14px;
        }

        .sv-propuesta-fila input:focus {
          border-color: var(--sv-petroleo);
          box-shadow: 0 0 0 3px rgba(7,87,83,0.08);
        }

        .sv-boton-propuesta {
          width: 100%;
          min-height: 48px;
          padding: 9px 10px;
          border: 2px solid var(--sv-mostaza);
          border-radius: 14px;
          background: var(--sv-petroleo);
          color: #fff;
          font: inherit;
          font-size: 12.5px;
          line-height: 1.15;
          font-weight: 900;
          cursor: pointer;
        }

        .sv-boton-propuesta:disabled {
          opacity: 0.58;
        }

        .sv-preguntas-panel {
          margin-top: 14px;
          border: 1px solid var(--sv-borde);
          border-radius: 18px;
          background: #fff;
          overflow: hidden;
        }

        .sv-preguntas-toggle {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 15px;
          border: 0;
          background: #fff;
          color: var(--sv-petroleo);
          font: inherit;
          font-size: 14px;
          font-weight: 900;
          text-align: left;
          cursor: pointer;
        }

        .sv-preguntas-contenido {
          padding: 0 14px 14px;
          border-top: 1px solid #eee5dc;
        }

        .sv-preguntas-form {
          display: grid;
          gap: 8px;
          padding-top: 12px;
        }

        .sv-preguntas-form textarea,
        .sv-pregunta-responder textarea {
          width: 100%;
          min-height: 76px;
          padding: 10px 12px;
          box-sizing: border-box;
          border: 1px solid #dccfc2;
          border-radius: 13px;
          outline: none;
          background: #fff;
          color: var(--sv-texto);
          font: inherit;
          font-size: 13px;
          line-height: 1.4;
          resize: vertical;
        }

        .sv-preguntas-form textarea:focus,
        .sv-pregunta-responder textarea:focus {
          border-color: var(--sv-petroleo);
          box-shadow: 0 0 0 3px rgba(7,87,83,0.08);
        }

        .sv-preguntas-form button,
        .sv-pregunta-responder button {
          min-height: 42px;
          padding: 9px 12px;
          border: 1px solid var(--sv-petroleo);
          border-radius: 12px;
          background: var(--sv-petroleo);
          color: #fff;
          font: inherit;
          font-size: 12.5px;
          font-weight: 850;
          cursor: pointer;
        }

        .sv-preguntas-form button:disabled,
        .sv-pregunta-responder button:disabled {
          opacity: 0.55;
        }

        .sv-preguntas-lista {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        .sv-pregunta-item {
          padding: 12px;
          border: 1px solid #eee2d5;
          border-radius: 14px;
          background: #fdfaf7;
        }

        .sv-pregunta-texto {
          margin: 0;
          color: var(--sv-texto);
          font-size: 13px;
          line-height: 1.45;
          font-weight: 900;
        }

        .sv-pregunta-texto strong {
          color: var(--sv-petroleo);
        }

        .sv-pregunta-respuesta {
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid #eee2d5;
          color: #59514b;
          font-size: 12.5px;
          line-height: 1.45;
        }

        .sv-pregunta-respuesta strong {
          color: var(--sv-petroleo);
        }

        .sv-pregunta-pendiente {
          margin-top: 8px;
          color: var(--sv-muted);
          font-size: 11px;
          line-height: 1.35;
        }

        .sv-pregunta-responder {
          display: grid;
          gap: 8px;
          margin-top: 9px;
        }

        .sv-futuro-panel {
          margin-top: 16px;
          padding: 16px;
          border: 1px dashed #cfc3b6;
          border-radius: 18px;
          background: #faf7f2;
        }

        .sv-futuro-panel h2 {
          margin: 0 0 6px;
          color: var(--sv-petroleo);
          font-size: 17px;
        }

        .sv-futuro-panel p {
          margin: 0 0 12px;
          color: #6d655e;
          font-size: 12px;
          line-height: 1.4;
        }

        .sv-futuro-acciones {
          display: grid;
          gap: 8px;
        }

        .sv-futuro-boton {
          min-height: 44px;
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #d8cec3;
          border-radius: 13px;
          background: #fff;
          color: #756c64;
          font: inherit;
          font-size: 12.5px;
          font-weight: 800;
          text-align: left;
        }

        .sv-detalle-volver {
          margin-top: 28px;
          text-align: center;
        }

        .sv-detalle-no-encontrada {
          padding: 30px 16px;
          text-align: center;
        }
      `}</style>

      <main className="sv-pantalla-fondo">
        <section className="sv-pantalla-app sv-detalle-app">
          <CabeceraNosSirve
            className="sv-detalle-header"
            extraInferior={
              <>
            <div className="sv-detalle-titulo-fijo">
              <button
                type="button"
                className="sv-detalle-flecha"
                aria-label="Publicación anterior"
                disabled={
                  !puedeRecorrerPublicaciones ||
                  !numeroAnterior
                }
                onClick={() =>
                  navegarAPublicacion(
                    numeroAnterior
                  )
                }
              >
                <IconoFlecha
                  direccion="izquierda"
                />
              </button>

              <div className="sv-detalle-titulo-centro">
                <span
                  className={`sv-detalle-numero ${
                    recibePropuestas
                      ? "propuestas"
                      : "quiero"
                  }`}
                >
                  #{publicacion.numero}
                </span>

                <div className="sv-detalle-titulo-ventana">
                  {tituloEsLargo ? (
                    <div className="sv-detalle-titulo-marquee">
                      <span>
                        {tituloPublicacion}
                      </span>

                      <span aria-hidden="true">
                        {tituloPublicacion}
                      </span>
                    </div>
                  ) : (
                    <span
                      className="sv-detalle-titulo-texto"
                      title={
                        tituloPublicacion
                      }
                    >
                      {tituloPublicacion}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="sv-detalle-flecha"
                aria-label="Publicación siguiente"
                disabled={
                  !puedeRecorrerPublicaciones ||
                  !numeroSiguiente
                }
                onClick={() =>
                  navegarAPublicacion(
                    numeroSiguiente
                  )
                }
              >
                <IconoFlecha
                  direccion="derecha"
                />
              </button>
            </div>

            {puedeRecorrerPublicaciones &&
              mostrarAyudaSwipe && (
                <p className="sv-detalle-ayuda-swipe">
                  Deslizá hacia los costados para recorrer publicaciones
                </p>
              )}
              </>
            }
          />

          <div
            className="sv-detalle-contenido"
            style={{
              visibility:
                posicionandoRetornoPropuesta
                  ? "hidden"
                  : "visible",
            }}
            onTouchStart={
              iniciarDeslizamientoPublicacion
            }
            onTouchEnd={
              finalizarDeslizamientoPublicacion
            }
          >
            {imagenActual &&
              esFuenteImagen(
                imagenActual
              ) && (
                <>
                  <div className="sv-detalle-imagen-wrap">
                    <img
                      className="sv-detalle-imagen"
                      src={
                        imagenActual
                      }
                      alt={
                        publicacion.titulo ||
                        "Objeto publicado"
                      }
                      draggable="false"
                      onClick={
                        manejarClickImagen
                      }
                      onTouchStart={
                        iniciarDeslizamientoImagen
                      }
                      onTouchEnd={
                        finalizarDeslizamientoImagen
                      }
                    />

                    <span className="sv-detalle-imagen-ayuda">
                      {imagenes.length > 1
                        ? "Deslizá para ver más · Tocá para ampliar"
                        : "Tocá para ampliar"}
                    </span>
                  </div>

                  {imagenes.length >
                    1 && (
                    <div className="sv-detalle-fotos">
                      <button
                        type="button"
                        className="sv-detalle-foto-boton"
                        aria-label="Foto anterior"
                        onClick={
                          mostrarImagenAnterior
                        }
                      >
                        ‹
                      </button>

                      <div
                        className="sv-detalle-foto-puntos"
                        role="group"
                        aria-label={`Foto ${indiceImagen + 1} de ${imagenes.length}`}
                      >
                        {imagenes.map(
                          (
                            _imagen,
                            indice
                          ) => (
                            <button
                              key={indice}
                              type="button"
                              className={
                                indice ===
                                indiceImagen
                                  ? "sv-detalle-foto-punto activo"
                                  : "sv-detalle-foto-punto"
                              }
                              aria-label={`Ver foto ${indice + 1}`}
                              aria-current={
                                indice ===
                                indiceImagen
                                  ? "true"
                                  : undefined
                              }
                              onClick={() =>
                                setIndiceImagen(
                                  indice
                                )
                              }
                            />
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        className="sv-detalle-foto-boton"
                        aria-label="Foto siguiente"
                        onClick={
                          mostrarImagenSiguiente
                        }
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}

            {recepcionCerrada && (
              <div className="sv-detalle-estado">
                Cerrada
              </div>
            )}

            <div className="sv-detalle-meta">
              <div className="sv-detalle-linea">
                <IconoUbicacion />

                <span>
                  {ubicacionVisible}
                </span>
              </div>

              {nombrePublicante && (
                <div className="sv-detalle-linea">
                  <span>
                    <strong>Publicado por</strong>{" "}
                    {nombrePublicante}
                  </span>
                </div>
              )}

              {formasEntregaVisibles.length > 0 && (
                <div className="sv-detalle-linea">
                  <span>
                    <strong>Entrega:</strong>{" "}
                    {formasEntregaVisibles.join(" · ")}
                  </span>
                </div>
              )}

              {recibePropuestas && (
                <div className="sv-detalle-linea sv-detalle-linea-cierre">
                  <IconoReloj />

                  <span>
                    {recepcionCerrada
                      ? textoCierreReal
                        ? `Cerró: ${textoCierreReal}`
                        : "Recepción de propuestas cerrada"
                      : textoCierreReal
                        ? `Recibe propuestas hasta: ${textoCierreReal}`
                        : `Recibe propuestas hasta: ${publicacion.cierre || "fecha a confirmar"}`}
                  </span>
                </div>
              )}
            </div>

            <section className="sv-detalle-datos">
              <h2>
                Datos del objeto
              </h2>

              <div className="sv-detalle-datos-grid">
                <div className="sv-detalle-dato">
                  <span className="sv-detalle-dato-etiqueta">
                    Categoría
                  </span>

                  <span className="sv-detalle-dato-valor">
                    {publicacion.categoria ||
                      "Sin categoría"}
                  </span>
                </div>

                {datosObjetoVisibles.map(
                  (dato) => (
                    <div
                      className={
                        String(
                          dato.valor
                        ).length > 34
                          ? "sv-detalle-dato clave-larga"
                          : "sv-detalle-dato"
                      }
                      key={
                        dato.clave
                      }
                    >
                      <span className="sv-detalle-dato-etiqueta">
                        {etiquetaDatoEspecifico(
                          dato.clave
                        )}
                      </span>

                      <span className="sv-detalle-dato-valor">
                        {dato.valor}
                      </span>
                    </div>
                  )
                )}

                {!esLibro &&
                  funcionamientoVisible && (
                    <div className="sv-detalle-dato">
                      <span className="sv-detalle-dato-etiqueta">
                        Funcionamiento
                      </span>

                      <span className="sv-detalle-dato-valor">
                        {
                          funcionamientoVisible
                        }
                      </span>
                    </div>
                  )}
              </div>

              {(
                publicacion.estado_aparente ||
                publicacion.estadoAparente
              ) && (
                <div className="sv-detalle-observado">
                  <strong>
                    Lo que se observa:
                  </strong>{" "}
                  {
                    publicacion.estado_aparente ||
                    publicacion.estadoAparente
                  }
                </div>
              )}
            </section>

            {publicacion.descripcion && (
              <div className="panel-informativo">
                <h2>
                  {publicacion.tituloBloqueInformativo ||
                  publicacion.titulo_bloque_informativo ||
                  (
                    esLibro
                      ? "Reseña"
                      : "Características"
                  )}
                </h2>

                <p
                  style={{
                    whiteSpace:
                      "pre-line",
                  }}
                >
                  {
                    publicacion.descripcion
                  }
                </p>
              </div>
            )}

            {esPrecioFijo && (
              <div className="sv-operacion-fija">
                <div className="sv-operacion-valor">
                  <span className="sv-operacion-etiqueta">
                    Quiero
                  </span>

                  <strong className="sv-operacion-importe">
                    $
                    {formatearDinero(
                      valorPublicacion
                    )}
                  </strong>
                </div>

                {!recepcionCerrada ? (
                  <button
                    type="button"
                    className="sv-boton-compra"
                    disabled={
                      esPropietario
                    }
                    onClick={
                      manejarCompraDirecta
                    }
                  >
                    {esPropietario
                      ? "Tu publicación"
                      : "Lo compro"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sv-boton-compra"
                    disabled
                  >
                    Cerrada
                  </button>
                )}
              </div>
            )}

            {recibePropuestas && (
              <section className="sv-propuestas-resumen">
                <div className="sv-propuestas-valores">
                  <div className="sv-propuestas-celda">
                    <span>
                      Valor inicial
                    </span>

                    <strong>
                      $
                      {formatearDinero(
                        valorPublicacion
                      )}
                    </strong>
                  </div>

                  <div className="sv-propuestas-celda">
                    <span>
                      Menor importe
                    </span>

                    <strong>
                      {cantidadPropuestasResumen > 0
                        ? `$${formatearDinero(
                            menorImportePropuesto
                          )}`
                        : "—"}
                    </strong>
                  </div>

                  <div className="sv-propuestas-celda">
                    <span>
                      Mayor importe
                    </span>

                    <strong>
                      {cantidadPropuestasResumen > 0
                        ? `$${formatearDinero(
                            mayorImportePropuesto
                          )}`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <p className="sv-propuestas-aclaracion">
                  El importe es solo uno de los criterios posibles. Quien publica puede considerar también otros aspectos al elegir una propuesta.
                </p>
              </section>
            )}

            {recibePropuestas &&
              !recepcionCerrada &&
              !esPropietario && (
                <form
                  id="sv-propuesta-formulario"
                  className="sv-propuesta-compacta"
                  onSubmit={
                    registrarPropuesta
                  }
                >
                  <div className="sv-propuesta-titulo">
                    <IconoPropuesta />

                    <span>
                      Hago una propuesta
                    </span>
                  </div>

                  <div className="sv-propuesta-fila">
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      inputMode="numeric"
                      value={monto}
                      onChange={(
                        event
                      ) => {
                        const nuevoMonto =
                          event.target.value;

                        setMonto(
                          nuevoMonto
                        );

                        guardarBorradorPropuesta(
                          publicacion,
                          nuevoMonto
                        );
                      }}
                      placeholder="$ Importe"
                    />

                    <button
                      className="sv-boton-propuesta"
                      type="submit"
                      disabled={
                        enviandoPropuesta
                      }
                    >
                      {enviandoPropuesta
                        ? "Enviando..."
                        : montoValido
                          ? `Propongo $${formatearDinero(montoNumerico)}`
                          : "Hago una propuesta"}
                    </button>
                  </div>
                </form>
              )}

            <section className="sv-preguntas-panel">
              <button
                type="button"
                className="sv-preguntas-toggle"
                onClick={() =>
                  setPreguntasAbiertas(
                    (valor) =>
                      !valor
                  )
                }
              >
                <span>
                  Preguntas sobre este objeto
                  {preguntas.length > 0
                    ? ` (${preguntas.length})`
                    : ""}
                </span>

                <span aria-hidden="true">
                  {preguntasAbiertas
                    ? "−"
                    : "+"}
                </span>
              </button>

              {preguntasAbiertas && (
                <div className="sv-preguntas-contenido">
                  {preguntas.length > 0 ? (
                    <div className="sv-preguntas-lista">
                      {preguntasOrdenadas.map(
                        (pregunta) => (
                          <div
                            id={`pregunta-${pregunta.id}`}
                            className="sv-pregunta-item"
                            key={
                              pregunta.id
                            }
                          >
                            <p className="sv-pregunta-texto">
                              <strong>
                                {nombresPreguntantes[
                                  String(
                                    pregunta.id
                                  )
                                ] ||
                                  "Alguien"}{" "}
                                preguntó:
                              </strong>{" "}
                              {pregunta.pregunta}
                            </p>

                            {pregunta.respuesta ? (
                              <div className="sv-pregunta-respuesta">
                                <strong>
                                  {nombrePublicante ||
                                    "Quien publicó"}{" "}
                                  respondió:
                                </strong>{" "}
                                {pregunta.respuesta}
                              </div>
                            ) : esPropietario ? (
                              respuestaPreguntaId ===
                              pregunta.id ? (
                                <div className="sv-pregunta-responder">
                                  <textarea
                                    value={
                                      respuestaPreguntaTexto
                                    }
                                    maxLength={1000}
                                    placeholder="Escribí tu respuesta"
                                    onChange={(
                                      event
                                    ) =>
                                      setRespuestaPreguntaTexto(
                                        event.target.value
                                      )
                                    }
                                  />

                                  <button
                                    type="button"
                                    disabled={
                                      enviandoRespuestaPregunta ||
                                      !respuestaPreguntaTexto.trim()
                                    }
                                    onClick={() =>
                                      responderPregunta(
                                        pregunta.id
                                      )
                                    }
                                  >
                                    {enviandoRespuestaPregunta
                                      ? "Guardando..."
                                      : "Responder"}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="boton-secundario"
                                  onClick={() => {
                                    setRespuestaPreguntaId(
                                      pregunta.id
                                    );

                                    setRespuestaPreguntaTexto(
                                      ""
                                    );
                                  }}
                                >
                                  Responder
                                </button>
                              )
                            ) : (
                              <div className="sv-pregunta-pendiente">
                                Esperando respuesta de quien publicó.
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="sv-pregunta-pendiente">
                      Todavía no hay preguntas.
                    </div>
                  )}

                  {!esPropietario && (
                    <form
                      className="sv-preguntas-form"
                      onSubmit={
                        enviarPregunta
                      }
                    >
                      <textarea
                        value={
                          nuevaPregunta
                        }
                        maxLength={500}
                        placeholder="Preguntá algo sobre este objeto"
                        onChange={(
                          event
                        ) => {
                          const valor =
                            event.target.value;

                          setNuevaPregunta(
                            valor
                          );

                          guardarBorradorPregunta(
                            publicacion,
                            valor
                          );
                        }}
                      />

                      <button
                        type="submit"
                        disabled={
                          enviandoPregunta ||
                          !nuevaPregunta.trim()
                        }
                      >
                        {enviandoPregunta
                          ? "Enviando..."
                          : usuarioActualId
                            ? "Publicar pregunta"
                            : "Ingresar para preguntar"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>

            {puedeGestionarPropuestas &&
              recibePropuestas &&
              !recepcionCerrada && (
                <button
                  className="boton-secundario"
                  type="button"
                  disabled={
                    cerrando
                  }
                  onClick={
                    manejarCerrarRecepcion
                  }
                >
                  Finalizar recepción ahora
                </button>
              )}

            {puedeGestionarPropuestas &&
              recepcionCerrada &&
              decisionPendiente && (
                <div className="panel-informativo">
                  <h2>
                    Elegí una propuesta
                  </h2>

                  {textoLimiteDecision && (
                    <p>
                      Podés decidir hasta:{" "}
                      {
                        textoLimiteDecision
                      }{" "}
                      hs
                    </p>
                  )}

                  {propuestas.map(
                    (propuesta) => (
                      <div
                        key={
                          propuesta.id
                        }
                        style={{
                          marginTop:
                            "12px",

                          padding:
                            "12px",

                          border:
                            "1px solid #eadccc",

                          borderRadius:
                            "14px",
                        }}
                      >
                        <strong>
                          {propuesta.nombre ||
                            "Propuesta"}
                        </strong>

                        <p>
                          $
                          {formatearDinero(
                            propuesta.monto
                          )}
                        </p>

                        <button
                          className="boton-principal"
                          type="button"
                          disabled={
                            procesandoDecision
                          }
                          onClick={() =>
                            manejarAceptarPropuesta(
                              propuesta
                            )
                          }
                        >
                          Aceptar esta propuesta
                        </button>
                      </div>
                    )
                  )}

                  <button
                    className="boton-secundario"
                    type="button"
                    disabled={
                      procesandoDecision
                    }
                    onClick={
                      manejarNoAceptarNinguna
                    }
                  >
                    No aceptar ninguna
                  </button>
                </div>
              )}

            {decisionAceptada &&
              esPropietario && (
                <div className="panel-informativo">
                  <h2>
                    Propuesta elegida
                  </h2>

                  {propuestaElegida && (
                    <p>
                      {propuestaElegida.nombre ||
                        "Persona elegida"}
                      {" · $"}
                      {formatearDinero(
                        propuestaElegida.monto
                      )}
                    </p>
                  )}

                  {confirmacionPendiente && (
                    <p>
                      Esperando confirmación hasta{" "}
                      {
                        textoLimiteConfirmacion
                      }
                    </p>
                  )}
                </div>
              )}

            {puedeRegistrarCoordinacion && (
              <form
                className="formulario-panel"
                onSubmit={
                  manejarRegistrarCoordinacion
                }
              >
                <h2>
                  Coordinar entrega
                </h2>

                {textoLimiteCoordinacion && (
                  <p>
                    Coordinen antes de:{" "}
                    {
                      textoLimiteCoordinacion
                    }
                  </p>
                )}

                <select
                  value={
                    modalidadEntrega
                  }
                  onChange={(
                    event
                  ) =>
                    setModalidadEntrega(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Modalidad
                  </option>

                  <option value="Entrega en mano">
                    En mano
                  </option>

                  <option value="Retiro">
                    Retiro
                  </option>

                  <option value="Envío">
                    Envío
                  </option>
                </select>

                <input
                  type="datetime-local"
                  min={
                    fechaHoraMinima
                  }
                  value={
                    fechaEntrega
                  }
                  onChange={(
                    event
                  ) =>
                    setFechaEntrega(
                      event.target.value
                    )
                  }
                />

                <textarea
                  value={
                    notaEntrega
                  }
                  placeholder="Detalle para coordinar la entrega"
                  onChange={(
                    event
                  ) =>
                    setNotaEntrega(
                      event.target.value
                    )
                  }
                />

                <button
                  className="boton-principal"
                  type="submit"
                  disabled={
                    procesandoCoordinacion
                  }
                >
                  Registrar entrega coordinada
                </button>
              </form>
            )}

            {confirmacionConfirmada &&
              entregaCoordinada &&
              (
                esPropietario ||
                propuestaPropiaFueElegida
              ) && (
                <div className="panel-informativo">
                  <h2>
                    Entrega coordinada
                  </h2>

                  <p>
                    {
                      formatearFormaEntrega(
                        publicacion.modalidad_entrega_acordada
                      )
                    }
                  </p>

                  <p>
                    {
                      textoFechaEntrega
                    }
                  </p>
                </div>
              )}

            {confirmacionConfirmada &&
              (
                esPropietario ||
                propuestaPropiaFueElegida
              ) && (
                <section className="sv-futuro-panel">
                  <h2>
                    Próximos pasos
                  </h2>

                  <div className="sv-futuro-acciones">
                    <button
                      type="button"
                      className="sv-futuro-boton"
                      disabled
                    >
                      Pago protegido · Próximamente
                    </button>

                    <button
                      type="button"
                      className="sv-futuro-boton"
                      disabled
                    >
                      Envío y seguimiento · Próximamente
                    </button>

                    <button
                      type="button"
                      className="sv-futuro-boton"
                      disabled
                    >
                      Mensajería de coordinación · Próximamente
                    </button>
                  </div>
                </section>
              )}

            {decisionSinAcuerdo &&
              esPropietario && (
                <div className="panel-informativo">
                  <h2>
                    Cerrada sin acuerdo
                  </h2>

                  <p>
                    {
                      mensajeSinAcuerdoPropietario
                    }
                  </p>
                </div>
              )}

            {propuestaPropiaActual &&
              propuestaPropiaFueElegida &&
              decisionAceptada &&
              !esPropietario && (
                <div className="panel-informativo">
                  <h2>
                    Tu propuesta fue elegida
                  </h2>

                  <strong>
                    $
                    {formatearDinero(
                      propuestaPropiaActual.monto
                    )}
                  </strong>

                  {confirmacionPendiente && (
                    <>
                      <button
                        className="boton-principal"
                        type="button"
                        disabled={
                          procesandoRespuestaComprador
                        }
                        onClick={() =>
                          manejarRespuestaComprador(
                            "CONFIRMAR"
                          )
                        }
                      >
                        Confirmar acuerdo
                      </button>

                      <button
                        className="boton-secundario"
                        type="button"
                        disabled={
                          procesandoRespuestaComprador
                        }
                        onClick={() =>
                          manejarRespuestaComprador(
                            "RECHAZAR"
                          )
                        }
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              )}

            {propuestaPropiaActual &&
              !propuestaPropiaFueElegida &&
              !esPropietario && (
                <div className="panel-informativo">
                  <h2>
                    Tu propuesta actual
                  </h2>

                  <strong>
                    $
                    {formatearDinero(
                      propuestaPropiaActual.monto
                    )}
                  </strong>

                  {decisionSinAcuerdo && (
                    <p>
                      {
                        mensajeSinAcuerdoProponente
                      }
                    </p>
                  )}
                </div>
              )}

            <div className="sv-detalle-volver">
              <button
                type="button"
                className="boton-secundario"
                onClick={
                  volverAlOrigen
                }
              >
                {
                  textoVolverOrigen()
                }
              </button>
            </div>
          </div>

        </section>
      </main>

      {visorImagenAbierto &&
        imagenActual &&
        esFuenteImagen(
          imagenActual
        ) && (
          <div
            className="sv-visor-imagen"
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada de la imagen"
          >
            <div className="sv-visor-barra">
              <button
                type="button"
                className="sv-visor-cerrar"
                onClick={
                  cerrarVisorImagen
                }
              >
                Cerrar
              </button>

              <div className="sv-visor-zoom">
                Tocá para cerrar · Pellizcá para ampliar
              </div>

              <button
                type="button"
                className="sv-visor-reset"
                onClick={
                  reiniciarZoomVisor
                }
                disabled={
                  zoomVisor <= 1.01
                }
              >
                100%
              </button>
            </div>

            <div
              className="sv-visor-area"
              onTouchStart={
                iniciarGestoVisor
              }
              onTouchMove={
                moverGestoVisor
              }
              onTouchEnd={
                finalizarGestoVisor
              }
              onTouchCancel={
                finalizarGestoVisor
              }
              onDoubleClick={
                reiniciarZoomVisor
              }
            >
              <img
                className="sv-visor-foto"
                src={
                  imagenActual
                }
                alt={
                  publicacion.titulo ||
                  "Objeto publicado"
                }
                draggable="false"
                onClick={
                  manejarClickVisorImagen
                }
                style={{
                  transform:
                    `translate(${desplazamientoVisor.x}px, ${desplazamientoVisor.y}px) scale(${zoomVisor})`,
                }}
              />
            </div>

            <div className="sv-visor-pie">
              {imagenes.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="sv-visor-flecha"
                    aria-label="Foto anterior"
                    onClick={
                      mostrarImagenAnterior
                    }
                  >
                    ‹
                  </button>

                  <span className="sv-visor-contador">
                    Foto{" "}
                    {indiceImagen + 1}{" "}
                    de{" "}
                    {imagenes.length}
                  </span>

                  <button
                    type="button"
                    className="sv-visor-flecha"
                    aria-label="Foto siguiente"
                    onClick={
                      mostrarImagenSiguiente
                    }
                  >
                    ›
                  </button>
                </>
              ) : (
                <span className="sv-visor-contador">
                  Pellizcá para acercar · doble toque para restablecer
                </span>
              )}
            </div>
          </div>
        )}
    </>
  );
}

export default DetallePublicacion;
