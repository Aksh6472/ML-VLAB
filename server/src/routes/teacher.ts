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

      // Final Test (Auto-generated comprehensive assessment)
      const finalTestRec = quizRows.find((q: any) => q.experiment_id === 'final-ml-assessment');
      const finalTestScore = finalTestRec ? finalTestRec.percentage : null;

      // Faculty Assigned Test status & score
      const publishedTests = await db.prepare("SELECT id FROM faculty_tests WHERE status = 'published'").all();
      let assignedTestStatus: 'Pending' | 'Completed' | 'Not Assigned' = 'Not Assigned';
      let assignedTestScore: number | null = null;

      if (publishedTests.length > 0) {
        const submission = await db.prepare(`
          SELECT percentage FROM student_test_submissions
          WHERE student_id = ? AND test_id IN (${publishedTests.map(() => '?').join(',')})
        `).get(student.id, ...publishedTests.map((t: any) => t.id));

        if (submission) {
          assignedTestStatus = 'Completed';
          assignedTestScore = submission.percentage;
        } else {
          assignedTestStatus = 'Pending';
        }
      }

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
        finalTestScore,
        assignedTestStatus,
        assignedTestScore,
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

    // Final test & assigned test submissions
    const finalTestRec = quizRows.find((q: any) => q.experiment_id === 'final-ml-assessment');
    const assignedTestSubmissions = await db.prepare(`
      SELECT sts.*, ft.title as test_title, ft.class_section
      FROM student_test_submissions sts
      JOIN faculty_tests ft ON sts.test_id = ft.id
      WHERE sts.student_id = ?
    `).all(studentId);

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
      finalTestScore: finalTestRec ? finalTestRec.percentage : null,
      assignedTestSubmissions,
    });
  } catch (err: any) {
    console.error('Teacher get student detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve student details.' });
  }
});

// ─── Faculty Test Creator & Report Endpoints ─────────────────────────

// Get all faculty tests created by logged in teacher
teacherRouter.get('/tests', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const tests = await db.prepare(`
      SELECT id, title, class_section, subject_course, description, time_limit_mins, passing_score_percent, due_date, status, questions_json, settings_json, created_at, updated_at
      FROM faculty_tests
      WHERE teacher_id = ?
      ORDER BY updated_at DESC
    `).all(teacherId);

    const formattedTests = await Promise.all(tests.map(async (t) => {
      const submissions = await db.prepare(`
        SELECT score, total_questions, percentage, submitted_at
        FROM student_test_submissions
        WHERE test_id = ?
      `).all(t.id);

      const submissionCount = submissions.length;
      const passingPercent = t.passing_score_percent || 60;
      let avgScore = 0;
      let passCount = 0;

      if (submissionCount > 0) {
        const totalPct = submissions.reduce((acc: number, s: any) => acc + (s.percentage || 0), 0);
        avgScore = Number((totalPct / submissionCount).toFixed(1));
        passCount = submissions.filter((s: any) => s.percentage >= passingPercent).length;
      }

      const passRate = submissionCount > 0 ? Number(((passCount / submissionCount) * 100).toFixed(1)) : 0;

      // Determine status badge
      let statusBadge: 'Draft' | 'Active/Live' | 'Completed/Closed' = 'Draft';
      if (t.status === 'draft') {
        statusBadge = 'Draft';
      } else if (t.due_date && new Date(t.due_date).getTime() < Date.now()) {
        statusBadge = 'Completed/Closed';
      } else {
        statusBadge = 'Active/Live';
      }

      let questions = [];
      try { questions = JSON.parse(t.questions_json || '[]'); } catch (e) {}
      let settings = {};
      try { settings = JSON.parse(t.settings_json || '{}'); } catch (e) {}

      return {
        id: t.id,
        title: t.title,
        classSection: t.class_section,
        subjectCourse: t.subject_course || 'Machine Learning',
        description: t.description,
        timeLimitMins: t.time_limit_mins || 30,
        passingScorePercent: passingPercent,
        dueDate: t.due_date,
        status: t.status,
        statusBadge,
        questionCount: questions.length,
        totalMarks: questions.length,
        questions,
        settings,
        submissionCount,
        avgScore,
        passRate,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    }));

    res.json({ tests: formattedTests });
  } catch (err: any) {
    console.error('Error fetching faculty tests:', err);
    res.status(500).json({ error: 'Failed to retrieve faculty tests.' });
  }
});

// Get a specific test by ID
teacherRouter.get('/tests/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const testId = Number(req.params.id);

    const test = await db.prepare(`
      SELECT id, title, class_section, subject_course, description, time_limit_mins, passing_score_percent, due_date, status, questions_json, settings_json, created_at, updated_at
      FROM faculty_tests
      WHERE id = ? AND teacher_id = ?
    `).get(testId, teacherId);

    if (!test) {
      res.status(404).json({ error: 'Test not found or access denied.' });
      return;
    }

    let questions = [];
    try { questions = JSON.parse(test.questions_json || '[]'); } catch (e) {}
    let settings = {};
    try { settings = JSON.parse(test.settings_json || '{}'); } catch (e) {}

    res.json({
      test: {
        id: test.id,
        title: test.title,
        classSection: test.class_section,
        subjectCourse: test.subject_course || 'Machine Learning',
        description: test.description,
        timeLimitMins: test.time_limit_mins || 30,
        passingScorePercent: test.passing_score_percent || 60,
        dueDate: test.due_date,
        status: test.status,
        questions,
        settings,
        createdAt: test.created_at,
        updatedAt: test.updated_at,
      }
    });
  } catch (err: any) {
    console.error('Error fetching test detail:', err);
    res.status(500).json({ error: 'Failed to retrieve test details.' });
  }
});

// Save or publish a faculty test
teacherRouter.post('/tests', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { id, title, classSection, subjectCourse, description, timeLimitMins, passingScorePercent, dueDate, status, questions, settings } = req.body;

    if (!title || !classSection) {
      res.status(400).json({ error: 'Test title and class/section are required.' });
      return;
    }

    if (!['draft', 'published'].includes(status)) {
      res.status(400).json({ error: 'Invalid test status.' });
      return;
    }

    const now = new Date().toISOString();
    const questionsJson = JSON.stringify(questions || []);
    const settingsJson = JSON.stringify(settings || {});
    const timeLimit = Number(timeLimitMins) || 30;
    const passScorePct = Number(passingScorePercent) || 60;
    const subject = subjectCourse || 'Machine Learning';

    if (id) {
      // Update existing test
      const existing = await db.prepare('SELECT id FROM faculty_tests WHERE id = ? AND teacher_id = ?').get(id, teacherId);
      if (!existing) {
        res.status(404).json({ error: 'Test not found or access denied.' });
        return;
      }

      await db.prepare(`
        UPDATE faculty_tests
        SET title = ?, class_section = ?, subject_course = ?, description = ?, time_limit_mins = ?, passing_score_percent = ?, due_date = ?, status = ?, questions_json = ?, settings_json = ?, updated_at = ?
        WHERE id = ? AND teacher_id = ?
      `).run(title, classSection, subject, description || '', timeLimit, passScorePct, dueDate || null, status, questionsJson, settingsJson, now, id, teacherId);

      res.json({ success: true, id, message: status === 'published' ? 'Test published successfully!' : 'Draft saved successfully!' });
    } else {
      // Create new test
      const result = await db.prepare(`
        INSERT INTO faculty_tests (teacher_id, title, class_section, subject_course, description, time_limit_mins, passing_score_percent, due_date, status, questions_json, settings_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(teacherId, title, classSection, subject, description || '', timeLimit, passScorePct, dueDate || null, status, questionsJson, settingsJson, now, now);

      res.json({
        success: true,
        id: result.lastInsertRowid,
        message: status === 'published' ? 'Test published successfully!' : 'Draft saved successfully!'
      });
    }
  } catch (err: any) {
    console.error('Error saving faculty test:', err);
    res.status(500).json({ error: err?.message ? `Failed to save test: ${err.message}` : 'Failed to save test.' });
  }
});

// Delete a faculty test draft or test
teacherRouter.delete('/tests/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const testId = Number(req.params.id);

    const existing = await db.prepare('SELECT id FROM faculty_tests WHERE id = ? AND teacher_id = ?').get(testId, teacherId);
    if (!existing) {
      res.status(404).json({ error: 'Test not found or access denied.' });
      return;
    }

    await db.prepare('DELETE FROM student_test_submissions WHERE test_id = ?').run(testId);
    await db.prepare('DELETE FROM faculty_tests WHERE id = ? AND teacher_id = ?').run(testId, teacherId);
    res.json({ success: true, message: 'Test deleted.' });
  } catch (err: any) {
    console.error('Error deleting test:', err);
    res.status(500).json({ error: 'Failed to delete test.' });
  }
});

// Detailed Score Reports & Analytics for a specific test
teacherRouter.get('/tests/:id/reports', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const testId = Number(req.params.id);

    const test = await db.prepare(`
      SELECT id, title, class_section, subject_course, description, time_limit_mins, passing_score_percent, due_date, status, questions_json, created_at
      FROM faculty_tests
      WHERE id = ? AND teacher_id = ?
    `).get(testId, teacherId);

    if (!test) {
      res.status(404).json({ error: 'Test not found or access denied.' });
      return;
    }

    let questions = [];
    try { questions = JSON.parse(test.questions_json || '[]'); } catch (e) {}

    // Fetch all students in this teacher's class or all student users
    const enrollmentCheck = await db.prepare(`
      SELECT COUNT(DISTINCT vlm.student_id) as count
      FROM virtual_lab_members vlm
      JOIN virtual_labs vl ON vlm.lab_id = vl.id
      WHERE vl.teacher_id = ?
    `).get(teacherId) as any;
    const hasEnrolled = Number(enrollmentCheck?.count || 0) > 0;

    let students: any[];
    if (hasEnrolled) {
      students = await db.prepare(`
        SELECT DISTINCT u.id, u.student_id, u.name, u.email
        FROM users u
        JOIN virtual_lab_members vlm ON u.id = vlm.student_id
        JOIN virtual_labs vl ON vlm.lab_id = vl.id
        WHERE u.role = 'student' AND vl.teacher_id = ?
        ORDER BY u.name ASC
      `).all(teacherId);
    } else {
      students = await db.prepare(`
        SELECT id, student_id, name, email FROM users WHERE role = 'student' ORDER BY name ASC
      `).all();
    }

    // Fetch all submissions for this test
    const submissions = await db.prepare(`
      SELECT sts.*, u.name, u.email, u.student_id as student_roll_id
      FROM student_test_submissions sts
      JOIN users u ON sts.student_id = u.id
      WHERE sts.test_id = ?
    `).all(testId);

    const submissionMap: Record<number, any> = {};
    for (const sub of submissions) {
      submissionMap[sub.student_id] = sub;
    }

    const passingPct = test.passing_score_percent || 60;
    let totalScoreSum = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passedCount = 0;
    let failedCount = 0;

    const studentReportList = students.map(st => {
      const sub = submissionMap[st.id];
      if (sub) {
        const pct = sub.percentage;
        totalScoreSum += pct;
        if (pct > highestScore) highestScore = pct;
        if (pct < lowestScore) lowestScore = pct;
        const passed = pct >= passingPct;
        if (passed) passedCount++; else failedCount++;

        let userAnswers = {};
        try { userAnswers = JSON.parse(sub.answers_json || '{}'); } catch (e) {}

        return {
          id: st.id,
          name: st.name,
          email: st.email,
          studentRollId: st.student_id || 'N/A',
          status: 'Submitted',
          score: sub.score,
          totalQuestions: sub.total_questions || questions.length,
          percentage: pct,
          passed,
          submittedAt: sub.submitted_at,
          userAnswers,
        };
      } else {
        return {
          id: st.id,
          name: st.name,
          email: st.email,
          studentRollId: st.student_id || 'N/A',
          status: 'Pending',
          score: null,
          totalQuestions: questions.length,
          percentage: null,
          passed: false,
          submittedAt: null,
          userAnswers: {},
        };
      }
    });

    const totalAttempts = submissions.length;
    const avgScore = totalAttempts > 0 ? Number((totalScoreSum / totalAttempts).toFixed(1)) : 0;
    const passRatePercent = totalAttempts > 0 ? Number(((passedCount / totalAttempts) * 100).toFixed(1)) : 0;
    if (totalAttempts === 0) lowestScore = 0;

    res.json({
      testInfo: {
        id: test.id,
        title: test.title,
        classSection: test.class_section,
        subjectCourse: test.subject_course || 'Machine Learning',
        description: test.description,
        timeLimitMins: test.time_limit_mins || 30,
        passingScorePercent: passingPct,
        questionCount: questions.length,
        totalMarks: questions.length,
        dueDate: test.due_date,
        createdAt: test.created_at,
      },
      summary: {
        totalEnrolled: students.length,
        totalAttempts,
        avgScore,
        highestScore,
        lowestScore,
        passRatePercent,
        passedCount,
        failedCount,
      },
      studentScores: studentReportList,
      questions,
    });
  } catch (err: any) {
    console.error('Error computing test report:', err);
    res.status(500).json({ error: 'Failed to generate test report.' });
  }
});

