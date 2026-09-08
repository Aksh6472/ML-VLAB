// src/data/exp-09.ts
export const exp09 = {
  id: '9',
  title: 'Random Forest Classification',
  aim: 'To understand ensemble learning by building a Random Forest classifier, and to see how aggregating multiple decision trees reduces variance and prevents overfitting.',
  learningObjectives: [
    'Define Ensemble Learning and Bagging (Bootstrap Aggregating)',
    'Explain how Random Forests use feature randomness',
    'Train a Random Forest classifier using scikit-learn',
    'Evaluate the performance improvement over a single decision tree',
  ],
  theory: [
    {
      id: 'intro',
      title: '10.1 Introduction to Random Forest',
      type: 'text',
      visualizationId: 'random-forest',
      content: 'A **Random Forest** is an **ensemble learning** method composed of multiple decision trees. It utilizes **bagging** (bootstrap aggregating) and random feature subsampling to reduce model variance and prevent **overfitting**.',
      codeExample: {
        title: 'Training a Random Forest',
        code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=42)

# Train Random Forest
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

preds = rf.predict(X_test)
print(f"Random Forest Accuracy: {accuracy_score(y_test, preds):.4f}")`,
        explanation: [
          'n_estimators=100 means the forest consists of 100 decision trees.',
          'The final prediction is made by majority voting across all 100 trees.',
          'Random Forests generally perform better and overfit less than single decision trees.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of ensemble methods.',
    questions: [
      { q: 'What is the main technique Random Forests use to prevent overfitting compared to single decision trees?', options: ['They use a linear kernel', 'They average the results of multiple diverse trees', 'They perform gradient descent', 'They scale the features between 0 and 1'], answer: 1 },
      { q: 'In classification, how does a Random Forest make its final prediction?', options: ['By selecting the tree with the lowest error', 'By majority voting among all trees', 'By taking the average of probabilities', 'By choosing the deepest tree'], answer: 1 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Prepare Data', action: 'Load and split dataset.', input: 'Raw data', process: 'train_test_split', output: 'Train and Test sets' },
      { title: 'Configure Forest', action: 'Initialize RandomForestClassifier.', input: 'Hyperparameters (n_estimators)', process: 'Instantiate class', output: 'Untrained ensemble' },
      { title: 'Train Forest', action: 'Fit the ensemble to training data.', input: 'X_train, y_train', process: 'rf.fit()', output: '100 trained decision trees' },
      { title: 'Predict', action: 'Predict on test data using majority vote.', input: 'X_test', process: 'rf.predict()', output: 'Final class predictions' },
    ],
    inputProcessOutput: {
      input: 'Tabular dataset.',
      process: 'Bootstrap sampling and random feature selection per split.',
      output: 'Aggregated ensemble prediction.',
    }
  },
  results: {
    observations: [
      'The Random Forest typically achieves higher accuracy than a single Decision Tree.',
      'The model is more robust to noise and outliers in the training data.',
    ],
    keyInsight: 'The strength of a Random Forest lies in the diversity of its trees. By introducing randomness, individual trees might be weak, but their aggregate vote is highly accurate.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of Random Forests.',
    questions: [
      { q: 'What is "Bagging" short for?', options: ['Basic Aggregating', 'Bootstrap Aggregating', 'Binary Aggregating', 'Boolean Aggregating'], answer: 1 },
      { q: 'Which of the following is true about feature selection in a Random Forest?', options: ['All features are used for every split', 'Only the most important feature is used', 'A random subset of features is considered at each split', 'Features are selected based on PCA'], answer: 2 },
    ],
  }
};
