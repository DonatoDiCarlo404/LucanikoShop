import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
          // Se l'utente è admin, imposta il bypass per la manutenzione
          if (userData.role === 'admin') {
            sessionStorage.setItem('maintenance_bypass', 'true');
          }
        } catch (err) {
          console.error('Token non valido, rimozione in corso');
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const data = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      // Recupera profilo completo
      const userData = await authAPI.getProfile(data.token);
      setUser({ ...userData, token: data.token });
      // Se l'utente è admin, imposta il bypass per la manutenzione
      if (userData.role === 'admin') {
        sessionStorage.setItem('maintenance_bypass', 'true');
      }
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Register
  const register = useCallback(async (name, email, password, role = 'buyer', businessName = '', vatNumber = '') => {
    try {
      setError(null);
      const userData = { name, email, password, role };
      // Aggiungi dati business solo se è un seller e sono stati forniti
      if (role === 'seller') {
        if (businessName) userData.businessName = businessName;
        if (vatNumber) userData.vatNumber = vatNumber;
      }
      const data = await authAPI.register(userData);
      localStorage.setItem('token', data.token);
      // Recupera profilo completo
      const profileData = await authAPI.getProfile(data.token);
      setUser({ ...profileData, token: data.token });
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
