import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProgress } from '../../context/ProgressContext';
import { experiments } from '../../data/experiments';
import { getMisconceptionDiagnosis } from '../../data/misconceptions';
import './FinalTest.css';

interface Question {
  id: number;
  expId: string;
  topicTitle: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

const FINAL_TEST_QUESTIONS: Question[] = [
  // Exp 1: Data Pre-processing
  {
    id: 1,
    expId: '1',
    topicTitle: 'Data Pre-processing',
    question: 'Which technique is used to scale features so they have a mean of 0 and standard deviation of 1?',
    options: ['Min-Max Scaling', 'Standardization (Z-score scaling)', 'One-Hot Encoding', 'Label Encoding'],
    correctAnswer: 1,
  },
  {
    id: 2,
    expId: '1',
    topicTitle: 'Data Pre-processing',
    question: 'What occurs when information from outside the training dataset is used to create the model?',
    options: ['Underfitting', 'Data Leakage', 'Overfitting', 'Centroid Drift'],
    correctAnswer: 1,
  },
  {
    id: 3,
    expId: '1',
    topicTitle: 'Data Pre-processing',
    question: 'Which encoding scheme creates binary columns for each categorical category without imposing ordinal rank?',
    options: ['Label Encoding', 'Target Encoding', 'One-Hot Encoding', 'Polynomial Features'],
    correctAnswer: 2,
  },

  // Exp 2: Linear Regression
  {
    id: 4,
    expId: '2',
    topicTitle: 'Linear Regression',
    question: 'What mathematical method minimizes the sum of squared residuals in Ordinary Least Squares (OLS) regression?',
    options: ['Gradient Boosting', 'Least Squares Method', 'Maximum Margin', 'K-Nearest Neighbors'],
    correctAnswer: 1,
  },
  {
    id: 5,
    expId: '2',
    topicTitle: 'Linear Regression',
    question: 'An R-squared (R²) value of 0.85 indicates that:',
    options: [
      '85% of variance in the target variable is explained by the model',
      'The model makes 85% incorrect predictions',
      '85% of the data points lie directly on the regression line',
      'The mean absolute error is 0.85'
    ],
    correctAnswer: 0,
  },
  {
    id: 6,
    expId: '2',
    topicTitle: 'Linear Regression',
    question: 'Which evaluation metric heavily penalizes larger errors because errors are squared before averaging?',
    options: ['Mean Absolute Error (MAE)', 'Mean Squared Error (MSE)', 'R-squared (R²)', 'Accuracy Score'],
    correctAnswer: 1,
  },

  // Exp 3: Cross-Validation
  {
    id: 7,
    expId: '3',
    topicTitle: 'Cross-Validation',
    question: 'Why is Stratified K-Fold cross-validation preferred over standard K-Fold for imbalanced classification tasks?',
    options: [
      'It speeds up model training',
      'It maintains the original class percentage ratio in each fold',
      'It eliminates the need for test sets',
      'It automatically removes outliers'
    ],
    correctAnswer: 1,
  },
  {
    id: 8,
    expId: '3',
    topicTitle: 'Cross-Validation',
    question: 'In 5-Fold Cross-Validation, what percentage of the dataset is used for validation in each iteration?',
    options: ['10%', '20%', '50%', '80%'],
    correctAnswer: 1,
  },
  {
    id: 9,
    expId: '3',
    topicTitle: 'Cross-Validation',
    question: 'What is the primary purpose of cross-validation in machine learning?',
    options: [
      'To increase training speed',
      'To evaluate model generalization performance reliably',
      'To encode categorical text columns',
      'To reduce feature dimensionality'
    ],
    correctAnswer: 1,
  },

  // Exp 4: Logistic Regression
  {
    id: 10,
    expId: '4',
    topicTitle: 'Logistic Regression',
    question: 'Which activation function maps real-valued numbers into a probability range between 0 and 1?',
    options: ['ReLU', 'Sigmoid', 'Softmax', 'Tanh'],
    correctAnswer: 1,
  },
  {
    id: 11,
    expId: '4',
    topicTitle: 'Logistic Regression',
    question: 'In a confusion matrix, what is Recall (Sensitivity)?',
    options: [
      'TP / (TP + FP)',
      'TP / (TP + FN)',
      '(TP + TN) / Total',
      'TN / (TN + FP)'
    ],
    correctAnswer: 1,
  },
  {
    id: 12,
    expId: '4',
    topicTitle: 'Logistic Regression',
    question: 'What loss function is standard for training binary Logistic Regression?',
    options: ['Mean Squared Error', 'Binary Cross-Entropy (Log Loss)', 'Hinge Loss', 'Huber Loss'],
    correctAnswer: 1,
  },

  // Exp 5: PCA
  {
    id: 13,
    expId: '5',
    topicTitle: 'PCA (Dimensionality Reduction)',
    question: 'What do the principal components in PCA correspond to mathematically?',
    options: [
      'Eigenvectors of the data covariance matrix',
      'Centroids of K clusters',
      'Leaf nodes in a decision tree',
      'Support vectors on the decision margin'
    ],
    correctAnswer: 0,
  },
  {
    id: 14,
    expId: '5',
    topicTitle: 'PCA (Dimensionality Reduction)',
    question: 'Why must features be standardized before applying PCA?',
    options: [
      'To prevent high-variance features from dominating principal component direction',
      'To convert categorical features into numeric vectors',
      'To guarantee non-negative eigenvalues',
      'To remove missing rows'
    ],
    correctAnswer: 0,
  },
  {
    id: 15,
    expId: '5',
    topicTitle: 'PCA (Dimensionality Reduction)',
    question: 'What is the Explained Variance Ratio in PCA?',
    options: [
      'The percentage of total data variance captured by each principal component',
      'The ratio of true positives to false positives',
      'The sum of squared residuals',
      'The learning rate multiplier'
    ],
    correctAnswer: 0,
  },

  // Exp 6: SVM
  {
    id: 16,
    expId: '6',
    topicTitle: 'Support Vector Machines',
    question: 'What are Support Vectors in an SVM model?',
    options: [
      'The data points lying closest to the decision boundary margin',
      'The center points of predicted clusters',
      'Outliers removed during data cleaning',
      'Random decision tree splits'
    ],
    correctAnswer: 0,
  },
  {
    id: 17,
    expId: '6',
    topicTitle: 'Support Vector Machines',
    question: 'What purpose does the Kernel Trick serve in SVMs?',
    options: [
      'Maps input features into higher-dimensional space to solve non-linear separation',
      'Scales target output to a 0-1 probability',
      'Imputes missing target values',
      'Performs cross-validation automatically'
    ],
    correctAnswer: 0,
  },
  {
    id: 18,
    expId: '6',
    topicTitle: 'Support Vector Machines',
    question: 'What does the hyperparameter C control in SVM classification?',
    options: [
      'The number of trees in the forest',
      'The trade-off between margin width and misclassification penalty',
      'The number of principal components',
      'The batch size'
    ],
    correctAnswer: 1,
  },

  // Exp 7: K-Means
  {
    id: 19,
    expId: '7',
    topicTitle: 'K-Means Clustering',
    question: 'K-Means is an example of which category of Machine Learning?',
    options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Semi-supervised Learning'],
    correctAnswer: 1,
  },
  {
    id: 20,
    expId: '7',
    topicTitle: 'K-Means Clustering',
    question: 'Which method plots Within-Cluster Sum of Squares (WCSS) against K to find the optimal cluster count?',
    options: ['Scree Plot', 'Elbow Method', 'ROC Curve', 'Confusion Matrix'],
    correctAnswer: 1,
  },
  {
    id: 21,
    expId: '7',
    topicTitle: 'K-Means Clustering',
    question: 'How are cluster centroids updated during K-Means iterations?',
    options: [
      'By taking the mean coordinates of all data points assigned to that cluster',
      'By taking the maximum distance point',
      'By calculating gradient descent steps on target labels',
      'By randomly picking new points from the dataset'
    ],
    correctAnswer: 0,
  },

  // Exp 8: Decision Tree
  {
    id: 22,
    expId: '8',
    topicTitle: 'Decision Trees',
    question: 'Which metric measures node purity in Decision Trees, where 0 indicates perfect purity?',
    options: ['Gini Impurity', 'Standard Error', 'Silhouette Score', 'Log Loss'],
    correctAnswer: 0,
  },
  {
    id: 23,
    expId: '8',
    topicTitle: 'Decision Trees',
    question: 'What technique restricts tree depth or prunes branches to prevent overfitting in Decision Trees?',
    options: ['Hyperparameter tuning like max_depth / min_samples_split', 'One-Hot Encoding', 'Standardization', 'Softmax Activation'],
    correctAnswer: 0,
  },
  {
    id: 24,
    expId: '8',
    topicTitle: 'Decision Trees',
    question: 'What happens to Information Gain when an attribute split creates highly pure child nodes?',
    options: ['Information Gain increases', 'Information Gain decreases to negative', 'Information Gain becomes zero', 'Information Gain is unaffected'],
    correctAnswer: 0,
  },

  // Exp 9: Random Forest
  {
    id: 25,
    expId: '9',
    topicTitle: 'Random Forest',
    question: 'Random Forest is an ensemble technique based on which principle?',
    options: ['Boosting', 'Bagging (Bootstrap Aggregating)', 'Stacking', 'Dimensionality Reduction'],
    correctAnswer: 1,
  },
  {
    id: 26,
    expId: '9',
    topicTitle: 'Random Forest',
    question: 'How does Random Forest introduce decorrelation among its individual trees?',
    options: [
      'By using random subsets of features at each split',
      'By setting learning rate to 0.01',
      'By running K-Means on features first',
      'By forcing all trees to have depth 1'
    ],
    correctAnswer: 0,
  },
  {
    id: 27,
    expId: '9',
    topicTitle: 'Random Forest',
    question: 'What is out-of-bag (OOB) error in Random Forest?',
    options: [
      'Validation error measured on data samples excluded from bootstrap samples',
      'Error caused by missing feature values',
      'Error when memory exceeds system limits',
      'Test error on non-normalized features'
    ],
    correctAnswer: 0,
  },

  // Exp 10: Perceptron / ANN
  {
    id: 28,
    expId: '10',
    topicTitle: 'Artificial Neural Networks',
    question: 'What is the fundamental building block of an Artificial Neural Network that computes a weighted sum of inputs?',
    options: ['Perceptron / Neuron', 'Decision Node', 'Centroid', 'Principal Vector'],
    correctAnswer: 0,
  },
  {
    id: 29,
    expId: '10',
    topicTitle: 'Artificial Neural Networks',
    question: 'What limitation prevents a single-layer Perceptron from classifying non-linearly separable problems (like XOR)?',
    options: [
      'Linear decision boundary restriction',
      'Inability to compute floating point operations',
      'Lack of feature scaling',
      'Too many hidden layers'
    ],
    correctAnswer: 0,
  },
  {
    id: 30,
    expId: '10',
    topicTitle: 'Artificial Neural Networks',
    question: 'During Perceptron learning, when is a weight update triggered for input vector X with target Y and prediction Y_hat?',
    options: [
      'When prediction Y_hat differs from target label Y',
      'At every epoch regardless of accuracy',
      'Only when learning rate is 1.0',
      'When inputs are negative'
    ],
    correctAnswer: 0,
  },
];

export default function FinalTest() {
  const navigate = useNavigate();
  const { isFinalTestUnlocked, saveQuizResult } = useProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Guard check: if final test is locked, redirect to student dashboard
  if (!isFinalTestUnlocked()) {
    return (
      <div className="final-test-container animate-fade-in">
        <div className="final-test-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2>Final Assessment Locked</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>
            You must complete all 10 experiments in the ML Virtual Lab before taking the Final ML Assessment.
          </p>
          <Link to="/student/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = FINAL_TEST_QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / FINAL_TEST_QUESTIONS.length) * 100);

  const handleSelectOption = (optionIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentIndex < FINAL_TEST_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);

    let score = 0;
    FINAL_TEST_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    // Record quiz result
    const answersArray = FINAL_TEST_QUESTIONS.map(q => answers[q.id] ?? -1);
    saveQuizResult('final-ml-assessment', {
      score,
      total: FINAL_TEST_QUESTIONS.length,
      answers: answersArray,
      submittedAt: new Date().toISOString(),
    });
  };

  if (isSubmitted) {
    let totalScore = 0;
    const topicStats: Record<string, { expId: string; title: string; correct: number; total: number }> = {};

    experiments.forEach(exp => {
      topicStats[exp.id] = {
        expId: exp.id,
        title: exp.shortTitle,
        correct: 0,
        total: 0,
      };
    });

    FINAL_TEST_QUESTIONS.forEach(q => {
      const isCorrect = answers[q.id] === q.correctAnswer;
      if (isCorrect) totalScore++;

      if (topicStats[q.expId]) {
        topicStats[q.expId].total += 1;
        if (isCorrect) topicStats[q.expId].correct += 1;
      }
    });

    const scorePct = Math.round((totalScore / FINAL_TEST_QUESTIONS.length) * 100);

    // Identify Strongest & Weakest topics
    const topicList = Object.values(topicStats);
    topicList.sort((a, b) => {
      const pctA = a.total > 0 ? a.correct / a.total : 0;
      const pctB = b.total > 0 ? b.correct / b.total : 0;
      return pctB - pctA;
    });

    const strongestTopic = topicList[0];
    const weakestTopic = topicList[topicList.length - 1];

    const weakestExpMeta = experiments.find(e => e.id === weakestTopic.expId);

    return (
      <div className="final-test-container animate-fade-in">
        <div className="final-test-header" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="final-test-badge">Assessment Completed</div>
          <h1 className="dash-title">Final ML Assessment Results</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Comprehensive evaluation across all 10 ML Virtual Lab experiments.
          </p>
        </div>

        <div className="results-summary-card">
          <h2>Your Performance Summary</h2>
          <div className="results-score-display">
            <div className="results-score-badge">{scorePct}%</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {totalScore} out of {FINAL_TEST_QUESTIONS.length} Questions Correct
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                {scorePct >= 80 ? '🎉 Outstanding mastery of Machine Learning concepts!' : scorePct >= 60 ? '👍 Solid foundational understanding. Review targeted topics below.' : '📖 Additional review recommended to solidify core principles.'}
              </div>
            </div>
          </div>

          {/* Smart Revision Recommendation */}
          {weakestTopic && weakestExpMeta && (
            <div className="revision-recommendation-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <h3 style={{ margin: 0 }}>Recommended Revision: {weakestTopic.title}</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 16px' }}>
                Based on your test results, your score in <strong>{weakestExpMeta.title}</strong> was ({weakestTopic.correct}/{weakestTopic.total}). We recommend reviewing this experiment to reinforce your mastery.
              </p>
              <Link to={`/experiment/${weakestExpMeta.id}`} className="btn btn-primary" style={{ background: '#dd6b20', border: 'none' }}>
                Go to Experiment →
              </Link>
            </div>
          )}

          {/* Topic Breakdown */}
          <h3 style={{ fontSize: '16px', marginTop: '28px', marginBottom: '12px' }}>Topic-Wise Breakdown</h3>
          <div className="topic-breakdown-grid">
            {topicList.map(t => {
              const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
              const isStrong = t.expId === strongestTopic.expId;
              const isWeak = t.expId === weakestTopic.expId;

              return (
                <div key={t.expId} className="topic-breakdown-item" style={{ borderLeft: isWeak ? '3px solid #dd6b20' : isStrong ? '3px solid #38a169' : '1px solid var(--border-primary)' }}>
                  <div className="topic-breakdown-header">
                    <span>Exp {t.expId}: {t.title}</span>
                    <span style={{ color: pct >= 67 ? '#38a169' : '#dd6b20' }}>{t.correct}/{t.total} ({pct}%)</span>
                  </div>
                  <div className="final-test-progress-bar" style={{ margin: '6px 0 4px', height: '4px' }}>
                    <div className="final-test-progress-fill" style={{ width: `${pct}%`, background: pct >= 67 ? '#38a169' : '#dd6b20' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Misconception Diagnosis for Incorrect Answers */}
          <h3 style={{ fontSize: '16px', marginTop: '28px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span> <span>AI Misconception Diagnoses ({FINAL_TEST_QUESTIONS.filter(q => answers[q.id] !== q.correctAnswer).length} Incorrect)</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FINAL_TEST_QUESTIONS.filter(q => answers[q.id] !== q.correctAnswer).map((q) => {
              const userAnsIdx = answers[q.id];
              const selectedOpt = userAnsIdx !== undefined ? q.options[userAnsIdx] : 'Not answered';
              const correctOpt = q.options[q.correctAnswer];
              const diag = getMisconceptionDiagnosis({
                questionText: q.question,
                selectedOptionText: selectedOpt,
                correctOptionText: correctOpt,
                expId: q.expId,
                topicTitle: q.topicTitle,
              });

              return (
                <div key={q.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    Question {q.id} · Exp {q.expId}: {q.topicTitle}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {q.question}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--error, #e53e3e)', marginBottom: '4px' }}>
                    Your answer: <strong>{selectedOpt}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--success, #38a169)', marginBottom: '12px' }}>
                    Correct answer: <strong>{correctOpt}</strong>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(237, 137, 54, 0.08)',
                    border: '1px solid rgba(237, 137, 54, 0.25)',
                    borderLeft: '4px solid #ed8936',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    <div style={{ fontWeight: 700, color: '#c05621', marginBottom: '4px' }}>
                      💡 AI Misconception Diagnosis
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                      <strong>Misconception:</strong> {diag.misconception}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <strong>Correct Concept:</strong> {diag.correctConcept}
                    </div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span><strong>Recommended Revision:</strong> {diag.recommendedRevision}</span>
                      <Link to={`/experiment/${q.expId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                        Go to Experiment →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button className="btn btn-secondary" onClick={() => { setIsSubmitted(false); setCurrentIndex(0); setAnswers({}); }}>
              Retake Final Test
            </button>
            <Link to="/student/dashboard" className="btn btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="final-test-container animate-fade-in">
      <div className="final-test-header" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="final-test-badge">Final Assessment</div>
            <h1 className="dash-title" style={{ fontSize: '22px' }}>Machine Learning Mastery Test</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Question {currentIndex + 1} of {FINAL_TEST_QUESTIONS.length}
            </span>
          </div>
        </div>

        <div className="final-test-progress-bar">
          <div className="final-test-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="final-test-card">
        <div className="final-test-question-num">
          Exp {currentQ.expId} <span className="final-test-topic-tag">{currentQ.topicTitle}</span>
        </div>
        <h2 className="final-test-question-text">{currentQ.question}</h2>

        <div className="final-test-options">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentQ.id] === idx;
            return (
              <button
                key={idx}
                className={`final-test-option-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectOption(idx)}
              >
                <div className="final-test-option-radio">
                  {isSelected && <div className="final-test-option-radio-dot" />}
                </div>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="final-test-nav">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>

          {currentIndex === FINAL_TEST_QUESTIONS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < FINAL_TEST_QUESTIONS.length && !window.confirm('You have unanswered questions. Are you sure you want to submit?')}
              style={{ background: 'var(--success, #38a169)' }}
            >
              Submit Assessment ✓
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNext}
            >
              Next Question →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
