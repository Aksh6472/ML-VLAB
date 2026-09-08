// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'teacher';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Wait for the auth check to complete before making routing decisions
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '12px',
        color: 'var(--text-muted)',
        fontSize: 'var(--text-sm)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border-secondary)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        Verifying session…
      </div>
    );
  }

  // Not authenticated → redirect to login, preserving intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role → redirect to their correct dashboard
  if (role && user?.role !== role) {
    const correctDashboard = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
    return <Navigate to={correctDashboard} replace />;
  }

  return <>{children}</>;
}
