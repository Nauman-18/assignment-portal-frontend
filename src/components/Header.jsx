// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        width: "100%",
        background: "#ffffff",
        padding: "10px 0",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between", // <-- pushes left + right apart
          alignItems: "center",
          padding: "0 20px",               // small clean padding
          maxWidth: "100%",                // full width header
        }}
      >
        {/* LEFT: Logo */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "#2563eb",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Assignment Portal
        </Link>

        {/* RIGHT: Login / Sign Up / User */}
        <nav
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          {!user && (
            <>
              <Link
                to="/login"
                style={{
                  textDecoration: "none",
                  color: "#334155",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                Login
              </Link>

              <Link
                to="/register"
                style={{
                  padding: "7px 15px",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Sign Up
              </Link>
            </>
          )}

          {user && (
            <>
              <span style={{ fontWeight: 600, color: "#334155" }}>
                {user.name} ({user.role})
              </span>

              <button
                onClick={handleLogout}
                style={{
                  padding: "7px 15px",
                  background: "#ef4444",
                  borderRadius: 8,
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
