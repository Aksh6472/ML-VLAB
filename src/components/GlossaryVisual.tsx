import React from 'react';

interface GlossaryVisualProps {
  termId: string;
  category: string;
}

export default function GlossaryVisual({ termId, category }: GlossaryVisualProps) {
  const svgProps = {
    width: "100%",
    height: "110",
    viewBox: "0 0 320 110",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    style: { display: 'block', margin: '8px 0' }
  };

  switch (termId) {
    case 'generalisation':
    case 'underfitting':
    case 'overfitting':
      return (
        <div className="glossary-visual-box" title="Decision Boundary & Generalization">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Axis */}
            <path d="M 30 90 L 290 90" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 30 15 L 30 90" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Class 1 dots (Blue/Purple) */}
            <circle cx="70" cy="70" r="5" fill="#4a90e2" />
            <circle cx="100" cy="55" r="5" fill="#4a90e2" />
            <circle cx="120" cy="75" r="5" fill="#4a90e2" />
            <circle cx="140" cy="60" r="5" fill="#4a90e2" />
            {/* Class 2 dots (Purple/Violet) */}
            <circle cx="180" cy="35" r="5" fill="#805ad5" />
            <circle cx="210" cy="45" r="5" fill="#805ad5" />
            <circle cx="230" cy="25" r="5" fill="#805ad5" />
            <circle cx="260" cy="35" r="5" fill="#805ad5" />
            {/* Smooth Decision Boundary */}
            <path d="M 40 85 C 110 80, 150 40, 280 20" stroke="var(--accent-primary)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <text x="175" y="85" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="sans-serif">Decision Boundary</text>
          </svg>
        </div>
      );

    case 'gridsearchcv':
    case 'hyperparameter':
      return (
        <div className="glossary-visual-box" title="Parameter Grid Search">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Grid Cells */}
            <g stroke="var(--border-secondary)" strokeWidth="1.5">
              <rect x="40" y="20" width="50" height="24" rx="4" fill="var(--bg-surface)" />
              <rect x="100" y="20" width="50" height="24" rx="4" fill="var(--bg-surface)" />
              <rect x="160" y="20" width="50" height="24" rx="4" fill="rgba(56, 161, 105, 0.15)" stroke="#38a169" strokeWidth="2" />
              <rect x="220" y="20" width="50" height="24" rx="4" fill="var(--bg-surface)" />

              <rect x="40" y="52" width="50" height="24" rx="4" fill="var(--bg-surface)" />
              <rect x="100" y="52" width="50" height="24" rx="4" fill="var(--bg-surface)" />
              <rect x="160" y="52" width="50" height="24" rx="4" fill="var(--bg-surface)" />
              <rect x="220" y="52" width="50" height="24" rx="4" fill="var(--bg-surface)" />
            </g>
            <text x="65" y="36" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">C=0.1</text>
            <text x="125" y="36" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">C=1.0</text>
            <text x="185" y="36" textAnchor="middle" fill="#38a169" fontSize="9" fontWeight="700">Best 96%</text>
            <text x="245" y="36" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">C=10</text>
            <text x="160" y="96" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">Cross-Validation Grid</text>
          </svg>
        </div>
      );

    case 'k-fold-cross-validation':
    case 'fold':
    case 'stratified-k-fold':
    case 'cross-validation':
      return (
        <div className="glossary-visual-box" title="K-Fold Dataset Split Blocks">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Fold 1 */}
            <g transform="translate(30, 20)">
              <rect x="0" y="0" width="45" height="16" rx="3" fill="#e53e3e" />
              <rect x="50" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
              <rect x="100" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
              <rect x="150" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
              <rect x="200" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
            </g>
            {/* Fold 2 */}
            <g transform="translate(30, 42)">
              <rect x="0" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
              <rect x="50" y="0" width="45" height="16" rx="3" fill="#e53e3e" />
              <rect x="100" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
              <rect x="150" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
              <rect x="200" y="0" width="45" height="16" rx="3" fill="var(--accent-primary)" opacity="0.4" />
            </g>
            {/* Legend */}
            <rect x="60" y="75" width="12" height="12" rx="2" fill="var(--accent-primary)" opacity="0.4" />
            <text x="78" y="85" fill="var(--text-secondary)" fontSize="10">Train Fold</text>
            <rect x="160" y="75" width="12" height="12" rx="2" fill="#e53e3e" />
            <text x="178" y="85" fill="var(--text-secondary)" fontSize="10">Val Fold</text>
          </svg>
        </div>
      );

    case 'feature-scaling':
    case 'standardisation':
    case 'min-max-normalisation':
    case 'normalisation':
      return (
        <div className="glossary-visual-box" title="Feature Scaling Before & After">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Before (Wide unscaled oval) */}
            <g transform="translate(20, 15)">
              <ellipse cx="65" cy="40" rx="55" ry="20" fill="rgba(229, 62, 62, 0.1)" stroke="#e53e3e" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="45" cy="40" r="3" fill="#e53e3e" />
              <circle cx="65" cy="30" r="3" fill="#e53e3e" />
              <circle cx="85" cy="45" r="3" fill="#e53e3e" />
              <text x="65" y="75" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">Unscaled [0 - 1000]</text>
            </g>

            {/* Arrow */}
            <path d="M 155 45 L 175 45" stroke="var(--text-primary)" strokeWidth="2" markerEnd="url(#arrow)" />

            {/* After (Standardized circle) */}
            <g transform="translate(180, 15)">
              <circle cx="65" cy="40" r="28" fill="rgba(56, 161, 105, 0.15)" stroke="#38a169" strokeWidth="1.5" />
              <circle cx="55" cy="40" r="3" fill="#38a169" />
              <circle cx="65" cy="30" r="3" fill="#38a169" />
              <circle cx="75" cy="45" r="3" fill="#38a169" />
              <text x="65" y="75" textAnchor="middle" fill="#38a169" fontSize="10" fontWeight="600">Scaled [0 - 1]</text>
            </g>
          </svg>
        </div>
      );

    case 'feature-randomness':
    case 'random-forest':
    case 'ensemble-learning':
    case 'voting':
      return (
        <div className="glossary-visual-box" title="Feature Selection & Tree Ensemble">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Tree 1 */}
            <g transform="translate(35, 20)">
              <circle cx="35" cy="12" r="7" fill="var(--accent-primary)" />
              <line x1="35" y1="19" x2="20" y2="40" stroke="var(--border-secondary)" strokeWidth="1.5" />
              <line x1="35" y1="19" x2="50" y2="40" stroke="var(--border-secondary)" strokeWidth="1.5" />
              <circle cx="20" cy="45" r="5" fill="#38a169" />
              <circle cx="50" cy="45" r="5" fill="#805ad5" />
              <text x="35" y="70" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">Tree 1 (Sub: m1)</text>
            </g>
            {/* Tree 2 */}
            <g transform="translate(125, 20)">
              <circle cx="35" cy="12" r="7" fill="var(--accent-primary)" />
              <line x1="35" y1="19" x2="20" y2="40" stroke="var(--border-secondary)" strokeWidth="1.5" />
              <line x1="35" y1="19" x2="50" y2="40" stroke="var(--border-secondary)" strokeWidth="1.5" />
              <circle cx="20" cy="45" r="5" fill="#38a169" />
              <circle cx="50" cy="45" r="5" fill="#38a169" />
              <text x="35" y="70" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">Tree 2 (Sub: m2)</text>
            </g>
            {/* Tree 3 */}
            <g transform="translate(215, 20)">
              <circle cx="35" cy="12" r="7" fill="var(--accent-primary)" />
              <line x1="35" y1="19" x2="20" y2="40" stroke="var(--border-secondary)" strokeWidth="1.5" />
              <line x1="35" y1="19" x2="50" y2="40" stroke="var(--border-secondary)" strokeWidth="1.5" />
              <circle cx="20" cy="45" r="5" fill="#805ad5" />
              <circle cx="50" cy="45" r="5" fill="#38a169" />
              <text x="35" y="70" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">Tree 3 (Sub: m3)</text>
            </g>
            <text x="160" y="98" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">Majority Voting Ensemble</text>
          </svg>
        </div>
      );

    case 'gini-impurity':
    case 'decision-tree':
    case 'splitting-criteria':
    case 'node':
      return (
        <div className="glossary-visual-box" title="Gini Impurity Split Visualization">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Root Node (Impurity 0.5) */}
            <g transform="translate(130, 15)">
              <rect x="0" y="0" width="60" height="24" rx="4" fill="rgba(128, 90, 213, 0.2)" stroke="#805ad5" strokeWidth="1.5" />
              <text x="30" y="16" textAnchor="middle" fill="#805ad5" fontSize="10" fontWeight="700">Gini = 0.50</text>
            </g>
            {/* Branches */}
            <path d="M 140 39 L 85 62" stroke="var(--text-tertiary)" strokeWidth="1.5" />
            <path d="M 180 39 L 235 62" stroke="var(--text-tertiary)" strokeWidth="1.5" />
            {/* Child Node 1 (Pure Gini = 0) */}
            <g transform="translate(45, 62)">
              <rect x="0" y="0" width="80" height="24" rx="4" fill="rgba(56, 161, 105, 0.2)" stroke="#38a169" strokeWidth="1.5" />
              <text x="40" y="16" textAnchor="middle" fill="#38a169" fontSize="10" fontWeight="700">Pure Gini = 0.00</text>
            </g>
            {/* Child Node 2 (Gini = 0.25) */}
            <g transform="translate(195, 62)">
              <rect x="0" y="0" width="80" height="24" rx="4" fill="rgba(74, 144, 226, 0.2)" stroke="#4a90e2" strokeWidth="1.5" />
              <text x="40" y="16" textAnchor="middle" fill="#4a90e2" fontSize="10" fontWeight="700">Gini = 0.25</text>
            </g>
          </svg>
        </div>
      );

    case 'pca':
    case 'principal-component':
    case 'dimensionality-reduction':
    case 'explained-variance':
      return (
        <div className="glossary-visual-box" title="Principal Component Analysis Axes">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Scatter points along PC1 axis */}
            <g opacity="0.6">
              <circle cx="80" cy="80" r="4" fill="var(--text-tertiary)" />
              <circle cx="110" cy="65" r="4" fill="var(--text-tertiary)" />
              <circle cx="140" cy="55" r="4" fill="var(--text-tertiary)" />
              <circle cx="170" cy="45" r="4" fill="var(--text-tertiary)" />
              <circle cx="200" cy="30" r="4" fill="var(--text-tertiary)" />
              <circle cx="230" cy="20" r="4" fill="var(--text-tertiary)" />
            </g>
            {/* PC1 Line */}
            <line x1="60" y1="90" x2="250" y2="15" stroke="var(--accent-primary)" strokeWidth="2.5" />
            <text x="255" y="20" fill="var(--accent-primary)" fontSize="10" fontWeight="700">PC1 (85% Var)</text>
            {/* PC2 Line (Orthogonal) */}
            <line x1="125" y1="30" x2="175" y2="85" stroke="#e53e3e" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="180" y="90" fill="#e53e3e" fontSize="9">PC2 (15%)</text>
          </svg>
        </div>
      );

    case 'confusion-matrix':
    case 'accuracy':
    case 'precision':
    case 'recall':
    case 'f1-score':
      return (
        <div className="glossary-visual-box" title="Confusion Matrix Quad">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            <g transform="translate(100, 15)">
              <rect x="0" y="0" width="55" height="35" fill="rgba(56, 161, 105, 0.2)" stroke="#38a169" strokeWidth="1" rx="4" />
              <text x="27" y="21" textAnchor="middle" fill="#38a169" fontSize="11" fontWeight="700">TP</text>

              <rect x="65" y="0" width="55" height="35" fill="rgba(229, 62, 62, 0.15)" stroke="#e53e3e" strokeWidth="1" rx="4" />
              <text x="92" y="21" textAnchor="middle" fill="#e53e3e" fontSize="11" fontWeight="700">FP</text>

              <rect x="0" y="42" width="55" height="35" fill="rgba(229, 62, 62, 0.15)" stroke="#e53e3e" strokeWidth="1" rx="4" />
              <text x="27" y="63" textAnchor="middle" fill="#e53e3e" fontSize="11" fontWeight="700">FN</text>

              <rect x="65" y="42" width="55" height="35" fill="rgba(56, 161, 105, 0.2)" stroke="#38a169" strokeWidth="1" rx="4" />
              <text x="92" y="63" textAnchor="middle" fill="#38a169" fontSize="11" fontWeight="700">TN</text>
            </g>
            <text x="35" y="40" fill="var(--text-secondary)" fontSize="9" fontWeight="600">Actual +</text>
            <text x="35" y="80" fill="var(--text-secondary)" fontSize="9" fontWeight="600">Actual -</text>
          </svg>
        </div>
      );

    case 'sigmoid-function':
    case 'logistic-regression':
    case 'activation-function':
      return (
        <div className="glossary-visual-box" title="Sigmoid S-Curve Curve">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Grid lines */}
            <line x1="40" y1="20" x2="280" y2="20" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="40" y1="85" x2="280" y2="85" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="160" y1="15" x2="160" y2="90" stroke="var(--text-tertiary)" strokeWidth="1" strokeDasharray="2 2" />
            {/* Sigmoid Curve */}
            <path d="M 40 83 C 100 83, 120 80, 160 52 C 200 24, 220 22, 280 22" stroke="var(--accent-primary)" strokeWidth="2.5" fill="none" />
            <text x="25" y="24" fill="var(--text-tertiary)" fontSize="9">1.0</text>
            <text x="25" y="56" fill="var(--text-tertiary)" fontSize="9">0.5</text>
            <text x="25" y="88" fill="var(--text-tertiary)" fontSize="9">0.0</text>
            <text x="160" y="102" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600">z (Linear Combination)</text>
          </svg>
        </div>
      );

    case 'k-means':
    case 'centroid':
    case 'cluster':
    case 'clustering':
      return (
        <div className="glossary-visual-box" title="Cluster Centroids">
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            {/* Cluster 1 */}
            <g transform="translate(30, 0)">
              <circle cx="50" cy="50" r="30" fill="rgba(74, 144, 226, 0.12)" stroke="#4a90e2" strokeDasharray="3 3" />
              <circle cx="40" cy="45" r="4" fill="#4a90e2" />
              <circle cx="55" cy="40" r="4" fill="#4a90e2" />
              <circle cx="50" cy="60" r="4" fill="#4a90e2" />
              <polygon points="50,44 54,54 42,47 58,47 46,54" fill="#e53e3e" /> {/* Centroid X star */}
              <text x="50" y="92" textAnchor="middle" fill="#4a90e2" fontSize="9" fontWeight="600">Cluster 1</text>
            </g>

            {/* Cluster 2 */}
            <g transform="translate(160, 0)">
              <circle cx="60" cy="45" r="32" fill="rgba(128, 90, 213, 0.12)" stroke="#805ad5" strokeDasharray="3 3" />
              <circle cx="50" cy="40" r="4" fill="#805ad5" />
              <circle cx="70" cy="35" r="4" fill="#805ad5" />
              <circle cx="65" cy="55" r="4" fill="#805ad5" />
              <polygon points="60,39 64,49 52,42 68,42 56,49" fill="#e53e3e" />
              <text x="60" y="92" textAnchor="middle" fill="#805ad5" fontSize="9" fontWeight="600">Cluster 2</text>
            </g>
          </svg>
        </div>
      );

    default:
      // Generic clean vector representation for any other ML term based on category
      return (
        <div className="glossary-visual-box" title={`${category} Illustration`}>
          <svg {...svgProps}>
            <rect width="320" height="110" rx="8" fill="var(--bg-primary)" stroke="var(--border-secondary)" strokeWidth="1" />
            <path d="M 40 85 Q 110 20, 160 55 T 280 25" stroke="var(--accent-primary)" strokeWidth="2" fill="none" opacity="0.8" />
            <circle cx="95" cy="52" r="4" fill="#805ad5" />
            <circle cx="160" cy="55" r="4" fill="#38a169" />
            <circle cx="225" cy="38" r="4" fill="#4a90e2" />
            <text x="160" y="95" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontWeight="600">{category} Vector Schema</text>
          </svg>
        </div>
      );
  }
}
