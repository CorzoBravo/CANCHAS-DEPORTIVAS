import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const getThirtyDaysAgoString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [dateFilter, setDateFilter] = useState({
    desde: getThirtyDaysAgoString(),
    hasta: getTodayString(),
  });

  const [reservasReport, setReservasReport] = useState(null);
  const [ingresosReport, setIngresosReport] = useState(null);
  const [rankingReport, setRankingReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter.desde, dateFilter.hasta]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resReport, ingReport, rnkReport] = await Promise.all([
        api.get(`/reportes/reservas?desde=${dateFilter.desde}&hasta=${dateFilter.hasta}`),
        api.get(`/reportes/ingresos?desde=${dateFilter.desde}&hasta=${dateFilter.hasta}`),
        api.get('/reportes/canchas-mas-usadas'),
      ]);

      setReservasReport(resReport.data.data);
      setIngresosReport(ingReport.data.data);
      setRankingReport(rnkReport.data.data.ranking);
    } catch (err) {
      setError('Error al consultar métricas del servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Find max value in daily ingresos for rendering bar charts proportionally
  const getMaxDailyTotal = () => {
    if (!ingresosReport || ingresosReport.detalleDiario.length === 0) return 0;
    return Math.max(...ingresosReport.detalleDiario.map(d => d.total));
  };

  const maxDaily = getMaxDailyTotal();

  return (
    <div className="dashboard-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard Administrativo</h1>
          <p className="page-subtitle">Monitoreo de ingresos, reservas y popularidad</p>
        </div>

        {/* Date Filter Inputs */}
        <div className="filter-card glass-card">
          <div className="filter-group">
            <label>Desde</label>
            <input
              type="date"
              value={dateFilter.desde}
              onChange={(e) => setDateFilter({ ...dateFilter, desde: e.target.value })}
              className="form-input filter-input"
            />
          </div>
          <div className="filter-group">
            <label>Hasta</label>
            <input
              type="date"
              value={dateFilter.hasta}
              onChange={(e) => setDateFilter({ ...dateFilter, hasta: e.target.value })}
              className="form-input filter-input"
            />
          </div>
        </div>
      </header>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Cargando métricas...</div>
      ) : (
        <div className="dashboard-grid">
          
          {/* Top Row: Metric Cards */}
          <div className="metric-card glass-card">
            <h4>Total Ingresos Recaudados</h4>
            <div className="metric-value green-text">
              ${ingresosReport?.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="metric-description">Pagos aprobados en el período seleccionado</p>
          </div>

          <div className="metric-card glass-card">
            <h4>Total Reservas Solicitadas</h4>
            <div className="metric-value blue-text">
              {reservasReport?.total}
            </div>
            <p className="metric-description">Número de turnos agendados (todos los estados)</p>
          </div>

          {/* Left Column: Booking Status Breakdown & Daily Revenue Charts */}
          <div className="dashboard-section glass-card span-two-cols">
            <h3>Desglose por Estado de Reserva</h3>
            <div className="status-grid">
              {reservasReport?.porEstado.map((item, idx) => (
                <div key={idx} className="status-item-card">
                  <span className={`status-badge status-${item.estado}`}>{item.estado}</span>
                  <span className="status-item-value">{item.cantidad}</span>
                </div>
              ))}
              {reservasReport?.porEstado.length === 0 && (
                <p className="text-muted">Sin datos de reservas en este rango.</p>
              )}
            </div>
          </div>

          <div className="dashboard-section glass-card">
            <h3>Ingresos Diarios</h3>
            {ingresosReport?.detalleDiario.length === 0 ? (
              <p className="status-empty">No hay ingresos registrados en este rango.</p>
            ) : (
              <div className="chart-list">
                {ingresosReport?.detalleDiario.map((item, idx) => {
                  const percentage = maxDaily > 0 ? (item.total / maxDaily) * 100 : 0;
                  return (
                    <div key={idx} className="chart-row">
                      <span className="chart-label">{item.fecha.substring(5)}</span>
                      <div className="chart-bar-container">
                        <div className="chart-bar" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="chart-value">${item.total.toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Court Popularity Rankings */}
          <div className="dashboard-section glass-card">
            <h3>Canchas más Utilizadas</h3>
            {rankingReport.length === 0 ? (
              <p className="status-empty">No hay turnos registrados en ninguna cancha.</p>
            ) : (
              <ol className="ranking-list">
                {rankingReport.map((court, index) => (
                  <li key={court.canchaId} className="ranking-item">
                    <div className="ranking-position">{index + 1}</div>
                    <div className="ranking-details">
                      <span className="ranking-name">{court.nombre}</span>
                      <span className="ranking-type">{court.tipo}</span>
                    </div>
                    <span className="ranking-counter"><strong>{court.reservas}</strong> reservas</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

        </div>
      )}

      <style>{`
        .dashboard-page {
          padding: 1rem 0;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
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
        
        .filter-card {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem !important;
          align-items: center;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .filter-group label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
        }
        .filter-input {
          padding: 0.4rem 0.75rem !important;
          font-size: 0.9rem !important;
          width: 150px;
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

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }
        
        /* Metric cards */
        .metric-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .metric-card h4 {
          font-size: 0.95rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-value {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .green-text {
          color: var(--color-success);
          text-shadow: 0 0 15px rgba(0, 245, 160, 0.2);
        }
        .blue-text {
          color: var(--color-primary);
          text-shadow: 0 0 15px rgba(0, 242, 254, 0.2);
        }
        .metric-description {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        /* Sections */
        .dashboard-section {
          padding: 2rem;
        }
        .dashboard-section h3 {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 0.75rem;
        }
        .span-two-cols {
          grid-column: span 2;
        }

        /* Statuses */
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
        }
        .status-item-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius);
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-item-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Chart */
        .chart-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .chart-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .chart-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          width: 45px;
          text-align: right;
        }
        .chart-bar-container {
          flex-grow: 1;
          height: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 6px;
          overflow: hidden;
        }
        .chart-bar {
          height: 100%;
          background: var(--gradient-main);
          border-radius: 6px;
        }
        .chart-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-success);
          width: 55px;
        }
        .status-empty {
          color: var(--text-muted);
          font-style: italic;
          font-size: 0.9rem;
        }

        /* Ranking list */
        .ranking-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .ranking-item {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-glass);
          border-radius: 8px;
          padding: 0.75rem 1rem;
        }
        .ranking-position {
          background: var(--gradient-main);
          color: #05050a;
          font-weight: 700;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 1rem;
          font-size: 0.9rem;
        }
        .ranking-details {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .ranking-name {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.95rem;
        }
        .ranking-type {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .ranking-counter {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .ranking-counter strong {
          color: var(--color-primary);
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .span-two-cols {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
