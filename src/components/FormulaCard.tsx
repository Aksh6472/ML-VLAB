// src/components/FormulaCard.tsx
import React, { useEffect, useRef } from 'react';
import katexLib from 'katex';
import 'katex/dist/katex.min.css';
import './FormulaCard.css';


interface FormulaCardProps {
  name: string;
  latex: string;
  description?: string;
}

const getKatex = () => {
  if (typeof katexLib !== 'undefined' && (katexLib as any).render) return katexLib;
  if (typeof window !== 'undefined' && (window as any).katex) return (window as any).katex;
  return null;
};

export default function FormulaCard({ name, latex, description }: FormulaCardProps) {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = getKatex();
    if (mathRef.current && k) {
      try {
        k.render(latex, mathRef.current, {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch {
        mathRef.current.textContent = latex;
      }
    } else if (mathRef.current) {
      mathRef.current.textContent = latex;
    }
  }, [latex]);

  return (
    <div className="formula-card">
      <div className="formula-card-label">{name}</div>
      <div className="formula-card-math" ref={mathRef} />
      {description && (
        <p className="formula-card-desc">{description}</p>
      )}
    </div>
  );
}

/* Inline formula renderer */
export function InlineMath({ latex }: { latex: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const k = getKatex();
    if (ref.current && k) {
      try {
        k.render(latex, ref.current, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        ref.current.textContent = latex;
      }
    } else if (ref.current) {
      ref.current.textContent = latex;
    }
  }, [latex]);
  return <span ref={ref} className="inline-math" />;
}

