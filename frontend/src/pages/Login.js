import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function parseError(detail) {
  if (!detail) return "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg).join(", ");
  return "Something went wrong";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const login = async () => {
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(parseError(data.detail));
        return;
      }
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch {
      setServerError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="container">
      <h1>Login</h1>

      {serverError && <p className="error-msg">{serverError}</p>}

      <div className="field-wrap">
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className={errors.email ? "input-error" : ""}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className="field-wrap">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className={errors.password ? "input-error" : ""}
        />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <button className="primary-btn" onClick={login} disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </button>

      <p style={{ marginTop: 16, textAlign: "center", fontSize: 14 }}>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;