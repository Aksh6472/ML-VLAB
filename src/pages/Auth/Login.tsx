import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import srmLogo from '../../assets/srm-logo.png';
import './Auth.css';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isFacultyRoute = location.pathname.startsWith('/faculty');
  const [role, setRole] = useState<'student' | 'teacher'>(isFacultyRoute ? 'teacher' : 'student');
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    (location.state as any)?.resetSuccess
      ? 'Your password has been successfully reset. Please sign in with your new password.'
      : null
  );
  const [loading, setLoading] = useState(false);

  // Sync role if route changes between /login and /faculty/login
  React.useEffect(() => {
    if (location.pathname.startsWith('/faculty')) {
      setRole('teacher');
    } else if (location.pathname === '/login') {
      setRole('student');
    }
  }, [location.pathname]);

  // If already authenticated, redirect immediately to home/dashboard
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname;
      const isValidSubRoute = from && !['/', '/login', '/faculty/login', '/register', '/home'].includes(from);
      const defaultDashboard = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(isValidSubRoute ? from : defaultDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const result = await login(email, password, role);
    setLoading(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname;
      const isValidSubRoute = from && !['/', '/login', '/faculty/login', '/register', '/home'].includes(from);
      const defaultDashboard = role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      const dest = isValidSubRoute ? from : defaultDashboard;
      navigate(dest, { replace: true });
    } else {
      setError(result.error || 'Failed to sign in. Please verify your credentials.');
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

        {successMsg && (
          <div
            className="animate-fade-in"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#34d399',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

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
              placeholder={role === 'teacher' ? 'faculty.email@srmist.edu.in' : 'student.email@srmist.edu.in'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-password">Password</label>
              <Link
                to="/forgot-password"
                state={{ email }}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--accent-primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>
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

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" state={{ role }}>
            Create {role === 'teacher' ? 'Faculty' : 'Student'} Account
          </Link>
        </div>
      </div>
    </div>
  );
}
