import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token and user data exist on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Optionally fetch profile to verify session is still valid
      api.get('/clientes/me')
        .then(res => {
          const freshUser = res.data.data.client;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/clientes/login', { email, password });
      const { token, client } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(client));
      setUser(client);
      return client;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión.';
      throw new Error(message);
    }
  };

  const register = async (nombre, email, password, telefono) => {
    try {
      await api.post('/clientes/register', { nombre, email, password, telefono, rol: 'cliente' });
      // Automate login after successful registration
      return await login(email, password);
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrarse.';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin: user?.rol === 'admin', login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
export default AuthContext;
