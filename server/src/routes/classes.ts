import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireStudent, requireTeacher, AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// Get all classes for the logged in user
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  try {
    if (user.role === 'teacher') {
      const labs = db.prepare('SELECT * FROM virtual_labs WHERE teacher_id = ? ORDER BY created_at DESC').all(user.id);
      res.json(labs);
    } else {
      // Student: Get labs they joined
      const labs = db.prepare(`
        SELECT vl.*, vlm.joined_at, u.name as teacher_name
        FROM virtual_labs vl
        JOIN virtual_lab_members vlm ON vl.id = vlm.lab_id
        JOIN users u ON vl.teacher_id = u.id
        WHERE vlm.student_id = ?
        ORDER BY vlm.joined_at DESC
      `).all(user.id);
      res.json(labs);
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Create a new class (Teacher only)
router.post('/', requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Class name is required' });
    return;
  }

  try {
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A1B2C3D4"
    const now = new Date().toISOString();

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO virtual_labs (teacher_id, name, description, invite_code, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user!.id, name, description || '', inviteCode, now);

    const newLab = db.prepare('SELECT * FROM virtual_labs WHERE id = ?').get(lastInsertRowid);
    res.status(201).json(newLab);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Join a class (Student only)
router.post('/join', requireStudent, (req: AuthenticatedRequest, res: Response) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    res.status(400).json({ error: 'Invite code is required' });
    return;
  }

  try {
    const lab = db.prepare('SELECT id FROM virtual_labs WHERE invite_code = ?').get(inviteCode);
    if (!lab) {
      res.status(404).json({ error: 'Invalid invite code' });
      return;
    }

    // Check if already joined
    const existing = db.prepare('SELECT id FROM virtual_lab_members WHERE lab_id = ? AND student_id = ?').get(lab.id, req.user!.id);
    if (existing) {
      res.status(400).json({ error: 'You have already joined this class' });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO virtual_lab_members (lab_id, student_id, joined_at)
      VALUES (?, ?, ?)
    `).run(lab.id, req.user!.id, now);

    res.json({ message: 'Successfully joined class', labId: lab.id });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

// Get members of a class (Teacher only)
router.get('/:id/members', requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const labId = req.params.id;
  
  try {
    // Verify ownership
    const lab = db.prepare('SELECT id FROM virtual_labs WHERE id = ? AND teacher_id = ?').get(labId, req.user!.id);
    if (!lab) {
      res.status(404).json({ error: 'Class not found or access denied' });
      return;
    }

    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.student_id, vlm.joined_at
      FROM users u
      JOIN virtual_lab_members vlm ON u.id = vlm.student_id
      WHERE vlm.lab_id = ?
      ORDER BY u.name ASC
    `).all(labId);

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch class members' });
  }
});

export const classesRouter = router;
