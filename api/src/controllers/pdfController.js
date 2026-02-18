import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import bucket from '../config/firebase.js';

export const serveWatermarkedPdf = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!docId || !/^[a-zA-Z0-9._-]+$/.test(docId)) {
      return res.status(400).json({ error: 'ID de documento inválido.' });
    }

    const nomeArquivo = `pdfs/${docId}`; 
    const fileRef = bucket.file(nomeArquivo);

    const [exists] = await fileRef.exists();
    if (!exists) {
      console.log(`Arquivo não encontrado: ${nomeArquivo}`);
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    const [fileBuffer] = await fileRef.download();

    const pdfDoc = await PDFDocument.load(fileBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const userName = req.enrollment?.name || 'Usuario';
    const userCpf = req.enrollment?.cpf || 'CPF não informado';
    const watermarkUseName = `${userName}`;
    const watermarkUseCpf = `CPF: ${userCpf}`;


    for (const page of pages) {
        const { width, height } = page.getSize();
        const fontSize = 50;
        
        // 1. Nome do aluno
        const textWidthName = font.widthOfTextAtSize(watermarkUseName, fontSize);
        page.drawText(watermarkUseName, {
            x: (width / 2) - (textWidthName / 3), 
            y: height / 3, 
            size: fontSize,
            font,
            color: rgb(0.6, 0.6, 0.6),
            opacity: 0.25,
            rotate: degrees(45),
        });

        // 2. CPF do aluno (Logo abaixo, ajustado para a diagonal)
        const textWidthCpf = font.widthOfTextAtSize(watermarkUseCpf, fontSize);
        page.drawText(watermarkUseCpf, {
            x: (width / 2) - (textWidthCpf / 3) + 35, // +X e -Y para mover "para baixo" na perpendicular de 45º
            y: (height / 3) - 35,
            size: fontSize,
            font,
            color: rgb(0.6, 0.6, 0.6),
            opacity: 0.25,
            rotate: degrees(45),
        });
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${docId}"`);
    
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('Erro ao processar PDF:', err);
    if (!res.headersSent) {
      return res.status(500).send('Erro ao processar o documento.');
    }
  }
};
