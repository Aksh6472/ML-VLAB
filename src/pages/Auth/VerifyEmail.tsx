import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import srmLogo from '../../assets/srm-logo.png';
import './Auth.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState<string>((location.state as any)?.email || '');
  const [otp, setOtp] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(
    (location.state as any)?.message || 'Please enter the 6-digit verification code sent to your email.'
  );
  const [devCode, setDevCode] = useState<string | null>(
    (location.state as any)?.devPreviewCode || null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  // If already authenticated and email is verified, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      const defaultDashboard = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(defaultDashboard, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Resend cooldown timer decrement
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
    if (error) setError(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please return to login or registration.');
      return;
    }

    setError(null);
    setLoading(true);

    const result = await verifyEmail(email, otp);
    setLoading(false);

    if (result.success) {
      const targetRole = result.user?.role || 'student';
      const dest = targetRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(dest, { replace: true });
    } else {
      setError(result.error || 'Invalid verification code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;

    setError(null);
    setInfoMsg(null);
    setResending(true);

    const result = await resendVerification(email);
    setResending(false);

    if (result.success) {
      setInfoMsg(result.message || 'A new verification code has been sent.');
      if (result.devPreviewCode) {
        setDevCode(result.devPreviewCode);
      }
      setCooldown(60); // 60s cooldown
    } else {
      setError(result.error || 'Failed to resend verification code. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <img src={srmLogo} alt="SRM Logo" className="auth-logo" style={{ height: '48px', width: 'auto', marginBottom: 'var(--space-3)' }} />
          <div className="auth-badge">EMAIL VERIFICATION</div>
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            We sent a 6-digit verification code to: <br />
            <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email address'}</strong>
          </p>
        </div>

        {/* Development preview banner */}
        {devCode && (
          <div
            className="animate-fade-in"
            style={{
              padding: '10px 14px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px dashed rgba(56, 189, 248, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#38bdf8',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-4)',
              textAlign: 'center',
            }}
          >
            🛠️ <strong>Dev Mode Preview OTP Code</strong>: <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '2px', marginLeft: '6px' }}>{devCode}</span>
          </div>
        )}

        {infoMsg && !error && (
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
              <span>📩</span>
              <span>{infoMsg}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '2px' }}>
              💡 Check your <strong>Spam or Junk</strong> folder if you don't see the email in your primary inbox.
            </span>
          </div>
        )}

        {error && (
          <div className="auth-error-banner animate-fade-in" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="auth-field">
            <label htmlFor="otp-input" style={{ textAlign: 'center', display: 'block', marginBottom: '4px' }}>
              6-Digit Verification Code
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
              required
              autoFocus
              style={{
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '8px',
                textAlign: 'center',
                padding: '12px',
                background: 'var(--bg-primary)',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying Code…' : 'Verify Email'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            style={{
              background: 'none',
              border: 'none',
              color: cooldown > 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
              fontWeight: 600,
              cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
              fontSize: 'var(--text-sm)',
              textDecoration: cooldown > 0 ? 'none' : 'underline',
            }}
          >
            {resending
              ? 'Sending code…'
              : cooldown > 0
              ? `Resend Code in ${cooldown}s`
              : 'Resend Verification Code'}
          </button>
        </div>

        <div className="auth-footer">
          Entered wrong email or need to sign in?{' '}
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
