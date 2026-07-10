import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Clientes() {
  const { user } = useAuth();
  
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Edit Modal State
  const [selectedClient, setSelectedClient] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'cliente',
    password: '',
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, [search]);

  const fetchClientes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/clientes?search=${search}`);
      setClientes(response.data.data.clients);
    } catch (err) {
      setError('Error al cargar la lista de clientes del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (client) => {
    setSelectedClient(client);
    setEditForm({
      nombre: client.nombre,
      email: client.email,
      telefono: client.telefono || '',
      rol: client.rol,
      password: '', // blank by default
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);

    try {
      const payload = {
        nombre: editForm.nombre,
        email: editForm.email,
        telefono: editForm.telefono || null,
        rol: editForm.rol,
      };

      if (editForm.password.trim() !== '') {
        payload.password = editForm.password;
      }

      await api.put(`/clientes/${selectedClient.id}`, payload);
      
      // Close modal and refresh list
      setSelectedClient(null);
      fetchClientes();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error al actualizar el cliente.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteClick = async (id, nombre) => {
    if (id === user.id) {
      alert('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
    } catch (err) {
      setError('No se pudo eliminar al cliente.');
    }
  };

  return (
    <div className="clientes-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Administración de Clientes</h1>
          <p className="page-subtitle">Gestiona cuentas de usuario, asigna roles y modera el acceso</p>
        </div>
        
        {/* Search input */}
        <div className="search-container glass-card">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input search-input"
            placeholder="Buscar por nombre o correo..."
          />
        </div>
      </header>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Cargando lista de clientes...</div>
      ) : clientes.length === 0 ? (
        <div className="empty-state glass-card">
          <span className="empty-icon">👥</span>
          <h3>No se encontraron clientes</h3>
          <p>Intenta ajustar el término de búsqueda.</p>
        </div>
      ) : (
        <div className="clientes-container glass-card">
          <div className="table-responsive">
            <table className="clientes-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="table-row">
                    <td className="cell-name">{cliente.nombre}</td>
                    <td className="cell-email">{cliente.email}</td>
                    <td className="cell-phone">{cliente.telefono || <span className="text-muted">No especificado</span>}</td>
                    <td>
                      <span className={`role-badge role-${cliente.rol}`}>
                        {cliente.rol === 'admin' ? 'Administrador' : 'Cliente'}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div className="actions-wrapper">
                        <button
                          onClick={() => handleEditClick(cliente)}
                          className="btn-secondary edit-btn"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(cliente.id, cliente.nombre)}
                          disabled={cliente.id === user.id}
                          className="btn-secondary delete-btn"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {selectedClient && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header">
              <h2>Editar Cliente: {selectedClient.nombre}</h2>
              <button onClick={() => setSelectedClient(null)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form">
              {editError && <div className="alert-error">{editError}</div>}

              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono (Opcional)</label>
                <input
                  type="tel"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-row-double">
                <div className="form-group">
                  <label>Rol del Usuario</label>
                  <select
                    value={editForm.rol}
                    onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                    className="form-input"
                    disabled={selectedClient.id === user.id} // Cannot demote self
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contraseña (Opcional)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="form-input"
                    placeholder="Nueva contraseña si deseas cambiarla"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" disabled={editSubmitting} className="btn-primary">
                  {editSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button type="button" onClick={() => setSelectedClient(null)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .clientes-page {
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
        .search-container {
          padding: 0.5rem 1rem !important;
        }
        .search-input {
          width: 280px;
          padding: 0.5rem 0.75rem !important;
          font-size: 0.9rem !important;
          border-color: transparent;
        }
        .search-input:focus {
          border-color: var(--color-primary);
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

        .clientes-container {
          padding: 1.5rem;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .clientes-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.95rem;
        }
        .clientes-table th {
          border-bottom: 2px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 1rem;
          font-weight: 600;
        }
        .clientes-table td {
          border-bottom: 1px solid var(--border-glass);
          padding: 1.1rem 1rem;
          vertical-align: middle;
        }
        .table-row:hover {
          background: rgba(255, 255, 255, 0.01);
        }
        
        .cell-name {
          font-weight: 600;
          color: var(--text-primary);
        }
        .cell-email {
          color: var(--text-secondary);
        }
        .cell-phone {
          color: var(--text-primary);
        }

        /* Role Badges */
        .role-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .role-admin {
          background: rgba(0, 242, 254, 0.15);
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
        }
        .role-cliente {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
        }

        .actions-wrapper {
          display: flex;
          gap: 0.5rem;
        }
        .edit-btn {
          padding: 0.35rem 0.75rem !important;
          font-size: 0.85rem !important;
          border-radius: 6px !important;
        }
        .delete-btn {
          padding: 0.35rem 0.75rem !important;
          font-size: 0.85rem !important;
          border-radius: 6px !important;
          border-color: var(--border-glass) !important;
          color: var(--text-secondary) !important;
        }
        .delete-btn:hover {
          border-color: var(--color-danger) !important;
          background: rgba(255, 107, 107, 0.1) !important;
          color: var(--color-danger) !important;
        }
        .delete-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: transparent !important;
          border-color: var(--border-glass) !important;
          color: var(--text-muted) !important;
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
          max-width: 540px;
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

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-row-double {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 1rem;
        }
        .modal-form label {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 500;
          margin-bottom: 0.35rem;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
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
        }
      `}</style>
    </div>
  );
}

export default Clientes;
