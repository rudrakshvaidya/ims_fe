// src/pages/playerstats.js

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// A self-contained, crash-proof placeholder image. This will never cause a network error.
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlZmVmIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNjYmM3Y2UiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";

// A reusable sub-component for displaying individual stat cards.
const StatCard = ({ title, value, icon }) => (
  <div className="stat-card h-100">
    <div className="stat-icon">
      <i className={`fas ${icon} fa-2x`}></i>
    </div>
    <div className="stat-content">
      <h6 className="stat-title">{title}</h6>
      <p className="stat-value">{value || "N/A"}</p>
    </div>
  </div>
);

const PlayerStats = () => {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { id } = useParams(); // Gets player ID from the URL, e.g., /playerstats/some-id
  const navigate = useNavigate();

  // This effect runs once when the component mounts to fetch data.
  useEffect(() => {
    if (!id) {
      setError("No player ID was provided in the URL.");
      setLoading(false);
      return;
    }

    const fetchPlayerData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/players/${id}/stats`,
          {
            headers: {
              "Content-Type": "application/json",
              token: localStorage.getItem("token"),
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch player data.");
        }
        setPlayer(data);
      } catch (err) {
        setError(err.message);
        // If the error is token-related, redirect to login for a better user experience.
        if (err.message.includes("token")) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [id, navigate]); // The effect re-runs if the 'id' in the URL changes.

  // --- Conditional Rendering for Loading and Error States ---

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4 className="alert-heading">
            <i className="fas fa-exclamation-triangle me-2"></i>An Error
            Occurred
          </h4>
          <p>{error}</p>
          
        </div>
      </div>
    );
  }

  if (!player) {
    // This case handles when loading is done, but there's still no player data (e.g., API returned null).
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          Player could not be found.
        </div>
      </div>
    );
  }

  // --- Main Component JSX ---

  return (
    <>
      <style>{`
        body { background-color: #f4f7f6; }
        .stats-header {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: white;
          padding: 4rem 1rem 8rem 1rem; /* Extra bottom padding to make space for the card */
          border-radius: 0 0 40px 40px;
          position: relative;
        }
        .stats-header h1 { font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .stats-header .team-name { opacity: 0.8; font-style: italic; }
        
        .profile-card {
          text-align: center;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          padding: 1.5rem;
          margin-top: -80px; /* This pulls the card up into the header space */
          position: relative;
        }
        .profile-image {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          border: 6px solid white;
          box-shadow: 0 5px 20px rgba(0,0,0,0.2);
          margin-top: -75px; /* Pull the image itself up higher */
          margin-bottom: 1rem;
          background-color: #e9ecef;
        }
        .profile-card .player-role {
          background-color: #6c757d;
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
          margin-top: 0.5rem;
        }
        .detail-item { margin-bottom: 0.75rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
        .stat-card {
          background: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 15px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .stat-icon { color: #667eea; margin-right: 1.25rem; }
        .stat-title { color: #6c757d; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 0.25rem; }
        .stat-value { font-size: 1.6rem; font-weight: 700; color: #34495e; margin: 0; }
        
        .back-button { position: absolute; top: 1.5rem; left: 1.5rem; z-index: 10; }
      `}</style>

      <header className="stats-header">
        <div className="text-center">
          <h1>{player.name}</h1>
          <h5 className="team-name">{player.playingForName || "Unassigned"}</h5>
        </div>
      </header>

      <main className="container py-4">
        <div className="row g-lg-5 g-4">
          <div className="col-lg-4">
            <div className="profile-card">
              <img
                src={player.image || PLACEHOLDER_IMAGE}
                alt={player.name}
                className="profile-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
              <h4 className="mt-2 mb-1">{player.name}</h4>
              <p className="text-muted mb-2">{player.nationality}</p>
              <span className="player-role">{player.specialization}</span>
              <hr className="my-4" />
              <div className="text-start">
                <p className="detail-item">
                  <strong>
                    <i className="fas fa-envelope text-primary me-2 fa-fw"></i>
                    Email:
                  </strong>{" "}
                  {player.email || "N/A"}
                </p>
                <p className="detail-item mb-0">
                  <strong>
                    <i className="fas fa-phone text-primary me-2 fa-fw"></i>
                    Phone:
                  </strong>{" "}
                  {player.phone || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <h2 className="mb-4 mt-2 mt-lg-0">Career Statistics</h2>
            <div className="stats-grid">
              <StatCard
                title="Matches Played"
                value={player.stats?.matches}
                icon="fa-trophy"
              />
              <StatCard
                title="Total Runs"
                value={player.stats?.runs}
                icon="fa-person-running"
              />
              <StatCard
                title="Date of Birth"
                value={player.stats?.dob}
                icon="fa-cake-candles"
              />
              <StatCard
                title="Professional Debut"
                value={player.stats?.debut}
                icon="fa-calendar-check"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PlayerStats;
