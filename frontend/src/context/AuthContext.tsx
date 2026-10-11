'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phoneMasked?: string;
  displayName: string;
  language: 'mr' | 'hi' | 'en';
  role: 'citizen' | 'official' | 'agency' | 'moderator' | 'admin';
  status?: 'active' | 'pending' | 'suspended';
  officialOfficeId?: any;
  isOfficialVerified?: boolean;
  designation?: string;
  employeeId?: string;
  officeName?: string;
  homeWard?: string;
  homeArea?: {
    ward?: string;
    city?: string;
    district?: string;
  };
  officeMemberships?: Array<{
    officeId: string;
    memberRole: string;
    status: string;
  }>;
  twoFactorEnabled?: boolean;
  isProfileComplete?: boolean;
  consentVersion?: string;
  emailVerified?: boolean;
  verifiedMethods?: string[];
  needsPasswordChange?: boolean;
  createdAt?: string;
}

export interface PendingAction {
  type: 'raise_issue' | 'support_issue' | 'view_dashboard';
  issueId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isInitializing: boolean;
  isAuthModalOpen: boolean;
  pendingAction: PendingAction | null;
  openAuthModal: () => void;
  openAuthModalWithAction: (action?: PendingAction) => void;
  clearPendingAction: () => void;
  closeAuthModal: () => void;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  loginWithCredentials: (
    email: string,
    password: string,
    isPublicComputer?: boolean
  ) => Promise<{ success: boolean; message?: string; role?: string; require2Fa?: boolean; tempToken?: string }>;
  registerUser: (data: {
    name?: string;
    displayName?: string;
    email: string;
    password: string;
    role?: 'citizen' | 'official';
    officeId?: string;
    designation?: string;
    employeeId?: string;
    claimNotes?: string;
    phone?: string;
    language?: 'mr' | 'hi' | 'en';
    isPublicComputer?: boolean;
    turnstileToken?: string;
  }) => Promise<{ success: boolean; message?: string; role?: string }>;
  submitOfficeClaim: (formData: FormData) => Promise<{ success: boolean; message?: string; claimId?: string }>;
  acceptOfficeInvite: (data: {
    token: string;
    name: string;
    password: string;
    phone: string;
    otp: string;
  }) => Promise<{ success: boolean; message?: string }>;
  requestPhoneOtp: (
    phone: string,
    turnstileToken?: string,
    purpose?: string
  ) => Promise<{ success: boolean; message: string; retryAfter?: number }>;
  verifyPhoneOtp: (
    phone: string,
    otp: string,
    isPublicComputer?: boolean
  ) => Promise<{ success: boolean; message?: string; isNewUser?: boolean; isProfileComplete?: boolean }>;
  deleteAccount: (payload: {
    password?: string;
    otp?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  updateCitizenProfile: (data: {
    displayName?: string;
    homeWard?: string;
    language?: 'mr' | 'hi' | 'en';
    consent?: { consentVersion: string; consented: boolean };
  }) => Promise<{ success: boolean; message?: string }>;
  setup2Fa: () => Promise<{
    success: boolean;
    secret?: string;
    otpAuthUri?: string;
    backupCodes?: string[];
    message?: string;
  }>;
  verify2FaSetup: (token: string) => Promise<{ success: boolean; message?: string }>;
  verify2FaLogin: (tempToken: string, code: string, isPublicComputer?: boolean) => Promise<{ success: boolean; message?: string }>;
  disable2Fa: (password: string) => Promise<{ success: boolean; message?: string }>;
  requestForgotPassword: (email: string, turnstileToken?: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  addVerifiedPhone: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  mergeAccounts: (payload: {
    method: 'phone_otp' | 'email_password';
    phone?: string;
    otp?: string;
    email?: string;
    password?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  getRoleRedirectPath: (role?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openAuthModalWithAction = (action?: PendingAction) => {
    setPendingAction(action || null);
    setIsAuthModalOpen(true);
  };

  const clearPendingAction = () => {
    setPendingAction(null);
  };

  const setSessionCookie = (sessionToken: string) => {
    if (typeof document !== 'undefined') {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      document.cookie = `raise_token=${encodeURIComponent(sessionToken)}; path=/; max-age=604800; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;
    }
  };

  const clearSessionCookie = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'raise_token=; path=/; max-age=0; SameSite=Lax;';
    }
  };

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    setSessionCookie(newToken);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('raise_token', newToken);
        localStorage.setItem('raise_user', JSON.stringify(newUser));
      } catch {}
    }
  };

  const refreshSession = useCallback(async (): Promise<string | null> => {
    try {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('raise_token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        setSessionCookie(data.token);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('raise_token', data.token);
            localStorage.setItem('raise_user', JSON.stringify(data.user));
          } catch {}
        }
        return data.token;
      } else {
        if (res.status === 401 && data.message?.includes('revoked')) {
          setToken(null);
          setUser(null);
          clearSessionCookie();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('raise_token');
            localStorage.removeItem('raise_user');
          }
        }
        return null;
      }
    } catch {
      return null;
    }
  }, []);

  // Initialize session on mount: synchronously restore from localStorage, then verify with backend
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      let savedToken: string | null = null;
      let savedUser: UserProfile | null = null;
      if (typeof window !== 'undefined') {
        try {
          savedToken = localStorage.getItem('raise_token');
          const rawUser = localStorage.getItem('raise_user');
          if (rawUser) {
            savedUser = JSON.parse(rawUser);
          }
        } catch {}
      }

      if (savedToken && savedUser && isMounted) {
        setToken(savedToken);
        setUser(savedUser);
        setSessionCookie(savedToken);
        setIsInitializing(false);
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
          },
          credentials: 'include',
        });
        const data = await res.json();
        if (isMounted && res.ok && data.success && data.token) {
          setToken(data.token);
          setUser(data.user);
          setSessionCookie(data.token);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('raise_token', data.token);
              localStorage.setItem('raise_user', JSON.stringify(data.user));
            } catch {}
          }
        } else if (isMounted && (!res.ok || !data.success)) {
          if (res.status === 401 && data.message?.includes('revoked')) {
            setToken(null);
            setUser(null);
            clearSessionCookie();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('raise_token');
              localStorage.removeItem('raise_user');
            }
          }
        }
      } catch {
        // Network hiccup - keep existing localStorage session active
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Silent automatic refresh timer (refresh access token every 13 minutes)
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (token) {
      // 13 minutes = 13 * 60 * 1000 = 780,000 ms
      refreshTimerRef.current = setTimeout(() => {
        refreshSession();
      }, 13 * 60 * 1000);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, refreshSession]);

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch {
      // Network error or offline
    }
    setToken(null);
    setUser(null);
    clearSessionCookie();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('raise_token');
      localStorage.removeItem('raise_user');
    }
  };

  const logoutAll = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/logout-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
    } catch {
      // Network error
    }
    setToken(null);
    setUser(null);
    clearSessionCookie();
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('raise_token');
      localStorage.removeItem('raise_user');
    }
  };

  const getRoleRedirectPath = (role?: string) => {
    if (role === 'admin') return '/admin';
    if (role === 'official' || role === 'agency') return '/office-portal';
    return '/';
  };

  const loginWithCredentials = async (email: string, password: string, isPublicComputer = false) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, isPublicComputer }),
      });
      const data = await res.json();

      if (res.ok && data.require2Fa) {
        return {
          success: false,
          require2Fa: true,
          tempToken: data.tempToken,
          message: data.message || 'Two-factor authentication code required.',
        };
      }

      if (res.ok && data.success) {
        login(data.token, data.user);
        setIsAuthModalOpen(false);
        return { success: true, role: data.user.role };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch {
      return { success: false, message: 'Network error. Please check your connection to the server.' };
    }
  };

  const registerUser = async (formData: {
    name?: string;
    displayName?: string;
    email: string;
    password: string;
    role?: 'citizen' | 'official';
    officeId?: string;
    designation?: string;
    employeeId?: string;
    claimNotes?: string;
    phone?: string;
    language?: 'mr' | 'hi' | 'en';
    isPublicComputer?: boolean;
    turnstileToken?: string;
  }) => {
    try {
      const payload: {
        email: string;
        password: string;
        displayName?: string;
        name?: string;
        phone?: string;
        language?: 'mr' | 'hi' | 'en';
        isPublicComputer?: boolean;
        turnstileToken?: string;
      } = {
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || formData.name || 'Citizen',
      };
      if (formData.name) payload.name = formData.name;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.language) payload.language = formData.language;
      if (formData.isPublicComputer !== undefined) payload.isPublicComputer = formData.isPublicComputer;
      if (formData.turnstileToken) payload.turnstileToken = formData.turnstileToken;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        login(data.token, data.user);
        setIsAuthModalOpen(false);
        return { success: true, role: data.user.role };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch {
      return { success: false, message: 'Network error. Please check your connection to the server.' };
    }
  };

  const submitOfficeClaim = async (formData: FormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/claim-office`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token && data.user) {
          login(data.token, data.user);
        }
        return { success: true, message: data.message, claimId: data.claimId };
      }
      return { success: false, message: data.message || 'Failed to submit office claim.' };
    } catch {
      return { success: false, message: 'Network error while submitting claim.' };
    }
  };

  const acceptOfficeInvite = async (inviteData: {
    token: string;
    name: string;
    password: string;
    phone: string;
    otp: string;
  }) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(inviteData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        login(data.token, data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to accept invitation.' };
    } catch {
      return { success: false, message: 'Network error while accepting invitation.' };
    }
  };

  const requestPhoneOtp = async (phone: string, turnstileToken?: string, purpose = 'login') => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, turnstileToken, purpose }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return {
        success: false,
        message: data.message || 'Failed to send OTP.',
        retryAfter: data.retryAfter,
      };
    } catch {
      return {
        success: false,
        message: 'Network error. Could not connect to verification server.',
      };
    }
  };

  const verifyPhoneOtp = async (phone: string, otp: string, isPublicComputer = false) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/otp/verify`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ phone, otp, isPublicComputer }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        login(data.token, data.user);
        setIsAuthModalOpen(false);
        return {
          success: true,
          isNewUser: data.isNewUser,
          isProfileComplete: data.isProfileComplete,
        };
      }
      return { success: false, message: data.message || 'OTP verification failed' };
    } catch {
      return { success: false, message: 'Network error during OTP verification.' };
    }
  };

  const updateCitizenProfile = async (profileData: {
    displayName?: string;
    homeWard?: string;
    language?: 'mr' | 'hi' | 'en';
    consent?: { consentVersion: string; consented: boolean };
  }) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      if (!currentToken) {
        return { success: false, message: 'Not authenticated.' };
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to update profile.' };
    } catch {
      return { success: false, message: 'Network error while saving profile.' };
    }
  };

  const setup2Fa = async () => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          secret: data.secret,
          otpAuthUri: data.otpAuthUri,
          backupCodes: data.backupCodes,
          message: data.message,
        };
      }
      return { success: false, message: data.message || 'Failed to initialize 2FA setup.' };
    } catch {
      return { success: false, message: 'Network error during 2FA setup.' };
    }
  };

  const verify2FaSetup = async (totpToken: string) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/2fa/verify-setup`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token: totpToken }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        if (user) {
          setUser({ ...user, twoFactorEnabled: true });
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Invalid verification code.' };
    } catch {
      return { success: false, message: 'Network error while verifying 2FA.' };
    }
  };

  const verify2FaLogin = async (tempToken: string, code: string, isPublicComputer = false) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/2fa/verify-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tempToken, code, isPublicComputer }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        login(data.token, data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Invalid code.' };
    } catch {
      return { success: false, message: 'Network error verifying 2FA login.' };
    }
  };

  const disable2Fa = async (password: string) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (user) {
          setUser({ ...user, twoFactorEnabled: false });
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to disable 2FA.' };
    } catch {
      return { success: false, message: 'Network error while disabling 2FA.' };
    }
  };

  const deleteAccount = async (payload: { password?: string; otp?: string }) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      if (!currentToken) {
        return { success: false, message: 'Authentication required.' };
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToken(null);
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('raise_token');
          localStorage.removeItem('raise_user');
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to delete account.' };
    } catch {
      return { success: false, message: 'Network error while deleting account.' };
    }
  };

  const requestForgotPassword = async (email: string, turnstileToken?: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = await res.json();
      return { success: true, message: data.message || 'If an account exists, a reset link has been sent.' };
    } catch {
      return { success: false, message: 'Network error. Please try again later.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message || 'Password successfully reset.' };
      }
      return { success: false, message: data.message || 'Failed to reset password.' };
    } catch {
      return { success: false, message: 'Network error. Please try again later.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      if (!currentToken) {
        return { success: false, message: 'Authentication required.' };
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/password/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (user) {
          setUser({ ...user, needsPasswordChange: false });
        }
        return { success: true, message: data.message || 'Password changed successfully.' };
      }
      return { success: false, message: data.message || 'Failed to change password.' };
    } catch {
      return { success: false, message: 'Network error. Please try again later.' };
    }
  };

  const addVerifiedPhone = async (phone: string, otp: string) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      if (!currentToken) {
        return { success: false, message: 'Authentication required.' };
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/profile/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
        }
        return { success: true, message: data.message || 'Phone attached successfully.' };
      }
      return { success: false, message: data.message || 'Failed to attach phone.' };
    } catch {
      return { success: false, message: 'Network error. Please try again later.' };
    }
  };

  const mergeAccounts = async (payload: {
    method: 'phone_otp' | 'email_password';
    phone?: string;
    otp?: string;
    email?: string;
    password?: string;
  }) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        currentToken = await refreshSession();
      }
      if (!currentToken) {
        return { success: false, message: 'Authentication required.' };
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/merge-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
        }
        return { success: true, message: data.message || 'Accounts successfully merged.' };
      }
      return { success: false, message: data.message || 'Failed to merge accounts.' };
    } catch {
      return { success: false, message: 'Network error during account merge.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isInitializing,
        isAuthModalOpen,
        pendingAction,
        openAuthModal: () => openAuthModalWithAction(),
        openAuthModalWithAction,
        clearPendingAction,
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        logout,
        logoutAll,
        refreshSession,
        loginWithCredentials,
        registerUser,
        submitOfficeClaim,
        acceptOfficeInvite,
        requestPhoneOtp,
        verifyPhoneOtp,
        deleteAccount,
        updateCitizenProfile,
        setup2Fa,
        verify2FaSetup,
        verify2FaLogin,
        disable2Fa,
        requestForgotPassword,
        resetPassword,
        changePassword,
        addVerifiedPhone,
        mergeAccounts,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
