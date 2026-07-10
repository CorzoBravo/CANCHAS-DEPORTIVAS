import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Pagos() {
  const { reservaId } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [cardForm, setCardForm] = useState({
    numeroTarjeta: '',
    nombreTitular: '',
    expiracion: '',
    cvv: '',
  });

  useEffect(() => {
    fetchReservation();
  }, [reservaId]);

  const fetchReservation = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reservas/${reservaId}`);
      setReservation(res.data.data.reservation);
    } catch (err) {
      setError('No se pudieron obtener los datos de la reserva.');
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM - (startH * 60 + startM)) / 60;
  };

  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    const d = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const matches = val.match(/.{1,4}/g);
    const formatted = matches ? matches.join(' ') : '';
    setCardForm({ ...cardForm, numeroTarjeta: formatted });
  };

  const handleExpiryChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    const formatted = val.length >= 3 ? `${val.substring(0, 2)}/${val.substring(2, 4)}` : val;
    setCardForm({ ...cardForm, expiracion: formatted });
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCardForm({ ...cardForm, cvv: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const cleanCardNumber = cardForm.numeroTarjeta.replace(/\s+/g, '');

      await api.post('/pagos', {
        reservaId,
        numeroTarjeta: cleanCardNumber,
        nombreTitular: cardForm.nombreTitular,
        cvv: cardForm.cvv,
        expiracion: cardForm.expiracion,
      });

      alert('Pago procesado con exito! Tu reserva ha sido confirmada.');
      navigate('/reservas');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!reservation) return <div className="alert alert-error">{error || 'Reserva no encontrada.'}</div>;

  const hours = calculateHours(reservation.horaInicio, reservation.horaFin);
  const totalCost = hours * Number(reservation.cancha.precioHora);

  return (
    <div className="pagos-page animate-fade-in">
      <div className="pagos-grid">

        <div className="summary-card card" style={{ padding: 'var(--space-6)' }}>
          <h2 className="section-title">Resumen del Turno</h2>
          <div className="court-badge-large">
            <span className="court-badge-icon">&#9917;</span>
            <div>
              <h3>{reservation.cancha.nombre}</h3>
              <p>{reservation.cancha.tipo}</p>
            </div>
          </div>

          <div className="details-list">
            <div className="detail-item">
              <span className="detail-label">Fecha</span>
              <span className="detail-value">{formatDate(reservation.fecha)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Horario</span>
              <span className="detail-value">{reservation.horaInicio} - {reservation.horaFin}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duracion</span>
              <span className="detail-value">{hours} horas</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Tarifa por Hora</span>
              <span className="detail-value">${Number(reservation.cancha.precioHora).toFixed(2)}</span>
            </div>
          </div>

          <div className="total-due">
            <span>Total a Pagar</span>
            <span className="total-price">${totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="payment-card card" style={{ padding: 'var(--space-6)' }}>
          <h2 className="section-title">Metodo de Pago</h2>
          <p className="payment-subtitle">Ingresa tus datos para confirmar tu reserva de forma segura</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="alert alert-info">
            <strong>Simulador:</strong> Puedes ingresar cualquier tarjeta de credito de 16 digitos.
            Si deseas simular una <strong>tarjeta rechazada</strong>, ingresa un numero que finalice en <code>4444</code>.
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label className="form-label">Nombre del Titular</label>
              <input
                type="text"
                value={cardForm.nombreTitular}
                onChange={(e) => setCardForm({ ...cardForm, nombreTitular: e.target.value })}
                className="form-input"
                placeholder="Nombre como figura en la tarjeta"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Numero de Tarjeta</label>
              <input
                type="text"
                value={cardForm.numeroTarjeta}
                onChange={handleCardNumberChange}
                className="form-input"
                placeholder="0000 0000 0000 0000"
                required
              />
            </div>

            <div className="form-row-double">
              <div className="form-group">
                <label className="form-label">Vencimiento (MM/AA)</label>
                <input
                  type="text"
                  value={cardForm.expiracion}
                  onChange={handleExpiryChange}
                  className="form-input"
                  placeholder="12/28"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">CVC / CVV</label>
                <input
                  type="text"
                  value={cardForm.cvv}
                  onChange={handleCvvChange}
                  className="form-input"
                  placeholder="123"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary checkout-btn">
              {submitting ? 'Procesando Pago...' : `Pagar $${totalCost.toFixed(2)}`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Pagos;
