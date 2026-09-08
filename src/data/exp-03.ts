// src/data/exp-03.ts
export const exp03 = {
  id: '3',
  title: 'Cross-Validation for Model Evaluation',
  aim: 'To evaluate model generalization performance reliably using K-Fold and Stratified K-Fold cross-validation techniques.',
  learningObjectives: [
    'Understand the limitation of a single train-test split',
    'Implement K-Fold Cross-Validation',
    'Implement Stratified K-Fold for imbalanced datasets',
    'Compare performance across multiple folds',
  ],
  theory: [
    {
      id: 'intro',
      title: '4.1 Why Cross-Validation?',
      type: 'text',
      content: 'A single **train-test split** might produce a test set that is unrepresentative, leading to a biased error estimate. **Cross-Validation** mitigates this by partitioning the dataset into multiple **folds** to evaluate performance consistently.',
      codeExample: {
        title: 'K-Fold Cross-Validation',
        code: `from sklearn.model_selection import cross_val_score, KFold
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)
kf = KFold(n_splits=5, shuffle=True, random_state=42)
model = LogisticRegression(max_iter=200)

scores = cross_val_score(model, X, y, cv=kf)
print(f"Scores: {scores}")
print(f"Mean Accuracy: {scores.mean():.4f}")`,
        explanation: [
          'KFold splits the data into 5 consecutive folds.',
          'cross_val_score automatically trains the model 5 times, using 4 folds for training and 1 fold for testing each time.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your understanding of model evaluation.',
    questions: [
      { q: 'In 5-fold cross-validation, what percentage of data is used for testing in each iteration?', options: ['10%', '20%', '25%', '50%'], answer: 1 },
      { q: 'What is the main advantage of Stratified K-Fold over standard K-Fold?', options: ['It is faster', 'It requires less memory', 'It preserves the percentage of samples for each class', 'It randomly removes outliers'], answer: 2 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Load Data', action: 'Load a dataset.', input: 'Dataset', process: 'Load into memory', output: 'X, y' },
      { title: 'Initialize Model', action: 'Choose an algorithm.', input: 'None', process: 'Instantiate model', output: 'Model object' },
      { title: 'Configure CV', action: 'Set up KFold or StratifiedKFold.', input: 'Number of splits', process: 'Instantiate CV object', output: 'CV strategy' },
      { title: 'Run Cross-Validation', action: 'Compute cross-validated scores.', input: 'Model, Data, CV', process: 'cross_val_score()', output: 'Array of scores' },
    ],
    inputProcessOutput: {
      input: 'Dataset and an untrained model.',
      process: 'Repeated training and evaluation across folds.',
      output: 'Robust estimate of model accuracy (mean and standard deviation).',
    }
  },
  results: {
    observations: [
      'The accuracy varies slightly across different folds.',
      'The mean cross-validation score provides a more reliable estimate of how the model will perform on unseen data.',
    ],
    keyInsight: 'Cross-validation provides a variance estimate of the model performance, which helps detect overfitting when tuning hyperparameters.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of cross-validation.',
    questions: [
      { q: 'When is Leave-One-Out Cross-Validation (LOOCV) typically used?', options: ['Very large datasets', 'Very small datasets', 'Image classification', 'Deep learning'], answer: 1 },
      { q: 'If K=10 in K-Fold CV, how many times is the model trained?', options: ['1', '9', '10', '100'], answer: 2 },
    ],
  }
};
