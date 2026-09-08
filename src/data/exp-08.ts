// src/data/exp-08.ts
export const exp08 = {
  id: '8',
  title: 'Decision Tree Classification',
  aim: 'To build and interpret decision tree classifiers, understanding how splits are chosen based on metrics like Gini impurity and Information Gain.',
  learningObjectives: [
    'Understand tree terminology (root, nodes, leaves)',
    'Explain splitting criteria (Gini Impurity, Entropy)',
    'Train a Decision Tree model using scikit-learn',
    'Visualize and interpret the resulting tree structure',
  ],
  theory: [
    {
      id: 'intro',
      title: '9.1 Introduction to Decision Trees',
      type: 'text',
      visualizationId: 'decision-tree',
      content: 'A **Decision Tree** classifies data by evaluating sequential feature rules. At each decision node, the algorithm selects splits that optimize purity metrics such as **Gini Impurity** or **Information Gain** to assign final class labels at **leaf nodes**.',
      codeExample: {
        title: 'Training a Decision Tree',
        code: `from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)

# Train Decision Tree
clf = DecisionTreeClassifier(criterion='gini', max_depth=3, random_state=42)
clf.fit(X, y)

preds = clf.predict(X)
print(f"Training Accuracy: {accuracy_score(y, preds):.2f}")`,
        explanation: [
          'criterion="gini" uses Gini impurity to measure the quality of a split.',
          'max_depth=3 restricts the tree to 3 levels deep to prevent overfitting.',
          'Decision trees do not require feature scaling.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of decision trees.',
    questions: [
      { q: 'What does a leaf node represent in a classification decision tree?', options: ['A feature to split on', 'A predicted class label', 'The start of the tree', 'An error term'], answer: 1 },
      { q: 'Which of the following is a common metric used to evaluate splits?', options: ['Mean Squared Error', 'Gini Impurity', 'R-squared', 'Cosine Similarity'], answer: 1 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Load Data', action: 'Load dataset.', input: 'Data source', process: 'Read into arrays', output: 'X, y' },
      { title: 'Initialize Model', action: 'Create DecisionTreeClassifier.', input: 'Hyperparameters (e.g., max_depth)', process: 'Instantiate class', output: 'Classifier object' },
      { title: 'Train Tree', action: 'Fit the model to training data.', input: 'X, y', process: 'clf.fit()', output: 'Trained rules' },
      { title: 'Evaluate', action: 'Predict and calculate accuracy.', input: 'Test data', process: 'predict(), accuracy_score()', output: 'Performance metrics' },
    ],
    inputProcessOutput: {
      input: 'Tabular dataset (no scaling required).',
      process: 'Recursive binary splitting maximizing purity.',
      output: 'Hierarchical set of decision rules.',
    }
  },
  results: {
    observations: [
      'The model is highly interpretable, as decisions can be traced from root to leaf.',
      'Without max_depth constraints, the tree may perfectly memorize the training data.',
    ],
    keyInsight: 'Decision trees are highly prone to overfitting, capturing noise in the training data if not properly pruned or constrained.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of decision trees.',
    questions: [
      { q: 'What is a major advantage of Decision Trees over SVMs?', options: ['They always achieve higher accuracy', 'They are highly interpretable white-box models', 'They never overfit', 'They require extensive feature scaling'], answer: 1 },
      { q: 'How does limiting the max_depth affect the model?', options: ['It increases overfitting', 'It decreases training time and helps prevent overfitting', 'It makes the model impossible to interpret', 'It forces the tree to use all features'], answer: 1 },
    ],
  }
};
