import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  userType: 'farmer' | 'cooperative' | 'agribusiness' | 'ngo' | 'government';
  country: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  userType: string;
  country: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is logged in (e.g., check localStorage, cookies, or API)
        const storedUser = localStorage.getItem('fataplus_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Logging in:', email);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data - replace with actual API response
      const mockUser: User = {
        id: 'user_123',
        email: email,
        name: 'Marie Dubois',
        userType: 'farmer',
        country: 'Madagascar',
        avatar: '👩‍🌾'
      };

      setUser(mockUser);
      localStorage.setItem('fataplus_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Registering:', userData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock user data - replace with actual API response
      const mockUser: User = {
        id: 'user_' + Date.now(),
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        userType: userData.userType as User['userType'],
        country: userData.country,
        avatar: userData.userType === 'farmer' ? '👨‍🌾' :
                userData.userType === 'cooperative' ? '🤝' :
                userData.userType === 'agribusiness' ? '🏭' :
                userData.userType === 'ngo' ? '🌍' : '🏛️'
      };

      setUser(mockUser);
      localStorage.setItem('fataplus_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fataplus_user');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
