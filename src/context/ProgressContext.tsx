import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface ExperimentProgress {
  aim: boolean;
  theory: boolean;
  pretest: boolean;
  procedure: boolean;
  results: boolean;
  posttest: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface QuizResult {
  score: number;
  total: number;
  answers: number[];
  submittedAt: string;
}

export interface Bookmark {
  id: string;
  type: string;
  experimentId: string;
  title: string;
  addedAt: string;
}

export interface ProgressState {
  experiments: Record<string, ExperimentProgress>;
  quizResults: Record<string, QuizResult>;
  procedureSteps: Record<string, boolean[]>;
  lastVisited: { experimentId: string; section: string } | null;
  bookmarks: Bookmark[];
  notes: Record<string, string>;
  isLoading: boolean;
}

const defaultProgress: ExperimentProgress = {
  aim: false,
  theory: false,
  pretest: false,
  procedure: false,
  results: false,
  posttest: false,
};

const initialEmptyState: ProgressState = {
  experiments: {},
  quizResults: {},
  procedureSteps: {},
  lastVisited: null,
  bookmarks: [],
  notes: {},
  isLoading: false,
};

interface ProgressContextType {
  progress: ProgressState;
  markSectionComplete: (experimentId: string, section: keyof ExperimentProgress) => Promise<void>;
  saveQuizResult: (quizId: string, result: QuizResult) => Promise<void>;
  getExperimentProgress: (experimentId: string) => ExperimentProgress;
  getCompletionPercent: (experimentId: string) => number;
  getOverallPercent: () => number;
  isExperimentCompleted: (experimentId: string) => boolean;
  isExperimentUnlocked: (experimentId: string) => boolean;
  isFinalTestUnlocked: () => boolean;
  setLastVisited: (experimentId: string, section: string) => void;
  toggleBookmark: (bookmark: { id: string; type: string; experimentId: string; title: string }) => Promise<void>;
  isBookmarked: (id: string) => boolean;
  saveNote: (key: string, text: string) => Promise<void>;
  getNote: (key: string) => string;
  saveProcedureStep: (experimentId: string, stepIndex: number, complete: boolean) => Promise<void>;
  getProcedureSteps: (experimentId: string, totalSteps: number) => boolean[];
  reloadProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType>({} as ProgressContextType);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [progress, setProgress] = useState<ProgressState>(initialEmptyState);

  // Load progress from backend whenever authenticated user changes
  const reloadProgress = useCallback(async () => {
    if (!token) {
      // Clear progress when unauthenticated
      setProgress(initialEmptyState);
      return;
    }

    try {
      setProgress(prev => ({ ...prev, isLoading: true }));
      const res = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProgress({
          experiments: data.experiments || {},
          quizResults: data.quizResults || {},
          procedureSteps: data.procedureSteps || {},
          bookmarks: data.bookmarks || [],
          notes: data.notes || {},
          lastVisited: null,
          isLoading: false,
        });
      } else {
        setProgress(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.warn('Failed to load progress from server:', err);
      setProgress(prev => ({ ...prev, isLoading: false }));
    }
  }, [token]);

  useEffect(() => {
    reloadProgress();
  }, [reloadProgress, user?.id]);

  const markSectionComplete = useCallback(async (experimentId: string, section: keyof ExperimentProgress) => {
    // 1. Optimistic UI update
    setProgress(prev => ({
      ...prev,
      experiments: {
        ...prev.experiments,
        [experimentId]: {
          ...(prev.experiments[experimentId] || defaultProgress),
          [section]: true,
        },
      },
    }));

    // 2. Persist to database if authenticated
    if (token) {
      try {
        await fetch('/api/progress/section', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ experimentId, section }),
        });
      } catch (err) {
        console.error('Error persisting section progress:', err);
      }
    }
  }, [token]);

  const saveQuizResult = useCallback(async (quizId: string, result: QuizResult) => {
    // quizId format: exp-1-pretest, exp-1-posttest, or final-ml-assessment
    const isExpQuiz = quizId.startsWith('exp-');
    const parts = quizId.split('-');
    const experimentId = isExpQuiz ? (parts[1] || '1') : '';
    const quizType = isExpQuiz ? (parts[2] || 'pretest') : '';

    // 1. Optimistic UI update
    setProgress(prev => ({
      ...prev,
      quizResults: { ...prev.quizResults, [quizId]: result },
      ...(isExpQuiz && experimentId ? {
        experiments: {
          ...prev.experiments,
          [experimentId]: {
            ...(prev.experiments[experimentId] || defaultProgress),
            [quizType as 'pretest' | 'posttest']: true,
          },
        },
      } : {}),
    }));

    // 2. Persist to database if authenticated and experiment quiz
    if (token && isExpQuiz && experimentId && ['pretest', 'posttest'].includes(quizType)) {
      try {
        await fetch('/api/quizzes/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            experimentId,
            quizType,
            score: result.score,
            totalQuestions: result.total,
            answers: result.answers,
          }),
        });
      } catch (err) {
        console.error('Error persisting quiz attempt:', err);
      }
    }
  }, [token]);

  const getExperimentProgress = useCallback((experimentId: string): ExperimentProgress => {
    return progress.experiments[experimentId] || defaultProgress;
  }, [progress.experiments]);

  const getCompletionPercent = useCallback((experimentId: string): number => {
    const p = progress.experiments[experimentId] || defaultProgress;
    const sections = [p.aim, p.theory, p.pretest, p.procedure, p.results, p.posttest];
    const completed = sections.filter(Boolean).length;
    return Math.round((completed / sections.length) * 100);
  }, [progress.experiments]);

  const getOverallPercent = useCallback((): number => {
    let total = 0;
    let completed = 0;
    for (let i = 1; i <= 10; i++) {
      const id = String(i);
      const p = progress.experiments[id] || defaultProgress;
      const sections = [p.aim, p.theory, p.pretest, p.procedure, p.results, p.posttest];
      total += sections.length;
      completed += sections.filter(Boolean).length;
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [progress.experiments]);

  const isExperimentCompleted = useCallback((experimentId: string): boolean => {
    return getCompletionPercent(experimentId) >= 100;
  }, [getCompletionPercent]);

  const isExperimentUnlocked = useCallback((experimentId: string): boolean => {
    if (user?.role === 'teacher') return true;
    const num = parseInt(experimentId, 10);
    if (isNaN(num) || num <= 1) return true;
    return isExperimentCompleted(String(num - 1));
  }, [user?.role, isExperimentCompleted]);

  const isFinalTestUnlocked = useCallback((): boolean => {
    if (user?.role === 'teacher') return true;
    for (let i = 1; i <= 10; i++) {
      if (!isExperimentCompleted(String(i))) {
        return false;
      }
    }
    return true;
  }, [user?.role, isExperimentCompleted]);

  const setLastVisited = useCallback((experimentId: string, section: string) => {
    setProgress(prev => ({
      ...prev,
      lastVisited: { experimentId, section },
    }));
  }, []);

  const toggleBookmark = useCallback(async (bookmark: { id: string; type: string; experimentId: string; title: string }) => {
    const exists = progress.bookmarks.find(b => b.experimentId === bookmark.experimentId);

    // 1. Optimistic UI update
    setProgress(prev => ({
      ...prev,
      bookmarks: exists
        ? prev.bookmarks.filter(b => b.experimentId !== bookmark.experimentId)
        : [...prev.bookmarks, { ...bookmark, addedAt: new Date().toISOString() }],
    }));

    // 2. Persist to database if authenticated
    if (token) {
      try {
        await fetch('/api/bookmarks/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            experimentId: bookmark.experimentId,
            title: bookmark.title,
            type: bookmark.type,
          }),
        });
      } catch (err) {
        console.error('Error toggling bookmark:', err);
      }
    }
  }, [token, progress.bookmarks]);

  const isBookmarked = useCallback((id: string): boolean => {
    return progress.bookmarks.some(b => b.experimentId === id || b.id === id);
  }, [progress.bookmarks]);

  const saveNote = useCallback(async (experimentId: string, text: string) => {
    // 1. Optimistic UI update
    setProgress(prev => ({
      ...prev,
      notes: { ...prev.notes, [experimentId]: text },
    }));

    // 2. Persist to database if authenticated
    if (token) {
      try {
        await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            experimentId,
            content: text,
          }),
        });
      } catch (err) {
        console.error('Error saving note:', err);
      }
    }
  }, [token]);

  const getNote = useCallback((experimentId: string): string => {
    return progress.notes[experimentId] || '';
  }, [progress.notes]);

  const saveProcedureStep = useCallback(async (experimentId: string, stepIndex: number, complete: boolean) => {
    // 1. Optimistic UI update
    setProgress(prev => {
      const existing = prev.procedureSteps[experimentId] || [];
      const updated = [...existing];
      updated[stepIndex] = complete;
      return {
        ...prev,
        procedureSteps: { ...prev.procedureSteps, [experimentId]: updated },
      };
    });

    // 2. Persist to database if authenticated
    if (token) {
      try {
        await fetch('/api/progress/step', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            experimentId,
            stepIndex,
            isCompleted: complete,
          }),
        });
      } catch (err) {
        console.error('Error saving procedure step:', err);
      }
    }
  }, [token]);

  const getProcedureSteps = useCallback((experimentId: string, totalSteps: number): boolean[] => {
    const existing = progress.procedureSteps[experimentId] || [];
    return Array.from({ length: totalSteps }, (_, i) => existing[i] || false);
  }, [progress.procedureSteps]);

  return (
    <ProgressContext.Provider value={{
      progress,
      markSectionComplete,
      saveQuizResult,
      getExperimentProgress,
      getCompletionPercent,
      getOverallPercent,
      isExperimentCompleted,
      isExperimentUnlocked,
      isFinalTestUnlocked,
      setLastVisited,
      toggleBookmark,
      isBookmarked,
      saveNote,
      getNote,
      saveProcedureStep,
      getProcedureSteps,
      reloadProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
