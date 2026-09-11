import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './TestReportView.css';
import './TeacherDashboard.css';

interface TestInfo {
  id: number;
  title: string;
  classSection: string;
  subjectCourse: string;
  description: string;
  timeLimitMins: number;
  passingScorePercent: number;
  questionCount: number;
  totalMarks: number;
  dueDate: string | null;
  createdAt: string;
}

interface ReportSummary {
  totalEnrolled: number;
  totalAttempts: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  passRatePercent: number;
  passedCount: number;
  failedCount: number;
}

interface StudentReportItem {
  id: number;
  name: string;
  email: string;
  studentRollId: string;
  status: 'Submitted' | 'Pending';
  score: number | null;
  totalQuestions: number;
  percentage: number | null;
  passed: boolean;
  submittedAt: string | null;
  userAnswers: Record<string, string>;
}

export default function TestReportView() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [studentScores, setStudentScores] = useState<StudentReportItem[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [inspectStudent, setInspectStudent] = useState<StudentReportItem | null>(null);

  useEffect(() => {
    async function loadReport() {
      if (!token || !id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/teacher/tests/${id}/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setTestInfo(data.testInfo);
          setSummary(data.summary);
          setStudentScores(data.studentScores || []);
          setQuestions(data.questions || []);
        } else {
          setError('Failed to fetch test report.');
        }
      } catch (err) {
        setError('Error loading performance report.');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id, token]);

  // Export Score Table to CSV
  const handleExportCSV = () => {
    if (!testInfo || studentScores.length === 0) return;

    const headers = ['Student Name', 'Roll / Student ID', 'Email', 'Status', 'Score Obtained', 'Total Marks', 'Percentage (%)', 'Pass/Fail', 'Submission Timestamp'];
    const rows = studentScores.map(st => [
      `"${st.name.replace(/"/g, '""')}"`,
      `"${st.studentRollId}"`,
      `"${st.email}"`,
      `"${st.status}"`,
      st.score !== null ? st.score : 'N/A',
      st.totalQuestions,
      st.percentage !== null ? `${st.percentage}%` : 'N/A',
      st.status === 'Submitted' ? (st.passed ? 'PASSED' : 'FAILED') : 'PENDING',
      st.submittedAt ? `"${new Date(st.submittedAt).toLocaleString()}"` : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${testInfo.title.replace(/[^a-z0-9]/gi, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered student list
  const filteredStudents = studentScores.filter(st => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query ||
      st.name.toLowerCase().includes(query) ||
      st.studentRollId.toLowerCase().includes(query) ||
      st.email.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Submitted' && st.status === 'Submitted') ||
      (statusFilter === 'Pending' && st.status === 'Pending') ||
      (statusFilter === 'Passed' && st.status === 'Submitted' && st.passed) ||
      (statusFilter === 'Failed' && st.status === 'Submitted' && !st.passed);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="teacher-container">
        <div className="dash-empty-state">Loading student performance reports…</div>
      </div>
    );
  }

  if (error || !testInfo || !summary) {
    return (
      <div className="teacher-container">
        <div className="dash-empty-state" style={{ color: 'var(--error)' }}>
          {error || 'Test report not found.'}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Link to="/teacher/tests" className="btn btn-secondary">
            ← Back to Tests Manager
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container animate-fade-in">
      <div className="teacher-header">
        <div>
          <div className="teacher-badge">Test Analytics & Performance</div>
          <h1 className="dash-title">{testInfo.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Subject: <strong>{testInfo.subjectCourse}</strong> · Class: <strong>{testInfo.classSection}</strong> · Time Limit: <strong>{testInfo.timeLimitMins} mins</strong> · Pass Score: <strong>{testInfo.passingScorePercent}%</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV} title="Export class report to CSV">
            📥 Export to CSV
          </button>
          <Link to="/teacher/tests" className="btn btn-secondary">
            ← Back to Tests List
          </Link>
        </div>
      </div>

      {/* ─── Summary Metric Cards ─── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Total Enrolled</span>
            <span className="dash-metric-icon">👥</span>
          </div>
          <div className="dash-metric-val">{summary.totalEnrolled}</div>
          <div className="dash-metric-sub">{summary.totalAttempts} total attempts submitted</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Average Score</span>
            <span className="dash-metric-icon">📊</span>
          </div>
          <div className="dash-metric-val" style={{ color: 'var(--accent-primary)' }}>
            {summary.avgScore}%
          </div>
          <div className="dash-metric-sub">Class performance mean</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Pass Rate %</span>
            <span className="dash-metric-icon">🏆</span>
          </div>
          <div className="dash-metric-val" style={{ color: 'var(--success)' }}>
            {summary.passRatePercent}%
          </div>
          <div className="dash-metric-sub">{summary.passedCount} passed · {summary.failedCount} failed</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">High / Low Score</span>
            <span className="dash-metric-icon">🎯</span>
          </div>
          <div className="dash-metric-val" style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
            <span style={{ color: 'var(--success)' }}>{summary.highestScore}%</span> / <span style={{ color: '#e53e3e' }}>{summary.lowestScore}%</span>
          </div>
          <div className="dash-metric-sub">Class score range</div>
        </div>
      </div>

      {/* ─── Student Score Directory Table ─── */}
      <div className="teacher-students-card">
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Student Score Roster ({filteredStudents.length})</h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Inspect student marks, submission dates, and individual question answer breakdowns.
              </p>
            </div>
            <div className="tests-status-tabs">
              {['All', 'Submitted', 'Pending', 'Passed', 'Failed'].map(f => (
                <button
                  key={f}
                  className={`tests-status-tab ${statusFilter === f ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="teacher-search-bar" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="teacher-search-input"
              placeholder="Search by student name, roll number (e.g. RA21...), or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="dash-empty-state">No student records match search filter "{search || statusFilter}".</div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Roll / Register ID</th>
                  <th>Submission Status</th>
                  <th>Marks Obtained</th>
                  <th>Percentage</th>
                  <th>Evaluation</th>
                  <th>Submission Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => {
                  const isSubmitted = st.status === 'Submitted';
                  return (
                    <tr key={st.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{st.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{st.email}</div>
                      </td>
                      <td>
                        <code style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {st.studentRollId}
                        </code>
                      </td>
                      <td>
                        <span className={`dash-status-badge ${isSubmitted ? 'completed' : 'in-progress'}`}>
                          {isSubmitted ? '✓ Submitted' : '● Pending'}
                        </span>
                      </td>
                      <td>
                        {isSubmitted ? (
                          <span style={{ fontWeight: 600 }}>{st.score} / {st.totalQuestions}</span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {isSubmitted ? (
                          <span style={{ fontWeight: 700, color: st.passed ? 'var(--success)' : '#e53e3e' }}>
                            {st.percentage}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {isSubmitted ? (
                          <span className={`dash-status-badge ${st.passed ? 'completed' : 'locked'}`} style={{ background: st.passed ? 'rgba(56,161,105,0.1)' : 'rgba(229,62,62,0.1)', color: st.passed ? '#38a169' : '#e53e3e' }}>
                            {st.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Not Graded</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          {st.submittedAt ? new Date(st.submittedAt).toLocaleString() : 'Never'}
                        </span>
                      </td>
                      <td>
                        {isSubmitted ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setInspectStudent(st)}
                          >
                            Inspect Submission →
                          </button>
                        ) : (
                          <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5 }}>
                            No Submission
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Individual Student Submission Inspection Modal ─── */}
      {inspectStudent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-xl)', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-primary)', pb: '16px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-navy" style={{ marginBottom: '6px', display: 'inline-block' }}>Student Response Audit</span>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>{inspectStudent.name} ({inspectStudent.studentRollId})</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                  Score: <strong style={{ color: inspectStudent.passed ? '#38a169' : '#e53e3e' }}>{inspectStudent.score}/{inspectStudent.totalQuestions} ({inspectStudent.percentage}%)</strong> · Submitted: {inspectStudent.submittedAt ? new Date(inspectStudent.submittedAt).toLocaleString() : ''}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setInspectStudent(null)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {questions.map((q: any, idx: number) => {
                const userSelected = inspectStudent.userAnswers ? inspectStudent.userAnswers[idx] : null;
                const correctKey = String(q.correctAnswer).trim().toUpperCase();
                const isCorrect = userSelected && String(userSelected).trim().toUpperCase() === correctKey;

                return (
                  <div key={idx} style={{ background: 'var(--bg-primary)', border: isCorrect ? '1px solid rgba(56,161,105,0.4)' : '1px solid rgba(229,62,62,0.4)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        Question {idx + 1} of {questions.length} · Exp {q.expId}
                      </div>
                      <span className={`dash-status-badge ${isCorrect ? 'completed' : 'locked'}`} style={{ background: isCorrect ? 'rgba(56,161,105,0.1)' : 'rgba(229,62,62,0.1)', color: isCorrect ? '#38a169' : '#e53e3e' }}>
                        {isCorrect ? '✓ Correct (+1 Mark)' : `✕ Incorrect (Selected Option ${userSelected || 'None'})`}
                      </span>
                    </div>

                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.5 }}>
                      {q.question}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                      {(['A', 'B', 'C', 'D'] as const).map(letter => {
                        const optionText = q[`option${letter}`];
                        const isThisCorrect = letter === correctKey;
                        const isThisUserSelection = userSelected === letter;

                        let borderStyle = '1px solid var(--border-secondary)';
                        let bgStyle = 'var(--bg-surface)';
                        let textColor = 'var(--text-secondary)';

                        if (isThisCorrect) {
                          borderStyle = '2px solid #38a169';
                          bgStyle = 'rgba(56, 161, 105, 0.15)';
                          textColor = '#38a169';
                        } else if (isThisUserSelection && !isThisCorrect) {
                          borderStyle = '2px solid #e53e3e';
                          bgStyle = 'rgba(229, 62, 62, 0.15)';
                          textColor = '#e53e3e';
                        }

                        return (
                          <div
                            key={letter}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: borderStyle,
                              background: bgStyle,
                              fontSize: 'var(--text-xs)',
                              color: textColor,
                              fontWeight: (isThisCorrect || isThisUserSelection) ? 700 : 400,
                            }}
                          >
                            <span><strong>{letter}.</strong> {optionText}</span>
                            {isThisCorrect && <span style={{ marginLeft: '6px' }}>(Correct Answer)</span>}
                            {isThisUserSelection && <span style={{ marginLeft: '6px' }}>(Student Selection)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => setInspectStudent(null)}>
                Close Audit Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
