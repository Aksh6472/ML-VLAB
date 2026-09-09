import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import srmLogo from '../../assets/srm-logo.png';
import './Auth.css';

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialRole = (location.state as any)?.role === 'teacher' ? 'teacher' : 'student';
  const [role, setRole] = useState<'student' | 'teacher'>(initialRole);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (role === 'student' && !studentId.trim()) {
      setError('Student Register Number / ID is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await register({
      name,
      studentId: role === 'student' ? studentId : (studentId.trim() || undefined),
      email,
      password,
      role,
    });
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <img src={srmLogo} alt="SRM Logo" className="auth-logo" style={{ height: '48px', width: 'auto', marginBottom: 'var(--space-3)' }} />
          <div className="auth-badge">SRM VIRTUAL LABORATORY</div>
          <h1 className="auth-title">Create {role === 'teacher' ? 'Faculty' : 'Student'} Account</h1>
          <p className="auth-subtitle">Register to track experiment procedures, quiz scores, notes, and learning progress.</p>
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
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Akshayanivashini"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-studentid">
              {role === 'teacher' ? 'Faculty / Employee ID (Optional)' : 'Register Number / Student ID'}
            </label>
            <input
              id="reg-studentid"
              type="text"
              placeholder={role === 'teacher' ? 'e.g. EMP10293' : 'e.g. RA2111003010001'}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required={role === 'student'}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Institutional / Academic Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder={role === 'teacher' ? 'faculty.email@srmist.edu.in' : 'student.email@srmist.edu.in'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Password (min 6 characters)</label>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account…' : `Register as ${role === 'teacher' ? 'Faculty' : 'Student'}`}
          </button>
        </form>

        <div className="auth-footer">
          Already registered?{' '}
          <Link to="/login" state={{ role }}>
            Sign In as {role === 'teacher' ? 'Faculty' : 'Student'}
          </Link>
        </div>
      </div>
    </div>
  );
}
