// src/data/exp-04.ts
export const exp04 = {
  id: '4',
  title: 'Logistic Regression for Binary Classification',
  aim: 'To apply the logistic regression algorithm to classify data into two discrete categories, understanding the sigmoid function and interpreting confusion matrix metrics.',
  learningObjectives: [
    'Understand the sigmoid function and probability mapping',
    'Train a Logistic Regression model for binary classification',
    'Interpret accuracy, precision, recall, and F1-score',
    'Analyze a confusion matrix',
  ],
  theory: [
    {
      id: 'intro',
      title: '5.1 Introduction to Logistic Regression',
      type: 'text',
      visualizationId: 'logistic-regression',
      content: 'While linear regression predicts continuous values, **logistic regression** predicts the probability of a discrete outcome in **binary classification** problems using the **sigmoid function**.',
      formulas: [
        {
          name: 'Sigmoid Function',
          latex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}',
          description: 'Maps any real-valued number into the range [0, 1], representing a probability.',
        }
      ],
      codeExample: {
        title: 'Logistic Regression & Confusion Matrix',
        code: `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, classification_report
import numpy as np

# Binary classification data
X_train = np.array([[1.5], [2.0], [4.5], [5.0]])
y_train = np.array([0, 0, 1, 1])
X_test = np.array([[1.0], [3.5]])
y_test = np.array([0, 1])

model = LogisticRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("Confusion Matrix:\\n", confusion_matrix(y_test, y_pred))
print("\\nClassification Report:\\n", classification_report(y_test, y_pred))`,
        explanation: [
          'LogisticRegression fits a model that outputs probabilities.',
          'predict() threshold defaults to 0.5 (p > 0.5 means class 1).',
          'confusion_matrix compares actual true/false against predicted true/false.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of classification.',
    questions: [
      { q: 'What is the output range of the sigmoid function?', options: ['[-1, 1]', '[0, 1]', '[-∞, ∞]', '[0, 100]'], answer: 1 },
      { q: 'Which metric evaluates the ratio of correctly predicted positive observations to the total predicted positives?', options: ['Accuracy', 'Recall', 'Precision', 'F1-score'], answer: 2 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Load & Prepare Data', action: 'Ensure target variable is binary.', input: 'Dataset', process: 'Binarize target if needed', output: 'X, y (binary)' },
      { title: 'Train Model', action: 'Fit Logistic Regression.', input: 'Training data', process: 'model.fit()', output: 'Trained classifier' },
      { title: 'Predict Probabilities', action: 'Predict class probabilities.', input: 'Test data', process: 'model.predict_proba()', output: 'Probability array' },
      { title: 'Evaluate Performance', action: 'Generate confusion matrix.', input: 'y_test, y_pred', process: 'confusion_matrix()', output: 'Evaluation metrics' },
    ],
    inputProcessOutput: {
      input: 'Features and binary labels.',
      process: 'Fit logistic curve maximizing log-likelihood.',
      output: 'Predicted classes and probability scores.',
    }
  },
  results: {
    observations: [
      'The model outputs a probability between 0 and 1.',
      'The confusion matrix shows True Positives, True Negatives, False Positives, and False Negatives.',
    ],
    keyInsight: 'In imbalanced datasets, Accuracy can be misleading; Precision, Recall, and F1-score provide a more complete picture of model performance.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of logistic regression.',
    questions: [
      { q: 'In a medical test for a rare disease, which metric is usually more critical to maximize?', options: ['Precision', 'Recall', 'Accuracy', 'Specificity'], answer: 1 },
      { q: 'Logistic regression is fundamentally a ___ algorithm.', options: ['Regression', 'Classification', 'Clustering', 'Dimensionality Reduction'], answer: 1 },
    ],
  }
};
