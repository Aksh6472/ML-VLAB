import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const progressRouter = Router();

// Get full progress state for the authenticated student
progressRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Fetch experiment progress
    const expRows = await db.prepare('SELECT * FROM experiment_progress WHERE user_id = ?').all(userId);
    const experiments: Record<string, any> = {};
    for (const row of expRows) {
      experiments[row.experiment_id] = {
        aim: Boolean(row.aim),
        theory: Boolean(row.theory),
        pretest: Boolean(row.pretest),
        procedure: Boolean(row.procedure),
        results: Boolean(row.results),
        posttest: Boolean(row.posttest),
        startedAt: row.started_at,
        completedAt: row.completed_at,
      };
    }

    // Fetch procedure steps
    const stepRows = await db.prepare('SELECT experiment_id, step_index, is_completed FROM procedure_steps WHERE user_id = ? ORDER BY step_index ASC').all(userId);
    const procedureSteps: Record<string, boolean[]> = {};
    for (const row of stepRows) {
      if (!procedureSteps[row.experiment_id]) {
        procedureSteps[row.experiment_id] = [];
      }
      procedureSteps[row.experiment_id][row.step_index] = Boolean(row.is_completed);
    }

    // Fetch latest quiz results
    const quizRows = await db.prepare('SELECT experiment_id, quiz_type, score, total_questions, answers_json, submitted_at FROM quiz_records WHERE user_id = ? ORDER BY id DESC').all(userId);
    const quizResults: Record<string, any> = {};
    for (const row of quizRows) {
      const quizKey = `exp-${row.experiment_id}-${row.quiz_type}`;
      if (!quizResults[quizKey]) {
        quizResults[quizKey] = {
          score: row.score,
          total: row.total_questions,
          answers: JSON.parse(row.answers_json || '[]'),
          submittedAt: row.submitted_at,
        };
      }
    }

    // Fetch bookmarks
    const bookmarkRows = await db.prepare('SELECT experiment_id, content_type, title, created_at FROM bookmarks WHERE user_id = ? ORDER BY id DESC').all(userId);
    const bookmarks = bookmarkRows.map(b => ({
      id: b.experiment_id,
      experimentId: b.experiment_id,
      type: b.content_type,
      title: b.title,
      addedAt: b.created_at,
    }));

    // Fetch notes
    const noteRows = await db.prepare('SELECT experiment_id, content FROM notes WHERE user_id = ?').all(userId);
    const notes: Record<string, string> = {};
    for (const row of noteRows) {
      notes[row.experiment_id] = row.content;
    }

    res.json({
      experiments,
      procedureSteps,
      quizResults,
      bookmarks,
      notes,
    });
  } catch (err: any) {
    console.error('Fetch progress error:', err);
    res.status(500).json({ error: 'Failed to retrieve progress data.' });
  }
});

// Mark an experiment section complete
progressRouter.post('/section', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { experimentId, section } = req.body;

    const validSections = ['aim', 'theory', 'pretest', 'procedure', 'results', 'posttest'];
    if (!experimentId || !section || !validSections.includes(section)) {
      res.status(400).json({ error: 'Invalid experimentId or section name.' });
      return;
    }

    const expIdStr = String(experimentId);
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM experiment_progress WHERE user_id = ? AND experiment_id = ?').get(userId, expIdStr) as any;

    if (existing) {
      const updatedValues = {
        aim: section === 'aim' ? 1 : existing.aim,
        theory: section === 'theory' ? 1 : existing.theory,
        pretest: section === 'pretest' ? 1 : existing.pretest,
        procedure: section === 'procedure' ? 1 : existing.procedure,
        results: section === 'results' ? 1 : existing.results,
        posttest: section === 'posttest' ? 1 : existing.posttest,
      };

      const allDone = updatedValues.aim && updatedValues.theory && updatedValues.pretest &&
        updatedValues.procedure && updatedValues.results && updatedValues.posttest;

      const completedAt = allDone ? (existing.completed_at || now) : existing.completed_at;

      await db.prepare(`
        UPDATE experiment_progress
        SET ${section} = 1, updated_at = ?, completed_at = ?
        WHERE user_id = ? AND experiment_id = ?
      `).run(now, completedAt, userId, expIdStr);
    } else {
      await db.prepare(`
        INSERT INTO experiment_progress (user_id, experiment_id, ${section}, started_at, updated_at)
        VALUES (?, ?, 1, ?, ?)
      `).run(userId, expIdStr, now, now);
    }

    res.json({ message: 'Section progress saved successfully.' });
  } catch (err: any) {
    console.error('Update section error:', err);
    res.status(500).json({ error: 'Failed to update section progress.' });
  }
});

// Save procedure step progress
progressRouter.post('/step', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { experimentId, stepIndex, isCompleted } = req.body;

    if (!experimentId || typeof stepIndex !== 'number') {
      res.status(400).json({ error: 'experimentId and numeric stepIndex are required.' });
      return;
    }

    const expIdStr = String(experimentId);
    const completedVal = isCompleted ? 1 : 0;
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT id FROM procedure_steps WHERE user_id = ? AND experiment_id = ? AND step_index = ?').get(userId, expIdStr, stepIndex);

    if (existing) {
      await db.prepare('UPDATE procedure_steps SET is_completed = ?, updated_at = ? WHERE user_id = ? AND experiment_id = ? AND step_index = ?')
        .run(completedVal, now, userId, expIdStr, stepIndex);
    } else {
      await db.prepare('INSERT INTO procedure_steps (user_id, experiment_id, step_index, is_completed, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(userId, expIdStr, stepIndex, completedVal, now);
    }

    res.json({ message: 'Procedure step progress saved.' });
  } catch (err: any) {
    console.error('Update step error:', err);
    res.status(500).json({ error: 'Failed to update procedure step.' });
  }
});
