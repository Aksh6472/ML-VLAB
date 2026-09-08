import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PythonBlock.css';
import { getPyodide } from '../utils/pyodide';

interface PythonBlockProps {
  title?: string;
  code: string;
  explanation?: string[];
}

type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function PythonBlock({ title, code, explanation }: PythonBlockProps) {
  // editedCode is the live, user-editable version
  const [editedCode, setEditedCode] = useState(code);
  const [output, setOutput] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pyStatus, setPyStatus] = useState<PyodideStatus>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset editedCode if the original `code` prop changes (e.g. navigating between sections)
  useEffect(() => {
    setEditedCode(code);
    setOutput(null);
    setRunError(null);
  }, [code]);

  // Auto-resize textarea to fit content
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [editedCode, autoResize]);

  const handleReset = () => {
    setEditedCode(code);
    setOutput(null);
    setRunError(null);
    // Trigger resize after state update
    setTimeout(autoResize, 0);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    setRunError(null);

    try {
      setPyStatus('loading');
      const pyodide = await getPyodide();
      setPyStatus('ready');

      let stdout = '';
      pyodide.setStdout({ batched: (str: string) => { stdout += str + '\n'; } });
      pyodide.setStderr({ batched: (str: string) => { stdout += '[stderr] ' + str + '\n'; } });

      await pyodide.runPythonAsync(editedCode);
      setOutput(stdout.trimEnd() || '(No output)');
    } catch (err: any) {
      setPyStatus('ready');
      setRunError(err.message || 'Execution Error');
    } finally {
      setIsRunning(false);
    }
  };

  const lineCount = editedCode.split('\n').length;

  return (
    <div className="python-block">
      {/* Title bar */}
      <div className="python-block-header">
        <div className="python-block-label">
          <span className="python-block-dot" />
          <span className="python-block-dot" />
          <span className="python-block-dot" />
          <span className="python-block-title">{title || 'Python'}</span>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {lineCount} line{lineCount !== 1 ? 's' : ''} · editable
        </div>
      </div>

      {/* Run / Reset bar — ABOVE the editor */}
      <div className="python-run-bar">
        <button
          className="python-run-btn"
          onClick={handleRun}
          disabled={isRunning}
          id={`run-btn-${title?.replace(/\s+/g, '-') || 'default'}`}
        >
          {isRunning ? (
            <>
              <span className="python-spinner" /> Running…
            </>
          ) : (
            <>▶ Run</>
          )}
        </button>
        <button
          className="python-reset-btn"
          onClick={handleReset}
          disabled={isRunning}
          title="Restore original code and clear output"
        >
          ↺ Reset
        </button>
        {pyStatus === 'loading' && !isRunning && (
          <span className="python-status-text">Loading Python runtime…</span>
        )}
        {pyStatus === 'ready' && !isRunning && (
          <span className="python-status-text python-status-ready">● Python ready</span>
        )}
      </div>

      {/* Editable code area */}
      <div className="python-editor-wrapper">
        <div className="python-line-numbers" aria-hidden="true">
          {editedCode.split('\n').map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="python-editor-textarea"
          value={editedCode}
          onChange={(e) => {
            setEditedCode(e.target.value);
            autoResize();
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Python code editor"
          rows={Math.max(lineCount, 4)}
        />
      </div>


      {/* Output */}
      {output !== null && (
        <div className="python-output-block">
          <div className="python-output-label">Output</div>
          <pre className="python-output-pre">{output}</pre>
        </div>
      )}

      {/* Error */}
      {runError !== null && (
        <div className="python-error-block">
          <div className="python-output-label" style={{ color: '#fc8181' }}>Error</div>
          <pre className="python-error-pre">{runError}</pre>
        </div>
      )}

      {/* Explanation */}
      {explanation && explanation.length > 0 && (
        <div className="python-block-explanation">
          <div className="python-block-explain-title">What's happening?</div>
          <ol className="python-block-explain-list">
            {explanation.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
