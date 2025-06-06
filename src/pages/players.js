import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal } from "bootstrap";

// A lightweight helper to centralize API calls
const apiService = {
  async request(endpoint, method = "GET", body = null) {
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        token: localStorage.getItem("token"),
      },
    };
    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`http://127.0.0.1:8000${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || `Request failed with status ${response.status}`
      );
    }
    return data;
  },
};

const INITIAL_PLAYER_STATE = {
  _id: null,
  name: "",
  password: "",
  email: "",
  phone: "",
  nationality: "",
  specialization: "",
  image: "",
  playingFor: "",
  stats: { runs: "", debut: "", dob: "", matches: "" },
};

// ======================================================================
// === 🚨 FIX #1: A CRASH-PROOF, OFFLINE-FIRST PLACEHOLDER IMAGE 🚨 ===
// ======================================================================
// This is a self-contained SVG, so it requires no network request and will never fail to load.
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBjMGUwIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5MDkwOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";

const Players = () => {
  // State Management
  const [players, setPlayers] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [currentPlayer, setCurrentPlayer] = useState(INITIAL_PLAYER_STATE);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);

  // Helper to show dismissible alerts
  const showAlert = (message, type, duration = 4000) => {
    setAlert({ show: true, message, type });
    setTimeout(
      () => setAlert({ show: false, message: "", type: "" }),
      duration
    );
  };

  // Fetch all page data once on load
  const fetchPageData = useCallback(async () => {
    setLoading(true);
    try {
      const isAdminCheck =
        new URLSearchParams(location.search).get("admin") === "true";

      const [teams, playersData, roles] = await Promise.all([
        apiService.request("/teams"),
        apiService.request("/players"),
        isAdminCheck
          ? apiService.request("/users/roles")
          : Promise.resolve({ isAdmin: false }),
      ]);

      setTeamList(teams);
      setPlayers(playersData);
      setIsAdmin(roles.isAdmin);
    } catch (error) {
      showAlert(error.message, "danger");
      if (error.message.includes("token")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [location.search, navigate]);

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // Effect to manage the Bootstrap modal instance
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;

    const bsModal = Modal.getOrCreateInstance(modalElement);
    isModalOpen ? bsModal.show() : bsModal.hide();

    const handleHide = () => setIsModalOpen(false);
    modalElement.addEventListener("hidden.bs.modal", handleHide);
    return () =>
      modalElement.removeEventListener("hidden.bs.modal", handleHide);
  }, [isModalOpen]);

  // --- Event Handlers ---
  const handleShowModal = (player = null) => {
    setCurrentPlayer(
      player
        ? {
            ...INITIAL_PLAYER_STATE,
            ...player,
            password: "",
            stats: player.stats || INITIAL_PLAYER_STATE.stats,
          }
        : INITIAL_PLAYER_STATE
    );
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("stats.")) {
      const statKey = name.split(".")[1];
      setCurrentPlayer((prev) => ({
        ...prev,
        stats: { ...prev.stats, [statKey]: value },
      }));
    } else {
      setCurrentPlayer((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSavePlayer = async (e) => {
    e.preventDefault();
    const isUpdating = !!currentPlayer._id;
    const endpoint = isUpdating
      ? `/adminplayers/${currentPlayer._id}`
      : "/adminplayers";
    const method = isUpdating ? "PATCH" : "POST";

    const payload = { ...currentPlayer };
    if (isUpdating && !payload.password) delete payload.password;
    delete payload._id;

    try {
      await apiService.request(endpoint, method, payload);
      showAlert(
        `Player ${isUpdating ? "updated" : "added"} successfully!`,
        "success"
      );
      setIsModalOpen(false);
      fetchPageData();
    } catch (error) {
      showAlert(error.message, "danger");
    }
  };

  const handleDeletePlayer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete player ${name}?`))
      return;
    try {
      await apiService.request(`/adminplayers/${id}`, "DELETE");
      showAlert("Player deleted successfully!", "success");
      setPlayers((prevPlayers) => prevPlayers.filter((p) => p._id !== id));
    } catch (error) {
      showAlert(error.message, "danger");
    }
  };

  const getTeamName = useCallback(
    (teamId) => {
      return teamList.find((t) => t._id === teamId)?.name || "Unknown";
    },
    [teamList]
  );

  return (
    <>
      <style>{`body{background-color:#f8f9fa}.player-card{transition:all .3s ease;border:none;box-shadow:0 4px 6px #0000001a;border-radius:15px;overflow:hidden}.player-card:hover{transform:translateY(-5px);box-shadow:0 8px 25px #00000026}.player-image{height:250px;width:100%;object-fit:cover;object-position:center top;background:linear-gradient(135deg,#667eea,#764ba2)}.card-body{padding:1.5rem;background:linear-gradient(135deg,#f5f7fa,#c3cfe2)}.player-name{color:#2c3e50;font-weight:700;font-size:1.25rem;margin-bottom:.75rem}.player-info{color:#5a6c7d;font-size:.9rem;margin-bottom:.5rem}.stats-section{background:#ffffffcc;border-radius:10px;padding:.75rem;margin:1rem 0;border-left:4px solid #3498db}.page-header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:2rem 0;border-radius:15px;margin-bottom:2rem;text-align:center}.page-title{font-size:2.5rem;font-weight:700;text-shadow:2px 2px 4px #0000004d}.modal-content{border-radius:15px;border:none}.modal-header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:15px 15px 0 0;border-bottom:none}.form-label{font-weight:600}.action-buttons{display:flex;gap:.5rem}.no-players{text-align:center;padding:3rem;color:#6c757d}.alert-position{position:fixed;top:20px;right:20px;z-index:9999;min-width:300px}`}</style>

      <div className="container-fluid py-4">
        {alert.show && (
          <div
            className={`alert alert-${alert.type} alert-dismissible fade show alert-position`}
            role="alert"
          >
            {alert.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setAlert({ show: false })}
            ></button>
          </div>
        )}

        <header className="page-header">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-8 text-md-start">
                <h1 className="page-title">
                  <i className="fas fa-users me-3"></i>Players Management
                </h1>
              </div>
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn btn-secondary me-2"
                >
                  <i className="fas fa-arrow-left"></i> Dashboard
                </button>
                {isAdmin && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleShowModal()}
                  >
                    <i className="fas fa-plus"></i> Add Player
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : players.length > 0 ? (
            <div className="row g-4">
              {players.map((p) => (
                <div key={p._id} className="col-lg-4 col-md-6">
                  <div className="card player-card h-100">
                    {/* ========================================================== */}
                    {/* === 🚨 FIX #2: THE CRASH-PROOF IMAGE TAG ITSELF 🚨 === */}
                    {/* ========================================================== */}
                    <img
                      src={p.image || PLACEHOLDER_IMAGE}
                      className="player-image"
                      alt={p.name}
                      onError={(e) => {
                        e.target.onerror = null; // This prevents the infinite loop
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="player-name">{p.name}</h5>
                      <p className="player-info">
                        <i className="fas fa-shield-alt text-primary me-2"></i>
                        <strong>Team:</strong>{" "}
                        {getTeamName(p.playingFor) || p.playingForName}
                      </p>
                      <p className="player-info">
                        <i className="fas fa-flag text-success me-2"></i>
                        <strong>Nationality:</strong> {p.nationality}
                      </p>
                      <p className="player-info">
                        <i className="fas fa-user-tag text-info me-2"></i>
                        <strong>Role:</strong> {p.specialization}
                      </p>
                      <div className="mt-auto pt-3">
                        <button
                          className="btn btn-primary w-100 mb-2"
                          onClick={() => {
                            // If we are in admin view, add a query param to the URL.
                            const destination = isAdmin
                              ? `/playerstats/${p._id}?from=admin`
                              : `/playerstats/${p._id}`;
                            navigate(destination);
                          }}
                        >View Stats</button>
                        {isAdmin && (
                          <div className="action-buttons">
                            <button
                              className="btn btn-warning btn-sm flex-grow-1"
                              onClick={() => handleShowModal(p)}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm flex-grow-1"
                              onClick={() => handleDeletePlayer(p._id, p.name)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-players">
              <i className="fas fa-users fa-3x mb-3 text-muted"></i>
              <h4>No Players Found</h4>
            </div>
          )}
        </main>
      </div>

      <div
        className="modal fade"
        ref={modalRef}
        tabIndex="-1"
        aria-labelledby="playerModalLabel"
        aria-hidden="true"
      >
        {/* The modal JSX is unchanged and correct */}
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="playerModalLabel">
                {currentPlayer._id ? "Edit Player" : "Add New Player"}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setIsModalOpen(false)}
              ></button>
            </div>
            <form id="playerForm" onSubmit={handleSavePlayer}>
              <div className="modal-body">
                <h6 className="section-header">Personal Information</h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={currentPlayer.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={currentPlayer.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={currentPlayer.password}
                      onChange={handleInputChange}
                      placeholder={
                        currentPlayer._id ? "Leave blank to keep current" : ""
                      }
                      required={!currentPlayer._id}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={currentPlayer.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nationality *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nationality"
                      value={currentPlayer.nationality}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="text"
                      className="form-control"
                      name="stats.dob"
                      value={currentPlayer.stats.dob}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <h6 className="section-header">Professional Information</h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Playing Role *</label>
                    <select
                      className="form-select"
                      name="specialization"
                      value={currentPlayer.specialization}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">--Select--</option>
                      <option>Batsman</option>
                      <option>Bowler</option>
                      <option>All-rounder</option>
                      <option>Wicketkeeper</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Team *</label>
                    <select
                      className="form-select"
                      name="playingFor"
                      value={currentPlayer.playingFor}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">--Select Team--</option>
                      {teamList.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Profile Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    name="image"
                    value={currentPlayer.image}
                    onChange={handleInputChange}
                  />
                </div>
                <h6 className="section-header">Career Statistics</h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Total Runs</label>
                    <input
                      type="number"
                      className="form-control"
                      name="stats.runs"
                      value={currentPlayer.stats.runs}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Total Matches</label>
                    <input
                      type="number"
                      className="form-control"
                      name="stats.matches"
                      value={currentPlayer.stats.matches}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Player
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Players;
