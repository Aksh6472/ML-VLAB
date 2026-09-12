// src/pages/ExperimentsIndex.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { experiments } from '../data/experiments';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import './Home.css';
import './ExperimentsIndex.css';

export default function ExperimentsIndex() {
  const { isTeacher } = useAuth();
  const { getCompletionPercent, isExperimentUnlocked, isFinalTestUnlocked } = useProgress();
  const finalTestUnlocked = isFinalTestUnlocked();

  return (
    <div className="page-layout">
      <main className="page-main">
        <div style={{ maxWidth: 'var(--page-max-width)', margin: '0 auto' }}>
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <div className="section-label">All Experiments</div>
            <h1 className="section-title">Experiment Explorer</h1>
            <p className="section-description">
              10 structured experiments covering the fundamentals of machine learning. Complete experiments sequentially to unlock subsequent modules.
            </p>
          </div>

          <div className="home-experiments-grid">
            {experiments.map(exp => {
              const percent = getCompletionPercent(exp.id);
              const unlocked = isExperimentUnlocked(exp.id);

              if (unlocked) {
                return (
                  <Link
                    key={exp.id}
                    to={`/experiment/${exp.id}`}
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
                    <h3 className="home-exp-title">{exp.title}</h3>
                    <p className="home-exp-desc">{exp.description}</p>
                    <div className="home-exp-footer">
                      <span className="home-exp-time">⏱ {exp.estimatedTime}</span>
                      <span className="badge badge-navy">{exp.difficulty}</span>
                      {percent > 0 && (
                        <div className="home-exp-progress">
                          <div className="home-exp-progress-fill" style={{ width: `${percent}%` }} />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              }

              return (
                <div
                  key={exp.id}
                  className="home-exp-card locked"
                  style={{
                    '--exp-accent': exp.accentColor,
                    opacity: 0.7,
                    cursor: 'not-allowed',
                    borderStyle: 'dashed'
                  } as React.CSSProperties}
                  title="Complete previous experiment to unlock"
                >
                  <div className="home-exp-header">
                    <span className="home-exp-number" style={{ opacity: 0.5 }}>
                      {String(exp.number).padStart(2, '0')}
                    </span>
                    <div className="home-exp-meta">
                      <span className="badge" style={{ background: '#edf2f7', color: '#718096' }}>🔒 Locked</span>
                    </div>
                  </div>
                  <h3 className="home-exp-title" style={{ color: 'var(--text-secondary)' }}>{exp.title}</h3>
                  <p className="home-exp-desc" style={{ color: 'var(--text-tertiary)' }}>{exp.description}</p>
                  <div className="home-exp-footer" style={{ marginTop: 'auto' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      🔒 Complete previous experiment to unlock
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final Test Card - Hidden for Faculty/Teachers */}
          {!isTeacher && (
            <div style={{ marginTop: 'var(--space-10)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <span className="badge" style={{ background: finalTestUnlocked ? 'rgba(56, 161, 105, 0.1)' : '#edf2f7', color: finalTestUnlocked ? '#38a169' : '#718096', marginBottom: '8px' }}>
                  {finalTestUnlocked ? '🏆 UNLOCKED' : '🔒 FINAL ASSESSMENT LOCKED'}
                </span>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '8px 0 4px' }}>
                  Final Machine Learning Assessment
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0, maxWidth: '600px' }}>
                  {finalTestUnlocked
                    ? 'Evaluate your comprehensive mastery of ML concepts across all 10 experiments with 30 targeted MCQs.'
                    : 'Complete all 10 experiments sequentially to unlock the Final ML Assessment.'}
                </p>
              </div>
              <div>
                {finalTestUnlocked ? (
                  <Link to="/final-test" className="btn btn-primary" style={{ background: '#38a169', border: 'none' }}>
                    Take Final Test →
                  </Link>
                ) : (
                  <button className="btn btn-secondary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    🔒 Locked
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
