const cleanDocId = "Simulados/Simulado1/Q2.png";
const extensionsToTry = ['', '.paint', '.jpg', '.jpeg', '.PNG', '.png'];
for (let ext of extensionsToTry) {
  let tempArquivo = cleanDocId.replace(/\.png$/i, ext);
  console.log(`Testing: images/${tempArquivo}`);
}
