import express from 'express';
import multer from 'multer';
import { criarMaterial } from '../controllers/materialController.js'; // Importante o .js

const router = express.Router();

// Configura o Multer para memória RAM
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('arquivo'), criarMaterial);

export default router;