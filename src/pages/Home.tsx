import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { experiments } from '../data/experiments';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const aboutFeatures = [
  { icon: '🧠', title: 'Machine Learning Concepts', desc: 'Understand key ML principles, data pre-processing, and algorithmic foundations.' },
  { icon: '⚡', title: 'Interactive Algorithms', desc: 'Explore linear models, decision trees, ensembles, clustering, and neural networks.' },
  { icon: '📖', title: 'Guided Theory & Formulas', desc: 'Study clear explanations with highlighted terminology and mathematical formulas.' },
  { icon: '💻', title: 'Hands-on Coding & Execution', desc: 'Write, run, and experiment with Python code directly in your browser.' },
  { icon: '📊', title: 'Visual Diagnostics', desc: 'Analyze dynamic 2D/3D plots, confusion matrices, and decision boundaries.' },
  { icon: '📝', title: 'Pre & Post Assessments', desc: 'Verify understanding before and after every experiment with auto-graded quizzes.' },
];

const howItWorksSteps = [
  { step: '01', title: 'Explore Theory & Math', desc: 'Study core principles, hyperparameter roles, and algorithmic formulas.' },
  { step: '02', title: 'Take Pre-Test', desc: 'Gauge baseline knowledge before starting the experiment procedure.' },
  { step: '03', title: 'Hands-on Execution', desc: 'Run Python algorithms interactively and inspect diagnostic plots.' },
  { step: '04', title: 'Post-Test Assessment', desc: 'Validate concept mastery and track score improvements in your dashboard.' },
];

export default function Home() {
  const { isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setJoinMessage({ type: 'error', text: 'Please enter an invite code.' });
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }

    if (user?.role === 'teacher') {
      setJoinMessage({ type: 'error', text: 'Faculty accounts cannot join a class as a student.' });
      return;
    }

    setJoinLoading(true);
    setJoinMessage(null);

    try {
      const res = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinMessage({ type: 'error', text: data.error || 'Invalid invite code.' });
      } else {
        setJoinMessage({
          type: 'success',
          text: `Successfully joined ${data.labName || 'the Virtual Lab'}!`
        });
        setInviteCode('');
      }
    } catch (err) {
      setJoinMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="home animate-fade-in">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="home-hero">
        <div className="home-hero-card">
          <div className="home-hero-badge">
            <span className="home-hero-badge-dot" />
            SRM VIRTUAL LABORATORY
          </div>

          <h1 className="home-hero-title">
            Welcome to the<br className="home-title-br" />
            <span className="home-hero-highlight">Machine Learning Virtual Lab</span>
          </h1>

          <p className="home-hero-subtitle">
            Explore Machine Learning through 10 interactive experiments, hands-on Python coding, real-time visual diagnostics, and auto-graded assessments.
          </p>

          <div className="home-hero-actions">
            <a href="#experiments" className="btn btn-primary btn-lg">
              Explore Experiments ↓
            </a>
            <button
              type="button"
              onClick={() => {
                setJoinMessage(null);
                setShowJoinModal(true);
              }}
              className="btn btn-secondary btn-lg"
            >
              Join Virtual Lab
            </button>
          </div>
        </div>
      </section>

      {/* ─── JOIN CLASS MODAL DIALOG ─── */}
      {showJoinModal && (
        <div className="home-modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="home-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="home-modal-close"
              onClick={() => setShowJoinModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="home-join-header">
              <div className="home-join-badge">INVITE CODE</div>
              <h2 className="home-join-title">Join a Virtual Lab</h2>
              <p className="home-join-subtitle">Have an invite code from your faculty?</p>
            </div>

            <form onSubmit={handleJoinClass} className="home-join-form">
              <div className="home-join-input-wrapper">
                <input
                  type="text"
                  className="home-join-input"
                  placeholder="ENTER INVITE CODE"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary home-join-btn"
                  disabled={joinLoading}
                >
                  {joinLoading ? 'Joining...' : 'Join Class'}
                </button>
              </div>
            </form>

            {joinMessage && (
              <div className={`home-join-alert ${joinMessage.type}`}>
                <span>{joinMessage.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{joinMessage.text}</span>
              </div>
            )}

            {!isAuthenticated && (
              <p className="home-join-hint">
                Note: You will be prompted to <Link to="/login" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>Sign In</Link> before joining your faculty's class.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── 2. ABOUT THE VIRTUAL LAB ─── */}
      <section className="home-section">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-label">Overview</div>
            <h2 className="home-section-title">About the Virtual Lab</h2>
            <p className="home-section-desc">
              Designed to help students gain deep conceptual understanding and practical mastery in Machine Learning.
            </p>
          </div>

          <div className="home-about-grid">
            {aboutFeatures.map((feat) => (
              <div key={feat.title} className="home-about-card">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{feat.icon}</div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{feat.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. HOW IT WORKS ─── */}
      <section className="home-section">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-label">Guided Flow</div>
            <h2 className="home-section-title">How the Virtual Lab Works</h2>
            <p className="home-section-desc">
              A structured 4-step learning methodology designed for optimal retention and hands-on skill building.
            </p>
          </div>

          <div className="home-steps-grid">
            {howItWorksSteps.map((s) => (
              <div key={s.step} className="home-step-card">
                <div className="home-step-num">{s.step}</div>
                <h3 className="home-step-title">{s.title}</h3>
                <p className="home-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. EXPERIMENTS CURRICULUM ─── */}
      <section className="home-section home-curriculum-section" id="experiments">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-label">Curriculum</div>
            <h2 className="home-section-title">10 Machine Learning Experiments</h2>
            <p className="home-section-desc">
              Structured hands-on laboratory modules from Foundations to Neural Networks.
            </p>
          </div>

          <div className="home-experiments-list">
            {experiments.map(exp => (
              <Link
                key={exp.id}
                to={isAuthenticated ? `/experiment/${exp.id}` : '/login'}
                className="home-exp-item"
              >
                <div className="home-exp-item-left">
                  <span className="home-exp-item-num">{String(exp.number).padStart(2, '0')}</span>
                  <div className="home-exp-item-info">
                    <h3 className="home-exp-item-title">{exp.shortTitle}</h3>
                    <span className="home-exp-item-cat">{exp.category}</span>
                  </div>
                </div>
                <div className="home-exp-item-right">
                  <span className="home-exp-item-action">Start Lab →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="home-footer">
        <p className="home-footer-text">
          SRM Machine Learning Virtual Laboratory · Department of Computer Science & Engineering · Interactive Practical Learning
        </p>
      </footer>
    </div>
  );
}

