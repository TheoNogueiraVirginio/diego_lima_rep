import bucket from '../config/firebase.js'; // Note o .js no final, é obrigatório em ESM

async function uploadPDF(file) {
    const nomeArquivo = `pdfs/${Date.now()}-${file.originalname}`;
    const blob = bucket.file(nomeArquivo);

    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: file.mimetype
        }
    });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (erro) => {
            console.error('Erro no Firebase:', erro);
            reject('Falha ao enviar arquivo para o armazenamento.');
        });

        blobStream.on('finish', async () => {
            try {
                await blob.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${nomeArquivo}`;
                resolve(publicUrl);
            } catch (erro) {
                console.error(erro);
                reject('Erro ao tornar o arquivo público.');
            }
        });

        blobStream.end(file.buffer);
    });
}

// Exportação moderna
export { uploadPDF };