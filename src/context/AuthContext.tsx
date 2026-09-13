import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  studentId?: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  createdAt?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean; email?: string }>;
  sendLoginOtp: (email: string, role?: string) => Promise<{ success: boolean; error?: string; message?: string; devPreviewCode?: string }>;
  loginWithOtp: (email: string, otp: string, role?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: { studentId?: string; name: string; email: string; password: string; role?: string }) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean; email?: string; devPreviewCode?: string }>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string; message?: string; devPreviewCode?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = 'ml_vlab_jwt_token';
const USER_KEY = 'ml_vlab_user_cache';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } else {
        // Invalid token
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch (err) {
      console.warn('Could not verify profile from server:', err);
    }
  }, []);

  useEffect(() => {
    async function initSession() {
      if (token) {
        await fetchProfile(token);
      } else {
        setUser(null);
        localStorage.removeItem(USER_KEY);
      }
      setIsLoading(false);
    }
    initSession();
  }, [token, fetchProfile]);

  const login = useCallback(async (email: string, password: string, role?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Login failed.',
          requiresVerification: data.requiresVerification,
          email: data.email,
        };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error connecting to authentication server.' };
    }
  }, []);

  const sendLoginOtp = useCallback(async (email: string, role?: string) => {
    try {
      const res = await fetch('/api/auth/send-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send login code.' };
      }
      return {
        success: true,
        message: data.message,
        devPreviewCode: data.devPreviewCode,
      };
    } catch (err) {
      return { success: false, error: 'Network error sending login code.' };
    }
  }, []);

  const loginWithOtp = useCallback(async (email: string, otp: string, role?: string) => {
    try {
      const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login code verification failed.' };
      }

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'Network error verifying login code.' };
    }
  }, []);

  const register = useCallback(async (data: { studentId?: string; name: string; email: string; password: string; role?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: resData.error || 'Registration failed.',
          requiresVerification: resData.requiresVerification,
          email: resData.email,
        };
      }

      // Successful registration now requires OTP email verification
      return {
        success: true,
        requiresVerification: true,
        email: resData.email || data.email,
        devPreviewCode: resData.devPreviewCode,
      };
    } catch (err) {
      return { success: false, error: 'Network error connecting to registration server.' };
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Verification failed.' };
      }

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: 'Network error verifying email.' };
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Resend failed.' };
      }
      return {
        success: true,
        message: data.message,
        devPreviewCode: data.devPreviewCode,
      };
    } catch (err) {
      return { success: false, error: 'Network error resending code.' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) await fetchProfile(token);
  }, [token, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isStudent: user?.role === 'student',
        isTeacher: user?.role === 'teacher',
        isLoading,
        login,
        sendLoginOtp,
        loginWithOtp,
        register,
        verifyEmail,
        resendVerification,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
