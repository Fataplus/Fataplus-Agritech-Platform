/**
 * Authentication utilities for admin panel
 */

export interface AdminUser {
  email: string;
  name: string;
  role: string;
}

export const auth = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_auth') === 'authenticated';
  },

  /**
   * Get current admin user info
   */
  getUser(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem('admin_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Login user (demo implementation)
   */
  login(email: string, password: string): boolean {
    // Demo credentials - in production, this would call a secure API
    if (email === 'admin@fata.plus' && password === 'admin123') {
      localStorage.setItem('admin_auth', 'authenticated');
      localStorage.setItem('admin_user', JSON.stringify({
        email,
        name: 'Administrator',
        role: 'admin'
      }));
      return true;
    }
    return false;
  },

  /**
   * Logout user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_auth');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
  }
};

/**
 * React hook for authentication
 */
export function useAuth() {
  return {
    isAuthenticated: auth.isAuthenticated(),
    user: auth.getUser(),
    logout: auth.logout
  };
}