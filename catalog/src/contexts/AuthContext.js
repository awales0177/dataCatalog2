import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState('reader');

  // Check for existing token on mount, or auto-role as reader
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setCurrentRole(userData.currentRole || 'reader');
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Fall through to default user creation
      }
    }
    
    if (!storedToken || !storedUser) {
      // Auto-role as user by default (all roles)
      const defaultUser = {
        username: 'user',
        roles: ['reader', 'editor', 'admin'],
        currentRole: 'reader',
        full_name: 'User',
        email: 'user@example.com'
      };
      const defaultToken = 'pki_token_' + Date.now();
      
      localStorage.setItem('authToken', defaultToken);
      localStorage.setItem('user', JSON.stringify(defaultUser));
      setToken(defaultToken);
      setUser(defaultUser);
      setCurrentRole('reader');
    }
    setLoading(false);
  }, []);

  const changeRole = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8000/auth/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Role change failed');
      }

      const data = await response.json();
      
      // Store token and user data
      const userData = { ...data.user, currentRole: data.user.currentRole || 'reader' };
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(data.access_token);
      setUser(userData);
      setCurrentRole(userData.currentRole);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentRole('reader');
  };

  const switchRole = (newRole) => {
    if (!user || !user.roles?.includes(newRole)) {
      return false;
    }
    
    const updatedUser = { ...user, currentRole: newRole };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setCurrentRole(newRole);
    return true;
  };

  const setAuthData = (tokenData, userData) => {
    setToken(tokenData);
    setUser(userData);
    setCurrentRole(userData.currentRole || 'reader');
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Check if user has the role in their available roles
    const userRoles = user.roles || [];
    if (!userRoles.includes(requiredRole)) return false;
    
    // Check if the current role matches the required role
    return currentRole === requiredRole;
  };

  const canEdit = () => {
    return hasRole('editor');
  };

  const canDelete = () => {
    return hasRole('editor');
  };

  const canCreate = () => {
    return hasRole('editor');
  };

  const isAdmin = () => {
    return hasRole('admin');
  };

  const value = {
    user,
    token,
    loading,
    currentRole,
    changeRole,
    switchRole,
    logout,
    setAuthData,
    isAuthenticated,
    hasRole,
    canEdit,
    canDelete,
    canCreate,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
