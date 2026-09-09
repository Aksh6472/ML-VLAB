import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const bookmarksRouter = Router();

bookmarksRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const bookmarks = await db.prepare('SELECT id, experiment_id, content_type, title, created_at FROM bookmarks WHERE user_id = ? ORDER BY id DESC').all(userId);
    res.json({ bookmarks });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve bookmarks.' });
  }
});

bookmarksRouter.post('/toggle', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { experimentId, title, type } = req.body;

    if (!experimentId) {
      res.status(400).json({ error: 'experimentId is required.' });
      return;
    }

    const expIdStr = String(experimentId);
    const existing = await db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND experiment_id = ?').get(userId, expIdStr) as any;

    if (existing) {
      await db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
      res.json({ bookmarked: false, message: 'Bookmark removed.' });
    } else {
      const now = new Date().toISOString();
      await db.prepare('INSERT INTO bookmarks (user_id, experiment_id, content_type, title, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(userId, expIdStr, type || 'experiment', title || `Experiment ${expIdStr}`, now);
      res.json({ bookmarked: true, message: 'Bookmark added.' });
    }
  } catch (err: any) {
    console.error('Toggle bookmark error:', err);
    res.status(500).json({ error: 'Failed to update bookmark.' });
  }
});
