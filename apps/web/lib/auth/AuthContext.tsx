'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Persona, Capability } from '../../types/auth';
import { DEMO_USERS } from '../mocks/organizationMock';
import { can as canHelper } from '../permissions/can';

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  activePersona: Persona;
  switchPersona: (persona: Persona) => void;
  can: (capability: Capability) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersona, setActivePersona] = useState<Persona>('MD');
  const [user, setUser] = useState<User>(DEMO_USERS.MD);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const switchPersona = (persona: Persona) => {
    setActivePersona(persona);
    if (DEMO_USERS[persona]) {
      setUser(DEMO_USERS[persona]);
      setIsAuthenticated(true);
    }
  };

  const checkPermission = (capability: Capability) => {
    return canHelper(capability, user);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        activePersona,
        switchPersona,
        can: checkPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
