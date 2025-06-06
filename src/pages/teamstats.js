// src/pages/teamstats.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Reusable, crash-proof placeholders
const PLACEHOLDER_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlZmVmIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNjYmM3Y2UiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBMb2dvPC90ZXh0Pjwvc3ZnPg==";
const PLACEHOLDER_PLAYER_IMG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlZmVmIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNjYmM3Y2UiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";

// A reusable sub-component for displaying individual team stats.
const StatCard = ({ title, value, icon }) => (
  <div className="stat-card h-100">
    <div className="stat-icon"><i className={`fas ${icon}`}></i></div>
    <div className="stat-content">
      <h6 className="stat-title">{title}</h6>
      <p className="stat-value">{value || 'N/A'}</p>
    </div>
  </div>
);

// A sub-component for player cards in the roster.
const PlayerCard = ({ player }) => {
  const navigate = useNavigate();
  return (
    <div className="player-card" onClick={() => navigate(`/playerstats/${player._id}`)}>
      <img
        src={player.image || PLACEHOLDER_PLAYER_IMG}
        alt={player.name}
        className="player-image"
        onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_PLAYER_IMG; }}
      />
      <div className="player-info">
        <h6 className="player-name">{player.name}</h6>
        <p className="player-role">{player.specialization}</p>
      </div>
    </div>
  );
};

const TeamStats = () => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchTeamData = useCallback(async () => {
    if (!id) {
      setError("No team ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/teams/${id}/stats`, {
        headers: { 'Content-Type': 'application/json', 'token': localStorage.getItem('token') }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch team data.');
      setTeamData(data);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('token')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);


  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4 className="alert-heading"><i className="fas fa-exclamation-triangle me-2"></i>An Error Occurred</h4>
          <p>{error}</p>
          <button onClick={() => navigate('/teams')} className="btn btn-primary mt-2">
            <i className="fas fa-arrow-left me-2"></i>Back to Teams
          </button>
        </div>
      </div>
    );
  }

  if (!teamData || !teamData.team) {
    return <div className="container mt-5"><div className="alert alert-warning text-center">Team could not be found.</div></div>;
  }

  return (
    <>
      <style>{`
        body { background-color: #f4f7f6; }
        .team-stats-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4rem 1rem;
          text-align: center;
        }
        .team-logo { width: 150px; height: 150px; object-fit: contain; margin-bottom: 1.5rem; }
        .team-name-header { font-size: 3rem; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .team-motto { font-size: 1.25rem; opacity: 0.8; font-style: italic; }
        .section-title { font-weight: 600; color: #2c3e50; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e9ecef; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
        .stat-card { background: #fff; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .stat-icon { font-size: 1.5rem; color: #764ba2; margin-right: 1rem; }
        .stat-title { color: #6c757d; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 0.1rem; }
        .stat-value { font-size: 1.2rem; font-weight: 600; color: #2c3e50; margin: 0; }
        .roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1.5rem; }
        .player-card { background: #fff; border-radius: 12px; text-align: center; padding: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer; }
        .player-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .player-image { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 0.75rem auto; border: 3px solid #f0f0f0; }
        .player-name { font-weight: 600; color: #2c3e50; margin-bottom: 0.1rem; font-size: 1rem; }
        .player-role { font-size: 0.8rem; color: #6c757d; }
      `}</style>
      
      <header className="team-stats-header">
        <img
          src={teamData.team.logo || PLACEHOLDER_LOGO}
          alt={`${teamData.team.name} Logo`}
          className="team-logo"
          onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_LOGO; }}
        />
        <h1 className="team-name-header">{teamData.team.name}</h1>
        {teamData.team.moto && <p className="team-motto">"{teamData.team.moto}"</p>}
      </header>
      
      <main className="container py-5">
        <section id="team-details" className="mb-5">
          <h2 className="section-title">Team Details</h2>
          <div className="stats-grid">
            <StatCard title="Captain" value={teamData.team.captain} icon="fa-user-tie" />
            <StatCard title="Coach" value={teamData.team.coach} icon="fa-chalkboard-teacher" />
            <StatCard title="State" value={teamData.team.state} icon="fa-map-marker-alt" />
            <StatCard title="Trophies Won" value={teamData.team.win || '0'} icon="fa-trophy" />
          </div>
        </section>

        <section id="team-roster">
          <h2 className="section-title">Team Roster</h2>
          {teamData.players && teamData.players.length > 0 ? (
            <div className="roster-grid">
              {teamData.players.map(player => (
                <PlayerCard key={player._id} player={player} />
              ))}
            </div>
          ) : (
            <div className="alert alert-light text-center">This team currently has no players.</div>
          )}
        </section>
      </main>
    </>
  );
};

export default TeamStats;