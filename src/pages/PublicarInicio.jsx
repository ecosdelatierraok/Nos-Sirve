import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import PantallaOperativa from "../components/PantallaOperativa";

import {
  supabase,
} from "../lib/supabase";

function IconoCamara() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="13"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconoDestellos() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2l1.4 4.1L17.5 7.5l-4.1 1.4L12 13l-1.4-4.1L6.5 7.5l4.1-1.4L12 2Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />

      <path
        d="M19 13l.8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13Z"
        fill="currentColor"
      />

      <path
        d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PublicarInicio() {
  const navigate =
    useNavigate();

  const [
    haySesion,
    setHaySesion,
  ] = useState(false);

  useEffect(() => {
    let activo = true;

    async function comprobarSesion() {
      const {
        data,
      } =
        await supabase.auth.getSession();

      if (!activo) {
        return;
      }

      setHaySesion(
        Boolean(
          data?.session?.user
        )
      );
    }

    comprobarSesion();

    const {
      data:
        suscripcion,
    } =
      supabase.auth.onAuthStateChange(
        (
          _evento,
          session
        ) => {
          if (!activo) {
            return;
          }

          setHaySesion(
            Boolean(
              session?.user
            )
          );
        }
      );

    return () => {
      activo = false;

      suscripcion?.subscription?.unsubscribe();
    };
  }, []);

  function empezarFotos() {
    navigate(
      "/publicar/fotos"
    );
  }

  function ingresar() {
    navigate(
      "/ingresar",
      {
        state: {
          volverA:
            "/publicar",
        },
      }
    );
  }

  return (
    <>
      <style>{`
        .sv-publicar-inicio-contenido {
          width: 100%;
        }

        .sv-ilustracion {
          position: relative;

          height: 220px;

          margin:
            -2px 0 3px;

          display: grid;
          place-items: center;

          overflow: hidden;
        }

        .sv-ilustracion::before {
          content: "";

          position: absolute;

          left: 50%;
          top: 50%;

          width: 205px;
          height: 205px;

          transform:
            translate(
              -50%,
              -48%
            );

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(
                235,
                244,
                236,
                0.92
              ) 0%,
              rgba(
                245,
                248,
                243,
                0.55
              ) 52%,
              rgba(
                253,
                250,
                247,
                0
              ) 74%
            );

          pointer-events: none;
        }

        .sv-telefono {
          position: relative;

          z-index: 3;

          width: 96px;
          height: 174px;

          border:
            6px solid
            #202828;

          border-radius: 21px;

          background: #fff;

          box-shadow:
            0 11px 25px
            rgba(
              39,
              50,
              48,
              0.1
            ),
            0 2px 4px
            rgba(
              39,
              50,
              48,
              0.04
            );
        }

        .sv-telefono::before {
          content: "";

          position: absolute;

          top: 8px;
          left: 50%;

          width: 32px;
          height: 4px;

          transform:
            translateX(-50%);

          border-radius: 10px;

          background:
            #202828;
        }

        .sv-visor {
          position: absolute;

          inset:
            31px
            13px
            15px;

          display: grid;
          place-items: center;

          border:
            1.5px solid
            #dfe8dd;

          border-radius: 12px;

          background:
            linear-gradient(
              180deg,
              #fbfdf9 0%,
              #f4f8f2 100%
            );
        }

        .sv-sillon-mini {
          position: relative;

          width: 57px;
          height: 52px;

          margin-top: 13px;
        }

        .sv-sillon-respaldo {
          position: absolute;

          top: 2px;
          left: 9px;

          width: 39px;
          height: 34px;

          border-radius:
            14px 14px 9px 9px;

          background:
            #79aa78;
        }

        .sv-sillon-asiento {
          position: absolute;

          left: 6px;
          bottom: 9px;

          width: 45px;
          height: 21px;

          border-radius: 8px;

          background:
            #6c9d6b;
        }

        .sv-sillon-brazo {
          position: absolute;

          top: 23px;

          width: 12px;
          height: 23px;

          border-radius: 8px;

          background:
            #709f70;
        }

        .sv-sillon-brazo.izq {
          left: 0;
        }

        .sv-sillon-brazo.der {
          right: 0;
        }

        .sv-sillon-pata {
          position: absolute;

          bottom: 1px;

          width: 4px;
          height: 11px;

          border-radius: 3px;

          background:
            #74431f;
        }

        .sv-sillon-pata.izq {
          left: 12px;

          transform:
            rotate(6deg);
        }

        .sv-sillon-pata.der {
          right: 12px;

          transform:
            rotate(-6deg);
        }

        .sv-lampara {
          position: absolute;

          z-index: 1;

          left: 38px;
          top: 61px;

          width: 39px;
          height: 91px;

          opacity: 0.96;
        }

        .sv-lampara-pantalla {
          width: 39px;
          height: 46px;

          border-radius:
            50% 50% 10px 10px;

          background:
            #f18b31;
        }

        .sv-lampara-palo {
          width: 3px;
          height: 39px;

          margin:
            0 auto;

          background:
            #66564b;
        }

        .sv-lampara-base {
          width: 29px;
          height: 6px;

          margin:
            0 auto;

          border-radius: 50%;

          background:
            #66564b;
        }

        .sv-planta {
          position: absolute;

          z-index: 1;

          right: 33px;
          top: 58px;

          width: 58px;
          height: 97px;

          opacity: 0.96;
        }

        .sv-maceta {
          position: absolute;

          bottom: 0;
          left: 13px;

          width: 35px;
          height: 31px;

          border-radius:
            5px 5px 12px 12px;

          background:
            #c78c50;
        }

        .sv-hoja {
          position: absolute;

          width: 21px;
          height: 40px;

          border-radius:
            100% 0 100% 0;

          background:
            #65a071;

          transform-origin:
            bottom center;
        }

        .sv-hoja.h1 {
          left: 21px;
          top: 3px;

          transform:
            rotate(-25deg);
        }

        .sv-hoja.h2 {
          left: 31px;
          top: 11px;

          transform:
            rotate(28deg);
        }

        .sv-hoja.h3 {
          left: 14px;
          top: 25px;

          transform:
            rotate(-55deg);
        }

        .sv-caja {
          position: absolute;

          z-index: 1;

          right: 58px;
          bottom: 20px;

          width: 48px;
          height: 38px;

          border-radius: 4px;

          background:
            #bd8040;

          transform:
            rotate(-4deg);

          opacity: 0.9;
        }

        .sv-caja::before,
        .sv-caja::after {
          content: "";

          position: absolute;

          top: -10px;

          width: 28px;
          height: 19px;

          background:
            #d09658;
        }

        .sv-caja::before {
          left: -6px;

          transform:
            rotate(-22deg);
        }

        .sv-caja::after {
          right: -6px;

          transform:
            rotate(22deg);
        }

        .sv-destello {
          position: absolute;

          z-index: 2;

          color:
            var(--sv-mostaza);

          font-size: 24px;
          line-height: 1;
        }

        .sv-destello.d1 {
          left: 91px;
          top: 49px;
        }

        .sv-destello.d2 {
          right: 88px;
          top: 61px;
        }

        .sv-destello.d3 {
          left: 82px;
          bottom: 41px;
        }

        .sv-como-funciona {
          margin:
            1px 0 17px;

          text-align: center;
        }

        .sv-como-funciona-titulo {
          margin:
            0 0 10px;

          color:
            var(--sv-petroleo);

          font-size: 18px;
          line-height: 1.15;
          font-weight: 850;

          text-align: center;
        }

        .sv-como-funciona-contenido {
          max-width: 330px;

          margin:
            0 auto;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 7px;

          color: #56524e;

          text-align: center;
        }

        .sv-como-funciona-icono {
          flex:
            0 0 auto;

          width: 39px;
          height: 39px;

          display: grid;
          place-items: center;

          margin:
            0 auto;

          border-radius: 50%;

          background:
            rgba(
              239,
              169,
              0,
              0.08
            );

          color:
            var(--sv-mostaza);
        }

        .sv-como-funciona-texto {
          max-width: 300px;

          margin:
            0 auto;

          text-align: center;

          font-size: 13.5px;
          line-height: 1.4;
        }

        .sv-como-funciona-texto
        strong {
          color:
            var(--sv-petroleo);

          font-weight: 800;
        }

        .sv-boton-principal {
          width: 100%;

          min-height: 54px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 11px;

          padding:
            11px 18px;

          border: 0;
          border-radius: 18px;

          background:
            var(--sv-petroleo);

          color: #fff;

          font: inherit;

          font-size: 17px;
          font-weight: 850;

          cursor: pointer;

          box-shadow:
            0 9px 19px
            rgba(
              7,
              87,
              83,
              0.14
            );
        }

        .sv-ingresar {
          margin:
            18px 0 0;

          text-align: center;

          color: #4b4b47;

          font-size: 13.5px;
        }

        .sv-ingresar button {
          padding: 0;

          border: 0;
          border-bottom:
            1px solid
            currentColor;

          background:
            transparent;

          color:
            var(--sv-petroleo);

          font: inherit;
          font-weight: 800;

          cursor: pointer;
        }

        @media (
          max-width: 380px
        ) {
          .sv-ilustracion {
            height: 207px;
          }

          .sv-lampara {
            left: 24px;
          }

          .sv-planta {
            right: 21px;
          }

          .sv-caja {
            right: 41px;
          }
        }
      `}</style>

      <PantallaOperativa
        titulo="Publicá fácil"
        subtitulo={
          <>
            Sacale unas fotos a lo que ya no usás.
            <br />
            Nos Sirve te ayuda con el resto.
          </>
        }
        mostrarAyuda
      >
        <div className="sv-publicar-inicio-contenido">
          <div
            className="sv-ilustracion"
            aria-hidden="true"
          >
            <div className="sv-lampara">
              <div className="sv-lampara-pantalla" />
              <div className="sv-lampara-palo" />
              <div className="sv-lampara-base" />
            </div>

            <span className="sv-destello d1">
              ✦
            </span>

            <span className="sv-destello d2">
              ✦
            </span>

            <span className="sv-destello d3">
              ✦
            </span>

            <div className="sv-telefono">
              <div className="sv-visor">
                <div className="sv-sillon-mini">
                  <div className="sv-sillon-respaldo" />
                  <div className="sv-sillon-asiento" />
                  <div className="sv-sillon-brazo izq" />
                  <div className="sv-sillon-brazo der" />
                  <div className="sv-sillon-pata izq" />
                  <div className="sv-sillon-pata der" />
                </div>
              </div>
            </div>

            <div className="sv-planta">
              <div className="sv-hoja h1" />
              <div className="sv-hoja h2" />
              <div className="sv-hoja h3" />
              <div className="sv-maceta" />
            </div>

            <div className="sv-caja" />
          </div>

          <section className="sv-como-funciona">
            <h2 className="sv-como-funciona-titulo">
              ¿Cómo funciona?
            </h2>

            <div className="sv-como-funciona-contenido">
              <div className="sv-como-funciona-icono">
                <IconoDestellos />
              </div>

              <div className="sv-como-funciona-texto">
                <strong>
                  Tu publicación se va armando mientras cargás las fotos.
                </strong>

                <br />

                Después revisás, modificás si hace falta y publicás.
              </div>
            </div>
          </section>

          <button
            type="button"
            className="sv-boton-principal"
            onClick={empezarFotos}
          >
            <IconoCamara />

            Empezar con las fotos
          </button>

          {!haySesion && (
            <p className="sv-ingresar">
              ¿Ya tenés cuenta?{" "}

              <button
                type="button"
                onClick={ingresar}
              >
                Ingresá
              </button>
            </p>
          )}
        </div>
      </PantallaOperativa>
    </>
  );
}

export default PublicarInicio;