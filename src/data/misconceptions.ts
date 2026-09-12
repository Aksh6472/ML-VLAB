// src/data/misconceptions.ts
// Enhancement 4: Misconception Diagnosis (AI Learning Assistant)

export interface MisconceptionDiagnosis {
  misconception: string;
  correctConcept: string;
  recommendedRevision: string;
  expId?: string;
}

interface DiagnosisInput {
  questionText: string;
  selectedOptionText: string;
  correctOptionText: string;
  expId?: string;
  topicTitle?: string;
  questionIndex?: number;
}

// Pre-defined misconception mappings for experiment quizzes and final assessment
const MISCONCEPTION_RULES: Array<{
  keyword: string | RegExp;
  optionKeyword?: string | RegExp;
  misconception: string;
  correctConcept: string;
  recommendedRevision: string;
  expId: string;
}> = [
  // Exp 1: Data Pre-processing
  {
    keyword: /purpose of data pre-processing|pre-processing/i,
    optionKeyword: /generate predictions|visualise|select/i,
    misconception: 'Confusing data pre-processing with predictive modeling or visualization.',
    correctConcept: 'Pre-processing transforms raw data into a clean, normalized format so algorithms can learn effectively.',
    recommendedRevision: 'Experiment 1 → Introduction to Data Pre-processing',
    expId: '1',
  },
  {
    keyword: /imputation/i,
    optionKeyword: /deleting|zero|ignoring/i,
    misconception: 'Assuming missing data is either discarded or filled with arbitrary zeros.',
    correctConcept: 'Imputation substitutes missing values using computed statistics (mean, median, mode) to preserve sample size.',
    recommendedRevision: 'Experiment 1 → Handling Missing Values',
    expId: '1',
  },
  {
    keyword: /label encoding|one-hot/i,
    optionKeyword: /binary|float|random|ordinal/i,
    misconception: 'Misunderstanding how categorical encoding converts discrete text labels.',
    correctConcept: 'Label encoding assigns unique integers to categories, whereas One-Hot encoding creates binary indicator columns without rank.',
    recommendedRevision: 'Experiment 1 → Numerical and Categorical Variables',
    expId: '1',
  },
  {
    keyword: /data leakage/i,
    optionKeyword: /underfitting|overfitting|slow|unnormalised/i,
    misconception: 'Confusing data leakage with general model fitting errors.',
    correctConcept: 'Data leakage happens when test set statistics contaminate training preprocessing steps, inflating performance metrics artificially.',
    recommendedRevision: 'Experiment 1 → Data Leakage & Pipelines',
    expId: '1',
  },

  // Exp 2: Linear Regression
  {
    keyword: /R-squared|R²|0\.85/i,
    optionKeyword: /prediction error|incorrect|directly on|mean absolute/i,
    misconception: 'Confusing R² (Goodness of Fit) with error metrics or accuracy percentages.',
    correctConcept: 'R² measures the proportion of variance in the target variable explained by the model, not prediction error.',
    recommendedRevision: 'Experiment 2 → Linear Regression Metrics',
    expId: '2',
  },
  {
    keyword: /Mean Squared Error|MSE|penalizes/i,
    optionKeyword: /MAE|R-squared|Accuracy/i,
    misconception: 'Equating linear absolute errors with squared error penalties.',
    correctConcept: 'MSE squares residuals before averaging, which heavily penalizes larger errors compared to MAE.',
    recommendedRevision: 'Experiment 2 → Evaluation Metrics & Loss Functions',
    expId: '2',
  },

  // Exp 3: Cross-Validation
  {
    keyword: /Stratified K-Fold/i,
    optionKeyword: /speeds up|eliminates|removes outliers/i,
    misconception: 'Believing stratification accelerates computation rather than addressing class distribution.',
    correctConcept: 'Stratified K-Fold preserves the exact target class percentage ratio across every fold, essential for imbalanced data.',
    recommendedRevision: 'Experiment 3 → K-Fold Cross-Validation Strategies',
    expId: '3',
  },

  // Exp 4: Logistic Regression
  {
    keyword: /Sigmoid|activation function/i,
    optionKeyword: /ReLU|Softmax|Tanh/i,
    misconception: 'Confusing binary classification activation (Sigmoid) with multi-class or hidden layer activations.',
    correctConcept: 'The Sigmoid function maps real-valued inputs into an S-shaped probability curve bounded between 0 and 1.',
    recommendedRevision: 'Experiment 4 → Logistic Regression & Sigmoid Function',
    expId: '4',
  },
  {
    keyword: /Recall|Sensitivity/i,
    optionKeyword: /TP \/ \(TP \+ FP\)|TN \/|Total/i,
    misconception: 'Confusing Recall (True Positive Rate) with Precision or Accuracy.',
    correctConcept: 'Recall measures TP / (TP + FN), quantifying how many actual positive instances were successfully detected.',
    recommendedRevision: 'Experiment 4 → Confusion Matrix & Classification Metrics',
    expId: '4',
  },

  // Exp 5: PCA
  {
    keyword: /principal components|PCA/i,
    optionKeyword: /Centroids|Leaf nodes|Support vectors/i,
    misconception: 'Mixing principal component vectors with clustering centroids or decision boundaries.',
    correctConcept: 'Principal components are the eigenvectors of the data covariance matrix along directions of maximum variance.',
    recommendedRevision: 'Experiment 5 → Principal Component Analysis (PCA)',
    expId: '5',
  },

  // Exp 6: SVM
  {
    keyword: /Support Vectors|Kernel Trick|hyperparameter C/i,
    optionKeyword: /center points|outliers|trees|probability/i,
    misconception: 'Misinterpreting the margin boundary or high-dimensional projection in SVMs.',
    correctConcept: 'Support vectors are critical data points closest to the separating hyperplane margin that define the decision boundary.',
    recommendedRevision: 'Experiment 6 → Support Vector Machines',
    expId: '6',
  },

  // Exp 7: K-Means
  {
    keyword: /K-Means|Elbow Method|centroids/i,
    optionKeyword: /Supervised|Scree|gradient descent/i,
    misconception: 'Thinking K-Means uses target labels or gradient descent.',
    correctConcept: 'K-Means is an unsupervised clustering algorithm that iteratively updates centroids to minimize Within-Cluster Sum of Squares.',
    recommendedRevision: 'Experiment 7 → K-Means Clustering',
    expId: '7',
  },

  // Exp 8: Decision Trees
  {
    keyword: /Gini Impurity|prunes|Information Gain/i,
    optionKeyword: /Standard Error|Silhouette|Log Loss/i,
    misconception: 'Confusing tree purity metrics with regression or clustering metrics.',
    correctConcept: 'Gini Impurity measures class homogeneity within a node; 0 indicates a perfectly pure node.',
    recommendedRevision: 'Experiment 8 → Decision Tree Classification',
    expId: '8',
  },

  // Exp 9: Random Forest
  {
    keyword: /Random Forest|Bagging|OOB/i,
    optionKeyword: /Boosting|Stacking|learning rate/i,
    misconception: 'Confusing Random Forest (Bagging) with Boosting techniques like XGBoost.',
    correctConcept: 'Random Forest builds multiple independent decision trees using bootstrap aggregating (bagging) and feature subsampling.',
    recommendedRevision: 'Experiment 9 → Random Forest & Ensemble Methods',
    expId: '9',
  },

  // Exp 10: Perceptron
  {
    keyword: /Perceptron|XOR|weighted sum/i,
    optionKeyword: /Inability|Too many|Decision Node|Centroid/i,
    misconception: 'Not recognizing single-layer Perceptron linear boundary constraints.',
    correctConcept: 'A single-layer Perceptron can only classify linearly separable patterns, making non-linear problems like XOR unresolvable without hidden layers.',
    recommendedRevision: 'Experiment 10 → Perceptron & Neural Networks',
    expId: '10',
  },
];

/**
 * Returns a beginner-friendly Misconception Diagnosis for any selected incorrect option.
 */
export function getMisconceptionDiagnosis(input: DiagnosisInput): MisconceptionDiagnosis {
  const { questionText, selectedOptionText, correctOptionText, expId, topicTitle } = input;

  // Search pre-defined rules
  for (const rule of MISCONCEPTION_RULES) {
    const qMatch = typeof rule.keyword === 'string' ? questionText.includes(rule.keyword) : rule.keyword.test(questionText);
    const optMatch = !rule.optionKeyword || (typeof rule.optionKeyword === 'string' ? selectedOptionText.includes(rule.optionKeyword) : rule.optionKeyword.test(selectedOptionText));

    if (qMatch && optMatch) {
      return {
        misconception: rule.misconception,
        correctConcept: rule.correctConcept,
        recommendedRevision: rule.recommendedRevision,
        expId: rule.expId,
      };
    }
  }

  // Dynamic intelligent fallback based on parameters
  const targetExp = expId || '1';
  const targetTopic = topicTitle || `Experiment ${targetExp} Core Concepts`;

  return {
    misconception: `You selected "${selectedOptionText}", which confuses key definitions for this concept.`,
    correctConcept: `"${correctOptionText}" is correct because it directly satisfies the theoretical principle defined in this module.`,
    recommendedRevision: `Experiment ${targetExp} → ${targetTopic}`,
    expId: targetExp,
  };
}
