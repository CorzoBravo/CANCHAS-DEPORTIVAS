import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Lazy imports or direct stubs for Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Canchas from './pages/Canchas';
import Reservas from './pages/Reservas';
import Pagos from './pages/Pagos';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-container">Cargando sesión...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-container">Cargando sesión...</div>;
  return isAuthenticated && isAdmin ? children : <Navigate to="/canchas" replace />;
}

function NavigationHeader() {
  const { user, logout, isAdmin } = useAuth();

  if (!user) return null;

  return (
    <nav className="main-nav glass-card">
      <div className="nav-brand">
        <span className="brand-emoji">⚽</span>
        <span className="brand-text">CanchaMaster</span>
      </div>
      <ul className="nav-links">
        <li><Link to="/canchas" className="nav-link">Canchas</Link></li>
        <li><Link to="/reservas" className="nav-link">Mis Reservas</Link></li>
        {isAdmin && (
          <>
            <li><Link to="/clientes" className="nav-link admin-tag">Gestionar Clientes</Link></li>
            <li><Link to="/dashboard" className="nav-link admin-tag">Dashboard Admin</Link></li>
          </>
        )}
      </ul>
      <div className="nav-user">
        <span className="user-greeting">Hola, <strong>{user.nombre}</strong></span>
        <button onClick={logout} className="btn-secondary logout-btn">Cerrar Sesión</button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <NavigationHeader />
          <main className="app-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Guarded Client Routes */}
              <Route path="/canchas" element={
                <PrivateRoute>
                  <Canchas />
                </PrivateRoute>
              } />
              <Route path="/reservas" element={
                <PrivateRoute>
                  <Reservas />
                </PrivateRoute>
              } />
              <Route path="/pagos/:reservaId" element={
                <PrivateRoute>
                  <Pagos />
                </PrivateRoute>
              } />

              {/* Guarded Admin-only Routes */}
              <Route path="/clientes" element={
                <AdminRoute>
                  <Clientes />
                </AdminRoute>
              } />
              <Route path="/dashboard" element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              } />

              {/* Fallback routing */}
              <Route path="*" element={<Navigate to="/canchas" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
