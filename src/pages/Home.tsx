import React from 'react';
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

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleSignInClick = () => {
    if (isAuthenticated && user) {
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home animate-fade-in">
      {/* ─── 1. HERO SECTION ─── */}
      <section className="home-hero" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
        <div className="home-hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="badge badge-navy" style={{ marginBottom: 'var(--space-3)' }}>SRM VIRTUAL LABORATORY</div>
          <h1 className="home-hero-title" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, margin: '8px 0 16px', lineHeight: 1.2 }}>
            Welcome to the Machine Learning Virtual Lab
          </h1>
          <p className="home-hero-subtitle" style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Explore Machine Learning concepts through interactive experiments, hands-on coding, assessments, visualizations, and guided learning.
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', maxWidth: '640px', margin: '0 auto var(--space-8)' }}>
            The Virtual Lab allows students to learn Machine Learning concepts practically through 10 structured experiments, real-time Python execution, visual decision plots, and evaluation.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleSignInClick} className="btn btn-primary btn-lg" style={{ minWidth: '160px', fontWeight: 600 }}>
              {isAuthenticated ? 'Go to My Dashboard' : 'Sign In'}
            </button>
            <a href="#experiments" className="btn btn-secondary btn-lg">
              Explore 10 Experiments ↓
            </a>
          </div>
        </div>
      </section>

      {/* ─── 2. ABOUT THE VIRTUAL LAB ─── */}
      <section className="home-section" style={{ borderTop: '1px solid var(--border-primary)', padding: 'var(--space-10) var(--space-6)' }}>
        <div className="home-section-inner" style={{ maxWidth: 'var(--page-max-width)', margin: '0 auto' }}>
          <div className="home-section-header" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div className="section-label">Overview</div>
            <h2 className="section-title">About the Virtual Lab</h2>
            <p className="section-description" style={{ maxWidth: '700px', margin: '0 auto' }}>
              Designed to help students gain deep conceptual understanding and practical mastery in Machine Learning.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
            {aboutFeatures.map((feat) => (
              <div key={feat.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{feat.icon}</div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>{feat.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. EXPERIMENTS CURRICULUM ─── */}
      <section className="home-section" id="experiments" style={{ borderTop: '1px solid var(--border-primary)', padding: 'var(--space-10) var(--space-6)' }}>
        <div className="home-section-inner" style={{ maxWidth: 'var(--page-max-width)', margin: '0 auto' }}>
          <div className="home-section-header" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div className="section-label">Curriculum</div>
            <h2 className="section-title">10 Machine Learning Experiments</h2>
            <p className="section-description" style={{ maxWidth: '700px', margin: '0 auto' }}>
              Covering data pre-processing, regression, classification, dimensionality reduction, clustering, ensemble methods, and neural networks.
            </p>
          </div>

          <div className="home-experiments-grid">
            {experiments.map(exp => (
              <div
                key={exp.id}
                className="home-exp-card"
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
                  <span className="home-exp-time">⏱ {exp.estimatedTime}</span>
                  <span className="badge badge-navy">{exp.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="home-footer" style={{ borderTop: '1px solid var(--border-primary)', padding: 'var(--space-6)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', margin: 0 }}>
          SRM Machine Learning Virtual Laboratory · Department of Computer Science & Engineering · Interactive Practical Learning
        </p>
      </footer>
    </div>
  );
}
