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

  // Card Form State
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
    // Format card number with spaces (XXXX XXXX XXXX XXXX)
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const matches = val.match(/.{1,4}/g);
    const formatted = matches ? matches.join(' ') : '';
    setCardForm({ ...cardForm, numeroTarjeta: formatted });
  };

  const handleExpiryChange = (e) => {
    // Format expiry date as MM/AA
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
      // Send raw unspaced card number to backend
      const cleanCardNumber = cardForm.numeroTarjeta.replace(/\s+/g, '');
      
      await api.post('/pagos', {
        reservaId,
        numeroTarjeta: cleanCardNumber,
        nombreTitular: cardForm.nombreTitular,
        cvv: cardForm.cvv,
        expiracion: cardForm.expiracion,
      });

      alert('¡Pago procesado con éxito! Tu reserva ha sido confirmada.');
      navigate('/reservas');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container">Cargando detalles de pago...</div>;
  if (!reservation) return <div className="alert-error">{error || 'Reserva no encontrada.'}</div>;

  const hours = calculateHours(reservation.horaInicio, reservation.horaFin);
  const totalCost = hours * Number(reservation.cancha.precioHora);

  return (
    <div className="pagos-page animate-fade-in">
      <div className="pagos-grid">
        
        {/* Left: Summary Card */}
        <div className="summary-card glass-card">
          <h2 className="section-title">Resumen del Turno</h2>
          <div className="court-badge-large">
            <span className="court-badge-icon">⚽</span>
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
              <span className="detail-label">Duración</span>
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

        {/* Right: Payment Method Form */}
        <div className="payment-card glass-card">
          <h2 className="section-title">Método de Pago</h2>
          <p className="payment-subtitle">Ingresa tus datos para confirmar tu reserva de forma segura</p>
          
          {error && <div className="alert-error">{error}</div>}

          {/* Sandbox tip warning */}
          <div className="alert-info">
            💡 <strong>Simulador:</strong> Puedes ingresar cualquier tarjeta de crédito de 16 dígitos. 
            Si deseas simular una <strong>tarjeta rechazada</strong>, ingresa un número que finalice en <code>4444</code>.
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label>Nombre del Titular</label>
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
              <label>Número de Tarjeta</label>
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
                <label>Vencimiento (MM/AA)</label>
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
                <label>CVC / CVV</label>
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

            <button type="submit" disabled={submitting} className="btn-primary checkout-btn">
              {submitting ? 'Procesando Pago...' : `Pagar $${totalCost.toFixed(2)}`}
            </button>
          </form>
        </div>

      </div>

      <style>{`
        .pagos-page {
          padding: 1rem 0;
        }
        .pagos-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 2rem;
          align-items: start;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }
        
        /* Summary Card left side */
        .court-badge-large {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          padding: 1.25rem;
          border-radius: var(--border-radius);
          margin-bottom: 1.5rem;
        }
        .court-badge-icon {
          font-size: 2.2rem;
        }
        .court-badge-large h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .court-badge-large p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        
        .details-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          border-bottom: 1px dashed var(--border-glass);
          padding-bottom: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
        }
        .detail-label {
          color: var(--text-secondary);
        }
        .detail-value {
          color: var(--text-primary);
          font-weight: 500;
        }
        
        .total-due {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-due span:first-child {
          font-size: 1.1rem;
          color: var(--text-primary);
          font-weight: 600;
        }
        .total-price {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--color-success);
          text-shadow: 0 0 12px rgba(0, 245, 160, 0.25);
        }

        /* Payment right side */
        .payment-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
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
        .alert-info {
          background: rgba(0, 242, 254, 0.08);
          border: 1px solid rgba(0, 242, 254, 0.25);
          color: var(--text-primary);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .alert-info code {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          color: var(--color-primary);
          font-family: monospace;
          font-weight: 600;
        }
        
        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-row-double {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .payment-form label {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 500;
          margin-bottom: 0.35rem;
        }
        .checkout-btn {
          margin-top: 1rem;
          padding: 0.85rem;
          font-size: 1.05rem;
          width: 100%;
        }

        @media (max-width: 800px) {
          .pagos-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Pagos;
