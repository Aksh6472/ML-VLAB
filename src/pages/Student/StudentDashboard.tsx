import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { experiments } from '../../data/experiments';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const { progress, getCompletionPercent, getOverallPercent } = useProgress();

  const [classes, setClasses] = useState<any[]>([]);

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
    }
  }, [token]);

  const overallPercent = getOverallPercent();

  // Compute metrics
  let completedCount = 0;
  let inProgressCount = 0;

  const experimentRows = experiments.map(exp => {
    const p = progress.experiments[exp.id] || {
      aim: false, theory: false, pretest: false, procedure: false, results: false, posttest: false
    };
    const percent = getCompletionPercent(exp.id);
    const pretestResult = progress.quizResults[`exp-${exp.id}-pretest`];
    const posttestResult = progress.quizResults[`exp-${exp.id}-posttest`];
    const steps = progress.procedureSteps[exp.id] || [];
    const completedStepsCount = steps.filter(Boolean).length;

    let status = 'Not Started';
    if (percent === 100) {
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

      {/* Experiments Detailed Table */}
      <div className="dash-experiments-table-card">
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Experiment Progress & Performance</h2>
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
              {experimentRows.map(({ exp, percent, status, pretestResult, posttestResult, completedStepsCount }) => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {String(exp.number).padStart(2, '0')}. {exp.shortTitle}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {exp.category} · {exp.difficulty}
                    </div>
                  </td>
                  <td>
                    <span className={`dash-status-badge ${status.toLowerCase().replace(' ', '-')}`}>
                      {status === 'Completed' ? '✓ Completed' : status === 'In Progress' ? '● In Progress' : '○ Not Started'}
                    </span>
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
                    <Link to={`/experiment/${exp.id}`} className="btn btn-ghost btn-sm">
                      {status === 'Completed' ? 'Review' : 'Open'} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
