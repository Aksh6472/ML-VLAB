import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const studentTestsRouter = Router();

studentTestsRouter.use(requireAuth);

// Get assigned tests for a student
studentTestsRouter.get('/assigned-tests', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    // Get all published tests
    const publishedTests = await db.prepare(`
      SELECT ft.id, ft.teacher_id, ft.title, ft.class_section, ft.description, ft.due_date, ft.questions_json, ft.created_at,
             u.name as teacher_name
      FROM faculty_tests ft
      JOIN users u ON ft.teacher_id = u.id
      WHERE ft.status = 'published'
      ORDER BY ft.id DESC
    `).all();

    // Attach submission info for this student
    const result = await Promise.all(publishedTests.map(async (test: any) => {
      const submission = await db.prepare(`
        SELECT score, total_questions, percentage, submitted_at
        FROM student_test_submissions
        WHERE test_id = ? AND student_id = ?
      `).get(test.id, studentId);

      let questions = [];
      try {
        questions = JSON.parse(test.questions_json || '[]');
      } catch (e) {}

      return {
        id: test.id,
        title: test.title,
        classSection: test.class_section,
        description: test.description,
        dueDate: test.due_date,
        teacherName: test.teacher_name,
        questionCount: questions.length,
        questions: submission ? [] : questions,
        submission: submission ? {
          score: submission.score,
          totalQuestions: submission.total_questions,
          percentage: submission.percentage,
          submittedAt: submission.submitted_at,
        } : null,
      };
    }));

    res.json({ tests: result });
  } catch (err: any) {
    console.error('Error fetching student assigned tests:', err);
    res.status(500).json({ error: 'Failed to retrieve assigned tests.' });
  }
});

// Submit an assigned test
studentTestsRouter.post('/assigned-tests/:id/submit', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const testId = Number(req.params.id);
    const studentId = req.user!.id;
    const { answers } = req.body;

    const test = await db.prepare('SELECT * FROM faculty_tests WHERE id = ? AND status = \'published\'').get(testId);
    if (!test) {
      res.status(404).json({ error: 'Test not found or not available.' });
      return;
    }

    const existingSubmission = await db.prepare('SELECT id FROM student_test_submissions WHERE test_id = ? AND student_id = ?').get(testId, studentId);
    if (existingSubmission) {
      res.status(400).json({ error: 'You have already submitted this test.' });
      return;
    }

    const questions = JSON.parse(test.questions_json || '[]');
    let score = 0;
    questions.forEach((q: any, idx: number) => {
      const selected = answers ? answers[idx] : null;
      if (selected && String(selected).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) {
        score++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(1)) : 0;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO student_test_submissions (test_id, student_id, score, total_questions, percentage, answers_json, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(testId, studentId, score, totalQuestions, percentage, JSON.stringify(answers || {}), now);

    res.json({
      success: true,
      score,
      totalQuestions,
      percentage,
      submittedAt: now,
    });
  } catch (err: any) {
    console.error('Error submitting assigned test:', err);
    res.status(500).json({ error: 'Failed to submit test responses.' });
  }
});
