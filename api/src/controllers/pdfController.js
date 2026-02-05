import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import bucket from '../config/firebase.js'; // Importação direta e limpa!

export const serveWatermarkedPdf = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!docId || !/^[a-zA-Z0-9._-]+$/.test(docId)) {
      return res.status(400).json({ error: 'ID de documento inválido.' });
    }

    const nomeArquivo = `pdfs/${docId}`; 
    const fileRef = bucket.file(nomeArquivo);

    // ... (o resto do código continua igual, a lógica não muda) ...
    
    // Vou repetir apenas o bloco de verificação e download para garantir
    const [exists] = await fileRef.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    const [fileBuffer] = await fileRef.download();

    // ... (restante da lógica de marca d'água igual) ...
    
    // Se quiser o código completo de novo, me avise, 
    // mas basicamente só mudou a linha do 'import bucket' lá em cima.

    // --- REPETINDO O FINAL PARA VOCÊ NÃO SE PERDER ---
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    
    // (Lógica da marca d'água aqui...)
    // ...
    // ...
    
    // Mock rápido da marca d'água para este exemplo não ficar gigante:
     const userName = req.enrollment?.name || 'Usuario';
     for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(userName, { x: 50, y: height/2, size: 40, font, color: rgb(0.5,0.5,0.5), opacity: 0.2, rotate: degrees(45) });
     }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="doc.pdf"`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error('Erro:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};