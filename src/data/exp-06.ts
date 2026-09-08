// src/data/exp-06.ts
export const exp06 = {
  id: '6',
  title: 'Support Vector Machine Classification',
  aim: 'To classify data by finding the optimal maximum-margin hyperplane and to understand how kernel tricks allow for non-linear decision boundaries.',
  learningObjectives: [
    'Understand the concept of a maximum-margin hyperplane',
    'Identify support vectors',
    'Apply different kernels (linear, polynomial, RBF)',
    'Tune the regularization parameter (C) and kernel coefficient (gamma)',
  ],
  theory: [
    {
      id: 'intro',
      title: '7.1 Introduction to SVM',
      type: 'text',
      visualizationId: 'svm',
      content: 'A **Support Vector Machine (SVM)** is a supervised algorithm that constructs an optimal **hyperplane** separating classes with the maximum possible **margin**. The closest data points defining the boundary are called **support vectors**.',
      codeExample: {
        title: 'SVM with RBF Kernel',
        code: `from sklearn.svm import SVC
from sklearn.datasets import make_moons
from sklearn.metrics import accuracy_score

# Generate non-linear data
X, y = make_moons(n_samples=100, noise=0.15, random_state=42)

# Fit SVM with Radial Basis Function (RBF) kernel
model = SVC(kernel='rbf', C=1.0, gamma='scale')
model.fit(X, y)

preds = model.predict(X)
print(f"Accuracy: {accuracy_score(y, preds):.2f}")`,
        explanation: [
          'The RBF (Radial Basis Function) kernel allows SVM to create non-linear boundaries.',
          'C controls the trade-off between smooth decision boundary and classifying training points correctly.',
          'gamma defines how far the influence of a single training example reaches.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of SVMs.',
    questions: [
      { q: 'What are support vectors?', options: ['The features with the highest variance', 'The data points closest to the decision boundary', 'The hyper-parameters of the model', 'The misclassified points only'], answer: 1 },
      { q: 'Which kernel is best suited for linearly separable data?', options: ['RBF', 'Polynomial', 'Linear', 'Sigmoid'], answer: 2 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Load Data', action: 'Load a non-linear dataset.', input: 'Dataset', process: 'make_moons or similar', output: 'X, y' },
      { title: 'Scale Features', action: 'Scale data to ensure distance calculations are valid.', input: 'X', process: 'StandardScaler', output: 'Scaled X' },
      { title: 'Train SVM', action: 'Fit an SVM classifier.', input: 'Scaled X, y', process: 'SVC.fit()', output: 'Trained model' },
      { title: 'Evaluate', action: 'Predict and score.', input: 'Test data', process: 'predict(), accuracy_score()', output: 'Accuracy metric' },
    ],
    inputProcessOutput: {
      input: 'Scaled features and class labels.',
      process: 'Find maximum margin hyperplane in high-dimensional space.',
      output: 'Decision boundary model and predictions.',
    }
  },
  results: {
    observations: [
      'The linear kernel fails to separate non-linear data accurately.',
      'The RBF kernel successfully wraps the decision boundary around complex shapes.',
    ],
    keyInsight: 'SVMs are extremely powerful and versatile, but they are highly sensitive to feature scaling and can be computationally expensive on large datasets.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of SVM classification.',
    questions: [
      { q: 'What does a large value of C (regularization parameter) in an SVM indicate?', options: ['Wider margin, more misclassifications allowed', 'Narrower margin, strict classification of training data', 'Faster training time', 'Forces the use of a linear kernel'], answer: 1 },
      { q: 'What is the "kernel trick"?', options: ['Removing outliers before training', 'Implicitly mapping data to a higher-dimensional space to make it linearly separable', 'Scaling data between 0 and 1', 'Using a neural network to extract features'], answer: 1 },
    ],
  }
};
