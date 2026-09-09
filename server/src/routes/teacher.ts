import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireTeacher, AuthenticatedRequest } from '../middleware/auth.js';

export const teacherRouter = Router();

// Apply requireTeacher middleware to all teacher routes
teacherRouter.use(...requireTeacher);

// Get class-wide statistics
teacherRouter.get('/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if teacher has any virtual labs with enrolled students
    const hasEnrolledStudents = await db.prepare(`
      SELECT COUNT(DISTINCT vlm.student_id) as count
      FROM virtual_lab_members vlm
      JOIN virtual_labs vl ON vlm.lab_id = vl.id
      WHERE vl.teacher_id = ?
    `).get(req.user!.id) as any;

    const enrolledCount = Number(hasEnrolledStudents?.count || 0);

    // If teacher has enrolled students, filter by class; otherwise show all students
    const studentFilter = enrolledCount > 0
      ? `JOIN virtual_lab_members vlm ON u.id = vlm.student_id
         JOIN virtual_labs vl ON vlm.lab_id = vl.id
         WHERE u.role = 'student' AND vl.teacher_id = ?`
      : `WHERE u.role = 'student' AND 1=?`; // 1=teacherId is always true, shows all students

    const teacherIdParam = req.user!.id;

    const totalStudents = await db.prepare(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      ${studentFilter}
    `).get(teacherIdParam) as any;

    const allProgress = await db.prepare(`
      SELECT DISTINCT ep.* FROM experiment_progress ep
      JOIN users u ON ep.user_id = u.id
      ${studentFilter.replace('u.id = vlm.student_id', 'ep.user_id = vlm.student_id')}
    `).all(teacherIdParam);

    const allQuizzes = await db.prepare(`
      SELECT DISTINCT qr.* FROM quiz_records qr
      JOIN users u ON qr.user_id = u.id
      ${studentFilter.replace('u.id = vlm.student_id', 'qr.user_id = vlm.student_id')}
    `).all(teacherIdParam);

    let totalCompletedExperiments = 0;
    for (const p of allProgress) {
      if (p.aim && p.theory && p.pretest && p.procedure && p.results && p.posttest) {
        totalCompletedExperiments++;
      }
    }

    const pretests = allQuizzes.filter(q => q.quiz_type === 'pretest');
    const posttests = allQuizzes.filter(q => q.quiz_type === 'posttest');

    const avgPretest = pretests.length > 0
      ? Number((pretests.reduce((acc, q) => acc + q.percentage, 0) / pretests.length).toFixed(1))
      : 0;

    const avgPosttest = posttests.length > 0
      ? Number((posttests.reduce((acc, q) => acc + q.percentage, 0) / posttests.length).toFixed(1))
      : 0;

    const studentCount = Number(totalStudents?.count || 0);
    const avgExperimentsPerStudent = studentCount > 0
      ? Number((totalCompletedExperiments / studentCount).toFixed(1))
      : 0;

    res.json({
      totalStudents: studentCount,
      totalCompletedExperiments,
      avgExperimentsPerStudent,
      avgPretestScore: avgPretest,
      avgPosttestScore: avgPosttest,
      learningGain: Number((avgPosttest - avgPretest).toFixed(1)),
    });
  } catch (err: any) {
    console.error('Teacher stats error:', err);
    res.status(500).json({ error: 'Failed to compute class statistics.' });
  }
});

// List students with summary metrics and search
teacherRouter.get('/students', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const teacherId = req.user!.id;

    // Check if this teacher has any enrolled students in their labs
    const enrollmentCheck = await db.prepare(`
      SELECT COUNT(DISTINCT vlm.student_id) as count
      FROM virtual_lab_members vlm
      JOIN virtual_labs vl ON vlm.lab_id = vl.id
      WHERE vl.teacher_id = ?
    `).get(teacherId) as any;
    const hasEnrolled = Number(enrollmentCheck?.count || 0) > 0;

    let query: string;
    const params: any[] = [teacherId];

    if (hasEnrolled) {
      // Filter by class membership
      query = `
        SELECT DISTINCT u.id, u.student_id, u.name, u.email, u.created_at, u.last_login
        FROM users u
        JOIN virtual_lab_members vlm ON u.id = vlm.student_id
        JOIN virtual_labs vl ON vlm.lab_id = vl.id
        WHERE u.role = 'student' AND vl.teacher_id = ?
      `;
    } else {
      // Fallback: show all students (demo/no-class mode)
      query = `
        SELECT u.id, u.student_id, u.name, u.email, u.created_at, u.last_login
        FROM users u
        WHERE u.role = 'student'
      `;
      params.length = 0; // no teacherId param needed
    }

    if (search) {
      const connector = hasEnrolled ? ' AND' : ' AND';
      query += `${connector} (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.student_id,'')) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.name ASC`;

    const students = params.length > 0
      ? await db.prepare(query).all(...params)
      : await db.prepare(query).all();

    // Attach computed metrics for each student
    const studentSummaries = await Promise.all(students.map(async (student: any) => {
      const progressRows = await db.prepare('SELECT * FROM experiment_progress WHERE user_id = ?').all(student.id);
      const quizRows = await db.prepare('SELECT * FROM quiz_records WHERE user_id = ?').all(student.id);

      let completedCount = 0;
      let inProgressCount = 0;
      let totalCompletedSections = 0;

      for (const p of progressRows) {
        const sectionsDone = (p.aim ? 1 : 0) + (p.theory ? 1 : 0) + (p.pretest ? 1 : 0) +
          (p.procedure ? 1 : 0) + (p.results ? 1 : 0) + (p.posttest ? 1 : 0);
        totalCompletedSections += sectionsDone;

        if (sectionsDone === 6) {
          completedCount++;
        } else if (sectionsDone > 0) {
          inProgressCount++;
        }
      }

      // Total possible sections = 10 experiments * 6 sections = 60
      const overallPercent = Math.min(100, Math.round((totalCompletedSections / 60) * 100));
      const notStartedCount = Math.max(0, 10 - completedCount - inProgressCount);

      const pretests = quizRows.filter((q: any) => q.quiz_type === 'pretest');
      const posttests = quizRows.filter((q: any) => q.quiz_type === 'posttest');

      const avgPretest = pretests.length > 0
        ? Number((pretests.reduce((acc: number, q: any) => acc + q.percentage, 0) / pretests.length).toFixed(1))
        : null;

      const avgPosttest = posttests.length > 0
        ? Number((posttests.reduce((acc: number, q: any) => acc + q.percentage, 0) / posttests.length).toFixed(1))
        : null;

      const avgQuizScore = quizRows.length > 0
        ? Number((quizRows.reduce((acc: number, q: any) => acc + q.percentage, 0) / quizRows.length).toFixed(1))
        : null;

      return {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        email: student.email,
        createdAt: student.created_at,
        lastLogin: student.last_login,
        overallPercent,
        completedExperiments: completedCount,
        inProgressExperiments: inProgressCount,
        notStartedExperiments: notStartedCount,
        avgPretestScore: avgPretest,
        avgPosttestScore: avgPosttest,
        avgQuizScore,
        totalQuizAttempts: quizRows.length,
      };
    }));

    res.json({ students: studentSummaries });
  } catch (err: any) {
    console.error('Teacher get students error:', err);
    res.status(500).json({ error: 'Failed to retrieve student directory.' });
  }
});

// Individual student detailed view
teacherRouter.get('/students/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = Number(req.params.id);
    const teacherId = req.user!.id;

    // Check if teacher has any enrolled students
    const enrollmentCheck = await db.prepare(`
      SELECT COUNT(DISTINCT vlm.student_id) as count
      FROM virtual_lab_members vlm
      JOIN virtual_labs vl ON vlm.lab_id = vl.id
      WHERE vl.teacher_id = ?
    `).get(teacherId) as any;
    const hasEnrolled = Number(enrollmentCheck?.count || 0) > 0;

    let student: any;
    if (hasEnrolled) {
      // Verify student belongs to one of this teacher's labs
      student = await db.prepare(`
        SELECT DISTINCT u.id, u.student_id, u.name, u.email, u.created_at, u.last_login 
        FROM users u
        JOIN virtual_lab_members vlm ON u.id = vlm.student_id
        JOIN virtual_labs vl ON vlm.lab_id = vl.id
        WHERE u.id = ? AND u.role = 'student' AND vl.teacher_id = ?
      `).get(studentId, teacherId) as any;
    } else {
      // No class setup — allow viewing any student
      student = await db.prepare(
        `SELECT id, student_id, name, email, created_at, last_login FROM users WHERE id = ? AND role = 'student'`
      ).get(studentId) as any;
    }

    if (!student) {
      res.status(404).json({ error: 'Student not found or access denied.' });
      return;
    }

    // Get progress across all 10 experiments
    const progressRows = await db.prepare('SELECT * FROM experiment_progress WHERE user_id = ?').all(studentId);
    const progressMap: Record<string, any> = {};
    for (const p of progressRows) {
      progressMap[p.experiment_id] = p;
    }

    // Get procedure steps
    const stepRows = await db.prepare('SELECT experiment_id, step_index, is_completed FROM procedure_steps WHERE user_id = ?').all(studentId);
    const procedureMap: Record<string, number> = {};
    for (const s of stepRows) {
      if (s.is_completed) {
        procedureMap[s.experiment_id] = (procedureMap[s.experiment_id] || 0) + 1;
      }
    }

    // Get quizzes grouped by experiment
    const quizRows = await db.prepare('SELECT * FROM quiz_records WHERE user_id = ? ORDER BY id DESC').all(studentId);
    const pretestMap: Record<string, any> = {};
    const posttestMap: Record<string, any> = {};

    for (const q of quizRows) {
      if (q.quiz_type === 'pretest' && !pretestMap[q.experiment_id]) {
        pretestMap[q.experiment_id] = q;
      } else if (q.quiz_type === 'posttest' && !posttestMap[q.experiment_id]) {
        posttestMap[q.experiment_id] = q;
      }
    }

    // Build array for all 10 experiments
    const experimentDetails = [];
    for (let i = 1; i <= 10; i++) {
      const expId = String(i);
      const p = progressMap[expId];
      const pre = pretestMap[expId];
      const post = posttestMap[expId];

      const sectionsDone = p ? ((p.aim ? 1 : 0) + (p.theory ? 1 : 0) + (p.pretest ? 1 : 0) +
        (p.procedure ? 1 : 0) + (p.results ? 1 : 0) + (p.posttest ? 1 : 0)) : 0;

      const isCompleted = sectionsDone === 6;
      const status = isCompleted ? 'Completed' : sectionsDone > 0 ? 'In Progress' : 'Not Started';

      experimentDetails.push({
        experimentId: expId,
        number: i,
        status,
        progressPercent: Math.round((sectionsDone / 6) * 100),
        sections: {
          aim: Boolean(p?.aim),
          theory: Boolean(p?.theory),
          pretest: Boolean(p?.pretest),
          procedure: Boolean(p?.procedure),
          results: Boolean(p?.results),
          posttest: Boolean(p?.posttest),
        },
        completedSteps: procedureMap[expId] || 0,
        pretest: pre ? { score: pre.score, total: pre.total_questions, percentage: pre.percentage, submittedAt: pre.submitted_at } : null,
        posttest: post ? { score: post.score, total: post.total_questions, percentage: post.percentage, submittedAt: post.submitted_at } : null,
        startedAt: p?.started_at || null,
        completedAt: p?.completed_at || null,
        lastUpdated: p?.updated_at || null,
      });
    }

    // Get note count and bookmarks count
    const notes = await db.prepare('SELECT experiment_id, content, updated_at FROM notes WHERE user_id = ?').all(studentId);
    const bookmarks = await db.prepare('SELECT experiment_id, title, created_at FROM bookmarks WHERE user_id = ?').all(studentId);

    res.json({
      student: {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        email: student.email,
        createdAt: student.created_at,
        lastLogin: student.last_login,
      },
      experiments: experimentDetails,
      notes,
      bookmarks,
      quizHistory: quizRows,
    });
  } catch (err: any) {
    console.error('Teacher get student detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve student details.' });
  }
});
