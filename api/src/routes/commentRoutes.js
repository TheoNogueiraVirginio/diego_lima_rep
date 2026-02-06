import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { postComment, getComments } from '../controllers/commentController.js';

const router = express.Router();

router.post('/', requireAuth, postComment);
router.get('/', requireAuth, getComments);

export default router;
