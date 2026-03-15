import prisma from '../db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/jwt.js';
// Imports fs/path/url removed


async function countVimeoIds() {
  try {
    const count = await prisma.videoLesson.count({
        where: {
            AND: [
                { vimeoId: { not: "" } },
                { vimeoId: { not: null } }
            ]
        }
    });
    return count;
  } catch (e) {
    console.error('Erro ao contar aulas:', e);
    // Fallback?
    return 52; // Valor hardcoded temporário
  }
}




// POST /api/progress/lesson
export const postLessonProgress = async (req, res) => {
  try {
    const enrollmentId = req.enrollment.id;
    const { lessonId, watchedSeconds = 0, status = 'IN_PROGRESS' } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

    const existing = await prisma.lessonProgress.findFirst({ where: { enrollmentId, lessonId } });
    if (existing) {
      const currentVal = Number(existing.watchedSeconds) || 0;
      const newVal = Number(watchedSeconds) || 0;
      const finalSeconds = Math.max(currentVal, newVal);
      
      const updated = await prisma.lessonProgress.update({ 
        where: { id: existing.id }, 
        data: { 
            watchedSeconds: finalSeconds, 
            status,
            studentName: req.enrollment.name,
            watchedAt: new Date() 
        } 
      });
      return res.json(updated);
    }

    const created = await prisma.lessonProgress.create({ 
        data: { 
            enrollmentId, 
            lessonId, 
            watchedSeconds, 
            status, 
            studentName: req.enrollment.name, 
            watchedAt: new Date() 
        } 
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error('postLessonProgress error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// GET /api/progress/lessons/me
export const getLessons = async (req, res) => {
  try {
    const enrollmentId = req.enrollment.id;
    const items = await prisma.lessonProgress.findMany({ where: { enrollmentId } });
    return res.json(items);
  } catch (err) {
    console.error('getLessons error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// POST /api/progress/exam
export const postExamResult = async (req, res) => {
  try {
    const enrollmentId = req.enrollment.id;
    const { examId, moduleId, score, maxScore } = req.body;
    if (!examId || score == null || maxScore == null) return res.status(400).json({ error: 'examId, score and maxScore required' });

    const created = await prisma.examAttempt.create({ data: { enrollmentId, examId, moduleId: moduleId || null, score: Number(score), maxScore: Number(maxScore) } });

    // Recalculate module progress if moduleId provided
    if (moduleId) {
      const attempts = await prisma.examAttempt.findMany({ where: { enrollmentId, moduleId } });
      const examsTakenCount = attempts.length;
      const averageScore = examsTakenCount ? attempts.reduce((s, a) => s + (a.score / a.maxScore), 0) / examsTakenCount * 100 : 0;

      await prisma.moduleProgress.upsert({
        where: { enrollmentId_moduleId: { enrollmentId, moduleId } },
        create: { enrollmentId, moduleId, averageScore, examsTakenCount },
        update: { averageScore, examsTakenCount }
      });
    }

    return res.status(201).json(created);
  } catch (err) {
    console.error('postExamResult error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// GET /api/progress/exams/me
export const getExamAttempts = async (req, res) => {
  try {
    const enrollmentId = req.enrollment.id;
    const items = await prisma.examAttempt.findMany({ where: { enrollmentId } });
    return res.json(items);
  } catch (err) {
    console.error('getExamAttempts error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// GET /api/progress/student/:id (Admin)
export const getStudentProgress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Student ID required' });
    
    // Busca todo o histórico de aulas
    const history = await prisma.lessonProgress.findMany({ 
        where: { enrollmentId: id },
        orderBy: { watchedAt: 'desc' }
    });
    
    return res.json(history);
  } catch (err) {
    console.error('getStudentProgress error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// GET /api/progress/summary/me
export const getSummary = async (req, res) => {
  try {
    const enrollmentId = req.enrollment.id;

    // Contagem simples via Regex
    const totalLessons = await countVimeoIds();
    const totalModules = 4;
    let totalExams = Number(process.env.TOTAL_EXAMS || 26);

// Buscar lições concluídas no banco de forma única
    const items = await prisma.lessonProgress.findMany({ 
        where: { enrollmentId, status: 'COMPLETED' },
        distinct: ['lessonId'],
        select: { lessonId: true }
    });
    
    const lessonsCompletedCount = items.length;
    
    // Porcentagem simples
    const lessonsPercent = totalLessons > 0 ? Math.min(100, Math.round((lessonsCompletedCount / totalLessons) * 100)) : 0;
    
    const uniqueExams = await prisma.examAttempt.findMany({ 
        where: { enrollmentId },
        distinct: ['examId'],
        select: { examId: true }
    });
    const examsTakenCount = uniqueExams.length;

    const examsPercent = totalExams > 0 ? Math.min(100, Math.round((examsTakenCount / totalExams) * 100)) : 0;

    const attempts = await prisma.examAttempt.findMany({ where: { enrollmentId } });
    const averageScoreOverall = attempts.length ? Math.round((attempts.reduce((s, a) => s + (a.score / a.maxScore), 0) / attempts.length) * 100) : 0;

    const moduleProgressRecords = await prisma.moduleProgress.findMany({ where: { enrollmentId } });

    // Build a modules array filling missing modules with zeros so frontend shows 0% naturally
    const modules = [];
    for (let i = 1; i <= totalModules; i++) {
        const mp = moduleProgressRecords.find(m => String(m.moduleId) === String(i));
        if (mp) {
            modules.push({ moduleId: String(mp.moduleId), averageScore: Number(mp.averageScore || 0), examsTakenCount: mp.examsTakenCount });
        } else {
            modules.push({ moduleId: String(i), averageScore: 0, examsTakenCount: 0 });
        }
    }

    return res.json({
        lessons: { completed: lessonsCompletedCount, total: totalLessons, percent: lessonsPercent },
        exams: { taken: examsTakenCount, total: totalExams, percent: examsPercent, averageScorePercent: averageScoreOverall },
        modules
    });
  } catch (err) {
    console.error('getSummary error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// Public summary: returns zeros for anonymous users, or full summary if cookie present
export const getSummaryPublic = async (req, res) => {
  try {
    // Try to get enrollmentId from cookie (optional)
    let enrollmentId = null;
    try {
      const token = req.cookies?.accessToken || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (token) {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload?.id) enrollmentId = payload.id;
      }
    } catch (e) {
      enrollmentId = null;
    }

    // Carregar dados dinâmicos para saber o total correto mesmo sem login
    const totalLessons = await countVimeoIds();
    const totalModules = 4;
    let totalExams = Number(process.env.TOTAL_EXAMS || 26);

    if (!enrollmentId) {
      // return zeros filled modules
      const modules = [];
      for (let i = 1; i <= totalModules; i++) modules.push({ moduleId: String(i), averageScore: 0, examsTakenCount: 0 });
      return res.json({
        lessons: { completed: 0, total: totalLessons, percent: 0 },
        exams: { taken: 0, total: totalExams, percent: 0, averageScorePercent: 0 },
        modules
      });
    }

    // If authenticated, reuse getSummary logic by setting req.enrollment and calling it
    req.enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!req.enrollment) return res.status(401).json({ error: 'Unauthorized' });
    return await getSummary(req, res);
  } catch (err) {
    console.error('getSummaryPublic error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// Note: deleteLessonProgress removed. Admins can modify LessonProgress directly in the DB.
