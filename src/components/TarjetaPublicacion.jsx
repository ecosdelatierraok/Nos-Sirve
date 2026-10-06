import {
  useNavigate,
} from "react-router-dom";

function IconoUbicacion({
  size = 14,
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
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="10"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function numeroSeguro(
  valor
) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : 0;
}

function formatearDinero(
  valor
) {
  return numeroSeguro(
    valor
  ).toLocaleString(
    "es-AR"
  );
}

function obtenerPrimeraImagen(
  publicacion
) {
  if (
    Array.isArray(
      publicacion?.imagenes
    ) &&
    publicacion.imagenes.length >
      0
  ) {
    const primera =
      publicacion.imagenes[0];

    if (
      typeof primera ===
      "string"
    ) {
      return primera;
    }

    if (primera?.url) {
      return primera.url;
    }

    if (primera?.publica) {
      return primera.publica;
    }
  }

  return (
    publicacion?.imagen ||
    ""
  );
}

function obtenerUbicacion(
  publicacion
) {
  const barrio =
    String(
      publicacion?.barrio ||
        ""
    )
      .trim()
      .replace(
        /^barrio\s+/i,
        ""
      );

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

  const partes = [];

  if (barrio) {
    partes.push(
      barrio
    );
  }

  if (localidad) {
    partes.push(
      localidad
    );
  }

  if (
    provincia &&
    !partes.some(
      (parte) =>
        parte
          .toLowerCase()
          .includes(
            provincia.toLowerCase()
          )
    )
  ) {
    partes.push(
      provincia
    );
  }

  return (
    partes.join(" - ") ||
    "Ubicación a coordinar"
  );
}

function obtenerValor(
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

function esPrecioFijo(
  publicacion
) {
  return (
    publicacion?.modalidad ===
      "PRECIO_FIJO" ||
    publicacion?.modalidad ===
      "QUIERO_X"
  );
}

function obtenerNombrePublicante(
  publicacion
) {
  const posibles = [
    publicacion?.nombrePublicante,
    publicacion?.nombre_publicante,
    publicacion?.publicadoPor,
    publicacion?.publicado_por,
    publicacion?.nombre,
  ];

  const encontrado =
    posibles.find(
      (valor) =>
        String(
          valor || ""
        ).trim()
    );

  if (!encontrado) {
    return "";
  }

  /*
    En tarjetas públicas mostramos
    siempre solamente el primer
    nombre de pila.
  */
  return String(
    encontrado
  )
    .trim()
    .split(/\s+/)[0];
}

function TarjetaPublicacion({
  publicacion,
  cantidadPropuestas = 0,
}) {
  const navigate =
    useNavigate();

  if (!publicacion) {
    return null;
  }

  const imagen =
    obtenerPrimeraImagen(
      publicacion
    );

  const valor =
    obtenerValor(
      publicacion
    );

  const precioFijo =
    esPrecioFijo(
      publicacion
    );

  const nombrePublicante =
    obtenerNombrePublicante(
      publicacion
    );

  const numero =
    publicacion?.numero;

  function abrirPublicacion() {
    if (!numero) {
      return;
    }

    sessionStorage.setItem(
      "scroll-publicaciones",
      String(
        window.scrollY
      )
    );

    navigate(
      `/publicacion/${numero}`
    );
  }

  function manejarTeclado(
    event
  ) {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      abrirPublicacion();
    }
  }

  return (
    <>
      <style>{`
        .sv-tarjeta-publicacion {
          width: 100%;
          display: grid;
          grid-template-columns: 128px minmax(0, 1fr);
          gap: 12px;
          min-height: 145px;
          padding: 8px;
          box-sizing: border-box;
          border: 1px solid #eadccc;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 7px 20px
            rgba(52, 42, 31, 0.035);
          cursor: pointer;
          text-align: left;
          outline: none;
        }

        .sv-tarjeta-publicacion:focus-visible {
          box-shadow:
            0 0 0 3px
            rgba(7, 87, 83, 0.14);
        }

        .sv-tarjeta-publicacion-imagen {
          width: 128px;
          height: 128px;
          align-self: center;
          overflow: hidden;
          border-radius: 14px;
          background: #ffffff;
        }

        .sv-tarjeta-publicacion-imagen img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
          background: #ffffff;
        }

        .sv-tarjeta-publicacion-sin-imagen {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #075753;
          font-size: 34px;
          background: #f3eee7;
        }

        .sv-tarjeta-publicacion-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3px 5px 3px 0;
          box-sizing: border-box;
        }

        .sv-tarjeta-publicacion-numero {
          margin: 0 0 4px;
          color: #746960;
          font-size: 11px;
          line-height: 1;
          font-weight: 800;
        }

        .sv-tarjeta-publicacion-titulo {
          margin: 0 0 7px;
          color: #075753;
          font-size: 16px;
          line-height: 1.12;
          font-weight: 850;
          display: -webkit-box;
          overflow: hidden;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .sv-tarjeta-publicacion-modalidad {
          margin: 0 0 5px;
          font-size: 14px;
          line-height: 1.15;
          font-weight: 850;
        }

        .sv-tarjeta-publicacion-modalidad.quiero {
          color: #f15a24;
        }

        .sv-tarjeta-publicacion-modalidad.propuestas {
          color: #efa900;
        }

        .sv-tarjeta-publicacion-dato {
          margin: 2px 0 0;
          color: #5c554f;
          font-size: 11px;
          line-height: 1.25;
        }

        .sv-tarjeta-publicacion-ubicacion {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 7px;
          color: #075753;
          font-size: 10.2px;
          line-height: 1.15;
        }

        .sv-tarjeta-publicacion-ubicacion svg {
          flex: 0 0 auto;
        }

        .sv-tarjeta-publicacion-ubicacion-texto {
          min-width: 0;
          color: #4f4a46;
          white-space: normal;
          overflow-wrap: normal;
          word-break: normal;
        }

        .sv-tarjeta-publicacion-publicante {
          margin-top: 5px;
          color: #746960;
          font-size: 10.5px;
          line-height: 1.2;
        }

        @media (
          max-width: 430px
        ) {
          .sv-tarjeta-publicacion {
            grid-template-columns:
              118px minmax(0, 1fr);
            min-height: 135px;
            gap: 10px;
          }

          .sv-tarjeta-publicacion-imagen {
            width: 118px;
            height: 118px;
            align-self: center;
          }

          .sv-tarjeta-publicacion-titulo {
            font-size: 15px;
          }

          .sv-tarjeta-publicacion-ubicacion {
            font-size: 9.8px;
            gap: 4px;
          }
        }
      `}</style>

      <article
        className="sv-tarjeta-publicacion"
        role="link"
        tabIndex={0}
        aria-label={`Abrir publicación ${numero || ""} ${publicacion.titulo || ""}`}
        onClick={
          abrirPublicacion
        }
        onKeyDown={
          manejarTeclado
        }
      >
        <div className="sv-tarjeta-publicacion-imagen">
          {imagen ? (
            <img
              src={imagen}
              alt={
                publicacion.titulo ||
                "Objeto publicado"
              }
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="sv-tarjeta-publicacion-sin-imagen">
              ♻
            </div>
          )}
        </div>

        <div className="sv-tarjeta-publicacion-info">
          <div className="sv-tarjeta-publicacion-numero">
            #{numero}
          </div>

          <h2 className="sv-tarjeta-publicacion-titulo">
            {publicacion.titulo ||
              "Objeto usado"}
          </h2>

          {precioFijo ? (
            <p className="sv-tarjeta-publicacion-modalidad quiero">
              Quiero $
              {formatearDinero(
                valor
              )}
            </p>
          ) : (
            <>
              <p className="sv-tarjeta-publicacion-modalidad propuestas">
                Recibo propuestas
              </p>

              {valor > 0 && (
                <p className="sv-tarjeta-publicacion-dato">
                  Valor inicial $
                  {formatearDinero(
                    valor
                  )}
                </p>
              )}

              <p className="sv-tarjeta-publicacion-dato">
                {cantidadPropuestas === 1
                  ? "1 propuesta"
                  : `${cantidadPropuestas} propuestas`}
              </p>
            </>
          )}

          <div className="sv-tarjeta-publicacion-ubicacion">
            <IconoUbicacion />

            <span className="sv-tarjeta-publicacion-ubicacion-texto">
              {obtenerUbicacion(
                publicacion
              )}
            </span>
          </div>

          {nombrePublicante && (
            <div className="sv-tarjeta-publicacion-publicante">
              Publicado por{" "}
              {nombrePublicante}
            </div>
          )}
        </div>
      </article>
    </>
  );
}

export default TarjetaPublicacion;