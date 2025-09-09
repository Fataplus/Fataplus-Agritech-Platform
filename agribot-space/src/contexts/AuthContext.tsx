"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import { User } from '../types/agri-models';

// Keycloak configuration - load from env in production
const KEYCLOAK_CONFIG = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://id.fata.plus',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'fataplus',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'agribot-space',
};

interface KeycloakTokenParsed {
  sub: string;
  email: string;
  name: string;
  preferred_username?: string;
  region?: string;
  timezone?: string;
  iat: number;
  // Add other fields as needed
}

interface AuthContextType {
  keycloak: Keycloak | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
  sessionId: string | null;
  login: () => void;
  logout: () => void;
  token: string | null;
  createAnonymousSession: () => string;
  upgradeAnonymousToUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to initialize Keycloak silently first
        const kc = new Keycloak({
          ...KEYCLOAK_CONFIG,
        });

        kc.onAuthSuccess = () => {
          setIsAuthenticated(true);
          setIsAnonymous(false);
          setToken(kc.token || null);
          // Map Keycloak user to our User interface
          const kcUser = kc.tokenParsed as KeycloakTokenParsed;
          const mappedUser: User = {
            id: kcUser.sub,
            keycloakUserId: kcUser.sub,
            email: kcUser.email,
            fullName: kcUser.name,
            tier: 'viewer', // Default; fetch from profile
            language: kcUser.preferred_username?.split('-')[0] || 'en',
            region: kcUser.region || undefined,
            timezone: kcUser.timezone || undefined,
            createdAt: new Date(kcUser.iat * 1000),
            updatedAt: new Date(kcUser.iat * 1000),
            isActive: true,
          };
          setUser(mappedUser);
        };

        kc.onAuthError = (error) => {
          console.error('Keycloak auth error:', error);
          // If auth fails, create anonymous session
          if (!isAuthenticated && !isAnonymous) {
            createAnonymousSession();
          }
        };

        kc.onAuthLogout = () => {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        };

        kc.onTokenExpired = () => {
          kc.updateToken(30).then((refreshed) => {
            if (refreshed) {
              setToken(kc.token || null);
            } else {
              console.warn('Failed to refresh token');
            }
          });
        };

        // Try silent initialization first
        try {
          await kc.init({
            onLoad: 'check-sso',
            silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
            checkLoginIframe: false,
          });
          setKeycloak(kc);

          // If not authenticated after silent check, create anonymous session
          if (!kc.authenticated) {
            createAnonymousSession();
          }
        } catch (error) {
          console.warn('Keycloak silent init failed, creating anonymous session:', error);
          createAnonymousSession();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        createAnonymousSession();
      } finally {
        setIsLoading(false);
      }
    };

    const createAnonymousSession = () => {
      const anonymousSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(anonymousSessionId);
      setIsAnonymous(true);
      localStorage.setItem('anonymous_session', anonymousSessionId);

      // Create anonymous user object for context
      const anonymousUser: User = {
        id: anonymousSessionId,
        keycloakUserId: anonymousSessionId,
        email: undefined,
        fullName: 'Anonymous User',
        tier: 'viewer',
        language: navigator.language?.split('-')[0] || 'en',
        region: undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
      setUser(anonymousUser);
    };

    // Check if there's an existing anonymous session
    const existingSession = localStorage.getItem('anonymous_session');
    if (existingSession) {
      setSessionId(existingSession);
      setIsAnonymous(true);
      const anonymousUser: User = {
        id: existingSession,
        keycloakUserId: existingSession,
        email: undefined,
        fullName: 'Anonymous User',
        tier: 'viewer',
        language: navigator.language?.split('-')[0] || 'en',
        region: undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
      setUser(anonymousUser);
      setIsLoading(false);
    } else {
      initAuth();
    }
  }, [isAuthenticated, isAnonymous]);

  const createAnonymousSession = (): string => {
    const anonymousSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(anonymousSessionId);
    setIsAnonymous(true);
    setIsAuthenticated(true); // Anonymous users are "authenticated" for chat
    localStorage.setItem('anonymous_session', anonymousSessionId);

    const anonymousUser: User = {
      id: anonymousSessionId,
      keycloakUserId: anonymousSessionId,
      email: undefined,
      fullName: 'Anonymous User',
      tier: 'viewer',
      language: navigator.language?.split('-')[0] || 'en',
      region: undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    setUser(anonymousUser);
    return anonymousSessionId;
  };

  const upgradeAnonymousToUser = (userData: User) => {
    setIsAnonymous(false);
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.removeItem('anonymous_session');
    setSessionId(null);
  };

  const login = () => {
    if (keycloak) {
      keycloak.login();
    }
  };

  const logout = () => {
    if (keycloak) {
      keycloak.logout();
    } else {
      // For anonymous users, just clear the session
      setIsAnonymous(false);
      setIsAuthenticated(false);
      setUser(null);
      setSessionId(null);
      localStorage.removeItem('anonymous_session');
    }
  };

  const value: AuthContextType = {
    keycloak,
    user,
    isAuthenticated: isAuthenticated || isAnonymous,
    isLoading,
    isAnonymous,
    sessionId,
    login,
    logout,
    token,
    createAnonymousSession,
    upgradeAnonymousToUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};