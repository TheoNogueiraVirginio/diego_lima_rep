import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
export const ACCESS_EXPIRES = 6 * 60 * 60; // seconds (6 hours)
export const REFRESH_EXPIRES = 7 * 24 * 60 * 60; // seconds

export function signAccess(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: `${ACCESS_EXPIRES}s` });
}

export function signRefresh(userId) {
  return jwt.sign({ id: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: `${REFRESH_EXPIRES}s` });
}

export default jwt;
