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

    // Array para guardar todas as variações de nomes possíveis
    const baseNames = [];
    
    // Nome original limpo (ex: Simulados/Simulado1/Q2.png)
    baseNames.push(cleanDocId.replace(/\.png$/i, ''));
    
    // Se o arquivo tiver a estrutura Q[numero] ou q[numero], adiciona a versão com zero (ex: Q02) e lowercase
    const qMatch = cleanDocId.match(/(.*\/)(Q|q)(\d+)\.png$/i);
    if (qMatch) {
        const path = qMatch[1]; // Simulados/Simulado1/
        const qLevel = qMatch[2]; // Q ou q
        const num = qMatch[3]; // 2
        
        // Padded (ex: Q02)
        if (num.length === 1) {
            baseNames.push(`${path}${qLevel}0${num}`);
            baseNames.push(`${path}q0${num}`);
            baseNames.push(`${path}Q0${num}`);
        }
        
        // Alternar cases do 'Q' para o original
        baseNames.push(`${path}q${num}`);
        baseNames.push(`${path}Q${num}`);
    }

    // Variar também case dos diretórios Simulados/Simulado1 ou simulados/simulado1
    const lowerDirsNames = baseNames.map(n => n.toLowerCase());
    
    const allNamesToTest = [...new Set([...baseNames, ...lowerDirsNames])];
    
    const extensionsToTry = ['.paint', '.png', '.jpg', '.jpeg', '.PNG', '.JPG', ''];
    let found = false;

    // Verificar com prefixo images/
    for (let base of allNamesToTest) {
      for (let ext of extensionsToTry) {
        let tempArquivo = `${base}${ext}`;
        fileRef = bucket.file(`images/${tempArquivo}`);
        let [exists] = await fileRef.exists();
        if (exists) {
          nomeArquivo = `images/${tempArquivo}`;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      // Verificar sem o prefixo images/
      for (let base of allNamesToTest) {
        for (let ext of extensionsToTry) {
          let tempArquivo = `${base}${ext}`;
          fileRef = bucket.file(tempArquivo);
          let [exists] = await fileRef.exists();
          if (exists) {
            nomeArquivo = tempArquivo;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      // LAST RESORT FALLBACK: Busca difusa por tudo que tiver 'Simulado' no nome 'QX'
      try {
        const [allImages1] = await bucket.getFiles({ prefix: 'images/Simulados/' });
        const [allImages2] = await bucket.getFiles({ prefix: 'Simulados/' });
        const [allImages3] = await bucket.getFiles({ prefix: 'simulados/' });
        const allImages = [...allImages1, ...allImages2, ...allImages3];
        
        // Pega o número da questão, ex: Q2 -> 2
        let questaoNumMatch = cleanDocId.match(/(Q|q)(\d+)\.png$/i);
        let numBuscado = questaoNumMatch ? questaoNumMatch[2] : null;

        if (numBuscado) {
          // Busca em todos os arquivos um que tenha "simulado" e "q<numero>" ou "q0<numero>"
          for (let file of allImages) {
            let nomeL = file.name.toLowerCase();
            // Verifica se tem "simulado" e se termina com "q2.ext", "q02.ext", "questao2.ext"
            if (nomeL.includes('simulado') && (nomeL.match(new RegExp(`q0?${numBuscado}\\.`, 'i')) || nomeL.match(new RegExp(`questao0?${numBuscado}\\.`, 'i')))) {
              nomeArquivo = file.name;
              fileRef = bucket.file(nomeArquivo);
              found = true;
              break;
            }
          }
        }
      } catch (err) {
        console.error("Erro na busca difusa:", err);
      }
    }

    if (!found) {
      console.log(`Arquivo de imagem não encontrado. Caminhos testados para: ${cleanDocId}`);
      
      // DEBUG: Vamos listar os arquivos no diretório para ajudar o usuário a descobrir o nome exato
      let filesNoBanco = [];
      try {
        // Tenta pegar com o prefixo 'images/'
        const [files1] = await bucket.getFiles({ prefix: 'images/' });
        filesNoBanco = files1.map(f => f.name).filter(n => n.toLowerCase().includes('simulado'));
        
        // Se vazio, tenta na raiz
        if (filesNoBanco.length === 0) {
            const [files2] = await bucket.getFiles({ prefix: 'Simulados/' });
            filesNoBanco = [...filesNoBanco, ...files2.map(f => f.name)];
            
            const [files3] = await bucket.getFiles({ prefix: 'simulados/' });
            filesNoBanco = [...filesNoBanco, ...files3.map(f => f.name)];
        }
      } catch (err) {
        console.error("DEBUG-ERROR Listando arquivos:", err);
      }

      return res.status(404).json({ 
        error: 'Imagem não encontrada.', 
        requestedId: cleanDocId,
        availableFiles: filesNoBanco.slice(0, 50) // Retorna até 50 imagens do diretório p/ ajudar a achar o erro de digitação
      });
    }

    // Identificar contentType pela extensão do arquivo encontrado, não do docId
    let contentType = null; // Vamos deixar nulo por padrão para `.paint` ou desconhecidos forçarem o MIME sniffing do browser
    if (nomeArquivo.toLowerCase().endsWith('.jpg') || nomeArquivo.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
    } else if (nomeArquivo.toLowerCase().endsWith('.gif')) {
        contentType = 'image/gif';
    } else if (nomeArquivo.toLowerCase().endsWith('.webp')) {
        contentType = 'image/webp';
    } else if (nomeArquivo.toLowerCase().endsWith('.svg')) {
        contentType = 'image/svg+xml';
    } else if (nomeArquivo.toLowerCase().endsWith('.png')) {
        contentType = 'image/png';
    }

    if (contentType) {
        res.setHeader('Content-Type', contentType);
    }
    
    // Header vital para MIME sniffing. Se for um .bmp ou .png disfarçado de .paint,
    // o navegador ignora a falta de content-type e verifica a assinatura do arquivo real.
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Remover se der erro, mas para imagens costuma ser arriscado. Melhor: NAO usar nosniff se queremos que o browser sniffe!
    // Na verdade, para permitir MIME sniffing de imagens (como .paint que pode ser .bmp), NÃO devemos bloquear o sniffing.
    res.removeHeader('X-Content-Type-Options'); 

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
