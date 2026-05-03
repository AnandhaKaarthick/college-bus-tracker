import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (credentials) => {
    // In a real app, this would be an API call
    // For now, we mock the role based on the username or a selection
    const mockUser = {
      ...credentials,
      name: credentials.id === 'admin' ? 'Super Admin' : 
            credentials.id.startsWith('DR') ? 'Captain Ramesh' : 'Arjun K',
      role: credentials.role || 'student', // 'student', 'driver', 'admin'
      lastLogin: new Date().toISOString()
    };
    
    setUser(mockUser);
    localStorage.setItem('bus_app_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bus_app_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
