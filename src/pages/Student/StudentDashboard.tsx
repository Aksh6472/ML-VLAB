import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { experiments } from '../../data/experiments';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const { progress, getCompletionPercent, getOverallPercent, isExperimentUnlocked, isFinalTestUnlocked } = useProgress();

  const [classes, setClasses] = useState<any[]>([]);
  const [assignedTests, setAssignedTests] = useState<any[]>([]);
  const [activeTest, setActiveTest] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchAssignedTests = () => {
    if (!token) return;
    fetch('/api/student/assigned-tests', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data.tests)) setAssignedTests(data.tests);
    })
    .catch(console.error);
  };

  useEffect(() => {
    if (token) {
      fetch('/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClasses(data);
      })
      .catch(console.error);

      fetchAssignedTests();
    }
  }, [token]);

  const overallPercent = getOverallPercent();
  const finalTestUnlocked = isFinalTestUnlocked();

  // Compute metrics
  let completedCount = 0;
  let inProgressCount = 0;

  const experimentRows = experiments.map(exp => {
    const p = progress.experiments[exp.id] || {
      aim: false, theory: false, pretest: false, procedure: false, results: false, posttest: false
    };
    const percent = getCompletionPercent(exp.id);
    const unlocked = isExperimentUnlocked(exp.id);
    const pretestResult = progress.quizResults[`exp-${exp.id}-pretest`];
    const posttestResult = progress.quizResults[`exp-${exp.id}-posttest`];
    const steps = progress.procedureSteps[exp.id] || [];
    const completedStepsCount = steps.filter(Boolean).length;

    let status = 'Not Started';
    if (!unlocked) {
      status = 'Locked';
    } else if (percent === 100) {
      status = 'Completed';
      completedCount++;
    } else if (percent > 0) {
      status = 'In Progress';
      inProgressCount++;
    }

    return {
      exp,
      percent,
      status,
      unlocked,
      pretestResult,
      posttestResult,
      completedStepsCount,
    };
  });

  const notStartedCount = 10 - completedCount - inProgressCount;

  // Calculate quiz averages (pre-test and post-test separately)
  const allQuizEntries = Object.entries(progress.quizResults);
  const pretestQuizzes = allQuizEntries.filter(([key]) => key.endsWith('-pretest')).map(([, v]) => v);
  const posttestQuizzes = allQuizEntries.filter(([key]) => key.endsWith('-posttest')).map(([, v]) => v);

  const avgPretestScore = pretestQuizzes.length > 0
    ? (pretestQuizzes.reduce((acc, q) => acc + q.score, 0) / pretestQuizzes.length).toFixed(1)
    : null;
  const avgPretestTotal = pretestQuizzes.length > 0
    ? (pretestQuizzes.reduce((acc, q) => acc + (q.total || 5), 0) / pretestQuizzes.length).toFixed(1)
    : null;

  const avgPosttestScore = posttestQuizzes.length > 0
    ? (posttestQuizzes.reduce((acc, q) => acc + q.score, 0) / posttestQuizzes.length).toFixed(1)
    : null;
  const avgPosttestTotal = posttestQuizzes.length > 0
    ? (posttestQuizzes.reduce((acc, q) => acc + (q.total || 10), 0) / posttestQuizzes.length).toFixed(1)
    : null;

  const notesList = Object.entries(progress.notes).filter(([_, text]) => text && text.trim().length > 0);

  return (
    <div className="dash-container animate-fade-in">
      <div className="dash-header">
        <div>
          <div className="dash-welcome-label">Student Learning Dashboard</div>
          <h1 className="dash-title">Hello, {user?.name || 'Student'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Reg No: <strong>{user?.studentId || 'N/A'}</strong> · Academic Email: <strong>{user?.email}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link to="/join/new" className="btn btn-secondary"> {/* Join Class Link */}
            ➕ Join Virtual Lab
          </Link>
          <Link to="/learning-path" className="btn btn-secondary">
            🗺 Learning Path
          </Link>
          <Link to="/experiments" className="btn btn-primary">
            Resume Learning
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Overall Progress</span>
            <span className="dash-metric-icon">📊</span>
          </div>
          <div className="dash-metric-val">{overallPercent}%</div>
          <div className="dash-metric-sub">Across all 10 experiments</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Experiments Completed</span>
            <span className="dash-metric-icon">✅</span>
          </div>
          <div className="dash-metric-val" style={{ color: 'var(--success, #38a169)' }}>{completedCount} / 10</div>
          <div className="dash-metric-sub">{inProgressCount} in progress · {notStartedCount} not started</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Avg Pre-Test Score</span>
            <span className="dash-metric-icon">📝</span>
          </div>
          <div className="dash-metric-val" style={{ color: avgPretestScore ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
            {avgPretestScore ? `${avgPretestScore} / ${avgPretestTotal}` : '—'}
          </div>
          <div className="dash-metric-sub">
            {pretestQuizzes.length > 0 ? `${pretestQuizzes.length} pre-test${pretestQuizzes.length !== 1 ? 's' : ''} taken` : 'No pre-tests taken yet'}
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-header">
            <span className="dash-metric-label">Avg Post-Test Score</span>
            <span className="dash-metric-icon">🏆</span>
          </div>
          <div className="dash-metric-val" style={{ color: avgPosttestScore ? 'var(--success, #38a169)' : 'var(--text-tertiary)' }}>
            {avgPosttestScore ? `${avgPosttestScore} / ${avgPosttestTotal}` : '—'}
          </div>
          <div className="dash-metric-sub">
            {posttestQuizzes.length > 0 ? `${posttestQuizzes.length} post-test${posttestQuizzes.length !== 1 ? 's' : ''} taken` : 'No post-tests taken yet'}
          </div>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="dash-experiments-table-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>My Virtual Labs (Classes)</h2>
          </div>
          <div style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {classes.map(c => (
              <div key={c.id} style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', width: '300px' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>{c.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{c.description}</p>
                <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  Instructor: <strong>{c.teacher_name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty Assigned Tests Section */}
      {assignedTests.length > 0 && (
        <div className="dash-experiments-table-card" style={{ marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>📝 Faculty Assigned Tests</h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                Assessments created and assigned by your course instructors.
              </p>
            </div>
            <span className="badge badge-navy">{assignedTests.length} Total Test{assignedTests.length !== 1 ? 's' : ''}</span>
          </div>

          <div style={{ padding: 'var(--space-5)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {assignedTests.map(test => {
              const isSubmitted = Boolean(test.submission);
              return (
                <div key={test.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className={`dash-status-badge ${isSubmitted ? 'completed' : 'in-progress'}`}>
                        {isSubmitted ? `✓ Completed (${test.submission.percentage}%)` : '● Pending'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{test.questionCount} Questions</span>
                    </div>

                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {test.title}
                    </h3>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Class: <strong>{test.classSection}</strong> · Instructor: {test.teacherName}
                    </div>
                    {test.description && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 12px' }}>
                        {test.description}
                      </p>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    {test.dueDate ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Due: {new Date(test.dueDate).toLocaleDateString()}</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>No due date</span>
                    )}

                    {isSubmitted ? (
                      <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.7 }}>
                        Score: {test.submission.score}/{test.submission.totalQuestions} ({test.submission.percentage}%)
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setActiveTest(test);
                          setUserAnswers({});
                          setTestResult(null);
                        }}
                      >
                        Take Test →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Experiments Detailed Table */}
      <div className="dash-experiments-table-card">
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Experiment Progress & Performance</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              Complete experiments sequentially. Completing Exp N unlocks Exp N+1.
            </p>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Database-backed official record</span>
        </div>

        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Pre-Test</th>
                <th>Procedure</th>
                <th>Post-Test</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {experimentRows.map(({ exp, percent, status, unlocked, pretestResult, posttestResult, completedStepsCount }) => (
                <tr key={exp.id} style={{ opacity: unlocked ? 1 : 0.7 }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!unlocked && <span title="Complete previous experiment to unlock">🔒</span>}
                      <span>{String(exp.number).padStart(2, '0')}. {exp.shortTitle}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {exp.category} · {exp.difficulty}
                    </div>
                  </td>
                  <td>
                    {!unlocked ? (
                      <span className="dash-status-badge locked" style={{ background: 'rgba(113, 128, 150, 0.1)', color: '#718096', border: '1px solid #cbd5e0' }}>
                        🔒 Locked
                      </span>
                    ) : (
                      <span className={`dash-status-badge ${status.toLowerCase().replace(' ', '-')}`}>
                        {status === 'Completed' ? '✓ Completed' : status === 'In Progress' ? '● In Progress' : '○ Not Started'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="dash-progress-mini">
                      <span className="dash-progress-mini-fill" style={{ width: `${percent}%` }} />
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{percent}%</span>
                  </td>
                  <td>
                    {pretestResult ? (
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {pretestResult.score}/{pretestResult.total} ({Math.round((pretestResult.score / pretestResult.total) * 100)}%)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {completedStepsCount > 0 ? `${completedStepsCount} steps done` : '—'}
                    </span>
                  </td>
                  <td>
                    {posttestResult ? (
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {posttestResult.score}/{posttestResult.total} ({Math.round((posttestResult.score / posttestResult.total) * 100)}%)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </td>
                  <td>
                    {unlocked ? (
                      <Link to={`/experiment/${exp.id}`} className="btn btn-ghost btn-sm">
                        {status === 'Completed' ? 'Review' : 'Open'} →
                      </Link>
                    ) : (
                      <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Complete previous experiment to unlock">
                        🔒 Locked
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Assessment Banner */}
      <div className="dash-experiments-table-card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)', borderLeft: finalTestUnlocked ? '4px solid #38a169' : '4px solid #a0aec0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: finalTestUnlocked ? '#38a169' : '#718096', marginBottom: '4px' }}>
              {finalTestUnlocked ? '🏆 UNLOCKED' : '🔒 FINAL ASSESSMENT LOCKED'}
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>
              Final Machine Learning Assessment
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px', maxWidth: '600px' }}>
              {finalTestUnlocked
                ? 'Test your knowledge across all 10 ML experiments with our 30-question evaluation test and get personalized revision recommendations.'
                : `Complete all 10 experiments in sequence to unlock the Final ML Assessment. (${completedCount}/10 completed)`}
            </p>
          </div>
          <div>
            {finalTestUnlocked ? (
              <Link to="/final-test" className="btn btn-primary" style={{ background: '#38a169', border: 'none', padding: '10px 20px' }}>
                Take Final Assessment →
              </Link>
            ) : (
              <button className="btn btn-secondary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                🔒 Complete {10 - completedCount} More Experiment{10 - completedCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookmarks & Personal Notes Grid */}
      <div className="dash-two-cols">
        {/* Bookmarks */}
        <div className="dash-panel">
          <h3 className="dash-section-title">
            <span>🔖</span> Bookmarked Experiments ({progress.bookmarks.length})
          </h3>
          {progress.bookmarks.length === 0 ? (
            <div className="dash-empty-state">
              No bookmarks yet. Click the bookmark icon inside any experiment to save it here for quick review.
            </div>
          ) : (
            <div>
              {progress.bookmarks.map(b => (
                <div key={b.experimentId} className="dash-list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      Added {new Date(b.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link to={`/experiment/${b.experimentId}`} className="btn btn-ghost btn-sm">
                    View →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal Notes */}
        <div className="dash-panel">
          <h3 className="dash-section-title">
            <span>📝</span> My Lab Notes ({notesList.length})
          </h3>
          {notesList.length === 0 ? (
            <div className="dash-empty-state">
              No notes written yet. Use the Notes drawer inside any experiment to record observations.
            </div>
          ) : (
            <div>
              {notesList.map(([expId, noteContent]) => {
                const exp = experiments.find(e => e.id === expId);
                return (
                  <div key={expId} className="dash-list-item">
                    <div style={{ maxWidth: '75%' }}>
                      <div style={{ fontWeight: 600 }}>
                        {exp ? `Exp ${String(exp.number).padStart(2, '0')}: ${exp.shortTitle}` : `Experiment ${expId}`}
                      </div>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        margin: '4px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        "{noteContent}"
                      </p>
                    </div>
                    <Link to={`/experiment/${expId}`} className="btn btn-ghost btn-sm">
                      Open →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Assigned Test Modal */}
      {activeTest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-xl)', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-primary)', pb: '16px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-navy" style={{ marginBottom: '6px', display: 'inline-block' }}>Assigned Assessment</span>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>{activeTest.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                  Class: {activeTest.classSection} · Instructor: {activeTest.teacherName}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setActiveTest(null)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {testResult ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Test Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-md)', margin: '8px 0 20px' }}>
                  You scored <strong style={{ color: '#38a169', fontSize: 'var(--text-xl)' }}>{testResult.score} / {testResult.totalQuestions}</strong> ({testResult.percentage}%)
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setActiveTest(null);
                    setTestResult(null);
                    fetchAssignedTests();
                  }}
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                  {activeTest.questions.map((q: any, idx: number) => (
                    <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                        Question {idx + 1} of {activeTest.questions.length} · Exp {q.expId}
                      </div>
                      <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.5 }}>
                        {q.question}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(['A', 'B', 'C', 'D'] as const).map(letter => {
                          const optionText = q[`option${letter}`];
                          const isSelected = userAnswers[idx] === letter;
                          return (
                            <label
                              key={letter}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-secondary)',
                                background: isSelected ? 'rgba(74, 144, 226, 0.1)' : 'var(--bg-surface)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--text-primary)',
                                fontWeight: isSelected ? 600 : 400,
                              }}
                            >
                              <input
                                type="radio"
                                name={`q-${idx}`}
                                checked={isSelected}
                                onChange={() => setUserAnswers(prev => ({ ...prev, [idx]: letter }))}
                              />
                              <span><strong>{letter}.</strong> {optionText}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '16px', borderTop: '1px solid var(--border-primary)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Answered {Object.keys(userAnswers).length} of {activeTest.questions.length} questions
                  </span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setActiveTest(null)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={submittingTest || Object.keys(userAnswers).length === 0}
                      onClick={async () => {
                        try {
                          setSubmittingTest(true);
                          const res = await fetch(`/api/student/assigned-tests/${activeTest.id}/submit`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ answers: userAnswers }),
                          });

                          const data = await res.json();
                          if (res.ok && data.success) {
                            setTestResult(data);
                          } else {
                            alert(data.error || 'Failed to submit test.');
                          }
                        } catch (err) {
                          alert('Error submitting test.');
                        } finally {
                          setSubmittingTest(false);
                        }
                      }}
                    >
                      {submittingTest ? 'Submitting...' : 'Submit Assessment ✓'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
