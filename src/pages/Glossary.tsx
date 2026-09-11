// src/pages/Glossary.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { glossaryTerms, GlossaryItem } from '../data/glossaryData';
import { experiments } from '../data/experiments';
import FormulaCard from '../components/FormulaCard';
import GlossaryVisual from '../components/GlossaryVisual';
import './Glossary.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const CATEGORIES = [
  'All',
  'Pre-processing',
  'Regression',
  'Classification',
  'Dimensionality',
  'Unsupervised',
  'Tree Models',
  'Neural Networks',
  'Evaluation',
  'General ML',
] as const;

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute letters that have at least one term
  const activeLetters = useMemo(() => {
    const set = new Set<string>();
    glossaryTerms.forEach(item => set.add(item.letter.toUpperCase()));
    return set;
  }, []);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return glossaryTerms.filter(item => {
      // 1. Search Query filter
      if (query) {
        const matchesTerm = item.term.toLowerCase().includes(query);
        const matchesDef = item.definition.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        const matchesExp = item.relatedExperiments.some(expId => `exp ${expId}`.includes(query) || `experiment ${expId}`.includes(query));
        if (!matchesTerm && !matchesDef && !matchesCat && !matchesExp) {
          return false;
        }
      }

      // 2. Alphabet filter
      if (selectedLetter !== 'ALL' && item.letter.toUpperCase() !== selectedLetter) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedLetter, selectedCategory]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLetter('ALL');
    setSelectedCategory('All');
  };

  return (
    <div className="glossary-container animate-fade-in">
      {/* ─── Hero Header ─── */}
      <div className="glossary-hero">
        <div className="glossary-badge">Academic Reference</div>
        <h1 className="glossary-title">Machine Learning Glossary</h1>
        <p className="glossary-subtitle">
          Comprehensive, student-friendly definitions, mathematical formulations, and laboratory references for {glossaryTerms.length} core concepts across all 10 experiments.
        </p>

        {/* Search Bar */}
        <div className="glossary-search-wrapper">
          <span className="glossary-search-icon">🔍</span>
          <input
            type="text"
            className="glossary-search-input"
            placeholder="Search concepts, definitions, formulas, or experiments (e.g. 'Sigmoid', 'Overfitting', 'Exp 01')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="glossary-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      <div className="glossary-cat-bar" role="tablist" aria-label="Glossary categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={selectedCategory === cat}
            className={`glossary-cat-btn${selectedCategory === cat ? ' glossary-cat-btn--active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── A-Z Alphabet Navigation ─── */}
      <div className="glossary-az-bar" role="navigation" aria-label="Alphabetical index">
        <button
          className={`glossary-az-btn${selectedLetter === 'ALL' ? ' glossary-az-btn--active' : ''}`}
          onClick={() => setSelectedLetter('ALL')}
        >
          ALL
        </button>
        {ALPHABET.map(letter => {
          const hasTerms = activeLetters.has(letter);
          const isSelected = selectedLetter === letter;
          return (
            <button
              key={letter}
              disabled={!hasTerms}
              className={`glossary-az-btn${isSelected ? ' glossary-az-btn--active' : ''}${!hasTerms ? ' glossary-az-btn--disabled' : ''}`}
              onClick={() => setSelectedLetter(letter)}
              title={hasTerms ? `Jump to ${letter}` : `No terms under ${letter}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* ─── Results Meta Bar ─── */}
      <div className="glossary-results-meta">
        <span className="glossary-results-count">
          Showing <strong>{filteredTerms.length}</strong> of {glossaryTerms.length} concepts
          {(searchQuery || selectedLetter !== 'ALL' || selectedCategory !== 'All') && (
            <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              (Filtered)
            </span>
          )}
        </span>
        {(searchQuery || selectedLetter !== 'ALL' || selectedCategory !== 'All') && (
          <button className="glossary-reset-link" onClick={handleResetFilters}>
            Reset all filters ✕
          </button>
        )}
      </div>

      {/* ─── Terms Grid or Empty State ─── */}
      {filteredTerms.length === 0 ? (
        <div className="glossary-empty-state animate-fade-in">
          <div className="glossary-empty-icon">📖</div>
          <h2 className="glossary-empty-title">No matching glossary terms found</h2>
          <p className="glossary-empty-desc">
            No definitions matched your search <strong>"{searchQuery || selectedCategory}"</strong> under letter <strong>{selectedLetter}</strong>. Try refining your keyword or resetting your filters.
          </p>
          <button className="btn btn-primary" onClick={handleResetFilters}>
            View All {glossaryTerms.length} Terms
          </button>
        </div>
      ) : (
        <div className="glossary-grid">
          {filteredTerms.map((item: GlossaryItem) => {
            return (
              <div key={item.id} className="glossary-card">
                <div className="glossary-card-header">
                  <div className="glossary-card-term-wrap">
                    <span className="glossary-card-letter">{item.letter}</span>
                    <h3 className="glossary-card-term">{item.term}</h3>
                  </div>
                  <span className="badge badge-navy glossary-cat-badge">
                    {item.category}
                  </span>
                </div>

                <p className="glossary-card-def">{item.definition}</p>

                {/* Educational Vector Illustration */}
                <GlossaryVisual termId={item.id} category={item.category} />

                {/* Optional LaTeX Formula */}
                {item.formula && (
                  <div className="glossary-card-formula">
                    <FormulaCard
                      name={item.term}
                      latex={item.formula}
                    />
                  </div>
                )}

                {/* Related Experiments */}
                {item.relatedExperiments && item.relatedExperiments.length > 0 && (
                  <div className="glossary-card-footer">
                    <span className="glossary-related-label">Laboratory Links:</span>
                    <div className="glossary-exp-tags">
                      {item.relatedExperiments.map(expId => {
                        const expMeta = experiments.find(e => e.id === expId);
                        const expNumberStr = String(expMeta?.number || expId).padStart(2, '0');
                        return (
                          <Link
                            key={expId}
                            to={`/experiment/${expId}`}
                            className="glossary-exp-tag"
                            title={`Open Experiment ${expNumberStr}: ${expMeta?.title || ''}`}
                          >
                            Exp {expNumberStr}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
