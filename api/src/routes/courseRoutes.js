import express from 'express';
import { getLessonsByModule, updateLesson, createLesson, createPdf } from '../controllers/courseController.js';
// import { protect, admin } from '../middleware/authMiddleware.js'; // Assuming auth middleware exists

const router = express.Router();

router.get('/:moduleId', getLessonsByModule);

// Admin routes (should use protect, admin)
router.post('/pdfs', createPdf);
router.put('/lessons/:id', updateLesson);
router.post('/lessons', createLesson);
// router.delete('/lessons/:id', deleteLesson);

export default router;
