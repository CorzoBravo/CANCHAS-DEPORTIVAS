import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/canchas');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card card">
        <h2 className="auth-title">Iniciar Sesion</h2>
        <p className="auth-subtitle">Ingresa para reservar y gestionar tus turnos deportivos</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Correo Electronico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clave</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary auth-btn">
            {submitting ? 'Iniciando sesion...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          No tienes una cuenta? <Link to="/register" className="auth-link">Registrate aqui</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
