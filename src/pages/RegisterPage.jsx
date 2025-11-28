// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // call backend register
      await API.post("/auth/register", form);

      // auto-login after register
      await login(form.email, form.password);

      // redirect based on role
      if (form.role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
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
        width: 480,
        background: "#fff",
        padding: 28,
        borderRadius: 12,
        boxShadow: "0 12px 30px rgba(20,30,80,0.06)"
      }}>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 22, textAlign: "center" }}>
          Create an account
        </h1>

        <p style={{ marginTop: 0, marginBottom: 18, color: "#475569", textAlign: "center" }}>
          Sign up as a student or teacher
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 13, color: "#334155" }}>Full name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Your full name"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e6eef8", fontSize: 14 }}
          />

          <label style={{ fontSize: 13, color: "#334155" }}>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e6eef8", fontSize: 14 }}
          />

          <label style={{ fontSize: 13, color: "#334155" }}>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="At least 6 characters"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e6eef8", fontSize: 14 }}
          />

          <label style={{ fontSize: 13, color: "#334155" }}>Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #e6eef8", fontSize: 14 }}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: 11,
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <div style={{ textAlign: "center", marginTop: 10, color: "#64748b", fontSize: 13 }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
