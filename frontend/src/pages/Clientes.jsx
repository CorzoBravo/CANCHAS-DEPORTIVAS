import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Clientes() {
  const { user } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
      password: '',
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

    if (!window.confirm(`Estas seguro de que deseas eliminar al cliente "${nombre}"? Esta accion no se puede deshacer.`)) {
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
          <h1 className="page-title">Administracion de Clientes</h1>
          <p className="page-subtitle">Gestiona cuentas de usuario, asigna roles y modera el acceso</p>
        </div>

        <div className="search-container card">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input search-input"
            placeholder="Buscar por nombre o correo..."
          />
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : clientes.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-state-icon">&#x1F465;</span>
          <h3>No se encontraron clientes</h3>
          <p>Intenta ajustar el termino de busqueda.</p>
        </div>
      ) : (
        <div className="clientes-container card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo Electronico</th>
                  <th>Telefono</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="cell-name">{cliente.nombre}</td>
                    <td className="cell-email">{cliente.email}</td>
                    <td className="cell-phone">{cliente.telefono || <span className="text-muted">No especificado</span>}</td>
                    <td>
                      <span className={`role-badge role-${cliente.rol}`}>
                        {cliente.rol === 'admin' ? 'Administrador' : 'Cliente'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-wrapper">
                        <button
                          onClick={() => handleEditClick(cliente)}
                          className="btn btn-secondary btn-sm edit-btn"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(cliente.id, cliente.nombre)}
                          disabled={cliente.id === user.id}
                          className="btn btn-secondary btn-sm delete-btn"
                        >
                          Eliminar
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

      {selectedClient && (
        <div className="modal-backdrop">
          <div className="modal-content animate-slide-up">
            <div className="modal-header">
              <h2>Editar Cliente: {selectedClient.nombre}</h2>
              <button onClick={() => setSelectedClient(null)} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form">
              {editError && <div className="alert alert-error">{editError}</div>}

              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electronico</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefono (Opcional)</label>
                <input
                  type="tel"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-row-double">
                <div className="form-group">
                  <label className="form-label">Rol del Usuario</label>
                  <select
                    value={editForm.rol}
                    onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                    className="form-input"
                    disabled={selectedClient.id === user.id}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contrasena (Opcional)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="form-input"
                    placeholder="Nueva contrasena si deseas cambiarla"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" disabled={editSubmitting} className="btn btn-primary">
                  {editSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button type="button" onClick={() => setSelectedClient(null)} className="btn btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
