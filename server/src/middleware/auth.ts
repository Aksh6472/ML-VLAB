import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET environment variable is required in production');
  } else {
    console.warn('[AUTH] Notice: JWT_SECRET not provided, using local development fallback secret.');
  }
}

export const JWT_SECRET: string = rawSecret || 'srm-vlab-local-dev-jwt-secret-2026';

export interface AuthUser {
  id: number;
  email: string;
  role: 'student' | 'teacher';
  name: string;
  studentId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as (jwt.JwtPayload & AuthUser);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function requireRole(role: 'student' | 'teacher') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: `Access denied. Requires ${role} privileges.` });
      return;
    }
    next();
  };
}

export const requireStudent = [requireAuth, requireRole('student')];
export const requireTeacher = [requireAuth, requireRole('teacher')];
