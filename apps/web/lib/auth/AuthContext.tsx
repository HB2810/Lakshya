'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Persona, Capability } from '../../types/auth';
import { DEMO_USERS } from '../mocks/organizationMock';
import { can as canHelper } from '../permissions/can';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  activePersona: Persona;
  mustChangePassword: boolean;
  login: (email: string, password?: string, organization_slug?: string) => Promise<any>;
  logout: () => Promise<void>;
  switchPersona: (persona: Persona) => void;
  can: (capability: Capability) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersona, setActivePersona] = useState<Persona>('EMPLOYEE');
  const [user, setUser] = useState<User>(DEMO_USERS.EMPLOYEE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  // Restore authenticated session from backend on mount
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const { user: fetchedUser, response } = await apiClient.auth.getMe();
        if (isMounted) {
          setUser(fetchedUser);
          setActivePersona(fetchedUser.role);
          setIsAuthenticated(true);
          setMustChangePassword(response.must_change_password);
        }
      } catch {
        if (isMounted) {
          // If unauthenticated, fallback to default state
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password?: string, organization_slug?: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, response } = await apiClient.auth.login(email, password, organization_slug);
      setUser(loggedInUser);
      setActivePersona(loggedInUser.role);
      setIsAuthenticated(true);
      setMustChangePassword(response.must_change_password);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.auth.logout();
    } finally {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const switchPersona = useCallback((persona: Persona) => {
    setActivePersona(persona);
    if (DEMO_USERS[persona]) {
      setUser(DEMO_USERS[persona]);
      setIsAuthenticated(true);
    }
  }, []);

  const checkPermission = useCallback((capability: Capability) => {
    if (user.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes(capability)) {
        return true;
      }
    }
    return canHelper(capability, user);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        activePersona,
        mustChangePassword,
        login,
        logout,
        switchPersona,
        can: checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: DEMO_USERS.EMPLOYEE,
  isAuthenticated: false,
  isLoading: false,
  activePersona: 'EMPLOYEE',
  mustChangePassword: false,
  login: async () => {},
  logout: async () => {},
  switchPersona: () => {},
  can: (capability: Capability) => canHelper(capability, DEMO_USERS.EMPLOYEE),
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};
