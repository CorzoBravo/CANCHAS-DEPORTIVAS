import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Reservas() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reservas');
      setReservas(response.data.data.reservations);
    } catch (err) {
      setError('Error al cargar la lista de reservas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Estas seguro de que deseas cancelar esta reserva?')) return;
    try {
      await api.delete(`/reservas/${id}`);
      fetchReservas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar la reserva.');
    }
  };

  const calculateDurationInHours = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;
    return (endTotalMinutes - startTotalMinutes) / 60;
  };

  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    const d = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="reservas-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Todas las Reservas' : 'Mis Reservas'}</h1>
          <p className="page-subtitle">Historial y estado de tus turnos deportivos</p>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : reservas.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-state-icon">&#x1F4C5;</span>
          <h3>No hay reservas registradas</h3>
          <p>Aun no tienes ningun turno deportivo reservado.</p>
          <button onClick={() => navigate('/canchas')} className="btn btn-primary">Ver Canchas Disponibles</button>
        </div>
      ) : (
        <div className="reservas-container card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cancha</th>
                  {isAdmin && <th>Cliente</th>}
                  <th>Horario</th>
                  <th>Costo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => {
                  const hours = calculateDurationInHours(reserva.horaInicio, reserva.horaFin);
                  const totalCost = hours * Number(reserva.cancha.precioHora);

                  return (
                    <tr key={reserva.id}>
                      <td className="cell-date">{formatDate(reserva.fecha)}</td>
                      <td>
                        <div className="court-cell">
                          <span className="court-cell-name">{reserva.cancha.nombre}</span>
                          <span className="court-cell-type">{reserva.cancha.tipo}</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="user-cell">
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{reserva.cliente.nombre}</span>
                            <span className="user-cell-email">{reserva.cliente.email}</span>
                          </div>
                        </td>
                      )}
                      <td style={{ color: 'var(--text-primary)' }}>{reserva.horaInicio} - {reserva.horaFin} ({hours}h)</td>
                      <td className="cell-price">${totalCost.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge status-${reserva.estado}`}>
                          {reserva.estado === 'pendiente' && 'Pendiente de Pago'}
                          {reserva.estado === 'confirmada' && 'Confirmada'}
                          {reserva.estado === 'cancelada' && 'Cancelada'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-wrapper">
                          {reserva.estado === 'pendiente' && !isAdmin && (
                            <button
                              onClick={() => navigate(`/pagos/${reserva.id}`)}
                              className="btn btn-primary btn-sm"
                            >
                              Pagar
                            </button>
                          )}
                          {reserva.estado !== 'cancelada' && (
                            <button
                              onClick={() => handleCancelBooking(reserva.id)}
                              className="btn btn-secondary btn-sm cancel-btn"
                            >
                              Cancelar
                            </button>
                          )}
                          {reserva.estado === 'cancelada' && <span className="text-muted">Ninguna</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reservas;
