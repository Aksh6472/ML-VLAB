import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { experiments } from '../../data/experiments';
import './CreateTest.css';
import './TeacherDashboard.css';

export interface MCQQuestion {
  id: string;
  expId: string;
  topic: string;
  difficulty: number;
  questionType?: 'MCQ' | 'TrueFalse' | 'ShortText';
  points?: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

const EXPERIMENT_TOPICS: Record<string, string[]> = {
  '1': ['Missing Value Imputation', 'One-Hot Encoding', 'Label Encoding', 'Standardisation (Z-Score)', 'Min-Max Scaling', 'Train-Test Split & Data Leakage'],
  '2': ['Simple Linear Regression', 'Ordinary Least Squares (OLS)', 'Mean Squared Error (MSE)', 'Root Mean Squared Error (RMSE)', 'R-Squared (R²)', 'Regression Intercept & Coefficients'],
  '3': ['K-Fold Cross-Validation', 'Stratified K-Fold', 'GridSearchCV Hyperparameter Tuning', 'Train-Val-Test Split Strategy', 'Overfitting vs Underfitting'],
  '4': ['Sigmoid Activation Function', 'Log-Odds & Decision Thresholds', 'Binary Cross-Entropy Loss', 'Confusion Matrix (TP, FP, TN, FN)', 'Precision, Recall & F1-Score'],
  '5': ['Eigenvalues & Eigenvectors', 'Covariance Matrix Calculation', 'Explained Variance Ratio', 'Dimensionality Reduction Projection', 'Cumulative Variance Scree Plot'],
  '6': ['Maximum Margin Hyperplane', 'Support Vectors Identification', 'Soft Margin & C Parameter', 'RBF & Polynomial Kernel Trick', 'Linear vs Non-Linear SVM'],
  '7': ['Within-Cluster Sum of Squares (Inertia)', 'Centroid Update Iterations', 'Elbow Method for K Selection', 'Euclidean Distance Metrics', 'K-Means Initialization Sensitivity'],
  '8': ['Gini Impurity Calculation', 'Entropy & Information Gain', 'Recursive Binary Tree Splitting', 'Pre-Pruning & Max Depth', 'Leaf Node Classification'],
  '9': ['Bootstrap Aggregation (Bagging)', 'Random Feature Selection Subset', 'Out-Of-Bag (OOB) Error', 'Ensemble Majority Voting', 'Feature Importance Score'],
  '10': ['Single-Layer Perceptron Architecture', 'Weighted Sum & Intercept Bias', 'Step Activation Function', 'Perceptron Learning Rule', 'Linear Separability Constraints']
};

export default function CreateTest() {
  const { id } = useParams<{ id?: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Test Config Details
  const [testTitle, setTestTitle] = useState('');
  const [classSection, setClassSection] = useState('');
  const [subjectCourse, setSubjectCourse] = useState('Machine Learning');
  const [description, setDescription] = useState('');
  const [timeLimitMins, setTimeLimitMins] = useState<number>(30);
  const [passingScorePercent, setPassingScorePercent] = useState<number>(60);
  const [dueDate, setDueDate] = useState('');
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [showScoreImmediately, setShowScoreImmediately] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Editor Form state
  const [selectedExp, setSelectedExp] = useState('1');
  const [selectedTopic, setSelectedTopic] = useState(EXPERIMENT_TOPICS['1'][0]);
  const [difficulty, setDifficulty] = useState<number>(5);
  const [questionType, setQuestionType] = useState<'MCQ' | 'TrueFalse' | 'ShortText'>('MCQ');
  const [points, setPoints] = useState<number>(1);

  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('A');

  const [loadingTest, setLoadingTest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch test details if editing an existing test
  useEffect(() => {
    if (id && token) {
      async function loadExistingTest() {
        try {
          setLoadingTest(true);
          const res = await fetch(`/api/teacher/tests/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const t = data.test;
            setTestTitle(t.title || '');
            setClassSection(t.classSection || '');
            setSubjectCourse(t.subjectCourse || 'Machine Learning');
            setDescription(t.description || '');
            setTimeLimitMins(t.timeLimitMins || 30);
            setPassingScorePercent(t.passingScorePercent || 60);
            setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
            setQuestions(t.questions || []);
            if (t.settings) {
              setRandomizeQuestions(Boolean(t.settings.randomizeQuestions));
              setShowScoreImmediately(Boolean(t.settings.showScoreImmediately));
            }
          }
        } catch (e) {
          setMessage({ type: 'error', text: 'Error loading existing test details.' });
        } finally {
          setLoadingTest(false);
        }
      }
      loadExistingTest();
    }
  }, [id, token]);

  // Update topics dropdown when experiment changes
  useEffect(() => {
    const topics = EXPERIMENT_TOPICS[selectedExp] || [];
    if (topics.length > 0) {
      setSelectedTopic(topics[0]);
    }
  }, [selectedExp]);

  // When questionType changes, pre-set appropriate options
  useEffect(() => {
    if (questionType === 'TrueFalse') {
      setOptionA('True');
      setOptionB('False');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer('A');
    } else if (questionType === 'ShortText') {
      setOptionA('Short Text Response');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer('A');
    }
  }, [questionType]);

  // AI MCQ Generator
  const handleAIGenerate = () => {
    setGenerating(true);
    setMessage(null);

    setTimeout(() => {
      const topicName = selectedTopic;

      let generatedQ = '';
      let optA = '';
      let optB = '';
      let optC = '';
      let optD = '';
      let correct = 'A';

      if (selectedExp === '1') {
        if (topicName.includes('Imputation')) {
          generatedQ = `In Experiment 01 (${topicName}), what is the primary risk of computing the mean for missing value imputation across the entire dataset before splitting into train and test sets?`;
          optA = 'Data leakage from test statistics into training phase';
          optB = 'Inability to encode categorical variables';
          optC = 'Automatic increase in feature dimensionality';
          optD = 'Complete failure of gradient descent convergence';
          correct = 'A';
        } else if (topicName.includes('Scaling')) {
          generatedQ = `When applying Min-Max Normalisation (Difficulty Level ${difficulty}/10), what is the exact formula used to scale feature X to the range [0, 1]?`;
          optA = '(X - mean) / std';
          optB = '(X - X_min) / (X_max - X_min)';
          optC = 'X / sum(X)';
          optD = 'log(X + 1)';
          correct = 'B';
        } else {
          generatedQ = `Why is One-Hot Encoding preferred over Label Encoding for non-ordinal categorical attributes like City or Color?`;
          optA = 'Label Encoding introduces artificial mathematical ordering (e.g. 2 > 1) where none exists';
          optB = 'One-Hot Encoding reduces the column count';
          optC = 'Label Encoding fails on numerical values';
          optD = 'One-Hot Encoding prevents decision tree execution';
          correct = 'A';
        }
      } else if (selectedExp === '2') {
        generatedQ = `In Linear Regression (${topicName}, Difficulty ${difficulty}/10), how does the Ordinary Least Squares (OLS) algorithm determine the optimal slope coefficient?`;
        optA = 'By minimising the sum of squared vertical residuals between actual and predicted target values';
        optB = 'By maximising the margin between support vectors';
        optC = 'By measuring Gini impurity reduction';
        optD = 'By picking random orthogonal principal components';
        correct = 'A';
      } else if (selectedExp === '3') {
        generatedQ = `Why is Stratified K-Fold Cross-Validation recommended over standard K-Fold for imbalanced classification tasks (${topicName})?`;
        optA = 'It guarantees that every fold maintains the same class distribution ratio as the original dataset';
        optB = 'It runs K times faster than standard cross-validation';
        optC = 'It removes all outliers automatically';
        optD = 'It eliminates the need for hyperparameter grid search';
        correct = 'A';
      } else if (selectedExp === '4') {
        generatedQ = `In Logistic Regression (${topicName}), what is the primary role of the Sigmoid activation function σ(z)?`;
        optA = 'To map any real-valued input score into a smooth probability value strictly between 0 and 1';
        optB = 'To convert continuous outputs into unbounded linear values';
        optC = 'To project data into infinite-dimensional Hilbert space';
        optD = 'To calculate cluster inertia WCSS';
        correct = 'A';
      } else if (selectedExp === '5') {
        generatedQ = `In Principal Component Analysis (${topicName}, Difficulty ${difficulty}/10), what geometric property defines the relationship between Principal Component 1 (PC1) and Principal Component 2 (PC2)?`;
        optA = 'They are strictly orthogonal (perpendicular at 90 degrees) to capture uncorrelated variance';
        optB = 'They are parallel lines in feature space';
        optC = 'They must share identical eigenvalues';
        optD = 'They are non-linear kernel curves';
        correct = 'A';
      } else if (selectedExp === '6') {
        generatedQ = `In Support Vector Machines (${topicName}), what defines the support vectors?`;
        optA = 'The training data points closest to the decision hyperplane that determine the boundary margin';
        optB = 'The centroid coordinates of each cluster';
        optC = 'The leaf nodes with zero Gini impurity';
        optD = 'The dummy variable indicators created by encoding';
        correct = 'A';
      } else if (selectedExp === '7') {
        generatedQ = `When using the Elbow Method in K-Means Clustering (${topicName}), how is the optimal number of clusters K identified on the plot?`;
        optA = 'By finding the point where the Within-Cluster Sum of Squares (Inertia) reduction sharply levels off';
        optB = 'Where accuracy reaches exactly 100%';
        optC = 'Where the decision boundary crosses zero';
        optD = 'At the maximum eigenvalue peak';
        correct = 'A';
      } else if (selectedExp === '8') {
        generatedQ = `In Decision Tree Classification (${topicName}), what is the Gini impurity value of a completely pure leaf node containing only one single class?`;
        optA = '0.0';
        optB = '0.5';
        optC = '1.0';
        optD = '-1.0';
        correct = 'A';
      } else if (selectedExp === '9') {
        generatedQ = `What key mechanism in Random Forest (${topicName}, Difficulty ${difficulty}/10) prevents individual decision trees from becoming highly correlated?`;
        optA = 'Considering only a random subset of m features (sqrt(p)) at each split node';
        optB = 'Using identical training data for every tree';
        optC = 'Setting learning rate to zero';
        optD = 'Applying min-max scaling to target outputs';
        correct = 'A';
      } else {
        generatedQ = `In Single-Layer Perceptron (${topicName}), what condition MUST be satisfied for the Perceptron Learning Algorithm to guarantee convergence?`;
        optA = 'The training dataset must be strictly linearly separable in feature space';
        optB = 'The dataset must contain continuous regression targets';
        optC = 'All features must be categorical';
        optD = 'The model must contain multiple hidden layers';
        correct = 'A';
      }

      setQuestionType('MCQ');
      setQuestionText(generatedQ);
      setOptionA(optA);
      setOptionB(optB);
      setOptionC(optC);
      setOptionD(optD);
      setCorrectAnswer(correct);

      setGenerating(false);
      setMessage({ type: 'success', text: `✨ AI generated 1 MCQ question for Exp ${selectedExp} (${topicName})! All fields are editable below.` });
    }, 400);
  };

  // Add or Update question
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setMessage({ type: 'error', text: 'Please enter question text.' });
      return;
    }

    if (questionType === 'MCQ') {
      if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
        setMessage({ type: 'error', text: 'Please fill in all four options for MCQ questions.' });
        return;
      }
    }

    const newQ: MCQQuestion = {
      id: editingIndex !== null ? questions[editingIndex].id : `q-${Date.now()}`,
      expId: selectedExp,
      topic: selectedTopic,
      difficulty,
      questionType,
      points: Number(points) || 1,
      question: questionText.trim(),
      optionA: questionType === 'TrueFalse' ? 'True' : questionType === 'ShortText' ? 'Short Answer' : optionA.trim(),
      optionB: questionType === 'TrueFalse' ? 'False' : optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer,
    };

    if (editingIndex !== null) {
      const updated = [...questions];
      updated[editingIndex] = newQ;
      setQuestions(updated);
      setEditingIndex(null);
      setMessage({ type: 'success', text: 'Question updated in list.' });
    } else {
      setQuestions([...questions, newQ]);
      setMessage({ type: 'success', text: 'Question added to test!' });
    }

    // Reset editor fields
    setQuestionText('');
    if (questionType === 'MCQ') {
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswer('A');
    }
  };

  const handleEditQuestion = (index: number) => {
    const q = questions[index];
    setEditingIndex(index);
    setSelectedExp(q.expId || '1');
    setSelectedTopic(q.topic || EXPERIMENT_TOPICS['1'][0]);
    setDifficulty(q.difficulty || 5);
    setQuestionType(q.questionType || 'MCQ');
    setPoints(q.points || 1);
    setQuestionText(q.question);
    setOptionA(q.optionA || '');
    setOptionB(q.optionB || '');
    setOptionC(q.optionC || '');
    setOptionD(q.optionD || '');
    setCorrectAnswer(q.correctAnswer || 'A');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...questions];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setQuestions(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setQuestions(updated);
  };

  // Submit test (Draft or Publish)
  const handleSaveTest = async (status: 'draft' | 'published') => {
    if (!testTitle.trim() || !classSection.trim()) {
      setMessage({ type: 'error', text: 'Please fill in Test Title and Class/Section.' });
      return;
    }

    if (questions.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one question to the test before saving.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/teacher/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: id ? Number(id) : undefined,
          title: testTitle.trim(),
          classSection: classSection.trim(),
          subjectCourse: subjectCourse.trim(),
          description: description.trim(),
          timeLimitMins: Number(timeLimitMins) || 30,
          passingScorePercent: Number(passingScorePercent) || 60,
          dueDate: dueDate || null,
          status,
          questions,
          settings: {
            randomizeQuestions,
            showScoreImmediately,
          }
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(status === 'published' ? '🎉 Test Published Successfully! Students will now see it under Assigned Tests.' : '💾 Draft Saved Successfully!');
        navigate('/teacher/tests');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save test.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error connecting to backend.' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingTest) {
    return (
      <div className="create-test-container">
        <div className="dash-empty-state">Loading test configuration…</div>
      </div>
    );
  }

  return (
    <div className="create-test-container animate-fade-in">
      <div className="teacher-header">
        <div>
          <div className="teacher-badge">Faculty Portal</div>
          <h1 className="dash-title">{id ? 'Edit Test Configuration' : 'Create New Assessment Test'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Configure test settings, passing parameters, and build questions manually or with instant AI generation.
          </p>
        </div>
        <Link to="/teacher/tests" className="btn btn-secondary">
          ← Back to Tests Manager
        </Link>
      </div>

      {message && (
        <div className={`test-alert test-alert--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* ─── Test Configuration Form ─── */}
      <div className="create-test-card">
        <h2 className="create-test-section-title">1. Test Settings & Information</h2>
        <div className="test-form-grid">
          <div className="test-form-group">
            <label className="test-label">Test Title *</label>
            <input
              type="text"
              className="test-input"
              placeholder="e.g. Mid-Term Machine Learning Evaluation"
              value={testTitle}
              onChange={e => setTestTitle(e.target.value)}
            />
          </div>

          <div className="test-form-group">
            <label className="test-label">Class / Batch *</label>
            <input
              type="text"
              className="test-input"
              placeholder="e.g. CSE AI-ML Batch A"
              value={classSection}
              onChange={e => setClassSection(e.target.value)}
            />
          </div>

          <div className="test-form-group">
            <label className="test-label">Subject / Course</label>
            <input
              type="text"
              className="test-input"
              placeholder="e.g. Machine Learning (18CSC305J)"
              value={subjectCourse}
              onChange={e => setSubjectCourse(e.target.value)}
            />
          </div>

          <div className="test-form-group">
            <label className="test-label">Time Limit (Minutes)</label>
            <input
              type="number"
              min="5"
              max="180"
              className="test-input"
              value={timeLimitMins}
              onChange={e => setTimeLimitMins(Number(e.target.value))}
            />
          </div>

          <div className="test-form-group">
            <label className="test-label">Passing Score (%)</label>
            <input
              type="number"
              min="10"
              max="100"
              className="test-input"
              value={passingScorePercent}
              onChange={e => setPassingScorePercent(Number(e.target.value))}
            />
          </div>

          <div className="test-form-group">
            <label className="test-label">Due Date (Optional)</label>
            <input
              type="date"
              className="test-input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <div className="test-form-group" style={{ gridColumn: 'span 2' }}>
            <label className="test-label">Description / Instructions</label>
            <textarea
              className="test-textarea"
              placeholder="Provide test guidelines or overview for students..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="test-form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'center', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={e => setRandomizeQuestions(e.target.checked)}
              />
              <span>🔀 Randomize question order for students</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
              <input
                type="checkbox"
                checked={showScoreImmediately}
                onChange={e => setShowScoreImmediately(e.target.checked)}
              />
              <span>📊 Display score immediately after submission</span>
            </label>
          </div>
        </div>
      </div>

      {/* ─── Question Builder Section ─── */}
      <div className="create-test-card">
        <div className="builder-header">
          <h2 className="create-test-section-title" style={{ margin: 0 }}>
            2. Question Builder {editingIndex !== null && <span className="editing-badge">(Editing Question #{editingIndex + 1})</span>}
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAIGenerate}
            disabled={generating}
          >
            {generating ? '✨ Generating...' : '✨ AI Generate Question'}
          </button>
        </div>

        {/* Experiment, Topic, Question Format & Difficulty */}
        <div className="builder-meta-bar">
          <div className="test-form-group">
            <label className="test-label">Experiment Module</label>
            <select
              className="test-select"
              value={selectedExp}
              onChange={e => setSelectedExp(e.target.value)}
            >
              {experiments.map(exp => (
                <option key={exp.id} value={exp.id}>
                  Exp {String(exp.number).padStart(2, '0')}: {exp.shortTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="test-form-group">
            <label className="test-label">Module Topic</label>
            <select
              className="test-select"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
            >
              {(EXPERIMENT_TOPICS[selectedExp] || []).map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          <div className="test-form-group">
            <label className="test-label">Question Type</label>
            <select
              className="test-select"
              value={questionType}
              onChange={e => setQuestionType(e.target.value as any)}
            >
              <option value="MCQ">Multiple Choice (MCQ)</option>
              <option value="TrueFalse">True / False</option>
              <option value="ShortText">Short Answer Text</option>
            </select>
          </div>

          <div className="test-form-group">
            <label className="test-label">Difficulty & Marks</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="range"
                min="1"
                max="10"
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="difficulty-slider"
                style={{ flexGrow: 1 }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', minWidth: '45px' }}>Diff {difficulty}</span>
              <input
                type="number"
                min="1"
                max="10"
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                className="test-input"
                style={{ width: '60px', padding: '4px 8px' }}
                title="Assigned Marks"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>pt{points > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Question & Options Form */}
        <form onSubmit={handleSaveQuestion} className="question-editor-form">
          <div className="test-form-group">
            <label className="test-label">Question Text *</label>
            <textarea
              className="test-textarea"
              placeholder="Type your question prompt or click AI Generate..."
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              rows={3}
            />
          </div>

          {questionType === 'MCQ' && (
            <div className="options-grid">
              <div className={`option-input-wrap ${correctAnswer === 'A' ? 'is-correct' : ''}`}>
                <label className="option-label">Option A</label>
                <input
                  type="text"
                  className="test-input"
                  placeholder="Option A text"
                  value={optionA}
                  onChange={e => setOptionA(e.target.value)}
                />
              </div>

              <div className={`option-input-wrap ${correctAnswer === 'B' ? 'is-correct' : ''}`}>
                <label className="option-label">Option B</label>
                <input
                  type="text"
                  className="test-input"
                  placeholder="Option B text"
                  value={optionB}
                  onChange={e => setOptionB(e.target.value)}
                />
              </div>

              <div className={`option-input-wrap ${correctAnswer === 'C' ? 'is-correct' : ''}`}>
                <label className="option-label">Option C</label>
                <input
                  type="text"
                  className="test-input"
                  placeholder="Option C text"
                  value={optionC}
                  onChange={e => setOptionC(e.target.value)}
                />
              </div>

              <div className={`option-input-wrap ${correctAnswer === 'D' ? 'is-correct' : ''}`}>
                <label className="option-label">Option D</label>
                <input
                  type="text"
                  className="test-input"
                  placeholder="Option D text"
                  value={optionD}
                  onChange={e => setOptionD(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="correct-answer-selector">
            <label className="test-label" style={{ margin: 0 }}>Correct Answer Key:</label>
            {questionType === 'MCQ' ? (
              <div style={{ display: 'flex', gap: '16px' }}>
                {(['A', 'B', 'C', 'D'] as const).map(letter => (
                  <label key={letter} className="correct-radio-label">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === letter}
                      onChange={() => setCorrectAnswer(letter)}
                    />
                    <span>Option {letter}</span>
                  </label>
                ))}
              </div>
            ) : questionType === 'TrueFalse' ? (
              <div style={{ display: 'flex', gap: '16px' }}>
                <label className="correct-radio-label">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === 'A'}
                    onChange={() => setCorrectAnswer('A')}
                  />
                  <span>True</span>
                </label>
                <label className="correct-radio-label">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === 'B'}
                    onChange={() => setCorrectAnswer('B')}
                  />
                  <span>False</span>
                </label>
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Short answer questions will be evaluated against student response submission.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            {editingIndex !== null && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingIndex(null);
                  setQuestionText('');
                  setOptionA('');
                  setOptionB('');
                  setOptionC('');
                  setOptionD('');
                }}
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingIndex !== null ? '✓ Save Question Changes' : '➕ Add Question to Test'}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Question List Below Editor ─── */}
      <div className="create-test-card">
        <h2 className="create-test-section-title">
          3. Test Questions ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <div className="dash-empty-state">
            No questions added yet. Use the Question Builder above or click "AI Generate Question" to add questions.
          </div>
        ) : (
          <div className="questions-list">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="question-item-card">
                <div className="question-item-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="q-number-badge">Q{idx + 1}</span>
                    <span className="badge badge-navy">Exp {q.expId}</span>
                    <span className="q-topic-badge">{q.topic}</span>
                    <span className="q-diff-badge">Type: {q.questionType || 'MCQ'}</span>
                    <span className="q-diff-badge">Diff: {q.difficulty || 5}/10</span>
                    <span className="q-diff-badge" style={{ background: 'rgba(56,161,105,0.15)', color: '#38a169' }}>{q.points || 1} Pt{(q.points || 1) > 1 ? 's' : ''}</span>
                  </div>
                  <div className="q-item-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      title="Move Up"
                    >
                      ▲ Up
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === questions.length - 1}
                      title="Move Down"
                    >
                      ▼ Down
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditQuestion(idx)}
                    >
                      ✏ Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#e53e3e' }}
                      onClick={() => handleDeleteQuestion(idx)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                <div className="q-item-text">{q.question}</div>

                {q.questionType !== 'ShortText' && (
                  <div className="q-item-options-grid">
                    <div className={`q-item-option ${q.correctAnswer === 'A' ? 'is-correct' : ''}`}>
                      <strong>A.</strong> {q.optionA || 'True'}
                    </div>
                    <div className={`q-item-option ${q.correctAnswer === 'B' ? 'is-correct' : ''}`}>
                      <strong>B.</strong> {q.optionB || 'False'}
                    </div>
                    {q.optionC && (
                      <div className={`q-item-option ${q.correctAnswer === 'C' ? 'is-correct' : ''}`}>
                        <strong>C.</strong> {q.optionC}
                      </div>
                    )}
                    {q.optionD && (
                      <div className={`q-item-option ${q.correctAnswer === 'D' ? 'is-correct' : ''}`}>
                        <strong>D.</strong> {q.optionD}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Test Action Buttons Bar ─── */}
      <div className="test-action-bar">
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Total Questions: <strong>{questions.length}</strong> · Total Marks: <strong>{questions.reduce((acc, q) => acc + (q.points || 1), 0)}</strong>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={() => handleSaveTest('draft')}
          >
            💾 Save as Draft
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || questions.length === 0}
            onClick={() => handleSaveTest('published')}
            style={{ background: '#38a169', borderColor: '#38a169' }}
          >
            🚀 Publish Test
          </button>
        </div>
      </div>
    </div>
  );
}
