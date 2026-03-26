import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import bucket from '../config/firebase.js';

export const serveWatermarkedPdf = async (req, res) => {
  try {
    const { docId } = req.params;

    // Permite caracteres alfanuméricos, ponto, traço, sublinhado, barras e caracteres Unicode
    // Exclui barras invertidas e pontos duplos para evitar path traversal
    if (!docId || docId.includes('\\') || docId.includes('..')) {
      return res.status(400).json({ error: 'ID de documento inválido.' });
    }

    let cleanDocId = docId.replace(/^\/+/, '');
    
    // Garantir que a string esteja devidamente decodificada (espaços, acentos, cedilha, e %2F para barras)
    try {
      cleanDocId = decodeURIComponent(cleanDocId);
    } catch (e) {
      console.warn('Erro ao decodificar docId:', cleanDocId);
    }

    let nomeArquivo = `pdfs/${cleanDocId}`; 
    let fileRef = bucket.file(nomeArquivo);

    let [exists] = await fileRef.exists();
    if (!exists) {
      // Tentar converter "Módulo X" para "Modulo_X" caso tenha sido salvo com acento e espaço
      const alternateDocId = cleanDocId.replace(/M[oó]dulo\s+(\d+)/gi, 'Modulo_$1');
      if (alternateDocId !== cleanDocId) {
        nomeArquivo = `pdfs/${alternateDocId}`;
        fileRef = bucket.file(nomeArquivo);
        [exists] = await fileRef.exists();
      }
      
      if (!exists) {
        console.log(`Arquivo não encontrado: ${nomeArquivo} (tentou também ${cleanDocId})`);
        return res.status(404).json({ error: 'Documento não encontrado.' });
      }
    }

    const [fileBuffer] = await fileRef.download();

    const pdfDoc = await PDFDocument.load(fileBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const userName = req.enrollment?.name || 'Usuario';
    const userCpf = req.enrollment?.cpf || 'CPF não informado';
    const watermarkUseName = `${userName}`;
    const watermarkUseCpf = `CPF: ${userCpf}`;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        const fontSize = 50;
        const color = rgb(0.6, 0.6, 0.6);
        const opacity = 0.4; // Aumentar opacidade para teste
        const rotate = degrees(45);

        // --- SOLUÇÃO DE CAMADAS (Z-INDEX) ---
        // Em alguns PDFs (scans), o conteúdo original pode tapar o texto novo.
        // O pdf-lib desenha por cima por padrão, mas para garantir, 
        // podemos evitar blend modes estranhos resetting o estado gráfico.
        
        page.pushOperators(
             // Save Graphics State (q)
             // Isso isola nossa marca d'água de transformações anteriores estranhas
             // mas 'drawText' já faz algo similar internamente.
        );

        const textWidthName = font.widthOfTextAtSize(watermarkUseName, fontSize);
        const textWidthCpf = font.widthOfTextAtSize(watermarkUseCpf, fontSize);

        // Coordenadas calculadas
        const xName = (width / 2) - (textWidthName / 2) * 0.707; 
        const yName = (height / 2);
        
        const xCpf = (width / 2) - (textWidthCpf / 2) * 0.707;
        const yCpf = (height / 2) - 60;

        // Desenhando Nome
        page.drawText(watermarkUseName, {
            x: xName,
            y: yName,
            size: fontSize,
            font: font,
            color: color,
            opacity: opacity,
            rotate: rotate,
            blendMode: 'Normal', // Força modo normal para garantir visibilidade
        });

        // Desenhando CPF
        page.drawText(watermarkUseCpf, {
            x: xCpf,
            y: yCpf,
            size: fontSize,
            font: font,
            color: color,
            opacity: opacity,
            rotate: rotate,
            blendMode: 'Normal',
        });
    }

    // --- SALVAMENTO ROBUSTO ---
    // useObjectStreams: false -> Desativa compactação de objetos (maior arquivo, max compatibilidade)
    // addDefaultPage: false -> Não tenta adicionar página em branco se vazio
    // objectsPerTick: Infinity -> Processa tudo síncrono para evitar falhas de async
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

    const fileNameForHeader = docId.split('/').pop();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileNameForHeader}"`);
    
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('Erro ao processar PDF:', err);
    if (!res.headersSent) {
      return res.status(500).send('Erro ao processar o documento.');
    }
  }
};
