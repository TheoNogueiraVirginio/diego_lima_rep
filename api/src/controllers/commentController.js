import prisma from '../db.js';

export const postComment = async (req, res) => {
  try {
    const { lessonId, content } = req.body;
    if (!lessonId || !content) {
      return res.status(400).json({ error: 'Faltam dados: lessonId e content' });
    }

    const comment = await prisma.lessonComment.create({
      data: {
        enrollmentId: req.enrollment.id,
        lessonId,
        content
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar comentário' });
  }
};

export const getComments = async (req, res) => {
  try {
    // Verificação simples de admin
    // Assumindo que req.enrollment foi preenchido pelo middleware requireAuth
    // E que o status 'ADMIN' é usado para administradores
    if (req.enrollment.status !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const comments = await prisma.lessonComment.findMany({
      take: Number(limit),
      skip: Number(skip),
      orderBy: { createdAt: 'desc' },
      include: {
        enrollment: {
          select: { name: true, email: true }
        }
      }
    });

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
};
