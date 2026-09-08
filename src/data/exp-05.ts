// src/data/exp-05.ts
export const exp05 = {
  id: '5',
  title: 'Principal Component Analysis (PCA)',
  aim: 'To understand dimensionality reduction by projecting high-dimensional data into a lower-dimensional space using eigenvectors, while retaining the most important variance.',
  learningObjectives: [
    'Understand the curse of dimensionality',
    'Compute the covariance matrix and eigenvectors',
    'Project data onto principal components',
    'Evaluate explained variance ratio',
  ],
  theory: [
    {
      id: 'intro',
      title: '6.1 Introduction to PCA',
      type: 'text',
      visualizationId: 'pca',
      content: '**High-dimensional data** can be difficult to visualize and computationally expensive to process. **PCA (Principal Component Analysis)** is an **unsupervised technique** that finds the directions of **maximum variance** (**principal components**) and projects the data onto them.',
      codeExample: {
        title: 'Applying PCA',
        code: `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

# PCA is highly sensitive to feature scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

print("Explained Variance Ratio:", pca.explained_variance_ratio_)
print("Total Variance Explained:", sum(pca.explained_variance_ratio_))`,
        explanation: [
          'Data MUST be standardized before applying PCA so features with larger scales do not dominate.',
          'n_components=2 reduces the dataset from 4 dimensions down to 2.',
          'explained_variance_ratio_ shows how much information is retained by each component.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of PCA.',
    questions: [
      { q: 'Is PCA a supervised or unsupervised learning technique?', options: ['Supervised', 'Unsupervised', 'Reinforcement Learning', 'Semi-supervised'], answer: 1 },
      { q: 'What must typically be done to data before applying PCA?', options: ['One-hot encoding', 'Train-test split', 'Standardization', 'Log transformation'], answer: 2 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Standardize Data', action: 'Scale all features to mean 0, variance 1.', input: 'Raw X', process: 'StandardScaler', output: 'Scaled X' },
      { title: 'Fit PCA', action: 'Compute principal components.', input: 'Scaled X', process: 'PCA.fit()', output: 'Eigenvectors and eigenvalues' },
      { title: 'Transform Data', action: 'Project data into lower dimensions.', input: 'Scaled X', process: 'PCA.transform()', output: 'Reduced X' },
      { title: 'Analyze Variance', action: 'Check explained variance.', input: 'PCA model', process: 'View explained_variance_ratio_', output: 'Information retention %' },
    ],
    inputProcessOutput: {
      input: 'High-dimensional scaled dataset.',
      process: 'Eigen-decomposition of covariance matrix.',
      output: 'Low-dimensional dataset retaining maximum variance.',
    }
  },
  results: {
    observations: [
      'The first principal component captures the most variance.',
      'A 2D scatter plot of the transformed data often reveals inherent clustering even without labels.',
    ],
    keyInsight: 'PCA does not select existing features; it creates new features (components) that are linear combinations of the original features, losing some interpretability.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of PCA.',
    questions: [
      { q: 'If the first two principal components explain 95% of the variance, what does this mean?', options: ['5% of the data points were outliers', 'The original data had 95 dimensions', '95% of the original information is preserved in 2 dimensions', 'The model accuracy is 95%'], answer: 2 },
      { q: 'What mathematical entity does PCA use to find principal components?', options: ['Decision Trees', 'Covariance Matrix Eigenvectors', 'Logistic Curve', 'Gradient Descent'], answer: 1 },
    ],
  }
};
