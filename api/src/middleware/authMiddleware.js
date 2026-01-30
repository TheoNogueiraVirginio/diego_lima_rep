import prisma from '../db.js';
import { JWT_SECRET } from '../utils/jwt.js';
import jwt from 'jsonwebtoken';

export const requireAuth = async (req, res, next) => {
  try {
    // Aceita cookie HttpOnly ou header Authorization: Bearer <token>
    const token = req.cookies?.accessToken || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.enrollment.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    req.enrollment = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
