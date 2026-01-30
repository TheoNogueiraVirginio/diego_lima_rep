import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { postLessonProgress, getLessons, postExamResult, getExamAttempts, getSummary, getSummaryPublic } from '../controllers/progressController.js';

const router = express.Router();

router.post('/lesson', requireAuth, postLessonProgress);
router.get('/lessons/me', requireAuth, getLessons);
// NOTE: deleteLessonProgress removed — only admin may modify DB directly now

router.post('/exam', requireAuth, postExamResult);
router.get('/exams/me', requireAuth, getExamAttempts);

router.get('/summary/me', requireAuth, getSummary);
router.get('/summary', getSummaryPublic);

export default router;
