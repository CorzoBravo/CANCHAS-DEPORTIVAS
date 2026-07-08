import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Canchas() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Court lists state
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin Court Creation State
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState(null);
  const [courtForm, setCourtForm] = useState({ nombre: '', tipo: 'Fútbol 5', precioHora: '', habilitada: true });

  // Booking Modal State
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingHours, setBookingHours] = useState({ horaInicio: '08:00', horaFin: '09:00' });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [bookingError, setBookingError] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    fetchCanchas();
  }, []);

  const fetchCanchas = async () => {
    setLoading(true);
    try {
      // Admins see all courts, standard clients only see enabled ones
      const response = await api.get(`/canchas?all=${isAdmin ? 'true' : 'false'}`);
      setCanchas(response.data.data.courts);
    } catch (err) {
      setError('Error al cargar el catálogo de canchas.');
    } finally {
      setLoading(false);
    }
  };

  // Admin - Add/Edit Court
  const handleCourtFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: courtForm.nombre,
        tipo: courtForm.tipo,
        precioHora: parseFloat(courtForm.precioHora),
        habilitada: courtForm.habilitada,
      };

      if (editingCourtId) {
        await api.put(`/canchas/${editingCourtId}`, payload);
      } else {
        await api.post('/canchas', payload);
      }

      setCourtForm({ nombre: '', tipo: 'Fútbol 5', precioHora: '', habilitada: true });
      setEditingCourtId(null);
      setShowAdminForm(false);
      fetchCanchas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la cancha.');
    }
  };

  const handleEditClick = (court) => {
    setCourtForm({
      nombre: court.nombre,
      tipo: court.tipo,
      precioHora: court.precioHora.toString(),
      habilitada: court.habilitada,
    });
    setEditingCourtId(court.id);
    setShowAdminForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cancha?')) return;
    try {
      await api.delete(`/canchas/${id}`);
      fetchCanchas();
    } catch (err) {
      setError('No se pudo eliminar la cancha.');
    }
  };

  // Booking - Open modal and check availability
  const handleOpenBooking = (court) => {
    setSelectedCourt(court);
    setBookingHours({ horaInicio: '08:00', horaFin: '09:00' });
    setBookingError('');
    setAvailability(null);
  };

  useEffect(() => {
    if (selectedCourt && bookingDate) {
      fetchAvailability(selectedCourt.id, bookingDate);
    }
  }, [selectedCourt, bookingDate]);

  const fetchAvailability = async (courtId, dateStr) => {
    setLoadingAvailability(true);
    setBookingError('');
    try {
      const res = await api.get(`/canchas/${courtId}/disponibilidad?fecha=${dateStr}`);
      setAvailability(res.data.data);
    } catch (err) {
      setBookingError('Error al consultar horarios disponibles.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Recalculate price dynamically when hours or court changes
  useEffect(() => {
    if (!selectedCourt) return;
    const [sh, sm] = bookingHours.horaInicio.split(':').map(Number);
    const [eh, em] = bookingHours.horaFin.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (endMins > startMins) {
      const hours = (endMins - startMins) / 60;
      setCalculatedPrice(hours * Number(selectedCourt.precioHora));
    } else {
      setCalculatedPrice(0);
    }
  }, [bookingHours, selectedCourt]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSubmitting(true);

    try {
      const response = await api.post('/reservas', {
        clienteId: user.id,
        canchaId: selectedCourt.id,
        fecha: bookingDate,
        horaInicio: bookingHours.horaInicio,
        horaFin: bookingHours.horaFin,
      });

      const reservation = response.data.data.reservation;
      // Close modal and redirect to payment
      setSelectedCourt(null);
      navigate(`/pagos/${reservation.id}`);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Error al solicitar la reserva.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="canchas-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Canchas Deportivas</h1>
          <p className="page-subtitle">Explora y reserva nuestros espacios equipados</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowAdminForm(!showAdminForm); setEditingCourtId(null); }} className="btn-primary">
            {showAdminForm ? 'Ocultar Formulario' : 'Agregar Cancha'}
          </button>
        )}
      </header>

      {error && <div className="alert-error">{error}</div>}

      {/* Admin Court Form */}
      {isAdmin && showAdminForm && (
        <form onSubmit={handleCourtFormSubmit} className="admin-form-card glass-card animate-fade-in">
          <h3>{editingCourtId ? 'Editar Cancha' : 'Agregar Nueva Cancha'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre de la Cancha</label>
              <input
                type="text"
                value={courtForm.nombre}
                onChange={(e) => setCourtForm({ ...courtForm, nombre: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Deporte / Tipo</label>
              <select
                value={courtForm.tipo}
                onChange={(e) => setCourtForm({ ...courtForm, tipo: e.target.value })}
                className="form-input"
              >
                <option value="Fútbol 5">Fútbol 5</option>
                <option value="Tenis">Tenis</option>
                <option value="Básquetbol">Básquetbol</option>
                <option value="Squash">Squash</option>
              </select>
            </div>
            <div className="form-group">
              <label>Precio por Hora ($)</label>
              <input
                type="number"
                step="0.01"
                value={courtForm.precioHora}
                onChange={(e) => setCourtForm({ ...courtForm, precioHora: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group row-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={courtForm.habilitada}
                  onChange={(e) => setCourtForm({ ...courtForm, habilitada: e.target.checked })}
                />
                Cancha Habilitada
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar</button>
            <button type="button" onClick={() => { setShowAdminForm(false); setEditingCourtId(null); }} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {/* Catalog Grid */}
      {loading ? (
        <div className="loading-container">Cargando catálogo...</div>
      ) : (
        <div className="canchas-grid">
          {canchas.map((cancha) => (
            <div key={cancha.id} className={`cancha-card glass-card ${!cancha.habilitada ? 'disabled-court' : ''}`}>
              <div className="court-icon">
                {cancha.tipo.includes('Fútbol') && '⚽'}
                {cancha.tipo.includes('Tenis') && '🎾'}
                {cancha.tipo.includes('Básquet') && '🏀'}
                {cancha.tipo.includes('Squash') && '🏸'}
              </div>
              <h2 className="court-name">{cancha.nombre}</h2>
              <div className="court-info">
                <span className="info-badge">{cancha.tipo}</span>
                <span className="price-tag">${cancha.precioHora} / hora</span>
              </div>
              {!cancha.habilitada && <span className="disabled-badge">Mantenimiento</span>}
              
              <div className="card-actions">
                {cancha.habilitada ? (
                  <button onClick={() => handleOpenBooking(cancha)} className="btn-primary action-btn">Reservar Turno</button>
                ) : (
                  <button className="btn-primary action-btn" disabled>No Disponible</button>
                )}
                {isAdmin && (
                  <div className="admin-actions">
                    <button onClick={() => handleEditClick(cancha)} className="btn-secondary btn-icon">✏️</button>
                    <button onClick={() => handleDeleteClick(cancha.id)} className="btn-secondary btn-icon btn-delete">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Dialog Modal */}
      {selectedCourt && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header">
              <h2>Reservar {selectedCourt.nombre}</h2>
              <button onClick={() => setSelectedCourt(null)} className="modal-close">×</button>
            </div>
            
            <form onSubmit={handleCreateBooking} className="booking-form">
              {bookingError && <div className="alert-error">{bookingError}</div>}
              
              <div className="form-group">
                <label>Seleccionar Fecha</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Real-time schedule display */}
              <div className="availability-section">
                <h4>Disponibilidad para el día {bookingDate}</h4>
                {loadingAvailability ? (
                  <div className="spinner-text">Consultando horarios...</div>
                ) : availability ? (
                  <div className="schedules-container">
                    <div className="schedule-column">
                      <h5>Bloques Ocupados</h5>
                      {availability.ocupados.length === 0 ? (
                        <p className="status-empty">Ninguno (Cancha libre todo el día)</p>
                      ) : (
                        <ul className="schedule-list">
                          {availability.ocupados.map((item, idx) => (
                            <li key={idx} className="badge-occupied">
                              {item.horaInicio} - {item.horaFin}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="schedule-column">
                      <h5>Rangos Disponibles</h5>
                      <ul className="schedule-list">
                        {availability.libres.map((item, idx) => (
                          <li key={idx} className="badge-free">
                            {item.horaInicio} - {item.horaFin}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Duration selection */}
              <div className="hours-selector-grid">
                <div className="form-group">
                  <label>Hora Inicio</label>
                  <input
                    type="time"
                    step="900" // 15 mins steps
                    value={bookingHours.horaInicio}
                    onChange={(e) => setBookingHours({ ...bookingHours, horaInicio: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora Fin</label>
                  <input
                    type="time"
                    step="900"
                    value={bookingHours.horaFin}
                    onChange={(e) => setBookingHours({ ...bookingHours, horaFin: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Dynamic total price */}
              {calculatedPrice > 0 && (
                <div className="price-estimation">
                  Total Estimado: <strong className="green-text">${calculatedPrice.toFixed(2)}</strong>
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" disabled={bookingSubmitting || calculatedPrice <= 0} className="btn-primary">
                  {bookingSubmitting ? 'Procesando...' : 'Confirmar Pre-Reserva'}
                </button>
                <button type="button" onClick={() => setSelectedCourt(null)} className="btn-secondary">Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .canchas-page {
          padding: 1rem 0;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        .canchas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 1rem;
        }
        .cancha-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2.5rem 1.5rem 1.5rem 1.5rem;
        }
        .disabled-court {
          opacity: 0.6;
        }
        .court-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .court-name {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .court-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }
        .info-badge {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-glass);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .price-tag {
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .disabled-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--color-danger);
          color: #05050a;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .card-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
        }
        .action-btn {
          width: 100%;
        }
        .admin-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .btn-icon {
          padding: 0.4rem !important;
          font-size: 0.9rem;
        }
        .btn-delete:hover {
          border-color: var(--color-danger) !important;
          background: rgba(255, 107, 107, 0.1) !important;
        }
        
        /* Admin Form */
        .admin-form-card {
          margin-bottom: 2rem;
        }
        .admin-form-card h3 {
          margin-bottom: 1.5rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .row-checkbox {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          height: 100%;
          padding-top: 1.8rem;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
          cursor: pointer;
          user-select: none;
        }
        .form-actions {
          display: flex;
          gap: 1rem;
        }

        /* Modal backdrop and content */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          width: 100%;
          max-width: 580px;
          border-color: var(--border-glass-hover);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 0.75rem;
        }
        .modal-close {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 2rem;
          cursor: pointer;
          line-height: 1;
        }
        .modal-close:hover {
          color: var(--color-danger);
        }

        /* Booking forms inside modal */
        .booking-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .availability-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-glass);
          border-radius: 8px;
          padding: 1rem;
        }
        .availability-section h4 {
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
          color: var(--color-secondary);
        }
        .schedules-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .schedule-column h5 {
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .schedule-list {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .status-empty {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-style: italic;
        }
        .badge-occupied {
          background: rgba(255, 107, 107, 0.12);
          border: 1px solid rgba(255, 107, 107, 0.3);
          color: var(--color-danger);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-free {
          background: rgba(0, 245, 160, 0.12);
          border: 1px solid rgba(0, 245, 160, 0.3);
          color: var(--color-success);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .hours-selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .price-estimation {
          font-size: 1.15rem;
          color: var(--text-secondary);
          text-align: right;
          border-top: 1px dashed var(--border-glass);
          padding-top: 1rem;
        }
        .green-text {
          color: var(--color-success);
          font-weight: 700;
          text-shadow: 0 0 10px rgba(0, 245, 160, 0.2);
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }
        .spinner-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default Canchas;
