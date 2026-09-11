import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './FacultyTestsPage.css';
import './TeacherDashboard.css';

interface FacultyTest {
  id: number;
  title: string;
  classSection: string;
  subjectCourse: string;
  description: string;
  timeLimitMins: number;
  passingScorePercent: number;
  dueDate: string | null;
  status: 'draft' | 'published';
  statusBadge: 'Draft' | 'Active/Live' | 'Completed/Closed';
  questionCount: number;
  totalMarks: number;
  questions: any[];
  submissionCount: number;
  avgScore: number;
  passRate: number;
  createdAt: string;
  updatedAt: string;
}

export default function FacultyTestsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState<FacultyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Preview Drawer Modal State
  const [previewTest, setPreviewTest] = useState<FacultyTest | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTests = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/teacher/tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
      } else {
        setError('Failed to load faculty tests.');
      }
    } catch (err) {
      setError('Network error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [token]);

  const handleDeleteTest = async (testId: number) => {
    if (!window.confirm('Are you sure you want to delete this test? This will also remove student submission history for this test.')) {
      return;
    }
    try {
      setDeletingId(testId);
      const res = await fetch(`/api/teacher/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTests();
      } else {
        alert('Failed to delete test.');
      }
    } catch (err) {
      alert('Error deleting test.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered tests
  const filteredTests = tests.filter(t => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query ||
      t.title.toLowerCase().includes(query) ||
      t.classSection.toLowerCase().includes(query) ||
      t.subjectCourse.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Draft' && t.statusBadge === 'Draft') ||
      (statusFilter === 'Active/Live' && t.statusBadge === 'Active/Live') ||
      (statusFilter === 'Completed/Closed' && t.statusBadge === 'Completed/Closed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="tests-page-container animate-fade-in">
      <div className="teacher-header">
        <div>
          <div className="teacher-badge">Faculty Portal</div>
          <h1 className="dash-title">Tests & Evaluation Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Instructor: <strong>{user?.name}</strong> · Create assessments, inspect questions, and view student performance reports.
          </p>
        </div>
        <Link to="/teacher/tests/create" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span>➕</span> Create New Test
        </Link>
      </div>

      {/* ─── Search & Status Filters ─── */}
      <div className="tests-filter-card">
        <div className="tests-search-wrapper">
          <span className="tests-search-icon">🔍</span>
          <input
            type="text"
            className="tests-search-input"
            placeholder="Search tests by title, class/section, or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="tests-status-tabs">
          {['All', 'Active/Live', 'Draft', 'Completed/Closed'].map(st => (
            <button
              key={st}
              className={`tests-status-tab ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tests Content List ─── */}
      {loading ? (
        <div className="dash-empty-state">Loading tests repository…</div>
      ) : error ? (
        <div className="dash-empty-state" style={{ color: 'var(--error)' }}>{error}</div>
      ) : filteredTests.length === 0 ? (
        <div className="dash-empty-state" style={{ padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>No tests found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '8px 0 20px' }}>
            {search || statusFilter !== 'All' ? 'No assessments match your active search and status filter.' : 'You have not created any tests yet. Click "Create New Test" to build your first assessment.'}
          </p>
          <Link to="/teacher/tests/create" className="btn btn-primary">
            Create First Test →
          </Link>
        </div>
      ) : (
        <div className="tests-grid">
          {filteredTests.map(test => {
            const isDraft = test.statusBadge === 'Draft';
            const isActive = test.statusBadge === 'Active/Live';
            const isClosed = test.statusBadge === 'Completed/Closed';

            return (
              <div key={test.id} className="test-card">
                <div className="test-card-top">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <span className={`dash-status-badge ${isActive ? 'in-progress' : isClosed ? 'completed' : 'locked'}`}>
                      {isActive ? '● Live / Active' : isClosed ? '✓ Completed / Closed' : '✏ Draft'}
                    </span>
                    <span className="test-card-subject">{test.subjectCourse}</span>
                  </div>

                  <h3 className="test-card-title">{test.title}</h3>
                  <div className="test-card-class">Class: <strong>{test.classSection}</strong></div>
                  {test.description && (
                    <p className="test-card-desc">{test.description}</p>
                  )}
                </div>

                <div className="test-card-stats-grid">
                  <div className="test-stat-item">
                    <span className="stat-label">Duration</span>
                    <span className="stat-val">{test.timeLimitMins} mins</span>
                  </div>
                  <div className="test-stat-item">
                    <span className="stat-label">Questions</span>
                    <span className="stat-val">{test.questionCount}</span>
                  </div>
                  <div className="test-stat-item">
                    <span className="stat-label">Submissions</span>
                    <span className="stat-val" style={{ color: test.submissionCount > 0 ? 'var(--accent-primary)' : 'inherit' }}>
                      {test.submissionCount}
                    </span>
                  </div>
                  <div className="test-stat-item">
                    <span className="stat-label">Pass Rate</span>
                    <span className="stat-val" style={{ color: test.submissionCount > 0 ? 'var(--success)' : 'inherit' }}>
                      {test.submissionCount > 0 ? `${test.passRate}%` : '—'}
                    </span>
                  </div>
                </div>

                <div className="test-card-footer">
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {test.dueDate ? `Due: ${new Date(test.dueDate).toLocaleDateString()}` : `Created ${new Date(test.createdAt).toLocaleDateString()}`}
                  </div>

                  <div className="test-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPreviewTest(test)}
                      title="Preview all questions and answer keys"
                    >
                      👁 Preview
                    </button>
                    <Link
                      to={`/teacher/tests/edit/${test.id}`}
                      className="btn btn-secondary btn-sm"
                      title="Edit test configuration and questions"
                    >
                      ✏ Edit
                    </Link>
                    <Link
                      to={`/teacher/tests/${test.id}/reports`}
                      className="btn btn-primary btn-sm"
                      title="View student scores and performance analytics"
                      style={{ background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                    >
                      📊 Reports
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#e53e3e' }}
                      onClick={() => handleDeleteTest(test.id)}
                      disabled={deletingId === test.id}
                      title="Delete test"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Question Preview Drawer / Modal ─── */}
      {previewTest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-xl)', maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-primary)', pb: '16px', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-navy" style={{ marginBottom: '6px', display: 'inline-block' }}>Question Preview & Answer Key</span>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>{previewTest.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                  Subject: {previewTest.subjectCourse} · Class: {previewTest.classSection} · Time Limit: {previewTest.timeLimitMins} mins · Pass Score: {previewTest.passingScorePercent}%
                </p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPreviewTest(null)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {previewTest.questions.length === 0 ? (
                <div className="dash-empty-state">No questions found in this test.</div>
              ) : (
                previewTest.questions.map((q: any, idx: number) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        Question {idx + 1} of {previewTest.questions.length} · Exp {q.expId}
                      </div>
                      <span className="q-diff-badge">Topic: {q.topic || 'General'} · Diff: {q.difficulty || 5}/10</span>
                    </div>

                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.5 }}>
                      {q.question}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                      {(['A', 'B', 'C', 'D'] as const).map(letter => {
                        const optionText = q[`option${letter}`];
                        const isCorrect = String(q.correctAnswer).trim().toUpperCase() === letter;
                        return (
                          <div
                            key={letter}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              border: isCorrect ? '1px solid #38a169' : '1px solid var(--border-secondary)',
                              background: isCorrect ? 'rgba(56, 161, 105, 0.12)' : 'var(--bg-surface)',
                              fontSize: 'var(--text-xs)',
                              color: isCorrect ? '#38a169' : 'var(--text-secondary)',
                              fontWeight: isCorrect ? 700 : 400,
                            }}
                          >
                            <span><strong>{letter}.</strong> {optionText}</span>
                            {isCorrect && <span style={{ marginLeft: '6px', fontWeight: 700 }}>✓ Correct Key</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
              <Link to={`/teacher/tests/edit/${previewTest.id}`} className="btn btn-secondary">
                ✏ Edit Questions
              </Link>
              <button className="btn btn-primary" onClick={() => setPreviewTest(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
