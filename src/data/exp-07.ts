// src/data/exp-07.ts
export const exp07 = {
  id: '7',
  title: 'K-Means Clustering',
  aim: 'To apply K-Means clustering to partition unlabeled data into distinct groups based on feature similarity and understand centroid convergence.',
  learningObjectives: [
    'Understand the objective of unsupervised clustering',
    'Explain how the K-Means algorithm initializes and updates centroids',
    'Implement K-Means clustering using scikit-learn',
    'Evaluate the optimal number of clusters using the Elbow Method',
  ],
  theory: [
    {
      id: 'intro',
      title: '8.1 Introduction to K-Means',
      type: 'text',
      visualizationId: 'kmeans',
      content: '**K-Means** is an **unsupervised clustering** algorithm that partitions unlabeled data into **K clusters** by minimizing the **within-cluster sum of squares (WCSS)** around cluster **centroids**.',
      codeExample: {
        title: 'K-Means and the Elbow Method',
        code: `from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
import numpy as np

# Generate unlabeled data
X, _ = make_blobs(n_samples=300, centers=4, cluster_std=0.6, random_state=0)

# Calculate Within-Cluster Sum of Squares (WCSS) for different K
wcss = []
for i in range(1, 11):
    kmeans = KMeans(n_clusters=i, init='k-means++', random_state=42)
    kmeans.fit(X)
    wcss.append(kmeans.inertia_)

# Fit optimal K
optimal_kmeans = KMeans(n_clusters=4, init='k-means++', random_state=42)
y_kmeans = optimal_kmeans.fit_predict(X)
print("Cluster Centers:\\n", optimal_kmeans.cluster_centers_)`,
        explanation: [
          'kmeans.inertia_ gives the WCSS (variance within clusters).',
          'Plotting WCSS against K helps find the "elbow" point, suggesting the optimal K.',
          'k-means++ initialization speeds up convergence and avoids poor local minima.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of clustering.',
    questions: [
      { q: 'What is the primary difference between classification and clustering?', options: ['Clustering uses continuous targets', 'Clustering requires labeled data, classification does not', 'Classification requires labeled data, clustering does not', 'There is no difference'], answer: 2 },
      { q: 'In K-Means, what does the "K" stand for?', options: ['Number of features', 'Number of iterations', 'Number of clusters', 'Number of nearest neighbors'], answer: 2 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Load Data', action: 'Load unlabeled dataset.', input: 'Raw data', process: 'Read data', output: 'X matrix' },
      { title: 'Find Optimal K', action: 'Run K-Means for K=1..10 and calculate inertia.', input: 'X matrix', process: 'KMeans.fit(), get inertia_', output: 'WCSS values' },
      { title: 'Determine Elbow', action: 'Identify the "elbow" where WCSS drop slows down.', input: 'WCSS array', process: 'Visual inspection', output: 'Optimal K value' },
      { title: 'Final Clustering', action: 'Fit model with optimal K.', input: 'X, Optimal K', process: 'KMeans.fit_predict()', output: 'Cluster assignments' },
    ],
    inputProcessOutput: {
      input: 'Unlabeled feature matrix.',
      process: 'Iteratively assign points to nearest centroid and update centroids.',
      output: 'Discrete cluster assignment for each point.',
    }
  },
  results: {
    observations: [
      'The algorithm successfully discovers natural groupings in the data.',
      'The Elbow method graph shows a sharp decrease in inertia until the true number of clusters is reached.',
    ],
    keyInsight: 'K-Means assumes clusters are spherical and roughly equal in size. It performs poorly on elongated or arbitrarily shaped clusters.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of K-Means.',
    questions: [
      { q: 'What is a major limitation of K-Means clustering?', options: ['It is too slow for small datasets', 'You must specify the number of clusters (K) in advance', 'It only works with labeled data', 'It cannot handle numerical data'], answer: 1 },
      { q: 'What does the algorithm minimize?', options: ['Between-cluster distance', 'Within-cluster sum of squares', 'Total number of clusters', 'Maximum margin'], answer: 1 },
    ],
  }
};
