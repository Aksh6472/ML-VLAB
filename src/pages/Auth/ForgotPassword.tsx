import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import srmLogo from '../../assets/srm-logo.png';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  
  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password strength checks
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;

  // Step 1: Request OTP Code
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        return;
      }

      setStep(2);
      setSuccessMessage(data.message || 'Verification code sent to your email.');
      if (data.devPreviewCode) {
        setDevCode(data.devPreviewCode);
      }
      setResendCooldown(60);
    } catch (err) {
      setLoading(false);
      setError('Network error connecting to authentication server.');
    }
  };

  // Step 2: Submit Code and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet the security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please check your verification code.');
        return;
      }

      setSuccessMessage('Password reset successfully! Redirecting to Sign In…');
      setTimeout(() => {
        navigate('/login', { state: { resetSuccess: true, email: email.trim() } });
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError('Network error connecting to authentication server.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <img src={srmLogo} alt="SRM Logo" className="auth-logo" style={{ height: '48px', width: 'auto', marginBottom: 'var(--space-3)' }} />
          <div className="auth-badge">SRM VIRTUAL LABORATORY</div>
          <h1 className="auth-title">
            {step === 1 ? 'Reset Password' : 'Enter Verification Code'}
          </h1>
          <p className="auth-subtitle">
            {step === 1
              ? 'Enter your institutional email and we will send you a 6-digit verification code to reset your password.'
              : `Enter the 6-digit verification code sent to ${email} and choose a new password.`}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner animate-fade-in" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="animate-fade-in"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#38bdf8',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✉️</span>
            <span>{successMessage}</span>
          </div>
        )}

        {devCode && step === 2 && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px dashed rgba(234, 179, 8, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#facc15',
              fontSize: 'var(--text-xs)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>🛠️ <strong>Development OTP:</strong> {devCode}</span>
            <button
              type="button"
              onClick={() => setCode(devCode)}
              style={{
                background: 'transparent',
                border: '1px solid #facc15',
                color: '#facc15',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Fill Code
            </button>
          </div>
        )}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleRequestCode}>
            <div className="auth-field">
              <label htmlFor="recovery-email">Institutional / Academic Email</label>
              <input
                id="recovery-email"
                type="email"
                placeholder="e.g. student@srmist.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Sending Verification Code…' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="auth-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="otp-code">6-Digit Verification Code</label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Change Email
                </button>
              </div>
              <input
                id="otp-code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{
                  letterSpacing: '6px',
                  fontSize: '18px',
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              />
            </div>

            <div className="auth-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="new-password">New Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Password strength visual feedback */}
            {newPassword.length > 0 && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px',
                  padding: '6px 8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ color: hasLength ? '#34d399' : '#94a3b8' }}>{hasLength ? '✓' : '•'} 8+ characters</span>
                <span style={{ color: hasUpper ? '#34d399' : '#94a3b8' }}>{hasUpper ? '✓' : '•'} Uppercase (A-Z)</span>
                <span style={{ color: hasLower ? '#34d399' : '#94a3b8' }}>{hasLower ? '✓' : '•'} Lowercase (a-z)</span>
                <span style={{ color: hasNumber ? '#34d399' : '#94a3b8' }}>{hasNumber ? '✓' : '•'} Number (0-9)</span>
                <span style={{ color: hasSpecial ? '#34d399' : '#94a3b8' }}>{hasSpecial ? '✓' : '•'} Special char (!@#$)</span>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
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
              {loading ? 'Resetting Password…' : 'Save & Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => handleRequestCode()}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
                  fontSize: 'var(--text-xs)',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  padding: '4px',
                }}
              >
                {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Verification Code'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
