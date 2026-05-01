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

function Signup() {
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
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const signup = async () => {
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(parseError(data.detail));
        return;
      }
      navigate("/login");
    } catch {
      setServerError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") signup();
  };

  return (
    <div className="container">
      <h1>Sign up</h1>

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
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className={errors.password ? "input-error" : ""}
        />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      <button className="primary-btn" onClick={signup} disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p style={{ marginTop: 16, textAlign: "center", fontSize: 14 }}>
        Have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Signup;