import { supabase } from "../lib/supabase";

const CLAVE_ESTADO_ADMIN =
  "admin-nos-sirve-autenticado";

function guardarEstadoAdmin(esAdministrador) {
  if (esAdministrador) {
    localStorage.setItem(
      CLAVE_ESTADO_ADMIN,
      "true"
    );

    return;
  }

  localStorage.removeItem(
    CLAVE_ESTADO_ADMIN
  );
}

async function obtenerRolUsuario(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(
      "Error al consultar el rol del usuario:",
      error
    );

    return null;
  }

  return data?.rol || null;
}

export function esAdmin() {
  return (
    localStorage.getItem(
      CLAVE_ESTADO_ADMIN
    ) === "true"
  );
}

export async function sincronizarAdmin() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error(
        "Error al consultar la sesión:",
        error
      );

      guardarEstadoAdmin(false);

      return false;
    }

    const userId =
      session?.user?.id;

    if (!userId) {
      guardarEstadoAdmin(false);

      return false;
    }

    const rol =
      await obtenerRolUsuario(
        userId
      );

    const esAdministrador =
      rol === "ADMIN";

    guardarEstadoAdmin(
      esAdministrador
    );

    return esAdministrador;
  } catch (error) {
    console.error(
      "Error al sincronizar Administración:",
      error
    );

    guardarEstadoAdmin(false);

    return false;
  }
}

export async function activarAdmin(
  email,
  password
) {
  if (!email || !password) {
    return {
      ok: false,
      mensaje:
        "Ingresá email y contraseña.",
    };
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

  if (error) {
    guardarEstadoAdmin(false);

    return {
      ok: false,
      mensaje:
        "Email o contraseña incorrectos.",
    };
  }

  const userId =
    data?.user?.id;

  const rol =
    await obtenerRolUsuario(
      userId
    );

  if (rol !== "ADMIN") {
    await supabase.auth.signOut();

    guardarEstadoAdmin(false);

    return {
      ok: false,
      mensaje:
        "Esta cuenta no tiene permisos de Administración.",
    };
  }

  guardarEstadoAdmin(true);

  return {
    ok: true,
  };
}

export async function salirAdmin() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error(
      "Error al cerrar sesión:",
      error
    );
  } finally {
    guardarEstadoAdmin(false);
  }
}

export async function cambiarClaveAdmin(
  claveActual,
  nuevaClave
) {
  if (!claveActual) {
    return {
      ok: false,
      mensaje:
        "Ingresá tu contraseña actual.",
    };
  }

  if (
    !nuevaClave ||
    nuevaClave.length < 6
  ) {
    return {
      ok: false,
      mensaje:
        "La nueva contraseña debe tener al menos 6 caracteres.",
    };
  }

  const {
    data: { user },
    error: errorUsuario,
  } =
    await supabase.auth.getUser();

  if (
    errorUsuario ||
    !user?.id ||
    !user?.email
  ) {
    return {
      ok: false,
      mensaje:
        "No se pudo identificar la cuenta de Administración.",
    };
  }

  const {
    data: validacion,
    error: errorValidacion,
  } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: claveActual,
    });

  if (
    errorValidacion ||
    validacion?.user?.id !==
      user.id
  ) {
    return {
      ok: false,
      mensaje:
        "La contraseña actual es incorrecta.",
    };
  }

  const rol =
    await obtenerRolUsuario(
      user.id
    );

  if (rol !== "ADMIN") {
    return {
      ok: false,
      mensaje:
        "Esta cuenta no tiene permisos de Administración.",
    };
  }

  const { error } =
    await supabase.auth.updateUser({
      password: nuevaClave,
    });

  if (error) {
    console.error(
      "Error al cambiar la contraseña:",
      error
    );

    return {
      ok: false,
      mensaje:
        "No se pudo actualizar la contraseña.",
    };
  }

  return {
    ok: true,
  };
}

export async function ingresarComoAdmin() {
  const email = window.prompt(
    "Email de Administración:"
  );

  if (email === null) {
    return;
  }

  const password =
    window.prompt(
      "Contraseña de Administración:"
    );

  if (password === null) {
    return;
  }

  const resultado =
    await activarAdmin(
      email,
      password
    );

  if (!resultado.ok) {
    alert(
      resultado.mensaje
    );

    return;
  }

  window.location.reload();
}
