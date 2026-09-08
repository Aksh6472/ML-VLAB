import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './TeacherDashboard.css';
import '../Student/StudentDashboard.css';

interface StudentSummary {
  id: number;
  studentId: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  overallPercent: number;
  completedExperiments: number;
  inProgressExperiments: number;
  notStartedExperiments: number;
  avgPretestScore: number | null;
  avgPosttestScore: number | null;
  avgQuizScore: number | null;
  totalQuizAttempts: number;
}

interface ClassStats {
  totalStudents: number;
  totalCompletedExperiments: number;
  avgExperimentsPerStudent: number;
  avgPretestScore: number;
  avgPosttestScore: number;
  learningGain: number;
}

export default function TeacherDashboard() {
  const { user, token } = useAuth();

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const [statsRes, studentsRes, classesRes] = await Promise.all([
        fetch('/api/teacher/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/teacher/students?search=${encodeURIComponent(search)}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/classes', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok && studentsRes.ok && classesRes.ok) {
        const statsData = await statsRes.json();
        const studentsData = await studentsRes.json();
        const classesData = await classesRes.json();
        
        setStats(statsData);
        setStudents(studentsData.students || []);
        setClasses(classesData);
      } else {
        setError('Failed to fetch teacher records.');
      }
    } catch (err) {
      setError('Network error connecting to instructor backend.');
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !token) return;

    try {
      setCreatingClass(true);
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newClassName.trim() })
      });
      
      if (res.ok) {
        setNewClassName('');
        fetchData(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to create class:', err);
    } finally {
      setCreatingClass(false);
    }
  };

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(delayTimer);
  }, [fetchData]);

  return (
    <div className="teacher-container animate-fade-in">
      <div className="teacher-header">
        <div>
          <div className="teacher-badge">Faculty Portal</div>
          <h1 className="dash-title">Teacher Oversight & Records</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Instructor: <strong>{user?.name}</strong> · Monitoring student laboratory progress & assessments.
          </p>
        </div>
      </div>

      {/* Class Level Metrics */}
      {stats && (
        <div className="dash-metrics-grid">
          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Enrolled Students</span>
              <span className="dash-metric-icon">👥</span>
            </div>
            <div className="dash-metric-val">{stats.totalStudents}</div>
            <div className="dash-metric-sub">Registered laboratory learners</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Avg Completed Exps</span>
              <span className="dash-metric-icon">📚</span>
            </div>
            <div className="dash-metric-val" style={{ color: 'var(--accent-primary)' }}>
              {stats.avgExperimentsPerStudent} / 10
            </div>
            <div className="dash-metric-sub">{stats.totalCompletedExperiments} total modules completed</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Avg Pre-Test Score</span>
              <span className="dash-metric-icon">📝</span>
            </div>
            <div className="dash-metric-val">{stats.avgPretestScore}%</div>
            <div className="dash-metric-sub">Baseline assessment average</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-header">
              <span className="dash-metric-label">Avg Post-Test Score</span>
              <span className="dash-metric-icon">🏆</span>
            </div>
            <div className="dash-metric-val" style={{ color: 'var(--success, #38a169)' }}>
              {stats.avgPosttestScore}%
            </div>
            <div className="dash-metric-sub" style={{ color: stats.learningGain >= 0 ? 'var(--success)' : 'inherit' }}>
              +{stats.learningGain}% Knowledge Gain
            </div>
          </div>
        </div>
      )}

      {/* Virtual Labs / Classes */}
      <div className="teacher-students-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>My Virtual Labs (Classes)</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Create labs and share the invite code with your students.
            </p>
          </div>
          <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. AI-ML Batch A"
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-primary)', fontSize: '14px' }}
            />
            <button type="submit" className="btn btn-primary" disabled={creatingClass || !newClassName.trim()} style={{ padding: '8px 16px', fontSize: '14px' }}>
              {creatingClass ? 'Creating...' : 'Create Class'}
            </button>
          </form>
        </div>
        
        <div style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {classes.length === 0 ? (
            <div className="dash-empty-state" style={{ width: '100%', margin: 0 }}>
              You haven't created any classes yet. Create one to get an invite code!
            </div>
          ) : (
            classes.map(c => (
              <div key={c.id} style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', minWidth: '250px' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{c.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Invite Code:{' '}
                    <code style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '16px' }}>
                      {c.invite_code}
                    </code>
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const link = `${window.location.origin}/join/${c.invite_code}`;
                      navigator.clipboard.writeText(link);
                      alert('Invite link copied to clipboard!');
                    }}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search & Student Directory */}
      <div className="teacher-students-card">
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Student Directory ({students.length})</h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Select a student to view granular step-by-step progress, quiz breakdown, and lab history.
              </p>
            </div>
          </div>

          <div className="teacher-search-bar" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="teacher-search-input"
              placeholder="Search by student name, register number (e.g. RA2111...), or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="dash-empty-state">Loading student records…</div>
        ) : error ? (
          <div className="dash-empty-state" style={{ color: 'var(--error)' }}>{error}</div>
        ) : students.length === 0 ? (
          <div className="dash-empty-state">
            No students found matching "{search}".
          </div>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Register No</th>
                  <th>Overall Progress</th>
                  <th>Completed Exps</th>
                  <th>Pre-Test Avg</th>
                  <th>Post-Test Avg</th>
                  <th>Last Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{st.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{st.email}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                        {st.studentId || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <span className="dash-progress-mini">
                        <span className="dash-progress-mini-fill" style={{ width: `${st.overallPercent}%` }} />
                      </span>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{st.overallPercent}%</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: st.completedExperiments > 0 ? 'var(--success)' : 'inherit' }}>
                        {st.completedExperiments} / 10
                      </span>
                    </td>
                    <td>
                      {st.avgPretestScore !== null ? (
                        <span>{st.avgPretestScore}%</span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {st.avgPosttestScore !== null ? (
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{st.avgPosttestScore}%</span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {st.lastLogin ? new Date(st.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/teacher/students/${st.id}`} className="btn btn-secondary btn-sm">
                        View Records →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
