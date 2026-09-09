import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const quizzesRouter = Router();

// Submit quiz attempt
quizzesRouter.post('/submit', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { experimentId, quizType, score, totalQuestions, answers } = req.body;

    if (!experimentId || !quizType || typeof score !== 'number' || typeof totalQuestions !== 'number') {
      res.status(400).json({ error: 'Missing required quiz submission fields.' });
      return;
    }

    if (!['pretest', 'posttest'].includes(quizType)) {
      res.status(400).json({ error: 'quizType must be either pretest or posttest.' });
      return;
    }

    const expIdStr = String(experimentId);
    const percentage = totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(1)) : 0;
    const now = new Date().toISOString();
    const answersJson = JSON.stringify(answers || []);

    // Insert attempt record
    const result = await db.prepare(`
      INSERT INTO quiz_records (user_id, experiment_id, quiz_type, score, total_questions, percentage, answers_json, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, expIdStr, quizType, score, totalQuestions, percentage, answersJson, now);

    // Also mark section complete in experiment_progress
    const sectionCol = quizType === 'pretest' ? 'pretest' : 'posttest';
    const existing = await db.prepare('SELECT * FROM experiment_progress WHERE user_id = ? AND experiment_id = ?').get(userId, expIdStr) as any;

    if (existing) {
      await db.prepare(`UPDATE experiment_progress SET ${sectionCol} = 1, updated_at = ? WHERE user_id = ? AND experiment_id = ?`)
        .run(now, userId, expIdStr);
    } else {
      await db.prepare(`INSERT INTO experiment_progress (user_id, experiment_id, ${sectionCol}, started_at, updated_at) VALUES (?, ?, 1, ?, ?)`)
        .run(userId, expIdStr, now, now);
    }

    res.status(201).json({
      message: 'Quiz submitted and saved successfully.',
      attemptId: result.lastInsertRowid,
      score,
      totalQuestions,
      percentage,
      submittedAt: now,
    });
  } catch (err: any) {
    console.error('Quiz submission error:', err);
    res.status(500).json({ error: 'Failed to record quiz submission.' });
  }
});

// Get quiz history for student
quizzesRouter.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const history = await db.prepare(`
      SELECT id, experiment_id, quiz_type, score, total_questions, percentage, submitted_at
      FROM quiz_records
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(userId);

    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve quiz history.' });
  }
});
