import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Create a stable axios instance
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: `${API_URL}/api`,
    });
    // Auto-logout on 401 (expired/invalid token)
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }, []);

  // Update api headers when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token, api]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Initial profile fetch on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/profile', {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [api]);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;
    
    // Set token first
    localStorage.setItem('token', access_token);
    setToken(access_token);
    
    // Fetch profile with new token
    const profileResponse = await api.get('/profile', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    setUser(profileResponse.data);
    
    return response.data;
  }, [api]);

  const register = useCallback(async (email, password, full_name) => {
    const response = await api.post('/auth/register', { email, password, full_name });
    const { access_token } = response.data;
    
    // Set token first
    localStorage.setItem('token', access_token);
    setToken(access_token);
    
    // Fetch profile with new token
    const profileResponse = await api.get('/profile', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    setUser(profileResponse.data);
    
    return response.data;
  }, [api]);

  const updateProfile = useCallback(async (data) => {
    const response = await api.put('/profile', data);
    setUser(response.data);
    return response.data;
  }, [api]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    api,
    isAuthenticated: !!user
  }), [user, token, loading, login, register, logout, updateProfile, api]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
