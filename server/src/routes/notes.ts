import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const notesRouter = Router();

notesRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notes = await db.prepare('SELECT experiment_id, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
    res.json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

notesRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { experimentId, content } = req.body;

    if (!experimentId) {
      res.status(400).json({ error: 'experimentId is required.' });
      return;
    }

    const expIdStr = String(experimentId);
    const now = new Date().toISOString();
    const noteText = String(content || '');

    const existing = await db.prepare('SELECT id FROM notes WHERE user_id = ? AND experiment_id = ?').get(userId, expIdStr);

    if (existing) {
      await db.prepare('UPDATE notes SET content = ?, updated_at = ? WHERE user_id = ? AND experiment_id = ?')
        .run(noteText, now, userId, expIdStr);
    } else {
      await db.prepare('INSERT INTO notes (user_id, experiment_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(userId, expIdStr, noteText, now, now);
    }

    res.json({ message: 'Note saved successfully.', content: noteText, updatedAt: now });
  } catch (err: any) {
    console.error('Save note error:', err);
    res.status(500).json({ error: 'Failed to save note.' });
  }
});

notesRouter.delete('/:experimentId', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { experimentId } = req.params;

    await db.prepare('DELETE FROM notes WHERE user_id = ? AND experiment_id = ?').run(userId, String(experimentId));
    res.json({ message: 'Note deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});
