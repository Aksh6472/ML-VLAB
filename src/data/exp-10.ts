// src/data/exp-10.ts
export const exp10 = {
  id: '10',
  title: 'Artificial Neural Network using Perceptron Learning',
  aim: 'To understand the biological inspiration for neural networks, implement a single-layer perceptron, and learn how weights are updated using the perceptron learning rule.',
  learningObjectives: [
    'Draw parallels between biological neurons and artificial perceptrons',
    'Understand weights, bias, and the activation function',
    'Implement the perceptron learning algorithm',
    'Understand the limitations of a single-layer perceptron (e.g., the XOR problem)',
  ],
  theory: [
    {
      id: 'intro',
      title: '11.1 Introduction to Perceptron',
      type: 'text',
      visualizationId: 'perceptron',
      content: '**Artificial Neural Networks** are loosely inspired by the human brain. A **perceptron** is the simplest type of **artificial neuron**. It takes **multiple inputs**, multiplies them by **weights**, adds a **bias**, and passes the sum through an **activation function** to produce an **output**.',
      formulas: [
        {
          name: 'Perceptron Output',
          latex: 'y = f\\left( \\sum_{i=1}^{n} w_i x_i + b \\right)',
          description: 'Where x are inputs, w are weights, b is the bias, and f is the step activation function.',
        },
        {
          name: 'Weight Update Rule',
          latex: 'w_i = w_i + \\alpha (y_{true} - y_{pred}) x_i',
          description: 'Where α is the learning rate. Weights are updated only if there is an error.',
        }
      ],
      codeExample: {
        title: 'Training a Perceptron',
        code: `from sklearn.linear_model import Perceptron
import numpy as np

# Logic OR gate data
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([0, 1, 1, 1])

# Initialize and train the perceptron
model = Perceptron(eta0=0.1, max_iter=100, random_state=42)
model.fit(X, y)

print("Predictions:", model.predict(X))
print("Weights:", model.coef_)
print("Bias:", model.intercept_)`,
        explanation: [
          'eta0 is the learning rate (how much the weights are updated per step).',
          'The perceptron successfully learns the OR logic function.',
          'It finds a linear decision boundary separating the 0s and 1s.',
        ],
      }
    }
  ],
  pretest: {
    title: 'Pre-Test',
    description: 'Assess your prior knowledge of neural networks.',
    questions: [
      { q: 'What biological structure does the weight of an artificial neuron loosely correspond to?', options: ['Nucleus', 'Synapse strength', 'Axon length', 'DNA'], answer: 1 },
      { q: 'Which problem famously proved that a single-layer perceptron cannot solve non-linearly separable data?', options: ['AND problem', 'OR problem', 'XOR problem', 'NOT problem'], answer: 2 },
    ],
  },
  procedure: {
    steps: [
      { title: 'Define Inputs', action: 'Define input vectors and expected outputs (e.g., OR gate).', input: 'Truth table', process: 'Initialize X and y arrays', output: 'Training data' },
      { title: 'Initialize Weights', action: 'Set weights and bias to zero or small random numbers.', input: 'None', process: 'Model instantiation', output: 'Initial parameters' },
      { title: 'Calculate Output', action: 'Compute the weighted sum and apply the step function.', input: 'X, weights', process: 'Dot product + step', output: 'Predicted y' },
      { title: 'Update Weights', action: 'Update parameters using the learning rule if there is an error.', input: 'Error (y_true - y_pred)', process: 'Weight update formula', output: 'New weights' },
    ],
    inputProcessOutput: {
      input: 'Binary inputs.',
      process: 'Iterative weight adjustment driven by classification error.',
      output: 'A linear decision boundary separating the classes.',
    }
  },
  results: {
    observations: [
      'The perceptron converges quickly for linearly separable data like the OR gate.',
      'The final weights and bias define a straight line separating the two classes.',
    ],
    keyInsight: 'A single perceptron can only learn linear boundaries. To solve complex problems like XOR, Multi-Layer Perceptrons (MLPs) with non-linear activation functions are required.',
  },
  posttest: {
    title: 'Post-Test',
    description: 'Verify your understanding of the perceptron.',
    questions: [
      { q: 'What is the purpose of the bias term in a perceptron?', options: ['To increase the learning rate', 'To shift the decision boundary away from the origin', 'To act as an extra feature', 'To prevent overfitting'], answer: 1 },
      { q: 'What happens to the weights during training if the perceptron makes a correct prediction?', options: ['They are doubled', 'They are set to zero', 'They remain unchanged', 'They are randomized'], answer: 2 },
    ],
  }
};
