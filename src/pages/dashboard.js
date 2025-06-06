import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const adminCardRef = useRef(null);
 // const ownerLinkRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [isOwner, setIsOwner] = useState(false);
  const [ownerTeamId, setOwnerTeamId] = useState("");
  const [rolesLoaded, setRolesLoaded] = useState(false); // Control render timing
  const isUserAdmin = useRef(false);

  useEffect(() => {
    async function getRoles() {
      try {
        const response = await fetch("http://127.0.0.1:8000/users/roles", {
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
        });

        const data = await response.json();

        if (response.status === 200) {
          isUserAdmin.current = data.isAdmin;

          if (data.teamOwner) {
            setIsOwner(true);
            setOwnerTeamId(data.isOwnerTeamId);
          }

          // Admin card always hidden
          if (adminCardRef.current) {
            adminCardRef.current.style.display = "none";
          }

        } else {
          setErrorMessage("Bad Req(400): " + JSON.stringify(data));
        }
      } catch (error) {
        setErrorMessage("Error: " + error.message);
      } finally {
        setRolesLoaded(true); // Only render once roles are evaluated
      }
    }

    getRoles();
  }, []);

  const handlePlayerClick = () => {
    if (isUserAdmin.current) {
      navigate("/players?admin=true");
    } else {
      navigate("/players");
    }
  };

  const handleTeamClick = () => {
    if (isUserAdmin.current) {
      navigate("/teams?admin=true");
    } else {
      navigate("/teams");
    }
  };

  if (!rolesLoaded) return null; // Or return a loading spinner

  return (
    <div className="container mt-4">
      {errorMessage && <p className="text-danger">{errorMessage}</p>}

      <div
        className="p-3 text-center bg-body-tertiary"
        onClick={handlePlayerClick}
        style={{ cursor: "pointer" }}
      >
        <div className="container py-3">
          <h1 className="text-body-emphasis h3">Players</h1>
          <p className="col-lg-6 mx-auto lead small">view and search Players</p>
        </div>
      </div>

      <div
        className="p-3 text-center bg-body-tertiary"
        onClick={handleTeamClick}
        style={{ cursor: "pointer" }}
      >
        <div className="container py-3">
          <h1 className="text-body-emphasis h3">Teams</h1>
          <p className="col-lg-6 mx-auto lead small">view and search teams</p>
        </div>
      </div>

      {/* Render owner card only if user is team owner */}
      {isOwner && (
        <div
          onClick={() => navigate("/editteam")}
          style={{ cursor: "pointer" }}
        >
          <div className="p-3 text-center bg-body-tertiary">
            <div className="container py-3">
              <h1 className="text-body-emphasis h3">Edit Team Details</h1>
              <p className="col-lg-6 mx-auto lead small">
                view and edit teams owned by you
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

