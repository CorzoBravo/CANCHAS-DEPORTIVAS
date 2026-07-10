import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Canchas() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState(null);
  const [courtForm, setCourtForm] = useState({ nombre: '', tipo: 'Futbol 5', precioHora: '', habilitada: true });

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
      const response = await api.get(`/canchas?all=${isAdmin ? 'true' : 'false'}`);
      setCanchas(response.data.data.courts);
    } catch (err) {
      setError('Error al cargar el catalogo de canchas.');
    } finally {
      setLoading(false);
    }
  };

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

      setCourtForm({ nombre: '', tipo: 'Futbol 5', precioHora: '', habilitada: true });
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
    if (!window.confirm('Estas seguro de que deseas eliminar esta cancha?')) return;
    try {
      await api.delete(`/canchas/${id}`);
      fetchCanchas();
    } catch (err) {
      setError('No se pudo eliminar la cancha.');
    }
  };

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
          <button onClick={() => { setShowAdminForm(!showAdminForm); setEditingCourtId(null); }} className="btn btn-primary">
            {showAdminForm ? 'Ocultar Formulario' : 'Agregar Cancha'}
          </button>
        )}
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {isAdmin && showAdminForm && (
        <form onSubmit={handleCourtFormSubmit} className="admin-form-card card animate-fade-in">
          <h3>{editingCourtId ? 'Editar Cancha' : 'Agregar Nueva Cancha'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre de la Cancha</label>
              <input
                type="text"
                value={courtForm.nombre}
                onChange={(e) => setCourtForm({ ...courtForm, nombre: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deporte / Tipo</label>
              <select
                value={courtForm.tipo}
                onChange={(e) => setCourtForm({ ...courtForm, tipo: e.target.value })}
                className="form-input"
              >
                <option value="Futbol 5">Futbol 5</option>
                <option value="Tenis">Tenis</option>
                <option value="Basquetbol">Basquetbol</option>
                <option value="Squash">Squash</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio por Hora ($)</label>
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
            <button type="submit" className="btn btn-primary">Guardar</button>
            <button type="button" onClick={() => { setShowAdminForm(false); setEditingCourtId(null); }} className="btn btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="canchas-grid">
          {canchas.map((cancha) => (
            <div key={cancha.id} className={`cancha-card card card-hover ${!cancha.habilitada ? 'disabled-court' : ''}`}>
              <div className="court-icon">
                {cancha.tipo.includes('Futbol') && '\u26BD'}
                {cancha.tipo.includes('Tenis') && '\uD83C\uDFBE'}
                {cancha.tipo.includes('Basquet') && '\uD83C\uDFC0'}
                {cancha.tipo.includes('Squash') && '\uD83C\uDFD8'}
              </div>
              <h2 className="court-name">{cancha.nombre}</h2>
              <div className="court-info">
                <span className="info-badge">{cancha.tipo}</span>
                <span className="price-tag">${cancha.precioHora} / hora</span>
              </div>
              {!cancha.habilitada && <span className="disabled-badge">Mantenimiento</span>}

              <div className="card-actions">
                {cancha.habilitada ? (
                  <button onClick={() => handleOpenBooking(cancha)} className="btn btn-primary">Reservar Turno</button>
                ) : (
                  <button className="btn btn-primary" disabled>No Disponible</button>
                )}
                {isAdmin && (
                  <div className="admin-actions">
                    <button onClick={() => handleEditClick(cancha)} className="btn btn-secondary btn-icon" title="Editar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDeleteClick(cancha.id)} className="btn btn-danger btn-icon" title="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCourt && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Reservar {selectedCourt.nombre}</h2>
              <button onClick={() => setSelectedCourt(null)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleCreateBooking} className="booking-form">
              {bookingError && <div className="alert alert-error">{bookingError}</div>}

              <div className="form-group">
                <label className="form-label">Seleccionar Fecha</label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="availability-section">
                <h4>Disponibilidad para el dia {bookingDate}</h4>
                {loadingAvailability ? (
                  <div className="spinner-text">Consultando horarios...</div>
                ) : availability ? (
                  <div className="schedules-container">
                    <div className="schedule-column">
                      <h5>Bloques Ocupados</h5>
                      {availability.ocupados.length === 0 ? (
                        <p className="status-empty">Ninguno (Cancha libre todo el dia)</p>
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

              <div className="hours-selector-grid">
                <div className="form-group">
                  <label className="form-label">Hora Inicio</label>
                  <input
                    type="time"
                    step="900"
                    value={bookingHours.horaInicio}
                    onChange={(e) => setBookingHours({ ...bookingHours, horaInicio: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora Fin</label>
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

              {calculatedPrice > 0 && (
                <div className="price-estimation">
                  Total Estimado: <strong>${calculatedPrice.toFixed(2)}</strong>
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" disabled={bookingSubmitting || calculatedPrice <= 0} className="btn btn-primary">
                  {bookingSubmitting ? 'Procesando...' : 'Confirmar Pre-Reserva'}
                </button>
                <button type="button" onClick={() => setSelectedCourt(null)} className="btn btn-secondary">Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Canchas;
