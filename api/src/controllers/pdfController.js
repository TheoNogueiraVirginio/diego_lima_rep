import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Resolver caminho relativo a este arquivo até: api/storage/pdfs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.join(__dirname, '../../storage/pdfs');

// Inicializar S3 client (Cloudflare R2 compatível com S3)
const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: process.env.S3_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    : undefined,
  forcePathStyle: false,
});

async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function fetchPdfBufferFromS3(key) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return await streamToBuffer(res.Body);
}

export const serveWatermarkedPdf = async (req, res) => {
  try {
    const { docId } = req.params;
    // Ajuste de segurança: validar docId
    if (!/^[a-zA-Z0-9._-]+$/.test(docId)) return res.status(400).json({ error: 'Invalid document id' });

    // Tentar buscar do R2/S3 quando as variáveis estiverem configuradas; fallback para disco
    let fileBuffer;
    try {
      if (process.env.S3_ENDPOINT && process.env.S3_BUCKET) {
        const key = `pdfs/${docId}.pdf`;
        fileBuffer = await fetchPdfBufferFromS3(key);
      } else {
        const filePath = path.join(STORAGE_DIR, `${docId}.pdf`);
        fileBuffer = await fs.readFile(filePath);
      }
    } catch (err) {
      // se S3 falhar, tentar fallback local
      try {
        const filePath = path.join(STORAGE_DIR, `${docId}.pdf`);
        fileBuffer = await fs.readFile(filePath);
      } catch (e) {
        throw err;
      }
    }

    // Gerar watermark com dados do usuário (não incluir CPF completo sem consentimento)
    const userTag = `${req.enrollment.name || req.enrollment.email || 'Usuário'} — ID:${req.enrollment.id}`;

    const pdfDoc = await PDFDocument.load(fileBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();

      // Dados do usuário para watermark
      const userName = req.enrollment.name || req.enrollment.email || 'Usuário';
      const cpfRaw = req.enrollment.cpf || '';
      const cpfText = cpfRaw ? `CPF: ${cpfRaw}` : '';

      // Ajustes de estilo
      const nameSize = 42;
      const cpfSize = 70;
      const opacity = 0.12;
      const rotateDeg = -45;

      // Posicionar a marca mais para cima (12% da altura acima do centro)
      const centerX = width / 2;
      const centerY = height / 2 + height * 0.12;

      const nameText = `${userName}`;

      // deslocamento à direita (8% da largura) para 'empurrar' o watermark ligeiramente
      const offsetX = width * 0.08;

      const nameWidth = font.widthOfTextAtSize(nameText, nameSize);
      const cpfWidth = cpfText ? font.widthOfTextAtSize(cpfText, cpfSize) : 0;

      const cpfX = centerX + offsetX - cpfWidth / 2;
      const nameX = centerX + offsetX - nameWidth / 2;

      // Desenhar CPF (se existir) acima do nome
      if (cpfText) {
        page.drawText(cpfText, {
          x: cpfX,
          y: centerY + 56,
          size: cpfSize,
          font,
          color: rgb(0.6, 0.6, 0.6),
          rotate: degrees(rotateDeg),
          opacity: opacity,
        });
      }

      // Desenhar nome completo abaixo do CPF (sem ID)
      // Abaixar mais para não ficar na mesma linha do CPF
      page.drawText(nameText, {
        x: nameX,
        y: centerY - 96,
        size: nameSize,
        font,
        color: rgb(0.6, 0.6, 0.6),
        rotate: degrees(rotateDeg),
        opacity: opacity,
      });
    }

    const outBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    // Inline para PDF.js renderizar; não expor como attachment
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    // TTL curto e sem cache público por padrão
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(Buffer.from(outBytes));
  } catch (err) {
    console.error('serveWatermarkedPdf error', err);
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Documento não encontrado' });
    return res.status(500).json({ error: 'Erro ao processar PDF' });
  }
};
