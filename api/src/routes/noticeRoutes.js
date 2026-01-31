import express from 'express';
import { listNotices, getNotice, createNotice, updateNotice, deleteNotice } from '../controllers/noticeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/', listNotices);
router.get('/:id', getNotice);

// Protected
router.post('/', requireAuth, createNotice);
router.put('/:id', requireAuth, updateNotice);
router.delete('/:id', requireAuth, deleteNotice);

export default router;
