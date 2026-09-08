// src/pages/Home.tsx
import React, { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { experiments } from '../data/experiments';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import './Home.css';

/* ─── Animated Background: subtle dot grid with connections ─── */
function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let dots: { x: number; y: number; vx: number; vy: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
      initDots();
    }

    function initDots() {
      if (!canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.floor((w * h) / 8000);
      dots = Array.from({ length: Math.min(count, 80) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    }

    function draw() {
      if (!canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue('--text-primary').trim() || '#1a1d21';

      // Move dots
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
      }

      // Draw connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(dots[i].x, dots[i].y);
            ctx!.lineTo(dots[j].x, dots[j].y);
            ctx!.strokeStyle = color;
            ctx!.globalAlpha = 0.08 * (1 - dist / 120);
            ctx!.lineWidth = 1;
            ctx!.stroke();
            ctx!.globalAlpha = 1;
          }
        }
      }

      // Draw dots
      for (const d of dots) {
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = 0.15;
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      animId = requestAnimationFrame(draw);
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize();
    if (!prefersReduced) {
      draw();
    } else {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue('--text-primary').trim() || '#1a1d21';
      for (const d of dots) {
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, 2, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = 0.12;
        ctx!.fill();
      }
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="home-hero-bg">
      <canvas ref={canvasRef} />
    </div>
  );
}

const aboutFeatures = [
  { icon: '🧠', title: 'Machine Learning Concepts', desc: 'Understand key ML principles, data workflows, and algorithmic foundations.' },
  { icon: '⚡', title: 'Algorithmic Understanding', desc: 'Explore linear models, trees, ensembles, clustering, and neural networks.' },
  { icon: '📖', title: 'Comprehensive Theory', desc: 'Study guided explanations with highlighted terminology and mathematical formulas.' },
  { icon: '💻', title: 'Hands-on Python Practice', desc: 'Write, execute, and experiment with Python code using scikit-learn & numpy.' },
  { icon: '📊', title: 'Results & Visualizations', desc: 'Analyze dynamic 2D/3D visual plots, confusion matrices, and decision boundaries.' },
  { icon: '📝', title: 'Pre & Post Assessments', desc: 'Measure understanding before and after each experiment with auto-graded quizzes.' },
  { icon: '📈', title: 'Learning Progress Tracking', desc: 'Track completion milestones, quiz scores, and section progress on your dashboard.' },
];

const howItWorksSteps = [
  { step: '01', title: 'Learn', desc: 'Understand the theory and important concepts.', icon: '📖' },
  { step: '02', title: 'Practice', desc: 'Experiment with Python code and visualizations.', icon: '💻' },
  { step: '03', title: 'Assess', desc: 'Complete pre-tests and post-tests.', icon: '📝' },
  { step: '04', title: 'Track', desc: 'Monitor your progress and performance through the dashboard.', icon: '📈' },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { progress, getCompletionPercent } = useProgress();
  const navigate = useNavigate();

  const handleSignInClick = () => {
    if (isAuthenticated && user) {
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="home-hero">
        <HeroBackground />
        <div className="home-hero-content">
          <div className="home-hero-badge">SRM Virtual Laboratory</div>
          <h1 className="home-hero-title">
            Welcome to the Machine Learning Virtual Lab
          </h1>
          <p className="home-hero-subtitle">
            Explore Machine Learning concepts through interactive experiments, hands-on coding, assessments, visualizations, and guided learning.
          </p>
          <p className="home-hero-description" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)', maxWidth: '600px', margin: '0 auto var(--space-8)' }}>
            The Virtual Lab allows students to learn Machine Learning concepts practically through 10 interactive experiments, real-time Python execution, visual decision plots, and structured evaluation.
          </p>
          <div className="home-hero-actions">
            <button onClick={handleSignInClick} className="btn btn-primary btn-lg" style={{ minWidth: '160px', fontWeight: 600 }}>
              {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
            </button>
            <a href="#experiments" className="btn btn-secondary btn-lg">
              Explore Experiments ↓
            </a>
          </div>
        </div>
      </section>

      {/* ─── 2. ABOUT THE VIRTUAL LAB ─── */}
      <section className="home-section">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-label">Overview</div>
            <h2 className="home-section-title">About the Virtual Lab</h2>
            <p className="home-section-desc">
              The <strong>Machine Learning Virtual Lab</strong> is an interactive learning environment designed to help students understand Machine Learning through both theory and practical experimentation.
            </p>
          </div>

          <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)', marginTop: 'var(--space-8)' }}>
            {aboutFeatures.map((feat) => (
              <div key={feat.title} className="about-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>{feat.icon}</div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>{feat.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 'var(--leading-relaxed)', margin: 0 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. HOW THE VIRTUAL LAB WORKS ─── */}
      <section className="home-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-label">Learning Methodology</div>
            <h2 className="home-section-title">How the Virtual Lab Works</h2>
            <p className="home-section-desc">
              A structured 4-step learning cycle: <strong>Learn → Practice → Assess → Track</strong>
            </p>
          </div>

          <div className="home-pillars">
            {howItWorksSteps.map((s) => (
              <div key={s.title} className="home-pillar-card">
                <div className="home-pillar-header">
                  <div className="home-pillar-icon">{s.icon}</div>
                  <span className="home-pillar-step-badge">STEP {s.step}</span>
                </div>
                <h3 className="home-pillar-title">{s.title}</h3>
                <p className="home-pillar-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. WHAT STUDENTS CAN EXPLORE ─── */}
      <section className="home-section" id="experiments">
        <div className="home-section-inner">
          <div className="home-section-header">
            <div className="home-section-label">Curriculum</div>
            <h2 className="home-section-title">What Students Can Explore</h2>
            <p className="home-section-desc">
              Explore 10 curated Machine Learning experiments covering data preparation, supervised learning, unsupervised clustering, and neural networks.
            </p>
          </div>

          <div className="home-experiments-grid stagger">
            {experiments.map(exp => {
              const percent = getCompletionPercent(exp.id);
              return (
                <Link
                  key={exp.id}
                  to={`/experiment/${exp.id}`}
                  className="home-exp-card animate-fade-in-up"
                  style={{ '--exp-accent': exp.accentColor } as React.CSSProperties}
                >
                  <div className="home-exp-header">
                    <span className="home-exp-number">
                      {String(exp.number).padStart(2, '0')}
                    </span>
                    <div className="home-exp-meta">
                      <span className="badge badge-navy">{exp.category}</span>
                    </div>
                  </div>
                  <h3 className="home-exp-title">{exp.shortTitle}</h3>
                  <p className="home-exp-desc">{exp.description}</p>
                  <div className="home-exp-footer">
                    <span className="home-exp-time">
                      ⏱ {exp.estimatedTime}
                    </span>
                    <span className="badge badge-navy">{exp.difficulty}</span>
                    {percent > 0 && (
                      <div className="home-exp-progress">
                        <div className="home-exp-progress-fill" style={{ width: `${percent}%` }} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Continue Learning (If Authenticated & Active) ─── */}
      {isAuthenticated && progress.lastVisited && (
        <section className="home-section" style={{ background: 'var(--bg-secondary)' }}>
          <div className="home-section-inner">
            <div className="home-section-header">
              <div className="home-section-label">Welcome Back</div>
              <h2 className="home-section-title">Continue Where You Left Off</h2>
            </div>
            <div className="home-continue">
              <div className="home-continue-info">
                <div className="home-continue-label">Currently Learning</div>
                <div className="home-continue-title">
                  Experiment {String(progress.lastVisited.experimentId).padStart(2, '0')} –{' '}
                  {experiments.find(e => e.id === progress.lastVisited!.experimentId)?.shortTitle}
                </div>
                <div className="home-continue-section">
                  Section: {progress.lastVisited.section}
                </div>
              </div>
              <Link to={`/experiment/${progress.lastVisited.experimentId}`} className="btn btn-primary">
                Continue Learning →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer className="home-footer">
        <p className="home-footer-text">
          SRM Machine Learning Virtual Laboratory · Department of Computer Science & Engineering · Built for Interactive Practical Learning
        </p>
      </footer>
    </div>
  );
}
