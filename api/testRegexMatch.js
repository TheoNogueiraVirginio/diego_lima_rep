let cleanDocId = "Simulados/Simulado1/Q24.png";
let nomeArquivo = "images/Simulados/Simulado1/Q24.paint";

let contentType = 'image/png'; // Default
if (nomeArquivo.toLowerCase().endsWith('.jpg') || nomeArquivo.toLowerCase().endsWith('.jpeg')) {
    contentType = 'image/jpeg';
} else if (nomeArquivo.toLowerCase().endsWith('.gif')) {
    contentType = 'image/gif';
} else if (nomeArquivo.toLowerCase().endsWith('.webp')) {
    contentType = 'image/webp';
} else if (nomeArquivo.toLowerCase().endsWith('.svg')) {
    contentType = 'image/svg+xml';
} else if (nomeArquivo.toLowerCase().endsWith('.paint')) {
    contentType = 'image/png';
}

console.log(contentType);
