// src/data/exp-02.ts
export const exp02 = {
  id: '2',
  title: 'Linear Regression',
  aim: 'To understand the mathematics behind simple and multiple linear regression, learn how to fit a line to data using the least squares method, and evaluate the model using metrics like MAE, MSE, and R-squared.',
  learningObjectives: [
    'Understand the hypothesis of linear regression',
    'Derive and interpret the coefficients (slope and intercept)',
    'Fit a linear regression model using scikit-learn',
    'Evaluate the model using standard regression metrics',
  ],
  theory: [
    {
      id: 'intro',
      title: '3.1 Introduction to Linear Regression',
      type: 'text',
      content: '**Linear Regression** is a modeling technique used to analyze the linear relationship between a continuous **dependent variable** and one or more **independent variables**.',
    },
    {
      id: 'math',
      title: '3.2 Mathematical Formulation',
      type: 'text',
      visualizationId: 'linear-regression',
      content: 'The model assumes a **linear relationship**:',
      formulas: [
        {
          name: 'Simple Linear Regression',
          latex: 'y = \\beta_0 + \\beta_1 x + \\epsilon',
          description: 'Where β0 is the y-intercept, β1 is the slope, and ε is the error term.',
        }
      ],
      codeExample: {
        title: 'Fitting a Linear Model',
        code: `from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4]])
y = np.array([2, 4, 6, 8])

model = LinearRegression()
model.fit(X, y)
print(f"Slope: {model.coef_[0]}, Intercept: {model.intercept_}")`,
        explanation: [
          'LinearRegression fits a linear model with coefficients to minimize the residual sum of squares.',
          'The fit() method computes the optimal slope and intercept.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of linear relationships.',
    questions: [
      { q: 'What does the slope represent in a simple linear regression equation?', options: ['The value of y when x is 0', 'The change in y for a one-unit change in x', 'The correlation coefficient', 'The error term'], answer: 1 },
      { q: 'Which metric measures the proportion of variance explained by the model?', options: ['Mean Absolute Error (MAE)', 'Mean Squared Error (MSE)', 'R-squared (R²)', 'Root Mean Squared Error (RMSE)'], answer: 2 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Load Data', action: 'Load a dataset suitable for regression.', input: 'CSV dataset', process: 'Read with pandas', output: 'DataFrame' },
      { title: 'Feature Selection', action: 'Select independent (X) and dependent (y) variables.', input: 'DataFrame', process: 'Subset columns', output: 'X and y arrays' },
      { title: 'Train/Test Split', action: 'Split data for training and testing.', input: 'X, y', process: 'train_test_split', output: 'Train and test sets' },
      { title: 'Model Training', action: 'Fit the LinearRegression model.', input: 'Training set', process: 'model.fit(X_train, y_train)', output: 'Trained model parameters' },
      { title: 'Prediction & Evaluation', action: 'Predict on test set and calculate metrics.', input: 'Test set, Model', process: 'model.predict(), calculate R2', output: 'R2 score, MSE' },
    ],
    inputProcessOutput: {
      input: 'Continuous dataset with explanatory variables.',
      process: 'Fit least squares line.',
      output: 'Regression coefficients and evaluation metrics.',
    }
  },
  results: {
    observations: [
      'The model successfully estimates the linear relationship between X and y.',
      'R-squared indicates how well the independent variables explain the variance of the dependent variable.',
    ],
    keyInsight: 'Linear regression is sensitive to outliers, which can heavily influence the line of best fit because it minimizes squared errors.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of linear regression.',
    questions: [
      { q: 'In multiple linear regression, what happens to the R-squared value as more predictors are added?', options: ['It always decreases', 'It stays the same', 'It never decreases (though adjusted R² might)', 'It approaches zero'], answer: 2 },
      { q: 'What is the objective of the Ordinary Least Squares (OLS) method?', options: ['Maximize the R-squared', 'Minimize the sum of absolute errors', 'Minimize the sum of squared residuals', 'Minimize the correlation'], answer: 2 },
    ],
  }
};
