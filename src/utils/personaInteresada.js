const CLAVE_PERSONA_INTERESADA = "persona-interesada";

export function obtenerPersonaInteresada() {
  const personaGuardada =
    localStorage.getItem(CLAVE_PERSONA_INTERESADA);

  if (personaGuardada) {
    return JSON.parse(personaGuardada);
  }

  const ofertanteAnterior =
    localStorage.getItem("ofertante");

  if (ofertanteAnterior) {
    const personaInteresada =
      JSON.parse(ofertanteAnterior);

    localStorage.setItem(
      CLAVE_PERSONA_INTERESADA,
      JSON.stringify(personaInteresada)
    );

    localStorage.removeItem("ofertante");

    return personaInteresada;
  }

  return null;
}

export function guardarPersonaInteresada(
  personaInteresada
) {
  localStorage.setItem(
    CLAVE_PERSONA_INTERESADA,
    JSON.stringify(personaInteresada)
  );
}