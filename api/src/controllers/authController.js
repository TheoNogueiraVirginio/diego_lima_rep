import bcrypt from 'bcrypt';
import prisma from '../db.js';
import { signAccess, signRefresh, ACCESS_EXPIRES, REFRESH_EXPIRES } from '../utils/jwt.js';
import crypto from 'crypto';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.enrollment.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Enrollment not found. Create enrollment first.' });

    const hash = await bcrypt.hash(password, 10);
    await prisma.enrollment.update({ where: { id: user.id }, data: { passwordHash: hash } });

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('register error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.enrollment.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'E-mail não encontrado.' });

    // Se passwordHash existir, validar com bcrypt. Caso contrário, manter compatibilidade com CPF como senha (legacy)
    let ok = false;
    if (user.passwordHash) {
      ok = await bcrypt.compare(password, user.passwordHash);
    } else {
      const passLimpo = String(password).replace(/\D/g, '');
      ok = user.cpf === passLimpo;
    }

    if (!ok) return res.status(401).json({ error: 'Senha incorreta.' });

    // Allow ADMIN users to login as equivalent to PAID
    if (!['PAID','ADMIN'].includes(user.status)) return res.status(403).json({ error: 'Seu pagamento ainda não foi confirmado.' });

    const accessToken = signAccess(user.id);
    const refreshToken = signRefresh(user.id);

    // Cookies HttpOnly
    const secure = process.env.NODE_ENV === 'production';

    // Store refresh token hash in DB for rotation/invalidation
    try {
      const tokenHash = hashToken(refreshToken);
      const expiresAt = new Date(Date.now() + REFRESH_EXPIRES * 1000);
      await prisma.refreshToken.create({ data: { enrollmentId: user.id, tokenHash, expiresAt } });
    } catch (err) {
      console.error('Error saving refresh token hash:', err.message);
    }

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: ACCESS_EXPIRES * 1000,
      path: '/'
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: REFRESH_EXPIRES * 1000,
      path: '/'
    });

    return res.json({ success: true, userId: user.id, userName: user.name });
  } catch (err) {
    console.error('login error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

export const logout = async (req, res) => {
  try {
    // Revoke all refresh tokens for this user (simple approach)
    try {
      const userId = req.enrollment?.id || null;
      if (userId) {
        await prisma.refreshToken.updateMany({ where: { enrollmentId: userId, revoked: false }, data: { revoked: true } });
      }
    } catch (err) {
      console.error('Error revoking refresh tokens on logout:', err.message);
    }

    // Limpar cookies
    res.cookie('accessToken', '', { maxAge: 0, path: '/' });
    res.cookie('refreshToken', '', { maxAge: 0, path: '/' });
    return res.json({ success: true });
  } catch (err) {
    console.error('logout error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

export const me = async (req, res) => {
  try {
    const user = req.enrollment;
    return res.json({ id: user.id, name: user.name, email: user.email, status: user.status, modality: user.modality });
  } catch (err) {
    console.error('me error', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (!payload?.id) return res.status(401).json({ error: 'Invalid token' });

    // Validate refresh token record
    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findFirst({ where: { tokenHash } });
    if (!stored || stored.revoked) return res.status(401).json({ error: 'Invalid refresh token' });
    if (new Date(stored.expiresAt) < new Date()) return res.status(401).json({ error: 'Refresh token expired' });

    // Rotate: create new refresh token record and revoke old
    const newRefresh = signRefresh(payload.id);
    const newHash = hashToken(newRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES * 1000);

    const created = await prisma.refreshToken.create({ data: { enrollmentId: payload.id, tokenHash: newHash, expiresAt } });
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true, replacedById: created.id } });

    const accessToken = signAccess(payload.id);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACCESS_EXPIRES * 1000,
      path: '/'
    });

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_EXPIRES * 1000,
      path: '/'
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('refresh error', err.message);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};
