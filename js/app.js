const frases = [

"Encontrá ese objeto que todavía no sabías que estabas buscando.",

"Algunos objetos solo están esperando encontrar su nuevo hogar.",

"Mover objetos también es mover energía.",

"Cada remate es una oportunidad para que algo continúe su historia."

];

const numero = Math.floor(Math.random()*frases.length);

document.getElementById("frase").innerHTML=frases[numero];