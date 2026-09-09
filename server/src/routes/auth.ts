import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res): Promise<void> => {
  try {
    const { studentId, name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Full Name is required.' });
      return;
    }

    if (!email || !String(email).trim()) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (role === 'teacher' || role === 'faculty') {
      res.status(403).json({ error: 'Teacher registration is restricted. Please contact the administrator.' });
      return;
    }

    const assignedRole = 'student';

    const trimmedStudentId = studentId ? String(studentId).trim() : '';
    if (!trimmedStudentId) {
      res.status(400).json({ error: 'Student Register Number / ID is required.' });
      return;
    }

    if (!password || String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existingEmail) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const existingStudentId = db.prepare('SELECT id FROM users WHERE student_id = ?').get(trimmedStudentId);
    if (existingStudentId) {
      res.status(409).json({ error: 'Register number / Student ID is already registered.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO users (student_id, name, email, password_hash, role, created_at, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(trimmedStudentId, name.trim(), trimmedEmail, passwordHash, assignedRole, now, now);

    const insertedUser = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail) as any;
    const userId = insertedUser?.id || Number(result.lastInsertRowid);

    const userPayload = {
      id: userId,
      studentId: trimmedStudentId,
      name: name.trim(),
      email: trimmedEmail,
      role: assignedRole as 'student' | 'teacher',
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: userPayload,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again later.' });
  }
});

authRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Role check - strictly enforce role selection from login UI
    if (role) {
      const normalizedReqRole = (role === 'faculty' || role === 'teacher') ? 'teacher' : 'student';
      if (user.role !== normalizedReqRole) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
    }

    // Update last login
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now, user.id);

    const userPayload = {
      id: user.id,
      studentId: user.student_id || undefined,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful.',
      token,
      user: userPayload,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login error. Please try again.' });
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, student_id, name, email, role, created_at, last_login FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        studentId: user.student_id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});
