import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import PantallaOperativa from "../components/PantallaOperativa";

import {
  obtenerBorradorPublicacion,
  guardarBorradorPublicacion,
} from "../utils/borradorPublicacion";

import {
  CATEGORIAS_NOS_SIRVE,
  detectarCategoriaNosSirve,
} from "../utils/categoriasNosSirve";

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarClaveDato(clave) {
  const original =
    String(clave || "").trim();

  const mapa = {
    "año": "anio",
    "edición": "edicion",
    "tamaño": "tamano",
  };

  return (
    mapa[original] ||
    original
  );
}

function etiquetaDatoEspecifico(
  clave
) {
  const mapa = {
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

  if (mapa[clave]) {
    return mapa[clave];
  }

  const limpio =
    String(clave || "")
      .replace(/_/g, " ")
      .trim();

  if (!limpio) {
    return "Dato";
  }

  return (
    limpio
      .charAt(0)
      .toUpperCase() +
    limpio.slice(1)
  );
}

function limpiarDatosEspecificos(
  valor
) {
  if (
    !valor ||
    typeof valor !== "object" ||
    Array.isArray(valor)
  ) {
    return {};
  }

  const resultado = {};

  Object.entries(valor).forEach(
    ([
      claveOriginal,
      dato,
    ]) => {
      const clave =
        normalizarClaveDato(
          claveOriginal
        );

      if (!clave) {
        return;
      }

      if (
        dato === null ||
        dato === undefined
      ) {
        return;
      }

      if (
        Array.isArray(dato)
      ) {
        const texto =
          dato
            .map(
              (item) =>
                String(
                  item || ""
                ).trim()
            )
            .filter(Boolean)
            .join(", ");

        if (texto) {
          resultado[clave] =
            texto;
        }

        return;
      }

      const texto =
        String(dato).trim();

      if (texto) {
        resultado[clave] =
          texto;
      }
    }
  );

  return resultado;
}

function esCategoriaLibros({
  objeto,
  categoria,
  titulo,
}) {
  const texto =
    normalizarTexto(
      [
        objeto,
        categoria,
        titulo,
      ]
        .filter(Boolean)
        .join(" ")
    );

  return (
    texto.includes("libro") ||
    texto.includes("revista") ||
    texto.includes("comic")
  );
}

function requiereFuncionamiento({
  objeto,
  categoria,
  titulo,
}) {
  const texto =
    normalizarTexto(
      [
        objeto,
        categoria,
        titulo,
      ]
        .filter(Boolean)
        .join(" ")
    );

  const palabras = [
    "electrodomest",
    "tecnologia",
    "herramient",
    "maquina",
    "motor",
    "electrico",
    "electronico",
    "bicicleta",
    "moto",
    "vehiculo",
    "computadora",
    "notebook",
    "celular",
    "telefono",
    "tablet",
    "televisor",
    "tv",
    "radio",
    "audio",
    "parlante",
    "auricular",
    "impresora",
    "camara",
    "heladera",
    "freezer",
    "lavarropa",
    "lavavajilla",
    "microondas",
    "horno",
    "aspiradora",
    "ventilador",
    "calefactor",
    "estufa",
    "aire acondicionado",
    "licuadora",
    "batidora",
    "procesadora",
    "cafetera",
    "tostadora",
    "plancha",
    "taladro",
    "amoladora",
    "sierra",
    "compresor",
    "bomba",
  ];

  return palabras.some(
    (palabra) =>
      texto.includes(
        palabra
      )
  );
}

function requiereMarcaModelo({
  objeto,
  categoria,
  titulo,
}) {
  const texto =
    normalizarTexto(
      [
        objeto,
        categoria,
        titulo,
      ]
        .filter(Boolean)
        .join(" ")
    );

  const exclusiones = [
    "cuadro",
    "lamina",
    "poster",
    "arte y decoracion",
    "decoracion",
    "adorno",
    "artesania",
  ];

  if (
    exclusiones.some(
      (palabra) =>
        texto.includes(
          palabra
        )
    )
  ) {
    return false;
  }

  const palabras = [
    "tecnologia",
    "electronica",
    "electrodomest",
    "herramient",
    "vehiculo",
    "automotor",
    "bicicleta",
    "moto",
    "motocicleta",
    "auto",
    "automovil",
    "computadora",
    "notebook",
    "laptop",
    "celular",
    "telefono",
    "smartphone",
    "tablet",
    "televisor",
    "television",
    "tv",
    "monitor",
    "radio",
    "audio",
    "parlante",
    "auricular",
    "impresora",
    "scanner",
    "camara",
    "proyector",
    "consola",
    "heladera",
    "freezer",
    "lavarropa",
    "lavavajilla",
    "microondas",
    "aspiradora",
    "ventilador",
    "calefactor",
    "aire acondicionado",
    "licuadora",
    "batidora",
    "procesadora",
    "cafetera",
    "tostadora",
    "taladro",
    "amoladora",
    "compresor",
    "motosierra",
    "maquina de coser",
  ];

  return palabras.some(
    (palabra) =>
      texto.includes(
        palabra
      )
  );
}

function numeroSeguro(valor) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}

function formatearDinero(valor) {
  return numeroSeguro(
    valor
  ).toLocaleString(
    "es-AR"
  );
}

function textoFuncionamiento(
  valor
) {
  if (valor === "SI") {
    return "Sí";
  }

  if (valor === "NO") {
    return "No";
  }

  if (valor === "NO_SE") {
    return "No sé";
  }

  if (valor === "NO_APLICA") {
    return "No aplica";
  }

  return "";
}

function formatearFecha(
  fecha
) {
  if (!fecha) {
    return "";
  }

  const partes =
    String(fecha).split(
      "-"
    );

  if (
    partes.length !== 3
  ) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function PublicarRevision() {
  const navigate =
    useNavigate();

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    objeto,
    setObjeto,
  ] = useState("");

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descripcion,
    setDescripcion,
  ] = useState("");

  const [
    categoria,
    setCategoria,
  ] = useState("");

  const [
    marca,
    setMarca,
  ] = useState("");

  const [
    modelo,
    setModelo,
  ] = useState("");

  const [
    datosEspecificos,
    setDatosEspecificos,
  ] = useState({});

  const [
    estadoAparente,
    setEstadoAparente,
  ] = useState("");

  const [
    funcionamiento,
    setFuncionamiento,
  ] = useState("");

  const [
    modalidad,
    setModalidad,
  ] = useState("");

  const [
    precio,
    setPrecio,
  ] = useState(0);

  const [
    valorInicial,
    setValorInicial,
  ] = useState(0);

  const [
    fechaCierre,
    setFechaCierre,
  ] = useState("");

  const [
    horaCierre,
    setHoraCierre,
  ] = useState("");

  const [
    fotos,
    setFotos,
  ] = useState([]);

  const [
    portadaIndice,
    setPortadaIndice,
  ] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const borrador =
          await obtenerBorradorPublicacion();

        if (!activo) {
          return;
        }

        if (
          !borrador?.analisisIA
        ) {
          navigate(
            "/publicar/analizando",
            {
              replace: true,
            }
          );

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

        const objetoActual =
          borrador?.objeto ||
          borrador
            ?.analisisIA
            ?.objeto ||
          "";

        const tituloActual =
          borrador?.titulo ||
          borrador
            ?.analisisIA
            ?.tituloSugerido ||
          "";

        const descripcionActual =
          borrador?.descripcion ||
          borrador
            ?.analisisIA
            ?.descripcionSugerida ||
          "";

        const categoriaIA =
          borrador?.categoria ||
          borrador
            ?.analisisIA
            ?.categoria ||
          "";

        const categoriaDetectada =
          detectarCategoriaNosSirve({
            objeto:
              objetoActual,

            categoriaIA,

            titulo:
              tituloActual,

            descripcion:
              descripcionActual,
          });

        const datosDesdeIA =
          limpiarDatosEspecificos(
            borrador
              ?.analisisIA
              ?.datosEspecificos
          );

        const datosDesdeBorrador =
          limpiarDatosEspecificos(
            borrador
              ?.datosEspecificos
          );

        const datosActuales = {
          ...datosDesdeIA,
          ...datosDesdeBorrador,
        };

        const marcaActual =
          borrador?.marca ||
          datosActuales.marca ||
          borrador
            ?.analisisIA
            ?.marca ||
          "";

        const modeloActual =
          borrador?.modelo ||
          datosActuales.modelo ||
          borrador
            ?.analisisIA
            ?.modelo ||
          "";

        const esLibro =
          esCategoriaLibros({
            objeto:
              objetoActual,

            categoria:
              categoriaDetectada,

            titulo:
              tituloActual,
          });

        if (
          esLibro &&
          !datosActuales.editorial &&
          marcaActual
        ) {
          datosActuales.editorial =
            marcaActual;
        }

        setObjeto(
          objetoActual
        );

        setTitulo(
          tituloActual
        );

        setDescripcion(
          descripcionActual
        );

        setCategoria(
          categoriaDetectada
        );

        setDatosEspecificos(
          datosActuales
        );

        if (esLibro) {
          setMarca(
            datosActuales.editorial ||
            marcaActual ||
            ""
          );

          setModelo("");
        } else {
          setMarca(
            marcaActual
          );

          setModelo(
            modeloActual
          );
        }

        setEstadoAparente(
          borrador?.estadoAparente ||
          borrador
            ?.analisisIA
            ?.estadoAparente ||
          ""
        );

        const correspondeFuncionamiento =
          requiereFuncionamiento({
            objeto:
              objetoActual,

            categoria:
              categoriaDetectada,

            titulo:
              tituloActual,
          });

        const respuestaAnterior =
          borrador
            ?.respuestasInteligentes
            ?.funcionamiento ||
          "";

        if (
          correspondeFuncionamiento
        ) {
          setFuncionamiento(
            respuestaAnterior
          );
        } else {
          setFuncionamiento("");

          if (
            respuestaAnterior
          ) {
            const respuestasActuales =
              borrador
                ?.respuestasInteligentes ||
              {};

            const {
              funcionamiento:
                _funcionamientoViejo,
              ...respuestasLimpias
            } =
              respuestasActuales;

            await guardarBorradorPublicacion({
              respuestasInteligentes:
                respuestasLimpias,
            });
          }
        }

        if (esLibro) {
          if (modeloActual) {
            await guardarBorradorPublicacion({
              modelo: "",
            });
          }
        } else {
          const correspondeMarcaModelo =
            requiereMarcaModelo({
              objeto:
                objetoActual,

              categoria:
                categoriaDetectada,

              titulo:
                tituloActual,
            });

          if (
            !correspondeMarcaModelo
          ) {
            setMarca("");
            setModelo("");
          }
        }

        await guardarBorradorPublicacion({
          categoria:
            categoriaDetectada,

          datosEspecificos:
            datosActuales,
        });

        setModalidad(
          borrador?.modalidad ||
          ""
        );

        setPrecio(
          numeroSeguro(
            borrador?.precio
          )
        );

        setValorInicial(
          numeroSeguro(
            borrador?.valorInicial
          )
        );

        setFechaCierre(
          borrador?.fechaCierre ||
          ""
        );

        setHoraCierre(
          borrador?.horaCierre ||
          ""
        );

        const fotosActuales =
          Array.isArray(
            borrador?.fotos
          )
            ? borrador.fotos
            : [];

        setFotos(
          fotosActuales
        );

        const indiceGuardado =
          Number(
            borrador?.portadaIndice
          );

        setPortadaIndice(
          Number.isInteger(
            indiceGuardado
          ) &&
          indiceGuardado >= 0 &&
          indiceGuardado <
            fotosActuales.length
            ? indiceGuardado
            : 0
        );
      } catch (err) {
        console.error(
          "Error cargando revisión:",
          err
        );

        if (activo) {
          setError(
            "No pudimos recuperar tu publicación."
          );
        }
      } finally {
        if (activo) {
          setCargando(
            false
          );
        }
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [navigate]);

  const esPrecioFijo =
    modalidad ===
    "PRECIO_FIJO";

  const esLibro =
    esCategoriaLibros({
      objeto,
      categoria,
      titulo,
    });

  const valorMostrado =
    esPrecioFijo
      ? precio
      : valorInicial;

  const puedeGuardar =
    Boolean(
      titulo.trim() &&
      descripcion.trim() &&
      categoria &&
      fotos.length > 0
    );

  const mostrarFuncionamiento =
    requiereFuncionamiento({
      objeto,
      categoria,
      titulo,
    });

  const mostrarMarcaModelo =
    !esLibro &&
    requiereMarcaModelo({
      objeto,
      categoria,
      titulo,
    });

  const datosLibro = {
    autor:
      datosEspecificos.autor ||
      "",

    editorial:
      datosEspecificos.editorial ||
      marca ||
      "",

    isbn:
      datosEspecificos.isbn ||
      "",

    idioma:
      datosEspecificos.idioma ||
      "",
  };

  const clavesReservadas =
    esLibro
      ? [
          "autor",
          "editorial",
          "isbn",
          "idioma",
          "marca",
          "modelo",
        ]
      : mostrarMarcaModelo
        ? [
            "marca",
            "modelo",
          ]
        : [];

  const otrosDatosEspecificos =
    Object.entries(
      datosEspecificos
    )
      .filter(
        ([
          clave,
        ]) =>
          !clavesReservadas.includes(
            clave
          )
      )
      .sort(
        ([
          claveA,
        ], [
          claveB,
        ]) =>
          etiquetaDatoEspecifico(
            claveA
          ).localeCompare(
            etiquetaDatoEspecifico(
              claveB
            ),
            "es"
          )
      );

  const fotosConUrl =
    useMemo(() => {
      return fotos.map(
        (foto) => ({
          ...foto,

          url:
            foto?.archivo
              ? URL.createObjectURL(
                  foto.archivo
                )
              : "",
        })
      );
    }, [fotos]);

  useEffect(() => {
    return () => {
      fotosConUrl.forEach(
        (foto) => {
          if (foto.url) {
            URL.revokeObjectURL(
              foto.url
            );
          }
        }
      );
    };
  }, [fotosConUrl]);

  function actualizarDatoEspecifico(
    clave,
    valor
  ) {
    setDatosEspecificos(
      (actuales) => ({
        ...actuales,
        [clave]:
          valor,
      })
    );

    if (
      clave === "marca" &&
      !esLibro
    ) {
      setMarca(valor);
    }

    if (
      clave === "modelo" &&
      !esLibro
    ) {
      setModelo(valor);
    }

    if (
      clave ===
      "editorial" &&
      esLibro
    ) {
      setMarca(valor);
    }
  }

  async function elegirPortada(
    indice
  ) {
    setPortadaIndice(
      indice
    );

    try {
      await guardarBorradorPublicacion({
        portadaIndice:
          indice,
      });
    } catch (err) {
      console.error(
        "Error guardando portada:",
        err
      );

      setError(
        "No pudimos guardar la foto de portada."
      );
    }
  }

  async function guardarYContinuar() {
    if (
      guardando ||
      !puedeGuardar
    ) {
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const fotoPortada =
        fotos[
          portadaIndice
        ];

      const otrasFotos =
        fotos.filter(
          (
            _foto,
            indice
          ) =>
            indice !==
            portadaIndice
        );

      const fotosOrdenadas =
        fotoPortada
          ? [
              fotoPortada,
              ...otrasFotos,
            ]
          : fotos;

      const datosLimpios = {};

      Object.entries(
        datosEspecificos
      ).forEach(
        ([
          clave,
          valor,
        ]) => {
          const texto =
            String(
              valor || ""
            ).trim();

          if (texto) {
            datosLimpios[
              clave
            ] = texto;
          }
        }
      );

      if (esLibro) {
        const editorial =
          String(
            datosLibro.editorial ||
            ""
          ).trim();

        const autor =
          String(
            datosLibro.autor ||
            ""
          ).trim();

        const isbn =
          String(
            datosLibro.isbn ||
            ""
          ).trim();

        const idioma =
          String(
            datosLibro.idioma ||
            ""
          ).trim();

        if (autor) {
          datosLimpios.autor =
            autor;
        } else {
          delete datosLimpios.autor;
        }

        if (editorial) {
          datosLimpios.editorial =
            editorial;
        } else {
          delete datosLimpios.editorial;
        }

        if (isbn) {
          datosLimpios.isbn =
            isbn;
        } else {
          delete datosLimpios.isbn;
        }

        if (idioma) {
          datosLimpios.idioma =
            idioma;
        } else {
          delete datosLimpios.idioma;
        }

        delete datosLimpios.marca;
        delete datosLimpios.modelo;
      } else if (
        mostrarMarcaModelo
      ) {
        const marcaLimpia =
          marca.trim();

        const modeloLimpio =
          modelo.trim();

        if (marcaLimpia) {
          datosLimpios.marca =
            marcaLimpia;
        } else {
          delete datosLimpios.marca;
        }

        if (modeloLimpio) {
          datosLimpios.modelo =
            modeloLimpio;
        } else {
          delete datosLimpios.modelo;
        }
      } else {
        delete datosLimpios.marca;
        delete datosLimpios.modelo;
      }

      const respuestasActuales = {
        funcionamiento:
          funcionamiento ||
          "",
      };

      await guardarBorradorPublicacion({
        titulo:
          titulo.trim(),

        descripcion:
          descripcion.trim(),

        categoria,

        marca:
          esLibro
            ? String(
                datosLimpios.editorial ||
                ""
              ).trim()
            : mostrarMarcaModelo
              ? marca.trim()
              : "",

        modelo:
          esLibro
            ? ""
            : mostrarMarcaModelo
              ? modelo.trim()
              : "",

        datosEspecificos:
          datosLimpios,

        estadoAparente:
          estadoAparente.trim(),

        respuestasInteligentes:
          mostrarFuncionamiento
            ? respuestasActuales
            : {},

        fotos:
          fotosOrdenadas,

        portadaIndice:
          0,

        revisadoEn:
          new Date().toISOString(),
      });

      navigate(
        "/publicar/ubicacion"
      );
    } catch (err) {
      console.error(
        "Error guardando revisión:",
        err
      );

      setError(
        "No pudimos guardar los cambios. Probá nuevamente."
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
        Preparando tu publicación...
      </main>
    );
  }

  return (
    <>
      <style>{`
        .sv-revision-aviso {
          margin: 0 0 15px;
          padding: 12px 14px;
          border: 1px solid #dce8da;
          border-radius: 14px;
          background: #f4f9f3;
          color: var(--sv-petroleo);
          font-size: 12.5px;
          line-height: 1.4;
        }

        .sv-portada-bloque {
          margin-bottom: 18px;
        }

        .sv-portada-titulo {
          margin: 0 0 4px;
          color: var(--sv-petroleo);
          font-size: 14px;
          font-weight: 850;
        }

        .sv-portada-ayuda {
          margin: 0 0 10px;
          color: #6b645d;
          font-size: 12px;
          line-height: 1.35;
        }

        .sv-revision-fotos {
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          gap: 7px;
        }

        .sv-revision-foto {
          position: relative;
          aspect-ratio: 1;
          padding: 0;
          overflow: hidden;
          border: 2px solid var(--sv-borde);
          border-radius: 11px;
          background: #f3eee7;
          cursor: pointer;
        }

        .sv-revision-foto.portada {
          border-color: var(--sv-petroleo);
          box-shadow:
            0 0 0 2px
            rgba(7, 87, 83, 0.12);
        }

        .sv-revision-foto img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .sv-portada-marca {
          position: absolute;
          left: 4px;
          right: 4px;
          bottom: 4px;
          padding: 3px 4px;
          border-radius: 7px;
          background:
            rgba(7, 87, 83, 0.92);
          color: #fff;
          font-size: 8.5px;
          font-weight: 850;
          text-align: center;
        }

        .sv-revision-seccion {
          margin-top: 12px;
          padding: 15px;
          border: 1px solid var(--sv-borde);
          border-radius: 17px;
          background:
            rgba(255, 255, 255, 0.74);
        }

        .sv-revision-seccion:first-of-type {
          margin-top: 0;
        }

        .sv-revision-titulo {
          margin: 0 0 12px;
          color: var(--sv-petroleo);
          font-size: 15px;
          font-weight: 850;
        }

        .sv-revision-subtitulo {
          margin: -5px 0 12px;
          color: #6b645d;
          font-size: 11.5px;
          line-height: 1.4;
        }

        .sv-revision-campo {
          margin-top: 12px;
        }

        .sv-revision-campo:first-child {
          margin-top: 0;
        }

        .sv-revision-label {
          display: block;
          margin-bottom: 5px;
          color: var(--sv-petroleo);
          font-size: 11.8px;
          font-weight: 800;
        }

        .sv-revision-input,
        .sv-revision-select,
        .sv-revision-textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border: 1px solid #ded6cc;
          border-radius: 13px;
          background: #fff;
          color: var(--sv-texto);
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .sv-revision-input:focus,
        .sv-revision-select:focus,
        .sv-revision-textarea:focus {
          border-color: var(--sv-petroleo);
          box-shadow:
            0 0 0 2px
            rgba(7, 87, 83, 0.07);
        }

        .sv-revision-textarea {
          min-height: 128px;
          resize: vertical;
          line-height: 1.45;
        }

        .sv-revision-textarea.estado {
          min-height: 86px;
        }

        .sv-revision-dos {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 8px;
        }

        .sv-revision-datos-extra {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 8px;
          margin-top: 12px;
        }

        .sv-revision-datos-extra
        .sv-revision-campo {
          margin-top: 0;
        }

        .sv-revision-modalidad {
          padding: 12px 13px;
          border-radius: 14px;
          background: #f5f2ed;
          color: #5e5852;
          font-size: 12.5px;
          line-height: 1.45;
        }

        .sv-revision-modalidad strong {
          display: block;
          margin-bottom: 3px;
          color: var(--sv-petroleo);
          font-size: 15px;
        }

        .sv-revision-editar-valor {
          width: 100%;
          min-height: 42px;
          margin-top: 10px;
          border: 1px solid var(--sv-petroleo);
          border-radius: 13px;
          background: transparent;
          color: var(--sv-petroleo);
          font: inherit;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-revision-funcionamiento {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 7px;
          margin-top: 6px;
        }

        .sv-revision-funcionamiento button {
          min-height: 40px;
          padding: 7px;
          border: 1px solid #d9d2c9;
          border-radius: 12px;
          background: #fff;
          color: var(--sv-petroleo);
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .sv-revision-funcionamiento
        button.activo {
          border-color:
            var(--sv-petroleo);
          background:
            var(--sv-petroleo);
          color: #fff;
        }

        .sv-revision-error {
          margin-top: 12px;
          padding: 10px 12px;
          border: 1px solid #efcabb;
          border-radius: 13px;
          background: #fff3ee;
          color: #a84422;
          text-align: center;
          font-size: 12px;
        }

        .sv-revision-continuar {
          width: 100%;
          min-height: 52px;
          margin-top: 15px;
          border: 0;
          border-radius: 17px;
          background: var(--sv-mostaza);
          color: #fff;
          font: inherit;
          font-size: 15px;
          font-weight: 850;
          cursor: pointer;
          box-shadow:
            0 8px 18px
            rgba(239, 169, 0, 0.2);
        }

        .sv-revision-continuar:disabled {
          opacity: 0.42;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (
          max-width: 390px
        ) {
          .sv-revision-datos-extra,
          .sv-revision-dos {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>

      <PantallaOperativa
        titulo="Revisá tu publicación"
        subtitulo="La preparamos con vos. Ahora podés cambiar lo que quieras antes de publicarla."
      >
        <div className="sv-revision-aviso">
          ✦ Revisá especialmente los datos del objeto, el título y la descripción.
          Nada de lo que sugirió la asistencia está bloqueado.
        </div>

        {fotosConUrl.length > 0 && (
          <div className="sv-portada-bloque">
            <p className="sv-portada-titulo">
              Elegí la foto de portada
            </p>

            <p className="sv-portada-ayuda">
              Tocá la foto que querés mostrar primero.
            </p>

            <div className="sv-revision-fotos">
              {fotosConUrl.map(
                (
                  foto,
                  indice
                ) => (
                  <button
                    key={
                      foto.id ||
                      indice
                    }
                    type="button"
                    className={
                      indice ===
                      portadaIndice
                        ? "sv-revision-foto portada"
                        : "sv-revision-foto"
                    }
                    onClick={() =>
                      elegirPortada(
                        indice
                      )
                    }
                    aria-label={`Elegir foto ${
                      indice + 1
                    } como portada`}
                  >
                    <img
                      src={
                        foto.url
                      }
                      alt={`Foto ${
                        indice + 1
                      }`}
                    />

                    {indice ===
                      portadaIndice && (
                      <span className="sv-portada-marca">
                        PORTADA
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        <section className="sv-revision-seccion">
          <h2 className="sv-revision-titulo">
            Lo que vamos a mostrar
          </h2>

          <div className="sv-revision-campo">
            <label className="sv-revision-label">
              Título
            </label>

            <input
              className="sv-revision-input"
              type="text"
              value={titulo}
              maxLength={100}
              onChange={(
                event
              ) =>
                setTitulo(
                  event.target
                    .value
                )
              }
            />
          </div>

          <div className="sv-revision-campo">
            <label className="sv-revision-label">
              Descripción
            </label>

            <textarea
              className="sv-revision-textarea"
              value={
                descripcion
              }
              maxLength={1600}
              onChange={(
                event
              ) =>
                setDescripcion(
                  event.target
                    .value
                )
              }
            />
          </div>
        </section>

        <section className="sv-revision-seccion">
          <h2 className="sv-revision-titulo">
            Datos del objeto
          </h2>

          <p className="sv-revision-subtitulo">
            Estos datos ayudan a encontrar y comparar mejor la publicación.
          </p>

          <div className="sv-revision-campo">
            <label className="sv-revision-label">
              Categoría
            </label>

            <select
              className="sv-revision-select"
              value={
                categoria
              }
              onChange={(
                event
              ) =>
                setCategoria(
                  event.target
                    .value
                )
              }
            >
              {CATEGORIAS_NOS_SIRVE.map(
                (
                  opcion
                ) => (
                  <option
                    key={
                      opcion
                    }
                    value={
                      opcion
                    }
                  >
                    {opcion}
                  </option>
                )
              )}
            </select>
          </div>

          {esLibro && (
            <div className="sv-revision-datos-extra">
              <div className="sv-revision-campo">
                <label className="sv-revision-label">
                  Autor
                </label>

                <input
                  className="sv-revision-input"
                  type="text"
                  value={
                    datosLibro.autor
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarDatoEspecifico(
                      "autor",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="sv-revision-campo">
                <label className="sv-revision-label">
                  Editorial
                </label>

                <input
                  className="sv-revision-input"
                  type="text"
                  value={
                    datosLibro.editorial
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarDatoEspecifico(
                      "editorial",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="sv-revision-campo">
                <label className="sv-revision-label">
                  ISBN
                </label>

                <input
                  className="sv-revision-input"
                  type="text"
                  value={
                    datosLibro.isbn
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarDatoEspecifico(
                      "isbn",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="sv-revision-campo">
                <label className="sv-revision-label">
                  Idioma
                </label>

                <input
                  className="sv-revision-input"
                  type="text"
                  value={
                    datosLibro.idioma
                  }
                  onChange={(
                    event
                  ) =>
                    actualizarDatoEspecifico(
                      "idioma",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          )}

          {mostrarMarcaModelo && (
            <div className="sv-revision-dos">
              <div className="sv-revision-campo">
                <label className="sv-revision-label">
                  Marca
                </label>

                <input
                  className="sv-revision-input"
                  type="text"
                  value={marca}
                  onChange={(
                    event
                  ) => {
                    const valor =
                      event.target
                        .value;

                    setMarca(
                      valor
                    );

                    actualizarDatoEspecifico(
                      "marca",
                      valor
                    );
                  }}
                />
              </div>

              <div className="sv-revision-campo">
                <label className="sv-revision-label">
                  Modelo
                </label>

                <input
                  className="sv-revision-input"
                  type="text"
                  value={modelo}
                  onChange={(
                    event
                  ) => {
                    const valor =
                      event.target
                        .value;

                    setModelo(
                      valor
                    );

                    actualizarDatoEspecifico(
                      "modelo",
                      valor
                    );
                  }}
                />
              </div>
            </div>
          )}

          {otrosDatosEspecificos.length >
            0 && (
            <div className="sv-revision-datos-extra">
              {otrosDatosEspecificos.map(
                ([
                  clave,
                  valor,
                ]) => (
                  <div
                    className="sv-revision-campo"
                    key={clave}
                  >
                    <label className="sv-revision-label">
                      {etiquetaDatoEspecifico(
                        clave
                      )}
                    </label>

                    <input
                      className="sv-revision-input"
                      type="text"
                      value={
                        valor
                      }
                      onChange={(
                        event
                      ) =>
                        actualizarDatoEspecifico(
                          clave,
                          event.target.value
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          )}

          <div className="sv-revision-campo">
            <label className="sv-revision-label">
              Lo que se observa
            </label>

            <textarea
              className="sv-revision-textarea estado"
              value={
                estadoAparente
              }
              maxLength={700}
              onChange={(
                event
              ) =>
                setEstadoAparente(
                  event.target
                    .value
                )
              }
            />
          </div>

          {mostrarFuncionamiento && (
            <div className="sv-revision-campo">
              <label className="sv-revision-label">
                ¿Funciona?
              </label>

              <div className="sv-revision-funcionamiento">
                {[
                  {
                    valor: "SI",
                    texto: "Sí",
                  },
                  {
                    valor: "NO",
                    texto: "No",
                  },
                  {
                    valor: "NO_SE",
                    texto: "No sé",
                  },
                  {
                    valor: "NO_APLICA",
                    texto: "No aplica",
                  },
                ].map(
                  (opcion) => (
                    <button
                      key={
                        opcion.valor
                      }
                      type="button"
                      className={
                        funcionamiento ===
                        opcion.valor
                          ? "activo"
                          : ""
                      }
                      onClick={() =>
                        setFuncionamiento(
                          opcion.valor
                        )
                      }
                    >
                      {opcion.texto}
                    </button>
                  )
                )}
              </div>

              {funcionamiento && (
                <p
                  style={{
                    margin:
                      "8px 0 0",

                    color:
                      "#6b645d",

                    fontSize:
                      "11.5px",
                  }}
                >
                  Seleccionado:{" "}
                  {textoFuncionamiento(
                    funcionamiento
                  )}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="sv-revision-seccion">
          <h2 className="sv-revision-titulo">
            Forma de venta
          </h2>

          <div className="sv-revision-modalidad">
            <strong>
              {esPrecioFijo
                ? `Quiero $${formatearDinero(
                    valorMostrado
                  )}`
                : "Recibo propuestas"}
            </strong>

            {!esPrecioFijo && (
              <>
                Valor inicial: $
                {formatearDinero(
                  valorMostrado
                )}

                {fechaCierre && (
                  <>
                    <br />
                    Hasta:{" "}
                    {formatearFecha(
                      fechaCierre
                    )}
                    {horaCierre
                      ? ` · ${horaCierre} h`
                      : ""}
                  </>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            className="sv-revision-editar-valor"
            onClick={() =>
              navigate(
                "/publicar/valor"
              )
            }
          >
            Cambiar forma de venta o valor
          </button>
        </section>

        {error && (
          <div className="sv-revision-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="sv-revision-continuar"
          disabled={
            !puedeGuardar ||
            guardando
          }
          onClick={
            guardarYContinuar
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

export default PublicarRevision;