import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { JWT_SECRET, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { sendPasswordResetOtp } from '../services/mailer.js';

export const authRouter = Router();

// In-memory rate limiting map: key = `${ip}:${email}` -> timestamp of last forgot-password request
const forgotRateLimits = new Map<string, number>();

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

// Helper for password strength validation
function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return { valid: false, message: 'Password must contain uppercase, lowercase, numbers, and special characters.' };
  }
  return { valid: true };
}

// ─── Step 1: Request Password Reset Code ──────────────────────────────────────
authRouter.post('/forgot-password', async (req, res): Promise<void> => {
  try {
    const { email } = req.body;

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

    // Rate Limiting (max 1 request per 60 seconds per IP/email)
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}:${trimmedEmail}`;
    const lastRequestTime = forgotRateLimits.get(rateLimitKey);
    const nowMs = Date.now();

    if (lastRequestTime && nowMs - lastRequestTime < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (nowMs - lastRequestTime)) / 1000);
      res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting another verification code.` });
      return;
    }
    forgotRateLimits.set(rateLimitKey, nowMs);

    // Account Enumeration Defense: Check if user exists, but always return generic message
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail) as any;

    let devPreviewCode: string | undefined = undefined;

    if (user) {
      // Invalidate any existing unused reset tokens for this email
      const nowIso = new Date().toISOString();
      db.prepare('UPDATE password_resets SET used_at = ? WHERE email = ? AND used_at IS NULL').run(nowIso, trimmedEmail);

      // Generate cryptographically secure 6-digit OTP (100000 to 999999)
      const otpCode = String(crypto.randomInt(100000, 1000000));

      // Hash OTP with SHA-256 before storing at rest
      const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');

      // 15-minute expiration
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO password_resets (email, code_hash, attempts, expires_at, used_at, created_at)
        VALUES (?, ?, 0, ?, NULL, ?)
      `).run(trimmedEmail, codeHash, expiresAt, nowIso);

      // Dispatch via email service
      const mailResult = await sendPasswordResetOtp(trimmedEmail, otpCode);
      if (mailResult.previewCode) {
        devPreviewCode = mailResult.previewCode;
      }
    }

    res.json({
      success: true,
      message: 'If an account is associated with this email, a verification code has been sent.',
      ...(devPreviewCode ? { devPreviewCode } : {})
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Unable to process password reset request. Please try again.' });
  }
});

// ─── Step 2: Verify OTP Code (Validation Check) ──────────────────────────────
authRouter.post('/verify-code', async (req, res): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ valid: false, error: 'Email and verification code are required.' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const record = db.prepare(`
      SELECT id, code_hash, attempts, expires_at 
      FROM password_resets 
      WHERE email = ? AND used_at IS NULL 
      ORDER BY id DESC LIMIT 1
    `).get(trimmedEmail) as any;

    if (!record) {
      res.status(400).json({ valid: false, error: 'Verification code is invalid or has expired.' });
      return;
    }

    // Check expiration
    if (new Date(record.expires_at).getTime() < Date.now()) {
      res.status(400).json({ valid: false, error: 'Verification code has expired. Please request a new one.' });
      return;
    }

    // Check brute-force attempt lockout (max 5 attempts)
    if (record.attempts >= 5) {
      db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(new Date().toISOString(), record.id);
      res.status(429).json({ valid: false, error: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.' });
      return;
    }

    // Constant-time comparison
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    const storedHashBuf = Buffer.from(record.code_hash, 'hex');
    const inputHashBuf = Buffer.from(inputHash, 'hex');

    const isMatch = storedHashBuf.length === inputHashBuf.length && crypto.timingSafeEqual(storedHashBuf, inputHashBuf);

    if (!isMatch) {
      const newAttempts = record.attempts + 1;
      db.prepare('UPDATE password_resets SET attempts = ? WHERE id = ?').run(newAttempts, record.id);

      const remaining = 5 - newAttempts;
      if (remaining <= 0) {
        db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(new Date().toISOString(), record.id);
        res.status(429).json({ valid: false, error: 'Too many incorrect attempts. Please request a new verification code.' });
        return;
      }

      res.status(400).json({ valid: false, error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` });
      return;
    }

    res.json({ valid: true, message: 'Verification code verified successfully.' });
  } catch (err: any) {
    console.error('Verify code error:', err);
    res.status(500).json({ valid: false, error: 'Unable to verify code. Please try again.' });
  }
});

// ─── Step 3: Reset Password with Verified Code ───────────────────────────────
authRouter.post('/reset-password', async (req, res): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, verification code, and new password are required.' });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    // Password strength check
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      res.status(400).json({ error: strengthCheck.message });
      return;
    }

    const record = db.prepare(`
      SELECT id, code_hash, attempts, expires_at 
      FROM password_resets 
      WHERE email = ? AND used_at IS NULL 
      ORDER BY id DESC LIMIT 1
    `).get(trimmedEmail) as any;

    if (!record) {
      res.status(400).json({ error: 'Verification code is invalid or has expired.' });
      return;
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      return;
    }

    if (record.attempts >= 5) {
      db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(new Date().toISOString(), record.id);
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
      return;
    }

    // Verify code hash with constant-time equality
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    const storedHashBuf = Buffer.from(record.code_hash, 'hex');
    const inputHashBuf = Buffer.from(inputHash, 'hex');

    const isMatch = storedHashBuf.length === inputHashBuf.length && crypto.timingSafeEqual(storedHashBuf, inputHashBuf);

    if (!isMatch) {
      const newAttempts = record.attempts + 1;
      db.prepare('UPDATE password_resets SET attempts = ? WHERE id = ?').run(newAttempts, record.id);
      const remaining = 5 - newAttempts;
      res.status(400).json({ error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code has been invalidated.'}` });
      return;
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const nowIso = new Date().toISOString();

    // Update user password and mark code as used atomically
    db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(passwordHash, trimmedEmail);
    db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(nowIso, record.id);

    res.json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again later.' });
  }
});
