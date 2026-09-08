import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function JoinClassPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { code } = useParams();
  const [inviteCode, setInviteCode] = useState(code && code !== 'new' ? code.toUpperCase() : '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter a valid invite code.');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to join class.');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Join Virtual Lab</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Enter the 8-character invite code provided by your instructor to join their virtual lab class.
      </p>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="inviteCode" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
            Invite Code
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="e.g. A1B2C3D4"
            maxLength={8}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              fontSize: '16px',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || inviteCode.length < 4}
          style={{ padding: '12px', fontSize: '16px' }}
        >
          {loading ? 'Joining...' : 'Join Class'}
        </button>
      </form>
    </div>
  );
}
