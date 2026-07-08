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
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass-card">
        <h2 className="auth-title">Iniciar Sesión</h2>
        <p className="auth-subtitle">Ingresa para reservar y gestionar tus turnos deportivos</p>
        
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
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
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary auth-btn">
            {submitting ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes una cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
        </p>
      </div>

      <style>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 70vh;
          padding: 1rem;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          text-align: center;
        }
        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: var(--gradient-main);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .auth-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-label {
          color: var(--text-primary);
          font-weight: 500;
          font-size: 0.9rem;
        }
        .auth-btn {
          margin-top: 1rem;
          padding: 0.85rem;
          font-size: 1.05rem;
        }
        .alert-error {
          background: rgba(255, 107, 107, 0.15);
          border: 1px solid var(--color-danger);
          color: var(--text-primary);
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          text-align: left;
        }
        .auth-footer {
          margin-top: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .auth-link {
          color: var(--color-primary);
          text-decoration: none;
          font-weight: 600;
          transition: var(--transition-smooth);
        }
        .auth-link:hover {
          text-shadow: var(--shadow-neon);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}

export default Login;
