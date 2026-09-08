import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import srmLogo from '../../assets/srm-logo.png';
import './Auth.css';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname;
      const defaultDest = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(from || defaultDest, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname;
      const dest = from || (role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      navigate(dest, { replace: true });
    } else {
      setError(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleQuickFill = (type: 'student' | 'teacher') => {
    if (type === 'teacher') {
      setRole('teacher');
      setEmail('teacher@srm.edu');
      setPassword('Teacher@123');
    } else {
      setRole('student');
      setEmail('student@srm.edu');
      setPassword('Student@123');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <img src={srmLogo} alt="SRM Logo" className="auth-logo" style={{ height: '48px', width: 'auto', marginBottom: 'var(--space-3)' }} />
          <div className="auth-badge">SRM VIRTUAL LABORATORY</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your experiment records, quizzes, and learning dashboard.</p>
        </div>

        {/* Role selector tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className={`auth-role-tab ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
          >
            👨‍🏫 Faculty
          </button>
        </div>

        {error && (
          <div className="auth-error-banner animate-fade-in" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder={role === 'teacher' ? 'teacher@srm.edu' : 'student@srm.edu'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Signing in…' : `Sign In as ${role === 'teacher' ? 'Faculty' : 'Student'}`}
          </button>
        </form>

        <div className="auth-quick-fill">
          <span>Demo quick-fill:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="auth-quick-btn"
              onClick={() => handleQuickFill('student')}
            >
              Student Demo
            </button>
            <button
              type="button"
              className="auth-quick-btn"
              onClick={() => handleQuickFill('teacher')}
            >
              Teacher Demo
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create Student Account</Link>
        </div>
      </div>
    </div>
  );
}
