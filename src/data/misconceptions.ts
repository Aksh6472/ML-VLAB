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

// Comprehensive misconception rules for experiment quizzes and final assessment
const MISCONCEPTION_RULES: Array<{
  keyword: string | RegExp;
  optionKeyword?: string | RegExp;
  misconception: string;
  correctConcept: string;
  recommendedRevision: string;
  expId: string;
}> = [
  // ─── Exp 1: Data Pre-processing ───
  {
    keyword: /LabelEncoder|Label encoding|small.*medium.*large/i,
    optionKeyword: /equal frequency/i,
    misconception: 'Confusing integer label encoding with category frequency or class balance. LabelEncoder maps string labels to numerical IDs (0, 1, 2) rather than measuring frequency.',
    correctConcept: 'LabelEncoder assigns sequential integers (0, 1, 2), causing algorithms (like linear regression or SVMs) to falsely assume an ordinal rank (Large > Medium > Small).',
    recommendedRevision: 'Experiment 1 → Categorical Encoding & Ordinality',
    expId: '1',
  },
  {
    keyword: /LabelEncoder|Label encoding|small.*medium.*large/i,
    optionKeyword: /continuous/i,
    misconception: 'Assuming integer label encoding converts discrete text labels into smooth continuous metrics. The assigned integer codes remain discrete category identifiers.',
    correctConcept: 'Label encoding converts text labels to discrete integer codes; One-Hot encoding creates separate binary columns for unordered categories without imposing rank.',
    recommendedRevision: 'Experiment 1 → Categorical Encoding Strategies',
    expId: '1',
  },
  {
    keyword: /LabelEncoder|Label encoding|small.*medium.*large/i,
    optionKeyword: /Missing values/i,
    misconception: 'Confusing categorical encoding with missing value imputation. LabelEncoder processes existing text labels and does not detect or replace missing NaN entries.',
    correctConcept: 'Missing value imputation must be performed prior to categorical encoding using summary statistics like mean, median, or mode.',
    recommendedRevision: 'Experiment 1 → Missing Values vs Encoding',
    expId: '1',
  },
  {
    keyword: /StandardScaler on the full dataset|data leakage/i,
    optionKeyword: /unnormalised/i,
    misconception: 'Confusing statistical data leakage with failure to scale features. StandardScaler still scales the dataset, but fitting on the full dataset leaks test set mean and variance into training.',
    correctConcept: 'Data leakage occurs when test set statistics contaminate training transformations. Scalers must be fit strictly on training data.',
    recommendedRevision: 'Experiment 1 → Data Leakage & Scikit-Learn Pipelines',
    expId: '1',
  },
  {
    keyword: /StandardScaler on the full dataset|data leakage/i,
    optionKeyword: /slower/i,
    misconception: 'Mistaking statistical evaluation integrity for computational runtime speed. Fitting before splitting does not slow execution, but it invalidates test metrics.',
    correctConcept: 'Data leakage inflates evaluation metrics by letting training transformations learn from test set distributions. Use Pipelines to keep splits clean.',
    recommendedRevision: 'Experiment 1 → Scikit-Learn Pipelines',
    expId: '1',
  },
  {
    keyword: /StandardScaler on the full dataset|data leakage/i,
    optionKeyword: /raise an error/i,
    misconception: 'Expecting a syntax or runtime exception instead of a subtle statistical flaw. Code executes without crashing, but test evaluation becomes unreliably optimistic.',
    correctConcept: 'Data leakage is a methodology flaw, not a code crash. Scikit-learn Pipelines ensure scaler statistics are computed strictly on training folds.',
    recommendedRevision: 'Experiment 1 → Avoiding Data Leakage',
    expId: '1',
  },
  {
    keyword: /MinMaxScaler|scaled value will be/i,
    optionKeyword: /Exactly 1\.0/i,
    misconception: 'Assuming MinMaxScaler clamps or clips unseen test samples to the [0, 1] range. Scalers apply fixed linear parameters learned during fitting without hard clipping bounds.',
    correctConcept: 'MinMaxScaler applies (x - min) / (max - min) using fixed training statistics. If a test value exceeds the training maximum, its scaled output will exceed 1.0.',
    recommendedRevision: 'Experiment 1 → Feature Scaling & Out-of-Bounds Handling',
    expId: '1',
  },
  {
    keyword: /MinMaxScaler|scaled value will be/i,
    optionKeyword: /Exactly 0\.0|Negative/i,
    misconception: 'Confusing upper out-of-bounds sample values with minimum boundary scaling or negative normalization.',
    correctConcept: 'A sample value higher than any in the training set results in a scaled value > 1.0 because the formula numerator is larger than the training range.',
    recommendedRevision: 'Experiment 1 → MinMaxScaler Mechanics',
    expId: '1',
  },
  {
    keyword: /purpose of data pre-processing|pre-processing/i,
    optionKeyword: /generate predictions|visualise|select/i,
    misconception: 'Confusing data pre-processing with predictive modeling or visualization.',
    correctConcept: 'Pre-processing transforms raw data into a clean, normalized format so algorithms can learn effectively.',
    recommendedRevision: 'Experiment 1 → Introduction to Data Pre-processing',
    expId: '1',
  },
  {
    keyword: /imputation|SimpleImputer/i,
    optionKeyword: /deleting|zero|ignoring|950|1050|Depends/i,
    misconception: 'Assuming missing data imputation discards rows or alters sample size.',
    correctConcept: 'Imputation substitutes missing values using computed statistics (mean, median, mode) to preserve sample size.',
    recommendedRevision: 'Experiment 1 → Handling Missing Values',
    expId: '1',
  },
  {
    keyword: /one-hot encoding|unique categories/i,
    optionKeyword: /1|4|10/i,
    misconception: 'Miscalculating binary indicator columns generated by one-hot encoding.',
    correctConcept: 'One-hot encoding creates exactly 1 binary indicator column per unique category (5 categories = 5 columns).',
    recommendedRevision: 'Experiment 1 → One-Hot Encoding',
    expId: '1',
  },
  {
    keyword: /pipe\.fit|Pipeline/i,
    optionKeyword: /Only the scaler|Only the classifier|X_test/i,
    misconception: 'Misinterpreting Pipeline execution steps.',
    correctConcept: 'Calling fit() on a Pipeline sequentially fits transformers on X_train, then fits the estimator on scaled X_train.',
    recommendedRevision: 'Experiment 1 → Scikit-Learn Pipelines',
    expId: '1',
  },

  // ─── Exp 2: Linear Regression ───
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

  // ─── Exp 3: Cross-Validation ───
  {
    keyword: /Stratified K-Fold/i,
    optionKeyword: /speeds up|eliminates|removes outliers/i,
    misconception: 'Believing stratification accelerates computation rather than addressing class distribution.',
    correctConcept: 'Stratified K-Fold preserves the exact target class percentage ratio across every fold, essential for imbalanced data.',
    recommendedRevision: 'Experiment 3 → K-Fold Cross-Validation Strategies',
    expId: '3',
  },

  // ─── Exp 4: Logistic Regression ───
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

  // ─── Exp 5: PCA ───
  {
    keyword: /principal components|PCA/i,
    optionKeyword: /Centroids|Leaf nodes|Support vectors/i,
    misconception: 'Mixing principal component vectors with clustering centroids or decision boundaries.',
    correctConcept: 'Principal components are the eigenvectors of the data covariance matrix along directions of maximum variance.',
    recommendedRevision: 'Experiment 5 → Principal Component Analysis (PCA)',
    expId: '5',
  },

  // ─── Exp 6: SVM ───
  {
    keyword: /Support Vectors|Kernel Trick|hyperparameter C/i,
    optionKeyword: /center points|outliers|trees|probability/i,
    misconception: 'Misinterpreting the margin boundary or high-dimensional projection in SVMs.',
    correctConcept: 'Support vectors are critical data points closest to the separating hyperplane margin that define the decision boundary.',
    recommendedRevision: 'Experiment 6 → Support Vector Machines',
    expId: '6',
  },

  // ─── Exp 7: K-Means ───
  {
    keyword: /K-Means|Elbow Method|centroids/i,
    optionKeyword: /Supervised|Scree|gradient descent/i,
    misconception: 'Thinking K-Means uses target labels or gradient descent.',
    correctConcept: 'K-Means is an unsupervised clustering algorithm that iteratively updates centroids to minimize Within-Cluster Sum of Squares.',
    recommendedRevision: 'Experiment 7 → K-Means Clustering',
    expId: '7',
  },

  // ─── Exp 8: Decision Trees ───
  {
    keyword: /Gini Impurity|prunes|Information Gain/i,
    optionKeyword: /Standard Error|Silhouette|Log Loss/i,
    misconception: 'Confusing tree purity metrics with regression or clustering metrics.',
    correctConcept: 'Gini Impurity measures class homogeneity within a node; 0 indicates a perfectly pure node.',
    recommendedRevision: 'Experiment 8 → Decision Tree Classification',
    expId: '8',
  },

  // ─── Exp 9: Random Forest ───
  {
    keyword: /Random Forest|Bagging|OOB/i,
    optionKeyword: /Boosting|Stacking|learning rate/i,
    misconception: 'Confusing Random Forest (Bagging) with Boosting techniques like XGBoost.',
    correctConcept: 'Random Forest builds multiple independent decision trees using bootstrap aggregating (bagging) and feature subsampling.',
    recommendedRevision: 'Experiment 9 → Random Forest & Ensemble Methods',
    expId: '9',
  },

  // ─── Exp 10: Perceptron ───
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
    const qMatch = typeof rule.keyword === 'string' ? questionText.toLowerCase().includes(rule.keyword.toLowerCase()) : rule.keyword.test(questionText);
    const optMatch = !rule.optionKeyword || (typeof rule.optionKeyword === 'string' ? selectedOptionText.toLowerCase().includes(rule.optionKeyword.toLowerCase()) : rule.optionKeyword.test(selectedOptionText));

    if (qMatch && optMatch) {
      return {
        misconception: rule.misconception,
        correctConcept: rule.correctConcept,
        recommendedRevision: rule.recommendedRevision,
        expId: rule.expId,
      };
    }
  }

  // Dynamic intelligent fallback based on option text
  const targetExp = expId || '1';
  const targetTopic = topicTitle || `Experiment ${targetExp} Core Concepts`;

  const cleanSelected = selectedOptionText.replace(/^[A-D]\s*–\s*/, '').trim();
  const cleanCorrect = correctOptionText.replace(/^[A-D]\s*–\s*/, '').trim();

  return {
    misconception: `Selecting "${cleanSelected}" confuses the specific mechanics of this module with a different algorithmic concept.`,
    correctConcept: `"${cleanCorrect}" is the correct theoretical principle for this concept.`,
    recommendedRevision: `Experiment ${targetExp} → ${targetTopic}`,
    expId: targetExp,
  };
}
