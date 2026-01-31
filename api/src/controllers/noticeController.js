import prisma from '../db.js';

const ALLOWED_CREATORS = (process.env.ADMIN_EMAILS || 'theonogueira1956@gmail.com').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export const listNotices = async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({ orderBy: { date: 'desc' } });
    return res.json(notices);
  } catch (err) {
    console.error('[listNotices] erro:', err.message);
    return res.status(500).json({ error: 'Erro ao listar informes' });
  }
};

export const getNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) return res.status(404).json({ error: 'Informe não encontrado' });
    return res.json(notice);
  } catch (err) {
    console.error('[getNotice] erro:', err.message);
    return res.status(500).json({ error: 'Erro ao obter informe' });
  }
};

function isAllowed(userEmail) {
  if (!userEmail) return false;
  const e = String(userEmail).toLowerCase();
  return ALLOWED_CREATORS.includes(e);
}

export const createNotice = async (req, res) => {
  try {
    const user = req.enrollment;
    if (!isAllowed(user?.email)) return res.status(403).json({ error: 'Acesso negado' });

    const { title, content, category, date } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });

    const created = await prisma.notice.create({ data: {
      title,
      content,
      category: category || null,
      date: date ? new Date(date) : new Date(),
      createdById: user.id
    }});

    return res.status(201).json(created);
  } catch (err) {
    console.error('[createNotice] erro:', err.message);
    return res.status(500).json({ error: 'Erro ao criar informe' });
  }
};

export const updateNotice = async (req, res) => {
  try {
    const user = req.enrollment;
    if (!isAllowed(user?.email)) return res.status(403).json({ error: 'Acesso negado' });

    const { id } = req.params;
    const { title, content, category, date } = req.body;

    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Informe não encontrado' });

    const updated = await prisma.notice.update({ where: { id }, data: {
      title: title ?? existing.title,
      content: content ?? existing.content,
      category: category ?? existing.category,
      date: date ? new Date(date) : existing.date
    }});

    return res.json(updated);
  } catch (err) {
    console.error('[updateNotice] erro:', err.message);
    return res.status(500).json({ error: 'Erro ao atualizar informe' });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const user = req.enrollment;
    if (!isAllowed(user?.email)) return res.status(403).json({ error: 'Acesso negado' });

    const { id } = req.params;
    const existing = await prisma.notice.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Informe não encontrado' });

    await prisma.notice.delete({ where: { id } });
    return res.json({ success: true });
  } catch (err) {
    console.error('[deleteNotice] erro:', err.message);
    return res.status(500).json({ error: 'Erro ao excluir informe' });
  }
};
