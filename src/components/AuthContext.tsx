'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSummary, WorkspaceSummary, UserRole } from '@clienthunt/shared';

interface ActiveWorkspace {
  workspace: WorkspaceSummary;
  role: UserRole;
}

interface AuthContextType {
  user: UserSummary | null;
  activeWorkspace: ActiveWorkspace | null;
  workspaces: ActiveWorkspace[];
  csrfToken: string | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  activeWorkspace: null,
  workspaces: [],
  csrfToken: null,
  isLoading: true,
  refreshSession: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace | null>(null);
  const [workspaces, setWorkspaces] = useState<ActiveWorkspace[]>([]);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const refreshSession = async () => {
    try {
      const res = await fetch(`${apiUrl}/auth/me`, {
        credentials: 'include',
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setUser(body.data.user);
          setActiveWorkspace(body.data.activeWorkspace || null);
          setWorkspaces(body.data.workspaces || []);
          setCsrfToken(body.data.csrfToken);
          return;
        }
      }
      setUser(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
      setCsrfToken(null);
    } catch {
      setUser(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (csrfToken) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'x-csrf-token': csrfToken },
          credentials: 'include',
        });
      }
    } finally {
      setUser(null);
      setActiveWorkspace(null);
      setWorkspaces([]);
      setCsrfToken(null);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeWorkspace,
        workspaces,
        csrfToken,
        isLoading,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
