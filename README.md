# ML Virtual Lab

An interactive, web-based Virtual Laboratory designed for learning Machine Learning (ML) core concepts through structured theory, step-by-step procedure guides, code examples, interactive algorithm visualizations, self-assessment quizzes, and real-time execution tools.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [List of Experiments](#list-of-experiments)
- [Interactive Visualizations](#interactive-visualizations)
- [Technology Stack](#technology-stack)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

The Machine Learning Virtual Lab (ML Virtual Lab) serves as a comprehensive educational platform aimed at bridging theoretical computer science concepts with practical implementation. It provides students and researchers with step-by-step guided modules covering fundamental supervised and unsupervised machine learning algorithms.

Each module integrates mathematical formulations rendered in LaTeX/KaTeX, Python code implementations with syntax highlighting, parameter-driven interactive visualizations built with D3.js, and pre-/post-experiment assessment quizzes.

---

## Key Features

- **10 Structured Experiments**: Complete modules covering data pre-processing, regression, classification, clustering, ensemble methods, and neural networks.
- **Interactive Visualizations**: Dynamic D3.js visual tools allowing users to alter parameters, dataset distributions, and hyperparameters to observe algorithm behavior in real time.
- **Mathematical Formulations**: High-fidelity formula rendering powered by KaTeX.
- **Code Reference & Syntax Highlighting**: Python implementation examples with syntax highlighting using Prism.js.
- **Assessment Engine**: Integrated pre-test and post-test quizzes to evaluate theoretical and practical comprehension.
- **Progress Tracking & Persistence**: Saved user progress, bookmarks, and personal notes stored using client-side local storage and database backend.
- **Full-Stack Architecture**: React (TypeScript) frontend paired with an Express backend using PostgreSQL / SQLite for server operations and authentication.
- **End-to-End Testing**: Comprehensive E2E testing powered by Playwright.
- **Responsive Design**: Optimized layout for desktop and mobile screen sizes with light and dark theme support.

---

## List of Experiments

| ID | Experiment Title | Primary Learning Focus |
|---|---|---|
| 01 | Data Pre-processing for Machine Learning | Feature scaling, handling missing values, encoding categorical variables |
| 02 | Linear Regression | Gradient descent, line fitting, loss functions (MSE), residual analysis |
| 03 | Cross-Validation for Model Evaluation | K-Fold cross-validation, train-test splitting, overfitting/underfitting detection |
| 04 | Logistic Regression for Binary Classification | Sigmoid function, decision boundaries, cross-entropy loss, log-odds |
| 05 | Principal Component Analysis (PCA) | Dimensionality reduction, variance maximization, eigenvectors and eigenvalues |
| 06 | Support Vector Machine (SVM) Classification | Maximum margin hyperplanes, support vectors, soft margin cost (C parameter) |
| 07 | K-Means Clustering | Iterative centroid alignment, distance metrics, cluster convergence |
| 08 | Decision Tree Classification | Information gain, Gini impurity, entropy reduction, feature splitting |
| 09 | Random Forest Classification | Ensemble learning, bootstrap aggregation (bagging), majority voting |
| 10 | Artificial Neural Network (Perceptron) | Single-layer perceptron, weighted summation, activation thresholding, weight updates |

---

## Interactive Visualizations

The platform features specialized interactive visualization engines built with D3.js:

- **Linear Regression Engine**: Adjust slope, intercept, and learning rate interactively while visualizing loss surfaces and residual errors.
- **Logistic Regression Engine**: Modify decision boundary thresholds and evaluate binary separation curves.
- **PCA Dimensionality Reduction Engine**: Project multi-dimensional datasets onto principal components and inspect scree plots.
- **SVM Margin Explorer**: Adjust soft-margin penalty parameters and observe hyperplanes and support vector selection.
- **K-Means Centroid Simulator**: Step through iterative centroid updates and cluster reassignments frame-by-frame.
- **Decision Tree Construction View**: Visualize recursive node splitting, threshold conditions, and leaf node assignments.
- **Random Forest Majority Voter**: Observe individual decision tree predictions and aggregation for ensemble classification.
- **Perceptron Learning Step Tracker**: Inspect step-by-step weight updates and hyperplane convergence during binary training.

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Data Visualization**: D3.js v7
- **Routing**: React Router v6
- **LaTeX Math Rendering**: KaTeX
- **Code Syntax Highlighting**: Prism.js

### Backend
- **Runtime Environment**: Node.js
- **Server Framework**: Express 4
- **Language**: TypeScript (`tsx` execution)
- **Database Engine**: PostgreSQL (`pg`) with SQL.js fallback support
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Email Service**: Nodemailer

### Testing & Tooling
- **End-to-End Testing**: Playwright
- **Development Process Runner**: Concurrently

---

## Project Architecture & Directory Structure

```text
ml-virtual-lab/
├── api/                   # Serverless API handlers / endpoints
├── public/                # Static public assets
├── server/                # Express backend application
│   ├── src/               # Backend TypeScript source code
│   ├── package.json       # Backend package configuration
│   └── tsconfig.json      # Backend TypeScript configuration
├── src/                   # React frontend application
│   ├── assets/            # Static images and icons
│   ├── components/        # Reusable UI components & D3 visualizations
│   │   └── visualizations/ # Interactive ML D3 visualization modules
│   ├── context/           # React context providers (Theme, Progress)
│   ├── data/              # Experiment content files (exp-01 to exp-10)
│   ├── pages/             # Page components (Home, Experiments, Details)
│   ├── styles/            # CSS stylesheets and theme definitions
│   └── utils/             # Helper utility functions
├── tests/                 # Playwright E2E test suites
├── index.html             # HTML entry point
├── package.json           # Root project metadata and scripts
├── playwright.config.ts   # Playwright configuration
├── tsconfig.json          # Root TypeScript configuration
└── vite.config.ts         # Vite bundler configuration
```

---

## Prerequisites

Before setting up the project, ensure your environment meets the following requirements:

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Git**: Installed and configured on your system

---

## Getting Started

### Installation

1. Clone the repository to your local system:
   ```bash
   git clone https://github.com/your-org/ml-virtual-lab.git
   cd ml-virtual-lab
   ```

2. Install root dependencies (frontend & development tooling):
   ```bash
   npm install
   ```

3. Install backend server dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```

### Environment Configuration

Create a `.env` file in the `server/` directory by copying the example environment file:

```bash
cp .env.example server/.env
```

Define the required variables inside `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/vlab_db
JWT_SECRET=your_secure_jwt_secret_key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

### Running the Application

To launch both the frontend client and backend server concurrently in development mode:

```bash
npm run dev
```

By default:
- **Frontend Client** runs on `http://localhost:5173`
- **Backend API Server** runs on `http://localhost:5000`

To start the services individually:
- **Frontend Client only**: `npm run client`
- **Backend Server only**: `npm run server`

---

## Available Scripts

In the project root directory, you can run the following commands:

| Command | Description |
|---|---|
| `npm run dev` | Starts both frontend (Vite) and backend (Express) concurrently in development mode. |
| `npm run client` | Launches the Vite frontend development server only. |
| `npm run server` | Starts the Express backend server with `tsx` live-reloading. |
| `npm run build` | Compiles the production bundle for the frontend and transpiles backend TypeScript files. |
| `npm run preview` | Previews the local production build generated by Vite. |
| `npm run test:e2e` | Executes the Playwright end-to-end test suite in headless mode. |
| `npm run test:e2e:ui` | Launches Playwright Test Runner with interactive UI. |
| `npm run test:e2e:headed` | Executes Playwright tests in headed browser mode. |
| `npm run test:e2e:report` | Serves the HTML test report generated by Playwright. |

---

## Testing

End-to-end testing is configured with Playwright to verify routing, experiment interaction, visualization rendering, and quiz functionality.

Run all tests:
```bash
npm run test:e2e
```

Open interactive UI mode for debugging:
```bash
npm run test:e2e:ui
```

---

## Deployment

### Production Build

To prepare the application for production deployment, run:

```bash
npm run build
```

This generates:
- Built static web assets in `dist/`
- Transpiled backend JavaScript in `server/dist/`

### Deployment Platforms

- **Vercel / Netlify**: Configured via `vercel.json` for frontend and serverless API deployment.
- **Node.js Server**: Run `node server/dist/server.js` for standalone backend server environments.

---

## License

This project is released under the [MIT License](LICENSE).
