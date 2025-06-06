import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const phoneRef = useRef(null);
  const [responseText, setResponseText] = useState("");
  const navigate = useNavigate();

  function signup() {
    const name = nameRef.current.value;
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    const phone = phoneRef.current.value;

    fetch("http://127.0.0.1:8000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, phone }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (response.status === 200) {
          setResponseText("Signup successful! Redirecting...");
          setTimeout(() => navigate("/login"), 1000);
        } else {
          setResponseText(data.error || "Signup failed.");
        }
      })
      .catch((error) => {
        setResponseText("Network error: " + error.message);
      });
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-body-tertiary">
      <main className="form-signin" style={{ width: "330px" }}>
        <div className="container">
          <div className="card p-4 shadow-sm">
            <h1 className="h3 mb-3 fw-normal text-center">Signup</h1>

            <div className="form-floating mb-2">
              <input
                type="text"
                className="form-control"
                id="name"
                placeholder="Name"
                ref={nameRef}
                required
              />
              <label htmlFor="name">Name</label>
            </div>

            <div className="form-floating mb-2">
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="name@gmail.com"
                ref={emailRef}
                required
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className="form-floating mb-2">
              <input
                type="number"
                className="form-control"
                id="phone"
                placeholder="Phone Number"
                ref={phoneRef}
                required
              />
              <label htmlFor="phone">Phone Number</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="password"
                ref={passwordRef}
                placeholder="Password"
                required
              />
              <label htmlFor="password">Password</label>
            </div>

            <button
              className="btn btn-primary w-100 py-2"
              type="button"
              onClick={signup}
            >
              Sign up
            </button>

            {responseText && (
              <p className="text-center text-danger mt-2">{responseText}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
