import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import srmLogo from '../../assets/srm-logo.png';
import './Auth.css';

export default function Login() {
  const { login, sendLoginOtp, loginWithOtp, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isFacultyRoute = location.pathname.startsWith('/faculty');
  const [role, setRole] = useState<'student' | 'teacher'>(isFacultyRoute ? 'teacher' : 'student');
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP login states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    (location.state as any)?.resetSuccess
      ? 'Your password has been successfully reset. Please sign in with your new password.'
      : null
  );
  const [loading, setLoading] = useState(false);
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(null);

  // Sync role if route changes between /login and /faculty/login
  React.useEffect(() => {
    if (location.pathname.startsWith('/faculty')) {
      setRole('teacher');
    } else if (location.pathname === '/login') {
      setRole('student');
    }
  }, [location.pathname]);

  // Cooldown countdown timer for OTP resend
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // If already authenticated, redirect immediately to home/dashboard
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname;
      const isValidSubRoute = from && !['/', '/login', '/faculty/login', '/register', '/home'].includes(from);
      const defaultDashboard = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(isValidSubRoute ? from : defaultDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await sendLoginOtp(email, role);
    setLoading(false);

    if (res.success) {
      setOtpSent(true);
      setCooldown(60);
      setSuccessMsg('A 6-digit verification code has been sent to your Gmail.');
      if (res.devPreviewCode) setDevPreviewCode(res.devPreviewCode);
    } else {
      setError(res.error || 'Failed to send login code. Please try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await loginWithOtp(email, otpCode, role);
    setLoading(false);

    if (res.success) {
      const from = (location.state as any)?.from?.pathname;
      const isValidSubRoute = from && !['/', '/login', '/faculty/login', '/register', '/home'].includes(from);
      const defaultDashboard = role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      const dest = isValidSubRoute ? from : defaultDashboard;
      navigate(dest, { replace: true });
    } else {
      setError(res.error || 'Invalid verification code. Please check your Gmail.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <img src={srmLogo} alt="SRM Logo" className="auth-logo" style={{ height: '48px', width: 'auto', marginBottom: 'var(--space-3)' }} />
          <div className="auth-badge">{isFacultyRoute ? 'SRM FACULTY PORTAL' : 'SRM VIRTUAL LABORATORY'}</div>
          <h1 className="auth-title">{isFacultyRoute ? 'Faculty Sign In' : 'Student Sign In'}</h1>
          <p className="auth-subtitle">
            {isFacultyRoute
              ? 'Sign in to access faculty oversight, class analytics, student records, and test creation.'
              : 'Sign in to access your experiment records, quizzes, and learning dashboard.'}
          </p>
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

        {/* Login Method Sub-Tabs */}
        <div className="auth-role-tabs" style={{ marginBottom: 'var(--space-5)', background: 'rgba(255,255,255,0.03)' }}>
          <button
            type="button"
            className={`auth-role-tab ${loginMode === 'password' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('password');
              setError(null);
              setSuccessMsg(null);
            }}
          >
            🔑 Password
          </button>
          <button
            type="button"
            className={`auth-role-tab ${loginMode === 'otp' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('otp');
              setError(null);
              setSuccessMsg(null);
            }}
          >
            ✉️ Gmail OTP Code
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
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
            {loginMode === 'otp' && (
              <span style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '2px' }}>
                💡 Check your <strong>Spam or Junk</strong> folder if you don't see the email in your primary inbox.
              </span>
            )}
          </div>
        )}

        {devPreviewCode && (
          <div
            className="animate-fade-in"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px dashed rgba(56, 189, 248, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#38bdf8',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              textAlign: 'center',
              fontFamily: 'monospace',
            }}
          >
            🔑 Verification Code: <strong>{devPreviewCode}</strong>
          </div>
        )}

        {error && (
          <div className="auth-error-banner animate-fade-in" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loginMode === 'password' ? (
          /* Password Form */
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
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
              <div className="password-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" x2="22" y1="2" y2="22"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Signing in…' : `Sign In as ${role === 'teacher' ? 'Faculty' : 'Student'}`}
            </button>
          </form>
        ) : (
          /* Gmail OTP Form */
          <div className="auth-form">
            <div className="auth-field">
              <label htmlFor="otp-login-email">Email Address</label>
              <input
                id="otp-login-email"
                type="email"
                placeholder={role === 'teacher' ? 'faculty.email@srmist.edu.in' : 'student.email@srmist.edu.in'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtpSent(false);
                }}
                required
                autoComplete="email"
                disabled={loading || (otpSent && cooldown > 0)}
              />
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                className="btn btn-primary auth-submit-btn"
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending Code…' : '✉️ Send Code to Gmail'}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp} className="auth-form" style={{ gap: 'var(--space-4)' }}>
                <div className="auth-field">
                  <label htmlFor="otp-login-code">6-Digit Gmail Verification Code</label>
                  <input
                    id="otp-login-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    style={{
                      letterSpacing: '8px',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-submit-btn"
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? 'Verifying…' : 'Sign In with Gmail Code'}
                </button>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || cooldown > 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: cooldown > 0 ? 'var(--text-secondary)' : 'var(--accent-primary)',
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                    }}
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive code? Resend"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

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

