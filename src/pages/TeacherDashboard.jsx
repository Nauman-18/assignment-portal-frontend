// src/pages/TeacherDashboard.jsx
import React, { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../context/AuthContext";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, published: 0, completed: 0 });
  const [filter, setFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", status: "published" });
  const [editingId, setEditingId] = useState(null);

  // Submissions modal state
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [currentAssignmentForSubs, setCurrentAssignmentForSubs] = useState(null);
  const [submissionsForAssignment, setSubmissionsForAssignment] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // load assignments (teacher endpoint if available; fallback to general)
  async function loadAssignments() {
    try {
      setLoading(true);
      const teacherId = user?._id || user?.id || localStorage.getItem("userId") || null;
      const q = filter === "all" ? "" : `?status=${filter}`;

      if (teacherId) {
        // call teacher-specific endpoint
        try {
          const res = await API.get(`/assignments/teacher/${teacherId}${q}`);
          const list = Array.isArray(res.data) ? res.data : res.data.assignments || res.data || [];
          applyList(list);
          return;
        } catch (err) {
          // fallback to general endpoint below if teacher endpoint fails
          console.warn("teacher endpoint failed, falling back to /assignments", err?.response?.data || err.message);
        }
      }

      const res2 = await API.get(`/assignments${q}`);
      const list2 = Array.isArray(res2.data) ? res2.data : res2.data.assignments || [];
      applyList(list2);
    } catch (err) {
      console.error("Load assignments error:", err, err?.response?.data);
      applyList([]);
    } finally {
      setLoading(false);
    }
  }

  function applyList(list) {
    setAssignments(list);
    const total = list.length;
    const draft = list.filter((a) => a.status === "draft").length;
    const published = list.filter((a) => a.status === "published").length;
    const completed = list.filter((a) => a.status === "completed").length;
    setStats({ total, draft, published, completed });
  }

  // Create or Update assignment
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title || form.title.trim() === "") return alert("Title required");
    try {
      setLoading(true);
      const createdBy = user?._id || user?.id || undefined;
      const payload = { ...form };
      if (createdBy) payload.createdBy = createdBy;

      if (editingId) {
        // update flow
        await API.put(`/assignments/${editingId}`, payload);
        setEditingId(null);
      } else {
        // create flow
        await API.post("/assignments", payload);
      }

      await loadAssignments();
      setForm({ title: "", description: "", dueDate: "", status: "published" });
      setShowCreate(false);
    } catch (err) {
      console.error("Create/Update error:", err, err?.response?.data);
      const message = err?.response?.data?.message || err.message || "Save failed";
      alert("Save failed: " + message);
    } finally {
      setLoading(false);
    }
  }

  // delete assignment
  async function deleteAssignment(id) {
    if (!window.confirm("Are you sure you want to delete this assignment? This will remove related submissions as well.")) return;
    try {
      setLoading(true);
      await API.delete(`/assignments/${id}`);
      alert("Assignment deleted");
      await loadAssignments();
    } catch (err) {
      console.error("Delete error:", err, err?.response?.data);
      alert(err?.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  // open edit modal
  function openEdit(a) {
    setEditingId(a._id || a.id);
    setForm({
      title: a.title || "",
      description: a.description || "",
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : "",
      status: a.status || "draft",
    });
    setShowCreate(true);
  }

  // toggle publish/draft
  async function toggleStatus(a) {
    const newStatus = a.status === "published" ? "draft" : "published";
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    try {
      setLoading(true);
      await API.put(`/assignments/${a._id || a.id}`, { status: newStatus });
      await loadAssignments();
    } catch (err) {
      console.error("Toggle status error:", err, err?.response?.data);
      alert(err?.response?.data?.message || "Could not change status");
    } finally {
      setLoading(false);
    }
  }

  // Fetch submissions for an assignment (teacher)
  async function fetchSubmissions(assignmentId) {
    try {
      setLoadingSubmissions(true);
      const { data } = await API.get(`/submissions/assignment/${assignmentId}`);
      const list = Array.isArray(data) ? data : data.submissions || [];
      setSubmissionsForAssignment(list);
    } catch (err) {
      console.error("Fetch submissions error:", err, err?.response?.data);
      setSubmissionsForAssignment([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  function openSubmissionsModal(assignment) {
    setCurrentAssignmentForSubs(assignment);
    setSubmissionsForAssignment([]);
    setSubmissionsModalOpen(true);
    fetchSubmissions(assignment._id || assignment.id);
  }

  function closeSubmissionsModal() {
    setSubmissionsModalOpen(false);
    setCurrentAssignmentForSubs(null);
    setSubmissionsForAssignment([]);
  }

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Teacher Dashboard</h1>
          <div className="muted">Welcome back, {user?.name || "teacher"}</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            className="btn-ghost"
            onClick={() => {
              if (logout) logout();
              window.location = "/login";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        <StatCard label="Total" value={stats.total} icon="📄" />
        <StatCard label="Draft" value={stats.draft} icon="🗂" />
        <StatCard label="Published" value={stats.published} icon="📢" />
        <StatCard label="Completed" value={stats.completed} icon="✅" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
            <path d="M3 5h18M7 12h10M10 19h4" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingId(null);
            setForm({ title: "", description: "", dueDate: "", status: "published" });
            setShowCreate(true);
          }}
          style={{ padding: "8px 14px" }}
        >
          + Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-card" style={{ padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>📄</div>
          <h4>No assignments</h4>
          <p className="muted">Create your first assignment to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {assignments.map((a) => (
            <div
              key={a._id || a.id}
              className="empty-card"
              style={{
                padding: 14,
                borderRadius: 10,
                background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ maxWidth: "65%" }}>
                <strong style={{ fontSize: 16 }}>{a.title}</strong>
                <div className="muted" style={{ marginTop: 6 }}>
                  {a.description}
                </div>
                <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
                  {a.submittedCount || (a.submittedBy ? a.submittedBy.length : 0)} submitted
                  {a.dueDate ? ` • Due ${new Date(a.dueDate).toLocaleDateString()}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ textAlign: "right", marginRight: 6 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</div>
                  <div style={{ marginTop: 6, fontWeight: 700 }}>{a.status}</div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => openEdit(a)}
                    title="Edit assignment"
                    style={{ padding: "6px 10px" }}
                  >
                    Edit
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={() => toggleStatus(a)}
                    title={a.status === "published" ? "Move to draft" : "Publish"}
                    style={{ padding: "6px 10px" }}
                  >
                    {a.status === "published" ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => deleteAssignment(a._id || a.id)}
                    title="Delete assignment"
                    style={{ padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6 }}
                  >
                    Delete
                  </button>

                  <button className="btn-ghost" onClick={() => openSubmissionsModal(a)} style={{ padding: "6px 10px" }}>
                    View Submissions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,23,0.45)", zIndex: 60 }}>
          <form onSubmit={handleCreate} style={{ width: 520, background: "#fff", padding: 20, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Assignment" : "Create Assignment"}</h3>

            <label style={{ display: "block", marginTop: 8 }}>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: "100%", padding: 10 }} required />

            <label style={{ display: "block", marginTop: 8 }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: 10, minHeight: 80 }} />

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Due date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={{ width: "100%", padding: 8 }} />
              </div>

              <div style={{ width: 160 }}>
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ width: "100%", padding: 8 }}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button type="button" className="btn-ghost" onClick={() => { setShowCreate(false); setEditingId(null); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submissions Modal (Teacher) */}
      {submissionsModalOpen && currentAssignmentForSubs && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,6,23,0.45)", zIndex: 80 }}>
          <div style={{ width: 760, maxHeight: "80vh", overflowY: "auto", background: "#fff", padding: 18, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Submissions — {currentAssignmentForSubs.title}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    closeSubmissionsModal();
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {loadingSubmissions ? (
                <div className="muted">Loading submissions…</div>
              ) : submissionsForAssignment.length === 0 ? (
                <div className="muted">No submissions yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {submissionsForAssignment.map((s) => (
                    <div key={s._id || s.id} style={{ padding: 12, borderRadius: 8, background: "#f7fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{s.student ? (s.student.name || s.student.email) : s.studentName || "Student"}</div>
                        {s.content ? <div className="muted" style={{ marginTop: 6 }}>{s.content}</div> : null}
                        {s.fileUrl ? (
                          <div style={{ marginTop: 8 }}>
                            <a href={s.fileUrl} target="_blank" rel="noreferrer">
                              Download file
                            </a>
                          </div>
                        ) : null}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small stat card
function StatCard({ label, value, icon }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
      <div>
        <div style={{ opacity: 0.6, fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
      </div>
      <div style={{ fontSize: 22 }}>{icon}</div>
    </div>
  );
}
