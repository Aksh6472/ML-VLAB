// src/App.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const ExperimentsIndex = lazy(() => import('./pages/ExperimentsIndex'));
const ExperimentPage = lazy(() => import('./pages/ExperimentPage'));
const LearningPath = lazy(() => import('./pages/LearningPath'));
const Glossary = lazy(() => import('./pages/Glossary'));
const VisualLab = lazy(() => import('./pages/VisualLab'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const StudentDashboard = lazy(() => import('./pages/Student/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/Student/StudentProfile'));
const TeacherDashboard = lazy(() => import('./pages/Teacher/TeacherDashboard'));
const StudentDetailView = lazy(() => import('./pages/Teacher/StudentDetailView'));
const CreateTest = lazy(() => import('./pages/Teacher/CreateTest'));
const FacultyTestsPage = lazy(() => import('./pages/Teacher/FacultyTestsPage'));
const TestReportView = lazy(() => import('./pages/Teacher/TestReportView'));
const JoinClassPage = lazy(() => import('./pages/Student/JoinClassPage'));
const FinalTest = lazy(() => import('./pages/Student/FinalTest'));
const NotFound = lazy(() => import('./pages/NotFound'));

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--text-muted)',
      fontSize: 'var(--text-sm)',
    }}>
      Loading…
    </div>
  );
}

/**
 * Root redirect — authentication-aware:
 *   • Not logged in          → /login
 *   • Logged in as student   → /student/dashboard
 *   • Logged in as teacher   → /teacher/dashboard
 */
function RootRedirect() {
  const { isAuthenticated, isLoading, isTeacher } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isTeacher ? '/teacher/dashboard' : '/student/dashboard'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ProgressProvider>
            {/* Background Layer exclusively for Light Theme */}
            <div 
              className="fixed inset-0 w-full h-screen pointer-events-none z-0 bg-cover bg-center bg-no-repeat block dark:hidden opacity-80 light-theme-bg-layer"
              style={{ backgroundImage: "url('/light.png')", backgroundPosition: "center", backgroundSize: "cover" }}
              aria-hidden="true"
            />
            {/* Background Layer exclusively for Dark Theme */}
            <div 
              className="fixed inset-0 w-full h-screen pointer-events-none z-0 bg-cover bg-center bg-no-repeat hidden dark:block opacity-75 dark-theme-bg-layer"
              style={{ backgroundImage: "url('/dark.jpg')", backgroundPosition: "center", backgroundSize: "cover" }}
              aria-hidden="true"
            />
            <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Root — public Home / Welcome page */}
                  <Route path="/" element={<Home />} />

                  {/* Auth routes — always public */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/faculty/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ForgotPassword />} />

                  {/* Convenience /dashboard → correct dashboard */}
                  <Route path="/dashboard" element={<RootRedirect />} />

                  {/* ── Student-only routes ───────────────────────── */}
                  <Route
                    path="/student/dashboard"
                    element={
                      <ProtectedRoute role="student">
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/profile"
                    element={
                      <ProtectedRoute role="student">
                        <StudentProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/join/:code"
                    element={
                      <ProtectedRoute role="student">
                        <JoinClassPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* ── Shared Educational & Student routes ───────────────────────── */}
                  <Route
                    path="/experiments"
                    element={
                      <ProtectedRoute>
                        <ExperimentsIndex />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/experiment/:id/:section?"
                    element={
                      <ProtectedRoute>
                        <ExperimentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/learning-path"
                    element={
                      <ProtectedRoute>
                        <LearningPath />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/visual-lab"
                    element={
                      <ProtectedRoute>
                        <VisualLab />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/glossary"
                    element={
                      <ProtectedRoute>
                        <Glossary />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/final-test"
                    element={
                      <ProtectedRoute role="student">
                        <FinalTest />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── Faculty / Teacher-only routes ───────────────────────── */}
                  <Route
                    path="/teacher/dashboard"
                    element={
                      <ProtectedRoute role="teacher">
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/students/:id"
                    element={
                      <ProtectedRoute role="teacher">
                        <StudentDetailView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/create-test"
                    element={
                      <ProtectedRoute role="teacher">
                        <CreateTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/tests"
                    element={
                      <ProtectedRoute role="teacher">
                        <FacultyTestsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/tests/create"
                    element={
                      <ProtectedRoute role="teacher">
                        <CreateTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/tests/edit/:id"
                    element={
                      <ProtectedRoute role="teacher">
                        <CreateTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teacher/tests/:id/reports"
                    element={
                      <ProtectedRoute role="teacher">
                        <TestReportView />
                      </ProtectedRoute>
                    }
                  />

                  {/* Explicit Role-Protected /faculty/* Routes */}
                  <Route
                    path="/faculty/dashboard"
                    element={
                      <ProtectedRoute role="teacher">
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/faculty/students/:id"
                    element={
                      <ProtectedRoute role="teacher">
                        <StudentDetailView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/faculty/tests"
                    element={
                      <ProtectedRoute role="teacher">
                        <FacultyTestsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/faculty/tests/create"
                    element={
                      <ProtectedRoute role="teacher">
                        <CreateTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/faculty/tests/edit/:id"
                    element={
                      <ProtectedRoute role="teacher">
                        <CreateTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/faculty/tests/:id/reports"
                    element={
                      <ProtectedRoute role="teacher">
                        <TestReportView />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
        </ProgressProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
