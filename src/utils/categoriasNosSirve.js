export const CATEGORIAS_NOS_SIRVE = [
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

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function contieneAlguna(
  texto,
  palabras
) {
  return palabras.some(
    (palabra) =>
      texto.includes(
        normalizarTexto(
          palabra
        )
      )
  );
}

export function detectarCategoriaNosSirve({
  objeto = "",
  categoriaIA = "",
  titulo = "",
  descripcion = "",
}) {
  const texto =
    normalizarTexto(
      [
        objeto,
        categoriaIA,
        titulo,
        descripcion,
      ]
        .filter(Boolean)
        .join(" ")
    );

  if (
    contieneAlguna(
      texto,
      [
        "libro",
        "novela",
        "cuento",
        "comic",
        "historieta",
        "enciclopedia",
        "diccionario",
        "revista",
        "editorial",
      ]
    )
  ) {
    return "Libros";
  }

  if (
    contieneAlguna(
      texto,
      [
        "heladera",
        "freezer",
        "lavarropa",
        "lavavajilla",
        "microondas",
        "aspiradora",
        "cafetera",
        "licuadora",
        "batidora",
        "tostadora",
        "plancha",
        "electrodomest",
      ]
    )
  ) {
    return "Electrodomésticos";
  }

  if (
    contieneAlguna(
      texto,
      [
        "celular",
        "telefono",
        "notebook",
        "computadora",
        "tablet",
        "camara digital",
        "impresora",
        "televisor",
        "parlante",
        "auricular",
        "tecnologia",
        "electronico",
      ]
    )
  ) {
    return "Tecnología";
  }

  if (
    contieneAlguna(
      texto,
      [
        "mesa",
        "silla",
        "sillon",
        "sofa",
        "cama",
        "ropero",
        "placard",
        "escritorio",
        "biblioteca",
        "comoda",
        "mesa de luz",
        "mueble",
      ]
    )
  ) {
    return "Muebles";
  }

  if (
    contieneAlguna(
      texto,
      [
        "taladro",
        "amoladora",
        "sierra",
        "destornillador",
        "llave",
        "compresor",
        "herramient",
      ]
    )
  ) {
    return "Herramientas";
  }

  if (
    contieneAlguna(
      texto,
      [
        "bicicleta",
        "bici",
      ]
    )
  ) {
    return "Bicicletas";
  }

  if (
    contieneAlguna(
      texto,
      [
        "zapatilla",
        "zapato",
        "bota",
        "sandalia",
        "calzado",
      ]
    )
  ) {
    return "Calzado";
  }

  if (
    contieneAlguna(
      texto,
      [
        "campera",
        "remera",
        "pantalon",
        "vestido",
        "buzo",
        "pollera",
        "ropa",
      ]
    )
  ) {
    return "Ropa";
  }

  if (
    contieneAlguna(
      texto,
      [
        "pelota",
        "raqueta",
        "patineta",
        "skate",
        "pesas",
        "mancuerna",
        "deporte",
      ]
    )
  ) {
    return "Deportes";
  }

  if (
    contieneAlguna(
      texto,
      [
        "juguete",
        "muñeca",
        "muneca",
        "rompecabezas",
        "puzzle",
        "juego de mesa",
      ]
    )
  ) {
    return "Juguetes y juegos";
  }

  if (
    contieneAlguna(
      texto,
      [
        "guitarra",
        "teclado musical",
        "piano",
        "violin",
        "bateria",
        "instrumento musical",
      ]
    )
  ) {
    return "Instrumentos musicales";
  }

  if (
    contieneAlguna(
      texto,
      [
        "cuadro",
        "lamina",
        "escultura",
        "adorno",
        "decoracion",
      ]
    )
  ) {
    return "Arte y decoración";
  }

  const categoriaNormalizada =
    CATEGORIAS_NOS_SIRVE.find(
      (categoria) =>
        normalizarTexto(
          categoria
        ) ===
        normalizarTexto(
          categoriaIA
        )
    );

  if (
    categoriaNormalizada &&
    categoriaNormalizada !==
      "Otros"
  ) {
    return categoriaNormalizada;
  }

  return "Otros";
}