import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register(nombre, email, password, telefono);
      navigate('/canchas');
    } catch (err) {
      setError(err.message || 'Error al registrarse.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card card">
        <h2 className="auth-title">Crear Cuenta</h2>
        <p className="auth-subtitle">Registrate para reservar canchas al instante</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="form-input"
              placeholder="Ej: Juan Perez"
              required
            />
          </div>

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
            <label className="form-label">Telefono (Celular)</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="form-input"
              placeholder="Ej: 999111222"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Minimo 6 caracteres"
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary auth-btn">
            {submitting ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-footer">
          Ya tienes una cuenta? <Link to="/login" className="auth-link">Inicia sesion aqui</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
