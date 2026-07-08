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
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
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
    // Normalizes datetime string to YYYY-MM-DD display
    const dateObj = new Date(dateString);
    // Ignore timezone offset for clean display of the stored date
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

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Cargando reservas...</div>
      ) : reservas.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">📅</span>
          <h3>No hay reservas registradas</h3>
          <p>Aún no tienes ningún turno deportivo reservado.</p>
          <button onClick={() => navigate('/canchas')} className="btn-primary">Ver Canchas Disponibles</button>
        </div>
      ) : (
        <div className="reservas-container glass-card">
          <div className="table-responsive">
            <table className="reservas-table">
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
                    <tr key={reserva.id} className="table-row">
                      <td className="cell-date">{formatDate(reserva.fecha)}</td>
                      <td>
                        <div className="court-cell">
                          <span className="court-cell-name">{reserva.cancha.nombre}</span>
                          <span className="court-cell-type">{reserva.cancha.tipo}</span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="cell-user">
                          <div className="user-cell">
                            <span>{reserva.cliente.nombre}</span>
                            <span className="user-cell-email">{reserva.cliente.email}</span>
                          </div>
                        </td>
                      )}
                      <td className="cell-time">{reserva.horaInicio} - {reserva.horaFin} ({hours}h)</td>
                      <td className="cell-price">${totalCost.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge status-${reserva.estado}`}>
                          {reserva.estado === 'pendiente' && 'Pendiente de Pago'}
                          {reserva.estado === 'confirmada' && 'Confirmada'}
                          {reserva.estado === 'cancelada' && 'Cancelada'}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <div className="actions-wrapper">
                          {reserva.estado === 'pendiente' && !isAdmin && (
                            <button
                              onClick={() => navigate(`/pagos/${reserva.id}`)}
                              className="btn-primary pay-btn"
                            >
                              Pagar
                            </button>
                          )}
                          {reserva.estado !== 'cancelada' && (
                            <button
                              onClick={() => handleCancelBooking(reserva.id)}
                              className="btn-secondary cancel-btn"
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

      <style>{`
        .reservas-page {
          padding: 1rem 0;
        }
        .page-header {
          margin-bottom: 2rem;
        }
        .page-title {
          font-size: 2.2rem;
          font-weight: 800;
          background: var(--gradient-main);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .page-subtitle {
          color: var(--text-secondary);
        }
        .alert-error {
          background: rgba(255, 107, 107, 0.15);
          border: 1px solid var(--color-danger);
          color: var(--text-primary);
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 2rem;
          gap: 1rem;
        }
        .empty-icon {
          font-size: 4rem;
        }
        .empty-state h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
        }
        .empty-state p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          max-width: 320px;
        }

        .reservas-container {
          padding: 1.5rem;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .reservas-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.95rem;
        }
        .reservas-table th {
          border-bottom: 2px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 1rem;
          font-weight: 600;
        }
        .reservas-table td {
          border-bottom: 1px solid var(--border-glass);
          padding: 1.25rem 1rem;
          vertical-align: middle;
        }
        .table-row:hover {
          background: rgba(255, 255, 255, 0.01);
        }

        .cell-date {
          font-weight: 600;
          color: var(--text-primary);
        }
        .court-cell {
          display: flex;
          flex-direction: column;
        }
        .court-cell-name {
          color: var(--text-primary);
          font-weight: 600;
        }
        .court-cell-type {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .user-cell {
          display: flex;
          flex-direction: column;
        }
        .user-cell-email {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .cell-time {
          color: var(--text-primary);
        }
        .cell-price {
          color: var(--color-primary);
          font-weight: 600;
        }

        /* Status badges */
        .status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
        }
        .status-pendiente {
          background: rgba(255, 208, 123, 0.15);
          border: 1px solid var(--color-warning);
          color: var(--color-warning);
        }
        .status-confirmada {
          background: rgba(0, 245, 160, 0.15);
          border: 1px solid var(--color-success);
          color: var(--color-success);
        }
        .status-cancelada {
          background: rgba(255, 107, 107, 0.12);
          border: 1px solid var(--color-danger);
          color: var(--color-danger);
        }

        /* Actions styling */
        .actions-wrapper {
          display: flex;
          gap: 0.5rem;
        }
        .pay-btn {
          padding: 0.35rem 0.9rem !important;
          font-size: 0.85rem !important;
          border-radius: 6px !important;
          box-shadow: none !important;
        }
        .cancel-btn {
          padding: 0.35rem 0.9rem !important;
          font-size: 0.85rem !important;
          border-radius: 6px !important;
          border-color: var(--border-glass) !important;
          color: var(--text-secondary) !important;
        }
        .cancel-btn:hover {
          border-color: var(--color-danger) !important;
          background: rgba(255, 107, 107, 0.1) !important;
          color: var(--color-danger) !important;
        }
      `}</style>
    </div>
  );
}

export default Reservas;
