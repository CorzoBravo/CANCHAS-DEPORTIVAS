import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Canchas from './pages/Canchas';
import Reservas from './pages/Reservas';
import Pagos from './pages/Pagos';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-container">Cargando sesion...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-container">Cargando sesion...</div>;
  return isAuthenticated && isAdmin ? children : <Navigate to="/canchas" replace />;
}

function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function NavigationHeader() {
  const { user, logout, isAdmin } = useAuth();

  if (!user) return null;

  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <div className="brand-icon">&#9917;</div>
        <span className="brand-text">CanchaMaster</span>
      </div>
      <ul className="nav-links">
        <li><Link to="/canchas" className="nav-link">Canchas</Link></li>
        <li><Link to="/reservas" className="nav-link">Mis Reservas</Link></li>
        {isAdmin && (
          <>
            <li><Link to="/clientes" className="nav-link admin-tag">Gestionar Clientes</Link></li>
            <li><Link to="/dashboard" className="nav-link admin-tag">Dashboard</Link></li>
          </>
        )}
      </ul>
      <div className="nav-user">
        <span className="user-greeting">Hola, <strong>{user.nombre}</strong></span>
        <ThemeToggle />
        <button onClick={logout} className="btn btn-sm btn-danger logout-btn">Cerrar Sesion</button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <NavigationHeader />
            <main className="app-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/canchas" element={
                  <PrivateRoute><Canchas /></PrivateRoute>
                } />
                <Route path="/reservas" element={
                  <PrivateRoute><Reservas /></PrivateRoute>
                } />
                <Route path="/pagos/:reservaId" element={
                  <PrivateRoute><Pagos /></PrivateRoute>
                } />

                <Route path="/clientes" element={
                  <AdminRoute><Clientes /></AdminRoute>
                } />
                <Route path="/dashboard" element={
                  <AdminRoute><Dashboard /></AdminRoute>
                } />

                <Route path="*" element={<Navigate to="/canchas" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
