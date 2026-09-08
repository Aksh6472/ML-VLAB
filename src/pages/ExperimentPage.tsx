// src/pages/ExperimentPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { experiments, getExperiment, normalizeExpId } from '../data/experiments';
import { getExperimentContent } from '../data';
import { useProgress } from '../context/ProgressContext';
import PythonBlock from '../components/PythonBlock';
import FormulaCard from '../components/FormulaCard';
import Quiz from '../components/Quiz';
import ExperimentUtilities from '../components/ExperimentUtilities';

// Visualizations
import LinearRegressionViz from '../components/visualizations/LinearRegressionViz';
import LogisticRegressionViz from '../components/visualizations/LogisticRegressionViz';
import PCAViz from '../components/visualizations/PCAViz';
import SVMViz from '../components/visualizations/SVMViz';
import KMeansViz from '../components/visualizations/KMeansViz';
import DecisionTreeViz from '../components/visualizations/DecisionTreeViz';
import RandomForestViz from '../components/visualizations/RandomForestViz';
import PerceptronViz from '../components/visualizations/PerceptronViz';

import './ExperimentPage.css';

type SectionKey = 'aim' | 'theory' | 'pretest' | 'procedure' | 'results' | 'posttest';

const sections: { key: SectionKey; label: string; number: string }[] = [
  { key: 'aim', label: 'Aim', number: '01' },
  { key: 'theory', label: 'Theory', number: '02' },
  { key: 'pretest', label: 'Pre-Test', number: '03' },
  { key: 'procedure', label: 'Procedure', number: '04' },
  { key: 'results', label: 'Results & Analysis', number: '05' },
  { key: 'posttest', label: 'Post-Test', number: '06' },
];

const renderVisualization = (vizId: string) => {
  switch (vizId) {
    case 'linear-regression': return <LinearRegressionViz key="linear-regression" />;
    case 'logistic-regression': return <LogisticRegressionViz key="logistic-regression" />;
    case 'pca': return <PCAViz key="pca" />;
    case 'svm': return <SVMViz key="svm" />;
    case 'kmeans': return <KMeansViz key="kmeans" />;
    case 'decision-tree': return <DecisionTreeViz key="decision-tree" />;
    case 'random-forest': return <RandomForestViz key="random-forest" />;
    case 'perceptron': return <PerceptronViz key="perceptron" />;
    default: return null;
  }
};


const parseBoldText = (text: string | React.ReactNode) => {
  if (typeof text !== 'string') return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i} className="highlight-keyword">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function ExperimentPage() {
  const navigate = useNavigate();
  const { id, section } = useParams<{ id: string, section?: string }>();
  const normalizedId = normalizeExpId(id || '1');
  const expMeta = getExperiment(normalizedId);
  const content = getExperimentContent(normalizedId);
  const { getExperimentProgress, markSectionComplete, setLastVisited, saveProcedureStep, getProcedureSteps } = useProgress();

  const activeSection = (section as SectionKey) || 'aim';
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const progress = getExperimentProgress(normalizedId);
  const nextExp = experiments.find(e => e.number === (expMeta?.number || 0) + 1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [normalizedId, section]);
  
  if (!section && expMeta) {
    return <Navigate to={`/experiment/${normalizedId}/aim`} replace />;
  }

  useEffect(() => {
    if (normalizedId) setLastVisited(normalizedId, activeSection);
  }, [normalizedId, activeSection, setLastVisited]);



  const handleMarkComplete = useCallback((section: SectionKey) => {
    markSectionComplete(normalizedId, section);
  }, [normalizedId, markSectionComplete]);


  if (!expMeta) {
    return (
      <div className="exp-layout">
        <div className="exp-main">
          <div className="exp-content">
            <h2>Experiment not found</h2>
            <p>The requested experiment does not exist.</p>
            <Link to="/experiments" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              View All Experiments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for experiments without full content yet
  if (!content) {
    return (
      <div className="exp-layout">
        <div className="exp-main">
          <div className="exp-content">
            <div className="exp-breadcrumb">
              <Link to="/">Home</Link>
              <span className="exp-breadcrumb-sep">/</span>
              <Link to="/experiments">Experiments</Link>
              <span className="exp-breadcrumb-sep">/</span>
              <span>Experiment {String(expMeta.number).padStart(2, '0')}</span>
            </div>
            <h1 style={{ marginBottom: 'var(--space-4)' }}>
              {String(expMeta.number).padStart(2, '0')}. {expMeta.title}
            </h1>
            <div className="exp-aim-card">
              <p className="exp-aim-text">
                This experiment's interactive content is being built. The complete experience with theory, quizzes, visualizations, and procedures will be available soon.
              </p>
              <div className="exp-aim-meta">
                <span className="exp-aim-meta-item">⏱ {expMeta.estimatedTime}</span>
                <span className="exp-aim-meta-item">📊 {expMeta.difficulty}</span>
                <span className="exp-aim-meta-item">📁 {expMeta.category}</span>
              </div>
            </div>
            {nextExp && (
              <Link to={`/experiment/${nextExp.id}`} className="exp-next">
                <div>
                  <div className="exp-next-label">Next Experiment</div>
                  <div className="exp-next-title">{String(nextExp.number).padStart(2, '0')}. {nextExp.shortTitle}</div>
                </div>
                <span className="exp-next-arrow">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const procedureSteps = getProcedureSteps(normalizedId, content.procedure.steps.length);

  return (
    <div className="exp-layout" key={`exp-page-${normalizedId}`}>
      {/* ─── Sidebar ─── */}
      <aside className="exp-sidebar" aria-label="Experiment sections">
        <div className="exp-sidebar-header">
          <div className="exp-sidebar-number">{String(expMeta.number).padStart(2, '0')}</div>
          <div className="exp-sidebar-title">{expMeta.shortTitle}</div>
        </div>
        <ul className="exp-sidebar-nav">
          {sections.map(s => {
            const isActive = activeSection === s.key;
            const isComplete = progress[s.key];
            return (
              <li key={s.key} className="exp-sidebar-item">
                <Link
                  to={`/experiment/${normalizedId}/${s.key}`}
                  className={`exp-sidebar-link${isActive ? ' exp-sidebar-link--active' : ''}${isComplete ? ' exp-sidebar-link--completed' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="exp-sidebar-step-num">
                    {isComplete ? '✓' : s.number}
                  </span>
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="exp-main">
        <div className="exp-content">
          {/* Breadcrumb & Utilities */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
            <nav className="exp-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: 0 }}>
              <Link to="/">Home</Link>
              <span className="exp-breadcrumb-sep">/</span>
              <Link to="/experiments">Experiments</Link>
              <span className="exp-breadcrumb-sep">/</span>
              <span>Experiment {String(expMeta.number).padStart(2, '0')}</span>
            </nav>
            <ExperimentUtilities 
              key={`util-${normalizedId}`}
              experimentId={normalizedId} 
              experimentTitle={expMeta.title} 
            />
          </div>

          {/* ═══ AIM ═══ */}
          {activeSection === "aim" && (
          <section
            className="exp-section"
            ref={el => { sectionRefs.current.aim = el; }}
            id="aim"
          >
            <div className="exp-section-header">
              <div>
                <div className="exp-section-label">Section 01</div>
                <h2 className="exp-section-title">Aim</h2>
              </div>
              {!progress.aim && (
                <button className="btn btn-ghost btn-sm exp-mark-complete" onClick={() => handleMarkComplete('aim')}>
                  Mark Complete
                </button>
              )}
            </div>
            <div className="exp-aim-card">
              <p className="exp-aim-text">{parseBoldText(content.aim)}</p>
              <div className="exp-aim-objectives">
                <h4>Learning Objectives</h4>
                <ul>
                  {content.learningObjectives.map((obj: string, i: number) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
              <div className="exp-aim-meta">
                <span className="exp-aim-meta-item">⏱ {expMeta.estimatedTime}</span>
                <span className="exp-aim-meta-item">📊 {expMeta.difficulty}</span>
                <span className="exp-aim-meta-item">📁 {expMeta.category}</span>
              </div>
            </div>
          </section>

          )}

          {/* ═══ THEORY ═══ */}
          {activeSection === "theory" && (
          <section
            className="exp-section"
            ref={el => { sectionRefs.current.theory = el; }}
            id="theory"
          >
            <div className="exp-section-header">
              <div>
                <div className="exp-section-label">Section 02</div>
                <h2 className="exp-section-title">Theory</h2>
              </div>
              {!progress.theory && (
                <button className="btn btn-ghost btn-sm exp-mark-complete" onClick={() => handleMarkComplete('theory')}>
                  Mark Complete
                </button>
              )}
            </div>

            {content.theory.map((section: any) => (
              <div key={section.id} className="exp-theory-section">
                <h3>{section.title}</h3>

                {section.content && <p>{parseBoldText(section.content)}</p>}

                {/* Definition list items */}
                {section.type === 'list' && section.intro && <p>{parseBoldText(section.intro)}</p>}
                {section.items && (
                  <ul className="exp-theory-list">
                    {section.items.map((item: any, i: number) => (
                      <li key={i}>
                        {item.term && <strong>{item.term}</strong>}
                        {item.term && ' – '}
                        {parseBoldText(item.description)}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Subsections */}
                {section.subsections && (
                  <ul className="exp-theory-list">
                    {section.subsections.map((sub: any, i: number) => (
                      <li key={i}>
                        <strong>{sub.term}</strong> – {parseBoldText(sub.description)}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Table */}
                {section.table && (
                  <div style={{ overflowX: 'auto', margin: 'var(--space-4) 0' }}>
                    <table>
                      <thead>
                        <tr>
                          {section.table.headers.map((h: string) => <th key={h}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row: string[], ri: number) => (
                          <tr key={ri}>
                            {row.map((cell: string, ci: number) => <td key={ci}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Note callout */}
                {section.note && (
                  <div className="exp-theory-note">
                    <strong>Note:</strong> {parseBoldText(section.note)}
                  </div>
                )}

                {/* Formulas */}
                {section.formulas && section.formulas.map((f: any) => (
                  <FormulaCard key={f.name} name={f.name} latex={f.latex} description={f.description} />
                ))}

                {/* Code example */}
                {section.codeExample && (
                  <PythonBlock
                    title={section.codeExample.title}
                    code={section.codeExample.code}
                    explanation={section.codeExample.explanation}
                  />
                )}

                {/* Visualization */}
                {section.visualizationId && (
                  <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                    <button 
                      className="viz-btn" 
                      onClick={() => {
                        const el = document.getElementById(`viz-${section.visualizationId}`);
                        if (el) {
                           // small offset for header
                           const y = el.getBoundingClientRect().top + window.scrollY - 100;
                           window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }}
                      style={{ marginBottom: 'var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Visualize Concept
                    </button>
                    <div id={`viz-${section.visualizationId}`}>
                      {renderVisualization(section.visualizationId)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>

          )}

          {/* ═══ PRETEST ═══ */}
          {activeSection === "pretest" && (
          <section
            className="exp-section"
            ref={el => { sectionRefs.current.pretest = el; }}
            id="pretest"
          >
            <div className="exp-section-header">
              <div>
                <div className="exp-section-label">Section 03</div>
                <h2 className="exp-section-title">Pre-Test</h2>
              </div>
            </div>
            <Quiz
              key={`quiz-${normalizedId}-pretest`}
              quizId={`exp-${normalizedId}-pretest`}
              title={content.pretest.title}
              description={content.pretest.description}
              questions={content.pretest.questions}
              variant="pretest"
              onComplete={() => handleMarkComplete('pretest')}
            />
          </section>

          )}

          {/* ═══ PROCEDURE ═══ */}
          {activeSection === "procedure" && (
          <section
            className="exp-section"
            ref={el => { sectionRefs.current.procedure = el; }}
            id="procedure"
          >
            <div className="exp-section-header">
              <div>
                <div className="exp-section-label">Section 04</div>
                <h2 className="exp-section-title">Procedure</h2>
              </div>
            </div>

            {/* IPO Summary */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div className="exp-procedure-ipo">
                <div className="exp-procedure-ipo-item">
                  <div className="exp-procedure-ipo-label">Input</div>
                  <div className="exp-procedure-ipo-text">{content.procedure.inputProcessOutput.input}</div>
                </div>
                <div className="exp-procedure-ipo-item">
                  <div className="exp-procedure-ipo-label">Process</div>
                  <div className="exp-procedure-ipo-text">{content.procedure.inputProcessOutput.process}</div>
                </div>
                <div className="exp-procedure-ipo-item">
                  <div className="exp-procedure-ipo-label">Output</div>
                  <div className="exp-procedure-ipo-text">{content.procedure.inputProcessOutput.output}</div>
                </div>
              </div>
            </div>

            <div className="exp-procedure-steps">
              {content.procedure.steps.map((step: any, i: number) => {
                const isComplete = procedureSteps[i];
                return (
                  <div key={i} className={`exp-procedure-step${isComplete ? ' exp-procedure-step--complete' : ''}`}>
                    <button
                      className={`exp-procedure-check${isComplete ? ' exp-procedure-check--done' : ''}`}
                      onClick={() => {
                        saveProcedureStep(normalizedId, i, !isComplete);
                        if (!isComplete && procedureSteps.filter(Boolean).length + 1 === content.procedure.steps.length) {
                          handleMarkComplete('procedure');
                        }
                      }}
                      aria-label={isComplete ? `Step ${i + 1} completed` : `Mark step ${i + 1} complete`}
                    >
                      {isComplete ? '✓' : i + 1}
                    </button>
                    <div className="exp-procedure-info">
                      <div className="exp-procedure-title">Step {i + 1}: {step.title}</div>
                      <div className="exp-procedure-action">{step.action}</div>
                      <div className="exp-procedure-ipo">
                        <div className="exp-procedure-ipo-item">
                          <div className="exp-procedure-ipo-label">Input</div>
                          <div className="exp-procedure-ipo-text">{step.input}</div>
                        </div>
                        <div className="exp-procedure-ipo-item">
                          <div className="exp-procedure-ipo-label">Process</div>
                          <div className="exp-procedure-ipo-text">{step.process}</div>
                        </div>
                        <div className="exp-procedure-ipo-item">
                          <div className="exp-procedure-ipo-label">Output</div>
                          <div className="exp-procedure-ipo-text">{step.output}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          )}

          {/* ═══ RESULTS ═══ */}
          {activeSection === "results" && (
          <section
            className="exp-section"
            ref={el => { sectionRefs.current.results = el; }}
            id="results"
          >
            <div className="exp-section-header">
              <div>
                <div className="exp-section-label">Section 05</div>
                <h2 className="exp-section-title">Results & Analysis</h2>
              </div>
              {!progress.results && (
                <button className="btn btn-ghost btn-sm exp-mark-complete" onClick={() => handleMarkComplete('results')}>
                  Mark Complete
                </button>
              )}
            </div>

            <p style={{ marginBottom: 'var(--space-4)' }}>After completing the experiment, students should observe the following:</p>

            <ul className="exp-results-observations">
              {content.results.observations.map((obs: string, i: number) => (
                <li key={i}>{obs}</li>
              ))}
            </ul>

            <div className="exp-results-insight">
              <div className="exp-results-insight-label">Key Insight</div>
              <p>{content.results.keyInsight}</p>
            </div>
          </section>

          )}

          {/* ═══ POSTTEST ═══ */}
          {activeSection === "posttest" && (
          <section
            className="exp-section"
            ref={el => { sectionRefs.current.posttest = el; }}
            id="posttest"
          >
            <div className="exp-section-header">
              <div>
                <div className="exp-section-label">Section 06</div>
                <h2 className="exp-section-title">Post-Test</h2>
              </div>
            </div>
            <Quiz
              key={`quiz-${normalizedId}-posttest`}
              quizId={`exp-${normalizedId}-posttest`}
              title={content.posttest.title}
              description={content.posttest.description}
              questions={content.posttest.questions}
              variant="posttest"
              onComplete={() => handleMarkComplete('posttest')}
            />
          </section>

          )}

          {/* ─── Next Experiment ─── */}
          {nextExp && (
            <Link to={`/experiment/${nextExp.id}`} className="exp-next">
              <div>

                <div className="exp-next-label">Next Experiment</div>
                <div className="exp-next-title">{String(nextExp.number).padStart(2, '0')}. {nextExp.shortTitle}</div>
              </div>
              <span className="exp-next-arrow">→</span>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
