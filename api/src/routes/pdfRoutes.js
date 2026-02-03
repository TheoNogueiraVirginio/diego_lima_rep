import express from 'express';
import { serveWatermarkedPdf } from '../controllers/pdfController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/pdf/:docId -> retorna PDF com watermark para o usuário autenticado
router.get('/:docId', requireAuth, serveWatermarkedPdf);

export default router;
