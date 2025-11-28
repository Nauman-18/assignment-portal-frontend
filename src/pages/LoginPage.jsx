// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const role = await login(email.trim(), password);
      if (role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (err) {
      // friendly error message
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg,#f5f7fb,#eef3ff)"
    }}>
      <div style={{
        width: 420,
        background: "#fff",
        padding: 28,
        borderRadius: 12,
        boxShadow: "0 12px 30px rgba(20,30,80,0.08)"
      }}>
        <h1 style={{ margin: 0, marginBottom: 18, fontSize: 22, textAlign: "center" }}>
          Assignment Portal
        </h1>

        <p style={{ marginTop: 0, marginBottom: 18, color: "#475569", textAlign: "center" }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 13, color: "#334155" }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            placeholder="you@example.com"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e6eef8",
              fontSize: 14
            }}
          />

          <label style={{ fontSize: 13, color: "#334155", marginTop: 6 }}>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            placeholder="••••••••"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e6eef8",
              fontSize: 14
            }}
          />

          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, marginTop: 6 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              marginTop: 8,
              padding: 11,
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15
            }}
          >
            Login
          </button>

          <div style={{ textAlign: "center", marginTop: 10, color: "#64748b", fontSize: 13 }}>
            Don't have an account?{" "}
            <a href="/register" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
