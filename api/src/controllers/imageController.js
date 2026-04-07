import bucket from '../config/firebase.js';

export const serveImage = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!docId || docId.includes('..')) {
      return res.status(400).json({ error: 'ID de documento inválido.' });
    }

    let cleanDocId = docId.replace(/^\/+/, '');
    // As imagens estão em "images/" na raiz do Firebase, ou o firebase bucket raiz tem "images/"?
    // User context: "As imagens estão, partindo da raiz: images/Simulados/Simulado1/Qx.png"
    let nomeArquivo = `images/${cleanDocId}`;
    let fileRef = bucket.file(nomeArquivo);

    // Tenta encontrar também com .paint ou .jpg caso o front peça .png e não exista
    const extensionsToTry = ['', '.paint', '.jpg', '.jpeg', '.PNG'];
    let found = false;

    // Verificar com prefixo images/
    for (let ext of extensionsToTry) {
      let tempArquivo = cleanDocId.replace(/\.png$/i, ext);
      fileRef = bucket.file(`images/${tempArquivo}`);
      let [exists] = await fileRef.exists();
      if (exists) {
        nomeArquivo = `images/${tempArquivo}`;
        found = true;
        break;
      }
    }

    if (!found) {
      // Verificar sem o prefixo images/
      for (let ext of extensionsToTry) {
        let tempArquivo = cleanDocId.replace(/\.png$/i, ext);
        fileRef = bucket.file(tempArquivo);
        let [exists] = await fileRef.exists();
        if (exists) {
          nomeArquivo = tempArquivo;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      console.log(`Arquivo de imagem não encontrado: images/${cleanDocId} etc.`);
      return res.status(404).json({ error: 'Imagem não encontrada.' });
    }

    // Identificar contentType pela extensão
    let contentType = 'image/png'; // Default
    if (docId.toLowerCase().endsWith('.jpg') || docId.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
    } else if (docId.toLowerCase().endsWith('.gif')) {
        contentType = 'image/gif';
    } else if (docId.toLowerCase().endsWith('.webp')) {
        contentType = 'image/webp';
    } else if (docId.toLowerCase().endsWith('.svg')) {
        contentType = 'image/svg+xml';
    } else if (docId.toLowerCase().endsWith('.paint')) {
        // Fallback for .paint (likely PNG or JPEG renamed)
        contentType = 'image/png';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24 horas

    // Faça streaming do arquivo do Firebase
    const readStream = fileRef.createReadStream();
    
    readStream.on('error', (err) => {
      console.error('Erro no stream de imagem:', err);
      if (!res.headersSent) {
        res.status(500).send('Erro ao abrir a imagem.');
      }
    });

    readStream.pipe(res);

  } catch (err) {
    console.error('Erro ao processar imagem:', err);
    if (!res.headersSent) {
      return res.status(500).send('Erro interno.');
    }
  }
};
