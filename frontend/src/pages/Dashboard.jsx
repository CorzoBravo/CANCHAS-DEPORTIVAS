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
      setError('Error al consultar metricas del servidor.');
    } finally {
      setLoading(false);
    }
  };

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

        <div className="filter-card card">
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

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="dashboard-grid">

          <div className="metric-card card">
            <h4>Total Ingresos Recaudados</h4>
            <div className="metric-value green-text">
              ${ingresosReport?.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="metric-description">Pagos aprobados en el periodo seleccionado</p>
          </div>

          <div className="metric-card card">
            <h4>Total Reservas Solicitadas</h4>
            <div className="metric-value blue-text">
              {reservasReport?.total}
            </div>
            <p className="metric-description">Numero de turnos agendados (todos los estados)</p>
          </div>

          <div className="dashboard-section card span-two-cols">
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

          <div className="dashboard-section card">
            <h3>Ingresos Diarios</h3>
            {ingresosReport?.detalleDiario.length === 0 ? (
              <p className="text-muted" style={{ fontStyle: 'italic' }}>No hay ingresos registrados en este rango.</p>
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

          <div className="dashboard-section card">
            <h3>Canchas mas Utilizadas</h3>
            {rankingReport.length === 0 ? (
              <p className="text-muted" style={{ fontStyle: 'italic' }}>No hay turnos registrados en ninguna cancha.</p>
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
    </div>
  );
}

export default Dashboard;
