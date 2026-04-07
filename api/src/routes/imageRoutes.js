import express from 'express';
import { serveImage } from '../controllers/imageController.js';
import { requireAuth } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.get('/:docId(*)', requireAuth, serveImage);

export default router;
