import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { reconnectSocket } from '../services/socket.js';

const AuthContext = createContext();

const DEMO_CREDENTIALS = {
  SUPER_ADMIN: { email: 'gadekuldeep26@gmail.com', password: 'Password@123' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('scrims_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('scrims_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.user);
            localStorage.setItem('scrims_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Failed to verify existing session:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('scrims_token', newToken);
      localStorage.setItem('scrims_user', JSON.stringify(newUser));
      reconnectSocket();
      return newUser;
    }
    throw new Error(res.data?.error || 'Login failed');
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('scrims_token', newToken);
      localStorage.setItem('scrims_user', JSON.stringify(newUser));
      reconnectSocket();
      return newUser;
    }
    throw new Error(res.data?.error || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('scrims_token');
    localStorage.removeItem('scrims_user');
    reconnectSocket();
  };

  const demoLogin = async (roleKey) => {
    const creds = DEMO_CREDENTIALS[roleKey];
    if (!creds) throw new Error(`Demo account for ${roleKey} not found`);
    return await login(creds.email, creds.password);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('scrims_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      demoLogin,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
