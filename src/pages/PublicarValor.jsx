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

const MODALIDAD_PRECIO_FIJO =
  "PRECIO_FIJO";

const MODALIDAD_PROPUESTAS =
  "RECIBE_PROPUESTAS";

function soloNumeros(valor) {
  return String(valor || "")
    .replace(/[^\d]/g, "");
}

function numeroSeguro(valor) {
  const numero =
    Number(
      soloNumeros(valor)
    );

  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}

function formatearDinero(
  valor
) {
  const numero =
    numeroSeguro(valor);

  if (!numero) {
    return "";
  }

  return numero.toLocaleString(
    "es-AR"
  );
}

function fechaMinima() {
  const ahora =
    new Date();

  const anio =
    ahora.getFullYear();

  const mes =
    String(
      ahora.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      ahora.getDate()
    ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function PublicarValor() {
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
    modalidad,
    setModalidad,
  ] = useState("");

  const [
    valor,
    setValor,
  ] = useState("");

  const [
    fechaCierre,
    setFechaCierre,
  ] = useState("");

  const [
    horaCierre,
    setHoraCierre,
  ] = useState("");

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

        setModalidad(
          borrador?.modalidad ||
          ""
        );

        const valorGuardado =
          borrador?.modalidad ===
          MODALIDAD_PRECIO_FIJO
            ? borrador?.precio
            : borrador?.valorInicial;

        if (
          valorGuardado
        ) {
          setValor(
            String(
              valorGuardado
            )
          );
        }

        setFechaCierre(
          borrador?.fechaCierre ||
          ""
        );

        setHoraCierre(
          borrador?.horaCierre ||
          ""
        );
      } catch (err) {
        console.error(
          "Error cargando valor de publicación:",
          err
        );

        if (activo) {
          setError(
            "No pudimos recuperar este paso de tu publicación."
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
    MODALIDAD_PRECIO_FIJO;

  const esPropuestas =
    modalidad ===
    MODALIDAD_PROPUESTAS;

  const valorNumerico =
    useMemo(
      () =>
        numeroSeguro(
          valor
        ),
      [valor]
    );

  const puedeContinuar =
    Boolean(
      modalidad &&
      valorNumerico > 0 &&
      (
        esPrecioFijo ||
        (
          esPropuestas &&
          fechaCierre &&
          horaCierre
        )
      )
    );

  function elegirModalidad(
    nuevaModalidad
  ) {
    setError("");

    setModalidad(
      nuevaModalidad
    );

    if (
      nuevaModalidad ===
      MODALIDAD_PRECIO_FIJO
    ) {
      setFechaCierre("");
      setHoraCierre("");
    }
  }

  function cambiarValor(
    event
  ) {
    setValor(
      soloNumeros(
        event.target.value
      )
    );
  }

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

      const datos = {
        modalidad,

        precio:
          esPrecioFijo
            ? valorNumerico
            : null,

        valorInicial:
          esPropuestas
            ? valorNumerico
            : null,

        fechaCierre:
          esPropuestas
            ? fechaCierre
            : null,

        horaCierre:
          esPropuestas
            ? horaCierre
            : null,

        valorConfiguradoEn:
          new Date().toISOString(),
      };

      await guardarBorradorPublicacion(
        datos
      );

      navigate(
        "/publicar/revision"
      );
    } catch (err) {
      console.error(
        "Error guardando modalidad y valor:",
        err
      );

      setError(
        "No pudimos guardar este paso. Probá nuevamente."
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
        Recuperando tu publicación...
      </main>
    );
  }

  return (
    <>
      <style>{`
        .sv-valor-intro {
          margin:
            0 0 15px;

          color: #625d57;

          text-align: center;

          font-size: 13px;

          line-height: 1.4;
        }

        .sv-modalidades {
          display: grid;

          gap: 10px;
        }

        .sv-modalidad {
          width: 100%;

          min-height: 92px;

          display: flex;

          flex-direction: column;

          justify-content: center;

          align-items:
            flex-start;

          padding:
            15px 16px;

          box-sizing:
            border-box;

          border:
            1px solid
            var(--sv-borde);

          border-radius: 17px;

          background: #fff;

          color:
            var(--sv-petroleo);

          text-align: left;

          font: inherit;

          cursor: pointer;

          transition:
            border-color
            150ms ease,
            background
            150ms ease,
            transform
            150ms ease;
        }

        .sv-modalidad:hover {
          transform:
            translateY(-1px);

          border-color:
            var(--sv-petroleo);
        }

        .sv-modalidad.seleccionada {
          border-color:
            var(--sv-petroleo);

          background:
            linear-gradient(
              145deg,
              #eff7ef,
              #fbfdf9
            );

          box-shadow:
            0 8px 20px
            rgba(
              7,
              87,
              83,
              0.07
            );
        }

        .sv-modalidad-titulo {
          display: block;

          margin-bottom: 4px;

          font-size: 18px;

          line-height: 1.15;

          font-weight: 850;
        }

        .sv-modalidad-texto {
          color: #69635d;

          font-size: 12.5px;

          line-height: 1.35;
        }

        .sv-configuracion {
          margin-top: 15px;

          padding: 16px;

          border:
            1px solid
            #ded8d0;

          border-radius: 17px;

          background:
            rgba(
              255,
              255,
              255,
              0.72
            );
        }

        .sv-campo {
          margin-top: 13px;
        }

        .sv-campo:first-child {
          margin-top: 0;
        }

        .sv-campo-label {
          display: block;

          margin-bottom: 6px;

          color:
            var(--sv-petroleo);

          font-size: 12.5px;

          font-weight: 800;
        }

        .sv-dinero {
          height: 51px;

          display: flex;

          align-items: center;

          gap: 6px;

          padding:
            0 14px;

          box-sizing:
            border-box;

          border:
            1px solid
            var(--sv-borde);

          border-radius: 14px;

          background: #fff;
        }

        .sv-dinero-signo {
          color:
            var(--sv-petroleo);

          font-size: 20px;

          font-weight: 850;
        }

        .sv-dinero input {
          width: 100%;

          min-width: 0;

          border: 0;

          outline: 0;

          background:
            transparent;

          color:
            var(--sv-texto);

          font: inherit;

          font-size: 20px;

          font-weight: 800;
        }

        .sv-dinero-vista {
          margin:
            6px 0 0;

          color: #716960;

          font-size: 11.5px;
        }

        .sv-plazo {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 9px;
        }

        .sv-plazo input {
          width: 100%;

          height: 49px;

          padding:
            0 10px;

          box-sizing:
            border-box;

          border:
            1px solid
            var(--sv-borde);

          border-radius: 13px;

          background: #fff;

          color:
            var(--sv-texto);

          font: inherit;
        }

        .sv-aclaracion {
          margin:
            13px 0 0;

          padding:
            11px 12px;

          border-radius: 13px;

          background:
            #f5f2ed;

          color: #655f59;

          font-size: 11.8px;

          line-height: 1.4;
        }

        .sv-error-valor {
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

        .sv-valor-continuar {
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

        .sv-valor-continuar:disabled {
          opacity: 0.42;

          cursor:
            not-allowed;

          box-shadow: none;
        }
      `}</style>

      <PantallaOperativa
        titulo="¿Cómo querés venderlo?"
        subtitulo="Elegí la forma que mejor te cierre. Después vas a poder revisar todo."
      >
        <p className="sv-valor-intro">
          Vos decidís el valor y la forma de recibir interesados.
        </p>

        <div className="sv-modalidades">
          <button
            type="button"
            className={
              esPrecioFijo
                ? "sv-modalidad seleccionada"
                : "sv-modalidad"
            }
            onClick={() =>
              elegirModalidad(
                MODALIDAD_PRECIO_FIJO
              )
            }
          >
            <span className="sv-modalidad-titulo">
              Quiero $…
            </span>

            <span className="sv-modalidad-texto">
              Ponés el valor por el que querés venderlo.
            </span>
          </button>

          <button
            type="button"
            className={
              esPropuestas
                ? "sv-modalidad seleccionada"
                : "sv-modalidad"
            }
            onClick={() =>
              elegirModalidad(
                MODALIDAD_PROPUESTAS
              )
            }
          >
            <span className="sv-modalidad-titulo">
              Recibo propuestas
            </span>

            <span className="sv-modalidad-texto">
              Definís un valor inicial y hasta cuándo querés recibir propuestas.
            </span>
          </button>
        </div>

        {modalidad && (
          <section className="sv-configuracion">
            <div className="sv-campo">
              <label className="sv-campo-label">
                {esPrecioFijo
                  ? "¿Cuánto querés?"
                  : "Valor inicial"}
              </label>

              <div className="sv-dinero">
                <span className="sv-dinero-signo">
                  $
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  value={valor}
                  placeholder="0"
                  aria-label={
                    esPrecioFijo
                      ? "Valor de venta"
                      : "Valor inicial"
                  }
                  onChange={
                    cambiarValor
                  }
                />
              </div>

              {valorNumerico > 0 && (
                <p className="sv-dinero-vista">
                  ${formatearDinero(
                    valorNumerico
                  )}
                </p>
              )}
            </div>

            {esPropuestas && (
              <div className="sv-campo">
                <label className="sv-campo-label">
                  ¿Hasta cuándo?
                </label>

                <div className="sv-plazo">
                  <input
                    type="date"
                    min={
                      fechaMinima()
                    }
                    value={
                      fechaCierre
                    }
                    aria-label="Fecha de cierre"
                    onChange={(
                      event
                    ) =>
                      setFechaCierre(
                        event.target
                          .value
                      )
                    }
                  />

                  <input
                    type="time"
                    value={
                      horaCierre
                    }
                    aria-label="Hora de cierre"
                    onChange={(
                      event
                    ) =>
                      setHoraCierre(
                        event.target
                          .value
                      )
                    }
                  />
                </div>
              </div>
            )}

            <div className="sv-aclaracion">
              {esPrecioFijo
                ? "La publicación mostrará este valor como “Quiero $…”."
                : "Las personas podrán enviarte propuestas hasta la fecha y hora que elijas. Después vos decidís cuál aceptar."}
            </div>
          </section>
        )}

        {error && (
          <div className="sv-error-valor">
            {error}
          </div>
        )}

        <button
          type="button"
          className="sv-valor-continuar"
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

export default PublicarValor;