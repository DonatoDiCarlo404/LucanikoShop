import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica utente dal localStorage all'avvio
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const userData = await authAPI.getProfile(token);
          setUser({ ...userData, token });
        } catch (err) {
          console.error('Token non valido:', err);
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authAPI.login({ email, password });
      
      localStorage.setItem('token', data.token);
      setUser(data);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Register
  const register = async (name, email, password, role = 'buyer') => {
    try {
      setError(null);
      const data = await authAPI.register({ name, email, password, role });
      
      localStorage.setItem('token', data.token);
      setUser(data);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};