// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import { useAuth } from "./context/AuthContext";

/**
 * Protected route wrapper
 * - If no user -> redirect to /login
 * - If role provided and doesn't match -> redirect to /login
 */
function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      {/* Header always visible */}
      <Header />

      {/* Application Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/teacher"
          element={
            <Protected role="teacher">
              <TeacherDashboard />
            </Protected>
          }
        />

        <Route
          path="/student"
          element={
            <Protected role="student">
              <StudentDashboard />
            </Protected>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
