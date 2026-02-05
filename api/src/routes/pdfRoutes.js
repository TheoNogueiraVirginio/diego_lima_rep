import express from 'express';
import { serveWatermarkedPdf } from '../controllers/pdfController.js';
// Certifique-se de que esse middleware existe e popula req.user ou req.enrollment
import { requireAuth } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// A rota recebe o NOME do arquivo. Ex: /api/pdf/17382394-fisica.pdf
router.get('/:docId', requireAuth, serveWatermarkedPdf);

export default router;