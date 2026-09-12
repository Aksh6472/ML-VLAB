// src/components/Quiz.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { getMisconceptionDiagnosis } from '../data/misconceptions';
import './Quiz.css';

interface Question {
  q: string;
  options: string[];
  answer: number; // 0-indexed correct answer
}

interface QuizProps {
  quizId: string;
  title: string;
  description?: string;
  questions: Question[];
  variant?: 'pretest' | 'posttest';
  onComplete?: () => void;
}

const optionLetters = ['A', 'B', 'C', 'D'];

export default function Quiz({ quizId, title, description, questions, variant = 'pretest', onComplete }: QuizProps) {
  const { saveQuizResult, progress } = useProgress();
  const existingResult = progress.quizResults[quizId];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => {
    return existingResult?.answers && Array.isArray(existingResult.answers) && existingResult.answers.length === questions.length
      ? existingResult.answers
      : new Array(questions.length).fill(-1);
  });
  const [submitted, setSubmitted] = useState<boolean>(!!existingResult);
  const [showReview, setShowReview] = useState(false);
  const [showUnansweredPrompt, setShowUnansweredPrompt] = useState(false);

  // Sync if existing result loads from backend
  useEffect(() => {
    if (existingResult && !submitted) {
      if (existingResult.answers && Array.isArray(existingResult.answers)) {
        setAnswers(existingResult.answers);
      }
      setSubmitted(true);
    }
  }, [existingResult, submitted]);

  const answeredCount = answers.filter(a => a !== -1).length;
  const allAnswered = answeredCount === questions.length;
  const firstUnansweredIndex = answers.findIndex(a => a === -1);

  const score = answers.reduce((acc, ans, i) => {
    return acc + (ans === questions[i]?.answer ? 1 : 0);
  }, 0);

  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const handleSelect = useCallback((optionIndex: number) => {
    if (submitted) return;
    setShowUnansweredPrompt(false);
    setAnswers(prev => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  }, [current, submitted]);

  const executeSubmit = useCallback(() => {
    setShowUnansweredPrompt(false);
    setSubmitted(true);
    const finalScore = answers.reduce((acc, ans, i) => {
      return acc + (ans === questions[i]?.answer ? 1 : 0);
    }, 0);

    const result = {
      score: finalScore,
      total: questions.length,
      answers,
      submittedAt: new Date().toISOString(),
    };
    saveQuizResult(quizId, result);
    onComplete?.();
  }, [answers, questions, quizId, saveQuizResult, onComplete]);

  const handleSubmitClick = useCallback(() => {
    if (!allAnswered) {
      setShowUnansweredPrompt(true);
    } else {
      executeSubmit();
    }
  }, [allAnswered, executeSubmit]);

  const handleRetake = useCallback(() => {
    setAnswers(new Array(questions.length).fill(-1));
    setSubmitted(false);
    setShowReview(false);
    setShowUnansweredPrompt(false);
    setCurrent(0);
  }, [questions.length]);

  const q = questions[current];

  return (
    <div className="quiz">
      <div className="quiz-header">
        <h3 className="quiz-title">{title}</h3>
        {description && <p className="quiz-desc">{description}</p>}
      </div>

      {/* Results panel */}
      {submitted && !showReview && (
        <div className="quiz-results animate-fade-in-up">
          <div className="quiz-results-score">{score}/{questions.length}</div>
          <div className="quiz-results-label">
            {percent >= 80 ? '🌟 Excellent work!' : percent >= 60 ? '👍 Good effort!' : '📚 Keep practicing!'}
          </div>
          <div className="quiz-results-bar">
            <div
              className="quiz-results-bar-fill"
              style={{
                width: `${percent}%`,
                background: percent >= 80 ? 'var(--success)' : percent >= 60 ? 'var(--warning)' : 'var(--error)',
              }}
            />
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
            You scored {percent}% ({score} out of {questions.length} correct)
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowReview(true)}>
              Review Detailed Answers & AI Diagnosis
            </button>
            <button className="btn btn-secondary" onClick={handleRetake}>
              Retake Quiz
            </button>
          </div>
        </div>
      )}

      {/* Review mode */}
      {submitted && showReview && (
        <div className="animate-fade-in">
          <button className="btn btn-ghost" onClick={() => setShowReview(false)} style={{ marginBottom: 'var(--space-4)' }}>
            ← Back to Results
          </button>
          {questions.map((question, qi) => {
            const isCorrect = answers[qi] === question.answer;
            const isAnswered = answers[qi] >= 0;
            const selectedOpt = isAnswered ? question.options[answers[qi]] : 'Not answered';
            const correctOpt = question.options[question.answer];

            const expIdMatch = quizId.match(/exp-(\d+)/);
            const expId = expIdMatch ? expIdMatch[1] : undefined;

            const diagnosis = !isCorrect ? getMisconceptionDiagnosis({
              questionText: question.q,
              selectedOptionText: selectedOpt,
              correctOptionText: correctOpt,
              expId,
              questionIndex: qi,
            }) : null;

            return (
              <div
                key={qi}
                className={`quiz-review-item ${isCorrect ? 'quiz-review-item--correct' : 'quiz-review-item--incorrect'}`}
              >
                <div className="quiz-review-question">
                  <strong>Question {qi + 1}:</strong> {question.q}
                </div>
                <div className="quiz-review-answer">
                  Your answer: {answers[qi] >= 0 ? `${optionLetters[answers[qi]]} – ${question.options[answers[qi]]}` : '⚠️ Not answered'}
                  {!isCorrect && (
                    <div className="quiz-review-correct" style={{ marginTop: '4px' }}>
                      Correct answer: <strong>{optionLetters[question.answer]} – {question.options[question.answer]}</strong>
                    </div>
                  )}
                </div>

                {!isCorrect && diagnosis && (
                  <div className="misconception-diagnosis-box" style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(237, 137, 54, 0.08)',
                    border: '1px solid rgba(237, 137, 54, 0.25)',
                    borderLeft: '4px solid #ed8936',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    <div style={{ fontWeight: 700, color: '#c05621', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💡</span> <span>AI Misconception Diagnosis</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <strong>Misconception:</strong> {diagnosis.misconception}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <strong>Correct Concept:</strong> {diagnosis.correctConcept}
                    </div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span><strong>Recommended Revision:</strong> {diagnosis.recommendedRevision}</span>
                      {diagnosis.expId && (
                        <Link to={`/experiment/${diagnosis.expId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                          Go to Experiment →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-secondary" onClick={() => setShowReview(false)}>Back to Score</button>
            <button className="btn btn-ghost" onClick={handleRetake}>Retake Quiz</button>
          </div>
        </div>
      )}

      {/* Question view (not submitted) */}
      {!submitted && q && (
        <>
          {/* Question Pills Navigation */}
          <div className="quiz-pills-bar">
            <div className="quiz-pills-list">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== -1;
                const isCurrent = idx === current;
                return (
                  <button
                    key={idx}
                    className={`quiz-pill ${isCurrent ? 'quiz-pill--active' : ''} ${isAnswered ? 'quiz-pill--answered' : ''}`}
                    onClick={() => {
                      setCurrent(idx);
                      setShowUnansweredPrompt(false);
                    }}
                    title={`Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                  >
                    {idx + 1}
                    {isAnswered && <span className="quiz-pill-check">✓</span>}
                  </button>
                );
              })}
            </div>
            <span className="quiz-progress-text">
              {answeredCount} of {questions.length} answered
            </span>
          </div>

          <div className="quiz-question-card animate-fade-in" key={current}>
            <div className="quiz-question-number">Question {current + 1} of {questions.length}</div>
            <div className="quiz-question-text">{q.q}</div>
            <div className="quiz-options" role="radiogroup" aria-label={`Question ${current + 1} options`}>
              {q.options.map((option, oi) => (
                <button
                  key={oi}
                  type="button"
                  className={`quiz-option${answers[current] === oi ? ' quiz-option--selected' : ''}`}
                  onClick={() => handleSelect(oi)}
                  role="radio"
                  aria-checked={answers[current] === oi}
                >
                  <span className="quiz-option-indicator">{optionLetters[oi]}</span>
                  <span className="quiz-option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Unanswered Prompt Warning */}
          {showUnansweredPrompt && (
            <div className="quiz-warning-banner animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span>
                <span>
                  You have <strong>{questions.length - answeredCount}</strong> unanswered question(s).
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {firstUnansweredIndex !== -1 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setCurrent(firstUnansweredIndex);
                      setShowUnansweredPrompt(false);
                    }}
                  >
                    Go to Question {firstUnansweredIndex + 1}
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={executeSubmit}
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="quiz-nav">
            <button
              className="btn btn-ghost"
              disabled={current === 0}
              onClick={() => {
                setCurrent(c => c - 1);
                setShowUnansweredPrompt(false);
              }}
            >
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {current < questions.length - 1 ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setCurrent(c => c + 1);
                    setShowUnansweredPrompt(false);
                  }}
                >
                  Next →
                </button>
              ) : null}
              <button
                className="btn btn-primary"
                onClick={handleSubmitClick}
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
