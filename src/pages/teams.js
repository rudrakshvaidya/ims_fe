// src/pages/teams.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'bootstrap';

// Consistent, crash-proof placeholder for logos
const PLACEHOLDER_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlZmVmIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNjYmM3Y2UiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBMb2dvPC90ZXh0Pjwvc3ZnPg==";

// Consistent API service helper
const apiService = {
  async request(endpoint, method = 'GET', body = null) {
    const config = {
      method,
      headers: { 'Content-Type': 'application/json', 'token': localStorage.getItem('token') }
    };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`http://127.0.0.1:8000${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
    return data;
  }
};

const INITIAL_TEAM_STATE = {
    _id: null, name: '', captain: '', coach: '', owner: '', state: '', logo: '', win: '', moto: ''
};

const Teams = () => {
  // State Management
  const [teams, setTeams] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [currentTeam, setCurrentTeam] = useState(INITIAL_TEAM_STATE);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  // Helper to show dismissible alerts
  const showAlert = (message, type, duration = 4000) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), duration);
  };

  // Fetch all page data once on load
  const fetchPageData = useCallback(async () => {
    setLoading(true);
    try {
      const isAdminCheck = new URLSearchParams(location.search).get("admin") === "true";
      if (isAdminCheck) {
          const roles = await apiService.request('/users/roles');
          setIsAdmin(roles.isAdmin);
      }
      const teamsData = await apiService.request('/teams');
      setTeams(teamsData);
    } catch (error) {
      showAlert(error.message, 'danger');
      if (error.message.includes('token')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [location.search, navigate]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // This effect correctly manages the Bootstrap modal instances and their state
  useEffect(() => {
    const setupModal = (ref, isOpen, setIsOpen) => {
      const modalElement = ref.current;
      if (!modalElement) return () => {};

      const bsModal = Modal.getOrCreateInstance(modalElement);
      if (isOpen) {
        bsModal.show();
      } else {
        bsModal.hide();
      }
      
      const handleHide = () => setIsOpen(false);
      modalElement.addEventListener('hidden.bs.modal', handleHide);
      return () => modalElement.removeEventListener('hidden.bs.modal', handleHide);
    };

    const cleanupEdit = setupModal(editModalRef, isEditModalOpen, setIsEditModalOpen);
    const cleanupDelete = setupModal(deleteModalRef, isDeleteModalOpen, setIsDeleteModalOpen);
    
    return () => {
      cleanupEdit();
      cleanupDelete();
    };
  }, [isEditModalOpen, isDeleteModalOpen]);


  // --- Event Handlers ---

  const handleShowAddModal = () => {
    setCurrentTeam(INITIAL_TEAM_STATE);
    setIsEditModalOpen(true);
  };
  
  const handleShowEditModal = async (teamId) => {
    try {
      const teamData = await apiService.request(`/teams/${teamId}`);
      setCurrentTeam(teamData);
      setIsEditModalOpen(true);
    } catch(error) {
      showAlert(error.message, 'danger');
    }
  };
  
  const handleShowDeleteModal = (team) => {
    setCurrentTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTeam(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    const isUpdating = !!currentTeam._id;
    const method = isUpdating ? 'PUT' : 'POST'; 
    const endpoint = isUpdating ? `/adminteams/${currentTeam._id}` : '/adminteams';

    if (!currentTeam.name || !currentTeam.captain || !currentTeam.coach || !currentTeam.owner || !currentTeam.state || !currentTeam.logo) {
      return showAlert('Please fill all required fields marked with *', 'warning');
    }

    // This is the FIX for the backend crash. We remove the `_id` field before sending.
    const { _id, ...payload } = currentTeam;

    try {
      await apiService.request(endpoint, method, payload);
      showAlert(`Team ${isUpdating ? 'updated' : 'added'} successfully!`, 'success');
      setIsEditModalOpen(false); // This now correctly closes the modal
      fetchPageData();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  };

  const handleDeleteTeam = async () => {
    if (!currentTeam._id) return;
    try {
      await apiService.request(`/adminteams/${currentTeam._id}`, 'DELETE');
      showAlert('Team deleted successfully!', 'success');
      setIsDeleteModalOpen(false); // This now correctly closes the modal
      setTeams(prevTeams => prevTeams.filter(t => t._id !== currentTeam._id));
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  };
  
  return (
    <>
      <style>{`body{background-color:#f8f9fa}.team-card{transition:all .3s ease;border:none;box-shadow:0 4px 6px #0000001a;border-radius:15px;overflow:hidden}.team-card:hover{transform:translateY(-5px);box-shadow:0 8px 25px #00000026}.team-image{height:250px;width:100%;object-fit:contain;object-position:center top;background:linear-gradient(135deg,#667eea,#764ba2)}.card-body{padding:1.5rem;background:linear-gradient(135deg,#f5f7fa,#c3cfe2)}.team-name{color:#2c3e50;font-weight:700;font-size:1.25rem;margin-bottom:.75rem}.team-info{color:#5a6c7d;font-size:.9rem;margin-bottom:.5rem}.stats-section{background:#ffffffcc;border-radius:10px;padding:.75rem;margin:1rem 0;border-left:4px solid #3498db}.page-header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:2rem 0;border-radius:15px;margin-bottom:2rem;text-align:center}.page-title{font-size:2.5rem;font-weight:700;text-shadow:2px 2px 4px #0000004d}.modal-content{border-radius:15px;border:none}.modal-header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:15px 15px 0 0;border-bottom:none}.form-label{font-weight:600}.action-buttons{display:flex;gap:.5rem}.no-teams{text-align:center;padding:3rem;color:#6c757d}.alert-position{position:fixed;top:20px;right:20px;z-index:9999;min-width:300px}`}</style>
      
      <div className="container-fluid py-4">
        {alert.show && <div className={`alert alert-${alert.type} alert-dismissible fade show alert-position`} role="alert">{alert.message}<button type="button" className="btn-close" onClick={() => setAlert({ show: false })}></button></div>}

        <header className="page-header">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-8 text-md-start"><h1 className="page-title"><i className="fas fa-shield-alt me-3"></i>Teams Management</h1></div>
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <button onClick={() => navigate('/dashboard')} className="btn btn-secondary me-2"><i className="fas fa-arrow-left"></i> Dashboard</button>
                {isAdmin && <button className="btn btn-success" onClick={handleShowAddModal}><i className="fas fa-plus"></i> Add Team</button>}
              </div>
            </div>
          </div>
        </header>

        <main className="container">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
          ) : teams.length > 0 ? (
            <div className="row g-4">
              {teams.map(t => (
                <div key={t._id} className="col-lg-4 col-md-6">
                  <div className="card team-card h-100">
                    <img src={t.logo || PLACEHOLDER_LOGO} className="team-image p-3" alt={t.name} onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_LOGO; }} />
                    <div className="card-body d-flex flex-column">
                      <h5 className="team-name">{t.name}</h5>
                      <p className="team-info"><i className="fas fa-user-tie text-primary me-2"></i><strong>Captain:</strong> {t.captain}</p>
                      <p className="team-info"><i className="fas fa-chalkboard-teacher text-success me-2"></i><strong>Coach:</strong> {t.coach}</p>
                      <p className="team-info"><i className="fas fa-map-marker-alt text-warning me-2"></i><strong>State:</strong> {t.state}</p>
                      <div className="stats-section">
                          <p className="team-info mb-2"><strong>Wins:</strong> {t.win || 'None'}</p>
                          <p className="team-info mb-0"><strong>Motto:</strong> {t.moto || 'N/A'}</p>
                      </div>
                      <div className="mt-auto pt-3">
                        <button className="btn btn-primary w-100 mb-2" onClick={() => navigate(`/teamstats/${t._id}`)}><i className="fas fa-chart-bar me-2"></i>View Detailed Stats</button>
                        {isAdmin && (
                          <div className="action-buttons">
                            <button className="btn btn-warning btn-sm flex-grow-1" onClick={() => handleShowEditModal(t._id)}><i className="fas fa-edit"></i> Edit</button>
                            <button className="btn btn-danger btn-sm flex-grow-1" onClick={() => handleShowDeleteModal(t)}><i className="fas fa-trash"></i> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-teams"><i className="fas fa-shield-alt fa-3x mb-3 text-muted"></i><h4>No Teams Found</h4></div>
          )}
        </main>
      </div>

      {/* Add/Edit Team Modal */}
      <div className="modal fade" ref={editModalRef} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{currentTeam._id ? 'Edit Team' : 'Add New Team'}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setIsEditModalOpen(false)}></button>
            </div>
            <form id="teamForm" onSubmit={handleSaveTeam}>
              <div className="modal-body">
                <h6 className="section-header">Team Information</h6>
                <div className="row">
                  <div className="col-md-6 mb-3"><label className="form-label">Team Name *</label><input type="text" className="form-control" name="name" value={currentTeam.name} onChange={handleInputChange} required /></div>
                  <div className="col-md-6 mb-3"><label className="form-label">Captain *</label><input type="text" className="form-control" name="captain" value={currentTeam.captain} onChange={handleInputChange} required /></div>
                  <div className="col-md-6 mb-3"><label className="form-label">Coach *</label><input type="text" className="form-control" name="coach" value={currentTeam.coach} onChange={handleInputChange} required /></div>
                  <div className="col-md-6 mb-3"><label className="form-label">Owner *</label><input type="text" className="form-control" name="owner" value={currentTeam.owner} onChange={handleInputChange} required /></div>
                  <div className="col-md-6 mb-3"><label className="form-label">State *</label><input type="text" className="form-control" name="state" value={currentTeam.state} onChange={handleInputChange} required /></div>
                  <div className="col-md-6 mb-3"><label className="form-label">Logo URL *</label><input type="url" className="form-control" name="logo" value={currentTeam.logo} onChange={handleInputChange} required /></div>
                </div>
                <h6 className="section-header">Team Achievements</h6>
                <div className="mb-3"><label className="form-label">Wins (Years)</label><input type="text" className="form-control" name="win" value={currentTeam.win} onChange={handleInputChange} placeholder="e.g., 2010, 2018" /></div>
                <div className="mb-3"><label className="form-label">Motto</label><input type="text" className="form-control" name="moto" value={currentTeam.moto} onChange={handleInputChange} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Team</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title"><i className="fas fa-exclamation-triangle me-2"></i>Confirm Delete</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setIsDeleteModalOpen(false)}></button>
            </div>
            <div className="modal-body"><p>Are you sure you want to delete the team "<strong>{currentTeam.name}</strong>"? This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteTeam}><i className="fas fa-trash me-2"></i>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Teams;