import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [responseText, setResponseText] = useState("");
  const navigate = useNavigate();

  function login() {
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    fetch("http://127.0.0.1:8000/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then(async (response) => {
        const data = await response.json();

        if (response.status === 200 && data.token) {
          localStorage.setItem("token", data.token);
          navigate("/dashboard"); // ✅ redirect to dashboard
        } else {
          setResponseText(data.error || "Login failed. Try again.");
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
            <h2 className="h3 mb-3 fw-normal text-center">Login</h2>

            <div className="form-floating mb-2">
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="xyz@gmail.com"
                ref={emailRef}
                required
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className="form-floating mb-2">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="password"
                ref={passwordRef}
                required
              />
              <label htmlFor="password">Password</label>
            </div>

            <div className="d-grid">
              <button
                className="btn btn-primary w-100 py-2"
                type="button"
                onClick={login}
              >
                Login
              </button>
            </div>

            <p className="text-center mt-3">
              Don't have an account?{" "}
              <a
                href="signup.html"
                className="link-primary text-decoration-none"
              >
                Sign up
              </a>
            </p>

            {responseText && (
              <p className="text-center text-danger mt-2">{responseText}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
