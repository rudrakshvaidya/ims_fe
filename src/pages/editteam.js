import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const PLACEHOLDER_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlZmVmIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNjYmM3Y2UiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBMb2dvPC90ZXh0Pjwvc3ZnPg==";
const PLACEHOLDER_PLAYER_IMG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlZmVmIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNjYmM3Y2UiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";

// A simplified API service for this component's needs.
const apiService = async (endpoint, method = 'GET', body = null) => {
  const config = { method, headers: { 'Content-Type': 'application/json', 'token': localStorage.getItem('token') } };
  if (body) config.body = JSON.stringify(body);
  const response = await fetch(`http://127.0.0.1:8000${endpoint}`, config);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}`);
  return data;
};

const EditTeam = () => {
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ownedTeamData, allPlayersData] = await Promise.all([
        apiService('/owner/team'),
        apiService('/players')
      ]);

      if (!ownedTeamData.team) {
        throw new Error("Access Denied. You do not appear to own a team.");
      }
      
      const myTeam = ownedTeamData.team;
      setTeam(myTeam);

      const teamRoster = allPlayersData.filter(p => p.playingFor === myTeam._id);
      const available = allPlayersData.filter(p => p.playingFor !== myTeam._id);

      setRoster(teamRoster);
      setAvailablePlayers(available);

    } catch (err) {
      setError(err.message);
      if (err.message.includes('token') || err.message.includes('Forbidden')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTeam(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!team.name || !team.captain) {
        setError("Team Name and Captain cannot be empty.");
        return;
    }
    try {
      const updatedData = {
        name: team.name,
        captain: team.captain,
        logo: team.logo,
        moto: team.moto
      };
      const response = await apiService('/owner/team', 'PATCH', updatedData);
      setSuccess(response.message);
      // Re-fetch to display the updated team name in the header instantly
      fetchData(); 
    } catch (err) {
      setError(err.message);
    }
  };
  
  // --- Conditional Rendering ---
  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div></div>;
  }

  if (error && !team) { // Only show full-page error if the initial load fails
    return <div className="container mt-5"><div className="alert alert-danger text-center"><h4>Error</h4><p>{error}</p><button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-2">Back to Dashboard</button></div></div>;
  }

  // --- Main Component JSX ---
  return (
    <>
      <style>{`
        body { background-color: #f4f7f6; }
        .edit-header { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 4rem 1rem; border-radius: 0 0 40px 40px; }
        .edit-header .team-logo { width: 120px; height: 120px; object-fit: contain; border-radius: 20px; background: rgba(255,255,255,0.1); padding: 0.5rem; }
        .section-card { background: #fff; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.08); height: 100%; }
        .section-title { font-weight: 600; color: #2c3e50; margin-bottom: 1.5rem; }
        .roster-list { max-height: 400px; overflow-y: auto; padding-right: 10px; }
        .player-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-radius: 10px; transition: background-color 0.2s ease; border-bottom: 1px solid #eee; }
        .player-item:last-child { border-bottom: none; }
        .player-item-info { display: flex; align-items: center; }
        .player-item-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 1rem; }
      `}</style>
      
      <header className="edit-header">
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            {team && <img src={team.logo || PLACEHOLDER_LOGO} alt="Team Logo" className="team-logo me-4" />}
            <div>
              <h5 className="mb-1 opacity-75">Team Management Dashboard</h5>
              <h1 className="m-0" style={{fontWeight: 700}}>{team ? team.name : 'Loading...'}</h1>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-light">Back to Dashboard</button>
        </div>
      </header>

      <main className="container py-5">
        <div className="row g-5">
          {/* Column for Editing Team Details */}
          <div className="col-lg-5">
            <section className="section-card">
              <h3 className="section-title">Edit Team Details</h3>
              <p className="text-muted small mb-4">As the owner, you can edit your team's Name, Captain, Motto, and Logo.</p>
              {team && (
                <form onSubmit={handleUpdateDetails}>
                  {/* Error and Success Messages */}
                  {error && <div className="alert alert-danger small p-2 mb-3">{error}</div>}
                  {success && <div className="alert alert-success small p-2 mb-3">{success}</div>}
                  
                  <div className="mb-3">
                    <label className="form-label">Team Name</label>
                    <input type="text" className="form-control" name="name" value={team.name} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Team Captain</label>
                    <input type="text" className="form-control" name="captain" value={team.captain} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Team Motto</label>
                    <input type="text" className="form-control" name="moto" value={team.moto || ''} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Logo URL</label>
                    <input type="url" className="form-control" name="logo" value={team.logo || ''} onChange={handleInputChange} />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 mt-2">Save Details</button>
                </form>
              )}
            </section>
          </div>

          {/* Column for Viewing Roster (No add/remove buttons) */}
          <div className="col-lg-7">
            <div className="row g-4">
              <div className="col-12">
                <section className="section-card">
                  <h3 className="section-title">Current Roster ({roster.length})</h3>
                  <div className="roster-list">
                    {roster.length > 0 ? roster.map(p => (
                      <div key={p._id} className="player-item">
                        <div className="player-item-info">
                          <img src={p.image || PLACEHOLDER_PLAYER_IMG} className="player-item-img" alt={p.name} />
                          <div>
                            <strong>{p.name}</strong>
                            <div className="text-muted small">{p.specialization}</div>
                          </div>
                        </div>
                        {/* REMOVED THE BUTTON */}
                      </div>
                    )) : <p className="text-muted">No players currently on this team.</p>}
                  </div>
                </section>
              </div>
              <div className="col-12">
                <section className="section-card">
                  <h3 className="section-title">Available Players ({availablePlayers.length})</h3>
                  <p className='text-muted small'>This is a list of unassigned players in the league. Roster management is handled by the league administrator.</p>
                  <div className="roster-list">
                    {availablePlayers.map(p => (
                      <div key={p._id} className="player-item">
                        <div className="player-item-info">
                          <img src={p.image || PLACEHOLDER_PLAYER_IMG} className="player-item-img" alt={p.name} />
                          <div>
                            <strong>{p.name}</strong>
                            <div className="text-muted small">{p.specialization}</div>
                          </div>
                        </div>
                        {/* REMOVED THE BUTTON */}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default EditTeam;