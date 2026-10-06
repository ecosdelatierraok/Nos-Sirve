import { supabase } from "../lib/supabase";
import { esAdmin } from "./admin";

const TABLA_PROPUESTAS =
  "propuestas";

const INTERVALO_REFRESCO_PROPUESTAS =
  2000;

function sanitizarTexto(valor) {
  const texto =
    String(valor ?? "");

  return new TextDecoder().decode(
    new TextEncoder().encode(
      texto
    )
  );
}

function adaptarPropuesta(
  registro
) {
  if (!registro) {
    return null;
  }

  return {
    id:
      registro.id,

    publicacionId:
      registro.publicacion_id,

    usuarioId:
      registro.usuario_id ||
      registro.usuarioId ||
      registro.creado_por ||
      registro.creadoPor ||
      null,

    nombre:
      registro.nombre ||
      "",

    telefono:
      registro.telefono ||
      "",

    monto:
      Number(
        registro.monto ||
          registro.mi_monto ||
          0
      ),

    estado_resultado:
      registro.estado_resultado ||
      null,

    fecha:
      registro.fecha
        ? new Date(
            registro.fecha
          ).toLocaleString(
            "es-AR",
            {
              timeZone:
                "America/Argentina/Cordoba",

              hour12: false,
            }
          )
        : "",

    fechaOriginal:
      registro.fecha ||
      null,
  };
}

function obtenerFechaComparable(
  registro
) {
  const fecha =
    registro?.fecha;

  if (!fecha) {
    return 0;
  }

  const valor =
    new Date(
      fecha
    ).getTime();

  return Number.isFinite(
    valor
  )
    ? valor
    : 0;
}

function elegirPropuestaMasReciente(
  propuestas
) {
  if (
    !Array.isArray(
      propuestas
    ) ||
    propuestas.length === 0
  ) {
    return null;
  }

  return [
    ...propuestas,
  ].sort(
    (a, b) => {
      const fechaA =
        obtenerFechaComparable(
          a
        );

      const fechaB =
        obtenerFechaComparable(
          b
        );

      if (
        fechaA !== fechaB
      ) {
        return fechaB - fechaA;
      }

      const idA =
        Number(
          a?.propuesta_id ||
          a?.id ||
          0
        );

      const idB =
        Number(
          b?.propuesta_id ||
          b?.id ||
          0
        );

      return idB - idA;
    }
  )[0];
}

async function obtenerMiPropuestaParaPublicacion(
  publicacionId
) {
  const {
    data: {
      user,
    },

    error:
      errorUsuario,
  } =
    await supabase.auth.getUser();

  if (
    errorUsuario ||
    !user?.id
  ) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "obtener_mis_propuestas"
    );

  if (error) {
    console.error(
      "Error al obtener la propuesta propia:",
      error
    );

    return null;
  }

  const referencia =
    Number(
      publicacionId
    );

  const coincidencias =
    (
      data || []
    ).filter(
      (propuesta) =>
        Number(
          propuesta.publicacion_id
        ) ===
        referencia
    );

  const encontrada =
    elegirPropuestaMasReciente(
      coincidencias
    );

  if (!encontrada) {
    return null;
  }

  const montoPropio =
    Number(
      encontrada.mi_monto ??
      encontrada.monto ??
      0
    );

  if (
    !Number.isFinite(
      montoPropio
    ) ||
    montoPropio <= 0
  ) {
    return null;
  }

  return adaptarPropuesta({
    id:
      encontrada.propuesta_id ||
      encontrada.id ||
      `propia-${referencia}-${user.id}`,

    publicacion_id:
      referencia,

    usuario_id:
      user.id,

    nombre:
      encontrada.nombre ||
      "",

    telefono:
      encontrada.telefono ||
      "",

    monto:
      montoPropio,

    estado_resultado:
      encontrada.estado_resultado ||
      null,

    fecha:
      encontrada.fecha ||
      null,
  });
}

export async function obtenerPropuestas(
  publicacionId
) {
  const referencia =
    Number(
      publicacionId
    );

  if (
    !Number.isFinite(
      referencia
    ) ||
    referencia <= 0
  ) {
    return [];
  }

  if (esAdmin()) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          TABLA_PROPUESTAS
        )
        .select("*")
        .eq(
          "publicacion_id",
          referencia
        )
        .order(
          "monto",
          {
            ascending:
              true,
          }
        );

    if (error) {
      throw error;
    }

    return (
      data || []
    )
      .map(
        adaptarPropuesta
      )
      .filter(Boolean);
  }

  const [
    resultadoPublico,
    miPropuesta,
  ] =
    await Promise.all([
      supabase.rpc(
        "obtener_propuestas_publicas",
        {
          p_publicacion_id:
            referencia,
        }
      ),

      obtenerMiPropuestaParaPublicacion(
        referencia
      ),
    ]);

  if (
    resultadoPublico.error
  ) {
    throw resultadoPublico.error;
  }

  const propuestasPublicas =
    (
      resultadoPublico.data ||
      []
    )
      .map(
        adaptarPropuesta
      )
      .filter(Boolean);

  if (!miPropuesta) {
    return propuestasPublicas;
  }

  const indiceMismaPropuesta =
    propuestasPublicas.findIndex(
      (propuesta) => {
        if (
          propuesta.id &&
          miPropuesta.id &&
          String(
            propuesta.id
          ) ===
            String(
              miPropuesta.id
            )
        ) {
          return true;
        }

        return Boolean(
          propuesta.usuarioId &&
          miPropuesta.usuarioId &&
          propuesta.usuarioId ===
            miPropuesta.usuarioId
        );
      }
    );

  if (
    indiceMismaPropuesta >= 0
  ) {
    return propuestasPublicas.map(
      (
        propuesta,
        indice
      ) => {
        if (
          indice !==
          indiceMismaPropuesta
        ) {
          return propuesta;
        }

        return {
          ...propuesta,

          monto:
            miPropuesta.monto,

          estado_resultado:
            miPropuesta.estado_resultado,
        };
      }
    );
  }

  return [
    ...propuestasPublicas,
    miPropuesta,
  ];
}

export async function obtenerResumenPropuestas(
  publicacionId
) {
  const referencia =
    Number(
      publicacionId
    );

  if (
    !Number.isFinite(
      referencia
    ) ||
    referencia <= 0
  ) {
    return {
      cantidad: 0,
      menorImporte: 0,
      mayorImporte: 0,
    };
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "obtener_resumen_propuestas_publicacion",
      {
        p_publicacion_id:
          referencia,
      }
    );

  if (error) {
    throw error;
  }

  const registro =
    Array.isArray(data)
      ? data[0]
      : data;

  return {
    cantidad:
      Number(
        registro?.cantidad ||
        0
      ),

    menorImporte:
      Number(
        registro?.menor_importe ||
        0
      ),

    mayorImporte:
      Number(
        registro?.mayor_importe ||
        0
      ),
  };
}

export async function obtenerCantidadPropuestasPorPublicacion() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "obtener_cantidades_propuestas_publicas"
    );

  if (error) {
    throw error;
  }

  return (
    data || []
  ).reduce(
    (
      cantidades,
      registro
    ) => {
      const publicacionId =
        Number(
          registro.publicacion_id
        );

      cantidades[
        publicacionId
      ] =
        Number(
          registro.cantidad ||
            0
        );

      return cantidades;
    },
    {}
  );
}

export function suscribirseAPropuestas(
  publicacionId,
  onCambio,
  opciones = {}
) {
  const referencia =
    Number(
      publicacionId
    );

  if (
    !Number.isFinite(
      referencia
    ) ||
    referencia <= 0 ||
    typeof onCambio !==
      "function"
  ) {
    return () => {};
  }

  const intervaloPedido =
    Number(
      opciones?.intervaloMs
    );

  const intervaloMs =
    Number.isFinite(
      intervaloPedido
    ) &&
    intervaloPedido >= 1000
      ? intervaloPedido
      : INTERVALO_REFRESCO_PROPUESTAS;

  let activo = true;
  let refrescando = false;
  let canal = null;
  let intervalo = null;

  async function refrescar() {
    if (
      !activo ||
      refrescando
    ) {
      return;
    }

    refrescando = true;

    try {
      const [
        propuestas,
        resumen,
      ] =
        await Promise.all([
          obtenerPropuestas(
            referencia
          ),

          obtenerResumenPropuestas(
            referencia
          ),
        ]);

      if (!activo) {
        return;
      }

      await onCambio(
        Array.isArray(
          propuestas
        )
          ? propuestas
          : []
      );

      if (
        activo &&
        typeof opciones?.onResumen ===
          "function"
      ) {
        await opciones.onResumen(
          resumen
        );
      }
    } catch (error) {
      console.error(
        "Error al refrescar propuestas:",
        error
      );
    } finally {
      refrescando = false;
    }
  }

  function refrescarSiVisible() {
    if (
      typeof document ===
        "undefined" ||
      document.visibilityState ===
        "visible"
    ) {
      refrescar();
    }
  }

  function manejarVisibilidad() {
    if (
      document.visibilityState ===
        "visible"
    ) {
      refrescar();
    }
  }

  refrescar();

  intervalo =
    window.setInterval(
      refrescarSiVisible,
      intervaloMs
    );

  window.addEventListener(
    "focus",
    refrescar
  );

  window.addEventListener(
    "online",
    refrescar
  );

  window.addEventListener(
    "pageshow",
    refrescar
  );

  document.addEventListener(
    "visibilitychange",
    manejarVisibilidad
  );

  canal =
    supabase
      .channel(
        `propuestas-${referencia}-${Date.now()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            TABLA_PROPUESTAS,
          filter:
            `publicacion_id=eq.${referencia}`,
        },
        refrescar
      )
      .subscribe();

  return () => {
    activo = false;

    if (intervalo) {
      window.clearInterval(
        intervalo
      );
    }

    window.removeEventListener(
      "focus",
      refrescar
    );

    window.removeEventListener(
      "online",
      refrescar
    );

    window.removeEventListener(
      "pageshow",
      refrescar
    );

    document.removeEventListener(
      "visibilitychange",
      manejarVisibilidad
    );

    if (canal) {
      supabase.removeChannel(
        canal
      );
    }
  };
}

export async function guardarPropuesta(
  propuesta
) {
  const publicacionId =
    Number(
      propuesta?.publicacionId
    );

  const monto =
    Number(
      propuesta?.monto
    );

  if (
    !Number.isFinite(
      publicacionId
    ) ||
    publicacionId <= 0
  ) {
    throw new Error(
      "La publicación no es válida."
    );
  }

  if (
    !Number.isFinite(
      monto
    ) ||
    monto < 1000 ||
    monto % 500 !== 0
  ) {
    throw new Error(
      "Ingresá un importe desde $1.000, en múltiplos de $500."
    );
  }

  const {
    data: {
      user,
    },

    error:
      errorUsuario,
  } =
    await supabase.auth.getUser();

  if (
    errorUsuario ||
    !user?.id
  ) {
    throw new Error(
      "Tenés que iniciar sesión para hacer una propuesta."
    );
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "registrar_propuesta_publica",
      {
        p_publicacion_id:
          publicacionId,

        p_nombre:
          sanitizarTexto(
            propuesta?.nombre
          ).trim(),

        p_telefono:
          sanitizarTexto(
            propuesta?.telefono
          ).trim(),

        p_monto:
          monto,
      }
    );

  if (error) {
    throw error;
  }

  const registro =
    Array.isArray(data)
      ? data[
          data.length - 1
        ]
      : data;

  const propuestaDevuelta =
    adaptarPropuesta(
      registro
    );

  const propuestaConfirmada =
    await obtenerMiPropuestaParaPublicacion(
      publicacionId
    );

  if (
    propuestaConfirmada &&
    Number(
      propuestaConfirmada.monto
    ) ===
      monto
  ) {
    return propuestaConfirmada;
  }

  if (
    propuestaDevuelta &&
    Number(
      propuestaDevuelta.monto
    ) ===
      monto
  ) {
    return propuestaDevuelta;
  }

  throw new Error(
    "La propuesta no quedó registrada con el importe indicado. Intentá nuevamente."
  );
}