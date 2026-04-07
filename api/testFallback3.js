let cleanDocId = "Simulados/Simulado1/Q24.png";
let files = ["Q21.paint", "Q22.paint", "Q23.paint", "Q24.paint", "Q26.paint", "simulado1_q24.paint", "Simulados/Simulado1/Q24.paint"];

let numBuscado = "24";

for (let file of files) {
  let nomeL = file.toLowerCase();
  // "nomeL.includes('simulado')" failed because "Q24.paint" does NOT include "simulado"!!
  if (nomeL.includes('simulado') && (nomeL.match(new RegExp(`q0?${numBuscado}\\.`, 'i')) || nomeL.match(new RegExp(`questao0?${numBuscado}\\.`, 'i')))) {
    console.log("MATCH 1: ", file);
  }
}
