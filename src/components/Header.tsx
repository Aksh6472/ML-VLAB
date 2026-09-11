import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import srmLogo from '../assets/srm-logo.png';
import './Header.css';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/experiments', label: 'Experiments' },
  { to: '/learning-path', label: 'Learning Path' },
  { to: '/visual-lab', label: 'Visual Lab' },
  { to: '/glossary', label: 'Glossary' },
];

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Header() {
  const location = useLocation();

  // Hide header completely on standalone authentication routes (/login, /faculty/login, /register)
  if (['/login', '/faculty/login', '/register'].includes(location.pathname)) {
    return null;
  }

  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { getOverallPercent } = useProgress();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const overallPercent = getOverallPercent();
  const circumference = 2 * Math.PI * 7;
  const offset = circumference - (overallPercent / 100) * circumference;

  const handleLogout = () => {
    setShowUserMenu(false);
    const targetLogin = user?.role === 'teacher' ? '/faculty/login' : '/login';
    logout();
    navigate(targetLogin, { replace: true });
  };

  const dashboardPath = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <Link to="/" className="header-brand" aria-label="ML Virtual Lab Home">
          <img src={srmLogo} alt="SRM Logo" className="header-logo" />
          <span className="header-title">
            ML <span className="header-title-accent">Virtual Lab</span>
          </span>
        </Link>

        <nav className="header-nav" role="navigation" aria-label="Main navigation">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink
              to={dashboardPath}
              className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
            >
              Dashboard
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'teacher' && (
            <NavLink
              to="/teacher/tests"
              className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
            >
              Tests
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          {/* Progress ring — only for students */}
          {isAuthenticated && user?.role === 'student' && overallPercent > 0 && (
            <div className="header-progress-badge" aria-label={`Overall progress: ${overallPercent}%`}>
              <svg className="header-progress-ring" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="7" fill="none" stroke="var(--border-secondary)" strokeWidth="2" />
                <circle
                  cx="10" cy="10" r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 10 10)"
                />
              </svg>
              <span>{overallPercent}%</span>
            </div>
          )}

          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <button
            className="header-mobile-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle mobile menu"
            title="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Auth area */}
          {isAuthenticated && user ? (
            <div className="header-user-menu-wrapper" style={{ position: 'relative' }}>
              <button
                className="header-user-btn"
                onClick={() => setShowUserMenu(prev => !prev)}
                aria-label="User menu"
                title={user.name}
              >
                <span className="header-user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="header-user-name">{user.name.split(' ')[0]}</span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
              </button>

              {showUserMenu && (
                <>
                  {/* Backdrop to close on click-away */}
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="header-user-dropdown">
                    <div className="header-user-dropdown-info">
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{user.email}</div>
                      {user.studentId && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          ID: {user.studentId}
                        </div>
                      )}
                      <span className="header-user-role-badge">
                        {user.role === 'teacher' ? '👨‍🏫 Faculty' : '🎓 Student'}
                      </span>
                    </div>
                    <div className="header-user-dropdown-divider" />
                    <Link
                      to={dashboardPath}
                      className="header-user-dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📊 My Dashboard
                    </Link>
                    {user.role === 'teacher' && (
                      <>
                        <Link
                          to="/teacher/tests"
                          className="header-user-dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          📋 Tests & Score Reports
                        </Link>
                        <Link
                          to="/teacher/tests/create"
                          className="header-user-dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          ➕ Create New Test
                        </Link>
                      </>
                    )}
                    <div className="header-user-dropdown-divider" />
                    <button
                      className="header-user-dropdown-item header-user-logout"
                      onClick={handleLogout}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ fontSize: 'var(--text-sm)', padding: '6px 16px' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile navigation drop-down menu */}
      {mobileMenuOpen && (
        <div className="header-mobile-menu animate-fade-in">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `header-mobile-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{item.label}</span>
              <span>→</span>
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink
              to={dashboardPath}
              className={({ isActive }) => `header-mobile-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📊 My Dashboard</span>
              <span>→</span>
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'teacher' && (
            <>
              <NavLink
                to="/teacher/tests"
                className={({ isActive }) => `header-mobile-link${isActive ? ' active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>📋 Tests & Score Reports</span>
                <span>→</span>
              </NavLink>
              <NavLink
                to="/teacher/tests/create"
                className={({ isActive }) => `header-mobile-link${isActive ? ' active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>➕ Create New Test</span>
                <span>→</span>
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
