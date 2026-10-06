const PREFIJO_ANTERIOR =
  ["segunda", "vuelta"].join("-");

const PREFIJO_ACTUAL =
  "nos-sirve";

function migrarStorage(storage) {
  if (!storage) {
    return;
  }

  try {
    const claves = [];

    for (
      let indice = 0;
      indice < storage.length;
      indice += 1
    ) {
      const clave =
        storage.key(indice);

      if (clave) {
        claves.push(clave);
      }
    }

    claves.forEach((clave) => {
      let nuevaClave = null;

      if (
        clave.startsWith(
          PREFIJO_ANTERIOR
        )
      ) {
        nuevaClave =
          `${PREFIJO_ACTUAL}${clave.slice(PREFIJO_ANTERIOR.length)}`;
      } else if (
        clave.includes(
          `-${PREFIJO_ANTERIOR}-`
        )
      ) {
        nuevaClave =
          clave.replace(
            `-${PREFIJO_ANTERIOR}-`,
            `-${PREFIJO_ACTUAL}-`
          );
      }

      if (
        !nuevaClave ||
        nuevaClave === clave
      ) {
        return;
      }

      if (
        storage.getItem(
          nuevaClave
        ) === null
      ) {
        const valor =
          storage.getItem(
            clave
          );

        if (valor !== null) {
          storage.setItem(
            nuevaClave,
            valor
          );
        }
      }

      storage.removeItem(
        clave
      );
    });
  } catch {
    // La migración de compatibilidad nunca debe bloquear la app.
  }
}

export function migrarMarcaStorage() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  migrarStorage(
    window.localStorage
  );

  migrarStorage(
    window.sessionStorage
  );
}
